# with a WISH — リニューアル提案サンプル

新郎タキシード専門ブランド **with a WISH**（松尾株式会社）フルリプレイス提案の、
実際に操作できるサンプルサイトです。

**公開URL:** https://nvidia9875.github.io/atelieryuka-sample/withawish/

> 2026-09-09 より Atelier Yuka のサイト（親ディレクトリ）の下層に統合。単独リポジトリ時代の URL は
> https://nvidia9875.github.io/atelieryuka_2_sample/ 。

## 採用案

クライアントFB（2026-07-26）で **Maison Formal「格式のメゾン」**（黒背景）に確定。
比較検討に使った3案は統合時に持ち込んでおらず、先方確認（2026-09-14）で不要となった。

## 制作の前提

- 商品データは現行サイトの実データ（全125型・品番・色・ライン・サイズ・素材）を使用
- 写真はすべて現行サイトの実写真
- 納期チェッカーは提案用のデモ計算（実システム非連携）
- 価格は現行方針のまま非掲載（売価は各衣裳店さまにて）
- **衣裳店さまログイン（統合ログイン）は提案から削除済み。**
  あわせて衣裳店デスクの4ツール（空き状況チェック・WEB予約登録・デジタルカタログ・
  販促素材ダウンロード）も削除し、業者さま向けは納期チェッカーと連絡先のみ
- 取引先の呼称は **「業者さま」**（先方確認 2026-09-14）。ナビ・CTA・見出しなど
  取引先に呼びかける導線はすべて業者さま。一方、新郎さま向けの説明文で
  お店そのものを指す場合は「衣裳店」のまま（例:「お近くの取扱い衣裳店でご試着」）
- デジタルカタログは **with a WISH 2026-2027 vol.35（50ページ・見開き単位）**。先方共有の
  印刷用PDF（5.5GB）からトンボを落として `assets/catalog/` に生成（2026-09-18）。配布用PDFは
  同じ画像から作り直した 16MB 版。1ページが冊子の見開きなので、ビューアは PC でも1画面1ページ
  （`#catalog-dialog.cat-single`）

## 構成

```
.
├── index.html          with a WISH のサイト本体
├── style.css           トークン / ベース / ヘッダー / ヒーロー / コレクション
├── style-b.css         下部セクション / モーダル / レスポンシブ
├── style-c.css         検索ドック / 絞り込みFAB / 比較トレイ・比較ビュー
├── catalog.css         デジタルカタログ（冊子ビューア）
├── script.js           本体の挙動
├── catalog.js          冊子ビューア（window.WWCatalog.open()）
├── assets/
│   ├── data.js         コンテンツデータ（全125型）
│   ├── img/            商品・ヒーロー・アバウト画像
│   └── catalog/        カタログ（pages/ 50枚 1600×1066・thumbs/ 50枚・配布用PDF 16MB）
└── data/products.json  商品データ元ファイル
```

ビルド不要の静的サイトです。ローカルで確認する場合:

```bash
python3 -m http.server 8942
# http://localhost:8942/
```

## デジタルカタログの差し替え手順

印刷用PDFにはトンボと色見本が付いているので、`pdfinfo -box` の TrimBox で切ってから WebP にします。

```bash
pdftoppm -jpeg -jpegopt quality=92 -r 110 カタログ.pdf raw/pg          # 見開き1面 ≒ 1930px 幅
pdfinfo -box -f 1 -l 50 カタログ.pdf > boxes.txt                       # ページごとの TrimBox
# TrimBox × (110/72) の矩形で sips -c/--cropOffset して crop/NN.jpg を作る
for f in crop/*.jpg; do n=$(basename "$f" .jpg)
  cwebp -q 76 -m 6 -resize 1600 0 "$f" -o assets/catalog/pages/$n.webp
  cwebp -q 70 -m 6 -resize 240 0 "$f" -o assets/catalog/thumbs/$n.webp
  sips -s format pdf "$f" --out onepage/$n.pdf                          # 配布用PDFの材料
done
pdfunite onepage/*.pdf assets/catalog/withawish-catalog-2026.pdf
```

ページ数が変わる場合は `catalog.js` の `PAGES` と、`index.html` の
`#cat-range` の `max`・「全58ページ」表記を合わせて更新してください。

## 対応環境

SP / PC 両対応。320 / 375 / 414 / 768 / 1024 / 1280 / 1440 / 1920px で横スクロール無しを確認済み。
カタログは SP＝1ページずつスワイプ、PC＝見開き（矢印・左右キー・スライダー・目次）。
拡大はボタン・ダブルタップ・ピンチ・Ctrl+ホイールに対応し、拡大中はドラッグで移動できる。
入口はコレクション章の導線ブロック（`#catalogue`）とヘッダーナビの CATALOGUE。
