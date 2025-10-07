import { Tokens, MarkedExtension } from "marked";
import { Extension } from "./extension";

const topicRegex = /^#([^\s#]+)/;

export class Topic extends Extension {
  markedExtension(): MarkedExtension {
    return {
      extensions: [{
        name: 'Topic',
        level: 'inline',
        start(src: string) {
          let index;
          let indexSrc = src;

          while (indexSrc) {
            index = indexSrc.indexOf('#');
            if (index === -1) return;
            return index;
          }
        },
        tokenizer(src: string) {
          const match = src.match(topicRegex);
          if (match) {
            return {
              type: 'Topic',
              raw: match[0],
              text: match[1],
            };
          }
        },
        renderer(token: Tokens.Generic) {
          return `<a class="wx_topic_link" data-topic="1">${'#' + token.text.trim()}</a>`;
        }
      },
      ]
    }
  }
}
