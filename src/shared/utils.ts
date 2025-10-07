import { App, sanitizeHTMLToDom, Platform } from "obsidian";
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

export function parseCSS(css: string) {
	return postcss.parse(css);
}

const serializer = new XMLSerializer();

function stripXhtmlNamespace(serialized: string): string {
	return serialized.replace(/ xmlns="http:\/\/www\.w3\.org\/1999\/xhtml"/g, "");
}

export function serializeElement(element: Element): string {
	return stripXhtmlNamespace(serializer.serializeToString(element));
}

export function serializeElementChildren(element: Element): string {
	let result = "";
	element.childNodes.forEach((node) => {
		result += stripXhtmlNamespace(serializer.serializeToString(node));
	});
	return result;
}

export function applyCSS(html: string, css: string): string {

	return `<div class="wdwx-export-root">
<style data-wdwxedit-export="true">
${css}
</style>
${html}
</div>`;
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
