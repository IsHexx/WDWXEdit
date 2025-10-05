import { App, sanitizeHTMLToDom, requestUrl, Platform } from "obsidian";
import * as postcss from "./postcss/postcss";

let PluginVersion = "0.0.0";
let PlugPlatform = "obsidian";

export function setVersion(version: string) {
	PluginVersion = version;
	if (Platform.isWin) {
		PlugPlatform = "win";
	}
	else if (Platform.isMacOS) {
		PlugPlatform = "mac";
	}
	else if (Platform.isLinux) {
		PlugPlatform = "linux";
	}
	else if (Platform.isIosApp) {
		PlugPlatform = "ios";
	}
	else if (Platform.isAndroidApp) {
		PlugPlatform = "android";
	}
}

function getStyleSheet() {
	for (let i = 0; i < document.styleSheets.length; i++) {
		const sheet = document.styleSheets[i];
		if (sheet.title == 'wdwxedit-style') {
		  return sheet;
		}
	}
}

function applyStyles(element: HTMLElement, styles: CSSStyleDeclaration, computedStyle: CSSStyleDeclaration) {
	for (let i = 0; i < styles.length; i++) {
		const propertyName = styles[i];
		let propertyValue = computedStyle.getPropertyValue(propertyName);
		if (propertyName == 'width' && styles.getPropertyValue(propertyName) == 'fit-content') {
			propertyValue = 'fit-content';
		}
		if (propertyName.indexOf('margin') >= 0 && styles.getPropertyValue(propertyName).indexOf('auto') >= 0) {
		    propertyValue = styles.getPropertyValue(propertyName);
		}
		element.style.setProperty(propertyName, propertyValue);
	}
}

function parseAndApplyStyles(element: HTMLElement, sheet:CSSStyleSheet) {
	try {
		const computedStyle = getComputedStyle(element);
		for (let i = 0; i < sheet.cssRules.length; i++) {
			const rule = sheet.cssRules[i];
			if (rule instanceof CSSStyleRule && element.matches(rule.selectorText)) {
			  	applyStyles(element, rule.style, computedStyle);
			}
		}

	} catch (e) {

	}
}

function traverse(root: HTMLElement, sheet:CSSStyleSheet) {
	let element = root.firstElementChild;
	while (element) {
		if (element.tagName === 'svg') {
			// pass
		}
		else {
	  		traverse(element as HTMLElement, sheet);
		}
	  	element = element.nextElementSibling;
	}
	parseAndApplyStyles(root, sheet);
}

export async function CSSProcess(content: HTMLElement) {

	const style = getStyleSheet();
	if (style) {
		traverse(content, style);
	}
}

export function parseCSS(css: string) {
	return postcss.parse(css);
}

export function ruleToStyle(rule: postcss.Rule) {
	let style = '';	
	rule.walkDecls(decl => {
		style += decl.prop + ':' + decl.value + ';';
	})

	return style;
}

function processPseudoSelector(selector: string) {
	if (selector.includes('::before') || selector.includes('::after')) {
		selector = selector.replace(/::before/g, '').replace(/::after/g, '');
	}
	return selector;
}

function getPseudoType(selector: string) {
	if (selector.includes('::before')) {
		return 'before';
	}
	else if (selector.includes('::after')) {
		return 'after';
	}
	return undefined;
}

function applyStyle(root: HTMLElement, cssRoot: postcss.Root) {
	if (root.tagName.toLowerCase() === 'a' && root.classList.contains('wx_topic_link')) {
		return;
	}

	const cssText = root.style.cssText;
	cssRoot.walkRules(rule => {
		const selector = processPseudoSelector(rule.selector);
		try {
			if (root.matches(selector)) {
				let item = root;

				const pseudoType = getPseudoType(rule.selector);
				if (pseudoType) {
					let content = '';
					rule.walkDecls('content', decl => {
						content = decl.value || '';
					})
					item = createSpan();
					item.textContent = content.replace(/(^")|("$)/g, '');

					if (pseudoType === 'before') {
						root.prepend(item);
					}
					else if (pseudoType === 'after') {
						root.appendChild(item);
					}
				}

				rule.walkDecls(decl => {

					const setted = cssText.includes(decl.prop);
					if (!setted || decl.important) {
						item.style.setProperty(decl.prop, decl.value);
					}
				})
			}
		}
		catch (err) {
			if (err.message && err.message.includes('is not a valid selector')) {
				return;
			}
			else {
				throw err;
			}
		}
	});

	if (root.tagName === 'svg') {
		return;
	}

	let element = root.firstElementChild;
	while (element) {
		applyStyle(element as HTMLElement, cssRoot);
	  	element = element.nextElementSibling;
	}
}

export function applyCSS(html: string, css: string) {
	const doc = sanitizeHTMLToDom(html);
	const root = doc.firstChild as HTMLElement;
	const cssRoot = postcss.parse(css);
	applyStyle(root, cssRoot);
	return root.outerHTML;
}

export function uevent(name: string) {

}

/**
 * 创建一个防抖函数
 * @param func 要执行的函数
 * @param wait 等待时间（毫秒）
 * @returns 防抖处理后的函数
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout | null = null;

	return function(this: any, ...args: Parameters<T>) {
		const context = this;

		const later = () => {
			timeout = null;
			func.apply(context, args);
		};

		if (timeout !== null) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(later, wait);
	};
}

export function cleanUrl(href: string) {
  try {
    href = encodeURI(href).replace(/%25/g, '%');
  } catch (e) {
    return null;
  }
  return href;
}

export async function waitForLayoutReady(app: App): Promise<void> {
  if (app.workspace.layoutReady) {
    return;
  }
  return new Promise((resolve) => {
    app.workspace.onLayoutReady(() => resolve());
  });
}
