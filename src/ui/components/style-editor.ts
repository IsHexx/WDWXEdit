/*
 * 现代化样式编辑器组件
 * 只修改UI样式，保持原有代码逻辑不变
 */

import { WxSettings } from '../../core/settings';
import AssetsManager from '../../core/assets';

export interface StyleEditorEvents {
    onThemeChanged: (theme: string) => void;
    onHighlightChanged: (highlight: string) => void;
    onStyleReset: () => void;

    onFontChanged?: (fontFamily: string) => void;
    onFontSizeChanged?: (fontSize: string) => void;
    onPrimaryColorChanged?: (color: string) => void;
    onCustomCSSChanged?: (css: string) => void;
}

export class StyleEditor {
    private settings: WxSettings;
    private assetsManager: AssetsManager;
    private events: StyleEditorEvents;
    private container!: HTMLDivElement;
    private contentDiv!: HTMLDivElement;
    private isCollapsed: boolean = false;

    constructor(settings: WxSettings, assetsManager: AssetsManager, events: StyleEditorEvents) {
        this.settings = settings;
        this.assetsManager = assetsManager;
        this.events = events;
    }

    render(): HTMLElement {
        this.container = document.createElement('div');
        this.container.className = 'style-editor-container';

        this.createCollapsibleLayout();

        this.addStyles();
        
        return this.container;
    }

    private createCollapsibleLayout(): void {

        this.createTitleBar();

        this.createContentArea();
    }

    private createTitleBar(): void {
        const titleBar = this.container.createDiv({ cls: 'style-editor-header' });

        const toggleButton = titleBar.createEl('button', { cls: 'style-editor-toggle' });
        toggleButton.textContent = this.isCollapsed ? '▶' : '▼';

        const title = titleBar.createEl('span', { cls: 'style-editor-title', text: '样式编辑器' });

        const resetButton = titleBar.createEl('button', { cls: 'style-editor-reset', text: '重置' });
        resetButton.title = '重置所有样式';

        toggleButton.onclick = () => this.toggleCollapse();
        resetButton.onclick = () => {
            if (confirm('确定要重置所有样式设置吗？')) {
                this.events.onStyleReset();
            }
        };
    }

    private createContentArea(): void {
        this.contentDiv = this.container.createDiv({ cls: 'style-editor-content' });
        if (this.isCollapsed) {
            this.contentDiv.addClass('hidden');
        }

        this.createV2StyleOptionsLayout();
    }
    
