import { Tokens, MarkedExtension } from "marked";
import { Extension } from "./extension";
// Claude Code Update - 更新import路径
import AssetsManager from "../../../core/assets";
// Claude Code Remove
// Claude Code Remove

export class HeadingRenderer extends Extension {
  index = [0, 0, 0, 0];
  // Claude Code Remove - 移除expertSettings相关功能

  async prepare() {
    this.index = [0, 0, 0, 0];
  }

  // Claude Code Remove - 移除所有widget相关的渲染方法

  markedExtension(): MarkedExtension {
    return {
      async: true,
      walkTokens: async (token: Tokens.Generic) => {
        if (token.type !== 'heading') {
          return;
        }

        // Claude Code Update - 简化标题渲染，移除专家设置功能
        this.index[token.depth] += 1;
        const body = await this.marked.parseInline(token.text);
        token.html = `<h${token.depth}>${body}</h${token.depth}>`;
      },
      extensions: [{
        name: 'heading',
        level: 'block',
        renderer: (token: Tokens.Generic) => {
          return token.html;
        },
      }]
    }
  }
}