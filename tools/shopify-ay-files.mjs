/**
 * アトリエユカのトップ・カタログで使う画像とカタログを Shopify の「ファイル」に上げる（名前は ay- で始める）。
 * 既に上がっているもの（同じ名前）は飛ばす。テーマは 'ay-…' | file_url や shopify://shop_images/ay-… で参照する。
 *
 *   使い方: node tools/shopify-ay-files.mjs <store>.myshopify.com [--dry-run]
 *
 * 元はサンプルの assets/img（公開用 WebP）と assets/catalog（2026 カタログ 58面・PDF）、先方からいただいたロゴ（data/brand）。
 * 前提: shopify store auth の scopes に read_files,write_files
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { listFiles, uploadFiles } from "./shopify-admin.mjs";

const STORE = process.argv[2];
const DRY_RUN = process.argv.includes("--dry-run");
if (!STORE || !STORE.endsWith(".myshopify.com")) {
  console.error("使い方: node tools/shopify-ay-files.mjs <store>.myshopify.com [--dry-run]");
  process.exit(1);
}

const ROOT = new URL("../assets/", import.meta.url).pathname;
const PREFIX = "ay-";
const BATCH = 20;
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 「ファイル」の上限（画像以外）。超えるものは上げずに知らせる

// トップの章・入口で使う写真（サンプルで使っていたもの）
const IMAGES = [
  "brand-01.webp", "brand-02.webp",
  "hero-01.webp", "hero-02.webp", "hero-03.webp", "hero-04.webp", "hero-05.webp",
  "journey-paris.webp", "journey-hawaii.webp", "journey-newyork.webp", "journey-london.webp",
  "journey-sydney.webp", "journey-melbourne.webp", "journey-perth.webp", "journey-lasvegas.webp",
  "wd-01.webp", "cd-01.webp", "tx-01.webp", "mo-01.webp", "mo-02.webp",
  "og-cover.jpg",
];

function items() {
  const list = IMAGES.map((name) => ({
    path: join(ROOT, "img", name),
    filename: PREFIX + name,
    mimeType: name.endsWith(".jpg") ? "image/jpeg" : "image/webp",
    contentType: "IMAGE",
  }));
  for (const [dir, kind] of [["pages", "page"], ["thumbs", "thumb"]]) {
    for (const name of readdirSync(join(ROOT, "catalog", dir)).filter((n) => n.endsWith(".webp")).sort()) {
      list.push({ path: join(ROOT, "catalog", dir, name), filename: `${PREFIX}catalog-${kind}-${name}`, mimeType: "image/webp", contentType: "IMAGE" });
    }
  }
  // 配布用 PDF。元の 24MB は「ファイル」の上限を超えるので、ページを 150dpi で作り直した軽い版（約12.6MB）があればそちらを上げる:
  //   pdftoppm -jpeg -jpegopt quality=82 -r 150 元.pdf raw/pg → 各ページを sips で PDF 化 → pdfunite
  //   出力先は docs/catalog-web/（GitHub Pages に載せないためコミットしない）
  const webPdf = new URL("../docs/catalog-web/atelieryuka-catalog-2026-web.pdf", import.meta.url).pathname;
  const pdfPath = existsSync(webPdf) ? webPdf : join(ROOT, "catalog/atelieryuka-catalog-2026.pdf");
  list.push({ path: pdfPath, filename: `${PREFIX}catalog-2026.pdf`, mimeType: "application/pdf", contentType: "FILE" });
  // 先方からいただいたロゴ（2026-10-09。元は A4 の PNG なので、ロゴの部分だけ切り出したもの）
  list.push({ path: new URL("../data/brand/elieca-logo.png", import.meta.url).pathname, filename: `${PREFIX}elieca-logo.png`, mimeType: "image/png", contentType: "IMAGE" });
  return list.map((it) => ({ ...it, alt: "" }));
}

function main() {
  const all = items();
  const tooLarge = all.filter((it) => statSync(it.path).size > MAX_FILE_BYTES);
  const existing = listFiles(STORE, PREFIX);
  const missing = all.filter((it) => !existing.has(it.filename) && !tooLarge.includes(it));
  console.log(`対象ストア: ${STORE}${DRY_RUN ? "（ドライラン）" : ""} / ファイル ${all.length} 件（アップロード済み ${all.length - missing.length - tooLarge.length}・これから ${missing.length}）`);
  for (const it of tooLarge) {
    console.log(`※ ${it.filename} は ${(statSync(it.path).size / 1024 / 1024).toFixed(1)}MB で上限（20MB）を超えるので上げない。圧縮してから流し直す`);
  }
  if (DRY_RUN) return;
  for (let i = 0; i < missing.length; i += BATCH) {
    uploadFiles(STORE, missing.slice(i, i + BATCH));
    process.stdout.write(`\rアップロード ${Math.min(i + BATCH, missing.length)}/${missing.length}`);
  }
  if (missing.length) process.stdout.write("\n");
  console.log("完了");
}

main();
