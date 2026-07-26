/**
 * サイト内リンク・アセット参照の実在チェック
 * 使い方: node tools/check-links.mjs
 * HTML/CSS/JS 内の href / src / url() を走査し、ローカルファイルの実在を検証する。
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative, extname } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SKIP_DIRS = new Set([".git", "node_modules", "assets/img-src", "data/originals-sq", ".playwright-mcp"]);
const SCAN_EXT = new Set([".html", ".css", ".js"]);

/** GitHub Pages のプロジェクトサイトは /<repo>/ 配下に公開されるため、
 *  絶対パス参照はこのプレフィックスを外してリポジトリルートに読み替える。 */
const BASE_PATH = "/atelieryuka-sample";

/** 走査対象ファイルを再帰収集 */
function collect(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(ROOT, full);
    if (SKIP_DIRS.has(entry) || SKIP_DIRS.has(rel)) continue;
    if (statSync(full).isDirectory()) collect(full, acc);
    else if (SCAN_EXT.has(extname(full))) acc.push(full);
  }
  return acc;
}

/** 外部・特殊スキーム・フラグメントは検証対象外
 *  %23 は data:image/svg+xml 内のフィルタ参照 url(%23id) で現れるエンコード済みの "#" */
function isExternal(url) {
  return /^(https?:|\/\/|data:|mailto:|tel:|#|%23|javascript:)/i.test(url);
}

const PATTERNS = [
  /(?:href|src|data-full)\s*=\s*"([^"]+)"/g,
  /(?:href|src|data-full)\s*=\s*'([^']+)'/g,
  /url\(\s*["']?([^"')]+)["']?\s*\)/g,
];

/** srcset は "URL 幅記述子, URL 幅記述子" 形式なので分解して検証する */
const SRCSET_PATTERN = /srcset\s*=\s*"([^"]+)"/g;

const problems = [];
let checked = 0;

for (const file of collect(ROOT)) {
  const body = readFileSync(file, "utf8");
  const refs = [];
  for (const pattern of PATTERNS) {
    for (const [, raw] of body.matchAll(pattern)) refs.push(raw);
  }
  for (const [, set] of body.matchAll(SRCSET_PATTERN)) {
    for (const candidate of set.split(",")) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url) refs.push(url);
    }
  }

  for (const raw of refs) {
    if (isExternal(raw)) continue;
    const path = raw.split(/[?#]/)[0];
    if (path === "") continue;
    checked += 1;
    let target;
    if (path.startsWith("/")) {
      const withoutBase = path.startsWith(BASE_PATH + "/") || path === BASE_PATH
        ? path.slice(BASE_PATH.length) || "/"
        : path;
      target = join(ROOT, withoutBase);
    } else {
      target = resolve(dirname(file), path);
    }
    /* ディレクトリ参照は index.html を見る */
    if (target.endsWith("/")) target = join(target, "index.html");
    if (!existsSync(target)) {
      problems.push(`${relative(ROOT, file)} → ${raw}`);
    }
  }
}

console.log(`検査した参照: ${checked}`);
if (problems.length === 0) {
  console.log("リンク切れ: なし ✓");
} else {
  console.log(`リンク切れ: ${problems.length} 件`);
  for (const p of problems) console.log("  ✗ " + p);
  process.exit(1);
}
