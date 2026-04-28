# TDK CLI Video Tutorial Design
## 20-Minute Comprehensive Developer Guide

**Target:** 1500p-2K (2560x1440 or 1920x1080 upscale) @ 30fps  
**Format:** Follow-along tutorial with synchronized terminal, code, and voiceover  
**Output:** Single MP4 with chapters, captions, and companion checkpoint repo  
**Creation Stack:** Swift CLI + FFmpeg + AVFoundation

---

## 1. The Vision

A 20-minute video that takes a developer from zero to running microservices with TDK CLI. Not a marketing video — a genuine tutorial developers can pause, follow, and reproduce on their own machine.

**The "Whoa" Moment:** At minute 12, the viewer runs `tdk up identity` and sees 4 services (API, frontend, database, cache) all spin up with health checks passing — something that normally takes days of Docker Compose configuration.

---

## 2. Video Structure (20 Minutes, 6 Chapters)

| Time | Chapter | Content | Visual Style |
|------|---------|---------|--------------|
| 0:00-1:30 | **Intro: The Problem** | Why local microservices dev is broken (Docker Compose hell, port conflicts, inconsistent envs) | Terminal screencast showing typical pain |
| 1:30-4:00 | **Install & Verify** | One-line install, `tdk doctor`, first commands | Split screen: terminal + text overlays |
| 4:00-8:00 | **Project Setup** | `tdk project`, explain PSR model (Project-Stack-Resource), examine generated configs | Code viewer with syntax highlighting |
| 8:00-12:00 | **Create Resources** | `tdk resource identity-api --type backend`, `tdk resource identity-app --type frontend`, explore generated code | IDE view + file tree |
| 12:00-16:00 | **The Magic: `tdk up`** | Start stack, watch Tilt UI, verify health checks, open browser to running services | Full-screen terminal + browser |
| 16:00-20:00 | **Next Steps & Ecosystem** | `tdk stacks`, `tdk status`, mention discovery system, validation, IDE extensions | Command palette style |

**Chapter Markers:** Embedded for YouTube/QuickTime skipping  
**Caption File:** WebVTT with command highlights (bold when typed)

---

## 3. Swift Video Generation Architecture

### Why Swift?
- **AVFoundation** for precise frame-level composition
- **Core Animation** for smooth text/code animations
- **Metal** for GPU-accelerated compositing
- Type-safe, testable, integrates with FFmpeg via Process

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 TDKVideoGenerator (Swift)                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐      ┌─────────────────────────────┐   │
│  │ Scene Builder    │─────▶│ AVComposition              │   │
│  │ - Screencast     │      │ - Video tracks            │   │
│  │ - Code overlays  │      │ - Audio tracks            │   │
│  │ - Text cards     │      │ - Metadata (chapters)     │   │
│  └──────────────────┘      └─────────────┬───────────────┘   │
│                                           │                   │
│  ┌──────────────────┐                    ▼                   │
│  │ Asset Manager    │          ┌─────────────────────┐       │
│  │ - Recordings     │────────▶│ FFmpeg Encoder     │       │
│  │ - Code snippets  │          │ - 2K upscaling     │       │
│  │ - Fonts/theming  │          │ - H.264/HEVC       │       │
│  └──────────────────┘          │ - AAC audio        │       │
│                                │ - MP4 container      │       │
│                                └─────────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

**1. Scene Protocol**
```swift
protocol Scene {
    var duration: TimeInterval { get }
    var resolution: CGSize { get }
    func render(into context: CGContext, at time: TimeInterval)
}

struct ScreencastScene: Scene {
    let recording: ScreenRecording
    let highlightRegions: [HighlightRegion]
    let cursorPath: CursorPath
}

struct CodeScene: Scene {
    let sourceCode: String
    let language: Language
    let highlightLines: ClosedRange<Int>
    let typingAnimation: Bool
}

struct TitleCardScene: Scene {
    let title: String
    let subtitle: String
    let icon: TDKIcon
}
```

**2. FFmpeg Encoder Wrapper**
```swift
struct FFmpegEncoder {
    let inputFormat: VideoFormat
    let outputSpec: OutputSpecification
    
    func encode(composition: AVComposition, to outputPath: URL) async throws {
        // Export intermediate ProRes for quality
        // Then transcode to H.264 with 2-pass encoding
    }
}

struct OutputSpecification {
    let resolution: CGSize           // 2560x1440 (1440p) or 1920x1080
    let frameRate: Double            // 30fps
    let videoCodec: VideoCodec       // H.264 or HEVC
    let videoBitrate: Int            // 8-12 Mbps for crisp text
    let audioCodec: AudioCodec       // AAC 256kbps
    let chapterMarkers: [ChapterMarker]
}
```

