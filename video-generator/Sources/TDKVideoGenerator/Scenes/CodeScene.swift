import Foundation
import CoreGraphics

// MARK: - CodeScene

/// A scene showing code with syntax highlighting and line highlighting
public struct CodeScene: Scene {
    public let duration: TimeInterval
    public let resolution: CGSize
    public let sourceCode: String
    public let language: Language
    public let highlightLines: ClosedRange<Int>?
    public let title: String?
    public let fileName: String?
    
    public enum Language {
        case swift
        case typescript
        case javascript
        case json
        case yaml
        case bash
        case starlark
        
        public var fileExtension: String {
            switch self {
            case .swift: return "swift"
            case .typescript: return "ts"
            case .javascript: return "js"
            case .json: return "json"
            case .yaml: return "yaml"
            case .bash: return "sh"
            case .starlark: return "star"
            }
        }
    }
    
    public init(
        sourceCode: String,
        language: Language,
        duration: TimeInterval,
        resolution: CGSize,
        highlightLines: ClosedRange<Int>? = nil,
        title: String? = nil,
        fileName: String? = nil
    ) {
        self.sourceCode = sourceCode
        self.language = language
        self.duration = duration
        self.resolution = resolution
        self.highlightLines = highlightLines
        self.title = title
        self.fileName = fileName
    }
    
    public func render(into context: CGContext, at time: TimeInterval) {
        // Background
        context.setFillColor(CGColor(red: 0.12, green: 0.12, blue: 0.14, alpha: 1.0))
        context.fill(CGRect(origin: .zero, size: resolution))
        
        // Margins
        let margin: CGFloat = 60
        let contentRect = CGRect(
            x: margin,
            y: margin,
            width: resolution.width - margin * 2,
            height: resolution.height - margin * 2
        )
        
        // Draw title bar if file name provided
        var contentTop = contentRect.minY
        if let fileName = fileName {
            contentTop = drawTitleBar(fileName: fileName, in: context, at: contentRect)
            contentTop += 20
        }
        
        // Draw code
        drawCode(in: context, rect: CGRect(
            x: contentRect.minX,
            y: contentTop,
            width: contentRect.width,
            height: contentRect.maxY - contentTop
        ))
    }
    
    private func drawTitleBar(fileName: String, in context: CGContext, at rect: CGRect) -> CGFloat {
        let barHeight: CGFloat = 40
        let barRect = CGRect(x: rect.minX, y: rect.minY, width: rect.width, height: barHeight)
        
        // Background
        context.setFillColor(CGColor(red: 0.18, green: 0.18, blue: 0.20, alpha: 1.0))
        context.fill(barRect)
        
        // Window dots (macOS style)
        let dotY = barRect.midY
        let dotRadius: CGFloat = 6
        let dotSpacing: CGFloat = 12
        let dotStartX: CGFloat = barRect.minX + 20
        
        let colors: [CGColor] = [
            CGColor(red: 1, green: 0.3, blue: 0.3, alpha: 1),  // Close
            CGColor(red: 1, green: 0.8, blue: 0.2, alpha: 1),  // Minimize
            CGColor(red: 0.3, green: 0.8, blue: 0.3, alpha: 1)  // Maximize
        ]
        
        for (index, color) in colors.enumerated() {
            let dotRect = CGRect(
                x: dotStartX + CGFloat(index) * dotSpacing - dotRadius,
                y: dotY - dotRadius,
                width: dotRadius * 2,
                height: dotRadius * 2
            )
            context.addEllipse(in: dotRect)
            context.setFillColor(color)
            context.fillPath()
        }
        
        // File name
        let textRect = CGRect(
            x: barRect.minX + 80,
            y: barRect.minY + 8,
            width: barRect.width - 160,
            height: barRect.height - 16
        )
        
        drawText(fileName, in: textRect, fontSize: 14, color: CGColor(red: 0.7, green: 0.7, blue: 0.7, alpha: 1.0), alignment: .center, in: context)
        
        return barRect.maxY
    }
    
