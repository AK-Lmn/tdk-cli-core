import Foundation

// MARK: - FFmpeg Encoder

/// Wraps FFmpeg for high-quality video encoding
public struct FFmpegEncoder {
    public let spec: VideoSpec
    public let executablePath: String
    
    public init(spec: VideoSpec, executablePath: String = "/usr/local/bin/ffmpeg") {
        self.spec = spec
        self.executablePath = executablePath
    }
    
    /// Generate FFmpeg command arguments for encoding
    public func generateCommand(
        inputVideo: URL,
        inputAudio: URL? = nil,
        output: URL,
        chapters: [ChapterMarker] = []
    ) -> [String] {
        var args: [String] = [executablePath]
        
        // Input video
        args.append(contentsOf: ["-i", inputVideo.path])
        
        // Input audio if provided
        if let audio = inputAudio {
            args.append(contentsOf: ["-i", audio.path])
        }
        
        // Video codec settings
        args.append(contentsOf: [
            "-c:v", spec.videoCodec.rawValue,
            "-preset", "slow",           // Quality over speed
            "-crf", "18",                // Visually lossless
            "-pix_fmt", spec.pixelFormat.rawValue,
            "-movflags", "+faststart"    // Web-optimized
        ])
        
        // Audio codec settings
        if inputAudio != nil {
            args.append(contentsOf: [
                "-c:a", spec.audioCodec.rawValue,
                "-b:a", "\(spec.audioBitrate)"
            ])
        } else {
            args.append("-an")  // No audio
        }
        
        // Metadata
        args.append(contentsOf: [
            "-metadata", "title=TDK CLI Tutorial",
            "-metadata", "author=TDK Landscape",
            "-metadata", "year=\(Calendar.current.component(.year, from: Date()))"
        ])
        
        // Chapter markers (as metadata)
        if !chapters.isEmpty {
            let chapterMetadata = generateChapterMetadata(chapters)
            for (key, value) in chapterMetadata {
                args.append(contentsOf: ["-metadata", "\(key)=\(value)"])
            }
        }
        
        // Output file
        args.append("-y")  // Overwrite
        args.append(output.path)
        
        return args
    }
    
    /// Generate two-pass encoding commands for maximum quality
    public func generateTwoPassCommand(
        inputVideo: URL,
        inputAudio: URL? = nil,
        output: URL,
        chapters: [ChapterMarker] = []
    ) -> (pass1: [String], pass2: [String]) {
        // Pass 1: Generate stats file
        let pass1Args: [String] = [
            executablePath,
            "-i", inputVideo.path,
            "-c:v", spec.videoCodec.rawValue,
            "-b:v", "\(spec.videoBitrate)",
            "-preset", "slow",
            "-pass", "1",
            "-f", "null",
            "/dev/null"
        ]
        
        // Pass 2: Final encode
        var pass2Args: [String] = [
            executablePath,
            "-i", inputVideo.path
        ]
        
        if let audio = inputAudio {
            pass2Args.append(contentsOf: ["-i", audio.path])
        }
        
        pass2Args.append(contentsOf: [
            "-c:v", spec.videoCodec.rawValue,
            "-b:v", "\(spec.videoBitrate)",
            "-preset", "slow",
            "-pass", "2",
            "-pix_fmt", spec.pixelFormat.rawValue,
            "-movflags", "+faststart"
        ])
        
        if inputAudio != nil {
            pass2Args.append(contentsOf: [
                "-c:a", spec.audioCodec.rawValue,
                "-b:a", "\(spec.audioBitrate)"
            ])
        } else {
            pass2Args.append("-an")
        }
        
        pass2Args.append("-y")
        pass2Args.append(output.path)
        
        return (pass1Args, pass2Args)
    }
    
    /// Execute FFmpeg encoding
    @discardableResult
    public func encode(
        inputVideo: URL,
        inputAudio: URL? = nil,
        output: URL,
        chapters: [ChapterMarker] = [],
        useTwoPass: Bool = false
    ) async throws -> ProcessResult {
        if useTwoPass {
            return try await encodeTwoPass(
                inputVideo: inputVideo,
                inputAudio: inputAudio,
                output: output,
                chapters: chapters
            )
        } else {
            let args = generateCommand(
                inputVideo: inputVideo,
                inputAudio: inputAudio,
                output: output,
                chapters: chapters
            )
            return try await runFFmpeg(arguments: args)
        }
    }
    