**3. Screen Recording Capture**
```swift
struct ScreenRecorder {
    // Uses ReplayKit for macOS screen capture
    // Or: imports pre-recorded terminal sessions (asciinema format)
    
    func startCapture(region: CGRect, fps: Int) -> AsyncStream<CVPixelBuffer>
    func stopCapture() -> ScreenRecording
}

// Alternative: Asciinema import for perfect terminal reproducibility
struct AsciinemaImporter {
    func import(path: URL, terminalTheme: TerminalTheme) -> ScreencastScene
}
```

---

## 4. Technical Specifications

### Video Settings (1500p-2K Target)

```swift
let productionSpec = OutputSpecification(
    resolution: CGSize(width: 2560, height: 1440),  // 1440p, upscale from 1080p
    frameRate: 30,
    videoCodec: .h264,                              // H.264 High Profile
    videoBitrate: 10_000_000,                       // 10 Mbps CRF 18
    audioCodec: .aac,
    audioBitrate: 256_000,
    pixelFormat: .yuv420p,
    colorSpace: .rec709
)
```

### FFmpeg Command Generation

```swift
extension FFmpegEncoder {
    func generateCommand(composition: AVComposition, output: URL) -> [String] {
        return [
            "ffmpeg",
            "-f", "lavfi", "-i", "color=c=black:s=2560x1440:d=1200",  // 20 min base
            "-i", intermediateProResPath,
            "-i", voiceoverPath,
            "-map", "0:v", "-map", "1:v", "-map", "2:a",
            "-c:v", "libx264",
            "-preset", "slow",           // Quality over speed
            "-crf", "18",                // Visually lossless
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",   // Web-optimized
            "-c:a", "aac",
            "-b:a", "256k",
            "-metadata", "title=TDK CLI - Complete Developer Tutorial",
            "-metadata", "author=TDK Landscape",
            output.path
        ]
    }
}
```

### Terminal Recording Format

**Use Asciinema for reproducibility:**
```json
{
  "version": 2,
  "width": 120,
  "height": 40,
  "timestamp": 1714425600,
  "env": {"SHELL": "/bin/zsh", "TERM": "xterm-256color"},
  "title": "TDK CLI Tutorial - Chapter 3: Project Setup"
}
```

Each chapter recorded separately with exact timings, then composited with voiceover.

---

## 5. Tutorial Content Script

### Chapter 1: The Problem (0:00-1:30)

**Visual:** Terminal showing typical microservices pain  
**Voiceover:** "You've been there. Five services, five READMEs, five different 'quick start' guides that haven't been updated since 2022. Port conflicts. Database setup scripts that fail mysteriously. By the time you have anything running, you've forgotten why you started."

**On screen:**
```bash
$ docker-compose up
ERROR: for service-a  Cannot start service: driver failed
ERROR: port is already allocated
$ # 45 minutes of debugging...
```

### Chapter 2: Install & Verify (1:30-4:00)

**Visual:** Clean terminal, one command  
**Commands shown:**
```bash
$ curl -fsSL https://raw.githubusercontent.com/tdk-landscape/tdk-cli/main/install.sh | bash
# ... installation output ...

$ tdk -v
1.1.0

$ tdk doctor
✅ Docker daemon running
✅ Bun v1.2 installed
✅ Tilt CLI available
✅ Required ports free
```

### Chapter 3: Project Setup (4:00-8:00)

**Visual:** Terminal + file tree appearing  
**Commands:**
```bash
$ mkdir tdk-demo && cd tdk-demo
$ tdk project

╔══════════════════════════════════════════╗
║     🚀  TDK - Tilt Development Kit        ║
╚══════════════════════════════════════════╝

✓ TILT_RESOURCE_DEFAULTS.star created
✓ TILT_TECH_STACK.star created

$ cat TILT_TECH_STACK.star
# Platform tech stack:
# - Bun v1.2 (JavaScript runtime)
# - Vite v5 (Frontend tooling)
# - Prisma v7 (Database ORM)
# - NATS v2 (Message bus)
```

### Chapter 4: Create Resources (8:00-12:00)

