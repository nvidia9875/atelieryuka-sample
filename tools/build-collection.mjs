/**
 * コレクション章のHTMLを assets/data.js から生成し、index.html に差し込む。
 *
 *   使い方: node tools/build-collection.mjs
 *
 * assets/data.js を唯一の正とし、index.html の
 *   <!-- COLLECTION:START --> 〜 <!-- COLLECTION:END -->
 * の間を丸ごと置き換える。生成結果はコミットするので、公開時にビルドは不要。
 *
 * 絞り込みの軸は選択肢が2つ以上あるカテゴリにだけ出す（1択の軸は意味がないため）。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const require = createRequire(import.meta.url);
const AY = require(resolve(ROOT, "assets/data.js"));

/** 生成済み画像の実寸（tools/optimize-images.sh が書き出す）。srcset の幅記述子に使う */
const IMG_WIDTHS = JSON.parse(readFileSync(resolve(ROOT, "assets/img-widths.json"), "utf8"));

/**
 * グリッドでの表示幅。スマホは2カラム(約46vw)、920px以上は最大幅1120pxの3カラム。
 * これを sizes に渡すことで、スマホでは 440w だけを読ませる。
 */
const GRID_SIZES = "(max-width: 919px) 46vw, 350px";

/** 商品画像の srcset。小サイズが無ければ通常サイズだけを返す */
function srcset(file) {
  const small = file.replace(/\.webp$/, "-440.webp");
  const large = IMG_WIDTHS[file];
  const smallWidth = IMG_WIDTHS[small];
  if (!large) throw new Error(`assets/img-widths.json に ${file} がありません。tools/optimize-images.sh を実行してください`);
  if (!smallWidth || smallWidth >= large) return null;
  return `assets/img/${small} ${smallWidth}w, assets/img/${file} ${large}w`;
}

/** 商品カード用の <img>。拡大表示は data-full の原寸を使う */
function productImg(file, { alt, className }) {
  const set = srcset(file);
  return [
    `<img${className ? ` class="${className}"` : ""}`,
    ` src="assets/img/${file}"`,
    set ? ` srcset="${set}" sizes="${GRID_SIZES}"` : "",
    ` data-full="assets/img/${file}"`,
    ` alt="${alt}" width="600" height="800" loading="lazy" decoding="async">`,
  ].join("");
}

/** 深さ n のインデント（index.html の <section> 直下が深さ1） */
const ind = (n) => "  ".repeat(n);
const yen = (n) => "¥" + n.toLocaleString("en-US");
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** 順序を保ったまま重複を除く */
const uniq = (values) => [...new Set(values.filter((v) => v != null && v !== ""))];

/* ============================================================
   絞り込みパネル
   ============================================================ */

/** チェックボックス1個ぶん（スウォッチ or チップ） */
function checkbox({ axis, value, label, swatchHex }) {
  const cls = swatchHex ? "swatch" : "chip";
  const style = swatchHex ? ` style="--swatch: ${swatchHex}"` : "";
  const dot = swatchHex ? `<span class="swatch-dot" aria-hidden="true"></span>` : "";
  return (
    `<label class="${cls}"${style}>` +
    `<input type="checkbox" data-axis="${axis}" value="${esc(value)}">` +
    dot +
    `<span class="${cls}-label">${esc(label)}</span>` +
    `</label>`
  );
}

/** 選択肢が2つ以上あるときだけ軸を出力する */
function filterGroup({ legend, axis, options, layout }) {
  if (options.length < 2) return "";
  const boxes = options.map((o) => checkbox({ axis, ...o })).join("\n" + ind(8));
  return [
    `${ind(6)}<fieldset class="filter-group">`,
    `${ind(7)}<legend class="filter-legend">${esc(legend)}</legend>`,
    `${ind(7)}<div class="${layout}">`,
    `${ind(8)}${boxes}`,
    `${ind(7)}</div>`,
    `${ind(6)}</fieldset>`,
  ].join("\n");
}

