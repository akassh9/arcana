import Foundation

// Hooks the patched copies in ../src call (see prepare.py). Not the app's.

/// The audio engine is never started: nothing can be heard.
func typeInkNeverStart() throws { throw CocoaError(.featureUnsupported) }

/// No key is ever looked for, and OpenAI is never asked.
nonisolated(unsafe) var typeInkNoKeys = true

/// The title's light at this k (the app's k = (t mod 12) / 3.2), or the clock's.
nonisolated(unsafe) var typeInkTitleK: Double? = nil

/// Verse line i part-way through its arrival (0…1), or as spoken.
nonisolated(unsafe) var typeInkLineArrive: [Int: Double] = [:]
func typeInkArrive(_ i: Int, _ spoken: Bool) -> Double { typeInkLineArrive[i] ?? (spoken ? 1 : 0) }
