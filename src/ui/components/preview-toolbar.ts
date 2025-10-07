import { Platform, sanitizeHTMLToDom } from 'obsidian';

import { WxSettings } from '../../core/settings';
import { StyleEditor } from './style-editor';
import { uevent } from '../../shared/utils';

interface ToolbarHandlers {
    onAppIdChanged: (appId: string) => void;
    onRefresh: () => Promise<void>;
    onCopy: () => Promise<void>;
    onPost: () => Promise<void>;
    onUpload: () => Promise<void>;
}

/**
 * 工具栏组件 - 负责工具栏UI和用户交互
 */
export class PreviewToolbar {
    private parent: HTMLDivElement;
    private settings: WxSettings;
    private styleEditor: StyleEditor;
    private handlers: ToolbarHandlers;
    
    private toolbar: HTMLDivElement;
    private wechatSelect: HTMLSelectElement;
    private themeSelect: HTMLSelectElement;
    private highlightSelect: HTMLSelectElement;
    private coverEl: HTMLInputElement;
    private useDefaultCover: HTMLInputElement;
    private useLocalCover: HTMLInputElement;

    constructor(
        parent: HTMLDivElement, 
        settings: WxSettings, 
        styleEditor: StyleEditor,
        handlers: ToolbarHandlers
    ) {
        this.parent = parent;
        this.settings = settings;
        this.styleEditor = styleEditor;
        this.handlers = handlers;
    }

    async build() {
        this.toolbar = this.parent.createDiv({ cls: 'preview-toolbar' });

        if (this.settings.wxInfo.length > 1 || Platform.isDesktop) {
            await this.buildMainToolbar();
        } else if (this.settings.wxInfo.length > 0) {

            this.handlers.onAppIdChanged(this.settings.wxInfo[0].appid);
        }

        if (this.settings.showStyleUI) {
            await this.buildStyleEditor();
        }
    }

    private async buildMainToolbar() {
        const lineDiv = this.toolbar.createDiv({ cls: 'toolbar-line' });
        const horizontalContainer = lineDiv.createDiv({ cls: 'toolbar-horizontal-container' });

        const leftSection = horizontalContainer.createDiv({ cls: 'toolbar-left-section' });
        this.buildWechatSelector(leftSection);
        this.buildCoverSelector(leftSection);

        const rightSection = horizontalContainer.createDiv({ cls: 'toolbar-right-section' });
        this.buildActionButtons(rightSection);
    }

