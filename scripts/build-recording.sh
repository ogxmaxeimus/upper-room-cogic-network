#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/brandonfonville/Projects/upper-room-cogic-network"
FRAMES="$ROOT/recordings/frames"
TEMP_FRAMES="/var/folders/vz/gxbd5c2d7396g8hhc71ghn0m0000gn/T/cursor/screenshots/Users/brandonfonville/Projects/upper-room-cogic-network/recordings/frames"
OUT="$ROOT/recordings/upper-room-network-demo-2min.mp4"
FPS="0.5" # 2 seconds per frame -> need 60 frames for 120s, or use concat with duration

mkdir -p "$FRAMES"

copy_frames() {
  if [ -d "$TEMP_FRAMES" ]; then
    cp -f "$TEMP_FRAMES"/frame-*.png "$FRAMES"/ 2>/dev/null || true
  fi
}

build_concat() {
  local list="$ROOT/recordings/concat.txt"
  local duration="$1"
  : > "$list"
  for f in "$FRAMES"/frame-*.png; do
    [ -f "$f" ] || continue
    printf "file '%s'\n" "$f" >> "$list"
    printf "duration %s\n" "$duration" >> "$list"
  done
  last=$(ls "$FRAMES"/frame-*.png 2>/dev/null | tail -1)
  if [ -n "${last:-}" ]; then
    printf "file '%s'\n" "$last" >> "$list"
  fi
}

copy_frames
count=$(ls "$FRAMES"/frame-*.png 2>/dev/null | wc -l | tr -d ' ')
if [ "$count" -lt 1 ]; then
  echo "No frames found in $FRAMES" >&2
  exit 1
fi

# Target ~120s total
duration=$(awk -v c="$count" 'BEGIN { printf "%.3f", 120 / c }')
build_concat "$duration"

ffmpeg -y -f concat -safe 0 -i "$ROOT/recordings/concat.txt" \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
  -c:v libx264 -pix_fmt yuv420p -movflags +faststart "$OUT"

echo "Saved $OUT ($(du -h "$OUT" | awk '{print $1}'), ${count} frames, ${duration}s each)"
