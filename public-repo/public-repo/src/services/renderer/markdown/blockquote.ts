import { Tokens, MarkedExtension } from "marked";
import { Extension, MDRendererCallback } from "./extension";
// Claude Code Update - 更新import路径
import { NMPSettings } from "../../../core/settings";
import { App, Vault } from "obsidian";
import AssetsManager from "../../../core/assets";
import { CalloutRenderer } from "./callouts";

export class Blockquote extends Extension {
  callout: CalloutRenderer;

  constructor(app: App, settings: NMPSettings, assetsManager: AssetsManager, callback: MDRendererCallback) {
    super(app, settings, assetsManager, callback);
    this.callout = new CalloutRenderer(app, settings, assetsManager, callback);
  }

  async prepare() { 
    if (!this.marked) {

      return;
    }
    if (this.callout) this.callout.marked = this.marked;
    // Claude Code Remove - 移除box引用
    return;
  }

  async renderer(token: Tokens.Blockquote) {
    if (this.callout.matched(token.text)) {
      return await this.callout.renderer(token);
    }

    // Claude Code Remove - 移除box处理逻辑

    const body = await this.marked.parse(token.text);
    return `<blockquote>${body}</blockquote>`;
  }

  markedExtension(): MarkedExtension {
    return {
      async: true,
      walkTokens: async (token: Tokens.Generic) => {
        if (token.type !== 'blockquote') {
          return;
        }
        token.html = await this.renderer(token as Tokens.Blockquote);
      },
      extensions: [{
        name: 'blockquote',
        level: 'block',
        renderer: (token: Tokens.Generic) => {
          return token.html;
        },
      }]
    }
  }
}