/*
 * 现代化样式编辑器组件
 * 只修改UI样式，保持原有代码逻辑不变
 */
export class StyleEditor {
    constructor(settings, assetsManager, events) {
        this.isCollapsed = false;
        this.settings = settings;
        this.assetsManager = assetsManager;
        this.events = events;
    }
    render() {
        this.container = document.createElement('div');
        this.container.className = 'style-editor-container';
        // 创建可折叠的样式编辑器
        this.createCollapsibleLayout();
        // 添加样式
        this.addStyles();
        return this.container;
    }
    // 参照v2创建样式编辑器布局
    createCollapsibleLayout() {
        // 创建标题栏
        this.createTitleBar();
        // 创建内容区域
        this.createContentArea();
    }
    // Claude Code Update: 使用textContent替代innerHTML设置静态文本
    createTitleBar() {
        const titleBar = this.container.createDiv({ cls: 'style-editor-header' });
        // 折叠/展开按钮
        const toggleButton = titleBar.createEl('button', { cls: 'style-editor-toggle' });
        toggleButton.textContent = this.isCollapsed ? '▶' : '▼';
        // 标题
        const title = titleBar.createEl('span', { cls: 'style-editor-title', text: '样式编辑器' });
        // 重置按钮
        const resetButton = titleBar.createEl('button', { cls: 'style-editor-reset', text: '重置' });
        resetButton.title = '重置所有样式';
        // 绑定事件
        toggleButton.onclick = () => this.toggleCollapse();
        resetButton.onclick = () => {
            if (confirm('确定要重置所有样式设置吗？')) {
                this.events.onStyleReset();
            }
        };
    }
    // Claude Code Update: 使用CSS类而非内联样式
    createContentArea() {
        this.contentDiv = this.container.createDiv({ cls: 'style-editor-content' });
        if (this.isCollapsed) {
            this.contentDiv.addClass('hidden');
        }
        this.createV2StyleOptionsLayout();
    }
    createV2StyleOptionsLayout() {
        // 完全按照v2的实现方式
        // 第一行：所有下拉选择器在同一行
        const firstRow = this.contentDiv.createDiv({ cls: 'style-editor-row' });
        // 样式主题下拉框
        const themeGroup = firstRow.createDiv({ cls: 'style-dropdown-group' });
        const themeLabel = themeGroup.createEl('label', { text: '样式:', cls: 'style-dropdown-label' });
        const themeSelect = themeGroup.createEl('select', { cls: 'style-dropdown' });
        // 添加主题选项
        const themes = this.assetsManager.themes;
        themes.forEach((theme) => {
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
        // 代码高亮下拉框
        const codeGroup = firstRow.createDiv({ cls: 'style-dropdown-group' });
        const codeLabel = codeGroup.createEl('label', { text: '代码高亮:', cls: 'style-dropdown-label' });
        const codeSelect = codeGroup.createEl('select', { cls: 'style-dropdown' });
        // 添加高亮选项并去重
        const highlights = this.assetsManager.highlights;
        const addedNames = new Set();
        highlights.forEach((highlight) => {
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
        // 字体下拉框
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
            // 根据设置选中当前字体
            if (font.text === this.settings.fontFamily) {
                option.selected = true;
            }
        });
        // 字体变更事件
        fontSelect.onchange = () => {
            const selectedOption = fontSelect.options[fontSelect.selectedIndex];
            this.settings.fontFamily = selectedOption.text;
            if (this.events.onFontChanged) {
                this.events.onFontChanged(selectedOption.text);
            }
        };
        // 字号下拉框  
        const sizeGroup = firstRow.createDiv({ cls: 'style-dropdown-group' });
        const sizeLabel = sizeGroup.createEl('label', { text: '字号:', cls: 'style-dropdown-label' });
        const sizeSelect = sizeGroup.createEl('select', { cls: 'style-dropdown' });
        // Claude Code Update: 调整字号选项，去掉15px和17px，增加20px、22px、24px
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
            // Claude Code Update: 根据设置选中当前字号，直接比较value值
            if (size.value === this.settings.fontSize ||
                (this.settings.fontSize === '推荐' && size.value === '16px')) {
                option.selected = true;
            }
        });
        // Claude Code Update: 字号变更事件 - 直接使用像素值
        sizeSelect.onchange = () => {
            const fontSize = sizeSelect.value; // 直接使用value值（如 "16px", "22px"）
            this.settings.fontSize = fontSize;
            if (this.events.onFontSizeChanged) {
                this.events.onFontSizeChanged(fontSize);
            }
        };
        // Claude Code Update: 主题色下拉框 - 增加自定义选项
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
            // 根据设置选中当前主题色
            if (color.value === this.settings.primaryColor) {
                option.selected = true;
                isCustomColor = false;
            }
        });
        // 添加"自定义"选项
        const customOption = colorSelect.createEl('option');
        customOption.value = 'custom';
        customOption.text = '自定义';
        // 如果当前颜色不在预设中，选中自定义选项并显示当前颜色
        if (isCustomColor && this.settings.primaryColor) {
            customOption.selected = true;
            customOption.text = `自定义 (${this.settings.primaryColor})`;
        }
        // 创建颜色选择器（始终存在但可能隐藏）
        const colorInputWrapper = colorGroup.createDiv({ cls: 'color-input-wrapper' });
        const colorInput = colorInputWrapper.createEl('input', {
            type: 'color',
            cls: 'custom-color-input'
        });
        colorInput.value = this.settings.primaryColor || '#2d3748';
        // Claude Code Update: 使用CSS类而非内联样式
        // 如果是自定义颜色，显示颜色选择器
        if (isCustomColor && this.settings.primaryColor) {
            colorInputWrapper.removeClass('hidden');
        }
        else {
            colorInputWrapper.addClass('hidden');
        }
        // Claude Code Update: 使用CSS类而非内联样式
        // 主题色下拉框变更事件
        colorSelect.onchange = () => {
            const selectedValue = colorSelect.value;
            if (selectedValue === 'custom') {
                // 显示颜色选择器
                colorInputWrapper.removeClass('hidden');
                // 使用颜色选择器的当前值
                const customColor = colorInput.value;
                this.settings.primaryColor = customColor;
                customOption.text = `自定义 (${customColor})`;
                if (this.events.onPrimaryColorChanged) {
                    this.events.onPrimaryColorChanged(customColor);
                }
            }
            else {
                // 隐藏颜色选择器，使用预设颜色
                colorInputWrapper.addClass('hidden');
                this.settings.primaryColor = selectedValue;
                if (this.events.onPrimaryColorChanged) {
                    this.events.onPrimaryColorChanged(selectedValue);
                }
            }
        };
        // 颜色选择器变更事件
        colorInput.oninput = () => {
            const customColor = colorInput.value;
            this.settings.primaryColor = customColor;
            customOption.text = `自定义 (${customColor})`;
            if (this.events.onPrimaryColorChanged) {
                this.events.onPrimaryColorChanged(customColor);
            }
        };
        // 第二行：自定义CSS标签
        const secondRow = this.contentDiv.createDiv({ cls: 'style-editor-css-row' });
        const cssLabel = secondRow.createDiv({ cls: 'style-css-label', text: '自定义CSS:' });
        // 第三行：CSS文本区域（完整宽度）
        const cssTextarea = this.contentDiv.createEl('textarea', {
            cls: 'style-editor-css-textarea',
            attr: { placeholder: '/* 在这里输入自定义CSS样式 */', rows: '4' }
        });
        // 根据设置显示当前自定义CSS
        cssTextarea.value = this.settings.customCSS || '';
        // 自定义CSS变更事件（防抖处理）
        let cssTimeout;
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
    // Claude Code Update: 使用textContent替代innerHTML设置静态文本
    toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        const toggleButton = this.container.querySelector('.style-editor-toggle');
        const contentDiv = this.container.querySelector('.style-editor-content');
        if (this.isCollapsed) {
            toggleButton.textContent = '▶';
            contentDiv.addClass('hidden');
        }
        else {
            toggleButton.textContent = '▼';
            contentDiv.removeClass('hidden');
        }
    }
    addStyles() {
        if (document.getElementById('style-editor-css'))
            return;
        const style = document.createElement('style');
        style.id = 'style-editor-css';
        style.textContent = `
            /* 新toolbar样式，匹配图片设计 */
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

            /* Claude Code ADD: 颜色选择器样式 */
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
            
            /* 按钮样式 */
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
            
            /* 右上角按钮组样式 */
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
            
            /* 新toolbar按钮样式 */
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
    refresh() {
        var _a, _b;
        // 刷新UI状态，适配新的可折叠布局
        const contentDiv = this.container.querySelector('.style-editor-content');
        if (!contentDiv)
            return;
        const dropdownGroups = contentDiv.querySelectorAll('.style-dropdown-group');
        // 第一个是主题选择器
        const themeSelect = (_a = dropdownGroups[0]) === null || _a === void 0 ? void 0 : _a.querySelector('select');
        if (themeSelect) {
            themeSelect.value = this.settings.defaultStyle;
        }
        // 第二个是代码高亮选择器
        const highlightSelect = (_b = dropdownGroups[1]) === null || _b === void 0 ? void 0 : _b.querySelector('select');
        if (highlightSelect) {
            highlightSelect.value = this.settings.defaultHighlight;
        }
    }
    // 添加切换折叠状态的公共方法
    setCollapsed(collapsed) {
        if (this.isCollapsed !== collapsed) {
            this.toggleCollapse();
        }
    }
    getCollapsed() {
        return this.isCollapsed;
    }
    // Claude Code ADD: 更新下拉框和输入框选中状态
    // Claude Code Update
    updateSelections(theme, highlight, font, fontSize, primaryColor, customCSS) {
        var _a, _b, _c, _d, _e;
        const contentDiv = this.container.querySelector('.style-editor-content');
        if (!contentDiv)
            return;
        const dropdownGroups = contentDiv.querySelectorAll('.style-dropdown-group');
        // 更新主题选择器（第0个）
        const themeSelect = (_a = dropdownGroups[0]) === null || _a === void 0 ? void 0 : _a.querySelector('select');
        if (themeSelect) {
            themeSelect.value = theme;
        }
        // 更新代码高亮选择器（第1个）
        const highlightSelect = (_b = dropdownGroups[1]) === null || _b === void 0 ? void 0 : _b.querySelector('select');
        if (highlightSelect) {
            highlightSelect.value = highlight;
        }
        // 更新字体选择器（第2个）
        if (font !== undefined) {
            const fontSelect = (_c = dropdownGroups[2]) === null || _c === void 0 ? void 0 : _c.querySelector('select');
            if (fontSelect) {
                fontSelect.value = font;
            }
        }
        // 更新字号选择器（第3个）
        if (fontSize !== undefined) {
            const fontSizeSelect = (_d = dropdownGroups[3]) === null || _d === void 0 ? void 0 : _d.querySelector('select');
            if (fontSizeSelect) {
                fontSizeSelect.value = fontSize;
            }
        }
        // Claude Code Update: 更新主题色选择器和颜色输入框
        if (primaryColor !== undefined) {
            const colorSelect = (_e = dropdownGroups[4]) === null || _e === void 0 ? void 0 : _e.querySelector('select');
            const colorInput = contentDiv.querySelector('input.custom-color-input');
            const colorInputWrapper = contentDiv.querySelector('.color-input-wrapper');
            // 检查颜色是否在预设列表中
            const presetColors = ['#2d3748', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
            const isPresetColor = presetColors.includes(primaryColor);
            // Claude Code Update: 使用CSS类而非内联样式
            if (colorSelect) {
                if (isPresetColor) {
                    // 使用预设颜色
                    colorSelect.value = primaryColor;
                    if (colorInputWrapper) {
                        colorInputWrapper.addClass('hidden');
                    }
                }
                else {
                    // 使用自定义颜色
                    colorSelect.value = 'custom';
                    const customOption = colorSelect.querySelector('option[value="custom"]');
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
        // 更新自定义CSS文本框
        if (customCSS !== undefined) {
            const cssTextarea = contentDiv.querySelector('textarea.style-editor-css-textarea');
            if (cssTextarea) {
                cssTextarea.value = customCSS;
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGUtZWRpdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3R5bGUtZWRpdG9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7R0FHRztBQWlCSCxNQUFNLE9BQU8sV0FBVztJQVFwQixZQUFZLFFBQW9CLEVBQUUsYUFBNEIsRUFBRSxNQUF5QjtRQUZqRixnQkFBVyxHQUFZLEtBQUssQ0FBQztRQUdqQyxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUN6QixJQUFJLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztRQUNuQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUN6QixDQUFDO0lBRUQsTUFBTTtRQUNGLElBQUksQ0FBQyxTQUFTLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyx3QkFBd0IsQ0FBQztRQUVwRCxjQUFjO1FBQ2QsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7UUFFL0IsT0FBTztRQUNQLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUVqQixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDMUIsQ0FBQztJQUVELGdCQUFnQjtJQUNSLHVCQUF1QjtRQUMzQixRQUFRO1FBQ1IsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBRXRCLFNBQVM7UUFDVCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRUQscURBQXFEO0lBQzdDLGNBQWM7UUFDbEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxHQUFHLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO1FBRTFFLFVBQVU7UUFDVixNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxFQUFFLEdBQUcsRUFBRSxxQkFBcUIsRUFBRSxDQUFDLENBQUM7UUFD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YUFBYSxFQUFFO29CQUNmLFNBQVM7b0JBQ1QsV0FBVyxDQUFDLEtBQUssR0FBRyxZQUFZLENBQUM7b0JBQ2pDLElBQUksaUJBQWlCLEVBQUU7d0JBQ25CLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztxQkFDeEM7aUJBQ0o7cUJBQU07b0JBQ0gsVUFBVTtvQkFDVixXQUFXLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQztvQkFDN0IsTUFBTSxZQUFZLEdBQUcsV0FBVyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FBc0IsQ0FBQztvQkFDOUYsSUFBSSxZQUFZLEVBQUU7d0JBQ2QsWUFBWSxDQUFDLElBQUksR0FBRyxRQUFRLFlBQVksR0FBRyxDQUFDO3FCQUMvQztvQkFDRCxJQUFJLGlCQUFpQixFQUFFO3dCQUNuQixpQkFBaUIsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7cUJBQzNDO2lCQUNKO2FBQ0o7WUFFRCxJQUFJLFVBQVUsRUFBRTtnQkFDWixVQUFVLENBQUMsS0FBSyxHQUFHLFlBQVksQ0FBQzthQUNuQztTQUNKO1FBRUQsY0FBYztRQUNkLElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRTtZQUN6QixNQUFNLFdBQVcsR0FBRyxVQUFVLENBQUMsYUFBYSxDQUFDLG9DQUFvQyxDQUF3QixDQUFDO1lBQzFHLElBQUksV0FBVyxFQUFFO2dCQUNiLFdBQVcsQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO2FBQ2pDO1NBQ0o7SUFDTCxDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICog546w5Luj5YyW5qC35byP57yW6L6R5Zmo57uE5Lu2XG4gKiDlj6rkv67mlLlVSeagt+W8j++8jOS/neaMgeWOn+acieS7o+eggemAu+i+keS4jeWPmFxuICovXG5cbi8vIOabtOaWsGltcG9ydOi3r+W+hFxuaW1wb3J0IHsgV3hTZXR0aW5ncyB9IGZyb20gJy4uLy4uL2NvcmUvc2V0dGluZ3MnO1xuaW1wb3J0IEFzc2V0c01hbmFnZXIgZnJvbSAnLi4vLi4vY29yZS9hc3NldHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN0eWxlRWRpdG9yRXZlbnRzIHtcbiAgICBvblRoZW1lQ2hhbmdlZDogKHRoZW1lOiBzdHJpbmcpID0+IHZvaWQ7XG4gICAgb25IaWdobGlnaHRDaGFuZ2VkOiAoaGlnaGxpZ2h0OiBzdHJpbmcpID0+IHZvaWQ7XG4gICAgb25TdHlsZVJlc2V0OiAoKSA9PiB2b2lkO1xuICAgIC8vIOagt+W8j+e8lui+keWZqOS6i+S7tlxuICAgIG9uRm9udENoYW5nZWQ/OiAoZm9udEZhbWlseTogc3RyaW5nKSA9PiB2b2lkO1xuICAgIG9uRm9udFNpemVDaGFuZ2VkPzogKGZvbnRTaXplOiBzdHJpbmcpID0+IHZvaWQ7XG4gICAgb25QcmltYXJ5Q29sb3JDaGFuZ2VkPzogKGNvbG9yOiBzdHJpbmcpID0+IHZvaWQ7XG4gICAgb25DdXN0b21DU1NDaGFuZ2VkPzogKGNzczogc3RyaW5nKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgY2xhc3MgU3R5bGVFZGl0b3Ige1xuICAgIHByaXZhdGUgc2V0dGluZ3M6IFd4U2V0dGluZ3M7XG4gICAgcHJpdmF0ZSBhc3NldHNNYW5hZ2VyOiBBc3NldHNNYW5hZ2VyO1xuICAgIHByaXZhdGUgZXZlbnRzOiBTdHlsZUVkaXRvckV2ZW50cztcbiAgICBwcml2YXRlIGNvbnRhaW5lciE6IEhUTUxEaXZFbGVtZW50O1xuICAgIHByaXZhdGUgY29udGVudERpdiE6IEhUTUxEaXZFbGVtZW50O1xuICAgIHByaXZhdGUgaXNDb2xsYXBzZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgIGNvbnN0cnVjdG9yKHNldHRpbmdzOiBXeFNldHRpbmdzLCBhc3NldHNNYW5hZ2VyOiBBc3NldHNNYW5hZ2VyLCBldmVudHM6IFN0eWxlRWRpdG9yRXZlbnRzKSB7XG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBzZXR0aW5ncztcbiAgICAgICAgdGhpcy5hc3NldHNNYW5hZ2VyID0gYXNzZXRzTWFuYWdlcjtcbiAgICAgICAgdGhpcy5ldmVudHMgPSBldmVudHM7XG4gICAgfVxuXG4gICAgcmVuZGVyKCk6IEhUTUxFbGVtZW50IHtcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcbiAgICAgICAgdGhpcy5jb250YWluZXIuY2xhc3NOYW1lID0gJ3N0eWxlLWVkaXRvci1jb250YWluZXInO1xuICAgICAgICBcbiAgICAgICAgLy8g5Yib5bu65Y+v5oqY5Y+g55qE5qC35byP57yW6L6R5ZmoXG4gICAgICAgIHRoaXMuY3JlYXRlQ29sbGFwc2libGVMYXlvdXQoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOa3u+WKoOagt+W8j1xuICAgICAgICB0aGlzLmFkZFN0eWxlcygpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHRoaXMuY29udGFpbmVyO1xuICAgIH1cblxuICAgIC8vIOWPgueFp3Yy5Yib5bu65qC35byP57yW6L6R5Zmo5biD5bGAXG4gICAgcHJpdmF0ZSBjcmVhdGVDb2xsYXBzaWJsZUxheW91dCgpOiB2b2lkIHtcbiAgICAgICAgLy8g5Yib5bu65qCH6aKY5qCPXG4gICAgICAgIHRoaXMuY3JlYXRlVGl0bGVCYXIoKTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWIm+W7uuWGheWuueWMuuWfn1xuICAgICAgICB0aGlzLmNyZWF0ZUNvbnRlbnRBcmVhKCk7XG4gICAgfVxuICAgIFxuICAgIC8vIENsYXVkZSBDb2RlIFVwZGF0ZTog5L2/55SodGV4dENvbnRlbnTmm7/ku6Npbm5lckhUTUzorr7nva7pnZnmgIHmlofmnKxcbiAgICBwcml2YXRlIGNyZWF0ZVRpdGxlQmFyKCk6IHZvaWQge1xuICAgICAgICBjb25zdCB0aXRsZUJhciA9IHRoaXMuY29udGFpbmVyLmNyZWF0ZURpdih7IGNsczogJ3N0eWxlLWVkaXRvci1oZWFkZXInIH0pO1xuXG4gICAgICAgIC8vIOaKmOWPoC/lsZXlvIDmjInpkq5cbiAgICAgICAgY29uc3QgdG9nZ2xlQnV0dG9uID0gdGl0bGVCYXIuY3JlYXRlRWwoJ2J1dHRvbicsIHsgY2xzOiAnc3R5bGUtZWRpdG9yLXRvZ2dsZScgfSk7XG4gICAgICAgIHRvZ2dsZUJ1dHRvbi50ZXh0Q29udGVudCA9IHRoaXMuaXNDb2xsYXBzZWQgPyAn4pa2JyA6ICfilrwnO1xuXG4gICAgICAgIC8vIOagh+mimFxuICAgICAgICBjb25zdCB0aXRsZSA9IHRpdGxlQmFyLmNyZWF0ZUVsKCdzcGFuJywgeyBjbHM6ICdzdHlsZS1lZGl0b3ItdGl0bGUnLCB0ZXh0OiAn5qC35byP57yW6L6R5ZmoJyB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOmHjee9ruaMiemSrlxuICAgICAgICBjb25zdCByZXNldEJ1dHRvbiA9IHRpdGxlQmFyLmNyZWF0ZUVsKCdidXR0b24nLCB7IGNsczogJ3N0eWxlLWVkaXRvci1yZXNldCcsIHRleHQ6ICfph43nva4nIH0pO1xuICAgICAgICByZXNldEJ1dHRvbi50aXRsZSA9ICfph43nva7miYDmnInmoLflvI8nO1xuICAgICAgICBcbiAgICAgICAgLy8g57uR5a6a5LqL5Lu2XG4gICAgICAgIHRvZ2dsZUJ1dHRvbi5vbmNsaWNrID0gKCkgPT4gdGhpcy50b2dnbGVDb2xsYXBzZSgpO1xuICAgICAgICByZXNldEJ1dHRvbi5vbmNsaWNrID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGNvbmZpcm0oJ+ehruWumuimgemHjee9ruaJgOacieagt+W8j+iuvue9ruWQl++8nycpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ldmVudHMub25TdHlsZVJlc2V0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIC8vIENsYXVkZSBDb2RlIFVwZGF0ZTog5L2/55SoQ1NT57G76ICM6Z2e5YaF6IGU5qC35byPXG4gICAgcHJpdmF0ZSBjcmVhdGVDb250ZW50QXJlYSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jb250ZW50RGl2ID0gdGhpcy5jb250YWluZXIuY3JlYXRlRGl2KHsgY2xzOiAnc3R5bGUtZWRpdG9yLWNvbnRlbnQnIH0pO1xuICAgICAgICBpZiAodGhpcy5pc0NvbGxhcHNlZCkge1xuICAgICAgICAgICAgdGhpcy5jb250ZW50RGl2LmFkZENsYXNzKCdoaWRkZW4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY3JlYXRlVjJTdHlsZU9wdGlvbnNMYXlvdXQoKTtcbiAgICB9XG4gICAgXG4gICAgcHJpdmF0ZSBjcmVhdGVWMlN0eWxlT3B0aW9uc0xheW91dCgpOiB2b2lkIHtcbiAgICAgICAgLy8g5a6M5YWo5oyJ54WndjLnmoTlrp7njrDmlrnlvI9cbiAgICAgICAgLy8g56ys5LiA6KGM77ya5omA5pyJ5LiL5ouJ6YCJ5oup5Zmo5Zyo5ZCM5LiA6KGMXG4gICAgICAgIGNvbnN0IGZpcnN0Um93ID0gdGhpcy5jb250ZW50RGl2LmNyZWF0ZURpdih7IGNsczogJ3N0eWxlLWVkaXRvci1yb3cnIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8g5qC35byP5Li76aKY5LiL5ouJ5qGGXG4gICAgICAgIGNvbnN0IHRoZW1lR3JvdXAgPSBmaXJzdFJvdy5jcmVhdGVEaXYoeyBjbHM6ICdzdHlsZS1kcm9wZG93bi1ncm91cCcgfSk7XG4gICAgICAgIGNvbnN0IHRoZW1lTGFiZWwgPSB0aGVtZUdyb3VwLmNyZWF0ZUVsKCdsYWJlbCcsIHsgdGV4dDogJ+agt+W8jzonLCBjbHM6ICdzdHlsZS1kcm9wZG93bi1sYWJlbCcgfSk7XG4gICAgICAgIGNvbnN0IHRoZW1lU2VsZWN0ID0gdGhlbWVHcm91cC5jcmVhdGVFbCgnc2VsZWN0JywgeyBjbHM6ICdzdHlsZS1kcm9wZG93bicgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDkuLvpopjpgInpoblcbiAgICAgICAgY29uc3QgdGhlbWVzID0gdGhpcy5hc3NldHNNYW5hZ2VyLnRoZW1lcztcbiAgICAgICAgdGhlbWVzLmZvckVhY2goKHRoZW1lOiBhbnkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbiA9IHRoZW1lU2VsZWN0LmNyZWF0ZUVsKCdvcHRpb24nKTtcbiAgICAgICAgICAgIG9wdGlvbi52YWx1ZSA9IHRoZW1lLmNsYXNzTmFtZTtcbiAgICAgICAgICAgIG9wdGlvbi50ZXh0Q29udGVudCA9IHRoZW1lLm5hbWU7XG4gICAgICAgICAgICBpZiAodGhlbWUuY2xhc3NOYW1lID09PSB0aGlzLnNldHRpbmdzLmRlZmF1bHRTdHlsZSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgdGhlbWVTZWxlY3Qub25jaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cy5vblRoZW1lQ2hhbmdlZCh0aGVtZVNlbGVjdC52YWx1ZSk7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvLyDku6PnoIHpq5jkuq7kuIvmi4nmoYZcbiAgICAgICAgY29uc3QgY29kZUdyb3VwID0gZmlyc3RSb3cuY3JlYXRlRGl2KHsgY2xzOiAnc3R5bGUtZHJvcGRvd24tZ3JvdXAnIH0pO1xuICAgICAgICBjb25zdCBjb2RlTGFiZWwgPSBjb2RlR3JvdXAuY3JlYXRlRWwoJ2xhYmVsJywgeyB0ZXh0OiAn5Luj56CB6auY5LquOicsIGNsczogJ3N0eWxlLWRyb3Bkb3duLWxhYmVsJyB9KTtcbiAgICAgICAgY29uc3QgY29kZVNlbGVjdCA9IGNvZGVHcm91cC5jcmVhdGVFbCgnc2VsZWN0JywgeyBjbHM6ICdzdHlsZS1kcm9wZG93bicgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyDmt7vliqDpq5jkuq7pgInpobnlubbljrvph41cbiAgICAgICAgY29uc3QgaGlnaGxpZ2h0cyA9IHRoaXMuYXNzZXRzTWFuYWdlci5oaWdobGlnaHRzO1xuICAgICAgICBjb25zdCBhZGRlZE5hbWVzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICAgIFxuICAgICAgICBoaWdobGlnaHRzLmZvckVhY2goKGhpZ2hsaWdodDogYW55KSA9PiB7XG4gICAgICAgICAgICBpZiAoIWFkZGVkTmFtZXMuaGFzKGhpZ2hsaWdodC5uYW1lKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbiA9IGNvZGVTZWxlY3QuY3JlYXRlRWwoJ29wdGlvbicpO1xuICAgICAgICAgICAgICAgIG9wdGlvbi52YWx1ZSA9IGhpZ2hsaWdodC5uYW1lO1xuICAgICAgICAgICAgICAgIG9wdGlvbi50ZXh0Q29udGVudCA9IGhpZ2hsaWdodC5uYW1lO1xuICAgICAgICAgICAgICAgIGlmIChoaWdobGlnaHQubmFtZSA9PT0gdGhpcy5zZXR0aW5ncy5kZWZhdWx0SGlnaGxpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFkZGVkTmFtZXMuYWRkKGhpZ2hsaWdodC5uYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBjb2RlU2VsZWN0Lm9uY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5ldmVudHMub25IaWdobGlnaHRDaGFuZ2VkKGNvZGVTZWxlY3QudmFsdWUpO1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgLy8g5a2X5L2T5LiL5ouJ5qGGXG4gICAgICAgIGNvbnN0IGZvbnRHcm91cCA9IGZpcnN0Um93LmNyZWF0ZURpdih7IGNsczogJ3N0eWxlLWRyb3Bkb3duLWdyb3VwJyB9KTtcbiAgICAgICAgY29uc3QgZm9udExhYmVsID0gZm9udEdyb3VwLmNyZWF0ZUVsKCdsYWJlbCcsIHsgdGV4dDogJ+Wtl+S9kzonLCBjbHM6ICdzdHlsZS1kcm9wZG93bi1sYWJlbCcgfSk7XG4gICAgICAgIGNvbnN0IGZvbnRTZWxlY3QgPSBmb250R3JvdXAuY3JlYXRlRWwoJ3NlbGVjdCcsIHsgY2xzOiAnc3R5bGUtZHJvcGRvd24nIH0pO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgZm9udE9wdGlvbnMgPSBbXG4gICAgICAgICAgICB7IHZhbHVlOiAnZGVuZ3hpYW4nLCB0ZXh0OiAn562J57q/JyB9LFxuICAgICAgICAgICAgeyB2YWx1ZTogJ3NhbnMtc2VyaWYnLCB0ZXh0OiAn5peg6KGs57q/JyB9LFxuICAgICAgICAgICAgeyB2YWx1ZTogJ3NlcmlmJywgdGV4dDogJ+ihrOe6vycgfSxcbiAgICAgICAgICAgIHsgdmFsdWU6ICdtb25vc3BhY2UnLCB0ZXh0OiAn562J5a69JyB9XG4gICAgICAgIF07XG4gICAgICAgIFxuICAgICAgICBmb250T3B0aW9ucy5mb3JFYWNoKGZvbnQgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9uID0gZm9udFNlbGVjdC5jcmVhdGVFbCgnb3B0aW9uJyk7XG4gICAgICAgICAgICBvcHRpb24udmFsdWUgPSBmb250LnZhbHVlO1xuICAgICAgICAgICAgb3B0aW9uLnRleHQgPSBmb250LnRleHQ7XG4gICAgICAgICAgICAvLyDmoLnmja7orr7nva7pgInkuK3lvZPliY3lrZfkvZNcbiAgICAgICAgICAgIGlmIChmb250LnRleHQgPT09IHRoaXMuc2V0dGluZ3MuZm9udEZhbWlseSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8g5a2X5L2T5Y+Y5pu05LqL5Lu2XG4gICAgICAgIGZvbnRTZWxlY3Qub25jaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzZWxlY3RlZE9wdGlvbiA9IGZvbnRTZWxlY3Qub3B0aW9uc1tmb250U2VsZWN0LnNlbGVjdGVkSW5kZXhdO1xuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5mb250RmFtaWx5ID0gc2VsZWN0ZWRPcHRpb24udGV4dDtcbiAgICAgICAgICAgIGlmICh0aGlzLmV2ZW50cy5vbkZvbnRDaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ldmVudHMub25Gb250Q2hhbmdlZChzZWxlY3RlZE9wdGlvbi50ZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgXG4gICAgICAgIC8vIOWtl+WPt+S4i+aLieahhiAgXG4gICAgICAgIGNvbnN0IHNpemVHcm91cCA9IGZpcnN0Um93LmNyZWF0ZURpdih7IGNsczogJ3N0eWxlLWRyb3Bkb3duLWdyb3VwJyB9KTtcbiAgICAgICAgY29uc3Qgc2l6ZUxhYmVsID0gc2l6ZUdyb3VwLmNyZWF0ZUVsKCdsYWJlbCcsIHsgdGV4dDogJ+Wtl+WPtzonLCBjbHM6ICdzdHlsZS1kcm9wZG93bi1sYWJlbCcgfSk7XG4gICAgICAgIGNvbnN0IHNpemVTZWxlY3QgPSBzaXplR3JvdXAuY3JlYXRlRWwoJ3NlbGVjdCcsIHsgY2xzOiAnc3R5bGUtZHJvcGRvd24nIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gQ2xhdWRlIENvZGUgVXBkYXRlOiDosIPmlbTlrZflj7fpgInpobnvvIzljrvmjokxNXB45ZKMMTdweO+8jOWinuWKoDIwcHjjgIEyMnB444CBMjRweFxuICAgICAgICBjb25zdCBzaXplT3B0aW9ucyA9IFtcbiAgICAgICAgICAgIHsgdmFsdWU6ICcxNHB4JywgdGV4dDogJzE0cHgnIH0sXG4gICAgICAgICAgICB7IHZhbHVlOiAnMTZweCcsIHRleHQ6ICcxNnB4ICjmjqjojZApJyB9LFxuICAgICAgICAgICAgeyB2YWx1ZTogJzE4cHgnLCB0ZXh0OiAnMThweCcgfSxcbiAgICAgICAgICAgIHsgdmFsdWU6ICcyMHB4JywgdGV4dDogJzIwcHgnIH0sXG4gICAgICAgICAgICB7IHZhbHVlOiAnMjJweCcsIHRleHQ6ICcyMnB4JyB9LFxuICAgICAgICAgICAgeyB2YWx1ZTogJzI0cHgnLCB0ZXh0OiAnMjRweCcgfVxuICAgICAgICBdO1xuICAgICAgICBcbiAgICAgICAgc2l6ZU9wdGlvbnMuZm9yRWFjaChzaXplID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbiA9IHNpemVTZWxlY3QuY3JlYXRlRWwoJ29wdGlvbicpO1xuICAgICAgICAgICAgb3B0aW9uLnZhbHVlID0gc2l6ZS52YWx1ZTtcbiAgICAgICAgICAgIG9wdGlvbi50ZXh0ID0gc2l6ZS50ZXh0O1xuICAgICAgICAgICAgLy8gQ2xhdWRlIENvZGUgVXBkYXRlOiDmoLnmja7orr7nva7pgInkuK3lvZPliY3lrZflj7fvvIznm7TmjqXmr5TovoN2YWx1ZeWAvFxuICAgICAgICAgICAgaWYgKHNpemUudmFsdWUgPT09IHRoaXMuc2V0dGluZ3MuZm9udFNpemUgfHxcbiAgICAgICAgICAgICAgICAodGhpcy5zZXR0aW5ncy5mb250U2l6ZSA9PT0gJ+aOqOiNkCcgJiYgc2l6ZS52YWx1ZSA9PT0gJzE2cHgnKSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbi5zZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gQ2xhdWRlIENvZGUgVXBkYXRlOiDlrZflj7flj5jmm7Tkuovku7YgLSDnm7TmjqXkvb/nlKjlg4/ntKDlgLxcbiAgICAgICAgc2l6ZVNlbGVjdC5vbmNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGZvbnRTaXplID0gc2l6ZVNlbGVjdC52YWx1ZTsgLy8g55u05o6l5L2/55SodmFsdWXlgLzvvIjlpoIgXCIxNnB4XCIsIFwiMjJweFwi77yJXG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLmZvbnRTaXplID0gZm9udFNpemU7XG4gICAgICAgICAgICBpZiAodGhpcy5ldmVudHMub25Gb250U2l6ZUNoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmV2ZW50cy5vbkZvbnRTaXplQ2hhbmdlZChmb250U2l6ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICAvLyBDbGF1ZGUgQ29kZSBVcGRhdGU6IOS4u+mimOiJsuS4i+aLieahhiAtIOWinuWKoOiHquWumuS5iemAiemhuVxuICAgICAgICBjb25zdCBjb2xvckdyb3VwID0gZmlyc3RSb3cuY3JlYXRlRGl2KHsgY2xzOiAnc3R5bGUtZHJvcGRvd24tZ3JvdXAnIH0pO1xuICAgICAgICBjb25zdCBjb2xvckxhYmVsID0gY29sb3JHcm91cC5jcmVhdGVFbCgnbGFiZWwnLCB7IHRleHQ6ICfkuLvpopjoibI6JywgY2xzOiAnc3R5bGUtZHJvcGRvd24tbGFiZWwnIH0pO1xuICAgICAgICBjb25zdCBjb2xvclNlbGVjdCA9IGNvbG9yR3JvdXAuY3JlYXRlRWwoJ3NlbGVjdCcsIHsgY2xzOiAnc3R5bGUtZHJvcGRvd24nIH0pO1xuXG4gICAgICAgIGNvbnN0IGNvbG9yT3B0aW9ucyA9IFtcbiAgICAgICAgICAgIHsgdmFsdWU6ICcjMmQzNzQ4JywgdGV4dDogJ+efs+WiqOm7kScgfSxcbiAgICAgICAgICAgIHsgdmFsdWU6ICcjM2I4MmY2JywgdGV4dDogJ+e7j+WFuOiTnScgfSxcbiAgICAgICAgICAgIHsgdmFsdWU6ICcjMTBiOTgxJywgdGV4dDogJ+e/oOe7vycgfSxcbiAgICAgICAgICAgIHsgdmFsdWU6ICcjZjU5ZTBiJywgdGV4dDogJ+apmem7hCcgfSxcbiAgICAgICAgICAgIHsgdmFsdWU6ICcjZWY0NDQ0JywgdGV4dDogJ+acsee6oicgfSxcbiAgICAgICAgICAgIHsgdmFsdWU6ICcjOGI1Y2Y2JywgdGV4dDogJ+e0q+e9l+WFsCcgfVxuICAgICAgICBdO1xuXG4gICAgICAgIGxldCBpc0N1c3RvbUNvbG9yID0gdHJ1ZTtcbiAgICAgICAgY29sb3JPcHRpb25zLmZvckVhY2goY29sb3IgPT4ge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9uID0gY29sb3JTZWxlY3QuY3JlYXRlRWwoJ29wdGlvbicpO1xuICAgICAgICAgICAgb3B0aW9uLnZhbHVlID0gY29sb3IudmFsdWU7XG4gICAgICAgICAgICBvcHRpb24udGV4dCA9IGNvbG9yLnRleHQ7XG4gICAgICAgICAgICAvLyDmoLnmja7orr7nva7pgInkuK3lvZPliY3kuLvpopjoibJcbiAgICAgICAgICAgIGlmIChjb2xvci52YWx1ZSA9PT0gdGhpcy5zZXR0aW5ncy5wcmltYXJ5Q29sb3IpIHtcbiAgICAgICAgICAgICAgICBvcHRpb24uc2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGlzQ3VzdG9tQ29sb3IgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8g5re75YqgXCLoh6rlrprkuYlcIumAiemhuVxuICAgICAgICBjb25zdCBjdXN0b21PcHRpb24gPSBjb2xvclNlbGVjdC5jcmVhdGVFbCgnb3B0aW9uJyk7XG4gICAgICAgIGN1c3RvbU9wdGlvbi52YWx1ZSA9ICdjdXN0b20nO1xuICAgICAgICBjdXN0b21PcHRpb24udGV4dCA9ICfoh6rlrprkuYknO1xuXG4gICAgICAgIC8vIOWmguaenOW9k+WJjeminOiJsuS4jeWcqOmihOiuvuS4re+8jOmAieS4reiHquWumuS5iemAiemhueW5tuaYvuekuuW9k+WJjeminOiJslxuICAgICAgICBpZiAoaXNDdXN0b21Db2xvciAmJiB0aGlzLnNldHRpbmdzLnByaW1hcnlDb2xvcikge1xuICAgICAgICAgICAgY3VzdG9tT3B0aW9uLnNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGN1c3RvbU9wdGlvbi50ZXh0ID0gYOiHquWumuS5iSAoJHt0aGlzLnNldHRpbmdzLnByaW1hcnlDb2xvcn0pYDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOWIm+W7uuminOiJsumAieaLqeWZqO+8iOWni+e7iOWtmOWcqOS9huWPr+iDvemakOiXj++8iVxuICAgICAgICBjb25zdCBjb2xvcklucHV0V3JhcHBlciA9IGNvbG9yR3JvdXAuY3JlYXRlRGl2KHsgY2xzOiAnY29sb3ItaW5wdXQtd3JhcHBlcicgfSk7XG4gICAgICAgIGNvbnN0IGNvbG9ySW5wdXQgPSBjb2xvcklucHV0V3JhcHBlci5jcmVhdGVFbCgnaW5wdXQnLCB7XG4gICAgICAgICAgICB0eXBlOiAnY29sb3InLFxuICAgICAgICAgICAgY2xzOiAnY3VzdG9tLWNvbG9yLWlucHV0J1xuICAgICAgICB9KTtcbiAgICAgICAgY29sb3JJbnB1dC52YWx1ZSA9IHRoaXMuc2V0dGluZ3MucHJpbWFyeUNvbG9yIHx8ICcjMmQzNzQ4JztcblxuICAgICAgICAvLyBDbGF1ZGUgQ29kZSBVcGRhdGU6IOS9v+eUqENTU+exu+iAjOmdnuWGheiBlOagt+W8j1xuICAgICAgICAvLyDlpoLmnpzmmK/oh6rlrprkuYnpopzoibLvvIzmmL7npLrpopzoibLpgInmi6nlmahcbiAgICAgICAgaWYgKGlzQ3VzdG9tQ29sb3IgJiYgdGhpcy5zZXR0aW5ncy5wcmltYXJ5Q29sb3IpIHtcbiAgICAgICAgICAgIGNvbG9ySW5wdXRXcmFwcGVyLnJlbW92ZUNsYXNzKCdoaWRkZW4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbG9ySW5wdXRXcmFwcGVyLmFkZENsYXNzKCdoaWRkZW4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENsYXVkZSBDb2RlIFVwZGF0ZTog5L2/55SoQ1NT57G76ICM6Z2e5YaF6IGU5qC35byPXG4gICAgICAgIC8vIOS4u+mimOiJsuS4i+aLieahhuWPmOabtOS6i+S7tlxuICAgICAgICBjb2xvclNlbGVjdC5vbmNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNlbGVjdGVkVmFsdWUgPSBjb2xvclNlbGVjdC52YWx1ZTtcblxuICAgICAgICAgICAgaWYgKHNlbGVjdGVkVmFsdWUgPT09ICdjdXN0b20nKSB7XG4gICAgICAgICAgICAgICAgLy8g5pi+56S66aKc6Imy6YCJ5oup5ZmoXG4gICAgICAgICAgICAgICAgY29sb3JJbnB1dFdyYXBwZXIucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpO1xuICAgICAgICAgICAgICAgIC8vIOS9v+eUqOminOiJsumAieaLqeWZqOeahOW9k+WJjeWAvFxuICAgICAgICAgICAgICAgIGNvbnN0IGN1c3RvbUNvbG9yID0gY29sb3JJbnB1dC52YWx1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLnNldHRpbmdzLnByaW1hcnlDb2xvciA9IGN1c3RvbUNvbG9yO1xuICAgICAgICAgICAgICAgIGN1c3RvbU9wdGlvbi50ZXh0ID0gYOiHquWumuS5iSAoJHtjdXN0b21Db2xvcn0pYDtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ldmVudHMub25QcmltYXJ5Q29sb3JDaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRzLm9uUHJpbWFyeUNvbG9yQ2hhbmdlZChjdXN0b21Db2xvcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyDpmpDol4/popzoibLpgInmi6nlmajvvIzkvb/nlKjpooTorr7popzoibJcbiAgICAgICAgICAgICAgICBjb2xvcklucHV0V3JhcHBlci5hZGRDbGFzcygnaGlkZGVuJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5wcmltYXJ5Q29sb3IgPSBzZWxlY3RlZFZhbHVlO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmV2ZW50cy5vblByaW1hcnlDb2xvckNoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5ldmVudHMub25QcmltYXJ5Q29sb3JDaGFuZ2VkKHNlbGVjdGVkVmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvLyDpopzoibLpgInmi6nlmajlj5jmm7Tkuovku7ZcbiAgICAgICAgY29sb3JJbnB1dC5vbmlucHV0ID0gKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3VzdG9tQ29sb3IgPSBjb2xvcklucHV0LnZhbHVlO1xuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5wcmltYXJ5Q29sb3IgPSBjdXN0b21Db2xvcjtcbiAgICAgICAgICAgIGN1c3RvbU9wdGlvbi50ZXh0ID0gYOiHquWumuS5iSAoJHtjdXN0b21Db2xvcn0pYDtcbiAgICAgICAgICAgIGlmICh0aGlzLmV2ZW50cy5vblByaW1hcnlDb2xvckNoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmV2ZW50cy5vblByaW1hcnlDb2xvckNoYW5nZWQoY3VzdG9tQ29sb3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgLy8g56ys5LqM6KGM77ya6Ieq5a6a5LmJQ1NT5qCH562+XG4gICAgICAgIGNvbnN0IHNlY29uZFJvdyA9IHRoaXMuY29udGVudERpdi5jcmVhdGVEaXYoeyBjbHM6ICdzdHlsZS1lZGl0b3ItY3NzLXJvdycgfSk7XG4gICAgICAgIGNvbnN0IGNzc0xhYmVsID0gc2Vjb25kUm93LmNyZWF0ZURpdih7IGNsczogJ3N0eWxlLWNzcy1sYWJlbCcsIHRleHQ6ICfoh6rlrprkuYlDU1M6JyB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIOesrOS4ieihjO+8mkNTU+aWh+acrOWMuuWfn++8iOWujOaVtOWuveW6pu+8iVxuICAgICAgICBjb25zdCBjc3NUZXh0YXJlYSA9IHRoaXMuY29udGVudERpdi5jcmVhdGVFbCgndGV4dGFyZWEnLCB7IFxuICAgICAgICAgICAgY2xzOiAnc3R5bGUtZWRpdG9yLWNzcy10ZXh0YXJlYScsXG4gICAgICAgICAgICBhdHRyOiB7IHBsYWNlaG9sZGVyOiAnLyog5Zyo6L+Z6YeM6L6T5YWl6Ieq5a6a5LmJQ1NT5qC35byPICovJywgcm93czogJzQnIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyDmoLnmja7orr7nva7mmL7npLrlvZPliY3oh6rlrprkuYlDU1NcbiAgICAgICAgY3NzVGV4dGFyZWEudmFsdWUgPSB0aGlzLnNldHRpbmdzLmN1c3RvbUNTUyB8fCAnJztcbiAgICAgICAgXG4gICAgICAgIC8vIOiHquWumuS5iUNTU+WPmOabtOS6i+S7tu+8iOmYsuaKluWkhOeQhu+8iVxuICAgICAgICBsZXQgY3NzVGltZW91dDogTm9kZUpTLlRpbWVvdXQ7XG4gICAgICAgIGNzc1RleHRhcmVhLm9uaW5wdXQgPSAoKSA9PiB7XG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoY3NzVGltZW91dCk7XG4gICAgICAgICAgICBjc3NUaW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5jdXN0b21DU1MgPSBjc3NUZXh0YXJlYS52YWx1ZTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5ldmVudHMub25DdXN0b21DU1NDaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXZlbnRzLm9uQ3VzdG9tQ1NTQ2hhbmdlZChjc3NUZXh0YXJlYS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgNTAwKTsgLy8gNTAwbXPpmLLmipZcbiAgICAgICAgfTtcbiAgICB9XG4gICAgXG4gICAgLy8gQ2xhdWRlIENvZGUgVXBkYXRlOiDkvb/nlKh0ZXh0Q29udGVudOabv+S7o2lubmVySFRNTOiuvue9rumdmeaAgeaWh+acrFxuICAgIHByaXZhdGUgdG9nZ2xlQ29sbGFwc2UoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuaXNDb2xsYXBzZWQgPSAhdGhpcy5pc0NvbGxhcHNlZDtcblxuICAgICAgICBjb25zdCB0b2dnbGVCdXR0b24gPSB0aGlzLmNvbnRhaW5lci5xdWVyeVNlbGVjdG9yKCcuc3R5bGUtZWRpdG9yLXRvZ2dsZScpIGFzIEhUTUxCdXR0b25FbGVtZW50O1xuICAgICAgICBjb25zdCBjb250ZW50RGl2ID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignLnN0eWxlLWVkaXRvci1jb250ZW50JykgYXMgSFRNTERpdkVsZW1lbnQ7XG5cbiAgICAgICAgaWYgKHRoaXMuaXNDb2xsYXBzZWQpIHtcbiAgICAgICAgICAgIHRvZ2dsZUJ1dHRvbi50ZXh0Q29udGVudCA9ICfilrYnO1xuICAgICAgICAgICAgY29udGVudERpdi5hZGRDbGFzcygnaGlkZGVuJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0b2dnbGVCdXR0b24udGV4dENvbnRlbnQgPSAn4pa8JztcbiAgICAgICAgICAgIGNvbnRlbnREaXYucmVtb3ZlQ2xhc3MoJ2hpZGRlbicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhZGRTdHlsZXMoKTogdm9pZCB7XG4gICAgICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3R5bGUtZWRpdG9yLWNzcycpKSByZXR1cm47XG4gICAgICAgIFxuICAgICAgICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgIHN0eWxlLmlkID0gJ3N0eWxlLWVkaXRvci1jc3MnO1xuICAgICAgICBzdHlsZS50ZXh0Q29udGVudCA9IGBcbiAgICAgICAgICAgIC8qIOaWsHRvb2xiYXLmoLflvI/vvIzljLnphY3lm77niYforr7orqEgKi9cbiAgICAgICAgICAgIC5zdHlsZS1lZGl0b3ItY29udGFpbmVyIHtcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAjZjhmOGY4O1xuICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgICAgICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG4gICAgICAgICAgICAgICAgbWFyZ2luOiA4cHggMDtcbiAgICAgICAgICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAuc3R5bGUtZWRpdG9yLWhlYWRlciB7XG4gICAgICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgICAgICAgIHBhZGRpbmc6IDhweCAxMnB4O1xuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICNmOGY4Zjg7XG4gICAgICAgICAgICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbiAgICAgICAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC5zdHlsZS1lZGl0b3ItdG9nZ2xlIHtcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiBub25lO1xuICAgICAgICAgICAgICAgIGJvcmRlcjogbm9uZTtcbiAgICAgICAgICAgICAgICBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG4gICAgICAgICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgICAgICAgIHBhZGRpbmc6IDJweCA2cHg7XG4gICAgICAgICAgICAgICAgbWFyZ2luLXJpZ2h0OiA4cHg7XG4gICAgICAgICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDNweDtcbiAgICAgICAgICAgICAgICB0cmFuc2l0aW9uOiBiYWNrZ3JvdW5kLWNvbG9yIDAuMnMgZWFzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLnN0eWxlLWVkaXRvci10b2dnbGU6aG92ZXIge1xuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItaG92ZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAuc3R5bGUtZWRpdG9yLXRpdGxlIHtcbiAgICAgICAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICAgICAgICAgIGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7XG4gICAgICAgICAgICAgICAgZm9udC1zaXplOiAxNHB4O1xuICAgICAgICAgICAgICAgIGZsZXg6IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC5zdHlsZS1lZGl0b3ItcmVzZXQge1xuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IG5vbmU7XG4gICAgICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuICAgICAgICAgICAgICAgIGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiA0cHggOHB4O1xuICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgICAgICAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgICAgICAgY3Vyc29yOiBwb2ludGVyO1xuICAgICAgICAgICAgICAgIHRyYW5zaXRpb246IGFsbCAwLjJzIGVhc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC5zdHlsZS1lZGl0b3ItcmVzZXQ6aG92ZXIge1xuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItaG92ZXIpO1xuICAgICAgICAgICAgICAgIGJvcmRlci1jb2xvcjogdmFyKC0taW50ZXJhY3RpdmUtYWNjZW50KTtcbiAgICAgICAgICAgICAgICBjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAuc3R5bGUtZWRpdG9yLWNvbnRlbnQge1xuICAgICAgICAgICAgICAgIHBhZGRpbmc6IDEycHg7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogI2Y4ZjhmODtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLnN0eWxlLWVkaXRvci1yb3cge1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICAgICAgICBnYXA6IDEycHg7XG4gICAgICAgICAgICAgICAgbWFyZ2luOiA4cHggMDtcbiAgICAgICAgICAgICAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC5zdHlsZS1kcm9wZG93bi1ncm91cCB7XG4gICAgICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgICAgICAgICAgICAgIGdhcDogNHB4O1xuICAgICAgICAgICAgICAgIGZsZXgtc2hyaW5rOiAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAuc3R5bGUtZHJvcGRvd24tbGFiZWwge1xuICAgICAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gICAgICAgICAgICAgICAgY29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTtcbiAgICAgICAgICAgICAgICBmb250LXNpemU6IDE0cHg7XG4gICAgICAgICAgICAgICAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgICAgICAgICAgICAgICBtaW4td2lkdGg6IGZpdC1jb250ZW50O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvKiBDbGF1ZGUgQ29kZSBBREQ6IOminOiJsumAieaLqeWZqOagt+W8jyAqL1xuICAgICAgICAgICAgLmNvbG9yLWlucHV0LXdyYXBwZXIge1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgICAgICAgICAgICAgICBtYXJnaW4tbGVmdDogNHB4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAuY29sb3ItaW5wdXQtd3JhcHBlci5oaWRkZW4ge1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IG5vbmU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC5zdHlsZS1lZGl0b3ItY29udGVudC5oaWRkZW4ge1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IG5vbmU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC5jdXN0b20tY29sb3ItaW5wdXQge1xuICAgICAgICAgICAgICAgIHdpZHRoOiAzMnB4O1xuICAgICAgICAgICAgICAgIGhlaWdodDogMjhweDtcbiAgICAgICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG4gICAgICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNHB4O1xuICAgICAgICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAycHg7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gICAgICAgICAgICAgICAgdmVydGljYWwtYWxpZ246IG1pZGRsZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLmN1c3RvbS1jb2xvci1pbnB1dDpob3ZlciB7XG4gICAgICAgICAgICAgICAgYm9yZGVyLWNvbG9yOiB2YXIoLS1pbnRlcmFjdGl2ZS1hY2NlbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAuc3R5bGUtZHJvcGRvd24ge1xuICAgICAgICAgICAgICAgIHBhZGRpbmc6IDJweCA2cHg7XG4gICAgICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgI2ZmZmZmZjtcbiAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiAzcHg7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1wcmltYXJ5KTtcbiAgICAgICAgICAgICAgICBjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpO1xuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICAgICAgICAgICAgICBjdXJzb3I6IHBvaW50ZXI7XG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbjogYm9yZGVyLWNvbG9yIDAuMnMgZWFzZTtcbiAgICAgICAgICAgICAgICBtaW4td2lkdGg6IDcwcHg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC5zdHlsZS1kcm9wZG93bjpob3ZlciB7XG4gICAgICAgICAgICAgICAgYm9yZGVyLWNvbG9yOiB2YXIoLS1pbnRlcmFjdGl2ZS1hY2NlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAuc3R5bGUtZHJvcGRvd246Zm9jdXMge1xuICAgICAgICAgICAgICAgIG91dGxpbmU6IG5vbmU7XG4gICAgICAgICAgICAgICAgYm9yZGVyLWNvbG9yOiB2YXIoLS1pbnRlcmFjdGl2ZS1hY2NlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAuc3R5bGUtZWRpdG9yLWNzcy1yb3cge1xuICAgICAgICAgICAgICAgIG1hcmdpbjogMTJweCAwIDZweCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAuc3R5bGUtY3NzLWxhYmVsIHtcbiAgICAgICAgICAgICAgICBmb250LXdlaWdodDogbm9ybWFsO1xuICAgICAgICAgICAgICAgIGNvbG9yOiB2YXIoLS10ZXh0LW5vcm1hbCk7XG4gICAgICAgICAgICAgICAgZm9udC1zaXplOiAxNHB4O1xuICAgICAgICAgICAgICAgIG1hcmdpbi1ib3R0b206IDZweDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLnN0eWxlLWVkaXRvci1jc3MtdGV4dGFyZWEge1xuICAgICAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgICAgIG1pbi1oZWlnaHQ6IDgwcHg7XG4gICAgICAgICAgICAgICAgcGFkZGluZzogOHB4O1xuICAgICAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbiAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiA0cHg7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogI2ZmZmZmZjtcbiAgICAgICAgICAgICAgICBjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpO1xuICAgICAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICAgICAgICBmb250LWZhbWlseTogdmFyKC0tZm9udC1tb25vc3BhY2UpO1xuICAgICAgICAgICAgICAgIHJlc2l6ZTogdmVydGljYWw7XG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbjogYm9yZGVyLWNvbG9yIDAuMnMgZWFzZTtcbiAgICAgICAgICAgICAgICBib3gtc2l6aW5nOiBib3JkZXItYm94O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAuc3R5bGUtZWRpdG9yLWNzcy10ZXh0YXJlYTpmb2N1cyB7XG4gICAgICAgICAgICAgICAgb3V0bGluZTogbm9uZTtcbiAgICAgICAgICAgICAgICBib3JkZXItY29sb3I6IHZhcigtLWludGVyYWN0aXZlLWFjY2VudCk7XG4gICAgICAgICAgICAgICAgYm94LXNoYWRvdzogMCAwIDAgMXB4IHZhcigtLWludGVyYWN0aXZlLWFjY2VudC1ob3Zlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC5zdHlsZS1lZGl0b3ItY3NzLXRleHRhcmVhOjpwbGFjZWhvbGRlciB7XG4gICAgICAgICAgICAgICAgY29sb3I6IHZhcigtLXRleHQtZmFpbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAvKiDmjInpkq7moLflvI8gKi9cbiAgICAgICAgICAgIC5idXR0b24tZ3JvdXAge1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICAgICAgICBnYXA6IDZweDtcbiAgICAgICAgICAgICAgICBtYXJnaW4tbGVmdDogMTJweDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLmljb24tYnV0dG9uIHtcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpO1xuICAgICAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbiAgICAgICAgICAgICAgICBjb2xvcjogdmFyKC0tdGV4dC1ub3JtYWwpO1xuICAgICAgICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiA0cHggNnB4O1xuICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDNweDtcbiAgICAgICAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbjogYWxsIDAuMnMgZWFzZTtcbiAgICAgICAgICAgICAgICBtaW4td2lkdGg6IDI4cHg7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAyOHB4O1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLmljb24tYnV0dG9uOmhvdmVyIHtcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWhvdmVyKTtcbiAgICAgICAgICAgICAgICBib3JkZXItY29sb3I6IHZhcigtLWludGVyYWN0aXZlLWFjY2VudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC5pY29uLWJ1dHRvbjphY3RpdmUge1xuICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMC45NSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8qIOWPs+S4iuinkuaMiemSrue7hOagt+W8jyAqL1xuICAgICAgICAgICAgLnRvb2xiYXItYnV0dG9ucyB7XG4gICAgICAgICAgICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgICAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICAgICAgICAgICAgICAgIGdhcDogOHB4O1xuICAgICAgICAgICAgICAgIG1hcmdpbi1ib3R0b206IDhweDtcbiAgICAgICAgICAgICAgICBmbGV4LXdyYXA6IHdyYXA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC50b29sYmFyLWJ1dHRvbiB7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogI2ZmZmZmZjtcbiAgICAgICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjZDFkNWRhO1xuICAgICAgICAgICAgICAgIGNvbG9yOiAjMjQyOTJlO1xuICAgICAgICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiA2cHggMTJweDtcbiAgICAgICAgICAgICAgICBib3JkZXItcmFkaXVzOiAzcHg7XG4gICAgICAgICAgICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgICAgICAgICAgICAgIHRyYW5zaXRpb246IGFsbCAwLjE1cyBlYXNlO1xuICAgICAgICAgICAgICAgIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gICAgICAgICAgICAgICAgbWFyZ2luLXJpZ2h0OiA4cHg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC50b29sYmFyLWJ1dHRvbjpob3ZlciB7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogI2YzZjRmNjtcbiAgICAgICAgICAgICAgICBib3JkZXItY29sb3I6ICM5NTlkYTU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC50b29sYmFyLWJ1dHRvbjphY3RpdmUge1xuICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMC45OCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8qIOaWsHRvb2xiYXLmjInpkq7moLflvI8gKi9cbiAgICAgICAgICAgIC50b29sYmFyLWJ1dHRvbnMtaW5saW5lIHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgICAgICAgICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAgICAgICAgICAgZ2FwOiA0cHg7XG4gICAgICAgICAgICAgICAgbWFyZ2luLWxlZnQ6IGF1dG87XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC5pY29uLWJ1dHRvbiB7XG4gICAgICAgICAgICAgICAgYmFja2dyb3VuZDogI2ZmZmZmZjtcbiAgICAgICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjZDFkNWRhO1xuICAgICAgICAgICAgICAgIGNvbG9yOiAjNTg2MDY5O1xuICAgICAgICAgICAgICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAwO1xuICAgICAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgICAgICAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvbjogYWxsIDAuMTVzIGVhc2U7XG4gICAgICAgICAgICAgICAgd2lkdGg6IDI4cHg7XG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAyOHB4O1xuICAgICAgICAgICAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICAgICAgICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgICAgICAgICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgICAgICAgICAgICBmb250LXdlaWdodDogbm9ybWFsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAuaWNvbi1idXR0b246aG92ZXIge1xuICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6ICNmM2Y0ZjY7XG4gICAgICAgICAgICAgICAgYm9yZGVyLWNvbG9yOiAjOTU5ZGE1O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgXG4gICAgICAgICAgICAuaWNvbi1idXR0b246YWN0aXZlIHtcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAjZTFlNGU4O1xuICAgICAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMC45OCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIGA7XG4gICAgICAgIFxuICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcbiAgICB9XG5cbiAgICByZWZyZXNoKCk6IHZvaWQge1xuICAgICAgICAvLyDliLfmlrBVSeeKtuaAge+8jOmAgumFjeaWsOeahOWPr+aKmOWPoOW4g+WxgFxuICAgICAgICBjb25zdCBjb250ZW50RGl2ID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignLnN0eWxlLWVkaXRvci1jb250ZW50Jyk7XG4gICAgICAgIGlmICghY29udGVudERpdikgcmV0dXJuO1xuICAgICAgICBcbiAgICAgICAgY29uc3QgZHJvcGRvd25Hcm91cHMgPSBjb250ZW50RGl2LnF1ZXJ5U2VsZWN0b3JBbGwoJy5zdHlsZS1kcm9wZG93bi1ncm91cCcpO1xuICAgICAgICBcbiAgICAgICAgLy8g56ys5LiA5Liq5piv5Li76aKY6YCJ5oup5ZmoXG4gICAgICAgIGNvbnN0IHRoZW1lU2VsZWN0ID0gZHJvcGRvd25Hcm91cHNbMF0/LnF1ZXJ5U2VsZWN0b3IoJ3NlbGVjdCcpIGFzIEhUTUxTZWxlY3RFbGVtZW50O1xuICAgICAgICBpZiAodGhlbWVTZWxlY3QpIHtcbiAgICAgICAgICAgIHRoZW1lU2VsZWN0LnZhbHVlID0gdGhpcy5zZXR0aW5ncy5kZWZhdWx0U3R5bGU7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOesrOS6jOS4quaYr+S7o+eggemrmOS6rumAieaLqeWZqFxuICAgICAgICBjb25zdCBoaWdobGlnaHRTZWxlY3QgPSBkcm9wZG93bkdyb3Vwc1sxXT8ucXVlcnlTZWxlY3Rvcignc2VsZWN0JykgYXMgSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgICAgIGlmIChoaWdobGlnaHRTZWxlY3QpIHtcbiAgICAgICAgICAgIGhpZ2hsaWdodFNlbGVjdC52YWx1ZSA9IHRoaXMuc2V0dGluZ3MuZGVmYXVsdEhpZ2hsaWdodDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyDmt7vliqDliIfmjaLmipjlj6DnirbmgIHnmoTlhazlhbHmlrnms5VcbiAgICBwdWJsaWMgc2V0Q29sbGFwc2VkKGNvbGxhcHNlZDogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5pc0NvbGxhcHNlZCAhPT0gY29sbGFwc2VkKSB7XG4gICAgICAgICAgICB0aGlzLnRvZ2dsZUNvbGxhcHNlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcHVibGljIGdldENvbGxhcHNlZCgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaXNDb2xsYXBzZWQ7XG4gICAgfVxuXG4gICAgLy8gQ2xhdWRlIENvZGUgQUREOiDmm7TmlrDkuIvmi4nmoYblkozovpPlhaXmoYbpgInkuK3nirbmgIFcbiAgICAvLyBDbGF1ZGUgQ29kZSBVcGRhdGVcbiAgICBwdWJsaWMgdXBkYXRlU2VsZWN0aW9ucyhcbiAgICAgICAgdGhlbWU6IHN0cmluZyxcbiAgICAgICAgaGlnaGxpZ2h0OiBzdHJpbmcsXG4gICAgICAgIGZvbnQ/OiBzdHJpbmcsXG4gICAgICAgIGZvbnRTaXplPzogc3RyaW5nLFxuICAgICAgICBwcmltYXJ5Q29sb3I/OiBzdHJpbmcsXG4gICAgICAgIGN1c3RvbUNTUz86IHN0cmluZ1xuICAgICk6IHZvaWQge1xuICAgICAgICBjb25zdCBjb250ZW50RGl2ID0gdGhpcy5jb250YWluZXIucXVlcnlTZWxlY3RvcignLnN0eWxlLWVkaXRvci1jb250ZW50Jyk7XG4gICAgICAgIGlmICghY29udGVudERpdikgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IGRyb3Bkb3duR3JvdXBzID0gY29udGVudERpdi5xdWVyeVNlbGVjdG9yQWxsKCcuc3R5bGUtZHJvcGRvd24tZ3JvdXAnKTtcblxuICAgICAgICAvLyDmm7TmlrDkuLvpopjpgInmi6nlmajvvIjnrKww5Liq77yJXG4gICAgICAgIGNvbnN0IHRoZW1lU2VsZWN0ID0gZHJvcGRvd25Hcm91cHNbMF0/LnF1ZXJ5U2VsZWN0b3IoJ3NlbGVjdCcpIGFzIEhUTUxTZWxlY3RFbGVtZW50O1xuICAgICAgICBpZiAodGhlbWVTZWxlY3QpIHtcbiAgICAgICAgICAgIHRoZW1lU2VsZWN0LnZhbHVlID0gdGhlbWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyDmm7TmlrDku6PnoIHpq5jkuq7pgInmi6nlmajvvIjnrKwx5Liq77yJXG4gICAgICAgIGNvbnN0IGhpZ2hsaWdodFNlbGVjdCA9IGRyb3Bkb3duR3JvdXBzWzFdPy5xdWVyeVNlbGVjdG9yKCdzZWxlY3QnKSBhcyBIVE1MU2VsZWN0RWxlbWVudDtcbiAgICAgICAgaWYgKGhpZ2hsaWdodFNlbGVjdCkge1xuICAgICAgICAgICAgaGlnaGxpZ2h0U2VsZWN0LnZhbHVlID0gaGlnaGxpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g5pu05paw5a2X5L2T6YCJ5oup5Zmo77yI56ysMuS4qu+8iVxuICAgICAgICBpZiAoZm9udCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBjb25zdCBmb250U2VsZWN0ID0gZHJvcGRvd25Hcm91cHNbMl0/LnF1ZXJ5U2VsZWN0b3IoJ3NlbGVjdCcpIGFzIEhUTUxTZWxlY3RFbGVtZW50O1xuICAgICAgICAgICAgaWYgKGZvbnRTZWxlY3QpIHtcbiAgICAgICAgICAgICAgICBmb250U2VsZWN0LnZhbHVlID0gZm9udDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOabtOaWsOWtl+WPt+mAieaLqeWZqO+8iOesrDPkuKrvvIlcbiAgICAgICAgaWYgKGZvbnRTaXplICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGNvbnN0IGZvbnRTaXplU2VsZWN0ID0gZHJvcGRvd25Hcm91cHNbM10/LnF1ZXJ5U2VsZWN0b3IoJ3NlbGVjdCcpIGFzIEhUTUxTZWxlY3RFbGVtZW50O1xuICAgICAgICAgICAgaWYgKGZvbnRTaXplU2VsZWN0KSB7XG4gICAgICAgICAgICAgICAgZm9udFNpemVTZWxlY3QudmFsdWUgPSBmb250U2l6ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENsYXVkZSBDb2RlIFVwZGF0ZTog5pu05paw5Li76aKY6Imy6YCJ5oup5Zmo5ZKM6aKc6Imy6L6T5YWl5qGGXG4gICAgICAgIGlmIChwcmltYXJ5Q29sb3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc3QgY29sb3JTZWxlY3QgPSBkcm9wZG93bkdyb3Vwc1s0XT8ucXVlcnlTZWxlY3Rvcignc2VsZWN0JykgYXMgSFRNTFNlbGVjdEVsZW1lbnQ7XG4gICAgICAgICAgICBjb25zdCBjb2xvcklucHV0ID0gY29udGVudERpdi5xdWVyeVNlbGVjdG9yKCdpbnB1dC5jdXN0b20tY29sb3ItaW5wdXQnKSBhcyBIVE1MSW5wdXRFbGVtZW50O1xuICAgICAgICAgICAgY29uc3QgY29sb3JJbnB1dFdyYXBwZXIgPSBjb250ZW50RGl2LnF1ZXJ5U2VsZWN0b3IoJy5jb2xvci1pbnB1dC13cmFwcGVyJykgYXMgSFRNTERpdkVsZW1lbnQ7XG5cbiAgICAgICAgICAgIC8vIOajgOafpeminOiJsuaYr+WQpuWcqOmihOiuvuWIl+ihqOS4rVxuICAgICAgICAgICAgY29uc3QgcHJlc2V0Q29sb3JzID0gWycjMmQzNzQ4JywgJyMzYjgyZjYnLCAnIzEwYjk4MScsICcjZjU5ZTBiJywgJyNlZjQ0NDQnLCAnIzhiNWNmNiddO1xuICAgICAgICAgICAgY29uc3QgaXNQcmVzZXRDb2xvciA9IHByZXNldENvbG9ycy5pbmNsdWRlcyhwcmltYXJ5Q29sb3IpO1xuXG4gICAgICAgICAgICAvLyBDbGF1ZGUgQ29kZSBVcGRhdGU6IOS9v+eUqENTU+exu+iAjOmdnuWGheiBlOagt+W8j1xuICAgICAgICAgICAgaWYgKGNvbG9yU2VsZWN0KSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzUHJlc2V0Q29sb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8g5L2/55So6aKE6K6+6aKc6ImyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yU2VsZWN0LnZhbHVlID0gcHJpbWFyeUNvbG9yO1xuICAgICAgICAgICAgICAgICAgICBpZiAoY29sb3JJbnB1dFdyYXBwZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9ySW5wdXRXcmFwcGVyLmFkZENsYXNzKCdoaWRkZW4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIOS9v+eUqOiHquWumuS5ieminOiJslxuICAgICAgICAgICAgICAgICAgICBjb2xvclNlbGVjdC52YWx1ZSA9ICdjdXN0b20nO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjdXN0b21PcHRpb24gPSBjb2xvclNlbGVjdC5xdWVyeVNlbGVjdG9yKCdvcHRpb25bdmFsdWU9XCJjdXN0b21cIl0nKSBhcyBIVE1MT3B0aW9uRWxlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1c3RvbU9wdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tT3B0aW9uLnRleHQgPSBg6Ieq5a6a5LmJICgke3ByaW1hcnlDb2xvcn0pYDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoY29sb3JJbnB1dFdyYXBwZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9ySW5wdXRXcmFwcGVyLnJlbW92ZUNsYXNzKCdoaWRkZW4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGNvbG9ySW5wdXQpIHtcbiAgICAgICAgICAgICAgICBjb2xvcklucHV0LnZhbHVlID0gcHJpbWFyeUNvbG9yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8g5pu05paw6Ieq5a6a5LmJQ1NT5paH5pys5qGGXG4gICAgICAgIGlmIChjdXN0b21DU1MgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgY29uc3QgY3NzVGV4dGFyZWEgPSBjb250ZW50RGl2LnF1ZXJ5U2VsZWN0b3IoJ3RleHRhcmVhLnN0eWxlLWVkaXRvci1jc3MtdGV4dGFyZWEnKSBhcyBIVE1MVGV4dEFyZWFFbGVtZW50O1xuICAgICAgICAgICAgaWYgKGNzc1RleHRhcmVhKSB7XG4gICAgICAgICAgICAgICAgY3NzVGV4dGFyZWEudmFsdWUgPSBjdXN0b21DU1M7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59Il19