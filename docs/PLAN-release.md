# A案 公開 + コレクション絞り込み + モバイル最適化 — 実装計画

作成日: 2026-07-26
対象: `/Users/shun/Desktop/website/atelieryuka/a-classic/`（A案 Timeless Classic「銀座の正統」）

---

## 0. 現状の把握

### ファイル構成
```
/Users/shun/Desktop/website/atelieryuka/
├── index.html              比較ページ（4案を並べて選んでもらうページ）
├── a-classic/              ★A案（決定案）
│   ├── index.html          804行・商品グリッドは全ハードコード
│   ├── product.html/.js/.css   衣裳詳細（data.js からJS描画）
│   ├── style.css (472行) / style-b.css (434行)
│   └── script.js (315行)   フェードイン / タブ / 予約フォーム
├── b-couture/ c-story/ d-motion/   他案
├── assets/
│   ├── data.js             ★全案共通データ（AY オブジェクト）
│   ├── lightbox.js/.css    共通ライトボックス
│   └── img/                81ファイル・27MB
└── data/
    ├── products.json       Shopify実データ 114件
    ├── catalog.json        整形済み 32件
    └── originals-sq/       中間素材 2.1MB
```

### 見つかった課題

| # | 課題 | 深刻度 |
|---|------|--------|
| 1 | **A案トップの画像合計が 21.8MB** — PNGが1.5〜2MB×6枚。GitHub Pagesは画像変換をしないのでそのまま配信される | 🔴 致命的 |
| 2 | git 未初期化（`.git` なし）、`user.name`/`user.email` も未設定 | 🔴 公開ブロッカー |
| 3 | モバイルで商品グリッドが**1カラム**（`< 560px`）。9件で縦 4,700px 超 | 🟠 ご指摘の点 |
| 4 | 絞り込みに使う**色・サイズのデータが存在しない**（`data.js` は name/code/price/line/silhouette のみ） | 🟠 要データ設計 |
| 5 | 商品グリッドが `index.html` に**手書きで重複**（data.js と二重管理）。`wd-10 Perle` / `cd-10 Jardin` はデータにあるがHTMLに無い | 🟡 |
| 6 | OGP / canonical / sitemap.xml / 404.html が無い | 🟡 |
| 7 | ルートが「4案比較ページ」のまま — 決定後の公開物としては不自然 | 🟡 要判断 |

---

## 1. GitHub Pages 公開

### 1-1. URL構成【要判断 → Q1】

**推奨: A案をルートに昇格**

```
https://nvidia9875.github.io/atelieryuka-sample/
├── index.html          ← a-classic/index.html を昇格
├── product.html        ← a-classic/product.html
├── style.css / style-b.css / script.js / product.css / product.js
├── assets/             （パスを ../assets/ → assets/ に一括置換）
├── 404.html / sitemap.xml / robots.txt / .nojekyll
└── archive/            比較ページ + B/C/D案（残す場合）
```

- パス書き換えは `../assets/` → `assets/` の機械置換 + 全リンク検査スクリプトで担保
- 対象ファイル: `a-classic/*.html`, `*.css`, `*.js`（`../assets/` 参照は約80箇所）

**代替: 現状維持** — `/` が比較ページ、`/a-classic/` がA案。変更ゼロで最速だが、決定案が1階層下になる。

### 1-2. 画像最適化（必須）

`cwebp` がローカルにあるので Node/Python は不要。

| 対象 | 現状 | 変換後（目標） |
|------|------|----------------|
| 商品画像 70枚（wd/cd/tx/mo） | 986〜1200px, 70〜290KB | 幅800px WebP q82 → 40〜70KB |
| PNG 6枚（wd-01/03, brand-01/02 ほか） | 1080px, 1.3〜2.0MB | 幅800px WebP q82 → 60〜100KB |
| journey 8枚 | 最大1MB | 幅640px WebP q80 → 30〜60KB |
| hero-01.jpg | 1800px, 244KB | 幅1400px WebP q85 → 110KB |

- **21.8MB → 約2.5MB**（うち初期表示は lazy 効果で **約400KB**）
- 元ファイルは `assets/img-src/` に退避してリポジトリからは除外（`.gitignore`）— 再生成できる状態を保つ
- `<img>` は WebP 直参照（対応率97%+）。`width`/`height` は既に全て指定済みなので CLS は維持
- 併せて `newcollection.png`(2.9MB) / `journey-rottnest.png` など**未使用画像を削除**

### 1-3. 公開前チェックリスト

- [ ] `.nojekyll`（Jekyll処理を無効化）
- [ ] `.gitignore` — `.DS_Store` / `assets/img-src/` / `data/originals-sq/` / `.claude/`
- [ ] OGP・Twitter Card（og:image は hero を 1200×630 でトリミング生成）
- [ ] `<link rel="canonical">`
- [ ] `sitemap.xml` / `robots.txt`
- [ ] `404.html`
- [ ] 各案に残っている `.compare-pill`（← 比較ページへ）の扱い
- [ ] フッターの「デザインデモです」注記の文言調整
- [ ] 予約フォームはデモのまま（実送信には Formspree 等が別途必要 — **今回のスコープ外**として明記）

