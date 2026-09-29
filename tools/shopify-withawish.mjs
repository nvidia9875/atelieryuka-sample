/**
 * with a WISH の125型をストアに入れる。
 * - メタオブジェクト定義「with a WISH の衣裳」(ww_tuxedo) を作る
 * - 商品写真（158枚）・ヒーロー・紹介の写真と、デジタルカタログ（50面・サムネイル・PDF）を「ファイル」に上げる（名前は ww- で始める）
 * - 125型をメタオブジェクトとして登録（ハンドル＝品番。何度流しても上書きになる）
 *
 *   使い方: node tools/shopify-withawish.mjs <store>.myshopify.com [--dry-run]
 *
 * データの正は withawish/assets/data.js（サンプル。withawish.jp の実データ 2026-07-18 取得）。
 * 登録後は管理画面「コンテンツ > メタオブジェクト」で先方が追加・修正できる。
 * 前提: shopify store auth の scopes に read/write_metaobject_definitions, read/write_metaobjects, read/write_files
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { assertNoUserErrors, gql, listFiles, uploadFiles } from "./shopify-admin.mjs";

const STORE = process.argv[2];
const DRY_RUN = process.argv.includes("--dry-run");
if (!STORE || !STORE.endsWith(".myshopify.com")) {
  console.error("使い方: node tools/shopify-withawish.mjs <store>.myshopify.com [--dry-run]");
  process.exit(1);
}

const ROOT = new URL("../withawish/assets/", import.meta.url).pathname;
const TYPE = "ww_tuxedo";
const PREFIX = "ww-";
const UPLOAD_BATCH = 20;

function loadSampleData() {
  // data.js はブラウザ用（document.currentScript を見る）なので、最小限の document を渡して読む
  const source = readFileSync(join(ROOT, "data.js"), "utf8").replace("const WW", "globalThis.WW");
  new Function("document", source)({ currentScript: null });
  return globalThis.WW;
}

const DEFINITION = {
  type: TYPE,
  name: "with a WISH の衣裳",
  description: "with a WISH（業者さま向け）の一覧・比較・詳細に出る衣裳。ハンドル＝品番",
  displayNameKey: "code",
  access: { storefront: "PUBLIC_READ" },
  fieldDefinitions: [
    { key: "code", name: "品番", type: "single_line_text_field", required: true },
    { key: "garment_type", name: "種類（TUXEDO など）", type: "single_line_text_field", required: true },
    { key: "color_group", name: "色の系統（1〜9）", type: "number_integer", description: "1 ブラック系／2 ホワイト系／3 ベージュ・ゴールド系／4 ピンク・パープル系／5 ブルー・ネイビー系／6 グレー・シルバー系／7 グリーン・カーキ系／8 ブラウン・レッド系／9 イエロー・オレンジ系" },
    { key: "color_name", name: "色名", type: "single_line_text_field" },
    { key: "line", name: "ライン（0〜5）", type: "number_integer", description: "0 指定なし／1 BASIC／2 NEW REGULAR／3 NATURAL／4 MASA／5 J-LINE" },
    { key: "size_range", name: "サイズ展開", type: "single_line_text_field", description: "例: Y～O体 3～9号（体型と号数で絞り込みに使う）" },
    { key: "material", name: "素材", type: "single_line_text_field" },
    { key: "luster", name: "光沢（0〜3）", type: "number_integer", description: "0 なし〜3 強い" },
    { key: "other", name: "付属・その他", type: "multi_line_text_field" },
    { key: "caution", name: "注意事項", type: "multi_line_text_field" },
    { key: "description", name: "説明", type: "multi_line_text_field" },
    { key: "brand_text", name: "生地ブランドの紹介", type: "multi_line_text_field" },
    { key: "images", name: "写真（1枚目がメイン）", type: "list.file_reference", validations: [{ name: "file_type_options", value: JSON.stringify(["Image"]) }] },
    { key: "featured", name: "おすすめに出す", type: "boolean" },
    { key: "position", name: "並び順", type: "number_integer" },
  ],
};

function ensureDefinition() {
  const data = gql(STORE, `{ metaobjectDefinitions(first: 50) { nodes { id type } } }`);
  if (data.metaobjectDefinitions.nodes.some((d) => d.type === TYPE)) {
    console.log(`・メタオブジェクト定義 ${TYPE} は作成済み`);
    return;
  }
  const created = gql(
    STORE,
    `mutation($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) { metaobjectDefinition { id } userErrors { field message code } }
    }`,
    { definition: DEFINITION },
    { mutation: true },
  );
  assertNoUserErrors(`metaobjectDefinitionCreate(${TYPE})`, created.metaobjectDefinitionCreate);
  console.log(`＋メタオブジェクト定義 ${TYPE} を作成`);
}

/** 上げるファイルの一覧（商品写真＋ヒーロー・紹介） */
function localImages(products) {
  const list = [];
  for (const p of products) {
    for (const extra of [null, ...(p.extras ?? [])]) {
      const base = p.code + (extra ? "_" + extra : "");
      list.push({ path: join(ROOT, "img/p", base + ".jpg"), filename: `${PREFIX}${base}.jpg`, alt: `with a WISH ${p.code} ${p.colorName}` });
    }
  }
  for (const dir of ["hero", "about"]) {
    for (const name of readdirSync(join(ROOT, "img", dir)).filter((n) => n.endsWith(".jpg"))) {
      list.push({ path: join(ROOT, "img", dir, name), filename: `${PREFIX}${dir}-${name}`, alt: "" });
    }
  }
  list.push({ path: join(ROOT, "img/og-cover.jpg"), filename: `${PREFIX}og-cover.jpg`, alt: "" });
  const images = list.map((it) => ({ ...it, mimeType: "image/jpeg", contentType: "IMAGE" }));

  // デジタルカタログ（見開き50面・サムネイル・配布用PDF）。テーマは ww-catalog-page-01.webp … を file_url で参照する
  const catalog = [];
  for (const [dir, kind] of [["pages", "page"], ["thumbs", "thumb"]]) {
    for (const name of readdirSync(join(ROOT, "catalog", dir)).filter((n) => n.endsWith(".webp")).sort()) {
      catalog.push({ path: join(ROOT, "catalog", dir, name), filename: `${PREFIX}catalog-${kind}-${name}`, alt: "", mimeType: "image/webp", contentType: "IMAGE" });
    }
  }
  catalog.push({ path: join(ROOT, "catalog/withawish-catalog-2026.pdf"), filename: `${PREFIX}catalog-2026.pdf`, alt: "", mimeType: "application/pdf", contentType: "FILE" });
  return [...images, ...catalog];
}

