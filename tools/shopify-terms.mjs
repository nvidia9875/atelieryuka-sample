/**
 * レンタル規約のページ（/pages/terms）の本文を theme/assets/terms.js から作り、ストアのページに入れる。
 * 予約フォームの同意欄も同じ terms.js を読むので、規約を変えるときは terms.js を直してこれを流す（二重管理しない）。
 * サンプルの tools/build-terms.mjs（terms.html を生成）と同じ組み。
 *
 *   使い方: node tools/shopify-terms.mjs <store>.myshopify.com [--dry-run]
 * 前提: shopify store auth の scopes に read_online_store_pages,write_online_store_pages
 */
import { readFileSync } from "node:fs";
import { assertNoUserErrors, gql } from "./shopify-admin.mjs";

const STORE = process.argv[2];
const DRY_RUN = process.argv.includes("--dry-run");
if (!STORE || !STORE.endsWith(".myshopify.com")) {
  console.error("使い方: node tools/shopify-terms.mjs <store>.myshopify.com [--dry-run]");
  process.exit(1);
}

const source = readFileSync(new URL("../theme/assets/terms.js", import.meta.url), "utf8").replace("const AY_TERMS", "globalThis.AY_TERMS");
new Function("module", source)(undefined);
const TERMS = globalThis.AY_TERMS;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function renderVariant(v) {
  const sections = v.sections.map((sec) => [
    `<section class="terms-sec">`,
    `<h3 class="terms-sec-title">${esc(sec.title)}</h3>`,
    sec.lead ? `<p class="terms-lead">${esc(sec.lead)}</p>` : "",
    `<ul class="terms-list">${sec.items.map((it) => `<li>${esc(it)}</li>`).join("")}</ul>`,
    sec.note ? `<p class="terms-note">※ ${esc(sec.note)}</p>` : "",
    `</section>`,
  ].filter(Boolean).join("\n"));
  return [
    `<article class="terms-doc" id="${v.key}" aria-labelledby="${v.key}-title">`,
    `<h2 class="terms-title" id="${v.key}-title">${esc(v.title)}</h2>`,
    ...sections,
    `</article>`,
  ].join("\n");
}

const body = [
  `<p class="terms-intro">ご予約のお申し込み時に、ご利用内容に応じた規約への同意をお願いしております。<br>改定: ${esc(TERMS.version)}</p>`,
  `<nav class="terms-toc" aria-label="規約の種類"><a href="#domestic">${esc(TERMS.domestic.title)}</a><a href="#overseas">${esc(TERMS.overseas.title)}</a></nav>`,
  renderVariant(TERMS.domestic),
  renderVariant(TERMS.overseas),
].join("\n");

const found = gql(STORE, `query($q: String!) { pages(first: 5, query: $q) { nodes { id handle } } }`, { q: "handle:terms" })
  .pages.nodes.find((p) => p.handle === "terms");
console.log(`対象ストア: ${STORE}${DRY_RUN ? "（ドライラン）" : ""} / 規約 ${TERMS.version}（本文 ${body.length} 文字）`);
if (DRY_RUN) process.exit(0);

const page = { title: "レンタル規約", body, templateSuffix: "document", isPublished: true };
const data = found
  ? gql(STORE, `mutation($id: ID!, $page: PageUpdateInput!) { pageUpdate(id: $id, page: $page) { page { id } userErrors { field message code } } }`, { id: found.id, page }, { mutation: true })
  : gql(STORE, `mutation($page: PageCreateInput!) { pageCreate(page: $page) { page { id } userErrors { field message code } } }`, { page: { ...page, handle: "terms" } }, { mutation: true });
assertNoUserErrors(found ? "pageUpdate(terms)" : "pageCreate(terms)", found ? data.pageUpdate : data.pageCreate);
console.log(found ? "・/pages/terms の本文を更新" : "＋/pages/terms を作成");
