/**
 * 絞り込み用のカスタムデータ（メタオブジェクト・商品メタフィールド）の定義をストアに作る。
 * 何度実行しても同じ状態になる（既にあるものは作らず、値だけ上書きする）。
 *
 *   使い方: node tools/shopify-custom-data.mjs <store>.myshopify.com
 *   例:     node tools/shopify-custom-data.mjs atelieryuka-dev.myshopify.com
 *
 * 前提: shopify store auth --store <store> --scopes
 *   read_products,write_products,read_metaobject_definitions,write_metaobject_definitions,read_metaobjects,write_metaobjects
 *
 * 作るもの
 * - メタオブジェクト「シルエット」(silhouette) … 名前・イラスト・並び順。質問形式の検索（フェーズ6）でも使う
 * - メタオブジェクト「ドレスの色」(dress_color) … 名前・色見本・並び順（絞り込みはこの順に並ぶ）
 * - 商品メタフィールド custom.silhouette / custom.color（上の2つを参照するリスト）、custom.line（ライン名）、
 *   custom.rental_price（試着を除いたレンタル料金の最安値。試着 ¥5,500 のバリエーションがどの商品にもあり、
 *   Shopify 標準の価格では絞り込み・並び替えができないため）
 *
 * 名前はメタオブジェクトに1回だけ持つので、翻訳（Translate & Adapt / T Lab）も1回で全商品に効く。
 */
import { pathToFileURL } from "node:url";
import { assertNoUserErrors, gql } from "./shopify-admin.mjs";

let STORE = "";

// サンプルサイト（assets/js/data.js）の色見本＋本番のタグ・写真にあった色
export const COLORS = [
  { handle: "white", name: "ホワイト", swatch: "#F7F5F1" },
  { handle: "ivory", name: "アイボリー", swatch: "#EFE6D5" },
  { handle: "pink", name: "ピンク", swatch: "#DE5C72" },
  { handle: "red", name: "レッド", swatch: "#8E2A3C" },
  { handle: "yellow", name: "イエロー", swatch: "#DFA61F" },
  { handle: "orange", name: "オレンジ", swatch: "#D2692A" },
  { handle: "gold", name: "ゴールド", swatch: "#B49B57" },
  { handle: "green", name: "グリーン", swatch: "#4F7A6D" },
  { handle: "blue", name: "ブルー", swatch: "#6C9BD2" },
  { handle: "navy", name: "ネイビー", swatch: "#253453" },
  { handle: "purple", name: "パープル", swatch: "#8C7AA9" },
  { handle: "brown", name: "ブラウン", swatch: "#8A7059" },
  { handle: "silver", name: "シルバー", swatch: "#C9CACC" },
  { handle: "gray", name: "グレー", swatch: "#A9A6A4" },
  { handle: "black", name: "ブラック", swatch: "#2B2724" },
];

// atelieryuka.jp のサーチドレス（Aライン・プリンセス/ボリューム）＋一般的なライン
export const SILHOUETTES = [
  { handle: "a-line", name: "Aライン" },
  { handle: "princess", name: "プリンセス" },
  { handle: "bell", name: "ベルライン" },
  { handle: "mermaid", name: "マーメイド" },
  { handle: "slender", name: "スレンダー" },
  { handle: "empire", name: "エンパイア" },
];

// 本番のタグ・販売元にあるライン名
export const LINES = [
  "Atelier Yuka",
  "VICTRIA FRANCEZKA",
  "L'ATELIER MARIAGE",
  "Ballerina for Brides",
  "AMANTHA BRIDE",
  "NAYBY",
];

const METAOBJECT_DEFINITIONS = [
  {
    type: "silhouette",
    name: "シルエット",
    description: "ドレスのシルエット。絞り込みと質問形式の検索で使う",
    fieldDefinitions: [
      { key: "name", name: "名前", type: "single_line_text_field", required: true },
      {
        key: "illustration",
        name: "イラスト",
        type: "file_reference",
        validations: [{ name: "file_type_options", value: JSON.stringify(["Image"]) }],
      },
      { key: "position", name: "並び順", type: "number_integer", description: "絞り込みで並べる順（小さい順）" },
    ],
  },
  {
    type: "dress_color",
    name: "ドレスの色",
    description: "絞り込みの色。色見本はフィルターの丸に使う",
    fieldDefinitions: [
      { key: "name", name: "名前", type: "single_line_text_field", required: true },
      { key: "swatch", name: "色見本", type: "color", required: true },
      { key: "position", name: "並び順", type: "number_integer", description: "絞り込みで並べる順（小さい順）" },
    ],
  },
];

function existingMetaobjectDefinitions() {
  const data = gql(
    STORE,
    `{ metaobjectDefinitions(first: 50) { nodes { id type fieldDefinitions { key } } } }`,
  );
  return new Map(
    data.metaobjectDefinitions.nodes.map((d) => [d.type, { id: d.id, keys: d.fieldDefinitions.map((f) => f.key) }]),
  );
}

