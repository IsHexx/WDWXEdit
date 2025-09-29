// Claude Code Update - 兼容性入口文件，导出重构后的组件

// 1. PreviewView - 视图容器，负责生命周期管理
// 2. PreviewController - 控制器，负责核心业务逻辑  
// 3. PreviewToolbar - 工具栏组件
// 4. PreviewContent - 内容展示组件
// 5. PreviewStatus - 状态栏组件

export { PreviewView as NotePreview, VIEW_TYPE_NOTE_PREVIEW } from './ui/views/preview-view';
export { PreviewController } from './ui/controllers/preview-controller';
export { PreviewToolbar } from './ui/components/preview-toolbar';
export { PreviewContent } from './ui/components/preview-content';
export { PreviewStatus } from './ui/components/preview-status';

import { WorkspaceLeaf, Plugin, TFolder } from 'obsidian';
import { PreviewView, VIEW_TYPE_NOTE_PREVIEW } from './ui/views/preview-view';

/**
 * @deprecated 请使用新的模块化组件：PreviewView, PreviewController 等
 * 此类保留是为了向后兼容，但建议迁移到新架构
 */
export class NotePreviewLegacy extends PreviewView {
    constructor(leaf: WorkspaceLeaf, plugin: Plugin) {
        super(leaf, plugin);

    }

    async batchPost(folder: TFolder) {
        return this.getController().batchPost(folder);
    }

    get currentAppId() {
        return this.getController().getCurrentAppId();
    }

    get currentFile() {
        return this.getController().getCurrentFile();
    }

    get settings() {
        return this.getController().getSettings();
    }

    get assetsManager() {
        return this.getController().getAssetsManager();
    }
}

export default PreviewView;