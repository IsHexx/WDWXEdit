import { App, EventRef, Plugin, TFile, TFolder, TAbstractFile, Notice } from 'obsidian';

import { debounce } from '../../shared/utils';
import { WxSettings } from '../../core/settings';
import AssetsManager from '../../core/assets';
import { MarkedParser } from '../../services/renderer/markdown/parser';
import { LocalImageManager, LocalFile } from '../../services/renderer/markdown/local-file';
import { CardDataManager } from '../../services/renderer/markdown/code';
import { ArticleRender } from '../../services/renderer/article-render';
import { StyleEditor } from '../components/style-editor';
import type { DraftArticle } from '../../services/wechat/weixin-api';
import { PreviewToolbar } from '../components/preview-toolbar';
import { PreviewContent } from '../components/preview-content';
import { PreviewStatus } from '../components/preview-status';

/**
 * 预览控制器 - 负责核心业务逻辑和组件协调
 */
export class PreviewController {
    private app: App;
    private view: any; // PreviewView
    private plugin: Plugin;
    private settings: WxSettings;
    private assetsManager: AssetsManager;
    private listeners: EventRef[] = [];

    private toolbar: PreviewToolbar;
    private content: PreviewContent;
    private status: PreviewStatus;
    private styleEditor: StyleEditor;

    private _articleRender: ArticleRender | null = null;
    private markedParser: MarkedParser;
    private cachedElements: Map<string, string> = new Map();

    private currentFile?: TFile;
    private currentTheme: string;
    private currentHighlight: string;
    private currentAppId: string;
    private isCancelUpload: boolean = false;
    private isBatchRuning: boolean = false;
    private backendAvailable: boolean | null = null;
    private lastBackendNoticeAt = 0;
    private lastBackendFailureAt = 0;

    constructor(app: App, view: any, plugin: Plugin) {
        this.app = app;
        this.view = view;
        this.plugin = plugin;
        this.settings = WxSettings.getInstance();
        this.assetsManager = AssetsManager.getInstance();
        this.currentTheme = this.settings.defaultStyle;
        this.currentHighlight = this.settings.defaultHighlight;

        this.initializeStyleEditor();
    }

    private initializeStyleEditor() {
        this.styleEditor = new StyleEditor(this.settings, this.assetsManager, {
            onThemeChanged: (theme: string) => {
                this.currentTheme = theme;
                this.render.updateStyle(theme);
            },
            onHighlightChanged: (highlight: string) => {
                this.currentHighlight = highlight;
                this.render.updateHighLight(highlight);
            },
            onStyleReset: () => {

                this.currentTheme = this.settings.defaultStyle;
                this.currentHighlight = this.settings.defaultHighlight;
                this.render.updateStyle(this.currentTheme);
                this.render.updateHighLight(this.currentHighlight);

                const defaultFont = 'sans-serif';
                const defaultFontSize = '16px';
                const defaultPrimaryColor = '#2d3748';
                const defaultCustomCSS = '';

                this.render.updateFont(defaultFont);
                this.render.updateFontSize(defaultFontSize);
                this.render.updatePrimaryColor(defaultPrimaryColor);
                this.render.updateCustomCSS(defaultCustomCSS);

                this.styleEditor?.updateSelections(
                    this.currentTheme,
                    this.currentHighlight,
                    defaultFont,
                    defaultFontSize,
                    defaultPrimaryColor,
                    defaultCustomCSS
                );
            },
            onFontChanged: (fontFamily: string) => {
                this.render.updateFont(fontFamily);
            },
            onFontSizeChanged: (fontSize: string) => {
                this.render.updateFontSize(fontSize);
            },
            onPrimaryColorChanged: (color: string) => {
                this.render.updatePrimaryColor(color);
            },
            onCustomCSSChanged: (css: string) => {
                this.render.updateCustomCSS(css);
            }
        });
    }

    get render() {
        if (!this._articleRender) {
            const contentElements = this.content.getElements();
            this._articleRender = new ArticleRender(
                this.app, 
                this.view, 
                contentElements.styleEl, 
                contentElements.articleDiv
            );
            this._articleRender.currentTheme = this.currentTheme;
            this._articleRender.currentHighlight = this.currentHighlight;
        }
        return this._articleRender;
    }

