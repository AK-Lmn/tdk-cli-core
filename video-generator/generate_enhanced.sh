#!/bin/bash
#
# TDK Video Generator - Enhanced Version
# Creates a 15-minute tutorial video with visual content
#

set -e

# Settings
DURATION=900  # 15 minutes
OUTPUT="TDK_Tutorial_15min.mp4"
WIDTH=2560
HEIGHT=1440
FPS=30

echo "🎬 TDK CLI Tutorial Generator"
echo "   Resolution: ${WIDTH}x${HEIGHT} @ ${FPS}fps"
echo "   Duration: 15 minutes"
echo "   Output: ${OUTPUT}"
echo ""

# Check FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg not found! Install with: brew install ffmpeg"
    exit 1
fi

echo "✅ FFmpeg found"
echo ""

# Create temp directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Generate individual chapter segments with different visuals
echo "📹 Generating chapter segments..."

# Chapter 0: Intro (0:00-1:00, 60s)
echo "   Chapter 0: Intro (60s)"
ffmpeg -y -f lavfi -i "sine=frequency=0:duration=60" \
    -f lavfi -i "color=c=0x1a1a2e:s=${WIDTH}x${HEIGHT}:r=${FPS}" \
    -vf "
        drawbox=x=0:y=0:w=${WIDTH}:h=${HEIGHT}:color=0x0f3460@0.3:t=fill,
        drawtext=text='TDK CLI':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=120:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-100,
        drawtext=text='Tilt Development Kit':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=48:fontcolor=0x4ade80:x=(w-text_w)/2:y=(h-text_h)/2+50,
        drawtext=text='Complete Developer Tutorial (15 min)':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=36:fontcolor=0xaaaaaa:x=(w-text_w)/2:y=(h-text_h)/2+120,
        fade=t=out:st=55:d=5
    " \
    -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -an \
    "${TEMP_DIR}/ch00.mp4" 2>/dev/null

# Chapter 1: The Problem (1:00-3:00, 120s)
echo "   Chapter 1: The Problem (120s)"
ffmpeg -y -f lavfi -i "sine=frequency=0:duration=120" \
    -f lavfi -i "testsrc=duration=120:size=${WIDTH}x${HEIGHT}:rate=${FPS}" \
    -vf "
        hue=s=0,
        drawbox=x=50:y=50:w=$((WIDTH-100)):h=100:color=0x0f3460@0.8:t=fill,
        drawtext=text='CHAPTER 1: The Problem':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=72:fontcolor=white:x=(w-text_w)/2:y=80,
        drawtext=text='Why local microservices development is broken':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=36:fontcolor=0xaaaaaa:x=(w-text_w)/2:y=170,
        drawtext=text='Docker Compose hell...':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=24:fontcolor=0xcccccc:x=200:y=400:enable='gte(t,10)',
        drawtext=text='Port conflicts, inconsistent environments':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=24:fontcolor=0xcccccc:x=200:y=450:enable='gte(t,20)',
        drawtext=text='Multiple READMEs, outdated instructions':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=24:fontcolor=0xcccccc:x=200:y=500:enable='gte(t,30)',
        drawtext=text='The solution: TDK CLI':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=48:fontcolor=0x4ade80:x=(w-text_w)/2:y=700:enable='gte(t,80)',
        fade=t=in:st=0:d=1,
        fade=t=out:st=118:d=2
    " \
    -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -an \
    "${TEMP_DIR}/ch01.mp4" 2>/dev/null

