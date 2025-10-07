import { Tokens, MarkedExtension } from "marked";
import { sanitizeHTMLToDom } from "obsidian";
import { serializeElementChildren } from "../../../shared/utils";
import { Extension } from "./extension";

const iconsRegex = /^\[:(.*?):\]/;

export class SVGIcon extends Extension {
    isNumeric(str: string): boolean {
        return !isNaN(Number(str)) && str.trim() !== '';
    }
      
    getSize(size: string) {
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
        width = this.isNumeric(width) ? width+'px' : width;
        height = this.isNumeric(height) ? height+'px' : height;
        return {width, height};
    }

    private isValidColorToken(token: string): boolean {
        const normalized = token.trim();
        if (normalized.length === 0) {
            return false;
        }
        return /^#[0-9a-fA-F]{3,8}$/.test(normalized)
            || /^rgba?\([^\)]+\)$/i.test(normalized)
            || /^hsla?\([^\)]+\)$/i.test(normalized)
            || /^var\(--[a-zA-Z0-9_-]+\)$/.test(normalized)
            || /^[a-zA-Z]+$/.test(normalized);
    }

    private parseAppearance(items: string[]) {
        let sizeToken = '';
        let colorToken = '';
        if (items.length === 3) {
            sizeToken = items[1];
            colorToken = items[2];
        } else if (items.length === 2) {
            if (this.isValidColorToken(items[1])) {
                colorToken = items[1];
            } else {
                sizeToken = items[1];
            }
        }

        const appearance: { width?: string; height?: string; color?: string } = {};

        if (sizeToken.length > 0) {
            const { width, height } = this.getSize(sizeToken);
            appearance.width = width;
            appearance.height = height;
        }

        if (colorToken.length > 0 && this.isValidColorToken(colorToken)) {
            appearance.color = colorToken.trim();
        }

        return appearance;
    }

    private applyIconAppearance(svgContent: string, appearance: { width?: string; height?: string; color?: string }) {
        const { width, height, color } = appearance;
        if (!width && !height && !color) {
            return svgContent;
        }

        try {
            const fragment = sanitizeHTMLToDom(svgContent);
            const container = document.createElement('div');
            container.appendChild(fragment);
            const svgEl = container.querySelector('svg');
            if (!svgEl) {
                return svgContent;
            }
            if (width) {
                svgEl.setAttribute('width', width);
            }
            if (height) {
                svgEl.setAttribute('height', height);
            }
            if (color) {
                svgEl.setAttribute('fill', color);
                svgEl.setAttribute('stroke', color);
                svgEl.setAttribute('color', color);
            }
            return serializeElementChildren(container);
        } catch (error) {

            return svgContent;
        }
    }

    async render(text: string) {
        const items = text.split('|');
        const name = items[0];
        const svg = await this.assetsManager.loadIcon(name);
        const body = svg === '' ? '未找到图标' + name : svg;
        const appearance = this.parseAppearance(items);
        const rendered = this.applyIconAppearance(body, appearance);
        return `<span class="note-svg-icon">${rendered}</span>`;
    }
    
    markedExtension(): MarkedExtension {
        return {
            async: true,
            walkTokens: async (token: Tokens.Generic) => {
                if (token.type !== 'SVGIcon') {
                    return;
                }
                token.html = await this.render(token.text);
            },
            extensions: [{
                name: 'SVGIcon',
                level: 'inline',
                start(src: string) {
                    let index;
                    let indexSrc = src;

                    while (indexSrc) {
                        index = indexSrc.indexOf('[:');
                        if (index === -1) return;
                        return index;
                    }
                },
                tokenizer(src: string) {
                    const match = src.match(iconsRegex);
                    if (match) {
                        return {
                            type: 'SVGIcon',
                            raw: match[0],
                            text: match[1],
                        };
                    }
                },
                renderer(token: Tokens.Generic) {
                    return token.html;
                }
            }]
        }
    }
}