    async initialize() {
        if (!this.settings.isLoaded) {
            const data = await this.plugin.loadData();
            WxSettings.loadSettings(data);
        }
        if (!this.assetsManager.isLoaded) {
            await this.assetsManager.loadAssets();
        }

        await this.buildUI();
        this.setupEventListeners();
        await this.renderMarkdown();
    }

    private async buildUI() {
        const container = this.view.getContainer();
        container.empty();

        const mainDiv = container.createDiv({ cls: 'note-preview' });

        this.toolbar = new PreviewToolbar(
            mainDiv,
            this.settings,
            this.styleEditor,
            this.getToolbarHandlers()
        );

        this.content = new PreviewContent(mainDiv);

        await this.toolbar.build();
        this.status = new PreviewStatus(this.toolbar.getElement());
        this.content.build();
    }

    private getToolbarHandlers() {
        return {
            onAppIdChanged: (appId: string) => {
                this.currentAppId = appId;
                this.cleanArticleData();
        
                // this.rebuildToolbar();
            },
            onRefresh: async () => {

                this.rebuildToolbar();
                await this.assetsManager.loadCustomCSS();
        
                this.render.reloadStyle();
                await this.renderMarkdown();
            },
            onCopy: async () => {
                const result = await this.copyWithImageUpload();
                if (result?.uploaded) {
                    new Notice('复制成功，图片已上传到微信服务器，请到公众号编辑器粘贴。');
                } else {

                    if (result?.reason === 'no-appid') {
                        new Notice('复制成功，未配置公众号，图片未上传。');
                    } else if (result?.reason === 'backend' || result?.reason === 'token') {
                        new Notice('复制成功，仅复制内容，未上传图片（后端未连接或认证失败）。');
                    } else {
                        new Notice('复制成功，仅复制内容，未上传图片。');
                    }
                }
            },
            onPost: async () => {
                await this.postArticle();
            },
            onUpload: async () => {
                await this.uploadImages();
            }
        };
    }

    private setupEventListeners() {
        this.listeners = [
            this.app.workspace.on('file-open', () => {
                this.update();
            }),
            this.app.vault.on("modify", (file) => {
                if (this.currentFile?.path == file.path) {
                    this.renderMarkdown();
                }
            })
        ];
    }

    cleanup() {
        this.listeners?.forEach(listener => this.app.workspace.offref(listener));
        LocalFile.fileCache.clear();
    }

    async onRefresh(): Promise<void> {
        try {
            this.status.showInfo('正在刷新...');

            this.rebuildToolbar();

            await this.assetsManager.loadAssets();
            await this.assetsManager.loadCustomCSS();
            await this.renderMarkdown(null);
            
            this.status.showSuccess('刷新完成');
        } catch (error) {
            this.status.showError(`刷新失败: ${error.message}`);
        }
    }

    private rebuildToolbar(): void {
        if (this.toolbar && typeof this.toolbar.refresh === 'function') {
            this.toolbar.refresh();
        }
    }

    private async update() {
        if (this.isBatchRuning) {
            return;
        }
        this.cleanArticleData();
        this.renderMarkdown();
    }

    private cleanArticleData() {
        LocalImageManager.getInstance().cleanup();
        CardDataManager.getInstance().cleanup();
    }

    showLoading(msg: string, cancelable: boolean = false) {
        this.status.showInfo(msg);
    }

    showMsg(msg: string) {
        if (msg.includes('成功')) {
            this.status.showSuccess(msg);
        } else if (msg.includes('失败') || msg.includes('错误')) {
            this.status.showError(msg);
        } else if (msg.includes('警告')) {
            this.status.showWarning(msg);
        } else {
            this.status.showInfo(msg);
        }
    }

    async renderMarkdown(af: TFile | null = null) {
        if (!af) {
            af = this.app.workspace.getActiveFile();
        }
        if (!af || af.extension.toLocaleLowerCase() !== 'md') {
            return;
        }
        this.currentFile = af;
        await this.render.renderMarkdown(af);
        
        const metadata = this.render.getMetadata();
        this.toolbar.updateFromMetadata(metadata, this.currentTheme, this.currentHighlight);
    }