# Chapter 2: Install (3:00-5:00, 120s)
echo "   Chapter 2: Install & Verify (120s)"
ffmpeg -y -f lavfi -i "sine=frequency=0:duration=120" \
    -f lavfi -i "color=c=0x16213e:s=${WIDTH}x${HEIGHT}:r=${FPS}" \
    -vf "
        geq=lum='p(X,Y)':cb=128:cr=128,
        drawbox=x=50:y=50:w=$((WIDTH-100)):h=100:color=0x0f3460@0.8:t=fill,
        drawtext=text='CHAPTER 2: Install & Verify':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=72:fontcolor=white:x=(w-text_w)/2:y=80,
        drawtext=text='One command setup':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=48:fontcolor=0x4ade80:x=(w-text_w)/2:y=200,
        drawtext=text='curl -fsSL ... | bash':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=32:fontcolor=0xffffff:x=300:y=400:enable='gte(t,10)',
        drawtext=text='✅ Bun v1.2 installed':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=0x4ade80:x=300:y=500:enable='gte(t,30)',
        drawtext=text='✅ Tilt CLI available':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=0x4ade80:x=300:y=550:enable='gte(t,40)',
        drawtext=text='✅ tdk linked globally':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=0x4ade80:x=300:y=600:enable='gte(t,50)',
        drawtext=text='tdk doctor checks everything':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=0xaaaaaa:x=300:y=700:enable='gte(t,70)',
        fade=t=in:st=0:d=1,
        fade=t=out:st=118:d=2
    " \
    -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -an \
    "${TEMP_DIR}/ch02.mp4" 2>/dev/null

# Chapter 3: Project Setup (5:00-7:00, 120s)
echo "   Chapter 3: Project Setup (120s)"
ffmpeg -y -f lavfi -i "sine=frequency=0:duration=120" \
    -f lavfi -i "color=c=0x1a1a2e:s=${WIDTH}x${HEIGHT}:r=${FPS}" \
    -vf "
        drawbox=x=50:y=50:w=$((WIDTH-100)):h=100:color=0xe94560@0.8:t=fill,
        drawtext=text='CHAPTER 3: Project Setup':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=72:fontcolor=white:x=(w-text_w)/2:y=80,
        drawtext=text='PSR Hierarchy':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=48:fontcolor=0x4ade80:x=(w-text_w)/2:y=200,
        drawtext=text='📁 Project':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=36:fontcolor=white:x=400:y=400:enable='gte(t,10)',
        drawtext=text='  └── 📦 Stack':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=36:fontcolor=white:x=450:y=460:enable='gte(t,20)',
        drawtext=text='      └── ⚡ Resource':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=36:fontcolor=white:x=500:y=520:enable='gte(t,30)',
        drawtext=text='tdk project creates configs':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=0xaaaaaa:x=300:y=650:enable='gte(t,60)',
        drawtext=text='TILT_TECH_STACK.star - Platform versions':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=24:fontcolor=0xcccccc:x=300:y=720:enable='gte(t,75)',
        drawtext=text='TILT_RESOURCE_DEFAULTS.star - Ports, health':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=24:fontcolor=0xcccccc:x=300:y=760:enable='gte(t,85)',
        fade=t=in:st=0:d=1,
        fade=t=out:st=118:d=2
    " \
    -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -an \
    "${TEMP_DIR}/ch03.mp4" 2>/dev/null

# Chapter 4: Create Resources (7:00-9:00, 120s)
echo "   Chapter 4: Create Resources (120s)"
ffmpeg -y -f lavfi -i "sine=frequency=0:duration=120" \
    -f lavfi -i "testsrc=duration=120:size=${WIDTH}x${HEIGHT}:rate=${FPS}" \
    -vf "
        hue=s=0.5,
        drawbox=x=50:y=50:w=$((WIDTH-100)):h=100:color=0x533483@0.8:t=fill,
        drawtext=text='CHAPTER 4: Create Resources':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=72:fontcolor=white:x=(w-text_w)/2:y=80,
        drawtext=text='Backend + Frontend in one command':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=36:fontcolor=0xaaaaaa:x=(w-text_w)/2:y=180,
        drawtext=text='tdk resource identity-api --type backend':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=0x4ade80:x=250:y=400:enable='gte(t,10)',
        drawtext=text='Generates: service.json, Dockerfile, src/, tests/':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=24:fontcolor=0xcccccc:x=300:y=500:enable='gte(t,30)',
        drawtext=text='Auto-assigns ports 3000-4999':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=0xaaaaaa:x=300:y=650:enable='gte(t,60)',
        drawtext=text='Hono for backend, React + Vite for frontend':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=24:fontcolor=0xcccccc:x=300:y=720:enable='gte(t,80)',
        fade=t=in:st=0:d=1,
        fade=t=out:st=118:d=2
    " \
    -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -an \
    "${TEMP_DIR}/ch04.mp4" 2>/dev/null

