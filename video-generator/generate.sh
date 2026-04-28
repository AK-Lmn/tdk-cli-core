#!/bin/bash
#
# Quick video generation script for TDK CLI tutorial
# Generates a simple 20-minute 1440p video with chapter metadata
#

set -e

# Default settings
RESOLUTION="1440p"
DURATION=1200  # 20 minutes
OUTPUT="TDK_Tutorial_1440p.mp4"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --resolution)
            RESOLUTION="$2"
            shift 2
            ;;
        --duration)
            DURATION="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Set dimensions
case $RESOLUTION in
    1080p)
        WIDTH=1920
        HEIGHT=1080
        ;;
    1440p)
        WIDTH=2560
        HEIGHT=1440
        ;;
    4k)
        WIDTH=3840
        HEIGHT=2160
        ;;
    *)
        echo "Unknown resolution: $RESOLUTION (use 1080p, 1440p, or 4k)"
        exit 1
        ;;
esac

echo "🎬 TDK Video Generator (Direct FFmpeg)"
echo "   Resolution: ${WIDTH}x${HEIGHT}"
echo "   Duration: ${DURATION}s ($((DURATION/60)) min)"
echo "   Output: $OUTPUT"
echo ""

# Check FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg not found! Install with: brew install ffmpeg"
    exit 1
fi

echo "✅ FFmpeg found"
echo "🎞️  Encoding..."

# Generate video with solid background and chapter metadata
# Using a dark blue background color
ffmpeg -y \
    -f lavfi \
    -i "color=c=0x0f0f1a:s=${WIDTH}x${HEIGHT}:d=${DURATION}:r=30" \
    -c:v libx264 \
    -preset medium \
    -crf 23 \
    -pix_fmt yuv420p \
    -movflags +faststart \
    -metadata title="TDK CLI Tutorial - 20 Minute Developer Guide" \
    -metadata author="TDK Landscape" \
    -metadata description="Complete tutorial for TDK CLI microservices development" \
    -metadata CHAPTER00=00:00:00.000 \
    -metadata CHAPTER00NAME="Intro: TDK CLI Tutorial" \
    -metadata CHAPTER01=00:00:05.000 \
    -metadata CHAPTER01NAME="Chapter 1: The Problem" \
    -metadata CHAPTER02=00:01:35.000 \
    -metadata CHAPTER02NAME="Chapter 2: Install & Verify" \
    -metadata CHAPTER03=00:04:35.000 \
    -metadata CHAPTER03NAME="Chapter 3: Project Setup" \
    -metadata CHAPTER04=00:09:05.000 \
    -metadata CHAPTER04NAME="Chapter 4: Create Resources" \
    -metadata CHAPTER05=00:15:05.000 \
    -metadata CHAPTER05NAME="Chapter 5: The Magic" \
    -metadata CHAPTER06=00:21:05.000 \
    -metadata CHAPTER06NAME="Chapter 6: Ecosystem" \
    "$OUTPUT"

echo ""
echo "✅ Video generated successfully!"
echo ""
echo "📁 Output: $OUTPUT"
ls -lh "$OUTPUT" 2>/dev/null | awk '{print "📊 Size: " $5}'
echo "📐 Resolution: ${WIDTH}x${HEIGHT}"
echo "⏱️  Duration: $((DURATION/60)) minutes"
echo ""
echo "🎉 Ready to upload to YouTube or share!"
