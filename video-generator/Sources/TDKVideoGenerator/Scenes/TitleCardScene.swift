import Foundation
import CoreGraphics

// MARK: - TitleCardScene

/// A scene showing a title card with branding
public struct TitleCardScene: Scene {
    public let duration: TimeInterval
    public let resolution: CGSize
    public let title: String
    public let subtitle: String
    public let chapterNumber: Int?
    public let icon: TDKIcon
    
    public enum TDKIcon {
        case logo
        case terminal
        case rocket
        case stack
        case resource
        
        public var emoji: String {
            switch self {
            case .logo: return "🚀"
            case .terminal: return "💻"
            case .rocket: return "🚀"
            case .stack: return "📦"
            case .resource: return "⚡"
            }
        }
    }
    
    public init(
        title: String,
        subtitle: String,
        duration: TimeInterval,
        resolution: CGSize,
        chapterNumber: Int? = nil,
        icon: TDKIcon = .logo
    ) {
        self.title = title
        self.subtitle = subtitle
        self.duration = duration
        self.resolution = resolution
        self.chapterNumber = chapterNumber
        self.icon = icon
    }
    
    public func render(into context: CGContext, at time: TimeInterval) {
        // Background - TDK dark gradient
        drawGradientBackground(in: context)
        
        // Decorative elements
        drawDecorations(in: context, time: time)
        
        // Content
        let centerX = resolution.width / 2
        let centerY = resolution.height / 2
        
        // Chapter number (if provided)
        var currentY = centerY - 100
        if let chapter = chapterNumber {
            let chapterRect = CGRect(
                x: centerX - 100,
                y: currentY - 40,
                width: 200,
                height: 30
            )
            drawText("CHAPTER \(String(format: "%02d", chapter))", 
                    in: chapterRect, 
                    fontSize: 14, 
                    color: CGColor(red: 0.4, green: 0.8, blue: 0.6, alpha: 1.0),
                    alignment: .center,
                    in: context)
            currentY -= 20
        }
        
        // Icon
        let iconRect = CGRect(
            x: centerX - 50,
            y: currentY - 120,
            width: 100,
            height: 100
        )
        drawIcon(icon, in: iconRect, time: time, in: context)
        currentY -= 140
        
        // Title
        let titleRect = CGRect(
            x: centerX - 500,
            y: currentY - 60,
            width: 1000,
            height: 80
        )
        drawText(title, 
                in: titleRect, 
                fontSize: 48, 
                color: CGColor(red: 1, green: 1, blue: 1, alpha: 1.0),
                alignment: .center,
                bold: true,
                in: context)
        currentY -= 100
        
        // Subtitle
        let subtitleRect = CGRect(
            x: centerX - 400,
            y: currentY - 40,
            width: 800,
            height: 50
        )
        drawText(subtitle, 
                in: subtitleRect, 
                fontSize: 24, 
                color: CGColor(red: 0.6, green: 0.6, blue: 0.6, alpha: 1.0),
                alignment: .center,
                in: context)
        
        // TDK branding at bottom
        let brandRect = CGRect(
            x: centerX - 200,
            y: resolution.height - 100,
            width: 400,
            height: 30
        )
        drawText("TDK CLI - Tilt Development Kit", 
                in: brandRect, 
                fontSize: 16, 
                color: CGColor(red: 0.4, green: 0.4, blue: 0.4, alpha: 1.0),
                alignment: .center,
                in: context)
    }
    
    private func drawGradientBackground(in context: CGContext) {
        let rect = CGRect(origin: .zero, size: resolution)
        
        // Dark gradient: top-left lighter to bottom-right darker
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let colors: [CGColor] = [
            CGColor(red: 0.08, green: 0.08, blue: 0.12, alpha: 1.0),
            CGColor(red: 0.04, green: 0.04, blue: 0.06, alpha: 1.0)
        ]
        
        guard let gradient = CGGradient(
            colorsSpace: colorSpace,
            colors: colors as CFArray,
            locations: [0.0, 1.0]
        ) else { return }
        
        context.drawLinearGradient(
            gradient,
            start: CGPoint(x: 0, y: 0),
            end: CGPoint(x: resolution.width, y: resolution.height),
            options: [.drawsBeforeStartLocation, .drawsAfterEndLocation]
        )
    }
    
