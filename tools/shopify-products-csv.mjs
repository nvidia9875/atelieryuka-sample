/**
 * 本番ストアの公開商品（/products.json）を取得し、Shopify の商品インポート用 CSV に変換する。
 * 開発用ストアに本番と同じ商品を入れて、テーマを作るためのもの。
 *
 *   使い方: node tools/shopify-products-csv.mjs [出力パス]
 *   例:     node tools/shopify-products-csv.mjs /tmp/products.csv
 *
 * - 公開中の商品だけが対象（products.json は非公開商品を返さない）
 * - 画像は本番 CDN の URL を指定するので、インポート時に Shopify が取り込む
 * - 在庫は追跡しない（レンタル商品で在庫数を持っていないため）
 */
import { writeFileSync } from "node:fs";

const STORE = "https://atelieryuka.com";
const PAGE_LIMIT = 250;
const MAX_PAGES = 10;
const OUT = process.argv[2] || "products.csv";

const COLUMNS = [
  "Handle", "Title", "Body (HTML)", "Vendor", "Type", "Tags", "Published",
  "Option1 Name", "Option1 Value", "Option2 Name", "Option2 Value", "Option3 Name", "Option3 Value",
  "Variant SKU", "Variant Grams", "Variant Inventory Tracker", "Variant Inventory Policy",
  "Variant Fulfillment Service", "Variant Price", "Variant Compare At Price",
  "Variant Requires Shipping", "Variant Taxable", "Image Src", "Image Position", "Image Alt Text",
  "Status",
];

async function fetchAllProducts() {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(`${STORE}/products.json?limit=${PAGE_LIMIT}&page=${page}`);
    if (!res.ok) throw new Error(`products.json page ${page}: HTTP ${res.status}`);
    const { products } = await res.json();
    if (!products.length) break;
    all.push(...products);
  }
  return all;
}

const csvCell = (value) => {
  const s = value == null ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function productRows(p) {
  const optionNames = p.options.map((o) => o.name);
  const hasOnlyDefault = optionNames.length === 1 && optionNames[0] === "Title";
  const rows = [];
  const count = Math.max(p.variants.length, p.images.length);

  for (let i = 0; i < count; i++) {
    const v = p.variants[i];
    const img = p.images[i];
    const row = Object.fromEntries(COLUMNS.map((c) => [c, ""]));
    row.Handle = p.handle;

    if (i === 0) {
      Object.assign(row, {
        Title: p.title,
        "Body (HTML)": p.body_html || "",
        Vendor: p.vendor,
        Type: p.product_type,
        Tags: p.tags.join(", "),
        Published: "TRUE",
        Status: "active",
      });
    }

    if (v) {
      optionNames.forEach((name, n) => {
        const key = `Option${n + 1}`;
        if (i === 0) row[`${key} Name`] = hasOnlyDefault ? "Title" : name;
        row[`${key} Value`] = hasOnlyDefault ? "Default Title" : v[`option${n + 1}`];
      });
      Object.assign(row, {
        "Variant SKU": v.sku || "",
        "Variant Grams": v.grams ?? 0,
        "Variant Inventory Tracker": "",
        "Variant Inventory Policy": "continue",
        "Variant Fulfillment Service": "manual",
        "Variant Price": v.price,
        "Variant Compare At Price": v.compare_at_price || "",
        "Variant Requires Shipping": v.requires_shipping ? "TRUE" : "FALSE",
        "Variant Taxable": v.taxable ? "TRUE" : "FALSE",
      });
    }

    if (img) {
      Object.assign(row, {
        "Image Src": img.src,
        "Image Position": img.position,
        "Image Alt Text": img.alt || "",
      });
    }
    rows.push(row);
  }
  return rows;
}

const products = await fetchAllProducts();
const rows = products.flatMap(productRows);
const csv = [COLUMNS.join(","), ...rows.map((r) => COLUMNS.map((c) => csvCell(r[c])).join(","))].join("\n");
writeFileSync(OUT, csv);
console.log(`${products.length} products / ${rows.length} rows → ${OUT}`);