    private func drawCode(in context: CGContext, rect: CGRect) {
        let lines = sourceCode.components(separatedBy: .newlines)
        let lineHeight: CGFloat = 28
        let fontSize: CGFloat = 16
        
        // Calculate visible lines
        let maxVisibleLines = Int(rect.height / lineHeight)
        
        for (index, line) in lines.prefix(maxVisibleLines).enumerated() {
            let y = rect.minY + CGFloat(index) * lineHeight
            
            // Highlight line background if needed
            if let highlightRange = highlightLines, highlightRange.contains(index + 1) {
                let highlightRect = CGRect(
                    x: rect.minX - 20,
                    y: y - 2,
                    width: rect.width + 40,
                    height: lineHeight
                )
                context.setFillColor(CGColor(red: 0.25, green: 0.35, blue: 0.45, alpha: 0.6))
                context.fill(highlightRect)
            }
            
            // Line number
            let lineNumRect = CGRect(x: rect.minX, y: y, width: 40, height: lineHeight)
            drawText("\(index + 1)", in: lineNumRect, fontSize: 12, color: CGColor(red: 0.4, green: 0.4, blue: 0.4, alpha: 1.0), alignment: .right, in: context)
            
            // Code line
            let codeRect = CGRect(x: rect.minX + 60, y: y + 2, width: rect.width - 60, height: lineHeight)
            drawSyntaxHighlightedLine(line, in: codeRect, fontSize: fontSize, language: language, in: context)
        }
    }
    
    private func drawSyntaxHighlightedLine(_ line: String, in rect: CGRect, fontSize: CGFloat, language: Language, in context: CGContext) {
        // Simple syntax highlighting - in production, use a proper parser
        let defaultColor = CGColor(red: 0.9, green: 0.9, blue: 0.9, alpha: 1.0)
        
        // Keywords for different languages
        let keywords: Set<String>
        switch language {
        case .swift:
            keywords = ["import", "struct", "class", "func", "var", "let", "if", "else", "return", "public", "private", "init"]
        case .typescript, .javascript:
            keywords = ["import", "export", "const", "let", "var", "function", "class", "return", "if", "else", "async", "await"]
        case .bash:
            keywords = ["if", "then", "else", "fi", "for", "do", "done", "echo", "cd", "ls"]
        default:
            keywords = []
        }
        
        let words = line.components(separatedBy: " ")
        var xOffset: CGFloat = rect.minX
        
        for word in words {
            let color: CGColor
            if keywords.contains(word) {
                color = CGColor(red: 1, green: 0.5, blue: 0.7, alpha: 1.0)  // Keywords: pink
            } else if word.hasPrefix("\"") || word.hasPrefix("'") {
                color = CGColor(red: 0.5, green: 0.9, blue: 0.5, alpha: 1.0)  // Strings: green
            } else if Int(word) != nil || Double(word) != nil {
                color = CGColor(red: 0.9, green: 0.7, blue: 0.4, alpha: 1.0)  // Numbers: orange
            } else if word.hasPrefix("//") || word.hasPrefix("#") {
                color = CGColor(red: 0.5, green: 0.5, blue: 0.5, alpha: 1.0)  // Comments: gray
            } else {
                color = defaultColor
            }
            
            let wordRect = CGRect(x: xOffset, y: rect.minY, width: 800, height: rect.height)
            drawText(word, in: wordRect, fontSize: fontSize, color: color, alignment: .left, in: context)
            
            // Advance position (approximate)
            xOffset += CGFloat(word.count) * fontSize * 0.6 + fontSize * 0.4
        }
    }
    
    private func drawText(_ text: String, in rect: CGRect, fontSize: CGFloat, color: CGColor, alignment: NSTextAlignment, in context: CGContext) {
        // Save context state
        context.saveGState()
        
        // Create attributed string
        let font = CTFontCreateWithName("SF Mono" as CFString, fontSize, nil)
        let fallbackFont = CTFontCreateWithName("Menlo" as CFString, fontSize, nil)
        let finalFont = CTFontGetGlyphCount(font) > 0 ? font : fallbackFont
        
        let attributes: [NSAttributedString.Key: Any] = [
            .font: finalFont,
            .foregroundColor: color
        ]
        
        let attrString = NSAttributedString(string: text, attributes: attributes)
        
        // Create framesetter and frame
        let framesetter = CTFramesetterCreateWithAttributedString(attrString)
        let path = CGPath(rect: rect, transform: nil)
        let frame = CTFramesetterCreateFrame(framesetter, CFRangeMake(0, attrString.length), path, nil)
        
        // Draw
        CTFrameDraw(frame, context)
        
        // Restore context
        context.restoreGState()
    }
}
