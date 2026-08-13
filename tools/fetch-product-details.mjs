/**
 * 実サイト(atelieryuka.com / Shopify)から衣裳の説明文・素材を取得して
 * assets/details.js を生成する。
 *
 *   node tools/fetch-product-details.mjs
 *
 * 取得元は Shopify の公開エンドポイント /products.json。
 * 型番(code)は handle ではなく商品タイトルで突き合わせる
 * (handle は実サイト側で型番とズレている商品があるため。例: BLD-00055-11 → handle は bld-00055-10)。
 *
 * 出力は assets/data.js の items[].code をキーにした辞書:
 *   AY_DETAILS = { "HLD-00084-01": { desc, material[], genres[], design[], size, source } }
 *
 * 生成結果はコミットする(公開時にビルド不要)。実サイトの文言が更新されたら再実行する。
 */
import { writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SHOP = "https://atelieryuka.com";
const OUT = join(ROOT, "assets", "details.js");

/* ---- 1. assets/data.js から対象の型番を集める ---- */

async function targetCodes() {
  const src = await readFile(join(ROOT, "assets", "data.js"), "utf8");
  const mod = { exports: {} };
  new Function("module", src)(mod);
  const AY = mod.exports;
  return Object.values(AY.collections).flatMap((col) => col.items.map((it) => it.code));
}

/* ---- 2. Shopify から全商品を取得 ---- */

async function fetchAllProducts() {
  const all = [];
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`${SHOP}/products.json?limit=250&page=${page}`);
    if (!res.ok) throw new Error(`products.json page ${page}: HTTP ${res.status}`);
    const { products } = await res.json();
    if (!products.length) break;
    all.push(...products);
  }
  if (!all.length) throw new Error("商品が1件も取得できませんでした");
  return all;
}

/* ---- 3. body_html を行テキストへ ---- */

const BLOCK = /<br[^>]*>|<\/?(?:p|div|ul|ol|li|h[1-6])[^>]*>/gi;

function toLines(html) {
  if (!html) return [];
  return html
    /* <wbr> は表示上の改行ヒントで語を分断しているだけ。改行にせず落とす */
    .replace(/<wbr\s*\/?>|<\/wbr>/gi, "")
    .replace(BLOCK, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;| /g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

/* ---- 4. MATERIAL / GENRES / DESIGN / SIZE を拾う ---- */

const LABELS = [
  { key: "material", re: /^MATERIAL\s*[:：]\s*(.*)$/i },
  { key: "genres", re: /^GENRES?\s*[:：]\s*(.*)$/i },
  { key: "design", re: /^DESIGN\s*[:：]\s*(.*)$/i },
  { key: "size", re: /^SIZE\s*[:：]\s*(.*)$/i },
];

/**
 * 区切り文字は項目ごとに違う。
 * 素材は「ミカド・レース・チュール」「レース、チュール」の中黒／読点区切り。
 * ジャンルとデザインは読点区切りで、値そのものに「大人系/エレガント」のようなスラッシュを含むため
 * スラッシュでは割らない。
 */
const SEPARATORS = {
  material: /[・、,，]/,
  genres: /[,，]/,
  design: /[,，]/,
};

const splitList = (key, value) =>
  value
    .split(SEPARATORS[key])
    .map((v) => v.trim())
    .filter(Boolean);

function parseBody(html) {
  const lines = toLines(html);
  const detail = { desc: "", material: [], genres: [], design: [], size: "" };
  const descLines = [];
  /* ラベル行の値が空のとき(例: "MATERIAL :" だけの行)は次の行を値として引き取る */
  let pending = null;

  for (const line of lines) {
    const hit = LABELS.map((l) => ({ ...l, m: line.match(l.re) })).find((l) => l.m);
    if (hit) {
      pending = hit.m[1] ? null : hit.key;
      if (hit.m[1]) assign(detail, hit.key, hit.m[1]);
      continue;
    }
    if (pending) {
      assign(detail, pending, line);
      pending = null;
      continue;
    }
    /* ラベルが1つも出ていないうちの行＝説明文 */
    if (!detail.material.length && !detail.genres.length && !detail.design.length && !detail.size) {
      descLines.push(line);
    }
  }

  detail.desc = descLines.join("\n");
  return detail;
}

function assign(detail, key, value) {
  if (key === "size") {
    detail.size = detail.size ? `${detail.size} ${value}` : value;
    return;
  }
  for (const v of splitList(key, value)) {
    if (!detail[key].includes(v)) detail[key].push(v);
  }
}

/* ---- 5. 突き合わせ ---- */

function findProduct(products, code) {
  /* タイトル内の型番は前後が区切り文字(全角空白など)なので単純な包含で足りるが、
     HLD-00066 が HLD-00066-01 に誤ヒットしないよう「型番の直後が -数字 でない」ことを見る */
  const boundary = new RegExp(`${code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![-\\w])`, "i");
  return products.find((p) => boundary.test(p.title));
}

/* ---- main ---- */

const [codes, products] = await Promise.all([targetCodes(), fetchAllProducts()]);
console.log(`取得: 実サイト商品 ${products.length}件 / 対象型番 ${codes.length}件`);

const details = {};
const missing = [];
const noBody = [];

for (const code of codes) {
  const product = findProduct(products, code);
  if (!product) {
    missing.push(code);
    continue;
  }
  const detail = parseBody(product.body_html);
  if (!detail.desc && !detail.material.length) {
    noBody.push(code);
    continue;
  }
  details[code] = { ...detail, source: `${SHOP}/products/${product.handle}` };
}

const today = new Date().toISOString().slice(0, 10);
const banner = [
  "/**",
  " * 衣裳の説明文・素材。tools/fetch-product-details.mjs が生成(手で編集しない)。",
  ` * 出典: ${SHOP} (Shopify /products.json) ${today}取得`,
  " * 文言は実サイトの原文のまま。読み込むのは product.html だけ。",
  " */",
].join("\n");

await writeFile(
  OUT,
  `${banner}\nconst AY_DETAILS = ${JSON.stringify(details, null, 2)};\n\nif (typeof module !== "undefined") module.exports = AY_DETAILS;\n`,
  "utf8"
);

console.log(`書き出し: ${OUT} (${Object.keys(details).length}件)`);
if (noBody.length) console.log(`本文なし(実サイト側が空): ${noBody.join(", ")}`);
if (missing.length) console.log(`実サイトに見つからず: ${missing.join(", ")}`);
