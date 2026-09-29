/**
 * 商品の絞り込み用メタフィールド（custom.silhouette / custom.color / custom.line）に値を入れる。
 * 先に tools/shopify-custom-data.mjs で定義を作っておくこと。
 *
 *   使い方: node tools/shopify-set-attributes.mjs <store>.myshopify.com [--write]
 *   --write を付けないと、書き込まずに入れる予定の値の集計だけ出す（ドライラン）
 *
 * 値の出どころ
 * - ドレス: data/dress-attributes.csv（写真から仮付け → 先方確認）。シルエットと色はここだけが正
 * - それ以外（タキシードなど）の色: 商品タグ（WHITE, BLUE, lavender …）
 * - ライン: 商品タグ（VICTRIA FRANCEZKA …）→ 販売元 の順で拾う
 * - レンタル料金: バリエーションのうち「試着」と ¥0 を除いた最安値（該当なしの商品には入れず、前に入れた値は消す）
 *   ¥0 は小物（メンズ小物・ドレス小物）に多い。入れると絞り込みに「¥0」が出るので外す
 *
 * 既存の「Aライン」タグはウエディングドレスのほぼ全件に付いていて、シルエットの区別に使えないので読まない。
 */
import { readFileSync } from "node:fs";
import { assertNoUserErrors, gql } from "./shopify-admin.mjs";
import { COLORS, LINES, SILHOUETTES } from "./shopify-custom-data.mjs";

const STORE = process.argv[2];
const WRITE = process.argv.includes("--write");
const CSV_PATH = new URL("../data/dress-attributes.csv", import.meta.url);
const BATCH = 25; // metafieldsSet は1回25件まで

if (!STORE || !STORE.endsWith(".myshopify.com")) {
  console.error("使い方: node tools/shopify-set-attributes.mjs <store>.myshopify.com [--write]");
  process.exit(1);
}

// タグ → 色の handle
const TAG_TO_COLOR = {
  WHITE: "white", IVORY: "ivory", PINK: "pink", RED: "red", YELLOW: "yellow", ORANGE: "orange",
  GOLD: "gold", GREEN: "green", BLUE: "blue", NAVY: "navy", PURPLE: "purple", LAVENDER: "purple",
  BROWN: "brown", SILVER: "silver", GRAY: "gray", GREY: "gray", BLACK: "black",
};

// 販売元の表記ゆれ → ライン名
function lineFromVendor(vendor) {
  const v = vendor.toLowerCase().replace(/\s+/g, "");
  if (v.includes("victria")) return "VICTRIA FRANCEZKA";
  if (v.includes("atelieryuka")) return "Atelier Yuka";
  return null;
}

function readDressCsv() {
  const [header, ...lines] = readFileSync(CSV_PATH, "utf8").trim().split("\n");
  const cols = header.split(",");
  return new Map(
    lines.map((line) => {
      // 商品名に , を含まない前提の単純な分割（CSV は tools 側で生成している）
      const row = Object.fromEntries(line.split(",").map((v, i) => [cols[i], v]));
      return [row.handle, row];
    }),
  );
}

function fetchAllProducts() {
  const products = [];
  let after = null;
  do {
    const data = gql(
      STORE,
      `query($after: String) {
        products(first: 250, after: $after) {
          nodes { id handle title tags vendor productType rentalPrice: metafield(namespace: "custom", key: "rental_price") { id } variants(first: 100) { nodes { price selectedOptions { value } } } }
          pageInfo { hasNextPage endCursor }
        }
      }`,
      { after },
    );
    products.push(...data.products.nodes);
    after = data.products.pageInfo.hasNextPage ? data.products.pageInfo.endCursor : null;
  } while (after);
  return products;
}

function metaobjectIds(type) {
  const data = gql(
    STORE,
    `query($type: String!) { metaobjects(type: $type, first: 100) { nodes { id handle } } }`,
    { type },
  );
  return new Map(data.metaobjects.nodes.map((m) => [m.handle, m.id]));
}

// 試着（¥5,500）と ¥0 のバリエーションを除いた最安値。残らなければ null
function rentalPrice(product) {
  const prices = product.variants.nodes
    .filter((v) => !v.selectedOptions.some((o) => o.value.includes("試着")))
    .map((v) => Math.round(Number(v.price)))
    .filter((price) => price > 0);
  return prices.length ? Math.min(...prices) : null;
}

function planValues(product, dress) {
  const values = {};
  if (dress) {
    values.silhouette = dress.silhouette.split(";").filter(Boolean);
    values.color = dress.color.split(";").filter(Boolean);
  } else {
    const colors = product.tags.map((t) => TAG_TO_COLOR[t.toUpperCase()]).filter(Boolean);
    if (colors.length) values.color = [...new Set(colors)];
  }
  const lineTag = LINES.find((l) => product.tags.some((t) => t.toLowerCase() === l.toLowerCase()));
  const line = lineTag ?? (dress ? lineFromVendor(product.vendor) : null);
  if (line) values.line = line;
  const rental = rentalPrice(product);
  if (rental != null) values.rental_price = rental;
  return values;
}