    private createV2StyleOptionsLayout(): void {

        const firstRow = this.contentDiv.createDiv({ cls: 'style-editor-row' });

        const themeGroup = firstRow.createDiv({ cls: 'style-dropdown-group' });
        const themeLabel = themeGroup.createEl('label', { text: '样式:', cls: 'style-dropdown-label' });
        const themeSelect = themeGroup.createEl('select', { cls: 'style-dropdown' });

        const themes = this.assetsManager.themes;
        themes.forEach((theme: any) => {
            const option = themeSelect.createEl('option');
            option.value = theme.className;
            option.textContent = theme.name;
            if (theme.className === this.settings.defaultStyle) {
                option.selected = true;
            }
        });
        
        themeSelect.onchange = () => {
            this.events.onThemeChanged(themeSelect.value);
        };

        const codeGroup = firstRow.createDiv({ cls: 'style-dropdown-group' });
        const codeLabel = codeGroup.createEl('label', { text: '代码高亮:', cls: 'style-dropdown-label' });
        const codeSelect = codeGroup.createEl('select', { cls: 'style-dropdown' });

        const highlights = this.assetsManager.highlights;
        const addedNames = new Set<string>();
        
        highlights.forEach((highlight: any) => {
            if (!addedNames.has(highlight.name)) {
                const option = codeSelect.createEl('option');
                option.value = highlight.name;
                option.textContent = highlight.name;
                if (highlight.name === this.settings.defaultHighlight) {
                    option.selected = true;
                }
                addedNames.add(highlight.name);
            }
        });
        
        codeSelect.onchange = () => {
            this.events.onHighlightChanged(codeSelect.value);
        };

        const fontGroup = firstRow.createDiv({ cls: 'style-dropdown-group' });
        const fontLabel = fontGroup.createEl('label', { text: '字体:', cls: 'style-dropdown-label' });
        const fontSelect = fontGroup.createEl('select', { cls: 'style-dropdown' });
        
        const fontOptions = [
            { value: 'dengxian', text: '等线' },
            { value: 'sans-serif', text: '无衬线' },
            { value: 'serif', text: '衬线' },
            { value: 'monospace', text: '等宽' }
        ];
        
        fontOptions.forEach(font => {
            const option = fontSelect.createEl('option');
            option.value = font.value;
            option.text = font.text;

            if (font.text === this.settings.fontFamily) {
                option.selected = true;
            }
        });

        fontSelect.onchange = () => {
            const selectedOption = fontSelect.options[fontSelect.selectedIndex];
            this.settings.fontFamily = selectedOption.text;
            if (this.events.onFontChanged) {
                this.events.onFontChanged(selectedOption.text);
            }
        };

        const sizeGroup = firstRow.createDiv({ cls: 'style-dropdown-group' });
        const sizeLabel = sizeGroup.createEl('label', { text: '字号:', cls: 'style-dropdown-label' });
        const sizeSelect = sizeGroup.createEl('select', { cls: 'style-dropdown' });

        const sizeOptions = [
            { value: '14px', text: '14px' },
            { value: '16px', text: '16px (推荐)' },
            { value: '18px', text: '18px' },
            { value: '20px', text: '20px' },
            { value: '22px', text: '22px' },
            { value: '24px', text: '24px' }
        ];
        
        sizeOptions.forEach(size => {
            const option = sizeSelect.createEl('option');
            option.value = size.value;
            option.text = size.text;

            if (size.value === this.settings.fontSize ||
                (this.settings.fontSize === '推荐' && size.value === '16px')) {
                option.selected = true;
            }
        });

        sizeSelect.onchange = () => {
            const fontSize = sizeSelect.value; // 直接使用value值（如 "16px", "22px"）
            this.settings.fontSize = fontSize;
            if (this.events.onFontSizeChanged) {
                this.events.onFontSizeChanged(fontSize);
            }
        };

        const colorGroup = firstRow.createDiv({ cls: 'style-dropdown-group' });
        const colorLabel = colorGroup.createEl('label', { text: '主题色:', cls: 'style-dropdown-label' });
        const colorSelect = colorGroup.createEl('select', { cls: 'style-dropdown' });

        const colorOptions = [
            { value: '#2d3748', text: '石墨黑' },
            { value: '#3b82f6', text: '经典蓝' },
            { value: '#10b981', text: '翠绿' },
            { value: '#f59e0b', text: '橙黄' },
            { value: '#ef4444', text: '朱红' },
            { value: '#8b5cf6', text: '紫罗兰' }
        ];

        let isCustomColor = true;
        colorOptions.forEach(color => {
            const option = colorSelect.createEl('option');
            option.value = color.value;
            option.text = color.text;

            if (color.value === this.settings.primaryColor) {
                option.selected = true;
                isCustomColor = false;
            }
        });

        const customOption = colorSelect.createEl('option');
        customOption.value = 'custom';
        customOption.text = '自定义';

        if (isCustomColor && this.settings.primaryColor) {
            customOption.selected = true;
            customOption.text = `自定义 (${this.settings.primaryColor})`;
        }

        const colorInputWrapper = colorGroup.createDiv({ cls: 'color-input-wrapper' });
        const colorInput = colorInputWrapper.createEl('input', {
            type: 'color',
            cls: 'custom-color-input'
        });
        colorInput.value = this.settings.primaryColor || '#2d3748';

        if (isCustomColor && this.settings.primaryColor) {
            colorInputWrapper.removeClass('hidden');
        } else {
            colorInputWrapper.addClass('hidden');
        }

        colorSelect.onchange = () => {
            const selectedValue = colorSelect.value;

            if (selectedValue === 'custom') {

                colorInputWrapper.removeClass('hidden');

                const customColor = colorInput.value;
                this.settings.primaryColor = customColor;
                customOption.text = `自定义 (${customColor})`;
                if (this.events.onPrimaryColorChanged) {
                    this.events.onPrimaryColorChanged(customColor);
                }
            } else {

                colorInputWrapper.addClass('hidden');
                this.settings.primaryColor = selectedValue;
                if (this.events.onPrimaryColorChanged) {
                    this.events.onPrimaryColorChanged(selectedValue);
                }
            }
        };

        colorInput.oninput = () => {
            const customColor = colorInput.value;
            this.settings.primaryColor = customColor;
            customOption.text = `自定义 (${customColor})`;
            if (this.events.onPrimaryColorChanged) {
                this.events.onPrimaryColorChanged(customColor);
            }
        };

        const secondRow = this.contentDiv.createDiv({ cls: 'style-editor-css-row' });
        const cssLabel = secondRow.createDiv({ cls: 'style-css-label', text: '自定义CSS:' });

        const cssTextarea = this.contentDiv.createEl('textarea', { 
            cls: 'style-editor-css-textarea',
            attr: { placeholder: '', rows: '4' }
        });

        cssTextarea.value = this.settings.customCSS || '';

        let cssTimeout: NodeJS.Timeout;
        cssTextarea.oninput = () => {
            clearTimeout(cssTimeout);
            cssTimeout = setTimeout(() => {
                this.settings.customCSS = cssTextarea.value;
                if (this.events.onCustomCSSChanged) {
                    this.events.onCustomCSSChanged(cssTextarea.value);
                }
            }, 500); // 500ms防抖
        };
    }

