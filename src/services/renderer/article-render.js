/*
 * Copyright (c) 2024-2025 IsHexx
 * All rights reserved.
 *
 * This software is proprietary and confidential. No part of this software
 * may be reproduced, distributed, or transmitted in any form or by any means,
 * including photocopying, recording, or other electronic or mechanical methods,
 * without the prior written permission of the author, except in the case of
 * brief quotations embodied in critical reviews and certain other noncommercial
 * uses permitted by copyright law.
 *
 * For permission requests, contact: IsHexx
 */
import { Notice, sanitizeHTMLToDom, apiVersion, TFile, MarkdownRenderer } from 'obsidian';
// 更新import路径
import { applyCSS } from '../../shared/utils';
import { UploadImageToWx } from '../wechat/imagelib';
import { WxSettings } from '../../core/settings';
import AssetsManager from '../../core/assets';
import InlineCSS from '../../shared/inline-css';
// 使用新的后端API
import { initApiClients, getWechatClient } from '../api';
import { MarkedParser } from './markdown/parser';
import { LocalImageManager } from './markdown/local-file';
import { CardDataManager } from './markdown/code';
import { debounce } from '../../shared/utils';
import { PrepareImageLib, IsImageLibReady, WebpToJPG } from '../wechat/imagelib';
import { toPng } from 'html-to-image';
const FRONT_MATTER_REGEX = /^(---)$.+?^(---)$.+?/ims;
export class ArticleRender {
    constructor(app, itemView, styleEl, articleDiv) {
        this.cachedElements = new Map();
        this.app = app;
        this.itemView = itemView;
        this.styleEl = styleEl;
        this.articleDiv = articleDiv;
        this.settings = WxSettings.getInstance();
        this.assetsManager = AssetsManager.getInstance();
        this.articleHTML = '';
        this.title = '';
        this._currentTheme = 'default';
        this._currentHighlight = 'default';
        this.markedParser = new MarkedParser(app, this);
        this.debouncedRenderMarkdown = debounce(this.renderMarkdown.bind(this), 1000);
        // 初始化微信API客户端
        try {
            initApiClients();
            this.wechatClient = getWechatClient();
        }
        catch (error) {
            console.warn('微信API客户端初始化失败，将在首次使用时初始化:', error);
        }
    }
    set currentTheme(value) {
        this._currentTheme = value;
    }
    get currentTheme() {
        const { theme } = this.getMetadata();
        if (theme) {
            return theme;
        }
        return this._currentTheme;
    }
    set currentHighlight(value) {
        this._currentHighlight = value;
    }
    get currentHighlight() {
        const { highlight } = this.getMetadata();
        if (highlight) {
            return highlight;
        }
        return this._currentHighlight;
    }
    isOldTheme() {
        const theme = this.assetsManager.getTheme(this.currentTheme);
        if (theme) {
            return theme.css.indexOf('.wdwxedit') < 0;
        }
        return false;
    }
    setArticle(article) {
        this.articleDiv.empty();
        let className = 'wdwxedit';
        // 兼容旧版本样式
        if (this.isOldTheme()) {
            className = this.currentTheme;
        }
        const html = `<section class="${className}" id="article-section">${article}</section>`;
        const doc = sanitizeHTMLToDom(html);
        if (doc.firstChild) {
            this.articleDiv.appendChild(doc.firstChild);
        }
    }
    setStyle(css) {
        this.styleEl.empty();
        this.styleEl.appendChild(document.createTextNode(css));
    }
    reloadStyle() {
        this.setStyle(this.getCSS());
    }
    getArticleSection() {
        return this.articleDiv.querySelector('#article-section');
    }
    // Claude Code Update: 保留innerHTML读取操作（用于最终输出序列化）
    getArticleContent() {
        const content = this.articleDiv.innerHTML;
        let html = applyCSS(content, this.getCSS());
        // 处理话题多余内容
        html = html.replace(/rel="noopener nofollow"/g, '');
        html = html.replace(/target="_blank"/g, '');
        html = html.replace(/data-leaf=""/g, 'leaf=""');
        return CardDataManager.getInstance().restoreCard(html);
    }
    getArticleText() {
        return this.articleDiv.innerText.trimStart();
    }
    errorContent(error) {
        return '<h1>渲染失败!</h1><br/>'
            + '如需帮助请前往&nbsp;&nbsp;<a href="https://github.com/IsHexx/WDWXEdit/issues">https://github.com/IsHexx/WDWXEdit/issues</a>&nbsp;&nbsp;反馈<br/><br/>'
            + '如果方便，请提供引发错误的完整Markdown内容。<br/><br/>'
            + '<br/>Obsidian版本：' + apiVersion
            + '<br/>错误信息：<br/>'
            + `${error}`;
    }
    async renderMarkdown(af = null) {
        try {
            let md = '';
            if (af && af.extension.toLocaleLowerCase() === 'md') {
                md = await this.app.vault.adapter.read(af.path);
                this.title = af.basename;
            }
            else {
                md = '没有可渲染的笔记或文件不支持渲染';
            }
            if (md.startsWith('---')) {
                md = md.replace(FRONT_MATTER_REGEX, '');
            }
            this.articleHTML = await this.markedParser.parse(md);
            this.setStyle(this.getCSS());
            this.setArticle(this.articleHTML);
            await this.processCachedElements();
        }
        catch (e) {
            console.error(e);
            this.setArticle(this.errorContent(e));
        }
    }
    // 添加样式编辑器CSS支持
    getCSS() {
        try {
            const theme = this.assetsManager.getTheme(this.currentTheme);
            const highlight = this.assetsManager.getHighlight(this.currentHighlight);
            const customCSS = this.settings.customCSSNote.length > 0 || this.settings.useCustomCss ? this.assetsManager.customCSS : '';
            const baseCSS = this.settings.baseCSS ? `.wdwxedit {${this.settings.baseCSS}}` : '';
            // 添加样式编辑器CSS（字体、字号、主题色）
            const styleEditorCSS = this.buildStyleEditorCSS();
            return `${InlineCSS}\n\n${highlight.css}\n\n${theme.css}\n\n${baseCSS}\n\n${customCSS}\n\n${this.settings.customCSS}\n\n${styleEditorCSS}`;
        }
        catch (error) {
            console.error(error);
            new Notice(`获取样式失败${this.currentTheme}|${this.currentHighlight}，请检查主题是否正确安装。`);
        }
        return '';
    }
    updateStyle(styleName) {
        this.currentTheme = styleName;
        this.setStyle(this.getCSS());
    }
    updateHighLight(styleName) {
        this.currentHighlight = styleName;
        this.setStyle(this.getCSS());
    }
    // 构建样式编辑器CSS（仅用于预览显示）
    buildStyleEditorCSS() {
        const cssRules = [];
        // 字体设置
        if (this.settings.fontFamily) {
            const fontFamilyValue = this.mapFontFamily(this.settings.fontFamily);
            cssRules.push(`
        section#article-section.wdwxedit,
        section#article-section.wdwxedit *,
        .wdwxedit, 
        .wdwxedit *, 
        .wdwxedit p, 
        .wdwxedit h1, 
        .wdwxedit h2, 
        .wdwxedit h3, 
        .wdwxedit h4, 
        .wdwxedit h5, 
        .wdwxedit h6,
        .wdwxedit div,
        .wdwxedit span,
        .wdwxedit li,
        .wdwxedit td,
        .wdwxedit th { 
          font-family: ${fontFamilyValue} !important; 
        }
      `);
            console.log('🎨 应用字体设置:', this.settings.fontFamily, '->', fontFamilyValue);
        }
        // 字号设置  
        if (this.settings.fontSize) {
            const fontSizeValue = this.mapFontSize(this.settings.fontSize);
            cssRules.push(`
        section#article-section.wdwxedit,
        .wdwxedit { 
          font-size: ${fontSizeValue} !important; 
        }
        section#article-section.wdwxedit p,
        section#article-section.wdwxedit div,
        section#article-section.wdwxedit span,
        section#article-section.wdwxedit li,
        .wdwxedit p, 
        .wdwxedit div, 
        .wdwxedit span,
        .wdwxedit li { 
          font-size: inherit !important; 
        }
      `);
            console.log('🎨 应用字号设置:', this.settings.fontSize, '->', fontSizeValue);
        }
        // 主题色设置
        if (this.settings.primaryColor) {
            cssRules.push(`
        section#article-section.wdwxedit h1,
        div.wdwxedit h1,
        .wdwxedit h1 { 
          color: ${this.settings.primaryColor} !important; 
        }
        section#article-section.wdwxedit h2,
        div.wdwxedit h2,
        .wdwxedit h2 { 
          color: ${this.settings.primaryColor} !important; 
        }
        section#article-section.wdwxedit h3,
        div.wdwxedit h3,
        .wdwxedit h3 { 
          color: ${this.settings.primaryColor} !important; 
        }
        section#article-section.wdwxedit h4,
        div.wdwxedit h4,
        .wdwxedit h4 { 
          color: ${this.settings.primaryColor} !important; 
        }
        section#article-section.wdwxedit h5,
        div.wdwxedit h5,
        .wdwxedit h5 { 
          color: ${this.settings.primaryColor} !important; 
        }
        section#article-section.wdwxedit h6,
        div.wdwxedit h6,
        .wdwxedit h6 { 
          color: ${this.settings.primaryColor} !important; 
        }
      `);
            console.log('🎨 应用主题色设置:', this.settings.primaryColor);
        }
        return cssRules.join('\n');
    }
    // 字体映射函数
    mapFontFamily(fontFamily) {
        const fontMap = {
            '等线': '"DengXian", "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", "Helvetica Neue", Arial, sans-serif',
            '无衬线': '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", Arial, sans-serif',
            '衬线': 'Georgia, "Times New Roman", "STSong", serif',
            '等宽': '"Fira Code", "SF Mono", Monaco, Inconsolata, "Roboto Mono", "Source Code Pro", Menlo, Consolas, "DejaVu Sans Mono", monospace'
        };
        return fontMap[fontFamily] || fontFamily;
    }
    // 字号映射函数  
    // Claude Code Update: 更新字号映射，支持所有像素值
    mapFontSize(fontSize) {
        // 兼容旧的文字描述和新的像素值
        const sizeMap = {
            '小': '14px',
            '推荐': '16px',
            '大': '18px',
            '特大': '20px',
            // 直接映射像素值
            '14px': '14px',
            '16px': '16px',
            '18px': '18px',
            '20px': '20px',
            '22px': '22px',
            '24px': '24px'
        };
        return sizeMap[fontSize] || fontSize;
    }
    // 样式编辑器更新方法
    updateFont(fontFamily) {
        console.log('🎯 ArticleRender收到字体变更:', fontFamily);
        this.setStyle(this.getCSS());
    }
    updateFontSize(fontSize) {
        console.log('🎯 ArticleRender收到字号变更:', fontSize);
        this.setStyle(this.getCSS());
    }
    updatePrimaryColor(color) {
        console.log('🎯 ArticleRender收到主题色变更:', color);
        this.setStyle(this.getCSS());
    }
    updateCustomCSS(css) {
        console.log('🎯 ArticleRender收到自定义CSS变更');
        this.setStyle(this.getCSS());
    }
    getFrontmatterValue(frontmatter, key) {
        const value = frontmatter[key];
        if (value instanceof Array) {
            return value[0];
        }
        return value;
    }
    getMetadata() {
        var _a;
        let res = {
            title: '',
            author: undefined,
            digest: undefined,
            content: '',
            content_source_url: undefined,
            cover: undefined,
            thumb_media_id: '',
            need_open_comment: undefined,
            only_fans_can_comment: undefined,
            pic_crop_235_1: undefined,
            pic_crop_1_1: undefined,
            appid: undefined,
            theme: undefined,
            highlight: undefined,
        };
        const file = this.app.workspace.getActiveFile();
        if (!file)
            return res;
        const metadata = this.app.metadataCache.getFileCache(file);
        if (metadata === null || metadata === void 0 ? void 0 : metadata.frontmatter) {
            const frontmatter = metadata.frontmatter;
            res.title = this.getFrontmatterValue(frontmatter, 'title');
            res.author = this.getFrontmatterValue(frontmatter, 'author');
            res.digest = this.getFrontmatterValue(frontmatter, 'digest');
            res.content_source_url = this.getFrontmatterValue(frontmatter, 'content_source_url');
            res.cover = this.getFrontmatterValue(frontmatter, 'cover');
            res.thumb_media_id = this.getFrontmatterValue(frontmatter, 'thumb_media_id');
            res.need_open_comment = frontmatter['need_open_comment'] ? 1 : undefined;
            res.only_fans_can_comment = frontmatter['only_fans_can_comment'] ? 1 : undefined;
            res.appid = this.getFrontmatterValue(frontmatter, 'appid');
            if (res.appid && !res.appid.startsWith('wx')) {
                res.appid = (_a = this.settings.wxInfo.find(wx => wx.name === res.appid)) === null || _a === void 0 ? void 0 : _a.appid;
            }
            res.theme = this.getFrontmatterValue(frontmatter, 'theme');
            res.highlight = this.getFrontmatterValue(frontmatter, 'highlight');
            if (frontmatter['crop']) {
                res.pic_crop_235_1 = '0_0_1_0.5';
                res.pic_crop_1_1 = '0_0.525_0.404_1';
            }
        }
        return res;
    }
    async uploadVaultCover(name, token) {
        const LocalFileRegex = /^!\[\[(.*?)\]\]/;
        const matches = name.match(LocalFileRegex);
        let fileName = '';
        if (matches && matches.length > 1) {
            fileName = matches[1];
        }
        else {
            fileName = name;
        }
        // Claude Code Update
        const vault = this.app.vault;
        const file = this.assetsManager.searchFile(fileName);
        // 使用 instanceof 检查而非类型断言
        if (!file || !(file instanceof TFile)) {
            throw new Error('找不到封面文件: ' + fileName);
        }
        const fileData = await vault.readBinary(file);
        return await this.uploadCover(new Blob([fileData]), file.name, token);
    }
    async uploadCover(data, filename, token) {
        if (filename.toLowerCase().endsWith('.webp')) {
            await PrepareImageLib();
            if (IsImageLibReady()) {
                data = new Blob([WebpToJPG(await data.arrayBuffer())]);
                filename = filename.toLowerCase().replace('.webp', '.jpg');
            }
        }
        const res = await UploadImageToWx(data, filename, token, 'image');
        if (res.media_id) {
            return res.media_id;
        }
        console.error('upload cover fail: ' + res.errmsg);
        throw new Error('上传封面失败: ' + res.errmsg);
    }
    // 使用新的后端API获取默认封面
    async getDefaultCover(token) {
        try {
            // 确保客户端已初始化
            if (!this.wechatClient) {
                initApiClients();
                this.wechatClient = getWechatClient();
            }
            const response = await this.wechatClient.getMediaList({
                accessToken: token,
                type: 'image',
                count: 1,
                offset: 0
            });
            if (response.item_count && response.item_count > 0 && response.item) {
                // 添加调试信息查看素材库返回的URL格式
                console.log('🔍 素材库返回的第一个素材:', response.item[0]);
                return response.item[0].media_id;
            }
        }
        catch (error) {
            console.error('获取默认封面失败:', error);
        }
        return '';
    }
    // Claude Code Update: 改进错误信息，提供更详细的错误描述
    async getToken(appid) {
        const secret = this.getSecret(appid);
        // 检查公众号配置
        if (!secret || secret.length === 0) {
            throw new Error('公众号AppSecret未配置，请在设置中配置公众号信息');
        }
        try {
            // 确保客户端已初始化
            if (!this.wechatClient) {
                initApiClients();
                this.wechatClient = getWechatClient();
            }
            const response = await this.wechatClient.authenticate({
                appId: appid,
                appSecret: secret
            });
            return response.access_token;
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            // Claude Code Update: 根据错误信息提供更友好的提示，IP错误时显示具体IP
            if (errorMsg.includes('CORS') || errorMsg.includes('fetch') || errorMsg.includes('Failed to fetch')) {
                throw new Error('无法连接到服务器，请检查网络连接或后端服务是否启动');
            }
            else if (errorMsg.includes('40001') || errorMsg.includes('AppSecret')) {
                throw new Error('AppSecret无效，请检查公众号配置');
            }
            else if (errorMsg.includes('40013') || errorMsg.includes('AppID')) {
                throw new Error('AppID无效，请检查公众号配置');
            }
            else if (errorMsg.includes('40164') || errorMsg.includes('IP') || errorMsg.includes('whitelist')) {
                // 尝试从错误信息中提取IP地址
                let ipAddress = '未知';
                // 匹配各种IP格式：invalid ip 223.87.218.98 或 IP 223.87.218.98 或 ip: 223.87.218.98
                const ipMatch = errorMsg.match(/(?:invalid\s+ip|IP|ip)[:\s]+(\d+\.\d+\.\d+\.\d+)/i);
                if (ipMatch) {
                    ipAddress = ipMatch[1];
                }
                else {
                    // 尝试匹配纯IP地址
                    const pureIpMatch = errorMsg.match(/(\d+\.\d+\.\d+\.\d+)/);
                    if (pureIpMatch) {
                        ipAddress = pureIpMatch[1];
                    }
                }
                throw new Error(`IP地址 ${ipAddress} 不在白名单中，请在微信公众平台添加此IP到白名单`);
            }
            else if (errorMsg.includes('timeout') || errorMsg.includes('超时')) {
                throw new Error('请求超时，请检查网络连接');
            }
            else {
                throw new Error('Token获取失败: ' + errorMsg);
            }
        }
    }
    // Claude Code Update: 移除authKey检查注释和copyArticle调用，上传图片不应复制内容
    async uploadImages(appid) {
        let metadata = this.getMetadata();
        if (metadata.appid) {
            appid = metadata.appid;
        }
        if (!appid || appid.length == 0) {
            throw new Error('请先选择公众号');
        }
        // 获取token
        const token = await this.getToken(appid);
        if (token === '') {
            return;
        }
        await this.cachedElementsToImages();
        const lm = LocalImageManager.getInstance();
        // 上传图片
        await lm.uploadLocalImage(token, this.app.vault);
        // 上传图床图片
        await lm.uploadRemoteImage(this.articleDiv, token);
        // 替换图片链接
        lm.replaceImages(this.articleDiv);
        // Claude Code Remove: 移除copyArticle调用，上传图片不应自动复制内容
    }
    async copyArticle() {
        const htmlContent = this.getArticleContent();
        const plainText = this.getArticleText();
        if (!htmlContent) {
            throw new Error('暂无可复制的内容');
        }
        // 优先使用Electron剪贴板（Obsidian桌面端无需窗口聚焦权限）
        try {
            const w = window;
            const electron = (w === null || w === void 0 ? void 0 : w.require) ? w.require('electron') : undefined;
            const electronClipboard = electron === null || electron === void 0 ? void 0 : electron.clipboard;
            if (electronClipboard && typeof electronClipboard.write === 'function') {
                electronClipboard.write({ html: htmlContent, text: plainText });
                return;
            }
        }
        catch (e) {
            // 忽略Electron不可用的情况，继续走Web API方案
            console.warn('Electron剪贴板不可用，尝试使用Web剪贴板API。');
        }
        // Web剪贴板API方案
        const clipboard = navigator.clipboard;
        const canUseClipboardItem = typeof ClipboardItem !== 'undefined';
        if (clipboard && canUseClipboardItem && window.isSecureContext) {
            try {
                // 若窗口未聚焦，尝试主动聚焦
                if (document.hasFocus && !document.hasFocus()) {
                    window.focus();
                    await new Promise((r) => setTimeout(r, 120));
                }
                await clipboard.write([
                    new ClipboardItem({
                        'text/html': new Blob([htmlContent], { type: 'text/html' }),
                        'text/plain': new Blob([plainText], { type: 'text/plain' })
                    })
                ]);
                return;
            }
            catch (error) {
                if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError')) {
                    console.warn('Clipboard API未授权，尝试使用兼容模式复制。', error);
                }
                else if (error instanceof Error && error.message.includes('Document is not focused')) {
                    console.warn('Clipboard API因失焦失败，尝试使用兼容模式复制。');
                }
                else {
                    console.warn('Clipboard API复制失败，尝试使用兼容模式复制。', error);
                }
            }
        }
        if (this.copyArticleWithExecCommand(htmlContent, plainText)) {
            return;
        }
        throw new Error('剪贴板复制失败：请确认Obsidian窗口处于活动状态后重试。');
    }
    copyArticleWithExecCommand(htmlContent, plainText) {
        var _a, _b;
        try {
            const selection = window.getSelection();
            if (!selection) {
                return false;
            }
            const container = document.createElement('div');
            container.innerHTML = htmlContent;
            container.contentEditable = 'true';
            container.style.position = 'fixed';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.opacity = '0';
            container.style.pointerEvents = 'none';
            container.style.userSelect = 'text';
            document.body.appendChild(container);
            const range = document.createRange();
            range.selectNodeContents(container);
            selection.removeAllRanges();
            selection.addRange(range);
            // 确保内容容器获得焦点，提升复制成功率
            (_b = (_a = container).focus) === null || _b === void 0 ? void 0 : _b.call(_a);
            let successful = document.execCommand('copy');
            selection.removeAllRanges();
            document.body.removeChild(container);
            if (successful) {
                return true;
            }
            const textarea = document.createElement('textarea');
            textarea.value = plainText;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            textarea.style.top = '0';
            textarea.style.opacity = '0';
            textarea.style.pointerEvents = 'none';
            document.body.appendChild(textarea);
            textarea.select();
            textarea.setSelectionRange(0, textarea.value.length);
            successful = document.execCommand('copy');
            document.body.removeChild(textarea);
            return successful;
        }
        catch (error) {
            console.warn('兼容模式复制失败:', error);
            return false;
        }
    }
    getSecret(appid) {
        for (const wx of this.settings.wxInfo) {
            if (wx.appid === appid) {
                return wx.secret.replace('SECRET', '');
            }
        }
        return '';
    }
    // 简化版本，移除复杂的图片管理逻辑，图片上传已移至note-preview.ts
    // 此方法已废弃，请使用note-preview.ts中的uploadImagesAndCreateDraft方法
    async postArticle(appid, localCover = null) {
        throw new Error('此方法已废弃，请使用note-preview.ts中的新调用链');
    }
    // Claude Code Update: 移除authKey检查注释
    async postImages(appid) {
        let metadata = this.getMetadata();
        if (metadata.appid) {
            appid = metadata.appid;
        }
        if (!appid || appid.length == 0) {
            throw new Error('请先选择公众号');
        }
        // 获取token
        const token = await this.getToken(appid);
        if (token === '') {
            throw new Error('获取token失败,请检查网络链接!');
        }
        const imageList = [];
        const lm = LocalImageManager.getInstance();
        // 上传图片
        await lm.uploadLocalImage(token, this.app.vault, 'image');
        // 上传图床图片
        await lm.uploadRemoteImage(this.articleDiv, token, 'image');
        const images = lm.getImageInfos(this.articleDiv);
        for (const image of images) {
            if (!image.media_id) {
                console.warn('miss media id:', image.resUrl);
                continue;
            }
            imageList.push({
                image_media_id: image.media_id,
            });
        }
        if (imageList.length === 0) {
            throw new Error('没有图片需要发布!');
        }
        const content = this.getArticleText();
        const imagesData = {
            article_type: 'newspic',
            title: metadata.title || this.title,
            content: content,
            need_open_commnet: metadata.need_open_comment || 0,
            only_fans_can_comment: metadata.only_fans_can_comment || 0,
            image_info: {
                image_list: imageList,
            }
        };
        // 使用新的后端API创建图片草稿
        try {
            // 确保客户端已初始化
            if (!this.wechatClient) {
                initApiClients();
                this.wechatClient = getWechatClient();
            }
            // 转换为新API需要的格式
            const newApiArticle = {
                title: imagesData.title,
                content: imagesData.content,
                author: '',
                digest: '',
                content_source_url: '',
                thumb_media_id: imageList.length > 0 ? imageList[0].image_media_id : '',
                show_cover_pic: true,
                need_open_comment: imagesData.need_open_commnet === 1,
                only_fans_can_comment: imagesData.only_fans_can_comment === 1
            };
            const response = await this.wechatClient.createDraft([newApiArticle], token);
            if (response.media_id) {
                return response.media_id;
            }
            else {
                console.error(JSON.stringify(response));
                throw new Error('发布失败!' + response.errmsg);
            }
        }
        catch (error) {
            console.error(error);
            throw new Error(`创建图片/文字失败: ${error.message}！`);
        }
    }
    async exportHTML() {
        await this.cachedElementsToImages();
        const lm = LocalImageManager.getInstance();
        const content = await lm.embleImages(this.articleDiv, this.app.vault);
        const globalStyle = await this.assetsManager.getStyle();
        const html = applyCSS(content, this.getCSS() + globalStyle);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.title + '.html';
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
    }
    async processCachedElements() {
        const af = this.app.workspace.getActiveFile();
        if (!af) {
            console.error('当前没有打开文件，无法处理缓存元素');
            return;
        }
        for (const [key, value] of this.cachedElements) {
            const [category, id] = key.split(':');
            if (category === 'mermaid') {
                const container = this.articleDiv.querySelector('#' + id);
                if (container) {
                    await MarkdownRenderer.render(this.app, value, container, af.path, this.itemView);
                }
            }
        }
    }
    async cachedElementsToImages() {
        for (const [key, cached] of this.cachedElements) {
            const [category, elementId] = key.split(':');
            const container = this.articleDiv.querySelector(`#${elementId}`);
            if (!container)
                continue;
            if (category === 'mermaid') {
                await this.replaceMermaidWithImage(container, elementId);
            }
        }
    }
    async replaceMermaidWithImage(container, id) {
        const mermaidContainer = container.querySelector('.mermaid');
        if (!mermaidContainer || !mermaidContainer.children.length)
            return;
        const svg = mermaidContainer.querySelector('svg');
        if (!svg)
            return;
        // Claude Code Update: 保留Mermaid图像尺寸的内联样式（动态计算值）
        try {
            const pngDataUrl = await toPng(mermaidContainer.firstElementChild, { pixelRatio: 2 });
            const img = document.createElement('img');
            img.id = `img-${id}`;
            img.src = pngDataUrl;
            // Mermaid图像宽度需要基于SVG动态计算，保留内联样式
            img.style.width = `${svg.clientWidth}px`;
            img.style.height = 'auto';
            container.replaceChild(img, mermaidContainer);
        }
        catch (error) {
            console.warn(`Failed to render Mermaid diagram: ${id}`, error);
        }
    }
    updateElementByID(id, html) {
        const item = this.articleDiv.querySelector('#' + id);
        if (!item)
            return;
        const doc = sanitizeHTMLToDom(html);
        item.empty();
        if (doc.childElementCount > 0) {
            for (const child of doc.children) {
                item.appendChild(child.cloneNode(true)); // 使用 cloneNode 复制节点以避免移动它
            }
        }
        else {
            item.innerText = '渲染失败';
        }
    }
    cacheElement(category, id, data) {
        const key = category + ':' + id;
        this.cachedElements.set(key, data);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJ0aWNsZS1yZW5kZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhcnRpY2xlLXJlbmRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7O0dBWUc7QUFFSCxPQUFPLEVBQTRCLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixFQUFvQixNQUFNLFVBQVUsQ0FBQztBQUN0SSxhQUFhO0FBQ2IsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQzlDLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUNyRCxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDakQsT0FBTyxhQUFhLE1BQU0sbUJBQW1CLENBQUM7QUFDOUMsT0FBTyxTQUFTLE1BQU0seUJBQXlCLENBQUM7QUFDaEQsWUFBWTtBQUNaLE9BQU8sRUFBZ0IsY0FBYyxFQUFFLGVBQWUsRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUl2RSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxFQUFFLGlCQUFpQixFQUFhLE1BQU0sdUJBQXVCLENBQUM7QUFDckUsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBQ2xELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUM5QyxPQUFPLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxTQUFTLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUNqRixPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBR3RDLE1BQU0sa0JBQWtCLEdBQUcseUJBQXlCLENBQUM7QUFFckQsTUFBTSxPQUFPLGFBQWE7SUFtQnhCLFlBQVksR0FBUSxFQUFFLFFBQWtCLEVBQUUsT0FBb0IsRUFBRSxVQUEwQjtRQUwxRixtQkFBYyxHQUF3QixJQUFJLEdBQUcsRUFB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S0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsMEJBQTBCO2FBQ3BFO1NBQ0Y7YUFDSTtZQUNILElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDO1NBQ3pCO0lBQ0gsQ0FBQztJQUVELFlBQVksQ0FBQyxRQUFnQixFQUFFLEVBQVUsRUFBRSxJQUFZO1FBQ3JELE1BQU0sR0FBRyxHQUFHLFFBQVEsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBQ2hDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNyQyxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IChjKSAyMDI0LTIwMjUgSXNIZXh4XG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc29mdHdhcmUgaXMgcHJvcHJpZXRhcnkgYW5kIGNvbmZpZGVudGlhbC4gTm8gcGFydCBvZiB0aGlzIHNvZnR3YXJlXG4gKiBtYXkgYmUgcmVwcm9kdWNlZCwgZGlzdHJpYnV0ZWQsIG9yIHRyYW5zbWl0dGVkIGluIGFueSBmb3JtIG9yIGJ5IGFueSBtZWFucyxcbiAqIGluY2x1ZGluZyBwaG90b2NvcHlpbmcsIHJlY29yZGluZywgb3Igb3RoZXIgZWxlY3Ryb25pYyBvciBtZWNoYW5pY2FsIG1ldGhvZHMsXG4gKiB3aXRob3V0IHRoZSBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24gb2YgdGhlIGF1dGhvciwgZXhjZXB0IGluIHRoZSBjYXNlIG9mXG4gKiBicmllZiBxdW90YXRpb25zIGVtYm9kaWVkIGluIGNyaXRpY2FsIHJldmlld3MgYW5kIGNlcnRhaW4gb3RoZXIgbm9uY29tbWVyY2lhbFxuICogdXNlcyBwZXJtaXR0ZWQgYnkgY29weXJpZ2h0IGxhdy5cbiAqXG4gKiBGb3IgcGVybWlzc2lvbiByZXF1ZXN0cywgY29udGFjdDogSXNIZXh4XG4gKi9cblxuaW1wb3J0IHsgQXBwLCBJdGVtVmlldywgV29ya3NwYWNlLCBOb3RpY2UsIHNhbml0aXplSFRNTFRvRG9tLCBhcGlWZXJzaW9uLCBURmlsZSwgTWFya2Rvd25SZW5kZXJlciwgRnJvbnRNYXR0ZXJDYWNoZSB9IGZyb20gJ29ic2lkaWFuJztcbi8vIOabtOaWsGltcG9ydOi3r+W+hFxuaW1wb3J0IHsgYXBwbHlDU1MgfSBmcm9tICcuLi8uLi9zaGFyZWQvdXRpbHMnO1xuaW1wb3J0IHsgVXBsb2FkSW1hZ2VUb1d4IH0gZnJvbSAnLi4vd2VjaGF0L2ltYWdlbGliJztcbmltcG9ydCB7IFd4U2V0dGluZ3MgfSBmcm9tICcuLi8uLi9jb3JlL3NldHRpbmdzJztcbmltcG9ydCBBc3NldHNNYW5hZ2VyIGZyb20gJy4uLy4uL2NvcmUvYXNzZXRzJztcbmltcG9ydCBJbmxpbmVDU1MgZnJvbSAnLi4vLi4vc2hhcmVkL2lubGluZS1jc3MnO1xuLy8g5L2/55So5paw55qE5ZCO56uvQVBJXG5pbXBvcnQgeyBXZWNoYXRDbGllbnQsIGluaXRBcGlDbGllbnRzLCBnZXRXZWNoYXRDbGllbnQgfSBmcm9tICcuLi9hcGknO1xuLy8g5Li05pe25L+d55WZ5pen55qE57G75Z6L5a6a5LmJ77yM5L2/55So5pen55qERHJhZnRBcnRpY2xl57G75Z6L5Lul5L+d5oyB5YW85a655oCnXG5pbXBvcnQgeyBEcmFmdEFydGljbGUsIERyYWZ0SW1hZ2VNZWRpYUlkLCBEcmFmdEltYWdlcyB9IGZyb20gJy4uL3dlY2hhdC93ZWl4aW4tYXBpJztcbmltcG9ydCB7IE1EUmVuZGVyZXJDYWxsYmFjayB9IGZyb20gJy4vbWFya2Rvd24vZXh0ZW5zaW9uJztcbmltcG9ydCB7IE1hcmtlZFBhcnNlciB9IGZyb20gJy4vbWFya2Rvd24vcGFyc2VyJztcbmltcG9ydCB7IExvY2FsSW1hZ2VNYW5hZ2VyLCBMb2NhbEZpbGUgfSBmcm9tICcuL21hcmtkb3duL2xvY2FsLWZpbGUnO1xuaW1wb3J0IHsgQ2FyZERhdGFNYW5hZ2VyIH0gZnJvbSAnLi9tYXJrZG93bi9jb2RlJztcbmltcG9ydCB7IGRlYm91bmNlIH0gZnJvbSAnLi4vLi4vc2hhcmVkL3V0aWxzJztcbmltcG9ydCB7IFByZXBhcmVJbWFnZUxpYiwgSXNJbWFnZUxpYlJlYWR5LCBXZWJwVG9KUEcgfSBmcm9tICcuLi93ZWNoYXQvaW1hZ2VsaWInO1xuaW1wb3J0IHsgdG9QbmcgfSBmcm9tICdodG1sLXRvLWltYWdlJztcblxuXG5jb25zdCBGUk9OVF9NQVRURVJfUkVHRVggPSAvXigtLS0pJC4rP14oLS0tKSQuKz8vaW1zO1xuXG5leHBvcnQgY2xhc3MgQXJ0aWNsZVJlbmRlciBpbXBsZW1lbnRzIE1EUmVuZGVyZXJDYWxsYmFjayB7XG4gIGFwcDogQXBwO1xuICBpdGVtVmlldzogSXRlbVZpZXc7XG4gIHdvcmtzcGFjZTogV29ya3NwYWNlO1xuICBzdHlsZUVsOiBIVE1MRWxlbWVudDtcbiAgYXJ0aWNsZURpdjogSFRNTERpdkVsZW1lbnQ7XG4gIHNldHRpbmdzOiBXeFNldHRpbmdzO1xuICBhc3NldHNNYW5hZ2VyOiBBc3NldHNNYW5hZ2VyO1xuICBhcnRpY2xlSFRNTDogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICBfY3VycmVudFRoZW1lOiBzdHJpbmc7XG4gIF9jdXJyZW50SGlnaGxpZ2h0OiBzdHJpbmc7XG4gIF9jdXJyZW50QXBwSWQ6IHN0cmluZztcbiAgbWFya2VkUGFyc2VyOiBNYXJrZWRQYXJzZXI7XG4gIGNhY2hlZEVsZW1lbnRzOiBNYXA8c3RyaW5nLCBzdHJpbmc+ID0gbmV3IE1hcCgpO1xuICBkZWJvdW5jZWRSZW5kZXJNYXJrZG93bjogKC4uLmFyZ3M6IGFueVtdKSA9PiB2b2lkO1xuICAvLyDmt7vliqDlvq7kv6FBUEnlrqLmiLfnq69cbiAgd2VjaGF0Q2xpZW50OiBXZWNoYXRDbGllbnQ7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIGl0ZW1WaWV3OiBJdGVtVmlldywgc3R5bGVFbDogSFRNTEVsZW1lbnQsIGFydGljbGVEaXY6IEhUTUxEaXZFbGVtZW50KSB7XG4gICAgdGhpcy5hcHAgPSBhcHA7XG4gICAgdGhpcy5pdGVtVmlldyA9IGl0ZW1WaWV3O1xuICAgIHRoaXMuc3R5bGVFbCA9IHN0eWxlRWw7XG4gICAgdGhpcy5hcnRpY2xlRGl2ID0gYXJ0aWNsZURpdjtcbiAgICB0aGlzLnNldHRpbmdzID0gV3hTZXR0aW5ncy5nZXRJbnN0YW5jZSgpO1xuICAgIHRoaXMuYXNzZXRzTWFuYWdlciA9IEFzc2V0c01hbmFnZXIuZ2V0SW5zdGFuY2UoKTtcbiAgICB0aGlzLmFydGljbGVIVE1MID0gJyc7XG4gICAgdGhpcy50aXRsZSA9ICcnO1xuICAgIHRoaXMuX2N1cnJlbnRUaGVtZSA9ICdkZWZhdWx0JztcbiAgICB0aGlzLl9jdXJyZW50SGlnaGxpZ2h0ID0gJ2RlZmF1bHQnO1xuICAgIHRoaXMubWFya2VkUGFyc2VyID0gbmV3IE1hcmtlZFBhcnNlcihhcHAsIHRoaXMpO1xuICAgIHRoaXMuZGVib3VuY2VkUmVuZGVyTWFya2Rvd24gPSBkZWJvdW5jZSh0aGlzLnJlbmRlck1hcmtkb3duLmJpbmQodGhpcyksIDEwMDApO1xuICAgIFxuICAgIC8vIOWIneWni+WMluW+ruS/oUFQSeWuouaIt+err1xuICAgIHRyeSB7XG4gICAgICBpbml0QXBpQ2xpZW50cygpO1xuICAgICAgdGhpcy53ZWNoYXRDbGllbnQgPSBnZXRXZWNoYXRDbGllbnQoKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS53YXJuKCflvq7kv6FBUEnlrqLmiLfnq6/liJ3lp4vljJblpLHotKXvvIzlsIblnKjpppbmrKHkvb/nlKjml7bliJ3lp4vljJY6JywgZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIHNldCBjdXJyZW50VGhlbWUodmFsdWU6IHN0cmluZykge1xuICAgIHRoaXMuX2N1cnJlbnRUaGVtZSA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IGN1cnJlbnRUaGVtZSgpIHtcbiAgICBjb25zdCB7IHRoZW1lIH0gPSB0aGlzLmdldE1ldGFkYXRhKCk7XG4gICAgaWYgKHRoZW1lKSB7XG4gICAgICByZXR1cm4gdGhlbWU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9jdXJyZW50VGhlbWU7XG4gIH1cblxuICBzZXQgY3VycmVudEhpZ2hsaWdodCh2YWx1ZTogc3RyaW5nKSB7XG4gICAgdGhpcy5fY3VycmVudEhpZ2hsaWdodCA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IGN1cnJlbnRIaWdobGlnaHQoKSB7XG4gICAgY29uc3QgeyBoaWdobGlnaHQgfSA9IHRoaXMuZ2V0TWV0YWRhdGEoKTtcbiAgICBpZiAoaGlnaGxpZ2h0KSB7XG4gICAgICByZXR1cm4gaGlnaGxpZ2h0O1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fY3VycmVudEhpZ2hsaWdodDtcbiAgfVxuXG4gIGlzT2xkVGhlbWUoKSB7XG4gICAgY29uc3QgdGhlbWUgPSB0aGlzLmFzc2V0c01hbmFnZXIuZ2V0VGhlbWUodGhpcy5jdXJyZW50VGhlbWUpO1xuICAgIGlmICh0aGVtZSkge1xuICAgICAgcmV0dXJuIHRoZW1lLmNzcy5pbmRleE9mKCcud2R3eGVkaXQnKSA8IDA7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHNldEFydGljbGUoYXJ0aWNsZTogc3RyaW5nKSB7XG4gICAgdGhpcy5hcnRpY2xlRGl2LmVtcHR5KCk7XG4gICAgbGV0IGNsYXNzTmFtZSA9ICd3ZHd4ZWRpdCc7XG4gICAgLy8g5YW85a655pen54mI5pys5qC35byPXG4gICAgaWYgKHRoaXMuaXNPbGRUaGVtZSgpKSB7XG4gICAgICBjbGFzc05hbWUgPSB0aGlzLmN1cnJlbnRUaGVtZTtcbiAgICB9XG4gICAgY29uc3QgaHRtbCA9IGA8c2VjdGlvbiBjbGFzcz1cIiR7Y2xhc3NOYW1lfVwiIGlkPVwiYXJ0aWNsZS1zZWN0aW9uXCI+JHthcnRpY2xlfTwvc2VjdGlvbj5gO1xuICAgIGNvbnN0IGRvYyA9IHNhbml0aXplSFRNTFRvRG9tKGh0bWwpO1xuICAgIGlmIChkb2MuZmlyc3RDaGlsZCkge1xuICAgICAgdGhpcy5hcnRpY2xlRGl2LmFwcGVuZENoaWxkKGRvYy5maXJzdENoaWxkKTtcbiAgICB9XG4gIH1cblxuICBzZXRTdHlsZShjc3M6IHN0cmluZykge1xuICAgIHRoaXMuc3R5bGVFbC5lbXB0eSgpO1xuICAgIHRoaXMuc3R5bGVFbC5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjc3MpKTtcbiAgfVxuXG4gIHJlbG9hZFN0eWxlKCkge1xuICAgIHRoaXMuc2V0U3R5bGUodGhpcy5nZXRDU1MoKSk7XG4gIH1cblxuICBnZXRBcnRpY2xlU2VjdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy5hcnRpY2xlRGl2LnF1ZXJ5U2VsZWN0b3IoJyNhcnRpY2xlLXNlY3Rpb24nKSBhcyBIVE1MRWxlbWVudDtcbiAgfVxuXG4gIC8vIENsYXVkZSBDb2RlIFVwZGF0ZTog5L+d55WZaW5uZXJIVE1M6K+75Y+W5pON5L2c77yI55So5LqO5pyA57uI6L6T5Ye65bqP5YiX5YyW77yJXG4gIGdldEFydGljbGVDb250ZW50KCkge1xuICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLmFydGljbGVEaXYuaW5uZXJIVE1MO1xuICAgIGxldCBodG1sID0gYXBwbHlDU1MoY29udGVudCwgdGhpcy5nZXRDU1MoKSk7XG4gICAgLy8g5aSE55CG6K+d6aKY5aSa5L2Z5YaF5a65XG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZSgvcmVsPVwibm9vcGVuZXIgbm9mb2xsb3dcIi9nLCAnJyk7XG4gICAgaHRtbCA9IGh0bWwucmVwbGFjZSgvdGFyZ2V0PVwiX2JsYW5rXCIvZywgJycpO1xuICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoL2RhdGEtbGVhZj1cIlwiL2csICdsZWFmPVwiXCInKTtcbiAgICByZXR1cm4gQ2FyZERhdGFNYW5hZ2VyLmdldEluc3RhbmNlKCkucmVzdG9yZUNhcmQoaHRtbCk7XG4gIH1cblxuICBnZXRBcnRpY2xlVGV4dCgpIHtcbiAgICByZXR1cm4gdGhpcy5hcnRpY2xlRGl2LmlubmVyVGV4dC50cmltU3RhcnQoKTtcbiAgfVxuXG4gIGVycm9yQ29udGVudChlcnJvcjogYW55KSB7XG4gICAgcmV0dXJuICc8aDE+5riy5p+T5aSx6LSlITwvaDE+PGJyLz4nXG4gICAgICArICflpoLpnIDluK7liqnor7fliY3lvoAmbmJzcDsmbmJzcDs8YSBocmVmPVwiaHR0cHM6Ly9naXRodWIuY29tL0lzSGV4eC9XRFdYRWRpdC9pc3N1ZXNcIj5odHRwczovL2dpdGh1Yi5jb20vSXNIZXh4L1dEV1hFZGl0L2lzc3VlczwvYT4mbmJzcDsmbmJzcDvlj43ppog8YnIvPjxici8+J1xuICAgICAgKyAn5aaC5p6c5pa55L6/77yM6K+35o+Q5L6b5byV5Y+R6ZSZ6K+v55qE5a6M5pW0TWFya2Rvd27lhoXlrrnjgII8YnIvPjxici8+J1xuICAgICAgKyAnPGJyLz5PYnNpZGlhbueJiOacrO+8micgKyBhcGlWZXJzaW9uXG4gICAgICArICc8YnIvPumUmeivr+S/oeaBr++8mjxici8+J1xuICAgICAgKyBgJHtlcnJvcn1gO1xuICB9XG5cbiAgYXN5bmMgcmVuZGVyTWFya2Rvd24oYWY6IFRGaWxlIHwgbnVsbCA9IG51bGwpIHtcbiAgICB0cnkge1xuICAgICAgbGV0IG1kID0gJyc7XG4gICAgICBpZiAoYWYgJiYgYWYuZXh0ZW5zaW9uLnRvTG9jYWxlTG93ZXJDYXNlKCkgPT09ICdtZCcpIHtcbiAgICAgICAgbWQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLnJlYWQoYWYucGF0aCk7XG4gICAgICAgIHRoaXMudGl0bGUgPSBhZi5iYXNlbmFtZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBtZCA9ICfmsqHmnInlj6/muLLmn5PnmoTnrJTorrDmiJbmlofku7bkuI3mlK/mjIHmuLLmn5MnO1xuICAgICAgfVxuICAgICAgaWYgKG1kLnN0YXJ0c1dpdGgoJy0tLScpKSB7XG4gICAgICAgIG1kID0gbWQucmVwbGFjZShGUk9OVF9NQVRURVJfUkVHRVgsICcnKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5hcnRpY2xlSFRNTCA9IGF3YWl0IHRoaXMubWFya2VkUGFyc2VyLnBhcnNlKG1kKTtcbiAgICAgIHRoaXMuc2V0U3R5bGUodGhpcy5nZXRDU1MoKSk7XG4gICAgICB0aGlzLnNldEFydGljbGUodGhpcy5hcnRpY2xlSFRNTCk7XG4gICAgICBhd2FpdCB0aGlzLnByb2Nlc3NDYWNoZWRFbGVtZW50cygpO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgIHRoaXMuc2V0QXJ0aWNsZSh0aGlzLmVycm9yQ29udGVudChlKSk7XG4gICAgfVxuICB9XG4gIC8vIOa3u+WKoOagt+W8j+e8lui+keWZqENTU+aUr+aMgVxuICBnZXRDU1MoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHRoZW1lID0gdGhpcy5hc3NldHNNYW5hZ2VyLmdldFRoZW1lKHRoaXMuY3VycmVudFRoZW1lKTtcbiAgICAgIGNvbnN0IGhpZ2hsaWdodCA9IHRoaXMuYXNzZXRzTWFuYWdlci5nZXRIaWdobGlnaHQodGhpcy5jdXJyZW50SGlnaGxpZ2h0KTtcbiAgICAgIGNvbnN0IGN1c3RvbUNTUyA9IHRoaXMuc2V0dGluZ3MuY3VzdG9tQ1NTTm90ZS5sZW5ndGggPiAwIHx8IHRoaXMuc2V0dGluZ3MudXNlQ3VzdG9tQ3NzID8gdGhpcy5hc3NldHNNYW5hZ2VyLmN1c3RvbUNTUyA6ICcnO1xuICAgICAgY29uc3QgYmFzZUNTUyA9IHRoaXMuc2V0dGluZ3MuYmFzZUNTUyA/IGAud2R3eGVkaXQgeyR7dGhpcy5zZXR0aW5ncy5iYXNlQ1NTfX1gIDogJyc7XG4gICAgICBcbiAgICAgIC8vIOa3u+WKoOagt+W8j+e8lui+keWZqENTU++8iOWtl+S9k+OAgeWtl+WPt+OAgeS4u+mimOiJsu+8iVxuICAgICAgY29uc3Qgc3R5bGVFZGl0b3JDU1MgPSB0aGlzLmJ1aWxkU3R5bGVFZGl0b3JDU1MoKTtcbiAgICAgIFxuICAgICAgcmV0dXJuIGAke0lubGluZUNTU31cXG5cXG4ke2hpZ2hsaWdodCEuY3NzfVxcblxcbiR7dGhlbWUhLmNzc31cXG5cXG4ke2Jhc2VDU1N9XFxuXFxuJHtjdXN0b21DU1N9XFxuXFxuJHt0aGlzLnNldHRpbmdzLmN1c3RvbUNTU31cXG5cXG4ke3N0eWxlRWRpdG9yQ1NTfWA7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgbmV3IE5vdGljZShg6I635Y+W5qC35byP5aSx6LSlJHt0aGlzLmN1cnJlbnRUaGVtZX18JHt0aGlzLmN1cnJlbnRIaWdobGlnaHR977yM6K+35qOA5p+l5Li76aKY5piv5ZCm5q2j56Gu5a6J6KOF44CCYCk7XG4gICAgfVxuICAgIHJldHVybiAnJztcbiAgfVxuXG4gIHVwZGF0ZVN0eWxlKHN0eWxlTmFtZTogc3RyaW5nKSB7XG4gICAgdGhpcy5jdXJyZW50VGhlbWUgPSBzdHlsZU5hbWU7XG4gICAgdGhpcy5zZXRTdHlsZSh0aGlzLmdldENTUygpKTtcbiAgfVxuXG4gIHVwZGF0ZUhpZ2hMaWdodChzdHlsZU5hbWU6IHN0cmluZykge1xuICAgIHRoaXMuY3VycmVudEhpZ2hsaWdodCA9IHN0eWxlTmFtZTtcbiAgICB0aGlzLnNldFN0eWxlKHRoaXMuZ2V0Q1NTKCkpO1xuICB9XG5cbiAgLy8g5p6E5bu65qC35byP57yW6L6R5ZmoQ1NT77yI5LuF55So5LqO6aKE6KeI5pi+56S677yJXG4gIHByaXZhdGUgYnVpbGRTdHlsZUVkaXRvckNTUygpOiBzdHJpbmcge1xuICAgIGNvbnN0IGNzc1J1bGVzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgLy8g5a2X5L2T6K6+572uXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuZm9udEZhbWlseSkge1xuICAgICAgY29uc3QgZm9udEZhbWlseVZhbHVlID0gdGhpcy5tYXBGb250RmFtaWx5KHRoaXMuc2V0dGluZ3MuZm9udEZhbWlseSk7XG4gICAgICBjc3NSdWxlcy5wdXNoKGBcbiAgICAgICAgc2VjdGlvbiNhcnRpY2xlLXNlY3Rpb24ud2R3eGVkaXQsXG4gICAgICAgIHNlY3Rpb24jYXJ0aWNsZS1zZWN0aW9uLndkd3hlZGl0ICosXG4gICAgICAgIC53ZHd4ZWRpdCwgXG4gICAgICAgIC53ZHd4ZWRpdCAqLCBcbiAgICAgICAgLndkd3hlZGl0IHAsIFxuICAgICAgICAud2R3eGVkaXQgaDEsIFxuICAgICAgICAud2R3eGVkaXQgaDIsIFxuICAgICAgICAud2R3eGVkaXQgaDMsIFxuICAgICAgICAud2R3eGVkaXQgaDQsIFxuICAgICAgICAud2R3eGVkaXQgaDUsIFxuICAgICAgICAud2R3eGVkaXQgaDYsXG4gICAgICAgIC53ZHd4ZWRpdCBkaXYsXG4gICAgICAgIC53ZHd4ZWRpdCBzcGFuLFxuICAgICAgICAud2R3eGVkaXQgbGksXG4gICAgICAgIC53ZHd4ZWRpdCB0ZCxcbiAgICAgICAgLndkd3hlZGl0IHRoIHsgXG4gICAgICAgICAgZm9udC1mYW1pbHk6ICR7Zm9udEZhbWlseVZhbHVlfSAhaW1wb3J0YW50OyBcbiAgICAgICAgfVxuICAgICAgYCk7XG4gICAgICBjb25zb2xlLmxvZygn8J+OqCDlupTnlKjlrZfkvZPorr7nva46JywgdGhpcy5zZXR0aW5ncy5mb250RmFtaWx5LCAnLT4nLCBmb250RmFtaWx5VmFsdWUpO1xuICAgIH1cblxuICAgIC8vIOWtl+WPt+iuvue9riAgXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MuZm9udFNpemUpIHtcbiAgICAgIGNvbnN0IGZvbnRTaXplVmFsdWUgPSB0aGlzLm1hcEZvbnRTaXplKHRoaXMuc2V0dGluZ3MuZm9udFNpemUpO1xuICAgICAgY3NzUnVsZXMucHVzaChgXG4gICAgICAgIHNlY3Rpb24jYXJ0aWNsZS1zZWN0aW9uLndkd3hlZGl0LFxuICAgICAgICAud2R3eGVkaXQgeyBcbiAgICAgICAgICBmb250LXNpemU6ICR7Zm9udFNpemVWYWx1ZX0gIWltcG9ydGFudDsgXG4gICAgICAgIH1cbiAgICAgICAgc2VjdGlvbiNhcnRpY2xlLXNlY3Rpb24ud2R3eGVkaXQgcCxcbiAgICAgICAgc2VjdGlvbiNhcnRpY2xlLXNlY3Rpb24ud2R3eGVkaXQgZGl2LFxuICAgICAgICBzZWN0aW9uI2FydGljbGUtc2VjdGlvbi53ZHd4ZWRpdCBzcGFuLFxuICAgICAgICBzZWN0aW9uI2FydGljbGUtc2VjdGlvbi53ZHd4ZWRpdCBsaSxcbiAgICAgICAgLndkd3hlZGl0IHAsIFxuICAgICAgICAud2R3eGVkaXQgZGl2LCBcbiAgICAgICAgLndkd3hlZGl0IHNwYW4sXG4gICAgICAgIC53ZHd4ZWRpdCBsaSB7IFxuICAgICAgICAgIGZvbnQtc2l6ZTogaW5oZXJpdCAhaW1wb3J0YW50OyBcbiAgICAgICAgfVxuICAgICAgYCk7XG4gICAgICBjb25zb2xlLmxvZygn8J+OqCDlupTnlKjlrZflj7forr7nva46JywgdGhpcy5zZXR0aW5ncy5mb250U2l6ZSwgJy0+JywgZm9udFNpemVWYWx1ZSk7XG4gICAgfVxuXG4gICAgLy8g5Li76aKY6Imy6K6+572uXG4gICAgaWYgKHRoaXMuc2V0dGluZ3MucHJpbWFyeUNvbG9yKSB7XG4gICAgICBjc3NSdWxlcy5wdXNoKGBcbiAgICAgICAgc2VjdGlvbiNhcnRpY2xlLXNlY3Rpb24ud2R3eGVkaXQgaDEsXG4gICAgICAgIGRpdi53ZHd4ZWRpdCBoMSxcbiAgICAgICAgLndkd3hlZGl0IGgxIHsgXG4gICAgICAgICAgY29sb3I6ICR7dGhpcy5zZXR0aW5ncy5wcmltYXJ5Q29sb3J9ICFpbXBvcnRhbnQ7IFxuICAgICAgICB9XG4gICAgICAgIHNlY3Rpb24jYXJ0aWNsZS1zZWN0aW9uLndkd3hlZGl0IGgyLFxuICAgICAgICBkaXYud2R3eGVkaXQgaDIsXG4gICAgICAgIC53ZHd4ZWRpdCBoMiB7IFxuICAgICAgICAgIGNvbG9yOiAke3RoaXMuc2V0dGluZ3MucHJpbWFyeUNvbG9yfSAhaW1wb3J0YW50OyBcbiAgICAgICAgfVxuICAgICAgICBzZWN0aW9uI2FydGljbGUtc2VjdGlvbi53ZHd4ZWRpdCBoMyxcbiAgICAgICAgZGl2Lndkd3hlZGl0IGgzLFxuICAgICAgICAud2R3eGVkaXQgaDMgeyBcbiAgICAgICAgICBjb2xvcjogJHt0aGlzLnNldHRpbmdzLnByaW1hcnlDb2xvcn0gIWltcG9ydGFudDsgXG4gICAgICAgIH1cbiAgICAgICAgc2VjdGlvbiNhcnRpY2xlLXNlY3Rpb24ud2R3eGVkaXQgaDQsXG4gICAgICAgIGRpdi53ZHd4ZWRpdCBoNCxcbiAgICAgICAgLndkd3hlZGl0IGg0IHsgXG4gICAgICAgICAgY29sb3I6ICR7dGhpcy5zZXR0aW5ncy5wcmltYXJ5Q29sb3J9ICFpbXBvcnRhbnQ7IFxuICAgICAgICB9XG4gICAgICAgIHNlY3Rpb24jYXJ0aWNsZS1zZWN0aW9uLndkd3hlZGl0IGg1LFxuICAgICAgICBkaXYud2R3eGVkaXQgaDUsXG4gICAgICAgIC53ZHd4ZWRpdCBoNSB7IFxuICAgICAgICAgIGNvbG9yOiAke3RoaXMuc2V0dGluZ3MucHJpbWFyeUNvbG9yfSAhaW1wb3J0YW50OyBcbiAgICAgICAgfVxuICAgICAgICBzZWN0aW9uI2FydGljbGUtc2VjdGlvbi53ZHd4ZWRpdCBoNixcbiAgICAgICAgZGl2Lndkd3hlZGl0IGg2LFxuICAgICAgICAud2R3eGVkaXQgaDYgeyBcbiAgICAgICAgICBjb2xvcjogJHt0aGlzLnNldHRpbmdzLnByaW1hcnlDb2xvcn0gIWltcG9ydGFudDsgXG4gICAgICAgIH1cbiAgICAgIGApO1xuICAgICAgY29uc29sZS5sb2coJ/Cfjqgg5bqU55So5Li76aKY6Imy6K6+572uOicsIHRoaXMuc2V0dGluZ3MucHJpbWFyeUNvbG9yKTtcbiAgICB9XG5cbiAgICByZXR1cm4gY3NzUnVsZXMuam9pbignXFxuJyk7XG4gIH1cblxuICAvLyDlrZfkvZPmmKDlsITlh73mlbBcbiAgcHJpdmF0ZSBtYXBGb250RmFtaWx5KGZvbnRGYW1pbHk6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgY29uc3QgZm9udE1hcDogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSA9IHtcbiAgICAgICfnrYnnur8nOiAnXCJEZW5nWGlhblwiLCBcIk1pY3Jvc29mdCBZYUhlaVwiLCBcIlBpbmdGYW5nIFNDXCIsIFwiSGlyYWdpbm8gU2FucyBHQlwiLCBcIkhlbHZldGljYSBOZXVlXCIsIEFyaWFsLCBzYW5zLXNlcmlmJyxcbiAgICAgICfml6Dooaznur8nOiAnLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCBcIkhlbHZldGljYSBOZXVlXCIsIFwiUGluZ0ZhbmcgU0NcIiwgXCJIaXJhZ2lubyBTYW5zIEdCXCIsIFwiTWljcm9zb2Z0IFlhSGVpIFVJXCIsIFwiTWljcm9zb2Z0IFlhSGVpXCIsIEFyaWFsLCBzYW5zLXNlcmlmJyxcbiAgICAgICfooaznur8nOiAnR2VvcmdpYSwgXCJUaW1lcyBOZXcgUm9tYW5cIiwgXCJTVFNvbmdcIiwgc2VyaWYnLFxuICAgICAgJ+etieWuvSc6ICdcIkZpcmEgQ29kZVwiLCBcIlNGIE1vbm9cIiwgTW9uYWNvLCBJbmNvbnNvbGF0YSwgXCJSb2JvdG8gTW9ub1wiLCBcIlNvdXJjZSBDb2RlIFByb1wiLCBNZW5sbywgQ29uc29sYXMsIFwiRGVqYVZ1IFNhbnMgTW9ub1wiLCBtb25vc3BhY2UnXG4gICAgfTtcbiAgICByZXR1cm4gZm9udE1hcFtmb250RmFtaWx5XSB8fCBmb250RmFtaWx5O1xuICB9XG5cbiAgLy8g5a2X5Y+35pig5bCE5Ye95pWwICBcbiAgLy8gQ2xhdWRlIENvZGUgVXBkYXRlOiDmm7TmlrDlrZflj7fmmKDlsITvvIzmlK/mjIHmiYDmnInlg4/ntKDlgLxcbiAgcHJpdmF0ZSBtYXBGb250U2l6ZShmb250U2l6ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAvLyDlhbzlrrnml6fnmoTmloflrZfmj4/ov7DlkozmlrDnmoTlg4/ntKDlgLxcbiAgICBjb25zdCBzaXplTWFwOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge1xuICAgICAgJ+Wwjyc6ICcxNHB4JyxcbiAgICAgICfmjqjojZAnOiAnMTZweCcsXG4gICAgICAn5aSnJzogJzE4cHgnLFxuICAgICAgJ+eJueWkpyc6ICcyMHB4JyxcbiAgICAgIC8vIOebtOaOpeaYoOWwhOWDj+e0oOWAvFxuICAgICAgJzE0cHgnOiAnMTRweCcsXG4gICAgICAnMTZweCc6ICcxNnB4JyxcbiAgICAgICcxOHB4JzogJzE4cHgnLFxuICAgICAgJzIwcHgnOiAnMjBweCcsXG4gICAgICAnMjJweCc6ICcyMnB4JyxcbiAgICAgICcyNHB4JzogJzI0cHgnXG4gICAgfTtcbiAgICByZXR1cm4gc2l6ZU1hcFtmb250U2l6ZV0gfHwgZm9udFNpemU7XG4gIH1cblxuICAvLyDmoLflvI/nvJbovpHlmajmm7TmlrDmlrnms5VcbiAgdXBkYXRlRm9udChmb250RmFtaWx5OiBzdHJpbmcpIHtcbiAgICBjb25zb2xlLmxvZygn8J+OryBBcnRpY2xlUmVuZGVy5pS25Yiw5a2X5L2T5Y+Y5pu0OicsIGZvbnRGYW1pbHkpO1xuICAgIHRoaXMuc2V0U3R5bGUodGhpcy5nZXRDU1MoKSk7XG4gIH1cblxuICB1cGRhdGVGb250U2l6ZShmb250U2l6ZTogc3RyaW5nKSB7XG4gICAgY29uc29sZS5sb2coJ/Cfjq8gQXJ0aWNsZVJlbmRlcuaUtuWIsOWtl+WPt+WPmOabtDonLCBmb250U2l6ZSk7XG4gICAgdGhpcy5zZXRTdHlsZSh0aGlzLmdldENTUygpKTtcbiAgfVxuXG4gIHVwZGF0ZVByaW1hcnlDb2xvcihjb2xvcjogc3RyaW5nKSB7XG4gICAgY29uc29sZS5sb2coJ/Cfjq8gQXJ0aWNsZVJlbmRlcuaUtuWIsOS4u+mimOiJsuWPmOabtDonLCBjb2xvcik7XG4gICAgdGhpcy5zZXRTdHlsZSh0aGlzLmdldENTUygpKTtcbiAgfVxuXG4gIHVwZGF0ZUN1c3RvbUNTUyhjc3M6IHN0cmluZykge1xuICAgIGNvbnNvbGUubG9nKCfwn46vIEFydGljbGVSZW5kZXLmlLbliLDoh6rlrprkuYlDU1Plj5jmm7QnKTtcbiAgICB0aGlzLnNldFN0eWxlKHRoaXMuZ2V0Q1NTKCkpO1xuICB9XG5cbiAgZ2V0RnJvbnRtYXR0ZXJWYWx1ZShmcm9udG1hdHRlcjogRnJvbnRNYXR0ZXJDYWNoZSwga2V5OiBzdHJpbmcpIHtcbiAgICBjb25zdCB2YWx1ZSA9IGZyb250bWF0dGVyW2tleV07XG5cbiAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgcmV0dXJuIHZhbHVlWzBdO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIGdldE1ldGFkYXRhKCkge1xuICAgIGxldCByZXM6IERyYWZ0QXJ0aWNsZSA9IHtcbiAgICAgIHRpdGxlOiAnJyxcbiAgICAgIGF1dGhvcjogdW5kZWZpbmVkLFxuICAgICAgZGlnZXN0OiB1bmRlZmluZWQsXG4gICAgICBjb250ZW50OiAnJyxcbiAgICAgIGNvbnRlbnRfc291cmNlX3VybDogdW5kZWZpbmVkLFxuICAgICAgY292ZXI6IHVuZGVmaW5lZCxcbiAgICAgIHRodW1iX21lZGlhX2lkOiAnJyxcbiAgICAgIG5lZWRfb3Blbl9jb21tZW50OiB1bmRlZmluZWQsXG4gICAgICBvbmx5X2ZhbnNfY2FuX2NvbW1lbnQ6IHVuZGVmaW5lZCxcbiAgICAgIHBpY19jcm9wXzIzNV8xOiB1bmRlZmluZWQsXG4gICAgICBwaWNfY3JvcF8xXzE6IHVuZGVmaW5lZCxcbiAgICAgIGFwcGlkOiB1bmRlZmluZWQsXG4gICAgICB0aGVtZTogdW5kZWZpbmVkLFxuICAgICAgaGlnaGxpZ2h0OiB1bmRlZmluZWQsXG4gICAgfVxuICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGlmICghZmlsZSkgcmV0dXJuIHJlcztcbiAgICBjb25zdCBtZXRhZGF0YSA9IHRoaXMuYXBwLm1ldGFkYXRhQ2FjaGUuZ2V0RmlsZUNhY2hlKGZpbGUpO1xuICAgIGlmIChtZXRhZGF0YT8uZnJvbnRtYXR0ZXIpIHtcbiAgICAgIGNvbnN0IGZyb250bWF0dGVyID0gbWV0YWRhdGEuZnJvbnRtYXR0ZXI7XG4gICAgICByZXMudGl0bGUgPSB0aGlzLmdldEZyb250bWF0dGVyVmFsdWUoZnJvbnRtYXR0ZXIsICd0aXRsZScpO1xuICAgICAgcmVzLmF1dGhvciA9IHRoaXMuZ2V0RnJvbnRtYXR0ZXJWYWx1ZShmcm9udG1hdHRlciwgJ2F1dGhvcicpO1xuICAgICAgcmVzLmRpZ2VzdCA9IHRoaXMuZ2V0RnJvbnRtYXR0ZXJWYWx1ZShmcm9udG1hdHRlciwgJ2RpZ2VzdCcpO1xuICAgICAgcmVzLmNvbnRlbnRfc291cmNlX3VybCA9IHRoaXMuZ2V0RnJvbnRtYXR0ZXJWYWx1ZShmcm9udG1hdHRlciwgJ2NvbnRlbnRfc291cmNlX3VybCcpO1xuICAgICAgcmVzLmNvdmVyID0gdGhpcy5nZXRGcm9udG1hdHRlclZhbHVlKGZyb250bWF0dGVyLCAnY292ZXInKTtcbiAgICAgIHJlcy50aHVtYl9tZWRpYV9pZCA9IHRoaXMuZ2V0RnJvbnRtYXR0ZXJWYWx1ZShmcm9udG1hdHRlciwgJ3RodW1iX21lZGlhX2lkJyk7XG4gICAgICByZXMubmVlZF9vcGVuX2NvbW1lbnQgPSBmcm9udG1hdHRlclsnbmVlZF9vcGVuX2NvbW1lbnQnXSA/IDEgOiB1bmRlZmluZWQ7XG4gICAgICByZXMub25seV9mYW5zX2Nhbl9jb21tZW50ID0gZnJvbnRtYXR0ZXJbJ29ubHlfZmFuc19jYW5fY29tbWVudCddID8gMSA6IHVuZGVmaW5lZDtcbiAgICAgIHJlcy5hcHBpZCA9IHRoaXMuZ2V0RnJvbnRtYXR0ZXJWYWx1ZShmcm9udG1hdHRlciwgJ2FwcGlkJyk7XG4gICAgICBpZiAocmVzLmFwcGlkICYmICFyZXMuYXBwaWQuc3RhcnRzV2l0aCgnd3gnKSkge1xuICAgICAgICByZXMuYXBwaWQgPSB0aGlzLnNldHRpbmdzLnd4SW5mby5maW5kKHd4ID0+IHd4Lm5hbWUgPT09IHJlcy5hcHBpZCk/LmFwcGlkO1xuICAgICAgfVxuICAgICAgcmVzLnRoZW1lID0gdGhpcy5nZXRGcm9udG1hdHRlclZhbHVlKGZyb250bWF0dGVyLCAndGhlbWUnKTtcbiAgICAgIHJlcy5oaWdobGlnaHQgPSB0aGlzLmdldEZyb250bWF0dGVyVmFsdWUoZnJvbnRtYXR0ZXIsICdoaWdobGlnaHQnKTtcbiAgICAgIGlmIChmcm9udG1hdHRlclsnY3JvcCddKSB7XG4gICAgICAgIHJlcy5waWNfY3JvcF8yMzVfMSA9ICcwXzBfMV8wLjUnO1xuICAgICAgICByZXMucGljX2Nyb3BfMV8xID0gJzBfMC41MjVfMC40MDRfMSc7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXM7XG4gIH1cblxuICBhc3luYyB1cGxvYWRWYXVsdENvdmVyKG5hbWU6IHN0cmluZywgdG9rZW46IHN0cmluZykge1xuICAgIGNvbnN0IExvY2FsRmlsZVJlZ2V4ID0gL14hXFxbXFxbKC4qPylcXF1cXF0vO1xuICAgIGNvbnN0IG1hdGNoZXMgPSBuYW1lLm1hdGNoKExvY2FsRmlsZVJlZ2V4KTtcbiAgICBsZXQgZmlsZU5hbWUgPSAnJztcbiAgICBpZiAobWF0Y2hlcyAmJiBtYXRjaGVzLmxlbmd0aCA+IDEpIHtcbiAgICAgIGZpbGVOYW1lID0gbWF0Y2hlc1sxXTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBmaWxlTmFtZSA9IG5hbWU7XG4gICAgfVxuICAgIC8vIENsYXVkZSBDb2RlIFVwZGF0ZVxuICAgIGNvbnN0IHZhdWx0ID0gdGhpcy5hcHAudmF1bHQ7XG4gICAgY29uc3QgZmlsZSA9IHRoaXMuYXNzZXRzTWFuYWdlci5zZWFyY2hGaWxlKGZpbGVOYW1lKTtcbiAgICAvLyDkvb/nlKggaW5zdGFuY2VvZiDmo4Dmn6XogIzpnZ7nsbvlnovmlq3oqIBcbiAgICBpZiAoIWZpbGUgfHwgIShmaWxlIGluc3RhbmNlb2YgVEZpbGUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ+aJvuS4jeWIsOWwgemdouaWh+S7tjogJyArIGZpbGVOYW1lKTtcbiAgICB9XG4gICAgY29uc3QgZmlsZURhdGEgPSBhd2FpdCB2YXVsdC5yZWFkQmluYXJ5KGZpbGUpO1xuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMudXBsb2FkQ292ZXIobmV3IEJsb2IoW2ZpbGVEYXRhXSksIGZpbGUubmFtZSwgdG9rZW4pO1xuICB9XG5cbiAgYXN5bmMgdXBsb2FkQ292ZXIoZGF0YTogQmxvYiwgZmlsZW5hbWU6IHN0cmluZywgdG9rZW46IHN0cmluZykge1xuICAgIGlmIChmaWxlbmFtZS50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKCcud2VicCcpKSB7XG4gICAgICBhd2FpdCBQcmVwYXJlSW1hZ2VMaWIoKTtcbiAgICAgIGlmIChJc0ltYWdlTGliUmVhZHkoKSkge1xuICAgICAgICBkYXRhID0gbmV3IEJsb2IoW1dlYnBUb0pQRyhhd2FpdCBkYXRhLmFycmF5QnVmZmVyKCkpXSk7XG4gICAgICAgIGZpbGVuYW1lID0gZmlsZW5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKCcud2VicCcsICcuanBnJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgcmVzID0gYXdhaXQgVXBsb2FkSW1hZ2VUb1d4KGRhdGEsIGZpbGVuYW1lLCB0b2tlbiwgJ2ltYWdlJyk7XG4gICAgaWYgKHJlcy5tZWRpYV9pZCkge1xuICAgICAgcmV0dXJuIHJlcy5tZWRpYV9pZDtcbiAgICB9XG4gICAgY29uc29sZS5lcnJvcigndXBsb2FkIGNvdmVyIGZhaWw6ICcgKyByZXMuZXJybXNnKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ+S4iuS8oOWwgemdouWksei0pTogJyArIHJlcy5lcnJtc2cpO1xuICB9XG5cbiAgLy8g5L2/55So5paw55qE5ZCO56uvQVBJ6I635Y+W6buY6K6k5bCB6Z2iXG4gIGFzeW5jIGdldERlZmF1bHRDb3Zlcih0b2tlbjogc3RyaW5nKSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIOehruS/neWuouaIt+err+W3suWIneWni+WMllxuICAgICAgaWYgKCF0aGlzLndlY2hhdENsaWVudCkge1xuICAgICAgICBpbml0QXBpQ2xpZW50cygpO1xuICAgICAgICB0aGlzLndlY2hhdENsaWVudCA9IGdldFdlY2hhdENsaWVudCgpO1xuICAgICAgfVxuICAgICAgXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHRoaXMud2VjaGF0Q2xpZW50LmdldE1lZGlhTGlzdCh7XG4gICAgICAgIGFjY2Vzc1Rva2VuOiB0b2tlbixcbiAgICAgICAgdHlwZTogJ2ltYWdlJyxcbiAgICAgICAgY291bnQ6IDEsXG4gICAgICAgIG9mZnNldDogMFxuICAgICAgfSk7XG4gICAgICBpZiAocmVzcG9uc2UuaXRlbV9jb3VudCAmJiByZXNwb25zZS5pdGVtX2NvdW50ID4gMCAmJiByZXNwb25zZS5pdGVtKSB7XG4gICAgICAgIC8vIOa3u+WKoOiwg+ivleS/oeaBr+afpeeci+e0oOadkOW6k+i/lOWbnueahFVSTOagvOW8j1xuICAgICAgICBjb25zb2xlLmxvZygn8J+UjSDntKDmnZDlupPov5Tlm57nmoTnrKzkuIDkuKrntKDmnZA6JywgcmVzcG9uc2UuaXRlbVswXSk7XG4gICAgICAgIHJldHVybiByZXNwb25zZS5pdGVtWzBdLm1lZGlhX2lkO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCfojrflj5bpu5jorqTlsIHpnaLlpLHotKU6JywgZXJyb3IpO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICAvLyBDbGF1ZGUgQ29kZSBVcGRhdGU6IOaUuei/m+mUmeivr+S/oeaBr++8jOaPkOS+m+abtOivpue7hueahOmUmeivr+aPj+i/sFxuICBhc3luYyBnZXRUb2tlbihhcHBpZDogc3RyaW5nKSB7XG4gICAgY29uc3Qgc2VjcmV0ID0gdGhpcy5nZXRTZWNyZXQoYXBwaWQpO1xuXG4gICAgLy8g5qOA5p+l5YWs5LyX5Y+36YWN572uXG4gICAgaWYgKCFzZWNyZXQgfHwgc2VjcmV0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCflhazkvJflj7dBcHBTZWNyZXTmnKrphY3nva7vvIzor7flnKjorr7nva7kuK3phY3nva7lhazkvJflj7fkv6Hmga8nKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgLy8g56Gu5L+d5a6i5oi356uv5bey5Yid5aeL5YyWXG4gICAgICBpZiAoIXRoaXMud2VjaGF0Q2xpZW50KSB7XG4gICAgICAgIGluaXRBcGlDbGllbnRzKCk7XG4gICAgICAgIHRoaXMud2VjaGF0Q2xpZW50ID0gZ2V0V2VjaGF0Q2xpZW50KCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy53ZWNoYXRDbGllbnQuYXV0aGVudGljYXRlKHtcbiAgICAgICAgYXBwSWQ6IGFwcGlkLFxuICAgICAgICBhcHBTZWNyZXQ6IHNlY3JldFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gcmVzcG9uc2UuYWNjZXNzX3Rva2VuO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBlcnJvck1zZyA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcblxuICAgICAgLy8gQ2xhdWRlIENvZGUgVXBkYXRlOiDmoLnmja7plJnor6/kv6Hmga/mj5Dkvpvmm7Tlj4vlpb3nmoTmj5DnpLrvvIxJUOmUmeivr+aXtuaYvuekuuWFt+S9k0lQXG4gICAgICBpZiAoZXJyb3JNc2cuaW5jbHVkZXMoJ0NPUlMnKSB8fCBlcnJvck1zZy5pbmNsdWRlcygnZmV0Y2gnKSB8fCBlcnJvck1zZy5pbmNsdWRlcygnRmFpbGVkIHRvIGZldGNoJykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfml6Dms5Xov57mjqXliLDmnI3liqHlmajvvIzor7fmo4Dmn6XnvZHnu5zov57mjqXmiJblkI7nq6/mnI3liqHmmK/lkKblkK/liqgnKTtcbiAgICAgIH0gZWxzZSBpZiAoZXJyb3JNc2cuaW5jbHVkZXMoJzQwMDAxJykgfHwgZXJyb3JNc2cuaW5jbHVkZXMoJ0FwcFNlY3JldCcpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQXBwU2VjcmV05peg5pWI77yM6K+35qOA5p+l5YWs5LyX5Y+36YWN572uJyk7XG4gICAgICB9IGVsc2UgaWYgKGVycm9yTXNnLmluY2x1ZGVzKCc0MDAxMycpIHx8IGVycm9yTXNnLmluY2x1ZGVzKCdBcHBJRCcpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQXBwSUTml6DmlYjvvIzor7fmo4Dmn6XlhazkvJflj7fphY3nva4nKTtcbiAgICAgIH0gZWxzZSBpZiAoZXJyb3JNc2cuaW5jbHVkZXMoJzQwMTY0JykgfHwgZXJyb3JNc2cuaW5jbHVkZXMoJ0lQJykgfHwgZXJyb3JNc2cuaW5jbHVkZXMoJ3doaXRlbGlzdCcpKSB7XG4gICAgICAgIC8vIOWwneivleS7jumUmeivr+S/oeaBr+S4reaPkOWPlklQ5Zyw5Z2AXG4gICAgICAgIGxldCBpcEFkZHJlc3MgPSAn5pyq55+lJztcbiAgICAgICAgLy8g5Yy56YWN5ZCE56eNSVDmoLzlvI/vvJppbnZhbGlkIGlwIDIyMy44Ny4yMTguOTgg5oiWIElQIDIyMy44Ny4yMTguOTgg5oiWIGlwOiAyMjMuODcuMjE4Ljk4XG4gICAgICAgIGNvbnN0IGlwTWF0Y2ggPSBlcnJvck1zZy5tYXRjaCgvKD86aW52YWxpZFxccytpcHxJUHxpcClbOlxcc10rKFxcZCtcXC5cXGQrXFwuXFxkK1xcLlxcZCspL2kpO1xuICAgICAgICBpZiAoaXBNYXRjaCkge1xuICAgICAgICAgIGlwQWRkcmVzcyA9IGlwTWF0Y2hbMV07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8g5bCd6K+V5Yy56YWN57qvSVDlnLDlnYBcbiAgICAgICAgICBjb25zdCBwdXJlSXBNYXRjaCA9IGVycm9yTXNnLm1hdGNoKC8oXFxkK1xcLlxcZCtcXC5cXGQrXFwuXFxkKykvKTtcbiAgICAgICAgICBpZiAocHVyZUlwTWF0Y2gpIHtcbiAgICAgICAgICAgIGlwQWRkcmVzcyA9IHB1cmVJcE1hdGNoWzFdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYElQ5Zyw5Z2AICR7aXBBZGRyZXNzfSDkuI3lnKjnmb3lkI3ljZXkuK3vvIzor7flnKjlvq7kv6HlhazkvJflubPlj7Dmt7vliqDmraRJUOWIsOeZveWQjeWNlWApO1xuICAgICAgfSBlbHNlIGlmIChlcnJvck1zZy5pbmNsdWRlcygndGltZW91dCcpIHx8IGVycm9yTXNnLmluY2x1ZGVzKCfotoXml7YnKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+ivt+axgui2heaXtu+8jOivt+ajgOafpee9kee7nOi/nuaOpScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUb2tlbuiOt+WPluWksei0pTogJyArIGVycm9yTXNnKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBDbGF1ZGUgQ29kZSBVcGRhdGU6IOenu+mZpGF1dGhLZXnmo4Dmn6Xms6jph4rlkoxjb3B5QXJ0aWNsZeiwg+eUqO+8jOS4iuS8oOWbvueJh+S4jeW6lOWkjeWItuWGheWuuVxuICBhc3luYyB1cGxvYWRJbWFnZXMoYXBwaWQ6IHN0cmluZykge1xuICAgIGxldCBtZXRhZGF0YSA9IHRoaXMuZ2V0TWV0YWRhdGEoKTtcbiAgICBpZiAobWV0YWRhdGEuYXBwaWQpIHtcbiAgICAgIGFwcGlkID0gbWV0YWRhdGEuYXBwaWQ7XG4gICAgfVxuXG4gICAgaWYgKCFhcHBpZCB8fCBhcHBpZC5sZW5ndGggPT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCfor7flhYjpgInmi6nlhazkvJflj7cnKTtcbiAgICB9XG5cbiAgICAvLyDojrflj5Z0b2tlblxuICAgIGNvbnN0IHRva2VuID0gYXdhaXQgdGhpcy5nZXRUb2tlbihhcHBpZCk7XG4gICAgaWYgKHRva2VuID09PSAnJykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGF3YWl0IHRoaXMuY2FjaGVkRWxlbWVudHNUb0ltYWdlcygpO1xuXG4gICAgY29uc3QgbG0gPSBMb2NhbEltYWdlTWFuYWdlci5nZXRJbnN0YW5jZSgpO1xuICAgIC8vIOS4iuS8oOWbvueJh1xuICAgIGF3YWl0IGxtLnVwbG9hZExvY2FsSW1hZ2UodG9rZW4sIHRoaXMuYXBwLnZhdWx0KTtcbiAgICAvLyDkuIrkvKDlm77luorlm77niYdcbiAgICBhd2FpdCBsbS51cGxvYWRSZW1vdGVJbWFnZSh0aGlzLmFydGljbGVEaXYsIHRva2VuKTtcbiAgICAvLyDmm7/mjaLlm77niYfpk77mjqVcbiAgICBsbS5yZXBsYWNlSW1hZ2VzKHRoaXMuYXJ0aWNsZURpdik7XG5cbiAgICAvLyBDbGF1ZGUgQ29kZSBSZW1vdmU6IOenu+mZpGNvcHlBcnRpY2xl6LCD55So77yM5LiK5Lyg5Zu+54mH5LiN5bqU6Ieq5Yqo5aSN5Yi25YaF5a65XG4gIH1cblxuICBhc3luYyBjb3B5QXJ0aWNsZSgpIHtcbiAgICBjb25zdCBodG1sQ29udGVudCA9IHRoaXMuZ2V0QXJ0aWNsZUNvbnRlbnQoKTtcbiAgICBjb25zdCBwbGFpblRleHQgPSB0aGlzLmdldEFydGljbGVUZXh0KCk7XG5cbiAgICBpZiAoIWh0bWxDb250ZW50KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ+aaguaXoOWPr+WkjeWItueahOWGheWuuScpO1xuICAgIH1cblxuICAgIC8vIOS8mOWFiOS9v+eUqEVsZWN0cm9u5Ymq6LS05p2/77yIT2JzaWRpYW7moYzpnaLnq6/ml6DpnIDnqpflj6PogZrnhKbmnYPpmZDvvIlcbiAgICB0cnkge1xuICAgICAgY29uc3QgdyA9IHdpbmRvdyBhcyBhbnk7XG4gICAgICBjb25zdCBlbGVjdHJvbiA9IHc/LnJlcXVpcmUgPyB3LnJlcXVpcmUoJ2VsZWN0cm9uJykgOiB1bmRlZmluZWQ7XG4gICAgICBjb25zdCBlbGVjdHJvbkNsaXBib2FyZCA9IGVsZWN0cm9uPy5jbGlwYm9hcmQ7XG4gICAgICBpZiAoZWxlY3Ryb25DbGlwYm9hcmQgJiYgdHlwZW9mIGVsZWN0cm9uQ2xpcGJvYXJkLndyaXRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGVsZWN0cm9uQ2xpcGJvYXJkLndyaXRlKHsgaHRtbDogaHRtbENvbnRlbnQsIHRleHQ6IHBsYWluVGV4dCB9KTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIC8vIOW/veeVpUVsZWN0cm9u5LiN5Y+v55So55qE5oOF5Ya177yM57un57ut6LWwV2ViIEFQSeaWueahiFxuICAgICAgY29uc29sZS53YXJuKCdFbGVjdHJvbuWJqui0tOadv+S4jeWPr+eUqO+8jOWwneivleS9v+eUqFdlYuWJqui0tOadv0FQSeOAgicpO1xuICAgIH1cblxuICAgIC8vIFdlYuWJqui0tOadv0FQSeaWueahiFxuICAgIGNvbnN0IGNsaXBib2FyZCA9IG5hdmlnYXRvci5jbGlwYm9hcmQ7XG4gICAgY29uc3QgY2FuVXNlQ2xpcGJvYXJkSXRlbSA9IHR5cGVvZiBDbGlwYm9hcmRJdGVtICE9PSAndW5kZWZpbmVkJztcblxuICAgIGlmIChjbGlwYm9hcmQgJiYgY2FuVXNlQ2xpcGJvYXJkSXRlbSAmJiB3aW5kb3cuaXNTZWN1cmVDb250ZXh0KSB7XG4gICAgICB0cnkge1xuICAgICAgICAvLyDoi6Xnqpflj6PmnKrogZrnhKbvvIzlsJ3or5XkuLvliqjogZrnhKZcbiAgICAgICAgaWYgKGRvY3VtZW50Lmhhc0ZvY3VzICYmICFkb2N1bWVudC5oYXNGb2N1cygpKSB7XG4gICAgICAgICAgd2luZG93LmZvY3VzKCk7XG4gICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UoKHIpID0+IHNldFRpbWVvdXQociwgMTIwKSk7XG4gICAgICAgIH1cblxuICAgICAgICBhd2FpdCBjbGlwYm9hcmQud3JpdGUoW1xuICAgICAgICAgIG5ldyBDbGlwYm9hcmRJdGVtKHtcbiAgICAgICAgICAgICd0ZXh0L2h0bWwnOiBuZXcgQmxvYihbaHRtbENvbnRlbnRdLCB7IHR5cGU6ICd0ZXh0L2h0bWwnIH0pLFxuICAgICAgICAgICAgJ3RleHQvcGxhaW4nOiBuZXcgQmxvYihbcGxhaW5UZXh0XSwgeyB0eXBlOiAndGV4dC9wbGFpbicgfSlcbiAgICAgICAgICB9KVxuICAgICAgICBdKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRE9NRXhjZXB0aW9uICYmIChlcnJvci5uYW1lID09PSAnTm90QWxsb3dlZEVycm9yJyB8fCBlcnJvci5uYW1lID09PSAnU2VjdXJpdHlFcnJvcicpKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdDbGlwYm9hcmQgQVBJ5pyq5o6I5p2D77yM5bCd6K+V5L2/55So5YW85a655qih5byP5aSN5Yi244CCJywgZXJyb3IpO1xuICAgICAgICB9IGVsc2UgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IgJiYgZXJyb3IubWVzc2FnZS5pbmNsdWRlcygnRG9jdW1lbnQgaXMgbm90IGZvY3VzZWQnKSkge1xuICAgICAgICAgIGNvbnNvbGUud2FybignQ2xpcGJvYXJkIEFQSeWboOWkseeEpuWksei0pe+8jOWwneivleS9v+eUqOWFvOWuueaooeW8j+WkjeWItuOAgicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUud2FybignQ2xpcGJvYXJkIEFQSeWkjeWItuWksei0pe+8jOWwneivleS9v+eUqOWFvOWuueaooeW8j+WkjeWItuOAgicsIGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLmNvcHlBcnRpY2xlV2l0aEV4ZWNDb21tYW5kKGh0bWxDb250ZW50LCBwbGFpblRleHQpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKCfliarotLTmnb/lpI3liLblpLHotKXvvJror7fnoa7orqRPYnNpZGlhbueql+WPo+WkhOS6jua0u+WKqOeKtuaAgeWQjumHjeivleOAgicpO1xuICB9XG5cbiAgcHJpdmF0ZSBjb3B5QXJ0aWNsZVdpdGhFeGVjQ29tbWFuZChodG1sQ29udGVudDogc3RyaW5nLCBwbGFpblRleHQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzZWxlY3Rpb24gPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCk7XG4gICAgICBpZiAoIXNlbGVjdGlvbikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgY29udGFpbmVyLmlubmVySFRNTCA9IGh0bWxDb250ZW50O1xuICAgICAgY29udGFpbmVyLmNvbnRlbnRFZGl0YWJsZSA9ICd0cnVlJztcbiAgICAgIGNvbnRhaW5lci5zdHlsZS5wb3NpdGlvbiA9ICdmaXhlZCc7XG4gICAgICBjb250YWluZXIuc3R5bGUubGVmdCA9ICctOTk5OXB4JztcbiAgICAgIGNvbnRhaW5lci5zdHlsZS50b3AgPSAnMCc7XG4gICAgICBjb250YWluZXIuc3R5bGUub3BhY2l0eSA9ICcwJztcbiAgICAgIGNvbnRhaW5lci5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgICAgY29udGFpbmVyLnN0eWxlLnVzZXJTZWxlY3QgPSAndGV4dCc7XG5cbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoY29udGFpbmVyKTtcblxuICAgICAgY29uc3QgcmFuZ2UgPSBkb2N1bWVudC5jcmVhdGVSYW5nZSgpO1xuICAgICAgcmFuZ2Uuc2VsZWN0Tm9kZUNvbnRlbnRzKGNvbnRhaW5lcik7XG5cbiAgICAgIHNlbGVjdGlvbi5yZW1vdmVBbGxSYW5nZXMoKTtcbiAgICAgIHNlbGVjdGlvbi5hZGRSYW5nZShyYW5nZSk7XG5cbiAgICAgIC8vIOehruS/neWGheWuueWuueWZqOiOt+W+l+eEpueCue+8jOaPkOWNh+WkjeWItuaIkOWKn+eOh1xuICAgICAgKGNvbnRhaW5lciBhcyBhbnkpLmZvY3VzPy4oKTtcblxuICAgICAgbGV0IHN1Y2Nlc3NmdWwgPSBkb2N1bWVudC5leGVjQ29tbWFuZCgnY29weScpO1xuXG4gICAgICBzZWxlY3Rpb24ucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGNvbnRhaW5lcik7XG5cbiAgICAgIGlmIChzdWNjZXNzZnVsKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB0ZXh0YXJlYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3RleHRhcmVhJyk7XG4gICAgICB0ZXh0YXJlYS52YWx1ZSA9IHBsYWluVGV4dDtcbiAgICAgIHRleHRhcmVhLnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgICAgIHRleHRhcmVhLnN0eWxlLmxlZnQgPSAnLTk5OTlweCc7XG4gICAgICB0ZXh0YXJlYS5zdHlsZS50b3AgPSAnMCc7XG4gICAgICB0ZXh0YXJlYS5zdHlsZS5vcGFjaXR5ID0gJzAnO1xuICAgICAgdGV4dGFyZWEuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcblxuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0ZXh0YXJlYSk7XG5cbiAgICAgIHRleHRhcmVhLnNlbGVjdCgpO1xuICAgICAgdGV4dGFyZWEuc2V0U2VsZWN0aW9uUmFuZ2UoMCwgdGV4dGFyZWEudmFsdWUubGVuZ3RoKTtcblxuICAgICAgc3VjY2Vzc2Z1bCA9IGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7XG5cbiAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQodGV4dGFyZWEpO1xuXG4gICAgICByZXR1cm4gc3VjY2Vzc2Z1bDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS53YXJuKCflhbzlrrnmqKHlvI/lpI3liLblpLHotKU6JywgZXJyb3IpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIGdldFNlY3JldChhcHBpZDogc3RyaW5nKSB7XG4gICAgZm9yIChjb25zdCB3eCBvZiB0aGlzLnNldHRpbmdzLnd4SW5mbykge1xuICAgICAgaWYgKHd4LmFwcGlkID09PSBhcHBpZCkge1xuICAgICAgICByZXR1cm4gd3guc2VjcmV0LnJlcGxhY2UoJ1NFQ1JFVCcsICcnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuICcnO1xuICB9XG5cbiAgLy8g566A5YyW54mI5pys77yM56e76Zmk5aSN5p2C55qE5Zu+54mH566h55CG6YC76L6R77yM5Zu+54mH5LiK5Lyg5bey56e76Iezbm90ZS1wcmV2aWV3LnRzXG4gIC8vIOatpOaWueazleW3suW6n+W8g++8jOivt+S9v+eUqG5vdGUtcHJldmlldy50c+S4reeahHVwbG9hZEltYWdlc0FuZENyZWF0ZURyYWZ05pa55rOVXG4gIGFzeW5jIHBvc3RBcnRpY2xlKGFwcGlkOnN0cmluZywgbG9jYWxDb3ZlcjogRmlsZSB8IG51bGwgPSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCfmraTmlrnms5Xlt7Llup/lvIPvvIzor7fkvb/nlKhub3RlLXByZXZpZXcudHPkuK3nmoTmlrDosIPnlKjpk74nKTtcbiAgfVxuXG4gIC8vIENsYXVkZSBDb2RlIFVwZGF0ZTog56e76ZmkYXV0aEtleeajgOafpeazqOmHilxuICBhc3luYyBwb3N0SW1hZ2VzKGFwcGlkOiBzdHJpbmcpIHtcbiAgICBsZXQgbWV0YWRhdGEgPSB0aGlzLmdldE1ldGFkYXRhKCk7XG4gICAgaWYgKG1ldGFkYXRhLmFwcGlkKSB7XG4gICAgICBhcHBpZCA9IG1ldGFkYXRhLmFwcGlkO1xuICAgIH1cblxuICAgIGlmICghYXBwaWQgfHwgYXBwaWQubGVuZ3RoID09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcign6K+35YWI6YCJ5oup5YWs5LyX5Y+3Jyk7XG4gICAgfVxuXG4gICAgLy8g6I635Y+WdG9rZW5cbiAgICBjb25zdCB0b2tlbiA9IGF3YWl0IHRoaXMuZ2V0VG9rZW4oYXBwaWQpO1xuICAgIGlmICh0b2tlbiA9PT0gJycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcign6I635Y+WdG9rZW7lpLHotKUs6K+35qOA5p+l572R57uc6ZO+5o6lIScpO1xuICAgIH1cblxuICAgIGNvbnN0IGltYWdlTGlzdDogRHJhZnRJbWFnZU1lZGlhSWRbXSA9IFtdO1xuICAgIGNvbnN0IGxtID0gTG9jYWxJbWFnZU1hbmFnZXIuZ2V0SW5zdGFuY2UoKTtcbiAgICAvLyDkuIrkvKDlm77niYdcbiAgICBhd2FpdCBsbS51cGxvYWRMb2NhbEltYWdlKHRva2VuLCB0aGlzLmFwcC52YXVsdCwgJ2ltYWdlJyk7XG4gICAgLy8g5LiK5Lyg5Zu+5bqK5Zu+54mHXG4gICAgYXdhaXQgbG0udXBsb2FkUmVtb3RlSW1hZ2UodGhpcy5hcnRpY2xlRGl2LCB0b2tlbiwgJ2ltYWdlJyk7XG5cbiAgICBjb25zdCBpbWFnZXMgPSBsbS5nZXRJbWFnZUluZm9zKHRoaXMuYXJ0aWNsZURpdik7XG4gICAgZm9yIChjb25zdCBpbWFnZSBvZiBpbWFnZXMpIHtcbiAgICAgIGlmICghaW1hZ2UubWVkaWFfaWQpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdtaXNzIG1lZGlhIGlkOicsIGltYWdlLnJlc1VybCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaW1hZ2VMaXN0LnB1c2goe1xuICAgICAgICBpbWFnZV9tZWRpYV9pZDogaW1hZ2UubWVkaWFfaWQsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAoaW1hZ2VMaXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCfmsqHmnInlm77niYfpnIDopoHlj5HluIMhJyk7XG4gICAgfVxuXG4gICAgY29uc3QgY29udGVudCA9IHRoaXMuZ2V0QXJ0aWNsZVRleHQoKTtcblxuICAgIGNvbnN0IGltYWdlc0RhdGE6IERyYWZ0SW1hZ2VzID0ge1xuICAgICAgYXJ0aWNsZV90eXBlOiAnbmV3c3BpYycsXG4gICAgICB0aXRsZTogbWV0YWRhdGEudGl0bGUgfHwgdGhpcy50aXRsZSxcbiAgICAgIGNvbnRlbnQ6IGNvbnRlbnQsXG4gICAgICBuZWVkX29wZW5fY29tbW5ldDogbWV0YWRhdGEubmVlZF9vcGVuX2NvbW1lbnQgfHwgMCxcbiAgICAgIG9ubHlfZmFuc19jYW5fY29tbWVudDogbWV0YWRhdGEub25seV9mYW5zX2Nhbl9jb21tZW50IHx8IDAsXG4gICAgICBpbWFnZV9pbmZvOiB7XG4gICAgICAgIGltYWdlX2xpc3Q6IGltYWdlTGlzdCxcbiAgICAgIH1cbiAgICB9XG4gICAgLy8g5L2/55So5paw55qE5ZCO56uvQVBJ5Yib5bu65Zu+54mH6I2J56i/XG4gICAgdHJ5IHtcbiAgICAgIC8vIOehruS/neWuouaIt+err+W3suWIneWni+WMllxuICAgICAgaWYgKCF0aGlzLndlY2hhdENsaWVudCkge1xuICAgICAgICBpbml0QXBpQ2xpZW50cygpO1xuICAgICAgICB0aGlzLndlY2hhdENsaWVudCA9IGdldFdlY2hhdENsaWVudCgpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyDovazmjaLkuLrmlrBBUEnpnIDopoHnmoTmoLzlvI9cbiAgICAgIGNvbnN0IG5ld0FwaUFydGljbGUgPSB7XG4gICAgICAgIHRpdGxlOiBpbWFnZXNEYXRhLnRpdGxlLFxuICAgICAgICBjb250ZW50OiBpbWFnZXNEYXRhLmNvbnRlbnQsXG4gICAgICAgIGF1dGhvcjogJycsXG4gICAgICAgIGRpZ2VzdDogJycsXG4gICAgICAgIGNvbnRlbnRfc291cmNlX3VybDogJycsXG4gICAgICAgIHRodW1iX21lZGlhX2lkOiBpbWFnZUxpc3QubGVuZ3RoID4gMCA/IGltYWdlTGlzdFswXS5pbWFnZV9tZWRpYV9pZCA6ICcnLFxuICAgICAgICBzaG93X2NvdmVyX3BpYzogdHJ1ZSxcbiAgICAgICAgbmVlZF9vcGVuX2NvbW1lbnQ6IGltYWdlc0RhdGEubmVlZF9vcGVuX2NvbW1uZXQgPT09IDEsXG4gICAgICAgIG9ubHlfZmFuc19jYW5fY29tbWVudDogaW1hZ2VzRGF0YS5vbmx5X2ZhbnNfY2FuX2NvbW1lbnQgPT09IDFcbiAgICAgIH07XG4gICAgICBcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgdGhpcy53ZWNoYXRDbGllbnQuY3JlYXRlRHJhZnQoW25ld0FwaUFydGljbGVdLCB0b2tlbik7XG4gICAgICBcbiAgICAgIGlmIChyZXNwb25zZS5tZWRpYV9pZCkge1xuICAgICAgICByZXR1cm4gcmVzcG9uc2UubWVkaWFfaWQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlKSk7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcign5Y+R5biD5aSx6LSlIScgKyByZXNwb25zZS5lcnJtc2cpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihg5Yib5bu65Zu+54mHL+aWh+Wtl+Wksei0pTogJHsoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2V977yBYCk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgZXhwb3J0SFRNTCgpIHtcbiAgICBhd2FpdCB0aGlzLmNhY2hlZEVsZW1lbnRzVG9JbWFnZXMoKTtcbiAgICBjb25zdCBsbSA9IExvY2FsSW1hZ2VNYW5hZ2VyLmdldEluc3RhbmNlKCk7XG4gICAgY29uc3QgY29udGVudCA9IGF3YWl0IGxtLmVtYmxlSW1hZ2VzKHRoaXMuYXJ0aWNsZURpdiwgdGhpcy5hcHAudmF1bHQpO1xuICAgIGNvbnN0IGdsb2JhbFN0eWxlID0gYXdhaXQgdGhpcy5hc3NldHNNYW5hZ2VyLmdldFN0eWxlKCk7XG4gICAgY29uc3QgaHRtbCA9IGFwcGx5Q1NTKGNvbnRlbnQsIHRoaXMuZ2V0Q1NTKCkgKyBnbG9iYWxTdHlsZSk7XG4gICAgY29uc3QgYmxvYiA9IG5ldyBCbG9iKFtodG1sXSwgeyB0eXBlOiAndGV4dC9odG1sJyB9KTtcbiAgICBjb25zdCB1cmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xuICAgIGNvbnN0IGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgYS5ocmVmID0gdXJsO1xuICAgIGEuZG93bmxvYWQgPSB0aGlzLnRpdGxlICsgJy5odG1sJztcbiAgICBhLmNsaWNrKCk7XG4gICAgVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xuICAgIGEucmVtb3ZlKCk7XG4gIH1cblxuICBhc3luYyBwcm9jZXNzQ2FjaGVkRWxlbWVudHMoKSB7XG4gICAgY29uc3QgYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgIGlmICghYWYpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ+W9k+WJjeayoeacieaJk+W8gOaWh+S7tu+8jOaXoOazleWkhOeQhue8k+WtmOWFg+e0oCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiB0aGlzLmNhY2hlZEVsZW1lbnRzKSB7XG4gICAgICBjb25zdCBbY2F0ZWdvcnksIGlkXSA9IGtleS5zcGxpdCgnOicpO1xuICAgICAgaWYgKGNhdGVnb3J5ID09PSAnbWVybWFpZCcpIHtcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gdGhpcy5hcnRpY2xlRGl2LnF1ZXJ5U2VsZWN0b3IoJyMnICsgaWQpIGFzIEhUTUxFbGVtZW50O1xuICAgICAgICBpZiAoY29udGFpbmVyKSB7XG4gICAgICAgICAgYXdhaXQgTWFya2Rvd25SZW5kZXJlci5yZW5kZXIodGhpcy5hcHAsIHZhbHVlLCBjb250YWluZXIsIGFmLnBhdGgsIHRoaXMuaXRlbVZpZXcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgY2FjaGVkRWxlbWVudHNUb0ltYWdlcygpIHtcbiAgICBmb3IgKGNvbnN0IFtrZXksIGNhY2hlZF0gb2YgdGhpcy5jYWNoZWRFbGVtZW50cykge1xuICAgICAgY29uc3QgW2NhdGVnb3J5LCBlbGVtZW50SWRdID0ga2V5LnNwbGl0KCc6Jyk7XG4gICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLmFydGljbGVEaXYucXVlcnlTZWxlY3RvcihgIyR7ZWxlbWVudElkfWApIGFzIEhUTUxFbGVtZW50O1xuICAgICAgaWYgKCFjb250YWluZXIpIGNvbnRpbnVlO1xuXG4gICAgICBpZiAoY2F0ZWdvcnkgPT09ICdtZXJtYWlkJykge1xuICAgICAgICBhd2FpdCB0aGlzLnJlcGxhY2VNZXJtYWlkV2l0aEltYWdlKGNvbnRhaW5lciwgZWxlbWVudElkKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlcGxhY2VNZXJtYWlkV2l0aEltYWdlKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIGlkOiBzdHJpbmcpIHtcbiAgICBjb25zdCBtZXJtYWlkQ29udGFpbmVyID0gY29udGFpbmVyLnF1ZXJ5U2VsZWN0b3IoJy5tZXJtYWlkJykgYXMgSFRNTEVsZW1lbnQ7XG4gICAgaWYgKCFtZXJtYWlkQ29udGFpbmVyIHx8ICFtZXJtYWlkQ29udGFpbmVyLmNoaWxkcmVuLmxlbmd0aCkgcmV0dXJuO1xuXG4gICAgY29uc3Qgc3ZnID0gbWVybWFpZENvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCdzdmcnKTtcbiAgICBpZiAoIXN2ZykgcmV0dXJuO1xuXG4gICAgLy8gQ2xhdWRlIENvZGUgVXBkYXRlOiDkv53nlZlNZXJtYWlk5Zu+5YOP5bC65a+455qE5YaF6IGU5qC35byP77yI5Yqo5oCB6K6h566X5YC877yJXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBuZ0RhdGFVcmwgPSBhd2FpdCB0b1BuZyhtZXJtYWlkQ29udGFpbmVyLmZpcnN0RWxlbWVudENoaWxkIGFzIEhUTUxFbGVtZW50LCB7IHBpeGVsUmF0aW86IDIgfSk7XG4gICAgICBjb25zdCBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbWcnKTtcbiAgICAgIGltZy5pZCA9IGBpbWctJHtpZH1gO1xuICAgICAgaW1nLnNyYyA9IHBuZ0RhdGFVcmw7XG4gICAgICAvLyBNZXJtYWlk5Zu+5YOP5a695bqm6ZyA6KaB5Z+65LqOU1ZH5Yqo5oCB6K6h566X77yM5L+d55WZ5YaF6IGU5qC35byPXG4gICAgICBpbWcuc3R5bGUud2lkdGggPSBgJHtzdmcuY2xpZW50V2lkdGh9cHhgO1xuICAgICAgaW1nLnN0eWxlLmhlaWdodCA9ICdhdXRvJztcblxuICAgICAgY29udGFpbmVyLnJlcGxhY2VDaGlsZChpbWcsIG1lcm1haWRDb250YWluZXIpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLndhcm4oYEZhaWxlZCB0byByZW5kZXIgTWVybWFpZCBkaWFncmFtOiAke2lkfWAsIGVycm9yKTtcbiAgICB9XG4gIH1cblxuXG4gIHVwZGF0ZUVsZW1lbnRCeUlEKGlkOiBzdHJpbmcsIGh0bWw6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGl0ZW0gPSB0aGlzLmFydGljbGVEaXYucXVlcnlTZWxlY3RvcignIycgKyBpZCkgYXMgSFRNTEVsZW1lbnQ7XG4gICAgaWYgKCFpdGVtKSByZXR1cm47XG4gICAgY29uc3QgZG9jID0gc2FuaXRpemVIVE1MVG9Eb20oaHRtbCk7XG4gICAgaXRlbS5lbXB0eSgpO1xuICAgIGlmIChkb2MuY2hpbGRFbGVtZW50Q291bnQgPiAwKSB7XG4gICAgICBmb3IgKGNvbnN0IGNoaWxkIG9mIGRvYy5jaGlsZHJlbikge1xuICAgICAgICBpdGVtLmFwcGVuZENoaWxkKGNoaWxkLmNsb25lTm9kZSh0cnVlKSk7IC8vIOS9v+eUqCBjbG9uZU5vZGUg5aSN5Yi26IqC54K55Lul6YG/5YWN56e75Yqo5a6DXG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgaXRlbS5pbm5lclRleHQgPSAn5riy5p+T5aSx6LSlJztcbiAgICB9XG4gIH1cblxuICBjYWNoZUVsZW1lbnQoY2F0ZWdvcnk6IHN0cmluZywgaWQ6IHN0cmluZywgZGF0YTogc3RyaW5nKTogdm9pZCB7XG4gICAgY29uc3Qga2V5ID0gY2F0ZWdvcnkgKyAnOicgKyBpZDtcbiAgICB0aGlzLmNhY2hlZEVsZW1lbnRzLnNldChrZXksIGRhdGEpO1xuICB9XG59XG4iXX0=