// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "TDKVideoGenerator",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(
            name: "tdk-video",
            targets: ["TDKVideoCLI"]
        ),
        .library(
            name: "TDKVideoGenerator",
            targets: ["TDKVideoGenerator"]
        )
    ],
    dependencies: [
        // No external dependencies - using native AVFoundation
    ],
    targets: [
        .executableTarget(
            name: "TDKVideoCLI",
            dependencies: ["TDKVideoGenerator"]
        ),
        .target(
            name: "TDKVideoGenerator",
            dependencies: [],
            path: "Sources/TDKVideoGenerator",
            exclude: []
        ),
        .testTarget(
            name: "TDKVideoGeneratorTests",
            dependencies: ["TDKVideoGenerator"]
        )
    ]
)
