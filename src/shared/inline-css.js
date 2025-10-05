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
// 需要渲染进inline style的css样式
export default `
/* --------------------------------------- */
/* callout */
/* --------------------------------------- */
section .note-callout {
  border: none;
  padding: 1em 1em 1em 1.5em;
  display: flex;
  flex-direction: column;
  margin: 1em 0;
  border-radius: 4px;
}

section .note-callout-title-wrap {
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 1em;
  font-weight: 600;
}

.note-callout-icon {
  display: inline-block;
  width: 18px;
  height: 18px;  
}

.note-callout-icon svg {
  width: 100%;
  height: 100%;
}

section .note-callout-title {
  margin-left: 0.25em;
}

section .note-callout-content {
  color: rgb(34,34,34);
}

/* note info todo */
section .note-callout-note { 
  color: rgb(8, 109, 221);
  background-color: rgba(8, 109, 221, 0.1);
}
/* abstract tip hint */
section .note-callout-abstract {
  color: rgb(0, 191, 188);
  background-color: rgba(0, 191, 188, 0.1);
}
section .note-callout-success {
  color: rgb(8, 185, 78);
  background-color: rgba(8, 185, 78, 0.1);
}
/* question  help, faq, warning, caution, attention */
section .note-callout-question {
  color: rgb(236, 117, 0);
  background-color: rgba(236, 117, 0, 0.1);
}
/* failure, fail, missing, danger, error, bug */
section .note-callout-failure {
  color: rgb(233, 49, 71);
  background-color: rgba(233, 49, 71, 0.1);
}
section .note-callout-example {
  color: rgb(120, 82, 238);
  background-color: rgba(120, 82, 238, 0.1);
}
section .note-callout-quote {
  color: rgb(158, 158, 158);
  background-color: rgba(158, 158, 158, 0.1);
}
/* custom icon callout */
section .note-callout-custom { 
  color: rgb(8, 109, 221);
  background-color: rgba(8, 109, 221, 0.1);
}

/* --------------------------------------- */
/* math */
/* --------------------------------------- */
.block-math-svg {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  margin:20px 0px;
  max-width: 300% !important;
}

.block-math-svg svg {
  scale: 0.85;
}

.block-math-section {
  text-align: center;
  overflow: auto;
}

.inline-math-svg svg {
  font-size: 0.85em;
}

/* --------------------------------------- */
/* 高亮 */
/* --------------------------------------- */
.note-highlight {
  background-color: rgba(255,208,0, 0.4);
}

/* --------------------------------------- */
/* 列表需要强制设置样式*/
/* --------------------------------------- */
ul {
  list-style-type: disc;
}

.note-svg-icon {
  min-width: 24px;
  height: 24px;
  display: inline-block;
}

.note-svg-icon svg {
  width: 100%;
  height: 100%;
}

.note-embed-excalidraw-left {
  display: flex;
  flex-direction: row;
  width: 100%;
}

.note-embed-excalidraw-center {
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 100%;
}

.note-embed-excalidraw-right {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  width: 100%;
}

.note-embed-excalidraw {
  display: inline-block;
}

.note-embed-excalidraw p {
  line-height: 0 !important;
  margin: 0 !important;
}

/*
.note-embed-excalidraw svg {
  width: 100%;
  height: 100%;
}
*/

.note-embed-svg-left {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  width: 100%;
}

.note-embed-svg-center {
  display: flex;
  flex-direction: row;
  justify-content: center;
  width: 100%;
}

.note-embed-svg-right {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  width: 100%;
}

.note-embed-svg svg {
  width: 100%;
  height: 100%;
}

`;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5saW5lLWNzcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImlubGluZS1jc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7OztHQVlHO0FBRUgsMEJBQTBCO0FBQzFCLGVBQWU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBK0xkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IChjKSAyMDI0LTIwMjUgSXNIZXh4XG4gKiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqIFRoaXMgc29mdHdhcmUgaXMgcHJvcHJpZXRhcnkgYW5kIGNvbmZpZGVudGlhbC4gTm8gcGFydCBvZiB0aGlzIHNvZnR3YXJlXG4gKiBtYXkgYmUgcmVwcm9kdWNlZCwgZGlzdHJpYnV0ZWQsIG9yIHRyYW5zbWl0dGVkIGluIGFueSBmb3JtIG9yIGJ5IGFueSBtZWFucyxcbiAqIGluY2x1ZGluZyBwaG90b2NvcHlpbmcsIHJlY29yZGluZywgb3Igb3RoZXIgZWxlY3Ryb25pYyBvciBtZWNoYW5pY2FsIG1ldGhvZHMsXG4gKiB3aXRob3V0IHRoZSBwcmlvciB3cml0dGVuIHBlcm1pc3Npb24gb2YgdGhlIGF1dGhvciwgZXhjZXB0IGluIHRoZSBjYXNlIG9mXG4gKiBicmllZiBxdW90YXRpb25zIGVtYm9kaWVkIGluIGNyaXRpY2FsIHJldmlld3MgYW5kIGNlcnRhaW4gb3RoZXIgbm9uY29tbWVyY2lhbFxuICogdXNlcyBwZXJtaXR0ZWQgYnkgY29weXJpZ2h0IGxhdy5cbiAqXG4gKiBGb3IgcGVybWlzc2lvbiByZXF1ZXN0cywgY29udGFjdDogSXNIZXh4XG4gKi9cblxuLy8g6ZyA6KaB5riy5p+T6L+baW5saW5lIHN0eWxl55qEY3Nz5qC35byPXG5leHBvcnQgZGVmYXVsdCBgXG4vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cbi8qIGNhbGxvdXQgKi9cbi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuc2VjdGlvbiAubm90ZS1jYWxsb3V0IHtcbiAgYm9yZGVyOiBub25lO1xuICBwYWRkaW5nOiAxZW0gMWVtIDFlbSAxLjVlbTtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgbWFyZ2luOiAxZW0gMDtcbiAgYm9yZGVyLXJhZGl1czogNHB4O1xufVxuXG5zZWN0aW9uIC5ub3RlLWNhbGxvdXQtdGl0bGUtd3JhcCB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIGZvbnQtc2l6ZTogMWVtO1xuICBmb250LXdlaWdodDogNjAwO1xufVxuXG4ubm90ZS1jYWxsb3V0LWljb24ge1xuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gIHdpZHRoOiAxOHB4O1xuICBoZWlnaHQ6IDE4cHg7ICBcbn1cblxuLm5vdGUtY2FsbG91dC1pY29uIHN2ZyB7XG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDEwMCU7XG59XG5cbnNlY3Rpb24gLm5vdGUtY2FsbG91dC10aXRsZSB7XG4gIG1hcmdpbi1sZWZ0OiAwLjI1ZW07XG59XG5cbnNlY3Rpb24gLm5vdGUtY2FsbG91dC1jb250ZW50IHtcbiAgY29sb3I6IHJnYigzNCwzNCwzNCk7XG59XG5cbi8qIG5vdGUgaW5mbyB0b2RvICovXG5zZWN0aW9uIC5ub3RlLWNhbGxvdXQtbm90ZSB7IFxuICBjb2xvcjogcmdiKDgsIDEwOSwgMjIxKTtcbiAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSg4LCAxMDksIDIyMSwgMC4xKTtcbn1cbi8qIGFic3RyYWN0IHRpcCBoaW50ICovXG5zZWN0aW9uIC5ub3RlLWNhbGxvdXQtYWJzdHJhY3Qge1xuICBjb2xvcjogcmdiKDAsIDE5MSwgMTg4KTtcbiAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgwLCAxOTEsIDE4OCwgMC4xKTtcbn1cbnNlY3Rpb24gLm5vdGUtY2FsbG91dC1zdWNjZXNzIHtcbiAgY29sb3I6IHJnYig4LCAxODUsIDc4KTtcbiAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSg4LCAxODUsIDc4LCAwLjEpO1xufVxuLyogcXVlc3Rpb24gIGhlbHAsIGZhcSwgd2FybmluZywgY2F1dGlvbiwgYXR0ZW50aW9uICovXG5zZWN0aW9uIC5ub3RlLWNhbGxvdXQtcXVlc3Rpb24ge1xuICBjb2xvcjogcmdiKDIzNiwgMTE3LCAwKTtcbiAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgyMzYsIDExNywgMCwgMC4xKTtcbn1cbi8qIGZhaWx1cmUsIGZhaWwsIG1pc3NpbmcsIGRhbmdlciwgZXJyb3IsIGJ1ZyAqL1xuc2VjdGlvbiAubm90ZS1jYWxsb3V0LWZhaWx1cmUge1xuICBjb2xvcjogcmdiKDIzMywgNDksIDcxKTtcbiAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgyMzMsIDQ5LCA3MSwgMC4xKTtcbn1cbnNlY3Rpb24gLm5vdGUtY2FsbG91dC1leGFtcGxlIHtcbiAgY29sb3I6IHJnYigxMjAsIDgyLCAyMzgpO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDEyMCwgODIsIDIzOCwgMC4xKTtcbn1cbnNlY3Rpb24gLm5vdGUtY2FsbG91dC1xdW90ZSB7XG4gIGNvbG9yOiByZ2IoMTU4LCAxNTgsIDE1OCk7XG4gIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMTU4LCAxNTgsIDE1OCwgMC4xKTtcbn1cbi8qIGN1c3RvbSBpY29uIGNhbGxvdXQgKi9cbnNlY3Rpb24gLm5vdGUtY2FsbG91dC1jdXN0b20geyBcbiAgY29sb3I6IHJnYig4LCAxMDksIDIyMSk7XG4gIGJhY2tncm91bmQtY29sb3I6IHJnYmEoOCwgMTA5LCAyMjEsIDAuMSk7XG59XG5cbi8qIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSAqL1xuLyogbWF0aCAqL1xuLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG4uYmxvY2stbWF0aC1zdmcge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICBmbGV4LXdyYXA6IHdyYXA7XG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBtYXJnaW46MjBweCAwcHg7XG4gIG1heC13aWR0aDogMzAwJSAhaW1wb3J0YW50O1xufVxuXG4uYmxvY2stbWF0aC1zdmcgc3ZnIHtcbiAgc2NhbGU6IDAuODU7XG59XG5cbi5ibG9jay1tYXRoLXNlY3Rpb24ge1xuICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIG92ZXJmbG93OiBhdXRvO1xufVxuXG4uaW5saW5lLW1hdGgtc3ZnIHN2ZyB7XG4gIGZvbnQtc2l6ZTogMC44NWVtO1xufVxuXG4vKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gKi9cbi8qIOmrmOS6riAqL1xuLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG4ubm90ZS1oaWdobGlnaHQge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDI1NSwyMDgsMCwgMC40KTtcbn1cblxuLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG4vKiDliJfooajpnIDopoHlvLrliLborr7nva7moLflvI8qL1xuLyogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tICovXG51bCB7XG4gIGxpc3Qtc3R5bGUtdHlwZTogZGlzYztcbn1cblxuLm5vdGUtc3ZnLWljb24ge1xuICBtaW4td2lkdGg6IDI0cHg7XG4gIGhlaWdodDogMjRweDtcbiAgZGlzcGxheTogaW5saW5lLWJsb2NrO1xufVxuXG4ubm90ZS1zdmctaWNvbiBzdmcge1xuICB3aWR0aDogMTAwJTtcbiAgaGVpZ2h0OiAxMDAlO1xufVxuXG4ubm90ZS1lbWJlZC1leGNhbGlkcmF3LWxlZnQge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICB3aWR0aDogMTAwJTtcbn1cblxuLm5vdGUtZW1iZWQtZXhjYWxpZHJhdy1jZW50ZXIge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgd2lkdGg6IDEwMCU7XG59XG5cbi5ub3RlLWVtYmVkLWV4Y2FsaWRyYXctcmlnaHQge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICB3aWR0aDogMTAwJTtcbn1cblxuLm5vdGUtZW1iZWQtZXhjYWxpZHJhdyB7XG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbn1cblxuLm5vdGUtZW1iZWQtZXhjYWxpZHJhdyBwIHtcbiAgbGluZS1oZWlnaHQ6IDAgIWltcG9ydGFudDtcbiAgbWFyZ2luOiAwICFpbXBvcnRhbnQ7XG59XG5cbi8qXG4ubm90ZS1lbWJlZC1leGNhbGlkcmF3IHN2ZyB7XG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDEwMCU7XG59XG4qL1xuXG4ubm90ZS1lbWJlZC1zdmctbGVmdCB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gIGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDtcbiAgd2lkdGg6IDEwMCU7XG59XG5cbi5ub3RlLWVtYmVkLXN2Zy1jZW50ZXIge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgd2lkdGg6IDEwMCU7XG59XG5cbi5ub3RlLWVtYmVkLXN2Zy1yaWdodCB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gIGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG4gIHdpZHRoOiAxMDAlO1xufVxuXG4ubm90ZS1lbWJlZC1zdmcgc3ZnIHtcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogMTAwJTtcbn1cblxuYDsiXX0=