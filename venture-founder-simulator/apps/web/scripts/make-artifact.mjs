// Turns the Vite build into a single page in the shape claude.ai artifacts expect:
// no doctype/html/head/body of our own (the host wraps it), title and styles first,
// React from cdnjs (pinned), then the app inlined. Also writes preview.html for local testing.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const js = readFileSync(join(dist, "app.js"), "utf8").replace(/<\/script/gi, "<\\/script");
const css = readFileSync(join(dist, "app.css"), "utf8").replace(/<\/style/gi, "<\\/style");

const REACT = "https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js";
const REACT_DOM = "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js";
const FONTS = "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap";

const page = `<title>Venture Founder Simulator</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>${css}</style>
<div id="root"><noscript>The Venture Founder Simulator needs JavaScript.</noscript></div>
<script src="${REACT}"></script>
<script src="${REACT_DOM}"></script>
<script>${js}</script>
`;

writeFileSync(join(dist, "venture-founder-simulator.html"), page);
writeFileSync(
  join(dist, "preview.html"),
  `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>html,body{height:100%}body{margin:0}</style></head><body>${page}</body></html>`,
);
const kb = (Buffer.byteLength(page) / 1024).toFixed(0);
console.log(`artifact page written: dist/venture-founder-simulator.html (${kb} KB)`);
