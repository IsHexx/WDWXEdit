import { Plugin, WorkspaceLeaf, App, PluginManifest, Menu, Notice, TAbstractFile, TFile, TFolder } from 'obsidian';
import { WxPreview, VIEW_TYPE_WX_PREVIEW } from '../wx-preview';
import { WxSettings } from './settings';
import { WxSettingTab } from '../ui/setting-tab';
import AssetsManager from './assets';
import { setVersion, uevent } from '../shared/utils';
import { initApiClients, WechatApiUtils } from '../services/api';

export default class WxEditPlugin extends Plugin {
	settings: WxSettings;
	assetsManager: AssetsManager;
	private isInitialized: boolean = false; // 初始化状态标志
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
		
		//Update - 延迟初始化API客户端，避免阻塞启动
		setTimeout(async () => {
			try {
				initApiClients();
			} catch (error) {

			}
		}, 1000);
		
		// Update - 将所有需要workspace ready的操作移到onLayoutReady回调中
		this.app.workspace.onLayoutReady(async ()=>{
			try {
				// 1. 先加载基础资源
				await this.loadResource();

				// 2. 注册视图（workspace ready后才能安全操作）
				this.registerView(
					VIEW_TYPE_WX_PREVIEW,
					(leaf) => new WxPreview(leaf, this)
				);

				// 3. 添加功能区图标（回调中会访问workspace）
				const ribbonIconEl = this.addRibbonIcon('fish-symbol', '复制到公众号', (evt: MouseEvent) => {
					this.activateView();
				});
				ribbonIconEl.addClass('wxedit-plugin-ribbon-class');

				// 4. 添加命令（回调中会访问workspace）
				this.addCommand({
					id: 'wxedit-preview',
					name: '复制到公众号',
					callback: () => {
						this.activateView();
					}
				});

				this.addCommand({
					id: 'wxedit-pub',
					name: '发布公众号文章',
					callback: async () => {
						await this.activateView();
						this.getWxPreview()?.getController()?.postArticle();
					}
				});

				// 5. 添加设置选项卡
				this.addSettingTab(new WxSettingTab(this.app, this));

				// 6. 监听右键菜单（workspace ready后才能安全监听）
				this.registerEvent(
					this.app.workspace.on('file-menu', (menu, file) => {
						menu.addItem((item) => {
							item
								.setTitle('发布到公众号')
								.setIcon('fish-symbol')
								.onClick(async () => {
									if (file instanceof TFile) {
										if (file.extension.toLowerCase() !== 'md') {
											new Notice('只能发布 Markdown 文件');
											return;
										}
										await this.activateView();
										await this.getWxPreview()?.getController()?.renderMarkdown(file);
										await this.getWxPreview()?.getController()?.postArticle();
									} else if (file instanceof TFolder) {
										await this.activateView();
										await this.getWxPreview()?.getController()?.batchPost(file);
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
		WxSettings.loadSettings(await this.loadData());
	}

	async saveSettings() {
		await this.saveData(WxSettings.allSettings());

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
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_WX_PREVIEW);
	
		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
		  	leaf = workspace.getRightLeaf(false);
		  	if (leaf) {
			  	await leaf?.setViewState({ type: VIEW_TYPE_WX_PREVIEW, active: false });
			} else {

				return;
			}
		}
	
		if (leaf) workspace.revealLeaf(leaf);
	}

	getWxPreview(): WxPreview | null {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_WX_PREVIEW);
		if (leaves.length > 0) {
			const leaf = leaves[0];
			return leaf.view as WxPreview;
		}
		return null;
	}

	private refreshAllPreviews(): void {
		const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_WX_PREVIEW);
		leaves.forEach(leaf => {
			const view = leaf.view as WxPreview;
			if (view && typeof view.forceRefresh === 'function') {
				view.forceRefresh();
			}
		});
	}
}
