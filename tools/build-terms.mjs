/**
 * assets/js/terms.js から terms.html（レンタル規約ページ）を生成する。
 * 使い方: node tools/build-terms.mjs
 * 規約本文は assets/js/terms.js だけを編集し、このスクリプトで再生成する（二重管理しない）。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const ROOT = resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const TERMS = require(resolve(ROOT, "assets/js/terms.js"));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function renderVariant(v) {
  const sections = v.sections.map((sec) => `
      <section class="terms-sec">
        <h3 class="terms-sec-title">${esc(sec.title)}</h3>
        ${sec.lead ? `<p class="terms-lead">${esc(sec.lead)}</p>` : ""}
        <ul class="terms-list">
${sec.items.map((it) => `          <li>${esc(it)}</li>`).join("\n")}
        </ul>
        ${sec.note ? `<p class="terms-note">※ ${esc(sec.note)}</p>` : ""}
      </section>`).join("\n");
  return `
    <article class="terms-doc" id="${v.key}" aria-labelledby="${v.key}-title">
      <h2 class="terms-title" id="${v.key}-title">${esc(v.title)}</h2>
${sections}
    </article>`;
}

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>レンタル規約 | Atelier Yuka — アトリエユカ</title>
<meta name="description" content="アトリエユカ 衣裳レンタルの規約（国内・国外）。">
<link rel="icon" href="favicon.ico" sizes="any">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Zen+Kaku+Gothic+New:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/style.css?v=10">
<link rel="stylesheet" href="assets/css/style-b.css?v=8">
</head>
<body>
<!-- このファイルは tools/build-terms.mjs が assets/js/terms.js から生成する。直接編集しないこと -->
<a class="skip-link" href="#main">本文へスキップ</a>

<header class="site-header">
  <a class="brand" href="index.html">
    <span class="brand-en" translate="no">Atelier Yuka</span>
    <span class="brand-ja">アトリエユカ — 銀座・ハワイ ウエディングドレスメゾン</span>
  </a>
  <nav class="site-nav" aria-label="ページ内ナビゲーション">
    <ul>
      <li><a href="#domestic">国内レンタル規約</a></li>
      <li><a href="#overseas">国外レンタル規約</a></li>
      <li><a class="nav-reserve" href="index.html#reserve">ご予約</a></li>
    </ul>
  </nav>
</header>

<main id="main" class="terms-page">
  <header class="chapter-head">
    <p class="chapter-label" translate="no">Terms</p>
    <h1 class="chapter-title">レンタル規約</h1>
    <p class="chapter-lede">ご予約のお申し込み時に、ご利用内容に応じた規約への同意をお願いしております。<br>改定: ${esc(TERMS.version)}</p>
  </header>
${renderVariant(TERMS.domestic)}
${renderVariant(TERMS.overseas)}
  <p class="terms-back"><a class="btn btn-ghost" href="index.html#reserve">ご予約フォームへ</a></p>
</main>

<footer class="site-footer">
  <div class="footer-inner">
    <p class="footer-mark" translate="no">Atelier Yuka</p>
    <p class="footer-company">松尾株式会社/MATSUO — 代表取締役 松尾 祐佳</p>
    <p class="footer-note">※ 本ページはサイトリニューアルのデザインサンプルです。</p>
    <p class="footer-copy" translate="no">© 2026 MATSUO Co., Ltd.</p>
  </div>
</footer>
</body>
</html>
`;

writeFileSync(resolve(ROOT, "terms.html"), html);
console.log("terms.html を生成しました");
