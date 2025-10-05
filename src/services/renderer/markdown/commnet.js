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
const commentRegex = /^%%([\s\S]*?)%%/;
export class Comment extends Extension {
    markedExtension() {
        return {
            extensions: [{
                    name: 'CommentInline',
                    level: 'inline',
                    start(src) {
                        let index;
                        let indexSrc = src;
                        while (indexSrc) {
                            index = indexSrc.indexOf('%%');
                            if (index === -1)
                                return;
                            return index;
                        }
                    },
                    tokenizer(src) {
                        const match = src.match(commentRegex);
                        if (match) {
                            return {
                                type: 'CommentInline',
                                raw: match[0],
                                text: match[1],
                            };
                        }
                    },
                    renderer(token) {
                        return '';
                    }
                },
                {
                    name: 'CommentBlock',
                    level: 'block',
                    tokenizer(src) {
                        const match = src.match(commentRegex);
                        if (match) {
                            return {
                                type: 'CommentBlock',
                                raw: match[0],
                                text: match[1],
                            };
                        }
                    },
                    renderer(token) {
                        return '';
                    }
                },
            ]
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW5ldC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbW1uZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7OztHQVlHO0FBR0gsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUV4QyxNQUFNLFlBQVksR0FBRyxpQkFBaUIsQ0FBQztBQUV2QyxNQUFNLE9BQU8sT0FBUSxTQUFRLFNBQVM7SUFDcEMsZUFBZTtRQUNiLE9BQU87WUFDTCxVQUFVLEVBQUUsQ0FBQztvQkFDWCxJQUFJLEVBQUUsZUFBZTtvQkFDckIsS0FBSyxFQUFFLFFBQVE7b0JBQ2YsS0FBSyxDQUFDLEdBQVc7d0JBQ2YsSUFBSSxLQUFLLENBQUM7d0JBQ1YsSUFBSSxRQUFRLEdBQUcsR0FBRyxDQUFDO3dCQUVuQixPQUFPLFFBQVEsRUFBRTs0QkFDZixLQUFLLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzs0QkFDL0IsSUFBSSxLQUFLLEtBQUssQ0FBQyxDQUFDO2dDQUFFLE9BQU87NEJBQ3pCLE9BQU8sS0FBSyxDQUFDO3lCQUNkO29CQUNILENBQUM7b0JBQ0QsU0FBUyxDQUFDLEdBQVc7d0JBQ25CLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7d0JBQ3RDLElBQUksS0FBSyxFQUFFOzRCQUNULE9BQU87Z0NBQ0wsSUFBSSxFQUFFLGVBQWU7Z0NBQ3JCLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2dDQUNiLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDOzZCQUNmLENBQUM7eUJBQ0g7b0JBQ0gsQ0FBQztvQkFDRCxRQUFRLENBQUMsS0FBcUI7d0JBQzVCLE9BQU8sRUFBRSxDQUFDO29CQUNaLENBQUM7aUJBQ0Y7Z0JBQ0Q7b0JBQ0UsSUFBSSxFQUFFLGNBQWM7b0JBQ3BCLEtBQUssRUFBRSxPQUFPO29CQUNkLFNBQVMsQ0FBQyxHQUFXO3dCQUNuQixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO3dCQUN0QyxJQUFJLEtBQUssRUFBRTs0QkFDVCxPQUFPO2dDQUNMLElBQUksRUFBRSxjQUFjO2dDQUNwQixHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztnQ0FDYixJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQzs2QkFDZixDQUFDO3lCQUNIO29CQUNILENBQUM7b0JBQ0QsUUFBUSxDQUFDLEtBQXFCO3dCQUM1QixPQUFPLEVBQUUsQ0FBQztvQkFDWixDQUFDO2lCQUNGO2FBQ0E7U0FDRixDQUFBO0lBQ0gsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAoYykgMjAyNC0yMDI1IElzSGV4eFxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvZnR3YXJlIGlzIHByb3ByaWV0YXJ5IGFuZCBjb25maWRlbnRpYWwuIE5vIHBhcnQgb2YgdGhpcyBzb2Z0d2FyZVxuICogbWF5IGJlIHJlcHJvZHVjZWQsIGRpc3RyaWJ1dGVkLCBvciB0cmFuc21pdHRlZCBpbiBhbnkgZm9ybSBvciBieSBhbnkgbWVhbnMsXG4gKiBpbmNsdWRpbmcgcGhvdG9jb3B5aW5nLCByZWNvcmRpbmcsIG9yIG90aGVyIGVsZWN0cm9uaWMgb3IgbWVjaGFuaWNhbCBtZXRob2RzLFxuICogd2l0aG91dCB0aGUgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uIG9mIHRoZSBhdXRob3IsIGV4Y2VwdCBpbiB0aGUgY2FzZSBvZlxuICogYnJpZWYgcXVvdGF0aW9ucyBlbWJvZGllZCBpbiBjcml0aWNhbCByZXZpZXdzIGFuZCBjZXJ0YWluIG90aGVyIG5vbmNvbW1lcmNpYWxcbiAqIHVzZXMgcGVybWl0dGVkIGJ5IGNvcHlyaWdodCBsYXcuXG4gKlxuICogRm9yIHBlcm1pc3Npb24gcmVxdWVzdHMsIGNvbnRhY3Q6IElzSGV4eFxuICovXG5cbmltcG9ydCB7IFRva2VucywgTWFya2VkRXh0ZW5zaW9uIH0gZnJvbSBcIm1hcmtlZFwiO1xuaW1wb3J0IHsgRXh0ZW5zaW9uIH0gZnJvbSBcIi4vZXh0ZW5zaW9uXCI7XG5cbmNvbnN0IGNvbW1lbnRSZWdleCA9IC9eJSUoW1xcc1xcU10qPyklJS87XG5cbmV4cG9ydCBjbGFzcyBDb21tZW50IGV4dGVuZHMgRXh0ZW5zaW9uIHtcbiAgbWFya2VkRXh0ZW5zaW9uKCk6IE1hcmtlZEV4dGVuc2lvbiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGV4dGVuc2lvbnM6IFt7XG4gICAgICAgIG5hbWU6ICdDb21tZW50SW5saW5lJyxcbiAgICAgICAgbGV2ZWw6ICdpbmxpbmUnLFxuICAgICAgICBzdGFydChzcmM6IHN0cmluZykge1xuICAgICAgICAgIGxldCBpbmRleDtcbiAgICAgICAgICBsZXQgaW5kZXhTcmMgPSBzcmM7XG5cbiAgICAgICAgICB3aGlsZSAoaW5kZXhTcmMpIHtcbiAgICAgICAgICAgIGluZGV4ID0gaW5kZXhTcmMuaW5kZXhPZignJSUnKTtcbiAgICAgICAgICAgIGlmIChpbmRleCA9PT0gLTEpIHJldHVybjtcbiAgICAgICAgICAgIHJldHVybiBpbmRleDtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHRva2VuaXplcihzcmM6IHN0cmluZykge1xuICAgICAgICAgIGNvbnN0IG1hdGNoID0gc3JjLm1hdGNoKGNvbW1lbnRSZWdleCk7XG4gICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB0eXBlOiAnQ29tbWVudElubGluZScsXG4gICAgICAgICAgICAgIHJhdzogbWF0Y2hbMF0sXG4gICAgICAgICAgICAgIHRleHQ6IG1hdGNoWzFdLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlbmRlcmVyKHRva2VuOiBUb2tlbnMuR2VuZXJpYykge1xuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ0NvbW1lbnRCbG9jaycsXG4gICAgICAgIGxldmVsOiAnYmxvY2snLFxuICAgICAgICB0b2tlbml6ZXIoc3JjOiBzdHJpbmcpIHtcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IHNyYy5tYXRjaChjb21tZW50UmVnZXgpO1xuICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgdHlwZTogJ0NvbW1lbnRCbG9jaycsXG4gICAgICAgICAgICAgIHJhdzogbWF0Y2hbMF0sXG4gICAgICAgICAgICAgIHRleHQ6IG1hdGNoWzFdLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlbmRlcmVyKHRva2VuOiBUb2tlbnMuR2VuZXJpYykge1xuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIF1cbiAgICB9XG4gIH1cbn0iXX0=