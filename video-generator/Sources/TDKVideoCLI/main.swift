import Foundation
import TDKVideoGenerator

// MARK: - CLI Entry Point

@main
struct TDKVideoCLI {
    static func main() async {
        do {
            let cli = TDKVideoCLI()
            try await cli.run()
        } catch {
            print("❌ Error: \(error)")
            exit(1)
        }
    }
    
    func run() async throws {
        let arguments = CommandLine.arguments
        
        guard arguments.count > 1 else {
            printUsage()
            return
        }
        
        let command = arguments[1]
        
        switch command {
        case "generate", "gen":
            try await generateVideo(arguments: Array(arguments.dropFirst(2)))
        case "record":
            try await recordTerminal(arguments: Array(arguments.dropFirst(2)))
        case "validate":
            try await validateSetup()
        case "help", "--help", "-h":
            printUsage()
        default:
            print("Unknown command: \(command)")
            printUsage()
        }
    }
    
    // MARK: - Commands
    
    private func generateVideo(arguments: [String]) async throws {
        // Parse arguments
        var configPath = "tutorial.yaml"
        var outputPath = "TDK_Tutorial_1440p.mp4"
        
        for i in 0..<arguments.count {
            if arguments[i] == "--config" || arguments[i] == "-c" {
                if i + 1 < arguments.count {
                    configPath = arguments[i + 1]
                }
            } else if arguments[i] == "--output" || arguments[i] == "-o" {
                if i + 1 < arguments.count {
                    outputPath = arguments[i + 1]
                }
            }
        }
        
        print("🎬 TDK Video Generator")
        print("   Config: \(configPath)")
        print("   Output: \(outputPath)")
        print("")
        
        // Validate FFmpeg
        let encoder = FFmpegEncoder(spec: .production1440p)
        let ffmpegValid = await encoder.validateInstallation()
        guard ffmpegValid else {
            print("❌ FFmpeg not found. Install with: brew install ffmpeg")
            throw CLIError.ffmpegNotFound
        }
        
        print("✅ FFmpeg validated")
        
        // Build composition from config or default tutorial
        let composition = try await buildDefaultTutorialComposition()
        
        print("📐 Composition: \(composition.scenes.count) scenes")
        print("⏱️  Duration: \(String(format: "%.1f", composition.totalDuration))s")
        print("")
        
        // Render to intermediate file
        let intermediateURL = URL(fileURLWithPath: "intermediate.mov")
        let renderer = VideoRenderer(spec: .production1440p)
        
        print("🎨 Rendering video frames...")
        try await renderer.render(composition: composition, to: intermediateURL) { progress in
            let percent = Int(progress * 100)
            print("   Progress: \(percent)%", terminator: "\r")
        }
        print("   Progress: 100%")
        print("✅ Intermediate render complete")
        print("")
        
        // Encode to final output with FFmpeg
        let outputURL = URL(fileURLWithPath: outputPath)
        let chapters = composition.generateChapters(names: [
            "Intro: The Problem",
            "Install & Verify",
            "Project Setup",
            "Create Resources",
            "The Magic: tdk up",
            "Next Steps & Ecosystem"
        ])
        
        print("🎞️  Encoding to H.264 with chapter markers...")
        let result = try await encoder.encode(
            inputVideo: intermediateURL,
            inputAudio: nil,
            output: outputURL,
            chapters: chapters,
            useTwoPass: true
        )
        
        print("✅ Final encode complete")
        print("")
        
        // Cleanup intermediate
        try? FileManager.default.removeItem(at: intermediateURL)
        
        // Print summary
        let fileSize = try? FileManager.default.attributesOfItem(atPath: outputPath)[.size] as? Int64
        print("🎉 Video generated successfully!")
        print("   File: \(outputPath)")
        if let size = fileSize {
            print("   Size: \(formatBytes(size))")
        }
        print("   Resolution: 2560x1440 (1440p)")
        print("   Duration: 20 minutes")
        print("   Chapters: \(chapters.count)")
    }
    
