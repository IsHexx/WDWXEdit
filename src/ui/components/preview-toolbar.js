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
// 工具栏组件，负责界面交互操作
import { Platform } from 'obsidian';
import { uevent } from '../../shared/utils';
/**
 * 工具栏组件 - 负责工具栏UI和用户交互
 */
export class PreviewToolbar {
    constructor(parent, settings, styleEditor, handlers) {
        this.parent = parent;
        this.settings = settings;
        this.styleEditor = styleEditor;
        this.handlers = handlers;
    }
    async build() {
        this.toolbar = this.parent.createDiv({ cls: 'preview-toolbar' });
        // 构建主要工具栏
        if (this.settings.wxInfo.length > 1 || Platform.isDesktop) {
            await this.buildMainToolbar();
        }
        else if (this.settings.wxInfo.length > 0) {
            // 设置默认公众号
            this.handlers.onAppIdChanged(this.settings.wxInfo[0].appid);
        }
        // 构建样式编辑器
        if (this.settings.showStyleUI) {
            await this.buildStyleEditor();
        }
    }
    async buildMainToolbar() {
        const lineDiv = this.toolbar.createDiv({ cls: 'toolbar-line' });
        const horizontalContainer = lineDiv.createDiv({ cls: 'toolbar-horizontal-container' });
        // 左侧区域
        const leftSection = horizontalContainer.createDiv({ cls: 'toolbar-left-section' });
        this.buildWechatSelector(leftSection);
        this.buildCoverSelector(leftSection);
        // 右侧区域
        const rightSection = horizontalContainer.createDiv({ cls: 'toolbar-right-section' });
        this.buildActionButtons(rightSection);
    }
    buildWechatSelector(parent) {
        const wechatContainer = parent.createDiv({ cls: 'wechat-selector' });
        const labelDiv = wechatContainer.createDiv({ cls: 'wechat-label' });
        labelDiv.innerText = '公众号:';
        const wxSelect = wechatContainer.createEl('select', { cls: 'wechat-select' });
        wxSelect.onchange = () => {
            this.handlers.onAppIdChanged(wxSelect.value);
        };
        // 默认选项
        const defaultOp = wxSelect.createEl('option');
        defaultOp.value = '';
        defaultOp.text = '请在设置里配置公众号';
        // 公众号选项
        for (let i = 0; i < this.settings.wxInfo.length; i++) {
            const op = wxSelect.createEl('option');
            const wx = this.settings.wxInfo[i];
            op.value = wx.appid;
            op.text = wx.name;
            if (i === 0) {
                op.selected = true;
                this.handlers.onAppIdChanged(wx.appid);
            }
        }
        this.wechatSelect = wxSelect;
    }
    buildCoverSelector(parent) {
        const coverContainer = parent.createDiv({ cls: 'cover-selector' });
        const coverLabel = coverContainer.createDiv({ cls: 'cover-label' });
        coverLabel.innerText = '封面:';
        const radioGroup = coverContainer.createDiv({ cls: 'cover-radio-group' });
        // 默认封面选项
        const defaultWrapper = radioGroup.createDiv({ cls: 'radio-wrapper' });
        this.useDefaultCover = defaultWrapper.createEl('input', { cls: 'cover-radio' });
        this.useDefaultCover.setAttr('type', 'radio');
        this.useDefaultCover.setAttr('name', 'cover');
        this.useDefaultCover.setAttr('value', 'default');
        this.useDefaultCover.setAttr('checked', 'true');
        this.useDefaultCover.id = 'default-cover-h';
        this.useDefaultCover.onchange = () => {
            this.toggleCoverUpload(this.useDefaultCover.checked);
        };
        const defaultLabel = defaultWrapper.createEl('label', { cls: 'radio-label' });
        defaultLabel.setAttr('for', 'default-cover-h');
        defaultLabel.innerText = '默认';
        // 上传封面选项
        const uploadWrapper = radioGroup.createDiv({ cls: 'radio-wrapper' });
        this.useLocalCover = uploadWrapper.createEl('input', { cls: 'cover-radio' });
        this.useLocalCover.setAttr('type', 'radio');
        this.useLocalCover.setAttr('name', 'cover');
        this.useLocalCover.setAttr('value', 'local');
        this.useLocalCover.id = 'local-cover-h';
        this.useLocalCover.onchange = () => {
            this.toggleCoverUpload(this.useLocalCover.checked);
        };
        const uploadLabel = uploadWrapper.createEl('label', { cls: 'radio-label' });
        uploadLabel.setAttr('for', 'local-cover-h');
        uploadLabel.innerText = '上传';
        // Claude Code Update: 使用CSS类而非内联样式
        // 文件上传控件
        const fileUploadContainer = radioGroup.createDiv({ cls: 'file-upload-container hidden' });
        const uploadButton = fileUploadContainer.createEl('button', { cls: 'file-upload-btn' });
        uploadButton.type = 'button';
        uploadButton.innerText = '选择文件';
        this.coverEl = fileUploadContainer.createEl('input', { cls: 'file-input-hidden hidden' });
        this.coverEl.setAttr('type', 'file');
        this.coverEl.setAttr('accept', '.png, .jpg, .jpeg');
        this.coverEl.setAttr('name', 'cover');
        this.coverEl.id = 'cover-input';
        uploadButton.onclick = () => {
            this.coverEl.click();
        };
        this.coverEl.onchange = () => {
            if (this.coverEl.files && this.coverEl.files.length > 0) {
                uploadButton.innerText = this.coverEl.files[0].name;
            }
            else {
                uploadButton.innerText = '选择文件';
            }
        };
    }
    // Claude Code Update: 使用sanitizeHTMLToDom替代innerHTML设置SVG内容
    buildActionButtons(parent) {
        const buttonContainer = parent.createDiv({ cls: 'action-buttons' });
        // 刷新按钮
        const refreshBtn = buttonContainer.createEl('button', { cls: 'action-button' });
        const refreshSvg = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
            </svg>
        `;
        refreshBtn.appendChild(document.createRange().createContextualFragment(refreshSvg));
        refreshBtn.setAttr('title', '刷新');
        refreshBtn.onclick = async () => {
            await this.handlers.onRefresh();
            uevent('refresh');
        };
        if (Platform.isDesktop) {
            // Claude Code Update: 使用DOM API替代innerHTML设置SVG内容
            // 复制按钮
            const copyBtn = buttonContainer.createEl('button', { cls: 'action-button' });
            const copySvg = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
            `;
            copyBtn.appendChild(document.createRange().createContextualFragment(copySvg));
            copyBtn.setAttr('title', '复制');
            copyBtn.onclick = async () => {
                try {
                    await this.handlers.onCopy();
                    uevent('copy');
                }
                catch (error) {
                    console.error(error);
                }
            };
        }
        // Claude Code Update: 使用DOM API替代innerHTML设置SVG内容
        // 发草稿按钮
        const postBtn = buttonContainer.createEl('button', { cls: 'action-button' });
        const postSvg = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/>
                <path d="M21.854 2.147 10.61 13.39"/>
            </svg>
        `;
        postBtn.appendChild(document.createRange().createContextualFragment(postSvg));
        postBtn.setAttr('title', '发草稿');
        postBtn.onclick = async () => {
            await this.handlers.onPost();
            uevent('pub');
        };
        // Claude Code Update: 使用DOM API替代innerHTML设置SVG内容
        // 上传图片按钮
        const uploadBtn = buttonContainer.createEl('button', { cls: 'action-button upload-btn' });
        const uploadSvg = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,5 17,10"/>
                <line x1="12" y1="5" x2="12" y2="15"/>
            </svg>
        `;
        uploadBtn.appendChild(document.createRange().createContextualFragment(uploadSvg));
        uploadBtn.setAttr('title', '上传图片');
        uploadBtn.onclick = async () => {
            await this.handlers.onUpload();
            uevent('upload');
        };
    }
    async buildStyleEditor() {
        var _a, _b;
        const styleEditorContainer = this.toolbar.appendChild(this.styleEditor.render());
        // 获取StyleEditor内部的select元素
        const contentDiv = styleEditorContainer.querySelector('.style-editor-content');
        const dropdownGroups = contentDiv === null || contentDiv === void 0 ? void 0 : contentDiv.querySelectorAll('.style-dropdown-group');
        const themeSelect = (_a = dropdownGroups === null || dropdownGroups === void 0 ? void 0 : dropdownGroups[0]) === null || _a === void 0 ? void 0 : _a.querySelector('select');
        const highlightSelect = (_b = dropdownGroups === null || dropdownGroups === void 0 ? void 0 : dropdownGroups[1]) === null || _b === void 0 ? void 0 : _b.querySelector('select');
        if (themeSelect) {
            this.themeSelect = themeSelect;
        }
        if (highlightSelect) {
            this.highlightSelect = highlightSelect;
        }
    }
    // Claude Code Update: 使用CSS类而非内联样式
    toggleCoverUpload(showUpload) {
        const fileUploadContainer = this.toolbar.querySelector('.file-upload-container');
        if (fileUploadContainer) {
            if (showUpload) {
                fileUploadContainer.removeClass('hidden');
            }
            else {
                fileUploadContainer.addClass('hidden');
            }
        }
    }
    // 根据元数据更新工具栏状态
    updateFromMetadata(metadata, currentTheme, currentHighlight) {
        if (metadata.appid && this.wechatSelect) {
            this.wechatSelect.value = metadata.appid;
        }
        if (metadata.theme && this.themeSelect) {
            // 查找对应的主题
            const options = Array.from(this.themeSelect.options);
            const themeOption = options.find(option => option.text === metadata.theme);
            if (themeOption) {
                this.themeSelect.value = themeOption.value;
            }
        }
        else if (this.themeSelect) {
            this.themeSelect.value = currentTheme;
        }
        if (metadata.highlight && this.highlightSelect) {
            this.highlightSelect.value = metadata.highlight;
        }
        else if (this.highlightSelect) {
            this.highlightSelect.value = currentHighlight;
        }
    }
    // 获取封面文件
    getCoverFile() {
        if (this.useLocalCover && this.useLocalCover.checked && this.coverEl.files && this.coverEl.files.length > 0) {
            return this.coverEl.files[0];
        }
        return null;
    }
    // 是否使用默认封面
    isUsingDefaultCover() {
        return this.useDefaultCover && this.useDefaultCover.checked;
    }
    // 是否使用本地封面
    isUsingLocalCover() {
        return this.useLocalCover && this.useLocalCover.checked;
    }
    // 获取工具栏元素
    getElement() {
        return this.toolbar;
    }
    // 获取微信选择器
    getWechatSelect() {
        return this.wechatSelect;
    }
    // 获取主题选择器
    getThemeSelect() {
        return this.themeSelect;
    }
    // 获取高亮选择器
    getHighlightSelect() {
        return this.highlightSelect;
    }
    // 刷新工具栏方法，重新构建UI以反映设置变更
    refresh() {
        // 找到并移除现有的工具栏元素
        const existingToolbar = this.parent.querySelector('.preview-toolbar');
        let insertPosition = null;
        if (existingToolbar) {
            // 记住工具栏的位置（它的下一个兄弟元素）
            insertPosition = existingToolbar.nextElementSibling;
            existingToolbar.remove();
        }
        // 重新构建工具栏
        this.toolbar = this.parent.createDiv({ cls: 'preview-toolbar' });
        // 重新构建主要工具栏
        if (this.settings.wxInfo.length > 1 || Platform.isDesktop) {
            this.buildMainToolbar();
        }
        else if (this.settings.wxInfo.length > 0) {
            // 设置默认公众号
            this.handlers.onAppIdChanged(this.settings.wxInfo[0].appid);
        }
        // 重新构建样式编辑器
        if (this.settings.showStyleUI) {
            this.buildStyleEditor();
        }
        // 确保工具栏始终在容器的第一个位置
        if (this.parent.firstChild && this.parent.firstChild !== this.toolbar) {
            this.parent.insertBefore(this.toolbar, this.parent.firstChild);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJldmlldy10b29sYmFyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJldmlldy10b29sYmFyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7R0FZRztBQUVILGlCQUFpQjtBQUNqQixPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBSXBDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQVU1Qzs7R0FFRztBQUNILE1BQU0sT0FBTyxjQUFjO0lBY3ZCLFlBQ0ksTUFBc0IsRUFDdEIsUUFBb0IsRUFDcEIsV0FBd0IsRUFDeEIsUUFBeUI7UUFFekIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFDekIsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDL0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7SUFDN0IsQ0FBQztJQUVELEtBQUssQ0FBQyxLQUFLO1FBQ1AsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxpQkFBaUIsRUFBRSxDQUFDLENBQUM7UUFFakUsVUFBVTtRQUNWLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxRQUFRLENBQUMsU0FBUyxFQUFFO1lBQ3ZELE1BQU0sSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7U0FDakM7YUFBTSxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDeEMsVUFBVTtZQUNWLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQy9EO1FBRUQsVUFBVTtR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SSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxRQUFRLENBQUMsU0FBUyxFQUFFO1lBQ3ZELElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1NBQzNCO2FBQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ3hDLFVBQVU7WUFDVixJQUFJLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUMvRDtRQUVELFlBQVk7UUFDWixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFO1lBQzNCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1NBQzNCO1FBRUQsbUJBQW1CO1FBQ25CLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEtBQUssSUFBSSxDQUFDLE9BQU8sRUFBRTtZQUNuRSxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7U0FDbEU7SUFDTCxDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IChjKSAyMDI0LTIwMjUgSXNIZXh4XG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc29mdHdhcmUgaXMgcHJvcHJpZXRhcnkgYW5kIGNvbmZpZGVudGlhbC4gTm8gcGFydCBvZiB0aGlzIHNvZnR3YXJlXG4gKiBtYXkgYmUgcmVwcm9kdWNlZCwgZGlzdHJpYnV0ZWQsIG9yIHRyYW5zbWl0dGVkIGluIGFueSBmb3JtIG9yIGJ5IGFueSBtZWFucyxcbiAqIGluY2x1ZGluZyBwaG90b2NvcHlpbmcsIHJlY29yZGluZywgb3Igb3RoZXIgZWxlY3Ryb25pYyBvciBtZWNoYW5pY2FsIG1ldGhvZHMsXG4gKiB3aXRob3V0IHRoZSBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24gb2YgdGhlIGF1dGhvciwgZXhjZXB0IGluIHRoZSBjYXNlIG9mXG4gKiBicmllZiBxdW90YXRpb25zIGVtYm9kaWVkIGluIGNyaXRpY2FsIHJldmlld3MgYW5kIGNlcnRhaW4gb3RoZXIgbm9uY29tbWVyY2lhbFxuICogdXNlcyBwZXJtaXR0ZWQgYnkgY29weXJpZ2h0IGxhdy5cbiAqXG4gKiBGb3IgcGVybWlzc2lvbiByZXF1ZXN0cywgY29udGFjdDogSXNIZXh4XG4gKi9cblxuLy8g5bel5YW35qCP57uE5Lu277yM6LSf6LSj55WM6Z2i5Lqk5LqS5pON5L2cXG5pbXBvcnQgeyBQbGF0Zm9ybSB9IGZyb20gJ29ic2lkaWFuJztcbi8vIOabtOaWsGltcG9ydOi3r+W+hFxuaW1wb3J0IHsgV3hTZXR0aW5ncyB9IGZyb20gJy4uLy4uL2NvcmUvc2V0dGluZ3MnO1xuaW1wb3J0IHsgU3R5bGVFZGl0b3IgfSBmcm9tICcuL3N0eWxlLWVkaXRvcic7XG5pbXBvcnQgeyB1ZXZlbnQgfSBmcm9tICcuLi8uLi9zaGFyZWQvdXRpbHMnO1xuXG5pbnRlcmZhY2UgVG9vbGJhckhhbmRsZXJzIHtcbiAgICBvbkFwcElkQ2hhbmdlZDogKGFwcElkOiBzdHJpbmcpID0+IHZvaWQ7XG4gICAgb25SZWZyZXNoOiAoKSA9PiBQcm9taXNlPHZvaWQ+O1xuICAgIG9uQ29weTogKCkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgICBvblBvc3Q6ICgpID0+IFByb21pc2U8dm9pZD47XG4gICAgb25VcGxvYWQ6ICgpID0+IFByb21pc2U8dm9pZD47XG59XG5cbi8qKlxuICog5bel5YW35qCP57uE5Lu2IC0g6LSf6LSj5bel5YW35qCPVUnlkoznlKjmiLfkuqTkupJcbiAqL1xuZXhwb3J0IGNsYXNzIFByZXZpZXdUb29sYmFyIHtcbiAgICBwcml2YXRlIHBhcmVudDogSFRNTERpdkVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBzZXR0aW5nczogV3hTZXR0aW5ncztcbiAgICBwcml2YXRlIHN0eWxlRWRpdG9yOiBTdHlsZUVkaXRvcjtcbiAgICBwcml2YXRlIGhhbmRsZXJzOiBUb29sYmFySGFuZGxlcnM7XG4gICAgXG4gICAgcHJpdmF0ZSB0b29sYmFyOiBIVE1MRGl2RWxlbWVudDtcbiAgICBwcml2YXRlIHdlY2hhdFNlbGVjdDogSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgcHJpdmF0ZSB0aGVtZVNlbGVjdDogSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgcHJpdmF0ZSBoaWdobGlnaHRTZWxlY3Q6IEhUTUxTZWxlY3RFbGVtZW50O1xuICAgIHByaXZhdGUgY292ZXJFbDogSFRNTElucHV0RWxlbWVudDtcbiAgICBwcml2YXRlIHVzZURlZmF1bHRDb3ZlcjogSFRNTElucHV0RWxlbWVudDtcbiAgICBwcml2YXRlIHVzZUxvY2FsQ292ZXI6IEhUTUxJbnB1dEVsZW1lbnQ7XG5cbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcGFyZW50OiBIVE1MRGl2RWxlbWVudCwgXG4gICAgICAgIHNldHRpbmdzOiBXeFNldHRpbmdzLCBcbiAgICAgICAgc3R5bGVFZGl0b3I6IFN0eWxlRWRpdG9yLFxuICAgICAgICBoYW5kbGVyczogVG9vbGJhckhhbmRsZXJzXG4gICAgKSB7XG4gICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50O1xuICAgICAgICB0aGlzLnNldHRpbmdzID0gc2V0dGluZ3M7XG4gICAgICAgIHRoaXMuc3R5bGVFZGl0b3IgPSBzdHlsZUVkaXRvcjtcbiAgICAgICAgdGhpcy5oYW5kbGVycyA9IGhhbmRsZXJzO1xuICAgIH1cblxuICAgIGFzeW5jIGJ1aWxkKCkge1xuICAgICAgICB0aGlzLnRvb2xiYXIgPSB0aGlzLnBhcmVudC5jcmVhdGVEaXYoeyBjbHM6ICdwcmV2aWV3LXRvb2xiYXInIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8g5p6E5bu65Li76KaB5bel5YW35qCPXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnd4SW5mby5sZW5ndGggPiAxIHx8IFBsYXRmb3JtLmlzRGVza3RvcCkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5idWlsZE1haW5Ub29sYmFyKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5zZXR0aW5ncy53eEluZm8ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgLy8g6K6+572u6buY6K6k5YWs5LyX5Y+3XG4gICAgICAgICAgICB0aGlzLmhhbmRsZXJzLm9uQXBwSWRDaGFuZ2VkKHRoaXMuc2V0dGluZ3Mud3hJbmZvWzBdLmFwcGlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOaehOW7uuagt+W8j+e8lui+keWZqFxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5zaG93U3R5bGVVSSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5idWlsZFN0eWxlRWRpdG9yKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIGJ1aWxkTWFpblRvb2xiYXIoKSB7XG4gICAgICAgIGNvbnN0IGxpbmVEaXYgPSB0aGlzLnRvb2xiYXIuY3JlYXRlRGl2KHsgY2xzOiAndG9vbGJhci1saW5lJyB9KTtcbiAgICAgICAgY29uc3QgaG9yaXpvbnRhbENvbnRhaW5lciA9IGxpbmVEaXYuY3JlYXRlRGl2KHsgY2xzOiAndG9vbGJhci1ob3Jpem9udGFsLWNvbnRhaW5lcicgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyDlt6bkvqfljLrln59cbiAgICAgICAgY29uc3QgbGVmdFNlY3Rpb24gPSBob3Jpem9udGFsQ29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ3Rvb2xiYXItbGVmdC1zZWN0aW9uJyB9KTtcbiAgICAgICAgdGhpcy5idWlsZFdlY2hhdFNlbGVjdG9yKGxlZnRTZWN0aW9uKTtcbiAgICAgICAgdGhpcy5idWlsZENvdmVyU2VsZWN0b3IobGVmdFNlY3Rpb24pO1xuXG4gICAgICAgIC8vIOWPs+S+p+WMuuWfn1xuICAgICAgICBjb25zdCByaWdodFNlY3Rpb24gPSBob3Jpem9udGFsQ29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ3Rvb2xiYXItcmlnaHQtc2VjdGlvbicgfSk7XG4gICAgICAgIHRoaXMuYnVpbGRBY3Rpb25CdXR0b25zKHJpZ2h0U2VjdGlvbik7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBidWlsZFdlY2hhdFNlbGVjdG9yKHBhcmVudDogSFRNTERpdkVsZW1lbnQpIHtcbiAgICAgICAgY29uc3Qgd2VjaGF0Q29udGFpbmVyID0gcGFyZW50LmNyZWF0ZURpdih7IGNsczogJ3dlY2hhdC1zZWxlY3RvcicgfSk7XG4gICAgICAgIGNvbnN0IGxhYmVsRGl2ID0gd2VjaGF0Q29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ3dlY2hhdC1sYWJlbCcgfSk7XG4gICAgICAgIGxhYmVsRGl2LmlubmVyVGV4dCA9ICflhazkvJflj7c6JztcbiAgICAgICAgXG4gICAgICAgIGNvbnN0IHd4U2VsZWN0ID0gd2VjaGF0Q29udGFpbmVyLmNyZWF0ZUVsKCdzZWxlY3QnLCB7IGNsczogJ3dlY2hhdC1zZWxlY3QnIH0pO1xuICAgICAgICB3eFNlbGVjdC5vbmNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlcnMub25BcHBJZENoYW5nZWQod3hTZWxlY3QudmFsdWUpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIOm7mOiupOmAiemhuVxuICAgICAgICBjb25zdCBkZWZhdWx0T3AgPSB3eFNlbGVjdC5jcmVhdGVFbCgnb3B0aW9uJyk7XG4gICAgICAgIGRlZmF1bHRPcC52YWx1ZSA9ICcnO1xuICAgICAgICBkZWZhdWx0T3AudGV4dCA9ICfor7flnKjorr7nva7ph4zphY3nva7lhazkvJflj7cnO1xuXG4gICAgICAgIC8vIOWFrOS8l+WPt+mAiemhuVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuc2V0dGluZ3Mud3hJbmZvLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBvcCA9IHd4U2VsZWN0LmNyZWF0ZUVsKCdvcHRpb24nKTtcbiAgICAgICAgICAgIGNvbnN0IHd4ID0gdGhpcy5zZXR0aW5ncy53eEluZm9baV07XG4gICAgICAgICAgICBvcC52YWx1ZSA9IHd4LmFwcGlkO1xuICAgICAgICAgICAgb3AudGV4dCA9IHd4Lm5hbWU7XG4gICAgICAgICAgICBpZiAoaSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIG9wLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZXJzLm9uQXBwSWRDaGFuZ2VkKHd4LmFwcGlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLndlY2hhdFNlbGVjdCA9IHd4U2VsZWN0O1xuICAgIH1cblxuICAgIHByaXZhdGUgYnVpbGRDb3ZlclNlbGVjdG9yKHBhcmVudDogSFRNTERpdkVsZW1lbnQpIHtcbiAgICAgICAgY29uc3QgY292ZXJDb250YWluZXIgPSBwYXJlbnQuY3JlYXRlRGl2KHsgY2xzOiAnY292ZXItc2VsZWN0b3InIH0pO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgY292ZXJMYWJlbCA9IGNvdmVyQ29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ2NvdmVyLWxhYmVsJyB9KTtcbiAgICAgICAgY292ZXJMYWJlbC5pbm5lclRleHQgPSAn5bCB6Z2iOic7XG5cbiAgICAgICAgY29uc3QgcmFkaW9Hcm91cCA9IGNvdmVyQ29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ2NvdmVyLXJhZGlvLWdyb3VwJyB9KTtcblxuICAgICAgICAvLyDpu5jorqTlsIHpnaLpgInpoblcbiAgICAgICAgY29uc3QgZGVmYXVsdFdyYXBwZXIgPSByYWRpb0dyb3VwLmNyZWF0ZURpdih7IGNsczogJ3JhZGlvLXdyYXBwZXInIH0pO1xuICAgICAgICB0aGlzLnVzZURlZmF1bHRDb3ZlciA9IGRlZmF1bHRXcmFwcGVyLmNyZWF0ZUVsKCdpbnB1dCcsIHsgY2xzOiAnY292ZXItcmFkaW8nIH0pO1xuICAgICAgICB0aGlzLnVzZURlZmF1bHRDb3Zlci5zZXRBdHRyKCd0eXBlJywgJ3JhZGlvJyk7XG4gICAgICAgIHRoaXMudXNlRGVmYXVsdENvdmVyLnNldEF0dHIoJ25hbWUnLCAnY292ZXInKTtcbiAgICAgICAgdGhpcy51c2VEZWZhdWx0Q292ZXIuc2V0QXR0cigndmFsdWUnLCAnZGVmYXVsdCcpO1xuICAgICAgICB0aGlzLnVzZURlZmF1bHRDb3Zlci5zZXRBdHRyKCdjaGVja2VkJywgJ3RydWUnKTtcbiAgICAgICAgdGhpcy51c2VEZWZhdWx0Q292ZXIuaWQgPSAnZGVmYXVsdC1jb3Zlci1oJztcbiAgICAgICAgdGhpcy51c2VEZWZhdWx0Q292ZXIub25jaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnRvZ2dsZUNvdmVyVXBsb2FkKHRoaXMudXNlRGVmYXVsdENvdmVyLmNoZWNrZWQpO1xuICAgICAgICB9O1xuICAgICAgICBjb25zdCBkZWZhdWx0TGFiZWwgPSBkZWZhdWx0V3JhcHBlci5jcmVhdGVFbCgnbGFiZWwnLCB7IGNsczogJ3JhZGlvLWxhYmVsJyB9KTtcbiAgICAgICAgZGVmYXVsdExhYmVsLnNldEF0dHIoJ2ZvcicsICdkZWZhdWx0LWNvdmVyLWgnKTtcbiAgICAgICAgZGVmYXVsdExhYmVsLmlubmVyVGV4dCA9ICfpu5jorqQnO1xuXG4gICAgICAgIC8vIOS4iuS8oOWwgemdoumAiemhuVxuICAgICAgICBjb25zdCB1cGxvYWRXcmFwcGVyID0gcmFkaW9Hcm91cC5jcmVhdGVEaXYoeyBjbHM6ICdyYWRpby13cmFwcGVyJyB9KTtcbiAgICAgICAgdGhpcy51c2VMb2NhbENvdmVyID0gdXBsb2FkV3JhcHBlci5jcmVhdGVFbCgnaW5wdXQnLCB7IGNsczogJ2NvdmVyLXJhZGlvJyB9KTtcbiAgICAgICAgdGhpcy51c2VMb2NhbENvdmVyLnNldEF0dHIoJ3R5cGUnLCAncmFkaW8nKTtcbiAgICAgICAgdGhpcy51c2VMb2NhbENvdmVyLnNldEF0dHIoJ25hbWUnLCAnY292ZXInKTtcbiAgICAgICAgdGhpcy51c2VMb2NhbENvdmVyLnNldEF0dHIoJ3ZhbHVlJywgJ2xvY2FsJyk7XG4gICAgICAgIHRoaXMudXNlTG9jYWxDb3Zlci5pZCA9ICdsb2NhbC1jb3Zlci1oJztcbiAgICAgICAgdGhpcy51c2VMb2NhbENvdmVyLm9uY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy50b2dnbGVDb3ZlclVwbG9hZCh0aGlzLnVzZUxvY2FsQ292ZXIuY2hlY2tlZCk7XG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHVwbG9hZExhYmVsID0gdXBsb2FkV3JhcHBlci5jcmVhdGVFbCgnbGFiZWwnLCB7IGNsczogJ3JhZGlvLWxhYmVsJyB9KTtcbiAgICAgICAgdXBsb2FkTGFiZWwuc2V0QXR0cignZm9yJywgJ2xvY2FsLWNvdmVyLWgnKTtcbiAgICAgICAgdXBsb2FkTGFiZWwuaW5uZXJUZXh0ID0gJ+S4iuS8oCc7XG4gICAgICAgIFxuICAgICAgICAvLyBDbGF1ZGUgQ29kZSBVcGRhdGU6IOS9v+eUqENTU+exu+iAjOmdnuWGheiBlOagt+W8j1xuICAgICAgICAvLyDmlofku7bkuIrkvKDmjqfku7ZcbiAgICAgICAgY29uc3QgZmlsZVVwbG9hZENvbnRhaW5lciA9IHJhZGlvR3JvdXAuY3JlYXRlRGl2KHsgY2xzOiAnZmlsZS11cGxvYWQtY29udGFpbmVyIGhpZGRlbicgfSk7XG5cbiAgICAgICAgY29uc3QgdXBsb2FkQnV0dG9uID0gZmlsZVVwbG9hZENvbnRhaW5lci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdmaWxlLXVwbG9hZC1idG4nIH0pO1xuICAgICAgICB1cGxvYWRCdXR0b24udHlwZSA9ICdidXR0b24nO1xuICAgICAgICB1cGxvYWRCdXR0b24uaW5uZXJUZXh0ID0gJ+mAieaLqeaWh+S7tic7XG5cbiAgICAgICAgdGhpcy5jb3ZlckVsID0gZmlsZVVwbG9hZENvbnRhaW5lci5jcmVhdGVFbCgnaW5wdXQnLCB7IGNsczogJ2ZpbGUtaW5wdXQtaGlkZGVuIGhpZGRlbicgfSk7XG4gICAgICAgIHRoaXMuY292ZXJFbC5zZXRBdHRyKCd0eXBlJywgJ2ZpbGUnKTtcbiAgICAgICAgdGhpcy5jb3ZlckVsLnNldEF0dHIoJ2FjY2VwdCcsICcucG5nLCAuanBnLCAuanBlZycpO1xuICAgICAgICB0aGlzLmNvdmVyRWwuc2V0QXR0cignbmFtZScsICdjb3ZlcicpO1xuICAgICAgICB0aGlzLmNvdmVyRWwuaWQgPSAnY292ZXItaW5wdXQnO1xuICAgICAgICBcbiAgICAgICAgdXBsb2FkQnV0dG9uLm9uY2xpY2sgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmNvdmVyRWwuY2xpY2soKTtcbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMuY292ZXJFbC5vbmNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvdmVyRWwuZmlsZXMgJiYgdGhpcy5jb3ZlckVsLmZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB1cGxvYWRCdXR0b24uaW5uZXJUZXh0ID0gdGhpcy5jb3ZlckVsLmZpbGVzWzBdLm5hbWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHVwbG9hZEJ1dHRvbi5pbm5lclRleHQgPSAn6YCJ5oup5paH5Lu2JztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICAvLyBDbGF1ZGUgQ29kZSBVcGRhdGU6IOS9v+eUqHNhbml0aXplSFRNTFRvRG9t5pu/5LujaW5uZXJIVE1M6K6+572uU1ZH5YaF5a65XG4gICAgcHJpdmF0ZSBidWlsZEFjdGlvbkJ1dHRvbnMocGFyZW50OiBIVE1MRGl2RWxlbWVudCkge1xuICAgICAgICBjb25zdCBidXR0b25Db250YWluZXIgPSBwYXJlbnQuY3JlYXRlRGl2KHsgY2xzOiAnYWN0aW9uLWJ1dHRvbnMnIH0pO1xuXG4gICAgICAgIC8vIOWIt+aWsOaMiemSrlxuICAgICAgICBjb25zdCByZWZyZXNoQnRuID0gYnV0dG9uQ29udGFpbmVyLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2FjdGlvbi1idXR0b24nIH0pO1xuICAgICAgICBjb25zdCByZWZyZXNoU3ZnID0gYFxuICAgICAgICAgICAgPHN2ZyB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCI+XG4gICAgICAgICAgICAgICAgPHBhdGggZD1cIk0zIDEyYTkgOSAwIDAgMSA5LTkgOS43NSA5Ljc1IDAgMCAxIDYuNzQgMi43NEwyMSA4XCIvPlxuICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNMjEgM3Y1aC01XCIvPlxuICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNMjEgMTJhOSA5IDAgMCAxLTkgOSA5Ljc1IDkuNzUgMCAwIDEtNi43NC0yLjc0TDMgMTZcIi8+XG4gICAgICAgICAgICAgICAgPHBhdGggZD1cIk0zIDIxdi01aDVcIi8+XG4gICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgYDtcbiAgICAgICAgcmVmcmVzaEJ0bi5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVSYW5nZSgpLmNyZWF0ZUNvbnRleHR1YWxGcmFnbWVudChyZWZyZXNoU3ZnKSk7XG4gICAgICAgIHJlZnJlc2hCdG4uc2V0QXR0cigndGl0bGUnLCAn5Yi35pawJyk7XG4gICAgICAgIHJlZnJlc2hCdG4ub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuaGFuZGxlcnMub25SZWZyZXNoKCk7XG4gICAgICAgICAgICB1ZXZlbnQoJ3JlZnJlc2gnKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoUGxhdGZvcm0uaXNEZXNrdG9wKSB7XG4gICAgICAgICAgICAvLyBDbGF1ZGUgQ29kZSBVcGRhdGU6IOS9v+eUqERPTSBBUEnmm7/ku6Npbm5lckhUTUzorr7nva5TVkflhoXlrrlcbiAgICAgICAgICAgIC8vIOWkjeWItuaMiemSrlxuICAgICAgICAgICAgY29uc3QgY29weUJ0biA9IGJ1dHRvbkNvbnRhaW5lci5jcmVhdGVFbCgnYnV0dG9uJywgeyBjbHM6ICdhY3Rpb24tYnV0dG9uJyB9KTtcbiAgICAgICAgICAgIGNvbnN0IGNvcHlTdmcgPSBgXG4gICAgICAgICAgICAgICAgPHN2ZyB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCI+XG4gICAgICAgICAgICAgICAgICAgIDxyZWN0IHdpZHRoPVwiMTRcIiBoZWlnaHQ9XCIxNFwiIHg9XCI4XCIgeT1cIjhcIiByeD1cIjJcIiByeT1cIjJcIi8+XG4gICAgICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNNCAxNmMtMS4xIDAtMi0uOS0yLTJWNGMwLTEuMS45LTIgMi0yaDEwYzEuMSAwIDIgLjkgMiAyXCIvPlxuICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgYDtcbiAgICAgICAgICAgIGNvcHlCdG4uYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKS5jcmVhdGVDb250ZXh0dWFsRnJhZ21lbnQoY29weVN2ZykpO1xuICAgICAgICAgICAgY29weUJ0bi5zZXRBdHRyKCd0aXRsZScsICflpI3liLYnKTtcbiAgICAgICAgICAgIGNvcHlCdG4ub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLmhhbmRsZXJzLm9uQ29weSgpO1xuICAgICAgICAgICAgICAgICAgICB1ZXZlbnQoJ2NvcHknKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2xhdWRlIENvZGUgVXBkYXRlOiDkvb/nlKhET00gQVBJ5pu/5LujaW5uZXJIVE1M6K6+572uU1ZH5YaF5a65XG4gICAgICAgIC8vIOWPkeiNieeov+aMiemSrlxuICAgICAgICBjb25zdCBwb3N0QnRuID0gYnV0dG9uQ29udGFpbmVyLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2FjdGlvbi1idXR0b24nIH0pO1xuICAgICAgICBjb25zdCBwb3N0U3ZnID0gYFxuICAgICAgICAgICAgPHN2ZyB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCI+XG4gICAgICAgICAgICAgICAgPHBhdGggZD1cIk0xNC41MzYgMjEuNjg2YS41LjUgMCAwIDAgLjkzNy0uMDI0bDYuNS0xOWEuNDk2LjQ5NiAwIDAgMC0uNjM1LS42MzVsLTE5IDYuNWEuNS41IDAgMCAwLS4wMjQuOTM3bDcuOTMgMy4xOGEyIDIgMCAwIDEgMS4xMTIgMS4xMXpcIi8+XG4gICAgICAgICAgICAgICAgPHBhdGggZD1cIk0yMS44NTQgMi4xNDcgMTAuNjEgMTMuMzlcIi8+XG4gICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgYDtcbiAgICAgICAgcG9zdEJ0bi5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVSYW5nZSgpLmNyZWF0ZUNvbnRleHR1YWxGcmFnbWVudChwb3N0U3ZnKSk7XG4gICAgICAgIHBvc3RCdG4uc2V0QXR0cigndGl0bGUnLCAn5Y+R6I2J56i/Jyk7XG4gICAgICAgIHBvc3RCdG4ub25jbGljayA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuaGFuZGxlcnMub25Qb3N0KCk7XG4gICAgICAgICAgICB1ZXZlbnQoJ3B1YicpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIENsYXVkZSBDb2RlIFVwZGF0ZTog5L2/55SoRE9NIEFQSeabv+S7o2lubmVySFRNTOiuvue9rlNWR+WGheWuuVxuICAgICAgICAvLyDkuIrkvKDlm77niYfmjInpkq5cbiAgICAgICAgY29uc3QgdXBsb2FkQnRuID0gYnV0dG9uQ29udGFpbmVyLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ2FjdGlvbi1idXR0b24gdXBsb2FkLWJ0bicgfSk7XG4gICAgICAgIGNvbnN0IHVwbG9hZFN2ZyA9IGBcbiAgICAgICAgICAgIDxzdmcgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiPlxuICAgICAgICAgICAgICAgIDxwYXRoIGQ9XCJNMjEgMTV2NGEyIDIgMCAwIDEtMiAySDVhMiAyIDAgMCAxLTItMnYtNFwiLz5cbiAgICAgICAgICAgICAgICA8cG9seWxpbmUgcG9pbnRzPVwiNywxMCAxMiw1IDE3LDEwXCIvPlxuICAgICAgICAgICAgICAgIDxsaW5lIHgxPVwiMTJcIiB5MT1cIjVcIiB4Mj1cIjEyXCIgeTI9XCIxNVwiLz5cbiAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICBgO1xuICAgICAgICB1cGxvYWRCdG4uYXBwZW5kQ2hpbGQoZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKS5jcmVhdGVDb250ZXh0dWFsRnJhZ21lbnQodXBsb2FkU3ZnKSk7XG4gICAgICAgIHVwbG9hZEJ0bi5zZXRBdHRyKCd0aXRsZScsICfkuIrkvKDlm77niYcnKTtcbiAgICAgICAgdXBsb2FkQnRuLm9uY2xpY2sgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLmhhbmRsZXJzLm9uVXBsb2FkKCk7XG4gICAgICAgICAgICB1ZXZlbnQoJ3VwbG9hZCcpO1xuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgYnVpbGRTdHlsZUVkaXRvcigpIHtcbiAgICAgICAgY29uc3Qgc3R5bGVFZGl0b3JDb250YWluZXIgPSB0aGlzLnRvb2xiYXIuYXBwZW5kQ2hpbGQodGhpcy5zdHlsZUVkaXRvci5yZW5kZXIoKSk7XG4gICAgICAgIFxuICAgICAgICAvLyDojrflj5ZTdHlsZUVkaXRvcuWGhemDqOeahHNlbGVjdOWFg+e0oFxuICAgICAgICBjb25zdCBjb250ZW50RGl2ID0gc3R5bGVFZGl0b3JDb250YWluZXIucXVlcnlTZWxlY3RvcignLnN0eWxlLWVkaXRvci1jb250ZW50Jyk7XG4gICAgICAgIGNvbnN0IGRyb3Bkb3duR3JvdXBzID0gY29udGVudERpdj8ucXVlcnlTZWxlY3RvckFsbCgnLnN0eWxlLWRyb3Bkb3duLWdyb3VwJyk7XG4gICAgICAgIGNvbnN0IHRoZW1lU2VsZWN0ID0gZHJvcGRvd25Hcm91cHM/LlswXT8ucXVlcnlTZWxlY3Rvcignc2VsZWN0JykgYXMgSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgICAgIGNvbnN0IGhpZ2hsaWdodFNlbGVjdCA9IGRyb3Bkb3duR3JvdXBzPy5bMV0/LnF1ZXJ5U2VsZWN0b3IoJ3NlbGVjdCcpIGFzIEhUTUxTZWxlY3RFbGVtZW50O1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoZW1lU2VsZWN0KSB7XG4gICAgICAgICAgICB0aGlzLnRoZW1lU2VsZWN0ID0gdGhlbWVTZWxlY3Q7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGhpZ2hsaWdodFNlbGVjdCkge1xuICAgICAgICAgICAgdGhpcy5oaWdobGlnaHRTZWxlY3QgPSBoaWdobGlnaHRTZWxlY3Q7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBDbGF1ZGUgQ29kZSBVcGRhdGU6IOS9v+eUqENTU+exu+iAjOmdnuWGheiBlOagt+W8j1xuICAgIHByaXZhdGUgdG9nZ2xlQ292ZXJVcGxvYWQoc2hvd1VwbG9hZDogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICBjb25zdCBmaWxlVXBsb2FkQ29udGFpbmVyID0gdGhpcy50b29sYmFyLnF1ZXJ5U2VsZWN0b3IoJy5maWxlLXVwbG9hZC1jb250YWluZXInKSBhcyBIVE1MRGl2RWxlbWVudDtcbiAgICAgICAgaWYgKGZpbGVVcGxvYWRDb250YWluZXIpIHtcbiAgICAgICAgICAgIGlmIChzaG93VXBsb2FkKSB7XG4gICAgICAgICAgICAgICAgZmlsZVVwbG9hZENvbnRhaW5lci5yZW1vdmVDbGFzcygnaGlkZGVuJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGZpbGVVcGxvYWRDb250YWluZXIuYWRkQ2xhc3MoJ2hpZGRlbicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g5qC55o2u5YWD5pWw5o2u5pu05paw5bel5YW35qCP54q25oCBXG4gICAgdXBkYXRlRnJvbU1ldGFkYXRhKG1ldGFkYXRhOiBhbnksIGN1cnJlbnRUaGVtZTogc3RyaW5nLCBjdXJyZW50SGlnaGxpZ2h0OiBzdHJpbmcpIHtcbiAgICAgICAgaWYgKG1ldGFkYXRhLmFwcGlkICYmIHRoaXMud2VjaGF0U2VsZWN0KSB7XG4gICAgICAgICAgICB0aGlzLndlY2hhdFNlbGVjdC52YWx1ZSA9IG1ldGFkYXRhLmFwcGlkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG1ldGFkYXRhLnRoZW1lICYmIHRoaXMudGhlbWVTZWxlY3QpIHtcbiAgICAgICAgICAgIC8vIOafpeaJvuWvueW6lOeahOS4u+mimFxuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IEFycmF5LmZyb20odGhpcy50aGVtZVNlbGVjdC5vcHRpb25zKTtcbiAgICAgICAgICAgIGNvbnN0IHRoZW1lT3B0aW9uID0gb3B0aW9ucy5maW5kKG9wdGlvbiA9PiBvcHRpb24udGV4dCA9PT0gbWV0YWRhdGEudGhlbWUpO1xuICAgICAgICAgICAgaWYgKHRoZW1lT3B0aW9uKSB7XG4gICAgICAgICAgICAgICAgdGhpcy50aGVtZVNlbGVjdC52YWx1ZSA9IHRoZW1lT3B0aW9uLnZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMudGhlbWVTZWxlY3QpIHtcbiAgICAgICAgICAgIHRoaXMudGhlbWVTZWxlY3QudmFsdWUgPSBjdXJyZW50VGhlbWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAobWV0YWRhdGEuaGlnaGxpZ2h0ICYmIHRoaXMuaGlnaGxpZ2h0U2VsZWN0KSB7XG4gICAgICAgICAgICB0aGlzLmhpZ2hsaWdodFNlbGVjdC52YWx1ZSA9IG1ldGFkYXRhLmhpZ2hsaWdodDtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmhpZ2hsaWdodFNlbGVjdCkge1xuICAgICAgICAgICAgdGhpcy5oaWdobGlnaHRTZWxlY3QudmFsdWUgPSBjdXJyZW50SGlnaGxpZ2h0O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8g6I635Y+W5bCB6Z2i5paH5Lu2XG4gICAgZ2V0Q292ZXJGaWxlKCk6IEZpbGUgfCBudWxsIHtcbiAgICAgICAgaWYgKHRoaXMudXNlTG9jYWxDb3ZlciAmJiB0aGlzLnVzZUxvY2FsQ292ZXIuY2hlY2tlZCAmJiB0aGlzLmNvdmVyRWwuZmlsZXMgJiYgdGhpcy5jb3ZlckVsLmZpbGVzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvdmVyRWwuZmlsZXNbMF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8g5piv5ZCm5L2/55So6buY6K6k5bCB6Z2iXG4gICAgaXNVc2luZ0RlZmF1bHRDb3ZlcigpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudXNlRGVmYXVsdENvdmVyICYmIHRoaXMudXNlRGVmYXVsdENvdmVyLmNoZWNrZWQ7XG4gICAgfVxuXG4gICAgLy8g5piv5ZCm5L2/55So5pys5Zyw5bCB6Z2iXG4gICAgaXNVc2luZ0xvY2FsQ292ZXIoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLnVzZUxvY2FsQ292ZXIgJiYgdGhpcy51c2VMb2NhbENvdmVyLmNoZWNrZWQ7XG4gICAgfVxuXG4gICAgLy8g6I635Y+W5bel5YW35qCP5YWD57SgXG4gICAgZ2V0RWxlbWVudCgpOiBIVE1MRGl2RWxlbWVudCB7XG4gICAgICAgIHJldHVybiB0aGlzLnRvb2xiYXI7XG4gICAgfVxuXG4gICAgLy8g6I635Y+W5b6u5L+h6YCJ5oup5ZmoXG4gICAgZ2V0V2VjaGF0U2VsZWN0KCk6IEhUTUxTZWxlY3RFbGVtZW50IHtcbiAgICAgICAgcmV0dXJuIHRoaXMud2VjaGF0U2VsZWN0O1xuICAgIH1cblxuICAgIC8vIOiOt+WPluS4u+mimOmAieaLqeWZqFxuICAgIGdldFRoZW1lU2VsZWN0KCk6IEhUTUxTZWxlY3RFbGVtZW50IHwgdW5kZWZpbmVkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGhlbWVTZWxlY3Q7XG4gICAgfVxuXG4gICAgLy8g6I635Y+W6auY5Lqu6YCJ5oup5ZmoXG4gICAgZ2V0SGlnaGxpZ2h0U2VsZWN0KCk6IEhUTUxTZWxlY3RFbGVtZW50IHwgdW5kZWZpbmVkIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaGlnaGxpZ2h0U2VsZWN0O1xuICAgIH1cblxuICAgIC8vIOWIt+aWsOW3peWFt+agj+aWueazle+8jOmHjeaWsOaehOW7ulVJ5Lul5Y+N5pig6K6+572u5Y+Y5pu0XG4gICAgcmVmcmVzaCgpOiB2b2lkIHtcbiAgICAgICAgLy8g5om+5Yiw5bm256e76Zmk546w5pyJ55qE5bel5YW35qCP5YWD57SgXG4gICAgICAgIGNvbnN0IGV4aXN0aW5nVG9vbGJhciA9IHRoaXMucGFyZW50LnF1ZXJ5U2VsZWN0b3IoJy5wcmV2aWV3LXRvb2xiYXInKTtcbiAgICAgICAgbGV0IGluc2VydFBvc2l0aW9uOiBFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gICAgICAgIFxuICAgICAgICBpZiAoZXhpc3RpbmdUb29sYmFyKSB7XG4gICAgICAgICAgICAvLyDorrDkvY/lt6XlhbfmoI/nmoTkvY3nva7vvIjlroPnmoTkuIvkuIDkuKrlhYTlvJ/lhYPntKDvvIlcbiAgICAgICAgICAgIGluc2VydFBvc2l0aW9uID0gZXhpc3RpbmdUb29sYmFyLm5leHRFbGVtZW50U2libGluZztcbiAgICAgICAgICAgIGV4aXN0aW5nVG9vbGJhci5yZW1vdmUoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g6YeN5paw5p6E5bu65bel5YW35qCPXG4gICAgICAgIHRoaXMudG9vbGJhciA9IHRoaXMucGFyZW50LmNyZWF0ZURpdih7IGNsczogJ3ByZXZpZXctdG9vbGJhcicgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyDph43mlrDmnoTlu7rkuLvopoHlt6XlhbfmoI9cbiAgICAgICAgaWYgKHRoaXMuc2V0dGluZ3Mud3hJbmZvLmxlbmd0aCA+IDEgfHwgUGxhdGZvcm0uaXNEZXNrdG9wKSB7XG4gICAgICAgICAgICB0aGlzLmJ1aWxkTWFpblRvb2xiYXIoKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnNldHRpbmdzLnd4SW5mby5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAvLyDorr7nva7pu5jorqTlhazkvJflj7dcbiAgICAgICAgICAgIHRoaXMuaGFuZGxlcnMub25BcHBJZENoYW5nZWQodGhpcy5zZXR0aW5ncy53eEluZm9bMF0uYXBwaWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g6YeN5paw5p6E5bu65qC35byP57yW6L6R5ZmoXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLnNob3dTdHlsZVVJKSB7XG4gICAgICAgICAgICB0aGlzLmJ1aWxkU3R5bGVFZGl0b3IoKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g56Gu5L+d5bel5YW35qCP5aeL57uI5Zyo5a655Zmo55qE56ys5LiA5Liq5L2N572uXG4gICAgICAgIGlmICh0aGlzLnBhcmVudC5maXJzdENoaWxkICYmIHRoaXMucGFyZW50LmZpcnN0Q2hpbGQgIT09IHRoaXMudG9vbGJhcikge1xuICAgICAgICAgICAgdGhpcy5wYXJlbnQuaW5zZXJ0QmVmb3JlKHRoaXMudG9vbGJhciwgdGhpcy5wYXJlbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgIH1cbiAgICB9XG59Il19