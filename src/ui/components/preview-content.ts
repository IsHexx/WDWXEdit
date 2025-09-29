/**
 * 内容展示组件 - 负责文章内容的渲染容器
 */
export class PreviewContent {
    private parent: HTMLDivElement;
    private renderDiv: HTMLDivElement;
    private styleEl: HTMLElement;
    private articleDiv: HTMLDivElement;

    constructor(parent: HTMLDivElement) {
        this.parent = parent;
    }

    build() {

        this.renderDiv = this.parent.createDiv({ cls: 'render-div' });
        this.renderDiv.id = 'render-div';
        this.renderDiv.setAttribute('style', '-webkit-user-select: text; user-select: text;');

        this.styleEl = this.renderDiv.createEl('style');
        this.styleEl.setAttr('title', 'wdwxedit-style');

        this.articleDiv = this.renderDiv.createEl('div');
    }

    getElements() {
        return {
            renderDiv: this.renderDiv,
            styleEl: this.styleEl,
            articleDiv: this.articleDiv
        };
    }

    getRenderDiv(): HTMLDivElement {
        return this.renderDiv;
    }

    getStyleEl(): HTMLElement {
        return this.styleEl;
    }

    getArticleDiv(): HTMLDivElement {
        return this.articleDiv;
    }

    clearContent() {
        if (this.articleDiv) {
            this.articleDiv.empty();
        }
    }

    setContent(html: string) {
        if (this.articleDiv) {
            this.articleDiv.innerHTML = html;
        }
    }

    getContent(): string {
        return this.articleDiv?.innerHTML || '';
    }

    updateStyle(css: string) {
        if (this.styleEl) {
            this.styleEl.innerHTML = css;
        }
    }

    addStyle(css: string) {
        if (this.styleEl) {
            this.styleEl.innerHTML += css;
        }
    }

    showLoading() {
        this.clearContent();
        const loading = this.articleDiv.createDiv({ cls: 'content-loading' });
        loading.createDiv({ cls: 'loading-text' }).textContent = '正在渲染内容...';
    }

    showError(message: string) {
        this.clearContent();
        const error = this.articleDiv.createDiv({ cls: 'content-error' });
        error.createDiv({ cls: 'error-title' }).textContent = '渲染出错';
        error.createDiv({ cls: 'error-message' }).textContent = message;
    }

    showEmpty() {
        this.clearContent();
        const empty = this.articleDiv.createDiv({ cls: 'content-empty' });
        empty.createDiv({ cls: 'empty-title' }).textContent = '没有内容';
        empty.createDiv({ cls: 'empty-message' }).textContent = '请选择一个Markdown文件进行预览';
    }

    scrollToTop() {
        if (this.renderDiv) {
            this.renderDiv.scrollTop = 0;
        }
    }

    scrollToBottom() {
        if (this.renderDiv) {
            this.renderDiv.scrollTop = this.renderDiv.scrollHeight;
        }
    }

    getScrollPosition(): number {
        return this.renderDiv?.scrollTop || 0;
    }

    setScrollPosition(position: number) {
        if (this.renderDiv) {
            this.renderDiv.scrollTop = position;
        }
    }

    addClass(className: string) {
        if (this.renderDiv) {
            this.renderDiv.addClass(className);
        }
    }

    removeClass(className: string) {
        if (this.renderDiv) {
            this.renderDiv.removeClass(className);
        }
    }

    hasClass(className: string): boolean {
        return this.renderDiv?.hasClass(className) || false;
    }

    setVisible(visible: boolean) {
        if (this.renderDiv) {
            this.renderDiv.style.display = visible ? 'block' : 'none';
        }
    }

    isVisible(): boolean {
        return this.renderDiv?.style.display !== 'none';
    }

    getContentHeight(): number {
        return this.renderDiv?.scrollHeight || 0;
    }

    getVisibleHeight(): number {
        return this.renderDiv?.clientHeight || 0;
    }

    isScrollable(): boolean {
        return this.getContentHeight() > this.getVisibleHeight();
    }

    addEventListener(event: string, handler: EventListener) {
        if (this.renderDiv) {
            this.renderDiv.addEventListener(event, handler);
        }
    }

    removeEventListener(event: string, handler: EventListener) {
        if (this.renderDiv) {
            this.renderDiv.removeEventListener(event, handler);
        }
    }
}