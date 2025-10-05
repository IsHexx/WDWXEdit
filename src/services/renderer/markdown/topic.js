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
const topicRegex = /^#([^\s#]+)/;
export class Topic extends Extension {
    markedExtension() {
        return {
            extensions: [{
                    name: 'Topic',
                    level: 'inline',
                    start(src) {
                        let index;
                        let indexSrc = src;
                        while (indexSrc) {
                            index = indexSrc.indexOf('#');
                            if (index === -1)
                                return;
                            return index;
                        }
                    },
                    tokenizer(src) {
                        const match = src.match(topicRegex);
                        if (match) {
                            return {
                                type: 'Topic',
                                raw: match[0],
                                text: match[1],
                            };
                        }
                    },
                    renderer(token) {
                        return `<a class="wx_topic_link" style="color: #576B95 !important;" data-topic="1">${'#' + token.text.trim()}</a>`;
                    }
                },
            ]
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9waWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0b3BpYy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7O0dBWUc7QUFHSCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBRXhDLE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQztBQUVqQyxNQUFNLE9BQU8sS0FBTSxTQUFRLFNBQVM7SUFDbEMsZUFBZTtRQUNiLE9BQU87WUFDTCxVQUFVLEVBQUUsQ0FBQztvQkFDWCxJQUFJLEVBQUUsT0FBTztvQkFDYixLQUFLLEVBQUUsUUFBUTtvQkFDZixLQUFLLENBQUMsR0FBVzt3QkFDZixJQUFJLEtBQUssQ0FBQzt3QkFDVixJQUFJLFFBQVEsR0FBRyxHQUFHLENBQUM7d0JBRW5CLE9BQU8sUUFBUSxFQUFFOzRCQUNmLEtBQUssR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDOzRCQUM5QixJQUFJLEtBQUssS0FBSyxDQUFDLENBQUM7Z0NBQUUsT0FBTzs0QkFDekIsT0FBTyxLQUFLLENBQUM7eUJBQ2Q7b0JBQ0gsQ0FBQztvQkFDRCxTQUFTLENBQUMsR0FBVzt3QkFDbkIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDcEMsSUFBSSxLQUFLLEVBQUU7NEJBQ1QsT0FBTztnQ0FDTCxJQUFJLEVBQUUsT0FBTztnQ0FDYixHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztnQ0FDYixJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQzs2QkFDZixDQUFDO3lCQUNIO29CQUNILENBQUM7b0JBQ0QsUUFBUSxDQUFDLEtBQXFCO3dCQUM1QixPQUFPLDhFQUE4RSxHQUFHLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDO29CQUNySCxDQUFDO2lCQUNGO2FBQ0E7U0FDRixDQUFBO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAoYykgMjAyNC0yMDI1IElzSGV4eFxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvZnR3YXJlIGlzIHByb3ByaWV0YXJ5IGFuZCBjb25maWRlbnRpYWwuIE5vIHBhcnQgb2YgdGhpcyBzb2Z0d2FyZVxuICogbWF5IGJlIHJlcHJvZHVjZWQsIGRpc3RyaWJ1dGVkLCBvciB0cmFuc21pdHRlZCBpbiBhbnkgZm9ybSBvciBieSBhbnkgbWVhbnMsXG4gKiBpbmNsdWRpbmcgcGhvdG9jb3B5aW5nLCByZWNvcmRpbmcsIG9yIG90aGVyIGVsZWN0cm9uaWMgb3IgbWVjaGFuaWNhbCBtZXRob2RzLFxuICogd2l0aG91dCB0aGUgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uIG9mIHRoZSBhdXRob3IsIGV4Y2VwdCBpbiB0aGUgY2FzZSBvZlxuICogYnJpZWYgcXVvdGF0aW9ucyBlbWJvZGllZCBpbiBjcml0aWNhbCByZXZpZXdzIGFuZCBjZXJ0YWluIG90aGVyIG5vbmNvbW1lcmNpYWxcbiAqIHVzZXMgcGVybWl0dGVkIGJ5IGNvcHlyaWdodCBsYXcuXG4gKlxuICogRm9yIHBlcm1pc3Npb24gcmVxdWVzdHMsIGNvbnRhY3Q6IElzSGV4eFxuICovXG5cbmltcG9ydCB7IFRva2VucywgTWFya2VkRXh0ZW5zaW9uIH0gZnJvbSBcIm1hcmtlZFwiO1xuaW1wb3J0IHsgRXh0ZW5zaW9uIH0gZnJvbSBcIi4vZXh0ZW5zaW9uXCI7XG5cbmNvbnN0IHRvcGljUmVnZXggPSAvXiMoW15cXHMjXSspLztcblxuZXhwb3J0IGNsYXNzIFRvcGljIGV4dGVuZHMgRXh0ZW5zaW9uIHtcbiAgbWFya2VkRXh0ZW5zaW9uKCk6IE1hcmtlZEV4dGVuc2lvbiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGV4dGVuc2lvbnM6IFt7XG4gICAgICAgIG5hbWU6ICdUb3BpYycsXG4gICAgICAgIGxldmVsOiAnaW5saW5lJyxcbiAgICAgICAgc3RhcnQoc3JjOiBzdHJpbmcpIHtcbiAgICAgICAgICBsZXQgaW5kZXg7XG4gICAgICAgICAgbGV0IGluZGV4U3JjID0gc3JjO1xuXG4gICAgICAgICAgd2hpbGUgKGluZGV4U3JjKSB7XG4gICAgICAgICAgICBpbmRleCA9IGluZGV4U3JjLmluZGV4T2YoJyMnKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHJldHVybjtcbiAgICAgICAgICAgIHJldHVybiBpbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRva2VuaXplcihzcmM6IHN0cmluZykge1xuICAgICAgICAgIGNvbnN0IG1hdGNoID0gc3JjLm1hdGNoKHRvcGljUmVnZXgpO1xuICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdHlwZTogJ1RvcGljJyxcbiAgICAgICAgICAgICAgcmF3OiBtYXRjaFswXSxcbiAgICAgICAgICAgICAgdGV4dDogbWF0Y2hbMV0sXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVuZGVyZXIodG9rZW46IFRva2Vucy5HZW5lcmljKSB7XG4gICAgICAgICAgcmV0dXJuIGA8YSBjbGFzcz1cInd4X3RvcGljX2xpbmtcIiBzdHlsZT1cImNvbG9yOiAjNTc2Qjk1ICFpbXBvcnRhbnQ7XCIgZGF0YS10b3BpYz1cIjFcIj4keycjJyArIHRva2VuLnRleHQudHJpbSgpfTwvYT5gO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXVxuICAgIH1cbiAgfVxufSJdfQ==