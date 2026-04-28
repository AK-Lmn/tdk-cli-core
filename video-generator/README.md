# TDK Video Generator

Two implementations:
1. **Swift version** (requires full Xcode) - Full-featured with scenes, animations, terminal rendering
2. **Shell script** (FFmpeg only) - Quick generation with chapter markers

---

## Quick Start (Shell Script - Recommended)

For immediate results without full Xcode:

```bash
cd video-generator

# Generate 20-minute 1440p tutorial
./generate.sh

# Generate 1080p version (smaller file)
./generate.sh --resolution 1080p

# Generate 1-minute test
./generate.sh --duration 60 -o test.mp4
```

**Requirements:** FFmpeg only (`brew install ffmpeg`)

---

## Swift Version (Full-Featured)

### Requirements

- **macOS 14.0+**
- **Full Xcode 15+** (App Store or developer.apple.com)
- **Swift 5.9+**
- **FFmpeg** (`brew install ffmpeg`)

⚠️ **Note:** Command Line Tools alone are insufficient for Swift Package Manager.

### Build & Run

```bash
cd video-generator

# Build
swift build

# Validate
swift run tdk-video validate

# Generate
swift run tdk-video generate
```

The Swift version provides:
- Scene-based rendering with transitions
- Terminal recording playback (asciinema)
- Syntax-highlighted code scenes
- Animated title cards
- Cursor animation
- Highlight regions

## Project Structure

```
video-generator/
├── generate.sh                      # ⭐ Quick FFmpeg script (no Xcode needed)
├── generate_video.py                # Python alternative (advanced)
├── Package.swift                    # Swift Package Manager
├── README.md                        # This file
├── tutorial.yaml                    # Tutorial configuration
├── Sources/                         # Swift implementation
│   ├── TDKVideoCLI/
│   │   └── main.swift              # CLI entry
│   └── TDKVideoGenerator/
│       ├── Core/                   # Scene protocol, specs
│       ├── Scenes/                 # Title cards, code, terminal
│       ├── Terminal/               # Asciinema parser
│       ├── Rendering/              # AVFoundation
│       └── FFmpeg/                 # Encoder wrapper
├── Tests/
└── Resources/
```

## Quick Comparison

| Feature | Shell Script | Swift Version |
|---------|--------------|---------------|
| **Requirements** | FFmpeg only | Full Xcode + FFmpeg |
| **Setup time** | Instant | ~10 min download |
| **Output** | 1440p video + chapters | 1440p + animations + text |
| **Terminal demos** | ❌ No | ✅ Asciinema playback |
| **Code highlighting** | ❌ No | ✅ Syntax highlighted |
| **Text overlays** | ❌ No | ✅ Dynamic text |
| **Build time** | 1 minute | 5-10 minutes |
| **Use case** | Quick test, CI/CD | Production video |

## Usage Examples

## Recording Terminal Sessions

Use asciinema for perfect reproducibility:

```bash
# Install asciinema
brew install asciinema

# Record a chapter
asciinema rec chapter1.cast

# Convert to video (later, when we add this feature)
# For now, use generated code scenes as placeholders
```

## Dependencies

- **macOS 14.0+** (required for modern AVFoundation features)
- **Xcode 15+** (required for Swift Package Manager — Command Line Tools alone are insufficient)
  - Install from App Store or https://developer.apple.com/download
  - Run `sudo xcode-select --install` if needed
- **Swift 5.9+** (included with Xcode 15+)
- **FFmpeg** (install with `brew install ffmpeg`)
  - H.264 encoding
  - Chapter marker support
  - Two-pass encoding

### Checking Your Setup

```bash
# Verify full Xcode is selected
xcode-select -p
# Should show: /Applications/Xcode.app/Contents/Developer

# If it shows /Library/Developer/CommandLineTools:
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Verify Swift Package Manager works
swift package --version
```

## Output Specifications

| Property | Value |
|----------|-------|
| Resolution | 2560x1440 (1440p) or 1920x1080 (1080p) |
| Frame Rate | 30 fps |
| Video Codec | H.264 High Profile |
| Bitrate | 10 Mbps (CRF 18) |
| Audio | AAC 256kbps (if present) |
| Container | MP4 with faststart |
| Chapters | 6 embedded chapter markers |

## Testing

```bash
# Run all tests
swift test

# Run specific test
swift test --filter AsciinemaParserTests
```

## Architecture

### Scene-Based Rendering

The video is composed of **Scenes**, each implementing the `Scene` protocol:

- **TitleCardScene**: Animated title cards with branding
- **ScreencastScene**: Terminal recordings with highlights
- **CodeScene**: Syntax-highlighted code display

### Rendering Pipeline

1. **Composition Builder** assembles scenes with timing
2. **VideoRenderer** uses AVAssetWriter to render frames
3. **FFmpegEncoder** transcodes to final H.264 with chapters

### Terminal Recording Format

Uses **Asciinema** (.cast files) for:
- Exact reproducibility
- Version control friendly (text, not video)
- Editable timing and content
- Small file sizes

## Future Enhancements

- [ ] Real-time screen capture (ReplayKit integration)
- [ ] Voiceover audio mixing
- [ ] Transition effects between scenes
- [ ] More syntax highlighting languages
- [ ] GPU-accelerated rendering (Metal)
- [ ] Automatic caption generation
- [ ] Thumbnail extraction

## License

MIT © TDK Landscape
