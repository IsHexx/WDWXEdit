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
import { Marked } from "marked";
// 更新import路径
import { WxSettings } from "../../../core/settings";
import AssetsManager from "../../../core/assets";
import { Blockquote } from "./blockquote";
import { CodeRenderer } from "./code";
import { EmbedBlockMark } from "./embed-block-mark";
import { SVGIcon } from "./icons";
import { LinkRenderer } from "./link";
import { LocalFile, LocalImageManager } from "./local-file";
import { MathRenderer } from "./math";
import { TextHighlight } from "./text-highlight";
import { Comment } from "./commnet";
import { Topic } from "./topic";
import { HeadingRenderer } from "./heading";
import { FootnoteRenderer } from "./footnote";
import { EmptyLineRenderer } from "./empty-line";
import { cleanUrl } from "../../../shared/utils";
const markedOptiones = {
    gfm: true,
    breaks: true,
};
const customRenderer = {
    hr() {
        return '<hr>';
    },
    list(body, ordered, start) {
        const type = ordered ? 'ol' : 'ul';
        const startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
        return '<' + type + startatt + ' class="list-paddingleft-1">' + body + '</' + type + '>';
    },
    listitem(text, task, checked) {
        return `<li><section><span data-leaf="">${text}<span></section></li>`;
    },
    image(href, title, text) {
        const cleanHref = cleanUrl(href);
        if (cleanHref === null) {
            return text;
        }
        href = cleanHref;
        if (!href.startsWith('http')) {
            const res = AssetsManager.getInstance().getResourcePath(decodeURI(href));
            if (res) {
                href = res.resUrl;
                const info = {
                    resUrl: res.resUrl,
                    filePath: res.filePath,
                    media_id: null,
                    url: null
                };
                LocalImageManager.getInstance().setImage(res.resUrl, info);
            }
        }
        let out = '';
        if (WxSettings.getInstance().useFigcaption) {
            out = `<figure style="display: flex; flex-direction: column; align-items: center;"><img src="${href}" alt="${text}"`;
            if (title) {
                out += ` title="${title}"`;
            }
            if (text.length > 0) {
                out += `><figcaption>${text}</figcaption></figure>`;
            }
            else {
                out += '></figure>';
            }
        }
        else {
            out = `<img src="${href}" alt="${text}"`;
            if (title) {
                out += ` title="${title}"`;
            }
            out += '>';
        }
        return out;
    }
};
export class MarkedParser {
    constructor(app, callback) {
        this.extensions = [];
        this.app = app;
        this.vault = app.vault;
        const settings = WxSettings.getInstance();
        const assetsManager = AssetsManager.getInstance();
        this.extensions.push(new LocalFile(app, settings, assetsManager, callback));
        this.extensions.push(new Blockquote(app, settings, assetsManager, callback));
        this.extensions.push(new EmbedBlockMark(app, settings, assetsManager, callback));
        this.extensions.push(new SVGIcon(app, settings, assetsManager, callback));
        this.extensions.push(new LinkRenderer(app, settings, assetsManager, callback));
        this.extensions.push(new TextHighlight(app, settings, assetsManager, callback));
        this.extensions.push(new CodeRenderer(app, settings, assetsManager, callback));
        this.extensions.push(new Comment(app, settings, assetsManager, callback));
        this.extensions.push(new Topic(app, settings, assetsManager, callback));
        this.extensions.push(new HeadingRenderer(app, settings, assetsManager, callback));
        this.extensions.push(new FootnoteRenderer(app, settings, assetsManager, callback));
        if (settings.enableEmptyLine) {
            this.extensions.push(new EmptyLineRenderer(app, settings, assetsManager, callback));
        }
        // Claude Code Remove: 移除isAuthKeyVaild检查，始终启用数学公式渲染
        this.extensions.push(new MathRenderer(app, settings, assetsManager, callback));
    }
    async buildMarked() {
        this.marked = new Marked();
        this.marked.use(markedOptiones);
        for (const ext of this.extensions) {
            this.marked.use(ext.markedExtension());
            ext.marked = this.marked;
            await ext.prepare();
        }
        this.marked.use({ renderer: customRenderer });
    }
    async prepare() {
        this.extensions.forEach(async (ext) => await ext.prepare());
    }
    async postprocess(html) {
        let result = html;
        for (let ext of this.extensions) {
            result = await ext.postprocess(result);
        }
        return result;
    }
    async parse(content) {
        if (!this.marked)
            await this.buildMarked();
        await this.prepare();
        let html = await this.marked.parse(content);
        html = await this.postprocess(html);
        return html;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7R0FZRztBQUVILE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFDaEMsYUFBYTtBQUNiLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUVwRCxPQUFPLGFBQWEsTUFBTSxzQkFBc0IsQ0FBQztBQUVqRCxPQUFPLEVBQUUsVUFBVSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ3pDLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFDdEMsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQ3BELE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxTQUFTLENBQUM7QUFDbEMsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUN0QyxPQUFPLEVBQUUsU0FBUyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sY0FBYyxDQUFDO0FBQzVELE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxRQUFRLENBQUM7QUFDdEMsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQ2pELE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUNoQyxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBQzVDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUM5QyxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDakQsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBR2pELE1BQU0sY0FBYyxHQUFHO0lBQ25CLEdBQUcsRUFBRSxJQUFJO0lBQ1QsTUFBTSxFQUFFLElBQUk7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MUMsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRWxELElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDNUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxVQUFVLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUM3RSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLGNBQWMsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ2pGLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDMUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxZQUFZLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUMvRSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLGFBQWEsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ2hGLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksWUFBWSxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDL0UsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUMxRSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ3hFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksZUFBZSxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDbEYsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQ25GLElBQUksUUFBUSxDQUFDLGVBQWUsRUFBRTtZQUM3QixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7U0FDcEY7UUFDRCxvREFBb0Q7UUFDcEQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxZQUFZLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUNoRixDQUFDO0lBRUQsS0FBSyxDQUFDLFdBQVc7UUFDZixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7UUFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDaEMsS0FBSyxNQUFNLEdBQUcsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ2xDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUN6QixNQUFNLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUNwQjtRQUNELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUMsUUFBUSxFQUFFLGNBQWMsRUFBQyxDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVELEtBQUssQ0FBQyxPQUFPO1FBQ1gsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFDLEdBQUcsRUFBQyxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBRUQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFZO1FBQzdCLElBQUksTUFBTSxHQUFHLElBQUksQ0FBQztRQUNsQixLQUFLLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDaEMsTUFBTSxHQUFHLE1BQU0sR0FBRyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUN2QztRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2YsQ0FBQztJQUVELEtBQUssQ0FBQyxLQUFLLENBQUMsT0FBZTtRQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU07WUFBRSxNQUFNLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUMzQyxNQUFNLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNyQixJQUFJLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVDLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEMsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0NBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IChjKSAyMDI0LTIwMjUgSXNIZXh4XG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc29mdHdhcmUgaXMgcHJvcHJpZXRhcnkgYW5kIGNvbmZpZGVudGlhbC4gTm8gcGFydCBvZiB0aGlzIHNvZnR3YXJlXG4gKiBtYXkgYmUgcmVwcm9kdWNlZCwgZGlzdHJpYnV0ZWQsIG9yIHRyYW5zbWl0dGVkIGluIGFueSBmb3JtIG9yIGJ5IGFueSBtZWFucyxcbiAqIGluY2x1ZGluZyBwaG90b2NvcHlpbmcsIHJlY29yZGluZywgb3Igb3RoZXIgZWxlY3Ryb25pYyBvciBtZWNoYW5pY2FsIG1ldGhvZHMsXG4gKiB3aXRob3V0IHRoZSBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24gb2YgdGhlIGF1dGhvciwgZXhjZXB0IGluIHRoZSBjYXNlIG9mXG4gKiBicmllZiBxdW90YXRpb25zIGVtYm9kaWVkIGluIGNyaXRpY2FsIHJldmlld3MgYW5kIGNlcnRhaW4gb3RoZXIgbm9uY29tbWVyY2lhbFxuICogdXNlcyBwZXJtaXR0ZWQgYnkgY29weXJpZ2h0IGxhdy5cbiAqXG4gKiBGb3IgcGVybWlzc2lvbiByZXF1ZXN0cywgY29udGFjdDogSXNIZXh4XG4gKi9cblxuaW1wb3J0IHsgTWFya2VkIH0gZnJvbSBcIm1hcmtlZFwiO1xuLy8g5pu05pawaW1wb3J06Lev5b6EXG5pbXBvcnQgeyBXeFNldHRpbmdzIH0gZnJvbSBcIi4uLy4uLy4uL2NvcmUvc2V0dGluZ3NcIjtcbmltcG9ydCB7IEFwcCwgVmF1bHQgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBBc3NldHNNYW5hZ2VyIGZyb20gXCIuLi8uLi8uLi9jb3JlL2Fzc2V0c1wiO1xuaW1wb3J0IHsgRXh0ZW5zaW9uLCBNRFJlbmRlcmVyQ2FsbGJhY2sgfSBmcm9tIFwiLi9leHRlbnNpb25cIjtcbmltcG9ydCB7IEJsb2NrcXVvdGV9IGZyb20gXCIuL2Jsb2NrcXVvdGVcIjtcbmltcG9ydCB7IENvZGVSZW5kZXJlciB9IGZyb20gXCIuL2NvZGVcIjtcbmltcG9ydCB7IEVtYmVkQmxvY2tNYXJrIH0gZnJvbSBcIi4vZW1iZWQtYmxvY2stbWFya1wiO1xuaW1wb3J0IHsgU1ZHSWNvbiB9IGZyb20gXCIuL2ljb25zXCI7XG5pbXBvcnQgeyBMaW5rUmVuZGVyZXIgfSBmcm9tIFwiLi9saW5rXCI7XG5pbXBvcnQgeyBMb2NhbEZpbGUsIExvY2FsSW1hZ2VNYW5hZ2VyIH0gZnJvbSBcIi4vbG9jYWwtZmlsZVwiO1xuaW1wb3J0IHsgTWF0aFJlbmRlcmVyIH0gZnJvbSBcIi4vbWF0aFwiO1xuaW1wb3J0IHsgVGV4dEhpZ2hsaWdodCB9IGZyb20gXCIuL3RleHQtaGlnaGxpZ2h0XCI7XG5pbXBvcnQgeyBDb21tZW50IH0gZnJvbSBcIi4vY29tbW5ldFwiO1xuaW1wb3J0IHsgVG9waWMgfSBmcm9tIFwiLi90b3BpY1wiO1xuaW1wb3J0IHsgSGVhZGluZ1JlbmRlcmVyIH0gZnJvbSBcIi4vaGVhZGluZ1wiO1xuaW1wb3J0IHsgRm9vdG5vdGVSZW5kZXJlciB9IGZyb20gXCIuL2Zvb3Rub3RlXCI7XG5pbXBvcnQgeyBFbXB0eUxpbmVSZW5kZXJlciB9IGZyb20gXCIuL2VtcHR5LWxpbmVcIjtcbmltcG9ydCB7IGNsZWFuVXJsIH0gZnJvbSBcIi4uLy4uLy4uL3NoYXJlZC91dGlsc1wiO1xuXG5cbmNvbnN0IG1hcmtlZE9wdGlvbmVzID0ge1xuICAgIGdmbTogdHJ1ZSxcbiAgICBicmVha3M6IHRydWUsXG59O1xuXG5jb25zdCBjdXN0b21SZW5kZXJlciA9IHtcblx0aHIoKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gJzxocj4nO1xuXHR9LFxuXHRsaXN0KGJvZHk6IHN0cmluZywgb3JkZXJlZDogYm9vbGVhbiwgc3RhcnQ6IG51bWJlciB8ICcnKTogc3RyaW5nIHtcblx0XHRjb25zdCB0eXBlID0gb3JkZXJlZCA/ICdvbCcgOiAndWwnO1xuXHRcdGNvbnN0IHN0YXJ0YXR0ID0gKG9yZGVyZWQgJiYgc3RhcnQgIT09IDEpID8gKCcgc3RhcnQ9XCInICsgc3RhcnQgKyAnXCInKSA6ICcnO1xuXHRcdHJldHVybiAnPCcgKyB0eXBlICsgc3RhcnRhdHQgKyAnIGNsYXNzPVwibGlzdC1wYWRkaW5nbGVmdC0xXCI+JyArIGJvZHkgKyAnPC8nICsgdHlwZSArICc+Jztcblx0fSxcblx0bGlzdGl0ZW0odGV4dDogc3RyaW5nLCB0YXNrOiBib29sZWFuLCBjaGVja2VkOiBib29sZWFuKTogc3RyaW5nIHtcblx0XHRyZXR1cm4gYDxsaT48c2VjdGlvbj48c3BhbiBkYXRhLWxlYWY9XCJcIj4ke3RleHR9PHNwYW4+PC9zZWN0aW9uPjwvbGk+YDtcblx0fSxcblx0aW1hZ2UoaHJlZjogc3RyaW5nLCB0aXRsZTogc3RyaW5nIHwgbnVsbCwgdGV4dDogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBjbGVhbkhyZWYgPSBjbGVhblVybChocmVmKTtcbiAgICBpZiAoY2xlYW5IcmVmID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGV4dDtcbiAgICB9XG4gICAgaHJlZiA9IGNsZWFuSHJlZjtcblxuXHRcdGlmICghaHJlZi5zdGFydHNXaXRoKCdodHRwJykpIHtcblx0XHRcdGNvbnN0IHJlcyA9IEFzc2V0c01hbmFnZXIuZ2V0SW5zdGFuY2UoKS5nZXRSZXNvdXJjZVBhdGgoZGVjb2RlVVJJKGhyZWYpKTtcblx0XHRcdGlmIChyZXMpIHtcblx0XHRcdFx0aHJlZiA9IHJlcy5yZXNVcmw7XG5cdFx0XHRcdGNvbnN0IGluZm8gPSB7XG5cdFx0XHRcdFx0cmVzVXJsOiByZXMucmVzVXJsLFxuXHRcdFx0XHRcdGZpbGVQYXRoOiByZXMuZmlsZVBhdGgsXG5cdFx0XHRcdFx0bWVkaWFfaWQ6IG51bGwsXG5cdFx0XHRcdFx0dXJsOiBudWxsXG5cdFx0XHRcdH07XG5cdFx0XHRcdExvY2FsSW1hZ2VNYW5hZ2VyLmdldEluc3RhbmNlKCkuc2V0SW1hZ2UocmVzLnJlc1VybCwgaW5mbyk7XHRcblx0XHRcdH1cblx0XHR9XG5cdFx0bGV0IG91dCA9ICcnO1xuXHRcdGlmIChXeFNldHRpbmdzLmdldEluc3RhbmNlKCkudXNlRmlnY2FwdGlvbikge1xuXHRcdFx0b3V0ID0gYDxmaWd1cmUgc3R5bGU9XCJkaXNwbGF5OiBmbGV4OyBmbGV4LWRpcmVjdGlvbjogY29sdW1uOyBhbGlnbi1pdGVtczogY2VudGVyO1wiPjxpbWcgc3JjPVwiJHtocmVmfVwiIGFsdD1cIiR7dGV4dH1cImA7XG5cdFx0XHRpZiAodGl0bGUpIHtcblx0XHRcdFx0b3V0ICs9IGAgdGl0bGU9XCIke3RpdGxlfVwiYDtcblx0XHRcdH1cblx0XHRcdGlmICh0ZXh0Lmxlbmd0aCA+IDApIHtcblx0XHRcdFx0b3V0ICs9IGA+PGZpZ2NhcHRpb24+JHt0ZXh0fTwvZmlnY2FwdGlvbj48L2ZpZ3VyZT5gO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdG91dCArPSAnPjwvZmlndXJlPidcblx0XHRcdH1cblx0XHR9XG5cdFx0ZWxzZSB7XG5cdFx0XHRvdXQgPSBgPGltZyBzcmM9XCIke2hyZWZ9XCIgYWx0PVwiJHt0ZXh0fVwiYDtcblx0XHRcdGlmICh0aXRsZSkge1xuXHRcdFx0XHRvdXQgKz0gYCB0aXRsZT1cIiR7dGl0bGV9XCJgO1xuXHRcdFx0fVxuXHRcdFx0b3V0ICs9ICc+Jztcblx0XHR9XG4gICAgcmV0dXJuIG91dDtcbiAgfVxufTtcblxuZXhwb3J0IGNsYXNzIE1hcmtlZFBhcnNlciB7XG5cdGV4dGVuc2lvbnM6IEV4dGVuc2lvbltdID0gW107XG5cdG1hcmtlZDogTWFya2VkO1xuXHRhcHA6IEFwcDtcblx0dmF1bHQ6IFZhdWx0O1xuXG5cdGNvbnN0cnVjdG9yKGFwcDogQXBwLCBjYWxsYmFjazogTURSZW5kZXJlckNhbGxiYWNrKSB7XG5cdFx0dGhpcy5hcHAgPSBhcHA7XG5cdFx0dGhpcy52YXVsdCA9IGFwcC52YXVsdDtcblxuXHRcdGNvbnN0IHNldHRpbmdzID0gV3hTZXR0aW5ncy5nZXRJbnN0YW5jZSgpO1xuXHRcdGNvbnN0IGFzc2V0c01hbmFnZXIgPSBBc3NldHNNYW5hZ2VyLmdldEluc3RhbmNlKCk7XG5cblx0XHR0aGlzLmV4dGVuc2lvbnMucHVzaChuZXcgTG9jYWxGaWxlKGFwcCwgc2V0dGluZ3MsIGFzc2V0c01hbmFnZXIsIGNhbGxiYWNrKSk7XG5cdFx0dGhpcy5leHRlbnNpb25zLnB1c2gobmV3IEJsb2NrcXVvdGUoYXBwLCBzZXR0aW5ncywgYXNzZXRzTWFuYWdlciwgY2FsbGJhY2spKTtcblx0XHR0aGlzLmV4dGVuc2lvbnMucHVzaChuZXcgRW1iZWRCbG9ja01hcmsoYXBwLCBzZXR0aW5ncywgYXNzZXRzTWFuYWdlciwgY2FsbGJhY2spKTtcblx0XHR0aGlzLmV4dGVuc2lvbnMucHVzaChuZXcgU1ZHSWNvbihhcHAsIHNldHRpbmdzLCBhc3NldHNNYW5hZ2VyLCBjYWxsYmFjaykpO1xuXHRcdHRoaXMuZXh0ZW5zaW9ucy5wdXNoKG5ldyBMaW5rUmVuZGVyZXIoYXBwLCBzZXR0aW5ncywgYXNzZXRzTWFuYWdlciwgY2FsbGJhY2spKTtcblx0XHR0aGlzLmV4dGVuc2lvbnMucHVzaChuZXcgVGV4dEhpZ2hsaWdodChhcHAsIHNldHRpbmdzLCBhc3NldHNNYW5hZ2VyLCBjYWxsYmFjaykpO1xuXHRcdHRoaXMuZXh0ZW5zaW9ucy5wdXNoKG5ldyBDb2RlUmVuZGVyZXIoYXBwLCBzZXR0aW5ncywgYXNzZXRzTWFuYWdlciwgY2FsbGJhY2spKTtcblx0XHR0aGlzLmV4dGVuc2lvbnMucHVzaChuZXcgQ29tbWVudChhcHAsIHNldHRpbmdzLCBhc3NldHNNYW5hZ2VyLCBjYWxsYmFjaykpO1xuXHRcdHRoaXMuZXh0ZW5zaW9ucy5wdXNoKG5ldyBUb3BpYyhhcHAsIHNldHRpbmdzLCBhc3NldHNNYW5hZ2VyLCBjYWxsYmFjaykpO1xuXHRcdHRoaXMuZXh0ZW5zaW9ucy5wdXNoKG5ldyBIZWFkaW5nUmVuZGVyZXIoYXBwLCBzZXR0aW5ncywgYXNzZXRzTWFuYWdlciwgY2FsbGJhY2spKTtcblx0XHR0aGlzLmV4dGVuc2lvbnMucHVzaChuZXcgRm9vdG5vdGVSZW5kZXJlcihhcHAsIHNldHRpbmdzLCBhc3NldHNNYW5hZ2VyLCBjYWxsYmFjaykpO1xuXHRcdGlmIChzZXR0aW5ncy5lbmFibGVFbXB0eUxpbmUpIHtcblx0XHRcdHRoaXMuZXh0ZW5zaW9ucy5wdXNoKG5ldyBFbXB0eUxpbmVSZW5kZXJlcihhcHAsIHNldHRpbmdzLCBhc3NldHNNYW5hZ2VyLCBjYWxsYmFjaykpO1xuXHRcdH1cblx0XHQvLyBDbGF1ZGUgQ29kZSBSZW1vdmU6IOenu+mZpGlzQXV0aEtleVZhaWxk5qOA5p+l77yM5aeL57uI5ZCv55So5pWw5a2m5YWs5byP5riy5p+TXG5cdFx0dGhpcy5leHRlbnNpb25zLnB1c2gobmV3IE1hdGhSZW5kZXJlcihhcHAsIHNldHRpbmdzLCBhc3NldHNNYW5hZ2VyLCBjYWxsYmFjaykpO1xuXHR9XG5cblx0YXN5bmMgYnVpbGRNYXJrZWQoKSB7XG5cdCAgdGhpcy5tYXJrZWQgPSBuZXcgTWFya2VkKCk7XG5cdFx0dGhpcy5tYXJrZWQudXNlKG1hcmtlZE9wdGlvbmVzKTtcblx0XHRmb3IgKGNvbnN0IGV4dCBvZiB0aGlzLmV4dGVuc2lvbnMpIHtcblx0XHRcdHRoaXMubWFya2VkLnVzZShleHQubWFya2VkRXh0ZW5zaW9uKCkpO1xuXHRcdFx0ZXh0Lm1hcmtlZCA9IHRoaXMubWFya2VkO1xuXHRcdFx0YXdhaXQgZXh0LnByZXBhcmUoKTtcblx0XHR9XG5cdFx0dGhpcy5tYXJrZWQudXNlKHtyZW5kZXJlcjogY3VzdG9tUmVuZGVyZXJ9KTtcblx0fVxuXG5cdGFzeW5jIHByZXBhcmUoKSB7XG5cdCAgdGhpcy5leHRlbnNpb25zLmZvckVhY2goYXN5bmMgZXh0ID0+IGF3YWl0IGV4dC5wcmVwYXJlKCkpO1xuXHR9XG5cblx0YXN5bmMgcG9zdHByb2Nlc3MoaHRtbDogc3RyaW5nKSB7XG5cdFx0bGV0IHJlc3VsdCA9IGh0bWw7XG5cdFx0Zm9yIChsZXQgZXh0IG9mIHRoaXMuZXh0ZW5zaW9ucykge1xuXHRcdFx0cmVzdWx0ID0gYXdhaXQgZXh0LnBvc3Rwcm9jZXNzKHJlc3VsdCk7XG5cdFx0fVxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH1cblxuXHRhc3luYyBwYXJzZShjb250ZW50OiBzdHJpbmcpIHtcblx0XHRpZiAoIXRoaXMubWFya2VkKSBhd2FpdCB0aGlzLmJ1aWxkTWFya2VkKCk7XG5cdFx0YXdhaXQgdGhpcy5wcmVwYXJlKCk7XG5cdFx0bGV0IGh0bWwgPSBhd2FpdCB0aGlzLm1hcmtlZC5wYXJzZShjb250ZW50KTtcdFxuXHRcdGh0bWwgPSBhd2FpdCB0aGlzLnBvc3Rwcm9jZXNzKGh0bWwpO1xuXHRcdHJldHVybiBodG1sO1xuXHR9XG59XG4iXX0=