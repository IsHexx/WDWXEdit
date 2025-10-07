import { sanitizeHTMLToDom } from 'obsidian';

/**
 * 状态栏组件 - 负责显示操作状态、进度信息和用户反馈
 */
export class PreviewStatus {
    private parent: HTMLDivElement;
    private statusContainer: HTMLDivElement;
    private statusMessage: HTMLDivElement;
    private statusIcon: HTMLDivElement;
    private progressBar: HTMLProgressElement;
    private hideTimeout?: NodeJS.Timeout;

    constructor(parent: HTMLDivElement) {
        this.parent = parent;
        this.build();
    }

    private build() {

        this.statusContainer = this.parent.createDiv({ cls: 'preview-status hidden' });

        this.statusIcon = this.statusContainer.createDiv({ cls: 'status-icon' });

        this.statusMessage = this.statusContainer.createDiv({ cls: 'status-message' });

        this.progressBar = this.statusContainer.createEl('progress', { cls: 'status-progress', attr: { value: '0', max: '100' } }) as HTMLProgressElement;
        this.progressBar.classList.add('hidden');
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

    showUploading(message: string, duration?: number) {
        this.showStatus(message, 'upload', duration);
        this.showProgress(true);
    }

    showCopying(message: string, duration?: number) {
        this.showStatus(message, 'copy', duration);
    }

    showProcessing(message: string, duration?: number) {
        this.showStatus(message, 'processing', duration);
        this.showProgress(true);
    }

    private showStatus(message: string, type: 'info' | 'success' | 'warning' | 'error' | 'loading' | 'upload' | 'copy' | 'processing', duration?: number) {

        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = undefined;
        }

        this.statusMessage.textContent = message;

        this.updateIcon(type);

        const statusClasses = Array.from(this.statusContainer.classList).filter(cls => cls.startsWith('status-'));
        statusClasses.forEach(cls => this.statusContainer.classList.remove(cls));
        this.statusContainer.classList.add(`status-${type}`);
        this.statusContainer.classList.remove('hidden');

        const showProgress = type === 'loading' || type === 'upload' || type === 'processing';
        this.showProgress(showProgress);

        if (!showProgress && duration) {
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
            case 'upload':
                iconSvg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="7,10 12,15 17,10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                `;
                break;
            case 'copy':
                iconSvg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                    </svg>
                `;
                break;
            case 'processing':
                iconSvg = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="processing-icon">
                        <path d="M12 2v6"/>
                        <path d="M12 18v4"/>
                        <path d="M4.93 4.93l4.24 4.24"/>
                        <path d="M14.83 14.83l4.24 4.24"/>
                        <path d="M2 12h6"/>
                        <path d="M18 12h4"/>
                        <path d="M4.93 19.07l4.24-4.24"/>
                        <path d="M14.83 9.17l4.24-4.24"/>
                    </svg>
                `;
                break;
        }

        this.statusIcon.empty();
        this.statusIcon.appendChild(sanitizeHTMLToDom(iconSvg));
    }

    private showProgress(show: boolean) {
        if (!this.progressBar) {
            return;
        }

        this.progressBar.classList.toggle('hidden', !show);
        if (show) {
            this.progressBar.value = 0;
        }
    }

    updateProgress(percent: number) {
        if (!this.progressBar) {
            return;
        }

        this.progressBar.value = Math.min(100, Math.max(0, percent));
    }

    hideMessage() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = undefined;
        }

        this.statusContainer.classList.add('hidden');
        this.showProgress(false);
    }

    isVisible(): boolean {
        return !this.statusContainer.classList.contains('hidden');
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
        this.statusContainer.classList.add('preview-status-clickable');
    }

    removeClickHandler() {
        this.statusContainer.onclick = null;
        this.statusContainer.classList.remove('preview-status-clickable');
    }

    addCloseButton() {
        const closeBtn = this.statusContainer.createDiv({ cls: 'status-close' });
        const closeSvg = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        `;
        closeBtn.appendChild(sanitizeHTMLToDom(closeSvg));
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
        this.statusContainer.classList.remove('status-top', 'status-bottom', 'status-center');
        this.statusContainer.classList.add(`status-${position}`);
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