    private toggleCollapse(): void {
        this.isCollapsed = !this.isCollapsed;

        const toggleButton = this.container.querySelector('.style-editor-toggle') as HTMLButtonElement;
        const contentDiv = this.container.querySelector('.style-editor-content') as HTMLDivElement;

        if (this.isCollapsed) {
            toggleButton.textContent = '▶';
            contentDiv.addClass('hidden');
        } else {
            toggleButton.textContent = '▼';
            contentDiv.removeClass('hidden');
        }
    }

    private addStyles(): void {
        if (document.getElementById('style-editor-css')) return;
        
        const style = document.createElement('style');
        style.id = 'style-editor-css';
        style.textContent = `
            
            .style-editor-container {
                background: #f8f8f8;
                border-radius: 6px;
                border: 1px solid var(--background-modifier-border);
                margin: 8px 0;
                overflow: hidden;
            }
            
            .style-editor-header {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                background: #f8f8f8;
                border-bottom: 1px solid var(--background-modifier-border);
                cursor: pointer;
            }
            
            .style-editor-toggle {
                background: none;
                border: none;
                color: var(--text-muted);
                cursor: pointer;
                padding: 2px 6px;
                margin-right: 8px;
                font-size: 12px;
                border-radius: 3px;
                transition: background-color 0.2s ease;
            }
            
            .style-editor-toggle:hover {
                background: var(--background-modifier-hover);
            }
            
            .style-editor-title {
                font-weight: 500;
                color: var(--text-normal);
                font-size: 14px;
                flex: 1;
            }
            
            .style-editor-reset {
                background: none;
                border: 1px solid var(--background-modifier-border);
                color: var(--text-muted);
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .style-editor-reset:hover {
                background: var(--background-modifier-hover);
                border-color: var(--interactive-accent);
                color: var(--text-normal);
            }
            
            .style-editor-content {
                padding: 12px;
                background: #f8f8f8;
            }
            
            .style-editor-row {
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 8px 0;
                flex-wrap: wrap;
            }
            
            .style-dropdown-group {
                display: flex;
                align-items: center;
                gap: 4px;
                flex-shrink: 0;
            }

            .style-dropdown-label {
                font-weight: normal;
                color: var(--text-normal);
                font-size: 14px;
                white-space: nowrap;
                min-width: fit-content;
            }

            .color-input-wrapper {
                display: inline-block;
                margin-left: 4px;
            }

            .color-input-wrapper.hidden {
                display: none;
            }

            .style-editor-content.hidden {
                display: none;
            }

            .custom-color-input {
                width: 32px;
                height: 28px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                cursor: pointer;
                padding: 2px;
                background: transparent;
                vertical-align: middle;
            }

            .custom-color-input:hover {
                border-color: var(--interactive-accent);
            }

            .style-dropdown {
                padding: 2px 6px;
                border: 1px solid #ffffff;
                border-radius: 3px;
                background: var(--background-primary);
                color: var(--text-normal);
                font-size: 13px;
                cursor: pointer;
                transition: border-color 0.2s ease;
                min-width: 70px;
            }
            
            .style-dropdown:hover {
                border-color: var(--interactive-accent);
            }
            
            .style-dropdown:focus {
                outline: none;
                border-color: var(--interactive-accent);
            }
            
            .style-editor-css-row {
                margin: 12px 0 6px 0;
            }
            
            .style-css-label {
                font-weight: normal;
                color: var(--text-normal);
                font-size: 14px;
                margin-bottom: 6px;
            }
            
            .style-editor-css-textarea {
                width: 100%;
                min-height: 80px;
                padding: 8px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: #ffffff;
                color: var(--text-normal);
                font-size: 12px;
                font-family: var(--font-monospace);
                resize: vertical;
                transition: border-color 0.2s ease;
                box-sizing: border-box;
            }
            
            .style-editor-css-textarea:focus {
                outline: none;
                border-color: var(--interactive-accent);
                box-shadow: 0 0 0 1px var(--interactive-accent-hover);
            }
            
            .style-editor-css-textarea::placeholder {
                color: var(--text-faint);
            }

            .button-group {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-left: 12px;
            }
            
            .icon-button {
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                color: var(--text-normal);
                cursor: pointer;
                padding: 4px 6px;
                border-radius: 3px;
                font-size: 12px;
                transition: all 0.2s ease;
                min-width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .icon-button:hover {
                background: var(--background-modifier-hover);
                border-color: var(--interactive-accent);
            }
            
            .icon-button:active {
                transform: scale(0.95);
            }

            .toolbar-buttons {
                display: flex;
                justify-content: flex-end;
                gap: 8px;
                margin-bottom: 8px;
                flex-wrap: wrap;
            }
            
            .toolbar-button {
                background: #ffffff;
                border: 1px solid #d1d5da;
                color: #24292e;
                cursor: pointer;
                padding: 6px 12px;
                border-radius: 3px;
                font-size: 13px;
                transition: all 0.15s ease;
                white-space: nowrap;
                margin-right: 8px;
            }
            
            .toolbar-button:hover {
                background: #f3f4f6;
                border-color: #959da5;
            }
            
            .toolbar-button:active {
                transform: scale(0.98);
            }

            .toolbar-buttons-inline {
                display: flex;
                align-items: center;
                gap: 4px;
                margin-left: auto;
            }
            
            .icon-button {
                background: #ffffff;
                border: 1px solid #d1d5da;
                color: #586069;
                cursor: pointer;
                padding: 0;
                border-radius: 4px;
                font-size: 12px;
                transition: all 0.15s ease;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: normal;
            }
            
            .icon-button:hover {
                background: #f3f4f6;
                border-color: #959da5;
            }
            
            .icon-button:active {
                background: #e1e4e8;
                transform: scale(0.98);
            }
        `;
        
        document.head.appendChild(style);
    }

