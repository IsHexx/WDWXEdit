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
// Claude Code Remove
const icon_note = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path><path d="m15 5 4 4"></path></svg>`;
const icon_abstract = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-clipboard-list"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><path d="M12 11h4"></path><path d="M12 16h4"></path><path d="M8 11h.01"></path><path d="M8 16h.01"></path></svg>`;
const icon_info = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-info"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>`;
const icon_todo = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-check-circle-2"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>`;
const icon_tip = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-flame"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>`;
const icon_success = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-check"><path d="M20 6 9 17l-5-5"></path></svg>`;
const icon_question = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-help-circle"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>`;
const icon_warning = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>`;
const icon_failure = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-x"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`;
const icon_danger = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-zap"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
const icon_bug = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-bug"><path d="m8 2 1.88 1.88"></path><path d="M14.12 3.88 16 2"></path><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"></path><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"></path><path d="M12 20v-9"></path><path d="M6.53 9C4.6 8.8 3 7.1 3 5"></path><path d="M6 13H2"></path><path d="M3 21c0-2.1 1.7-3.9 3.8-4"></path><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"></path><path d="M22 13h-4"></path><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"></path></svg>`;
const icon_example = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-list"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`;
const icon_quote = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-quote"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path></svg>`;
const CalloutTypes = new Map(Object.entries({
    note: {
        icon: icon_note,
        style: 'note-callout-note',
    },
    abstract: {
        icon: icon_abstract,
        style: 'note-callout-abstract',
    },
    summary: {
        icon: icon_abstract,
        style: 'note-callout-abstract',
    },
    tldr: {
        icon: icon_abstract,
        style: 'note-callout-abstract',
    },
    info: {
        icon: icon_info,
        style: 'note-callout-note',
    },
    todo: {
        icon: icon_todo,
        style: 'note-callout-note',
    },
    tip: {
        icon: icon_tip,
        style: 'note-callout-abstract',
    },
    hint: {
        icon: icon_tip,
        style: 'note-callout-abstract',
    },
    important: {
        icon: icon_tip,
        style: 'note-callout-abstract',
    },
    success: {
        icon: icon_success,
        style: 'note-callout-success',
    },
    check: {
        icon: icon_success,
        style: 'note-callout-success',
    },
    done: {
        icon: icon_success,
        style: 'note-callout-success',
    },
    question: {
        icon: icon_question,
        style: 'note-callout-question',
    },
    help: {
        icon: icon_question,
        style: 'note-callout-question',
    },
    faq: {
        icon: icon_question,
        style: 'note-callout-question',
    },
    warning: {
        icon: icon_warning,
        style: 'note-callout-question',
    },
    caution: {
        icon: icon_warning,
        style: 'note-callout-question',
    },
    attention: {
        icon: icon_warning,
        style: 'note-callout-question',
    },
    failure: {
        icon: icon_failure,
        style: 'note-callout-failure',
    },
    fail: {
        icon: icon_failure,
        style: 'note-callout-failure',
    },
    missing: {
        icon: icon_failure,
        style: 'note-callout-failure',
    },
    danger: {
        icon: icon_danger,
        style: 'note-callout-failure',
    },
    error: {
        icon: icon_danger,
        style: 'note-callout-failure',
    },
    bug: {
        icon: icon_bug,
        style: 'note-callout-failure',
    },
    example: {
        icon: icon_example,
        style: 'note-callout-example',
    },
    quote: {
        icon: icon_quote,
        style: 'note-callout-quote',
    },
    cite: {
        icon: icon_quote,
        style: 'note-callout-quote',
    }
}));
function GetCallout(type) {
    return CalloutTypes.get(type);
}
;
function matchCallouts(text) {
    const regex = /\[\!(.*?)\]/g;
    let m;
    if (m = regex.exec(text)) {
        return m[1];
    }
    return "";
}
function GetCalloutTitle(callout, text) {
    let title = callout.charAt(0).toUpperCase() + callout.slice(1).toLowerCase();
    let start = text.indexOf(']') + 1;
    if (text.indexOf(']-') > 0 || text.indexOf(']+') > 0) {
        start = start + 1;
    }
    let end = text.indexOf('\n');
    if (end === -1)
        end = text.length;
    if (start >= end)
        return title;
    const customTitle = text.slice(start, end).trim();
    if (customTitle !== '') {
        title = customTitle;
    }
    return title;
}
export class CalloutRenderer extends Extension {
    matched(text) {
        return matchCallouts(text) != '';
    }
    async renderer(token) {
        let callout = matchCallouts(token.text);
        if (callout == '') {
            const body = this.marked.parser(token.tokens);
            return `<blockquote>${body}</blockquote>`;
            ;
        }
        const title = GetCalloutTitle(callout, token.text);
        const index = token.text.indexOf('\n');
        let body = '';
        if (index > 0) {
            token.text = token.text.slice(index + 1);
            body = await this.marked.parse(token.text);
        }
        let info = GetCallout(callout.toLowerCase());
        if (info == null) {
            const svg = await this.assetsManager.loadIcon(callout);
            if (svg) {
                info = { icon: svg, style: 'note-callout-custom' };
            }
            else {
                info = GetCallout('note');
            }
        }
        return `<section class="note-callout ${info === null || info === void 0 ? void 0 : info.style}"><section class="note-callout-title-wrap"><span class="note-callout-icon">${info === null || info === void 0 ? void 0 : info.icon}</span><span class="note-callout-title">${title}<span></section><section class="note-callout-content">${body}</section></section>`;
    }
    markedExtension() {
        return {
            async: true,
            walkTokens: async (token) => {
                if (token.type !== 'blockquote') {
                    return;
                }
                token.html = await this.renderer(token);
            },
            extensions: [{
                    name: 'blockquote',
                    level: 'block',
                    renderer: (token) => {
                        return token.html;
                    },
                }]
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsbG91dHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjYWxsb3V0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7O0dBWUc7QUFHSCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBR3hDLHFCQUFxQjtBQUVyQixNQUFNLFNBQVMsR0FBRyx5VEFBeVQsQ0FBQTtBQUMzVSxNQUFNLGFBQWEsR0FBRyxvZUFBb2UsQ0FBQTtBQUMxZixNQUFNLFNBQVMsR0FBRyx3VEFBd1QsQ0FBQTtBQUMxVSxNQUFNLFNBQVMsR0FBRywyU0FBMlMsQ0FBQTtBQUM3VCxNQUFNLFFBQVEsR0FBRyxzWkFBc1osQ0FBQTtBQUN2YSxNQUFNLFlBQVksR0FBRyw0UEFBNFAsQ0FBQTtBQUNqUixNQUFNLGFBQWEsR0FBRywyVkFBMlYsQ0FBQTtBQUNqWCxNQUFNLFlBQVksR0FBRyxvWEFBb1gsQ0FBQTtBQUN6WSxNQUFNLFlBQVksR0FBRywrUUFBK1EsQ0FBQTtBQUNwUyxNQUFNLFdBQVcsR0FBRyw0UkFBNFIsQ0FBQTtBQUNoVCxNQUFNLFFBQVEsR0FBRyw0cUJBQTRxQixDQUFBO0FBQzdyQixNQUFNLFlBQVksR0FBRyxvZUFBb2UsQ0FBQTtBQUN6ZixNQUFNLFVBQVUsR0FBRyx5Z0JBQXlnQixDQUFBO0FBb0I1aEIsTUFBTSxZQUFZLEdBQUcsSUFBSSxHQUFHLENBQXNCLE1BQU0sQ0FBQyxPQUFPLENBQUM7SUFDN0QsSUFBSSxFQUFFO1FBQ0YsSUFBSSxFQUFFLFNBQVM7UUFDZixLQUFLLEVBQUUsbUJBQW1CO0tBQzdCO0lBQ0QsUUFBUSxFQUFFO1FBQ04sSUFBSSxFQUFFLGFBQWE7UUFDbkIsS0FBSyxFQUFFLHVCQUF1QjtLQUNqQztJQUNELE9BQU8sRUFBRTtRQUNMLElBQUksRUFBRSxhQUFhO1FBQ25CLEtBQUssRUFBRSx1QkFBdUI7S0FDakM7SUFDRCxJQUFJLEVBQUU7UUFDRixJQUFJLEVBQUUsYUFBYTtRQUNuQixL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LHVCQUFKLElBQUksQ0FBRSxJQUFJLDJDQUEyQyxLQUFLLHlEQUF5RCxJQUFJLHNCQUFzQixDQUFDO0lBQ2pSLENBQUM7SUFFRixlQUFlO1FBQ1gsT0FBTztZQUNILEtBQUssRUFBRSxJQUFJO1lBQ1gsVUFBVSxFQUFFLEtBQUssRUFBRSxLQUFxQixFQUFFLEVBQUU7Z0JBQ3hDLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxZQUFZLEVBQUU7b0JBQzdCLE9BQU87aUJBQ1Y7Z0JBQ0QsS0FBSyxDQUFDLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBMEIsQ0FBQyxDQUFDO1lBQ2pFLENBQUM7WUFDRCxVQUFVLEVBQUMsQ0FBQztvQkFDUixJQUFJLEVBQUUsWUFBWTtvQkFDbEIsS0FBSyxFQUFFLE9BQU87b0JBQ2QsUUFBUSxFQUFFLENBQUMsS0FBcUIsRUFBQyxFQUFFO3dCQUMvQixPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUM7b0JBQ3RCLENBQUM7aUJBQ0osQ0FBQztTQUNMLENBQUE7SUFDTCxDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IChjKSAyMDI0LTIwMjUgSXNIZXh4XG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc29mdHdhcmUgaXMgcHJvcHJpZXRhcnkgYW5kIGNvbmZpZGVudGlhbC4gTm8gcGFydCBvZiB0aGlzIHNvZnR3YXJlXG4gKiBtYXkgYmUgcmVwcm9kdWNlZCwgZGlzdHJpYnV0ZWQsIG9yIHRyYW5zbWl0dGVkIGluIGFueSBmb3JtIG9yIGJ5IGFueSBtZWFucyxcbiAqIGluY2x1ZGluZyBwaG90b2NvcHlpbmcsIHJlY29yZGluZywgb3Igb3RoZXIgZWxlY3Ryb25pYyBvciBtZWNoYW5pY2FsIG1ldGhvZHMsXG4gKiB3aXRob3V0IHRoZSBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24gb2YgdGhlIGF1dGhvciwgZXhjZXB0IGluIHRoZSBjYXNlIG9mXG4gKiBicmllZiBxdW90YXRpb25zIGVtYm9kaWVkIGluIGNyaXRpY2FsIHJldmlld3MgYW5kIGNlcnRhaW4gb3RoZXIgbm9uY29tbWVyY2lhbFxuICogdXNlcyBwZXJtaXR0ZWQgYnkgY29weXJpZ2h0IGxhdy5cbiAqXG4gKiBGb3IgcGVybWlzc2lvbiByZXF1ZXN0cywgY29udGFjdDogSXNIZXh4XG4gKi9cblxuaW1wb3J0IHsgVG9rZW5zLCBNYXJrZWRFeHRlbnNpb259IGZyb20gXCJtYXJrZWRcIjtcbmltcG9ydCB7IEV4dGVuc2lvbiB9IGZyb20gXCIuL2V4dGVuc2lvblwiO1xuLy8g5pu05pawaW1wb3J06Lev5b6EXG5pbXBvcnQgQXNzZXRzTWFuYWdlciBmcm9tIFwiLi4vLi4vLi4vY29yZS9hc3NldHNcIjtcbi8vIENsYXVkZSBDb2RlIFJlbW92ZVxuXG5jb25zdCBpY29uX25vdGUgPSBgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgd2lkdGg9XCIyNFwiIGhlaWdodD1cIjI0XCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiIGNsYXNzPVwic3ZnLWljb24gbHVjaWRlLXBlbmNpbFwiPjxwYXRoIGQ9XCJNMTcgM2EyLjg1IDIuODMgMCAxIDEgNCA0TDcuNSAyMC41IDIgMjJsMS41LTUuNVpcIj48L3BhdGg+PHBhdGggZD1cIm0xNSA1IDQgNFwiPjwvcGF0aD48L3N2Zz5gXG5jb25zdCBpY29uX2Fic3RyYWN0ID0gYDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHdpZHRoPVwiMjRcIiBoZWlnaHQ9XCIyNFwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIiBjbGFzcz1cInN2Zy1pY29uIGx1Y2lkZS1jbGlwYm9hcmQtbGlzdFwiPjxyZWN0IHg9XCI4XCIgeT1cIjJcIiB3aWR0aD1cIjhcIiBoZWlnaHQ9XCI0XCIgcng9XCIxXCIgcnk9XCIxXCI+PC9yZWN0PjxwYXRoIGQ9XCJNMTYgNGgyYTIgMiAwIDAgMSAyIDJ2MTRhMiAyIDAgMCAxLTIgMkg2YTIgMiAwIDAgMS0yLTJWNmEyIDIgMCAwIDEgMi0yaDJcIj48L3BhdGg+PHBhdGggZD1cIk0xMiAxMWg0XCI+PC9wYXRoPjxwYXRoIGQ9XCJNMTIgMTZoNFwiPjwvcGF0aD48cGF0aCBkPVwiTTggMTFoLjAxXCI+PC9wYXRoPjxwYXRoIGQ9XCJNOCAxNmguMDFcIj48L3BhdGg+PC9zdmc+YFxuY29uc3QgaWNvbl9pbmZvID0gYDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHdpZHRoPVwiMjRcIiBoZWlnaHQ9XCIyNFwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIiBjbGFzcz1cInN2Zy1pY29uIGx1Y2lkZS1pbmZvXCI+PGNpcmNsZSBjeD1cIjEyXCIgY3k9XCIxMlwiIHI9XCIxMFwiPjwvY2lyY2xlPjxwYXRoIGQ9XCJNMTIgMTZ2LTRcIj48L3BhdGg+PHBhdGggZD1cIk0xMiA4aC4wMVwiPjwvcGF0aD48L3N2Zz5gXG5jb25zdCBpY29uX3RvZG8gPSBgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgd2lkdGg9XCIyNFwiIGhlaWdodD1cIjI0XCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiIGNsYXNzPVwic3ZnLWljb24gbHVjaWRlLWNoZWNrLWNpcmNsZS0yXCI+PGNpcmNsZSBjeD1cIjEyXCIgY3k9XCIxMlwiIHI9XCIxMFwiPjwvY2lyY2xlPjxwYXRoIGQ9XCJtOSAxMiAyIDIgNC00XCI+PC9wYXRoPjwvc3ZnPmBcbmNvbnN0IGljb25fdGlwID0gYDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHdpZHRoPVwiMjRcIiBoZWlnaHQ9XCIyNFwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIiBjbGFzcz1cInN2Zy1pY29uIGx1Y2lkZS1mbGFtZVwiPjxwYXRoIGQ9XCJNOC41IDE0LjVBMi41IDIuNSAwIDAgMCAxMSAxMmMwLTEuMzgtLjUtMi0xLTMtMS4wNzItMi4xNDMtLjIyNC00LjA1NCAyLTYgLjUgMi41IDIgNC45IDQgNi41IDIgMS42IDMgMy41IDMgNS41YTcgNyAwIDEgMS0xNCAwYzAtMS4xNTMuNDMzLTIuMjk0IDEtM2EyLjUgMi41IDAgMCAwIDIuNSAyLjV6XCI+PC9wYXRoPjwvc3ZnPmBcbmNvbnN0IGljb25fc3VjY2VzcyA9IGA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB3aWR0aD1cIjI0XCIgaGVpZ2h0PVwiMjRcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIgY2xhc3M9XCJzdmctaWNvbiBsdWNpZGUtY2hlY2tcIj48cGF0aCBkPVwiTTIwIDYgOSAxN2wtNS01XCI+PC9wYXRoPjwvc3ZnPmBcbmNvbnN0IGljb25fcXVlc3Rpb24gPSBgPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgd2lkdGg9XCIyNFwiIGhlaWdodD1cIjI0XCIgdmlld0JveD1cIjAgMCAyNCAyNFwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiIGNsYXNzPVwic3ZnLWljb24gbHVjaWRlLWhlbHAtY2lyY2xlXCI+PGNpcmNsZSBjeD1cIjEyXCIgY3k9XCIxMlwiIHI9XCIxMFwiPjwvY2lyY2xlPjxwYXRoIGQ9XCJNOS4wOSA5YTMgMyAwIDAgMSA1LjgzIDFjMCAyLTMgMy0zIDNcIj48L3BhdGg+PHBhdGggZD1cIk0xMiAxN2guMDFcIj48L3BhdGg+PC9zdmc+YFxuY29uc3QgaWNvbl93YXJuaW5nID0gYDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHdpZHRoPVwiMjRcIiBoZWlnaHQ9XCIyNFwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIiBjbGFzcz1cInN2Zy1pY29uIGx1Y2lkZS1hbGVydC10cmlhbmdsZVwiPjxwYXRoIGQ9XCJtMjEuNzMgMTgtOC0xNGEyIDIgMCAwIDAtMy40OCAwbC04IDE0QTIgMiAwIDAgMCA0IDIxaDE2YTIgMiAwIDAgMCAxLjczLTNaXCI+PC9wYXRoPjxwYXRoIGQ9XCJNMTIgOXY0XCI+PC9wYXRoPjxwYXRoIGQ9XCJNMTIgMTdoLjAxXCI+PC9wYXRoPjwvc3ZnPmBcbmNvbnN0IGljb25fZmFpbHVyZSA9IGA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB3aWR0aD1cIjI0XCIgaGVpZ2h0PVwiMjRcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIgY2xhc3M9XCJzdmctaWNvbiBsdWNpZGUteFwiPjxwYXRoIGQ9XCJNMTggNiA2IDE4XCI+PC9wYXRoPjxwYXRoIGQ9XCJtNiA2IDEyIDEyXCI+PC9wYXRoPjwvc3ZnPmBcbmNvbnN0IGljb25fZGFuZ2VyID0gYDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHdpZHRoPVwiMjRcIiBoZWlnaHQ9XCIyNFwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIiBjbGFzcz1cInN2Zy1pY29uIGx1Y2lkZS16YXBcIj48cG9seWdvbiBwb2ludHM9XCIxMyAyIDMgMTQgMTIgMTQgMTEgMjIgMjEgMTAgMTIgMTAgMTMgMlwiPjwvcG9seWdvbj48L3N2Zz5gXG5jb25zdCBpY29uX2J1ZyA9IGA8c3ZnIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB3aWR0aD1cIjI0XCIgaGVpZ2h0PVwiMjRcIiB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIgY2xhc3M9XCJzdmctaWNvbiBsdWNpZGUtYnVnXCI+PHBhdGggZD1cIm04IDIgMS44OCAxLjg4XCI+PC9wYXRoPjxwYXRoIGQ9XCJNMTQuMTIgMy44OCAxNiAyXCI+PC9wYXRoPjxwYXRoIGQ9XCJNOSA3LjEzdi0xYTMuMDAzIDMuMDAzIDAgMSAxIDYgMHYxXCI+PC9wYXRoPjxwYXRoIGQ9XCJNMTIgMjBjLTMuMyAwLTYtMi43LTYtNnYtM2E0IDQgMCAwIDEgNC00aDRhNCA0IDAgMCAxIDQgNHYzYzAgMy4zLTIuNyA2LTYgNlwiPjwvcGF0aD48cGF0aCBkPVwiTTEyIDIwdi05XCI+PC9wYXRoPjxwYXRoIGQ9XCJNNi41MyA5QzQuNiA4LjggMyA3LjEgMyA1XCI+PC9wYXRoPjxwYXRoIGQ9XCJNNiAxM0gyXCI+PC9wYXRoPjxwYXRoIGQ9XCJNMyAyMWMwLTIuMSAxLjctMy45IDMuOC00XCI+PC9wYXRoPjxwYXRoIGQ9XCJNMjAuOTcgNWMwIDIuMS0xLjYgMy44LTMuNSA0XCI+PC9wYXRoPjxwYXRoIGQ9XCJNMjIgMTNoLTRcIj48L3BhdGg+PHBhdGggZD1cIk0xNy4yIDE3YzIuMS4xIDMuOCAxLjkgMy44IDRcIj48L3BhdGg+PC9zdmc+YFxuY29uc3QgaWNvbl9leGFtcGxlID0gYDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHdpZHRoPVwiMjRcIiBoZWlnaHQ9XCIyNFwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIiBjbGFzcz1cInN2Zy1pY29uIGx1Y2lkZS1saXN0XCI+PGxpbmUgeDE9XCI4XCIgeTE9XCI2XCIgeDI9XCIyMVwiIHkyPVwiNlwiPjwvbGluZT48bGluZSB4MT1cIjhcIiB5MT1cIjEyXCIgeDI9XCIyMVwiIHkyPVwiMTJcIj48L2xpbmU+PGxpbmUgeDE9XCI4XCIgeTE9XCIxOFwiIHgyPVwiMjFcIiB5Mj1cIjE4XCI+PC9saW5lPjxsaW5lIHgxPVwiM1wiIHkxPVwiNlwiIHgyPVwiMy4wMVwiIHkyPVwiNlwiPjwvbGluZT48bGluZSB4MT1cIjNcIiB5MT1cIjEyXCIgeDI9XCIzLjAxXCIgeTI9XCIxMlwiPjwvbGluZT48bGluZSB4MT1cIjNcIiB5MT1cIjE4XCIgeDI9XCIzLjAxXCIgeTI9XCIxOFwiPjwvbGluZT48L3N2Zz5gXG5jb25zdCBpY29uX3F1b3RlID0gYDxzdmcgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHdpZHRoPVwiMjRcIiBoZWlnaHQ9XCIyNFwiIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHN0cm9rZT1cImN1cnJlbnRDb2xvclwiIHN0cm9rZS13aWR0aD1cIjJcIiBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIiBjbGFzcz1cInN2Zy1pY29uIGx1Y2lkZS1xdW90ZVwiPjxwYXRoIGQ9XCJNMyAyMWMzIDAgNy0xIDctOFY1YzAtMS4yNS0uNzU2LTIuMDE3LTItMkg0Yy0xLjI1IDAtMiAuNzUtMiAxLjk3MlYxMWMwIDEuMjUuNzUgMiAyIDIgMSAwIDEgMCAxIDF2MWMwIDEtMSAyLTIgMnMtMSAuMDA4LTEgMS4wMzFWMjBjMCAxIDAgMSAxIDF6XCI+PC9wYXRoPjxwYXRoIGQ9XCJNMTUgMjFjMyAwIDctMSA3LThWNWMwLTEuMjUtLjc1Ny0yLjAxNy0yLTJoLTRjLTEuMjUgMC0yIC43NS0yIDEuOTcyVjExYzAgMS4yNS43NSAyIDIgMmguNzVjMCAyLjI1LjI1IDQtMi43NSA0djNjMCAxIDAgMSAxIDF6XCI+PC9wYXRoPjwvc3ZnPmBcbi8qXG5ub3RlLFxuYWJzdHJhY3QsIHN1bW1hcnksIHRsZHJcbmluZm9cbnRvZG9cbnRpcFxuaGludCwgaW1wb3J0YW50XG5zdWNjZXNzLCBjaGVjaywgZG9uZVxucXVlc3Rpb24sIGhlbHAsIGZhcVxud2FybmluZywgY2F1dGlvbiwgYXR0ZW50aW9uXG5mYWlsdXJlLCBmYWlsLCBtaXNzaW5nXG5kYW5nZXIsIGVycm9yXG5idWdcbmV4YW1wbGVcbnF1b3RlLCBjaXRlXG4qL1xuXG50eXBlIENhbGxvdXRJbmZvID0ge2ljb246IHN0cmluZywgc3R5bGU6IHN0cmluZ31cblxuY29uc3QgQ2FsbG91dFR5cGVzID0gbmV3IE1hcDxzdHJpbmcsIENhbGxvdXRJbmZvPihPYmplY3QuZW50cmllcyh7XG4gICAgbm90ZToge1xuICAgICAgICBpY29uOiBpY29uX25vdGUsXG4gICAgICAgIHN0eWxlOiAnbm90ZS1jYWxsb3V0LW5vdGUnLFxuICAgIH0sXG4gICAgYWJzdHJhY3Q6IHtcbiAgICAgICAgaWNvbjogaWNvbl9hYnN0cmFjdCxcbiAgICAgICAgc3R5bGU6ICdub3RlLWNhbGxvdXQtYWJzdHJhY3QnLFxuICAgIH0sXG4gICAgc3VtbWFyeToge1xuICAgICAgICBpY29uOiBpY29uX2Fic3RyYWN0LFxuICAgICAgICBzdHlsZTogJ25vdGUtY2FsbG91dC1hYnN0cmFjdCcsXG4gICAgfSxcbiAgICB0bGRyOiB7XG4gICAgICAgIGljb246IGljb25fYWJzdHJhY3QsXG4gICAgICAgIHN0eWxlOiAnbm90ZS1jYWxsb3V0LWFic3RyYWN0JyxcbiAgICB9LFxuICAgIGluZm86IHtcbiAgICAgICAgaWNvbjogaWNvbl9pbmZvLFxuICAgICAgICBzdHlsZTogJ25vdGUtY2FsbG91dC1ub3RlJyxcbiAgICB9LFxuICAgIHRvZG86IHtcbiAgICAgICAgaWNvbjogaWNvbl90b2RvLFxuICAgICAgICBzdHlsZTogJ25vdGUtY2FsbG91dC1ub3RlJyxcbiAgICB9LFxuICAgIHRpcDoge1xuICAgICAgICBpY29uOiBpY29uX3RpcCxcbiAgICAgICAgc3R5bGU6ICdub3RlLWNhbGxvdXQtYWJzdHJhY3QnLFxuICAgIH0sXG4gICAgaGludDoge1xuICAgICAgICBpY29uOiBpY29uX3RpcCxcbiAgICAgICAgc3R5bGU6ICdub3RlLWNhbGxvdXQtYWJzdHJhY3QnLFxuICAgIH0sXG4gICAgaW1wb3J0YW50OiB7XG4gICAgICAgIGljb246IGljb25fdGlwLFxuICAgICAgICBzdHlsZTogJ25vdGUtY2FsbG91dC1hYnN0cmFjdCcsXG4gICAgfSxcbiAgICBzdWNjZXNzOiB7XG4gICAgICAgIGljb246IGljb25fc3VjY2VzcyxcbiAgICAgICAgc3R5bGU6ICdub3RlLWNhbGxvdXQtc3VjY2VzcycsXG4gICAgfSxcbiAgICBjaGVjazoge1xuICAgICAgICBpY29uOiBpY29uX3N1Y2Nlc3MsXG4gICAgICAgIHN0eWxlOiAnbm90ZS1jYWxsb3V0LXN1Y2Nlc3MnLFxuICAgIH0sXG4gICAgZG9uZToge1xuICAgICAgICBpY29uOiBpY29uX3N1Y2Nlc3MsXG4gICAgICAgIHN0eWxlOiAnbm90ZS1jYWxsb3V0LXN1Y2Nlc3MnLFxuICAgIH0sXG4gICAgcXVlc3Rpb246IHtcbiAgICAgICAgaWNvbjogaWNvbl9xdWVzdGlvbixcbiAgICAgICAgc3R5bGU6ICdub3RlLWNhbGxvdXQtcXVlc3Rpb24nLFxuICAgIH0sXG4gICAgaGVscDoge1xuICAgICAgICBpY29uOiBpY29uX3F1ZXN0aW9uLFxuICAgICAgICBzdHlsZTogJ25vdGUtY2FsbG91dC1xdWVzdGlvbicsXG4gICAgfSxcbiAgICBmYXE6IHtcbiAgICAgICAgaWNvbjogaWNvbl9xdWVzdGlvbixcbiAgICAgICAgc3R5bGU6ICdub3RlLWNhbGxvdXQtcXVlc3Rpb24nLFxuICAgIH0sXG4gICAgd2FybmluZzoge1xuICAgICAgICBpY29uOiBpY29uX3dhcm5pbmcsXG4gICAgICAgIHN0eWxlOiAnbm90ZS1jYWxsb3V0LXF1ZXN0aW9uJyxcbiAgICB9LFxuICAgIGNhdXRpb246IHtcbiAgICAgICAgaWNvbjogaWNvbl93YXJuaW5nLFxuICAgICAgICBzdHlsZTogJ25vdGUtY2FsbG91dC1xdWVzdGlvbicsXG4gICAgfSxcbiAgICBhdHRlbnRpb246IHtcbiAgICAgICAgaWNvbjogaWNvbl93YXJuaW5nLFxuICAgICAgICBzdHlsZTogJ25vdGUtY2FsbG91dC1xdWVzdGlvbicsXG4gICAgfSxcbiAgICBmYWlsdXJlOiB7XG4gICAgICAgIGljb246IGljb25fZmFpbHVyZSxcbiAgICAgICAgc3R5bGU6ICdub3RlLWNhbGxvdXQtZmFpbHVyZScsXG4gICAgfSxcbiAgICBmYWlsOiB7XG4gICAgICAgIGljb246IGljb25fZmFpbHVyZSxcbiAgICAgICAgc3R5bGU6ICdub3RlLWNhbGxvdXQtZmFpbHVyZScsXG4gICAgfSxcbiAgICBtaXNzaW5nOiB7XG4gICAgICAgIGljb246IGljb25fZmFpbHVyZSxcbiAgICAgICAgc3R5bGU6ICdub3RlLWNhbGxvdXQtZmFpbHVyZScsXG4gICAgfSxcbiAgICBkYW5nZXI6IHtcbiAgICAgICAgaWNvbjogaWNvbl9kYW5nZXIsXG4gICAgICAgIHN0eWxlOiAnbm90ZS1jYWxsb3V0LWZhaWx1cmUnLFxuICAgIH0sXG4gICAgZXJyb3I6IHtcbiAgICAgICAgaWNvbjogaWNvbl9kYW5nZXIsXG4gICAgICAgIHN0eWxlOiAnbm90ZS1jYWxsb3V0LWZhaWx1cmUnLFxuICAgIH0sXG4gICAgYnVnOiB7XG4gICAgICAgIGljb246IGljb25fYnVnLFxuICAgICAgICBzdHlsZTogJ25vdGUtY2FsbG91dC1mYWlsdXJlJyxcbiAgICB9LFxuICAgIGV4YW1wbGU6IHtcbiAgICAgICAgaWNvbjogaWNvbl9leGFtcGxlLFxuICAgICAgICBzdHlsZTogJ25vdGUtY2FsbG91dC1leGFtcGxlJyxcbiAgICB9LFxuICAgIHF1b3RlOiB7XG4gICAgICAgIGljb246IGljb25fcXVvdGUsXG4gICAgICAgIHN0eWxlOiAnbm90ZS1jYWxsb3V0LXF1b3RlJyxcbiAgICB9LFxuICAgIGNpdGU6IHtcbiAgICAgICAgaWNvbjogaWNvbl9xdW90ZSxcbiAgICAgICAgc3R5bGU6ICdub3RlLWNhbGxvdXQtcXVvdGUnLFxuICAgIH1cbn0pKTtcblxuZnVuY3Rpb24gR2V0Q2FsbG91dCh0eXBlOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gQ2FsbG91dFR5cGVzLmdldCh0eXBlKTtcbn07XG5cbmZ1bmN0aW9uIG1hdGNoQ2FsbG91dHModGV4dDpzdHJpbmcpIHtcbiAgICBjb25zdCByZWdleCA9IC9cXFtcXCEoLio/KVxcXS9nO1xuXHRsZXQgbTtcblx0aWYoIG0gPSByZWdleC5leGVjKHRleHQpKSB7XG5cdCAgICByZXR1cm4gbVsxXTtcblx0fVxuXHRyZXR1cm4gXCJcIjtcbn1cblxuZnVuY3Rpb24gR2V0Q2FsbG91dFRpdGxlKGNhbGxvdXQ6c3RyaW5nLCB0ZXh0OnN0cmluZykge1xuXHRsZXQgdGl0bGUgPSBjYWxsb3V0LmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgY2FsbG91dC5zbGljZSgxKS50b0xvd2VyQ2FzZSgpO1xuXHRsZXQgc3RhcnQgPSB0ZXh0LmluZGV4T2YoJ10nKSArIDE7XG5cdGlmICh0ZXh0LmluZGV4T2YoJ10tJykgPiAwIHx8IHRleHQuaW5kZXhPZignXSsnKSA+IDApIHtcblx0XHRzdGFydCA9IHN0YXJ0ICsgMTtcblx0fVxuXHRsZXQgZW5kID0gdGV4dC5pbmRleE9mKCdcXG4nKTtcblx0aWYgKGVuZCA9PT0gLTEpICBlbmQgPSB0ZXh0Lmxlbmd0aDtcblx0aWYgKHN0YXJ0ID49IGVuZCkgIHJldHVybiB0aXRsZTtcblx0Y29uc3QgY3VzdG9tVGl0bGUgPSB0ZXh0LnNsaWNlKHN0YXJ0LCBlbmQpLnRyaW0oKTtcblx0aWYgKGN1c3RvbVRpdGxlICE9PSAnJykge1xuXHRcdHRpdGxlID0gY3VzdG9tVGl0bGU7XG5cdH1cblx0cmV0dXJuIHRpdGxlO1xufVxuXG5leHBvcnQgY2xhc3MgQ2FsbG91dFJlbmRlcmVyIGV4dGVuZHMgRXh0ZW5zaW9uIHtcbiAgICBtYXRjaGVkKHRleHQ6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gbWF0Y2hDYWxsb3V0cyh0ZXh0KSAhPSAnJztcbiAgICB9XG5cbiAgICBhc3luYyByZW5kZXJlcih0b2tlbjogVG9rZW5zLkJsb2NrcXVvdGUpIHtcbiAgICAgICAgbGV0IGNhbGxvdXQgPSBtYXRjaENhbGxvdXRzKHRva2VuLnRleHQpO1xuICAgICAgICBpZiAoY2FsbG91dCA9PSAnJykge1xuICAgICAgICAgICAgY29uc3QgYm9keSA9IHRoaXMubWFya2VkLnBhcnNlcih0b2tlbi50b2tlbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGA8YmxvY2txdW90ZT4ke2JvZHl9PC9ibG9ja3F1b3RlPmA7O1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIGNvbnN0IHRpdGxlID0gR2V0Q2FsbG91dFRpdGxlKGNhbGxvdXQsIHRva2VuLnRleHQpO1xuICAgICAgICBjb25zdCBpbmRleCA9IHRva2VuLnRleHQuaW5kZXhPZignXFxuJyk7XG4gICAgICAgIGxldCBib2R5ID0gJyc7XG4gICAgICAgIGlmIChpbmRleCA+IDApIHtcbiAgICAgICAgICAgIHRva2VuLnRleHQgPSB0b2tlbi50ZXh0LnNsaWNlKGluZGV4KzEpXG4gICAgICAgICAgICBib2R5ID0gYXdhaXQgdGhpcy5tYXJrZWQucGFyc2UodG9rZW4udGV4dCk7XG4gICAgICAgIH0gXG5cblxuXG4gICAgICAgIGxldCBpbmZvID0gR2V0Q2FsbG91dChjYWxsb3V0LnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICBpZiAoaW5mbyA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zdCBzdmcgPSBhd2FpdCB0aGlzLmFzc2V0c01hbmFnZXIubG9hZEljb24oY2FsbG91dCk7XG4gICAgICAgICAgICBpZiAoc3ZnKSB7XG4gICAgICAgICAgICAgICAgaW5mbyA9IHtpY29uOiBzdmcsIHN0eWxlOiAnbm90ZS1jYWxsb3V0LWN1c3RvbSd9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbmZvID0gR2V0Q2FsbG91dCgnbm90ZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgXG4gICAgICAgIHJldHVybiBgPHNlY3Rpb24gY2xhc3M9XCJub3RlLWNhbGxvdXQgJHtpbmZvPy5zdHlsZX1cIj48c2VjdGlvbiBjbGFzcz1cIm5vdGUtY2FsbG91dC10aXRsZS13cmFwXCI+PHNwYW4gY2xhc3M9XCJub3RlLWNhbGxvdXQtaWNvblwiPiR7aW5mbz8uaWNvbn08L3NwYW4+PHNwYW4gY2xhc3M9XCJub3RlLWNhbGxvdXQtdGl0bGVcIj4ke3RpdGxlfTxzcGFuPjwvc2VjdGlvbj48c2VjdGlvbiBjbGFzcz1cIm5vdGUtY2FsbG91dC1jb250ZW50XCI+JHtib2R5fTwvc2VjdGlvbj48L3NlY3Rpb24+YDtcbiAgICAgfVxuXG4gICAgbWFya2VkRXh0ZW5zaW9uKCk6IE1hcmtlZEV4dGVuc2lvbiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBhc3luYzogdHJ1ZSxcbiAgICAgICAgICAgIHdhbGtUb2tlbnM6IGFzeW5jICh0b2tlbjogVG9rZW5zLkdlbmVyaWMpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodG9rZW4udHlwZSAhPT0gJ2Jsb2NrcXVvdGUnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdG9rZW4uaHRtbCA9IGF3YWl0IHRoaXMucmVuZGVyZXIodG9rZW4gYXMgVG9rZW5zLkJsb2NrcXVvdGUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4dGVuc2lvbnM6W3tcbiAgICAgICAgICAgICAgICBuYW1lOiAnYmxvY2txdW90ZScsXG4gICAgICAgICAgICAgICAgbGV2ZWw6ICdibG9jaycsXG4gICAgICAgICAgICAgICAgcmVuZGVyZXI6ICh0b2tlbjogVG9rZW5zLkdlbmVyaWMpPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdG9rZW4uaHRtbDtcbiAgICAgICAgICAgICAgICB9LCBcbiAgICAgICAgICAgIH1dXG4gICAgICAgIH1cbiAgICB9XG59Il19