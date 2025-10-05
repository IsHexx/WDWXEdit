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
// 预览控制器，负责核心业务逻辑
import { TFile, Notice } from 'obsidian';
import { WxSettings } from '../../core/settings';
import AssetsManager from '../../core/assets';
import { LocalImageManager, LocalFile } from '../../services/renderer/markdown/local-file';
import { CardDataManager } from '../../services/renderer/markdown/code';
import { ArticleRender } from '../../services/renderer/article-render';
import { StyleEditor } from '../components/style-editor';
import { PreviewToolbar } from '../components/preview-toolbar';
import { PreviewContent } from '../components/preview-content';
import { PreviewStatus } from '../components/preview-status';
/**
 * 预览控制器 - 负责核心业务逻辑和组件协调
 */
export class PreviewController {
    constructor(app, view, plugin) {
        this.listeners = [];
        // 渲染相关
        this._articleRender = null;
        this.cachedElements = new Map();
        this.isCancelUpload = false;
        this.isBatchRuning = false;
        this.backendAvailable = null;
        this.lastBackendNoticeAt = 0;
        this.lastBackendFailureAt = 0;
        this.app = app;
        this.view = view;
        this.plugin = plugin;
        this.settings = WxSettings.getInstance();
        this.assetsManager = AssetsManager.getInstance();
        this.currentTheme = this.settings.defaultStyle;
        this.currentHighlight = this.settings.defaultHighlight;
        this.initializeStyleEditor();
    }
    initializeStyleEditor() {
        this.styleEditor = new StyleEditor(this.settings, this.assetsManager, {
            onThemeChanged: (theme) => {
                this.currentTheme = theme;
                this.render.updateStyle(theme);
            },
            onHighlightChanged: (highlight) => {
                this.currentHighlight = highlight;
                this.render.updateHighLight(highlight);
            },
            onStyleReset: () => {
                var _a;
                // Claude Code Update: 重置所有样式到默认值
                // 重置主题和高亮
                this.currentTheme = this.settings.defaultStyle;
                this.currentHighlight = this.settings.defaultHighlight;
                this.render.updateStyle(this.currentTheme);
                this.render.updateHighLight(this.currentHighlight);
                // Claude Code Update: 重置字体、字号、主题色到新默认值
                const defaultFont = 'sans-serif';
                const defaultFontSize = '16px';
                const defaultPrimaryColor = '#2d3748';
                const defaultCustomCSS = '';
                this.render.updateFont(defaultFont);
                this.render.updateFontSize(defaultFontSize);
                this.render.updatePrimaryColor(defaultPrimaryColor);
                this.render.updateCustomCSS(defaultCustomCSS);
                // 更新样式编辑器UI显示
                (_a = this.styleEditor) === null || _a === void 0 ? void 0 : _a.updateSelections(this.currentTheme, this.currentHighlight, defaultFont, defaultFontSize, defaultPrimaryColor, defaultCustomCSS);
            },
            onFontChanged: (fontFamily) => {
                this.render.updateFont(fontFamily);
            },
            onFontSizeChanged: (fontSize) => {
                this.render.updateFontSize(fontSize);
            },
            onPrimaryColorChanged: (color) => {
                this.render.updatePrimaryColor(color);
            },
            onCustomCSSChanged: (css) => {
                this.render.updateCustomCSS(css);
            }
        });
    }
    get render() {
        if (!this._articleRender) {
            const contentElements = this.content.getElements();
            this._articleRender = new ArticleRender(this.app, this.view, contentElements.styleEl, contentElements.articleDiv);
            this._articleRender.currentTheme = this.currentTheme;
            this._articleRender.currentHighlight = this.currentHighlight;
        }
        return this._articleRender;
    }
    async initialize() {
        if (!this.settings.isLoaded) {
            const data = await this.plugin.loadData();
            WxSettings.loadSettings(data);
        }
        if (!this.assetsManager.isLoaded) {
            await this.assetsManager.loadAssets();
        }
        await this.buildUI();
        this.setupEventListeners();
        await this.renderMarkdown();
    }
    async buildUI() {
        const container = this.view.getContainer();
        container.empty();
        const mainDiv = container.createDiv({ cls: 'note-preview' });
        // 创建组件
        this.toolbar = new PreviewToolbar(mainDiv, this.settings, this.styleEditor, this.getToolbarHandlers());
        this.content = new PreviewContent(mainDiv);
        await this.toolbar.build();
        this.status = new PreviewStatus(this.toolbar.getElement());
        this.content.build();
    }
    getToolbarHandlers() {
        return {
            onAppIdChanged: (appId) => {
                this.currentAppId = appId;
                this.cleanArticleData();
                // this.rebuildToolbar();
            },
            onRefresh: async () => {
                // 重新构建工具栏以反映最新设置
                this.rebuildToolbar();
                await this.assetsManager.loadCustomCSS();
                this.render.reloadStyle();
                await this.renderMarkdown();
            },
            onCopy: async () => {
                const result = await this.copyWithImageUpload();
                if (result === null || result === void 0 ? void 0 : result.uploaded) {
                    new Notice('复制成功，图片已上传到微信服务器，请到公众号编辑器粘贴。');
                }
                else {
                    // 根据原因给出更准确的提示
                    if ((result === null || result === void 0 ? void 0 : result.reason) === 'no-appid') {
                        new Notice('复制成功，未配置公众号，图片未上传。');
                    }
                    else if ((result === null || result === void 0 ? void 0 : result.reason) === 'backend' || (result === null || result === void 0 ? void 0 : result.reason) === 'token') {
                        new Notice('复制成功，仅复制内容，未上传图片（后端未连接或认证失败）。');
                    }
                    else {
                        new Notice('复制成功，仅复制内容，未上传图片。');
                    }
                }
            },
            onPost: async () => {
                await this.postArticle();
            },
            onUpload: async () => {
                await this.uploadImages();
            }
        };
    }
    setupEventListeners() {
        this.listeners = [
            this.app.workspace.on('file-open', () => {
                this.update();
            }),
            this.app.vault.on("modify", (file) => {
                var _a;
                if (((_a = this.currentFile) === null || _a === void 0 ? void 0 : _a.path) == file.path) {
                    this.renderMarkdown();
                }
            })
        ];
    }
    cleanup() {
        var _a;
        (_a = this.listeners) === null || _a === void 0 ? void 0 : _a.forEach(listener => this.app.workspace.offref(listener));
        LocalFile.fileCache.clear();
    }
    // 刷新控制器，重新构建工具栏和内容
    async onRefresh() {
        try {
            this.status.showInfo('正在刷新...');
            // 重新构建工具栏以反映最新设置
            this.rebuildToolbar();
            // 重新加载资源和内容
            await this.assetsManager.loadAssets();
            await this.assetsManager.loadCustomCSS();
            await this.renderMarkdown(null);
            this.status.showSuccess('刷新完成');
        }
        catch (error) {
            this.status.showError(`刷新失败: ${error.message}`);
        }
    }
    // 重新构建工具栏以反映设置变更
    rebuildToolbar() {
        if (this.toolbar && typeof this.toolbar.refresh === 'function') {
            this.toolbar.refresh();
        }
    }
    async update() {
        if (this.isBatchRuning) {
            return;
        }
        this.cleanArticleData();
        this.renderMarkdown();
    }
    cleanArticleData() {
        LocalImageManager.getInstance().cleanup();
        CardDataManager.getInstance().cleanup();
    }
    showLoading(msg, cancelable = false) {
        this.status.showInfo(msg);
    }
    showMsg(msg) {
        if (msg.includes('成功')) {
            this.status.showSuccess(msg);
        }
        else if (msg.includes('失败') || msg.includes('错误')) {
            this.status.showError(msg);
        }
        else if (msg.includes('警告')) {
            this.status.showWarning(msg);
        }
        else {
            this.status.showInfo(msg);
        }
    }
    async renderMarkdown(af = null) {
        if (!af) {
            af = this.app.workspace.getActiveFile();
        }
        if (!af || af.extension.toLocaleLowerCase() !== 'md') {
            return;
        }
        this.currentFile = af;
        await this.render.renderMarkdown(af);
        const metadata = this.render.getMetadata();
        this.toolbar.updateFromMetadata(metadata, this.currentTheme, this.currentHighlight);
    }
    // Claude Code Update: 改进错误提示，针对不同错误给出具体信息
    async uploadImages() {
        // 先检查是否选择了公众号
        if (!this.currentAppId) {
            this.status.showWarning('请先选择公众号', 3000);
            return;
        }
        if (this.backendAvailable === false) {
            const now = Date.now();
            if (now - this.lastBackendFailureAt < 5000) {
                this.status.showError('后端服务未启动，无法上传图片。', 4000);
                new Notice('未检测到后端服务，请先启动后端后再试。');
                return;
            }
            this.backendAvailable = null;
        }
        this.status.showUploading('图片上传中...');
        try {
            await this.render.uploadImages(this.currentAppId);
            this.backendAvailable = true;
            this.status.showSuccess('图片上传成功，图片链接已更新', 3000);
        }
        catch (error) {
            console.error('图片上传失败:', error);
            this.notifyBackendUnavailable(error);
            // Claude Code Update: 根据错误类型给出具体提示，不再fallback复制
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('请先选择公众号')) {
                this.status.showWarning('请先选择公众号', 3000);
            }
            else if (errorMessage.includes('token') || errorMessage.includes('Token') || errorMessage.includes('认证')) {
                this.status.showError('Token获取失败，图片未上传。请检查公众号配置', 5000);
            }
            else if (errorMessage.includes('上传') || errorMessage.includes('upload')) {
                this.status.showError('图片上传过程出错：' + errorMessage, 5000);
            }
            else {
                this.status.showError('图片上传失败：' + errorMessage, 5000);
            }
        }
    }
    async postArticle() {
        const localCover = this.toolbar.getCoverFile();
        if (this.toolbar.isUsingLocalCover() && !localCover) {
            this.status.showWarning('请选择封面文件');
            return;
        }
        if (!this.currentAppId) {
            this.status.showWarning('请先选择公众号');
            return;
        }
        if (this.backendAvailable === false) {
            const now = Date.now();
            if (now - this.lastBackendFailureAt < 5000) {
                this.status.showError('后端服务未启动，暂无法发草稿。', 4000);
                new Notice('未检测到后端服务，请先启动后端后再试。');
                return;
            }
            this.backendAvailable = null;
        }
        this.status.showProcessing('发布中...');
        try {
            await this.uploadImagesAndCreateDraft(this.currentAppId, localCover);
            this.backendAvailable = true;
            this.status.showSuccess('发布成功', 3000);
        }
        catch (error) {
            console.error('发布失败:', error);
            this.notifyBackendUnavailable(error);
            // Claude Code Update: 根据错误类型给出具体提示
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('token') || errorMessage.includes('Token') || errorMessage.includes('认证')) {
                this.status.showError('Token获取失败，发布失败。请检查公众号配置', 5000);
            }
            else if (errorMessage.includes('上传') || errorMessage.includes('upload')) {
                this.status.showError('图片上传过程出错：' + errorMessage, 5000);
            }
            else if (errorMessage.includes('草稿') || errorMessage.includes('draft')) {
                this.status.showError('创建草稿失败：' + errorMessage, 5000);
            }
            else {
                this.status.showError('发布失败：' + errorMessage, 5000);
            }
            // 确保内容仍能复制
            try {
                await this.copyWithoutImageUpload();
            }
            catch (copyError) {
                console.error('降级复制也失败:', copyError);
                this.status.showError('复制失败，请重试');
            }
        }
    }
    // Claude Code Update: 改进错误提示
    async copyWithImageUpload() {
        // 检查是否有公众号配置
        if (!this.currentAppId) {
            this.status.showWarning('请先选择公众号', 3000);
            await this.copyWithoutImageUpload();
            return { uploaded: false, reason: 'no-appid' };
        }
        if (this.backendAvailable === false) {
            const now = Date.now();
            if (now - this.lastBackendFailureAt < 5000) {
                this.status.showWarning('后端服务未启动，直接复制本地内容。', 4000);
                await this.copyWithoutImageUpload();
                return { uploaded: false, reason: 'backend' };
            }
            this.backendAvailable = null;
        }
        // 先获取令牌
        this.status.showProcessing('正在获取微信访问令牌...');
        // 尝试获取token，如果失败也能复制
        let token;
        try {
            token = await this.render.getToken(this.currentAppId);
            this.backendAvailable = true;
        }
        catch (error) {
            console.error('Token获取失败:', error);
            const message = error instanceof Error ? error.message : String(error);
            this.status.showError(message || '无法获取访问令牌', 5000);
            this.notifyBackendUnavailable(error, { suppressNotice: true });
            await this.copyWithoutImageUpload();
            return { uploaded: false, reason: 'token' };
        }
        if (!token) {
            this.status.showError('Token获取失败，图片未上传到公众号', 5000);
            await this.copyWithoutImageUpload();
            return { uploaded: false, reason: 'token' };
        }
        this.status.showProcessing('处理图片...');
        this.status.showUploading('检测本地图片...');
        const lm = LocalImageManager.getInstance();
        const imageKeys = Array.from(lm.images.keys());
        const localImages = imageKeys.filter(key => {
            const image = lm.images.get(key);
            return image && image.url == null && image.filePath;
        });
        let didUpload = false;
        if (localImages.length > 0) {
            // 更新import路径
            const { initApiClients, getWechatClient } = await import('../../services/api');
            if (!getWechatClient()) {
                initApiClients();
            }
            const wechatClient = getWechatClient();
            this.status.showUploading(`上传图片中... (0/${localImages.length})`);
            for (let i = 0; i < localImages.length; i++) {
                const imageKey = localImages[i];
                const imageInfo = lm.images.get(imageKey);
                if (!imageInfo || !imageInfo.filePath)
                    continue;
                this.status.showUploading(`上传图片中... (${i + 1}/${localImages.length})`);
                try {
                    const file = this.app.vault.getFileByPath(imageInfo.filePath);
                    if (!file) {
                        console.warn('图片文件不存在:', imageInfo.filePath);
                        continue;
                    }
                    const fileData = await this.app.vault.readBinary(file);
                    const base64Data = this.arrayBufferToBase64(fileData);
                    const smartFileName = await this.generateSmartImageName(imageInfo.filePath, i);
                    const uploadRes = await wechatClient.uploadMedia({
                        mediaData: base64Data,
                        filename: smartFileName,
                        accessToken: token,
                        mediaType: 'image',
                        storageType: 'permanent'
                    });
                    if (uploadRes.errcode === 0 && uploadRes.media_id) {
                        const mediaId = uploadRes.media_id;
                        imageInfo.url = uploadRes.url || `https://mmbiz.qlogo.cn/mmbiz_png/${mediaId}/0?wx_fmt=png`;
                        imageInfo.media_id = mediaId;
                        didUpload = true;
                    }
                }
                catch (error) {
                    console.error(`图片处理失败: ${imageInfo.filePath}`, error);
                    this.notifyBackendUnavailable(error, { suppressNotice: true });
                    // 图片上传失败时不中断复制流程，继续处理下一张图片
                }
            }
            this.status.showProcessing('替换图片链接...');
            lm.replaceImages(this.content.getElements().articleDiv);
        }
        this.status.showCopying('复制到剪贴板...');
        try {
            if (document.hasFocus && !document.hasFocus()) {
                window.focus();
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            await this.render.copyArticle();
            if (didUpload) {
                this.status.showSuccess('复制成功，图片已上传到微信服务器', 2000);
            }
            else {
                this.status.showSuccess('复制成功', 2000);
            }
        }
        catch (error) {
            console.error('剪贴板复制失败:', error);
            try {
                await this.fallbackCopyToClipboard();
                if (didUpload) {
                    this.status.showSuccess('复制成功，图片已上传到微信服务器', 2000);
                }
                else {
                    this.status.showSuccess('复制成功', 2000);
                }
            }
            catch (fallbackError) {
                console.error('降级复制失败:', fallbackError);
                this.status.hideMessage();
                throw new Error('复制失败：请确保浏览器窗口处于活动状态，然后重试');
            }
        }
        return { uploaded: didUpload, reason: 'none' };
    }
    // V2风格的图片上传和草稿创建
    async uploadImagesAndCreateDraft(appid, localCover = null) {
        var _a;
        // 更新import路径
        const { initApiClients, getWechatClient } = await import('../../services/api');
        if (!getWechatClient()) {
            initApiClients();
        }
        const wechatClient = getWechatClient();
        // Claude Code Update: 改进Token错误提示
        this.status.showProcessing('获取认证信息...');
        const token = await this.render.getToken(appid);
        if (!token) {
            throw new Error('Token获取失败，请检查公众号配置');
        }
        this.status.showProcessing('检查草稿状态...');
        const draftStatus = await this.shouldUpdateDraft(token);
        const isUpdate = draftStatus.shouldUpdate;
        this.status.showUploading('检测本地图片...');
        const lm = LocalImageManager.getInstance();
        const imageKeys = Array.from(lm.images.keys());
        const localImages = imageKeys.filter(key => {
            const image = lm.images.get(key);
            return image && image.url == null && image.filePath;
        });
        if (localImages.length > 0) {
            this.status.showUploading(`上传图片中... (0/${localImages.length})`);
            for (let i = 0; i < localImages.length; i++) {
                const imageKey = localImages[i];
                const imageInfo = lm.images.get(imageKey);
                if (!imageInfo || !imageInfo.filePath)
                    continue;
                this.status.showUploading(`上传图片中... (${i + 1}/${localImages.length})`);
                try {
                    const file = this.app.vault.getFileByPath(imageInfo.filePath);
                    if (!file) {
                        console.warn('图片文件不存在:', imageInfo.filePath);
                        continue;
                    }
                    const fileData = await this.app.vault.readBinary(file);
                    const base64Data = this.arrayBufferToBase64(fileData);
                    const smartFileName = await this.generateSmartImageName(imageInfo.filePath, i);
                    const uploadRes = await wechatClient.uploadMedia({
                        mediaData: base64Data,
                        filename: smartFileName,
                        accessToken: token,
                        mediaType: 'image',
                        storageType: 'permanent'
                    });
                    if (uploadRes.errcode === 0 && uploadRes.media_id) {
                        const mediaId = uploadRes.media_id;
                        imageInfo.url = uploadRes.url || `https://mmbiz.qlogo.cn/mmbiz_png/${mediaId}/0?wx_fmt=png`;
                        imageInfo.media_id = mediaId;
                    }
                    else {
                        const error = uploadRes.errmsg || '未知错误';
                        console.error(`图片上传失败: ${file.name}, 错误: ${error}`);
                    }
                }
                catch (error) {
                    console.error(`图片处理失败: ${imageInfo.filePath}`, error);
                    // 图片上传失败时不中断发布流程，继续处理下一张图片
                }
            }
            this.status.showProcessing('替换图片链接...');
            lm.replaceImages(this.content.getElements().articleDiv);
        }
        this.status.showUploading('处理封面...');
        let mediaId = '';
        if (localCover) {
            const coverData = await localCover.arrayBuffer();
            const base64Data = this.arrayBufferToBase64(coverData);
            const coverRes = await wechatClient.uploadMedia({
                mediaData: base64Data,
                filename: localCover.name,
                accessToken: token,
                mediaType: 'image',
                storageType: 'permanent'
            });
            if (coverRes.media_id) {
                mediaId = coverRes.media_id;
            }
            else {
                throw new Error('封面上传失败: ' + coverRes.errmsg);
            }
        }
        else {
            mediaId = await this.render.getDefaultCover(token);
            if (!mediaId) {
                throw new Error('无法获取封面图片，请手动选择一张封面图片或确保微信素材库中有图片');
            }
        }
        const metadata = this.render.getMetadata();
        const currentFileName = ((_a = this.currentFile) === null || _a === void 0 ? void 0 : _a.basename) || '未命名文章';
        const finalTitle = metadata.title || this.render.title || currentFileName;
        const finalDigest = metadata.digest || finalTitle.substring(0, 100);
        const article = {
            title: finalTitle,
            author: metadata.author || '',
            digest: finalDigest,
            content: this.render.getArticleContent(),
            content_source_url: metadata.content_source_url || '',
            thumb_media_id: mediaId,
            need_open_comment: metadata.need_open_comment ? 1 : 0,
            only_fans_can_comment: metadata.only_fans_can_comment ? 1 : 0,
            pic_crop_235_1: metadata.pic_crop_235_1 || '',
            pic_crop_1_1: metadata.pic_crop_1_1 || ''
        };
        let draftRes;
        if (isUpdate && draftStatus.media_id) {
            this.status.showProcessing('更新草稿...');
            const v3Article = {
                title: article.title,
                content: article.content,
                author: article.author,
                digest: article.digest,
                content_source_url: article.content_source_url,
                thumb_media_id: article.thumb_media_id,
                show_cover_pic: true,
                need_open_comment: Boolean(article.need_open_comment),
                only_fans_can_comment: Boolean(article.only_fans_can_comment)
            };
            draftRes = await wechatClient.updateDraft(draftStatus.media_id, draftStatus.index, v3Article, token);
        }
        else {
            this.status.showProcessing('创建草稿...');
            const v3Article = {
                title: article.title,
                content: article.content,
                author: article.author,
                digest: article.digest,
                content_source_url: article.content_source_url,
                thumb_media_id: article.thumb_media_id,
                show_cover_pic: true,
                need_open_comment: Boolean(article.need_open_comment),
                only_fans_can_comment: Boolean(article.only_fans_can_comment)
            };
            draftRes = await wechatClient.createDraft([v3Article], token);
        }
        if (draftRes.errcode !== 0) {
            const operation = isUpdate ? '更新' : '创建';
            throw new Error(`${operation}草稿失败: ` + (draftRes.errmsg || '未知错误'));
        }
    }
    async shouldUpdateDraft(token) {
        var _a, _b, _c, _d;
        const currentTitle = ((_a = this.currentFile) === null || _a === void 0 ? void 0 : _a.basename) || this.render.title || '未命名文章';
        try {
            // 更新import路径
            const { initApiClients, getWechatClient } = await import('../../services/api');
            if (!getWechatClient()) {
                initApiClients();
            }
            const wechatClient = getWechatClient();
            const draftsRes = await wechatClient.getDraftList(token, 0, 20);
            if (draftsRes.total_count && draftsRes.total_count > 0 && draftsRes.item && draftsRes.item.length > 0) {
                for (let i = 0; i < draftsRes.item.length; i++) {
                    const draft = draftsRes.item[i];
                    const draftTitle = ((_d = (_c = (_b = draft.content) === null || _b === void 0 ? void 0 : _b.news_item) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.title) || '';
                    if (draftTitle && draftTitle === currentTitle) {
                        return {
                            shouldUpdate: true,
                            media_id: draft.media_id,
                            index: 0
                        };
                    }
                }
            }
            return { shouldUpdate: false, index: 0 };
        }
        catch (error) {
            console.error('草稿检测失败:', error);
            return { shouldUpdate: false, index: 0 };
        }
    }
    async generateSmartImageName(originalPath, index) {
        var _a;
        const articleTitle = ((_a = this.currentFile) === null || _a === void 0 ? void 0 : _a.basename) || this.render.title || '未命名文章';
        const cleanTitle = this.cleanFileName(articleTitle);
        const sectionTitle = await this.findImageSection(originalPath);
        const cleanSection = sectionTitle ? this.cleanFileName(sectionTitle) : '';
        const ext = originalPath.split('.').pop() || 'png';
        let newName = cleanTitle;
        if (cleanSection) {
            newName += `-${cleanSection}`;
        }
        newName += `-${String(index + 1).padStart(2, '0')}.${ext}`;
        return newName;
    }
    cleanFileName(name) {
        return name
            .replace(/[\\/:*?"<>|]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50);
    }
    async findImageSection(imagePath) {
        try {
            if (!this.currentFile)
                return '';
            const content = await this.app.vault.read(this.currentFile);
            const lines = content.split('\n');
            let imageLineIndex = -1;
            const imageFileName = imagePath.split('/').pop() || '';
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes(imageFileName) ||
                    line.includes(imagePath) ||
                    (line.includes('![[') && line.includes(imageFileName.replace(/\.[^/.]+$/, '')))) {
                    imageLineIndex = i;
                    break;
                }
            }
            if (imageLineIndex === -1)
                return '';
            for (let i = imageLineIndex; i >= 0; i--) {
                const line = lines[i].trim();
                if (line.startsWith('## ')) {
                    const title = line.replace('## ', '').trim();
                    return title;
                }
            }
            for (let i = imageLineIndex; i >= 0; i--) {
                const line = lines[i].trim();
                if (line.startsWith('# ') && !line.startsWith('## ')) {
                    const title = line.replace('# ', '').trim();
                    return title;
                }
            }
            return '';
        }
        catch (error) {
            return '';
        }
    }
    async fallbackCopyToClipboard() {
        // 1) 优先尝试Electron剪贴板（可复制HTML+纯文本）
        try {
            const html = this.render.getArticleContent();
            const text = this.render.getArticleText();
            const w = window;
            const electron = (w === null || w === void 0 ? void 0 : w.require) ? w.require('electron') : undefined;
            const electronClipboard = electron === null || electron === void 0 ? void 0 : electron.clipboard;
            if (electronClipboard && typeof electronClipboard.write === 'function') {
                electronClipboard.write({ html, text });
                return;
            }
        }
        catch (e) {
            // 忽略，继续使用Web降级复制
        }
        // 2) 使用纯文本降级复制（execCommand）
        const textarea = document.createElement('textarea');
        textarea.value = this.render.getArticleText();
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        try {
            textarea.focus();
            textarea.select();
            textarea.setSelectionRange(0, textarea.value.length);
            const successful = document.execCommand('copy');
            if (!successful) {
                throw new Error('execCommand copy failed');
            }
        }
        finally {
            document.body.removeChild(textarea);
        }
    }
    async copyWithoutImageUpload() {
        this.status.showCopying('复制到剪贴板中...');
        try {
            if (document.hasFocus && !document.hasFocus()) {
                window.focus();
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            await this.render.copyArticle();
            this.status.showSuccess('复制成功，未上传图片到公众号', 2000);
        }
        catch (error) {
            console.warn('剪贴板复制失败:', error);
            try {
                await this.fallbackCopyToClipboard();
                this.status.showSuccess('复制成功，未上传图片到公众号', 2000);
            }
            catch (fallbackError) {
                console.error('兼容复制也失败:', fallbackError);
                this.status.hideMessage();
                this.status.showError('复制失败，请确认窗口处于活动状态后重试。', 4000);
                new Notice('复制失败，请确认Obsidian窗口处于活动状态后重试。');
                throw new Error('复制失败，请确认Obsidian窗口处于活动状态后重试。');
            }
        }
    }
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    async batchPost(folder) {
        const files = folder.children.filter((child) => child.path.toLocaleLowerCase().endsWith('.md'));
        if (!files) {
            new Notice('没有可渲染的笔记或文件不支持渲染');
            return;
        }
        this.isCancelUpload = false;
        this.isBatchRuning = true;
        // Claude Code Update
        try {
            for (let file of files) {
                // 使用 instanceof 检查而非类型断言
                if (!(file instanceof TFile)) {
                    continue;
                }
                this.showLoading(`即将发布: ${file.name}`, true);
                await new Promise(resolve => setTimeout(resolve, 5000));
                if (this.isCancelUpload) {
                    break;
                }
                this.cleanArticleData();
                await this.renderMarkdown(file);
                await this.postArticle();
            }
            if (!this.isCancelUpload) {
                this.showMsg(`批量发布完成：成功发布 ${files.length} 篇笔记`);
            }
        }
        catch (e) {
            console.error(e);
            new Notice('批量发布失败: ' + e.message);
        }
        finally {
            this.isBatchRuning = false;
            this.isCancelUpload = false;
        }
    }
    notifyBackendUnavailable(error, options) {
        const message = error instanceof Error ? error.message : String(error);
        const keywords = [
            '无法连接到服务器',
            '后端服务未启动',
            'Failed to fetch',
            'NetworkError',
            'CORS',
            'fetch failed',
            '可能的CORS问题原因'
        ];
        const matched = keywords.some(keyword => message.includes(keyword));
        if (matched) {
            this.backendAvailable = false;
            const now = Date.now();
            this.lastBackendFailureAt = now;
            if (now - this.lastBackendNoticeAt > 3000) {
                this.lastBackendNoticeAt = now;
                // 插件内日志与通知
                this.status.showError('后端服务未启动或无法连接。已切换为“仅复制”模式。', 6000);
                if (!(options === null || options === void 0 ? void 0 : options.suppressNotice)) {
                    new Notice('未检测到后端服务，请先启动本地服务或检查网络连接。');
                }
            }
        }
        return matched;
    }
    // 获取当前状态
    getCurrentAppId() {
        return this.currentAppId;
    }
    getCurrentFile() {
        return this.currentFile;
    }
    getAssetsManager() {
        return this.assetsManager;
    }
    getSettings() {
        return this.settings;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJldmlldy1jb250cm9sbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJldmlldy1jb250cm9sbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7R0FZRztBQUVILGlCQUFpQjtBQUNqQixPQUFPLEVBQXlCLEtBQUssRUFBMEIsTUFBTSxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBR3hGLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLGFBQWEsTUFBTSxtQkFBbUIsQ0FBQztBQUU5QyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsU0FBUyxFQUFFLE1BQU0sNkNBQTZDLENBQUM7QUFDM0YsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLHVDQUF1QyxDQUFDO0FBQ3hFLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSx3Q0FBd0MsQ0FBQztBQUN2RSxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFFekQsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQy9ELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUMvRCxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFFN0Q7O0dBRUc7QUFDSCxNQUFNLE9BQU8saUJBQWlCO0lBK0IxQixZQUFZLEdBQVEsRUFBRSxJQUFTLEVBQUUsTUFBYztRQXpCdkMsY0FBUyxHQUFlLEVBQUUsQ0FBQztRQVFuQyxPQUFPO1FBQ0MsbUJBQWMsR0FBeUIsSUFBSSxDQUFDO1FBRTVDLG1CQUFjLEdBQXdCLElBQUksR0FBRyxFQUFFLENBQUM7UUFPaEQsbUJBQWMsR0FBWSxLQUFLLENBQUM7UUFDaEMsa0JBQWEsR0FBWSxLQUFLLENBQUM7UUFDL0IscUJBQWdCLEdBQW1CLElBQUksQ0FBQztRQUN4Qyx3QkFBbUIsR0FBRyxDQUFDLENBQUM7UUFDeEIseUJBQW9CLEdBQUcsQ0FB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O1lBQ3ZCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxHQUFHLENBQUM7WUFDaEMsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixHQUFHLElBQUksRUFBRTtnQkFDdkMsSUFBSSxDQUFDLG1CQUFtQixHQUFHLEdBQUcsQ0FBQztnQkFDL0IsV0FBVztnQkFDWCxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQywyQkFBMkIsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDekQsSUFBSSxDQUFDLENBQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLGNBQWMsQ0FBQSxFQUFFO29CQUMxQixJQUFJLE1BQU0sQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO2lCQUMzQzthQUNKO1NBQ0o7UUFFRCxPQUFPLE9BQU8sQ0FBQztJQUNuQixDQUFDO0lBRUQsU0FBUztJQUNULGVBQWU7UUFDWCxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDN0IsQ0FBQztJQUVELGNBQWM7UUFDVixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDNUIsQ0FBQztJQUVELGdCQUFnQjtRQUNaLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztJQUM5QixDQUFDO0lBRUQsV0FBVztRQUNQLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztJQUN6QixDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMjQtMjAyNSBJc0hleHhcclxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICpcclxuICogVGhpcyBzb2Z0d2FyZSBpcyBwcm9wcmlldGFyeSBhbmQgY29uZmlkZW50aWFsLiBObyBwYXJ0IG9mIHRoaXMgc29mdHdhcmVcclxuICogbWF5IGJlIHJlcHJvZHVjZWQsIGRpc3RyaWJ1dGVkLCBvciB0cmFuc21pdHRlZCBpbiBhbnkgZm9ybSBvciBieSBhbnkgbWVhbnMsXHJcbiAqIGluY2x1ZGluZyBwaG90b2NvcHlpbmcsIHJlY29yZGluZywgb3Igb3RoZXIgZWxlY3Ryb25pYyBvciBtZWNoYW5pY2FsIG1ldGhvZHMsXHJcbiAqIHdpdGhvdXQgdGhlIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbiBvZiB0aGUgYXV0aG9yLCBleGNlcHQgaW4gdGhlIGNhc2Ugb2ZcclxuICogYnJpZWYgcXVvdGF0aW9ucyBlbWJvZGllZCBpbiBjcml0aWNhbCByZXZpZXdzIGFuZCBjZXJ0YWluIG90aGVyIG5vbmNvbW1lcmNpYWxcclxuICogdXNlcyBwZXJtaXR0ZWQgYnkgY29weXJpZ2h0IGxhdy5cclxuICpcclxuICogRm9yIHBlcm1pc3Npb24gcmVxdWVzdHMsIGNvbnRhY3Q6IElzSGV4eFxyXG4gKi9cclxuXHJcbi8vIOmihOiniOaOp+WItuWZqO+8jOi0n+i0o+aguOW/g+S4muWKoemAu+i+kVxyXG5pbXBvcnQgeyBBcHAsIEV2ZW50UmVmLCBQbHVnaW4sIFRGaWxlLCBURm9sZGVyLCBUQWJzdHJhY3RGaWxlLCBOb3RpY2UgfSBmcm9tICdvYnNpZGlhbic7XHJcbi8vIOabtOaWsGltcG9ydOi3r+W+hFxyXG5pbXBvcnQgeyBkZWJvdW5jZSB9IGZyb20gJy4uLy4uL3NoYXJlZC91dGlscyc7XHJcbmltcG9ydCB7IFd4U2V0dGluZ3MgfSBmcm9tICcuLi8uLi9jb3JlL3NldHRpbmdzJztcclxuaW1wb3J0IEFzc2V0c01hbmFnZXIgZnJvbSAnLi4vLi4vY29yZS9hc3NldHMnO1xyXG5pbXBvcnQgeyBNYXJrZWRQYXJzZXIgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9yZW5kZXJlci9tYXJrZG93bi9wYXJzZXInO1xyXG5pbXBvcnQgeyBMb2NhbEltYWdlTWFuYWdlciwgTG9jYWxGaWxlIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvcmVuZGVyZXIvbWFya2Rvd24vbG9jYWwtZmlsZSc7XHJcbmltcG9ydCB7IENhcmREYXRhTWFuYWdlciB9IGZyb20gJy4uLy4uL3NlcnZpY2VzL3JlbmRlcmVyL21hcmtkb3duL2NvZGUnO1xyXG5pbXBvcnQgeyBBcnRpY2xlUmVuZGVyIH0gZnJvbSAnLi4vLi4vc2VydmljZXMvcmVuZGVyZXIvYXJ0aWNsZS1yZW5kZXInO1xyXG5pbXBvcnQgeyBTdHlsZUVkaXRvciB9IGZyb20gJy4uL2NvbXBvbmVudHMvc3R5bGUtZWRpdG9yJztcclxuaW1wb3J0IHR5cGUgeyBEcmFmdEFydGljbGUgfSBmcm9tICcuLi8uLi9zZXJ2aWNlcy93ZWNoYXQvd2VpeGluLWFwaSc7XHJcbmltcG9ydCB7IFByZXZpZXdUb29sYmFyIH0gZnJvbSAnLi4vY29tcG9uZW50cy9wcmV2aWV3LXRvb2xiYXInO1xyXG5pbXBvcnQgeyBQcmV2aWV3Q29udGVudCB9IGZyb20gJy4uL2NvbXBvbmVudHMvcHJldmlldy1jb250ZW50JztcclxuaW1wb3J0IHsgUHJldmlld1N0YXR1cyB9IGZyb20gJy4uL2NvbXBvbmVudHMvcHJldmlldy1zdGF0dXMnO1xyXG5cclxuLyoqXHJcbiAqIOmihOiniOaOp+WItuWZqCAtIOi0n+i0o+aguOW/g+S4muWKoemAu+i+keWSjOe7hOS7tuWNj+iwg1xyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFByZXZpZXdDb250cm9sbGVyIHtcclxuICAgIHByaXZhdGUgYXBwOiBBcHA7XHJcbiAgICBwcml2YXRlIHZpZXc6IGFueTsgLy8gUHJldmlld1ZpZXdcclxuICAgIHByaXZhdGUgcGx1Z2luOiBQbHVnaW47XHJcbiAgICBwcml2YXRlIHNldHRpbmdzOiBXeFNldHRpbmdzO1xyXG4gICAgcHJpdmF0ZSBhc3NldHNNYW5hZ2VyOiBBc3NldHNNYW5hZ2VyO1xyXG4gICAgcHJpdmF0ZSBsaXN0ZW5lcnM6IEV2ZW50UmVmW10gPSBbXTtcclxuXHJcbiAgICAvLyDnu4Tku7blrp7kvotcclxuICAgIHByaXZhdGUgdG9vbGJhcjogUHJldmlld1Rvb2xiYXI7XHJcbiAgICBwcml2YXRlIGNvbnRlbnQ6IFByZXZpZXdDb250ZW50O1xyXG4gICAgcHJpdmF0ZSBzdGF0dXM6IFByZXZpZXdTdGF0dXM7XHJcbiAgICBwcml2YXRlIHN0eWxlRWRpdG9yOiBTdHlsZUVkaXRvcjtcclxuXHJcbiAgICAvLyDmuLLmn5Pnm7jlhbNcclxuICAgIHByaXZhdGUgX2FydGljbGVSZW5kZXI6IEFydGljbGVSZW5kZXIgfCBudWxsID0gbnVsbDtcclxuICAgIHByaXZhdGUgbWFya2VkUGFyc2VyOiBNYXJrZWRQYXJzZXI7XHJcbiAgICBwcml2YXRlIGNhY2hlZEVsZW1lbnRzOiBNYXA8c3RyaW5nLCBzdHJpbmc+ID0gbmV3IE1hcCgpO1xyXG5cclxuICAgIC8vIOeKtuaAgeeuoeeQhlxyXG4gICAgcHJpdmF0ZSBjdXJyZW50RmlsZT86IFRGaWxlO1xyXG4gICAgcHJpdmF0ZSBjdXJyZW50VGhlbWU6IHN0cmluZztcclxuICAgIHByaXZhdGUgY3VycmVudEhpZ2hsaWdodDogc3RyaW5nO1xyXG4gICAgcHJpdmF0ZSBjdXJyZW50QXBwSWQ6IHN0cmluZztcclxuICAgIHByaXZhdGUgaXNDYW5jZWxVcGxvYWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHByaXZhdGUgaXNCYXRjaFJ1bmluZzogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBiYWNrZW5kQXZhaWxhYmxlOiBib29sZWFuIHwgbnVsbCA9IG51bGw7XHJcbiAgICBwcml2YXRlIGxhc3RCYWNrZW5kTm90aWNlQXQgPSAwO1xyXG4gICAgcHJpdmF0ZSBsYXN0QmFja2VuZEZhaWx1cmVBdCA9IDA7XHJcblxyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFwcDogQXBwLCB2aWV3OiBhbnksIHBsdWdpbjogUGx1Z2luKSB7XHJcbiAgICAgICAgdGhpcy5hcHAgPSBhcHA7XHJcbiAgICAgICAgdGhpcy52aWV3ID0gdmlldztcclxuICAgICAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcclxuICAgICAgICB0aGlzLnNldHRpbmdzID0gV3hTZXR0aW5ncy5nZXRJbnN0YW5jZSgpO1xyXG4gICAgICAgIHRoaXMuYXNzZXRzTWFuYWdlciA9IEFzc2V0c01hbmFnZXIuZ2V0SW5zdGFuY2UoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRUaGVtZSA9IHRoaXMuc2V0dGluZ3MuZGVmYXVsdFN0eWxlO1xyXG4gICAgICAgIHRoaXMuY3VycmVudEhpZ2hsaWdodCA9IHRoaXMuc2V0dGluZ3MuZGVmYXVsdEhpZ2hsaWdodDtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0aWFsaXplU3R5bGVFZGl0b3IoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGluaXRpYWxpemVTdHlsZUVkaXRvcigpIHtcclxuICAgICAgICB0aGlzLnN0eWxlRWRpdG9yID0gbmV3IFN0eWxlRWRpdG9yKHRoaXMuc2V0dGluZ3MsIHRoaXMuYXNzZXRzTWFuYWdlciwge1xyXG4gICAgICAgICAgICBvblRoZW1lQ2hhbmdlZDogKHRoZW1lOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFRoZW1lID0gdGhlbWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlci51cGRhdGVTdHlsZSh0aGVtZSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uSGlnaGxpZ2h0Q2hhbmdlZDogKGhpZ2hsaWdodDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRIaWdobGlnaHQgPSBoaWdobGlnaHQ7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlci51cGRhdGVIaWdoTGlnaHQoaGlnaGxpZ2h0KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgb25TdHlsZVJlc2V0OiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAvLyBDbGF1ZGUgQ29kZSBVcGRhdGU6IOmHjee9ruaJgOacieagt+W8j+WIsOm7mOiupOWAvFxyXG4gICAgICAgICAgICAgICAgLy8g6YeN572u5Li76aKY5ZKM6auY5LquXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRUaGVtZSA9IHRoaXMuc2V0dGluZ3MuZGVmYXVsdFN0eWxlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50SGlnaGxpZ2h0ID0gdGhpcy5zZXR0aW5ncy5kZWZhdWx0SGlnaGxpZ2h0O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIudXBkYXRlU3R5bGUodGhpcy5jdXJyZW50VGhlbWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIudXBkYXRlSGlnaExpZ2h0KHRoaXMuY3VycmVudEhpZ2hsaWdodCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gQ2xhdWRlIENvZGUgVXBkYXRlOiDph43nva7lrZfkvZPjgIHlrZflj7fjgIHkuLvpopjoibLliLDmlrDpu5jorqTlgLxcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRGb250ID0gJ3NhbnMtc2VyaWYnO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGVmYXVsdEZvbnRTaXplID0gJzE2cHgnO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGVmYXVsdFByaW1hcnlDb2xvciA9ICcjMmQzNzQ4JztcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRDdXN0b21DU1MgPSAnJztcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlci51cGRhdGVGb250KGRlZmF1bHRGb250KTtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyLnVwZGF0ZUZvbnRTaXplKGRlZmF1bHRGb250U2l6ZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlci51cGRhdGVQcmltYXJ5Q29sb3IoZGVmYXVsdFByaW1hcnlDb2xvcik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlci51cGRhdGVDdXN0b21DU1MoZGVmYXVsdEN1c3RvbUNTUyk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8g5pu05paw5qC35byP57yW6L6R5ZmoVUnmmL7npLpcclxuICAgICAgICAgICAgICAgIHRoaXMuc3R5bGVFZGl0b3I/LnVwZGF0ZVNlbGVjdGlvbnMoXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50VGhlbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50SGlnaGxpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRGb250LFxyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRGb250U2l6ZSxcclxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0UHJpbWFyeUNvbG9yLFxyXG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHRDdXN0b21DU1NcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uRm9udENoYW5nZWQ6IChmb250RmFtaWx5OiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyLnVwZGF0ZUZvbnQoZm9udEZhbWlseSk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uRm9udFNpemVDaGFuZ2VkOiAoZm9udFNpemU6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIudXBkYXRlRm9udFNpemUoZm9udFNpemUpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvblByaW1hcnlDb2xvckNoYW5nZWQ6IChjb2xvcjogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlci51cGRhdGVQcmltYXJ5Q29sb3IoY29sb3IpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvbkN1c3RvbUNTU0NoYW5nZWQ6IChjc3M6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIudXBkYXRlQ3VzdG9tQ1NTKGNzcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBnZXQgcmVuZGVyKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5fYXJ0aWNsZVJlbmRlcikge1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZW50RWxlbWVudHMgPSB0aGlzLmNvbnRlbnQuZ2V0RWxlbWVudHMoKTtcclxuICAgICAgICAgICAgdGhpcy5fYXJ0aWNsZVJlbmRlciA9IG5ldyBBcnRpY2xlUmVuZGVyKFxyXG4gICAgICAgICAgICAgICAgdGhpcy5hcHAsIFxyXG4gICAgICAgICAgICAgICAgdGhpcy52aWV3LCBcclxuICAgICAgICAgICAgICAgIGNvbnRlbnRFbGVtZW50cy5zdHlsZUVsLCBcclxuICAgICAgICAgICAgICAgIGNvbnRlbnRFbGVtZW50cy5hcnRpY2xlRGl2XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHRoaXMuX2FydGljbGVSZW5kZXIuY3VycmVudFRoZW1lID0gdGhpcy5jdXJyZW50VGhlbWU7XHJcbiAgICAgICAgICAgIHRoaXMuX2FydGljbGVSZW5kZXIuY3VycmVudEhpZ2hsaWdodCA9IHRoaXMuY3VycmVudEhpZ2hsaWdodDtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FydGljbGVSZW5kZXI7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgaW5pdGlhbGl6ZSgpIHtcclxuICAgICAgICBpZiAoIXRoaXMuc2V0dGluZ3MuaXNMb2FkZWQpIHtcclxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMucGx1Z2luLmxvYWREYXRhKCk7XHJcbiAgICAgICAgICAgIFd4U2V0dGluZ3MubG9hZFNldHRpbmdzKGRhdGEpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoIXRoaXMuYXNzZXRzTWFuYWdlci5pc0xvYWRlZCkge1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmFzc2V0c01hbmFnZXIubG9hZEFzc2V0cygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYXdhaXQgdGhpcy5idWlsZFVJKCk7XHJcbiAgICAgICAgdGhpcy5zZXR1cEV2ZW50TGlzdGVuZXJzKCk7XHJcbiAgICAgICAgYXdhaXQgdGhpcy5yZW5kZXJNYXJrZG93bigpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgYnVpbGRVSSgpIHtcclxuICAgICAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLnZpZXcuZ2V0Q29udGFpbmVyKCk7XHJcbiAgICAgICAgY29udGFpbmVyLmVtcHR5KCk7XHJcblxyXG4gICAgICAgIGNvbnN0IG1haW5EaXYgPSBjb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAnbm90ZS1wcmV2aWV3JyB9KTtcclxuXHJcbiAgICAgICAgLy8g5Yib5bu657uE5Lu2XHJcbiAgICAgICAgdGhpcy50b29sYmFyID0gbmV3IFByZXZpZXdUb29sYmFyKFxyXG4gICAgICAgICAgICBtYWluRGl2LFxyXG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLFxyXG4gICAgICAgICAgICB0aGlzLnN0eWxlRWRpdG9yLFxyXG4gICAgICAgICAgICB0aGlzLmdldFRvb2xiYXJIYW5kbGVycygpXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgdGhpcy5jb250ZW50ID0gbmV3IFByZXZpZXdDb250ZW50KG1haW5EaXYpO1xyXG5cclxuICAgICAgICBhd2FpdCB0aGlzLnRvb2xiYXIuYnVpbGQoKTtcclxuICAgICAgICB0aGlzLnN0YXR1cyA9IG5ldyBQcmV2aWV3U3RhdHVzKHRoaXMudG9vbGJhci5nZXRFbGVtZW50KCkpO1xyXG4gICAgICAgIHRoaXMuY29udGVudC5idWlsZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0VG9vbGJhckhhbmRsZXJzKCkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIG9uQXBwSWRDaGFuZ2VkOiAoYXBwSWQ6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50QXBwSWQgPSBhcHBJZDtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xlYW5BcnRpY2xlRGF0YSgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gdGhpcy5yZWJ1aWxkVG9vbGJhcigpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBvblJlZnJlc2g6IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgIC8vIOmHjeaWsOaehOW7uuW3peWFt+agj+S7peWPjeaYoOacgOaWsOiuvue9rlxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWJ1aWxkVG9vbGJhcigpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hc3NldHNNYW5hZ2VyLmxvYWRDdXN0b21DU1MoKTtcclxuICAgICAgICBcclxuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyLnJlbG9hZFN0eWxlKCk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJlbmRlck1hcmtkb3duKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uQ29weTogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuY29weVdpdGhJbWFnZVVwbG9hZCgpO1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQ/LnVwbG9hZGVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoJ+WkjeWItuaIkOWKn++8jOWbvueJh+W3suS4iuS8oOWIsOW+ruS/oeacjeWKoeWZqO+8jOivt+WIsOWFrOS8l+WPt+e8lui+keWZqOeymOi0tOOAgicpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOagueaNruWOn+WboOe7meWHuuabtOWHhuehrueahOaPkOekulxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzdWx0Py5yZWFzb24gPT09ICduby1hcHBpZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoJ+WkjeWItuaIkOWKn++8jOacqumFjee9ruWFrOS8l+WPt++8jOWbvueJh+acquS4iuS8oOOAgicpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3VsdD8ucmVhc29uID09PSAnYmFja2VuZCcgfHwgcmVzdWx0Py5yZWFzb24gPT09ICd0b2tlbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoJ+WkjeWItuaIkOWKn++8jOS7heWkjeWItuWGheWuue+8jOacquS4iuS8oOWbvueJh++8iOWQjuerr+acqui/nuaOpeaIluiupOivgeWksei0pe+8ieOAgicpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IE5vdGljZSgn5aSN5Yi25oiQ5Yqf77yM5LuF5aSN5Yi25YaF5a6577yM5pyq5LiK5Lyg5Zu+54mH44CCJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25Qb3N0OiBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBvc3RBcnRpY2xlKCk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uVXBsb2FkOiBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnVwbG9hZEltYWdlcygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldHVwRXZlbnRMaXN0ZW5lcnMoKSB7XHJcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSBbXHJcbiAgICAgICAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbignZmlsZS1vcGVuJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIHRoaXMuYXBwLnZhdWx0Lm9uKFwibW9kaWZ5XCIsIChmaWxlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50RmlsZT8ucGF0aCA9PSBmaWxlLnBhdGgpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbmRlck1hcmtkb3duKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgXTtcclxuICAgIH1cclxuXHJcbiAgICBjbGVhbnVwKCkge1xyXG4gICAgICAgIHRoaXMubGlzdGVuZXJzPy5mb3JFYWNoKGxpc3RlbmVyID0+IHRoaXMuYXBwLndvcmtzcGFjZS5vZmZyZWYobGlzdGVuZXIpKTtcclxuICAgICAgICBMb2NhbEZpbGUuZmlsZUNhY2hlLmNsZWFyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8g5Yi35paw5o6n5Yi25Zmo77yM6YeN5paw5p6E5bu65bel5YW35qCP5ZKM5YaF5a65XHJcbiAgICBhc3luYyBvblJlZnJlc2goKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdGhpcy5zdGF0dXMuc2hvd0luZm8oJ+ato+WcqOWIt+aWsC4uLicpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8g6YeN5paw5p6E5bu65bel5YW35qCP5Lul5Y+N5pig5pyA5paw6K6+572uXHJcbiAgICAgICAgICAgIHRoaXMucmVidWlsZFRvb2xiYXIoKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIOmHjeaWsOWKoOi9vei1hOa6kOWSjOWGheWuuVxyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmFzc2V0c01hbmFnZXIubG9hZEFzc2V0cygpO1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmFzc2V0c01hbmFnZXIubG9hZEN1c3RvbUNTUygpO1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlbmRlck1hcmtkb3duKG51bGwpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5zdGF0dXMuc2hvd1N1Y2Nlc3MoJ+WIt+aWsOWujOaIkCcpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzLnNob3dFcnJvcihg5Yi35paw5aSx6LSlOiAke2Vycm9yLm1lc3NhZ2V9YCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIOmHjeaWsOaehOW7uuW3peWFt+agj+S7peWPjeaYoOiuvue9ruWPmOabtFxyXG4gICAgcHJpdmF0ZSByZWJ1aWxkVG9vbGJhcigpOiB2b2lkIHtcclxuICAgICAgICBpZiAodGhpcy50b29sYmFyICYmIHR5cGVvZiB0aGlzLnRvb2xiYXIucmVmcmVzaCA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICB0aGlzLnRvb2xiYXIucmVmcmVzaCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHVwZGF0ZSgpIHtcclxuICAgICAgICBpZiAodGhpcy5pc0JhdGNoUnVuaW5nKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jbGVhbkFydGljbGVEYXRhKCk7XHJcbiAgICAgICAgdGhpcy5yZW5kZXJNYXJrZG93bigpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY2xlYW5BcnRpY2xlRGF0YSgpIHtcclxuICAgICAgICBMb2NhbEltYWdlTWFuYWdlci5nZXRJbnN0YW5jZSgpLmNsZWFudXAoKTtcclxuICAgICAgICBDYXJkRGF0YU1hbmFnZXIuZ2V0SW5zdGFuY2UoKS5jbGVhbnVwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2hvd0xvYWRpbmcobXNnOiBzdHJpbmcsIGNhbmNlbGFibGU6IGJvb2xlYW4gPSBmYWxzZSkge1xyXG4gICAgICAgIHRoaXMuc3RhdHVzLnNob3dJbmZvKG1zZyk7XHJcbiAgICB9XHJcblxyXG4gICAgc2hvd01zZyhtc2c6IHN0cmluZykge1xyXG4gICAgICAgIGlmIChtc2cuaW5jbHVkZXMoJ+aIkOWKnycpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzLnNob3dTdWNjZXNzKG1zZyk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChtc2cuaW5jbHVkZXMoJ+Wksei0pScpIHx8IG1zZy5pbmNsdWRlcygn6ZSZ6K+vJykpIHtcclxuICAgICAgICAgICAgdGhpcy5zdGF0dXMuc2hvd0Vycm9yKG1zZyk7XHJcbiAgICAgICAgfSBlbHNlIGlmIChtc2cuaW5jbHVkZXMoJ+itpuWRiicpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzLnNob3dXYXJuaW5nKG1zZyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zdGF0dXMuc2hvd0luZm8obXNnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgcmVuZGVyTWFya2Rvd24oYWY6IFRGaWxlIHwgbnVsbCA9IG51bGwpIHtcclxuICAgICAgICBpZiAoIWFmKSB7XHJcbiAgICAgICAgICAgIGFmID0gdGhpcy5hcHAud29ya3NwYWNlLmdldEFjdGl2ZUZpbGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFhZiB8fCBhZi5leHRlbnNpb24udG9Mb2NhbGVMb3dlckNhc2UoKSAhPT0gJ21kJykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY3VycmVudEZpbGUgPSBhZjtcclxuICAgICAgICBhd2FpdCB0aGlzLnJlbmRlci5yZW5kZXJNYXJrZG93bihhZik7XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlbmRlci5nZXRNZXRhZGF0YSgpO1xyXG4gICAgICAgIHRoaXMudG9vbGJhci51cGRhdGVGcm9tTWV0YWRhdGEobWV0YWRhdGEsIHRoaXMuY3VycmVudFRoZW1lLCB0aGlzLmN1cnJlbnRIaWdobGlnaHQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIENsYXVkZSBDb2RlIFVwZGF0ZTog5pS56L+b6ZSZ6K+v5o+Q56S677yM6ZKI5a+55LiN5ZCM6ZSZ6K+v57uZ5Ye65YW35L2T5L+h5oGvXHJcbiAgICBhc3luYyB1cGxvYWRJbWFnZXMoKSB7XHJcbiAgICAgICAgLy8g5YWI5qOA5p+l5piv5ZCm6YCJ5oup5LqG5YWs5LyX5Y+3XHJcbiAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRBcHBJZCkge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXR1cy5zaG93V2FybmluZygn6K+35YWI6YCJ5oup5YWs5LyX5Y+3JywgMzAwMCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmJhY2tlbmRBdmFpbGFibGUgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgIGlmIChub3cgLSB0aGlzLmxhc3RCYWNrZW5kRmFpbHVyZUF0IDwgNTAwMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0dXMuc2hvd0Vycm9yKCflkI7nq6/mnI3liqHmnKrlkK/liqjvvIzml6Dms5XkuIrkvKDlm77niYfjgIInLCA0MDAwKTtcclxuICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoJ+acquajgOa1i+WIsOWQjuerr+acjeWKoe+8jOivt+WFiOWQr+WKqOWQjuerr+WQjuWGjeivleOAgicpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuYmFja2VuZEF2YWlsYWJsZSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnN0YXR1cy5zaG93VXBsb2FkaW5nKCflm77niYfkuIrkvKDkuK0uLi4nKTtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlbmRlci51cGxvYWRJbWFnZXModGhpcy5jdXJyZW50QXBwSWQpO1xyXG4gICAgICAgICAgICB0aGlzLmJhY2tlbmRBdmFpbGFibGUgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnN0YXR1cy5zaG93U3VjY2Vzcygn5Zu+54mH5LiK5Lyg5oiQ5Yqf77yM5Zu+54mH6ZO+5o6l5bey5pu05pawJywgMzAwMCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcign5Zu+54mH5LiK5Lyg5aSx6LSlOicsIGVycm9yKTtcclxuICAgICAgICAgICAgdGhpcy5ub3RpZnlCYWNrZW5kVW5hdmFpbGFibGUoZXJyb3IpO1xyXG5cclxuXHJcbiAgICAgICAgICAgIC8vIENsYXVkZSBDb2RlIFVwZGF0ZTog5qC55o2u6ZSZ6K+v57G75Z6L57uZ5Ye65YW35L2T5o+Q56S677yM5LiN5YaNZmFsbGJhY2vlpI3liLZcclxuICAgICAgICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGVycm9yTWVzc2FnZS5pbmNsdWRlcygn6K+35YWI6YCJ5oup5YWs5LyX5Y+3JykpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzLnNob3dXYXJuaW5nKCfor7flhYjpgInmi6nlhazkvJflj7cnLCAzMDAwKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChlcnJvck1lc3NhZ2UuaW5jbHVkZXMoJ3Rva2VuJykgfHwgZXJyb3JNZXNzYWdlLmluY2x1ZGVzKCdUb2tlbicpIHx8IGVycm9yTWVzc2FnZS5pbmNsdWRlcygn6K6k6K+BJykpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzLnNob3dFcnJvcignVG9rZW7ojrflj5blpLHotKXvvIzlm77niYfmnKrkuIrkvKDjgILor7fmo4Dmn6XlhazkvJflj7fphY3nva4nLCA1MDAwKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChlcnJvck1lc3NhZ2UuaW5jbHVkZXMoJ+S4iuS8oCcpIHx8IGVycm9yTWVzc2FnZS5pbmNsdWRlcygndXBsb2FkJykpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzLnNob3dFcnJvcign5Zu+54mH5LiK5Lyg6L+H56iL5Ye66ZSZ77yaJyArIGVycm9yTWVzc2FnZSwgNTAwMCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXR1cy5zaG93RXJyb3IoJ+WbvueJh+S4iuS8oOWksei0pe+8micgKyBlcnJvck1lc3NhZ2UsIDUwMDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFzeW5jIHBvc3RBcnRpY2xlKCkge1xyXG4gICAgICAgIGNvbnN0IGxvY2FsQ292ZXIgPSB0aGlzLnRvb2xiYXIuZ2V0Q292ZXJGaWxlKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHRoaXMudG9vbGJhci5pc1VzaW5nTG9jYWxDb3ZlcigpICYmICFsb2NhbENvdmVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzLnNob3dXYXJuaW5nKCfor7fpgInmi6nlsIHpnaLmlofku7YnKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRBcHBJZCkge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXR1cy5zaG93V2FybmluZygn6K+35YWI6YCJ5oup5YWs5LyX5Y+3Jyk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmJhY2tlbmRBdmFpbGFibGUgPT09IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgIGlmIChub3cgLSB0aGlzLmxhc3RCYWNrZW5kRmFpbHVyZUF0IDwgNTAwMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0dXMuc2hvd0Vycm9yKCflkI7nq6/mnI3liqHmnKrlkK/liqjvvIzmmoLml6Dms5Xlj5HojYnnqL/jgIInLCA0MDAwKTtcclxuICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoJ+acquajgOa1i+WIsOWQjuerr+acjeWKoe+8jOivt+WFiOWQr+WKqOWQjuerr+WQjuWGjeivleOAgicpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuYmFja2VuZEF2YWlsYWJsZSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnN0YXR1cy5zaG93UHJvY2Vzc2luZygn5Y+R5biD5LitLi4uJyk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgYXdhaXQgdGhpcy51cGxvYWRJbWFnZXNBbmRDcmVhdGVEcmFmdCh0aGlzLmN1cnJlbnRBcHBJZCwgbG9jYWxDb3Zlcik7XHJcbiAgICAgICAgICAgIHRoaXMuYmFja2VuZEF2YWlsYWJsZSA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzLnNob3dTdWNjZXNzKCflj5HluIPmiJDlip8nLCAzMDAwKTtcclxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCflj5HluIPlpLHotKU6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICB0aGlzLm5vdGlmeUJhY2tlbmRVbmF2YWlsYWJsZShlcnJvcik7XHJcblxyXG5cclxuICAgICAgICAgICAgLy8gQ2xhdWRlIENvZGUgVXBkYXRlOiDmoLnmja7plJnor6/nsbvlnovnu5nlh7rlhbfkvZPmj5DnpLpcclxuICAgICAgICAgICAgY29uc3QgZXJyb3JNZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGVycm9yTWVzc2FnZS5pbmNsdWRlcygndG9rZW4nKSB8fCBlcnJvck1lc3NhZ2UuaW5jbHVkZXMoJ1Rva2VuJykgfHwgZXJyb3JNZXNzYWdlLmluY2x1ZGVzKCforqTor4EnKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0dXMuc2hvd0Vycm9yKCdUb2tlbuiOt+WPluWksei0pe+8jOWPkeW4g+Wksei0peOAguivt+ajgOafpeWFrOS8l+WPt+mFjee9ricsIDUwMDApO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGVycm9yTWVzc2FnZS5pbmNsdWRlcygn5LiK5LygJykgfHwgZXJyb3JNZXNzYWdlLmluY2x1ZGVzKCd1cGxvYWQnKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0dXMuc2hvd0Vycm9yKCflm77niYfkuIrkvKDov4fnqIvlh7rplJnvvJonICsgZXJyb3JNZXNzYWdlLCA1MDAwKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChlcnJvck1lc3NhZ2UuaW5jbHVkZXMoJ+iNieeovycpIHx8IGVycm9yTWVzc2FnZS5pbmNsdWRlcygnZHJhZnQnKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0dXMuc2hvd0Vycm9yKCfliJvlu7rojYnnqL/lpLHotKXvvJonICsgZXJyb3JNZXNzYWdlLCA1MDAwKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzLnNob3dFcnJvcign5Y+R5biD5aSx6LSl77yaJyArIGVycm9yTWVzc2FnZSwgNTAwMCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIOehruS/neWGheWuueS7jeiDveWkjeWItlxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5jb3B5V2l0aG91dEltYWdlVXBsb2FkKCk7XHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGNvcHlFcnJvcikge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcign6ZmN57qn5aSN5Yi25Lmf5aSx6LSlOicsIGNvcHlFcnJvcik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXR1cy5zaG93RXJyb3IoJ+WkjeWItuWksei0pe+8jOivt+mHjeivlScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIENsYXVkZSBDb2RlIFVwZGF0ZTog5pS56L+b6ZSZ6K+v5o+Q56S6XHJcbiAgICBhc3luYyBjb3B5V2l0aEltYWdlVXBsb2FkKCk6IFByb21pc2U8eyB1cGxvYWRlZDogYm9vbGVhbjsgcmVhc29uPzogJ25vLWFwcGlkJyB8ICdiYWNrZW5kJyB8ICd0b2tlbicgfCAnbm9uZScgfT4ge1xuICAgICAgICAvLyDmo4Dmn6XmmK/lkKbmnInlhazkvJflj7fphY3nva5cbiAgICAgICAgaWYgKCF0aGlzLmN1cnJlbnRBcHBJZCkge1xuICAgICAgICAgICAgdGhpcy5zdGF0dXMuc2hvd1dhcm5pbmcoJ+ivt+WFiOmAieaLqeWFrOS8l+WPtycsIDMwMDApO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb3B5V2l0aG91dEltYWdlVXBsb2FkKCk7XG4gICAgICAgICAgICByZXR1cm4geyB1cGxvYWRlZDogZmFsc2UsIHJlYXNvbjogJ25vLWFwcGlkJyB9O1xuICAgICAgICB9XG5cclxuICAgICAgICBpZiAodGhpcy5iYWNrZW5kQXZhaWxhYmxlID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xyXG4gICAgICAgICAgICBpZiAobm93IC0gdGhpcy5sYXN0QmFja2VuZEZhaWx1cmVBdCA8IDUwMDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzLnNob3dXYXJuaW5nKCflkI7nq6/mnI3liqHmnKrlkK/liqjvvIznm7TmjqXlpI3liLbmnKzlnLDlhoXlrrnjgIInLCA0MDAwKTtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmNvcHlXaXRob3V0SW1hZ2VVcGxvYWQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4geyB1cGxvYWRlZDogZmFsc2UsIHJlYXNvbjogJ2JhY2tlbmQnIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmJhY2tlbmRBdmFpbGFibGUgPSBudWxsO1xuICAgICAgICB9XG5cclxuICAgICAgICAvLyDlhYjojrflj5bku6TniYxcbiAgICAgICAgdGhpcy5zdGF0dXMuc2hvd1Byb2Nlc3NpbmcoJ+ato+WcqOiOt+WPluW+ruS/oeiuv+mXruS7pOeJjC4uLicpO1xuXG4gICAgICAgIC8vIOWwneivleiOt+WPlnRva2Vu77yM5aaC5p6c5aSx6LSl5Lmf6IO95aSN5Yi2XG4gICAgICAgIGxldCB0b2tlbjogc3RyaW5nO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdG9rZW4gPSBhd2FpdCB0aGlzLnJlbmRlci5nZXRUb2tlbih0aGlzLmN1cnJlbnRBcHBJZCk7XG4gICAgICAgICAgICB0aGlzLmJhY2tlbmRBdmFpbGFibGUgPSB0cnVlO1xuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignVG9rZW7ojrflj5blpLHotKU6JywgZXJyb3IpO1xuICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgICAgICAgIHRoaXMuc3RhdHVzLnNob3dFcnJvcihtZXNzYWdlIHx8ICfml6Dms5Xojrflj5borr/pl67ku6TniYwnLCA1MDAwKTtcbiAgICAgICAgICAgIHRoaXMubm90aWZ5QmFja2VuZFVuYXZhaWxhYmxlKGVycm9yLCB7IHN1cHByZXNzTm90aWNlOiB0cnVlIH0pO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb3B5V2l0aG91dEltYWdlVXBsb2FkKCk7XG4gICAgICAgICAgICByZXR1cm4geyB1cGxvYWRlZDogZmFsc2UsIHJlYXNvbjogJ3Rva2VuJyB9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0b2tlbikge1xuICAgICAgICAgICAgdGhpcy5zdGF0dXMuc2hvd0Vycm9yKCdUb2tlbuiOt+WPluWksei0pe+8jOWbvueJh+acquS4iuS8oOWIsOWFrOS8l+WPtycsIDUwMDApO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb3B5V2l0aG91dEltYWdlVXBsb2FkKCk7XG4gICAgICAgICAgICByZXR1cm4geyB1cGxvYWRlZDogZmFsc2UsIHJlYXNvbjogJ3Rva2VuJyB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zdGF0dXMuc2hvd1Byb2Nlc3NpbmcoJ+WkhOeQhuWbvueJhy4uLicpO1xuXHJcbiAgICAgICAgdGhpcy5zdGF0dXMuc2hvd1VwbG9hZGluZygn5qOA5rWL5pys5Zyw5Zu+54mHLi4uJyk7XG4gICAgICAgIGNvbnN0IGxtID0gTG9jYWxJbWFnZU1hbmFnZXIuZ2V0SW5zdGFuY2UoKTtcbiAgICAgICAgY29uc3QgaW1hZ2VLZXlzID0gQXJyYXkuZnJvbSgobG0gYXMgYW55KS5pbWFnZXMua2V5cygpKTtcbiAgICAgICAgY29uc3QgbG9jYWxJbWFnZXMgPSBpbWFnZUtleXMuZmlsdGVyKGtleSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbWFnZSA9IChsbSBhcyBhbnkpLmltYWdlcy5nZXQoa2V5KTtcbiAgICAgICAgICAgIHJldHVybiBpbWFnZSAmJiBpbWFnZS51cmwgPT0gbnVsbCAmJiBpbWFnZS5maWxlUGF0aDtcbiAgICAgICAgfSk7XG4gICAgICAgIGxldCBkaWRVcGxvYWQgPSBmYWxzZTtcblxyXG4gICAgICAgIGlmIChsb2NhbEltYWdlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAvLyDmm7TmlrBpbXBvcnTot6/lvoRcbmNvbnN0IHsgaW5pdEFwaUNsaWVudHMsIGdldFdlY2hhdENsaWVudCB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9zZXJ2aWNlcy9hcGknKTtcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoIWdldFdlY2hhdENsaWVudCgpKSB7XHJcbiAgICAgICAgICAgICAgICBpbml0QXBpQ2xpZW50cygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHdlY2hhdENsaWVudCA9IGdldFdlY2hhdENsaWVudCgpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zdGF0dXMuc2hvd1VwbG9hZGluZyhg5LiK5Lyg5Zu+54mH5LitLi4uICgwLyR7bG9jYWxJbWFnZXMubGVuZ3RofSlgKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxJbWFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbWFnZUtleSA9IGxvY2FsSW1hZ2VzW2ldO1xuICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlSW5mbyA9IChsbSBhcyBhbnkpLmltYWdlcy5nZXQoaW1hZ2VLZXkpO1xuXHJcbiAgICAgICAgICAgICAgICBpZiAoIWltYWdlSW5mbyB8fCAhaW1hZ2VJbmZvLmZpbGVQYXRoKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXR1cy5zaG93VXBsb2FkaW5nKGDkuIrkvKDlm77niYfkuK0uLi4gKCR7aSArIDF9LyR7bG9jYWxJbWFnZXMubGVuZ3RofSlgKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLmFwcC52YXVsdC5nZXRGaWxlQnlQYXRoKGltYWdlSW5mby5maWxlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFmaWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybign5Zu+54mH5paH5Lu25LiN5a2Y5ZyoOicsIGltYWdlSW5mby5maWxlUGF0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZURhdGEgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkQmluYXJ5KGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJhc2U2NERhdGEgPSB0aGlzLmFycmF5QnVmZmVyVG9CYXNlNjQoZmlsZURhdGEpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBzbWFydEZpbGVOYW1lID0gYXdhaXQgdGhpcy5nZW5lcmF0ZVNtYXJ0SW1hZ2VOYW1lKGltYWdlSW5mby5maWxlUGF0aCwgaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdXBsb2FkUmVzID0gYXdhaXQgd2VjaGF0Q2xpZW50LnVwbG9hZE1lZGlhKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVkaWFEYXRhOiBiYXNlNjREYXRhLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogc21hcnRGaWxlTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWNjZXNzVG9rZW46IHRva2VuLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZWRpYVR5cGU6ICdpbWFnZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0b3JhZ2VUeXBlOiAncGVybWFuZW50J1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAodXBsb2FkUmVzLmVycmNvZGUgPT09IDAgJiYgdXBsb2FkUmVzLm1lZGlhX2lkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtZWRpYUlkID0gdXBsb2FkUmVzLm1lZGlhX2lkO1xuICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2VJbmZvLnVybCA9IHVwbG9hZFJlcy51cmwgfHwgYGh0dHBzOi8vbW1iaXoucWxvZ28uY24vbW1iaXpfcG5nLyR7bWVkaWFJZH0vMD93eF9mbXQ9cG5nYDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlSW5mby5tZWRpYV9pZCA9IG1lZGlhSWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWRVcGxvYWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihg5Zu+54mH5aSE55CG5aSx6LSlOiAke2ltYWdlSW5mby5maWxlUGF0aH1gLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubm90aWZ5QmFja2VuZFVuYXZhaWxhYmxlKGVycm9yLCB7IHN1cHByZXNzTm90aWNlOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgICAvLyDlm77niYfkuIrkvKDlpLHotKXml7bkuI3kuK3mlq3lpI3liLbmtYHnqIvvvIznu6fnu63lpITnkIbkuIvkuIDlvKDlm77niYdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cclxuICAgICAgICAgICAgdGhpcy5zdGF0dXMuc2hvd1Byb2Nlc3NpbmcoJ+abv+aNouWbvueJh+mTvuaOpS4uLicpO1xyXG4gICAgICAgICAgICBsbS5yZXBsYWNlSW1hZ2VzKHRoaXMuY29udGVudC5nZXRFbGVtZW50cygpLmFydGljbGVEaXYpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zdGF0dXMuc2hvd0NvcHlpbmcoJ+WkjeWItuWIsOWJqui0tOadvy4uLicpO1xuICAgICAgICBcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmIChkb2N1bWVudC5oYXNGb2N1cyAmJiAhZG9jdW1lbnQuaGFzRm9jdXMoKSkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5mb2N1cygpO1xuICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDApKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgYXdhaXQgdGhpcy5yZW5kZXIuY29weUFydGljbGUoKTtcbiAgICAgICAgICAgIGlmIChkaWRVcGxvYWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXR1cy5zaG93U3VjY2Vzcygn5aSN5Yi25oiQ5Yqf77yM5Zu+54mH5bey5LiK5Lyg5Yiw5b6u5L+h5pyN5Yqh5ZmoJywgMjAwMCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzLnNob3dTdWNjZXNzKCflpI3liLbmiJDlip8nLCAyMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+WJqui0tOadv+WkjeWItuWksei0pTonLCBlcnJvcik7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZmFsbGJhY2tDb3B5VG9DbGlwYm9hcmQoKTtcbiAgICAgICAgICAgICAgICBpZiAoZGlkVXBsb2FkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdHVzLnNob3dTdWNjZXNzKCflpI3liLbmiJDlip/vvIzlm77niYflt7LkuIrkvKDliLDlvq7kv6HmnI3liqHlmagnLCAyMDAwKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YXR1cy5zaG93U3VjY2Vzcygn5aSN5Yi25oiQ5YqfJywgMjAwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBjYXRjaCAoZmFsbGJhY2tFcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+mZjee6p+WkjeWItuWksei0pTonLCBmYWxsYmFja0Vycm9yKTtcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXR1cy5oaWRlTWVzc2FnZSgpO1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcign5aSN5Yi25aSx6LSl77ya6K+356Gu5L+d5rWP6KeI5Zmo56qX5Y+j5aSE5LqO5rS75Yqo54q25oCB77yM54S25ZCO6YeN6K+VJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4geyB1cGxvYWRlZDogZGlkVXBsb2FkLCByZWFzb246ICdub25lJyB9O1xuICAgIH1cblxyXG4gICAgLy8gVjLpo47moLznmoTlm77niYfkuIrkvKDlkozojYnnqL/liJvlu7pcclxuICAgIHByaXZhdGUgYXN5bmMgdXBsb2FkSW1hZ2VzQW5kQ3JlYXRlRHJhZnQoYXBwaWQ6IHN0cmluZywgbG9jYWxDb3ZlcjogRmlsZSB8IG51bGwgPSBudWxsKSB7XHJcbiAgICAgICAgLy8g5pu05pawaW1wb3J06Lev5b6EXHJcbmNvbnN0IHsgaW5pdEFwaUNsaWVudHMsIGdldFdlY2hhdENsaWVudCB9ID0gYXdhaXQgaW1wb3J0KCcuLi8uLi9zZXJ2aWNlcy9hcGknKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoIWdldFdlY2hhdENsaWVudCgpKSB7XHJcbiAgICAgICAgICAgIGluaXRBcGlDbGllbnRzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IHdlY2hhdENsaWVudCA9IGdldFdlY2hhdENsaWVudCgpO1xyXG5cclxuICAgICAgICAvLyBDbGF1ZGUgQ29kZSBVcGRhdGU6IOaUuei/m1Rva2Vu6ZSZ6K+v5o+Q56S6XHJcbiAgICAgICAgdGhpcy5zdGF0dXMuc2hvd1Byb2Nlc3NpbmcoJ+iOt+WPluiupOivgeS/oeaBry4uLicpO1xyXG4gICAgICAgIGNvbnN0IHRva2VuID0gYXdhaXQgdGhpcy5yZW5kZXIuZ2V0VG9rZW4oYXBwaWQpO1xyXG4gICAgICAgIGlmICghdG9rZW4pIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdUb2tlbuiOt+WPluWksei0pe+8jOivt+ajgOafpeWFrOS8l+WPt+mFjee9ricpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zdGF0dXMuc2hvd1Byb2Nlc3NpbmcoJ+ajgOafpeiNieeov+eKtuaAgS4uLicpO1xyXG4gICAgICAgIGNvbnN0IGRyYWZ0U3RhdHVzID0gYXdhaXQgdGhpcy5zaG91bGRVcGRhdGVEcmFmdCh0b2tlbik7XHJcbiAgICAgICAgY29uc3QgaXNVcGRhdGUgPSBkcmFmdFN0YXR1cy5zaG91bGRVcGRhdGU7XHJcblxyXG4gICAgICAgIHRoaXMuc3RhdHVzLnNob3dVcGxvYWRpbmcoJ+ajgOa1i+acrOWcsOWbvueJhy4uLicpO1xyXG4gICAgICAgIGNvbnN0IGxtID0gTG9jYWxJbWFnZU1hbmFnZXIuZ2V0SW5zdGFuY2UoKTtcclxuICAgICAgICBjb25zdCBpbWFnZUtleXMgPSBBcnJheS5mcm9tKChsbSBhcyBhbnkpLmltYWdlcy5rZXlzKCkpO1xyXG4gICAgICAgIGNvbnN0IGxvY2FsSW1hZ2VzID0gaW1hZ2VLZXlzLmZpbHRlcihrZXkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBpbWFnZSA9IChsbSBhcyBhbnkpLmltYWdlcy5nZXQoa2V5KTtcclxuICAgICAgICAgICAgcmV0dXJuIGltYWdlICYmIGltYWdlLnVybCA9PSBudWxsICYmIGltYWdlLmZpbGVQYXRoO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAobG9jYWxJbWFnZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXR1cy5zaG93VXBsb2FkaW5nKGDkuIrkvKDlm77niYfkuK0uLi4gKDAvJHtsb2NhbEltYWdlcy5sZW5ndGh9KWApO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbEltYWdlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaW1hZ2VLZXkgPSBsb2NhbEltYWdlc1tpXTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGltYWdlSW5mbyA9IChsbSBhcyBhbnkpLmltYWdlcy5nZXQoaW1hZ2VLZXkpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZiAoIWltYWdlSW5mbyB8fCAhaW1hZ2VJbmZvLmZpbGVQYXRoKSBjb250aW51ZTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXR1cy5zaG93VXBsb2FkaW5nKGDkuIrkvKDlm77niYfkuK0uLi4gKCR7aSArIDF9LyR7bG9jYWxJbWFnZXMubGVuZ3RofSlgKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5hcHAudmF1bHQuZ2V0RmlsZUJ5UGF0aChpbWFnZUluZm8uZmlsZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghZmlsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ+WbvueJh+aWh+S7tuS4jeWtmOWcqDonLCBpbWFnZUluZm8uZmlsZVBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmlsZURhdGEgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5yZWFkQmluYXJ5KGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGJhc2U2NERhdGEgPSB0aGlzLmFycmF5QnVmZmVyVG9CYXNlNjQoZmlsZURhdGEpO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNtYXJ0RmlsZU5hbWUgPSBhd2FpdCB0aGlzLmdlbmVyYXRlU21hcnRJbWFnZU5hbWUoaW1hZ2VJbmZvLmZpbGVQYXRoLCBpKTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB1cGxvYWRSZXMgPSBhd2FpdCB3ZWNoYXRDbGllbnQudXBsb2FkTWVkaWEoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZWRpYURhdGE6IGJhc2U2NERhdGEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBzbWFydEZpbGVOYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhY2Nlc3NUb2tlbjogdG9rZW4sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lZGlhVHlwZTogJ2ltYWdlJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RvcmFnZVR5cGU6ICdwZXJtYW5lbnQnXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVwbG9hZFJlcy5lcnJjb2RlID09PSAwICYmIHVwbG9hZFJlcy5tZWRpYV9pZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBtZWRpYUlkID0gdXBsb2FkUmVzLm1lZGlhX2lkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWFnZUluZm8udXJsID0gdXBsb2FkUmVzLnVybCB8fCBgaHR0cHM6Ly9tbWJpei5xbG9nby5jbi9tbWJpel9wbmcvJHttZWRpYUlkfS8wP3d4X2ZtdD1wbmdgO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWFnZUluZm8ubWVkaWFfaWQgPSBtZWRpYUlkO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yID0gdXBsb2FkUmVzLmVycm1zZyB8fCAn5pyq55+l6ZSZ6K+vJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihg5Zu+54mH5LiK5Lyg5aSx6LSlOiAke2ZpbGUubmFtZX0sIOmUmeivrzogJHtlcnJvcn1gKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYOWbvueJh+WkhOeQhuWksei0pTogJHtpbWFnZUluZm8uZmlsZVBhdGh9YCwgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIOWbvueJh+S4iuS8oOWksei0peaXtuS4jeS4reaWreWPkeW4g+a1geeoi++8jOe7p+e7reWkhOeQhuS4i+S4gOW8oOWbvueJh1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLnN0YXR1cy5zaG93UHJvY2Vzc2luZygn5pu/5o2i5Zu+54mH6ZO+5o6lLi4uJyk7XHJcbiAgICAgICAgICAgIGxtLnJlcGxhY2VJbWFnZXModGhpcy5jb250ZW50LmdldEVsZW1lbnRzKCkuYXJ0aWNsZURpdik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnN0YXR1cy5zaG93VXBsb2FkaW5nKCflpITnkIblsIHpnaIuLi4nKTtcclxuICAgICAgICBsZXQgbWVkaWFJZCA9ICcnO1xyXG4gICAgICAgIGlmIChsb2NhbENvdmVyKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvdmVyRGF0YSA9IGF3YWl0IGxvY2FsQ292ZXIuYXJyYXlCdWZmZXIoKTtcclxuICAgICAgICAgICAgY29uc3QgYmFzZTY0RGF0YSA9IHRoaXMuYXJyYXlCdWZmZXJUb0Jhc2U2NChjb3ZlckRhdGEpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29uc3QgY292ZXJSZXMgPSBhd2FpdCB3ZWNoYXRDbGllbnQudXBsb2FkTWVkaWEoe1xyXG4gICAgICAgICAgICAgICAgbWVkaWFEYXRhOiBiYXNlNjREYXRhLFxyXG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IGxvY2FsQ292ZXIubmFtZSxcclxuICAgICAgICAgICAgICAgIGFjY2Vzc1Rva2VuOiB0b2tlbixcclxuICAgICAgICAgICAgICAgIG1lZGlhVHlwZTogJ2ltYWdlJyxcclxuICAgICAgICAgICAgICAgIHN0b3JhZ2VUeXBlOiAncGVybWFuZW50J1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChjb3ZlclJlcy5tZWRpYV9pZCkge1xyXG4gICAgICAgICAgICAgICAgbWVkaWFJZCA9IGNvdmVyUmVzLm1lZGlhX2lkO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCflsIHpnaLkuIrkvKDlpLHotKU6ICcgKyBjb3ZlclJlcy5lcnJtc2cpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbWVkaWFJZCA9IGF3YWl0IHRoaXMucmVuZGVyLmdldERlZmF1bHRDb3Zlcih0b2tlbik7XHJcbiAgICAgICAgICAgIGlmICghbWVkaWFJZCkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfml6Dms5Xojrflj5blsIHpnaLlm77niYfvvIzor7fmiYvliqjpgInmi6nkuIDlvKDlsIHpnaLlm77niYfmiJbnoa7kv53lvq7kv6HntKDmnZDlupPkuK3mnInlm77niYcnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgbWV0YWRhdGEgPSB0aGlzLnJlbmRlci5nZXRNZXRhZGF0YSgpO1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRGaWxlTmFtZSA9IHRoaXMuY3VycmVudEZpbGU/LmJhc2VuYW1lIHx8ICfmnKrlkb3lkI3mlofnq6AnO1xyXG4gICAgICAgIGNvbnN0IGZpbmFsVGl0bGUgPSBtZXRhZGF0YS50aXRsZSB8fCB0aGlzLnJlbmRlci50aXRsZSB8fCBjdXJyZW50RmlsZU5hbWU7XHJcbiAgICAgICAgY29uc3QgZmluYWxEaWdlc3QgPSBtZXRhZGF0YS5kaWdlc3QgfHwgZmluYWxUaXRsZS5zdWJzdHJpbmcoMCwgMTAwKTtcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBhcnRpY2xlOiBEcmFmdEFydGljbGUgPSB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBmaW5hbFRpdGxlLFxyXG4gICAgICAgICAgICBhdXRob3I6IG1ldGFkYXRhLmF1dGhvciB8fCAnJyxcclxuICAgICAgICAgICAgZGlnZXN0OiBmaW5hbERpZ2VzdCxcclxuICAgICAgICAgICAgY29udGVudDogdGhpcy5yZW5kZXIuZ2V0QXJ0aWNsZUNvbnRlbnQoKSxcclxuICAgICAgICAgICAgY29udGVudF9zb3VyY2VfdXJsOiBtZXRhZGF0YS5jb250ZW50X3NvdXJjZV91cmwgfHwgJycsXHJcbiAgICAgICAgICAgIHRodW1iX21lZGlhX2lkOiBtZWRpYUlkLFxyXG4gICAgICAgICAgICBuZWVkX29wZW5fY29tbWVudDogbWV0YWRhdGEubmVlZF9vcGVuX2NvbW1lbnQgPyAxIDogMCxcclxuICAgICAgICAgICAgb25seV9mYW5zX2Nhbl9jb21tZW50OiBtZXRhZGF0YS5vbmx5X2ZhbnNfY2FuX2NvbW1lbnQgPyAxIDogMCxcclxuICAgICAgICAgICAgcGljX2Nyb3BfMjM1XzE6IG1ldGFkYXRhLnBpY19jcm9wXzIzNV8xIHx8ICcnLFxyXG4gICAgICAgICAgICBwaWNfY3JvcF8xXzE6IG1ldGFkYXRhLnBpY19jcm9wXzFfMSB8fCAnJ1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGxldCBkcmFmdFJlczogYW55O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChpc1VwZGF0ZSAmJiBkcmFmdFN0YXR1cy5tZWRpYV9pZCkge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXR1cy5zaG93UHJvY2Vzc2luZygn5pu05paw6I2J56i/Li4uJyk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB2M0FydGljbGUgPSB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogYXJ0aWNsZS50aXRsZSxcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGFydGljbGUuY29udGVudCxcclxuICAgICAgICAgICAgICAgIGF1dGhvcjogYXJ0aWNsZS5hdXRob3IsXHJcbiAgICAgICAgICAgICAgICBkaWdlc3Q6IGFydGljbGUuZGlnZXN0LFxyXG4gICAgICAgICAgICAgICAgY29udGVudF9zb3VyY2VfdXJsOiBhcnRpY2xlLmNvbnRlbnRfc291cmNlX3VybCxcclxuICAgICAgICAgICAgICAgIHRodW1iX21lZGlhX2lkOiBhcnRpY2xlLnRodW1iX21lZGlhX2lkLFxyXG4gICAgICAgICAgICAgICAgc2hvd19jb3Zlcl9waWM6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBuZWVkX29wZW5fY29tbWVudDogQm9vbGVhbihhcnRpY2xlLm5lZWRfb3Blbl9jb21tZW50KSxcclxuICAgICAgICAgICAgICAgIG9ubHlfZmFuc19jYW5fY29tbWVudDogQm9vbGVhbihhcnRpY2xlLm9ubHlfZmFuc19jYW5fY29tbWVudClcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGRyYWZ0UmVzID0gYXdhaXQgd2VjaGF0Q2xpZW50LnVwZGF0ZURyYWZ0KFxyXG4gICAgICAgICAgICAgICAgZHJhZnRTdGF0dXMubWVkaWFfaWQsXHJcbiAgICAgICAgICAgICAgICBkcmFmdFN0YXR1cy5pbmRleCxcclxuICAgICAgICAgICAgICAgIHYzQXJ0aWNsZSxcclxuICAgICAgICAgICAgICAgIHRva2VuXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zdGF0dXMuc2hvd1Byb2Nlc3NpbmcoJ+WIm+W7uuiNieeovy4uLicpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29uc3QgdjNBcnRpY2xlID0ge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IGFydGljbGUudGl0bGUsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiBhcnRpY2xlLmNvbnRlbnQsXHJcbiAgICAgICAgICAgICAgICBhdXRob3I6IGFydGljbGUuYXV0aG9yLFxyXG4gICAgICAgICAgICAgICAgZGlnZXN0OiBhcnRpY2xlLmRpZ2VzdCxcclxuICAgICAgICAgICAgICAgIGNvbnRlbnRfc291cmNlX3VybDogYXJ0aWNsZS5jb250ZW50X3NvdXJjZV91cmwsXHJcbiAgICAgICAgICAgICAgICB0aHVtYl9tZWRpYV9pZDogYXJ0aWNsZS50aHVtYl9tZWRpYV9pZCxcclxuICAgICAgICAgICAgICAgIHNob3dfY292ZXJfcGljOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgbmVlZF9vcGVuX2NvbW1lbnQ6IEJvb2xlYW4oYXJ0aWNsZS5uZWVkX29wZW5fY29tbWVudCksXHJcbiAgICAgICAgICAgICAgICBvbmx5X2ZhbnNfY2FuX2NvbW1lbnQ6IEJvb2xlYW4oYXJ0aWNsZS5vbmx5X2ZhbnNfY2FuX2NvbW1lbnQpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBkcmFmdFJlcyA9IGF3YWl0IHdlY2hhdENsaWVudC5jcmVhdGVEcmFmdChbdjNBcnRpY2xlXSwgdG9rZW4pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZiAoZHJhZnRSZXMuZXJyY29kZSAhPT0gMCkge1xyXG4gICAgICAgICAgICBjb25zdCBvcGVyYXRpb24gPSBpc1VwZGF0ZSA/ICfmm7TmlrAnIDogJ+WIm+W7uic7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgJHtvcGVyYXRpb2596I2J56i/5aSx6LSlOiBgICsgKGRyYWZ0UmVzLmVycm1zZyB8fCAn5pyq55+l6ZSZ6K+vJykpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIHNob3VsZFVwZGF0ZURyYWZ0KHRva2VuOiBzdHJpbmcpOiBQcm9taXNlPHsgc2hvdWxkVXBkYXRlOiBib29sZWFuOyBtZWRpYV9pZD86IHN0cmluZzsgaW5kZXg6IG51bWJlciB9PiB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudFRpdGxlID0gdGhpcy5jdXJyZW50RmlsZT8uYmFzZW5hbWUgfHwgdGhpcy5yZW5kZXIudGl0bGUgfHwgJ+acquWRveWQjeaWh+eroCc7XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIOabtOaWsGltcG9ydOi3r+W+hFxyXG5jb25zdCB7IGluaXRBcGlDbGllbnRzLCBnZXRXZWNoYXRDbGllbnQgfSA9IGF3YWl0IGltcG9ydCgnLi4vLi4vc2VydmljZXMvYXBpJyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoIWdldFdlY2hhdENsaWVudCgpKSB7XHJcbiAgICAgICAgICAgICAgICBpbml0QXBpQ2xpZW50cygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHdlY2hhdENsaWVudCA9IGdldFdlY2hhdENsaWVudCgpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgZHJhZnRzUmVzID0gYXdhaXQgd2VjaGF0Q2xpZW50LmdldERyYWZ0TGlzdCh0b2tlbiwgMCwgMjApO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRyYWZ0c1Jlcy50b3RhbF9jb3VudCAmJiBkcmFmdHNSZXMudG90YWxfY291bnQgPiAwICYmIGRyYWZ0c1Jlcy5pdGVtICYmIGRyYWZ0c1Jlcy5pdGVtLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZHJhZnRzUmVzLml0ZW0ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBkcmFmdCA9IGRyYWZ0c1Jlcy5pdGVtW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRyYWZ0VGl0bGUgPSBkcmFmdC5jb250ZW50Py5uZXdzX2l0ZW0/LlswXT8udGl0bGUgfHwgJyc7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkcmFmdFRpdGxlICYmIGRyYWZ0VGl0bGUgPT09IGN1cnJlbnRUaXRsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2hvdWxkVXBkYXRlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVkaWFfaWQ6IGRyYWZ0Lm1lZGlhX2lkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IDBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiB7IHNob3VsZFVwZGF0ZTogZmFsc2UsIGluZGV4OiAwIH07XHJcblxyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+iNieeov+ajgOa1i+Wksei0pTonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHNob3VsZFVwZGF0ZTogZmFsc2UsIGluZGV4OiAwIH07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVTbWFydEltYWdlTmFtZShvcmlnaW5hbFBhdGg6IHN0cmluZywgaW5kZXg6IG51bWJlcik6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICAgICAgY29uc3QgYXJ0aWNsZVRpdGxlID0gdGhpcy5jdXJyZW50RmlsZT8uYmFzZW5hbWUgfHwgdGhpcy5yZW5kZXIudGl0bGUgfHwgJ+acquWRveWQjeaWh+eroCc7XHJcbiAgICAgICAgY29uc3QgY2xlYW5UaXRsZSA9IHRoaXMuY2xlYW5GaWxlTmFtZShhcnRpY2xlVGl0bGUpO1xyXG4gICAgICAgIGNvbnN0IHNlY3Rpb25UaXRsZSA9IGF3YWl0IHRoaXMuZmluZEltYWdlU2VjdGlvbihvcmlnaW5hbFBhdGgpO1xyXG4gICAgICAgIGNvbnN0IGNsZWFuU2VjdGlvbiA9IHNlY3Rpb25UaXRsZSA/IHRoaXMuY2xlYW5GaWxlTmFtZShzZWN0aW9uVGl0bGUpIDogJyc7XHJcbiAgICAgICAgY29uc3QgZXh0ID0gb3JpZ2luYWxQYXRoLnNwbGl0KCcuJykucG9wKCkgfHwgJ3BuZyc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IG5ld05hbWUgPSBjbGVhblRpdGxlO1xyXG4gICAgICAgIGlmIChjbGVhblNlY3Rpb24pIHtcclxuICAgICAgICAgICAgbmV3TmFtZSArPSBgLSR7Y2xlYW5TZWN0aW9ufWA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG5ld05hbWUgKz0gYC0ke1N0cmluZyhpbmRleCArIDEpLnBhZFN0YXJ0KDIsICcwJyl9LiR7ZXh0fWA7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXdOYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY2xlYW5GaWxlTmFtZShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiBuYW1lXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC9bXFxcXC86Kj9cIjw+fF0vZywgJycpXHJcbiAgICAgICAgICAgIC5yZXBsYWNlKC9cXHMrL2csICctJylcclxuICAgICAgICAgICAgLnJlcGxhY2UoLy0rL2csICctJylcclxuICAgICAgICAgICAgLnJlcGxhY2UoL14tfC0kL2csICcnKVxyXG4gICAgICAgICAgICAuc3Vic3RyaW5nKDAsIDUwKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzeW5jIGZpbmRJbWFnZVNlY3Rpb24oaW1hZ2VQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5jdXJyZW50RmlsZSkgcmV0dXJuICcnO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LnJlYWQodGhpcy5jdXJyZW50RmlsZSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdCgnXFxuJyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBsZXQgaW1hZ2VMaW5lSW5kZXggPSAtMTtcclxuICAgICAgICAgICAgY29uc3QgaW1hZ2VGaWxlTmFtZSA9IGltYWdlUGF0aC5zcGxpdCgnLycpLnBvcCgpIHx8ICcnO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbGluZSA9IGxpbmVzW2ldO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxpbmUuaW5jbHVkZXMoaW1hZ2VGaWxlTmFtZSkgfHwgXHJcbiAgICAgICAgICAgICAgICAgICAgbGluZS5pbmNsdWRlcyhpbWFnZVBhdGgpIHx8XHJcbiAgICAgICAgICAgICAgICAgICAgKGxpbmUuaW5jbHVkZXMoJyFbWycpICYmIGxpbmUuaW5jbHVkZXMoaW1hZ2VGaWxlTmFtZS5yZXBsYWNlKC9cXC5bXi8uXSskLywgJycpKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbWFnZUxpbmVJbmRleCA9IGk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmIChpbWFnZUxpbmVJbmRleCA9PT0gLTEpIHJldHVybiAnJztcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBpbWFnZUxpbmVJbmRleDsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmUgPSBsaW5lc1tpXS50cmltKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAobGluZS5zdGFydHNXaXRoKCcjIyAnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRpdGxlID0gbGluZS5yZXBsYWNlKCcjIyAnLCAnJykudHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aXRsZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IGltYWdlTGluZUluZGV4OyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbGluZSA9IGxpbmVzW2ldLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoJyMgJykgJiYgIWxpbmUuc3RhcnRzV2l0aCgnIyMgJykpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCB0aXRsZSA9IGxpbmUucmVwbGFjZSgnIyAnLCAnJykudHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aXRsZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuICcnO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAnJztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luYyBmYWxsYmFja0NvcHlUb0NsaXBib2FyZCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgLy8gMSkg5LyY5YWI5bCd6K+VRWxlY3Ryb27liarotLTmnb/vvIjlj6/lpI3liLZIVE1MK+e6r+aWh+acrO+8iVxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgaHRtbCA9IHRoaXMucmVuZGVyLmdldEFydGljbGVDb250ZW50KCk7XG4gICAgICAgICAgICBjb25zdCB0ZXh0ID0gdGhpcy5yZW5kZXIuZ2V0QXJ0aWNsZVRleHQoKTtcbiAgICAgICAgICAgIGNvbnN0IHcgPSB3aW5kb3cgYXMgYW55O1xuICAgICAgICAgICAgY29uc3QgZWxlY3Ryb24gPSB3Py5yZXF1aXJlID8gdy5yZXF1aXJlKCdlbGVjdHJvbicpIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgY29uc3QgZWxlY3Ryb25DbGlwYm9hcmQgPSBlbGVjdHJvbj8uY2xpcGJvYXJkO1xuICAgICAgICAgICAgaWYgKGVsZWN0cm9uQ2xpcGJvYXJkICYmIHR5cGVvZiBlbGVjdHJvbkNsaXBib2FyZC53cml0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGVsZWN0cm9uQ2xpcGJvYXJkLndyaXRlKHsgaHRtbCwgdGV4dCB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIOW/veeVpe+8jOe7p+e7reS9v+eUqFdlYumZjee6p+WkjeWItlxuICAgICAgICB9XG5cbiAgICAgICAgLy8gMikg5L2/55So57qv5paH5pys6ZmN57qn5aSN5Yi277yIZXhlY0NvbW1hbmTvvIlcbiAgICAgICAgY29uc3QgdGV4dGFyZWEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpO1xuICAgICAgICB0ZXh0YXJlYS52YWx1ZSA9IHRoaXMucmVuZGVyLmdldEFydGljbGVUZXh0KCk7XG4gICAgICAgIHRleHRhcmVhLnN0eWxlLnBvc2l0aW9uID0gJ2ZpeGVkJztcbiAgICAgICAgdGV4dGFyZWEuc3R5bGUubGVmdCA9ICctOTk5OXB4JztcbiAgICAgICAgdGV4dGFyZWEuc3R5bGUudG9wID0gJzAnO1xuICAgICAgICB0ZXh0YXJlYS5zdHlsZS5vcGFjaXR5ID0gJzAnO1xuICAgICAgICB0ZXh0YXJlYS5zdHlsZS5wb2ludGVyRXZlbnRzID0gJ25vbmUnO1xuICAgICAgICBcbiAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0ZXh0YXJlYSk7XG4gICAgICAgIFxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGV4dGFyZWEuZm9jdXMoKTtcbiAgICAgICAgICAgIHRleHRhcmVhLnNlbGVjdCgpO1xuICAgICAgICAgICAgdGV4dGFyZWEuc2V0U2VsZWN0aW9uUmFuZ2UoMCwgdGV4dGFyZWEudmFsdWUubGVuZ3RoKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3Qgc3VjY2Vzc2Z1bCA9IGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7XG4gICAgICAgICAgICBpZiAoIXN1Y2Nlc3NmdWwpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2V4ZWNDb21tYW5kIGNvcHkgZmFpbGVkJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRleHRhcmVhKTtcbiAgICAgICAgfVxuICAgIH1cblxyXG4gICAgcHJpdmF0ZSBhc3luYyBjb3B5V2l0aG91dEltYWdlVXBsb2FkKCkge1xyXG4gICAgICAgIHRoaXMuc3RhdHVzLnNob3dDb3B5aW5nKCflpI3liLbliLDliarotLTmnb/kuK0uLi4nKTtcclxuICAgICAgICBcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBpZiAoZG9jdW1lbnQuaGFzRm9jdXMgJiYgIWRvY3VtZW50Lmhhc0ZvY3VzKCkpIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5mb2N1cygpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDEwMCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLnJlbmRlci5jb3B5QXJ0aWNsZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnN0YXR1cy5zaG93U3VjY2Vzcygn5aSN5Yi25oiQ5Yqf77yM5pyq5LiK5Lyg5Zu+54mH5Yiw5YWs5LyX5Y+3JywgMjAwMCk7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCfliarotLTmnb/lpI3liLblpLHotKU6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5mYWxsYmFja0NvcHlUb0NsaXBib2FyZCgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0dXMuc2hvd1N1Y2Nlc3MoJ+WkjeWItuaIkOWKn++8jOacquS4iuS8oOWbvueJh+WIsOWFrOS8l+WPtycsIDIwMDApO1xyXG4gICAgICAgICAgICB9IGNhdGNoIChmYWxsYmFja0Vycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCflhbzlrrnlpI3liLbkuZ/lpLHotKU6JywgZmFsbGJhY2tFcnJvcik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXR1cy5oaWRlTWVzc2FnZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0dXMuc2hvd0Vycm9yKCflpI3liLblpLHotKXvvIzor7fnoa7orqTnqpflj6PlpITkuo7mtLvliqjnirbmgIHlkI7ph43or5XjgIInLCA0MDAwKTtcclxuICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoJ+WkjeWItuWksei0pe+8jOivt+ehruiupE9ic2lkaWFu56qX5Y+j5aSE5LqO5rS75Yqo54q25oCB5ZCO6YeN6K+V44CCJyk7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+WkjeWItuWksei0pe+8jOivt+ehruiupE9ic2lkaWFu56qX5Y+j5aSE5LqO5rS75Yqo54q25oCB5ZCO6YeN6K+V44CCJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgYXJyYXlCdWZmZXJUb0Jhc2U2NChidWZmZXI6IEFycmF5QnVmZmVyKTogc3RyaW5nIHtcclxuICAgICAgICBjb25zdCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlcik7XHJcbiAgICAgICAgbGV0IGJpbmFyeSA9ICcnO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYnl0ZXMuYnl0ZUxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGJpbmFyeSArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGVzW2ldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGJ0b2EoYmluYXJ5KTtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBiYXRjaFBvc3QoZm9sZGVyOiBURm9sZGVyKSB7XHJcbiAgICAgICAgY29uc3QgZmlsZXMgPSBmb2xkZXIuY2hpbGRyZW4uZmlsdGVyKChjaGlsZDogVEFic3RyYWN0RmlsZSkgPT4gY2hpbGQucGF0aC50b0xvY2FsZUxvd2VyQ2FzZSgpLmVuZHNXaXRoKCcubWQnKSk7XHJcbiAgICAgICAgaWYgKCFmaWxlcykge1xyXG4gICAgICAgICAgICBuZXcgTm90aWNlKCfmsqHmnInlj6/muLLmn5PnmoTnrJTorrDmiJbmlofku7bkuI3mlK/mjIHmuLLmn5MnKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5pc0NhbmNlbFVwbG9hZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuaXNCYXRjaFJ1bmluZyA9IHRydWU7XHJcblxyXG4gICAgICAgIC8vIENsYXVkZSBDb2RlIFVwZGF0ZVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGZpbGUgb2YgZmlsZXMpIHtcclxuICAgICAgICAgICAgICAgIC8vIOS9v+eUqCBpbnN0YW5jZW9mIOajgOafpeiAjOmdnuexu+Wei+aWreiogFxyXG4gICAgICAgICAgICAgICAgaWYgKCEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5zaG93TG9hZGluZyhg5Y2z5bCG5Y+R5biDOiAke2ZpbGUubmFtZX1gLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCA1MDAwKSk7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pc0NhbmNlbFVwbG9hZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGVhbkFydGljbGVEYXRhKCk7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnJlbmRlck1hcmtkb3duKGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wb3N0QXJ0aWNsZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNDYW5jZWxVcGxvYWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hvd01zZyhg5om56YeP5Y+R5biD5a6M5oiQ77ya5oiQ5Yqf5Y+R5biDICR7ZmlsZXMubGVuZ3RofSDnr4fnrJTorrBgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgbmV3IE5vdGljZSgn5om56YeP5Y+R5biD5aSx6LSlOiAnICsgZS5tZXNzYWdlKTtcclxuICAgICAgICB9IGZpbmFsbHkge1xyXG4gICAgICAgICAgICB0aGlzLmlzQmF0Y2hSdW5pbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5pc0NhbmNlbFVwbG9hZCA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG5vdGlmeUJhY2tlbmRVbmF2YWlsYWJsZShlcnJvcjogdW5rbm93biwgb3B0aW9ucz86IHsgc3VwcHJlc3NOb3RpY2U/OiBib29sZWFuIH0pOiBib29sZWFuIHtcbiAgICAgICAgY29uc3QgbWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgICAgY29uc3Qga2V5d29yZHMgPSBbXG4gICAgICAgICAgICAn5peg5rOV6L+e5o6l5Yiw5pyN5Yqh5ZmoJyxcbiAgICAgICAgICAgICflkI7nq6/mnI3liqHmnKrlkK/liqgnLFxuICAgICAgICAgICAgJ0ZhaWxlZCB0byBmZXRjaCcsXG4gICAgICAgICAgICAnTmV0d29ya0Vycm9yJyxcbiAgICAgICAgICAgICdDT1JTJyxcbiAgICAgICAgICAgICdmZXRjaCBmYWlsZWQnLFxuICAgICAgICAgICAgJ+WPr+iDveeahENPUlPpl67popjljp/lm6AnXG4gICAgICAgIF07XG4gICAgICAgIGNvbnN0IG1hdGNoZWQgPSBrZXl3b3Jkcy5zb21lKGtleXdvcmQgPT4gbWVzc2FnZS5pbmNsdWRlcyhrZXl3b3JkKSk7XG5cbiAgICAgICAgaWYgKG1hdGNoZWQpIHtcbiAgICAgICAgICAgIHRoaXMuYmFja2VuZEF2YWlsYWJsZSA9IGZhbHNlO1xuICAgICAgICAgICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIHRoaXMubGFzdEJhY2tlbmRGYWlsdXJlQXQgPSBub3c7XG4gICAgICAgICAgICBpZiAobm93IC0gdGhpcy5sYXN0QmFja2VuZE5vdGljZUF0ID4gMzAwMCkge1xuICAgICAgICAgICAgICAgIHRoaXMubGFzdEJhY2tlbmROb3RpY2VBdCA9IG5vdztcbiAgICAgICAgICAgICAgICAvLyDmj5Lku7blhoXml6Xlv5fkuI7pgJrnn6VcbiAgICAgICAgICAgICAgICB0aGlzLnN0YXR1cy5zaG93RXJyb3IoJ+WQjuerr+acjeWKoeacquWQr+WKqOaIluaXoOazlei/nuaOpeOAguW3suWIh+aNouS4uuKAnOS7heWkjeWItuKAneaooeW8j+OAgicsIDYwMDApO1xuICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucz8uc3VwcHJlc3NOb3RpY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3IE5vdGljZSgn5pyq5qOA5rWL5Yiw5ZCO56uv5pyN5Yqh77yM6K+35YWI5ZCv5Yqo5pys5Zyw5pyN5Yqh5oiW5qOA5p+l572R57uc6L+e5o6l44CCJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG1hdGNoZWQ7XG4gICAgfVxuXHJcbiAgICAvLyDojrflj5blvZPliY3nirbmgIFcclxuICAgIGdldEN1cnJlbnRBcHBJZCgpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRBcHBJZDtcclxuICAgIH1cclxuXHJcbiAgICBnZXRDdXJyZW50RmlsZSgpOiBURmlsZSB8IHVuZGVmaW5lZCB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudEZpbGU7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QXNzZXRzTWFuYWdlcigpOiBBc3NldHNNYW5hZ2VyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hc3NldHNNYW5hZ2VyO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFNldHRpbmdzKCk6IFd4U2V0dGluZ3Mge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNldHRpbmdzO1xyXG4gICAgfVxyXG59XG4iXX0=