    private func encodeTwoPass(
        inputVideo: URL,
        inputAudio: URL?,
        output: URL,
        chapters: [ChapterMarker]
    ) async throws -> ProcessResult {
        let (pass1, pass2) = generateTwoPassCommand(
            inputVideo: inputVideo,
            inputAudio: inputAudio,
            output: output,
            chapters: chapters
        )
        
        // Run pass 1
        _ = try await runFFmpeg(arguments: pass1)
        
        // Run pass 2
        return try await runFFmpeg(arguments: pass2)
    }
    
    /// Run FFmpeg process with given arguments
    private func runFFmpeg(arguments: [String]) async throws -> ProcessResult {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: arguments[0])
        process.arguments = Array(arguments.dropFirst())
        
        let outputPipe = Pipe()
        let errorPipe = Pipe()
        process.standardOutput = outputPipe
        process.standardError = errorPipe
        
        return try await withCheckedThrowingContinuation { continuation in
            process.terminationHandler = { process in
                let outputData = outputPipe.fileHandleForReading.readDataToEndOfFile()
                let errorData = errorPipe.fileHandleForReading.readDataToEndOfFile()
                
                let result = ProcessResult(
                    exitCode: Int(process.terminationStatus),
                    output: String(data: outputData, encoding: .utf8) ?? "",
                    error: String(data: errorData, encoding: .utf8) ?? ""
                )
                
                if process.terminationStatus == 0 {
                    continuation.resume(returning: result)
                } else {
                    continuation.resume(throwing: FFmpegError.encodingFailed(result))
                }
            }
            
            do {
                try process.run()
            } catch {
                continuation.resume(throwing: FFmpegError.processStartFailed(error))
            }
        }
    }
    
    /// Generate chapter metadata for FFmpeg
    private func generateChapterMetadata(_ chapters: [ChapterMarker]) -> [String: String] {
        // FFmpeg chapter format: key=value pairs for each chapter
        var metadata: [String: String] = [:]
        
        for (index, chapter) in chapters.enumerated() {
            let prefix = "CHAPTER\(String(format: "%02d", index))"
            let timeStr = formatTime(chapter.time)
            metadata["\(prefix)"] = timeStr
            metadata["\(prefix)NAME"] = chapter.title
        }
        
        return metadata
    }
    
    private func formatTime(_ time: TimeInterval) -> String {
        let hours = Int(time) / 3600
        let minutes = (Int(time) % 3600) / 60
        let seconds = Int(time) % 60
        let milliseconds = Int((time.truncatingRemainder(dividingBy: 1)) * 1000)
        return String(format: "%02d:%02d:%02d.%03d", hours, minutes, seconds, milliseconds)
    }
    
    /// Validate FFmpeg installation
    public func validateInstallation() async -> Bool {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: executablePath)
        process.arguments = ["-version"]
        
        do {
            try process.run()
            process.waitUntilExit()
            return process.terminationStatus == 0
        } catch {
            return false
        }
    }
}

// MARK: - Process Result

public struct ProcessResult {
    public let exitCode: Int
    public let output: String
    public let error: String
}

// MARK: - FFmpeg Errors

public enum FFmpegError: Error {
    case encodingFailed(ProcessResult)
    case processStartFailed(Error)
    case notInstalled
    case invalidInput(String)
}

// MARK: - ProRes Intermediate

/// Generate ProRes intermediate for maximum quality before final encode
public struct ProResEncoder {
    public let executablePath: String
    
    public init(executablePath: String = "/usr/local/bin/ffmpeg") {
        self.executablePath = executablePath
    }
    
    /// Generate command for ProRes 422 HQ intermediate
    public func generateCommand(input: URL, output: URL) -> [String] {
        return [
            executablePath,
            "-i", input.path,
            "-c:v", "prores_ks",
            "-profile:v", "3",  // ProRes 422 HQ
            "-qscale:v", "9",
            "-vendor", "ap10",
            "-bits_per_mb", "8000",
            "-pix_fmt", "yuv422p10le",
            "-c:a", "pcm_s16le",
            "-y",
            output.path
        ]
    }
}
