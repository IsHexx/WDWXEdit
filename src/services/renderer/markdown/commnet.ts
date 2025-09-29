import { Tokens, MarkedExtension } from "marked";
import { Extension } from "./extension";

const commentRegex = /^%%([\s\S]*?)%%/;

export class Comment extends Extension {
  markedExtension(): MarkedExtension {
    return {
      extensions: [{
        name: 'CommentInline',
        level: 'inline',
        start(src: string) {
          let index;
          let indexSrc = src;

          while (indexSrc) {
            index = indexSrc.indexOf('%%');
            if (index === -1) return;
            return index;
          }
        },
        tokenizer(src: string) {
          const match = src.match(commentRegex);
          if (match) {
            return {
              type: 'CommentInline',
              raw: match[0],
              text: match[1],
            };
          }
        },
        renderer(token: Tokens.Generic) {
          return '';
        }
      },
      {
        name: 'CommentBlock',
        level: 'block',
        tokenizer(src: string) {
          const match = src.match(commentRegex);
          if (match) {
            return {
              type: 'CommentBlock',
              raw: match[0],
              text: match[1],
            };
          }
        },
        renderer(token: Tokens.Generic) {
          return '';
        }
      },
      ]
    }
  }
}