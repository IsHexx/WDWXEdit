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
export class HeadingRenderer extends Extension {
    constructor() {
        super(...arguments);
        this.index = [0, 0, 0, 0];
    }
    async prepare() {
        this.index = [0, 0, 0, 0];
    }
    markedExtension() {
        return {
            async: true,
            walkTokens: async (token) => {
                if (token.type !== 'heading') {
                    return;
                }
                // 简化标题渲染，移除专家设置功能
                this.index[token.depth] += 1;
                const body = await this.marked.parseInline(token.text);
                token.html = `<h${token.depth}>${body}</h${token.depth}>`;
            },
            extensions: [{
                    name: 'heading',
                    level: 'block',
                    renderer: (token) => {
                        return token.html;
                    },
                }]
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVhZGluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImhlYWRpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7OztHQVlHO0FBR0gsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUl4QyxNQUFNLE9BQU8sZUFBZ0IsU0FBUSxTQUFTO0lBQTlDOztRQUNFLFVBQUssR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBNkJ2QixDQUFDO0lBM0JDLEtBQUssQ0FBQyxPQUFPO1FBQ1gsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzVCLENBQUM7SUFHRCxlQUFlO1FBQ2IsT0FBTztZQUNMLEtBQUssRUFBRSxJQUFJO1lBQ1gsVUFBVSxFQUFFLEtBQUssRUFBRSxLQUFxQixFQUFFLEVBQUU7Z0JBQzFDLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUU7b0JBQzVCLE9BQU87aUJBQ1I7Z0JBRUQsa0JBQWtCO2dCQUNsQixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzdCLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN2RCxLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssS0FBSyxDQUFDLEtBQUssSUFBSSxJQUFJLE1BQU0sS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDO1lBQzVELENBQUM7WUFDRCxVQUFVLEVBQUUsQ0FBQztvQkFDWCxJQUFJLEVBQUUsU0FBUztvQkFDZixLQUFLLEVBQUUsT0FBTztvQkFDZCxRQUFRLEVBQUUsQ0FBQyxLQUFxQixFQUFFLEVBQUU7d0JBQ2xDLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQztvQkFDcEIsQ0FBQztpQkFDRixDQUFDO1NBQ0gsQ0FBQTtJQUNILENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMjQtMjAyNSBJc0hleHhcbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb2Z0d2FyZSBpcyBwcm9wcmlldGFyeSBhbmQgY29uZmlkZW50aWFsLiBObyBwYXJ0IG9mIHRoaXMgc29mdHdhcmVcbiAqIG1heSBiZSByZXByb2R1Y2VkLCBkaXN0cmlidXRlZCwgb3IgdHJhbnNtaXR0ZWQgaW4gYW55IGZvcm0gb3IgYnkgYW55IG1lYW5zLFxuICogaW5jbHVkaW5nIHBob3RvY29weWluZywgcmVjb3JkaW5nLCBvciBvdGhlciBlbGVjdHJvbmljIG9yIG1lY2hhbmljYWwgbWV0aG9kcyxcbiAqIHdpdGhvdXQgdGhlIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbiBvZiB0aGUgYXV0aG9yLCBleGNlcHQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGJyaWVmIHF1b3RhdGlvbnMgZW1ib2RpZWQgaW4gY3JpdGljYWwgcmV2aWV3cyBhbmQgY2VydGFpbiBvdGhlciBub25jb21tZXJjaWFsXG4gKiB1c2VzIHBlcm1pdHRlZCBieSBjb3B5cmlnaHQgbGF3LlxuICpcbiAqIEZvciBwZXJtaXNzaW9uIHJlcXVlc3RzLCBjb250YWN0OiBJc0hleHhcbiAqL1xuXG5pbXBvcnQgeyBUb2tlbnMsIE1hcmtlZEV4dGVuc2lvbiB9IGZyb20gXCJtYXJrZWRcIjtcbmltcG9ydCB7IEV4dGVuc2lvbiB9IGZyb20gXCIuL2V4dGVuc2lvblwiO1xuLy8g5pu05pawaW1wb3J06Lev5b6EXG5pbXBvcnQgQXNzZXRzTWFuYWdlciBmcm9tIFwiLi4vLi4vLi4vY29yZS9hc3NldHNcIjtcblxuZXhwb3J0IGNsYXNzIEhlYWRpbmdSZW5kZXJlciBleHRlbmRzIEV4dGVuc2lvbiB7XG4gIGluZGV4ID0gWzAsIDAsIDAsIDBdO1xuXG4gIGFzeW5jIHByZXBhcmUoKSB7XG4gICAgdGhpcy5pbmRleCA9IFswLCAwLCAwLCAwXTtcbiAgfVxuXG5cbiAgbWFya2VkRXh0ZW5zaW9uKCk6IE1hcmtlZEV4dGVuc2lvbiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFzeW5jOiB0cnVlLFxuICAgICAgd2Fsa1Rva2VuczogYXN5bmMgKHRva2VuOiBUb2tlbnMuR2VuZXJpYykgPT4ge1xuICAgICAgICBpZiAodG9rZW4udHlwZSAhPT0gJ2hlYWRpbmcnKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g566A5YyW5qCH6aKY5riy5p+T77yM56e76Zmk5LiT5a626K6+572u5Yqf6IO9XG4gICAgICAgIHRoaXMuaW5kZXhbdG9rZW4uZGVwdGhdICs9IDE7XG4gICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCB0aGlzLm1hcmtlZC5wYXJzZUlubGluZSh0b2tlbi50ZXh0KTtcbiAgICAgICAgdG9rZW4uaHRtbCA9IGA8aCR7dG9rZW4uZGVwdGh9PiR7Ym9keX08L2gke3Rva2VuLmRlcHRofT5gO1xuICAgICAgfSxcbiAgICAgIGV4dGVuc2lvbnM6IFt7XG4gICAgICAgIG5hbWU6ICdoZWFkaW5nJyxcbiAgICAgICAgbGV2ZWw6ICdibG9jaycsXG4gICAgICAgIHJlbmRlcmVyOiAodG9rZW46IFRva2Vucy5HZW5lcmljKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRva2VuLmh0bWw7XG4gICAgICAgIH0sXG4gICAgICB9XVxuICAgIH1cbiAgfVxufSJdfQ==