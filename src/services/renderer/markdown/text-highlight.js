/*
 * Copyright (c) 2024-2025 IsHexx
 * All rights reserved.
 *
 * This software is proprietary and confidential. No part of this software
 * may be reproduced, distributed, or transmitted in any form or by any means,
 * including photocopying, recording, or other electronic or mechanical methods,
 * without the prior written permission of the author, except in the case of
 * brief quotations embodied in critical reviews and certain other noncommercial
 * uses permitted by copyright law.
 *
 * For permission requests, contact: IsHexx
 */
import { Lexer } from "marked";
import { Extension } from "./extension";
const highlightRegex = /^==(.*?)==/;
export class TextHighlight extends Extension {
    markedExtension() {
        return {
            extensions: [{
                    name: 'InlineHighlight',
                    level: 'inline',
                    start(src) {
                        let index;
                        let indexSrc = src;
                        while (indexSrc) {
                            index = indexSrc.indexOf('==');
                            if (index === -1)
                                return;
                            return index;
                        }
                    },
                    tokenizer(src, tokens) {
                        const match = src.match(highlightRegex);
                        if (match) {
                            return {
                                type: 'InlineHighlight',
                                raw: match[0],
                                text: match[1],
                            };
                        }
                    },
                    renderer(token) {
                        const lexer = new Lexer();
                        const tokens = lexer.lex(token.text);
                        // TODO: 优化一下
                        let body = this.parser.parse(tokens);
                        body = body.replace('<p>', '');
                        body = body.replace('</p>', '');
                        return `<span class="note-highlight">${body}</span>`;
                    }
                }]
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dC1oaWdobGlnaHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXh0LWhpZ2hsaWdodC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7O0dBWUc7QUFFSCxPQUFPLEVBQWlCLEtBQUssRUFBbUIsTUFBTSxRQUFRLENBQUM7QUFDL0QsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUV4QyxNQUFNLGNBQWMsR0FBRyxZQUFZLENBQUM7QUFFcEMsTUFBTSxPQUFPLGFBQWMsU0FBUSxTQUFTO0lBQ3hDLGVBQWU7UUFDWCxPQUFPO1lBQ0gsVUFBVSxFQUFFLENBQUM7b0JBQ1QsSUFBSSxFQUFFLGlCQUFpQjtvQkFDdkIsS0FBSyxFQUFFLFFBQVE7b0JBQ2YsS0FBSyxDQUFDLEdBQVc7d0JBQ2IsSUFBSSxLQUFLLENBQUM7d0JBQ1YsSUFBSSxRQUFRLEdBQUcsR0FBRyxDQUFDO3dCQUVuQixPQUFPLFFBQVEsRUFBRTs0QkFDYixLQUFLLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzs0QkFDL0IsSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFDO2dDQUFFLE9BQU87NEJBQ3pCLE9BQU8sS0FBSyxDQUFDO3lCQUNoQjtvQkFDTCxDQUFDO29CQUNELFNBQVMsQ0FBQyxHQUFXLEVBQUUsTUFBZTt3QkFDbEMsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQzt3QkFDeEMsSUFBSSxLQUFLLEVBQUU7NEJBQ1AsT0FBTztnQ0FDSCxJQUFJLEVBQUUsaUJBQWlCO2dDQUN2QixHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztnQ0FDYixJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQzs2QkFDakIsQ0FBQzt5QkFDTDtvQkFDTCxDQUFDO29CQUNELFFBQVEsQ0FBQyxLQUFxQjt3QkFDMUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQzt3QkFDMUIsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ3JDLGFBQWE7d0JBQ2IsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUE7d0JBQ3BDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQTt3QkFDOUIsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFBO3dCQUMvQixPQUFPLGdDQUFnQyxJQUFJLFNBQVMsQ0FBQztvQkFDekQsQ0FBQztpQkFDSixDQUFDO1NBQ0wsQ0FBQztJQUNOLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMjQtMjAyNSBJc0hleHhcbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb2Z0d2FyZSBpcyBwcm9wcmlldGFyeSBhbmQgY29uZmlkZW50aWFsLiBObyBwYXJ0IG9mIHRoaXMgc29mdHdhcmVcbiAqIG1heSBiZSByZXByb2R1Y2VkLCBkaXN0cmlidXRlZCwgb3IgdHJhbnNtaXR0ZWQgaW4gYW55IGZvcm0gb3IgYnkgYW55IG1lYW5zLFxuICogaW5jbHVkaW5nIHBob3RvY29weWluZywgcmVjb3JkaW5nLCBvciBvdGhlciBlbGVjdHJvbmljIG9yIG1lY2hhbmljYWwgbWV0aG9kcyxcbiAqIHdpdGhvdXQgdGhlIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbiBvZiB0aGUgYXV0aG9yLCBleGNlcHQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGJyaWVmIHF1b3RhdGlvbnMgZW1ib2RpZWQgaW4gY3JpdGljYWwgcmV2aWV3cyBhbmQgY2VydGFpbiBvdGhlciBub25jb21tZXJjaWFsXG4gKiB1c2VzIHBlcm1pdHRlZCBieSBjb3B5cmlnaHQgbGF3LlxuICpcbiAqIEZvciBwZXJtaXNzaW9uIHJlcXVlc3RzLCBjb250YWN0OiBJc0hleHhcbiAqL1xuXG5pbXBvcnQgeyBUb2tlbiwgVG9rZW5zLCBMZXhlciwgTWFya2VkRXh0ZW5zaW9uIH0gZnJvbSBcIm1hcmtlZFwiO1xuaW1wb3J0IHsgRXh0ZW5zaW9uIH0gZnJvbSBcIi4vZXh0ZW5zaW9uXCI7XG5cbmNvbnN0IGhpZ2hsaWdodFJlZ2V4ID0gL149PSguKj8pPT0vO1xuXG5leHBvcnQgY2xhc3MgVGV4dEhpZ2hsaWdodCBleHRlbmRzIEV4dGVuc2lvbiB7XG4gICAgbWFya2VkRXh0ZW5zaW9uKCk6IE1hcmtlZEV4dGVuc2lvbiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBleHRlbnNpb25zOiBbe1xuICAgICAgICAgICAgICAgIG5hbWU6ICdJbmxpbmVIaWdobGlnaHQnLFxuICAgICAgICAgICAgICAgIGxldmVsOiAnaW5saW5lJyxcbiAgICAgICAgICAgICAgICBzdGFydChzcmM6IHN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIGxldCBpbmRleFNyYyA9IHNyYztcblxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaW5kZXhTcmMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gaW5kZXhTcmMuaW5kZXhPZignPT0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdG9rZW5pemVyKHNyYzogc3RyaW5nLCB0b2tlbnM6IFRva2VuW10pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSBzcmMubWF0Y2goaGlnaGxpZ2h0UmVnZXgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ0lubGluZUhpZ2hsaWdodCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmF3OiBtYXRjaFswXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBtYXRjaFsxXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlbmRlcmVyKHRva2VuOiBUb2tlbnMuR2VuZXJpYykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsZXhlciA9IG5ldyBMZXhlcigpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB0b2tlbnMgPSBsZXhlci5sZXgodG9rZW4udGV4dCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IOS8mOWMluS4gOS4i1xuICAgICAgICAgICAgICAgICAgICBsZXQgYm9keSA9IHRoaXMucGFyc2VyLnBhcnNlKHRva2VucylcbiAgICAgICAgICAgICAgICAgICAgYm9keSA9IGJvZHkucmVwbGFjZSgnPHA+JywgJycpXG4gICAgICAgICAgICAgICAgICAgIGJvZHkgPSBib2R5LnJlcGxhY2UoJzwvcD4nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGA8c3BhbiBjbGFzcz1cIm5vdGUtaGlnaGxpZ2h0XCI+JHtib2R5fTwvc3Bhbj5gO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1dXG4gICAgICAgIH07XG4gICAgfVxufSJdfQ==