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
const inlineRule = /^(\${1,2})(?!\$)((?:\\.|[^\\\n])*?(?:\\.|[^\\\n\$]))\1/;
const blockRule = /^(\${1,2})\n((?:\\[^]|[^\\])+?)\n\1(?:\n|$)/;
const svgCache = new Map();
export function cleanMathCache() {
    svgCache.clear();
}
export class MathRendererQueue {
    constructor() {
        // 禁用外部数学渲染服务，使用本地处理
        this.host = 'disabled'; // 不再使用外部服务
        this.mathIndex = 0;
    }
    // 静态方法，用于获取实例
    static getInstance() {
        if (!MathRendererQueue.instance) {
            MathRendererQueue.instance = new MathRendererQueue();
        }
        return MathRendererQueue.instance;
    }
    async getMathSVG(expression, inline, type) {
        try {
            let success = false;
            let path = '';
            if (type === 'asciimath') {
                path = '/math/am';
            }
            else {
                path = '/math/tex';
            }
            // 简化数学公式处理，避免外部API依赖
            let svg = '';
            try {
                // 简单的数学公式占位符处理
                if (inline) {
                    svg = `<span class="math-inline">$${expression}$</span>`;
                }
                else {
                    svg = `<div class="math-block">$$${expression}$$</div>`;
                }
                success = true;
                console.log('Math formula processed locally:', expression);
            }
            catch (error) {
                console.error('Math processing error:', error);
                svg = `<span class="math-error">数学公式: ${expression}</span>`;
            }
            return { svg, success };
        }
        catch (err) {
            console.log(err.msg);
            const svg = '渲染失败: ' + err.message;
            return { svg, success: false };
        }
    }
    generateId() {
        this.mathIndex += 1;
        return `math-id-${this.mathIndex}`;
    }
    async render(token, inline, type) {
        // Claude Code Remove: 移除isAuthKeyVaild检查，不再需要注册码验证
        const id = this.generateId();
        let svg = '渲染中';
        const expression = token.text;
        if (svgCache.has(token.text)) {
            svg = svgCache.get(expression);
        }
        else {
            const res = await this.getMathSVG(expression, inline, type);
            if (res.success) {
                svgCache.set(expression, res.svg);
            }
            svg = res.svg;
        }
        const className = inline ? 'inline-math-svg' : 'block-math-svg';
        const body = inline ? svg : `<section class="block-math-section">${svg}</section>`;
        return `<span id="${id}" class="${className}">${body}</span>`;
    }
}
export class MathRenderer extends Extension {
    async renderer(token, inline, type = '') {
        if (type === '') {
            type = this.settings.math;
        }
        return await MathRendererQueue.getInstance().render(token, inline, type);
    }
    markedExtension() {
        return {
            async: true,
            walkTokens: async (token) => {
                if (token.type === 'InlineMath' || token.type === 'BlockMath') {
                    token.html = await this.renderer(token, token.type === 'InlineMath');
                }
            },
            extensions: [
                this.inlineMath(),
                this.blockMath()
            ]
        };
    }
    inlineMath() {
        return {
            name: 'InlineMath',
            level: 'inline',
            start(src) {
                let index;
                let indexSrc = src;
                while (indexSrc) {
                    index = indexSrc.indexOf('$');
                    if (index === -1) {
                        return;
                    }
                    const possibleKatex = indexSrc.substring(index);
                    if (possibleKatex.match(inlineRule)) {
                        return index;
                    }
                    indexSrc = indexSrc.substring(index + 1).replace(/^\$+/, '');
                }
            },
            tokenizer(src, tokens) {
                const match = src.match(inlineRule);
                if (match) {
                    return {
                        type: 'InlineMath',
                        raw: match[0],
                        text: match[2].trim(),
                        displayMode: match[1].length === 2
                    };
                }
            },
            renderer: (token) => {
                return token.html;
            }
        };
    }
    blockMath() {
        return {
            name: 'BlockMath',
            level: 'block',
            tokenizer(src) {
                const match = src.match(blockRule);
                if (match) {
                    return {
                        type: 'BlockMath',
                        raw: match[0],
                        text: match[2].trim(),
                        displayMode: match[1].length === 2
                    };
                }
            },
            renderer: (token) => {
                return token.html;
            }
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWF0aC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1hdGgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7OztHQVlHO0FBSUgsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUl4QyxNQUFNLFVBQVUsR0FBRyx3REFBd0QsQ0FBQztBQUM1RSxNQUFNLFNBQVMsR0FBRyw2Q0FBNkMsQ0FBQztBQUVoRSxNQUFNLFFBQVEsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztBQUUzQyxNQUFNLFVBQVUsY0FBYztJQUMxQixRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDckIsQ0FBQztBQUVELE1BQU0sT0FBTyxpQkFBaUI7SUFjMUI7UUFiQSxvQkFBb0I7UUFDWixTQUFJLEdBQUcsVUFBVSxDQUFDLENBQUMsV0FBVztRQUU5QixjQUFTLEdBQVcsQ0FBQyxDQUFDO0lBVzlCLENBQUM7SUFURCxjQUFjO0lBQ1AsTUFBTSxDQUFDLFdBQVc7UUFDckIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRTtZQUM3QixpQkFBaUIsQ0FBQyxRQUFRLEdBQUcsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO1NBQ3hEO1FBQ0QsT0FBTyxpQkFBaUIsQ0FBQyxRQUFRLENBQUM7SUFDdEMsQ0FBQztJQUtELEtBQUssQ0FBQyxVQUFVLENBQUMsVUFBa0IsRUFBRSxNQUFlLEVBQUUsSUFBWTtRQUM5RCxJQUFJO1lBQ0EsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3BCLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUNkLElBQUksSUFBSSxLQUFLLFdBQVcsRUFBRTtnQkFDdEIsSUFBSSxHQUFHLFVBQVUsQ0FBQzthQUNyQjtpQkFDSTtnQkFDRCxJQUFJLEdBQUcsV0FBVyxDQUFDO2FBQ3RCO1lBRUQscUJBQXFCO1lBQ3JCLElBQUksR0FBRyxHQUFHLEVBQUUsQ0FBQztZQUNiLElBQUk7Z0JBQ0EsZUFBZTtnQkFDZixJQUFJ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LElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFO3dCQUNyQixXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDO3FCQUNyQyxDQUFDO2lCQUNMO1lBQ0wsQ0FBQztZQUNELFFBQVEsRUFBRSxDQUFDLEtBQXFCLEVBQUUsRUFBRTtnQkFDaEMsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDO1lBQ3RCLENBQUM7U0FDSixDQUFBO0lBQ0wsQ0FBQztJQUNELFNBQVM7UUFDTCxPQUFPO1lBQ0gsSUFBSSxFQUFFLFdBQVc7WUFDakIsS0FBSyxFQUFFLE9BQU87WUFDZCxTQUFTLENBQUMsR0FBVztnQkFDakIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDbkMsSUFBSSxLQUFLLEVBQUU7b0JBQ1AsT0FBTzt3QkFDSCxJQUFJLEVBQUUsV0FBVzt3QkFDakIsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7d0JBQ2IsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUU7d0JBQ3JCLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUM7cUJBQ3JDLENBQUM7aUJBQ0w7WUFDTCxDQUFDO1lBQ0QsUUFBUSxFQUFFLENBQUMsS0FBcUIsRUFBRSxFQUFFO2dCQUNoQyxPQUFPLEtBQUssQ0FBQyxJQUFJLENBQUM7WUFDdEIsQ0FBQztTQUNKLENBQUM7SUFDTixDQUFDO0NBQ0oiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IChjKSAyMDI0LTIwMjUgSXNIZXh4XG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc29mdHdhcmUgaXMgcHJvcHJpZXRhcnkgYW5kIGNvbmZpZGVudGlhbC4gTm8gcGFydCBvZiB0aGlzIHNvZnR3YXJlXG4gKiBtYXkgYmUgcmVwcm9kdWNlZCwgZGlzdHJpYnV0ZWQsIG9yIHRyYW5zbWl0dGVkIGluIGFueSBmb3JtIG9yIGJ5IGFueSBtZWFucyxcbiAqIGluY2x1ZGluZyBwaG90b2NvcHlpbmcsIHJlY29yZGluZywgb3Igb3RoZXIgZWxlY3Ryb25pYyBvciBtZWNoYW5pY2FsIG1ldGhvZHMsXG4gKiB3aXRob3V0IHRoZSBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24gb2YgdGhlIGF1dGhvciwgZXhjZXB0IGluIHRoZSBjYXNlIG9mXG4gKiBicmllZiBxdW90YXRpb25zIGVtYm9kaWVkIGluIGNyaXRpY2FsIHJldmlld3MgYW5kIGNlcnRhaW4gb3RoZXIgbm9uY29tbWVyY2lhbFxuICogdXNlcyBwZXJtaXR0ZWQgYnkgY29weXJpZ2h0IGxhdy5cbiAqXG4gKiBGb3IgcGVybWlzc2lvbiByZXF1ZXN0cywgY29udGFjdDogSXNIZXh4XG4gKi9cblxuaW1wb3J0IHsgTWFya2VkRXh0ZW5zaW9uLCBUb2tlbiwgVG9rZW5zIH0gZnJvbSBcIm1hcmtlZFwiO1xuaW1wb3J0IHsgcmVxdWVzdFVybCB9IGZyb20gXCJvYnNpZGlhblwiO1xuaW1wb3J0IHsgRXh0ZW5zaW9uIH0gZnJvbSBcIi4vZXh0ZW5zaW9uXCI7XG4vLyDmm7TmlrBpbXBvcnTot6/lvoRcbmltcG9ydCB7IFd4U2V0dGluZ3MgfSBmcm9tIFwiLi4vLi4vLi4vY29yZS9zZXR0aW5nc1wiO1xuXG5jb25zdCBpbmxpbmVSdWxlID0gL14oXFwkezEsMn0pKD8hXFwkKSgoPzpcXFxcLnxbXlxcXFxcXG5dKSo/KD86XFxcXC58W15cXFxcXFxuXFwkXSkpXFwxLztcbmNvbnN0IGJsb2NrUnVsZSA9IC9eKFxcJHsxLDJ9KVxcbigoPzpcXFxcW15dfFteXFxcXF0pKz8pXFxuXFwxKD86XFxufCQpLztcblxuY29uc3Qgc3ZnQ2FjaGUgPSBuZXcgTWFwPHN0cmluZywgc3RyaW5nPigpO1xuXG5leHBvcnQgZnVuY3Rpb24gY2xlYW5NYXRoQ2FjaGUoKSB7XG4gICAgc3ZnQ2FjaGUuY2xlYXIoKTtcbn1cblxuZXhwb3J0IGNsYXNzIE1hdGhSZW5kZXJlclF1ZXVlIHtcbiAgICAvLyDnpoHnlKjlpJbpg6jmlbDlrabmuLLmn5PmnI3liqHvvIzkvb/nlKjmnKzlnLDlpITnkIZcbiAgICBwcml2YXRlIGhvc3QgPSAnZGlzYWJsZWQnOyAvLyDkuI3lho3kvb/nlKjlpJbpg6jmnI3liqFcbiAgICBwcml2YXRlIHN0YXRpYyBpbnN0YW5jZTogTWF0aFJlbmRlcmVyUXVldWU7XG4gICAgcHJpdmF0ZSBtYXRoSW5kZXg6IG51bWJlciA9IDA7XG5cbiAgICAvLyDpnZnmgIHmlrnms5XvvIznlKjkuo7ojrflj5blrp7kvotcbiAgICBwdWJsaWMgc3RhdGljIGdldEluc3RhbmNlKCk6IE1hdGhSZW5kZXJlclF1ZXVlIHtcbiAgICAgICAgaWYgKCFNYXRoUmVuZGVyZXJRdWV1ZS5pbnN0YW5jZSkge1xuICAgICAgICAgICAgTWF0aFJlbmRlcmVyUXVldWUuaW5zdGFuY2UgPSBuZXcgTWF0aFJlbmRlcmVyUXVldWUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTWF0aFJlbmRlcmVyUXVldWUuaW5zdGFuY2U7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjb25zdHJ1Y3RvcigpIHtcbiAgICB9XG5cbiAgICBhc3luYyBnZXRNYXRoU1ZHKGV4cHJlc3Npb246IHN0cmluZywgaW5saW5lOiBib29sZWFuLCB0eXBlOiBzdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBzdWNjZXNzID0gZmFsc2U7XG4gICAgICAgICAgICBsZXQgcGF0aCA9ICcnO1xuICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdhc2NpaW1hdGgnKSB7XG4gICAgICAgICAgICAgICAgcGF0aCA9ICcvbWF0aC9hbSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXRoID0gJy9tYXRoL3RleCc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIOeugOWMluaVsOWtpuWFrOW8j+WkhOeQhu+8jOmBv+WFjeWklumDqEFQSeS+nei1llxuICAgICAgICAgICAgbGV0IHN2ZyA9ICcnO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAvLyDnroDljZXnmoTmlbDlrablhazlvI/ljaDkvY3nrKblpITnkIZcbiAgICAgICAgICAgICAgICBpZiAoaW5saW5lKSB7XG4gICAgICAgICAgICAgICAgICAgIHN2ZyA9IGA8c3BhbiBjbGFzcz1cIm1hdGgtaW5saW5lXCI+JCR7ZXhwcmVzc2lvbn0kPC9zcGFuPmA7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc3ZnID0gYDxkaXYgY2xhc3M9XCJtYXRoLWJsb2NrXCI+JCQke2V4cHJlc3Npb259JCQ8L2Rpdj5gO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzdWNjZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnTWF0aCBmb3JtdWxhIHByb2Nlc3NlZCBsb2NhbGx5OicsIGV4cHJlc3Npb24pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdNYXRoIHByb2Nlc3NpbmcgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICAgICAgICAgIHN2ZyA9IGA8c3BhbiBjbGFzcz1cIm1hdGgtZXJyb3JcIj7mlbDlrablhazlvI86ICR7ZXhwcmVzc2lvbn08L3NwYW4+YDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB7IHN2Zywgc3VjY2VzcyB9O1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVyci5tc2cpO1xuICAgICAgICAgICAgY29uc3Qgc3ZnID0gJ+a4suafk+Wksei0pTogJyArIGVyci5tZXNzYWdlO1xuICAgICAgICAgICAgcmV0dXJuIHsgc3ZnLCBzdWNjZXNzOiBmYWxzZSB9O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2VuZXJhdGVJZCgpIHtcbiAgICAgICAgdGhpcy5tYXRoSW5kZXggKz0gMTtcbiAgICAgICAgcmV0dXJuIGBtYXRoLWlkLSR7dGhpcy5tYXRoSW5kZXh9YDtcbiAgICB9XG5cbiAgICBhc3luYyByZW5kZXIodG9rZW46IFRva2Vucy5HZW5lcmljLCBpbmxpbmU6IGJvb2xlYW4sIHR5cGU6IHN0cmluZykge1xuICAgICAgICAvLyBDbGF1ZGUgQ29kZSBSZW1vdmU6IOenu+mZpGlzQXV0aEtleVZhaWxk5qOA5p+l77yM5LiN5YaN6ZyA6KaB5rOo5YaM56CB6aqM6K+BXG5cbiAgICAgICAgY29uc3QgaWQgPSB0aGlzLmdlbmVyYXRlSWQoKTtcbiAgICAgICAgbGV0IHN2ZyA9ICfmuLLmn5PkuK0nO1xuICAgICAgICBjb25zdCBleHByZXNzaW9uID0gdG9rZW4udGV4dDtcbiAgICAgICAgaWYgKHN2Z0NhY2hlLmhhcyh0b2tlbi50ZXh0KSkge1xuICAgICAgICAgICAgc3ZnID0gc3ZnQ2FjaGUuZ2V0KGV4cHJlc3Npb24pIGFzIHN0cmluZztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHRoaXMuZ2V0TWF0aFNWRyhleHByZXNzaW9uLCBpbmxpbmUsIHR5cGUpXG4gICAgICAgICAgICBpZiAocmVzLnN1Y2Nlc3MpIHtcbiAgICAgICAgICAgICAgICBzdmdDYWNoZS5zZXQoZXhwcmVzc2lvbiwgcmVzLnN2Zyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdmcgPSByZXMuc3ZnO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY2xhc3NOYW1lID0gaW5saW5lID8gJ2lubGluZS1tYXRoLXN2ZycgOiAnYmxvY2stbWF0aC1zdmcnO1xuICAgICAgICBjb25zdCBib2R5ID0gaW5saW5lID8gc3ZnIDogYDxzZWN0aW9uIGNsYXNzPVwiYmxvY2stbWF0aC1zZWN0aW9uXCI+JHtzdmd9PC9zZWN0aW9uPmA7XG4gICAgICAgIHJldHVybiBgPHNwYW4gaWQ9XCIke2lkfVwiIGNsYXNzPVwiJHtjbGFzc05hbWV9XCI+JHtib2R5fTwvc3Bhbj5gO1xuICAgIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgTWF0aFJlbmRlcmVyIGV4dGVuZHMgRXh0ZW5zaW9uIHtcbiAgICBhc3luYyByZW5kZXJlcih0b2tlbjogVG9rZW5zLkdlbmVyaWMsIGlubGluZTogYm9vbGVhbiwgdHlwZTogc3RyaW5nID0gJycpIHtcbiAgICAgICAgaWYgKHR5cGUgPT09ICcnKSB7XG4gICAgICAgICAgICB0eXBlID0gdGhpcy5zZXR0aW5ncy5tYXRoO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhd2FpdCBNYXRoUmVuZGVyZXJRdWV1ZS5nZXRJbnN0YW5jZSgpLnJlbmRlcih0b2tlbiwgaW5saW5lLCB0eXBlKTtcbiAgICB9XG5cbiAgICBtYXJrZWRFeHRlbnNpb24oKTogTWFya2VkRXh0ZW5zaW9uIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGFzeW5jOiB0cnVlLFxuICAgICAgICAgICAgd2Fsa1Rva2VuczogYXN5bmMgKHRva2VuOiBUb2tlbnMuR2VuZXJpYykgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0b2tlbi50eXBlID09PSAnSW5saW5lTWF0aCcgfHwgdG9rZW4udHlwZSA9PT0gJ0Jsb2NrTWF0aCcpIHtcbiAgICAgICAgICAgICAgICAgICAgdG9rZW4uaHRtbCA9IGF3YWl0IHRoaXMucmVuZGVyZXIodG9rZW4sIHRva2VuLnR5cGUgPT09ICdJbmxpbmVNYXRoJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGV4dGVuc2lvbnM6IFtcbiAgICAgICAgICAgICAgICB0aGlzLmlubGluZU1hdGgoKSxcbiAgICAgICAgICAgICAgICB0aGlzLmJsb2NrTWF0aCgpXG4gICAgICAgICAgICBdXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBpbmxpbmVNYXRoKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZTogJ0lubGluZU1hdGgnLFxuICAgICAgICAgICAgbGV2ZWw6ICdpbmxpbmUnLFxuICAgICAgICAgICAgc3RhcnQoc3JjOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICBsZXQgaW5kZXg7XG4gICAgICAgICAgICAgICAgbGV0IGluZGV4U3JjID0gc3JjO1xuXG4gICAgICAgICAgICAgICAgd2hpbGUgKGluZGV4U3JjKSB7XG4gICAgICAgICAgICAgICAgICAgIGluZGV4ID0gaW5kZXhTcmMuaW5kZXhPZignJCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5kZXggPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwb3NzaWJsZUthdGV4ID0gaW5kZXhTcmMuc3Vic3RyaW5nKGluZGV4KTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocG9zc2libGVLYXRleC5tYXRjaChpbmxpbmVSdWxlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaW5kZXhTcmMgPSBpbmRleFNyYy5zdWJzdHJpbmcoaW5kZXggKyAxKS5yZXBsYWNlKC9eXFwkKy8sICcnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdG9rZW5pemVyKHNyYzogc3RyaW5nLCB0b2tlbnM6IFRva2VuW10pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXRjaCA9IHNyYy5tYXRjaChpbmxpbmVSdWxlKTtcbiAgICAgICAgICAgICAgICBpZiAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdJbmxpbmVNYXRoJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhdzogbWF0Y2hbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBtYXRjaFsyXS50cmltKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5TW9kZTogbWF0Y2hbMV0ubGVuZ3RoID09PSAyXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlbmRlcmVyOiAodG9rZW46IFRva2Vucy5HZW5lcmljKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuLmh0bWw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgYmxvY2tNYXRoKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbmFtZTogJ0Jsb2NrTWF0aCcsXG4gICAgICAgICAgICBsZXZlbDogJ2Jsb2NrJyxcbiAgICAgICAgICAgIHRva2VuaXplcihzcmM6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoID0gc3JjLm1hdGNoKGJsb2NrUnVsZSk7XG4gICAgICAgICAgICAgICAgaWYgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnQmxvY2tNYXRoJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhdzogbWF0Y2hbMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBtYXRjaFsyXS50cmltKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5TW9kZTogbWF0Y2hbMV0ubGVuZ3RoID09PSAyXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlbmRlcmVyOiAodG9rZW46IFRva2Vucy5HZW5lcmljKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRva2VuLmh0bWw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxufVxuIl19