#!/bin/zsh
# Renders the film: the frames and a silent mp4 (render.mjs), the score (score.mjs), the score
# brought to -16 LUFS in two passes, and the two muxed into out/arcana-final.mp4.
set -e
cd "$(dirname "$0")"
F=${1:-arcana}
node render.mjs ${F}.html ${@:2}
node score.mjs ${F}.html out/score.wav
# loudness: measure, then apply (the braces keep zsh from reading ":l" as a modifier)
read II TP LR TH <<< $(ffmpeg -hide_banner -i out/score.wav -af loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 \
  | sed -n '/{/,/}/p' | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['input_i'], d['input_tp'], d['input_lra'], d['input_thresh'])")
ffmpeg -v error -y -i out/score.wav -af loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${II}:measured_TP=${TP}:measured_LRA=${LR}:measured_thresh=${TH}:linear=true,aresample=48000 -c:a pcm_s16le out/score-16.wav
ffmpeg -v error -y -i out/${F}.mp4 -i out/score-16.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart out/${F}-final.mp4
ffmpeg -hide_banner -i out/${F}-final.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | head -2
echo "film: out/${F}-final.mp4"
