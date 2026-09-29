/**
 * ヘッダー（main-menu）とフッター（footer）のメニューを、ここに書いた内容にそろえる。
 * 本番へ移すとき（フェーズ8）も同じ内容を流せるように、メニューをコードで持つ。
 *
 *   使い方: node tools/shopify-menus.mjs <store>.myshopify.com [--write]
 *   --write を付けないと、今のメニューと入れる予定の内容を並べて出すだけ（ドライラン）
 *
 * - 「コレクション」は /collections/all ではなくウエディングドレスのコレクションへ
 *   （/collections/all には種類が空の「裏決済」用の商品も出るため）
 * - フッターの「プライバシーの選択」は Shopify が自動で足すページなので、今あるものを残す
 */
import { assertNoUserErrors, gql } from "./shopify-admin.mjs";

const STORE = process.argv[2];
const WRITE = process.argv.includes("--write");

if (!STORE || !STORE.endsWith(".myshopify.com")) {
  console.error("使い方: node tools/shopify-menus.mjs <store>.myshopify.com [--write]");
  process.exit(1);
}

const link = (title, url) => ({ title, type: "HTTP", url });
const collection = (title, handle) => ({ title, type: "COLLECTION", collectionHandle: handle });

const MENUS = {
  "main-menu": {
    title: "Main menu",
    items: [
      link("メゾン", "/#maison"),
      collection("コレクション", "ウエディングドレス"),
      link("カタログ", "/#catalogue"),
      link("ご利用の流れ", "/#flow"),
      link("料金", "/#pricing"),
      link("フォトジャーニー", "/#journey"),
      link("ミニフォト", "/pages/mini-photo"),
      link("サロン", "/#salon"),
      link("FAQ", "/#faq"),
    ],
  },
  footer: {
    title: "Footer menu",
    items: [
      link("レンタル規約", "/pages/terms"),
      link("クリーニング・メンテナンス費", "/#care"),
      link("FAQ", "/#faq"),
    ],
    keepTypes: ["PAGE"], // 「プライバシーの選択」など Shopify が足したページは残す
  },
};

function fetchMenus() {
  const data = gql(
    STORE,
    `{ menus(first: 20) { nodes { id handle title items { title type url resourceId } } } }`,
  );
  return new Map(data.menus.nodes.map((m) => [m.handle, m]));
}

function collectionId(handle) {
  const data = gql(
    STORE,
    `query($q: String!) { collections(first: 5, query: $q) { nodes { id handle } } }`,
    { q: `handle:${handle}` },
  );
  const found = data.collections.nodes.find((c) => c.handle === handle);
  if (!found) throw new Error(`コレクション「${handle}」がありません（先に tools/shopify-dev-collections.mjs）`);
  return found.id;
}

function toInput(item) {
  if (item.type === "COLLECTION") {
    return { title: item.title, type: "COLLECTION", resourceId: collectionId(item.collectionHandle), items: [] };
  }
  if (item.type === "PAGE") {
    return { title: item.title, type: "PAGE", resourceId: item.resourceId, items: [] };
  }
  return { title: item.title, type: item.type, url: item.url, items: [] };
}

function main() {
  console.log(`対象ストア: ${STORE}（${WRITE ? "書き込み" : "ドライラン"}）`);
  const existing = fetchMenus();

  for (const [handle, menu] of Object.entries(MENUS)) {
    const current = existing.get(handle);
    if (!current) throw new Error(`メニュー「${handle}」がありません`);
    const kept = current.items.filter((i) => (menu.keepTypes ?? []).includes(i.type));
    const items = [...menu.items, ...kept].map(toInput);

    console.log(`\n■ ${handle}`);
    console.log("  今:  " + current.items.map((i) => `${i.title}(${i.url})`).join(" / "));
    console.log("  後:  " + [...menu.items, ...kept].map((i) => `${i.title}(${i.url ?? i.collectionHandle})`).join(" / "));
    if (!WRITE) continue;

    const data = gql(
      STORE,
      `mutation($id: ID!, $title: String!, $handle: String!, $items: [MenuItemUpdateInput!]!) {
        menuUpdate(id: $id, title: $title, handle: $handle, items: $items) {
          menu { handle items { title url } }
          userErrors { field message }
        }
      }`,
      { id: current.id, title: menu.title, handle, items },
      { mutation: true },
    );
    assertNoUserErrors(`menuUpdate(${handle})`, data.menuUpdate);
    console.log("  → 更新しました");
  }
  if (!WRITE) console.log("\nドライランなので書き込んでいません。--write を付けると書き込みます");
}

main();
