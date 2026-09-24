// swift-tools-version:6.0
import PackageDescription

let package = Package(
  name: "Arcana",
  platforms: [.macOS(.v14)],
  targets: [
    .executableTarget(
      name: "Arcana",
      path: "Sources/Arcana",
      swiftSettings: [.swiftLanguageMode(.v5)]
    )
  ]
)
