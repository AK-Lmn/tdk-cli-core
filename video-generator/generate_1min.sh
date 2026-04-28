#!/bin/bash
#
# Simple TDK Video Generator - 1 minute first section test
#

set -e

WIDTH=2560
HEIGHT=1440
FPS=30
DURATION=60  # 1 minute for first section test
OUTPUT="TDK_1min_Test.mp4"

echo "🎬 Generating 1-Minute TDK Test Video"
echo "   Resolution: ${WIDTH}x${HEIGHT}"
echo "   Duration: 60 seconds (First section only)"
echo ""

# Check FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg not found!"
    exit 1
fi

echo "✅ FFmpeg found"
echo "🎞️  Encoding..."

# Generate 1 minute video with test pattern and text overlays
ffmpeg -y \
    -f lavfi -i "testsrc=duration=60:size=${WIDTH}x${HEIGHT}:rate=${FPS}" \
    -vf "
        drawtext=fontfile=/System/Library/Fonts/Helvetica.ttc:
        text='TDK CLI Tutorial':
        fontsize=120:fontcolor=white:
        x=(w-text_w)/2:y=200:
        enable='lte(t,5)',
        
        drawtext=fontfile=/System/Library/Fonts/Helvetica.ttc:
        text='Chapter 1: The Problem':
        fontsize=72:fontcolor=0x4ade80:
        x=(w-text_w)/2:y=400:
        enable='between(t,5,15)',
        
        drawtext=fontfile=/System/Library/Fonts/Helvetica.ttc:
        text='Why local microservices dev is broken':
        fontsize=48:fontcolor=0xaaaaaa:
        x=(w-text_w)/2:y=550:
        enable='between(t,5,15)',
        
        drawtext=fontfile=/System/Library/Fonts/Helvetica.ttc:
        text='Docker Compose issues, port conflicts...':
        fontsize=36:fontcolor=0xcccccc:
        x=(w-text_w)/2:y=700:
        enable='gte(t,20)',
        
        drawtext=fontfile=/System/Library/Fonts/Helvetica.ttc:
        text='The Solution: TDK CLI':
        fontsize=64:fontcolor=0x4ade80:
        x=(w-text_w)/2:y=(h-text_h)/2:
        enable='gte(t,45)'
    " \
    -c:v libx264 \
    -preset fast \
    -crf 23 \
    -pix_fmt yuv420p \
    -movflags +faststart \
    -metadata title="TDK CLI - 1 Minute Test" \
    -metadata author="TDK Landscape" \
    "${OUTPUT}"

echo ""
echo "✅ Video generated!"
ls -lh "${OUTPUT}"