// 作成済みの定義に、あとから足した項目（並び順など）を追加する
function addMissingFields(def, current) {
  const missing = def.fieldDefinitions.filter((f) => !current.keys.includes(f.key));
  if (!missing.length) return;
  const data = gql(
    STORE,
    `mutation($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
      metaobjectDefinitionUpdate(id: $id, definition: $definition) {
        metaobjectDefinition { id }
        userErrors { field message code }
      }
    }`,
    { id: current.id, definition: { fieldDefinitions: missing.map((f) => ({ create: f })) } },
    { mutation: true },
  );
  assertNoUserErrors(`metaobjectDefinitionUpdate(${def.type})`, data.metaobjectDefinitionUpdate);
  console.log(`＋メタオブジェクト定義 ${def.type} に項目 ${missing.map((f) => f.key).join(", ")} を追加`);
}

function ensureMetaobjectDefinition(def, existing) {
  if (existing.has(def.type)) {
    console.log(`・メタオブジェクト定義 ${def.type} は作成済み`);
    addMissingFields(def, existing.get(def.type));
    return existing.get(def.type).id;
  }
  const data = gql(
    STORE,
    `mutation($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) {
        metaobjectDefinition { id type }
        userErrors { field message code }
      }
    }`,
    {
      definition: {
        ...def,
        displayNameKey: "name",
        access: { storefront: "PUBLIC_READ" },
        capabilities: { translatable: { enabled: true } },
      },
    },
    { mutation: true },
  );
  const payload = assertNoUserErrors(`metaobjectDefinitionCreate(${def.type})`, data.metaobjectDefinitionCreate);
  console.log(`＋メタオブジェクト定義 ${def.type} を作成`);
  return payload.metaobjectDefinition.id;
}

function upsertEntries(type, entries, toFields) {
  entries.forEach((entry, i) => {
    const data = gql(
      STORE,
      `mutation($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
        metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
          metaobject { handle }
          userErrors { field message code }
        }
      }`,
      { handle: { type, handle: entry.handle }, metaobject: { fields: toFields(entry, i) } },
      { mutation: true },
    );
    assertNoUserErrors(`metaobjectUpsert(${type}/${entry.handle})`, data.metaobjectUpsert);
  });
  console.log(`・${type} の項目 ${entries.length} 件を登録（上書き）`);
}

function existingProductMetafieldKeys() {
  const data = gql(
    STORE,
    `{ metafieldDefinitions(first: 100, ownerType: PRODUCT, namespace: "custom") { nodes { key } } }`,
  );
  return new Set(data.metafieldDefinitions.nodes.map((d) => d.key));
}

function ensureProductMetafield(def, existingKeys) {
  if (existingKeys.has(def.key)) {
    console.log(`・商品メタフィールド custom.${def.key} は作成済み`);
    return;
  }
  const data = gql(
    STORE,
    `mutation($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition { id }
        userErrors { field message code }
      }
    }`,
    {
      definition: {
        ...def,
        namespace: "custom",
        ownerType: "PRODUCT",
        access: { storefront: "PUBLIC_READ" },
        pin: true,
      },
    },
    { mutation: true },
  );
  assertNoUserErrors(`metafieldDefinitionCreate(custom.${def.key})`, data.metafieldDefinitionCreate);
  console.log(`＋商品メタフィールド custom.${def.key} を作成`);
}

function main() {
  STORE = process.argv[2];
  if (!STORE || !STORE.endsWith(".myshopify.com")) {
    console.error("使い方: node tools/shopify-custom-data.mjs <store>.myshopify.com");
    process.exit(1);
  }
  console.log(`対象ストア: ${STORE}`);
  const existing = existingMetaobjectDefinitions();
  const ids = Object.fromEntries(
    METAOBJECT_DEFINITIONS.map((def) => [def.type, ensureMetaobjectDefinition(def, existing)]),
  );

  // 並び順は配列の順（10刻みにして、管理画面で間に差し込めるようにする）
  const position = (i) => String((i + 1) * 10);
  upsertEntries("silhouette", SILHOUETTES, (s, i) => [
    { key: "name", value: s.name },
    { key: "position", value: position(i) },
  ]);
  upsertEntries("dress_color", COLORS, (c, i) => [
    { key: "name", value: c.name },
    { key: "swatch", value: c.swatch },
    { key: "position", value: position(i) },
  ]);

  const keys = existingProductMetafieldKeys();
  ensureProductMetafield(
    {
      key: "silhouette",
      name: "シルエット",
      description: "絞り込み・質問形式の検索で使う。複数選べる",
      type: "list.metaobject_reference",
      validations: [{ name: "metaobject_definition_id", value: ids.silhouette }],
    },
    keys,
  );
  ensureProductMetafield(
    {
      key: "color",
      name: "色",
      description: "絞り込みで使う。複数色のドレスは複数選ぶ",
      type: "list.metaobject_reference",
      validations: [{ name: "metaobject_definition_id", value: ids.dress_color }],
    },
    keys,
  );
  ensureProductMetafield(
    {
      key: "line",
      name: "ライン",
      description: "ブランドのライン名",
      type: "single_line_text_field",
      validations: [{ name: "choices", value: JSON.stringify(LINES) }],
    },
    keys,
  );
  ensureProductMetafield(
    {
      key: "rental_price",
      name: "レンタル料金",
      description: "試着を除いたレンタル料金の最安値（円）。一覧の価格表示と絞り込みに使う。tools/shopify-set-attributes.mjs がバリエーションから計算して入れる",
      type: "number_integer",
    },
    keys,
  );
  console.log("完了");
}

// 値（COLORS など）は移行スクリプトからも読むので、直接実行されたときだけ動かす
if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