    private func drawDecorations(in context: CGContext, time: TimeInterval) {
        // Subtle grid pattern
        context.setStrokeColor(CGColor(red: 0.15, green: 0.15, blue: 0.18, alpha: 0.5))
        context.setLineWidth(1)
        
        let gridSize: CGFloat = 80
        
        // Vertical lines
        for x in stride(from: 0, to: resolution.width, by: gridSize) {
            context.move(to: CGPoint(x: x, y: 0))
            context.addLine(to: CGPoint(x: x, y: resolution.height))
            context.strokePath()
        }
        
        // Horizontal lines
        for y in stride(from: 0, to: resolution.height, by: gridSize) {
            context.move(to: CGPoint(x: 0, y: y))
            context.addLine(to: CGPoint(x: resolution.width, y: y))
            context.strokePath()
        }
        
        // Animated corner accents
        let accentColor = CGColor(red: 0.2, green: 0.8, blue: 0.5, alpha: 0.3)
        context.setStrokeColor(accentColor)
        context.setLineWidth(2)
        
        let accentSize: CGFloat = 100
        let offset = CGFloat(sin(time * 2) * 5)  // Subtle animation
        
        // Top-left corner
        context.move(to: CGPoint(x: 50, y: 50 + accentSize + offset))
        context.addLine(to: CGPoint(x: 50, y: 50 + offset))
        context.addLine(to: CGPoint(x: 50 + accentSize, y: 50 + offset))
        context.strokePath()
        
        // Bottom-right corner
        context.move(to: CGPoint(x: resolution.width - 50, y: resolution.height - 50 - accentSize - offset))
        context.addLine(to: CGPoint(x: resolution.width - 50, y: resolution.height - 50 - offset))
        context.addLine(to: CGPoint(x: resolution.width - 50 - accentSize, y: resolution.height - 50 - offset))
        context.strokePath()
    }
    
    private func drawIcon(_ icon: TDKIcon, in rect: CGRect, time: TimeInterval, in context: CGContext) {
        // Draw emoji or custom icon
        let fontSize: CGFloat = 72
        
        // Subtle pulse animation
        let scale = 1.0 + sin(time * 3) * 0.05
        let scaledRect = rect.insetBy(
            dx: rect.width * (1 - scale) / 2,
            dy: rect.height * (1 - scale) / 2
        )
        
        drawText(icon.emoji, 
                in: scaledRect, 
                fontSize: fontSize, 
                color: CGColor(red: 1, green: 1, blue: 1, alpha: 1.0),
                alignment: .center,
                in: context)
    }
    
    private func drawText(_ text: String, in rect: CGRect, fontSize: CGFloat, color: CGColor, alignment: NSTextAlignment, bold: Bool = false, in context: CGContext) {
        context.saveGState()
        
        let fontName = bold ? "SF Pro Display Bold" : "SF Pro Display"
        let font = CTFontCreateWithName(fontName as CFString, fontSize, nil)
        
        // Fallback to system font
        let fallbackFont = CTFontCreateWithName("Helvetica" as CFString, fontSize, nil)
        let finalFont = CTFontGetGlyphCount(font) > 0 ? font : fallbackFont
        
        let attributes: [NSAttributedString.Key: Any] = [
            .font: finalFont,
            .foregroundColor: color
        ]
        
        let attrString = NSAttributedString(string: text, attributes: attributes)
        
        let framesetter = CTFramesetterCreateWithAttributedString(attrString)
        let path = CGPath(rect: rect, transform: nil)
        let frame = CTFramesetterCreateFrame(framesetter, CFRangeMake(0, attrString.length), path, nil)
        
        CTFrameDraw(frame, context)
        
        context.restoreGState()
    }
}