### 1-4. 公開手順

```bash
cd /Users/shun/Desktop/website/atelieryuka
git init
git config user.name  "<要設定>"
git config user.email "s.shunsuke9875@gmail.com"
git add -A
git commit -m "feat: A案 Timeless Classic を公開用に整備"
git branch -M main
git remote add origin https://github.com/nvidia9875/atelieryuka-sample.git
git push -u origin main
gh api -X POST repos/nvidia9875/atelieryuka-sample/pages -f source[branch]=main -f source[path]=/
```

### ⚠️ 公開前の確認事項

このサイトには**松尾株式会社の実在企業情報・実在の商品画像（atelieryuka.com より引用）**が含まれます。
public リポジトリ + GitHub Pages にすると誰でも閲覧可能になります。クライアント様の許諾はお済みでしょうか。
（private リポジトリでの Pages 公開は GitHub Pro/Team 以上のプランが必要です）

---

## 2. コレクション絞り込み機能

### 2-1. データ設計

`/Users/shun/Desktop/website/atelieryuka/assets/data.js` の各アイテムに追加:

```js
{
  name: "Azur", code: "AY6001", price: 385000,
  line: "Atelier Yuka", silhouette: "プリンセス",
  img: "cd-01.webp", img2: "cd-01-b.webp",

  // ↓ 追加
  color: "blue",           // 色系統キー
  colorHex: "#5F8AC1",     // スウォッチ表示色
  sizes: [7, 9, 11],       // 号数（タキシードは "A5","A6" 等）
}
```

**色の決定方法**
Pillow で各画像の中央下部（スカート/ジャケット部分）から彩度重み付きの代表色を抽出済み。
試験抽出の結果は妥当（cd-01 → 青 `#5f8ac1`、cd-03 → 金 `#b28102`、cd-05 → 臙脂 `#b42439`）ですが、
タキシードは背景・肌色の混入でブレるため、**全商品を目視確認して色系統を最終決定**します。

色系統（統合パレット・全カテゴリ共通）:
`ホワイト / アイボリー / シャンパン / ベージュ / ピンク / レッド / ゴールド / グリーン / ブルー / ネイビー / グレー / ブラウン / ブラック`
（実際に該当商品がある色だけをタブごとに表示）

**サイズの扱い【要判断 → Q2】**
実データにサイズ情報が一切ありません（Shopify APIのレスポンスにもバリアントなし）。
- 案A: レンタルドレスの一般的な展開（**5/7/9/11/13号**、タキシードは **Y5/A5/A6/AB5**）をデモ値として付与し、「※サイズはサンプル値」と注記
- 案B: 実サイズ表をご提供いただくまで、サイズ絞り込みは**保留**（色・価格・名前のみ先行実装）

### 2-2. UI設計（A案のトーンに合わせる）

A案は「生成り＋墨＋シャンパンゴールド／明朝体／極細罫線／静かなフェード」。
フィルタUIも**角丸ピルの連打にせず**、罫線と余白で構成します。

```
┌──────────────────────────────────────────────────────┐
│  ウエディングドレス  カラードレス  タキシード  モーニング │ ← 既存タブ（モバイルは横スクロール1段）
├──────────────────────────────────────────────────────┤
│  絞り込む  ─────────────────────────────  10件   ▾   │ ← <details>/<summary>
│  ┌────────────────────────────────────────────────┐  │
│  │ 色     ◯ ◯ ◯ ◯ ◯ ◯ ◯     （円スウォッチ）  │  │
│  │ サイズ  5号  7号  9号  11号  13号                │  │
│  │ 価格   〜20万 / 20-30万 / 30万〜（セグメント）    │  │
│  │ ライン  Atelier Yuka  VICTRIA FRANCEZKA  …       │  │
│  │ 検索   [ 愛称・型番で探す ______________ ]        │  │
│  │                              条件をクリア        │  │
│  └────────────────────────────────────────────────┘  │
│  10件を表示            並び替え: おすすめ ／ 価格 ▾    │
└──────────────────────────────────────────────────────┘
```

- モバイルは `<details>` の折りたたみで閉じた状態が既定（縦を消費しない）
- PCは常時展開
- 色スウォッチは `<input type="checkbox">` + 円形 `<label>`。**色名テキストを必ず併記**（視覚のみに依存しない = WCAG 1.4.1）
- 選択中のチップは「条件をクリア」の手前にまとめて表示（×で個別解除）

### 2-3. 実装方針

**静的HTML + `data-*` 属性 + JSで表示トグル**（JS描画ではなく）

理由:
- JS無効／クローラでも全商品が見える（クライアント提案物としてリスクが低い）
- 初期表示のちらつきが無い、LCPに影響しない
- 既存マークアップ・ライトボックス・詳細ページ導線をそのまま活かせる

二重管理の解消:
- `/Users/shun/Desktop/website/atelieryuka/tools/build-collection.mjs` を新設
- `assets/data.js` を唯一の正としてコレクション部分のHTMLを生成し、`index.html` の
  `<!-- COLLECTION:START -->` 〜 `<!-- COLLECTION:END -->` に差し込む
