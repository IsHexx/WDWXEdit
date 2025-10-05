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
export class EmptyLineRenderer extends Extension {
    markedExtension() {
        return {
            extensions: [{
                    name: 'emptyline',
                    level: 'block',
                    tokenizer(src) {
                        const match = /^\n\n+/.exec(src);
                        if (match) {
                            console.log('mathced src: ', src);
                            return {
                                type: "emptyline",
                                raw: match[0],
                            };
                        }
                    },
                    renderer: (token) => {
                        return '<p><br></p>'.repeat(token.raw.length - 1);
                    },
                }]
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1wdHktbGluZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVtcHR5LWxpbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7OztHQVlHO0FBR0gsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUV4QyxNQUFNLE9BQU8saUJBQWtCLFNBQVEsU0FBUztJQUM5QyxlQUFlO1FBQ2IsT0FBTztZQUNMLFVBQVUsRUFBRSxDQUFDO29CQUNYLElBQUksRUFBRSxXQUFXO29CQUNqQixLQUFLLEVBQUUsT0FBTztvQkFDZCxTQUFTLENBQUMsR0FBVzt3QkFDbkIsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzt3QkFDakMsSUFBSSxLQUFLLEVBQUU7NEJBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsR0FBRyxDQUFDLENBQUE7NEJBQ2pDLE9BQU87Z0NBQ0wsSUFBSSxFQUFFLFdBQVc7Z0NBQ2pCLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDOzZCQUNkLENBQUM7eUJBQ0g7b0JBQ0gsQ0FBQztvQkFDRCxRQUFRLEVBQUUsQ0FBQyxLQUFxQixFQUFFLEVBQUU7d0JBQ2xDLE9BQU8sYUFBYSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDcEQsQ0FBQztpQkFDRixDQUFDO1NBQ0gsQ0FBQTtJQUNILENBQUM7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMjQtMjAyNSBJc0hleHhcbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb2Z0d2FyZSBpcyBwcm9wcmlldGFyeSBhbmQgY29uZmlkZW50aWFsLiBObyBwYXJ0IG9mIHRoaXMgc29mdHdhcmVcbiAqIG1heSBiZSByZXByb2R1Y2VkLCBkaXN0cmlidXRlZCwgb3IgdHJhbnNtaXR0ZWQgaW4gYW55IGZvcm0gb3IgYnkgYW55IG1lYW5zLFxuICogaW5jbHVkaW5nIHBob3RvY29weWluZywgcmVjb3JkaW5nLCBvciBvdGhlciBlbGVjdHJvbmljIG9yIG1lY2hhbmljYWwgbWV0aG9kcyxcbiAqIHdpdGhvdXQgdGhlIHByaW9yIHdyaXR0ZW4gcGVybWlzc2lvbiBvZiB0aGUgYXV0aG9yLCBleGNlcHQgaW4gdGhlIGNhc2Ugb2ZcbiAqIGJyaWVmIHF1b3RhdGlvbnMgZW1ib2RpZWQgaW4gY3JpdGljYWwgcmV2aWV3cyBhbmQgY2VydGFpbiBvdGhlciBub25jb21tZXJjaWFsXG4gKiB1c2VzIHBlcm1pdHRlZCBieSBjb3B5cmlnaHQgbGF3LlxuICpcbiAqIEZvciBwZXJtaXNzaW9uIHJlcXVlc3RzLCBjb250YWN0OiBJc0hleHhcbiAqL1xuXG5pbXBvcnQgeyBUb2tlbnMsIE1hcmtlZEV4dGVuc2lvbiB9IGZyb20gXCJtYXJrZWRcIjtcbmltcG9ydCB7IEV4dGVuc2lvbiB9IGZyb20gXCIuL2V4dGVuc2lvblwiO1xuXG5leHBvcnQgY2xhc3MgRW1wdHlMaW5lUmVuZGVyZXIgZXh0ZW5kcyBFeHRlbnNpb24ge1xuICBtYXJrZWRFeHRlbnNpb24oKTogTWFya2VkRXh0ZW5zaW9uIHtcbiAgICByZXR1cm4ge1xuICAgICAgZXh0ZW5zaW9uczogW3tcbiAgICAgICAgbmFtZTogJ2VtcHR5bGluZScsXG4gICAgICAgIGxldmVsOiAnYmxvY2snLFxuICAgICAgICB0b2tlbml6ZXIoc3JjOiBzdHJpbmcpIHtcbiAgICAgICAgICBjb25zdCBtYXRjaCA9IC9eXFxuXFxuKy8uZXhlYyhzcmMpO1xuICAgICAgICAgIGlmIChtYXRjaCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ21hdGhjZWQgc3JjOiAnLCBzcmMpXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB0eXBlOiBcImVtcHR5bGluZVwiLFxuICAgICAgICAgICAgICByYXc6IG1hdGNoWzBdLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlbmRlcmVyOiAodG9rZW46IFRva2Vucy5HZW5lcmljKSA9PiB7XG4gICAgICAgICAgcmV0dXJuICc8cD48YnI+PC9wPicucmVwZWF0KHRva2VuLnJhdy5sZW5ndGggLSAxKTtcbiAgICAgICAgfSxcbiAgICAgIH1dXG4gICAgfVxuICB9XG59XG4iXX0=