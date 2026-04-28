import Foundation
import AVFoundation
import CoreGraphics

// MARK: - Video Renderer

/// Renders VideoComposition to video file using AVAssetWriter
public struct VideoRenderer {
    public let spec: VideoSpec
    
    public init(spec: VideoSpec) {
        self.spec = spec
    }
    
    /// Render composition to video file
    public func render(
        composition: VideoComposition,
        to outputURL: URL,
        progressHandler: ((Double) -> Void)? = nil
    ) async throws {
        // Remove existing file
        if FileManager.default.fileExists(atPath: outputURL.path) {
            try FileManager.default.removeItem(at: outputURL)
        }
        
        let writer = try AVAssetWriter(url: outputURL, fileType: .mov)
        
        // Video settings
        let videoSettings: [String: Any] = [
            AVVideoCodecKey: AVVideoCodecType.h264,
            AVVideoWidthKey: Int(spec.resolution.width),
            AVVideoHeightKey: Int(spec.resolution.height),
            AVVideoCompressionPropertiesKey: [
                AVVideoAverageBitRateKey: spec.videoBitrate,
                AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
                AVVideoQualityKey: 0.8
            ]
        ]
        
        let videoInput = AVAssetWriterInput(mediaType: .video, outputSettings: videoSettings)
        videoInput.expectsMediaDataInRealTime = false
        
        let sourceBufferAttributes: [String: Any] = [
            String(kCVPixelBufferPixelFormatTypeKey): kCVPixelFormatType_32ARGB,
            String(kCVPixelBufferWidthKey): Int(spec.resolution.width),
            String(kCVPixelBufferHeightKey): Int(spec.resolution.height)
        ]
        
        let pixelBufferAdaptor = AVAssetWriterInputPixelBufferAdaptor(
            assetWriterInput: videoInput,
            sourcePixelBufferAttributes: sourceBufferAttributes
        )
        
        writer.add(videoInput)
        
        // Start writing
        writer.startWriting()
        writer.startSession(atSourceTime: .zero)
        
        // Render frames
        let totalDuration = composition.totalDuration
        let frameCount = Int(totalDuration * spec.frameRate)
        let frameDuration = CMTime(value: 1, timescale: CMTimeScale(spec.frameRate))
        
        await withCheckedContinuation { continuation in
            videoInput.requestMediaDataWhenReady(on: DispatchQueue(label: "video.render")) {
                var frameIndex = 0
                
                while videoInput.isReadyForMoreMediaData && frameIndex < frameCount {
                    let currentTime = Double(frameIndex) / self.spec.frameRate
                    
                    guard let pixelBuffer = self.renderFrame(at: currentTime, from: composition) else {
                        frameIndex += 1
                        continue
                    }
                    
                    let presentationTime = CMTimeMultiply(frameDuration, multiplier: Int32(frameIndex))
                    pixelBufferAdaptor.append(pixelBuffer, withPresentationTime: presentationTime)
                    
                    frameIndex += 1
                    
                    // Report progress
                    if let handler = progressHandler {
                        let progress = Double(frameIndex) / Double(frameCount)
                        DispatchQueue.main.async {
                            handler(progress)
                        }
                    }
                }
                
                videoInput.markAsFinished()
                continuation.resume()
            }
        }
        
        // Finish writing
        await writer.finishWriting()
        
        if writer.status == .failed {
            throw RenderingError.writerFailed(writer.error)
        }
    }
    
