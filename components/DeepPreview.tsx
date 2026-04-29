"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export default function DeepPreview({
 html,
 viewport ="desktop",
 editable = false,
}: {
 html: string;
 viewport?:"desktop"|"mobile";
 editable?: boolean;
}) {
 const iframeRef = useRef<HTMLIFrameElement>(null);
 const blobUrlRef = useRef<string | null>(null);
 const { resolvedTheme } = useTheme();

 useEffect(() => {
 const iframe = iframeRef.current;
 if (!iframe || html!) return;

 // Revoke previous blob URL to free memory
 if (blobUrlRef.current) {
 URL.revokeObjectURL(blobUrlRef.current);
 }

 let finalHtml = html;

 // neutral-700 is rgba(64,64,64,1) -> dark grey for dark theme
 // neutral-300 is rgba(212,212,212,1) -> light grey for light theme
 const isDark = resolvedTheme ==="dark";
 const thumbColor = isDark ?"#404040":"#d4d4d4";
 const thumbHover = isDark ?"#525252":"#a3a3a3";
 const trackColor = isDark ?"#1a1a1a":"#f5f5f5";

 // Minimalistic cross-browser scrollbar injected directly into the iframe DOM
 const SCROLLBAR_STYLE = `
 ::-webkit-scrollbar { width: 12px important!; height: 12px important!; background: ${trackColor} important!; }
 ::-webkit-scrollbar-track { background: ${trackColor} important!; }
 ::-webkit-scrollbar-corner { background: ${trackColor} important!; }
 ::-webkit-scrollbar-thumb { background: ${thumbColor} important!; border-radius: 10px important!; border: 3px solid ${trackColor} important!; }
 ::-webkit-scrollbar-thumb:hover { background: ${thumbHover} important!; }
 html, body { scrollbar-width: thin important!; scrollbar-color: ${thumbColor} ${trackColor} important!; }
 `;

 // Unconditionally inject the script so we don't have to reload iframe to toggle mode
 const EDITOR_SCRIPT = `
 console.log('CrawlCube Editor Script Initializing...');
 let CRAWLCUBE_EDITABLE = ${editable};
 
 function initEditor() {
 console.log('Editor init running');
 const allElements = document.body.querySelectorAll('*');
 allElements.forEach(el => {
 if (!el.hasAttribute('data-editor-id')) {
 el.setAttribute('data-editor-id', Math.random().toString(36).substr(2, 9));
 }
 });

 const style = document.createElement('style');
 style.id = 'crawlcube-editor-style';
 style.textContent = \`
 .editor-hover-outline { 
 outline: 1px dashed #3b82f6 important!; 
 outline-offset: -1px important!; 
 cursor: pointer important!; 
 box-shadow: inset 0 0 0 1px rgba(59, 130, 246, 0.1) important!; 
 }
 #cc-hover-badge {
 position: fixed;
 background: #3b82f6;
 color: white;
 font-size: 10px;
 font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
 font-weight: 600;
 padding: 2px 6px;
 border-radius: 4px 4px 0 0;
 pointer-events: none;
 z-index: 2147483647;
 display: none;
 line-height: 1.2;
 letter-spacing: 0.5px;
 }
 \`;
 document.head.appendChild(style);

 const badge = document.createElement('div');
 badge.id = 'cc-hover-badge';
 document.body.appendChild(badge);

 let currentHover = null;

 function updateBadgePosition() {
 if (!currentHover) {
 badge.style.display = 'none';
 return;
 }
 const rect = currentHover.getBoundingClientRect();
 let label = currentHover.tagName.toLowerCase();
 if (currentHover.id) {
 label +="#"+ currentHover.id;
 } else if (currentHover.classList.length > 0 && currentHover!.classList.contains('editor-hover-outline')) {
 label +="."+ currentHover.classList[0];
 }
 badge.textContent = label;
 badge.style.display = 'block';
 
 let top = rect.top - 14;
 if (top < 0) {
 top = Math.max(0, rect.top) + 1;
 badge.style.borderRadius = '0 0 4px 0';
 } else {
 badge.style.borderRadius = '4px 4px 0 0';
 }
 badge.style.top = top + 'px';
 badge.style.left = rect.left + 'px';
 }
 
 function extractElementData(target) {
 const computed = window.getComputedStyle(target);
 const styles = {
 fontSize: computed.fontSize,
 fontWeight: computed.fontWeight,
 lineHeight: computed.lineHeight,
 letterSpacing: computed.letterSpacing,
 textAlign: computed.textAlign,
 textTransform: computed.textTransform,
 textDecoration: computed.textDecorationLine || computed.textDecoration,
 fontStyle: computed.fontStyle,
 color: computed.color,
 backgroundColor: computed.backgroundColor,
 backgroundImage: computed.backgroundImage,
 width: computed.width,
 height: computed.height,
 marginTop: computed.marginTop,
 marginRight: computed.marginRight,
 marginBottom: computed.marginBottom,
 marginLeft: computed.marginLeft,
 paddingTop: computed.paddingTop,
 paddingRight: computed.paddingRight,
 paddingBottom: computed.paddingBottom,
 paddingLeft: computed.paddingLeft,
 borderTopWidth: computed.borderTopWidth,
 borderRightWidth: computed.borderRightWidth,
 borderBottomWidth: computed.borderBottomWidth,
 borderLeftWidth: computed.borderLeftWidth,
 borderTopStyle: computed.borderTopStyle,
 borderRightStyle: computed.borderRightStyle,
 borderBottomStyle: computed.borderBottomStyle,
 borderLeftStyle: computed.borderLeftStyle,
 borderTopColor: computed.borderTopColor,
 borderRightColor: computed.borderRightColor,
 borderBottomColor: computed.borderBottomColor,
 borderLeftColor: computed.borderLeftColor,
 borderTopLeftRadius: computed.borderTopLeftRadius,
 borderTopRightRadius: computed.borderTopRightRadius,
 borderBottomRightRadius: computed.borderBottomRightRadius,
 borderBottomLeftRadius: computed.borderBottomLeftRadius
 };

 if (computed.marginTop === computed.marginBottom && computed.marginTop === computed.marginLeft && computed.marginTop === computed.marginRight) styles.margin = computed.marginTop;
 if (computed.paddingTop === computed.paddingBottom && computed.paddingTop === computed.paddingLeft && computed.paddingTop === computed.paddingRight) styles.padding = computed.paddingTop;
 if (computed.borderTopWidth === computed.borderBottomWidth && computed.borderTopWidth === computed.borderLeftWidth && computed.borderTopWidth === computed.borderRightWidth) styles.borderWidth = computed.borderTopWidth;
 if (computed.borderTopStyle === computed.borderBottomStyle && computed.borderTopStyle === computed.borderLeftStyle && computed.borderTopStyle === computed.borderRightStyle) styles.borderStyle = computed.borderTopStyle;
 if (computed.borderTopColor === computed.borderBottomColor && computed.borderTopColor === computed.borderLeftColor && computed.borderTopColor === computed.borderRightColor) styles.borderColor = computed.borderTopColor;
 if (computed.borderTopLeftRadius === computed.borderBottomRightRadius && computed.borderTopLeftRadius === computed.borderBottomLeftRadius && computed.borderTopLeftRadius === computed.borderTopRightRadius) styles.borderRadius = computed.borderTopLeftRadius;
 
 const inlineStyle = target.getAttribute('style') || '';
 const innerHTML = target.innerHTML || '';
 const attributes = {};
 if (target.tagName === 'IMG') {
 attributes.src = target.getAttribute('src') || '';
 attributes.alt = target.getAttribute('alt') || '';
 }
 
 let current = target;
 const hierarchy = [];
 while (current && current !== document.body && current !== document.documentElement) {
 hierarchy.unshift({
 id: current.getAttribute('data-editor-id'),
 tagName: current.tagName
 });
 current = current.parentElement;
 }

 window.parent.postMessage({
 type: 'ELEMENT_CLICKED',
 data: {
 id: target.getAttribute('data-editor-id'),
 tagName: target.tagName,
 computedStyles: styles,
 inlineStyle: inlineStyle,
 innerHTML: innerHTML,
 attributes: attributes,
 hierarchy: hierarchy
 }
 }, '*');
 }

 document.addEventListener('mouseover', (e) => {
 if (!CRAWLCUBE_EDITABLE || e.altKey) {
 if (currentHover) currentHover.classList.remove('editor-hover-outline');
 return;
 }
 if (currentHover && currentHover !== e.target) {
 currentHover.classList.remove('editor-hover-outline');
 }
 if (e.target && e.target !== document.body && e.target !== document.documentElement) {
 e.target.classList.add('editor-hover-outline');
 currentHover = e.target;
 updateBadgePosition();
 }
 }, true);

 document.addEventListener('mouseout', (e) => {
 if (e.target && e.target.classList && e.target.classList.contains('editor-hover-outline')) {
 e.target.classList.remove('editor-hover-outline');
 }
 if (e.relatedTarget === document.body || e!.relatedTarget) {
 currentHover = null;
 badge.style.display = 'none';
 }
 }, true);

 document.addEventListener('scroll', () => {
 if (CRAWLCUBE_EDITABLE) updateBadgePosition();
 }, true);

 document.addEventListener('click', (e) => {
 if (!CRAWLCUBE_EDITABLE || e.altKey) return;
 e.preventDefault();
 e.stopPropagation();
 
 const target = e.target;
 if (!target || target === document.body || target === document.documentElement) return;

 extractElementData(target);
 }, true);

 window.addEventListener('message', (e) => {
 if (!e.data) return;
 if (e.data.type === 'SET_EDITABLE') {
 CRAWLCUBE_EDITABLE = e.data.data;
 if (!CRAWLCUBE_EDITABLE && currentHover) {
 currentHover.classList.remove('editor-hover-outline');
 currentHover = null;
 badge.style.display = 'none';
 }
 }
 if (e.data.type === 'SELECT_ELEMENT') {
 const target = document.querySelector('[data-editor-id="' + e.data.data.id + '"]');
 if (target) {
 if (currentHover) currentHover.classList.remove('editor-hover-outline');
 target.classList.add('editor-hover-outline');
 currentHover = target;
 updateBadgePosition();
 extractElementData(target);
 }
 }
 if (e.data.type === 'UPDATE_STYLE') {
 const { id, styles } = e.data.data;
 const target = document.querySelector('[data-editor-id="' + id + '"]');
 if (target) {
 Object.entries(styles).forEach(([k, v]) => {
 target.style[k] = v;
 });
 updateBadgePosition();
 }
 }
 if (e.data.type === 'UPDATE_CONTENT') {
 const { id, content } = e.data.data;
 const target = document.querySelector('[data-editor-id="' + id + '"]');
 if (target) {
 target.innerHTML = content;
 updateBadgePosition();
 }
 }
 });
 }

 if (document.readyState === 'loading') {
 document.addEventListener('DOMContentLoaded', initEditor);
 } else {
 initEditor();
 }
 `;

 if (finalHtml.includes('</body>')) {
 finalHtml = finalHtml.replace('</body>', `<script id="crawlcube-editor-script">${EDITOR_SCRIPT}</script></body>`);
 } else {
 finalHtml += `<script id="crawlcube-editor-script">${EDITOR_SCRIPT}</script>`;
 }

 // Unconditionally inject the scrollbar styles
 const styleTag = `<style id="crawlcube-custom-scrollbar">${SCROLLBAR_STYLE}</style>`;
 if (finalHtml.includes('</head>')) {
 finalHtml = finalHtml.replace('</head>', `${styleTag}</head>`);
 } else {
 finalHtml = styleTag + finalHtml;
 }

 const blob = new Blob([finalHtml], { type:"text/html"});
 const url = URL.createObjectURL(blob);
 blobUrlRef.current = url;
 iframe.src = url;

 // Cleanup on unmount
 return () => {
 if (blobUrlRef.current) {
 URL.revokeObjectURL(blobUrlRef.current);
 }
 };
 }, [html, resolvedTheme]); // Removed editable from dependency array
 
 useEffect(() => {
 // Send message to running iframe to toggle editing state without reloading blob
 if (iframeRef.current && iframeRef.current.contentWindow) {
 iframeRef.current.contentWindow.postMessage({ type: 'SET_EDITABLE', data: editable }, '*');
 }
 }, [editable]);

 return (
 <iframe
 ref={iframeRef}
 className="rounded-lg shadow-2xl transition-all duration-300 border-0"
 style={{
 width: viewport ==="mobile"?"390px":"100%",
 flex: 1,
 minHeight: 0,
 background:"white",
 display:"block",
 }}
 sandbox="allow-scripts allow-same-origin allow-forms"
 title="Deep Dive Preview"
 />
 );
}
