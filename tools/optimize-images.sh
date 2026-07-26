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
    journey-*)              echo  900 ;;   # フォトジャーニー(640px表示)
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
