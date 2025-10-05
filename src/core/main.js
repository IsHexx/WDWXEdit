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
import { Plugin, Notice, TFile, TFolder } from 'obsidian';
import { WxPreview, VIEW_TYPE_WX_PREVIEW } from '../wx-preview';
import { WxSettings } from './settings';
import { WxSettingTab } from '../ui/setting-tab';
import AssetsManager from './assets';
import { setVersion, uevent } from '../shared/utils';
import { initApiClients } from '../services/api';
export default class WxEditPlugin extends Plugin {
    constructor(app, manifest) {
        super(app, manifest);
        this.isInitialized = false; // 初始化状态标志
        AssetsManager.setup(app, manifest);
        this.assetsManager = AssetsManager.getInstance();
    }
    async loadResource() {
        await this.loadSettings();
        await this.assetsManager.loadAssets();
        // 标记初始化完成
        this.isInitialized = true;
    }
    // Claude Code Update
    async onload() {
        setVersion(this.manifest.version);
        uevent('load');
        //Update - 延迟初始化API客户端，避免阻塞启动
        setTimeout(async () => {
            try {
                initApiClients();
            }
            catch (error) {
                console.error('API客户端初始化失败:', error);
            }
        }, 1000);
        // Update - 将所有需要workspace ready的操作移到onLayoutReady回调中
        this.app.workspace.onLayoutReady(async () => {
            try {
                // 1. 先加载基础资源
                await this.loadResource();
                // 2. 注册视图（workspace ready后才能安全操作）
                this.registerView(VIEW_TYPE_WX_PREVIEW, (leaf) => new WxPreview(leaf, this));
                // 3. 添加功能区图标（回调中会访问workspace）
                const ribbonIconEl = this.addRibbonIcon('fish-symbol', '复制到公众号', (evt) => {
                    this.activateView();
                });
                ribbonIconEl.addClass('wxedit-plugin-ribbon-class');
                // 4. 添加命令（回调中会访问workspace）
                this.addCommand({
                    id: 'wxedit-preview',
                    name: '复制到公众号',
                    callback: () => {
                        this.activateView();
                    }
                });
                this.addCommand({
                    id: 'wxedit-pub',
                    name: '发布公众号文章',
                    callback: async () => {
                        var _a, _b;
                        await this.activateView();
                        (_b = (_a = this.getWxPreview()) === null || _a === void 0 ? void 0 : _a.getController()) === null || _b === void 0 ? void 0 : _b.postArticle();
                    }
                });
                // 5. 添加设置选项卡
                this.addSettingTab(new WxSettingTab(this.app, this));
                // 6. 监听右键菜单（workspace ready后才能安全监听）
                this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
                    menu.addItem((item) => {
                        item
                            .setTitle('发布到公众号')
                            .setIcon('fish-symbol')
                            .onClick(async () => {
                            var _a, _b, _c, _d, _e, _f;
                            if (file instanceof TFile) {
                                if (file.extension.toLowerCase() !== 'md') {
                                    new Notice('只能发布 Markdown 文件');
                                    return;
                                }
                                await this.activateView();
                                await ((_b = (_a = this.getWxPreview()) === null || _a === void 0 ? void 0 : _a.getController()) === null || _b === void 0 ? void 0 : _b.renderMarkdown(file));
                                await ((_d = (_c = this.getWxPreview()) === null || _c === void 0 ? void 0 : _c.getController()) === null || _d === void 0 ? void 0 : _d.postArticle());
                            }
                            else if (file instanceof TFolder) {
                                await this.activateView();
                                await ((_f = (_e = this.getWxPreview()) === null || _e === void 0 ? void 0 : _e.getController()) === null || _f === void 0 ? void 0 : _f.batchPost(file));
                            }
                        });
                    });
                }));
            }
            catch (error) {
                console.error('WxEdit 插件初始化失败:', error);
            }
        });
    }
    onunload() {
    }
    async loadSettings() {
        WxSettings.loadSettings(await this.loadData());
    }
    async saveSettings() {
        await this.saveData(WxSettings.allSettings());
        // 设置保存后刷新所有预览视图（仅在初始化完成后）
        if (this.isInitialized) {
            this.refreshAllPreviews();
        }
    }
    async activateView() {
        // 检查workspace是否已ready，避免启动时崩溃
        if (!this.app.workspace.layoutReady) {
            // 等待workspace ready后再尝试激活
            this.app.workspace.onLayoutReady(() => {
                setTimeout(() => this.activateView(), 100);
            });
            return;
        }
        const { workspace } = this.app;
        let leaf = null;
        const leaves = workspace.getLeavesOfType(VIEW_TYPE_WX_PREVIEW);
        if (leaves.length > 0) {
            leaf = leaves[0];
        }
        else {
            leaf = workspace.getRightLeaf(false);
            if (leaf) {
                await (leaf === null || leaf === void 0 ? void 0 : leaf.setViewState({ type: VIEW_TYPE_WX_PREVIEW, active: false }));
            }
            else {
                return;
            }
        }
        if (leaf)
            workspace.revealLeaf(leaf);
    }
    getWxPreview() {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_WX_PREVIEW);
        if (leaves.length > 0) {
            const leaf = leaves[0];
            return leaf.view;
        }
        return null;
    }
    // 刷新所有预览视图
    refreshAllPreviews() {
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_WX_PREVIEW);
        leaves.forEach(leaf => {
            const view = leaf.view;
            if (view && typeof view.forceRefresh === 'function') {
                view.forceRefresh();
            }
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7OztHQVlHO0FBRUgsT0FBTyxFQUFFLE1BQU0sRUFBNEMsTUFBTSxFQUFpQixLQUFLLEVBQUUsT0FBTyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQ25ILE9BQU8sRUFBRSxTQUFTLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDaEUsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUN4QyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDakQsT0FBTyxhQUFhLE1BQU0sVUFBVSxDQUFDO0FBQ3JDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDckQsT0FBTyxFQUFFLGNBQWMsRUFBa0IsTUFBTSxpQkFBaUIsQ0FBQztBQUdqRSxNQUFNLENBQUMsT0FBTyxPQUFPLFlBQWEsU0FBUSxNQUFNO0lBSS9DLFlBQVksR0FBUSxFQUFFLFFBQXdCO1FBQzFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFGakIsa0JBQWEsR0FBWSxLQUFLLENBQUMsQ0FBQyxVQUFVO1FBR2hELGFBQWEsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ2pDLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQ3JELENBQUM7SUFFRCxLQUFLLENBQUMsWUFBWTtRQUNqQixNQUFNLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUMxQixNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDdEMsVUFBVTtRQUNWLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO0lBQzNCLENBQUM7SUFFRCxxQkFBcUI7SUFDckIsS0FBSyxDQUFDLE1BQU07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U0FBUyxDQUFDLGVBQWUsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQ3hFLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDckIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQWlCLENBQUM7WUFDcEMsSUFBSSxJQUFJLElBQUksT0FBTyxJQUFJLENBQUMsWUFBWSxLQUFLLFVBQVUsRUFBRTtnQkFDcEQsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO2FBQ3BCO1FBQ0YsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0NBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IChjKSAyMDI0LTIwMjUgSXNIZXh4XG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc29mdHdhcmUgaXMgcHJvcHJpZXRhcnkgYW5kIGNvbmZpZGVudGlhbC4gTm8gcGFydCBvZiB0aGlzIHNvZnR3YXJlXG4gKiBtYXkgYmUgcmVwcm9kdWNlZCwgZGlzdHJpYnV0ZWQsIG9yIHRyYW5zbWl0dGVkIGluIGFueSBmb3JtIG9yIGJ5IGFueSBtZWFucyxcbiAqIGluY2x1ZGluZyBwaG90b2NvcHlpbmcsIHJlY29yZGluZywgb3Igb3RoZXIgZWxlY3Ryb25pYyBvciBtZWNoYW5pY2FsIG1ldGhvZHMsXG4gKiB3aXRob3V0IHRoZSBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24gb2YgdGhlIGF1dGhvciwgZXhjZXB0IGluIHRoZSBjYXNlIG9mXG4gKiBicmllZiBxdW90YXRpb25zIGVtYm9kaWVkIGluIGNyaXRpY2FsIHJldmlld3MgYW5kIGNlcnRhaW4gb3RoZXIgbm9uY29tbWVyY2lhbFxuICogdXNlcyBwZXJtaXR0ZWQgYnkgY29weXJpZ2h0IGxhdy5cbiAqXG4gKiBGb3IgcGVybWlzc2lvbiByZXF1ZXN0cywgY29udGFjdDogSXNIZXh4XG4gKi9cblxuaW1wb3J0IHsgUGx1Z2luLCBXb3Jrc3BhY2VMZWFmLCBBcHAsIFBsdWdpbk1hbmlmZXN0LCBNZW51LCBOb3RpY2UsIFRBYnN0cmFjdEZpbGUsIFRGaWxlLCBURm9sZGVyIH0gZnJvbSAnb2JzaWRpYW4nO1xuaW1wb3J0IHsgV3hQcmV2aWV3LCBWSUVXX1RZUEVfV1hfUFJFVklFVyB9IGZyb20gJy4uL3d4LXByZXZpZXcnO1xuaW1wb3J0IHsgV3hTZXR0aW5ncyB9IGZyb20gJy4vc2V0dGluZ3MnO1xuaW1wb3J0IHsgV3hTZXR0aW5nVGFiIH0gZnJvbSAnLi4vdWkvc2V0dGluZy10YWInO1xuaW1wb3J0IEFzc2V0c01hbmFnZXIgZnJvbSAnLi9hc3NldHMnO1xuaW1wb3J0IHsgc2V0VmVyc2lvbiwgdWV2ZW50IH0gZnJvbSAnLi4vc2hhcmVkL3V0aWxzJztcbmltcG9ydCB7IGluaXRBcGlDbGllbnRzLCBXZWNoYXRBcGlVdGlscyB9IGZyb20gJy4uL3NlcnZpY2VzL2FwaSc7XG5cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV3hFZGl0UGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcblx0c2V0dGluZ3M6IFd4U2V0dGluZ3M7XG5cdGFzc2V0c01hbmFnZXI6IEFzc2V0c01hbmFnZXI7XG5cdHByaXZhdGUgaXNJbml0aWFsaXplZDogYm9vbGVhbiA9IGZhbHNlOyAvLyDliJ3lp4vljJbnirbmgIHmoIflv5dcblx0Y29uc3RydWN0b3IoYXBwOiBBcHAsIG1hbmlmZXN0OiBQbHVnaW5NYW5pZmVzdCkge1xuXHQgICAgc3VwZXIoYXBwLCBtYW5pZmVzdCk7XG5cdFx0XHRBc3NldHNNYW5hZ2VyLnNldHVwKGFwcCwgbWFuaWZlc3QpO1xuXHQgICAgdGhpcy5hc3NldHNNYW5hZ2VyID0gQXNzZXRzTWFuYWdlci5nZXRJbnN0YW5jZSgpO1xuXHR9XG5cblx0YXN5bmMgbG9hZFJlc291cmNlKCkge1xuXHRcdGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG5cdFx0YXdhaXQgdGhpcy5hc3NldHNNYW5hZ2VyLmxvYWRBc3NldHMoKTtcblx0XHQvLyDmoIforrDliJ3lp4vljJblrozmiJBcblx0XHR0aGlzLmlzSW5pdGlhbGl6ZWQgPSB0cnVlO1xuXHR9XG5cblx0Ly8gQ2xhdWRlIENvZGUgVXBkYXRlXG5cdGFzeW5jIG9ubG9hZCgpIHtcblx0XHRzZXRWZXJzaW9uKHRoaXMubWFuaWZlc3QudmVyc2lvbik7XG5cdFx0dWV2ZW50KCdsb2FkJyk7XG5cblx0XHQvL1VwZGF0ZSAtIOW7tui/n+WIneWni+WMlkFQSeWuouaIt+err++8jOmBv+WFjemYu+WhnuWQr+WKqFxuXHRcdHNldFRpbWVvdXQoYXN5bmMgKCkgPT4ge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0aW5pdEFwaUNsaWVudHMoKTtcblx0XHRcdH0gY2F0Y2ggKGVycm9yKSB7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoJ0FQSeWuouaIt+err+WIneWni+WMluWksei0pTonLCBlcnJvcik7XG5cdFx0XHR9XG5cdFx0fSwgMTAwMCk7XG5cblx0XHQvLyBVcGRhdGUgLSDlsIbmiYDmnInpnIDopoF3b3Jrc3BhY2UgcmVhZHnnmoTmk43kvZznp7vliLBvbkxheW91dFJlYWR55Zue6LCD5LitXG5cdFx0dGhpcy5hcHAud29ya3NwYWNlLm9uTGF5b3V0UmVhZHkoYXN5bmMgKCk9Pntcblx0XHRcdHRyeSB7XG5cblx0XHRcdFx0Ly8gMS4g5YWI5Yqg6L295Z+656GA6LWE5rqQXG5cdFx0XHRcdGF3YWl0IHRoaXMubG9hZFJlc291cmNlKCk7XG5cblx0XHRcdFx0Ly8gMi4g5rOo5YaM6KeG5Zu+77yId29ya3NwYWNlIHJlYWR55ZCO5omN6IO95a6J5YWo5pON5L2c77yJXG5cdFx0XHRcdHRoaXMucmVnaXN0ZXJWaWV3KFxuXHRcdFx0XHRcdFZJRVdfVFlQRV9XWF9QUkVWSUVXLFxuXHRcdFx0XHRcdChsZWFmKSA9PiBuZXcgV3hQcmV2aWV3KGxlYWYsIHRoaXMpXG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0Ly8gMy4g5re75Yqg5Yqf6IO95Yy65Zu+5qCH77yI5Zue6LCD5Lit5Lya6K6/6Zeud29ya3NwYWNl77yJXG5cdFx0XHRcdGNvbnN0IHJpYmJvbkljb25FbCA9IHRoaXMuYWRkUmliYm9uSWNvbignZmlzaC1zeW1ib2wnLCAn5aSN5Yi25Yiw5YWs5LyX5Y+3JywgKGV2dDogTW91c2VFdmVudCkgPT4ge1xuXHRcdFx0XHRcdHRoaXMuYWN0aXZhdGVWaWV3KCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRyaWJib25JY29uRWwuYWRkQ2xhc3MoJ3d4ZWRpdC1wbHVnaW4tcmliYm9uLWNsYXNzJyk7XG5cblx0XHRcdFx0Ly8gNC4g5re75Yqg5ZG95Luk77yI5Zue6LCD5Lit5Lya6K6/6Zeud29ya3NwYWNl77yJXG5cdFx0XHRcdHRoaXMuYWRkQ29tbWFuZCh7XG5cdFx0XHRcdFx0aWQ6ICd3eGVkaXQtcHJldmlldycsXG5cdFx0XHRcdFx0bmFtZTogJ+WkjeWItuWIsOWFrOS8l+WPtycsXG5cdFx0XHRcdFx0Y2FsbGJhY2s6ICgpID0+IHtcblx0XHRcdFx0XHRcdHRoaXMuYWN0aXZhdGVWaWV3KCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHR0aGlzLmFkZENvbW1hbmQoe1xuXHRcdFx0XHRcdGlkOiAnd3hlZGl0LXB1YicsXG5cdFx0XHRcdFx0bmFtZTogJ+WPkeW4g+WFrOS8l+WPt+aWh+eroCcsXG5cdFx0XHRcdFx0Y2FsbGJhY2s6IGFzeW5jICgpID0+IHtcblx0XHRcdFx0XHRcdGF3YWl0IHRoaXMuYWN0aXZhdGVWaWV3KCk7XG5cdFx0XHRcdFx0XHR0aGlzLmdldFd4UHJldmlldygpPy5nZXRDb250cm9sbGVyKCk/LnBvc3RBcnRpY2xlKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHQvLyA1LiDmt7vliqDorr7nva7pgInpobnljaFcblx0XHRcdFx0dGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBXeFNldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuXHRcdFx0XHQvLyA2LiDnm5HlkKzlj7PplK7oj5zljZXvvIh3b3Jrc3BhY2UgcmVhZHnlkI7miY3og73lronlhajnm5HlkKzvvIlcblx0XHRcdFx0dGhpcy5yZWdpc3RlckV2ZW50KFxuXHRcdFx0XHRcdHRoaXMuYXBwLndvcmtzcGFjZS5vbignZmlsZS1tZW51JywgKG1lbnUsIGZpbGUpID0+IHtcblx0XHRcdFx0XHRcdG1lbnUuYWRkSXRlbSgoaXRlbSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRpdGVtXG5cdFx0XHRcdFx0XHRcdFx0LnNldFRpdGxlKCflj5HluIPliLDlhazkvJflj7cnKVxuXHRcdFx0XHRcdFx0XHRcdC5zZXRJY29uKCdmaXNoLXN5bWJvbCcpXG5cdFx0XHRcdFx0XHRcdFx0Lm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKGZpbGUgaW5zdGFuY2VvZiBURmlsZSkge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoZmlsZS5leHRlbnNpb24udG9Mb3dlckNhc2UoKSAhPT0gJ21kJykge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdG5ldyBOb3RpY2UoJ+WPquiDveWPkeW4gyBNYXJrZG93biDmlofku7YnKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5hY3RpdmF0ZVZpZXcoKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5nZXRXeFByZXZpZXcoKT8uZ2V0Q29udHJvbGxlcigpPy5yZW5kZXJNYXJrZG93bihmaWxlKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgdGhpcy5nZXRXeFByZXZpZXcoKT8uZ2V0Q29udHJvbGxlcigpPy5wb3N0QXJ0aWNsZSgpO1xuXHRcdFx0XHRcdFx0XHRcdFx0fSBlbHNlIGlmIChmaWxlIGluc3RhbmNlb2YgVEZvbGRlcikge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCB0aGlzLmFjdGl2YXRlVmlldygpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCB0aGlzLmdldFd4UHJldmlldygpPy5nZXRDb250cm9sbGVyKCk/LmJhdGNoUG9zdChmaWxlKTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdCk7XG5cdFx0XHR9IGNhdGNoIChlcnJvcikge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKCdXeEVkaXQg5o+S5Lu25Yid5aeL5YyW5aSx6LSlOicsIGVycm9yKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxuXG5cdG9udW5sb2FkKCkge1xuXG5cdH1cblxuXHRhc3luYyBsb2FkU2V0dGluZ3MoKSB7XG5cdFx0V3hTZXR0aW5ncy5sb2FkU2V0dGluZ3MoYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcblx0fVxuXG5cdGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcblx0XHRhd2FpdCB0aGlzLnNhdmVEYXRhKFd4U2V0dGluZ3MuYWxsU2V0dGluZ3MoKSk7XG5cdFx0Ly8g6K6+572u5L+d5a2Y5ZCO5Yi35paw5omA5pyJ6aKE6KeI6KeG5Zu+77yI5LuF5Zyo5Yid5aeL5YyW5a6M5oiQ5ZCO77yJXG5cdFx0aWYgKHRoaXMuaXNJbml0aWFsaXplZCkge1xuXHRcdFx0dGhpcy5yZWZyZXNoQWxsUHJldmlld3MoKTtcblx0XHR9XG5cdH1cblxuXHRhc3luYyBhY3RpdmF0ZVZpZXcoKSB7XG5cdFx0Ly8g5qOA5p+ld29ya3NwYWNl5piv5ZCm5beycmVhZHnvvIzpgb/lhY3lkK/liqjml7bltKnmuoNcblx0XHRpZiAoIXRoaXMuYXBwLndvcmtzcGFjZS5sYXlvdXRSZWFkeSkge1xuXHRcdFx0Ly8g562J5b6Fd29ya3NwYWNlIHJlYWR55ZCO5YaN5bCd6K+V5r+A5rS7XG5cdFx0XHR0aGlzLmFwcC53b3Jrc3BhY2Uub25MYXlvdXRSZWFkeSgoKSA9PiB7XG5cdFx0XHRcdHNldFRpbWVvdXQoKCkgPT4gdGhpcy5hY3RpdmF0ZVZpZXcoKSwgMTAwKTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRcblx0XHRjb25zdCB7IHdvcmtzcGFjZSB9ID0gdGhpcy5hcHA7XG5cdFxuXHRcdGxldCBsZWFmOiBXb3Jrc3BhY2VMZWFmIHwgbnVsbCA9IG51bGw7XG5cdFx0Y29uc3QgbGVhdmVzID0gd29ya3NwYWNlLmdldExlYXZlc09mVHlwZShWSUVXX1RZUEVfV1hfUFJFVklFVyk7XG5cdFxuXHRcdGlmIChsZWF2ZXMubGVuZ3RoID4gMCkge1xuXHRcdFx0bGVhZiA9IGxlYXZlc1swXTtcblx0XHR9IGVsc2Uge1xuXHRcdCAgXHRsZWFmID0gd29ya3NwYWNlLmdldFJpZ2h0TGVhZihmYWxzZSk7XG5cdFx0ICBcdGlmIChsZWFmKSB7XG5cdFx0XHQgIFx0YXdhaXQgbGVhZj8uc2V0Vmlld1N0YXRlKHsgdHlwZTogVklFV19UWVBFX1dYX1BSRVZJRVcsIGFjdGl2ZTogZmFsc2UgfSk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0fVxuXHRcblx0XHRpZiAobGVhZikgd29ya3NwYWNlLnJldmVhbExlYWYobGVhZik7XG5cdH1cblxuXHRnZXRXeFByZXZpZXcoKTogV3hQcmV2aWV3IHwgbnVsbCB7XG5cdFx0Y29uc3QgbGVhdmVzID0gdGhpcy5hcHAud29ya3NwYWNlLmdldExlYXZlc09mVHlwZShWSUVXX1RZUEVfV1hfUFJFVklFVyk7XG5cdFx0aWYgKGxlYXZlcy5sZW5ndGggPiAwKSB7XG5cdFx0XHRjb25zdCBsZWFmID0gbGVhdmVzWzBdO1xuXHRcdFx0cmV0dXJuIGxlYWYudmlldyBhcyBXeFByZXZpZXc7XG5cdFx0fVxuXHRcdHJldHVybiBudWxsO1xuXHR9XG5cblx0Ly8g5Yi35paw5omA5pyJ6aKE6KeI6KeG5Zu+XG5cdHByaXZhdGUgcmVmcmVzaEFsbFByZXZpZXdzKCk6IHZvaWQge1xuXHRcdGNvbnN0IGxlYXZlcyA9IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWF2ZXNPZlR5cGUoVklFV19UWVBFX1dYX1BSRVZJRVcpO1xuXHRcdGxlYXZlcy5mb3JFYWNoKGxlYWYgPT4ge1xuXHRcdFx0Y29uc3QgdmlldyA9IGxlYWYudmlldyBhcyBXeFByZXZpZXc7XG5cdFx0XHRpZiAodmlldyAmJiB0eXBlb2Ygdmlldy5mb3JjZVJlZnJlc2ggPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdFx0dmlldy5mb3JjZVJlZnJlc2goKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fVxufVxuIl19