function filterPanel(key, col) {
  const items = col.items;

  const colorOptions = uniq(items.map((i) => i.color)).map((c) => ({
    value: c,
    label: AY.colors[c] ? AY.colors[c].label : c,
    swatchHex: AY.colors[c] ? AY.colors[c].hex : "#CCC",
  }));

  const priceOptions = uniq(items.map((i) => i.price))
    .sort((a, b) => a - b)
    .map((p) => ({ value: String(p), label: yen(p) }));

  const silhouetteOptions = uniq(items.map((i) => i.silhouette)).map((s) => ({ value: s, label: s }));
  const lineOptions = uniq(items.map((i) => i.line)).map((l) => ({ value: l, label: l }));

  const groups = [
    filterGroup({ legend: "色", axis: "color", options: colorOptions, layout: "swatches" }),
    filterGroup({ legend: "価格", axis: "price", options: priceOptions, layout: "chips" }),
    filterGroup({ legend: "シルエット", axis: "silhouette", options: silhouetteOptions, layout: "chips" }),
    filterGroup({ legend: "ライン", axis: "line", options: lineOptions, layout: "chips" }),
  ].filter(Boolean);

  return [
    `${ind(4)}<details class="filter" data-filter>`,
    `${ind(5)}<summary class="filter-summary">`,
    `${ind(6)}<span class="filter-summary-label">絞り込む</span>`,
    `${ind(6)}<span class="filter-summary-badge" data-active-count hidden></span>`,
    `${ind(5)}</summary>`,
    `${ind(5)}<div class="filter-body">`,
    groups.join("\n"),
    `${ind(6)}<div class="filter-group filter-search">`,
    `${ind(7)}<label class="filter-legend" for="q-${key}">愛称・型番で探す</label>`,
    `${ind(7)}<input type="search" id="q-${key}" data-axis="q" autocomplete="off" placeholder="例: ${esc(items[0].name)} / ${esc(items[0].code)}">`,
    `${ind(6)}</div>`,
    `${ind(5)}</div>`,
    `${ind(4)}</details>`,
    ``,
    `${ind(4)}<div class="result-bar">`,
    `${ind(5)}<p class="result-count" role="status" aria-live="polite" data-count>${items.length}件を表示</p>`,
    `${ind(5)}<p class="result-tools">`,
    `${ind(6)}<button type="button" class="filter-clear" data-clear hidden>条件をクリア</button>`,
    `${ind(6)}<span class="sort-field">`,
    `${ind(7)}<label for="sort-${key}">並び替え</label>`,
    `${ind(7)}<select id="sort-${key}" data-sort>`,
    `${ind(8)}<option value="recommended">おすすめ順</option>`,
    `${ind(8)}<option value="price-asc">価格が安い順</option>`,
    `${ind(8)}<option value="price-desc">価格が高い順</option>`,
    `${ind(7)}</select>`,
    `${ind(6)}</span>`,
    `${ind(5)}</p>`,
    `${ind(4)}</div>`,
  ].join("\n");
}

/* ============================================================
   商品カード
   ============================================================ */

function productCard(item, col) {
  const href = `product.html?code=${encodeURIComponent(item.code)}`;
  const alt = `${col.label} ${item.name}`;
  const dataAttrs = [
    `data-name="${esc(item.name)}"`,
    `data-code="${esc(item.code)}"`,
    `data-price="${item.price}"`,
    `data-color="${esc(item.color)}"`,
    item.silhouette ? `data-silhouette="${esc(item.silhouette)}"` : "",
    `data-line="${esc(item.line)}"`,
  ].filter(Boolean);

  return [
    `${ind(5)}<li class="product"`,
    `${ind(7)}${dataAttrs.join(" ")}>`,
    `${ind(6)}<figure class="product-media">`,
    `${ind(7)}${productImg(item.img, { alt: esc(alt) })}`,
    item.img2
      ? `${ind(7)}${productImg(item.img2, { alt: "", className: "alt-img" })}`
      : "",
    `${ind(7)}<span class="float-code" aria-hidden="true" translate="no">${esc(item.code)}</span>`,
    `${ind(6)}</figure>`,
    `${ind(6)}<h3 class="product-name" translate="no"><a href="${href}">${esc(item.name)}</a></h3>`,
    `${ind(6)}<p class="product-meta"><span translate="no">${esc(item.code)}</span><span class="product-line"> — ${esc(item.line)}</span></p>`,
    `${ind(6)}<p class="product-price">${yen(item.price)}</p>`,
    `${ind(6)}<p class="product-cta"><a href="${href}">詳細・お申し込み</a></p>`,
    `${ind(5)}</li>`,
  ]
    .filter(Boolean)
    .join("\n");
}