    async uploadImages() {

        if (!this.currentAppId) {
            this.status.showWarning('请先选择公众号', 3000);
            return;
        }

        if (this.backendAvailable === false) {
            const now = Date.now();
            if (now - this.lastBackendFailureAt < 5000) {
                this.status.showError('后端服务未启动，无法上传图片。', 4000);
                new Notice('未检测到后端服务，请先启动后端后再试。');
                return;
            }
            this.backendAvailable = null;
        }

        this.status.showUploading('图片上传中...');
        try {
            await this.render.uploadImages(this.currentAppId);
            this.backendAvailable = true;
            this.status.showSuccess('图片上传成功，图片链接已更新', 3000);
        } catch (error) {

            this.notifyBackendUnavailable(error);

            const errorMessage = error instanceof Error ? error.message : String(error);

            if (errorMessage.includes('请先选择公众号')) {
                this.status.showWarning('请先选择公众号', 3000);
            } else if (errorMessage.includes('token') || errorMessage.includes('Token') || errorMessage.includes('认证')) {
                this.status.showError('Token获取失败，图片未上传。请检查公众号配置', 5000);
            } else if (errorMessage.includes('上传') || errorMessage.includes('upload')) {
                this.status.showError('图片上传过程出错：' + errorMessage, 5000);
            } else {
                this.status.showError('图片上传失败：' + errorMessage, 5000);
            }
        }
    }

    async postArticle() {
        const localCover = this.toolbar.getCoverFile();
        
        if (this.toolbar.isUsingLocalCover() && !localCover) {
            this.status.showWarning('请选择封面文件');
            return;
        }

        if (!this.currentAppId) {
            this.status.showWarning('请先选择公众号');
            return;
        }

        if (this.backendAvailable === false) {
            const now = Date.now();
            if (now - this.lastBackendFailureAt < 5000) {
                this.status.showError('后端服务未启动，暂无法发草稿。', 4000);
                new Notice('未检测到后端服务，请先启动后端后再试。');
                return;
            }
            this.backendAvailable = null;
        }

        this.status.showProcessing('发布中...');
        try {
            await this.uploadImagesAndCreateDraft(this.currentAppId, localCover);
            this.backendAvailable = true;
            this.status.showSuccess('发布成功', 3000);
        } catch (error) {

            this.notifyBackendUnavailable(error);

            const errorMessage = error instanceof Error ? error.message : String(error);

            if (errorMessage.includes('token') || errorMessage.includes('Token') || errorMessage.includes('认证')) {
                this.status.showError('Token获取失败，发布失败。请检查公众号配置', 5000);
            } else if (errorMessage.includes('上传') || errorMessage.includes('upload')) {
                this.status.showError('图片上传过程出错：' + errorMessage, 5000);
            } else if (errorMessage.includes('草稿') || errorMessage.includes('draft')) {
                this.status.showError('创建草稿失败：' + errorMessage, 5000);
            } else {
                this.status.showError('发布失败：' + errorMessage, 5000);
            }

            try {
                await this.copyWithoutImageUpload();
            } catch (copyError) {

                this.status.showError('复制失败，请重试');
            }
        }
    }

