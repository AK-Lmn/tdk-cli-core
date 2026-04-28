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
from typing import List, Dict, Any, Tuple


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


def get_font_path() -> str:
    """Find a suitable font on macOS."""
    font_paths = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/SFPro.ttf",
    ]
    for path in font_paths:
        if os.path.exists(path):
            return path
    # Return first one and let FFmpeg fail gracefully if not found
    return font_paths[0]


def generate_test_video(
    output_path: Path,
    width: int = 2560,
    height: int = 1440,
    duration: int = 1200,  # 20 minutes
    fps: int = 30
) -> None:
    """Generate a test video with color bars and text overlays."""
    
    print(f"🎬 Generating TDK CLI Tutorial Video")
    print(f"   Resolution: {width}x{height}")
    print(f"   Duration: {duration // 60} minutes")
    print(f"   Output: {output_path}")
    print()
    
    font_path = get_font_path()
    
    # Chapter timing (in seconds)
    chapters: List[Tuple[str, int, int]] = [
        ("TDK CLI Tutorial", 0, 3),
        ("Chapter 1: The Problem", 5, 8),
        ("Why local microservices dev is broken...", 8, 90),
        ("Chapter 2: Install & Verify", 95, 98),
        ("One-line setup with curl | bash", 98, 270),
        ("Chapter 3: Project Setup", 275, 278),
        ("PSR model: Project > Stack > Resource", 278, 540),
        ("Chapter 4: Create Resources", 545, 548),
        ("tdk resource identity-api --type backend", 548, 900),
        ("Chapter 5: The Magic", 905, 908),
        ("tdk up identity - services come alive", 908, 1260),
        ("Chapter 6: Ecosystem", 1265, 1268),
        ("Auto-discovery, validation, IDE support", 1268, 1190),
        ("github.com/tdk-landscape/tdk-cli", 1190, duration),
    ]
    
    # Build drawtext filters
    filters = []
    
    for text, start, end in chapters:
        # Calculate duration
        if end <= start:
            enable_expr = f"gte(t,{start})"
        else:
            enable_expr = f"between(t\\,{start}\\,{end})"
        
        # Adjust font size based on content
        if "Chapter" in text:
            fontsize = 72
            color = "0x4ade80"  # Green
            y_pos = "(h-text_h)/2-100"
        elif text.startswith("TDK CLI"):
            fontsize = 96
            color = "white"
            y_pos = "(h-text_h)/2"
        elif text.startswith("github.com"):
            fontsize = 48
            color = "0x666666"
            y_pos = "h-150"
        else:
            fontsize = 48
            color = "0xaaaaaa"
            y_pos = "(h-text_h)/2+50"
        
        filter_str = (
            f"drawtext=fontfile={font_path}:"
            f"text='{text}':"
            f"fontsize={fontsize}:"
            f"fontcolor={color}:"
            f"x=(w-text_w)/2:"
            f"y={y_pos}:"
            f"enable='{enable_expr}'"
        )
        filters.append(filter_str)
    
    # Combine all filters
    vf_chain = ",".join(filters)
    
    # Build FFmpeg command
    cmd = [
        "ffmpeg",
        "-y",  # Overwrite output
        "-f", "lavfi",
        "-i", f"color=c=0x0f0f1a:s={width}x{height}:d={duration}:r={fps}",
        "-vf", vf_chain,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-metadata", "title=TDK CLI Tutorial - 20 Minute Developer Guide",
        "-metadata", "author=TDK Landscape",
        "-metadata", "description=Complete tutorial for TDK CLI microservices development",
        str(output_path)
    ]
    
    print("🎞️  Encoding with FFmpeg...")
    print(f"   Duration: {duration}s at {fps}fps = {duration * fps} frames")
    print()
    
    try:
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
        print(f"📐 Resolution: {width}x{height} ({'1440p' if height == 1440 else '1080p' if height == 1080 else '4K'})")
        print(f"⏱️  Duration: {duration // 60} minutes {duration % 60}s")
        print()
        print("🎉 Ready to upload to YouTube or share!")
        print()
        print("Next steps:")
        print("  1. Open the video and verify quality")
        print("  2. Upload to YouTube with chapter timestamps")
        print("  3. Link from TDK CLI README")
        
    except subprocess.CalledProcessError as e:
        print("❌ FFmpeg encoding failed!")
        print()
        print("Error output:")
        print(e.stderr[:1000] if len(e.stderr) > 1000 else e.stderr)
        print()
        print("Common fixes:")
        print("  - Install FFmpeg with: brew install ffmpeg")
        print("  - Check font path exists:", font_path)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Generate TDK CLI tutorial video (Python fallback)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Generate full 20-minute 1440p video (default)
  python3 generate_video.py

  # Generate 1080p version (smaller file)
  python3 generate_video.py --resolution 1080p

  # Generate quick 60-second test
  python3 generate_video.py --duration 60 -o test.mp4
        """
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
    print("   Swift version requires full Xcode — using FFmpeg directly")
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
    output_path = Path(args.output).resolve()
    generate_test_video(
        output_path=output_path,
        width=width,
        height=height,
        duration=args.duration
    )


if __name__ == "__main__":
    main()
