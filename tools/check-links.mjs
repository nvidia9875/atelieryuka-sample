/**
 * サイト内リンク・アセット参照の実在チェック
 * 使い方: node tools/check-links.mjs
 * HTML/CSS/JS 内の href / src / url() を走査し、ローカルファイルの実在を検証する。
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative, extname } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SKIP_DIRS = new Set([".git", "node_modules", "assets/img-src", "data/originals-sq"]);
const SCAN_EXT = new Set([".html", ".css", ".js"]);

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
  /(?:href|src)\s*=\s*"([^"]+)"/g,
  /(?:href|src)\s*=\s*'([^']+)'/g,
  /url\(\s*["']?([^"')]+)["']?\s*\)/g,
];

const problems = [];
let checked = 0;

for (const file of collect(ROOT)) {
  const body = readFileSync(file, "utf8");
  for (const pattern of PATTERNS) {
    for (const [, raw] of body.matchAll(pattern)) {
      if (isExternal(raw)) continue;
      const path = raw.split(/[?#]/)[0];
      if (path === "") continue;
      checked += 1;
      const target = path.startsWith("/")
        ? join(ROOT, path)
        : resolve(dirname(file), path);
      if (!existsSync(target)) {
        problems.push(`${relative(ROOT, file)} → ${raw}`);
      }
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
