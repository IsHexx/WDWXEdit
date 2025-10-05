import { Token, Tokens, MarkedExtension } from "marked";
import { Notice, TAbstractFile, TFile, Vault, MarkdownView, requestUrl, Platform } from "obsidian";
import { Extension } from "./extension";

import { WxSettings } from "../../../core/settings";
import { IsImageLibReady, PrepareImageLib, WebpToJPG, UploadImageToWx } from "../../wechat/imagelib";

declare module 'obsidian' {
    interface Vault {
        config: {
            attachmentFolderPath: string;
            newLinkFormat: string;
            useMarkdownLinks: boolean;
        };
    }
}

const LocalFileRegex = /^!\[\[(.*?)\]\]/;

interface ImageInfo {
    resUrl: string;
    filePath: string;
    url: string | null;
    media_id: string | null;
}

export class LocalImageManager {
    private images: Map<string, ImageInfo>;
    private static instance: LocalImageManager;

    private constructor() {
        this.images = new Map<string, ImageInfo>();
    }

    public static getInstance(): LocalImageManager {
        if (!LocalImageManager.instance) {
            LocalImageManager.instance = new LocalImageManager();
        }
        return LocalImageManager.instance;
    }

    public setImage(path: string, info: ImageInfo): void {
        if (!this.images.has(path)) {
            this.images.set(path, info);
        }
    }

    isWebp(file: TFile | string): boolean {
        if (file instanceof TFile) {
            return file.extension.toLowerCase() === 'webp';
        }
        const name = file.toLowerCase();
        return name.endsWith('.webp');
    }

    async uploadLocalImage(token: string, vault: Vault, type: string = '') {
        const keys = this.images.keys();
        await PrepareImageLib();
        const result = [];
        for (let key of keys) {
            const value = this.images.get(key);
            if (value == null) continue;
            if (value.url != null) continue;
            const file = vault.getFileByPath(value.filePath);
            if (file == null) continue;
            let fileData = await vault.readBinary(file);
            let name = file.name;
            if (this.isWebp(file)) {
                if (IsImageLibReady()) {
                    fileData = WebpToJPG(fileData);
                    name = name.toLowerCase().replace('.webp', '.jpg');
                }
                else {

                }
            }

            const res = await UploadImageToWx(new Blob([fileData]), name, token, type);
            if (res.errcode != 0) {
                const msg = `上传图片失败: ${res.errcode} ${res.errmsg}`;
                new Notice(msg);

            } else {

            }

            value.media_id = res.media_id || null;
            value.url = res.url || (res.media_id ? `https://mmbiz.qlogo.cn/mmbiz_png/${res.media_id}/0?wx_fmt=png` : null);
            
            if (!res.url && res.media_id) {

            } else if (res.url) {

            }

            result.push(res);
        }
        return result;
    }

    checkImageExt(filename: string ): boolean {
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

    getImageNameFromUrl(url: string, type: string): string {
        try {

            const urlObj = new URL(url);

            const pathname = urlObj.pathname;

            let filename = pathname.split('/').pop() || '';
            filename = decodeURIComponent(filename);
            if (!this.checkImageExt(filename)) {
                filename = filename + this.getImageExt(type);
            }
            return filename;
        } catch (e) {

            const queryIndex = url.indexOf('?');
            if (queryIndex !== -1) {
                url = url.substring(0, queryIndex);
            }
            return url.split('/').pop() || '';
        }
    }

    getImageExtFromBlob(blob: Blob): string {
        // MIME类型到文件扩展名的映射
        const mimeToExt: { [key: string]: string } = {
            'image/jpeg': '.jpg',
            'image/jpg': '.jpg',
            'image/png': '.png',
            'image/gif': '.gif',
            'image/bmp': '.bmp',
            'image/webp': '.webp',
            'image/svg+xml': '.svg',
            'image/tiff': '.tiff'
        };

        const mimeType = blob.type.toLowerCase();

        return mimeToExt[mimeType] || '';
    }

    base64ToBlob(src: string) {
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
		return {blob: new Blob([byteArray], { type: mineType }), ext: this.getImageExt(mineType)};
	}

    async uploadImageFromUrl(url: string, token: string, type: string = '') {
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

                }
            }

