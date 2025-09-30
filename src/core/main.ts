import { Plugin, WorkspaceLeaf, App, PluginManifest, Menu, Notice, TAbstractFile, TFile, TFolder } from 'obsidian';
import { NotePreview, VIEW_TYPE_NOTE_PREVIEW } from '../note-preview';
import { NMPSettings } from './settings';
import { NoteToMpSettingTab } from '../ui/setting-tab';
import AssetsManager from './assets';
import { setVersion, uevent } from '../shared/utils';
import { initApiClients, WechatApiUtils } from '../services/api';

export default class NoteToMpPlugin extends Plugin {
	settings: NMPSettings;
	assetsManager: AssetsManager;
	private isInitialized: boolean = false; // Claude Code ADD - 初始化状态标志
	constructor(app: App, manifest: PluginManifest) {
	    super(app, manifest);
			AssetsManager.setup(app, manifest);
	    this.assetsManager = AssetsManager.getInstance();
	}

	async loadResource() {
		await this.loadSettings();
		await this.assetsManager.loadAssets();

		this.isInitialized = true;
	}

	async onload() {

		setVersion(this.manifest.version);
		uevent('load');

		setTimeout(async () => {
			try {
				initApiClients();
			} catch (error) {

			}
		}, 1000);

		this.app.workspace.onLayoutReady(async ()=>{
			try {
				// 1. 先加载基础资源
				await this.loadResource();

				// 2. 注册视图（workspace ready后才能安全操作）
				this.registerView(
					VIEW_TYPE_NOTE_PREVIEW,
					(leaf) => new NotePreview(leaf, this)
				);

				// 3. 添加功能区图标（回调中会访问workspace）
				const ribbonIconEl = this.addRibbonIcon('clipboard-paste', '复制到公众号', (evt: MouseEvent) => {
					this.activateView();
				});
				ribbonIconEl.addClass('wdwxedit-plugin-ribbon-class');

				// 4. 添加命令（回调中会访问workspace）
				this.addCommand({
					id: 'wdwxedit-preview',
					name: '复制到公众号',
					callback: () => {
						this.activateView();
					}
				});

				this.addCommand({
					id: 'wdwxedit-pub',
					name: '发布公众号文章',
					callback: async () => {
						await this.activateView();
						this.getNotePreview()?.getController()?.postArticle();
					}
				});

				// 5. 添加设置选项卡
				this.addSettingTab(new NoteToMpSettingTab(this.app, this));

				// 6. 监听右键菜单（workspace ready后才能安全监听）
				this.registerEvent(
					this.app.workspace.on('file-menu', (menu, file) => {
						menu.addItem((item) => {
							item
								.setTitle('发布到公众号')
								.setIcon('lucide-send')
								.onClick(async () => {
									if (file instanceof TFile) {
										if (file.extension.toLowerCase() !== 'md') {
											new Notice('只能发布 Markdown 文件');
											return;
										}
										await this.activateView();
										await this.getNotePreview()?.getController()?.renderMarkdown(file);
										await this.getNotePreview()?.getController()?.postArticle();
									} else if (file instanceof TFolder) {
										await this.activateView();
										await this.getNotePreview()?.getController()?.batchPost(file);
									}
								});
						});
					})
				);

			} catch (error) {

			}
		});
	}

	onunload() {

	}

	async loadSettings() {
		NMPSettings.loadSettings(await this.loadData());
	}

	async saveSettings() {
		await this.saveData(NMPSettings.allSettings());

		if (this.isInitialized) {
			this.refreshAllPreviews();
		}
	}

	async activateView() {

		if (!this.app.workspace.layoutReady) {

			this.app.workspace.onLayoutReady(() => {
				setTimeout(() => this.activateView(), 100);
			});
			return;
		}
		
		const { workspace } = this.app;
	
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_NOTE_PREVIEW);
	
		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
		  	leaf = workspace.getRightLeaf(false);
		  	if (leaf) {
			  	await leaf?.setViewState({ type: VIEW_TYPE_NOTE_PREVIEW, active: false });
			} else {

				return;
			}
		}
	
		if (leaf) workspace.revealLeaf(leaf);
	}

	getNotePreview(): NotePreview | null {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_NOTE_PREVIEW);
		if (leaves.length > 0) {
			const leaf = leaves[0];
			return leaf.view as NotePreview;
		}
		return null;
	}

	private refreshAllPreviews(): void {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_NOTE_PREVIEW);
		leaves.forEach(leaf => {
			const view = leaf.view as NotePreview;
			if (view && typeof view.forceRefresh === 'function') {
				view.forceRefresh();
			}
		});
	}
}
