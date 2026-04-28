import Foundation
import CoreGraphics

// MARK: - ScreencastScene

/// A scene showing terminal screencast with optional highlights and cursor
public struct ScreencastScene: Scene {
    public let duration: TimeInterval
    public let resolution: CGSize
    public let recording: ScreenRecording
    public let highlightRegions: [HighlightRegion]
    public let cursorPath: CursorPath?
    
    private let cursorImage: CGImage?
    
    public init(
        recording: ScreenRecording,
        highlightRegions: [HighlightRegion] = [],
        cursorPath: CursorPath? = nil,
        duration: TimeInterval? = nil,
        resolution: CGSize? = nil
    ) {
        self.recording = recording
        self.highlightRegions = highlightRegions
        self.cursorPath = cursorPath
        self.duration = duration ?? recording.duration
        self.resolution = resolution ?? recording.resolution
        self.cursorImage = ScreencastScene.generateCursorImage()
    }
    
    public func render(into context: CGContext, at time: TimeInterval) {
        // Clear background
        context.setFillColor(CGColor(red: 0.1, green: 0.1, blue: 0.1, alpha: 1.0))
        context.fill(CGRect(origin: .zero, size: resolution))
        
        // Get frame at this time
        guard let frame = recording.frame(at: time) else { return }
        
        // Calculate scaling to fit frame into resolution
        let scaleX = resolution.width / CGFloat(frame.image.width)
        let scaleY = resolution.height / CGFloat(frame.image.height)
        let scale = min(scaleX, scaleY)
        
        let drawWidth = CGFloat(frame.image.width) * scale
        let drawHeight = CGFloat(frame.image.height) * scale
        let drawX = (resolution.width - drawWidth) / 2
        let drawY = (resolution.height - drawHeight) / 2
        let drawRect = CGRect(x: drawX, y: drawY, width: drawWidth, height: drawHeight)
        
        // Draw the frame
        context.draw(frame.image, in: drawRect)
        
        // Draw highlight regions
        for region in highlightRegions {
            if time >= region.startTime && time <= (region.startTime + region.duration) {
                drawHighlight(region, in: context, scale: scale, offset: CGPoint(x: drawX, y: drawY))
            }
        }
        
        // Draw cursor
        if let cursorPosition = cursorPath?.position(at: time) {
            let scaledPosition = CGPoint(
                x: cursorPosition.x * scale + drawX,
                y: cursorPosition.y * scale + drawY
            )
            let isClicking = cursorPath?.isClicking(at: time) ?? false
            drawCursor(at: scaledPosition, clicking: isClicking, in: context)
        }
    }
    
    private func drawHighlight(_ region: HighlightRegion, in context: CGContext, scale: CGFloat, offset: CGPoint) {
        let scaledRect = CGRect(
            x: region.rect.minX * scale + offset.x,
            y: region.rect.minY * scale + offset.y,
            width: region.rect.width * scale,
            height: region.rect.height * scale
        )
        
        let path = CGPath(
            roundedRect: scaledRect.insetBy(dx: -region.style.borderWidth, dy: -region.style.borderWidth),
            cornerWidth: region.style.cornerRadius,
            cornerHeight: region.style.cornerRadius,
            transform: nil
        )
        
        context.addPath(path)
        context.setStrokeColor(region.style.color)
        context.setLineWidth(region.style.borderWidth)
        context.strokePath()
        
        // Optional: Fill with transparency
        context.addPath(path)
        context.setFillColor(region.style.color.copy(alpha: 0.1)!)
        context.fillPath()
    }
    
    private func drawCursor(at position: CGPoint, clicking: Bool, in context: CGContext) {
        let size: CGFloat = clicking ? 24 : 20
        let cursorRect = CGRect(
            x: position.x - size/2,
            y: position.y - size/2,
            width: size,
            height: size
        )
        
        if clicking {
            // Draw click indicator (circle)
            let circlePath = CGPath(
                ellipseIn: cursorRect.insetBy(dx: -8, dy: -8),
                transform: nil
            )
            context.addPath(circlePath)
            context.setStrokeColor(CGColor(red: 1, green: 0.5, blue: 0, alpha: 0.6))
            context.setLineWidth(2)
            context.strokePath()
        }
        
        // Draw cursor dot
        let dotPath = CGPath(ellipseIn: cursorRect, transform: nil)
        context.addPath(dotPath)
        context.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.9))
        context.fillPath()
        
        context.addPath(dotPath)
        context.setStrokeColor(CGColor(red: 0, green: 0, blue: 0, alpha: 0.5))
        context.setLineWidth(1)
        context.strokePath()
    }
    
    private static func generateCursorImage() -> CGImage? {
        let size = CGSize(width: 20, height: 20)
        let context = CGContext(
            data: nil,
            width: Int(size.width),
            height: Int(size.height),
            bitsPerComponent: 8,
            bytesPerRow: 0,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        )
        
        guard let ctx = context else { return nil }
        
        // Draw simple circle cursor
        let rect = CGRect(origin: .zero, size: size)
        let path = CGPath(ellipseIn: rect.insetBy(dx: 2, dy: 2), transform: nil)
        
        ctx.addPath(path)
        ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.9))
        ctx.fillPath()
        
        ctx.addPath(path)
        ctx.setStrokeColor(CGColor(red: 0, green: 0, blue: 0, alpha: 0.5))
        ctx.setLineWidth(1)
        ctx.strokePath()
        
        return ctx.makeImage()
    }
}
