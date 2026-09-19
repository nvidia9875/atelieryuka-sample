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
├── product.html          衣裳詳細（?code=型番）。サイズの目安診断（正式表） → トップの予約フォームへ引き継ぐ
├── terms.html            レンタル規約（国内・国外）。tools/build-terms.mjs が assets/terms.js から生成
├── style.css             基本スタイル（デザイントークン・レイアウト）
├── style-b.css           セクション別スタイル
├── collection-filter.css コレクション絞り込みのスタイル
├── catalog.css / .js     デジタルカタログ（冊子ビューア。with a WISH から移植）
├── script.js             フェードイン / カテゴリタブ
├── reserve-form.js       予約フォーム（5ステップ・申込書の項目・規約同意）
├── collection-filter.js  コレクションの絞り込み・並び替え
├── product.js            衣裳詳細（assets/data.js から描画）＋サイズ診断
├── 404.html / robots.txt / .nojekyll
│
├── assets/
│   ├── data.js           ★全コンテンツの正（商品・色・価格・FAQ・ドレスのサイズ表 等）
│   ├── details.js        衣裳の説明文・素材（自動生成。衣裳詳細ページのみ読み込む）
│   ├── terms.js          レンタル規約の本文（国内・国外）。terms.html と予約フォームの同意ステップの元
│   ├── catalog/          Atelier Yuka 2026 カタログ（PDF・ページ画像 58枚・サムネイル）
│   ├── img/              公開用 WebP（自動生成）
│   ├── img-src/          画像の原本（再生成用。公開ページからは参照しない）
│   ├── img-widths.json   srcset の幅記述子用（自動生成）
│   └── lightbox.js/.css  共通の画像拡大表示
│
├── archive/              検討時のアーカイブ
│   ├── index.html        4案の比較ページ
│   └── b-couture/ c-story/ d-motion/
│
├── withawish/            with a WISH（業者さま向け・新郎タキシード）のサイト。黒背景のまま下層に統合
├── data/                 出典データ（Shopify から取得した実データ）
└── tools/                メンテナンス用スクリプト
```

## with a WISH との統合（2026-09-09〜）

先方の要望で、with a WISH のサイトをアトリエユカの下層（`withawish/`）に置いています。
それぞれ専用の CSS を読むので、見た目は独立したまま（アトリエユカ＝淡色、with a WISH＝黒）。

- アトリエユカ側の導線: ヘッダーの「業者さまはこちら」とフッター（先方確認 2026-09-14 で「業者さま」に決定）
- 現行ドメイン withawish.jp は残して `atelieryuka.com/withawish/` へ転送する方針（先方確認 2026-09-14）
- with a WISH 側の戻り導線: 上部バーの「Atelier Yuka のサイトへ」とヘッダーの「ATELIER YUKA」
- 単独リポジトリ時代の `archive/`（3案比較）は持ち込んでいない。元は `/Users/shun/Desktop/website/withawish`
- with a WISH のカタログは自社版（2026-2027 vol.35）を `withawish/assets/catalog/` に配置済み（2026-09-18）。アトリエユカ側は `assets/catalog/`（Atelier Yuka 2026）

## デジタルカタログ

コレクション章の末尾（`#catalogue`）とヘッダーの「カタログ」から開く冊子ビューア。
SP はスワイプ、PC は見開き。拡大（ボタン・ダブルタップ・ピンチ・Ctrl＋ホイール）とドラッグ移動に対応。

PDF を入れ替えるときは、ページ画像も作り直す。

```bash
pdftoppm -jpeg -jpegopt quality=92 -r 144 新しいカタログ.pdf raw/pg
for f in raw/pg-*.jpg; do
  n=$(basename "$f" .jpg); n=${n#pg-}
  cwebp -q 76 -m 6 -resize 1200 0 "$f" -o assets/catalog/pages/$n.webp
  cwebp -q 70 -m 6 -resize 220 0 "$f" -o assets/catalog/thumbs/$n.webp
done
```

ページ数が変わる場合は `catalog.js` の `PAGES` と、`index.html` の `#cat-range` の `max`・「全58ページ」表記を合わせる。

## 予約フォームと規約

