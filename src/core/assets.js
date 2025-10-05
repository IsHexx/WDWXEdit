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
import { Notice, requestUrl, FileSystemAdapter, TFile, TFolder } from "obsidian";
import * as zip from "@zip.js/zip.js";
import DefaultTheme from "../shared/default-theme";
import DefaultHighlight from "../shared/default-highlight";
import { WxSettings } from "./settings";
export default class AssetsManager {
    constructor() {
        this.defaultTheme = DefaultTheme;
        this.customCSS = '';
        this.isLoaded = false;
    }
    static getInstance() {
        if (!AssetsManager.instance) {
            AssetsManager.instance = new AssetsManager();
        }
        return AssetsManager.instance;
    }
    static setup(app, manifest) {
        AssetsManager.getInstance()._setup(app, manifest);
    }
    _setup(app, manifest) {
        this.app = app;
        this.manifest = manifest;
        this.assetsPath = this.app.vault.configDir + '/plugins/' + this.manifest.id + '/assets/';
        this.themesPath = this.assetsPath + 'themes/';
        this.hilightPath = this.assetsPath + 'highlights/';
        this.themeCfg = this.assetsPath + 'themes.json';
        this.hilightCfg = this.assetsPath + 'highlights.json';
        this.customCSSPath = this.assetsPath + 'custom.css';
        this.iconsPath = this.assetsPath + 'icons/';
        this.wasmPath = this.assetsPath + 'lib.wasm';
    }
    async loadAssets() {
        await this.loadThemes();
        await this.loadHighlights();
        await this.loadCustomCSS();
        this.isLoaded = true;
    }
    async loadThemes() {
        try {
            if (!await this.app.vault.adapter.exists(this.themeCfg)) {
                new Notice('主题资源未下载，请前往设置下载！');
                this.themes = [this.defaultTheme];
                return;
            }
            const data = await this.app.vault.adapter.read(this.themeCfg);
            if (data) {
                const themes = JSON.parse(data);
                await this.loadCSS(themes);
                this.themes = [this.defaultTheme, ...themes];
            }
        }
        catch (error) {
            console.error(error);
            new Notice('themes.json解析失败！');
        }
    }
    async loadCSS(themes) {
        try {
            for (const theme of themes) {
                const cssFile = this.themesPath + theme.className + '.css';
                const cssContent = await this.app.vault.adapter.read(cssFile);
                if (cssContent) {
                    theme.css = cssContent;
                }
            }
        }
        catch (error) {
            console.error(error);
            new Notice('读取CSS失败！');
        }
    }
    async loadCustomCSS() {
        try {
            const customCSSNote = WxSettings.getInstance().customCSSNote;
            if (customCSSNote != '') {
                const file = this.searchFile(customCSSNote);
                if (file) {
                    const cssContent = await this.app.vault.adapter.read(file.path);
                    if (cssContent) {
                        this.customCSS = cssContent.replace(/```css/gi, '').replace(/```/g, '');
                    }
                }
                else {
                    new Notice(customCSSNote + '自定义CSS文件不存在！');
                }
                return;
            }
            if (!await this.app.vault.adapter.exists(this.customCSSPath)) {
                return;
            }
            const cssContent = await this.app.vault.adapter.read(this.customCSSPath);
            if (cssContent) {
                this.customCSS = cssContent;
            }
        }
        catch (error) {
            console.error(error);
            new Notice('读取CSS失败！');
        }
    }
    async loadHighlights() {
        try {
            const defaultHighlight = { name: '默认', url: '', css: DefaultHighlight };
            this.highlights = [defaultHighlight];
            if (!await this.app.vault.adapter.exists(this.hilightCfg)) {
                new Notice('高亮资源未下载，请前往设置下载！');
                return;
            }
            const data = await this.app.vault.adapter.read(this.hilightCfg);
            if (data) {
                const items = JSON.parse(data);
                const highlightNames = new Set(['默认']);
                for (const item of items) {
                    if (!highlightNames.has(item.name)) {
                        const cssFile = this.hilightPath + item.name + '.css';
                        const cssContent = await this.app.vault.adapter.read(cssFile);
                        this.highlights.push({ name: item.name, url: item.url, css: cssContent });
                        highlightNames.add(item.name);
                    }
                }
            }
        }
        catch (error) {
            console.error(error);
            new Notice('highlights.json解析失败！');
        }
    }
    async loadIcon(name) {
        const icon = this.iconsPath + name + '.svg';
        if (!await this.app.vault.adapter.exists(icon)) {
            return '';
        }
        const iconContent = await this.app.vault.adapter.read(icon);
        if (iconContent) {
            return iconContent;
        }
        return '';
    }
    async loadWasm() {
        if (!await this.app.vault.adapter.exists(this.wasmPath)) {
            return null;
        }
        const wasmContent = await this.app.vault.adapter.readBinary(this.wasmPath);
        if (wasmContent) {
            return wasmContent;
        }
        return null;
    }
    getTheme(themeName) {
        if (themeName === '') {
            return this.themes[0];
        }
        for (const theme of this.themes) {
            if (theme.name.toLowerCase() === themeName.toLowerCase() || theme.className.toLowerCase() === themeName.toLowerCase()) {
                return theme;
            }
        }
    }
    getHighlight(highlightName) {
        if (highlightName === '') {
            return this.highlights[0];
        }
        for (const highlight of this.highlights) {
            if (highlight.name.toLowerCase() === highlightName.toLowerCase()) {
                return highlight;
            }
        }
    }
    getThemeURL() {
        const version = this.manifest.version;
        return `https://github.com/IsHexx/WDWXEdit/releases/download/v${version}/assets.zip`;
    }
    async getStyle() {
        const file = this.app.vault.configDir + '/plugins/' + this.manifest.id + '/styles.css';
        if (!await this.app.vault.adapter.exists(file)) {
            return '';
        }
        const data = await this.app.vault.adapter.read(file);
        if (data) {
            return data;
        }
        return '';
    }
    async downloadThemes() {
        try {
            if (await this.app.vault.adapter.exists(this.themeCfg)) {
                new Notice('主题资源已存在！');
                return;
            }
            const res = await requestUrl(this.getThemeURL());
            const data = res.arrayBuffer;
            await this.unzip(new Blob([data]));
            await this.loadAssets();
            new Notice('主题下载完成！');
        }
        catch (error) {
            console.error(error);
            await this.removeThemes();
            new Notice('主题下载失败, 请检查网络！');
        }
    }
    // Claude Code Update
    async unzip(data) {
        const zipFileReader = new zip.BlobReader(data);
        const zipReader = new zip.ZipReader(zipFileReader);
        const entries = await zipReader.getEntries();
        // 确保主assets目录存在
        if (!await this.app.vault.adapter.exists(this.assetsPath)) {
            await this.app.vault.adapter.mkdir(this.assetsPath);
        }
        // 首先创建所有目录
        for (const entry of entries) {
            if (entry.directory) {
                const dirPath = this.assetsPath + entry.filename;
                if (!await this.app.vault.adapter.exists(dirPath)) {
                    await this.app.vault.adapter.mkdir(dirPath);
                }
            }
        }
        // 确保关键子目录存在
        const themesDir = this.assetsPath + 'themes/';
        const highlightsDir = this.assetsPath + 'highlights/';
        if (!await this.app.vault.adapter.exists(themesDir)) {
            await this.app.vault.adapter.mkdir(themesDir);
        }
        if (!await this.app.vault.adapter.exists(highlightsDir)) {
            await this.app.vault.adapter.mkdir(highlightsDir);
        }
        // 然后写入所有文件
        for (const entry of entries) {
            if (!entry.directory) {
                const filePath = this.assetsPath + entry.filename;
                const blobWriter = new zip.Uint8ArrayWriter();
                if (entry.getData) {
                    try {
                        // 确保文件所在目录存在
                        const parentDir = filePath.substring(0, filePath.lastIndexOf('/'));
                        if (parentDir && !await this.app.vault.adapter.exists(parentDir)) {
                            await this.app.vault.adapter.mkdir(parentDir);
                        }
                        const data = await entry.getData(blobWriter);
                        await this.app.vault.adapter.writeBinary(filePath, data.buffer);
                    }
                    catch (error) {
                        console.error(`Failed to extract ${entry.filename}:`, error);
                    }
                }
            }
        }
        await zipReader.close();
    }
    async removeThemes() {
        try {
            const adapter = this.app.vault.adapter;
            if (await adapter.exists(this.themeCfg)) {
                await adapter.remove(this.themeCfg);
            }
            if (await adapter.exists(this.hilightCfg)) {
                await adapter.remove(this.hilightCfg);
            }
            if (await adapter.exists(this.themesPath)) {
                await adapter.rmdir(this.themesPath, true);
            }
            if (await adapter.exists(this.hilightPath)) {
                await adapter.rmdir(this.hilightPath, true);
            }
            await this.loadAssets();
            new Notice('清空完成！');
        }
        catch (error) {
            console.error(error);
            new Notice('清空主题失败！');
        }
    }
    // Claude Code Update
    async openAssets() {
        // 添加桌面端检查，确保移动端兼容性
        if (!this.app.vault.adapter) {
            new Notice('当前平台不支持此功能');
            return;
        }
        // 使用 instanceof 检查而非类型断言
        const adapter = this.app.vault.adapter;
        if (!(adapter instanceof FileSystemAdapter)) {
            new Notice('当前平台不支持打开文件夹');
            return;
        }
        const path = require('path');
        const vaultRoot = adapter.getBasePath();
        const assets = this.assetsPath;
        if (!await adapter.exists(assets)) {
            await adapter.mkdir(assets);
        }
        const dst = path.join(vaultRoot, assets);
        const { shell } = require('electron');
        shell.openPath(dst);
    }
    searchFile(nameOrPath) {
        const resolvedPath = this.resolvePath(nameOrPath);
        const vault = this.app.vault;
        const attachmentFolderPath = vault.config.attachmentFolderPath || '';
        let localPath = resolvedPath;
        let file = null;
        file = vault.getFileByPath(resolvedPath);
        if (file) {
            return file;
        }
        file = vault.getFileByPath(nameOrPath);
        if (file) {
            return file;
        }
        if (attachmentFolderPath != '') {
            localPath = attachmentFolderPath + '/' + nameOrPath;
            file = vault.getFileByPath(localPath);
            if (file) {
                return file;
            }
            localPath = attachmentFolderPath + '/' + resolvedPath;
            file = vault.getFileByPath(localPath);
            if (file) {
                return file;
            }
        }
        // Claude Code Update
        const files = vault.getAllLoadedFiles();
        for (let f of files) {
            if (f instanceof TFolder)
                continue;
            // 使用 instanceof 检查而非类型断言
            if (f instanceof TFile) {
                file = f;
                if (file.basename === nameOrPath || file.name === nameOrPath) {
                    return f;
                }
            }
        }
        return null;
    }
    // Claude Code Update
    getResourcePath(path) {
        const file = this.searchFile(path);
        // 使用 instanceof 检查而非类型断言
        if (!file || !(file instanceof TFile)) {
            return null;
        }
        const resUrl = this.app.vault.getResourcePath(file);
        return { resUrl, filePath: file.path };
    }
    resolvePath(relativePath) {
        const basePath = this.getActiveFileDir();
        if (!relativePath.includes('/')) {
            return relativePath;
        }
        const stack = basePath.split("/");
        const parts = relativePath.split("/");
        stack.pop();
        for (const part of parts) {
            if (part === ".")
                continue;
            if (part === "..")
                stack.pop();
            else
                stack.push(part);
        }
        return stack.join("/");
    }
    getActiveFileDir() {
        const af = this.app.workspace.getActiveFile();
        if (af == null) {
            return '';
        }
        const parts = af.path.split('/');
        parts.pop();
        if (parts.length == 0) {
            return '';
        }
        return parts.join('/');
    }
    // Claude Code Update
    async readFileBinary(path) {
        const vault = this.app.vault;
        const file = this.searchFile(path);
        // 使用 instanceof 检查而非类型断言
        if (!file || !(file instanceof TFile)) {
            return null;
        }
        return await vault.readBinary(file);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXNzZXRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7R0FZRztBQUVILE9BQU8sRUFBdUIsTUFBTSxFQUFFLFVBQVUsRUFBRSxpQkFBaUIsRUFBaUIsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUNySCxPQUFPLEtBQUssR0FBRyxNQUFNLGdCQUFnQixDQUFDO0FBQ3RDLE9BQU8sWUFBWSxNQUFNLHlCQUF5QixDQUFDO0FBQ25ELE9BQU8sZ0JBQWdCLE1BQU0sNkJBQTZCLENBQUM7QUFDM0QsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLFlBQVksQ0FBQztBQWlCeEMsTUFBTSxDQUFDLE9BQU8sT0FBTyxhQUFhO0lBMkM5QjtRQXpDQSxpQkFBWSxHQUFVLFlBQVksQ0FBQztRQU9uQyxjQUFTLEdBQVcsRUFBRSxDQUFDO1FBTXZCLGFBQVEsR0FBWSxLQUFLLENBQUM7SUE4QjFCLENBQUM7SUExQk0sTUFBTSxDQUFDLFdBQVc7UUFDckIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUU7WUFDekIsYUFBYSxDQUFDLFFBQVEsR0FBRyxJQUFJLGFBQWEsRUFBRSxDQUFDO1NBQ2hEO1FBQ0QsT0FBTyxhQUFhLENBQUMsUUFBUSxDQUFDO0lBQ2xDLENBQUM7SUFFTSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQVEsRUFBRSxRQUF3QjtRQUNsRCxhQUFhLENBQUMsV0FBVyxFQUFFLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRU8sTUFBTSxDQUFDLEdBQVEsRUFBRSxRQUF3QjtRQUM3QyxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENB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LGdCQUFnQjtRQUNaLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQzlDLElBQUksRUFBRSxJQUFJLElBQUksRUFBRTtZQUNaLE9BQU8sRUFBRSxDQUFDO1NBQ2I7UUFDRCxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDWixJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO1lBQ25CLE9BQU8sRUFBRSxDQUFDO1NBQ2I7UUFDRCxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDM0IsQ0FBQztJQUVELHFCQUFxQjtJQUNyQixLQUFLLENBQUMsY0FBYyxDQUFDLElBQVk7UUFDN0IsTUFBTSxLQUFLLEdBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7UUFDNUIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNuQyx5QkFBeUI7UUFDekIsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxZQUFZLEtBQUssQ0FBQyxFQUFFO1lBQ25DLE9BQU8sSUFBSSxDQUFDO1NBQ2Y7UUFDRCxPQUFPLE1BQU0sS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4QyxDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IChjKSAyMDI0LTIwMjUgSXNIZXh4XG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc29mdHdhcmUgaXMgcHJvcHJpZXRhcnkgYW5kIGNvbmZpZGVudGlhbC4gTm8gcGFydCBvZiB0aGlzIHNvZnR3YXJlXG4gKiBtYXkgYmUgcmVwcm9kdWNlZCwgZGlzdHJpYnV0ZWQsIG9yIHRyYW5zbWl0dGVkIGluIGFueSBmb3JtIG9yIGJ5IGFueSBtZWFucyxcbiAqIGluY2x1ZGluZyBwaG90b2NvcHlpbmcsIHJlY29yZGluZywgb3Igb3RoZXIgZWxlY3Ryb25pYyBvciBtZWNoYW5pY2FsIG1ldGhvZHMsXG4gKiB3aXRob3V0IHRoZSBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24gb2YgdGhlIGF1dGhvciwgZXhjZXB0IGluIHRoZSBjYXNlIG9mXG4gKiBicmllZiBxdW90YXRpb25zIGVtYm9kaWVkIGluIGNyaXRpY2FsIHJldmlld3MgYW5kIGNlcnRhaW4gb3RoZXIgbm9uY29tbWVyY2lhbFxuICogdXNlcyBwZXJtaXR0ZWQgYnkgY29weXJpZ2h0IGxhdy5cbiAqXG4gKiBGb3IgcGVybWlzc2lvbiByZXF1ZXN0cywgY29udGFjdDogSXNIZXh4XG4gKi9cblxuaW1wb3J0IHsgQXBwLCBQbHVnaW5NYW5pZmVzdCwgTm90aWNlLCByZXF1ZXN0VXJsLCBGaWxlU3lzdGVtQWRhcHRlciwgVEFic3RyYWN0RmlsZSwgVEZpbGUsIFRGb2xkZXIgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCAqIGFzIHppcCBmcm9tIFwiQHppcC5qcy96aXAuanNcIjtcbmltcG9ydCBEZWZhdWx0VGhlbWUgZnJvbSBcIi4uL3NoYXJlZC9kZWZhdWx0LXRoZW1lXCI7XG5pbXBvcnQgRGVmYXVsdEhpZ2hsaWdodCBmcm9tIFwiLi4vc2hhcmVkL2RlZmF1bHQtaGlnaGxpZ2h0XCI7XG5pbXBvcnQgeyBXeFNldHRpbmdzIH0gZnJvbSBcIi4vc2V0dGluZ3NcIjtcblxuXG5leHBvcnQgaW50ZXJmYWNlIFRoZW1lIHtcbiAgICBuYW1lOiBzdHJpbmdcbiAgICBjbGFzc05hbWU6IHN0cmluZ1xuICAgIGRlc2M6IHN0cmluZ1xuICAgIGF1dGhvcjogc3RyaW5nXG4gICAgY3NzOiBzdHJpbmdcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIaWdobGlnaHQge1xuICAgIG5hbWU6IHN0cmluZ1xuICAgIHVybDogc3RyaW5nXG4gICAgY3NzOiBzdHJpbmdcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQXNzZXRzTWFuYWdlciB7XG4gICAgYXBwOiBBcHA7XG4gICAgZGVmYXVsdFRoZW1lOiBUaGVtZSA9IERlZmF1bHRUaGVtZTtcbiAgICBtYW5pZmVzdDogUGx1Z2luTWFuaWZlc3Q7XG4gICAgdGhlbWVzOiBUaGVtZVtdO1xuICAgIGhpZ2hsaWdodHM6IEhpZ2hsaWdodFtdO1xuICAgIGFzc2V0c1BhdGg6IHN0cmluZztcbiAgICB0aGVtZXNQYXRoOiBzdHJpbmc7XG4gICAgaGlsaWdodFBhdGg6IHN0cmluZztcbiAgICBjdXN0b21DU1M6IHN0cmluZyA9ICcnO1xuICAgIHRoZW1lQ2ZnOiBzdHJpbmc7XG4gICAgaGlsaWdodENmZzogc3RyaW5nO1xuICAgIGN1c3RvbUNTU1BhdGg6IHN0cmluZztcbiAgICBpY29uc1BhdGg6IHN0cmluZztcbiAgICB3YXNtUGF0aDogc3RyaW5nO1xuICAgIGlzTG9hZGVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICBwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogQXNzZXRzTWFuYWdlcjtcblxuICAgIHB1YmxpYyBzdGF0aWMgZ2V0SW5zdGFuY2UoKTogQXNzZXRzTWFuYWdlciB7XG4gICAgICAgIGlmICghQXNzZXRzTWFuYWdlci5pbnN0YW5jZSkge1xuICAgICAgICAgICAgQXNzZXRzTWFuYWdlci5pbnN0YW5jZSA9IG5ldyBBc3NldHNNYW5hZ2VyKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIEFzc2V0c01hbmFnZXIuaW5zdGFuY2U7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBzZXR1cChhcHA6IEFwcCwgbWFuaWZlc3Q6IFBsdWdpbk1hbmlmZXN0KSB7XG4gICAgICAgIEFzc2V0c01hbmFnZXIuZ2V0SW5zdGFuY2UoKS5fc2V0dXAoYXBwLCBtYW5pZmVzdCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfc2V0dXAoYXBwOiBBcHAsIG1hbmlmZXN0OiBQbHVnaW5NYW5pZmVzdCkge1xuICAgICAgICB0aGlzLmFwcCA9IGFwcDtcbiAgICAgICAgdGhpcy5tYW5pZmVzdCA9IG1hbmlmZXN0O1xuICAgICAgICB0aGlzLmFzc2V0c1BhdGggPSB0aGlzLmFwcC52YXVsdC5jb25maWdEaXIgKyAnL3BsdWdpbnMvJyArIHRoaXMubWFuaWZlc3QuaWQgKyAnL2Fzc2V0cy8nO1xuICAgICAgICB0aGlzLnRoZW1lc1BhdGggPSB0aGlzLmFzc2V0c1BhdGggKyAndGhlbWVzLyc7XG4gICAgICAgIHRoaXMuaGlsaWdodFBhdGggPSB0aGlzLmFzc2V0c1BhdGggKyAnaGlnaGxpZ2h0cy8nO1xuICAgICAgICB0aGlzLnRoZW1lQ2ZnID0gdGhpcy5hc3NldHNQYXRoICsgJ3RoZW1lcy5qc29uJztcbiAgICAgICAgdGhpcy5oaWxpZ2h0Q2ZnID0gdGhpcy5hc3NldHNQYXRoICsgJ2hpZ2hsaWdodHMuanNvbic7XG4gICAgICAgIHRoaXMuY3VzdG9tQ1NTUGF0aCA9IHRoaXMuYXNzZXRzUGF0aCArICdjdXN0b20uY3NzJztcbiAgICAgICAgdGhpcy5pY29uc1BhdGggPSB0aGlzLmFzc2V0c1BhdGggKyAnaWNvbnMvJztcbiAgICAgICAgdGhpcy53YXNtUGF0aCA9IHRoaXMuYXNzZXRzUGF0aCArICdsaWIud2FzbSc7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcigpIHtcblxuICAgIH1cblxuICAgIGFzeW5jIGxvYWRBc3NldHMoKSB7XG4gICAgICAgIGF3YWl0IHRoaXMubG9hZFRoZW1lcygpO1xuICAgICAgICBhd2FpdCB0aGlzLmxvYWRIaWdobGlnaHRzKCk7XG4gICAgICAgIGF3YWl0IHRoaXMubG9hZEN1c3RvbUNTUygpO1xuICAgICAgICB0aGlzLmlzTG9hZGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBhc3luYyBsb2FkVGhlbWVzKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKCFhd2FpdCB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLmV4aXN0cyh0aGlzLnRoZW1lQ2ZnKSkge1xuICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoJ+S4u+mimOi1hOa6kOacquS4i+i9ve+8jOivt+WJjeW+gOiuvue9ruS4i+i9ve+8gScpO1xuICAgICAgICAgICAgICAgIHRoaXMudGhlbWVzID0gW3RoaXMuZGVmYXVsdFRoZW1lXTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5yZWFkKHRoaXMudGhlbWVDZmcpO1xuICAgICAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0aGVtZXMgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZENTUyh0aGVtZXMpO1xuICAgICAgICAgICAgICAgIHRoaXMudGhlbWVzID0gW3RoaXMuZGVmYXVsdFRoZW1lLCAuLi4gdGhlbWVzXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgbmV3IE5vdGljZSgndGhlbWVzLmpzb27op6PmnpDlpLHotKXvvIEnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGFzeW5jIGxvYWRDU1ModGhlbWVzOiBUaGVtZVtdKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHRoZW1lIG9mIHRoZW1lcykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNzc0ZpbGUgPSB0aGlzLnRoZW1lc1BhdGggKyB0aGVtZS5jbGFzc05hbWUgKyAnLmNzcyc7XG4gICAgICAgICAgICAgICAgY29uc3QgY3NzQ29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIucmVhZChjc3NGaWxlKTtcbiAgICAgICAgICAgICAgICBpZiAoY3NzQ29udGVudCkge1xuICAgICAgICAgICAgICAgICAgICB0aGVtZS5jc3MgPSBjc3NDb250ZW50O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgbmV3IE5vdGljZSgn6K+75Y+WQ1NT5aSx6LSl77yBJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBsb2FkQ3VzdG9tQ1NTKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgY3VzdG9tQ1NTTm90ZSA9IFd4U2V0dGluZ3MuZ2V0SW5zdGFuY2UoKS5jdXN0b21DU1NOb3RlO1xuICAgICAgICAgICAgaWYgKGN1c3RvbUNTU05vdGUgIT0gJycpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5zZWFyY2hGaWxlKGN1c3RvbUNTU05vdGUpO1xuICAgICAgICAgICAgICAgIGlmIChmaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNzc0NvbnRlbnQgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLnJlYWQoZmlsZS5wYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNzc0NvbnRlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VzdG9tQ1NTID0gY3NzQ29udGVudC5yZXBsYWNlKC9gYGBjc3MvZ2ksICcnKS5yZXBsYWNlKC9gYGAvZywgJycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBuZXcgTm90aWNlKGN1c3RvbUNTU05vdGUgKyAn6Ieq5a6a5LmJQ1NT5paH5Lu25LiN5a2Y5Zyo77yBJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFhd2FpdCB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLmV4aXN0cyh0aGlzLmN1c3RvbUNTU1BhdGgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBjc3NDb250ZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5yZWFkKHRoaXMuY3VzdG9tQ1NTUGF0aCk7XG4gICAgICAgICAgICBpZiAoY3NzQ29udGVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3VzdG9tQ1NTID0gY3NzQ29udGVudDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgbmV3IE5vdGljZSgn6K+75Y+WQ1NT5aSx6LSl77yBJyk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIGFzeW5jIGxvYWRIaWdobGlnaHRzKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgZGVmYXVsdEhpZ2hsaWdodCA9IHtuYW1lOiAn6buY6K6kJywgdXJsOiAnJywgY3NzOiBEZWZhdWx0SGlnaGxpZ2h0fTtcbiAgICAgICAgICAgIHRoaXMuaGlnaGxpZ2h0cyA9IFtkZWZhdWx0SGlnaGxpZ2h0XTtcbiAgICAgICAgICAgIGlmICghYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5leGlzdHModGhpcy5oaWxpZ2h0Q2ZnKSkge1xuICAgICAgICAgICAgICAgIG5ldyBOb3RpY2UoJ+mrmOS6rui1hOa6kOacquS4i+i9ve+8jOivt+WJjeW+gOiuvue9ruS4i+i9ve+8gScpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIucmVhZCh0aGlzLmhpbGlnaHRDZmcpO1xuICAgICAgICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtcyA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgICAgICAgICAgICAgY29uc3QgaGlnaGxpZ2h0TmFtZXMgPSBuZXcgU2V0KFsn6buY6K6kJ10pOyBcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgaXRlbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFoaWdobGlnaHROYW1lcy5oYXMoaXRlbS5uYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgY3NzRmlsZSA9IHRoaXMuaGlsaWdodFBhdGggKyBpdGVtLm5hbWUgKyAnLmNzcyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjc3NDb250ZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5yZWFkKGNzc0ZpbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oaWdobGlnaHRzLnB1c2goe25hbWU6IGl0ZW0ubmFtZSwgdXJsOiBpdGVtLnVybCwgY3NzOiBjc3NDb250ZW50fSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBoaWdobGlnaHROYW1lcy5hZGQoaXRlbS5uYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgbmV3IE5vdGljZSgnaGlnaGxpZ2h0cy5qc29u6Kej5p6Q5aSx6LSl77yBJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBhc3luYyBsb2FkSWNvbihuYW1lOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgaWNvbiA9IHRoaXMuaWNvbnNQYXRoICsgbmFtZSArICcuc3ZnJztcbiAgICAgICAgaWYgKCFhd2FpdCB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLmV4aXN0cyhpY29uKSkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGljb25Db250ZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5yZWFkKGljb24pO1xuICAgICAgICBpZiAoaWNvbkNvbnRlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBpY29uQ29udGVudDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuXG4gICAgYXN5bmMgbG9hZFdhc20oKSB7XG4gICAgICAgIGlmICghYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5leGlzdHModGhpcy53YXNtUGF0aCkpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHdhc21Db250ZW50ID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5yZWFkQmluYXJ5KHRoaXMud2FzbVBhdGgpO1xuICAgICAgICBpZiAod2FzbUNvbnRlbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB3YXNtQ29udGVudDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBnZXRUaGVtZSh0aGVtZU5hbWU6IHN0cmluZykge1xuICAgICAgICBpZiAodGhlbWVOYW1lID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudGhlbWVzWzBdO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChjb25zdCB0aGVtZSBvZiB0aGlzLnRoZW1lcykge1xuICAgICAgICAgICAgaWYgKHRoZW1lLm5hbWUudG9Mb3dlckNhc2UoKSA9PT0gdGhlbWVOYW1lLnRvTG93ZXJDYXNlKCkgfHwgdGhlbWUuY2xhc3NOYW1lLnRvTG93ZXJDYXNlKCkgPT09IHRoZW1lTmFtZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoZW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0SGlnaGxpZ2h0KGhpZ2hsaWdodE5hbWU6IHN0cmluZykge1xuICAgICAgICBpZiAoaGlnaGxpZ2h0TmFtZSA9PT0gJycpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmhpZ2hsaWdodHNbMF07XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IGhpZ2hsaWdodCBvZiB0aGlzLmhpZ2hsaWdodHMpIHtcbiAgICAgICAgICAgIGlmIChoaWdobGlnaHQubmFtZS50b0xvd2VyQ2FzZSgpID09PSBoaWdobGlnaHROYW1lLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaGlnaGxpZ2h0O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0VGhlbWVVUkwoKSB7XG4gICAgICAgIGNvbnN0IHZlcnNpb24gPSB0aGlzLm1hbmlmZXN0LnZlcnNpb247XG4gICAgICAgIHJldHVybiBgaHR0cHM6Ly9naXRodWIuY29tL0lzSGV4eC9XRFdYRWRpdC9yZWxlYXNlcy9kb3dubG9hZC92JHt2ZXJzaW9ufS9hc3NldHMuemlwYDtcbiAgICB9XG5cbiAgICBhc3luYyBnZXRTdHlsZSgpIHtcbiAgICAgICAgY29uc3QgZmlsZSA9IHRoaXMuYXBwLnZhdWx0LmNvbmZpZ0RpciArICcvcGx1Z2lucy8nICsgdGhpcy5tYW5pZmVzdC5pZCArICcvc3R5bGVzLmNzcyc7XG4gICAgICAgIGlmICghYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5leGlzdHMoZmlsZSkpIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5yZWFkKGZpbGUpO1xuICAgICAgICBpZiAoZGF0YSkge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cblxuICAgIGFzeW5jIGRvd25sb2FkVGhlbWVzKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgaWYgKGF3YWl0IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIuZXhpc3RzKHRoaXMudGhlbWVDZmcpKSB7XG4gICAgICAgICAgICAgICAgbmV3IE5vdGljZSgn5Li76aKY6LWE5rqQ5bey5a2Y5Zyo77yBJylcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zdCByZXMgPSBhd2FpdCByZXF1ZXN0VXJsKHRoaXMuZ2V0VGhlbWVVUkwoKSk7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gcmVzLmFycmF5QnVmZmVyO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy51bnppcChuZXcgQmxvYihbZGF0YV0pKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZEFzc2V0cygpO1xuICAgICAgICAgICAgbmV3IE5vdGljZSgn5Li76aKY5LiL6L295a6M5oiQ77yBJyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucmVtb3ZlVGhlbWVzKCk7XG4gICAgICAgICAgICBuZXcgTm90aWNlKCfkuLvpopjkuIvovb3lpLHotKUsIOivt+ajgOafpee9kee7nO+8gScpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2xhdWRlIENvZGUgVXBkYXRlXG4gICAgYXN5bmMgdW56aXAoZGF0YTpCbG9iKSB7XG4gICAgICAgIGNvbnN0IHppcEZpbGVSZWFkZXIgPSBuZXcgemlwLkJsb2JSZWFkZXIoZGF0YSk7XG4gICAgICAgIGNvbnN0IHppcFJlYWRlciA9IG5ldyB6aXAuWmlwUmVhZGVyKHppcEZpbGVSZWFkZXIpO1xuICAgICAgICBjb25zdCBlbnRyaWVzID0gYXdhaXQgemlwUmVhZGVyLmdldEVudHJpZXMoKTtcblxuICAgICAgICAvLyDnoa7kv53kuLthc3NldHPnm67lvZXlrZjlnKhcbiAgICAgICAgaWYgKCFhd2FpdCB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLmV4aXN0cyh0aGlzLmFzc2V0c1BhdGgpKSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLm1rZGlyKHRoaXMuYXNzZXRzUGF0aCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDpppblhYjliJvlu7rmiYDmnInnm67lvZVcbiAgICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgICAgICBpZiAoZW50cnkuZGlyZWN0b3J5KSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGlyUGF0aCA9IHRoaXMuYXNzZXRzUGF0aCArIGVudHJ5LmZpbGVuYW1lO1xuICAgICAgICAgICAgICAgIGlmICghYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5leGlzdHMoZGlyUGF0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5ta2RpcihkaXJQYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyDnoa7kv53lhbPplK7lrZDnm67lvZXlrZjlnKhcbiAgICAgICAgY29uc3QgdGhlbWVzRGlyID0gdGhpcy5hc3NldHNQYXRoICsgJ3RoZW1lcy8nO1xuICAgICAgICBjb25zdCBoaWdobGlnaHRzRGlyID0gdGhpcy5hc3NldHNQYXRoICsgJ2hpZ2hsaWdodHMvJztcbiAgICAgICAgXG4gICAgICAgIGlmICghYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5leGlzdHModGhlbWVzRGlyKSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5ta2Rpcih0aGVtZXNEaXIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci5leGlzdHMoaGlnaGxpZ2h0c0RpcikpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIubWtkaXIoaGlnaGxpZ2h0c0Rpcik7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDnhLblkI7lhpnlhaXmiYDmnInmlofku7ZcbiAgICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgICAgICBpZiAoIWVudHJ5LmRpcmVjdG9yeSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpbGVQYXRoID0gdGhpcy5hc3NldHNQYXRoICsgZW50cnkuZmlsZW5hbWU7XG4gICAgICAgICAgICAgICAgY29uc3QgYmxvYldyaXRlciA9IG5ldyB6aXAuVWludDhBcnJheVdyaXRlcigpO1xuICAgICAgICAgICAgICAgIGlmIChlbnRyeS5nZXREYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyDnoa7kv53mlofku7bmiYDlnKjnm67lvZXlrZjlnKhcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcmVudERpciA9IGZpbGVQYXRoLnN1YnN0cmluZygwLCBmaWxlUGF0aC5sYXN0SW5kZXhPZignLycpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXJlbnREaXIgJiYgIWF3YWl0IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXIuZXhpc3RzKHBhcmVudERpcikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmFwcC52YXVsdC5hZGFwdGVyLm1rZGlyKHBhcmVudERpcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBlbnRyeS5nZXREYXRhKGJsb2JXcml0ZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuYWRhcHRlci53cml0ZUJpbmFyeShmaWxlUGF0aCwgZGF0YS5idWZmZXIgYXMgQXJyYXlCdWZmZXIpO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgRmFpbGVkIHRvIGV4dHJhY3QgJHtlbnRyeS5maWxlbmFtZX06YCwgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgemlwUmVhZGVyLmNsb3NlKCk7XG4gICAgfVxuXG4gICAgYXN5bmMgcmVtb3ZlVGhlbWVzKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgYWRhcHRlciA9IHRoaXMuYXBwLnZhdWx0LmFkYXB0ZXI7XG4gICAgICAgICAgICBpZiAoYXdhaXQgYWRhcHRlci5leGlzdHModGhpcy50aGVtZUNmZykpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCBhZGFwdGVyLnJlbW92ZSh0aGlzLnRoZW1lQ2ZnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhd2FpdCBhZGFwdGVyLmV4aXN0cyh0aGlzLmhpbGlnaHRDZmcpKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgYWRhcHRlci5yZW1vdmUodGhpcy5oaWxpZ2h0Q2ZnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhd2FpdCBhZGFwdGVyLmV4aXN0cyh0aGlzLnRoZW1lc1BhdGgpKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgYWRhcHRlci5ybWRpcih0aGlzLnRoZW1lc1BhdGgsIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGF3YWl0IGFkYXB0ZXIuZXhpc3RzKHRoaXMuaGlsaWdodFBhdGgpKSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgYWRhcHRlci5ybWRpcih0aGlzLmhpbGlnaHRQYXRoLCB0cnVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGF3YWl0IHRoaXMubG9hZEFzc2V0cygpO1xuICAgICAgICAgICAgbmV3IE5vdGljZSgn5riF56m65a6M5oiQ77yBJyk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIG5ldyBOb3RpY2UoJ+a4heepuuS4u+mimOWksei0pe+8gScpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gQ2xhdWRlIENvZGUgVXBkYXRlXG4gICAgYXN5bmMgb3BlbkFzc2V0cygpIHtcblx0ICAgIC8vIOa3u+WKoOahjOmdouerr+ajgOafpe+8jOehruS/neenu+WKqOerr+WFvOWuueaAp1xuXHQgICAgaWYgKCF0aGlzLmFwcC52YXVsdC5hZGFwdGVyKSB7XG5cdCAgICAgICAgbmV3IE5vdGljZSgn5b2T5YmN5bmz5Y+w5LiN5pSv5oyB5q2k5Yqf6IO9Jyk7XG5cdCAgICAgICAgcmV0dXJuO1xuXHQgICAgfVxuXG5cdCAgICAvLyDkvb/nlKggaW5zdGFuY2VvZiDmo4Dmn6XogIzpnZ7nsbvlnovmlq3oqIBcblx0ICAgIGNvbnN0IGFkYXB0ZXIgPSB0aGlzLmFwcC52YXVsdC5hZGFwdGVyO1xuXHQgICAgaWYgKCEoYWRhcHRlciBpbnN0YW5jZW9mIEZpbGVTeXN0ZW1BZGFwdGVyKSkge1xuXHQgICAgICAgIG5ldyBOb3RpY2UoJ+W9k+WJjeW5s+WPsOS4jeaUr+aMgeaJk+W8gOaWh+S7tuWkuScpO1xuXHQgICAgICAgIHJldHVybjtcblx0ICAgIH1cblxuXHQgICAgY29uc3QgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcblx0XHRjb25zdCB2YXVsdFJvb3QgPSBhZGFwdGVyLmdldEJhc2VQYXRoKCk7XG5cdFx0Y29uc3QgYXNzZXRzID0gdGhpcy5hc3NldHNQYXRoO1xuICAgICAgICBpZiAoIWF3YWl0IGFkYXB0ZXIuZXhpc3RzKGFzc2V0cykpIHtcbiAgICAgICAgICAgIGF3YWl0IGFkYXB0ZXIubWtkaXIoYXNzZXRzKTtcbiAgICAgICAgfVxuXHRcdGNvbnN0IGRzdCA9IHBhdGguam9pbih2YXVsdFJvb3QsIGFzc2V0cyk7XG5cdFx0Y29uc3QgeyBzaGVsbCB9ID0gcmVxdWlyZSgnZWxlY3Ryb24nKTtcblx0XHRzaGVsbC5vcGVuUGF0aChkc3QpO1xuXHR9XG5cbiAgICBzZWFyY2hGaWxlKG5hbWVPclBhdGg6IHN0cmluZyk6IFRBYnN0cmFjdEZpbGUgfCBudWxsIHtcbiAgICAgICAgY29uc3QgcmVzb2x2ZWRQYXRoID0gdGhpcy5yZXNvbHZlUGF0aChuYW1lT3JQYXRoKTtcbiAgICAgICAgY29uc3QgdmF1bHQ9IHRoaXMuYXBwLnZhdWx0O1xuICAgICAgICBjb25zdCBhdHRhY2htZW50Rm9sZGVyUGF0aCA9IHZhdWx0LmNvbmZpZy5hdHRhY2htZW50Rm9sZGVyUGF0aCB8fCAnJztcbiAgICAgICAgbGV0IGxvY2FsUGF0aCA9IHJlc29sdmVkUGF0aDtcbiAgICAgICAgbGV0IGZpbGUgPSBudWxsO1xuXG5cbiAgICAgICAgZmlsZSA9IHZhdWx0LmdldEZpbGVCeVBhdGgocmVzb2x2ZWRQYXRoKTtcbiAgICAgICAgaWYgKGZpbGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWxlOyBcbiAgICAgICAgfVxuXG4gICAgICAgIGZpbGUgPSB2YXVsdC5nZXRGaWxlQnlQYXRoKG5hbWVPclBhdGgpO1xuICAgICAgICBpZiAoZmlsZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZpbGU7IFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGF0dGFjaG1lbnRGb2xkZXJQYXRoICE9ICcnKSB7XG4gICAgICAgICAgICBsb2NhbFBhdGggPSBhdHRhY2htZW50Rm9sZGVyUGF0aCArICcvJyArIG5hbWVPclBhdGg7XG4gICAgICAgICAgICBmaWxlID0gdmF1bHQuZ2V0RmlsZUJ5UGF0aChsb2NhbFBhdGgpXG4gICAgICAgICAgICBpZiAoZmlsZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmaWxlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsb2NhbFBhdGggPSBhdHRhY2htZW50Rm9sZGVyUGF0aCArICcvJyArIHJlc29sdmVkUGF0aDtcbiAgICAgICAgICAgIGZpbGUgPSB2YXVsdC5nZXRGaWxlQnlQYXRoKGxvY2FsUGF0aClcbiAgICAgICAgICAgIGlmIChmaWxlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZpbGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBDbGF1ZGUgQ29kZSBVcGRhdGVcbiAgICAgICAgY29uc3QgZmlsZXMgPSB2YXVsdC5nZXRBbGxMb2FkZWRGaWxlcygpO1xuICAgICAgICBmb3IgKGxldCBmIG9mIGZpbGVzKSB7XG4gICAgICAgICAgICBpZiAoZiBpbnN0YW5jZW9mIFRGb2xkZXIpIGNvbnRpbnVlXG4gICAgICAgICAgICAvLyDkvb/nlKggaW5zdGFuY2VvZiDmo4Dmn6XogIzpnZ7nsbvlnovmlq3oqIBcbiAgICAgICAgICAgIGlmIChmIGluc3RhbmNlb2YgVEZpbGUpIHtcbiAgICAgICAgICAgICAgICBmaWxlID0gZjtcbiAgICAgICAgICAgICAgICBpZiAoZmlsZS5iYXNlbmFtZSA9PT0gbmFtZU9yUGF0aCB8fCBmaWxlLm5hbWUgPT09IG5hbWVPclBhdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGY7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gQ2xhdWRlIENvZGUgVXBkYXRlXG4gICAgZ2V0UmVzb3VyY2VQYXRoKHBhdGg6IHN0cmluZyk6IHtyZXNVcmw6c3RyaW5nLCBmaWxlUGF0aDpzdHJpbmd9fG51bGwge1xuICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5zZWFyY2hGaWxlKHBhdGgpO1xuICAgICAgICAvLyDkvb/nlKggaW5zdGFuY2VvZiDmo4Dmn6XogIzpnZ7nsbvlnovmlq3oqIBcbiAgICAgICAgaWYgKCFmaWxlIHx8ICEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcmVzVXJsID0gdGhpcy5hcHAudmF1bHQuZ2V0UmVzb3VyY2VQYXRoKGZpbGUpO1xuICAgICAgICByZXR1cm4ge3Jlc1VybCwgZmlsZVBhdGg6IGZpbGUucGF0aH07XG4gICAgfVxuXG4gICAgcmVzb2x2ZVBhdGgocmVsYXRpdmVQYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBjb25zdCBiYXNlUGF0aCA9IHRoaXMuZ2V0QWN0aXZlRmlsZURpcigpO1xuICAgICAgICBpZiAoIXJlbGF0aXZlUGF0aC5pbmNsdWRlcygnLycpKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVsYXRpdmVQYXRoO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN0YWNrID0gYmFzZVBhdGguc3BsaXQoXCIvXCIpO1xuICAgICAgICBjb25zdCBwYXJ0cyA9IHJlbGF0aXZlUGF0aC5zcGxpdChcIi9cIik7XG4gICAgICBcbiAgICAgICAgc3RhY2sucG9wKCk7IFxuICAgIFxuICAgICAgICBmb3IgKGNvbnN0IHBhcnQgb2YgcGFydHMpIHtcbiAgICAgICAgICAgIGlmIChwYXJ0ID09PSBcIi5cIikgY29udGludWU7XG4gICAgICAgICAgICBpZiAocGFydCA9PT0gXCIuLlwiKSBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgIGVsc2Ugc3RhY2sucHVzaChwYXJ0KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3RhY2suam9pbihcIi9cIik7XG4gICAgfVxuXG4gICAgZ2V0QWN0aXZlRmlsZURpcigpIHtcbiAgICAgICAgY29uc3QgYWYgPSB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0QWN0aXZlRmlsZSgpO1xuICAgICAgICBpZiAoYWYgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhcnRzID0gYWYucGF0aC5zcGxpdCgnLycpO1xuICAgICAgICBwYXJ0cy5wb3AoKTtcbiAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhcnRzLmpvaW4oJy8nKTtcbiAgICB9XG5cbiAgICAvLyBDbGF1ZGUgQ29kZSBVcGRhdGVcbiAgICBhc3luYyByZWFkRmlsZUJpbmFyeShwYXRoOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgdmF1bHQ9IHRoaXMuYXBwLnZhdWx0O1xuICAgICAgICBjb25zdCBmaWxlID0gdGhpcy5zZWFyY2hGaWxlKHBhdGgpO1xuICAgICAgICAvLyDkvb/nlKggaW5zdGFuY2VvZiDmo4Dmn6XogIzpnZ7nsbvlnovmlq3oqIBcbiAgICAgICAgaWYgKCFmaWxlIHx8ICEoZmlsZSBpbnN0YW5jZW9mIFRGaWxlKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGF3YWl0IHZhdWx0LnJlYWRCaW5hcnkoZmlsZSk7XG4gICAgfVxufSJdfQ==