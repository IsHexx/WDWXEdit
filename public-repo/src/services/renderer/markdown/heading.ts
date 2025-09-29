import { Tokens, MarkedExtension } from "marked";
import { Extension } from "./extension";

import AssetsManager from "../../../core/assets";

export class HeadingRenderer extends Extension {
  index = [0, 0, 0, 0];

  async prepare() {
    this.index = [0, 0, 0, 0];
  }

  markedExtension(): MarkedExtension {
    return {
      async: true,
      walkTokens: async (token: Tokens.Generic) => {
        if (token.type !== 'heading') {
          return;
        }

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