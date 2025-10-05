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
import { Extension } from "./extension";
const refRule = /^\[\^([^\]]+)\]/; // 匹配 [^label]
const defRule = /^ *\[\^([^\]]+)\]:/; // 匹配 [^label]: 
export class FootnoteRenderer extends Extension {
    constructor() {
        super(...arguments);
        this.allDefs = [];
    }
    async prepare() {
        this.allDefs = [];
    }
    async postprocess(html) {
        if (this.allDefs.length == 0) {
            return html;
        }
        let body = '';
        for (const def of this.allDefs) {
            const { label, content } = def;
            const html = await this.marked.parse(content);
            const id = `fn-${label}`;
            body += `<li id="${id}">${html}</li>`;
        }
        return html + `<section class="footnotes"><hr><ol>${body}</ol></section>`;
    }
    markedExtension() {
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
                    renderer: (token) => {
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
                            const raw = end === -1 ? src : src.substring(0, end + 1);
                            const content = raw.substring(match[0].length);
                            this.allDefs.push({ label, content });
                            return {
                                type: 'FootnoteDef',
                                raw: raw,
                                text: content,
                            };
                        }
                    },
                    renderer: (token) => {
                        return '';
                    }
                }
            ]
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9vdG5vdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmb290bm90ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7O0dBWUc7QUFHSCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBRXhDLE1BQU0sT0FBTyxHQUFHLGlCQUFpQixDQUFDLENBQUMsY0FBYztBQUNqRCxNQUFNLE9BQU8sR0FBRyxvQkFBb0IsQ0FBQyxDQUFDLGdCQUFnQjtBQUV0RCxNQUFNLE9BQU8sZ0JBQWlCLFNBQVEsU0FBUztJQUEvQzs7UUFDRSxZQUFPLEdBQVUsRUFBRSxDQUFDO0lBd0V0QixDQUFDO0lBdkVDLEtBQUssQ0FBQyxPQUFPO1FBQ1gsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7SUFDcEIsQ0FBQztJQUVELEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBWTtRQUM1QixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtZQUM1QixPQUFPLElBQUksQ0FBQztTQUNiO1FBRUQsSUFBSSxJQUFJLEdBQUksRUFBRSxDQUFDO1FBQ2YsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO1lBQzlCLE1BQU0sRUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFDLEdBQUcsR0FBRyxDQUFDO1lBQzdCLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDOUMsTUFBTSxFQUFFLEdBQUcsTUFBTSxLQUFLLEVBQUUsQ0FBQztZQUN6QixJQUFJLElBQUksV0FBVyxFQUFFLEtBQUssSUFBSSxPQUFPLENBQUM7U0FDdkM7UUFDRCxPQUFPLElBQUksR0FBRyxzQ0FBc0MsSUFBSSxpQkFBaUIsQ0FBQztJQUM1RSxDQUFDO0lBRUQsZUFBZTtRQUNiLE9BQU87WUFDTCxVQUFVLEVBQUU7Z0JBQ1Y7b0JBQ0UsSUFBSSxFQUFFLGFBQWE7b0JBQ25CLEtBQUssRUFBRSxRQUFRO29CQUNmLEtBQUssQ0FBQyxHQUFHO3dCQUNQLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ2hDLE9BQU8sS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDaEMsQ0FBQztvQkFDRCxTQUFTLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTt3QkFDakIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDakMsSUFBSSxLQUFLLEVBQUU7NEJBQ1QsT0FBTztnQ0FDTCxJQUFJLEVBQUUsYUFBYTtnQ0FDbkIsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0NBQ2IsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7NkJBQ2YsQ0FBQzt5QkFDSDtvQkFDSCxDQUFDO29CQUNELFFBQVEsRUFBRSxDQUFDLEtBQXFCLEVBQUUsRUFBRTt3QkFDbEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDM0UsTUFBTSxFQUFFLEdBQUcsU0FBUyxLQUFLLEVBQUUsQ0FBQzt3QkFDNUIsT0FBTyxZQUFZLEVBQUUsdUJBQXVCLEtBQUssUUFBUSxDQUFDO29CQUM1RCxDQUFDO2lCQUNGO2dCQUNEO29CQUNFLElBQUksRUFBRSxhQUFhO29CQUNuQixLQUFLLEVBQUUsT0FBTztvQkFDZCxTQUFTLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTt3QkFDakIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQzt3QkFDakMsSUFBSSxLQUFLLEVBQUU7NEJBQ1QsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDOzRCQUM5QixNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDOzRCQUM5QixNQUFNLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQSxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDOzRCQUN4RCxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQzs0QkFDL0MsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBQyxLQUFLLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQzs0QkFFcEMsT0FBTztnQ0FDTCxJQUFJLEVBQUUsYUFBYTtnQ0FDbkIsR0FBRyxFQUFFLEdBQUc7Z0NBQ1IsSUFBSSxFQUFFLE9BQU87NkJBQ2QsQ0FBQzt5QkFDSDtvQkFDSCxDQUFDO29CQUNELFFBQVEsRUFBRSxDQUFDLEtBQXFCLEVBQUUsRUFBRTt3QkFDbEMsT0FBTyxFQUFFLENBQUM7b0JBQ1osQ0FBQztpQkFDRjthQUNGO1NBQ0YsQ0FBQTtJQUNILENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMjQtMjAyNSBJc0hleHhcbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb2Z0d2FyZSBpcyBwcm9wcmlldGFyeSBhbmQgY29uZmlkZW50aWFsLiBObyBwYXJ0IG9mIHRoaXMgc29mdHdhcmVcbiAqIG1heSBiZSByZXByb2R1Y2VkLCBkaXN0cmlidXRlZCwgb3IgdHJhbnNtaXR0ZWQgaW4gYW55IGZvcm0gb3IgYnkgYW55IG1lYW5zLFxuICogaW5jbHVkaW5nIHBob3RvY29weWluZywgcmVjb3JkaW5nLCBvciBvdGhlciBlbGVjdHJvbmljIG9yIG1lY2hhbmljYWwgbWV0aG9kcyxcbiAqIHdpdGhvdXQgdGhlIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbiBvZiB0aGUgYXV0aG9yLCBleGNlcHQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGJyaWVmIHF1b3RhdGlvbnMgZW1ib2RpZWQgaW4gY3JpdGljYWwgcmV2aWV3cyBhbmQgY2VydGFpbiBvdGhlciBub25jb21tZXJjaWFsXG4gKiB1c2VzIHBlcm1pdHRlZCBieSBjb3B5cmlnaHQgbGF3LlxuICpcbiAqIEZvciBwZXJtaXNzaW9uIHJlcXVlc3RzLCBjb250YWN0OiBJc0hleHhcbiAqL1xuXG5pbXBvcnQgeyBUb2tlbnMsIE1hcmtlZEV4dGVuc2lvbiB9IGZyb20gXCJtYXJrZWRcIjtcbmltcG9ydCB7IEV4dGVuc2lvbiB9IGZyb20gXCIuL2V4dGVuc2lvblwiO1xuXG5jb25zdCByZWZSdWxlID0gL15cXFtcXF4oW15cXF1dKylcXF0vOyAvLyDljLnphY0gW15sYWJlbF1cbmNvbnN0IGRlZlJ1bGUgPSAvXiAqXFxbXFxeKFteXFxdXSspXFxdOi87IC8vIOWMuemFjSBbXmxhYmVsXTogXG5cbmV4cG9ydCBjbGFzcyBGb290bm90ZVJlbmRlcmVyIGV4dGVuZHMgRXh0ZW5zaW9uIHtcbiAgYWxsRGVmczogYW55W10gPSBbXTtcbiAgYXN5bmMgcHJlcGFyZSgpIHtcbiAgICB0aGlzLmFsbERlZnMgPSBbXTtcbiAgfVxuXG4gIGFzeW5jIHBvc3Rwcm9jZXNzKGh0bWw6IHN0cmluZykge1xuICAgIGlmICh0aGlzLmFsbERlZnMubGVuZ3RoID09IDApIHtcbiAgICAgIHJldHVybiBodG1sO1xuICAgIH1cblxuICAgIGxldCBib2R5ICA9ICcnO1xuICAgIGZvciAoY29uc3QgZGVmIG9mIHRoaXMuYWxsRGVmcykge1xuICAgICAgY29uc3Qge2xhYmVsLCBjb250ZW50fSA9IGRlZjtcbiAgICAgIGNvbnN0IGh0bWwgPSBhd2FpdCB0aGlzLm1hcmtlZC5wYXJzZShjb250ZW50KTtcbiAgICAgIGNvbnN0IGlkID0gYGZuLSR7bGFiZWx9YDtcbiAgICAgIGJvZHkgKz0gYDxsaSBpZD1cIiR7aWR9XCI+JHtodG1sfTwvbGk+YDtcbiAgICB9XG4gICAgcmV0dXJuIGh0bWwgKyBgPHNlY3Rpb24gY2xhc3M9XCJmb290bm90ZXNcIj48aHI+PG9sPiR7Ym9keX08L29sPjwvc2VjdGlvbj5gO1xuICB9XG5cbiAgbWFya2VkRXh0ZW5zaW9uKCk6IE1hcmtlZEV4dGVuc2lvbiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGV4dGVuc2lvbnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdGb290bm90ZVJlZicsXG4gICAgICAgICAgbGV2ZWw6ICdpbmxpbmUnLFxuICAgICAgICAgIHN0YXJ0KHNyYykge1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBzcmMuaW5kZXhPZignW14nKTtcbiAgICAgICAgICAgIHJldHVybiBpbmRleCA+IDAgPyBpbmRleCA6IC0xO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgdG9rZW5pemVyOiAoc3JjKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBtYXRjaCA9IHNyYy5tYXRjaChyZWZSdWxlKTtcbiAgICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdGb290bm90ZVJlZicsXG4gICAgICAgICAgICAgICAgcmF3OiBtYXRjaFswXSxcbiAgICAgICAgICAgICAgICB0ZXh0OiBtYXRjaFsxXSxcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlbmRlcmVyOiAodG9rZW46IFRva2Vucy5HZW5lcmljKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuYWxsRGVmcy5maW5kSW5kZXgoKGRlZikgPT4gZGVmLmxhYmVsID09IHRva2VuLnRleHQpICsgMTtcbiAgICAgICAgICAgIGNvbnN0IGlkID0gYGZucmVmLSR7aW5kZXh9YDtcbiAgICAgICAgICAgIHJldHVybiBgPHN1cCBpZD1cIiR7aWR9XCIgY2xhc3M9XCJmbnJlZi1zdXBcIj4ke2luZGV4fTwvc3VwPmA7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogJ0Zvb3Rub3RlRGVmJyxcbiAgICAgICAgICBsZXZlbDogJ2Jsb2NrJyxcbiAgICAgICAgICB0b2tlbml6ZXI6IChzcmMpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gc3JjLm1hdGNoKGRlZlJ1bGUpO1xuICAgICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGxhYmVsID0gbWF0Y2hbMV0udHJpbSgpO1xuICAgICAgICAgICAgICBjb25zdCBlbmQgPSBzcmMuaW5kZXhPZignXFxuJyk7XG4gICAgICAgICAgICAgIGNvbnN0IHJhdyA9IGVuZCA9PT0gLTEgPyBzcmM6IHNyYy5zdWJzdHJpbmcoMCwgZW5kICsgMSk7XG4gICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSByYXcuc3Vic3RyaW5nKG1hdGNoWzBdLmxlbmd0aCk7XG4gICAgICAgICAgICAgIHRoaXMuYWxsRGVmcy5wdXNoKHtsYWJlbCwgY29udGVudH0pO1xuXG4gICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ0Zvb3Rub3RlRGVmJyxcbiAgICAgICAgICAgICAgICByYXc6IHJhdyxcbiAgICAgICAgICAgICAgICB0ZXh0OiBjb250ZW50LFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgcmVuZGVyZXI6ICh0b2tlbjogVG9rZW5zLkdlbmVyaWMpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIF1cbiAgICB9XG4gIH1cbn0iXX0=