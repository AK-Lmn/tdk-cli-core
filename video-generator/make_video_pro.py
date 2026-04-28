#!/usr/bin/env python3
"""
TDK Video Generator PRO - Advanced Styling
Modern UI, animations, code highlighting, terminal mockups
"""

import os
import subprocess
import sys
import tempfile
import math
from pathlib import Path
from dataclasses import dataclass
from typing import List, Tuple, Optional

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
except ImportError:
    print("❌ Pillow not installed. Install with: pip3 install Pillow")
    sys.exit(1)


@dataclass
class Scene:
    duration: int  # seconds
    title: str
    subtitle: str
    content_type: str  # 'title', 'text', 'code', 'terminal', 'list'
    content: List[str]
    bg_colors: Tuple[Tuple[int, int, int], Tuple[int, int, int]]  # gradient colors
    accent_color: Tuple[int, int, int]


class VideoGenerator:
    def __init__(self, width: int = 2560, height: int = 1440, fps: int = 30):
        self.width = width
        self.height = height
        self.fps = fps
        self.frame_count = 0
        
        # Load fonts
        self.fonts = self._load_fonts()
    
    def _load_fonts(self) -> dict:
        """Load font files with fallbacks."""
        fonts = {}
        font_paths = [
            "/System/Library/Fonts/SFNS.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
            "/System/Library/Fonts/HelveticaNeue.ttc",
            "/Library/Fonts/Arial.ttf"
        ]
        
        # Find working font
        font_path = None
        for fp in font_paths:
            if os.path.exists(fp):
                font_path = fp
                break
        
        if not font_path:
            font_path = "/System/Library/Fonts/Helvetica.ttc"
        
        try:
            fonts['display'] = ImageFont.truetype(font_path, 120)
            fonts['title'] = ImageFont.truetype(font_path, 72)
            fonts['subtitle'] = ImageFont.truetype(font_path, 48)
            fonts['body'] = ImageFont.truetype(font_path, 32)
            fonts['code'] = ImageFont.truetype(font_path, 28)
            fonts['small'] = ImageFont.truetype(font_path, 24)
        except:
            fonts['display'] = ImageFont.load_default()
            fonts['title'] = fonts['display']
            fonts['subtitle'] = fonts['display']
            fonts['body'] = fonts['display']
            fonts['code'] = fonts['display']
            fonts['small'] = fonts['display']
        
        return fonts
    
    def create_gradient_background(self, color1: Tuple[int, int, int], 
                                   color2: Tuple[int, int, int]) -> Image.Image:
        """Create a vertical gradient background."""
        img = Image.new('RGB', (self.width, self.height), color1)
        
        for y in range(self.height):
            ratio = y / self.height
            r = int(color1[0] * (1 - ratio) + color2[0] * ratio)
            g = int(color1[1] * (1 - ratio) + color2[1] * ratio)
            b = int(color1[2] * (1 - ratio) + color2[2] * ratio)
            
            draw = ImageDraw.Draw(img)
            draw.line([(0, y), (self.width, y)], fill=(r, g, b))
        
        return img
    
    def add_grid_pattern(self, img: Image.Image, opacity: int = 20):
        """Add subtle grid pattern."""
        overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        
        grid_size = 80
        line_color = (255, 255, 255, opacity)
        
        for x in range(0, self.width, grid_size):
            draw.line([(x, 0), (x, self.height)], fill=line_color, width=1)
        
        for y in range(0, self.height, grid_size):
            draw.line([(0, y), (self.width, y)], fill=line_color, width=1)
        
        img_rgba = img.convert('RGBA')
        img_rgba = Image.alpha_composite(img_rgba, overlay)
        return img_rgba.convert('RGB')
    
    def add_glow_effect(self, img: Image.Image, x: int, y: int, 
                       radius: int, color: Tuple[int, int, int]):
        """Add glow effect behind elements."""
        overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        
        for r in range(radius, 0, -5):
            alpha = int(30 * (1 - r/radius))
            draw.ellipse([x-r, y-r, x+r, y+r], 
                        fill=(color[0], color[1], color[2], alpha))
        
        img_rgba = img.convert('RGBA')
        img_rgba = Image.alpha_composite(img_rgba, overlay)
        return img_rgba.convert('RGB')
    
    def draw_rounded_rect(self, draw: ImageDraw.Draw, xy: Tuple[int, int, int, int],
                         radius: int, fill: Tuple[int, int, int], 
                         outline: Optional[Tuple[int, int, int]] = None):
        """Draw a rounded rectangle."""
        x1, y1, x2, y2 = xy
        
        # Draw main rectangle
        draw.rectangle([x1+radius, y1, x2-radius, y2], fill=fill)
        draw.rectangle([x1, y1+radius, x2, y2-radius], fill=fill)
        
        # Draw corners
        draw.pieslice([x1, y1, x1+radius*2, y1+radius*2], 180, 270, fill=fill)
        draw.pieslice([x2-radius*2, y1, x2, y1+radius*2], 270, 360, fill=fill)
        draw.pieslice([x1, y2-radius*2, x1+radius*2, y2], 90, 180, fill=fill)
        draw.pieslice([x2-radius*2, y2-radius*2, x2, y2], 0, 90, fill=fill)
        
        if outline:
            draw.arc([x1, y1, x1+radius*2, y1+radius*2], 180, 270, fill=outline)
            draw.arc([x2-radius*2, y1, x2, y1+radius*2], 270, 360, fill=outline)
            draw.arc([x1, y2-radius*2, x1+radius*2, y2], 90, 180, fill=outline)
            draw.arc([x2-radius*2, y2-radius*2, x2, y2], 0, 90, fill=outline)
            draw.line([x1+radius, y1, x2-radius, y1], fill=outline)
            draw.line([x1+radius, y2, x2-radius, y2], fill=outline)
            draw.line([x1, y1+radius, x1, y2-radius], fill=outline)
            draw.line([x2, y1+radius, x2, y2-radius], fill=outline)
    
    def draw_terminal_mockup(self, img: Image.Image, commands: List[str], 
                            x: int, y: int, width: int, height: int):
        """Draw a terminal window mockup."""
        draw = ImageDraw.Draw(img)
        
        # Terminal background
        self.draw_rounded_rect(draw, [x, y, x+width, y+height], 12, 
                              (20, 20, 30), (60, 60, 80))
        
        # Title bar
        draw.rectangle([x, y, x+width, y+40], fill=(40, 40, 55))
        
        # Window buttons
        draw.ellipse([x+15, y+12, x+27, y+24], fill=(255, 95, 86))   # Close
        draw.ellipse([x+35, y+12, x+47, y+24], fill=(255, 189, 46))  # Minimize
        draw.ellipse([x+55, y+12, x+67, y+24], fill=(39, 201, 63))   # Maximize
        
        # Title
        draw.text((x+width//2-50, y+8), "Terminal", 
                 fill=(150, 150, 150), font=self.fonts['small'])
        
        # Commands
        line_y = y + 70
        for cmd in commands:
            if cmd.startswith('$'):
                # Prompt
                draw.text((x+20, line_y), '$', fill=(74, 222, 128), 
                         font=self.fonts['code'])
                draw.text((x+40, line_y), cmd[2:], fill=(220, 220, 220), 
                         font=self.fonts['code'])
            elif cmd.startswith('✓') or cmd.startswith('✅'):
                # Success
                draw.text((x+20, line_y), cmd, fill=(74, 222, 128), 
                         font=self.fonts['code'])
            else:
                # Output
                draw.text((x+20, line_y), cmd, fill=(170, 170, 170), 
                         font=self.fonts['code'])
            line_y += 35
    
    def draw_code_block(self, img: Image.Image, code_lines: List[str],
                       x: int, y: int, width: int):
        """Draw a code block with syntax highlighting."""
        draw = ImageDraw.Draw(img)
        
        # Calculate height
        line_height = 32
        height = len(code_lines) * line_height + 40
        
        # Background
        self.draw_rounded_rect(draw, [x, y, x+width, y+height], 8,
                              (25, 25, 35), (50, 50, 70))
        
        # Lines
        line_y = y + 20
        line_num = 1
        for line in code_lines:
            # Line number
            draw.text((x+15, line_y), f"{line_num:2d}", 
                     fill=(80, 80, 80), font=self.fonts['code'])
            
            # Code with syntax highlighting
            code_x = x + 55
            color = (200, 200, 200)
            
            if line.strip().startswith('#'):
                color = (100, 100, 100)  # Comment
            elif 'def ' in line or 'class ' in line or 'import ' in line:
                color = (255, 125, 175)  # Keyword
            elif '"' in line or "'" in line:
                color = (125, 255, 125)  # String
            elif any(c.isdigit() for c in line):
                color = (255, 200, 100)  # Number
            
            draw.text((code_x, line_y), line, fill=color, font=self.fonts['code'])
            
            line_y += line_height
            line_num += 1
    
    def render_frame(self, scene: Scene, frame_in_scene: int, 
                    total_frames_in_scene: int) -> Image.Image:
        """Render a single frame with animations."""
        # Background gradient
        img = self.create_gradient_background(scene.bg_colors[0], scene.bg_colors[1])
        
        # Add grid pattern
        img = self.add_grid_pattern(img, 15)
        
        draw = ImageDraw.Draw(img)
        
        # Animation progress (0.0 to 1.0)
        progress = frame_in_scene / total_frames_in_scene if total_frames_in_scene > 0 else 1.0
        
        # Easing function
        ease = lambda t: t * t * (3 - 2 * t)
        anim = ease(min(progress * 2, 1.0))  # Fast in, slow out
        
        # Corner decorations
        accent = scene.accent_color
        # Top-left corner bracket
        draw.line([(60, 80), (60, 150)], fill=accent, width=3)
        draw.line([(60, 80), (130, 80)], fill=accent, width=3)
        # Bottom-right corner bracket
        draw.line([(self.width-60, self.height-80), (self.width-60, self.height-150)], 
                 fill=accent, width=3)
        draw.line([(self.width-60, self.height-80), (self.width-130, self.height-80)], 
                 fill=accent, width=3)
        
        if scene.content_type == 'title':
            # Title card with logo area
            # Glow behind title
            img = self.add_glow_effect(img, self.width//2, 350, 200, accent)
            draw = ImageDraw.Draw(img)
            
            # Title with animation
            title_y = int(300 + (1-anim) * 50)
            
            # Chapter label
            if frame_in_scene > 10:
                draw.text((100, 60), scene.content[0] if scene.content else "", 
                         fill=accent, font=self.fonts['body'])
            
            # Main title
            bbox = draw.textbbox((0, 0), scene.title, font=self.fonts['display'])
            title_x = (self.width - (bbox[2]-bbox[0])) // 2
            draw.text((title_x, title_y), scene.title, fill=(255, 255, 255), 
                     font=self.fonts['display'])
            
            # Subtitle
            sub_bbox = draw.textbbox((0, 0), scene.subtitle, font=self.fonts['subtitle'])
            sub_x = (self.width - (sub_bbox[2]-sub_bbox[0])) // 2
            draw.text((sub_x, title_y + 140), scene.subtitle, fill=(180, 180, 180), 
                     font=self.fonts['subtitle'])
            
            # Decorative line
            line_width = int(400 * anim)
            line_x = (self.width - line_width) // 2
            draw.line([(line_x, title_y + 220), (line_x + line_width, title_y + 220)], 
                     fill=accent, width=3)
        
        elif scene.content_type == 'terminal':
            # Draw terminal mockup
            self.draw_terminal_mockup(img, scene.content, 
                                     self.width//2 - 400, 250, 800, 400)
            
            # Title
            draw.text((100, 60), scene.title, fill=(255, 255, 255), font=self.fonts['title'])
            draw.text((100, 150), scene.subtitle, fill=(150, 150, 150), font=self.fonts['subtitle'])
        
        elif scene.content_type == 'code':
            # Title
            draw.text((100, 60), scene.title, fill=(255, 255, 255), font=self.fonts['title'])
            
            # Code block
            if frame_in_scene > 5:  # Delay code appearance
                self.draw_code_block(img, scene.content, 
                                   self.width//2 - 350, 200, 700)
        
        elif scene.content_type == 'list':
            # Title
            draw.text((100, 60), scene.title, fill=(255, 255, 255), font=self.fonts['title'])
            draw.text((100, 150), scene.subtitle, fill=(150, 150, 150), font=self.fonts['subtitle'])
            
            # List items with staggered animation
            y_pos = 300
            for i, item in enumerate(scene.content):
                item_anim = max(0, min(1, (progress - i*0.1) * 3))
                if item_anim > 0:
                    offset_x = int((1-item_anim) * 50)
                    
                    # Bullet point
                    draw.ellipse([120 + offset_x, y_pos + 10, 140 + offset_x, y_pos + 30], 
                                fill=accent)
                    
                    # Text
                    draw.text((160 + offset_x, y_pos), item, fill=(220, 220, 220), 
                             font=self.fonts['body'])
                
                y_pos += 70
        
        return img
    
    def generate(self, output_path: str, scenes: List[Scene]):
        """Generate the complete video."""
        print("🎬 TDK Video Generator PRO")
        print(f"   Resolution: {self.width}x{self.height} @ {self.fps}fps")
        print()
        
        total_duration = sum(s.duration for s in scenes)
        total_frames = total_duration * self.fps
        
        print(f"📊 {len(scenes)} scenes, {total_duration}s total")
        print()
        
        with tempfile.TemporaryDirectory() as temp_dir:
            frame_dir = Path(temp_dir) / "frames"
            frame_dir.mkdir()
            
            print("🎨 Rendering frames...")
            frame_count = 0
            
            for scene_idx, scene in enumerate(scenes):
                scene_frames = scene.duration * self.fps
                
                for f in range(scene_frames):
                    frame = self.render_frame(scene, f, scene_frames)
                    
                    frame_path = frame_dir / f"frame_{frame_count:06d}.png"
                    frame.save(frame_path, optimize=True)
                    
                    frame_count += 1
                    
                    if frame_count % 50 == 0:
                        pct = (frame_count / total_frames) * 100
                        print(f"   Progress: {pct:.1f}% ({frame_count}/{total_frames})", end="\r")
                
                print(f"   Scene {scene_idx+1}/{len(scenes)}: {scene.title[:40]}...")
            
            print(f"\n   Total: {frame_count} frames")
            print()
            
            # Encode
            print("🎞️  Encoding to H.264...")
            
            cmd = [
                "ffmpeg", "-y",
                "-framerate", str(self.fps),
                "-i", str(frame_dir / "frame_%06d.png"),
                "-c:v", "libx264",
                "-preset", "medium",
                "-crf", "23",
                "-pix_fmt", "yuv420p",
                "-movflags", "+faststart",
                "-metadata", "title=TDK CLI Tutorial - Advanced Edition",
                "-metadata", "author=TDK Landscape",
                output_path
            ]
            
            subprocess.run(cmd, check=True, capture_output=True)
            
            # Stats
            size = Path(output_path).stat().st_size
            print()
            print("✅ Video generated!")
            print(f"📁 {output_path}")
            print(f"📊 {size/1024/1024:.1f} MB")
            print(f"⏱️  {total_duration//60}m {total_duration%60}s")


def main():
    # Define scenes
    scenes = [
        # Intro
        Scene(
            duration=5,
            title="TDK CLI",
            subtitle="Tilt Development Kit",
            content_type="title",
            content=["INTRO"],
            bg_colors=((15, 15, 26), (26, 26, 46)),
            accent_color=(74, 222, 128)
        ),
        
        # Chapter 1: The Problem
        Scene(
            duration=60,
            title="The Problem",
            subtitle="Why local microservices dev is broken",
            content_type="list",
            content=[
                "Docker Compose configuration hell",
                "Port conflicts between services",
                "Inconsistent team environments",
                "Outdated README files",
                "Hours lost to setup issues"
            ],
            bg_colors=((26, 26, 46), (20, 20, 35)),
            accent_color=(233, 69, 96)
        ),
        
        # Chapter 2: Install
        Scene(
            duration=60,
            title="Install & Verify",
            subtitle="One command to rule them all",
            content_type="terminal",
            content=[
                "$ curl -fsSL ... | bash",
                "",
                "✓ Bun v1.2 installed",
                "✓ Tilt CLI available",
                "✓ tdk linked globally",
                "",
                "$ tdk doctor",
                "✓ All checks passing"
            ],
            bg_colors=((22, 33, 62), (15, 52, 96)),
            accent_color=(74, 222, 128)
        ),
        
        # Chapter 3: PSR Model
        Scene(
            duration=60,
            title="Project Setup",
            subtitle="PSR Hierarchy",
            content_type="list",
            content=[
                "📁 Project (root configuration)",
                "  └── 📦 Stack (deployment group)",
                "      └── ⚡ Resource (service)",
                "",
                "tdk project creates master configs",
                "Auto-assigns ports, health checks"
            ],
            bg_colors=((26, 26, 46), (83, 52, 131)),
            accent_color=(233, 69, 96)
        ),
        
        # Chapter 4: Create Resources
        Scene(
            duration=60,
            title="Create Resources",
            subtitle="Backend + Frontend in one command",
            content_type="terminal",
            content=[
                "$ tdk resource api --type backend",
                "  → Port 4000, Hono framework",
                "  → Dockerfile, tests/ generated",
                "",
                "$ tdk resource app --type frontend",
                "  → Port 3000, React + Vite",
                "  → TypeScript, Vitest ready"
            ],
            bg_colors=((83, 52, 131), (26, 26, 46)),
            accent_color=(255, 200, 100)
        ),
        
        # Chapter 5: The Magic
        Scene(
            duration=90,
            title="The Magic",
            subtitle="tdk up",
            content_type="terminal",
            content=[
                "$ tdk up identity",
                "",
                "🚀 identity-api    │ Building...",
                "🚀 identity-app    │ Installing...",
                "",
                "✅ identity-api    │ http://localhost:4000",
                "✅ identity-app    │ http://localhost:3000",
                "",
                "Health checks: PASS"
            ],
            bg_colors=((15, 52, 96), (10, 40, 80)),
            accent_color=(74, 222, 128)
        ),
        
        # Chapter 6: Ecosystem
        Scene(
            duration=60,
            title="Ecosystem",
            subtitle="Beyond orchestration",
            content_type="list",
            content=[
                "🔍 Auto-discovery finds services",
                "✓ Validation catches misconfigs",
                "🔧 IDE extensions (VS Code)",
                "📝 Deterministic builds",
                "",
                "github.com/tdk-landscape/tdk-cli"
            ],
            bg_colors=((26, 26, 46), (15, 15, 26)),
            accent_color=(74, 222, 128)
        ),
        
        # Outro
        Scene(
            duration=5,
            title="Thank You!",
            subtitle="Start building with TDK CLI",
            content_type="title",
            content=["OUTRO"],
            bg_colors=((15, 15, 26), (26, 26, 46)),
            accent_color=(74, 222, 128)
        ),
    ]
    
    # Generate
    gen = VideoGenerator(width=2560, height=1440, fps=30)
    gen.generate("TDK_Tutorial_PRO.mp4", scenes)


if __name__ == "__main__":
    main()