# Chapter 5: The Magic (9:00-12:00, 180s)
echo "   Chapter 5: The Magic - tdk up (180s)"
ffmpeg -y -f lavfi -i "sine=frequency=0:duration=180" \
    -f lavfi -i "color=c=0x0f3460:s=${WIDTH}x${HEIGHT}:r=${FPS}" \
    -vf "
        drawbox=x=50:y=50:w=$((WIDTH-100)):h=100:color=0x4ade80@0.6:t=fill,
        drawtext=text='CHAPTER 5: The Magic':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=72:fontcolor=white:x=(w-text_w)/2:y=80,
        drawtext=text='tdk up identity':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=64:fontcolor=0x4ade80:x=(w-text_w)/2:y=250:enable='gte(t,10)',
        drawtext=text='🚀 identity-api    │ Building...':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=0xcccccc:x=300:y=450:enable='gte(t,40)',
        drawtext=text='🚀 identity-app    │ Installing...':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=0xcccccc:x=300:y=500:enable='gte(t,50)',
        drawtext=text='✅ identity-api    │ Running on :4000':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=0x4ade80:x=300:y=600:enable='gte(t,100)',
        drawtext=text='✅ identity-app    │ Running on :3000':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=0x4ade80:x=300:y=650:enable='gte(t,120)',
        drawtext=text='Health checks passing automatically':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=0xaaaaaa:x=300:y=750:enable='gte(t,140)',
        fade=t=in:st=0:d=1,
        fade=t=out:st=178:d=2
    " \
    -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -an \
    "${TEMP_DIR}/ch05.mp4" 2>/dev/null

# Chapter 6: Ecosystem (12:00-14:00, 120s)
echo "   Chapter 6: Ecosystem (120s)"
ffmpeg -y -f lavfi -i "sine=frequency=0:duration=120" \
    -f lavfi -i "color=c=0x1a1a2e:s=${WIDTH}x${HEIGHT}:r=${FPS}" \
    -vf "
        drawbox=x=50:y=50:w=$((WIDTH-100)):h=100:color=0xe94560@0.6:t=fill,
        drawtext=text='CHAPTER 6: Ecosystem':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=72:fontcolor=white:x=(w-text_w)/2:y=80,
        drawtext=text='More than just orchestration':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=36:fontcolor=0xaaaaaa:x=(w-text_w)/2:y=180,
        drawtext=text='🔍 Auto-discovery finds services':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=0xcccccc:x=300:y=400:enable='gte(t,10)',
        drawtext=text='✓ Validation catches misconfigs early':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=0xcccccc:x=300:y=470:enable='gte(t,30)',
        drawtext=text='🔧 IDE extensions for VS Code':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=0xcccccc:x=300:y=540:enable='gte(t,50)',
        drawtext=text='📝 Deterministic, reproducible builds':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=28:fontcolor=0xcccccc:x=300:y=610:enable='gte(t,70)',
        drawtext=text='github.com/tdk-landscape/tdk-cli':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=36:fontcolor=0x4ade80:x=(w-text_w)/2:y=780:enable='gte(t,95)',
        fade=t=in:st=0:d=1,
        fade=t=out:st=118:d=2
    " \
    -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -an \
    "${TEMP_DIR}/ch06.mp4" 2>/dev/null

