# TDK Video Generator

Swift CLI for generating 2K tutorial videos from terminal recordings.

## Quick Start

```bash
cd video-generator
swift build
swift run tdk-video generate --config tutorial.yaml
```

## Structure

- `Sources/TDKVideoGenerator/Core/` - Scene protocol, video specs, models
- `Sources/TDKVideoGenerator/Scenes/` - Scene implementations (terminal, code, titles)
- `Sources/TDKVideoGenerator/Terminal/` - Asciinema parser, theme renderer
- `Sources/TDKVideoGenerator/Rendering/` - AVComposition builder, frame rendering
- `Sources/TDKVideoGenerator/FFmpeg/` - FFmpeg encoder wrapper
- `Sources/TDKVideoCLI/` - Main CLI entry point

## Output

Generates `TDK_CLI_Tutorial_1440p.mp4` (2560x1440, 20 minutes, chapter markers)
