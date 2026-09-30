import AppKit
print(NSWorkspace.shared.frontmostApplication?.localizedName ?? "?", NSWorkspace.shared.frontmostApplication?.processIdentifier ?? 0)
