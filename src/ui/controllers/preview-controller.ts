// Claude Code ADD - 预览控制器，负责核心业务逻辑
import { App, EventRef, Plugin, TFile, TFolder, TAbstractFile, Notice } from 'obsidian';
// Claude Code Update - 更新import路径
import { debounce } from '../../shared/utils';
import { NMPSettings } from '../../core/settings';
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
    private settings: NMPSettings;
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

    constructor(app: App, view: any, plugin: Plugin) {
        this.app = app;
        this.view = view;
        this.plugin = plugin;
        this.settings = NMPSettings.getInstance();
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
            NMPSettings.loadSettings(data);
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
            },
            onRefresh: async () => {
                await this.assetsManager.loadCustomCSS();
                // Claude Code Remove - 移除loadExpertSettings调用
                this.render.reloadStyle();
                await this.renderMarkdown();
            },
            onCopy: async () => {
                await this.copyWithImageUpload();
                new Notice('复制成功，图片已上传到微信服务器，请到公众号编辑器粘贴。');
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
        this.showLoading('图片上传中...');
        try {
            await this.render.uploadImages(this.currentAppId);
            this.showMsg('图片上传成功，并且文章内容已复制，请到公众号编辑器粘贴。');
        } catch (error) {
            this.showMsg('图片上传失败: ' + error.message);
        }
    }

    async postArticle() {
        const localCover = this.toolbar.getCoverFile();
        
        if (this.toolbar.isUsingLocalCover() && !localCover) {
            this.showMsg('请选择封面文件');
            return;
        }

        if (!this.currentAppId) {
            this.showMsg('请先选择公众号');
            return;
        }

        this.showLoading('发布中...');
        try {
            await this.uploadImagesAndCreateDraft(this.currentAppId, localCover);
            this.showMsg('发布成功');
        } catch (error) {

            this.showMsg('发布失败: ' + error.message);
        }
    }

    async copyWithImageUpload() {
        if (!this.currentAppId) {
            throw new Error('请先选择公众号以便上传图片');
        }

        this.showLoading('处理图片...');

        const token = await this.render.getToken(this.currentAppId);
        if (!token) {
            throw new Error('获取Token失败，请检查公众号配置');
        }

        this.showLoading('检测本地图片...');
        const lm = LocalImageManager.getInstance();
        const imageKeys = Array.from((lm as any).images.keys());
        const localImages = imageKeys.filter(key => {
            const image = (lm as any).images.get(key);
            return image && image.url == null && image.filePath;
        });

        if (localImages.length > 0) {
            // Claude Code Update - 更新import路径
const { initApiClients, getWechatClient } = await import('../../services/api');
            
            if (!getWechatClient()) {
                initApiClients();
            }
            const wechatClient = getWechatClient();

            this.showLoading(`上传图片中... (0/${localImages.length})`);

            for (let i = 0; i < localImages.length; i++) {
                const imageKey = localImages[i];
                const imageInfo = (lm as any).images.get(imageKey);

                if (!imageInfo || !imageInfo.filePath) continue;

                this.showLoading(`上传图片中... (${i + 1}/${localImages.length})`);

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

            this.showLoading('替换图片链接...');

            lm.replaceImages(this.content.getElements().articleDiv);
        } else {

        }

        this.showLoading('复制到剪贴板...');
        
        try {
            if (document.hasFocus && !document.hasFocus()) {
                window.focus();
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            await this.render.copyArticle();
            this.status.hideMessage();

        } catch (error) {

            try {
                await this.fallbackCopyToClipboard();
                this.status.hideMessage();

            } catch (fallbackError) {

                this.status.hideMessage();
                throw new Error('复制失败：请确保浏览器窗口处于活动状态，然后重试');
            }
        }
    }

    // Claude Code ADD - V2风格的图片上传和草稿创建
    private async uploadImagesAndCreateDraft(appid: string, localCover: File | null = null) {
        // Claude Code Update - 更新import路径
const { initApiClients, getWechatClient } = await import('../../services/api');
        
        if (!getWechatClient()) {
            initApiClients();
        }
        const wechatClient = getWechatClient();

        this.showLoading('获取认证信息...');
        const token = await this.render.getToken(appid);
        if (!token) {
            throw new Error('获取Token失败，请检查公众号配置');
        }

        this.showLoading('检查草稿状态...');
        const draftStatus = await this.shouldUpdateDraft(token);
        const isUpdate = draftStatus.shouldUpdate;
        
        if (isUpdate) {

        } else {

        }

        this.showLoading('检测本地图片...');
        const lm = LocalImageManager.getInstance();
        const imageKeys = Array.from((lm as any).images.keys());
        const localImages = imageKeys.filter(key => {
            const image = (lm as any).images.get(key);
            return image && image.url == null && image.filePath;
        });

        if (localImages.length > 0) {
            this.showLoading(`上传图片中... (0/${localImages.length})`);
            
            for (let i = 0; i < localImages.length; i++) {
                const imageKey = localImages[i];
                const imageInfo = (lm as any).images.get(imageKey);
                
                if (!imageInfo || !imageInfo.filePath) continue;

                this.showLoading(`上传图片中... (${i + 1}/${localImages.length})`);
                
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
            
            this.showLoading('替换图片链接...');

            lm.replaceImages(this.content.getElements().articleDiv);
        } else {

        }

        this.showLoading('处理封面...');
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
            } else {

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
            this.showLoading('更新草稿...');

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
            this.showLoading('创建草稿...');
            
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

        if (isUpdate) {

        } else {

        }
    }

    private async shouldUpdateDraft(token: string): Promise<{ shouldUpdate: boolean; media_id?: string; index: number }> {
        const currentTitle = this.currentFile?.basename || this.render.title || '未命名文章';

        try {
            // Claude Code Update - 更新import路径
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
                    console.log(`  - 草稿${i + 1}: "${draftTitle}" (ID: ${draft.media_id})`);
                    
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

        const textarea = document.createElement('textarea');
        textarea.value = this.render.getArticleContent();
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        
        document.body.appendChild(textarea);
        
        try {
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
                this.showLoading(`即将发布: ${file.name}`, true);
                await new Promise(resolve => setTimeout(resolve, 5000));
                if (this.isCancelUpload) {
                    break;
                }
                this.cleanArticleData();
                await this.renderMarkdown(file as TFile);
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

    getCurrentAppId(): string {
        return this.currentAppId;
    }

    getCurrentFile(): TFile | undefined {
        return this.currentFile;
    }

    getAssetsManager(): AssetsManager {
        return this.assetsManager;
    }

    getSettings(): NMPSettings {
        return this.settings;
    }
}