function toMetafields(productId, values, ids) {
  const refs = (handles, map, label) =>
    JSON.stringify(
      handles.map((h) => {
        if (!map.has(h)) throw new Error(`${label} に「${h}」がありません（shopify-custom-data.mjs の定義を確認）`);
        return map.get(h);
      }),
    );
  const fields = [];
  if (values.silhouette?.length) {
    fields.push({ ownerId: productId, namespace: "custom", key: "silhouette", type: "list.metaobject_reference", value: refs(values.silhouette, ids.silhouette, "シルエット") });
  }
  if (values.color?.length) {
    fields.push({ ownerId: productId, namespace: "custom", key: "color", type: "list.metaobject_reference", value: refs(values.color, ids.color, "色") });
  }
  if (values.line) {
    fields.push({ ownerId: productId, namespace: "custom", key: "line", type: "single_line_text_field", value: values.line });
  }
  if (values.rental_price != null) {
    fields.push({ ownerId: productId, namespace: "custom", key: "rental_price", type: "number_integer", value: String(values.rental_price) });
  }
  return fields;
}

function writeMetafields(metafields) {
  for (let i = 0; i < metafields.length; i += BATCH) {
    const data = gql(
      STORE,
      `mutation($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id }
          userErrors { field message code }
        }
      }`,
      { metafields: metafields.slice(i, i + BATCH) },
      { mutation: true },
    );
    assertNoUserErrors("metafieldsSet", data.metafieldsSet);
    process.stdout.write(`\r書き込み ${Math.min(i + BATCH, metafields.length)}/${metafields.length}`);
  }
  process.stdout.write("\n");
}

function deleteRentalPrices(products) {
  const identifiers = products.map((p) => ({ ownerId: p.id, namespace: "custom", key: "rental_price" }));
  for (let i = 0; i < identifiers.length; i += BATCH) {
    const data = gql(
      STORE,
      `mutation($metafields: [MetafieldIdentifierInput!]!) {
        metafieldsDelete(metafields: $metafields) {
          deletedMetafields { key }
          userErrors { field message }
        }
      }`,
      { metafields: identifiers.slice(i, i + BATCH) },
      { mutation: true },
    );
    assertNoUserErrors("metafieldsDelete", data.metafieldsDelete);
  }
}

function tally(plans, key) {
  const counts = {};
  for (const { values } of plans) {
    for (const v of [values[key]].flat().filter(Boolean)) counts[v] = (counts[v] ?? 0) + 1;
  }
  return counts;
}

function main() {
  console.log(`対象ストア: ${STORE}（${WRITE ? "書き込み" : "ドライラン"}）`);
  const dresses = readDressCsv();
  const products = fetchAllProducts();
  const ids = { silhouette: metaobjectIds("silhouette"), color: metaobjectIds("dress_color") };
  // 定義側の一覧と CSV の値がずれていないか先に確かめる
  const known = { silhouette: new Set(SILHOUETTES.map((s) => s.handle)), color: new Set(COLORS.map((c) => c.handle)) };

  const missingDresses = [...dresses.keys()].filter((h) => !products.some((p) => p.handle === h));
  const plans = products.map((p) => ({ product: p, values: planValues(p, dresses.get(p.handle)) }));
  for (const { product, values } of plans) {
    for (const key of ["silhouette", "color"]) {
      for (const h of values[key] ?? []) {
        if (!known[key].has(h)) throw new Error(`${product.handle}: ${key}「${h}」は定義にない値です`);
      }
    }
  }

  console.log(`商品 ${products.length} 件 / CSV のドレス ${dresses.size} 件`);
  if (missingDresses.length) console.log(`CSV にあってストアに無いドレス: ${missingDresses.join(", ")}`);
  console.log("シルエット:", tally(plans, "silhouette"));
  console.log("色:", tally(plans, "color"));
  console.log("ライン:", tally(plans, "line"));
  console.log("レンタル料金（件数の多い順に10件）:", Object.entries(tally(plans, "rental_price")).sort((a, b) => b[1] - a[1]).slice(0, 10));
  console.log(`値が1つも入らない商品: ${plans.filter((p) => !Object.keys(p.values).length).length} 件`);

  const metafields = plans.flatMap(({ product, values }) => toMetafields(product.id, values, ids));
  const staleRental = plans.filter(({ product, values }) => values.rental_price == null && product.rentalPrice).map((p) => p.product);
  console.log(`書き込むメタフィールド: ${metafields.length} 件`);
  console.log(`レンタル料金を消す商品: ${staleRental.length} 件${staleRental.length ? `（${staleRental.map((p) => p.handle).join(", ")}）` : ""}`);
  if (!WRITE) {
    console.log("ドライランなので書き込んでいません。--write を付けると書き込みます");
    return;
  }
  writeMetafields(metafields);
  if (staleRental.length) deleteRentalPrices(staleRental);
  console.log("完了");
}

main();
