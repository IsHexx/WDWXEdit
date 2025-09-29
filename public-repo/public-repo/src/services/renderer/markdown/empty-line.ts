import { Tokens, MarkedExtension } from "marked";
import { Extension } from "./extension";

export class EmptyLineRenderer extends Extension {
  markedExtension(): MarkedExtension {
    return {
      extensions: [{
        name: 'emptyline',
        level: 'block',
        tokenizer(src: string) {
          const match = /^\n\n+/.exec(src);
          if (match) {
            console.log('mathced src: ', src)
            return {
              type: "emptyline",
              raw: match[0],
            };
          }
        },
        renderer: (token: Tokens.Generic) => {
          return '<p><br></p>'.repeat(token.raw.length - 1);
        },
      }]
    }
  }
}
