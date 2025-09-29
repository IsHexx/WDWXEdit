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
	constructor(app: App, manifest: PluginManifest) {
	    super(app, manifest);
			AssetsManager.setup(app, manifest);
	    this.assetsManager = AssetsManager.getInstance();
	}

	async loadResource() {
		await this.loadSettings();
		await this.assetsManager.loadAssets();
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
		
		this.app.workspace.onLayoutReady(()=>{
			this.loadResource();
		})

		this.registerView(
			VIEW_TYPE_NOTE_PREVIEW,
			(leaf) => new NotePreview(leaf, this)
		);

		const ribbonIconEl = this.addRibbonIcon('clipboard-paste', '复制到公众号', (evt: MouseEvent) => {
			this.activateView();
		});
		ribbonIconEl.addClass('wdwxedit-plugin-ribbon-class');

		this.addCommand({
			id: 'wdwxedit-preview',
			name: '复制到公众号',
			callback: () => {
				this.activateView();
			}
		});

		this.addSettingTab(new NoteToMpSettingTab(this.app, this));

		this.addCommand({
			id: 'wdwxedit-pub',
			name: '发布公众号文章',
			callback: async () => {
				await this.activateView();
				this.getNotePreview()?.getController()?.postArticle();
			}
		});

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
	}

	onunload() {

	}

	async loadSettings() {
		NMPSettings.loadSettings(await this.loadData());
	}

	async saveSettings() {
		await this.saveData(NMPSettings.allSettings());
	}

	async activateView() {
		const { workspace } = this.app;
	
		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_NOTE_PREVIEW);
	
		if (leaves.length > 0) {
			leaf = leaves[0];
		} else {
		  	leaf = workspace.getRightLeaf(false);
		  	await leaf?.setViewState({ type: VIEW_TYPE_NOTE_PREVIEW, active: false });
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
}