    refresh(): void {

        const contentDiv = this.container.querySelector('.style-editor-content');
        if (!contentDiv) return;
        
        const dropdownGroups = contentDiv.querySelectorAll('.style-dropdown-group');

        const themeSelect = dropdownGroups[0]?.querySelector('select') as HTMLSelectElement;
        if (themeSelect) {
            themeSelect.value = this.settings.defaultStyle;
        }

        const highlightSelect = dropdownGroups[1]?.querySelector('select') as HTMLSelectElement;
        if (highlightSelect) {
            highlightSelect.value = this.settings.defaultHighlight;
        }
    }

    public setCollapsed(collapsed: boolean): void {
        if (this.isCollapsed !== collapsed) {
            this.toggleCollapse();
        }
    }
    
    public getCollapsed(): boolean {
        return this.isCollapsed;
    }

    public updateSelections(
        theme: string,
        highlight: string,
        font?: string,
        fontSize?: string,
        primaryColor?: string,
        customCSS?: string
    ): void {
        const contentDiv = this.container.querySelector('.style-editor-content');
        if (!contentDiv) return;

        const dropdownGroups = contentDiv.querySelectorAll('.style-dropdown-group');

        const themeSelect = dropdownGroups[0]?.querySelector('select') as HTMLSelectElement;
        if (themeSelect) {
            themeSelect.value = theme;
        }

        const highlightSelect = dropdownGroups[1]?.querySelector('select') as HTMLSelectElement;
        if (highlightSelect) {
            highlightSelect.value = highlight;
        }

        if (font !== undefined) {
            const fontSelect = dropdownGroups[2]?.querySelector('select') as HTMLSelectElement;
            if (fontSelect) {
                fontSelect.value = font;
            }
        }

        if (fontSize !== undefined) {
            const fontSizeSelect = dropdownGroups[3]?.querySelector('select') as HTMLSelectElement;
            if (fontSizeSelect) {
                fontSizeSelect.value = fontSize;
            }
        }

        if (primaryColor !== undefined) {
            const colorSelect = dropdownGroups[4]?.querySelector('select') as HTMLSelectElement;
            const colorInput = contentDiv.querySelector('input.custom-color-input') as HTMLInputElement;
            const colorInputWrapper = contentDiv.querySelector('.color-input-wrapper') as HTMLDivElement;

            const presetColors = ['#2d3748', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
            const isPresetColor = presetColors.includes(primaryColor);

            if (colorSelect) {
                if (isPresetColor) {

                    colorSelect.value = primaryColor;
                    if (colorInputWrapper) {
                        colorInputWrapper.addClass('hidden');
                    }
                } else {

                    colorSelect.value = 'custom';
                    const customOption = colorSelect.querySelector('option[value="custom"]') as HTMLOptionElement;
                    if (customOption) {
                        customOption.text = `自定义 (${primaryColor})`;
                    }
                    if (colorInputWrapper) {
                        colorInputWrapper.removeClass('hidden');
                    }
                }
            }

            if (colorInput) {
                colorInput.value = primaryColor;
            }
        }

        if (customCSS !== undefined) {
            const cssTextarea = contentDiv.querySelector('textarea.style-editor-css-textarea') as HTMLTextAreaElement;
            if (cssTextarea) {
                cssTextarea.value = customCSS;
            }
        }
    }
}