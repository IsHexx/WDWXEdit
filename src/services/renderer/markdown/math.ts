import { MarkedExtension, Token, Tokens } from "marked";
import { requestUrl } from "obsidian";
import { Extension } from "./extension";
// Claude Code Update - 更新import路径
import { NMPSettings } from "../../../core/settings";

const inlineRule = /^(\${1,2})(?!\$)((?:\\.|[^\\\n])*?(?:\\.|[^\\\n\$]))\1/;
const blockRule = /^(\${1,2})\n((?:\\[^]|[^\\])+?)\n\1(?:\n|$)/;

const svgCache = new Map<string, string>();

export function cleanMathCache() {
    svgCache.clear();
}

export class MathRendererQueue {
    // Claude Code Update - 禁用外部数学渲染服务，使用本地处理
    private host = 'disabled'; // 不再使用外部服务
    private static instance: MathRendererQueue;
    private mathIndex: number = 0;

    public static getInstance(): MathRendererQueue {
        if (!MathRendererQueue.instance) {
            MathRendererQueue.instance = new MathRendererQueue();
        }
        return MathRendererQueue.instance;
    }

    private constructor() {
    }

    async getMathSVG(expression: string, inline: boolean, type: string) {
        try {
            let success = false;
            let path = '';
            if (type === 'asciimath') {
                path = '/math/am';
            }
            else {
                path = '/math/tex';
            }

            // Claude Code Update - 简化数学公式处理，避免外部API依赖
            let svg = '';
            try {

                if (inline) {
                    svg = `<span class="math-inline">$${expression}$</span>`;
                } else {
                    svg = `<div class="math-block">$$${expression}$$</div>`;
                }
                success = true;

            } catch (error) {

                svg = `<span class="math-error">数学公式: ${expression}</span>`;
            }
            return { svg, success };
        }
        catch (err) {

            const svg = '渲染失败: ' + err.message;
            return { svg, success: false };
        }
    }

    generateId() {
        this.mathIndex += 1;
        return `math-id-${this.mathIndex}`;
    }

    async render(token: Tokens.Generic, inline: boolean, type: string) {
        if (!NMPSettings.getInstance().isAuthKeyVaild()) {
            return '<span>注册码无效或已过期</span>';
        }

        const id = this.generateId();
        let svg = '渲染中';
        const expression = token.text;
        if (svgCache.has(token.text)) {
            svg = svgCache.get(expression) as string;
        }
        else {
            const res = await this.getMathSVG(expression, inline, type)
            if (res.success) {
                svgCache.set(expression, res.svg);
            }
            svg = res.svg;
        }

        const className = inline ? 'inline-math-svg' : 'block-math-svg';
        const body = inline ? svg : `<section class="block-math-section">${svg}</section>`;
        return `<span id="${id}" class="${className}">${body}</span>`;
    }
}

export class MathRenderer extends Extension {
    async renderer(token: Tokens.Generic, inline: boolean, type: string = '') {
        if (type === '') {
            type = this.settings.math;
        }
        return await MathRendererQueue.getInstance().render(token, inline, type);
    }

    markedExtension(): MarkedExtension {
        return {
            async: true,
            walkTokens: async (token: Tokens.Generic) => {
                if (token.type === 'InlineMath' || token.type === 'BlockMath') {
                    token.html = await this.renderer(token, token.type === 'InlineMath');
                }
            },
            extensions: [
                this.inlineMath(),
                this.blockMath()
            ]
        }
    }

    inlineMath() {
        return {
            name: 'InlineMath',
            level: 'inline',
            start(src: string) {
                let index;
                let indexSrc = src;

                while (indexSrc) {
                    index = indexSrc.indexOf('$');
                    if (index === -1) {
                        return;
                    }

                    const possibleKatex = indexSrc.substring(index);

                    if (possibleKatex.match(inlineRule)) {
                        return index;
                    }

                    indexSrc = indexSrc.substring(index + 1).replace(/^\$+/, '');
                }
            },
            tokenizer(src: string, tokens: Token[]) {
                const match = src.match(inlineRule);
                if (match) {
                    return {
                        type: 'InlineMath',
                        raw: match[0],
                        text: match[2].trim(),
                        displayMode: match[1].length === 2
                    };
                }
            },
            renderer: (token: Tokens.Generic) => {
                return token.html;
            }
        }
    }
    blockMath() {
        return {
            name: 'BlockMath',
            level: 'block',
            tokenizer(src: string) {
                const match = src.match(blockRule);
                if (match) {
                    return {
                        type: 'BlockMath',
                        raw: match[0],
                        text: match[2].trim(),
                        displayMode: match[1].length === 2
                    };
                }
            },
            renderer: (token: Tokens.Generic) => {
                return token.html;
            }
        };
    }
}
