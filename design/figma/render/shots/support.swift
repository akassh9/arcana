import AppKit
import SwiftUI

// Hooks the patched scratch sources call into (see patch.py). Not the app's.

enum ShotSilence: Error { case quiet }

/// No key is ever looked for.
nonisolated(unsafe) var shotNoKeys = true

/// Whether the room offers the thread (as it does when a key is present).
nonisolated(unsafe) var shotThreadable = true

/// SplitMix64: the shuffle's randomness, seeded per shot.
struct SplitMix: RandomNumberGenerator {
  var state: UInt64
  init(seed: UInt64) { state = seed }
  mutating func next() -> UInt64 {
    state &+= 0x9E37_79B9_7F4A_7C15
    var z = state
    z = (z ^ (z >> 30)) &* 0xBF58_476D_1CE4_E5B9
    z = (z ^ (z >> 27)) &* 0x94D0_49BB_1331_11EB
    return z ^ (z >> 31)
  }
}

nonisolated(unsafe) var shotRNG = SplitMix(seed: 1)

/// Where the bead on the thread sits while the thread is being found (0…1 along it).
nonisolated(unsafe) var shotWeaveRun: Double? = nil

/// The last size and insets the room's GeometryReader was given.
nonisolated(unsafe) var shotSeen: (size: CGSize, insets: EdgeInsets)? = nil

func shotSee(_ size: CGSize, _ insets: EdgeInsets) -> EdgeInsets {
  shotSeen = (size, insets)
  return insets
}

/// Seconds into the title light's 12 s period (nil: the wall clock). 6 s: the light is off the word.
nonisolated(unsafe) var shotTitleT: Double? = 6.0
