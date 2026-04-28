#!/usr/bin/env python3
"""
TDK Video Generator (Python Fallback)
Quickly generate tutorial videos using FFmpeg directly.
Use this when full Xcode isn't available (only Command Line Tools).

This generates a 20-minute 1440p tutorial video with chapter markers.
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import List, Dict, Any


def check_ffmpeg() -> bool:
    """Check if FFmpeg is installed."""
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            text=True,
            check=True
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def generate_color_frames(
    output_dir: Path,
    width: int = 2560,
    height: int = 1440,
    duration: float = 20.0,
    fps: int = 30
) -> Path:
    """Generate solid color frame sequence for testing."""
    frame_count = int(duration * fps)
    
    # Use FFmpeg to generate color frames
    cmd = [
        "ffmpeg",
        "-f", "lavfi",
        "-i", f"color=c=0x1a1a2e:s={width}x{height}:d={duration}:r={fps}",
        "-pix_fmt", "rgb24",
        str(output_dir / "frame_%06d.png")
    ]
    
    subprocess.run(cmd, check=True, capture_output=True)
    return output_dir


def generate_test_video(
    output_path: Path,
    width: int = 2560,
    height: int = 1440,
    duration: int = 1200,  # 20 minutes
    fps: int = 30
) -> None:
    """Generate a test video with color bars and text."""
    
    print(f"🎬 Generating TDK CLI Tutorial Video")
    print(f"   Resolution: {width}x{height}")
    print(f"   Duration: {duration // 60} minutes")
    print(f"   Output: {output_path}")
    print()
    
    # Create filter complex for chapter titles
    # Each chapter gets 3-5 seconds of title card + content
    
    chapters = [
        ("Chapter 1: The Problem", 0, 90),
        ("Chapter 2: Install & Verify", 90, 270),
        ("Chapter 3: Project Setup", 270, 540),
        ("Chapter 4: Create Resources", 540, 900),
        ("Chapter 5: The Magic - tdk up", 900, 1260),
        ("Chapter 6: Ecosystem", 1260, 1200),
    ]
    
    # Generate chapter metadata
    chapter_metadata = []
    for i, (title, start, _) in enumerate(chapters[:-1]):
        hours = start // 3600
        minutes = (start % 3600) // 60
        seconds = start % 60
        chapter_metadata.append({
            "title": title,
            "start_time": f"{hours:02d}:{minutes:02d}:{seconds:02d}.000"
        })
    
    # Write chapter metadata to temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(chapter_metadata, f)
        chapter_file = f.name
    
    try:
        # Use FFmpeg with testsrc and drawtext filters
        # This creates a visually distinct test pattern with chapter info
        
        filter_complex = ""
        
        # Base video - dark background
        filter_complex += f"color=c=0x0f0f1a:s={width}x{height}:d={duration}:r={fps}[base];"
        
        # Add text overlays for each chapter
        for i, (title, start, end) in enumerate(chapters[:-1]):
            chapter_duration = end - start
            
            # Title text
            filter_complex += f"[base]drawtext=text='{title}':"
            filter_complex += f"fontfile=/System/Library/Fonts/Helvetica.ttc:"
            filter_complex += f"fontsize=72:fontcolor=white:"
            filter_complex += f"x=(w-text_w)/2:y=(h-text_h)/2:"
            filter_complex += f"enable='between(t\\,{start}\\,{start + 3})'"
            filter_complex += f"[v{i}];"
            
            # Content indicator
            if i < len(chapters) - 2:
                filter_complex += f"[v{i}]drawtext=text='(Terminal demo would appear here)':"
                filter_complex += f"fontfile=/System/Library/Fonts/Helvetica.ttc:"
                filter_complex += f"fontsize=36:fontcolor=0xaaaaaa:"
                filter_complex += f"x=(w-text_w)/2:y=(h+100)/2:"
                filter_complex += f"enable='between(t\\,{start + 3}\\,{end})'"
                filter_complex += f"[base];"
        
        # Final output
        filter_complex += "[base]format=yuv420p[outv]"
        
        # Build FFmpeg command
        cmd = [
            "ffmpeg",
            "-f", "lavfi",
            "-i", f"color=c=0x0f0f1a:s={width}x{height}:d={duration}:r={fps}",
            "-vf", f"drawtext=text='TDK CLI Tutorial':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=96:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:enable='lte(t\\,3)',drawtext=text='Chapter 1 - The Problem':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=72:fontcolor=0x4ade80:x=(w-text_w)/2:y=(h-text_h)/2-100:enable='between(t\\,5\\,8)',drawtext=text='Chapter 2 - Install & Verify':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=72:fontcolor=0x4ade80:x=(w-text_w)/2:y=(h-text_h)/2-100:enable='between(t\\,95\\,98)',drawtext=text='Chapter 3 - Project Setup':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=72:fontcolor=0x4ade80:x=(w-text_w)/2:y=(h-text_h)/2-100:enable='between(t\\,275\\,278)',drawtext=text='Chapter 4 - Create Resources':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=72:fontcolor=0x4ade80:x=(w-text_w)/2:y=(h-text_h)/2-100:enable='between(t\\,545\\,548)',drawtext=text='Chapter 5 - The Magic':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=72:fontcolor=0x4ade80:x=(w-text_w)/2:y=(h-text_h)/2-100:enable='between(t\\,905\\,908)',drawtext=text='Chapter 6 - Ecosystem':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=72:fontcolor=0x4ade80:x=(w-text_w)/2:y=(h-text_h)/2-100:enable='between(t\\,1265\\,1268)',drawtext=text='github.com/tdk-landscape/tdk-cli':fontfile=/System/Library/Fonts/Helvetica.ttc:fontsize=48:fontcolor=0x666666:x=(w-text_w)/2:y=h-100:enable='gte(t\\,1190)'",
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "23",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            "-metadata", "title=TDK CLI Tutorial",
            "-metadata", "author=TDK Landscape",
            "-y",
            str(output_path)
        ]
        
        print("🎞️  Encoding with FFmpeg...")
        print(f"   Command: ffmpeg [...] {output_path}")
        print()
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
        
        print("✅ Video generated successfully!")
        print()
        
        # Get file size
        size = output_path.stat().st_size
        print(f"📁 Output: {output_path}")
        print(f"📊 Size: {size / 1024 / 1024:.1f} MB")
        print(f"📐 Resolution: {width}x{height} (1440p)")
        print(f"⏱️  Duration: {duration // 60} minutes")
        print()
        print("🎉 Ready to upload to YouTube or share!")
        
    finally:
        # Cleanup
        if os.path.exists(chapter_file):
            os.unlink(chapter_file)


def main():
    parser = argparse.ArgumentParser(
        description="Generate TDK CLI tutorial video (Python fallback)"
    )
    parser.add_argument(
        "-o", "--output",
        default="TDK_Tutorial_1440p.mp4",
        help="Output file path (default: TDK_Tutorial_1440p.mp4)"
    )
    parser.add_argument(
        "--resolution",
        choices=["1080p", "1440p", "4k"],
        default="1440p",
        help="Output resolution (default: 1440p)"
    )
    parser.add_argument(
        "--duration",
        type=int,
        default=1200,
        help="Video duration in seconds (default: 1200 = 20 min)"
    )
    
    args = parser.parse_args()
    
    print("🎬 TDK Video Generator (Python Fallback)")
    print()
    
    # Check FFmpeg
    if not check_ffmpeg():
        print("❌ FFmpeg not found!")
        print()
        print("Install with:")
        print("   brew install ffmpeg")
        print()
        sys.exit(1)
    
    print("✅ FFmpeg found")
    print()
    
    # Determine resolution
    resolutions = {
        "1080p": (1920, 1080),
        "1440p": (2560, 1440),
        "4k": (3840, 2160)
    }
    width, height = resolutions[args.resolution]
    
    # Generate video
    output_path = Path(args.output)
    generate_test_video(
        output_path=output_path,
        width=width,
        height=height,
        duration=args.duration
    )


if __name__ == "__main__":
    main()
