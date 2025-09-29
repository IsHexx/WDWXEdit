import { Notice } from "obsidian";
import { MarkedExtension, Tokens } from "marked";
import hljs from "highlight.js";
import { MathRendererQueue } from "./math";
import { Extension } from "./extension";
// Claude Code Update - 更新import路径
import { UploadImageToWx } from "../../wechat/imagelib";
import AssetsManager from "../../../core/assets";
// Claude Code Remove

export class CardDataManager {
	private cardData: Map<string, string>;
	private static instance: CardDataManager;

	private constructor() {
		this.cardData = new Map<string, string>();
	}

	public static getInstance(): CardDataManager {
		if (!CardDataManager.instance) {
			CardDataManager.instance = new CardDataManager();
		}
		return CardDataManager.instance;
	}

	public setCardData(id: string, cardData: string) {
		this.cardData.set(id, cardData);
	}

	public cleanup() {
		this.cardData.clear();
	}

	public restoreCard(html: string) {
		for (const [key, value] of this.cardData.entries()) {
			const exp = `<section[^>]*\\sdata-id="${key}"[^>]*>(.*?)<\\/section>`;
			const regex = new RegExp(exp, 'gs');
			if (!regex.test(html)) {

				continue;
			}
			html = html.replace(regex, value);
		}
		return html;
	}
}

const MermaidSectionClassName = 'note-mermaid';
const MermaidImgClassName = 'note-mermaid-img';

export class CodeRenderer extends Extension {
	showLineNumber: boolean;
	mermaidIndex: number;

	async prepare() {
		this.mermaidIndex = 0;
	}

	static srcToBlob(src: string) {
		const base64 = src.split(',')[1];
		const byteCharacters = atob(base64);
		const byteNumbers = new Array(byteCharacters.length);
		for (let i = 0; i < byteCharacters.length; i++) {
			byteNumbers[i] = byteCharacters.charCodeAt(i);
		}
		const byteArray = new Uint8Array(byteNumbers);
		return new Blob([byteArray], { type: 'image/png' });
	}

	static async uploadMermaidImages(root: HTMLElement, token: string) {
		const imgs = root.querySelectorAll('.' + MermaidImgClassName);
		for (let img of imgs) {
			const src = img.getAttribute('src');
			if (!src) continue;
			if (src.startsWith('http')) continue;
			const blob = CodeRenderer.srcToBlob(img.getAttribute('src')!);
			const name = img.id + '.png';
			const res = await UploadImageToWx(blob, name, token);
			if (res.errcode != 0) {
				const msg = `上传图片失败: ${res.errcode} ${res.errmsg}`;
				new Notice(msg);

				continue;
			}
			// Claude Code Update - 修复类型兼容性问题
			const url = res.url;
			if (url) {
				img.setAttribute('src', url);
			}
		}
	}

	replaceSpaces(text: string) {
		let result = '';
		let inTag = false;
		for (let char of text) {
			if (char === '<') {
				inTag = true;
				result += char;
				continue;
			} else if (char === '>') {
				inTag = false;
				result += char;
				continue;
			}
			if (inTag) {
				result += char;
			} else {
				if (char === ' ') {
					result += '&nbsp;';
				} else if (char === '\t') {
					result += '&nbsp;&nbsp;&nbsp;&nbsp;';
				} else {
					result += char;
				}
			}
		}
		return result;
	}

