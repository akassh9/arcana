import AppKit
import SwiftUI

// type-ink renderer. Usage: typeink <assets dir> [section ...]
// sections: type title quill dust ink verse altar thread (none = all)

_ = NSApplication.shared
outRoot = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "."
let wanted = Set(CommandLine.arguments.dropFirst(2))
func want(_ s: String) -> Bool { wanted.isEmpty || wanted.contains(s) }

MainActor.assumeIsolated {
  Keeping.file = nil
  if want("type") { renderType() }
  if want("title") { renderTitle() }
  if want("quill") { renderQuill() }
  if want("dust") { renderDust() }
  if want("ink") { renderInk() }
  if want("verse") { renderVerse() }
  if want("altar") { renderAltar() }
  if want("thread") { renderThread() }
}
