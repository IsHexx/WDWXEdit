// V2风格状态提示条
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
        this.statusBar = this.container.createDiv({ cls: 'wdwx-status-bar hidden' });
    }

    showMessage(message: StatusMessage): void {
        this.currentMessage = {
            ...message,
            timestamp: message.timestamp || Date.now()
        };

        this.statusBar.empty();
        this.statusBar.classList.remove('status-info', 'status-success', 'status-warning', 'status-error');
        this.statusBar.classList.add(`status-${message.type}`);

        const messageContent = this.statusBar.createDiv({ cls: 'status-content' });

        const icon = messageContent.createSpan({ cls: 'status-icon' });
        icon.textContent = this.getIconForType(message.type);

        const text = messageContent.createSpan({ cls: 'status-text' });
        text.textContent = message.message;

        const closeBtn = messageContent.createSpan({ cls: 'status-close' });
        closeBtn.textContent = '×';
        closeBtn.onclick = () => this.hideMessage();

        this.statusBar.classList.remove('hidden');
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

        this.statusBar.querySelector('.status-progress')?.remove();

        if (typeof progress === 'number') {
            const clamped = Math.min(100, Math.max(0, progress));
            const progressBar = this.statusBar.createEl('progress', { cls: 'status-progress', attr: { max: '100' } }) as HTMLProgressElement;
            progressBar.value = clamped;
        }
    }

    updateProgress(progress: number): void {
        const progressBar = this.statusBar.querySelector('.status-progress') as HTMLProgressElement | null;
        if (progressBar) {
            progressBar.value = Math.min(100, Math.max(0, progress));
        }
    }

    hideMessage(): void {
        this.statusBar.classList.add('hidden');
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