function uploadMissing(images) {
  const existing = listFiles(STORE, PREFIX);
  const missing = images.filter((it) => !existing.has(it.filename));
  console.log(`ファイル ${images.length} 件（アップロード済み ${images.length - missing.length}・これから ${missing.length}）`);
  if (DRY_RUN) return existing;
  for (let i = 0; i < missing.length; i += UPLOAD_BATCH) {
    const uploaded = uploadFiles(STORE, missing.slice(i, i + UPLOAD_BATCH));
    uploaded.forEach((id, name) => existing.set(name, id));
    process.stdout.write(`\rアップロード ${Math.min(i + UPLOAD_BATCH, missing.length)}/${missing.length}`);
  }
  if (missing.length) process.stdout.write("\n");
  return existing;
}

function fieldsFor(p, index, fileIds) {
  const imageIds = [null, ...(p.extras ?? [])].map((extra) => {
    const name = `${PREFIX}${p.code}${extra ? "_" + extra : ""}.jpg`;
    if (!fileIds.has(name)) throw new Error(`${name} がファイルにありません`);
    return fileIds.get(name);
  });
  const text = (v) => (v == null ? "" : String(v));
  return [
    { key: "code", value: p.code },
    { key: "garment_type", value: p.type },
    { key: "color_group", value: text(p.color) },
    { key: "color_name", value: text(p.colorName) },
    { key: "line", value: text(p.line) },
    { key: "size_range", value: text(p.size) },
    { key: "material", value: text(p.material) },
    { key: "luster", value: text(p.luster ?? 0) },
    { key: "other", value: text(p.other) },
    { key: "caution", value: text(p.caution) },
    { key: "description", value: text(p.desc) },
    { key: "brand_text", value: text(p.brand) },
    { key: "images", value: JSON.stringify(imageIds) },
    { key: "featured", value: p.featured ? "true" : "false" },
    { key: "position", value: String((index + 1) * 10) },
  ].filter((f) => f.value !== "");
}

function upsertProducts(products, fileIds) {
  products.forEach((p, i) => {
    const data = gql(
      STORE,
      `mutation($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
        metaobjectUpsert(handle: $handle, metaobject: $metaobject) { metaobject { handle } userErrors { field message code } }
      }`,
      { handle: { type: TYPE, handle: p.code }, metaobject: { fields: fieldsFor(p, i, fileIds) } },
      { mutation: true },
    );
    assertNoUserErrors(`metaobjectUpsert(${p.code})`, data.metaobjectUpsert);
    process.stdout.write(`\r登録 ${i + 1}/${products.length}`);
  });
  process.stdout.write("\n");
}

function main() {
  const WW = loadSampleData();
  const products = WW.products;
  console.log(`対象ストア: ${STORE}${DRY_RUN ? "（ドライラン）" : ""} / ${products.length} 型`);
  if (!DRY_RUN) ensureDefinition();
  const fileIds = uploadMissing(localImages(products));
  if (DRY_RUN) return;
  upsertProducts(products, fileIds);
  console.log("完了");
}

main();
