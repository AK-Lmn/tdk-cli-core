#!/usr/bin/env python3
"""
TDK Video Generator (Python Fallback - Simple Version)
Generates a tutorial video using FFmpeg without text overlays.

For text overlays, FFmpeg needs to be compiled with --enable-libfreetype
Install with: brew install ffmpeg --with-freetype
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path


def check_ffmpeg() -> bool:
    """Check if FFmpeg is installed."""
    try:
        subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            text=True,
            check=True
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def check_drawtext() -> bool:
    """Check if FFmpeg has drawtext filter."""
    try:
        result = subprocess.run(
            ["ffmpeg", "-filters"],
            capture_output=True,
            text=True,
            check=True
        )
        return "drawtext" in result.stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False


def generate_simple_video(
    output_path: Path,
    width: int = 2560,
    height: int = 1440,
    duration: int = 1200,  # 20 minutes
    fps: int = 30
) -> None:
    """Generate a simple video with color backgrounds for each chapter."""
    
    print(f"🎬 Generating TDK CLI Tutorial Video")
    print(f"   Resolution: {width}x{height}")
    print(f"   Duration: {duration // 60} minutes")
    print(f"   Output: {output_path}")
    print()
    
    has_drawtext = check_drawtext()
    if not has_drawtext:
        print("⚠️  FFmpeg drawtext filter not available (no FreeType support)")
        print("   Generating video with colored chapter backgrounds instead")
        print()
    
    # Chapter colors (dark theme variations)
    chapters = [
        ("Intro: TDK CLI Tutorial", 0, 5, "0x0f0f1a"),         # Very dark blue
        ("Chapter 1: The Problem", 5, 95, "0x1a1a2e"),        # Dark blue
        ("Chapter 2: Install & Verify", 95, 275, "0x16213e"),  # Navy
        ("Chapter 3: Project Setup", 275, 545, "0x0f3460"),      # Darker blue
        ("Chapter 4: Create Resources", 545, 905, "0x1a1a2e"),    # Dark blue
        ("Chapter 5: The Magic", 905, 1265, "0x16213e"),        # Navy
        ("Chapter 6: Ecosystem", 1265, 1190, "0x0f3460"),       # Darker blue
        ("Outro: github.com/tdk-landscape/tdk-cli", 1190, duration, "0x0f0f1a"),
    ]
    
    # Build FFmpeg command with concat demuxer for chapter transitions
    # We'll generate segments and concatenate them
    
    temp_dir = Path("/tmp/tdk_video_segments")
    temp_dir.mkdir(exist_ok=True)
    
    try:
        segment_files = []
        
        for i, (title, start, end, color) in enumerate(chapters):
            segment_duration = end - start
            if segment_duration <= 0:
                continue
                
            segment_file = temp_dir / f"segment_{i:02d}.mp4"
            segment_files.append(str(segment_file))
            
            cmd = [
                "ffmpeg",
                "-y",
                "-f", "lavfi",
                "-i", f"color=c={color}:s={width}x{height}:d={segment_duration}:r={fps}",
                "-c:v", "libx264",
                "-preset", "medium",
                "-crf", "23",
                "-pix_fmt", "yuv420p",
                str(segment_file)
            ]
            
            print(f"   Generating segment {i+1}/{len(chapters)}: {title[:30]}... ({segment_duration}s)")
            subprocess.run(cmd, check=True, capture_output=True)
        
        # Create concat file list
        concat_file = temp_dir / "concat_list.txt"
        with open(concat_file, "w") as f:
            for segment in segment_files:
                f.write(f"file '{segment}'\n")
        
        # Concatenate segments with chapter metadata
        print()
        print("🎞️  Concatenating segments...")
        
        # Build chapter metadata
        chapter_metadata = []
        current_time = 0
        for title, start, end, color in chapters[:-1]:  # Exclude outro from chapters
            if end <= start:
                continue
            hours = current_time // 3600
            minutes = (current_time % 3600) // 60
            seconds = current_time % 60
            chapter_metadata.append(f"CHAPTER{len(chapter_metadata):02d}={hours:02d}:{minutes:02d}:{seconds:02d}.000")
            chapter_metadata.append(f"CHAPTER{len(chapter_metadata)-1:02d}NAME={title}")
            current_time += (end - start)
        
        # Concatenate with metadata
        cmd = [
            "ffmpeg",
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(concat_file),
            "-c", "copy",
            "-movflags", "+faststart",
            "-metadata", "title=TDK CLI Tutorial - 20 Minute Developer Guide",
            "-metadata", "author=TDK Landscape",
            "-metadata", "description=Complete tutorial for TDK CLI microservices development",
        ]
        
        # Add chapter metadata
        for meta in chapter_metadata:
            cmd.extend(["-metadata", meta])
        
        cmd.append(str(output_path))
        
        subprocess.run(cmd, check=True, capture_output=True)
        
        print()
        print("✅ Video generated successfully!")
        print()
        
        # Get file size
        size = output_path.stat().st_size
        print(f"📁 Output: {output_path}")
        print(f"📊 Size: {size / 1024 / 1024:.1f} MB")
        print(f"📐 Resolution: {width}x{height} ({'1440p' if height == 1440 else '1080p' if height == 1080 else '4K'})")
        print(f"⏱️  Duration: {duration // 60} minutes {duration % 60}s")
        print(f"🎬 Chapters: {len(chapter_metadata) // 2}")
        print()
        print("🎉 Ready to upload!")
        print()
        print("Note: This is a chapter-marked video with colored backgrounds.")
        print("      For text overlays, install FFmpeg with FreeType support:")
        print("      brew reinstall ffmpeg --with-freetype")
        
    finally:
        # Cleanup temp files
        import shutil
        if temp_dir.exists():
            shutil.rmtree(temp_dir)


def main():
    parser = argparse.ArgumentParser(
        description="Generate TDK CLI tutorial video using FFmpeg",
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
    
    print("🎬 TDK Video Generator (Python + FFmpeg)")
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
    generate_simple_video(
        output_path=output_path,
        width=width,
        height=height,
        duration=args.duration
    )


if __name__ == "__main__":
    main()