# Chapter 7: Outro (14:00-15:00, 60s)
echo "   Chapter 7: Outro (60s)"
ffmpeg -y -f lavfi -i "sine=frequency=0:duration=60" \
    -f lavfi -i "color=c=0x0f0f1a:s=${WIDTH}x${HEIGHT}:r=${FPS}" \
    -vf "
        drawbox=x=0:y=0:w=${WIDTH}:h=${HEIGHT}:color=0x1a1a2e@0.5:t=fill,
        drawtext=text='Thank You!':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=96:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-100,
        drawtext=text='Start building with TDK CLI':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=48:fontcolor=0x4ade80:x=(w-text_w)/2:y=(h-text_h)/2+50,
        drawtext=text='github.com/tdk-landscape/tdk-cli':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=36:fontcolor=0xaaaaaa:x=(w-text_w)/2:y=(h-text_h)/2+140,
        fade=t=in:st=0:d=2
    " \
    -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -an \
    "${TEMP_DIR}/ch07.mp4" 2>/dev/null

echo ""
echo "🎞️  Concatenating chapters..."

# Create concat file list
echo "file '${TEMP_DIR}/ch00.mp4'" > "${TEMP_DIR}/list.txt"
echo "file '${TEMP_DIR}/ch01.mp4'" >> "${TEMP_DIR}/list.txt"
echo "file '${TEMP_DIR}/ch02.mp4'" >> "${TEMP_DIR}/list.txt"
echo "file '${TEMP_DIR}/ch03.mp4'" >> "${TEMP_DIR}/list.txt"
echo "file '${TEMP_DIR}/ch04.mp4'" >> "${TEMP_DIR}/list.txt"
echo "file '${TEMP_DIR}/ch05.mp4'" >> "${TEMP_DIR}/list.txt"
echo "file '${TEMP_DIR}/ch06.mp4'" >> "${TEMP_DIR}/list.txt"
echo "file '${TEMP_DIR}/ch07.mp4'" >> "${TEMP_DIR}/list.txt"

# Concatenate with chapter metadata
ffmpeg -y -f concat -safe 0 -i "${TEMP_DIR}/list.txt" \
    -c copy \
    -movflags +faststart \
    -metadata title="TDK CLI Tutorial - 15 Minute Developer Guide" \
    -metadata author="TDK Landscape" \
    -metadata description="Complete tutorial for TDK CLI microservices development" \
    -metadata CHAPTER00=00:00:00.000 \
    -metadata CHAPTER00NAME="Intro: TDK CLI" \
    -metadata CHAPTER01=00:01:00.000 \
    -metadata CHAPTER01NAME="Chapter 1: The Problem" \
    -metadata CHAPTER02=00:03:00.000 \
    -metadata CHAPTER02NAME="Chapter 2: Install & Verify" \
    -metadata CHAPTER03=00:05:00.000 \
    -metadata CHAPTER03NAME="Chapter 3: Project Setup" \
    -metadata CHAPTER04=00:07:00.000 \
    -metadata CHAPTER04NAME="Chapter 4: Create Resources" \
    -metadata CHAPTER05=00:09:00.000 \
    -metadata CHAPTER05NAME="Chapter 5: The Magic" \
    -metadata CHAPTER06=00:12:00.000 \
    -metadata CHAPTER06NAME="Chapter 6: Ecosystem" \
    -metadata CHAPTER07=00:14:00.000 \
    -metadata CHAPTER07NAME="Outro" \
    "${OUTPUT}"

echo ""
echo "✅ Video generated successfully!"
echo ""
ls -lh "${OUTPUT}" | awk '{print "📁 Output: " $9 "\n📊 Size: " $5}'
echo "📐 Resolution: ${WIDTH}x${HEIGHT} (1440p)"
echo "⏱️  Duration: 15 minutes"
echo "🎬 Chapters: 8 with embedded markers"
echo ""
echo "🎉 Ready to upload to YouTube or share!"
echo ""
echo "Chapter timestamps for YouTube description:"
echo "  0:00 Intro: TDK CLI"
echo "  1:00 Chapter 1: The Problem"
echo "  3:00 Chapter 2: Install & Verify"
echo "  5:00 Chapter 3: Project Setup"
echo "  7:00 Chapter 4: Create Resources"
echo "  9:00 Chapter 5: The Magic"
echo "  12:00 Chapter 6: Ecosystem"
echo "  14:00 Outro"
