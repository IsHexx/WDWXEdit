export interface StatusMessage {
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp?: number;
}

export class StatusBar {
    private container: HTMLDivElement;
    private statusBar: HTMLDivElement;
    private currentMessage: StatusMessage | null = null;
    private autoHideTimer: NodeJS.Timeout | null = null;

    constructor(container: HTMLDivElement) {
        this.container = container;
        this.init();
    }

    private init(): void {
        this.statusBar = this.container.createDiv({ cls: 'wdwx-status-bar' });
        this.statusBar.setAttr('style', 'display: none;');
    }

    showMessage(message: StatusMessage): void {
        this.currentMessage = {
            ...message,
            timestamp: message.timestamp || Date.now()
        };

        this.statusBar.empty();
        this.statusBar.removeClass('status-info', 'status-success', 'status-warning', 'status-error');
        this.statusBar.addClass(`status-${message.type}`);

        const messageContent = this.statusBar.createDiv({ cls: 'status-content' });

        const icon = messageContent.createSpan({ cls: 'status-icon' });
        icon.innerHTML = this.getIconForType(message.type);

        const text = messageContent.createSpan({ cls: 'status-text' });
        text.textContent = message.message;

        const closeBtn = messageContent.createSpan({ cls: 'status-close' });
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => this.hideMessage();

        this.statusBar.setAttr('style', 'display: block;');
    }

    showInfo(message: string): void {
        this.showTemporaryMessage({ type: 'info', message }, 3000);
    }

    showSuccess(message: string): void {
        this.showTemporaryMessage({ type: 'success', message }, 3000);
    }

    showWarning(message: string): void {
        this.showTemporaryMessage({ type: 'warning', message }, 5000);
    }

    showError(message: string): void {
        this.showMessage({ type: 'error', message });
    }

    showProgress(message: string, progress?: number): void {
        this.showMessage({ type: 'info', message });
        
        if (typeof progress === 'number') {
            const progressBar = this.statusBar.createDiv({ cls: 'status-progress' });
            const progressFill = progressBar.createDiv({ cls: 'status-progress-fill' });
            progressFill.setAttr('style', `width: ${Math.min(100, Math.max(0, progress))}%`);
        }
    }

    updateProgress(progress: number): void {
        const progressFill = this.statusBar.querySelector('.status-progress-fill') as HTMLElement;
        if (progressFill) {
            progressFill.setAttr('style', `width: ${Math.min(100, Math.max(0, progress))}%`);
        }
    }

    hideMessage(): void {
        this.statusBar.setAttr('style', 'display: none;');
        this.currentMessage = null;
        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
            this.autoHideTimer = null;
        }
    }

    getCurrentMessage(): StatusMessage | null {
        return this.currentMessage;
    }

    clear(): void {
        this.hideMessage();
        this.statusBar.empty();
    }

    private getIconForType(type: StatusMessage['type']): string {
        const icons = {
            info: '📘',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || icons.info;
    }

    private showTemporaryMessage(message: StatusMessage, duration: number = 3000): void {
        const messageWithTimestamp = {
            ...message,
            timestamp: message.timestamp || Date.now()
        };
        
        this.showMessage(messageWithTimestamp);

        if (this.autoHideTimer) {
            clearTimeout(this.autoHideTimer);
        }
        
        this.autoHideTimer = setTimeout(() => {
            if (this.currentMessage && this.currentMessage.timestamp === messageWithTimestamp.timestamp) {
                this.hideMessage();
            }
        }, duration);
    }

    destroy(): void {
        this.clear();
    }
}