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
import { Modal, sanitizeHTMLToDom } from "obsidian";
export class DocModal extends Modal {
    constructor(app, title = "提示", content = "", url = "") {
        super(app);
        this.url = '';
        this.title = '提示';
        this.content = '';
        this.title = title;
        this.content = content;
        this.url = url;
    }
    // Claude Code Update: 保留模态框布局所需的内联样式（动态计算值）
    onOpen() {
        let { contentEl, modalEl } = this;
        // 模态框尺寸需要动态设置，保留内联样式
        modalEl.style.width = '640px';
        modalEl.style.height = '720px';
        contentEl.style.display = 'flex';
        contentEl.style.flexDirection = 'column';
        const titleEl = contentEl.createEl('h2', { text: this.title });
        titleEl.style.marginTop = '0.5em';
        const content = contentEl.createEl('div');
        content.setAttr('style', 'margin-bottom:1em;-webkit-user-select: text; user-select: text;');
        content.appendChild(sanitizeHTMLToDom(this.content));
        const iframe = contentEl.createEl('iframe', {
            attr: {
                src: this.url,
                width: '100%',
                allow: 'clipboard-read; clipboard-write',
            },
        });
        iframe.style.flex = '1';
    }
    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jLW1vZGFsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZG9jLW1vZGFsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7R0FZRztBQUVILE9BQU8sRUFBTyxLQUFLLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFFekQsTUFBTSxPQUFPLFFBQVMsU0FBUSxLQUFLO0lBS2pDLFlBQVksR0FBUSxFQUFFLFFBQWdCLElBQUksRUFBRSxVQUFrQixFQUFFLEVBQUUsTUFBYyxFQUFFO1FBQ2hGLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUxiLFFBQUcsR0FBVyxFQUFFLENBQUM7UUFDakIsVUFBSyxHQUFXLElBQUksQ0FBQztRQUNyQixZQUFPLEdBQVcsRUFBRSxDQUFDO1FBSW5CLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO0lBQ2pCLENBQUM7SUFFRCw0Q0FBNEM7SUFDNUMsTUFBTTtRQUNKLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQ2xDLHFCQUFxQjtRQUNyQixPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7UUFDOUIsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDO1FBQy9CLFNBQVMsQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztRQUNqQyxTQUFTLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxRQUFRLENBQUM7UUFFekMsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDL0QsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDO1FBQ2xDLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsaUVBQWlFLENBQUMsQ0FBQztRQUM1RixPQUFPLENBQUMsV0FBVyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBRXJELE1BQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFO1lBQzFDLElBQUksRUFBRTtnQkFDSixHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7Z0JBQ2IsS0FBSyxFQUFFLE1BQU07Z0JBQ2IsS0FBSyxFQUFFLGlDQUFpQzthQUN6QztTQUNGLENBQUMsQ0FBQztRQUVILE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztJQUMxQixDQUFDO0lBRUQsT0FBTztRQUVMLElBQUksRUFBRSxTQUFTLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFDekIsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ3BCLENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMjQtMjAyNSBJc0hleHhcbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb2Z0d2FyZSBpcyBwcm9wcmlldGFyeSBhbmQgY29uZmlkZW50aWFsLiBObyBwYXJ0IG9mIHRoaXMgc29mdHdhcmVcbiAqIG1heSBiZSByZXByb2R1Y2VkLCBkaXN0cmlidXRlZCwgb3IgdHJhbnNtaXR0ZWQgaW4gYW55IGZvcm0gb3IgYnkgYW55IG1lYW5zLFxuICogaW5jbHVkaW5nIHBob3RvY29weWluZywgcmVjb3JkaW5nLCBvciBvdGhlciBlbGVjdHJvbmljIG9yIG1lY2hhbmljYWwgbWV0aG9kcyxcbiAqIHdpdGhvdXQgdGhlIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbiBvZiB0aGUgYXV0aG9yLCBleGNlcHQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGJyaWVmIHF1b3RhdGlvbnMgZW1ib2RpZWQgaW4gY3JpdGljYWwgcmV2aWV3cyBhbmQgY2VydGFpbiBvdGhlciBub25jb21tZXJjaWFsXG4gKiB1c2VzIHBlcm1pdHRlZCBieSBjb3B5cmlnaHQgbGF3LlxuICpcbiAqIEZvciBwZXJtaXNzaW9uIHJlcXVlc3RzLCBjb250YWN0OiBJc0hleHhcbiAqL1xuXG5pbXBvcnQgeyBBcHAsIE1vZGFsLCBzYW5pdGl6ZUhUTUxUb0RvbSB9IGZyb20gXCJvYnNpZGlhblwiO1xuXG5leHBvcnQgY2xhc3MgRG9jTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHVybDogc3RyaW5nID0gJyc7XG4gIHRpdGxlOiBzdHJpbmcgPSAn5o+Q56S6JztcbiAgY29udGVudDogc3RyaW5nID0gJyc7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHRpdGxlOiBzdHJpbmcgPSBcIuaPkOekulwiLCBjb250ZW50OiBzdHJpbmcgPSBcIlwiLCB1cmw6IHN0cmluZyA9IFwiXCIpIHtcbiAgICBzdXBlcihhcHApO1xuICAgIHRoaXMudGl0bGUgPSB0aXRsZTtcbiAgICB0aGlzLmNvbnRlbnQgPSBjb250ZW50O1xuICAgIHRoaXMudXJsID0gdXJsO1xuICB9XG5cbiAgLy8gQ2xhdWRlIENvZGUgVXBkYXRlOiDkv53nlZnmqKHmgIHmoYbluIPlsYDmiYDpnIDnmoTlhoXogZTmoLflvI/vvIjliqjmgIHorqHnrpflgLzvvIlcbiAgb25PcGVuKCkge1xuICAgIGxldCB7IGNvbnRlbnRFbCwgbW9kYWxFbCB9ID0gdGhpcztcbiAgICAvLyDmqKHmgIHmoYblsLrlr7jpnIDopoHliqjmgIHorr7nva7vvIzkv53nlZnlhoXogZTmoLflvI9cbiAgICBtb2RhbEVsLnN0eWxlLndpZHRoID0gJzY0MHB4JztcbiAgICBtb2RhbEVsLnN0eWxlLmhlaWdodCA9ICc3MjBweCc7XG4gICAgY29udGVudEVsLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XG4gICAgY29udGVudEVsLnN0eWxlLmZsZXhEaXJlY3Rpb24gPSAnY29sdW1uJztcblxuICAgIGNvbnN0IHRpdGxlRWwgPSBjb250ZW50RWwuY3JlYXRlRWwoJ2gyJywgeyB0ZXh0OiB0aGlzLnRpdGxlIH0pO1xuICAgIHRpdGxlRWwuc3R5bGUubWFyZ2luVG9wID0gJzAuNWVtJztcbiAgICBjb25zdCBjb250ZW50ID0gY29udGVudEVsLmNyZWF0ZUVsKCdkaXYnKTtcbiAgICBjb250ZW50LnNldEF0dHIoJ3N0eWxlJywgJ21hcmdpbi1ib3R0b206MWVtOy13ZWJraXQtdXNlci1zZWxlY3Q6IHRleHQ7IHVzZXItc2VsZWN0OiB0ZXh0OycpO1xuICAgIGNvbnRlbnQuYXBwZW5kQ2hpbGQoc2FuaXRpemVIVE1MVG9Eb20odGhpcy5jb250ZW50KSk7XG5cbiAgICBjb25zdCBpZnJhbWUgPSBjb250ZW50RWwuY3JlYXRlRWwoJ2lmcmFtZScsIHtcbiAgICAgIGF0dHI6IHtcbiAgICAgICAgc3JjOiB0aGlzLnVybCxcbiAgICAgICAgd2lkdGg6ICcxMDAlJyxcbiAgICAgICAgYWxsb3c6ICdjbGlwYm9hcmQtcmVhZDsgY2xpcGJvYXJkLXdyaXRlJyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBpZnJhbWUuc3R5bGUuZmxleCA9ICcxJztcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7XG5cbiAgICBsZXQgeyBjb250ZW50RWwgfSA9IHRoaXM7XG4gICAgY29udGVudEVsLmVtcHR5KCk7XG4gIH1cbn0iXX0=