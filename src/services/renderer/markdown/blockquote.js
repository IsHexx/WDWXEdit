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
import { CalloutRenderer } from "./callouts";
export class Blockquote extends Extension {
    constructor(app, settings, assetsManager, callback) {
        super(app, settings, assetsManager, callback);
        this.callout = new CalloutRenderer(app, settings, assetsManager, callback);
    }
    async prepare() {
        if (!this.marked) {
            console.error("marked is not ready");
            return;
        }
        if (this.callout)
            this.callout.marked = this.marked;
        return;
    }
    async renderer(token) {
        if (this.callout.matched(token.text)) {
            return await this.callout.renderer(token);
        }
        const body = await this.marked.parse(token.text);
        return `<blockquote>${body}</blockquote>`;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmxvY2txdW90ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImJsb2NrcXVvdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7OztHQVlHO0FBR0gsT0FBTyxFQUFFLFNBQVMsRUFBc0IsTUFBTSxhQUFhLENBQUM7QUFLNUQsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUU3QyxNQUFNLE9BQU8sVUFBVyxTQUFRLFNBQVM7SUFHdkMsWUFBWSxHQUFRLEVBQUUsUUFBb0IsRUFBRSxhQUE0QixFQUFFLFFBQTRCO1FBQ3BHLEtBQUssQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksZUFBZSxDQUFDLEdBQUcsRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzdFLENBQUM7SUFFRCxLQUFLLENBQUMsT0FBTztRQUNYLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2hCLE9BQU8sQ0FBQyxLQUFLLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUNyQyxPQUFPO1NBQ1I7UUFDRCxJQUFJLElBQUksQ0FBQyxPQUFPO1lBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUNwRCxPQUFPO0lBQ1QsQ0FBQztJQUVELEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBd0I7UUFDckMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDcEMsT0FBTyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzNDO1FBR0QsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDakQsT0FBTyxlQUFlLElBQUksZUFBZSxDQUFDO0lBQzVDLENBQUM7SUFFRCxlQUFlO1FBQ2IsT0FBTztZQUNMLEtBQUssRUFBRSxJQUFJO1lBQ1gsVUFBVSxFQUFFLEtBQUssRUFBRSxLQUFxQixFQUFFLEVBQUU7Z0JBQzFDLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxZQUFZLEVBQUU7b0JBQy9CLE9BQU87aUJBQ1I7Z0JBQ0QsS0FBSyxDQUFDLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBMEIsQ0FBQyxDQUFDO1lBQy9ELENBQUM7WUFDRCxVQUFVLEVBQUUsQ0FBQztvQkFDWCxJQUFJLEVBQUUsWUFBWTtvQkFDbEIsS0FBSyxFQUFFLE9BQU87b0JBQ2QsUUFBUSxFQUFFLENBQUMsS0FBcUIsRUFBRSxFQUFFO3dCQUNsQyxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUM7b0JBQ3BCLENBQUM7aUJBQ0YsQ0FBQztTQUNILENBQUE7SUFDSCxDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IChjKSAyMDI0LTIwMjUgSXNIZXh4XG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc29mdHdhcmUgaXMgcHJvcHJpZXRhcnkgYW5kIGNvbmZpZGVudGlhbC4gTm8gcGFydCBvZiB0aGlzIHNvZnR3YXJlXG4gKiBtYXkgYmUgcmVwcm9kdWNlZCwgZGlzdHJpYnV0ZWQsIG9yIHRyYW5zbWl0dGVkIGluIGFueSBmb3JtIG9yIGJ5IGFueSBtZWFucyxcbiAqIGluY2x1ZGluZyBwaG90b2NvcHlpbmcsIHJlY29yZGluZywgb3Igb3RoZXIgZWxlY3Ryb25pYyBvciBtZWNoYW5pY2FsIG1ldGhvZHMsXG4gKiB3aXRob3V0IHRoZSBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24gb2YgdGhlIGF1dGhvciwgZXhjZXB0IGluIHRoZSBjYXNlIG9mXG4gKiBicmllZiBxdW90YXRpb25zIGVtYm9kaWVkIGluIGNyaXRpY2FsIHJldmlld3MgYW5kIGNlcnRhaW4gb3RoZXIgbm9uY29tbWVyY2lhbFxuICogdXNlcyBwZXJtaXR0ZWQgYnkgY29weXJpZ2h0IGxhdy5cbiAqXG4gKiBGb3IgcGVybWlzc2lvbiByZXF1ZXN0cywgY29udGFjdDogSXNIZXh4XG4gKi9cblxuaW1wb3J0IHsgVG9rZW5zLCBNYXJrZWRFeHRlbnNpb24gfSBmcm9tIFwibWFya2VkXCI7XG5pbXBvcnQgeyBFeHRlbnNpb24sIE1EUmVuZGVyZXJDYWxsYmFjayB9IGZyb20gXCIuL2V4dGVuc2lvblwiO1xuLy8g5pu05pawaW1wb3J06Lev5b6EXG5pbXBvcnQgeyBXeFNldHRpbmdzIH0gZnJvbSBcIi4uLy4uLy4uL2NvcmUvc2V0dGluZ3NcIjtcbmltcG9ydCB7IEFwcCwgVmF1bHQgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCBBc3NldHNNYW5hZ2VyIGZyb20gXCIuLi8uLi8uLi9jb3JlL2Fzc2V0c1wiO1xuaW1wb3J0IHsgQ2FsbG91dFJlbmRlcmVyIH0gZnJvbSBcIi4vY2FsbG91dHNcIjtcblxuZXhwb3J0IGNsYXNzIEJsb2NrcXVvdGUgZXh0ZW5kcyBFeHRlbnNpb24ge1xuICBjYWxsb3V0OiBDYWxsb3V0UmVuZGVyZXI7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHNldHRpbmdzOiBXeFNldHRpbmdzLCBhc3NldHNNYW5hZ2VyOiBBc3NldHNNYW5hZ2VyLCBjYWxsYmFjazogTURSZW5kZXJlckNhbGxiYWNrKSB7XG4gICAgc3VwZXIoYXBwLCBzZXR0aW5ncywgYXNzZXRzTWFuYWdlciwgY2FsbGJhY2spO1xuICAgIHRoaXMuY2FsbG91dCA9IG5ldyBDYWxsb3V0UmVuZGVyZXIoYXBwLCBzZXR0aW5ncywgYXNzZXRzTWFuYWdlciwgY2FsbGJhY2spO1xuICB9XG5cbiAgYXN5bmMgcHJlcGFyZSgpIHsgXG4gICAgaWYgKCF0aGlzLm1hcmtlZCkge1xuICAgICAgY29uc29sZS5lcnJvcihcIm1hcmtlZCBpcyBub3QgcmVhZHlcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLmNhbGxvdXQpIHRoaXMuY2FsbG91dC5tYXJrZWQgPSB0aGlzLm1hcmtlZDtcbiAgICByZXR1cm47XG4gIH1cblxuICBhc3luYyByZW5kZXJlcih0b2tlbjogVG9rZW5zLkJsb2NrcXVvdGUpIHtcbiAgICBpZiAodGhpcy5jYWxsb3V0Lm1hdGNoZWQodG9rZW4udGV4dCkpIHtcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmNhbGxvdXQucmVuZGVyZXIodG9rZW4pO1xuICAgIH1cblxuXG4gICAgY29uc3QgYm9keSA9IGF3YWl0IHRoaXMubWFya2VkLnBhcnNlKHRva2VuLnRleHQpO1xuICAgIHJldHVybiBgPGJsb2NrcXVvdGU+JHtib2R5fTwvYmxvY2txdW90ZT5gO1xuICB9XG5cbiAgbWFya2VkRXh0ZW5zaW9uKCk6IE1hcmtlZEV4dGVuc2lvbiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGFzeW5jOiB0cnVlLFxuICAgICAgd2Fsa1Rva2VuczogYXN5bmMgKHRva2VuOiBUb2tlbnMuR2VuZXJpYykgPT4ge1xuICAgICAgICBpZiAodG9rZW4udHlwZSAhPT0gJ2Jsb2NrcXVvdGUnKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRva2VuLmh0bWwgPSBhd2FpdCB0aGlzLnJlbmRlcmVyKHRva2VuIGFzIFRva2Vucy5CbG9ja3F1b3RlKTtcbiAgICAgIH0sXG4gICAgICBleHRlbnNpb25zOiBbe1xuICAgICAgICBuYW1lOiAnYmxvY2txdW90ZScsXG4gICAgICAgIGxldmVsOiAnYmxvY2snLFxuICAgICAgICByZW5kZXJlcjogKHRva2VuOiBUb2tlbnMuR2VuZXJpYykgPT4ge1xuICAgICAgICAgIHJldHVybiB0b2tlbi5odG1sO1xuICAgICAgICB9LFxuICAgICAgfV1cbiAgICB9XG4gIH1cbn0iXX0=