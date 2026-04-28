import XCTest
@testable import TDKVideoGenerator

final class AsciinemaParserTests: XCTestCase {
    
    func testParseHeader() throws {
        let json = """
        {"version": 2, "width": 120, "height": 40, "timestamp": 1714425600, "title": "Test", "env": {"SHELL": "/bin/zsh", "TERM": "xterm-256color"}}
        """
        
        let data = json.data(using: .utf8)!
        let header = try JSONDecoder().decode(AsciinemaParser.Header.self, from: data)
        
        XCTAssertEqual(header.version, 2)
        XCTAssertEqual(header.width, 120)
        XCTAssertEqual(header.height, 40)
        XCTAssertEqual(header.title, "Test")
    }
    
    func testParseEmptyFile() {
        let emptyData = Data()
        XCTAssertThrowsError(try AsciinemaParser.parse(data: emptyData))
    }
    
    func testTerminalStateReconstruction() {
        // Create a simple asciicast
        let header = AsciinemaParser.Header(
            version: 2,
            width: 10,
            height: 5,
            timestamp: nil,
            title: nil,
            env: nil
        )
        
        let events = [
            AsciinemaParser.Event(time: 0.0, type: .output, data: "Hello"),
            AsciinemaParser.Event(time: 1.0, type: .output, data: "\nWorld"),
            AsciinemaParser.Event(time: 2.0, type: .output, data: "!")
        ]
        
        let asciicast = AsciinemaParser.Asciicast(header: header, events: events)
        
        // Get state at different times
        let state0 = AsciinemaParser.terminalState(at: 0.5, from: asciicast)
        let lines0 = state0.lines()
        XCTAssertEqual(lines0[0].trimmingCharacters(in: .whitespaces), "Hello")
        
        let state2 = AsciinemaParser.terminalState(at: 2.5, from: asciicast)
        let lines2 = state2.lines()
        XCTAssertTrue(lines2[0].contains("Hello"))
    }
}

final class TerminalRendererTests: XCTestCase {
    
    func testCalculateSize() {
        let renderer = TerminalRenderer(theme: .dracula, fontSize: 14)
        let size = renderer.calculateSize(width: 80, height: 24)
        
        // 80 chars * ~8.4px + 40px padding
        XCTAssertGreaterThan(size.width, 600)
        // 24 lines * ~19.6px + 40px padding
        XCTAssertGreaterThan(size.height, 400)
    }
    
    func testRenderTerminalState() {
        let renderer = TerminalRenderer(theme: .minimal)
        let state = TerminalState(
            screen: [
                Array("Hello World "),
                Array("$ _         ")
            ],
            cursorX: 2,
            cursorY: 1,
            width: 12,
            height: 2
        )
        
        let image = renderer.render(state: state)
        XCTAssertNotNil(image)
        XCTAssertEqual(image?.width, Int(renderer.calculateSize(width: 12, height: 2).width))
    }
}

final class SceneTests: XCTestCase {
    
    func testTitleCardScene() {
        let scene = TitleCardScene(
            title: "Test Title",
            subtitle: "Test Subtitle",
            duration: 3.0,
            resolution: CGSize(width: 1920, height: 1080),
            chapterNumber: 1,
            icon: .rocket
        )
        
        XCTAssertEqual(scene.duration, 3.0)
        XCTAssertEqual(scene.resolution.width, 1920)
    }
    
    func testVideoComposition() {
        let scenes: [Scene] = [
            TitleCardScene(
                title: "Chapter 1",
                subtitle: "Test",
                duration: 2.0,
                resolution: CGSize(width: 1920, height: 1080)
            ),
            TitleCardScene(
                title: "Chapter 2",
                subtitle: "Test",
                duration: 3.0,
                resolution: CGSize(width: 1920, height: 1080)
            )
        ]
        
        let composition = VideoComposition(
            scenes: scenes,
            spec: .test1080p
        )
        
        XCTAssertEqual(composition.totalDuration, 5.0)
        
        let chapters = composition.generateChapters(names: ["One", "Two"])
        XCTAssertEqual(chapters.count, 2)
        XCTAssertEqual(chapters[0].time, 0.0)
        XCTAssertEqual(chapters[1].time, 2.0)
    }
}

final class FFmpegEncoderTests: XCTestCase {
    
    func testGenerateCommand() {
        let spec = VideoSpec.test1080p
        let encoder = FFmpegEncoder(spec: spec)
        
        let inputVideo = URL(fileURLWithPath: "/tmp/input.mov")
        let output = URL(fileURLWithPath: "/tmp/output.mp4")
        
        let args = encoder.generateCommand(
            inputVideo: inputVideo,
            inputAudio: nil,
            output: output
        )
        
        XCTAssertTrue(args.contains("ffmpeg"))
        XCTAssertTrue(args.contains("-c:v"))
        XCTAssertTrue(args.contains("libx264"))
        XCTAssertTrue(args.contains("/tmp/output.mp4"))
    }
    
    func testGenerateChapterMetadata() {
        let encoder = FFmpegEncoder(spec: .test1080p)
        let chapters = [
            ChapterMarker(title: "Intro", time: 0.0),
            ChapterMarker(title: "Main", time: 60.0),
            ChapterMarker(title: "Outro", time: 300.0)
        ]
        
        // We can't easily test the private method, but we can verify
        // the command generation includes chapters
        let inputVideo = URL(fileURLWithPath: "/tmp/input.mov")
        let output = URL(fileURLWithPath: "/tmp/output.mp4")
        
        let args = encoder.generateCommand(
            inputVideo: inputVideo,
            inputAudio: nil,
            output: output,
            chapters: chapters
        )
        
        XCTAssertTrue(args.contains("-metadata"))
    }
}
