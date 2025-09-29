// Claude Code Update - 更新import路径
import { NMPSettings } from "../../../core/settings";
import { Marked, MarkedExtension } from "marked";
import { App, Vault } from "obsidian";
import AssetsManager from "../../../core/assets";

export interface MDRendererCallback {
   settings: NMPSettings;
   updateElementByID(id:string, html:string):void; // 改为异步渲染后已废弃
   cacheElement(category: string, id: string, data: string): void;
}

export abstract class Extension {
    app: App;
    vault: Vault;
    assetsManager: AssetsManager
    settings: NMPSettings;
    callback: MDRendererCallback;
    marked: Marked;

    constructor(app: App, settings: NMPSettings, assetsManager: AssetsManager, callback: MDRendererCallback) {
        this.app = app;
        this.vault = app.vault;
        this.settings = settings;
        this.assetsManager = assetsManager;
        this.callback = callback;
    }

    async prepare() { return; }
    async postprocess(html:string) { return html; }
    async beforePublish() { }
    async cleanup() { return; }
    abstract markedExtension(): MarkedExtension
}