/* ============================================================
   タブ全体
   ============================================================ */

const keys = Object.keys(AY.collections);

const tablist = keys
  .map((key, i) => {
    const col = AY.collections[key];
    const selected = i === 0;
    return (
      `${ind(4)}<button type="button" role="tab" id="tab-${key}" aria-controls="panel-${key}"` +
      ` aria-selected="${selected}"${selected ? "" : ' tabindex="-1"'}>${esc(col.label)}</button>`
    );
  })
  .join("\n");

const panels = keys
  .map((key, i) => {
    const col = AY.collections[key];
    /* タキシード・モーニングは正方形寄りの原本のため、既存の grid-square を維持する */
    const gridClass = key === "tuxedo" || key === "morning" ? "product-grid grid-square" : "product-grid";
    return [
      `${ind(3)}<div class="tabpanel" role="tabpanel" id="panel-${key}" aria-labelledby="tab-${key}" tabindex="0"${i === 0 ? "" : " hidden"}>`,
      filterPanel(key, col),
      ``,
      `${ind(4)}<ul class="${gridClass}" data-grid>`,
      col.items.map((item) => productCard(item, col)).join("\n"),
      `${ind(4)}</ul>`,
      ``,
      `${ind(4)}<p class="no-result" data-empty hidden>条件に合う衣裳が見つかりませんでした。条件を減らしてお試しください。</p>`,
      `${ind(4)}<p class="more-wrap" data-more-wrap hidden><button type="button" class="btn btn-ghost" data-more>さらに表示</button></p>`,
      `${ind(3)}</div>`,
    ].join("\n");
  })
  .join("\n\n");

const generated = [
  `${ind(2)}<div class="tabs reveal">`,
  `${ind(3)}<div class="tablist" role="tablist" aria-label="コレクションのカテゴリ">`,
  tablist,
  `${ind(3)}</div>`,
  ``,
  panels,
  `${ind(2)}</div>`,
].join("\n");

/* ============================================================
   index.html へ差し込み
   ============================================================ */

const INDEX = resolve(ROOT, "index.html");
const START = "<!-- COLLECTION:START";
const END = "<!-- COLLECTION:END -->";

const html = readFileSync(INDEX, "utf8");
const startIdx = html.indexOf(START);
const endIdx = html.indexOf(END);

if (startIdx === -1 || endIdx === -1) {
  console.error(`index.html に ${START} … ${END} のマーカーが見つかりません`);
  process.exit(1);
}

const startLineEnd = html.indexOf("\n", startIdx);
const next =
  html.slice(0, startLineEnd + 1) + generated + "\n" + ind(2) + html.slice(endIdx);

writeFileSync(INDEX, next);

const total = keys.reduce((sum, k) => sum + AY.collections[k].items.length, 0);
console.log(`コレクションを生成しました: ${keys.length}カテゴリ / ${total}点`);
for (const k of keys) {
  const col = AY.collections[k];
  const colors = uniq(col.items.map((i) => i.color)).length;
  const prices = uniq(col.items.map((i) => i.price)).length;
  const sils = uniq(col.items.map((i) => i.silhouette)).length;
  const lines = uniq(col.items.map((i) => i.line)).length;
  const axes = [
    colors >= 2 ? `色${colors}` : null,
    prices >= 2 ? `価格${prices}` : null,
    sils >= 2 ? `シルエット${sils}` : null,
    lines >= 2 ? `ライン${lines}` : null,
  ].filter(Boolean);
  console.log(`  ${col.label.padEnd(12, "　")} ${String(col.items.length).padStart(2)}点  絞り込み軸: ${axes.join(" / ") || "なし"} + 検索`);
}