    /// Render a single frame at the given time
    private func renderFrame(at time: TimeInterval, from composition: VideoComposition) -> CVPixelBuffer? {
        // Find which scene contains this time
        var sceneStartTime: TimeInterval = 0
        var targetScene: Scene? = nil
        var sceneLocalTime: TimeInterval = 0
        
        for scene in composition.scenes {
            let sceneEndTime = sceneStartTime + scene.duration
            if time >= sceneStartTime && time < sceneEndTime {
                targetScene = scene
                sceneLocalTime = time - sceneStartTime
                break
            }
            sceneStartTime = sceneEndTime
        }
        
        guard let scene = targetScene else { return nil }
        
        // Create pixel buffer
        var pixelBuffer: CVPixelBuffer?
        let attrs: [String: Any] = [
            String(kCVPixelBufferCGImageCompatibilityKey): true,
            String(kCVPixelBufferCGBitmapContextCompatibilityKey): true
        ]
        
        CVPixelBufferCreate(
            kCFAllocatorDefault,
            Int(spec.resolution.width),
            Int(spec.resolution.height),
            kCVPixelFormatType_32ARGB,
            attrs as CFDictionary,
            &pixelBuffer
        )
        
        guard let buffer = pixelBuffer else { return nil }
        
        CVPixelBufferLockBaseAddress(buffer, [])
        defer { CVPixelBufferUnlockBaseAddress(buffer, []) }
        
        // Create CGContext
        guard let context = CGContext(
            data: CVPixelBufferGetBaseAddress(buffer),
            width: Int(spec.resolution.width),
            height: Int(spec.resolution.height),
            bitsPerComponent: 8,
            bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
        ) else { return nil }
        
        // Render scene
        context.translateBy(x: 0, y: spec.resolution.height)
        context.scaleBy(x: 1.0, y: -1.0)
        
        scene.render(into: context, at: sceneLocalTime)
        
        return buffer
    }
    
    /// Composite multiple scenes with transitions (advanced)
    public func renderWithTransitions(
        composition: VideoComposition,
        transitions: [Transition],
        to outputURL: URL,
        progressHandler: ((Double) -> Void)? = nil
    ) async throws {
        // Similar to render() but with transition effects between scenes
        // Implementation would handle cross-fades, slides, etc.
        // For now, delegate to simple render
        try await render(composition: composition, to: outputURL, progressHandler: progressHandler)
    }
}

// MARK: - Transition

public struct Transition {
    public enum Style {
        case cut
        case fade(duration: TimeInterval)
        case slide(direction: Direction)
        case wipe(direction: Direction)
        
        public enum Direction {
            case left, right, up, down
        }
    }
    
    public let style: Style
    public let between: (Int, Int)  // Scene indices
}

// MARK: - Rendering Errors

public enum RenderingError: Error {
    case writerFailed(Error?)
    case invalidComposition(String)
    case frameRenderFailed(Int)
}

// MARK: - Composition Builder

/// Helper for building video compositions
public struct CompositionBuilder {
    private var scenes: [Scene] = []
    private var spec: VideoSpec = .production1440p
    private var audioTracks: [AudioTrack] = []
    
    public init() {}
    
    public mutating func setSpec(_ spec: VideoSpec) {
        self.spec = spec
    }
    
    public mutating func addScene(_ scene: Scene) {
        scenes.append(scene)
    }
    
    public mutating func addAudioTrack(_ track: AudioTrack) {
        audioTracks.append(track)
    }
    
    public mutating func addTitleCard(
        title: String,
        subtitle: String,
        duration: TimeInterval,
        chapterNumber: Int? = nil,
        icon: TitleCardScene.TDKIcon = .logo
    ) {
        let scene = TitleCardScene(
            title: title,
            subtitle: subtitle,
            duration: duration,
            resolution: spec.resolution,
            chapterNumber: chapterNumber,
            icon: icon
        )
        addScene(scene)
    }
    
    public mutating func addScreencast(
        from recording: ScreenRecording,
        highlightRegions: [HighlightRegion] = [],
        cursorPath: CursorPath? = nil
    ) {
        let scene = ScreencastScene(
            recording: recording,
            highlightRegions: highlightRegions,
            cursorPath: cursorPath,
            duration: recording.duration,
            resolution: spec.resolution
        )
        addScene(scene)
    }
    
    public mutating func addCodeDisplay(
        sourceCode: String,
        language: CodeScene.Language,
        duration: TimeInterval,
        highlightLines: ClosedRange<Int>? = nil,
        fileName: String? = nil
    ) {
        let scene = CodeScene(
            sourceCode: sourceCode,
            language: language,
            duration: duration,
            resolution: spec.resolution,
            highlightLines: highlightLines,
            fileName: fileName
        )
        addScene(scene)
    }
    
    public func build() -> VideoComposition {
        return VideoComposition(
            scenes: scenes,
            spec: spec,
            audioTracks: audioTracks
        )
    }
}
