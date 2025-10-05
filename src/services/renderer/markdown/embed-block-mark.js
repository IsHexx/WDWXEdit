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
const BlockMarkRegex = /^\^[0-9A-Za-z-]+$/;
export class EmbedBlockMark extends Extension {
    constructor() {
        super(...arguments);
        this.allLinks = [];
    }
    async prepare() {
        this.allLinks = [];
    }
    markedExtension() {
        return {
            extensions: [{
                    name: 'EmbedBlockMark',
                    level: 'inline',
                    start(src) {
                        let index = src.indexOf('^');
                        if (index === -1) {
                            return;
                        }
                        return index;
                    },
                    tokenizer(src) {
                        const match = src.match(BlockMarkRegex);
                        if (match) {
                            return {
                                type: 'EmbedBlockMark',
                                raw: match[0],
                                text: match[0]
                            };
                        }
                    },
                    renderer: (token) => {
                        return `<span data-txt="${token.text}"></span}`;
                    }
                }]
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1iZWQtYmxvY2stbWFyay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVtYmVkLWJsb2NrLW1hcmsudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7OztHQVlHO0FBR0gsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUV4QyxNQUFNLGNBQWMsR0FBRyxtQkFBbUIsQ0FBQztBQUUzQyxNQUFNLE9BQU8sY0FBZSxTQUFRLFNBQVM7SUFBN0M7O1FBQ0ksYUFBUSxHQUFZLEVBQUUsQ0FBQztJQWlDM0IsQ0FBQztJQWhDRyxLQUFLLENBQUMsT0FBTztRQUNWLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFFRCxlQUFlO1FBQ1gsT0FBTztZQUNILFVBQVUsRUFBRSxDQUFDO29CQUNULElBQUksRUFBRSxnQkFBZ0I7b0JBQ3RCLEtBQUssRUFBRSxRQUFRO29CQUNmLEtBQUssQ0FBQyxHQUFXO3dCQUNiLElBQUksS0FBSyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQzdCLElBQUksS0FBSyxLQUFLLENBQUMsQ0FBQyxFQUFFOzRCQUNkLE9BQU87eUJBQ1Y7d0JBQ0QsT0FBTyxLQUFLLENBQUM7b0JBQ2pCLENBQUM7b0JBQ0QsU0FBUyxDQUFDLEdBQVc7d0JBQ2pCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7d0JBQ3hDLElBQUksS0FBSyxFQUFFOzRCQUNQLE9BQU87Z0NBQ0gsSUFBSSxFQUFFLGdCQUFnQjtnQ0FDdEIsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0NBQ2IsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7NkJBQ2pCLENBQUM7eUJBQ0w7b0JBQ0wsQ0FBQztvQkFDRCxRQUFRLEVBQUUsQ0FBQyxLQUFxQixFQUFFLEVBQUU7d0JBQ2hDLE9BQU8sbUJBQW1CLEtBQUssQ0FBQyxJQUFJLFdBQVcsQ0FBQztvQkFDcEQsQ0FBQztpQkFDSixDQUFDO1NBQ0wsQ0FBQTtJQUNMLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMjQtMjAyNSBJc0hleHhcbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb2Z0d2FyZSBpcyBwcm9wcmlldGFyeSBhbmQgY29uZmlkZW50aWFsLiBObyBwYXJ0IG9mIHRoaXMgc29mdHdhcmVcbiAqIG1heSBiZSByZXByb2R1Y2VkLCBkaXN0cmlidXRlZCwgb3IgdHJhbnNtaXR0ZWQgaW4gYW55IGZvcm0gb3IgYnkgYW55IG1lYW5zLFxuICogaW5jbHVkaW5nIHBob3RvY29weWluZywgcmVjb3JkaW5nLCBvciBvdGhlciBlbGVjdHJvbmljIG9yIG1lY2hhbmljYWwgbWV0aG9kcyxcbiAqIHdpdGhvdXQgdGhlIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbiBvZiB0aGUgYXV0aG9yLCBleGNlcHQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGJyaWVmIHF1b3RhdGlvbnMgZW1ib2RpZWQgaW4gY3JpdGljYWwgcmV2aWV3cyBhbmQgY2VydGFpbiBvdGhlciBub25jb21tZXJjaWFsXG4gKiB1c2VzIHBlcm1pdHRlZCBieSBjb3B5cmlnaHQgbGF3LlxuICpcbiAqIEZvciBwZXJtaXNzaW9uIHJlcXVlc3RzLCBjb250YWN0OiBJc0hleHhcbiAqL1xuXG5pbXBvcnQgeyBUb2tlbnMsIE1hcmtlZEV4dGVuc2lvbiB9IGZyb20gXCJtYXJrZWRcIjtcbmltcG9ydCB7IEV4dGVuc2lvbiB9IGZyb20gXCIuL2V4dGVuc2lvblwiO1xuXG5jb25zdCBCbG9ja01hcmtSZWdleCA9IC9eXFxeWzAtOUEtWmEtei1dKyQvO1xuXG5leHBvcnQgY2xhc3MgRW1iZWRCbG9ja01hcmsgZXh0ZW5kcyBFeHRlbnNpb24ge1xuICAgIGFsbExpbmtzOnN0cmluZ1tdID0gW107XG4gICAgYXN5bmMgcHJlcGFyZSgpIHtcbiAgICAgICB0aGlzLmFsbExpbmtzID0gW107XG4gICAgfVxuXG4gICAgbWFya2VkRXh0ZW5zaW9uKCk6IE1hcmtlZEV4dGVuc2lvbiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBleHRlbnNpb25zOiBbe1xuICAgICAgICAgICAgICAgIG5hbWU6ICdFbWJlZEJsb2NrTWFyaycsXG4gICAgICAgICAgICAgICAgbGV2ZWw6ICdpbmxpbmUnLFxuICAgICAgICAgICAgICAgIHN0YXJ0KHNyYzogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBpbmRleCA9IHNyYy5pbmRleE9mKCdeJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW5kZXg7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0b2tlbml6ZXIoc3JjOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF0Y2ggPSBzcmMubWF0Y2goQmxvY2tNYXJrUmVnZXgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ0VtYmVkQmxvY2tNYXJrJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYXc6IG1hdGNoWzBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IG1hdGNoWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZW5kZXJlcjogKHRva2VuOiBUb2tlbnMuR2VuZXJpYykgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYDxzcGFuIGRhdGEtdHh0PVwiJHt0b2tlbi50ZXh0fVwiPjwvc3Bhbn1gO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1dXG4gICAgICAgIH1cbiAgICB9XG59Il19