    private buildWechatSelector(parent: HTMLDivElement) {
        const wechatContainer = parent.createDiv({ cls: 'wechat-selector' });
        const labelDiv = wechatContainer.createDiv({ cls: 'wechat-label' });
        labelDiv.innerText = '公众号:';
        
        const wxSelect = wechatContainer.createEl('select', { cls: 'wechat-select' });
        wxSelect.onchange = () => {
            this.handlers.onAppIdChanged(wxSelect.value);
        };

        const defaultOp = wxSelect.createEl('option');
        defaultOp.value = '';
        defaultOp.text = '请在设置里配置公众号';

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

    private buildCoverSelector(parent: HTMLDivElement) {
        const coverContainer = parent.createDiv({ cls: 'cover-selector' });
        
        const coverLabel = coverContainer.createDiv({ cls: 'cover-label' });
        coverLabel.innerText = '封面:';

        const radioGroup = coverContainer.createDiv({ cls: 'cover-radio-group' });

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
            } else {
                uploadButton.innerText = '选择文件';
            }
        };
    }

    private buildActionButtons(parent: HTMLDivElement) {
        const buttonContainer = parent.createDiv({ cls: 'action-buttons' });

        const refreshBtn = buttonContainer.createEl('button', { cls: 'action-button' });
        const refreshSvg = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
            </svg>
        `;
        refreshBtn.appendChild(sanitizeHTMLToDom(refreshSvg));
        refreshBtn.setAttr('title', '刷新');
        refreshBtn.onclick = async () => {
            await this.handlers.onRefresh();
            uevent('refresh');
        };

        if (Platform.isDesktop) {

            const copyBtn = buttonContainer.createEl('button', { cls: 'action-button' });
            const copySvg = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                </svg>
            `;
            copyBtn.appendChild(sanitizeHTMLToDom(copySvg));
            copyBtn.setAttr('title', '复制');
            copyBtn.onclick = async () => {
                try {
                    await this.handlers.onCopy();
                    uevent('copy');
                } catch (error) {

                }
            };
        }

        const postBtn = buttonContainer.createEl('button', { cls: 'action-button' });
        const postSvg = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/>
                <path d="M21.854 2.147 10.61 13.39"/>
            </svg>
        `;
        postBtn.appendChild(sanitizeHTMLToDom(postSvg));
        postBtn.setAttr('title', '发草稿');
        postBtn.onclick = async () => {
            await this.handlers.onPost();
            uevent('pub');
        };

        const uploadBtn = buttonContainer.createEl('button', { cls: 'action-button upload-btn' });
        const uploadSvg = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,5 17,10"/>
                <line x1="12" y1="5" x2="12" y2="15"/>
            </svg>
        `;
        uploadBtn.appendChild(sanitizeHTMLToDom(uploadSvg));
        uploadBtn.setAttr('title', '上传图片');
        uploadBtn.onclick = async () => {
            await this.handlers.onUpload();
            uevent('upload');
        };
    }

    private async buildStyleEditor() {
        const styleEditorContainer = this.toolbar.appendChild(this.styleEditor.render());

        const contentDiv = styleEditorContainer.querySelector('.style-editor-content');
        const dropdownGroups = contentDiv?.querySelectorAll('.style-dropdown-group');
        const themeSelect = dropdownGroups?.[0]?.querySelector('select') as HTMLSelectElement;
        const highlightSelect = dropdownGroups?.[1]?.querySelector('select') as HTMLSelectElement;
        
        if (themeSelect) {
            this.themeSelect = themeSelect;
        }
        if (highlightSelect) {
            this.highlightSelect = highlightSelect;
        }
    }

    private toggleCoverUpload(showUpload: boolean): void {
        const fileUploadContainer = this.toolbar.querySelector('.file-upload-container') as HTMLDivElement;
        if (fileUploadContainer) {
            if (showUpload) {
                fileUploadContainer.removeClass('hidden');
            } else {
                fileUploadContainer.addClass('hidden');
            }
        }
    }

    updateFromMetadata(metadata: any, currentTheme: string, currentHighlight: string) {
        if (metadata.appid && this.wechatSelect) {
            this.wechatSelect.value = metadata.appid;
        }

        if (metadata.theme && this.themeSelect) {

            const options = Array.from(this.themeSelect.options);
            const themeOption = options.find(option => option.text === metadata.theme);
            if (themeOption) {
                this.themeSelect.value = themeOption.value;
            }
        } else if (this.themeSelect) {
            this.themeSelect.value = currentTheme;
        }

        if (metadata.highlight && this.highlightSelect) {
            this.highlightSelect.value = metadata.highlight;
        } else if (this.highlightSelect) {
            this.highlightSelect.value = currentHighlight;
        }
    }

    getCoverFile(): File | null {
        if (this.useLocalCover && this.useLocalCover.checked && this.coverEl.files && this.coverEl.files.length > 0) {
            return this.coverEl.files[0];
        }
        return null;
    }

    isUsingDefaultCover(): boolean {
        return this.useDefaultCover && this.useDefaultCover.checked;
    }

    isUsingLocalCover(): boolean {
        return this.useLocalCover && this.useLocalCover.checked;
    }

    getElement(): HTMLDivElement {
        return this.toolbar;
    }

    getWechatSelect(): HTMLSelectElement {
        return this.wechatSelect;
    }

    getThemeSelect(): HTMLSelectElement | undefined {
        return this.themeSelect;
    }

    getHighlightSelect(): HTMLSelectElement | undefined {
        return this.highlightSelect;
    }

    refresh(): void {

        const existingToolbar = this.parent.querySelector('.preview-toolbar');
        let insertPosition: Element | null = null;
        
        if (existingToolbar) {

            insertPosition = existingToolbar.nextElementSibling;
            existingToolbar.remove();
        }

        this.toolbar = this.parent.createDiv({ cls: 'preview-toolbar' });

        if (this.settings.wxInfo.length > 1 || Platform.isDesktop) {
            this.buildMainToolbar();
        } else if (this.settings.wxInfo.length > 0) {

            this.handlers.onAppIdChanged(this.settings.wxInfo[0].appid);
        }

        if (this.settings.showStyleUI) {
            this.buildStyleEditor();
        }

        if (this.parent.firstChild && this.parent.firstChild !== this.toolbar) {
            this.parent.insertBefore(this.toolbar, this.parent.firstChild);
        }
    }
}
