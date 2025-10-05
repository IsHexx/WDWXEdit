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
export class LinkRenderer extends Extension {
    constructor() {
        super(...arguments);
        this.allLinks = [];
    }
    async prepare() {
        this.allLinks = [];
    }
    async postprocess(html) {
        if (this.settings.linkStyle !== 'footnote'
            || this.allLinks.length == 0) {
            return html;
        }
        const links = this.allLinks.map((href, i) => {
            return `<li>${href}&nbsp;↩</li>`;
        });
        return `${html}<seciton class="footnotes"><hr><ol>${links.join('')}</ol></section>`;
    }
    markedExtension() {
        return {
            extensions: [{
                    name: 'link',
                    level: 'inline',
                    renderer: (token) => {
                        if (token.href.startsWith('mailto:')) {
                            return token.text;
                        }
                        if (token.text.indexOf(token.href) === 0
                            || (token.href.indexOf('https://mp.weixin.qq.com/mp') === 0)
                            || (token.href.indexOf('https://mp.weixin.qq.com/s') === 0)) {
                            return `<a href="${token.href}">${token.text}</a>`;
                        }
                        this.allLinks.push(token.href);
                        if (this.settings.linkStyle == 'footnote') {
                            return `<a>${token.text}<sup>[${this.allLinks.length}]</sup></a>`;
                        }
                        else {
                            return `<a>${token.text}[${token.href}]</a>`;
                        }
                    }
                }]
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxpbmsudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7OztHQVlHO0FBR0gsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUV4QyxNQUFNLE9BQU8sWUFBYSxTQUFRLFNBQVM7SUFBM0M7O1FBQ0ksYUFBUSxHQUFZLEVBQUUsQ0FBQztJQTBDM0IsQ0FBQztJQXpDRyxLQUFLLENBQUMsT0FBTztRQUNWLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLENBQUM7SUFFRCxLQUFLLENBQUMsV0FBVyxDQUFDLElBQVk7UUFDMUIsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsS0FBSyxVQUFVO2VBQ25DLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtZQUM5QixPQUFPLElBQUksQ0FBQztTQUNmO1FBRUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDeEMsT0FBTyxPQUFPLElBQUksY0FBYyxDQUFDO1FBQ3JDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsT0FBTyxHQUFHLElBQUksc0NBQXNDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGlCQUFpQixDQUFDO0lBQ3hGLENBQUM7SUFFRCxlQUFlO1FBQ1gsT0FBTztZQUNILFVBQVUsRUFBRSxDQUFDO29CQUNULElBQUksRUFBRSxNQUFNO29CQUNaLEtBQUssRUFBRSxRQUFRO29CQUNmLFFBQVEsRUFBRSxDQUFDLEtBQWtCLEVBQUUsRUFBRTt3QkFDN0IsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsRUFBRTs0QkFDbEMsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDO3lCQUNyQjt3QkFDRCxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDOytCQUNqQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDZCQUE2QixDQUFDLEtBQUssQ0FBQyxDQUFDOytCQUN6RCxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDRCQUE0QixDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7NEJBQzdELE9BQU8sWUFBWSxLQUFLLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQzt5QkFDdEQ7d0JBQ0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUMvQixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxJQUFJLFVBQVUsRUFBRTs0QkFDdkMsT0FBTyxNQUFNLEtBQUssQ0FBQyxJQUFJLFNBQVMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLGFBQWEsQ0FBQzt5QkFDckU7NkJBQ0k7NEJBQ0QsT0FBTyxNQUFNLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLElBQUksT0FBTyxDQUFDO3lCQUNoRDtvQkFDTCxDQUFDO2lCQUNKLENBQUM7U0FDTCxDQUFBO0lBQ0wsQ0FBQztDQUNKIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAoYykgMjAyNC0yMDI1IElzSGV4eFxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvZnR3YXJlIGlzIHByb3ByaWV0YXJ5IGFuZCBjb25maWRlbnRpYWwuIE5vIHBhcnQgb2YgdGhpcyBzb2Z0d2FyZVxuICogbWF5IGJlIHJlcHJvZHVjZWQsIGRpc3RyaWJ1dGVkLCBvciB0cmFuc21pdHRlZCBpbiBhbnkgZm9ybSBvciBieSBhbnkgbWVhbnMsXG4gKiBpbmNsdWRpbmcgcGhvdG9jb3B5aW5nLCByZWNvcmRpbmcsIG9yIG90aGVyIGVsZWN0cm9uaWMgb3IgbWVjaGFuaWNhbCBtZXRob2RzLFxuICogd2l0aG91dCB0aGUgcHJpb3Igd3JpdHRlbiBwZXJtaXNzaW9uIG9mIHRoZSBhdXRob3IsIGV4Y2VwdCBpbiB0aGUgY2FzZSBvZlxuICogYnJpZWYgcXVvdGF0aW9ucyBlbWJvZGllZCBpbiBjcml0aWNhbCByZXZpZXdzIGFuZCBjZXJ0YWluIG90aGVyIG5vbmNvbW1lcmNpYWxcbiAqIHVzZXMgcGVybWl0dGVkIGJ5IGNvcHlyaWdodCBsYXcuXG4gKlxuICogRm9yIHBlcm1pc3Npb24gcmVxdWVzdHMsIGNvbnRhY3Q6IElzSGV4eFxuICovXG5cbmltcG9ydCB7IFRva2VucywgTWFya2VkRXh0ZW5zaW9uIH0gZnJvbSBcIm1hcmtlZFwiO1xuaW1wb3J0IHsgRXh0ZW5zaW9uIH0gZnJvbSBcIi4vZXh0ZW5zaW9uXCI7XG5cbmV4cG9ydCBjbGFzcyBMaW5rUmVuZGVyZXIgZXh0ZW5kcyBFeHRlbnNpb24ge1xuICAgIGFsbExpbmtzOnN0cmluZ1tdID0gW107XG4gICAgYXN5bmMgcHJlcGFyZSgpIHtcbiAgICAgICB0aGlzLmFsbExpbmtzID0gW107XG4gICAgfVxuXG4gICAgYXN5bmMgcG9zdHByb2Nlc3MoaHRtbDogc3RyaW5nKSB7XG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmxpbmtTdHlsZSAhPT0gJ2Zvb3Rub3RlJ1xuICAgICAgICAgICAgfHwgdGhpcy5hbGxMaW5rcy5sZW5ndGggPT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGh0bWw7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGNvbnN0IGxpbmtzID0gdGhpcy5hbGxMaW5rcy5tYXAoKGhyZWYsIGkpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBgPGxpPiR7aHJlZn0mbmJzcDvihqk8L2xpPmA7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gYCR7aHRtbH08c2VjaXRvbiBjbGFzcz1cImZvb3Rub3Rlc1wiPjxocj48b2w+JHtsaW5rcy5qb2luKCcnKX08L29sPjwvc2VjdGlvbj5gO1xuICAgIH1cblxuICAgIG1hcmtlZEV4dGVuc2lvbigpOiBNYXJrZWRFeHRlbnNpb24ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZXh0ZW5zaW9uczogW3tcbiAgICAgICAgICAgICAgICBuYW1lOiAnbGluaycsXG4gICAgICAgICAgICAgICAgbGV2ZWw6ICdpbmxpbmUnLFxuICAgICAgICAgICAgICAgIHJlbmRlcmVyOiAodG9rZW46IFRva2Vucy5MaW5rKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0b2tlbi5ocmVmLnN0YXJ0c1dpdGgoJ21haWx0bzonKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuLnRleHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRva2VuLnRleHQuaW5kZXhPZih0b2tlbi5ocmVmKSA9PT0gMFxuICAgICAgICAgICAgICAgICAgICAgICAgfHwgKHRva2VuLmhyZWYuaW5kZXhPZignaHR0cHM6Ly9tcC53ZWl4aW4ucXEuY29tL21wJykgPT09IDApXG4gICAgICAgICAgICAgICAgICAgICAgICB8fCAodG9rZW4uaHJlZi5pbmRleE9mKCdodHRwczovL21wLndlaXhpbi5xcS5jb20vcycpID09PSAwKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGA8YSBocmVmPVwiJHt0b2tlbi5ocmVmfVwiPiR7dG9rZW4udGV4dH08L2E+YDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFsbExpbmtzLnB1c2godG9rZW4uaHJlZik7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnNldHRpbmdzLmxpbmtTdHlsZSA9PSAnZm9vdG5vdGUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYDxhPiR7dG9rZW4udGV4dH08c3VwPlske3RoaXMuYWxsTGlua3MubGVuZ3RofV08L3N1cD48L2E+YDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBgPGE+JHt0b2tlbi50ZXh0fVske3Rva2VuLmhyZWZ9XTwvYT5gO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfV1cbiAgICAgICAgfVxuICAgIH1cbn0iXX0=