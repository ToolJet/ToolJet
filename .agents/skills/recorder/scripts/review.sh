#!/bin/bash
# review.sh <video.mp4> <out.png> [interval]
i=${3:-2}
ffmpeg -loglevel error -y -i "$1" -vf "fps=1/$i,scale=576:360,tile=4x6:padding=4:color=red" -frames:v 1 "$2"
