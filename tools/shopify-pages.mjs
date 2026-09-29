/**
 * テーマのテンプレートで作るページ（予約・規約など）をストアに作る。
 * 既にあるページ（同じハンドル）は作らず、テンプレートの割り当てだけ揃える。
 *
 *   使い方: node tools/shopify-pages.mjs <store>.myshopify.com
 *
 * 前提: shopify store auth の scopes に read_online_store_pages,write_online_store_pages
 * 本文はテーマ側で出すので空。先方が管理画面で本文を書き足してもテンプレートの表示は変わらない。
 */
import { assertNoUserErrors, gql } from "./shopify-admin.mjs";

const STORE = process.argv[2];
if (!STORE || !STORE.endsWith(".myshopify.com")) {
  console.error("使い方: node tools/shopify-pages.mjs <store>.myshopify.com");
  process.exit(1);
}

// handle は先方に共有する URL（/pages/…）になるので変えない
const PAGES = [
  { handle: "reserve", title: "ご予約", templateSuffix: "reserve" },
  // with a WISH（業者さま向け）。/withawish と withawish.jp からここへ転送する（フェーズ8）
  { handle: "withawish", title: "with a WISH", templateSuffix: "withawish" },
  { handle: "mini-photo", title: "ミニウエディングフォト", templateSuffix: "mini-photo" },
  { handle: "elieca", title: "Elieca セミオーダー", templateSuffix: "elieca" },
  // こだわりページ。先方の文章が届くまで非公開（published: false）
  { handle: "story", title: "アトリエユカのこだわり", templateSuffix: "story", published: false },
  // レンタル規約（/pages/terms）は本文を terms.js から作るので tools/shopify-terms.mjs で作る
];

function findPage(handle) {
  const data = gql(
    STORE,
    `query($q: String!) { pages(first: 5, query: $q) { nodes { id handle templateSuffix isPublished } } }`,
    { q: `handle:${handle}` },
  );
  return data.pages.nodes.find((p) => p.handle === handle) ?? null;
}

for (const page of PAGES) {
  const existing = findPage(page.handle);
  if (!existing) {
    const data = gql(
      STORE,
      `mutation($page: PageCreateInput!) {
        pageCreate(page: $page) { page { id handle } userErrors { field message code } }
      }`,
      { page: { handle: page.handle, title: page.title, templateSuffix: page.templateSuffix, body: "", isPublished: page.published !== false } },
      { mutation: true },
    );
    assertNoUserErrors(`pageCreate(${page.handle})`, data.pageCreate);
    console.log(`＋/pages/${page.handle}（${page.title}）を作成${page.published === false ? "（非公開）" : ""}`);
    continue;
  }
  const wantPublished = page.published !== false;
  if (existing.templateSuffix !== page.templateSuffix || existing.isPublished !== wantPublished) {
    const data = gql(
      STORE,
      `mutation($id: ID!, $page: PageUpdateInput!) {
        pageUpdate(id: $id, page: $page) { page { id } userErrors { field message code } }
      }`,
      { id: existing.id, page: { templateSuffix: page.templateSuffix, isPublished: wantPublished } },
      { mutation: true },
    );
    assertNoUserErrors(`pageUpdate(${page.handle})`, data.pageUpdate);
    console.log(`・/pages/${page.handle} のテンプレートを ${page.templateSuffix}、${wantPublished ? "公開" : "非公開"}にした`);
  } else {
    console.log(`・/pages/${page.handle} は作成済み`);
  }
}
