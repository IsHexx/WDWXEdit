import { Tokens, MarkedExtension } from "marked";
import { Extension } from "./extension";

const refRule = /^\[\^([^\]]+)\]/; // 匹配 [^label]
const defRule = /^ *\[\^([^\]]+)\]:/; // 匹配 [^label]: 

export class FootnoteRenderer extends Extension {
  allDefs: any[] = [];
  async prepare() {
    this.allDefs = [];
  }

  async postprocess(html: string) {
    if (this.allDefs.length == 0) {
      return html;
    }

    let body  = '';
    for (const def of this.allDefs) {
      const {label, content} = def;
      const html = await this.marked.parse(content);
      const id = `fn-${label}`;
      body += `<li id="${id}">${html}</li>`;
    }
    return html + `<section class="footnotes"><hr><ol>${body}</ol></section>`;
  }

  markedExtension(): MarkedExtension {
    return {
      extensions: [
        {
          name: 'FootnoteRef',
          level: 'inline',
          start(src) {
            const index = src.indexOf('[^');
            return index > 0 ? index : -1;
          },
          tokenizer: (src) => {
            const match = src.match(refRule);
            if (match) {
              return {
                type: 'FootnoteRef',
                raw: match[0],
                text: match[1],
              };
            }
          },
          renderer: (token: Tokens.Generic) => {
            const index = this.allDefs.findIndex((def) => def.label == token.text) + 1;
            const id = `fnref-${index}`;
            return `<sup id="${id}" class="fnref-sup">${index}</sup>`;
          }
        },
        {
          name: 'FootnoteDef',
          level: 'block',
          tokenizer: (src) => {
            const match = src.match(defRule);
            if (match) {
              const label = match[1].trim();
              const end = src.indexOf('\n');
              const raw = end === -1 ? src: src.substring(0, end + 1);
              const content = raw.substring(match[0].length);
              this.allDefs.push({label, content});

              return {
                type: 'FootnoteDef',
                raw: raw,
                text: content,
              };
            }
          },
          renderer: (token: Tokens.Generic) => {
            return '';
          }
        }
      ]
    }
  }
}