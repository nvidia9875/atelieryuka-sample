# Atelier Yuka — サイトリプレイス提案（A案 Timeless Classic）

アトリエユカ（松尾株式会社）のサイトフルリプレイス提案。4案の比較を経て **A案「Timeless Classic — 銀座の正統」** に決定し、その案をルートに公開しています。

**公開URL**: https://nvidia9875.github.io/atelieryuka-sample/

> ⚠️ 提案用の限定公開ページです。`robots.txt` と全ページの `noindex` で検索エンジンには載せていません。
> ご予約フォームは動作サンプルで、送信されても実際の予約は行われません。

---

## 構成

```
/
├── index.html            A案トップ（決定案）
├── product.html          衣裳詳細（?code=型番）
├── style.css             基本スタイル（デザイントークン・レイアウト）
├── style-b.css           セクション別スタイル
├── collection-filter.css コレクション絞り込みのスタイル
├── script.js             フェードイン / カテゴリタブ / 予約ステップフォーム
├── collection-filter.js  コレクションの絞り込み・並び替え
├── product.js            衣裳詳細（assets/data.js から描画）
├── 404.html / robots.txt / .nojekyll
│
├── assets/
│   ├── data.js           ★全コンテンツの正（商品・色・価格・FAQ 等）
│   ├── img/              公開用 WebP（自動生成）
│   ├── img-src/          画像の原本（再生成用。公開ページからは参照しない）
│   ├── img-widths.json   srcset の幅記述子用（自動生成）
│   └── lightbox.js/.css  共通の画像拡大表示
│
├── archive/              検討時のアーカイブ
│   ├── index.html        4案の比較ページ
│   └── b-couture/ c-story/ d-motion/
│
├── data/                 出典データ（Shopify から取得した実データ）
└── tools/                メンテナンス用スクリプト
```

## コレクションの絞り込み

コレクション章では **色 / 価格 / シルエット / ライン / 名称・型番の検索** で絞り込めます。

- 軸どうしは **AND**、同じ軸の複数選択は **OR**
- 選択肢が2つ以上あるカテゴリにだけ、その軸を表示（1択の軸は出さない）
- 条件は URL に反映されるので、絞り込んだ状態をそのまま共有できる
  例: `?cat=color&color=blue,green&sort=price-desc`
- スマホは2カラム・初期6件表示で、「さらに表示」で追加

### サイズでの絞り込みについて

現行サイトの商品データにサイズ情報が含まれていないため、**サイズ軸は未実装**です。
サイズ表をご提供いただければ、`assets/data.js` の各アイテムに `sizes` を追加し、
同じ仕組みで軸を1つ増やすだけで対応できます。

### 色データについて

商品画像を1点ずつ目視確認して色系統を割り当てています（自動抽出だけではタキシードで
背景や肌色を拾ってしまうため）。定義は `assets/data.js` の `colors` にあります。

---

## メンテナンス

### コンテンツを変更する

`assets/data.js` が唯一の正です。商品の追加・価格変更・色の修正はここを編集し、
コレクション部分のHTMLを再生成します。

```bash
node tools/build-collection.mjs
```

`index.html` の `<!-- COLLECTION:START -->` 〜 `<!-- COLLECTION:END -->` の間が
差し替わります。**この範囲を直接編集しないでください**（再生成で上書きされます）。

### 画像を追加・差し替える

原本を `assets/img-src/` に置いてから実行します。用途ごとに最大幅を変えて WebP を生成し、
スマホ用の 440w とヒーローの 800w、`assets/img-widths.json` も作り直します。

```bash
bash tools/optimize-images.sh
node tools/build-collection.mjs   # srcset を張り直すため続けて実行する
```

### 公開前の確認

```bash
node tools/check-links.mjs        # href / src / srcset / data-full の実在チェック
node tools/audit-mobile.mjs       # 横スクロール・タップ領域・文字サイズ・画像の過剰解像度
```

`audit-mobile.mjs` はローカルサーバーが必要です。

```bash
python3 -m http.server 8899 --bind 127.0.0.1 &
node tools/audit-mobile.mjs http://127.0.0.1:8899
```

Playwright を使うため、初回のみ以下が必要です。

```bash
npm install playwright && npx playwright install chromium
```

---

## 実装メモ

- **ビルド不要**: 生成物はコミット済みなので、GitHub Pages はそのまま配信するだけで動きます
- **JS無効でも全商品が見える**: 絞り込みは静的HTMLの `data-*` 属性を見て表示を切り替える方式
- **画像**: トップの画像合計は 21.8MB → 3.6MB（84%削減）。`srcset` によりスマホの実転送量はさらに小さくなります
- **拡大表示**: `srcset` でスマホが小サイズを選んでも、`data-full` から原寸を読むので拡大時の画質は落ちません
- **アクセシビリティ**: 色スウォッチは色名テキストを併記（色だけに依存しない）、件数は `aria-live` で通知、`prefers-reduced-motion` を尊重

## 出典

写真・商品情報・価格は現行サイト（atelieryuka.com）より引用しています。
商品の愛称（Lumière 等）はリプレイス提案として付与したもので、実際の商品名ではありません。
