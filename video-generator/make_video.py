#!/usr/bin/env python3
"""
TDK Video Generator - Python/PIL Version
Generates frames with PIL/Pillow, encodes with FFmpeg
No Xcode license needed, no FFmpeg drawtext needed
"""

import os
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("❌ Pillow not installed. Install with: pip3 install Pillow")
    sys.exit(1)


def create_frame(width: int, height: int, title: str, subtitle: str = "", 
                 chapter: str = "", details: list = None, bg_color: tuple = (15, 15, 26)) -> Image.Image:
    """Create a single video frame with text."""
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Try to load fonts, fallback to default
    try:
        font_title = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 96)
        font_subtitle = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48)
        font_chapter = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 36)
        font_detail = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 28)
    except:
        font_title = ImageFont.load_default()
        font_subtitle = font_title
        font_chapter = font_title
        font_detail = font_title
    
    # Draw chapter label
    if chapter:
        draw.text((100, 60), chapter, fill=(74, 222, 128), font=font_chapter)
    
    # Draw title
    title_bbox = draw.textbbox((0, 0), title, font=font_title)
    title_width = title_bbox[2] - title_bbox[0]
    title_x = (width - title_width) // 2
    draw.text((title_x, 200), title, fill=(255, 255, 255), font=font_title)
    
    # Draw subtitle
    if subtitle:
        sub_bbox = draw.textbbox((0, 0), subtitle, font=font_subtitle)
        sub_width = sub_bbox[2] - sub_bbox[0]
        sub_x = (width - sub_width) // 2
        draw.text((sub_x, 350), subtitle, fill=(170, 170, 170), font=font_subtitle)
    
    # Draw details
    if details:
        y_pos = 500
        for detail in details:
            draw.text((200, y_pos), detail, fill=(204, 204, 204), font=font_detail)
            y_pos += 60
    
    return img


