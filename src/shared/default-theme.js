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
const css = `
/* =========================================================== */
/* Obsidian的默认样式                                            */
/* =========================================================== */
.wdwxedit {
    padding: 0;
    user-select: text;
    -webkit-user-select: text;
    color: #222222;
    font-size: 16px;
}

.wdwxedit:last-child {
    margin-bottom: 0;
}

.wdwxedit .fancybox-img {
    border: none;
}

.wdwxedit .fancybox-img:hover {
    opacity: none;
    border: none;
}

/*
=================================
Heading 
==================================
*/
.wdwxedit h1 {
    color: #222;
    font-weight: 700;
    font-size: 1.802em;
    line-height: 1.2;
    margin-block-start: 1em;
    margin-block-end: 0;
}

.wdwxedit h2 {
    color: #222;
    font-weight: 600;
    font-size: 1.602em;
    line-height: 1.2;
    margin-block-start: 1em;
    margin-block-end: 0;
}

.wdwxedit h3 {
    color: #222;
    font-weight: 600;
    font-size: 1.424em;
    line-height: 1.3;
    margin-block-start: 1em;
    margin-block-end: 0;
}

.wdwxedit h4 {
    color: #222;
    font-weight: 600;
    font-size: 1.266em;
    line-height: 1.4;
    margin-block-start: 1em;
    margin-block-end: 0;
}

.wdwxedit h5 {
    color: #222;
    margin-block-start: 1em;
    margin-block-end: 0;
}

.wdwxedit h6 {
    color: #222;
    margin-block-start: 1em;
    margin-block-end: 0;
}

/*
=================================
Horizontal Rules
==================================
    */
.wdwxedit hr {
    border-color: #e0e0e0;
    margin-top: 3em;
    margin-bottom: 3em;
}

/*
=================================
Paragraphs
==================================
    */
.wdwxedit p {
    line-height: 1.6em;
    margin: 1em 0;
}

/*
=================================
Emphasis
==================================
    */
.wdwxedit strong {
    color: #222222;
    font-weight: 600;
}

.wdwxedit em {
    color: inherit;
    font-style: italic;
}

.wdwxedit s {
    color: inherit;
}

/*
=================================
    Blockquotes
==================================
    */
.wdwxedit blockquote {
    font-size: 1rem;
    display: block;
    margin: 2em 0;
    padding: 0em 0.8em 0em 0.8em;
    position: relative;
    color: inherit;
    border-left: 0.15rem solid #7852ee;
}

.wdwxedit blockquote blockquote {
    margin: 0 0;
}

.wdwxedit blockquote p {
    margin: 0;
}

.wdwxedit blockquote footer strong {
    margin-right: 0.5em;
}

/*
=================================
List
==================================
*/
.wdwxedit ul {
    margin: 0;
    margin-top: 1.25em;
    margin-bottom: 1.25em;
    line-height: 1.6em;
}

.wdwxedit ul>li::marker {
    color: #ababab;
    /* font-size: 1.5em; */
}

.wdwxedit li>p {
    margin: 0;
}

.wdwxedit ol {
    margin: 0;
    padding: 0;
    margin-top: 1.25em;
    margin-bottom: 0em;
    list-style-type: decimal;
    line-height: 1.6em;
}

.wdwxedit ol>li {
    position: relative;
    padding-left: 0.1em;
    margin-left: 2em;
}

/*
=================================
Link
==================================
*/
.wdwxedit a {
    color: #7852ee;
    text-decoration: none;
    font-weight: 500;
    text-decoration: none;
    border-bottom: 1px solid #7852ee;
    transition: border 0.3s ease-in-out;
}

.wdwxedit a:hover {
    color: #7952eebb;
    border-bottom: 1px solid #7952eebb;
}

/*
=================================
Table
==================================
*/
.wdwxedit table {
    width: 100%;
    table-layout: auto;
    text-align: left;
    margin-top: 2em;
    margin-bottom: 2em;
    font-size: 0.875em;
    line-height: 1.7142857;
    border-collapse: collapse;
    border-color: inherit;
    text-indent: 0;
}

.wdwxedit table thead {
    color: #000;
    font-weight: 600;
    border: #e0e0e0 1px solid;
}

.wdwxedit table thead th {
    vertical-align: bottom;
    padding-right: 0.5714286em;
    padding-bottom: 0.5714286em;
    padding-left: 0.5714286em;
    border: #e0e0e0 1px solid;
}

.wdwxedit table thead th:first-child {
    padding-left: 0.5em;
}

.wdwxedit table thead th:last-child {
    padding-right: 0.5em;
}

.wdwxedit table tbody tr {
    border-style: solid;
    border: #e0e0e0 1px solid;
}

.wdwxedit table tbody tr:last-child {
    border-bottom-width: 0;
}

.wdwxedit table tbody td {
    vertical-align: top;
    padding-top: 0.5714286em;
    padding-right: 0.5714286em;
    padding-bottom: 0.5714286em;
    padding-left: 0.5714286em;
    border: #e0e0e0 1px solid;
}

.wdwxedit table tbody td:first-child {
    padding-left: 0;
}

.wdwxedit table tbody td:last-child {
    padding-right: 0;
}

/*
=================================
Images
==================================
*/
.wdwxedit img {
    margin: 2em auto;
}

.wdwxedit .footnotes hr {
    margin-top: 4em;
    margin-bottom: 0.5em;
}

/*
=================================
Code
==================================
*/
.wdwxedit .code-section {
    display: flex;
    border: rgb(240, 240, 240) 1px solid;
    line-height: 26px;
    font-size: 14px;
    margin: 1em 0;
    padding: 0.875em;
    box-sizing: border-box;
}

.wdwxedit .code-section ul {
    width: fit-content;
    margin-block-start: 0;
    margin-block-end: 0;
    flex-shrink: 0;
    height: 100%;
    padding: 0;
    line-height: 26px;
    list-style-type: none;
    backgroud: transparent !important;
}

.wdwxedit .code-section ul>li {
    text-align: right;
}

.wdwxedit .code-section pre {
    margin-block-start: 0;
    margin-block-end: 0;
    white-space: normal;
    overflow: auto;
    padding: 0 0 0 0.875em;
}

.wdwxedit .code-section code {
    display: flex;
    text-wrap: nowrap;
    font-family: Consolas,Courier,monospace;
}
`;
export default { name: '默认', className: 'obsidian-light', desc: '默认主题', author: 'SunBooshi', css: css };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdC10aGVtZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRlZmF1bHQtdGhlbWUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7OztHQVlHO0FBRUgsTUFBTSxHQUFHLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW9VWCxDQUFBO0FBRUQsZUFBZSxFQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUMsR0FBRyxFQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IChjKSAyMDI0LTIwMjUgSXNIZXh4XG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc29mdHdhcmUgaXMgcHJvcHJpZXRhcnkgYW5kIGNvbmZpZGVudGlhbC4gTm8gcGFydCBvZiB0aGlzIHNvZnR3YXJlXG4gKiBtYXkgYmUgcmVwcm9kdWNlZCwgZGlzdHJpYnV0ZWQsIG9yIHRyYW5zbWl0dGVkIGluIGFueSBmb3JtIG9yIGJ5IGFueSBtZWFucyxcbiAqIGluY2x1ZGluZyBwaG90b2NvcHlpbmcsIHJlY29yZGluZywgb3Igb3RoZXIgZWxlY3Ryb25pYyBvciBtZWNoYW5pY2FsIG1ldGhvZHMsXG4gKiB3aXRob3V0IHRoZSBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24gb2YgdGhlIGF1dGhvciwgZXhjZXB0IGluIHRoZSBjYXNlIG9mXG4gKiBicmllZiBxdW90YXRpb25zIGVtYm9kaWVkIGluIGNyaXRpY2FsIHJldmlld3MgYW5kIGNlcnRhaW4gb3RoZXIgbm9uY29tbWVyY2lhbFxuICogdXNlcyBwZXJtaXR0ZWQgYnkgY29weXJpZ2h0IGxhdy5cbiAqXG4gKiBGb3IgcGVybWlzc2lvbiByZXF1ZXN0cywgY29udGFjdDogSXNIZXh4XG4gKi9cblxuY29uc3QgY3NzID0gYFxuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cbi8qIE9ic2lkaWFu55qE6buY6K6k5qC35byPICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAqL1xuLyogPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0gKi9cbi53ZHd4ZWRpdCB7XG4gICAgcGFkZGluZzogMDtcbiAgICB1c2VyLXNlbGVjdDogdGV4dDtcbiAgICAtd2Via2l0LXVzZXItc2VsZWN0OiB0ZXh0O1xuICAgIGNvbG9yOiAjMjIyMjIyO1xuICAgIGZvbnQtc2l6ZTogMTZweDtcbn1cblxuLndkd3hlZGl0Omxhc3QtY2hpbGQge1xuICAgIG1hcmdpbi1ib3R0b206IDA7XG59XG5cbi53ZHd4ZWRpdCAuZmFuY3lib3gtaW1nIHtcbiAgICBib3JkZXI6IG5vbmU7XG59XG5cbi53ZHd4ZWRpdCAuZmFuY3lib3gtaW1nOmhvdmVyIHtcbiAgICBvcGFjaXR5OiBub25lO1xuICAgIGJvcmRlcjogbm9uZTtcbn1cblxuLypcbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuSGVhZGluZyBcbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiovXG4ud2R3eGVkaXQgaDEge1xuICAgIGNvbG9yOiAjMjIyO1xuICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgZm9udC1zaXplOiAxLjgwMmVtO1xuICAgIGxpbmUtaGVpZ2h0OiAxLjI7XG4gICAgbWFyZ2luLWJsb2NrLXN0YXJ0OiAxZW07XG4gICAgbWFyZ2luLWJsb2NrLWVuZDogMDtcbn1cblxuLndkd3hlZGl0IGgyIHtcbiAgICBjb2xvcjogIzIyMjtcbiAgICBmb250LXdlaWdodDogNjAwO1xuICAgIGZvbnQtc2l6ZTogMS42MDJlbTtcbiAgICBsaW5lLWhlaWdodDogMS4yO1xuICAgIG1hcmdpbi1ibG9jay1zdGFydDogMWVtO1xuICAgIG1hcmdpbi1ibG9jay1lbmQ6IDA7XG59XG5cbi53ZHd4ZWRpdCBoMyB7XG4gICAgY29sb3I6ICMyMjI7XG4gICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICBmb250LXNpemU6IDEuNDI0ZW07XG4gICAgbGluZS1oZWlnaHQ6IDEuMztcbiAgICBtYXJnaW4tYmxvY2stc3RhcnQ6IDFlbTtcbiAgICBtYXJnaW4tYmxvY2stZW5kOiAwO1xufVxuXG4ud2R3eGVkaXQgaDQge1xuICAgIGNvbG9yOiAjMjIyO1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgZm9udC1zaXplOiAxLjI2NmVtO1xuICAgIGxpbmUtaGVpZ2h0OiAxLjQ7XG4gICAgbWFyZ2luLWJsb2NrLXN0YXJ0OiAxZW07XG4gICAgbWFyZ2luLWJsb2NrLWVuZDogMDtcbn1cblxuLndkd3hlZGl0IGg1IHtcbiAgICBjb2xvcjogIzIyMjtcbiAgICBtYXJnaW4tYmxvY2stc3RhcnQ6IDFlbTtcbiAgICBtYXJnaW4tYmxvY2stZW5kOiAwO1xufVxuXG4ud2R3eGVkaXQgaDYge1xuICAgIGNvbG9yOiAjMjIyO1xuICAgIG1hcmdpbi1ibG9jay1zdGFydDogMWVtO1xuICAgIG1hcmdpbi1ibG9jay1lbmQ6IDA7XG59XG5cbi8qXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkhvcml6b250YWwgUnVsZXNcbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAqL1xuLndkd3hlZGl0IGhyIHtcbiAgICBib3JkZXItY29sb3I6ICNlMGUwZTA7XG4gICAgbWFyZ2luLXRvcDogM2VtO1xuICAgIG1hcmdpbi1ib3R0b206IDNlbTtcbn1cblxuLypcbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuUGFyYWdyYXBoc1xuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICovXG4ud2R3eGVkaXQgcCB7XG4gICAgbGluZS1oZWlnaHQ6IDEuNmVtO1xuICAgIG1hcmdpbjogMWVtIDA7XG59XG5cbi8qXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbkVtcGhhc2lzXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgKi9cbi53ZHd4ZWRpdCBzdHJvbmcge1xuICAgIGNvbG9yOiAjMjIyMjIyO1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG59XG5cbi53ZHd4ZWRpdCBlbSB7XG4gICAgY29sb3I6IGluaGVyaXQ7XG4gICAgZm9udC1zdHlsZTogaXRhbGljO1xufVxuXG4ud2R3eGVkaXQgcyB7XG4gICAgY29sb3I6IGluaGVyaXQ7XG59XG5cbi8qXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBCbG9ja3F1b3Rlc1xuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgICovXG4ud2R3eGVkaXQgYmxvY2txdW90ZSB7XG4gICAgZm9udC1zaXplOiAxcmVtO1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIG1hcmdpbjogMmVtIDA7XG4gICAgcGFkZGluZzogMGVtIDAuOGVtIDBlbSAwLjhlbTtcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgY29sb3I6IGluaGVyaXQ7XG4gICAgYm9yZGVyLWxlZnQ6IDAuMTVyZW0gc29saWQgIzc4NTJlZTtcbn1cblxuLndkd3hlZGl0IGJsb2NrcXVvdGUgYmxvY2txdW90ZSB7XG4gICAgbWFyZ2luOiAwIDA7XG59XG5cbi53ZHd4ZWRpdCBibG9ja3F1b3RlIHAge1xuICAgIG1hcmdpbjogMDtcbn1cblxuLndkd3hlZGl0IGJsb2NrcXVvdGUgZm9vdGVyIHN0cm9uZyB7XG4gICAgbWFyZ2luLXJpZ2h0OiAwLjVlbTtcbn1cblxuLypcbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuTGlzdFxuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuKi9cbi53ZHd4ZWRpdCB1bCB7XG4gICAgbWFyZ2luOiAwO1xuICAgIG1hcmdpbi10b3A6IDEuMjVlbTtcbiAgICBtYXJnaW4tYm90dG9tOiAxLjI1ZW07XG4gICAgbGluZS1oZWlnaHQ6IDEuNmVtO1xufVxuXG4ud2R3eGVkaXQgdWw+bGk6Om1hcmtlciB7XG4gICAgY29sb3I6ICNhYmFiYWI7XG4gICAgLyogZm9udC1zaXplOiAxLjVlbTsgKi9cbn1cblxuLndkd3hlZGl0IGxpPnAge1xuICAgIG1hcmdpbjogMDtcbn1cblxuLndkd3hlZGl0IG9sIHtcbiAgICBtYXJnaW46IDA7XG4gICAgcGFkZGluZzogMDtcbiAgICBtYXJnaW4tdG9wOiAxLjI1ZW07XG4gICAgbWFyZ2luLWJvdHRvbTogMGVtO1xuICAgIGxpc3Qtc3R5bGUtdHlwZTogZGVjaW1hbDtcbiAgICBsaW5lLWhlaWdodDogMS42ZW07XG59XG5cbi53ZHd4ZWRpdCBvbD5saSB7XG4gICAgcG9zaXRpb246IHJlbGF0aXZlO1xuICAgIHBhZGRpbmctbGVmdDogMC4xZW07XG4gICAgbWFyZ2luLWxlZnQ6IDJlbTtcbn1cblxuLypcbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuTGlua1xuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuKi9cbi53ZHd4ZWRpdCBhIHtcbiAgICBjb2xvcjogIzc4NTJlZTtcbiAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICM3ODUyZWU7XG4gICAgdHJhbnNpdGlvbjogYm9yZGVyIDAuM3MgZWFzZS1pbi1vdXQ7XG59XG5cbi53ZHd4ZWRpdCBhOmhvdmVyIHtcbiAgICBjb2xvcjogIzc5NTJlZWJiO1xuICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjNzk1MmVlYmI7XG59XG5cbi8qXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblRhYmxlXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4qL1xuLndkd3hlZGl0IHRhYmxlIHtcbiAgICB3aWR0aDogMTAwJTtcbiAgICB0YWJsZS1sYXlvdXQ6IGF1dG87XG4gICAgdGV4dC1hbGlnbjogbGVmdDtcbiAgICBtYXJnaW4tdG9wOiAyZW07XG4gICAgbWFyZ2luLWJvdHRvbTogMmVtO1xuICAgIGZvbnQtc2l6ZTogMC44NzVlbTtcbiAgICBsaW5lLWhlaWdodDogMS43MTQyODU3O1xuICAgIGJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7XG4gICAgYm9yZGVyLWNvbG9yOiBpbmhlcml0O1xuICAgIHRleHQtaW5kZW50OiAwO1xufVxuXG4ud2R3eGVkaXQgdGFibGUgdGhlYWQge1xuICAgIGNvbG9yOiAjMDAwO1xuICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgYm9yZGVyOiAjZTBlMGUwIDFweCBzb2xpZDtcbn1cblxuLndkd3hlZGl0IHRhYmxlIHRoZWFkIHRoIHtcbiAgICB2ZXJ0aWNhbC1hbGlnbjogYm90dG9tO1xuICAgIHBhZGRpbmctcmlnaHQ6IDAuNTcxNDI4NmVtO1xuICAgIHBhZGRpbmctYm90dG9tOiAwLjU3MTQyODZlbTtcbiAgICBwYWRkaW5nLWxlZnQ6IDAuNTcxNDI4NmVtO1xuICAgIGJvcmRlcjogI2UwZTBlMCAxcHggc29saWQ7XG59XG5cbi53ZHd4ZWRpdCB0YWJsZSB0aGVhZCB0aDpmaXJzdC1jaGlsZCB7XG4gICAgcGFkZGluZy1sZWZ0OiAwLjVlbTtcbn1cblxuLndkd3hlZGl0IHRhYmxlIHRoZWFkIHRoOmxhc3QtY2hpbGQge1xuICAgIHBhZGRpbmctcmlnaHQ6IDAuNWVtO1xufVxuXG4ud2R3eGVkaXQgdGFibGUgdGJvZHkgdHIge1xuICAgIGJvcmRlci1zdHlsZTogc29saWQ7XG4gICAgYm9yZGVyOiAjZTBlMGUwIDFweCBzb2xpZDtcbn1cblxuLndkd3hlZGl0IHRhYmxlIHRib2R5IHRyOmxhc3QtY2hpbGQge1xuICAgIGJvcmRlci1ib3R0b20td2lkdGg6IDA7XG59XG5cbi53ZHd4ZWRpdCB0YWJsZSB0Ym9keSB0ZCB7XG4gICAgdmVydGljYWwtYWxpZ246IHRvcDtcbiAgICBwYWRkaW5nLXRvcDogMC41NzE0Mjg2ZW07XG4gICAgcGFkZGluZy1yaWdodDogMC41NzE0Mjg2ZW07XG4gICAgcGFkZGluZy1ib3R0b206IDAuNTcxNDI4NmVtO1xuICAgIHBhZGRpbmctbGVmdDogMC41NzE0Mjg2ZW07XG4gICAgYm9yZGVyOiAjZTBlMGUwIDFweCBzb2xpZDtcbn1cblxuLndkd3hlZGl0IHRhYmxlIHRib2R5IHRkOmZpcnN0LWNoaWxkIHtcbiAgICBwYWRkaW5nLWxlZnQ6IDA7XG59XG5cbi53ZHd4ZWRpdCB0YWJsZSB0Ym9keSB0ZDpsYXN0LWNoaWxkIHtcbiAgICBwYWRkaW5nLXJpZ2h0OiAwO1xufVxuXG4vKlxuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5JbWFnZXNcbj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiovXG4ud2R3eGVkaXQgaW1nIHtcbiAgICBtYXJnaW46IDJlbSBhdXRvO1xufVxuXG4ud2R3eGVkaXQgLmZvb3Rub3RlcyBociB7XG4gICAgbWFyZ2luLXRvcDogNGVtO1xuICAgIG1hcmdpbi1ib3R0b206IDAuNWVtO1xufVxuXG4vKlxuPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5Db2RlXG49PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4qL1xuLndkd3hlZGl0IC5jb2RlLXNlY3Rpb24ge1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgYm9yZGVyOiByZ2IoMjQwLCAyNDAsIDI0MCkgMXB4IHNvbGlkO1xuICAgIGxpbmUtaGVpZ2h0OiAyNnB4O1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICBtYXJnaW46IDFlbSAwO1xuICAgIHBhZGRpbmc6IDAuODc1ZW07XG4gICAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbn1cblxuLndkd3hlZGl0IC5jb2RlLXNlY3Rpb24gdWwge1xuICAgIHdpZHRoOiBmaXQtY29udGVudDtcbiAgICBtYXJnaW4tYmxvY2stc3RhcnQ6IDA7XG4gICAgbWFyZ2luLWJsb2NrLWVuZDogMDtcbiAgICBmbGV4LXNocmluazogMDtcbiAgICBoZWlnaHQ6IDEwMCU7XG4gICAgcGFkZGluZzogMDtcbiAgICBsaW5lLWhlaWdodDogMjZweDtcbiAgICBsaXN0LXN0eWxlLXR5cGU6IG5vbmU7XG4gICAgYmFja2dyb3VkOiB0cmFuc3BhcmVudCAhaW1wb3J0YW50O1xufVxuXG4ud2R3eGVkaXQgLmNvZGUtc2VjdGlvbiB1bD5saSB7XG4gICAgdGV4dC1hbGlnbjogcmlnaHQ7XG59XG5cbi53ZHd4ZWRpdCAuY29kZS1zZWN0aW9uIHByZSB7XG4gICAgbWFyZ2luLWJsb2NrLXN0YXJ0OiAwO1xuICAgIG1hcmdpbi1ibG9jay1lbmQ6IDA7XG4gICAgd2hpdGUtc3BhY2U6IG5vcm1hbDtcbiAgICBvdmVyZmxvdzogYXV0bztcbiAgICBwYWRkaW5nOiAwIDAgMCAwLjg3NWVtO1xufVxuXG4ud2R3eGVkaXQgLmNvZGUtc2VjdGlvbiBjb2RlIHtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIHRleHQtd3JhcDogbm93cmFwO1xuICAgIGZvbnQtZmFtaWx5OiBDb25zb2xhcyxDb3VyaWVyLG1vbm9zcGFjZTtcbn1cbmBcblxuZXhwb3J0IGRlZmF1bHQge25hbWU6ICfpu5jorqQnLCBjbGFzc05hbWU6ICdvYnNpZGlhbi1saWdodCcsIGRlc2M6ICfpu5jorqTkuLvpopgnLCBhdXRob3I6ICdTdW5Cb29zaGknLCBjc3M6Y3NzfTsiXX0=