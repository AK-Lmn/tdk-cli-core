import Foundation
import CoreGraphics

// MARK: - Highlight Region

/// A region to highlight in a screencast
public struct HighlightRegion {
    public let rect: CGRect
    public let startTime: TimeInterval
    public let duration: TimeInterval
    public let style: HighlightStyle
    
    public init(rect: CGRect, startTime: TimeInterval, duration: TimeInterval, style: HighlightStyle = .default) {
        self.rect = rect
        self.startTime = startTime
        self.duration = duration
        self.style = style
    }
}

public struct HighlightStyle {
    public let color: CGColor
    public let cornerRadius: CGFloat
    public let borderWidth: CGFloat
    public let animate: Bool
    
    public init(color: CGColor, cornerRadius: CGFloat = 4, borderWidth: CGFloat = 2, animate: Bool = true) {
        self.color = color
        self.cornerRadius = cornerRadius
        self.borderWidth = borderWidth
        self.animate = animate
    }
    
    public static let `default` = HighlightStyle(
        color: CGColor(red: 0.2, green: 0.8, blue: 0.4, alpha: 0.8),
        cornerRadius: 4,
        borderWidth: 2,
        animate: true
    )
}

// MARK: - Cursor Path

/// Animated cursor movement path
public struct CursorPath {
    public struct Position {
        public let point: CGPoint
        public let time: TimeInterval
        public let click: Bool
        
        public init(point: CGPoint, time: TimeInterval, click: Bool = false) {
            self.point = point
            self.time = time
            self.click = click
        }
    }
    
    public let positions: [Position]
    
    public init(positions: [Position]) {
        self.positions = positions
    }
    
    /// Get cursor position at a specific time (interpolated)
    public func position(at time: TimeInterval) -> CGPoint? {
        guard let first = positions.first, let last = positions.last else { return nil }
        
        if time <= first.time { return first.point }
        if time >= last.time { return last.point }
        
        // Find surrounding positions
        for i in 0..<(positions.count - 1) {
            let current = positions[i]
            let next = positions[i + 1]
            
            if time >= current.time && time <= next.time {
                let t = (time - current.time) / (next.time - current.time)
                let x = current.point.x + (next.point.x - current.point.x) * CGFloat(t)
                let y = current.point.y + (next.point.y - current.point.y) * CGFloat(t)
                return CGPoint(x: x, y: y)
            }
        }
        
        return last.point
    }
    
    /// Check if cursor is clicking at this time
    public func isClicking(at time: TimeInterval, tolerance: TimeInterval = 0.1) -> Bool {
        positions.contains { position in
            position.click && abs(position.time - time) < tolerance
        }
    }
}

// MARK: - Screen Recording

/// A recorded screen session
public struct ScreenRecording {
    public let id: UUID
    public let frames: [Frame]
    public let frameRate: Double
    public let resolution: CGSize
    
    public struct Frame {
        public let timestamp: TimeInterval
        public let image: CGImage
        
        public init(timestamp: TimeInterval, image: CGImage) {
            self.timestamp = timestamp
            self.image = image
        }
    }
    
    public var duration: TimeInterval {
        guard let first = frames.first?.timestamp, let last = frames.last?.timestamp else { return 0 }
        return last - first
    }
    
    public init(frames: [Frame], frameRate: Double, resolution: CGSize) {
        self.id = UUID()
        self.frames = frames
        self.frameRate = frameRate
        self.resolution = resolution
    }
    
    /// Get the frame at a specific time
    public func frame(at time: TimeInterval) -> Frame? {
        guard !frames.isEmpty else { return nil }
        
        // Find frame closest to time
        return frames.min { a, b in
            abs(a.timestamp - time) < abs(b.timestamp - time)
        }
    }
}
