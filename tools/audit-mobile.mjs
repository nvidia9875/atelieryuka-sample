/**
 * スマホ〜デスクトップ各幅のレイアウト崩れを機械的に検査する。
 *
 *   使い方: node tools/audit-mobile.mjs [ベースURL]
 *   例:     node tools/audit-mobile.mjs http://127.0.0.1:8899
 *
 * 検査内容
 *   1. 横スクロールの発生（ページ全体 / はみ出している要素の特定）
 *   2. タップ領域が 44x44px を下回るリンク・ボタン
 *   3. 本文の文字サイズが小さすぎる箇所
 *   4. 画像の実寸と表示サイズの乖離（過剰な解像度）
 *   5. JS エラー・コンソール警告
 */
import { chromium } from "playwright";

const BASE = process.argv[2] || "http://127.0.0.1:8899";
const MIN_TAP = 44;
const MIN_FONT = 11; /* これ未満は読みづらい（装飾ラベルを除く） */
const WASTE_BYTES = 40 * 1024; /* 画像1枚あたり、これ以上無駄なら指摘する */

const WIDTHS = [320, 375, 390, 414, 768, 1024, 1440];
const PAGES = [
  { path: "/", label: "トップ" },
  { path: "/?cat=color&color=blue,green", label: "トップ(絞り込み中)" },
  { path: "/product.html?code=HLD-00085-01", label: "衣裳詳細" },
  { path: "/404.html", label: "404" },
];

/** ビューポート幅を超えてはみ出している要素を洗い出す */
const findOverflow = () => {
  const docWidth = document.documentElement.clientWidth;
  const out = [];
  document.querySelectorAll("body *").forEach((el) => {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return;
    /* 意図的に横スクロールさせている要素（タブ等）は除外 */
    if (style.overflowX === "auto" || style.overflowX === "scroll") return;
    const r = el.getBoundingClientRect();
    if (r.width === 0) return;
    if (r.right > docWidth + 1 || r.left < -1) {
      const path = el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : "");
      out.push({ el: path, left: Math.round(r.left), right: Math.round(r.right), doc: docWidth });
    }
  });
  /* 親子で重複するので先頭のみ */
  return out.slice(0, 6);
};

/** 小さすぎるタップ領域 */
const findSmallTaps = (min) => {
  const out = [];
  document.querySelectorAll('a[href], button:not([disabled]), summary, select, input:not([type="hidden"])').forEach((el) => {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return;
    if (el.type === "checkbox" || el.type === "radio") return; /* ラベル側で担保 */
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    /* インラインのテキストリンクは行の高さで判断されるため、明示的なボタン類だけ厳しく見る */
    const isControl = el.matches("button, summary, select, input, .btn, [role=tab]");
    if (!isControl) return;
    if (r.height < min || r.width < min) {
      out.push({
        el: el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/)[0] : ""),
        text: (el.textContent || el.value || "").trim().slice(0, 18),
        w: Math.round(r.width),
        h: Math.round(r.height),
      });
    }
  });
  return out.slice(0, 8);
};

/** 小さすぎる文字 */
const findSmallFonts = (min) => {
  const out = [];
  document.querySelectorAll("p, li, a, span, dd, dt, label, button, td, th").forEach((el) => {
    if (!el.textContent || el.textContent.trim().length < 4) return;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return;
    const size = parseFloat(style.fontSize);
    if (size < min) {
      out.push({ el: el.tagName.toLowerCase() + "." + (String(el.className).split(/\s+/)[0] || ""), size: size.toFixed(1), text: el.textContent.trim().slice(0, 20) });
    }
  });
  return out.slice(0, 6);
};

/**
 * 表示サイズに対して解像度が過剰な画像。
 * 比率だけで見ると小さいファイルまで拾ってしまうので、実際の転送量が
 * WASTE_BYTES を超えるものだけを問題として扱う。
 */
const findOversizedImages = (wasteBytes) => {
  /* 実際に転送されたバイト数を URL で引ける形にする */
  const transferred = new Map();
  performance.getEntriesByType("resource").forEach((e) => {
    if (e.initiatorType === "img") transferred.set(e.name, e.encodedBodySize || e.transferSize || 0);
  });

  const out = [];
  document.querySelectorAll("img").forEach((img) => {
    const r = img.getBoundingClientRect();
    if (r.width === 0 || !img.naturalWidth) return;
    const ratio = img.naturalWidth / (r.width * 2); /* 2x を許容 */
    if (ratio <= 1.6) return;
    const bytes = transferred.get(img.currentSrc || img.src) || 0;
    /* 過剰な分だけ無駄になっていると見積もる */
    const waste = bytes * (1 - 1 / ratio);
    if (waste < wasteBytes) return;
    out.push({
      src: (img.currentSrc || img.src).split("/").pop(),
      natural: img.naturalWidth,
      shown: Math.round(r.width),
      倍率: ratio.toFixed(1),
      無駄: Math.round(waste / 1024) + "KB",
    });
  });
  return out.slice(0, 5);
};

const browser = await chromium.launch();
let problems = 0;

for (const page of PAGES) {
  console.log("\n=== " + page.label + "  " + page.path + " ===");
  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: 2,
      isMobile: width < 768,
      hasTouch: width < 768,
    });
    const tab = await context.newPage();
    const consoleIssues = [];
    tab.on("console", (m) => {
      if (m.type() === "error" || m.type() === "warning") consoleIssues.push(m.type() + ": " + m.text().slice(0, 90));
    });
    tab.on("pageerror", (e) => consoleIssues.push("pageerror: " + String(e).slice(0, 90)));

    await tab.goto(BASE + page.path, { waitUntil: "load" });
    /* 遅延読み込み画像を実体化させる */
    await tab.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await tab.waitForTimeout(450);
    await tab.evaluate(() => window.scrollTo(0, 0));
    await tab.waitForTimeout(150);

    const scroll = await tab.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      pageH: document.documentElement.scrollHeight,
    }));
    const overflow = scroll.scrollW > scroll.clientW + 1 ? await tab.evaluate(findOverflow) : [];
    /* 44px のタップ領域はタッチ端末だけの要件。マウス操作の幅では判定しない */
    const isTouch = width < 768;
    const taps = isTouch ? await tab.evaluate(findSmallTaps, MIN_TAP) : [];
    const fonts = await tab.evaluate(findSmallFonts, MIN_FONT);
    const images = await tab.evaluate(findOversizedImages, WASTE_BYTES);

    const issues = [];
    if (overflow.length || scroll.scrollW > scroll.clientW + 1) {
      issues.push(`横スクロール ${scroll.scrollW}>${scroll.clientW}` + (overflow.length ? " " + JSON.stringify(overflow) : ""));
    }
    if (taps.length) issues.push(`タップ領域<${MIN_TAP}px ` + JSON.stringify(taps));
    if (fonts.length) issues.push(`文字<${MIN_FONT}px ` + JSON.stringify(fonts));
    if (images.length) issues.push("画像が過剰解像度 " + JSON.stringify(images));
    if (consoleIssues.length) issues.push("コンソール " + JSON.stringify(consoleIssues));

    if (issues.length === 0) {
      console.log(`  ${String(width).padStart(4)}px  OK  (縦 ${scroll.pageH}px)`);
    } else {
      problems += issues.length;
      console.log(`  ${String(width).padStart(4)}px  縦 ${scroll.pageH}px`);
      issues.forEach((i) => console.log("        ✗ " + i));
    }
    await context.close();
  }
}

await browser.close();
console.log(problems === 0 ? "\n崩れなし ✓" : `\n要確認: ${problems} 件`);
process.exit(problems === 0 ? 0 : 1);
