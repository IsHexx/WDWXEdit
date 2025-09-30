import { ItemView, WorkspaceLeaf, Plugin } from 'obsidian';
import { PreviewController } from '../controllers/preview-controller';

import { uevent, waitForLayoutReady } from '../../shared/utils';

export const VIEW_TYPE_WX_PREVIEW = 'wx-preview';

/**
 * 预览视图容器 - 负责Obsidian视图的生命周期管理
 * 采用MVC架构，视图作为容器，业务逻辑委托给控制器
 */
export class PreviewView extends ItemView {
    private controller: PreviewController;

    constructor(leaf: WorkspaceLeaf, plugin: Plugin) {
        super(leaf);
        this.controller = new PreviewController(this.app, this, plugin);
    }

    getViewType() {
        return VIEW_TYPE_WX_PREVIEW;
    }

    getIcon() {
        return 'clipboard-paste';
    }

    getDisplayText() {
        return '笔记预览';
    }

    async onOpen() {
        await this.showLoadingState();
        await this.setup();
        uevent('open');
    }

    async setup() {
        await waitForLayoutReady(this.app);
        await this.controller.initialize();
    }

    async onClose() {
        this.controller.cleanup();
        uevent('close');
    }

    private async showLoadingState() {
        const container = this.containerEl.children[1];
        container.empty();
        const loading = container.createDiv({ cls: 'loading-wrapper' });
        loading.createDiv({ cls: 'loading-spinner' });
    }

    getContainer(): Element {
        return this.containerEl.children[1];
    }

    getController(): PreviewController {
        return this.controller;
    }

    async forceRefresh(): Promise<void> {
        try {

            await this.controller.onRefresh();

        } catch (error) {

        }
    }
}