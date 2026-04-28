# TDK Video Generator

## Quick Start

### 1. Build the Project

```bash
cd video-generator
swift build
```

### 2. Validate System

```bash
# First, verify Xcode is properly selected
xcode-select -p

# If you see /Library/Developer/CommandLineTools, switch to full Xcode:
# sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# Now validate
swift run tdk-video validate
```

This checks for:
- ✅ Full Xcode installation (not just Command Line Tools)
- ✅ FFmpeg installation
- ✅ macOS 14.0+
- ✅ Swift 5.9+

### 3. Generate Default Tutorial

```bash
swift run tdk-video generate
```

This generates `TDK_Tutorial_1440p.mp4` (20 minutes, 2560x1440, 6 chapters)

### 4. Custom Configuration

```bash
swift run tdk-video generate --config my-tutorial.yaml --o my-video.mp4
```

## Project Structure

```
video-generator/
├── Package.swift                    # Swift Package Manager manifest
├── README.md                        # This file
├── tutorial.yaml                    # Default tutorial configuration
├── Sources/
│   ├── TDKVideoCLI/                 # CLI entry point
│   │   └── main.swift
│   └── TDKVideoGenerator/           # Library
│       ├── Core/                    # Scene protocol, specs
│       │   ├── Scene.swift
│       │   └── ScreenRecording.swift
│       ├── Scenes/                  # Scene implementations
│       │   ├── ScreencastScene.swift
│       │   ├── CodeScene.swift
│       │   └── TitleCardScene.swift
│       ├── Terminal/                # Asciinema support
│       │   ├── AsciinemaParser.swift
│       │   └── TerminalRenderer.swift
│       ├── Rendering/               # AVFoundation rendering
│       │   └── VideoRenderer.swift
│       └── FFmpeg/                  # FFmpeg encoding
│           └── FFmpegEncoder.swift
├── Tests/                           # Unit tests
└── Resources/                       # Assets
```

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
