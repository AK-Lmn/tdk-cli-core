import Foundation
import CoreGraphics

// MARK: - Terminal Theme

/// Color theme for terminal rendering
public struct TerminalTheme {
    public let background: CGColor
    public let foreground: CGColor
    public let cursor: CGColor
    public let colors: [Int: CGColor]  // ANSI color codes
    
    public init(
        background: CGColor,
        foreground: CGColor,
        cursor: CGColor,
        colors: [Int: CGColor]? = nil
    ) {
        self.background = background
        self.foreground = foreground
        self.cursor = cursor
        self.colors = colors ?? TerminalTheme.defaultColors
    }
    
    public static let dracula = TerminalTheme(
        background: CGColor(red: 0.11, green: 0.11, blue: 0.15, alpha: 1.0),
        foreground: CGColor(red: 0.97, green: 0.97, blue: 0.95, alpha: 1.0),
        cursor: CGColor(red: 0.95, green: 0.76, blue: 0.32, alpha: 1.0)
    )
    
    public static let minimal = TerminalTheme(
        background: CGColor(red: 0.05, green: 0.05, blue: 0.05, alpha: 1.0),
        foreground: CGColor(red: 0.9, green: 0.9, blue: 0.9, alpha: 1.0),
        cursor: CGColor(red: 0.2, green: 0.8, blue: 0.4, alpha: 1.0)
    )
    
    private static let defaultColors: [Int: CGColor] = [
        0: CGColor(red: 0, green: 0, blue: 0, alpha: 1),
        1: CGColor(red: 1, green: 0.3, blue: 0.3, alpha: 1),
        2: CGColor(red: 0.3, green: 0.9, blue: 0.3, alpha: 1),
        3: CGColor(red: 1, green: 0.8, blue: 0.3, alpha: 1),
        4: CGColor(red: 0.4, green: 0.6, blue: 1, alpha: 1),
        5: CGColor(red: 1, green: 0.5, blue: 0.8, alpha: 1),
        6: CGColor(red: 0.3, green: 0.8, blue: 0.9, alpha: 1),
        7: CGColor(red: 0.8, green: 0.8, blue: 0.8, alpha: 1),
    ]
}

// MARK: - Terminal Renderer

/// Renders terminal state to a CoreGraphics context
public struct TerminalRenderer {
    public let theme: TerminalTheme
    public let fontSize: CGFloat
    public let fontName: String
    public let lineHeight: CGFloat
    public let charWidth: CGFloat
    public let padding: CGFloat
    
    public init(
        theme: TerminalTheme = .dracula,
        fontSize: CGFloat = 14,
        fontName: String = "SF Mono",
        lineHeight: CGFloat? = nil,
        charWidth: CGFloat? = nil,
        padding: CGFloat = 20
    ) {
        self.theme = theme
        self.fontSize = fontSize
        self.fontName = fontName
        self.lineHeight = lineHeight ?? (fontSize * 1.4)
        self.charWidth = charWidth ?? (fontSize * 0.6)
        self.padding = padding
    }
    
    /// Calculate required image size for terminal dimensions
    public func calculateSize(width: Int, height: Int) -> CGSize {
        return CGSize(
            width: CGFloat(width) * charWidth + padding * 2,
            height: CGFloat(height) * lineHeight + padding * 2
        )
    }
    
