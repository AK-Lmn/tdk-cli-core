import Foundation

// MARK: - Asciinema File Format

/// Parser for Asciinema v2 cast files
/// Format: https://github.com/asciinema/asciinema/blob/develop/doc/asciicast-v2.md
public struct AsciinemaParser {
    
    /// Asciinema v2 header
    public struct Header: Codable {
        public let version: Int
        public let width: Int
        public let height: Int
        public let timestamp: Int?
        public let title: String?
        public let env: Environment?
        
        public struct Environment: Codable {
            public let shell: String?
            public let term: String?
        }
    }
    
    /// Asciinema event entry
    public struct Event {
        public let time: TimeInterval
        public let type: EventType
        public let data: String
        
        public enum EventType {
            case output
            case input
            case resize
            case marker
        }
    }
    
    /// Parsed asciicast
    public struct Asciicast {
        public let header: Header
        public let events: [Event]
        
        public var duration: TimeInterval {
            guard let last = events.last else { return 0 }
            return last.time
        }
    }
    
    // MARK: - Parsing
    
    /// Parse an asciicast file from URL
    public static func parse(from url: URL) throws -> Asciicast {
        let data = try Data(contentsOf: url)
        return try parse(data: data)
    }
    
    /// Parse asciicast data
    public static func parse(data: Data) throws -> Asciicast {
        guard let string = String(data: data, encoding: .utf8) else {
            throw AsciinemaError.invalidEncoding
        }
        
        var lines = string.components(separatedBy: .newlines)
        
        // First line is the header (JSON)
        guard let headerLine = lines.first else {
            throw AsciinemaError.emptyFile
        }
        
        let headerData = Data(headerLine.utf8)
        let header = try JSONDecoder().decode(Header.self, from: headerData)
        
        // Remaining lines are event arrays
        lines.removeFirst()
        
        var events: [Event] = []
        for line in lines where !line.isEmpty {
            if let event = try parseEvent(line: line) {
                events.append(event)
            }
        }
        
        return Asciicast(header: header, events: events)
    }
    
    private static func parseEvent(line: String) throws -> Event? {
        guard let data = line.data(using: .utf8) else { return nil }
        
        guard let array = try JSONSerialization.jsonObject(with: data) as? [Any] else {
            return nil
        }
        
        guard array.count >= 2,
              let time = array[0] as? TimeInterval else {
            return nil
        }
        
        let typeString = array.count > 2 ? (array[1] as? String) : "o"
        let eventData = array.count > 2 ? (array[2] as? String) : (array[1] as? String)
        
        let type: Event.EventType
        switch typeString {
        case "i": type = .input
        case "r": type = .resize
        default: type = .output
        }
        
        return Event(
            time: time,
            type: type,
            data: eventData ?? ""
        )
    }
    
    // MARK: - Terminal State Reconstruction
    
    /// Reconstruct terminal state at a given time
    public static func terminalState(at time: TimeInterval, from asciicast: Asciicast) -> TerminalState {
        let relevantEvents = asciicast.events.filter { $0.time <= time && $0.type == .output }
        
        var screen: [[Character]] = Array(
            repeating: Array(repeating: " ", count: asciicast.header.width),
            count: asciicast.header.height
        )
        var cursorX = 0
        var cursorY = 0
        
        for event in relevantEvents {
            let chars = Array(event.data)
            var i = 0
            while i < chars.count {
                let char = chars[i]
                
                // Handle ANSI escape sequences
                if char == "\u{001B}" && i + 1 < chars.count && chars[i + 1] == "[" {
                    // Parse escape sequence
                    let (newI, newX, newY) = parseEscapeSequence(
                        chars: chars,
                        startIndex: i + 2,
                        currentX: cursorX,
                        currentY: cursorY,
                        screen: &screen
                    )
                    i = newI
                    cursorX = newX
                    cursorY = newY
                } else if char == "\n" {
                    cursorX = 0
                    cursorY = min(cursorY + 1, asciicast.header.height - 1)
                    i += 1
                } else if char == "\r" {
                    cursorX = 0
                    i += 1
                } else if char == "\t" {
                    cursorX = min(cursorX + 4, asciicast.header.width - 1)
                    i += 1
                } else {
                    // Regular character
                    if cursorY >= 0 && cursorY < asciicast.header.height &&
                       cursorX >= 0 && cursorX < asciicast.header.width {
                        screen[cursorY][cursorX] = char
                        cursorX += 1
                        if cursorX >= asciicast.header.width {
                            cursorX = 0
                            cursorY = min(cursorY + 1, asciicast.header.height - 1)
                        }
                    }
                    i += 1
                }
            }
        }
        
        return TerminalState(
            screen: screen,
            cursorX: cursorX,
            cursorY: cursorY,
            width: asciicast.header.width,
            height: asciicast.header.height
        )
    }
    
    private static func parseEscapeSequence(
        chars: [Character],
        startIndex: Int,
        currentX: Int,
        currentY: Int,
        screen: inout [[Character]]
    ) -> (newIndex: Int, newX: Int, newY: Int) {
        var i = startIndex
        var x = currentX
        var y = currentY
        
        // Collect command characters
        var command = ""
        while i < chars.count {
            let c = chars[i]
            if c.isLetter {
                command.append(c)
                i += 1
                break
            } else {
                command.append(c)
                i += 1
            }
        }
        
        switch command {
        case "H", "f":  // Cursor position
            let parts = command.dropLast().split(separator: ";")
            if parts.count >= 2 {
                y = (Int(parts[0]) ?? 1) - 1
                x = (Int(parts[1]) ?? 1) - 1
            }
        case "A":  // Cursor up
            let n = Int(command.dropLast()) ?? 1
            y = max(y - n, 0)
        case "B":  // Cursor down
            let n = Int(command.dropLast()) ?? 1
            y = min(y + n, screen.count - 1)
        case "C":  // Cursor forward
            let n = Int(command.dropLast()) ?? 1
            x = min(x + n, screen[0].count - 1)
        case "D":  // Cursor back
            let n = Int(command.dropLast()) ?? 1
            x = max(x - n, 0)
        case "K":  // Erase line
            let mode = command.dropLast()
            if mode.isEmpty || mode == "0" {
                // Erase to end of line
                for col in x..<screen[y].count {
                    screen[y][col] = " "
                }
            } else if mode == "1" {
                // Erase to beginning
                for col in 0..<x {
                    screen[y][col] = " "
                }
            } else if mode == "2" {
                // Erase entire line
                for col in 0..<screen[y].count {
                    screen[y][col] = " "
                }
            }
        case "J":  // Erase display
            for row in 0..<screen.count {
                for col in 0..<screen[row].count {
                    screen[row][col] = " "
                }
            }
        case "m":  // SGR (colors) - we ignore for now, track in TerminalState
            break
        default:
            break
        }
        
        return (i, x, y)
    }
}

// MARK: - Terminal State

/// Reconstructed terminal state at a point in time
public struct TerminalState {
    public let screen: [[Character]]
    public let cursorX: Int
    public let cursorY: Int
    public let width: Int
    public let height: Int
    
    public func lines() -> [String] {
        return screen.map { String($0) }
    }
}

// MARK: - Errors

public enum AsciinemaError: Error {
    case invalidEncoding
    case emptyFile
    case invalidHeader(String)
    case invalidEvent(Int)
}
