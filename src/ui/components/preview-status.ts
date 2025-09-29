/**
 * 状态栏组件 - 负责显示操作状态、进度信息和用户反馈
 */
export class PreviewStatus {
    private parent: HTMLDivElement;
    private statusContainer: HTMLDivElement;
    private statusMessage: HTMLDivElement;
    private statusIcon: HTMLDivElement;
    private progressBar: HTMLDivElement;
    private hideTimeout?: NodeJS.Timeout;

    constructor(parent: HTMLDivElement) {
        this.parent = parent;
        this.build();
    }

    private build() {

        this.statusContainer = this.parent.createDiv({ cls: 'preview-status' });
        this.statusContainer.style.display = 'none';

        this.statusIcon = this.statusContainer.createDiv({ cls: 'status-icon' });

        this.statusMessage = this.statusContainer.createDiv({ cls: 'status-message' });

        this.progressBar = this.statusContainer.createDiv({ cls: 'status-progress' });
    }

    showInfo(message: string, duration?: number) {
        this.showStatus(message, 'info', duration);
    }

    showSuccess(message: string, duration?: number) {
        this.showStatus(message, 'success', duration || 3000);
    }

    showWarning(message: string, duration?: number) {
        this.showStatus(message, 'warning', duration || 5000);
    }

    showError(message: string, duration?: number) {
        this.showStatus(message, 'error', duration || 5000);
    }

    showLoading(message: string) {
        this.showStatus(message, 'loading');
        this.showProgress(true);
    }

    private showStatus(message: string, type: 'info' | 'success' | 'warning' | 'error' | 'loading', duration?: number) {

        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = undefined;
        }

        this.statusMessage.textContent = message;

        this.updateIcon(type);

        this.statusContainer.className = `preview-status status-${type}`;
        this.statusContainer.style.display = 'flex';

        if (type !== 'loading' && duration) {
            this.hideTimeout = setTimeout(() => {
                this.hideMessage();
            }, duration) as NodeJS.Timeout;
        }
    }

    private updateIcon(type: string) {
        let iconSvg = '';
        
        switch (type) {
            case 'info':
                iconSvg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                `;
                break;
            case 'success':
                iconSvg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22,4 12,14.01 9,11.01"/>
                    </svg>
                `;
                break;
            case 'warning':
                iconSvg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                `;
                break;
            case 'error':
                iconSvg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                `;
                break;
            case 'loading':
                iconSvg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="loading-spinner">
                        <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                `;
                break;
        }

        this.statusIcon.innerHTML = iconSvg;
    }

    private showProgress(show: boolean) {
        this.progressBar.style.display = show ? 'block' : 'none';
        
        if (show) {

            this.progressBar.innerHTML = '<div class="progress-bar-fill"></div>';
        }
    }

    updateProgress(percent: number) {
        const progressFill = this.progressBar.querySelector('.progress-bar-fill') as HTMLElement;
        if (progressFill) {
            progressFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        }
    }

    hideMessage() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = undefined;
        }

        this.statusContainer.style.display = 'none';
        this.showProgress(false);
    }

    isVisible(): boolean {
        return this.statusContainer.style.display !== 'none';
    }

    getCurrentMessage(): string {
        return this.statusMessage.textContent || '';
    }

    getCurrentType(): string {
        const className = this.statusContainer.className;
        const match = className.match(/status-(\w+)/);
        return match ? match[1] : '';
    }

    setClickHandler(handler: () => void) {
        this.statusContainer.onclick = handler;
        this.statusContainer.style.cursor = 'pointer';
    }

    removeClickHandler() {
        this.statusContainer.onclick = null;
        this.statusContainer.style.cursor = 'default';
    }

    addCloseButton() {
        const closeBtn = this.statusContainer.createDiv({ cls: 'status-close' });
        closeBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        `;
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            this.hideMessage();
        };
    }

    removeCloseButton() {
        const closeBtn = this.statusContainer.querySelector('.status-close');
        if (closeBtn) {
            closeBtn.remove();
        }
    }

    setPosition(position: 'top' | 'bottom' | 'center') {
        this.statusContainer.removeClass('status-top');
        this.statusContainer.removeClass('status-bottom');
        this.statusContainer.removeClass('status-center');
        this.statusContainer.addClass(`status-${position}`);
    }

    getElement(): HTMLDivElement {
        return this.statusContainer;
    }

    destroy() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
        }
        this.statusContainer.remove();
    }
}