def generate_video(output_path: str = "TDK_Tutorial_Final.mp4", 
                   width: int = 2560, 
                   height: int = 1440, 
                   fps: int = 30):
    """Generate the full TDK tutorial video."""
    
    print("🎬 TDK Video Generator (Python/PIL)")
    print(f"   Resolution: {width}x{height} @ {fps}fps")
    print()
    
    # Scene definitions: (duration_seconds, title, subtitle, details, bg_color)
    scenes = [
        # Intro (5s)
        (5, "TDK CLI", "Tilt Development Kit", 
         ["Complete Developer Tutorial", "15 Minutes"], (15, 15, 26)),
        
        # Chapter 1: The Problem (60s)
        (60, "The Problem", "Why local microservices dev is broken",
         ["• Docker Compose configuration hell",
          "• Port conflicts between services", 
          "• Inconsistent environments across team",
          "• Multiple outdated README files",
          "",
          "The solution: TDK CLI"], (26, 26, 46)),
        
        # Chapter 2: Install (60s)  
        (60, "Install & Verify", "One command setup",
         ["curl -fsSL ... | bash",
          "",
          "✓ Bun v1.2 installed",
          "✓ Tilt CLI available", 
          "✓ tdk linked globally",
          "",
          "tdk doctor checks your environment"], (22, 33, 62)),
        
        # Chapter 3: Project Setup (60s)
        (60, "Project Setup", "PSR Hierarchy",
         ["Project",
          "  └── Stack", 
          "      └── Resource",
          "",
          "tdk project creates:",
          "  • TILT_TECH_STACK.star",
          "  • TILT_RESOURCE_DEFAULTS.star"], (26, 26, 46)),
        
        # Chapter 4: Create Resources (60s)
        (60, "Create Resources", "Backend + Frontend",
         ["tdk resource identity-api --type backend",
          "  → port 4000, Hono framework",
          "",
          "tdk resource identity-app --type frontend", 
          "  → port 3000, React + Vite",
          "",
          "Auto-generates: service.json, Dockerfile, tests/"], (83, 52, 131)),
        
        # Chapter 5: The Magic (90s)
        (90, "The Magic", "tdk up identity",
         ["$ tdk up identity",
          "",
          "🚀 identity-api    │ Building...",
          "🚀 identity-app    │ Installing...",
          "",
          "✅ identity-api    │ Running :4000",
          "✅ identity-app    │ Running :3000",
          "",
          "Health checks pass automatically"], (15, 52, 96)),
        
        # Chapter 6: Ecosystem (60s)
        (60, "Ecosystem", "Beyond orchestration",
         ["🔍 Auto-discovery finds services",
          "✓ Validation catches misconfigs",
          "🔧 IDE extensions for VS Code",
          "📝 Deterministic builds",
          "",
          "github.com/tdk-landscape/tdk-cli"], (26, 26, 46)),
        
        # Outro (5s)
        (5, "Thank You!", "Start building with TDK CLI", [], (15, 15, 26)),
    ]
    
    total_duration = sum(s[0] for s in scenes)
    print(f"📊 Total duration: {total_duration}s ({total_duration//60} minutes)")
    print(f"📹 {len(scenes)} scenes to render")
    print()
    
    # Create temp directory for frames
    with tempfile.TemporaryDirectory() as temp_dir:
        frame_dir = Path(temp_dir) / "frames"
        frame_dir.mkdir()
        
        # Generate frames
        print("🎨 Generating frames...")
        frame_count = 0
        current_time = 0
        
        for i, (duration, title, subtitle, details, bg_color) in enumerate(scenes):
            chapter_label = f"Chapter {i}" if i > 0 and i < len(scenes) - 1 else ""
            
            # Generate frames for this scene
            scene_frames = duration * fps
            for f in range(scene_frames):
                # Create frame
                img = create_frame(width, height, title, subtitle, chapter_label, details, bg_color)
                
                # Save frame
                frame_path = frame_dir / f"frame_{frame_count:06d}.png"
                img.save(frame_path)
                
                frame_count += 1
                
                # Progress
                if frame_count % 100 == 0:
                    print(f"   Frame {frame_count}/{total_duration * fps}", end="\r")
            
            current_time += duration
            print(f"   Scene {i+1}/{len(scenes)} complete: {title}")
        
        print(f"   Total frames: {frame_count}")
        print()
        
        # Encode with FFmpeg
        print("🎞️  Encoding with FFmpeg...")
        
        cmd = [
            "ffmpeg",
            "-y",
            "-framerate", str(fps),
            "-i", str(frame_dir / "frame_%06d.png"),
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "23",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            "-metadata", "title=TDK CLI Tutorial - 15 Minute Developer Guide",
            "-metadata", "author=TDK Landscape",
            # Chapter markers
            "-metadata", "CHAPTER00=00:00:00.000",
            "-metadata", "CHAPTER00NAME=Intro",
            "-metadata", "CHAPTER01=00:00:05.000",
            "-metadata", "CHAPTER01NAME=The Problem",
            "-metadata", "CHAPTER02=00:01:05.000",
            "-metadata", "CHAPTER02NAME=Install & Verify",
            "-metadata", "CHAPTER03=00:02:05.000",
            "-metadata", "CHAPTER03NAME=Project Setup",
            "-metadata", "CHAPTER04=00:03:05.000",
            "-metadata", "CHAPTER04NAME=Create Resources",
            "-metadata", "CHAPTER05=00:04:05.000",
            "-metadata", "CHAPTER05NAME=The Magic",
            "-metadata", "CHAPTER06=00:05:35.000",
            "-metadata", "CHAPTER06NAME=Ecosystem",
            "-metadata", "CHAPTER07=00:06:35.000",
            "-metadata", "CHAPTER07NAME=Outro",
            output_path
        ]
        
        try:
            result = subprocess.run(cmd, check=True, capture_output=True, text=True)
            
            print()
            print("✅ Video generated successfully!")
            print()
            
            # Stats
            file_size = Path(output_path).stat().st_size
            print(f"📁 Output: {output_path}")
            print(f"📊 Size: {file_size / 1024 / 1024:.1f} MB")
            print(f"📐 Resolution: {width}x{height} (1440p)")
            print(f"⏱️  Duration: {total_duration // 60} minutes {total_duration % 60}s")
            print(f"🎬 Chapters: {len(scenes)}")
            print()
            print("🎉 Ready to upload to YouTube!")
            print()
            print("Chapter timestamps:")
            print("  0:00 Intro")
            print("  0:05 The Problem")
            print("  1:05 Install & Verify")
            print("  2:05 Project Setup")
            print("  3:05 Create Resources")
            print("  4:05 The Magic")
            print("  5:35 Ecosystem")
            print("  6:35 Outro")
            
        except subprocess.CalledProcessError as e:
            print("❌ FFmpeg encoding failed")
            print(e.stderr)
            sys.exit(1)


if __name__ == "__main__":
    generate_video()
