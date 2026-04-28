import Foundation
import CoreGraphics

// MARK: - Scene Protocol

/// A renderable scene that can be composited into a video
public protocol Scene {
    /// Duration of the scene in seconds
    var duration: TimeInterval { get }
    
    /// Target resolution for this scene
    var resolution: CGSize { get }
    
    /// Render the scene at a specific time into a graphics context
    /// - Parameters:
    ///   - context: The CoreGraphics context to render into
    ///   - time: Current time within the scene (0 to duration)
    func render(into context: CGContext, at time: TimeInterval)
}

// MARK: - Video Specification

/// Output video specifications
public struct VideoSpec {
    public let resolution: CGSize
    public let frameRate: Double
    public let videoCodec: VideoCodec
    public let videoBitrate: Int
    public let audioCodec: AudioCodec
    public let audioBitrate: Int
    public let pixelFormat: PixelFormat
    public let colorSpace: ColorSpace
    
    public init(
        resolution: CGSize,
        frameRate: Double,
        videoCodec: VideoCodec,
        videoBitrate: Int,
        audioCodec: AudioCodec,
        audioBitrate: Int,
        pixelFormat: PixelFormat,
        colorSpace: ColorSpace
    ) {
        self.resolution = resolution
        self.frameRate = frameRate
        self.videoCodec = videoCodec
        self.videoBitrate = videoBitrate
        self.audioCodec = audioCodec
        self.audioBitrate = audioBitrate
        self.pixelFormat = pixelFormat
        self.colorSpace = colorSpace
    }
    
    /// Production spec: 2560x1440 @ 30fps, 10 Mbps H.264
    public static let production1440p = VideoSpec(
        resolution: CGSize(width: 2560, height: 1440),
        frameRate: 30,
        videoCodec: .h264,
        videoBitrate: 10_000_000,
        audioCodec: .aac,
        audioBitrate: 256_000,
        pixelFormat: .yuv420p,
        colorSpace: .rec709
    )
    
    /// Test spec: 1920x1080 @ 30fps, 5 Mbps H.264
    public static let test1080p = VideoSpec(
        resolution: CGSize(width: 1920, height: 1080),
        frameRate: 30,
        videoCodec: .h264,
        videoBitrate: 5_000_000,
        audioCodec: .aac,
        audioBitrate: 128_000,
        pixelFormat: .yuv420p,
        colorSpace: .rec709
    )
}

public enum VideoCodec: String {
    case h264 = "libx264"
    case hevc = "libx265"
    case proRes422 = "prores_ks"
}

public enum AudioCodec: String {
    case aac = "aac"
}

public enum PixelFormat: String {
    case yuv420p = "yuv420p"
    case yuv422p = "yuv422p"
}

public enum ColorSpace: String {
    case rec709 = "bt709"
    case rec2020 = "bt2020"
}

// MARK: - Chapter Marker

/// Video chapter marker for navigation
public struct ChapterMarker {
    public let title: String
    public let time: TimeInterval
    public let description: String?
    
    public init(title: String, time: TimeInterval, description: String? = nil) {
        self.title = title
        self.time = time
        self.description = description
    }
}

// MARK: - Composition

/// A composition of multiple scenes
public struct VideoComposition {
    public let scenes: [Scene]
    public let spec: VideoSpec
    public let audioTracks: [AudioTrack]
    
    public var totalDuration: TimeInterval {
        scenes.reduce(0) { $0 + $1.duration }
    }
    
    public init(scenes: [Scene], spec: VideoSpec, audioTracks: [AudioTrack] = []) {
        self.scenes = scenes
        self.spec = spec
        self.audioTracks = audioTracks
    }
    
    /// Generate chapter markers from scene boundaries
    public func generateChapters(names: [String]) -> [ChapterMarker] {
        var chapters: [ChapterMarker] = []
        var currentTime: TimeInterval = 0
        
        for (index, scene) in scenes.enumerated() {
            let name = index < names.count ? names[index] : "Chapter \(index + 1)"
            chapters.append(ChapterMarker(title: name, time: currentTime))
            currentTime += scene.duration
        }
        
        return chapters
    }
}

// MARK: - Audio Track

/// Audio track attached to the composition
public struct AudioTrack {
    public let url: URL
    public let startTime: TimeInterval
    public let duration: TimeInterval?
    public let volume: Double
    
    public init(url: URL, startTime: TimeInterval, duration: TimeInterval? = nil, volume: Double = 1.0) {
        self.url = url
        self.startTime = startTime
        self.duration = duration
        self.volume = volume
    }
}