	async codeRenderer(code: string, infostring: string | undefined) {
		const lang = (infostring || '').match(/^\S*/)?.[0];
		code = code.replace(/\n$/, '');

		try {
			if (lang && hljs.getLanguage(lang)) {
				code = hljs.highlight(code, { language: lang }).value;
			}
			else {
				code = hljs.highlightAuto(code).value;
			}
		} catch (err) {

		}

		code = this.replaceSpaces(code);
		const lines = code.split('\n');
		let body = '';
		let liItems = '';
		for (let line in lines) {
			let text = lines[line];
			if (text.length === 0) {
				text = '<br>'
			}
			body = body + '<code>' + text + '</code>';
			liItems = liItems + `<li>${parseInt(line)+1}</li>`;
		}

		let codeSection = '<section class="code-section code-snippet__fix hljs">';
		if (this.settings.lineNumber) {
			codeSection = codeSection + '<ul>'
				+ liItems
				+ '</ul>';
		}

		let html = '';
		if (lang) {
		html = codeSection + '<pre style="max-width:1000% !important;" class="hljs language-'
			+ lang
			+ '">'
			+ body
			+ '</pre></section>';
		}
		else {
			html = codeSection + '<pre>'
				+ body
				+ '</pre></section>';
		}

		if (!this.settings.isAuthKeyVaild()) {
			return html;
		}

		// Claude Code Remove - 移除expertSettings和wxWidget相关功能
		return html;
	}

	static getMathType(lang: string | null) {
		if (!lang) return null;
		let l = lang.toLowerCase();
		l = l.trim();
		if (l === 'am' || l === 'asciimath') return 'asciimath';
		if (l === 'latex' || l === 'tex') return 'latex';
		return null;
	}

	parseCard(htmlString: string) {
		const id = /data-id="([^"]+)"/;
		const headimgRegex = /data-headimg="([^"]+)"/;
		const nicknameRegex = /data-nickname="([^"]+)"/;
		const signatureRegex = /data-signature="([^"]+)"/;

		const idMatch = htmlString.match(id);
		const headimgMatch = htmlString.match(headimgRegex);
		const nicknameMatch = htmlString.match(nicknameRegex);
		const signatureMatch = htmlString.match(signatureRegex);

		return {
			id: idMatch ? idMatch[1] : '',
			headimg: headimgMatch ? headimgMatch[1] : '',
			nickname: nicknameMatch ? nicknameMatch[1] : '公众号名称',
			signature: signatureMatch ? signatureMatch[1] : '公众号介绍'
		};
	}

	renderCard(token: Tokens.Code) {
		const { id, headimg, nickname, signature } = this.parseCard(token.text);
		if (id === '') {
			return '<span>公众号卡片数据错误，没有id</span>';
		}
		CardDataManager.getInstance().setCardData(id, token.text);
		return `<section data-id="${id}" class="note-mpcard-wrapper"><div class="note-mpcard-content"><img class="note-mpcard-headimg" width="54" height="54" src="${headimg}"></img><div class="note-mpcard-info"><div class="note-mpcard-nickname">${nickname}</div><div class="note-mpcard-signature">${signature}</div></div></div><div class="note-mpcard-foot">公众号</div></section>`;
	}

	renderMermaid(token: Tokens.Code) {
		try {
			const meraidIndex = this.mermaidIndex;
			const containerId = `mermaid-${meraidIndex}`;
			this.callback.cacheElement('mermaid', containerId, token.raw);
			this.mermaidIndex += 1;
			return `<section id="${containerId}" class="${MermaidSectionClassName}"></section>`;
		} catch (error) {

			return '<span>mermaid渲染失败</span>';
		}
	}

	markedExtension(): MarkedExtension {
		return {
			async: true,
			walkTokens: async (token: Tokens.Generic) => {
				if (token.type !== 'code') return;
				if (this.settings.isAuthKeyVaild()) {
					const type = CodeRenderer.getMathType(token.lang ?? '');
					if (type) {
						token.html = await MathRendererQueue.getInstance().render(token, false, type);
						return;
					}
					if (token.lang && token.lang.trim().toLocaleLowerCase() == 'mermaid') {
						token.html = this.renderMermaid(token as Tokens.Code);
						return;
					}
				}
				if (token.lang && token.lang.trim().toLocaleLowerCase() == 'mpcard') {
					token.html = this.renderCard(token as Tokens.Code);
					return;
				}
				token.html = await this.codeRenderer(token.text, token.lang);
			},
			extensions: [{
				name: 'code',
				level: 'block',
				renderer: (token: Tokens.Generic) => {
					return token.html;
				},
			}]
		}
	}
}