トップの予約フォームは「試着予約申込書」（先方の紙の申込書）と同じ項目を 5 ステップで受け取る。
日程 → 衣裳（型番 4 点まで）→ サイズ（新婦・新郎の採寸）→ お客さま情報・お届け先（空港止め・オプション含む）→ 確認と規約同意。

- 条件表示は `data-when="ラジオ名:値,値"`、条件つき必須は `data-required-when`。隠れた欄は disabled になり、検証・要約から外れる
- 規約はご利用の目的で切り替える（海外挙式・フォト相談 → 国外、それ以外 → 国内）。同意しないと送信できず、同意した規約名と日時を送信内容に含める
- 規約本文は `assets/terms.js` だけを編集し、`node tools/build-terms.mjs` で `terms.html` を再生成する
- 送信はデモ（完了画面に送信内容をそのまま表示）。本番の送信先は未定

## サイズの目安（衣裳詳細ページ）

ドレスの詳細ページで、バスト・ウエスト・ヒップ・身長から目安サイズを出す。
結果と採寸値は「この結果を添えて試着を申し込む」でトップの予約フォームに引き継がれる
（`index.html?code=…&size=…&bust=…#reserve`）。タキシード・モーニングには出さない。

対応表 `AY.dressSizeChart` は **2026-09-19 受領の正式版**（with a WISH Ladies' SIZE LIST 2026-2027「サイズフリー」。3FT〜27FT、25FT は存在しない）。
サイトのドレス20点はすべてこの表の該当品番（AA/AY/BL/FI/GZ/HL/MV/VV）に入る。
同時に受領した「ジャストサイズ」（5T〜17T。該当品番 AA/AF/AX/MV/RD）は現行ラインナップに該当がなく、`AY.dressSizeChartJust` に将来用として置いてあるだけで未使用。

- **サイズ記号の読み方**（表の参考身長から推定。先方に確認中）: 数字＝号数相当、F＝サイズフリー（寸法を範囲で合わせる）、T の数＝身長の段階（T=160cm・TT=165cm・TTT=170cm）。判定は 160cm の行で行い、身長から段階を決める（`AY.dressHeightTiers`。ちょうど中間は低い方）
- **身長違いの記号は表にあるものだけ返す**（`AY.dressHeightVariants` = 7FTT / 7FTTT）。表に無い「9FTTT」のような記号は作らず、号数の記号（9FT）に「身長170cm向けの丈は表に記載がない」旨を添える。先方から他の号数にも TT/TTT があると回答があれば `AY.dressHeightTiersForAllSizes` を true にする
- **バストはビスチェの列で判定**（先方に伝えた基準）。`assets/details.js` の DESIGN に記載があってビスチェを含まないドレス（現状 `HLD-00084-01` 長袖のみ）だけレギュラーの列。DESIGN の記載が無い4点（HLD-00085-01 / HLD-00066 / AY6001 / AY5601）はビスチェ扱い
- **このドレスの展開**（`assets/details.js` の `size`）を結果に添え、号数が違う／号数は同じで丈が未判定（身長未入力）／一致／号数のみ一致で案内文を変える。18点は `7FTTT` の1サイズ
- 入力の検証は `AY.suggestDressSize` 側で行う（バスト 60〜150・ウエスト 45〜140・ヒップ 60〜160・身長 130〜200。フォームは `novalidate`）
- スキャンの手書き訂正は印刷値を採用し、誤植が疑われる 3FT バスト(レギュラー)「76-84」も推測で直さない（判定に使う寸法には手書き訂正なし）。詳細は `assets/data.js` のコメント
- 診断ロジックの単体確認: `node -e "const AY=require('./assets/data.js');console.log(AY.suggestDressSize(84,64,92,{height:170}))"`

## コレクションの絞り込み

コレクション章では **色 / 価格 / シルエット / ライン / 名称・型番の検索** で絞り込めます。

- 軸どうしは **AND**、同じ軸の複数選択は **OR**
- 選択肢が2つ以上あるカテゴリにだけ、その軸を表示（1択の軸は出さない）
- 条件は URL に反映されるので、絞り込んだ状態をそのまま共有できる
  例: `?cat=color&color=blue,green&sort=price-desc`
