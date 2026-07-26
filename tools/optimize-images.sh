#!/usr/bin/env bash
# 画像最適化: assets/img-src/ の原本から assets/img/ へ WebP を生成する
#
#   使い方: bash tools/optimize-images.sh
#
# 原本は assets/img-src/ に保管し、リポジトリにもコミットする（再生成できる状態を保つため）。
# 用途ごとに最大幅を変えてリサイズし、cwebp でエンコードする。
set -euo pipefail

cd "$(dirname "$0")/.."
SRC="assets/img-src"
OUT="assets/img"

if [ ! -d "$SRC" ]; then
  echo "原本ディレクトリ $SRC が見つかりません" >&2
  exit 1
fi

mkdir -p "$OUT"

# 用途ごとの最大幅(px)と品質
#   商品画像はライトボックス拡大(最大約670px表示)を2xで賄える1000pxを上限にする
width_for() {
  case "$1" in
    hero-01.*)              echo 1600 ;;   # ヒーロー(全幅)
    hero-*)                 echo 1400 ;;   # 他案のヒーロー
    brand-*)                echo  800 ;;   # メゾンライン紹介(540px表示)
    journey-*)              echo  560 ;;   # フォトジャーニー(最大242px表示・拡大時も約444px幅)
    *)                      echo 1000 ;;   # 商品画像 wd/cd/tx/mo
  esac
}
quality_for() {
  case "$1" in
    hero-*)  echo 82 ;;
    *)       echo 80 ;;
  esac
}

before_total=0
after_total=0
count=0

for src in "$SRC"/*; do
  base="$(basename "$src")"
  stem="${base%.*}"
  dest="$OUT/$stem.webp"

  cap="$(width_for "$base")"
  q="$(quality_for "$base")"

  # 原本より大きくしない（拡大は画質を損なうだけ）
  src_w="$(sips -g pixelWidth "$src" 2>/dev/null | awk '/pixelWidth/{print $2}')"
  target_w="$cap"
  if [ -n "$src_w" ] && [ "$src_w" -lt "$cap" ]; then
    target_w="$src_w"
  fi

  cwebp -quiet -q "$q" -metadata none -resize "$target_w" 0 "$src" -o "$dest"

  b=$(stat -f%z "$src")
  a=$(stat -f%z "$dest")
  before_total=$((before_total + b))
  after_total=$((after_total + a))
  count=$((count + 1))
  printf '%-28s %5dKB -> %4dKB  (w=%s q=%s)\n' "$base" $((b / 1024)) $((a / 1024)) "$target_w" "$q"
done

echo "--------------------------------------------------------"
printf '%d ファイル: %.1fMB -> %.1fMB (%.0f%% 削減)\n' \
  "$count" \
  "$(echo "$before_total / 1048576" | bc -l)" \
  "$(echo "$after_total / 1048576" | bc -l)" \
  "$(echo "(1 - $after_total / $before_total) * 100" | bc -l)"

# ------------------------------------------------------------
# スマホ向けの小サイズ（srcset の 440w / ヒーローの 800w）
#   グリッドでは1枚が約126〜175pxで表示されるため、2xでも440pxで足りる。
#   拡大表示(ライトボックス)は data-full で原寸相当を読むので画質は落ちない。
# ------------------------------------------------------------
echo ""
echo "スマホ向けの小サイズを生成"
small_total=0
for src in "$SRC"/{wd,cd,tx,mo}-*; do
  [ -e "$src" ] || continue
  base="$(basename "$src")"
  stem="${base%.*}"
  cwebp -quiet -q 78 -metadata none -resize 440 0 "$src" -o "$OUT/$stem-440.webp"
  small_total=$((small_total + $(stat -f%z "$OUT/$stem-440.webp")))
done
cwebp -quiet -q 80 -metadata none -resize 800 0 "$SRC/hero-01.jpg" -o "$OUT/hero-01-800.webp"
printf '  商品画像の440w: %.1fMB / hero-01-800.webp: %dKB\n' \
  "$(echo "$small_total / 1048576" | bc -l)" "$(( $(stat -f%z "$OUT/hero-01-800.webp") / 1024 ))"

# ------------------------------------------------------------
# srcset の幅記述子に使うため、生成した画像の実寸を書き出す
# ------------------------------------------------------------
python3 - <<'PY'
import glob, json, os
from PIL import Image
sizes = {}
for p in sorted(glob.glob("assets/img/*.webp")):
    with Image.open(p) as im:
        sizes[os.path.basename(p)] = im.size[0]
with open("assets/img-widths.json", "w") as f:
    json.dump(sizes, f, indent=1, sort_keys=True)
print("assets/img-widths.json を書き出しました (%d 件)" % len(sizes))
PY
