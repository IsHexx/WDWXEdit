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
import { Notice } from "obsidian";
import hljs from "highlight.js";
import { MathRendererQueue } from "./math";
import { Extension } from "./extension";
// 更新import路径
import { UploadImageToWx } from "../../wechat/imagelib";
// Claude Code Remove
export class CardDataManager {
    constructor() {
        this.cardData = new Map();
    }
    // 静态方法，用于获取实例
    static getInstance() {
        if (!CardDataManager.instance) {
            CardDataManager.instance = new CardDataManager();
        }
        return CardDataManager.instance;
    }
    setCardData(id, cardData) {
        this.cardData.set(id, cardData);
    }
    cleanup() {
        this.cardData.clear();
    }
    restoreCard(html) {
        for (const [key, value] of this.cardData.entries()) {
            const exp = `<section[^>]*\\sdata-id="${key}"[^>]*>(.*?)<\\/section>`;
            const regex = new RegExp(exp, 'gs');
            if (!regex.test(html)) {
                console.warn('没有公众号信息：', key);
                continue;
            }
            html = html.replace(regex, value);
        }
        return html;
    }
}
const MermaidSectionClassName = 'note-mermaid';
const MermaidImgClassName = 'note-mermaid-img';
export class CodeRenderer extends Extension {
    async prepare() {
        this.mermaidIndex = 0;
    }
    static srcToBlob(src) {
        const base64 = src.split(',')[1];
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: 'image/png' });
    }
    static async uploadMermaidImages(root, token) {
        const imgs = root.querySelectorAll('.' + MermaidImgClassName);
        for (let img of imgs) {
            const src = img.getAttribute('src');
            if (!src)
                continue;
            if (src.startsWith('http'))
                continue;
            const blob = CodeRenderer.srcToBlob(img.getAttribute('src'));
            const name = img.id + '.png';
            const res = await UploadImageToWx(blob, name, token);
            if (res.errcode != 0) {
                const msg = `上传图片失败: ${res.errcode} ${res.errmsg}`;
                new Notice(msg);
                console.error(msg);
                continue;
            }
            // 修复类型兼容性问题
            const url = res.url;
            if (url) {
                img.setAttribute('src', url);
            }
        }
    }
    replaceSpaces(text) {
        let result = '';
        let inTag = false;
        for (let char of text) {
            if (char === '<') {
                inTag = true;
                result += char;
                continue;
            }
            else if (char === '>') {
                inTag = false;
                result += char;
                continue;
            }
            if (inTag) {
                result += char;
            }
            else {
                if (char === ' ') {
                    result += '&nbsp;';
                }
                else if (char === '\t') {
                    result += '&nbsp;&nbsp;&nbsp;&nbsp;';
                }
                else {
                    result += char;
                }
            }
        }
        return result;
    }
    async codeRenderer(code, infostring) {
        var _a;
        const lang = (_a = (infostring || '').match(/^\S*/)) === null || _a === void 0 ? void 0 : _a[0];
        code = code.replace(/\n$/, '');
        try {
            if (lang && hljs.getLanguage(lang)) {
                code = hljs.highlight(code, { language: lang }).value;
            }
            else {
                code = hljs.highlightAuto(code).value;
            }
        }
        catch (err) {
            console.error(err);
        }
        code = this.replaceSpaces(code);
        const lines = code.split('\n');
        let body = '';
        let liItems = '';
        for (let line in lines) {
            let text = lines[line];
            if (text.length === 0) {
                text = '<br>';
            }
            body = body + '<code>' + text + '</code>';
            liItems = liItems + `<li>${parseInt(line) + 1}</li>`;
        }
        let codeSection = '<section class="code-section code-snippet__fix hljs">';
        if (this.settings.lineNumber) {
            codeSection = codeSection + '<ul>'
                + liItems
                + '</ul>';
        }
        let html = '';
        if (lang) {
            html = codeSection + '<pre style="max-width:1000% !important;" class="hljs language-'
                + lang
                + '">'
                + body
                + '</pre></section>';
        }
        else {
            html = codeSection + '<pre>'
                + body
                + '</pre></section>';
        }
        // Claude Code Remove: 移除isAuthKeyVaild检查，不再需要注册码验证
        return html;
    }
    static getMathType(lang) {
        if (!lang)
            return null;
        let l = lang.toLowerCase();
        l = l.trim();
        if (l === 'am' || l === 'asciimath')
            return 'asciimath';
        if (l === 'latex' || l === 'tex')
            return 'latex';
        return null;
    }
    parseCard(htmlString) {
        const id = /data-id="([^"]+)"/;
        const headimgRegex = /data-headimg="([^"]+)"/;
        const nicknameRegex = /data-nickname="([^"]+)"/;
        const signatureRegex = /data-signature="([^"]+)"/;
        const idMatch = htmlString.match(id);
        const headimgMatch = htmlString.match(headimgRegex);
        const nicknameMatch = htmlString.match(nicknameRegex);
        const signatureMatch = htmlString.match(signatureRegex);
        return {
            id: idMatch ? idMatch[1] : '',
            headimg: headimgMatch ? headimgMatch[1] : '',
            nickname: nicknameMatch ? nicknameMatch[1] : '公众号名称',
            signature: signatureMatch ? signatureMatch[1] : '公众号介绍'
        };
    }
    renderCard(token) {
        const { id, headimg, nickname, signature } = this.parseCard(token.text);
        if (id === '') {
            return '<span>公众号卡片数据错误，没有id</span>';
        }
        CardDataManager.getInstance().setCardData(id, token.text);
        return `<section data-id="${id}" class="note-mpcard-wrapper"><div class="note-mpcard-content"><img class="note-mpcard-headimg" width="54" height="54" src="${headimg}"></img><div class="note-mpcard-info"><div class="note-mpcard-nickname">${nickname}</div><div class="note-mpcard-signature">${signature}</div></div></div><div class="note-mpcard-foot">公众号</div></section>`;
    }
    renderMermaid(token) {
        try {
            const meraidIndex = this.mermaidIndex;
            const containerId = `mermaid-${meraidIndex}`;
            this.callback.cacheElement('mermaid', containerId, token.raw);
            this.mermaidIndex += 1;
            return `<section id="${containerId}" class="${MermaidSectionClassName}"></section>`;
        }
        catch (error) {
            console.error(error.message);
            return '<span>mermaid渲染失败</span>';
        }
    }
    markedExtension() {
        return {
            async: true,
            walkTokens: async (token) => {
                var _a;
                if (token.type !== 'code')
                    return;
                // Claude Code Remove: 移除isAuthKeyVaild检查，始终启用数学公式和mermaid渲染
                const type = CodeRenderer.getMathType((_a = token.lang) !== null && _a !== void 0 ? _a : '');
                if (type) {
                    token.html = await MathRendererQueue.getInstance().render(token, false, type);
                    return;
                }
                if (token.lang && token.lang.trim().toLocaleLowerCase() == 'mermaid') {
                    token.html = this.renderMermaid(token);
                    return;
                }
                if (token.lang && token.lang.trim().toLocaleLowerCase() == 'mpcard') {
                    token.html = this.renderCard(token);
                    return;
                }
                token.html = await this.codeRenderer(token.text, token.lang);
            },
            extensions: [{
                    name: 'code',
                    level: 'block',
                    renderer: (token) => {
                        return token.html;
                    },
                }]
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7OztHQVlHO0FBRUgsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUVsQyxPQUFPLElBQUksTUFBTSxjQUFjLENBQUM7QUFDaEMsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sUUFBUSxDQUFDO0FBQzNDLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDeEMsYUFBYTtBQUNiLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUV4RCxxQkFBcUI7QUFFckIsTUFBTSxPQUFPLGVBQWU7SUFJM0I7UUFDQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO0lBQzNDLENBQUM7SUFFRCxjQUFjO0lBQ1AsTUFBTSxDQUFDLFdBQVc7UUFDeEIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUU7WUFDOUIsZUFBZSxDQUFDLFFBQVEsR0FBRyxJQUFJLGVBQWUsRUFBRSxDQUFDO1NBQ2pEO1FBQ0QsT0FBTyxlQUFlLENBQUMsUUFBUSxDQUFDO0lBQ2pDLENBQUM7SUFFTSxXQUFXLENBQUMsRUFBVSxFQUFFLFFBQWdCO1FBQzlDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBRU0sT0FBTztRQUNiLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDdkIsQ0FBQztJQUVNLFdBQVcsQ0FBQyxJQUFZO1FBQzlCLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxFQUFFO1lBQ25ELE1BQU0sR0FBRyxHQUFHLDRCQUE0QixHQUFHLDBCQUEwQixDQUFDO1lBQ3RFLE1BQU0sS0FB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QUMsQ0FBQztZQUM5RCxDQUFDO1lBQ0QsVUFBVSxFQUFFLENBQUM7b0JBQ1osSUFBSSxFQUFFLE1BQU07b0JBQ1osS0FBSyxFQUFFLE9BQU87b0JBQ2QsUUFBUSxFQUFFLENBQUMsS0FBcUIsRUFBRSxFQUFFO3dCQUNuQyxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUM7b0JBQ25CLENBQUM7aUJBQ0QsQ0FBQztTQUNGLENBQUE7SUFDRixDQUFDO0NBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IChjKSAyMDI0LTIwMjUgSXNIZXh4XG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc29mdHdhcmUgaXMgcHJvcHJpZXRhcnkgYW5kIGNvbmZpZGVudGlhbC4gTm8gcGFydCBvZiB0aGlzIHNvZnR3YXJlXG4gKiBtYXkgYmUgcmVwcm9kdWNlZCwgZGlzdHJpYnV0ZWQsIG9yIHRyYW5zbWl0dGVkIGluIGFueSBmb3JtIG9yIGJ5IGFueSBtZWFucyxcbiAqIGluY2x1ZGluZyBwaG90b2NvcHlpbmcsIHJlY29yZGluZywgb3Igb3RoZXIgZWxlY3Ryb25pYyBvciBtZWNoYW5pY2FsIG1ldGhvZHMsXG4gKiB3aXRob3V0IHRoZSBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24gb2YgdGhlIGF1dGhvciwgZXhjZXB0IGluIHRoZSBjYXNlIG9mXG4gKiBicmllZiBxdW90YXRpb25zIGVtYm9kaWVkIGluIGNyaXRpY2FsIHJldmlld3MgYW5kIGNlcnRhaW4gb3RoZXIgbm9uY29tbWVyY2lhbFxuICogdXNlcyBwZXJtaXR0ZWQgYnkgY29weXJpZ2h0IGxhdy5cbiAqXG4gKiBGb3IgcGVybWlzc2lvbiByZXF1ZXN0cywgY29udGFjdDogSXNIZXh4XG4gKi9cblxuaW1wb3J0IHsgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBNYXJrZWRFeHRlbnNpb24sIFRva2VucyB9IGZyb20gXCJtYXJrZWRcIjtcbmltcG9ydCBobGpzIGZyb20gXCJoaWdobGlnaHQuanNcIjtcbmltcG9ydCB7IE1hdGhSZW5kZXJlclF1ZXVlIH0gZnJvbSBcIi4vbWF0aFwiO1xuaW1wb3J0IHsgRXh0ZW5zaW9uIH0gZnJvbSBcIi4vZXh0ZW5zaW9uXCI7XG4vLyDmm7TmlrBpbXBvcnTot6/lvoRcbmltcG9ydCB7IFVwbG9hZEltYWdlVG9XeCB9IGZyb20gXCIuLi8uLi93ZWNoYXQvaW1hZ2VsaWJcIjtcbmltcG9ydCBBc3NldHNNYW5hZ2VyIGZyb20gXCIuLi8uLi8uLi9jb3JlL2Fzc2V0c1wiO1xuLy8gQ2xhdWRlIENvZGUgUmVtb3ZlXG5cbmV4cG9ydCBjbGFzcyBDYXJkRGF0YU1hbmFnZXIge1xuXHRwcml2YXRlIGNhcmREYXRhOiBNYXA8c3RyaW5nLCBzdHJpbmc+O1xuXHRwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogQ2FyZERhdGFNYW5hZ2VyO1xuXG5cdHByaXZhdGUgY29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5jYXJkRGF0YSA9IG5ldyBNYXA8c3RyaW5nLCBzdHJpbmc+KCk7XG5cdH1cblxuXHQvLyDpnZnmgIHmlrnms5XvvIznlKjkuo7ojrflj5blrp7kvotcblx0cHVibGljIHN0YXRpYyBnZXRJbnN0YW5jZSgpOiBDYXJkRGF0YU1hbmFnZXIge1xuXHRcdGlmICghQ2FyZERhdGFNYW5hZ2VyLmluc3RhbmNlKSB7XG5cdFx0XHRDYXJkRGF0YU1hbmFnZXIuaW5zdGFuY2UgPSBuZXcgQ2FyZERhdGFNYW5hZ2VyKCk7XG5cdFx0fVxuXHRcdHJldHVybiBDYXJkRGF0YU1hbmFnZXIuaW5zdGFuY2U7XG5cdH1cblxuXHRwdWJsaWMgc2V0Q2FyZERhdGEoaWQ6IHN0cmluZywgY2FyZERhdGE6IHN0cmluZykge1xuXHRcdHRoaXMuY2FyZERhdGEuc2V0KGlkLCBjYXJkRGF0YSk7XG5cdH1cblxuXHRwdWJsaWMgY2xlYW51cCgpIHtcblx0XHR0aGlzLmNhcmREYXRhLmNsZWFyKCk7XG5cdH1cblxuXHRwdWJsaWMgcmVzdG9yZUNhcmQoaHRtbDogc3RyaW5nKSB7XG5cdFx0Zm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgdGhpcy5jYXJkRGF0YS5lbnRyaWVzKCkpIHtcblx0XHRcdGNvbnN0IGV4cCA9IGA8c2VjdGlvbltePl0qXFxcXHNkYXRhLWlkPVwiJHtrZXl9XCJbXj5dKj4oLio/KTxcXFxcL3NlY3Rpb24+YDtcblx0XHRcdGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChleHAsICdncycpO1xuXHRcdFx0aWYgKCFyZWdleC50ZXN0KGh0bWwpKSB7XG5cdFx0XHRcdGNvbnNvbGUud2Fybign5rKh5pyJ5YWs5LyX5Y+35L+h5oGv77yaJywga2V5KTtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cdFx0XHRodG1sID0gaHRtbC5yZXBsYWNlKHJlZ2V4LCB2YWx1ZSk7XG5cdFx0fVxuXHRcdHJldHVybiBodG1sO1xuXHR9XG59XG5cbmNvbnN0IE1lcm1haWRTZWN0aW9uQ2xhc3NOYW1lID0gJ25vdGUtbWVybWFpZCc7XG5jb25zdCBNZXJtYWlkSW1nQ2xhc3NOYW1lID0gJ25vdGUtbWVybWFpZC1pbWcnO1xuXG5leHBvcnQgY2xhc3MgQ29kZVJlbmRlcmVyIGV4dGVuZHMgRXh0ZW5zaW9uIHtcblx0c2hvd0xpbmVOdW1iZXI6IGJvb2xlYW47XG5cdG1lcm1haWRJbmRleDogbnVtYmVyO1xuXG5cdGFzeW5jIHByZXBhcmUoKSB7XG5cdFx0dGhpcy5tZXJtYWlkSW5kZXggPSAwO1xuXHR9XG5cblx0c3RhdGljIHNyY1RvQmxvYihzcmM6IHN0cmluZykge1xuXHRcdGNvbnN0IGJhc2U2NCA9IHNyYy5zcGxpdCgnLCcpWzFdO1xuXHRcdGNvbnN0IGJ5dGVDaGFyYWN0ZXJzID0gYXRvYihiYXNlNjQpO1xuXHRcdGNvbnN0IGJ5dGVOdW1iZXJzID0gbmV3IEFycmF5KGJ5dGVDaGFyYWN0ZXJzLmxlbmd0aCk7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBieXRlQ2hhcmFjdGVycy5sZW5ndGg7IGkrKykge1xuXHRcdFx0Ynl0ZU51bWJlcnNbaV0gPSBieXRlQ2hhcmFjdGVycy5jaGFyQ29kZUF0KGkpO1xuXHRcdH1cblx0XHRjb25zdCBieXRlQXJyYXkgPSBuZXcgVWludDhBcnJheShieXRlTnVtYmVycyk7XG5cdFx0cmV0dXJuIG5ldyBCbG9iKFtieXRlQXJyYXldLCB7IHR5cGU6ICdpbWFnZS9wbmcnIH0pO1xuXHR9XG5cblx0c3RhdGljIGFzeW5jIHVwbG9hZE1lcm1haWRJbWFnZXMocm9vdDogSFRNTEVsZW1lbnQsIHRva2VuOiBzdHJpbmcpIHtcblx0XHRjb25zdCBpbWdzID0gcm9vdC5xdWVyeVNlbGVjdG9yQWxsKCcuJyArIE1lcm1haWRJbWdDbGFzc05hbWUpO1xuXHRcdGZvciAobGV0IGltZyBvZiBpbWdzKSB7XG5cdFx0XHRjb25zdCBzcmMgPSBpbWcuZ2V0QXR0cmlidXRlKCdzcmMnKTtcblx0XHRcdGlmICghc3JjKSBjb250aW51ZTtcblx0XHRcdGlmIChzcmMuc3RhcnRzV2l0aCgnaHR0cCcpKSBjb250aW51ZTtcblx0XHRcdGNvbnN0IGJsb2IgPSBDb2RlUmVuZGVyZXIuc3JjVG9CbG9iKGltZy5nZXRBdHRyaWJ1dGUoJ3NyYycpISk7XG5cdFx0XHRjb25zdCBuYW1lID0gaW1nLmlkICsgJy5wbmcnO1xuXHRcdFx0Y29uc3QgcmVzID0gYXdhaXQgVXBsb2FkSW1hZ2VUb1d4KGJsb2IsIG5hbWUsIHRva2VuKTtcblx0XHRcdGlmIChyZXMuZXJyY29kZSAhPSAwKSB7XG5cdFx0XHRcdGNvbnN0IG1zZyA9IGDkuIrkvKDlm77niYflpLHotKU6ICR7cmVzLmVycmNvZGV9ICR7cmVzLmVycm1zZ31gO1xuXHRcdFx0XHRuZXcgTm90aWNlKG1zZyk7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IobXNnKTtcblx0XHRcdFx0Y29udGludWU7XG5cdFx0XHR9XG5cdFx0XHQvLyDkv67lpI3nsbvlnovlhbzlrrnmgKfpl67pophcblx0XHRcdGNvbnN0IHVybCA9IHJlcy51cmw7XG5cdFx0XHRpZiAodXJsKSB7XG5cdFx0XHRcdGltZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIHVybCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmVwbGFjZVNwYWNlcyh0ZXh0OiBzdHJpbmcpIHtcblx0XHRsZXQgcmVzdWx0ID0gJyc7XG5cdFx0bGV0IGluVGFnID0gZmFsc2U7XG5cdFx0Zm9yIChsZXQgY2hhciBvZiB0ZXh0KSB7XG5cdFx0XHRpZiAoY2hhciA9PT0gJzwnKSB7XG5cdFx0XHRcdGluVGFnID0gdHJ1ZTtcblx0XHRcdFx0cmVzdWx0ICs9IGNoYXI7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fSBlbHNlIGlmIChjaGFyID09PSAnPicpIHtcblx0XHRcdFx0aW5UYWcgPSBmYWxzZTtcblx0XHRcdFx0cmVzdWx0ICs9IGNoYXI7XG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGluVGFnKSB7XG5cdFx0XHRcdHJlc3VsdCArPSBjaGFyO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKGNoYXIgPT09ICcgJykge1xuXHRcdFx0XHRcdHJlc3VsdCArPSAnJm5ic3A7Jztcblx0XHRcdFx0fSBlbHNlIGlmIChjaGFyID09PSAnXFx0Jykge1xuXHRcdFx0XHRcdHJlc3VsdCArPSAnJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7Jztcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXN1bHQgKz0gY2hhcjtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9XG5cblx0YXN5bmMgY29kZVJlbmRlcmVyKGNvZGU6IHN0cmluZywgaW5mb3N0cmluZzogc3RyaW5nIHwgdW5kZWZpbmVkKSB7XG5cdFx0Y29uc3QgbGFuZyA9IChpbmZvc3RyaW5nIHx8ICcnKS5tYXRjaCgvXlxcUyovKT8uWzBdO1xuXHRcdGNvZGUgPSBjb2RlLnJlcGxhY2UoL1xcbiQvLCAnJyk7XG5cblx0XHR0cnkge1xuXHRcdFx0aWYgKGxhbmcgJiYgaGxqcy5nZXRMYW5ndWFnZShsYW5nKSkge1xuXHRcdFx0XHRjb2RlID0gaGxqcy5oaWdobGlnaHQoY29kZSwgeyBsYW5ndWFnZTogbGFuZyB9KS52YWx1ZTtcblx0XHRcdH1cblx0XHRcdGVsc2Uge1xuXHRcdFx0XHRjb2RlID0gaGxqcy5oaWdobGlnaHRBdXRvKGNvZGUpLnZhbHVlO1xuXHRcdFx0fVxuXHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0Y29uc29sZS5lcnJvcihlcnIpO1xuXHRcdH1cblxuXHRcdGNvZGUgPSB0aGlzLnJlcGxhY2VTcGFjZXMoY29kZSk7XG5cdFx0Y29uc3QgbGluZXMgPSBjb2RlLnNwbGl0KCdcXG4nKTtcblx0XHRsZXQgYm9keSA9ICcnO1xuXHRcdGxldCBsaUl0ZW1zID0gJyc7XG5cdFx0Zm9yIChsZXQgbGluZSBpbiBsaW5lcykge1xuXHRcdFx0bGV0IHRleHQgPSBsaW5lc1tsaW5lXTtcblx0XHRcdGlmICh0ZXh0Lmxlbmd0aCA9PT0gMCkge1xuXHRcdFx0XHR0ZXh0ID0gJzxicj4nXG5cdFx0XHR9XG5cdFx0XHRib2R5ID0gYm9keSArICc8Y29kZT4nICsgdGV4dCArICc8L2NvZGU+Jztcblx0XHRcdGxpSXRlbXMgPSBsaUl0ZW1zICsgYDxsaT4ke3BhcnNlSW50KGxpbmUpKzF9PC9saT5gO1xuXHRcdH1cblxuXHRcdGxldCBjb2RlU2VjdGlvbiA9ICc8c2VjdGlvbiBjbGFzcz1cImNvZGUtc2VjdGlvbiBjb2RlLXNuaXBwZXRfX2ZpeCBobGpzXCI+Jztcblx0XHRpZiAodGhpcy5zZXR0aW5ncy5saW5lTnVtYmVyKSB7XG5cdFx0XHRjb2RlU2VjdGlvbiA9IGNvZGVTZWN0aW9uICsgJzx1bD4nXG5cdFx0XHRcdCsgbGlJdGVtc1xuXHRcdFx0XHQrICc8L3VsPic7XG5cdFx0fVxuXG5cdFx0bGV0IGh0bWwgPSAnJztcblx0XHRpZiAobGFuZykge1xuXHRcdGh0bWwgPSBjb2RlU2VjdGlvbiArICc8cHJlIHN0eWxlPVwibWF4LXdpZHRoOjEwMDAlICFpbXBvcnRhbnQ7XCIgY2xhc3M9XCJobGpzIGxhbmd1YWdlLSdcblx0XHRcdCsgbGFuZ1xuXHRcdFx0KyAnXCI+J1xuXHRcdFx0KyBib2R5XG5cdFx0XHQrICc8L3ByZT48L3NlY3Rpb24+Jztcblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRodG1sID0gY29kZVNlY3Rpb24gKyAnPHByZT4nXG5cdFx0XHRcdCsgYm9keVxuXHRcdFx0XHQrICc8L3ByZT48L3NlY3Rpb24+Jztcblx0XHR9XG5cblx0XHQvLyBDbGF1ZGUgQ29kZSBSZW1vdmU6IOenu+mZpGlzQXV0aEtleVZhaWxk5qOA5p+l77yM5LiN5YaN6ZyA6KaB5rOo5YaM56CB6aqM6K+BXG5cdFx0cmV0dXJuIGh0bWw7XG5cdH1cblxuXHRzdGF0aWMgZ2V0TWF0aFR5cGUobGFuZzogc3RyaW5nIHwgbnVsbCkge1xuXHRcdGlmICghbGFuZykgcmV0dXJuIG51bGw7XG5cdFx0bGV0IGwgPSBsYW5nLnRvTG93ZXJDYXNlKCk7XG5cdFx0bCA9IGwudHJpbSgpO1xuXHRcdGlmIChsID09PSAnYW0nIHx8IGwgPT09ICdhc2NpaW1hdGgnKSByZXR1cm4gJ2FzY2lpbWF0aCc7XG5cdFx0aWYgKGwgPT09ICdsYXRleCcgfHwgbCA9PT0gJ3RleCcpIHJldHVybiAnbGF0ZXgnO1xuXHRcdHJldHVybiBudWxsO1xuXHR9XG5cblx0cGFyc2VDYXJkKGh0bWxTdHJpbmc6IHN0cmluZykge1xuXHRcdGNvbnN0IGlkID0gL2RhdGEtaWQ9XCIoW15cIl0rKVwiLztcblx0XHRjb25zdCBoZWFkaW1nUmVnZXggPSAvZGF0YS1oZWFkaW1nPVwiKFteXCJdKylcIi87XG5cdFx0Y29uc3Qgbmlja25hbWVSZWdleCA9IC9kYXRhLW5pY2tuYW1lPVwiKFteXCJdKylcIi87XG5cdFx0Y29uc3Qgc2lnbmF0dXJlUmVnZXggPSAvZGF0YS1zaWduYXR1cmU9XCIoW15cIl0rKVwiLztcblxuXHRcdGNvbnN0IGlkTWF0Y2ggPSBodG1sU3RyaW5nLm1hdGNoKGlkKTtcblx0XHRjb25zdCBoZWFkaW1nTWF0Y2ggPSBodG1sU3RyaW5nLm1hdGNoKGhlYWRpbWdSZWdleCk7XG5cdFx0Y29uc3Qgbmlja25hbWVNYXRjaCA9IGh0bWxTdHJpbmcubWF0Y2gobmlja25hbWVSZWdleCk7XG5cdFx0Y29uc3Qgc2lnbmF0dXJlTWF0Y2ggPSBodG1sU3RyaW5nLm1hdGNoKHNpZ25hdHVyZVJlZ2V4KTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRpZDogaWRNYXRjaCA/IGlkTWF0Y2hbMV0gOiAnJyxcblx0XHRcdGhlYWRpbWc6IGhlYWRpbWdNYXRjaCA/IGhlYWRpbWdNYXRjaFsxXSA6ICcnLFxuXHRcdFx0bmlja25hbWU6IG5pY2tuYW1lTWF0Y2ggPyBuaWNrbmFtZU1hdGNoWzFdIDogJ+WFrOS8l+WPt+WQjeensCcsXG5cdFx0XHRzaWduYXR1cmU6IHNpZ25hdHVyZU1hdGNoID8gc2lnbmF0dXJlTWF0Y2hbMV0gOiAn5YWs5LyX5Y+35LuL57uNJ1xuXHRcdH07XG5cdH1cblxuXHRyZW5kZXJDYXJkKHRva2VuOiBUb2tlbnMuQ29kZSkge1xuXHRcdGNvbnN0IHsgaWQsIGhlYWRpbWcsIG5pY2tuYW1lLCBzaWduYXR1cmUgfSA9IHRoaXMucGFyc2VDYXJkKHRva2VuLnRleHQpO1xuXHRcdGlmIChpZCA9PT0gJycpIHtcblx0XHRcdHJldHVybiAnPHNwYW4+5YWs5LyX5Y+35Y2h54mH5pWw5o2u6ZSZ6K+v77yM5rKh5pyJaWQ8L3NwYW4+Jztcblx0XHR9XG5cdFx0Q2FyZERhdGFNYW5hZ2VyLmdldEluc3RhbmNlKCkuc2V0Q2FyZERhdGEoaWQsIHRva2VuLnRleHQpO1xuXHRcdHJldHVybiBgPHNlY3Rpb24gZGF0YS1pZD1cIiR7aWR9XCIgY2xhc3M9XCJub3RlLW1wY2FyZC13cmFwcGVyXCI+PGRpdiBjbGFzcz1cIm5vdGUtbXBjYXJkLWNvbnRlbnRcIj48aW1nIGNsYXNzPVwibm90ZS1tcGNhcmQtaGVhZGltZ1wiIHdpZHRoPVwiNTRcIiBoZWlnaHQ9XCI1NFwiIHNyYz1cIiR7aGVhZGltZ31cIj48L2ltZz48ZGl2IGNsYXNzPVwibm90ZS1tcGNhcmQtaW5mb1wiPjxkaXYgY2xhc3M9XCJub3RlLW1wY2FyZC1uaWNrbmFtZVwiPiR7bmlja25hbWV9PC9kaXY+PGRpdiBjbGFzcz1cIm5vdGUtbXBjYXJkLXNpZ25hdHVyZVwiPiR7c2lnbmF0dXJlfTwvZGl2PjwvZGl2PjwvZGl2PjxkaXYgY2xhc3M9XCJub3RlLW1wY2FyZC1mb290XCI+5YWs5LyX5Y+3PC9kaXY+PC9zZWN0aW9uPmA7XG5cdH1cblxuXHRyZW5kZXJNZXJtYWlkKHRva2VuOiBUb2tlbnMuQ29kZSkge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBtZXJhaWRJbmRleCA9IHRoaXMubWVybWFpZEluZGV4O1xuXHRcdFx0Y29uc3QgY29udGFpbmVySWQgPSBgbWVybWFpZC0ke21lcmFpZEluZGV4fWA7XG5cdFx0XHR0aGlzLmNhbGxiYWNrLmNhY2hlRWxlbWVudCgnbWVybWFpZCcsIGNvbnRhaW5lcklkLCB0b2tlbi5yYXcpO1xuXHRcdFx0dGhpcy5tZXJtYWlkSW5kZXggKz0gMTtcblx0XHRcdHJldHVybiBgPHNlY3Rpb24gaWQ9XCIke2NvbnRhaW5lcklkfVwiIGNsYXNzPVwiJHtNZXJtYWlkU2VjdGlvbkNsYXNzTmFtZX1cIj48L3NlY3Rpb24+YDtcblx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0Y29uc29sZS5lcnJvcihlcnJvci5tZXNzYWdlKTtcblx0XHRcdHJldHVybiAnPHNwYW4+bWVybWFpZOa4suafk+Wksei0pTwvc3Bhbj4nO1xuXHRcdH1cblx0fVxuXG5cdG1hcmtlZEV4dGVuc2lvbigpOiBNYXJrZWRFeHRlbnNpb24ge1xuXHRcdHJldHVybiB7XG5cdFx0XHRhc3luYzogdHJ1ZSxcblx0XHRcdHdhbGtUb2tlbnM6IGFzeW5jICh0b2tlbjogVG9rZW5zLkdlbmVyaWMpID0+IHtcblx0XHRcdFx0aWYgKHRva2VuLnR5cGUgIT09ICdjb2RlJykgcmV0dXJuO1xuXHRcdFx0XHQvLyBDbGF1ZGUgQ29kZSBSZW1vdmU6IOenu+mZpGlzQXV0aEtleVZhaWxk5qOA5p+l77yM5aeL57uI5ZCv55So5pWw5a2m5YWs5byP5ZKMbWVybWFpZOa4suafk1xuXHRcdFx0XHRjb25zdCB0eXBlID0gQ29kZVJlbmRlcmVyLmdldE1hdGhUeXBlKHRva2VuLmxhbmcgPz8gJycpO1xuXHRcdFx0XHRpZiAodHlwZSkge1xuXHRcdFx0XHRcdHRva2VuLmh0bWwgPSBhd2FpdCBNYXRoUmVuZGVyZXJRdWV1ZS5nZXRJbnN0YW5jZSgpLnJlbmRlcih0b2tlbiwgZmFsc2UsIHR5cGUpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAodG9rZW4ubGFuZyAmJiB0b2tlbi5sYW5nLnRyaW0oKS50b0xvY2FsZUxvd2VyQ2FzZSgpID09ICdtZXJtYWlkJykge1xuXHRcdFx0XHRcdHRva2VuLmh0bWwgPSB0aGlzLnJlbmRlck1lcm1haWQodG9rZW4gYXMgVG9rZW5zLkNvZGUpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAodG9rZW4ubGFuZyAmJiB0b2tlbi5sYW5nLnRyaW0oKS50b0xvY2FsZUxvd2VyQ2FzZSgpID09ICdtcGNhcmQnKSB7XG5cdFx0XHRcdFx0dG9rZW4uaHRtbCA9IHRoaXMucmVuZGVyQ2FyZCh0b2tlbiBhcyBUb2tlbnMuQ29kZSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRva2VuLmh0bWwgPSBhd2FpdCB0aGlzLmNvZGVSZW5kZXJlcih0b2tlbi50ZXh0LCB0b2tlbi5sYW5nKTtcblx0XHRcdH0sXG5cdFx0XHRleHRlbnNpb25zOiBbe1xuXHRcdFx0XHRuYW1lOiAnY29kZScsXG5cdFx0XHRcdGxldmVsOiAnYmxvY2snLFxuXHRcdFx0XHRyZW5kZXJlcjogKHRva2VuOiBUb2tlbnMuR2VuZXJpYykgPT4ge1xuXHRcdFx0XHRcdHJldHVybiB0b2tlbi5odG1sO1xuXHRcdFx0XHR9LFxuXHRcdFx0fV1cblx0XHR9XG5cdH1cbn1cblxuIl19