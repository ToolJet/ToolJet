#!/bin/bash
# montage.sh <glob-prefix> <out> [cols]
cols=${3:-3}
ffmpeg -loglevel error -y -pattern_type glob -i "$1*.png" -vf "scale=720:450,tile=${cols}x3:padding=6:color=red" -frames:v 1 "$2"