            return await UploadImageToWx(blob, filename, token, type);
        }
        catch (e) {

            throw new Error('上传图片失败:' + e.message + '|' + url);
        }
    }

    getImageExt(type: string): string {
        const mimeToExt: { [key: string]: string } = {
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

    getMimeType(ext: string): string {
        const extToMime: { [key: string]: string } = {
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

    getImageInfos(root: HTMLElement) {
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

    async uploadRemoteImage(root: HTMLElement, token: string, type: string = '') {
        const images = root.getElementsByTagName('img');
        const result = [];
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            if (img.src.includes('mmbiz.qpic.cn')) continue;

            if (img.src.startsWith('http://localhost/') && Platform.isMobileApp) {
                continue;
            }

            if (img.src.startsWith('http')) {
                const res = await this.uploadImageFromUrl(img.src, token, type);
                if (res.errcode != 0) {
                    const msg = `上传图片失败: ${img.src} ${res.errcode} ${res.errmsg}`;
                    new Notice(msg);

                }

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
                const {blob, ext} = this.base64ToBlob(img.src);
                if (!img.id) {
                    img.id = `local-img-${i}`;
                }
                const name = img.id + ext;
                const res = await UploadImageToWx(blob, name, token);
                if (res.errcode != 0) {
                    const msg = `上传图片失败: ${res.errcode} ${res.errmsg}`;
                    new Notice(msg);

                    continue;
                }

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

    replaceImages(root: HTMLElement) {
        const images = root.getElementsByTagName('img');

        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            let value = this.images.get(img.src);
            if (value == null) {
                if (!img.id) {

                    continue;
                }
                value = this.images.get('#' + img.id);
            }
            if (value == null) {

                continue;
            }
            if (value.url == null) {

                continue;
            }

            img.setAttribute('src', value.url);
        }
    }

    arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    async localImagesToBase64(vault: Vault) {
        const keys = this.images.keys();
        const result = new Map<string, string>();
        for (let key of keys) {
            const value = this.images.get(key);
            if (value == null) continue;
            const file = vault.getFileByPath(value.filePath);
            if (file == null) continue;
            let fileData = await vault.readBinary(file);
            const base64 = this.arrayBufferToBase64(fileData);
            const mimeType = this.getMimeType(file.extension);
            const data = `data:${mimeType};base64,${base64}`;
            result.set(value.resUrl, data);
        }
        return result;
    }

    async downloadRemoteImage(url: string) {
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

            return '';
        }
    }

    async remoteImagesToBase64(root: HTMLElement) {
        const images = root.getElementsByTagName('img');
        const result = new Map<string, string>();
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            if (!img.src.startsWith('http')) continue;
            const base64 = await this.downloadRemoteImage(img.src);
            if (base64 == '') continue;
            result.set(img.src, base64);
        }
        return result;
    }

    async embleImages(root: HTMLElement, vault: Vault) {
        const localImages = await this.localImagesToBase64(vault);
        const remoteImages = await this.remoteImagesToBase64(root);
        const result = root.cloneNode(true) as HTMLElement;
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

export class LocalFile extends Extension{
    index: number = 0;
    public static fileCache: Map<string, string> = new Map<string, string>();

    generateId() {
        this.index += 1;
        return `fid-${this.index}`;
    }

    getImagePath(path: string) {
        const res = this.assetsManager.getResourcePath(path);
        if (res == null) {

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

    isImage(file: string) {
        file = file.toLowerCase();
        return file.endsWith('.png')
                || file.endsWith('.jpg')
                || file.endsWith('.jpeg')
                || file.endsWith('.gif')
                || file.endsWith('.bmp')
                || file.endsWith('.webp');
    }

    parseImageLink(link: string) {
        if (link.includes('|')) {
            const parts = link.split('|');
            const path = parts[0];
            if (!this.isImage(path)) return null;

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

    getHeaderLevel(line: string) {
        const match = line.trimStart().match(/^#{1,6}/);
        if (match) {
            return match[0].length;
        }
        return 0;
    }

    async getFileContent(file: TAbstractFile, header: string | null, block: string | null) {
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
                if (!line.trim().startsWith('#')) continue;
                const items = line.trim().split(' ');
                if (items.length != 2) continue;
                if (header.trim() != items[1].trim()) continue;
                if (this.getHeaderLevel(line)) {
                    result += line + '\n';
                    level = this.getHeaderLevel(line);
                    append = true;
                }
            }
        }

        function isStructuredBlock(line: string) {
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

                    if (isStructuredBlock(line)) {
                        break;
                    }

                    for (let j = i - 1; j >= 0; j--) {
                        const l = lines[j];

                        if (l.startsWith('#')) {
                            break;
                        }

                        if (l.trim() == '') {
                            if (stopAtEmpty) break;
                            if (j < i - 1 && totalLen > 0) break;
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

    parseFileLink(link: string) {
        const info = link.split('|')[0];
        const items = info.split('#');
        let path = items[0];
        let header = null;
        let block = null;
        if (items.length == 2) {
            if (items[1].startsWith('^')) {
                block = items[1];
            } else {
                header = items[1];
            }
        }
        return { path, head: header, block };
    }

    async renderFile(link: string, id: string) {
        let { path, head: header, block} = this.parseFileLink(link);
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
            console.error(msg)
            return msg;
        }

        let content = await this.getFileContent(file, header, block);
        if (content.startsWith('---')) {
            content = content.replace(/^(---)$.+?^(---)$.+?/ims, '');
        }
        const body = await this.marked.parse(content);
        return body;
    }

    static async readBlob(src: string) {
        return await fetch(src).then(response => response.blob())
    }

    parseLinkStyle(link: string) {
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

            if (size != '') {
                const sizes = size.split('x');
                if (sizes.length == 2) {
                    // SVG尺寸需要动态计算，保留内联样式
                    style = `style="width:${sizes[0]}px;height:${sizes[1]}px;"`
                }
                else {
                    style = `style="width:${sizes[0]}px;"`
                }
            }
        }
        else {
            filename = link;
        }
        return { filename, style, postion };
    }

    parseSVGLink(link: string) {
        let classname = 'note-embed-svg-left';
        const postions = new Map<string, string>([
            ['left', 'note-embed-svg-left'],
            ['center', 'note-embed-svg-center'],
            ['right', 'note-embed-svg-right']
        ])

        let {filename, style, postion} = this.parseLinkStyle(link);
        classname = postions.get(postion) || classname;

        return { filename, style, classname };
    }

    async renderSVGFile(filename: string, id: string) {
        const file = this.assetsManager.searchFile(filename);

        if (file == null) {
            const msg = '找不到文件：' + file;
            console.error(msg)
            return msg;
        }

        const content = await this.getFileContent(file, null, null);
        LocalFile.fileCache.set(filename, content);
        return content;
    }

    markedExtension(): MarkedExtension {
        return {
            async: true,
            walkTokens: async (token: Tokens.Generic) => {
                if (token.type !== 'LocalImage') {
                    return;
                }

                let item = this.parseImageLink(token.href);
                if (item) {
                    const src = this.getImagePath(item.path);
                    const width = item.width ? `width="${item.width}"` : '';
                    const height = item.height? `height="${item.height}"` : '';
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
                    token.html = `<span class="${info.classname}"><span class="note-embed-svg" id="${id}" ${info.style}>${svg}</span></span>`
                    return;
                }

                const id = this.generateId();
                const content = await this.renderFile(token.href, id);
                const tag = this.callback.settings.embedStyle === 'quote' ? 'blockquote' : 'section';
                token.html = `<${tag} class="note-embed-file" id="${id}">${content}</${tag}>`
            },

            extensions:[{
            name: 'LocalImage',
            level: 'block',
            start: (src: string) => {
                const index = src.indexOf('![[');
                if (index === -1) return;
                return index;
            },
            tokenizer: (src: string) => {
                const matches = src.match(LocalFileRegex);
                if (matches == null) return;
                const token: Token = {
                    type: 'LocalImage',
                    raw: matches[0],
                    href: matches[1],
                    text: matches[1]
                };
                return token;
            },
            renderer: (token: Tokens.Generic) => {
                return token.html;
            }
        }]};
    }
}