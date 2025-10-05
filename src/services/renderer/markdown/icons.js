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
const iconsRegex = /^\[:(.*?):\]/;
export class SVGIcon extends Extension {
    isNumeric(str) {
        return !isNaN(Number(str)) && str.trim() !== '';
    }
    getSize(size) {
        const items = size.split('x');
        let width, height;
        if (items.length == 2) {
            width = items[0];
            height = items[1];
        }
        else {
            width = items[0];
            height = items[0];
        }
        width = this.isNumeric(width) ? width + 'px' : width;
        height = this.isNumeric(height) ? height + 'px' : height;
        return { width, height };
    }
    renderStyle(items) {
        let size = '';
        let color = '';
        if (items.length == 3) {
            size = items[1];
            color = items[2];
        }
        else if (items.length == 2) {
            if (items[1].startsWith('#')) {
                color = items[1];
            }
            else {
                size = items[1];
            }
        }
        let style = '';
        if (size.length > 0) {
            const { width, height } = this.getSize(size);
            style += `width:${width};height:${height};`;
        }
        if (color.length > 0) {
            style += `color:${color};`;
        }
        return style.length > 0 ? `style="${style}"` : '';
    }
    async render(text) {
        const items = text.split('|');
        const name = items[0];
        const svg = await this.assetsManager.loadIcon(name);
        const body = svg === '' ? '未找到图标' + name : svg;
        const style = this.renderStyle(items);
        return `<span class="note-svg-icon" ${style}>${body}</span>`;
    }
    markedExtension() {
        return {
            async: true,
            walkTokens: async (token) => {
                if (token.type !== 'SVGIcon') {
                    return;
                }
                token.html = await this.render(token.text);
            },
            extensions: [{
                    name: 'SVGIcon',
                    level: 'inline',
                    start(src) {
                        let index;
                        let indexSrc = src;
                        while (indexSrc) {
                            index = indexSrc.indexOf('[:');
                            if (index === -1)
                                return;
                            return index;
                        }
                    },
                    tokenizer(src) {
                        const match = src.match(iconsRegex);
                        if (match) {
                            return {
                                type: 'SVGIcon',
                                raw: match[0],
                                text: match[1],
                            };
                        }
                    },
                    renderer(token) {
                        return token.html;
                    }
                }]
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWNvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpY29ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7O0dBWUc7QUFHSCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBRXhDLE1BQU0sVUFBVSxHQUFHLGNBQWMsQ0FBQztBQUVsQyxNQUFNLE9BQU8sT0FBUSxTQUFRLFNBQVM7SUFDbEMsU0FBUyxDQUFDLEdBQVc7UUFDakIsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDO0lBQ3BELENBQUM7SUFFRCxPQUFPLENBQUMsSUFBWTtRQUNoQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLElBQUksS0FBSyxFQUFFLE1BQU0sQ0FBQztRQUNsQixJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO1lBQ25CLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakIsTUFBTSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNyQjthQUNJO1lBQ0QsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqQixNQUFNLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3JCO1FBQ0QsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUNuRCxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ3ZELE9BQU8sRUFBQyxLQUFLLEVBQUUsTUFBTSxF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QUMsVUFBVSxDQUFDLENBQUM7d0JBQ3BDLElBQUksS0FBSyxFQUFFOzRCQUNQLE9BQU87Z0NBQ0gsSUFBSSxFQUFFLFNBQVM7Z0NBQ2YsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0NBQ2IsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7NkJBQ2pCLENBQUM7eUJBQ0w7b0JBQ0wsQ0FBQztvQkFDRCxRQUFRLENBQUMsS0FBcUI7d0JBQzFCLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQztvQkFDdEIsQ0FBQztpQkFDSixDQUFDO1NBQ0wsQ0FBQTtJQUNMLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMjQtMjAyNSBJc0hleHhcbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb2Z0d2FyZSBpcyBwcm9wcmlldGFyeSBhbmQgY29uZmlkZW50aWFsLiBObyBwYXJ0IG9mIHRoaXMgc29mdHdhcmVcbiAqIG1heSBiZSByZXByb2R1Y2VkLCBkaXN0cmlidXRlZCwgb3IgdHJhbnNtaXR0ZWQgaW4gYW55IGZvcm0gb3IgYnkgYW55IG1lYW5zLFxuICogaW5jbHVkaW5nIHBob3RvY29weWluZywgcmVjb3JkaW5nLCBvciBvdGhlciBlbGVjdHJvbmljIG9yIG1lY2hhbmljYWwgbWV0aG9kcyxcbiAqIHdpdGhvdXQgdGhlIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbiBvZiB0aGUgYXV0aG9yLCBleGNlcHQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGJyaWVmIHF1b3RhdGlvbnMgZW1ib2RpZWQgaW4gY3JpdGljYWwgcmV2aWV3cyBhbmQgY2VydGFpbiBvdGhlciBub25jb21tZXJjaWFsXG4gKiB1c2VzIHBlcm1pdHRlZCBieSBjb3B5cmlnaHQgbGF3LlxuICpcbiAqIEZvciBwZXJtaXNzaW9uIHJlcXVlc3RzLCBjb250YWN0OiBJc0hleHhcbiAqL1xuXG5pbXBvcnQgeyBUb2tlbnMsIE1hcmtlZEV4dGVuc2lvbiB9IGZyb20gXCJtYXJrZWRcIjtcbmltcG9ydCB7IEV4dGVuc2lvbiB9IGZyb20gXCIuL2V4dGVuc2lvblwiO1xuXG5jb25zdCBpY29uc1JlZ2V4ID0gL15cXFs6KC4qPyk6XFxdLztcblxuZXhwb3J0IGNsYXNzIFNWR0ljb24gZXh0ZW5kcyBFeHRlbnNpb24ge1xuICAgIGlzTnVtZXJpYyhzdHI6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gIWlzTmFOKE51bWJlcihzdHIpKSAmJiBzdHIudHJpbSgpICE9PSAnJztcbiAgICB9XG4gICAgICBcbiAgICBnZXRTaXplKHNpemU6IHN0cmluZykge1xuICAgICAgICBjb25zdCBpdGVtcyA9IHNpemUuc3BsaXQoJ3gnKTtcbiAgICAgICAgbGV0IHdpZHRoLCBoZWlnaHQ7XG4gICAgICAgIGlmIChpdGVtcy5sZW5ndGggPT0gMikge1xuICAgICAgICAgICAgd2lkdGggPSBpdGVtc1swXTtcbiAgICAgICAgICAgIGhlaWdodCA9IGl0ZW1zWzFdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgd2lkdGggPSBpdGVtc1swXTtcbiAgICAgICAgICAgIGhlaWdodCA9IGl0ZW1zWzBdO1xuICAgICAgICB9XG4gICAgICAgIHdpZHRoID0gdGhpcy5pc051bWVyaWMod2lkdGgpID8gd2lkdGgrJ3B4JyA6IHdpZHRoO1xuICAgICAgICBoZWlnaHQgPSB0aGlzLmlzTnVtZXJpYyhoZWlnaHQpID8gaGVpZ2h0KydweCcgOiBoZWlnaHQ7XG4gICAgICAgIHJldHVybiB7d2lkdGgsIGhlaWdodH07XG4gICAgfVxuXG4gICAgcmVuZGVyU3R5bGUoaXRlbXM6IHN0cmluZ1tdKSB7XG4gICAgICAgIGxldCBzaXplID0gJyc7XG4gICAgICAgIGxldCBjb2xvciA9ICcnO1xuICAgICAgICBpZiAoaXRlbXMubGVuZ3RoID09IDMpIHtcbiAgICAgICAgICAgIHNpemUgPSBpdGVtc1sxXTtcbiAgICAgICAgICAgIGNvbG9yID0gaXRlbXNbMl07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXRlbXMubGVuZ3RoID09IDIpIHtcbiAgICAgICAgICAgIGlmIChpdGVtc1sxXS5zdGFydHNXaXRoKCcjJykpIHtcbiAgICAgICAgICAgICAgICBjb2xvciA9IGl0ZW1zWzFdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2l6ZSA9IGl0ZW1zWzFdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGxldCBzdHlsZSA9ICcnO1xuICAgICAgICBpZiAoc2l6ZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCB7d2lkdGgsIGhlaWdodH0gPSB0aGlzLmdldFNpemUoc2l6ZSk7XG4gICAgICAgICAgICBzdHlsZSArPSBgd2lkdGg6JHt3aWR0aH07aGVpZ2h0OiR7aGVpZ2h0fTtgO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2xvci5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzdHlsZSArPSBgY29sb3I6JHtjb2xvcn07YDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3R5bGUubGVuZ3RoID4gMCA/IGBzdHlsZT1cIiR7c3R5bGV9XCJgIDogJyc7XG4gICAgfVxuXG4gICAgYXN5bmMgcmVuZGVyKHRleHQ6IHN0cmluZykge1xuICAgICAgICBjb25zdCBpdGVtcyA9IHRleHQuc3BsaXQoJ3wnKTtcbiAgICAgICAgY29uc3QgbmFtZSA9IGl0ZW1zWzBdO1xuICAgICAgICBjb25zdCBzdmcgPSBhd2FpdCB0aGlzLmFzc2V0c01hbmFnZXIubG9hZEljb24obmFtZSk7XG4gICAgICAgIGNvbnN0IGJvZHkgPSBzdmc9PT0nJyA/ICfmnKrmib7liLDlm77moIcnICsgbmFtZSA6IHN2ZztcbiAgICAgICAgY29uc3Qgc3R5bGUgPSB0aGlzLnJlbmRlclN0eWxlKGl0ZW1zKTtcbiAgICAgICAgcmV0dXJuIGA8c3BhbiBjbGFzcz1cIm5vdGUtc3ZnLWljb25cIiAke3N0eWxlfT4ke2JvZHl9PC9zcGFuPmBcbiAgICB9XG4gICAgXG4gICAgbWFya2VkRXh0ZW5zaW9uKCk6IE1hcmtlZEV4dGVuc2lvbiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBhc3luYzogdHJ1ZSxcbiAgICAgICAgICAgIHdhbGtUb2tlbnM6IGFzeW5jICh0b2tlbjogVG9rZW5zLkdlbmVyaWMpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodG9rZW4udHlwZSAhPT0gJ1NWR0ljb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdG9rZW4uaHRtbCA9IGF3YWl0IHRoaXMucmVuZGVyKHRva2VuLnRleHQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4dGVuc2lvbnM6IFt7XG4gICAgICAgICAgICAgICAgbmFtZTogJ1NWR0ljb24nLFxuICAgICAgICAgICAgICAgIGxldmVsOiAnaW5saW5lJyxcbiAgICAgICAgICAgICAgICBzdGFydChzcmM6IHN0cmluZykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgIGxldCBpbmRleFNyYyA9IHNyYztcblxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoaW5kZXhTcmMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ID0gaW5kZXhTcmMuaW5kZXhPZignWzonKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpbmRleDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdG9rZW5pemVyKHNyYzogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gc3JjLm1hdGNoKGljb25zUmVnZXgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ1NWR0ljb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhdzogbWF0Y2hbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogbWF0Y2hbMV0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZW5kZXJlcih0b2tlbjogVG9rZW5zLkdlbmVyaWMpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuLmh0bWw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfV1cbiAgICAgICAgfVxuICAgIH1cbn0iXX0=