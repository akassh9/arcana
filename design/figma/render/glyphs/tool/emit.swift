import AppKit
import SwiftUI
@testable import ArcanaKit

// ===================================================================
//  Writing glyphs out: SVG files, @3x previews, the manifest, and the
//  reference stills of the app's own views that each is checked against.
// ===================================================================

let assets = URL(fileURLWithPath: CommandLine.arguments[1])  // design/figma/assets/glyphs
let refDir = URL(fileURLWithPath: CommandLine.arguments[2])  // render/glyphs/ref
let assetsRoot = assets.deletingLastPathComponent()

var manifest: [[String: Any]] = []
var registry: [String: Glyph] = [:]
var diffs: [String] = []

struct Meta {
  var title: String
  var description: String
  var group: String
  var source: String
  var states: String = ""
  var hint: String = "component"
  var caveats: String = ""
}

func rel(_ u: URL) -> String { String(u.path.dropFirst(assetsRoot.path.count + 1)) }

func item(_ file: URL, kind: String, px: [Int]? = nil, scale: Double? = nil, pt: CGSize, vector: Bool, _ m: Meta)
  -> [String: Any]
{
  var d: [String: Any] = [
    "file": rel(file), "title": m.title, "description": m.description, "kind": kind,
    "pt": [Double(pt.width), Double(pt.height)].map { ($0 * 1000).rounded() / 1000 },
    "vector": vector, "group": m.group, "order": manifest.count + 1, "source": m.source,
    "states": m.states, "figma_hint": m.hint, "caveats": m.caveats,
  ]
  if let px { d["px"] = px }
  if let scale { d["scale"] = scale }
  return d
}

/// Writes `g` as `dir/name.svg` and lists it.
@MainActor func emit(_ g: Glyph, _ dir: String, _ m: Meta, preview: Bool = false) {
  let url = assets.appendingPathComponent(dir).appendingPathComponent(g.name + ".svg")
  try! FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
  try! svg(g).write(to: url, atomically: true, encoding: .utf8)
  registry[g.name] = g
  // the reference each Figma import is compared with: the same list drawn by SwiftUI, on clear
  if g.size.width * 3 <= 4096 { png(GlyphView(g: g), scale: 3, to: refDir.appendingPathComponent("mine3x/\(g.name).png")) }
  manifest.append(item(url, kind: "svg", scale: 1, pt: g.size, vector: true, m))
  if preview { emitPreview(g, dir, m) }
}

/// A @3x PNG of `g`, drawn by SwiftUI from the same list the SVG was written from.
@MainActor func emitPreview(_ g: Glyph, _ dir: String, _ m: Meta) {
  // @3x, unless that would pass Figma's 4096 px limit
  let sc = min(3, floor(4096 / max(g.size.width, g.size.height) * 2) / 2)
  let tag = sc == 3 ? "@3x" : "@\(num(sc))x"
  let url = assets.appendingPathComponent(dir).appendingPathComponent(g.name + tag + ".png")
  png(GlyphView(g: g), scale: sc, to: url)
  var pm = m
  pm.title = m.title + " (preview \(tag))"
  pm.hint = "image; the reference picture for the SVG of the same name"
  manifest.append(
    item(
      url, kind: "png", px: [Int((g.size.width * sc).rounded()), Int((g.size.height * sc).rounded())], scale: Double(sc),
      pt: g.size, vector: false, pm))
}

/// Renders the app's own view and the glyph drawn from its items, both at
/// 3x on clear, and records how far apart they are.
@MainActor func check<V: View>(_ name: String, _ view: V, against g: Glyph, note: String = "") {
  let a = refDir.appendingPathComponent("app/\(name).png")
  let b = refDir.appendingPathComponent("mine/\(name).png")
  png(view.frame(width: g.size.width, height: g.size.height), scale: 3, to: a)
  png(GlyphView(g: g), scale: 3, to: b)
  let line = "\(name): \(diff(a, b)) \(note)"
  diffs.append(line)
  print("≈ " + line)
}

