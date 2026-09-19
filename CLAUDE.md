# Atelier Yuka サイト（提案サンプル）— 作業メモ

詳細は `README.md`。ここには「間違えやすいこと」だけ置く。

## ディレクトリの正

- **Atelier Yuka と with a WISH の両方とも、このリポジトリが正。** 公開は GitHub Pages（`main` 直下 → https://nvidia9875.github.io/atelieryuka-sample/ ）
- **with a WISH は `withawish/` 配下で作業する。** `/Users/shun/Desktop/website/withawish`（単独リポジトリ）は 2026-09-14 で更新停止したアーカイブなので触らない
- `docs/` は社内メモ・先方とのやり取り・検証スクリーンショットの置き場で、**コミットしない**（`git add -A -- . ':!docs'`）

## 配置（2026-09-19〜）

- HTML はすべて直下（先方に共有済みの URL を変えないため）。`404.html` `robots.txt` `favicon.ico` `.nojekyll` も直下
- CSS は `assets/css/`、JS は `assets/js/`。生成物（`assets/js/details.js`・`terms.html`・`index.html` のコレクション部分）はコミットする＝公開時のビルド不要
- コンテンツの正は `assets/js/data.js`。商品・価格・サイズ表・FAQ はここを直して `node tools/build-collection.mjs`

## 公開前

```bash
node tools/check-links.mjs
python3 -m http.server 8899 --bind 127.0.0.1 &  # 別ターミナルでも可
node tools/audit-mobile.mjs http://127.0.0.1:8899
```

push ＝ 公開反映。ユーザーが「pages反映」「上げて」と言ったときだけ push する。