- 生成後のHTMLをコミット（ビルドステップは公開に不要 = GitHub Pages のまま動く）
- ついでに **欠けている wd-10 Perle / cd-10 Jardin が自動で追加**され、データとHTMLのズレが解消

マークアップ例:
```html
<li class="product"
    data-name="Azur" data-code="AY6001"
    data-price="385000" data-color="blue"
    data-sizes="7,9,11" data-line="Atelier Yuka">
```

**絞り込みロジック**（`a-classic/collection-filter.js` 新設・約200行）
- 軸どうしは AND、同一軸内の複数選択は OR
- 状態を URL に反映: `?cat=color&color=blue,green&size=9&price=200000-300000&q=azur`
  → 共有・ブックマーク可能（`history.replaceState` で履歴は汚さない）
- 件数を `aria-live="polite"` でスクリーンリーダーに通知
- 0件時: 「条件に合う衣裳が見つかりませんでした」＋どの条件を外すと何件になるかの提案＋クリアボタン
- 並び替え: おすすめ（既定順）/ 価格の安い順 / 価格の高い順
- `prefers-reduced-motion` を尊重（フィルタ時のフェードを無効化）

---

## 3. モバイルの縦スクロール短縮

### 3-1. 2カラム化（ご指摘の対応）

`/Users/shun/Desktop/website/atelieryuka/a-classic/style.css:316-324`

```css
/* 現状: 560px未満は1カラム */
.product-grid { grid-template-columns: 1fr; }

/* 変更: 最小幅から2カラム */
.product-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: 1.6rem 0.7rem;                        /* モバイルは間隔を圧縮 */
}
@media (min-width: 560px) { gap を現状値へ }
@media (min-width: 920px) { 3カラム（現状維持） }
```

カード内の調整（モバイルのみ）:
- `.product-name` 1.3rem → 1.05rem
- `.product-meta` は型番のみに短縮（ライン名は詳細ページで）
- `.product-price` 0.95rem → 0.85rem
- `.product-cta`（詳細・お申し込み）は**非表示** — カード全体がリンクなので冗長
- `.product-media` の padding 8px → 5px（極細罫線のトーンは維持）
- `.float-code` はタッチ端末で hover が効かないため、モバイルでは常時薄表示

### 3-2. 段階表示「さらに表示」【要判断 → Q3】

モバイルで初期 **6件**表示 → ボタンで +6件。絞り込み結果が6件以下なら非表示。

### 3-3. その他の縦圧縮

- タブ（`.tablist`）: モバイルで2段折り返し → **横スクロール1段 + scroll-snap** に
- 章間の余白 `--space-chapter` をモバイルで約15%圧縮
- 画像アスペクト比は 3:4 を維持（2カラムなら十分な視認性）

### 3-4. 効果見込み（コレクション章の縦の長さ）

| 状態 | 縦の長さ（375px幅） | 削減 |
|------|---------------------|------|
| 現状（1カラム・9件） | 約 4,700px | — |
| 2カラム・9件 | 約 2,000px | −57% |
| 2カラム・初期6件 | 約 1,400px | **−70%** |
| 2カラム・絞り込み後（例: 青のみ2件） | 約 700px | −85% |

---

## 4. 作業フェーズと成果物

| Phase | 内容 | 主な変更先 |
|-------|------|-----------|
| 1 | 色・サイズデータ付与（画像を目視確認） | `assets/data.js` |
| 2 | 画像 WebP 化・未使用削除・参照更新 | `assets/img/`, 全HTML/CSS |
| 3 | コレクション生成スクリプト + マークアップ差し替え | `tools/build-collection.mjs`, `a-classic/index.html` |
| 4 | 絞り込みUI（HTML/CSS/JS） | `collection-filter.js`, `style.css` |
| 5 | モバイル2カラム + 段階表示 + タブ横スクロール | `style.css` |
| 6 | ルート昇格・OGP・sitemap・404・.nojekyll | ルート各種 |
| 7 | git init → push → Pages 有効化 | — |
| 8 | Playwright で 320/375/768/1024/1440 検証 + a11y + リンク切れ検査 | — |

### 検証（グローバルルール準拠）
- 視覚回帰: 320 / 375 / 768 / 1024 / 1440 でスクリーンショット
- アクセシビリティ: キーボード操作、色スウォッチのラベル、`aria-live` の件数通知、コントラスト
- 動作: 絞り込みの AND/OR、URL復元、0件表示、並び替え、JS無効時に全件表示されること
- リンク切れ: 全 `href`/`src` の実在チェックスクリプト

---

## 5. 要判断事項

| # | 論点 | 推奨 |
|---|------|------|
| Q1 | ルートURL構成 | A案をルートに昇格（比較ページは `archive/` へ） |
| Q2 | サイズデータ | デモ値（5/7/9/11/13号）を付与し注記 |
| Q3 | モバイル段階表示 | 2カラム + 「さらに表示」(初期6件) |
| Q4 | リポジトリ公開範囲 | public（クライアント許諾の確認が前提） |