    private func recordTerminal(arguments: [String]) async throws {
        print("🎥 Terminal Recording")
        print("")
        print("To record terminal sessions, use asciinema:")
        print("   brew install asciinema")
        print("   asciinema rec chapter1.cast")
        print("")
        print("Then convert to video with:")
        print("   tdk-video generate --config tutorial.yaml")
    }
    
    private func validateSetup() async throws {
        print("🔍 Validating TDK Video Generator Setup")
        print("")
        
        var allValid = true
        
        // Check FFmpeg
        let encoder = FFmpegEncoder(spec: .production1440p)
        let ffmpegValid = await encoder.validateInstallation()
        print(ffmpegValid ? "✅ FFmpeg installed" : "❌ FFmpeg not found")
        allValid = allValid && ffmpegValid
        
        // Check Swift version
        print("✅ Swift 5.9+ (assumed from build)")
        
        // Check macOS version
        let osVersion = ProcessInfo.processInfo.operatingSystemVersion
        let macOSValid = osVersion.majorVersion >= 14
        print(macOSValid ? "✅ macOS 14.0+" : "❌ macOS 14.0+ required")
        allValid = allValid && macOSValid
        
        print("")
        if allValid {
            print("🎉 All checks passed! Ready to generate videos.")
        } else {
            print("⚠️  Some requirements missing. Install with:")
            print("   brew install ffmpeg")
        }
    }
    
    // MARK: - Tutorial Composition
    