    async copyWithImageUpload(): Promise<{ uploaded: boolean; reason?: 'no-appid' | 'backend' | 'token' | 'none' }> {

        if (!this.currentAppId) {
            this.status.showWarning('请先选择公众号', 3000);
            await this.copyWithoutImageUpload();
            return { uploaded: false, reason: 'no-appid' };
        }

        if (this.backendAvailable === false) {
            const now = Date.now();
            if (now - this.lastBackendFailureAt < 5000) {
                this.status.showWarning('后端服务未启动，直接复制本地内容。', 4000);
                await this.copyWithoutImageUpload();
                return { uploaded: false, reason: 'backend' };
            }
            this.backendAvailable = null;
        }

        this.status.showProcessing('正在获取微信访问令牌...');

        let token: string;
        try {
            token = await this.render.getToken(this.currentAppId);
            this.backendAvailable = true;
        } catch (error) {

            const message = error instanceof Error ? error.message : String(error);
            this.status.showError(message || '无法获取访问令牌', 5000);
            this.notifyBackendUnavailable(error, { suppressNotice: true });
            await this.copyWithoutImageUpload();
            return { uploaded: false, reason: 'token' };
        }

        if (!token) {
            this.status.showError('Token获取失败，图片未上传到公众号', 5000);
            await this.copyWithoutImageUpload();
            return { uploaded: false, reason: 'token' };
        }

        this.status.showProcessing('处理图片...');

        this.status.showUploading('检测本地图片...');
        const lm = LocalImageManager.getInstance();
        const imageKeys = Array.from((lm as any).images.keys());
        const localImages = imageKeys.filter(key => {
            const image = (lm as any).images.get(key);
            return image && image.url == null && image.filePath;
        });
        let didUpload = false;

        if (localImages.length > 0) {

const { initApiClients, getWechatClient } = await import('../../services/api');
            
            if (!getWechatClient()) {
                initApiClients();
            }
            const wechatClient = getWechatClient();

            this.status.showUploading(`上传图片中... (0/${localImages.length})`);

            for (let i = 0; i < localImages.length; i++) {
                const imageKey = localImages[i];
                const imageInfo = (lm as any).images.get(imageKey);

                if (!imageInfo || !imageInfo.filePath) continue;

                this.status.showUploading(`上传图片中... (${i + 1}/${localImages.length})`);

                try {
                    const file = this.app.vault.getFileByPath(imageInfo.filePath);
                    if (!file) {

                        continue;
                    }

                    const fileData = await this.app.vault.readBinary(file);
                    const base64Data = this.arrayBufferToBase64(fileData);

                    const smartFileName = await this.generateSmartImageName(imageInfo.filePath, i);
                    const uploadRes = await wechatClient.uploadMedia({
                        mediaData: base64Data,
                        filename: smartFileName,
                        accessToken: token,
                        mediaType: 'image',
                        storageType: 'permanent'
                    });

                    if (uploadRes.errcode === 0 && uploadRes.media_id) {
                        const mediaId = uploadRes.media_id;
                        imageInfo.url = uploadRes.url || `https://mmbiz.qlogo.cn/mmbiz_png/${mediaId}/0?wx_fmt=png`;
                        imageInfo.media_id = mediaId;
                        didUpload = true;
                    }
                } catch (error) {

                    this.notifyBackendUnavailable(error, { suppressNotice: true });

                }
            }

            this.status.showProcessing('替换图片链接...');
            lm.replaceImages(this.content.getElements().articleDiv);
        }

        this.status.showCopying('复制到剪贴板...');
        
        try {
            if (document.hasFocus && !document.hasFocus()) {
                window.focus();
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            await this.render.copyArticle();
            if (didUpload) {
                this.status.showSuccess('复制成功，图片已上传到微信服务器', 2000);
            } else {
                this.status.showSuccess('复制成功', 2000);
            }
        } catch (error) {

            try {
                await this.fallbackCopyToClipboard();
                if (didUpload) {
                    this.status.showSuccess('复制成功，图片已上传到微信服务器', 2000);
                } else {
                    this.status.showSuccess('复制成功', 2000);
                }
            } catch (fallbackError) {

                this.status.hideMessage();
                throw new Error('复制失败：请确保浏览器窗口处于活动状态，然后重试');
            }
        }

        return { uploaded: didUpload, reason: 'none' };
    }

    // V2风格的图片上传和草稿创建
    private async uploadImagesAndCreateDraft(appid: string, localCover: File | null = null) {

const { initApiClients, getWechatClient } = await import('../../services/api');
        
        if (!getWechatClient()) {
            initApiClients();
        }
        const wechatClient = getWechatClient();

        this.status.showProcessing('获取认证信息...');
        const token = await this.render.getToken(appid);
        if (!token) {
            throw new Error('Token获取失败，请检查公众号配置');
        }

        this.status.showProcessing('检查草稿状态...');
        const draftStatus = await this.shouldUpdateDraft(token);
        const isUpdate = draftStatus.shouldUpdate;

        this.status.showUploading('检测本地图片...');
        const lm = LocalImageManager.getInstance();
        const imageKeys = Array.from((lm as any).images.keys());
        const localImages = imageKeys.filter(key => {
            const image = (lm as any).images.get(key);
            return image && image.url == null && image.filePath;
        });

        if (localImages.length > 0) {
            this.status.showUploading(`上传图片中... (0/${localImages.length})`);
            
            for (let i = 0; i < localImages.length; i++) {
                const imageKey = localImages[i];
                const imageInfo = (lm as any).images.get(imageKey);
                
                if (!imageInfo || !imageInfo.filePath) continue;

                this.status.showUploading(`上传图片中... (${i + 1}/${localImages.length})`);
                
                try {
                    const file = this.app.vault.getFileByPath(imageInfo.filePath);
                    if (!file) {

                        continue;
                    }
                    
                    const fileData = await this.app.vault.readBinary(file);
                    const base64Data = this.arrayBufferToBase64(fileData);
                    
                    const smartFileName = await this.generateSmartImageName(imageInfo.filePath, i);
                    const uploadRes = await wechatClient.uploadMedia({
                        mediaData: base64Data,
                        filename: smartFileName,
                        accessToken: token,
                        mediaType: 'image',
                        storageType: 'permanent'
                    });
                    
                    if (uploadRes.errcode === 0 && uploadRes.media_id) {
                        const mediaId = uploadRes.media_id;
                        imageInfo.url = uploadRes.url || `https://mmbiz.qlogo.cn/mmbiz_png/${mediaId}/0?wx_fmt=png`;
                        imageInfo.media_id = mediaId;
                    } else {
                        const error = uploadRes.errmsg || '未知错误';

                    }
                } catch (error) {

                }
            }
            
            this.status.showProcessing('替换图片链接...');
            lm.replaceImages(this.content.getElements().articleDiv);
        }

        this.status.showUploading('处理封面...');
        let mediaId = '';
        if (localCover) {
            const coverData = await localCover.arrayBuffer();
            const base64Data = this.arrayBufferToBase64(coverData);
            
            const coverRes = await wechatClient.uploadMedia({
                mediaData: base64Data,
                filename: localCover.name,
                accessToken: token,
                mediaType: 'image',
                storageType: 'permanent'
            });
            
            if (coverRes.media_id) {
                mediaId = coverRes.media_id;
            } else {
                throw new Error('封面上传失败: ' + coverRes.errmsg);
            }
        } else {
            mediaId = await this.render.getDefaultCover(token);
            if (!mediaId) {
                throw new Error('无法获取封面图片，请手动选择一张封面图片或确保微信素材库中有图片');
            }
        }

        const metadata = this.render.getMetadata();
        const currentFileName = this.currentFile?.basename || '未命名文章';
        const finalTitle = metadata.title || this.render.title || currentFileName;
        const finalDigest = metadata.digest || finalTitle.substring(0, 100);
        
        const article: DraftArticle = {
            title: finalTitle,
            author: metadata.author || '',
            digest: finalDigest,
            content: this.render.getArticleContent(),
            content_source_url: metadata.content_source_url || '',
            thumb_media_id: mediaId,
            need_open_comment: metadata.need_open_comment ? 1 : 0,
            only_fans_can_comment: metadata.only_fans_can_comment ? 1 : 0,
            pic_crop_235_1: metadata.pic_crop_235_1 || '',
            pic_crop_1_1: metadata.pic_crop_1_1 || ''
        };

        let draftRes: any;
        
        if (isUpdate && draftStatus.media_id) {
            this.status.showProcessing('更新草稿...');

            const v3Article = {
                title: article.title,
                content: article.content,
                author: article.author,
                digest: article.digest,
                content_source_url: article.content_source_url,
                thumb_media_id: article.thumb_media_id,
                show_cover_pic: true,
                need_open_comment: Boolean(article.need_open_comment),
                only_fans_can_comment: Boolean(article.only_fans_can_comment)
            };
            
            draftRes = await wechatClient.updateDraft(
                draftStatus.media_id,
                draftStatus.index,
                v3Article,
                token
            );
        } else {
            this.status.showProcessing('创建草稿...');
            
            const v3Article = {
                title: article.title,
                content: article.content,
                author: article.author,
                digest: article.digest,
                content_source_url: article.content_source_url,
                thumb_media_id: article.thumb_media_id,
                show_cover_pic: true,
                need_open_comment: Boolean(article.need_open_comment),
                only_fans_can_comment: Boolean(article.only_fans_can_comment)
            };
            
            draftRes = await wechatClient.createDraft([v3Article], token);
        }
        
        if (draftRes.errcode !== 0) {
            const operation = isUpdate ? '更新' : '创建';
            throw new Error(`${operation}草稿失败: ` + (draftRes.errmsg || '未知错误'));
        }
    }

    private async shouldUpdateDraft(token: string): Promise<{ shouldUpdate: boolean; media_id?: string; index: number }> {
        const currentTitle = this.currentFile?.basename || this.render.title || '未命名文章';

        try {

const { initApiClients, getWechatClient } = await import('../../services/api');
            
            if (!getWechatClient()) {
                initApiClients();
            }
            const wechatClient = getWechatClient();

            const draftsRes = await wechatClient.getDraftList(token, 0, 20);

            if (draftsRes.total_count && draftsRes.total_count > 0 && draftsRes.item && draftsRes.item.length > 0) {
                for (let i = 0; i < draftsRes.item.length; i++) {
                    const draft = draftsRes.item[i];
                    const draftTitle = draft.content?.news_item?.[0]?.title || '';

                    if (draftTitle && draftTitle === currentTitle) {
                        return {
                            shouldUpdate: true,
                            media_id: draft.media_id,
                            index: 0
                        };
                    }
                }
            }

            return { shouldUpdate: false, index: 0 };

        } catch (error) {

            return { shouldUpdate: false, index: 0 };
        }
    }

    private async generateSmartImageName(originalPath: string, index: number): Promise<string> {
        const articleTitle = this.currentFile?.basename || this.render.title || '未命名文章';
        const cleanTitle = this.cleanFileName(articleTitle);
        const sectionTitle = await this.findImageSection(originalPath);
        const cleanSection = sectionTitle ? this.cleanFileName(sectionTitle) : '';
        const ext = originalPath.split('.').pop() || 'png';
        
        let newName = cleanTitle;
        if (cleanSection) {
            newName += `-${cleanSection}`;
        }
        newName += `-${String(index + 1).padStart(2, '0')}.${ext}`;

        return newName;
    }

    private cleanFileName(name: string): string {
        return name
            .replace(/[\\/:*?"<>|]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50);
    }

    private async findImageSection(imagePath: string): Promise<string> {
        try {
            if (!this.currentFile) return '';
            
            const content = await this.app.vault.read(this.currentFile);
            const lines = content.split('\n');
            
            let imageLineIndex = -1;
            const imageFileName = imagePath.split('/').pop() || '';
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes(imageFileName) || 
                    line.includes(imagePath) ||
                    (line.includes('![[') && line.includes(imageFileName.replace(/\.[^/.]+$/, '')))) {
                    imageLineIndex = i;
                    break;
                }
            }
            
            if (imageLineIndex === -1) return '';
            
            for (let i = imageLineIndex; i >= 0; i--) {
                const line = lines[i].trim();
                if (line.startsWith('## ')) {
                    const title = line.replace('## ', '').trim();
                    return title;
                }
            }

            for (let i = imageLineIndex; i >= 0; i--) {
                const line = lines[i].trim();
                if (line.startsWith('# ') && !line.startsWith('## ')) {
                    const title = line.replace('# ', '').trim();
                    return title;
                }
            }

            return '';
        } catch (error) {
            return '';
        }
    }

    private async fallbackCopyToClipboard(): Promise<void> {
        // 1) 优先尝试Electron剪贴板（可复制HTML+纯文本）
        try {
            const html = this.render.getArticleContent();
            const text = this.render.getArticleText();
            const w = window as any;
            const electron = w?.require ? w.require('electron') : undefined;
            const electronClipboard = electron?.clipboard;
            if (electronClipboard && typeof electronClipboard.write === 'function') {
                electronClipboard.write({ html, text });
                return;
            }
        } catch (e) {

        }

        // 2) 使用纯文本降级复制（execCommand）
        const textarea = document.createElement('textarea');
        textarea.value = this.render.getArticleText();
        textarea.setAttribute('readonly', 'true');
        textarea.classList.add('wdwx-clipboard-textarea');
        
        document.body.appendChild(textarea);
        
        try {
            textarea.focus();
            textarea.select();
            textarea.setSelectionRange(0, textarea.value.length);
            
            const successful = document.execCommand('copy');
            if (!successful) {
                throw new Error('execCommand copy failed');
            }
        } finally {
            document.body.removeChild(textarea);
        }
    }

    private async copyWithoutImageUpload() {
        this.status.showCopying('复制到剪贴板中...');
        
        try {
            if (document.hasFocus && !document.hasFocus()) {
                window.focus();
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            await this.render.copyArticle();
            this.status.showSuccess('复制成功，未上传图片到公众号', 2000);
        } catch (error) {

            try {
                await this.fallbackCopyToClipboard();
                this.status.showSuccess('复制成功，未上传图片到公众号', 2000);
            } catch (fallbackError) {

                this.status.hideMessage();
                this.status.showError('复制失败，请确认窗口处于活动状态后重试。', 4000);
                new Notice('复制失败，请确认Obsidian窗口处于活动状态后重试。');
                throw new Error('复制失败，请确认Obsidian窗口处于活动状态后重试。');
            }
        }
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    async batchPost(folder: TFolder) {
        const files = folder.children.filter((child: TAbstractFile) => child.path.toLocaleLowerCase().endsWith('.md'));
        if (!files) {
            new Notice('没有可渲染的笔记或文件不支持渲染');
            return;
        }

        this.isCancelUpload = false;
        this.isBatchRuning = true;

        try {
            for (let file of files) {

                if (!(file instanceof TFile)) {
                    continue;
                }
                this.showLoading(`即将发布: ${file.name}`, true);
                await new Promise(resolve => setTimeout(resolve, 5000));
                if (this.isCancelUpload) {
                    break;
                }
                this.cleanArticleData();
                await this.renderMarkdown(file);
                await this.postArticle();
            }

            if (!this.isCancelUpload) {
                this.showMsg(`批量发布完成：成功发布 ${files.length} 篇笔记`);
            }
        } catch (e) {

            new Notice('批量发布失败: ' + e.message);
        } finally {
            this.isBatchRuning = false;
            this.isCancelUpload = false;
        }
    }

    private notifyBackendUnavailable(error: unknown, options?: { suppressNotice?: boolean }): boolean {
        const message = error instanceof Error ? error.message : String(error);
        const keywords = [
            '无法连接到服务器',
            '后端服务未启动',
            'Failed to fetch',
            'NetworkError',
            'CORS',
            'fetch failed',
            '可能的CORS问题原因'
        ];
        const matched = keywords.some(keyword => message.includes(keyword));

        if (matched) {
            this.backendAvailable = false;
            const now = Date.now();
            this.lastBackendFailureAt = now;
            if (now - this.lastBackendNoticeAt > 3000) {
                this.lastBackendNoticeAt = now;

                this.status.showError('后端服务未启动或无法连接。已切换为“仅复制”模式。', 6000);
                if (!options?.suppressNotice) {
                    new Notice('未检测到后端服务，请先启动本地服务或检查网络连接。');
                }
            }
        }

        return matched;
    }

    getCurrentAppId(): string {
        return this.currentAppId;
    }

    getCurrentFile(): TFile | undefined {
        return this.currentFile;
    }

    getAssetsManager(): AssetsManager {
        return this.assetsManager;
    }

    getSettings(): WxSettings {
        return this.settings;
    }
}
