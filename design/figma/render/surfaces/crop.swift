import AppKit
// crop <in.png> <out.png> x y w h   (pixels, top-left origin) — for looking
let a = CommandLine.arguments
let r = NSBitmapImageRep(data: try! Data(contentsOf: URL(fileURLWithPath: a[1])))!.cgImage!
let v = a[3...6].map { Int($0)! }
let c = r.cropping(to: CGRect(x: v[0], y: v[1], width: v[2], height: v[3]))!
try! NSBitmapImageRep(cgImage: c).representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: a[2]))