    /// Render terminal state to a CGImage
    public func render(state: TerminalState) -> CGImage? {
        let size = calculateSize(width: state.width, height: state.height)
        
        guard let context = CGContext(
            data: nil,
            width: Int(size.width),
            height: Int(size.height),
            bitsPerComponent: 8,
            bytesPerRow: 0,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else { return nil }
        
        // Background
        context.setFillColor(theme.background)
        context.fill(CGRect(origin: .zero, size: size))
        
        // Render lines
        let lines = state.lines()
        for (row, line) in lines.enumerated() {
            let y = padding + CGFloat(row) * lineHeight
            renderLine(line, atY: y, in: context, size: size)
        }
        
        // Cursor
        let cursorX = padding + CGFloat(state.cursorX) * charWidth
        let cursorY = padding + CGFloat(state.cursorY) * lineHeight
        renderCursor(at: CGPoint(x: cursorX, y: cursorY), in: context)
        
        return context.makeImage()
    }
    
    /// Render terminal with animation frame
    public func renderAnimated(
        state: TerminalState,
        cursorBlink: Bool,
        highlightRegion: CGRect? = nil
    ) -> CGImage? {
        let size = calculateSize(width: state.width, height: state.height)
        
        guard let context = CGContext(
            data: nil,
            width: Int(size.width),
            height: Int(size.height),
            bitsPerComponent: 8,
            bytesPerRow: 0,
            space: CGColorSpaceCreateDeviceRGB(),
            bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else { return nil }
        
        // Background
        context.setFillColor(theme.background)
        context.fill(CGRect(origin: .zero, size: size))
        
        // Highlight region if provided
        if let region = highlightRegion {
            let highlightRect = CGRect(
                x: region.minX * charWidth + padding,
                y: region.minY * lineHeight + padding,
                width: region.width * charWidth,
                height: region.height * lineHeight
            )
            context.setFillColor(CGColor(red: 0.2, green: 0.8, blue: 0.4, alpha: 0.2))
            context.fill(highlightRect)
        }
        
        // Render lines
        let lines = state.lines()
        for (row, line) in lines.enumerated() {
            let y = padding + CGFloat(row) * lineHeight
            renderLine(line, atY: y, in: context, size: size)
        }
        
        // Cursor (with blink)
        if cursorBlink {
            let cursorX = padding + CGFloat(state.cursorX) * charWidth
            let cursorY = padding + CGFloat(state.cursorY) * lineHeight
            renderCursor(at: CGPoint(x: cursorX, y: cursorY), in: context)
        }
        
        return context.makeImage()
    }
    
    private func renderLine(_ line: String, atY y: CGFloat, in context: CGContext, size: CGSize) {
        let font = CTFontCreateWithName(fontName as CFString, fontSize, nil)
        
        // Draw line with basic syntax highlighting
        var x = padding
        for char in line {
            let charString = String(char)
            let color = colorForCharacter(char)
            
            let attributes: [NSAttributedString.Key: Any] = [
                .font: font,
                .foregroundColor: color
            ]
            
            let attrString = NSAttributedString(string: charString, attributes: attributes)
            let framesetter = CTFramesetterCreateWithAttributedString(attrString)
            
            let rect = CGRect(x: x, y: y, width: charWidth + 2, height: lineHeight)
            let path = CGPath(rect: rect, transform: nil)
            let frame = CTFramesetterCreateFrame(framesetter, CFRangeMake(0, 1), path, nil)
            
            context.saveGState()
            CTFrameDraw(frame, context)
            context.restoreGState()
            
            x += charWidth
        }
    }
    
    private func renderCursor(at point: CGPoint, in context: CGContext) {
        let cursorRect = CGRect(x: point.x, y: point.y + 2, width: charWidth, height: lineHeight - 4)
        
        context.setFillColor(theme.cursor)
        context.fill(cursorRect)
    }
    
    private func colorForCharacter(_ char: Character) -> CGColor {
        // Simple character-based coloring
        switch char {
        case "$", "#", "%":  // Shell prompt characters
            return CGColor(red: 0.2, green: 0.8, blue: 0.4, alpha: 1.0)
        case "/", "-", "_":  // Path separators
            return CGColor(red: 0.5, green: 0.5, blue: 0.5, alpha: 1.0)
        case "(", ")", "[", "]", "{", "}":  // Brackets
            return CGColor(red: 0.9, green: 0.7, blue: 0.4, alpha: 1.0)
        default:
            return theme.foreground
        }
    }
}

// MARK: - Asciinema to ScreenRecording Converter

/// Converts Asciinema files to ScreenRecording for use in scenes
public struct AsciinemaConverter {
    public let theme: TerminalTheme
    public let frameRate: Double
    
    public init(theme: TerminalTheme = .dracula, frameRate: Double = 30) {
        self.theme = theme
        self.frameRate = frameRate
    }
    
    /// Convert asciicast to ScreenRecording
    public func convert(asciicast: AsciinemaParser.Asciicast) -> ScreenRecording {
        let renderer = TerminalRenderer(theme: theme)
        let duration = asciicast.duration
        let frameCount = Int(duration * frameRate)
        
        var frames: [ScreenRecording.Frame] = []
        
        for i in 0..<frameCount {
            let time = Double(i) / frameRate
            let state = AsciinemaParser.terminalState(at: time, from: asciicast)
            let cursorBlink = Int(time * 2) % 2 == 0
            
            if let image = renderer.renderAnimated(state: state, cursorBlink: cursorBlink) {
                frames.append(ScreenRecording.Frame(timestamp: time, image: image))
            }
        }
        
        let size = renderer.calculateSize(width: asciicast.header.width, height: asciicast.header.height)
        
        return ScreenRecording(
            frames: frames,
            frameRate: frameRate,
            resolution: size
        )
    }
    
    /// Convenience: parse file and convert
    public func convert(from url: URL) throws -> ScreenRecording {
        let asciicast = try AsciinemaParser.parse(from: url)
        return convert(asciicast: asciicast)
    }
}
