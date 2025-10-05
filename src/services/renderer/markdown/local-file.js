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
import { Notice, TFile, requestUrl, Platform } from "obsidian";
import { Extension } from "./extension";
import { IsImageLibReady, PrepareImageLib, WebpToJPG, UploadImageToWx } from "../../wechat/imagelib";
const LocalFileRegex = /^!\[\[(.*?)\]\]/;
export class LocalImageManager {
    constructor() {
        this.images = new Map();
    }
    // 静态方法，用于获取实例
    static getInstance() {
        if (!LocalImageManager.instance) {
            LocalImageManager.instance = new LocalImageManager();
        }
        return LocalImageManager.instance;
    }
    setImage(path, info) {
        if (!this.images.has(path)) {
            this.images.set(path, info);
        }
    }
    isWebp(file) {
        if (file instanceof TFile) {
            return file.extension.toLowerCase() === 'webp';
        }
        const name = file.toLowerCase();
        return name.endsWith('.webp');
    }
    async uploadLocalImage(token, vault, type = '') {
        const keys = this.images.keys();
        await PrepareImageLib();
        const result = [];
        for (let key of keys) {
            const value = this.images.get(key);
            if (value == null)
                continue;
            if (value.url != null)
                continue;
            const file = vault.getFileByPath(value.filePath);
            if (file == null)
                continue;
            let fileData = await vault.readBinary(file);
            let name = file.name;
            if (this.isWebp(file)) {
                if (IsImageLibReady()) {
                    fileData = WebpToJPG(fileData);
                    name = name.toLowerCase().replace('.webp', '.jpg');
                }
                else {
                    console.error('wasm not ready for webp');
                }
            }
            const res = await UploadImageToWx(new Blob([fileData]), name, token, type);
            if (res.errcode != 0) {
                const msg = `上传图片失败: ${res.errcode} ${res.errmsg}`;
                new Notice(msg);
                console.error(msg);
            }
            else {
                // 添加成功上传的调试信息
                console.log(`✅ 图片上传成功: ${name}`, {
                    filePath: value.filePath,
                    oldUrl: value.url,
                    newUrl: res.url,
                    mediaId: res.media_id
                });
            }
            // 按照v2版本的做法：优先使用后端返回的URL，否则使用fallback
            value.media_id = res.media_id || null;
            value.url = res.url || (res.media_id ? `https://mmbiz.qlogo.cn/mmbiz_png/${res.media_id}/0?wx_fmt=png` : null);
            if (!res.url && res.media_id) {
                console.log(`🔧 后端未返回URL，使用fallback: ${value.url}`);
            }
            else if (res.url) {
                console.log(`✅ 使用后端返回的URL: ${value.url}`);
            }
            // 添加更新后的状态调试信息
            console.log(`🔗 更新图片信息: ${name}`, {
                resUrl: value.resUrl,
                filePath: value.filePath,
                finalUrl: value.url,
                mediaId: value.media_id,
                originalUrl: res.url,
                generatedUrl: value.url
            });
            result.push(res);
        }
        return result;
    }
    checkImageExt(filename) {
        const name = filename.toLowerCase();
        if (name.endsWith('.jpg')
            || name.endsWith('.jpeg')
            || name.endsWith('.png')
            || name.endsWith('.gif')
            || name.endsWith('.bmp')
            || name.endsWith('.tiff')
            || name.endsWith('.svg')
            || name.endsWith('.webp')) {
            return true;
        }
        return false;
    }
    getImageNameFromUrl(url, type) {
        try {
            // 创建URL对象
            const urlObj = new URL(url);
            // 获取pathname部分
            const pathname = urlObj.pathname;
            // 获取最后一个/后的内容作为文件名
            let filename = pathname.split('/').pop() || '';
            filename = decodeURIComponent(filename);
            if (!this.checkImageExt(filename)) {
                filename = filename + this.getImageExt(type);
            }
            return filename;
        }
        catch (e) {
            // 如果URL解析失败，尝试简单的字符串处理
            const queryIndex = url.indexOf('?');
            if (queryIndex !== -1) {
                url = url.substring(0, queryIndex);
            }
            return url.split('/').pop() || '';
        }
    }
    getImageExtFromBlob(blob) {
        // MIME类型到文件扩展名的映射
        const mimeToExt = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/bmp': '.bmp',
            'image/webp': '.webp',
            'image/svg+xml': '.svg',
            'image/tiff': '.tiff'
        };
        // 获取MIME类型
        const mimeType = blob.type.toLowerCase();
        // 返回对应的扩展名，如果找不到则返回空字符串
        return mimeToExt[mimeType] || '';
    }
    base64ToBlob(src) {
        const items = src.split(',');
        if (items.length != 2) {
            throw new Error('base64格式错误');
        }
        const mineType = items[0].replace('data:', '');
        const base64 = items[1];
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return { blob: new Blob([byteArray], { type: mineType }), ext: this.getImageExt(mineType) };
    }
    async uploadImageFromUrl(url, token, type = '') {
        try {
            const rep = await requestUrl(url);
            await PrepareImageLib();
            let data = rep.arrayBuffer;
            let blob = new Blob([data]);
            let filename = this.getImageNameFromUrl(url, rep.headers['content-type']);
            if (filename == '' || filename == null) {
                filename = 'remote_img' + this.getImageExtFromBlob(blob);
            }
            if (this.isWebp(filename)) {
                if (IsImageLibReady()) {
                    data = WebpToJPG(data);
                    blob = new Blob([data]);
                    filename = filename.toLowerCase().replace('.webp', '.jpg');
                }
                else {
                    console.error('wasm not ready for webp');
                }
            }
            return await UploadImageToWx(blob, filename, token, type);
        }
        catch (e) {
            console.error(e);
            throw new Error('上传图片失败:' + e.message + '|' + url);
        }
    }
    getImageExt(type) {
        const mimeToExt = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/bmp': '.bmp',
            'image/webp': '.webp',
            'image/svg+xml': '.svg',
            'image/tiff': '.tiff'
        };
        return mimeToExt[type] || '.jpg';
    }
    getMimeType(ext) {
        const extToMime = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.bmp': 'image/bmp',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
            '.tiff': 'image/tiff'
        };
        return extToMime[ext.toLowerCase()] || 'image/jpeg';
    }
    getImageInfos(root) {
        const images = root.getElementsByTagName('img');
        const result = [];
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const res = this.images.get(img.src);
            if (res) {
                result.push(res);
            }
        }
        return result;
    }
    async uploadRemoteImage(root, token, type = '') {
        const images = root.getElementsByTagName('img');
        const result = [];
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            if (img.src.includes('mmbiz.qpic.cn'))
                continue;
            // 移动端本地图片不通过src上传
            if (img.src.startsWith('http://localhost/') && Platform.isMobileApp) {
                continue;
            }
            if (img.src.startsWith('http')) {
                const res = await this.uploadImageFromUrl(img.src, token, type);
                if (res.errcode != 0) {
                    const msg = `上传图片失败: ${img.src} ${res.errcode} ${res.errmsg}`;
                    new Notice(msg);
                    console.error(msg);
                }
                // 修复类型兼容性问题，如果没有URL则使用media_id生成URL
                const info = {
                    resUrl: img.src,
                    filePath: "",
                    url: res.url || (res.media_id ? `https://mmbiz.qlogo.cn/mmbiz_png/${res.media_id}/0?wx_fmt=png` : null),
                    media_id: res.media_id || null,
                };
                this.images.set(img.src, info);
                result.push(res);
            }
            else if (img.src.startsWith('data:image/')) {
                const { blob, ext } = this.base64ToBlob(img.src);
                if (!img.id) {
                    img.id = `local-img-${i}`;
                }
                const name = img.id + ext;
                const res = await UploadImageToWx(blob, name, token);
                if (res.errcode != 0) {
                    const msg = `上传图片失败: ${res.errcode} ${res.errmsg}`;
                    new Notice(msg);
                    console.error(msg);
                    continue;
                }
                // 修复类型兼容性问题，如果没有URL则使用media_id生成URL
                const info = {
                    resUrl: '#' + img.id,
                    filePath: "",
                    url: res.url || (res.media_id ? `https://mmbiz.qlogo.cn/mmbiz_png/${res.media_id}/0?wx_fmt=png` : null),
                    media_id: res.media_id || null,
                };
                this.images.set('#' + img.id, info);
                result.push(res);
            }
        }
        return result;
    }
    replaceImages(root) {
        const images = root.getElementsByTagName('img');
        console.log(`🔄 开始替换图片链接，共找到 ${images.length} 张图片`);
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            let value = this.images.get(img.src);
            if (value == null) {
                if (!img.id) {
                    console.error('miss image id, ' + img.src);
                    continue;
                }
                value = this.images.get('#' + img.id);
            }
            if (value == null) {
                console.warn(`📷 未找到图片信息: ${img.src}`);
                continue;
            }
            if (value.url == null) {
                console.warn(`📷 图片未上传，跳过替换: ${img.src}`, value);
                continue;
            }
            // 添加替换调试信息
            console.log(`🔗 替换图片链接: ${img.src} -> ${value.url}`);
            img.setAttribute('src', value.url);
        }
    }
    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    async localImagesToBase64(vault) {
        const keys = this.images.keys();
        const result = new Map();
        for (let key of keys) {
            const value = this.images.get(key);
            if (value == null)
                continue;
            const file = vault.getFileByPath(value.filePath);
            if (file == null)
                continue;
            let fileData = await vault.readBinary(file);
            const base64 = this.arrayBufferToBase64(fileData);
            const mimeType = this.getMimeType(file.extension);
            const data = `data:${mimeType};base64,${base64}`;
            result.set(value.resUrl, data);
        }
        return result;
    }
    async downloadRemoteImage(url) {
        try {
            const rep = await requestUrl(url);
            let data = rep.arrayBuffer;
            let blob = new Blob([data]);
            let ext = this.getImageExtFromBlob(blob);
            if (ext == '' || ext == null) {
                const filename = this.getImageNameFromUrl(url, rep.headers['content-type']);
                ext = '.' + filename.split('.').pop() || 'jpg';
            }
            const base64 = this.arrayBufferToBase64(data);
            const mimeType = this.getMimeType(ext);
            return `data:${mimeType};base64,${base64}`;
        }
        catch (e) {
            console.error(e);
            return '';
        }
    }
    async remoteImagesToBase64(root) {
        const images = root.getElementsByTagName('img');
        const result = new Map();
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            if (!img.src.startsWith('http'))
                continue;
            const base64 = await this.downloadRemoteImage(img.src);
            if (base64 == '')
                continue;
            result.set(img.src, base64);
        }
        return result;
    }
    // Claude Code Update: 保留innerHTML读取操作（用于最终HTML序列化输出）
    async embleImages(root, vault) {
        const localImages = await this.localImagesToBase64(vault);
        const remoteImages = await this.remoteImagesToBase64(root);
        const result = root.cloneNode(true);
        const images = result.getElementsByTagName('img');
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            if (img.src.startsWith('http')) {
                const base64 = remoteImages.get(img.src);
                if (base64 != null) {
                    img.setAttribute('src', base64);
                }
            }
            else {
                const base64 = localImages.get(img.src);
                if (base64 != null) {
                    img.setAttribute('src', base64);
                }
            }
        }
        return result.innerHTML;
    }
    async cleanup() {
        this.images.clear();
    }
}
export class LocalFile extends Extension {
    constructor() {
        super(...arguments);
        this.index = 0;
    }
    generateId() {
        this.index += 1;
        return `fid-${this.index}`;
    }
    getImagePath(path) {
        const res = this.assetsManager.getResourcePath(path);
        if (res == null) {
            console.error('找不到文件：' + path);
            return '';
        }
        const info = {
            resUrl: res.resUrl,
            filePath: res.filePath,
            media_id: null,
            url: null
        };
        LocalImageManager.getInstance().setImage(res.resUrl, info);
        return res.resUrl;
    }
    isImage(file) {
        file = file.toLowerCase();
        return file.endsWith('.png')
            || file.endsWith('.jpg')
            || file.endsWith('.jpeg')
            || file.endsWith('.gif')
            || file.endsWith('.bmp')
            || file.endsWith('.webp');
    }
    parseImageLink(link) {
        if (link.includes('|')) {
            const parts = link.split('|');
            const path = parts[0];
            if (!this.isImage(path))
                return null;
            let width = null;
            let height = null;
            if (parts.length == 2) {
                const size = parts[1].toLowerCase().split('x');
                width = parseInt(size[0]);
                if (size.length == 2 && size[1] != '') {
                    height = parseInt(size[1]);
                }
            }
            return { path, width, height };
        }
        if (this.isImage(link)) {
            return { path: link, width: null, height: null };
        }
        return null;
    }
    getHeaderLevel(line) {
        const match = line.trimStart().match(/^#{1,6}/);
        if (match) {
            return match[0].length;
        }
        return 0;
    }
    async getFileContent(file, header, block) {
        const content = await this.app.vault.adapter.read(file.path);
        if (header == null && block == null) {
            return content;
        }
        let result = '';
        const lines = content.split('\n');
        if (header) {
            let level = 0;
            let append = false;
            for (let line of lines) {
                if (append) {
                    if (level == this.getHeaderLevel(line)) {
                        break;
                    }
                    result += line + '\n';
                    continue;
                }
                if (!line.trim().startsWith('#'))
                    continue;
                const items = line.trim().split(' ');
                if (items.length != 2)
                    continue;
                if (header.trim() != items[1].trim())
                    continue;
                if (this.getHeaderLevel(line)) {
                    result += line + '\n';
                    level = this.getHeaderLevel(line);
                    append = true;
                }
            }
        }
        function isStructuredBlock(line) {
            const trimmed = line.trim();
            return trimmed.startsWith('-') || trimmed.startsWith('>') || trimmed.startsWith('|') || trimmed.match(/^\d+\./);
        }
        if (block) {
            let stopAtEmpty = false;
            let totalLen = 0;
            let structured = false;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.indexOf(block) >= 0) {
                    result = line.replace(block, '').trim();
                    // 标记和结构化内容位于同一行的时候只返回当前的条目
                    if (isStructuredBlock(line)) {
                        break;
                    }
                    // 向上查找内容
                    for (let j = i - 1; j >= 0; j--) {
                        const l = lines[j];
                        if (l.startsWith('#')) {
                            break;
                        }
                        if (l.trim() == '') {
                            if (stopAtEmpty)
                                break;
                            if (j < i - 1 && totalLen > 0)
                                break;
                            stopAtEmpty = true;
                            result = l + '\n' + result;
                            continue;
                        }
                        else {
                            stopAtEmpty = true;
                        }
                        if (structured && !isStructuredBlock(l)) {
                            break;
                        }
                        if (totalLen === 0 && isStructuredBlock(l)) {
                            structured = true;
                        }
                        totalLen += result.length;
                        result = l + '\n' + result;
                    }
                    break;
                }
            }
        }
        return result;
    }
    parseFileLink(link) {
        const info = link.split('|')[0];
        const items = info.split('#');
        let path = items[0];
        let header = null;
        let block = null;
        if (items.length == 2) {
            if (items[1].startsWith('^')) {
                block = items[1];
            }
            else {
                header = items[1];
            }
        }
        return { path, head: header, block };
    }
    async renderFile(link, id) {
        let { path, head: header, block } = this.parseFileLink(link);
        let file = null;
        if (path === '') {
            file = this.app.workspace.getActiveFile();
        }
        else {
            if (!path.endsWith('.md')) {
                path = path + '.md';
            }
            file = this.assetsManager.searchFile(path);
        }
        if (file == null) {
            const msg = '找不到文件：' + path;
            console.error(msg);
            return msg;
        }
        let content = await this.getFileContent(file, header, block);
        if (content.startsWith('---')) {
            content = content.replace(/^(---)$.+?^(---)$.+?/ims, '');
        }
        const body = await this.marked.parse(content);
        return body;
    }
    static async readBlob(src) {
        return await fetch(src).then(response => response.blob());
    }
    parseLinkStyle(link) {
        let filename = '';
        let style = 'style="width:100%;height:100%"';
        let postion = 'left';
        const postions = ['left', 'center', 'right'];
        if (link.includes('|')) {
            const items = link.split('|');
            filename = items[0];
            let size = '';
            if (items.length == 2) {
                if (postions.includes(items[1])) {
                    postion = items[1];
                }
                else {
                    size = items[1];
                }
            }
            else if (items.length == 3) {
                size = items[1];
                if (postions.includes(items[1])) {
                    size = items[2];
                    postion = items[1];
                }
                else {
                    size = items[1];
                    postion = items[2];
                }
            }
            // Claude Code Update: 保留SVG尺寸内联样式（动态计算值）
            if (size != '') {
                const sizes = size.split('x');
                if (sizes.length == 2) {
                    // SVG尺寸需要动态计算，保留内联样式
                    style = `style="width:${sizes[0]}px;height:${sizes[1]}px;"`;
                }
                else {
                    style = `style="width:${sizes[0]}px;"`;
                }
            }
        }
        else {
            filename = link;
        }
        return { filename, style, postion };
    }
    parseSVGLink(link) {
        let classname = 'note-embed-svg-left';
        const postions = new Map([
            ['left', 'note-embed-svg-left'],
            ['center', 'note-embed-svg-center'],
            ['right', 'note-embed-svg-right']
        ]);
        let { filename, style, postion } = this.parseLinkStyle(link);
        classname = postions.get(postion) || classname;
        return { filename, style, classname };
    }
    async renderSVGFile(filename, id) {
        const file = this.assetsManager.searchFile(filename);
        if (file == null) {
            const msg = '找不到文件：' + file;
            console.error(msg);
            return msg;
        }
        const content = await this.getFileContent(file, null, null);
        LocalFile.fileCache.set(filename, content);
        return content;
    }
    markedExtension() {
        return {
            async: true,
            walkTokens: async (token) => {
                if (token.type !== 'LocalImage') {
                    return;
                }
                // 渲染本地图片
                let item = this.parseImageLink(token.href);
                if (item) {
                    const src = this.getImagePath(item.path);
                    const width = item.width ? `width="${item.width}"` : '';
                    const height = item.height ? `height="${item.height}"` : '';
                    token.html = `<img src="${src}" alt="${token.text}" ${width} ${height} />`;
                    return;
                }
                if (token.href.endsWith('.svg') || token.href.includes('.svg|')) {
                    const info = this.parseSVGLink(token.href);
                    const id = this.generateId();
                    let svg = '渲染中';
                    if (LocalFile.fileCache.has(info.filename)) {
                        svg = LocalFile.fileCache.get(info.filename) || '渲染失败';
                    }
                    else {
                        svg = await this.renderSVGFile(info.filename, id) || '渲染失败';
                    }
                    token.html = `<span class="${info.classname}"><span class="note-embed-svg" id="${id}" ${info.style}>${svg}</span></span>`;
                    return;
                }
                const id = this.generateId();
                const content = await this.renderFile(token.href, id);
                const tag = this.callback.settings.embedStyle === 'quote' ? 'blockquote' : 'section';
                token.html = `<${tag} class="note-embed-file" id="${id}">${content}</${tag}>`;
            },
            extensions: [{
                    name: 'LocalImage',
                    level: 'block',
                    start: (src) => {
                        const index = src.indexOf('![[');
                        if (index === -1)
                            return;
                        return index;
                    },
                    tokenizer: (src) => {
                        const matches = src.match(LocalFileRegex);
                        if (matches == null)
                            return;
                        const token = {
                            type: 'LocalImage',
                            raw: matches[0],
                            href: matches[1],
                            text: matches[1]
                        };
                        return token;
                    },
                    renderer: (token) => {
                        return token.html;
                    }
                }]
        };
    }
}
LocalFile.fileCache = new Map();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9jYWwtZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxvY2FsLWZpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7OztHQVlHO0FBR0gsT0FBTyxFQUFFLE1BQU0sRUFBaUIsS0FBSyxFQUF1QixVQUFVLEVBQUUsUUFBUSxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQ25HLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFHeEMsT0FBTyxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsU0FBUyxFQUFFLGVBQWUsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBWXJHLE1BQU0sY0FBYyxHQUFHLGlCQUFpQixDQUFDO0FBU3pDLE1BQU0sT0FBTyxpQkFBaUI7SUFJMUI7UUFDSSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksR0FBRyxFQUFxQixDQUFDO0lBQy9DLENBQUM7SUFFRCxjQUFjO0lBQ1AsTUFBTSxDQUFDLFdBQVc7UUFDckIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRTtZQUM3QixpQkFBaUIsQ0FBQyxRQUFRLEdBQUcsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO1NBQ3hEO1FBQ0QsT0FBTyxpQkFBaUIsQ0FBQyxRQUFRLENBQUM7SUFDdEMsQ0FBQztJQUVNLFFBQVEsQ0FBQyxJQUFZLEVBQUUsSUFBZTtRQUN6QyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDeEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQy9CO0lBQ0wsQ0FBQztJQUVELE1BQU0sQ0FBQyxJQUFvQjtRQUN2QixJQUFJLElBQUksWUFBWSxLQUFLLEVBQUU7WUFDdkIsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxLQUFLLE1BQU0sQ0FBQztTQUNsRDtRQUNELE1BQU0sSUFBSSxHQUFHLElB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dHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb2Z0d2FyZSBpcyBwcm9wcmlldGFyeSBhbmQgY29uZmlkZW50aWFsLiBObyBwYXJ0IG9mIHRoaXMgc29mdHdhcmVcbiAqIG1heSBiZSByZXByb2R1Y2VkLCBkaXN0cmlidXRlZCwgb3IgdHJhbnNtaXR0ZWQgaW4gYW55IGZvcm0gb3IgYnkgYW55IG1lYW5zLFxuICogaW5jbHVkaW5nIHBob3RvY29weWluZywgcmVjb3JkaW5nLCBvciBvdGhlciBlbGVjdHJvbmljIG9yIG1lY2hhbmljYWwgbWV0aG9kcyxcbiAqIHdpdGhvdXQgdGhlIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbiBvZiB0aGUgYXV0aG9yLCBleGNlcHQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGJyaWVmIHF1b3RhdGlvbnMgZW1ib2RpZWQgaW4gY3JpdGljYWwgcmV2aWV3cyBhbmQgY2VydGFpbiBvdGhlciBub25jb21tZXJjaWFsXG4gKiB1c2VzIHBlcm1pdHRlZCBieSBjb3B5cmlnaHQgbGF3LlxuICpcbiAqIEZvciBwZXJtaXNzaW9uIHJlcXVlc3RzLCBjb250YWN0OiBJc0hleHhcbiAqL1xuXG5pbXBvcnQgeyBUb2tlbiwgVG9rZW5zLCBNYXJrZWRFeHRlbnNpb24gfSBmcm9tIFwibWFya2VkXCI7XG5pbXBvcnQgeyBOb3RpY2UsIFRBYnN0cmFjdEZpbGUsIFRGaWxlLCBWYXVsdCwgTWFya2Rvd25WaWV3LCByZXF1ZXN0VXJsLCBQbGF0Zm9ybSB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgRXh0ZW5zaW9uIH0gZnJvbSBcIi4vZXh0ZW5zaW9uXCI7XG4vLyDmm7TmlrBpbXBvcnTot6/lvoRcbmltcG9ydCB7IFd4U2V0dGluZ3MgfSBmcm9tIFwiLi4vLi4vLi4vY29yZS9zZXR0aW5nc1wiO1xuaW1wb3J0IHsgSXNJbWFnZUxpYlJlYWR5LCBQcmVwYXJlSW1hZ2VMaWIsIFdlYnBUb0pQRywgVXBsb2FkSW1hZ2VUb1d4IH0gZnJvbSBcIi4uLy4uL3dlY2hhdC9pbWFnZWxpYlwiO1xuXG5kZWNsYXJlIG1vZHVsZSAnb2JzaWRpYW4nIHtcbiAgICBpbnRlcmZhY2UgVmF1bHQge1xuICAgICAgICBjb25maWc6IHtcbiAgICAgICAgICAgIGF0dGFjaG1lbnRGb2xkZXJQYXRoOiBzdHJpbmc7XG4gICAgICAgICAgICBuZXdMaW5rRm9ybWF0OiBzdHJpbmc7XG4gICAgICAgICAgICB1c2VNYXJrZG93bkxpbmtzOiBib29sZWFuO1xuICAgICAgICB9O1xuICAgIH1cbn1cblxuY29uc3QgTG9jYWxGaWxlUmVnZXggPSAvXiFcXFtcXFsoLio/KVxcXVxcXS87XG5cbmludGVyZmFjZSBJbWFnZUluZm8ge1xuICAgIHJlc1VybDogc3RyaW5nO1xuICAgIGZpbGVQYXRoOiBzdHJpbmc7XG4gICAgdXJsOiBzdHJpbmcgfCBudWxsO1xuICAgIG1lZGlhX2lkOiBzdHJpbmcgfCBudWxsO1xufVxuXG5leHBvcnQgY2xhc3MgTG9jYWxJbWFnZU1hbmFnZXIge1xuICAgIHByaXZhdGUgaW1hZ2VzOiBNYXA8c3RyaW5nLCBJbWFnZUluZm8+O1xuICAgIHByaXZhdGUgc3RhdGljIGluc3RhbmNlOiBMb2NhbEltYWdlTWFuYWdlcjtcblxuICAgIHByaXZhdGUgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuaW1hZ2VzID0gbmV3IE1hcDxzdHJpbmcsIEltYWdlSW5mbz4oKTtcbiAgICB9XG5cbiAgICAvLyDpnZnmgIHmlrnms5XvvIznlKjkuo7ojrflj5blrp7kvotcbiAgICBwdWJsaWMgc3RhdGljIGdldEluc3RhbmNlKCk6IExvY2FsSW1hZ2VNYW5hZ2VyIHtcbiAgICAgICAgaWYgKCFMb2NhbEltYWdlTWFuYWdlci5pbnN0YW5jZSkge1xuICAgICAgICAgICAgTG9jYWxJbWFnZU1hbmFnZXIuaW5zdGFuY2UgPSBuZXcgTG9jYWxJbWFnZU1hbmFnZXIoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTG9jYWxJbWFnZU1hbmFnZXIuaW5zdGFuY2U7XG4gICAgfVxuXG4gICAgcHVibGljIHNldEltYWdlKHBhdGg6IHN0cmluZywgaW5mbzogSW1hZ2VJbmZvKTogdm9pZCB7XG4gICAgICAgIGlmICghdGhpcy5pbWFnZXMuaGFzKHBhdGgpKSB7XG4gICAgICAgICAgICB0aGlzLmltYWdlcy5zZXQocGF0aCwgaW5mbyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpc1dlYnAoZmlsZTogVEZpbGUgfCBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgaWYgKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZpbGUuZXh0ZW5zaW9uLnRvTG93ZXJDYXNlKCkgPT09ICd3ZWJwJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBuYW1lID0gZmlsZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICByZXR1cm4gbmFtZS5lbmRzV2l0aCgnLndlYnAnKTtcbiAgICB9XG5cbiAgICBhc3luYyB1cGxvYWRMb2NhbEltYWdlKHRva2VuOiBzdHJpbmcsIHZhdWx0OiBWYXVsdCwgdHlwZTogc3RyaW5nID0gJycpIHtcbiAgICAgICAgY29uc3Qga2V5cyA9IHRoaXMuaW1hZ2VzLmtleXMoKTtcbiAgICAgICAgYXdhaXQgUHJlcGFyZUltYWdlTGliKCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuICAgICAgICBmb3IgKGxldCBrZXkgb2Yga2V5cykge1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSB0aGlzLmltYWdlcy5nZXQoa2V5KTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSBjb250aW51ZTtcbiAgICAgICAgICAgIGlmICh2YWx1ZS51cmwgIT0gbnVsbCkgY29udGludWU7XG4gICAgICAgICAgICBjb25zdCBmaWxlID0gdmF1bHQuZ2V0RmlsZUJ5UGF0aCh2YWx1ZS5maWxlUGF0aCk7XG4gICAgICAgICAgICBpZiAoZmlsZSA9PSBudWxsKSBjb250aW51ZTtcbiAgICAgICAgICAgIGxldCBmaWxlRGF0YSA9IGF3YWl0IHZhdWx0LnJlYWRCaW5hcnkoZmlsZSk7XG4gICAgICAgICAgICBsZXQgbmFtZSA9IGZpbGUubmFtZTtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzV2VicChmaWxlKSkge1xuICAgICAgICAgICAgICAgIGlmIChJc0ltYWdlTGliUmVhZHkoKSkge1xuICAgICAgICAgICAgICAgICAgICBmaWxlRGF0YSA9IFdlYnBUb0pQRyhmaWxlRGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIG5hbWUgPSBuYW1lLnRvTG93ZXJDYXNlKCkucmVwbGFjZSgnLndlYnAnLCAnLmpwZycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignd2FzbSBub3QgcmVhZHkgZm9yIHdlYnAnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IFVwbG9hZEltYWdlVG9XeChuZXcgQmxvYihbZmlsZURhdGFdKSwgbmFtZSwgdG9rZW4sIHR5cGUpO1xuICAgICAgICAgICAgaWYgKHJlcy5lcnJjb2RlICE9IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtc2cgPSBg5LiK5Lyg5Zu+54mH5aSx6LSlOiAke3Jlcy5lcnJjb2RlfSAke3Jlcy5lcnJtc2d9YDtcbiAgICAgICAgICAgICAgICBuZXcgTm90aWNlKG1zZyk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDmt7vliqDmiJDlip/kuIrkvKDnmoTosIPor5Xkv6Hmga9cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhg4pyFIOWbvueJh+S4iuS8oOaIkOWKnzogJHtuYW1lfWAsIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGg6IHZhbHVlLmZpbGVQYXRoLFxuICAgICAgICAgICAgICAgICAgICBvbGRVcmw6IHZhbHVlLnVybCxcbiAgICAgICAgICAgICAgICAgICAgbmV3VXJsOiByZXMudXJsLFxuICAgICAgICAgICAgICAgICAgICBtZWRpYUlkOiByZXMubWVkaWFfaWRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8g5oyJ54WndjLniYjmnKznmoTlgZrms5XvvJrkvJjlhYjkvb/nlKjlkI7nq6/ov5Tlm57nmoRVUkzvvIzlkKbliJnkvb/nlKhmYWxsYmFja1xuICAgICAgICAgICAgdmFsdWUubWVkaWFfaWQgPSByZXMubWVkaWFfaWQgfHwgbnVsbDtcbiAgICAgICAgICAgIHZhbHVlLnVybCA9IHJlcy51cmwgfHwgKHJlcy5tZWRpYV9pZCA/IGBodHRwczovL21tYml6LnFsb2dvLmNuL21tYml6X3BuZy8ke3Jlcy5tZWRpYV9pZH0vMD93eF9mbXQ9cG5nYCA6IG51bGwpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAoIXJlcy51cmwgJiYgcmVzLm1lZGlhX2lkKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYPCflKcg5ZCO56uv5pyq6L+U5ZueVVJM77yM5L2/55SoZmFsbGJhY2s6ICR7dmFsdWUudXJsfWApO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXMudXJsKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYOKchSDkvb/nlKjlkI7nq6/ov5Tlm57nmoRVUkw6ICR7dmFsdWUudXJsfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyDmt7vliqDmm7TmlrDlkI7nmoTnirbmgIHosIPor5Xkv6Hmga9cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGDwn5SXIOabtOaWsOWbvueJh+S/oeaBrzogJHtuYW1lfWAsIHtcbiAgICAgICAgICAgICAgICByZXNVcmw6IHZhbHVlLnJlc1VybCxcbiAgICAgICAgICAgICAgICBmaWxlUGF0aDogdmFsdWUuZmlsZVBhdGgsXG4gICAgICAgICAgICAgICAgZmluYWxVcmw6IHZhbHVlLnVybCxcbiAgICAgICAgICAgICAgICBtZWRpYUlkOiB2YWx1ZS5tZWRpYV9pZCxcbiAgICAgICAgICAgICAgICBvcmlnaW5hbFVybDogcmVzLnVybCxcbiAgICAgICAgICAgICAgICBnZW5lcmF0ZWRVcmw6IHZhbHVlLnVybFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXN1bHQucHVzaChyZXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgY2hlY2tJbWFnZUV4dChmaWxlbmFtZTogc3RyaW5nICk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBuYW1lID0gZmlsZW5hbWUudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICBpZiAobmFtZS5lbmRzV2l0aCgnLmpwZycpXG4gICAgICAgICAgICB8fCBuYW1lLmVuZHNXaXRoKCcuanBlZycpXG4gICAgICAgICAgICB8fCBuYW1lLmVuZHNXaXRoKCcucG5nJylcbiAgICAgICAgICAgIHx8IG5hbWUuZW5kc1dpdGgoJy5naWYnKVxuICAgICAgICAgICAgfHwgbmFtZS5lbmRzV2l0aCgnLmJtcCcpXG4gICAgICAgICAgICB8fCBuYW1lLmVuZHNXaXRoKCcudGlmZicpXG4gICAgICAgICAgICB8fCBuYW1lLmVuZHNXaXRoKCcuc3ZnJylcbiAgICAgICAgICAgIHx8IG5hbWUuZW5kc1dpdGgoJy53ZWJwJykpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBnZXRJbWFnZU5hbWVGcm9tVXJsKHVybDogc3RyaW5nLCB0eXBlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8g5Yib5bu6VVJM5a+56LGhXG4gICAgICAgICAgICBjb25zdCB1cmxPYmogPSBuZXcgVVJMKHVybCk7XG4gICAgICAgICAgICAvLyDojrflj5ZwYXRobmFtZemDqOWIhlxuICAgICAgICAgICAgY29uc3QgcGF0aG5hbWUgPSB1cmxPYmoucGF0aG5hbWU7XG4gICAgICAgICAgICAvLyDojrflj5bmnIDlkI7kuIDkuKov5ZCO55qE5YaF5a655L2c5Li65paH5Lu25ZCNXG4gICAgICAgICAgICBsZXQgZmlsZW5hbWUgPSBwYXRobmFtZS5zcGxpdCgnLycpLnBvcCgpIHx8ICcnO1xuICAgICAgICAgICAgZmlsZW5hbWUgPSBkZWNvZGVVUklDb21wb25lbnQoZmlsZW5hbWUpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLmNoZWNrSW1hZ2VFeHQoZmlsZW5hbWUpKSB7XG4gICAgICAgICAgICAgICAgZmlsZW5hbWUgPSBmaWxlbmFtZSArIHRoaXMuZ2V0SW1hZ2VFeHQodHlwZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmlsZW5hbWU7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIOWmguaenFVSTOino+aekOWksei0pe+8jOWwneivleeugOWNleeahOWtl+espuS4suWkhOeQhlxuICAgICAgICAgICAgY29uc3QgcXVlcnlJbmRleCA9IHVybC5pbmRleE9mKCc/Jyk7XG4gICAgICAgICAgICBpZiAocXVlcnlJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICB1cmwgPSB1cmwuc3Vic3RyaW5nKDAsIHF1ZXJ5SW5kZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHVybC5zcGxpdCgnLycpLnBvcCgpIHx8ICcnO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0SW1hZ2VFeHRGcm9tQmxvYihibG9iOiBCbG9iKTogc3RyaW5nIHtcbiAgICAgICAgLy8gTUlNReexu+Wei+WIsOaWh+S7tuaJqeWxleWQjeeahOaYoOWwhFxuICAgICAgICBjb25zdCBtaW1lVG9FeHQ6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7XG4gICAgICAgICAgICAnaW1hZ2UvanBlZyc6ICcuanBnJyxcbiAgICAgICAgICAgICdpbWFnZS9qcGcnOiAnLmpwZycsXG4gICAgICAgICAgICAnaW1hZ2UvcG5nJzogJy5wbmcnLFxuICAgICAgICAgICAgJ2ltYWdlL2dpZic6ICcuZ2lmJyxcbiAgICAgICAgICAgICdpbWFnZS9ibXAnOiAnLmJtcCcsXG4gICAgICAgICAgICAnaW1hZ2Uvd2VicCc6ICcud2VicCcsXG4gICAgICAgICAgICAnaW1hZ2Uvc3ZnK3htbCc6ICcuc3ZnJyxcbiAgICAgICAgICAgICdpbWFnZS90aWZmJzogJy50aWZmJ1xuICAgICAgICB9O1xuICAgIFxuICAgICAgICAvLyDojrflj5ZNSU1F57G75Z6LXG4gICAgICAgIGNvbnN0IG1pbWVUeXBlID0gYmxvYi50eXBlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIFxuICAgICAgICAvLyDov5Tlm57lr7nlupTnmoTmianlsZXlkI3vvIzlpoLmnpzmib7kuI3liLDliJnov5Tlm57nqbrlrZfnrKbkuLJcbiAgICAgICAgcmV0dXJuIG1pbWVUb0V4dFttaW1lVHlwZV0gfHwgJyc7XG4gICAgfVxuXG4gICAgYmFzZTY0VG9CbG9iKHNyYzogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGl0ZW1zID0gc3JjLnNwbGl0KCcsJyk7XG4gICAgICAgIGlmIChpdGVtcy5sZW5ndGggIT0gMikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdiYXNlNjTmoLzlvI/plJnor68nKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBtaW5lVHlwZSA9IGl0ZW1zWzBdLnJlcGxhY2UoJ2RhdGE6JywgJycpO1xuXHRcdGNvbnN0IGJhc2U2NCA9IGl0ZW1zWzFdO1xuXG5cdFx0Y29uc3QgYnl0ZUNoYXJhY3RlcnMgPSBhdG9iKGJhc2U2NCk7XG5cdFx0Y29uc3QgYnl0ZU51bWJlcnMgPSBuZXcgQXJyYXkoYnl0ZUNoYXJhY3RlcnMubGVuZ3RoKTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGJ5dGVDaGFyYWN0ZXJzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRieXRlTnVtYmVyc1tpXSA9IGJ5dGVDaGFyYWN0ZXJzLmNoYXJDb2RlQXQoaSk7XG5cdFx0fVxuXHRcdGNvbnN0IGJ5dGVBcnJheSA9IG5ldyBVaW50OEFycmF5KGJ5dGVOdW1iZXJzKTtcblx0XHRyZXR1cm4ge2Jsb2I6IG5ldyBCbG9iKFtieXRlQXJyYXldLCB7IHR5cGU6IG1pbmVUeXBlIH0pLCBleHQ6IHRoaXMuZ2V0SW1hZ2VFeHQobWluZVR5cGUpfTtcblx0fVxuXG4gICAgYXN5bmMgdXBsb2FkSW1hZ2VGcm9tVXJsKHVybDogc3RyaW5nLCB0b2tlbjogc3RyaW5nLCB0eXBlOiBzdHJpbmcgPSAnJykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgcmVwID0gYXdhaXQgcmVxdWVzdFVybCh1cmwpO1xuICAgICAgICAgICAgYXdhaXQgUHJlcGFyZUltYWdlTGliKCk7XG4gICAgICAgICAgICBsZXQgZGF0YSA9IHJlcC5hcnJheUJ1ZmZlcjtcbiAgICAgICAgICAgIGxldCBibG9iID0gbmV3IEJsb2IoW2RhdGFdKTtcblxuICAgICAgICAgICAgbGV0IGZpbGVuYW1lID0gdGhpcy5nZXRJbWFnZU5hbWVGcm9tVXJsKHVybCwgcmVwLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddKTtcbiAgICAgICAgICAgIGlmIChmaWxlbmFtZSA9PSAnJyB8fCBmaWxlbmFtZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZmlsZW5hbWUgPSAncmVtb3RlX2ltZycgKyB0aGlzLmdldEltYWdlRXh0RnJvbUJsb2IoYmxvYik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzV2VicChmaWxlbmFtZSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoSXNJbWFnZUxpYlJlYWR5KCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGF0YSA9IFdlYnBUb0pQRyhkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgYmxvYiA9IG5ldyBCbG9iKFtkYXRhXSk7XG4gICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lID0gZmlsZW5hbWUudG9Mb3dlckNhc2UoKS5yZXBsYWNlKCcud2VicCcsICcuanBnJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCd3YXNtIG5vdCByZWFkeSBmb3Igd2VicCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IFVwbG9hZEltYWdlVG9XeChibG9iLCBmaWxlbmFtZSwgdG9rZW4sIHR5cGUpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfkuIrkvKDlm77niYflpLHotKU6JyArIGUubWVzc2FnZSArICd8JyArIHVybCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRJbWFnZUV4dCh0eXBlOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBtaW1lVG9FeHQ6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7XG4gICAgICAgICAgICAnaW1hZ2UvanBlZyc6ICcuanBnJyxcbiAgICAgICAgICAgICdpbWFnZS9qcGcnOiAnLmpwZycsXG4gICAgICAgICAgICAnaW1hZ2UvcG5nJzogJy5wbmcnLFxuICAgICAgICAgICAgJ2ltYWdlL2dpZic6ICcuZ2lmJyxcbiAgICAgICAgICAgICdpbWFnZS9ibXAnOiAnLmJtcCcsXG4gICAgICAgICAgICAnaW1hZ2Uvd2VicCc6ICcud2VicCcsXG4gICAgICAgICAgICAnaW1hZ2Uvc3ZnK3htbCc6ICcuc3ZnJyxcbiAgICAgICAgICAgICdpbWFnZS90aWZmJzogJy50aWZmJ1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gbWltZVRvRXh0W3R5cGVdIHx8ICcuanBnJztcbiAgICB9XG5cbiAgICBnZXRNaW1lVHlwZShleHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IGV4dFRvTWltZTogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfSA9IHtcbiAgICAgICAgICAgICcuanBnJzogJ2ltYWdlL2pwZWcnLFxuICAgICAgICAgICAgJy5qcGVnJzogJ2ltYWdlL2pwZWcnLFxuICAgICAgICAgICAgJy5wbmcnOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgICcuZ2lmJzogJ2ltYWdlL2dpZicsXG4gICAgICAgICAgICAnLmJtcCc6ICdpbWFnZS9ibXAnLFxuICAgICAgICAgICAgJy53ZWJwJzogJ2ltYWdlL3dlYnAnLFxuICAgICAgICAgICAgJy5zdmcnOiAnaW1hZ2Uvc3ZnK3htbCcsXG4gICAgICAgICAgICAnLnRpZmYnOiAnaW1hZ2UvdGlmZidcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGV4dFRvTWltZVtleHQudG9Mb3dlckNhc2UoKV0gfHwgJ2ltYWdlL2pwZWcnO1xuICAgIH1cblxuICAgIGdldEltYWdlSW5mb3Mocm9vdDogSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgY29uc3QgaW1hZ2VzID0gcm9vdC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1nJyk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGltYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgaW1nID0gaW1hZ2VzW2ldO1xuICAgICAgICAgICAgY29uc3QgcmVzID0gdGhpcy5pbWFnZXMuZ2V0KGltZy5zcmMpO1xuICAgICAgICAgICAgaWYgKHJlcykge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHJlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBhc3luYyB1cGxvYWRSZW1vdGVJbWFnZShyb290OiBIVE1MRWxlbWVudCwgdG9rZW46IHN0cmluZywgdHlwZTogc3RyaW5nID0gJycpIHtcbiAgICAgICAgY29uc3QgaW1hZ2VzID0gcm9vdC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaW1nJyk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGltYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgaW1nID0gaW1hZ2VzW2ldO1xuICAgICAgICAgICAgaWYgKGltZy5zcmMuaW5jbHVkZXMoJ21tYml6LnFwaWMuY24nKSkgY29udGludWU7XG4gICAgICAgICAgICAvLyDnp7vliqjnq6/mnKzlnLDlm77niYfkuI3pgJrov4dzcmPkuIrkvKBcbiAgICAgICAgICAgIGlmIChpbWcuc3JjLnN0YXJ0c1dpdGgoJ2h0dHA6Ly9sb2NhbGhvc3QvJykgJiYgUGxhdGZvcm0uaXNNb2JpbGVBcHApIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGltZy5zcmMuc3RhcnRzV2l0aCgnaHR0cCcpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzID0gYXdhaXQgdGhpcy51cGxvYWRJbWFnZUZyb21VcmwoaW1nLnNyYywgdG9rZW4sIHR5cGUpO1xuICAgICAgICAgICAgICAgIGlmIChyZXMuZXJyY29kZSAhPSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1zZyA9IGDkuIrkvKDlm77niYflpLHotKU6ICR7aW1nLnNyY30gJHtyZXMuZXJyY29kZX0gJHtyZXMuZXJybXNnfWA7XG4gICAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UobXNnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyDkv67lpI3nsbvlnovlhbzlrrnmgKfpl67popjvvIzlpoLmnpzmsqHmnIlVUkzliJnkvb/nlKhtZWRpYV9pZOeUn+aIkFVSTFxuICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc1VybDogaW1nLnNyYyxcbiAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGg6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIHVybDogcmVzLnVybCB8fCAocmVzLm1lZGlhX2lkID8gYGh0dHBzOi8vbW1iaXoucWxvZ28uY24vbW1iaXpfcG5nLyR7cmVzLm1lZGlhX2lkfS8wP3d4X2ZtdD1wbmdgIDogbnVsbCksXG4gICAgICAgICAgICAgICAgICAgIG1lZGlhX2lkOiByZXMubWVkaWFfaWQgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMuaW1hZ2VzLnNldChpbWcuc3JjLCBpbmZvKTtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChyZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaW1nLnNyYy5zdGFydHNXaXRoKCdkYXRhOmltYWdlLycpKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qge2Jsb2IsIGV4dH0gPSB0aGlzLmJhc2U2NFRvQmxvYihpbWcuc3JjKTtcbiAgICAgICAgICAgICAgICBpZiAoIWltZy5pZCkge1xuICAgICAgICAgICAgICAgICAgICBpbWcuaWQgPSBgbG9jYWwtaW1nLSR7aX1gO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBuYW1lID0gaW1nLmlkICsgZXh0O1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IFVwbG9hZEltYWdlVG9XeChibG9iLCBuYW1lLCB0b2tlbik7XG4gICAgICAgICAgICAgICAgaWYgKHJlcy5lcnJjb2RlICE9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbXNnID0gYOS4iuS8oOWbvueJh+Wksei0pTogJHtyZXMuZXJyY29kZX0gJHtyZXMuZXJybXNnfWA7XG4gICAgICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UobXNnKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihtc2cpO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8g5L+u5aSN57G75Z6L5YW85a655oCn6Zeu6aKY77yM5aaC5p6c5rKh5pyJVVJM5YiZ5L2/55SobWVkaWFfaWTnlJ/miJBVUkxcbiAgICAgICAgICAgICAgICBjb25zdCBpbmZvID0ge1xuICAgICAgICAgICAgICAgICAgICByZXNVcmw6ICcjJyArIGltZy5pZCxcbiAgICAgICAgICAgICAgICAgICAgZmlsZVBhdGg6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIHVybDogcmVzLnVybCB8fCAocmVzLm1lZGlhX2lkID8gYGh0dHBzOi8vbW1iaXoucWxvZ28uY24vbW1iaXpfcG5nLyR7cmVzLm1lZGlhX2lkfS8wP3d4X2ZtdD1wbmdgIDogbnVsbCksXG4gICAgICAgICAgICAgICAgICAgIG1lZGlhX2lkOiByZXMubWVkaWFfaWQgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMuaW1hZ2VzLnNldCgnIycgKyBpbWcuaWQsIGluZm8pO1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHJlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICByZXBsYWNlSW1hZ2VzKHJvb3Q6IEhUTUxFbGVtZW50KSB7XG4gICAgICAgIGNvbnN0IGltYWdlcyA9IHJvb3QuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2ltZycpO1xuICAgICAgICBjb25zb2xlLmxvZyhg8J+UhCDlvIDlp4vmm7/mjaLlm77niYfpk77mjqXvvIzlhbHmib7liLAgJHtpbWFnZXMubGVuZ3RofSDlvKDlm77niYdgKTtcbiAgICAgICAgXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW1hZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBpbWcgPSBpbWFnZXNbaV07XG4gICAgICAgICAgICBsZXQgdmFsdWUgPSB0aGlzLmltYWdlcy5nZXQoaW1nLnNyYyk7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmICghaW1nLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ21pc3MgaW1hZ2UgaWQsICcgKyBpbWcuc3JjKTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhbHVlID0gdGhpcy5pbWFnZXMuZ2V0KCcjJyArIGltZy5pZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybihg8J+TtyDmnKrmib7liLDlm77niYfkv6Hmga86ICR7aW1nLnNyY31gKTtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh2YWx1ZS51cmwgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybihg8J+TtyDlm77niYfmnKrkuIrkvKDvvIzot7Pov4fmm7/mjaI6ICR7aW1nLnNyY31gLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIOa3u+WKoOabv+aNouiwg+ivleS/oeaBr1xuICAgICAgICAgICAgY29uc29sZS5sb2coYPCflJcg5pu/5o2i5Zu+54mH6ZO+5o6lOiAke2ltZy5zcmN9IC0+ICR7dmFsdWUudXJsfWApO1xuICAgICAgICAgICAgaW1nLnNldEF0dHJpYnV0ZSgnc3JjJywgdmFsdWUudXJsKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFycmF5QnVmZmVyVG9CYXNlNjQoYnVmZmVyOiBBcnJheUJ1ZmZlcik6IHN0cmluZyB7XG4gICAgICAgIGxldCBiaW5hcnkgPSAnJztcbiAgICAgICAgY29uc3QgYnl0ZXMgPSBuZXcgVWludDhBcnJheShidWZmZXIpO1xuICAgICAgICBjb25zdCBsZW4gPSBieXRlcy5ieXRlTGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgYmluYXJ5ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBidG9hKGJpbmFyeSk7XG4gICAgfVxuXG4gICAgYXN5bmMgbG9jYWxJbWFnZXNUb0Jhc2U2NCh2YXVsdDogVmF1bHQpIHtcbiAgICAgICAgY29uc3Qga2V5cyA9IHRoaXMuaW1hZ2VzLmtleXMoKTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcbiAgICAgICAgZm9yIChsZXQga2V5IG9mIGtleXMpIHtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gdGhpcy5pbWFnZXMuZ2V0KGtleSk7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT0gbnVsbCkgY29udGludWU7XG4gICAgICAgICAgICBjb25zdCBmaWxlID0gdmF1bHQuZ2V0RmlsZUJ5UGF0aCh2YWx1ZS5maWxlUGF0aCk7XG4gICAgICAgICAgICBpZiAoZmlsZSA9PSBudWxsKSBjb250aW51ZTtcbiAgICAgICAgICAgIGxldCBmaWxlRGF0YSA9IGF3YWl0IHZhdWx0LnJlYWRCaW5hcnkoZmlsZSk7XG4gICAgICAgICAgICBjb25zdCBiYXNlNjQgPSB0aGlzLmFycmF5QnVmZmVyVG9CYXNlNjQoZmlsZURhdGEpO1xuICAgICAgICAgICAgY29uc3QgbWltZVR5cGUgPSB0aGlzLmdldE1pbWVUeXBlKGZpbGUuZXh0ZW5zaW9uKTtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBgZGF0YToke21pbWVUeXBlfTtiYXNlNjQsJHtiYXNlNjR9YDtcbiAgICAgICAgICAgIHJlc3VsdC5zZXQodmFsdWUucmVzVXJsLCBkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGFzeW5jIGRvd25sb2FkUmVtb3RlSW1hZ2UodXJsOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlcCA9IGF3YWl0IHJlcXVlc3RVcmwodXJsKTtcbiAgICAgICAgICAgIGxldCBkYXRhID0gcmVwLmFycmF5QnVmZmVyO1xuICAgICAgICAgICAgbGV0IGJsb2IgPSBuZXcgQmxvYihbZGF0YV0pO1xuXG4gICAgICAgICAgICBsZXQgZXh0ID0gdGhpcy5nZXRJbWFnZUV4dEZyb21CbG9iKGJsb2IpO1xuICAgICAgICAgICAgaWYgKGV4dCA9PSAnJyB8fCBleHQgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVuYW1lID0gdGhpcy5nZXRJbWFnZU5hbWVGcm9tVXJsKHVybCwgcmVwLmhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddKTtcbiAgICAgICAgICAgICAgICBleHQgPSAnLicgKyBmaWxlbmFtZS5zcGxpdCgnLicpLnBvcCgpIHx8ICdqcGcnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBiYXNlNjQgPSB0aGlzLmFycmF5QnVmZmVyVG9CYXNlNjQoZGF0YSk7XG4gICAgICAgICAgICBjb25zdCBtaW1lVHlwZSA9IHRoaXMuZ2V0TWltZVR5cGUoZXh0KTtcbiAgICAgICAgICAgIHJldHVybiBgZGF0YToke21pbWVUeXBlfTtiYXNlNjQsJHtiYXNlNjR9YDtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIHJlbW90ZUltYWdlc1RvQmFzZTY0KHJvb3Q6IEhUTUxFbGVtZW50KSB7XG4gICAgICAgIGNvbnN0IGltYWdlcyA9IHJvb3QuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2ltZycpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGltYWdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgaW1nID0gaW1hZ2VzW2ldO1xuICAgICAgICAgICAgaWYgKCFpbWcuc3JjLnN0YXJ0c1dpdGgoJ2h0dHAnKSkgY29udGludWU7XG4gICAgICAgICAgICBjb25zdCBiYXNlNjQgPSBhd2FpdCB0aGlzLmRvd25sb2FkUmVtb3RlSW1hZ2UoaW1nLnNyYyk7XG4gICAgICAgICAgICBpZiAoYmFzZTY0ID09ICcnKSBjb250aW51ZTtcbiAgICAgICAgICAgIHJlc3VsdC5zZXQoaW1nLnNyYywgYmFzZTY0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIC8vIENsYXVkZSBDb2RlIFVwZGF0ZTog5L+d55WZaW5uZXJIVE1M6K+75Y+W5pON5L2c77yI55So5LqO5pyA57uISFRNTOW6j+WIl+WMlui+k+WHuu+8iVxuICAgIGFzeW5jIGVtYmxlSW1hZ2VzKHJvb3Q6IEhUTUxFbGVtZW50LCB2YXVsdDogVmF1bHQpIHtcbiAgICAgICAgY29uc3QgbG9jYWxJbWFnZXMgPSBhd2FpdCB0aGlzLmxvY2FsSW1hZ2VzVG9CYXNlNjQodmF1bHQpO1xuICAgICAgICBjb25zdCByZW1vdGVJbWFnZXMgPSBhd2FpdCB0aGlzLnJlbW90ZUltYWdlc1RvQmFzZTY0KHJvb3QpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSByb290LmNsb25lTm9kZSh0cnVlKSBhcyBIVE1MRWxlbWVudDtcbiAgICAgICAgY29uc3QgaW1hZ2VzID0gcmVzdWx0LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdpbWcnKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbWFnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGltZyA9IGltYWdlc1tpXTtcbiAgICAgICAgICAgIGlmIChpbWcuc3JjLnN0YXJ0c1dpdGgoJ2h0dHAnKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJhc2U2NCA9IHJlbW90ZUltYWdlcy5nZXQoaW1nLnNyYyk7XG4gICAgICAgICAgICAgICAgaWYgKGJhc2U2NCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGltZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIGJhc2U2NCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYmFzZTY0ID0gbG9jYWxJbWFnZXMuZ2V0KGltZy5zcmMpO1xuICAgICAgICAgICAgICAgIGlmIChiYXNlNjQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpbWcuc2V0QXR0cmlidXRlKCdzcmMnLCBiYXNlNjQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0LmlubmVySFRNTDtcbiAgICB9XG5cbiAgICBhc3luYyBjbGVhbnVwKCkge1xuICAgICAgICB0aGlzLmltYWdlcy5jbGVhcigpOyBcbiAgICB9XG59XG5cbiAgXG5leHBvcnQgY2xhc3MgTG9jYWxGaWxlIGV4dGVuZHMgRXh0ZW5zaW9ue1xuICAgIGluZGV4OiBudW1iZXIgPSAwO1xuICAgIHB1YmxpYyBzdGF0aWMgZmlsZUNhY2hlOiBNYXA8c3RyaW5nLCBzdHJpbmc+ID0gbmV3IE1hcDxzdHJpbmcsIHN0cmluZz4oKTtcblxuICAgIGdlbmVyYXRlSWQoKSB7XG4gICAgICAgIHRoaXMuaW5kZXggKz0gMTtcbiAgICAgICAgcmV0dXJuIGBmaWQtJHt0aGlzLmluZGV4fWA7XG4gICAgfVxuXG4gICAgZ2V0SW1hZ2VQYXRoKHBhdGg6IHN0cmluZykge1xuICAgICAgICBjb25zdCByZXMgPSB0aGlzLmFzc2V0c01hbmFnZXIuZ2V0UmVzb3VyY2VQYXRoKHBhdGgpO1xuICAgICAgICBpZiAocmVzID09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ+aJvuS4jeWIsOaWh+S7tu+8micgKyBwYXRoKTtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpbmZvID0ge1xuICAgICAgICAgICAgcmVzVXJsOiByZXMucmVzVXJsLFxuICAgICAgICAgICAgZmlsZVBhdGg6IHJlcy5maWxlUGF0aCxcbiAgICAgICAgICAgIG1lZGlhX2lkOiBudWxsLFxuICAgICAgICAgICAgdXJsOiBudWxsXG4gICAgICAgIH07XG4gICAgICAgIExvY2FsSW1hZ2VNYW5hZ2VyLmdldEluc3RhbmNlKCkuc2V0SW1hZ2UocmVzLnJlc1VybCwgaW5mbyk7XG4gICAgICAgIHJldHVybiByZXMucmVzVXJsO1xuICAgIH1cblxuICAgIGlzSW1hZ2UoZmlsZTogc3RyaW5nKSB7XG4gICAgICAgIGZpbGUgPSBmaWxlLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHJldHVybiBmaWxlLmVuZHNXaXRoKCcucG5nJylcbiAgICAgICAgICAgICAgICB8fCBmaWxlLmVuZHNXaXRoKCcuanBnJylcbiAgICAgICAgICAgICAgICB8fCBmaWxlLmVuZHNXaXRoKCcuanBlZycpXG4gICAgICAgICAgICAgICAgfHwgZmlsZS5lbmRzV2l0aCgnLmdpZicpXG4gICAgICAgICAgICAgICAgfHwgZmlsZS5lbmRzV2l0aCgnLmJtcCcpXG4gICAgICAgICAgICAgICAgfHwgZmlsZS5lbmRzV2l0aCgnLndlYnAnKTtcbiAgICB9XG5cbiAgICBwYXJzZUltYWdlTGluayhsaW5rOiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKGxpbmsuaW5jbHVkZXMoJ3wnKSkge1xuICAgICAgICAgICAgY29uc3QgcGFydHMgPSBsaW5rLnNwbGl0KCd8Jyk7XG4gICAgICAgICAgICBjb25zdCBwYXRoID0gcGFydHNbMF07XG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNJbWFnZShwYXRoKSkgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgICAgIGxldCB3aWR0aCA9IG51bGw7XG4gICAgICAgICAgICBsZXQgaGVpZ2h0ID0gbnVsbDtcbiAgICAgICAgICAgIGlmIChwYXJ0cy5sZW5ndGggPT0gMikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNpemUgPSBwYXJ0c1sxXS50b0xvd2VyQ2FzZSgpLnNwbGl0KCd4Jyk7XG4gICAgICAgICAgICAgICAgd2lkdGggPSBwYXJzZUludChzaXplWzBdKTtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZS5sZW5ndGggPT0gMiAmJiBzaXplWzFdICE9ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IHBhcnNlSW50KHNpemVbMV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHBhdGgsIHdpZHRoLCBoZWlnaHQgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5pc0ltYWdlKGxpbmspKSB7XG4gICAgICAgICAgICByZXR1cm4geyBwYXRoOiBsaW5rLCB3aWR0aDogbnVsbCwgaGVpZ2h0OiBudWxsIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgZ2V0SGVhZGVyTGV2ZWwobGluZTogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IG1hdGNoID0gbGluZS50cmltU3RhcnQoKS5tYXRjaCgvXiN7MSw2fS8pO1xuICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaFswXS5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuXG4gICAgYXN5bmMgZ2V0RmlsZUNvbnRlbnQoZmlsZTogVEFic3RyYWN0RmlsZSwgaGVhZGVyOiBzdHJpbmcgfCBudWxsLCBibG9jazogc3RyaW5nIHwgbnVsbCkge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5yZWFkKGZpbGUucGF0aCk7XG4gICAgICAgIGlmIChoZWFkZXIgPT0gbnVsbCAmJiBibG9jayA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gY29udGVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCByZXN1bHQgPSAnJztcbiAgICAgICAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KCdcXG4nKTtcbiAgICAgICAgaWYgKGhlYWRlcikge1xuICAgICAgICAgICAgbGV0IGxldmVsID0gMDtcbiAgICAgICAgICAgIGxldCBhcHBlbmQgPSBmYWxzZTtcbiAgICAgICAgICAgIGZvciAobGV0IGxpbmUgb2YgbGluZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoYXBwZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsZXZlbCA9PSB0aGlzLmdldEhlYWRlckxldmVsKGxpbmUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXN1bHQgKz0gbGluZSArICdcXG4nO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFsaW5lLnRyaW0oKS5zdGFydHNXaXRoKCcjJykpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1zID0gbGluZS50cmltKCkuc3BsaXQoJyAnKTtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbXMubGVuZ3RoICE9IDIpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGlmIChoZWFkZXIudHJpbSgpICE9IGl0ZW1zWzFdLnRyaW0oKSkgY29udGludWU7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZ2V0SGVhZGVyTGV2ZWwobGluZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ICs9IGxpbmUgKyAnXFxuJztcbiAgICAgICAgICAgICAgICAgICAgbGV2ZWwgPSB0aGlzLmdldEhlYWRlckxldmVsKGxpbmUpO1xuICAgICAgICAgICAgICAgICAgICBhcHBlbmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZ1bmN0aW9uIGlzU3RydWN0dXJlZEJsb2NrKGxpbmU6IHN0cmluZykge1xuICAgICAgICAgICAgY29uc3QgdHJpbW1lZCA9IGxpbmUudHJpbSgpO1xuICAgICAgICAgICAgcmV0dXJuIHRyaW1tZWQuc3RhcnRzV2l0aCgnLScpIHx8IHRyaW1tZWQuc3RhcnRzV2l0aCgnPicpIHx8IHRyaW1tZWQuc3RhcnRzV2l0aCgnfCcpIHx8IHRyaW1tZWQubWF0Y2goL15cXGQrXFwuLyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYmxvY2spIHtcbiAgICAgICAgICAgIGxldCBzdG9wQXRFbXB0eSA9IGZhbHNlO1xuICAgICAgICAgICAgbGV0IHRvdGFsTGVuID0gMDtcbiAgICAgICAgICAgIGxldCBzdHJ1Y3R1cmVkID0gZmFsc2U7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZSA9IGxpbmVzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChsaW5lLmluZGV4T2YoYmxvY2spID49IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gbGluZS5yZXBsYWNlKGJsb2NrLCAnJykudHJpbSgpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIOagh+iusOWSjOe7k+aehOWMluWGheWuueS9jeS6juWQjOS4gOihjOeahOaXtuWAmeWPqui/lOWbnuW9k+WJjeeahOadoeebrlxuICAgICAgICAgICAgICAgICAgICBpZiAoaXNTdHJ1Y3R1cmVkQmxvY2sobGluZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8g5ZCR5LiK5p+l5om+5YaF5a65XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGogPSBpIC0gMTsgaiA+PSAwOyBqLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGwgPSBsaW5lc1tqXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGwuc3RhcnRzV2l0aCgnIycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsLnRyaW0oKSA9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdG9wQXRFbXB0eSkgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGogPCBpIC0gMSAmJiB0b3RhbExlbiA+IDApIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0b3BBdEVtcHR5ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBsICsgJ1xcbicgKyByZXN1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdG9wQXRFbXB0eSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdHJ1Y3R1cmVkICYmICFpc1N0cnVjdHVyZWRCbG9jayhsKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7IFxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodG90YWxMZW4gPT09IDAgJiYgaXNTdHJ1Y3R1cmVkQmxvY2sobCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJ1Y3R1cmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgdG90YWxMZW4gKz0gcmVzdWx0Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IGwgKyAnXFxuJyArIHJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHBhcnNlRmlsZUxpbmsobGluazogc3RyaW5nKSB7XG4gICAgICAgIGNvbnN0IGluZm8gPSBsaW5rLnNwbGl0KCd8JylbMF07XG4gICAgICAgIGNvbnN0IGl0ZW1zID0gaW5mby5zcGxpdCgnIycpO1xuICAgICAgICBsZXQgcGF0aCA9IGl0ZW1zWzBdO1xuICAgICAgICBsZXQgaGVhZGVyID0gbnVsbDtcbiAgICAgICAgbGV0IGJsb2NrID0gbnVsbDtcbiAgICAgICAgaWYgKGl0ZW1zLmxlbmd0aCA9PSAyKSB7XG4gICAgICAgICAgICBpZiAoaXRlbXNbMV0uc3RhcnRzV2l0aCgnXicpKSB7XG4gICAgICAgICAgICAgICAgYmxvY2sgPSBpdGVtc1sxXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaGVhZGVyID0gaXRlbXNbMV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHsgcGF0aCwgaGVhZDogaGVhZGVyLCBibG9jayB9O1xuICAgIH1cblxuICAgIGFzeW5jIHJlbmRlckZpbGUobGluazogc3RyaW5nLCBpZDogc3RyaW5nKSB7XG4gICAgICAgIGxldCB7IHBhdGgsIGhlYWQ6IGhlYWRlciwgYmxvY2t9ID0gdGhpcy5wYXJzZUZpbGVMaW5rKGxpbmspO1xuICAgICAgICBsZXQgZmlsZSA9IG51bGw7XG4gICAgICAgIGlmIChwYXRoID09PSAnJykge1xuICAgICAgICAgICAgZmlsZSA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRBY3RpdmVGaWxlKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoIXBhdGguZW5kc1dpdGgoJy5tZCcpKSB7XG4gICAgICAgICAgICAgICAgcGF0aCA9IHBhdGggKyAnLm1kJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbGUgPSB0aGlzLmFzc2V0c01hbmFnZXIuc2VhcmNoRmlsZShwYXRoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmaWxlID09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnN0IG1zZyA9ICfmib7kuI3liLDmlofku7bvvJonICsgcGF0aDtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKVxuICAgICAgICAgICAgcmV0dXJuIG1zZztcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjb250ZW50ID0gYXdhaXQgdGhpcy5nZXRGaWxlQ29udGVudChmaWxlLCBoZWFkZXIsIGJsb2NrKTtcbiAgICAgICAgaWYgKGNvbnRlbnQuc3RhcnRzV2l0aCgnLS0tJykpIHtcbiAgICAgICAgICAgIGNvbnRlbnQgPSBjb250ZW50LnJlcGxhY2UoL14oLS0tKSQuKz9eKC0tLSkkLis/L2ltcywgJycpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCB0aGlzLm1hcmtlZC5wYXJzZShjb250ZW50KTtcbiAgICAgICAgcmV0dXJuIGJvZHk7XG4gICAgfVxuXG4gICAgc3RhdGljIGFzeW5jIHJlYWRCbG9iKHNyYzogc3RyaW5nKSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBmZXRjaChzcmMpLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuYmxvYigpKVxuICAgIH1cblxuXG4gICAgcGFyc2VMaW5rU3R5bGUobGluazogc3RyaW5nKSB7XG4gICAgICAgIGxldCBmaWxlbmFtZSA9ICcnO1xuICAgICAgICBsZXQgc3R5bGUgPSAnc3R5bGU9XCJ3aWR0aDoxMDAlO2hlaWdodDoxMDAlXCInO1xuICAgICAgICBsZXQgcG9zdGlvbiA9ICdsZWZ0JztcbiAgICAgICAgY29uc3QgcG9zdGlvbnMgPSBbJ2xlZnQnLCAnY2VudGVyJywgJ3JpZ2h0J107XG4gICAgICAgIGlmIChsaW5rLmluY2x1ZGVzKCd8JykpIHtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW1zID0gbGluay5zcGxpdCgnfCcpO1xuICAgICAgICAgICAgZmlsZW5hbWUgPSBpdGVtc1swXTtcbiAgICAgICAgICAgIGxldCBzaXplID0gJyc7XG4gICAgICAgICAgICBpZiAoaXRlbXMubGVuZ3RoID09IDIpIHtcbiAgICAgICAgICAgICAgICBpZiAocG9zdGlvbnMuaW5jbHVkZXMoaXRlbXNbMV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHBvc3Rpb24gPSBpdGVtc1sxXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNpemUgPSBpdGVtc1sxXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpdGVtcy5sZW5ndGggPT0gMykge1xuICAgICAgICAgICAgICAgIHNpemUgPSBpdGVtc1sxXTtcbiAgICAgICAgICAgICAgICBpZiAocG9zdGlvbnMuaW5jbHVkZXMoaXRlbXNbMV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHNpemUgPSBpdGVtc1syXTtcbiAgICAgICAgICAgICAgICAgICAgcG9zdGlvbiA9IGl0ZW1zWzFdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2l6ZSA9IGl0ZW1zWzFdO1xuICAgICAgICAgICAgICAgICAgICBwb3N0aW9uID0gaXRlbXNbMl07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQ2xhdWRlIENvZGUgVXBkYXRlOiDkv53nlZlTVkflsLrlr7jlhoXogZTmoLflvI/vvIjliqjmgIHorqHnrpflgLzvvIlcbiAgICAgICAgICAgIGlmIChzaXplICE9ICcnKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2l6ZXMgPSBzaXplLnNwbGl0KCd4Jyk7XG4gICAgICAgICAgICAgICAgaWYgKHNpemVzLmxlbmd0aCA9PSAyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFNWR+WwuuWvuOmcgOimgeWKqOaAgeiuoeeul++8jOS/neeVmeWGheiBlOagt+W8j1xuICAgICAgICAgICAgICAgICAgICBzdHlsZSA9IGBzdHlsZT1cIndpZHRoOiR7c2l6ZXNbMF19cHg7aGVpZ2h0OiR7c2l6ZXNbMV19cHg7XCJgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzdHlsZSA9IGBzdHlsZT1cIndpZHRoOiR7c2l6ZXNbMF19cHg7XCJgXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZmlsZW5hbWUgPSBsaW5rO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7IGZpbGVuYW1lLCBzdHlsZSwgcG9zdGlvbiB9O1xuICAgIH1cblxuXG4gICAgcGFyc2VTVkdMaW5rKGxpbms6IHN0cmluZykge1xuICAgICAgICBsZXQgY2xhc3NuYW1lID0gJ25vdGUtZW1iZWQtc3ZnLWxlZnQnO1xuICAgICAgICBjb25zdCBwb3N0aW9ucyA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KFtcbiAgICAgICAgICAgIFsnbGVmdCcsICdub3RlLWVtYmVkLXN2Zy1sZWZ0J10sXG4gICAgICAgICAgICBbJ2NlbnRlcicsICdub3RlLWVtYmVkLXN2Zy1jZW50ZXInXSxcbiAgICAgICAgICAgIFsncmlnaHQnLCAnbm90ZS1lbWJlZC1zdmctcmlnaHQnXVxuICAgICAgICBdKVxuXG4gICAgICAgIGxldCB7ZmlsZW5hbWUsIHN0eWxlLCBwb3N0aW9ufSA9IHRoaXMucGFyc2VMaW5rU3R5bGUobGluayk7XG4gICAgICAgIGNsYXNzbmFtZSA9IHBvc3Rpb25zLmdldChwb3N0aW9uKSB8fCBjbGFzc25hbWU7XG5cbiAgICAgICAgcmV0dXJuIHsgZmlsZW5hbWUsIHN0eWxlLCBjbGFzc25hbWUgfTtcbiAgICB9XG5cbiAgICBhc3luYyByZW5kZXJTVkdGaWxlKGZpbGVuYW1lOiBzdHJpbmcsIGlkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXNzZXRzTWFuYWdlci5zZWFyY2hGaWxlKGZpbGVuYW1lKTtcblxuICAgICAgICBpZiAoZmlsZSA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zdCBtc2cgPSAn5om+5LiN5Yiw5paH5Lu277yaJyArIGZpbGU7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKG1zZylcbiAgICAgICAgICAgIHJldHVybiBtc2c7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBjb250ZW50ID0gYXdhaXQgdGhpcy5nZXRGaWxlQ29udGVudChmaWxlLCBudWxsLCBudWxsKTtcbiAgICAgICAgTG9jYWxGaWxlLmZpbGVDYWNoZS5zZXQoZmlsZW5hbWUsIGNvbnRlbnQpO1xuICAgICAgICByZXR1cm4gY29udGVudDtcbiAgICB9XG5cbiAgICBtYXJrZWRFeHRlbnNpb24oKTogTWFya2VkRXh0ZW5zaW9uIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGFzeW5jOiB0cnVlLFxuICAgICAgICAgICAgd2Fsa1Rva2VuczogYXN5bmMgKHRva2VuOiBUb2tlbnMuR2VuZXJpYykgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0b2tlbi50eXBlICE9PSAnTG9jYWxJbWFnZScpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyDmuLLmn5PmnKzlnLDlm77niYdcbiAgICAgICAgICAgICAgICBsZXQgaXRlbSA9IHRoaXMucGFyc2VJbWFnZUxpbmsodG9rZW4uaHJlZik7XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3JjID0gdGhpcy5nZXRJbWFnZVBhdGgoaXRlbS5wYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgd2lkdGggPSBpdGVtLndpZHRoID8gYHdpZHRoPVwiJHtpdGVtLndpZHRofVwiYCA6ICcnO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBoZWlnaHQgPSBpdGVtLmhlaWdodD8gYGhlaWdodD1cIiR7aXRlbS5oZWlnaHR9XCJgIDogJyc7XG4gICAgICAgICAgICAgICAgICAgIHRva2VuLmh0bWwgPSBgPGltZyBzcmM9XCIke3NyY31cIiBhbHQ9XCIke3Rva2VuLnRleHR9XCIgJHt3aWR0aH0gJHtoZWlnaHR9IC8+YDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAgICAgaWYgKHRva2VuLmhyZWYuZW5kc1dpdGgoJy5zdmcnKSB8fCB0b2tlbi5ocmVmLmluY2x1ZGVzKCcuc3ZnfCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSB0aGlzLnBhcnNlU1ZHTGluayh0b2tlbi5ocmVmKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaWQgPSB0aGlzLmdlbmVyYXRlSWQoKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHN2ZyA9ICfmuLLmn5PkuK0nO1xuICAgICAgICAgICAgICAgICAgICBpZiAoTG9jYWxGaWxlLmZpbGVDYWNoZS5oYXMoaW5mby5maWxlbmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN2ZyA9IExvY2FsRmlsZS5maWxlQ2FjaGUuZ2V0KGluZm8uZmlsZW5hbWUpIHx8ICfmuLLmn5PlpLHotKUnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3ZnID0gYXdhaXQgdGhpcy5yZW5kZXJTVkdGaWxlKGluZm8uZmlsZW5hbWUsIGlkKSB8fCAn5riy5p+T5aSx6LSlJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0b2tlbi5odG1sID0gYDxzcGFuIGNsYXNzPVwiJHtpbmZvLmNsYXNzbmFtZX1cIj48c3BhbiBjbGFzcz1cIm5vdGUtZW1iZWQtc3ZnXCIgaWQ9XCIke2lkfVwiICR7aW5mby5zdHlsZX0+JHtzdmd9PC9zcGFuPjwvc3Bhbj5gXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCBpZCA9IHRoaXMuZ2VuZXJhdGVJZCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBhd2FpdCB0aGlzLnJlbmRlckZpbGUodG9rZW4uaHJlZiwgaWQpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRhZyA9IHRoaXMuY2FsbGJhY2suc2V0dGluZ3MuZW1iZWRTdHlsZSA9PT0gJ3F1b3RlJyA/ICdibG9ja3F1b3RlJyA6ICdzZWN0aW9uJztcbiAgICAgICAgICAgICAgICB0b2tlbi5odG1sID0gYDwke3RhZ30gY2xhc3M9XCJub3RlLWVtYmVkLWZpbGVcIiBpZD1cIiR7aWR9XCI+JHtjb250ZW50fTwvJHt0YWd9PmBcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGV4dGVuc2lvbnM6W3tcbiAgICAgICAgICAgIG5hbWU6ICdMb2NhbEltYWdlJyxcbiAgICAgICAgICAgIGxldmVsOiAnYmxvY2snLFxuICAgICAgICAgICAgc3RhcnQ6IChzcmM6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gc3JjLmluZGV4T2YoJyFbWycpO1xuICAgICAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHJldHVybjtcbiAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG9rZW5pemVyOiAoc3JjOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGVzID0gc3JjLm1hdGNoKExvY2FsRmlsZVJlZ2V4KTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2hlcyA9PSBudWxsKSByZXR1cm47XG4gICAgICAgICAgICAgICAgY29uc3QgdG9rZW46IFRva2VuID0ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnTG9jYWxJbWFnZScsXG4gICAgICAgICAgICAgICAgICAgIHJhdzogbWF0Y2hlc1swXSxcbiAgICAgICAgICAgICAgICAgICAgaHJlZjogbWF0Y2hlc1sxXSxcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogbWF0Y2hlc1sxXVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlbmRlcmVyOiAodG9rZW46IFRva2Vucy5HZW5lcmljKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuLmh0bWw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1dfTtcbiAgICB9XG59Il19