**Visual:** IDE with generated files  
**Commands:**
```bash
$ tdk resource identity-api --type backend --stack identity
✅ Created identity-api/
  📄 service.json (port 4000)
  📦 package.json
  🔧 Dockerfile
  💻 src/index.ts (Hono framework)
  🧪 tests/api.test.ts

$ tdk resource identity-app --type frontend --stack identity
✅ Created identity-app/
  📄 service.json (port 3000)
  📦 package.json (React + Vite)
  💻 src/App.tsx
```

### Chapter 5: The Magic - `tdk up` (12:00-16:00)

**Visual:** Full-screen terminal, Tilt UI appears, services come online  
**Commands:**
```bash
$ tdk up identity --verbose

🚀 Starting identity stack...

identity-api      │ Building Docker image...
identity-app      │ Installing dependencies...
identity-api      │ Running on http://localhost:4000
identity-app      │ Running on http://localhost:3000
identity-api      │ Health check: ✅ PASS
identity-app      │ Health check: ✅ PASS

✅ All services ready!
```

**Browser opens** to `localhost:3000` — React app calling API at `:4000`

### Chapter 6: Ecosystem Overview (16:00-20:00)

**Visual:** Command palette with ecosystem features  
**Commands:**
```bash
$ tdk stacks
📦 identity
  ⚡ identity-api
  🎨 identity-app

$ tdk status
identity-api      🟢 Running (port 4000)
identity-app      🟢 Running (port 3000)

$ # Mention: discovery system auto-finds services
$ # Mention: validation catches misconfigurations early  
$ # Mention: IDE extensions for VS Code
```

---

## 6. Reproducibility Checkpoints

Companion GitHub repo with checkpoint commits at each chapter boundary:

```
tdk-cli-video-tutorial/
├── checkpoints/
│   ├── 01-install/           # After chapter 2
│   ├── 02-project-init/      # After chapter 3
│   ├── 03-resources-created/ # After chapter 4
│   └── 04-stack-running/     # After chapter 5
├── assets/
│   ├── terminal-recordings/  # .cast files
│   ├── voiceover/            # .wav files per chapter
│   └── graphics/             # Logo, title cards
└── video-source/
    └── tdk-video-generator/ # Swift project
```

Each checkpoint includes:
- Exact command history
- Generated files at that state
- Expected output from `tdk status`

---

## 7. Swift Implementation Roadmap

### Phase 1: Core Framework (Day 1-2)
- Scene protocol hierarchy
- Basic AVComposition builder
- FFmpeg process wrapper

### Phase 2: Terminal Integration (Day 3-4)
- Asciinema parser/importer
- Terminal theme renderer (Dracula, minimal)
- Cursor animation system

### Phase 3: Polish Features (Day 5-6)
- Code syntax highlighting (Splash or native)
- Chapter marker injection
- Caption generation (Whisper integration?)

### Phase 4: Export Pipeline (Day 7)
- 2K ProRes intermediate
- Final H.264 encode with chapters
- Validation (ffprobe checks)

---

## 8. Quality Checklist

- [ ] 2560x1440 output verified (screenshot pixel check)
- [ ] Text remains sharp at 100% zoom (no compression artifacts)
- [ ] Audio levels consistent throughout (-16 LUFS)
- [ ] Chapter markers work in QuickTime/VLC
- [ ] All commands reproducible from checkpoint commits
- [ ] Total duration 19:30-20:30 range

---

## 9. Alternatives Considered

| Approach | Pros | Cons | Why Rejected |
|----------|------|------|--------------|
| **OBS Studio** | Free, familiar | Manual, hard to reproduce exactly | Not reproducible, no code sync |
| **ScreenFlow/Camtasia** | Good editing | macOS-only, manual timeline | No code-as-data, brittle |
| **Manim** | Programmatic, Python | Steep learning, not native screen | Wrong aesthetic for CLI tools |
| **Pure FFmpeg** | Fast, scriptable | Complex compositions, no types | Too low-level for this complexity |
| **Swift + FFmpeg (chosen)** | Type-safe, AVFoundation power, native performance | Requires Swift knowledge | Best balance of control and quality |

---

## 10. Success Metrics

**Technical:**
- Video exports in under 30 minutes on M1 Mac
- File size under 500MB (reasonable for 20 min 2K)
- Chapter markers work across all major players

**Content:**
- Viewer can pause at any chapter, run the commands, and get same result
- All commands copy-pasteable from captions
- Zero assumptions about prior knowledge (but doesn't bore experts)

---

**Design Status:** Ready for implementation  
**Next Step:** Scaffold Swift project structure and record first terminal session

</file>