// --- composing -------------------------------------------------------

func moved(_ its: [Item], _ dx: CGFloat, _ dy: CGFloat, cell: String? = nil) -> [Item] {
  let t = CGAffineTransform(translationX: dx, y: dy)
  func mv(_ p: Paint) -> Paint {
    switch p {
    case .solid: return p
    case .leaf(let a, let b): return .leaf(a.applying(t), b.applying(t))
    case .linear(let s, let a, let b): return .linear(s, a.applying(t), b.applying(t))
    case .radial(let s, let c, let r): return .radial(s, c.applying(t), r)
    }
  }
  return its.map { i in
    var o = i
    o.path = i.path.applying(t)
    o.fill = i.fill.map(mv)
    o.stroke = i.stroke.map(mv)
    switch i.form {
    case .path: break
    case .rect(let r, let rot): o.form = .rect(r.offsetBy(dx: dx, dy: dy), rotate: rot)
    case .ellipse(let r): o.form = .ellipse(r.offsetBy(dx: dx, dy: dy))
    }
    if let cell { o.group = cell + "." + i.group }
    return o
  }
}

/// The box the items' paint covers, strokes included.
func bounds(_ its: [Item]) -> CGRect {
  var r = CGRect.null
  for i in its {
    var b: CGRect
    switch i.form {
    case .path: b = i.path.boundingRect
    case .ellipse(let e): b = e
    case .rect(let q, let rot):
      let t = CGAffineTransform(translationX: q.midX, y: q.midY).rotated(by: rot * .pi / 180)
        .translatedBy(x: -q.midX, y: -q.midY)
      b = Path(q).applying(t).boundingRect
    }
    if i.stroke != nil { b = b.insetBy(dx: -i.width / 2, dy: -i.width / 2) }
    r = r.union(b)
  }
  return r
}

/// The items moved into a frame of their own, `pad` clear on every side.
func cropped(_ name: String, _ its: [Item], pad: CGFloat = 4) -> (Glyph, CGPoint) {
  let b = bounds(its)
  let x0 = floor(b.minX - pad), y0 = floor(b.minY - pad)
  let w = ceil(b.maxX + pad) - x0, h = ceil(b.maxY + pad) - y0
  return (Glyph(name: name, size: CGSize(width: w, height: h), items: moved(its, -x0, -y0)), CGPoint(x: x0, y: y0))
}

/// Glyphs laid in a grid, each centred in its cell, as one sheet.
func sheet(
  _ name: String, _ cells: [Glyph], cols: Int, cell: CGSize, gap: CGFloat = 0, margin: CGFloat = 16,
  ground: RGBA?
) -> Glyph {
  var its: [Item] = []
  for (k, g) in cells.enumerated() {
    let cx = margin + CGFloat(k % cols) * (cell.width + gap)
    let cy = margin + CGFloat(k / cols) * (cell.height + gap)
    let dx = cx + (cell.width - g.size.width) / 2, dy = cy + (cell.height - g.size.height) / 2
    its += moved(g.items, dx.rounded(), dy.rounded(), cell: g.name)
  }
  let rows = (cells.count + cols - 1) / cols
  let size = CGSize(
    width: margin * 2 + CGFloat(cols) * cell.width + CGFloat(cols - 1) * gap,
    height: margin * 2 + CGFloat(rows) * cell.height + CGFloat(rows - 1) * gap)
  return Glyph(name: name, size: size, items: its, ground: ground)
}

func writeManifest(notes: String, tool: String) {
  let doc: [String: Any] = ["category": "glyphs", "tool": tool, "notes": notes, "items": manifest]
  let data = try! JSONSerialization.data(withJSONObject: doc, options: [.prettyPrinted, .sortedKeys])
  try! data.write(to: assets.appendingPathComponent("manifest.json"))
}
