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
`

export default {name: '默认', className: 'obsidian-light', desc: '默认主题', author: 'SunBooshi', css:css};