- スマホは2カラム・初期6件表示で、「さらに表示」で追加

### サイズでの絞り込みについて

**サイズ軸は未実装**です（サイズの目安診断は衣裳詳細ページにあります。下記「サイズの目安」参照）。サイズ情報自体は現行サイトにあり（購入バリエーションの選択肢。
`assets/details.js` に取り込み済みで衣裳詳細ページに表示しています）、ただし
**ドレス20点のうち18点が同じ `7FTTT` の1サイズ**のため、絞り込みの軸としては機能しません
（選択肢が実質1つ）。複数サイズがあるのは `AY6001` と `AY5601` のみ、
タキシード・モーニング12点にはサイズ設定がありません。

各衣裳のサイズ展開が増えた場合は、`assets/details.js` の `size` を軸に使う形で
同じ仕組みに1軸足すだけで対応できます。

### 色データについて

商品画像を1点ずつ目視確認して色系統を割り当てています（自動抽出だけではタキシードで
背景や肌色を拾ってしまうため）。定義は `assets/data.js` の `colors` にあります。

---

## 書体

**欧文・数字 = Cormorant Garamond ／ 和文 = Zen Kaku Gothic New** の2書体構成です。

トークンは `style.css` の `:root` にあります。和文用スタック（`--font-jp` / `--font-body`）は
先頭に欧文書体を置いているため、日本語の文中でも英数字だけが Cormorant Garamond で組まれます
（ブラウザがグリフ単位でフォールバックする性質を利用）。

| トークン | 用途 |
|---|---|
| `--font-en` | 欧文だけの見出し・価格（`Atelier Yuka` / `¥330,000`） |
| `--font-jp` | 和文見出し |
| `--font-body` | 本文 |
| `--font-ui` | 入力欄・検索欄（小さな英数字は可読性優先でゴシック） |

- Cormorant Garamond の既定はオールドスタイル数字（高さが不揃い）のため、
  `body` に `font-variant-numeric: lining-nums` を指定して型番・価格の数字の高さを揃えています。
- 和文がゴシックになった分、大見出しは 500 → 400 に落として字間をわずかに開けています。
- 3書体（Cormorant + Noto Sans JP + Shippori Mincho）から2書体に減らしたことで、
  トップページのWebフォント転送量は **約1,290KB → 約730KB** になりました。
  さらに削るなら本文の 300（Light）をやめて 400 に寄せると約565KBまで下がります。

## 衣裳の説明文・素材・サイズ

現行サイト（atelieryuka.com / Shopify）から、説明文・MATERIAL・DESIGN・GENRES・SIZE を
取得して `assets/details.js` に落とし、衣裳詳細ページに表示しています。文言は原文のままです。

```bash
node tools/fetch-product-details.mjs
```

- 型番は handle ではなく**商品タイトル**で突き合わせます（実サイト側で handle と型番がズレている商品があるため。例: `BLD-00055-11` → handle は `bld-00055-10`）
- **サイズは商品説明ではなく購入バリエーションの選択肢**から取ります。商品説明側にも SIZE の記載がある商品はありますが、他商品からの転記が残っていてバリエーションと食い違うもの（例: `MVD-00392-06` は本文「7号／9号」・実際は `7FTTT`）があるため、バリエーション側を正としています
- 項目ごとに有無が違うので、値のあるものだけ表示します。全項目が無ければ枠ごと非表示です
- 生成物はコミットするので、公開時にこのスクリプトを動かす必要はありません

現行サイト側の記載状況（32点中）:

| 項目 | 取得できる点数 | 備考 |
|---|---|---|
| 説明文 | 28点 | `HLD-00085-01` / `HLD-00066` は商品説明が空、`AY6001` / `AY5601` は素材とサイズのみ |
| 素材・デザイン・雰囲気 | 18点 | ドレスのみ。タキシード・モーニングには MATERIAL 欄が無く、生地名は説明文中に書かれている |
| サイズ | 20点 | ドレスのみ。18点は `7FTTT` の1サイズ |

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

写真・商品情報・価格・衣裳の説明文・素材は現行サイト（atelieryuka.com）より引用しています。
商品の愛称（Lumière 等）はリプレイス提案として付与したもので、実際の商品名ではありません。