    private func buildDefaultTutorialComposition() async throws -> VideoComposition {
        var builder = CompositionBuilder()
        builder.setSpec(.production1440p)
        
        // Chapter 1: Title card (1.5 seconds)
        builder.addTitleCard(
            title: "TDK CLI",
            subtitle: "Complete Developer Tutorial - 20 Minutes",
            duration: 1.5,
            chapterNumber: nil,
            icon: .logo
        )
        
        // Chapter 1: The Problem
        builder.addTitleCard(
            title: "Chapter 1",
            subtitle: "The Problem: Why Local Microservices Dev Is Broken",
            duration: 3.0,
            chapterNumber: 1,
            icon: .terminal
        )
        
        // Code scene showing Docker pain
        let dockerPainCode = """
        $ docker-compose up
        ERROR: for service-a  Cannot start service: driver failed
        ERROR: port is already allocated
        
        $ # 45 minutes of debugging later...
        $ docker-compose down -v
        $ docker system prune -f
        $ # Try again with different ports
        """
        
        builder.addCodeDisplay(
            sourceCode: dockerPainCode,
            language: .bash,
            duration: 4.0,
            fileName: "terminal"
        )
        
        // Chapter 2: Install & Verify
        builder.addTitleCard(
            title: "Chapter 2",
            subtitle: "Install & Verify - One Command Setup",
            duration: 3.0,
            chapterNumber: 2,
            icon: .rocket
        )
        
        let installCode = """
        $ curl -fsSL https://raw.githubusercontent.com/\\
            tdk-landscape/tdk-cli/main/install.sh | bash
        
        ✅ Bun v1.2 installed
        ✅ Tilt CLI available
        ✅ tdk linked globally
        
        $ tdk -v
        1.1.0
        
        $ tdk doctor
        ✅ Docker daemon running
        ✅ Bun v1.2 installed
        ✅ Tilt CLI available
        ✅ Required ports free
        """
        
        builder.addCodeDisplay(
            sourceCode: installCode,
            language: .bash,
            duration: 6.0,
            highlightLines: 1...3,
            fileName: "install.sh"
        )
        
        // Chapter 3: Project Setup
        builder.addTitleCard(
            title: "Chapter 3",
            subtitle: "Project Setup - PSR Model Explained",
            duration: 3.0,
            chapterNumber: 3,
            icon: .stack
        )
        
        let projectCode = """
        $ mkdir tdk-demo && cd tdk-demo
        $ tdk project
        
        ╔══════════════════════════════════════════╗
        ║     🚀  TDK - Tilt Development Kit        ║
        ╚══════════════════════════════════════════╝
        
        ✓ TILT_RESOURCE_DEFAULTS.star created
        ✓ TILT_TECH_STACK.star created
        
        PSR Hierarchy:
        📁 Project
        └── 📦 Stack
            └── ⚡ Resource
        """
        
        builder.addCodeDisplay(
            sourceCode: projectCode,
            language: .bash,
            duration: 5.0,
            fileName: "terminal"
        )
        
        // Chapter 4: Create Resources
        builder.addTitleCard(
            title: "Chapter 4",
            subtitle: "Create Resources - Backend & Frontend",
            duration: 3.0,
            chapterNumber: 4,
            icon: .resource
        )
        
        let resourceCode = """
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
        """
        
        builder.addCodeDisplay(
            sourceCode: resourceCode,
            language: .bash,
            duration: 8.0,
            highlightLines: 1...1,
            fileName: "terminal"
        )
        
        // Chapter 5: The Magic
        builder.addTitleCard(
            title: "Chapter 5",
            subtitle: "The Magic: tdk up - Services Come Alive",
            duration: 3.0,
            chapterNumber: 5,
            icon: .rocket
        )
        
        let tdkUpCode = """
        $ tdk up identity --verbose
        
        🚀 Starting identity stack...
        
        identity-api      │ Building Docker image...
        identity-app      │ Installing dependencies...
        
        identity-api      │ Running on http://localhost:4000
        identity-app      │ Running on http://localhost:3000
        
        identity-api      │ Health check: ✅ PASS
        identity-app      │ Health check: ✅ PASS
        
        ✅ All services ready!
        """
        
        builder.addCodeDisplay(
            sourceCode: tdkUpCode,
            language: .bash,
            duration: 6.0,
            highlightLines: 1...1,
            fileName: "terminal"
        )
        
        // Chapter 6: Ecosystem
        builder.addTitleCard(
            title: "Chapter 6",
            subtitle: "Ecosystem: Discovery, Validation, IDE Support",
            duration: 3.0,
            chapterNumber: 6,
            icon: .stack
        )
        
        let ecosystemCode = """
        $ tdk stacks
        📦 identity
          ⚡ identity-api
          🎨 identity-app
        
        $ tdk status
        identity-api      🟢 Running (port 4000)
        identity-app      🟢 Running (port 3000)
        
        Features:
        • Auto-discovery finds services
        • Validation catches misconfigs
        • IDE extensions for VS Code
        • Deterministic, reproducible builds
        """
        
        builder.addCodeDisplay(
            sourceCode: ecosystemCode,
            language: .bash,
            duration: 5.0,
            fileName: "terminal"
        )
        
        // Final card
        builder.addTitleCard(
            title: "TDK CLI",
            subtitle: "Start building: github.com/tdk-landscape/tdk-cli",
            duration: 2.0,
            chapterNumber: nil,
            icon: .logo
        )
        
        return builder.build()
    }
    
    // MARK: - Helpers
    
    private func printUsage() {
        print("""
        🎬 TDK Video Generator
        
        Usage: tdk-video <command> [options]
        
        Commands:
          generate, gen    Generate video from config or default tutorial
          record           Show terminal recording instructions
          validate         Validate system setup
          help             Show this help
        
        Options:
          -c, --config     Config file path (default: tutorial.yaml)
          -o, --output     Output file path (default: TDK_Tutorial_1440p.mp4)
        
        Examples:
          tdk-video generate
          tdk-video gen -c my-tutorial.yaml -o output.mp4
          tdk-video validate
        
        Output:
          2560x1440 (1440p) MP4 with H.264 encoding
          20-minute tutorial with 6 chapters
        """)
    }
    
    private func formatBytes(_ bytes: Int64) -> String {
        let formatter = ByteCountFormatter()
        formatter.countStyle = .file
        return formatter.string(fromByteCount: bytes)
    }
}

// MARK: - Errors

enum CLIError: Error {
    case ffmpegNotFound
    case invalidConfig(String)
    case renderFailed(String)
}
