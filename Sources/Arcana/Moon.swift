import CoreGraphics
import Foundation
import simd

// ===================================================================
//  Moon — tonight's, not a picture of one. The phase is reckoned from
//  a known new moon and the length of the synodic month; the sky over
//  the table is the sky over the reader.
//
//  Its face is the near side as it always turns to us: the old seas of
//  lava where they lie, the walled plains, the young craters and the
//  rays they threw. A day moon: pearl where the sun is on it, the seas a
//  veil through which the sky shows, the rest a ghost of the disc.
// ===================================================================

struct Moon {
  /// 0 new · 0.25 first quarter · 0.5 full · 0.75 last quarter
  let age: Double

  static var tonight: Moon { Moon(date: Date()) }

  init(date: Date) {
    // 2000-01-06 18:14 UTC, a new moon
    let epoch = 947_182_440.0
    let synodic = 29.530_588_853 * 86_400
    let a = (date.timeIntervalSince1970 - epoch) / synodic
    age = a - floor(a)
  }

  /// Fraction of the disc that is lit.
  var illumination: Double { (1 - cos(age * 2 * .pi)) / 2 }

  var name: String {
    switch age {
    case ..<0.03, 0.97...: return "new moon"
    case ..<0.22: return "waxing crescent"
    case ..<0.28: return "first quarter"
    case ..<0.47: return "waxing gibbous"
    case ..<0.53: return "full moon"
    case ..<0.72: return "waning gibbous"
    case ..<0.78: return "last quarter"
    default: return "waning crescent"
    }
  }
}

// --- the face -------------------------------------------------------

extension Moon {
  /// Tonight's face, `radius` points to the limb, in pixels at `scale`, a
  /// pixel to spare all round. Painted once for each phase and size.
  @MainActor func face(radius: Double, scale: Double) -> CGImage? {
    // a thousandth of a month is forty minutes: the light has not moved
    let key = [Int((age * 1000).rounded()), Int((radius * scale).rounded())]
    if let f = Moon.painted, f.key == key { return f.image }
    let image = Moon.paint(age: age, radius: radius * scale)
    Moon.painted = image.map { (key, $0) }
    return image
  }

  @MainActor private static var painted: (key: [Int], image: CGImage)?

  // each as straight sRGB and how opaque it is: pearl highlands, seas the
  // lilac of the sky seen through them, a limb warmed like the edge of a
  // pearl; and the unlit disc, a ghost of lilac with the seas faintly in it
  private static let high = SIMD4(1.0, 0.978, 0.935, 0.97)
  private static let sea = SIMD4(0.87, 0.865, 0.94, 0.88)
  private static let limb = SIMD4(0.97, 0.93, 0.86, 0.95)
  private static let ghostHigh = SIMD4(0.71, 0.735, 0.88, 0.44)
  private static let ghostSea = SIMD4(0.65, 0.675, 0.84, 0.48)

  /// The disc, `r` pixels to the limb: each pixel the mean of nine samples,
  /// its edge covered exactly. Premultiplied, so the sky shows through.
  private static func paint(age: Double, radius r: Double) -> CGImage? {
    let n = Int(ceil(r * 2)) + 2
    guard
      let ctx = CGContext(
        data: nil, width: n, height: n, bitsPerComponent: 8, bytesPerRow: n * 4,
        space: CGColorSpace(name: CGColorSpace.sRGB) ?? CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue),
      let data = ctx.data
    else { return nil }
    let buf = data.bindMemory(to: UInt8.self, capacity: n * n * 4)
    // the sun: behind the moon when it is new, behind us when it is full,
    // off to the east — our right — while it waxes
    let th = age * 2 * .pi
    let sun = SIMD3(sin(th), 0, -cos(th))
    let mid = Double(n) / 2
    let k = 3
    for y in 0..<n {
      for x in 0..<n {
        let dx = Double(x) + 0.5 - mid, dy = Double(y) + 0.5 - mid
        let cover = clamp01(r - (dx * dx + dy * dy).squareRoot() + 0.5)
        let o = (y * n + x) * 4
        guard cover > 0 else {
          for i in 0..<4 { buf[o + i] = 0 }
          continue
        }
        var sum = SIMD4<Double>.zero
        for j in 0..<k {
          for i in 0..<k {
            var u = (dx - 0.5 + (Double(i) + 0.5) / Double(k)) / r
            var v = -(dy - 0.5 + (Double(j) + 0.5) / Double(k)) / r
            // a sample past the limb takes the colour just inside it
            let d = u * u + v * v
            if d > 0.9999 {
              let s = (0.9999 / d).squareRoot()
              u *= s
              v *= s
            }
            sum += shade(SIMD3(u, v, (1 - u * u - v * v).squareRoot()), sun: sun)
          }
        }
        let c = simd_clamp(sum / Double(k * k), .zero, .one) * cover
        buf[o] = UInt8(c.x * 255 + 0.5)
        buf[o + 1] = UInt8(c.y * 255 + 0.5)
        buf[o + 2] = UInt8(c.z * 255 + 0.5)
        buf[o + 3] = UInt8(c.w * 255 + 0.5)
      }
    }
    return ctx.makeImage()
  }

  /// The colour of `p`, a point on the near side, with the sun toward
  /// `sun`: premultiplied, as the picture holds it.
  private static func shade(_ p: SIMD3<Double>, sun: SIMD3<Double>) -> SIMD4<Double> {
    let ground = Selene.ground(p)
    // near the terminator the lie of the ground decides where the light
    // falls, so the rims of craters catch it first
    let light = simd_dot(simd_normalize(p - ground.slope * 0.9), sun)
    let pale = clamp01((ground.albedo - 0.44) / 0.56)
    var day = laid(simd_mix(sea, high, SIMD4(repeating: pale)))
    day = simd_mix(laid(limb), day, SIMD4(repeating: 0.65 + 0.35 * p.z))
    // fresh ground shines
    let shine = 1 + 0.4 * clamp01(ground.albedo - 1)
    day = SIMD4(
      min(day.w, day.x * shine), min(day.w, day.y * shine), min(day.w, day.z * shine), day.w)
    // where the sun is low its light is thin, and the sky shows through
    day *= 0.55 + 0.45 * ramp(light, -0.02, 0.45)
    let night = laid(simd_mix(ghostSea, ghostHigh, SIMD4(repeating: pale)))
    let t = ramp(light * 0.3 + simd_dot(p, sun) * 0.7 + ground.rough * 0.22, -0.012, 0.038)
    return simd_mix(night, day, SIMD4(repeating: t))
  }

  /// A colour laid at its opacity: premultiplied.
  private static func laid(_ c: SIMD4<Double>) -> SIMD4<Double> {
    SIMD4(c.x * c.w, c.y * c.w, c.z * c.w, c.w)
  }
}

// --- the near side --------------------------------------------------

/// The near side, as it always turns to us. A point on it is a unit
/// vector: x toward the east limb — on the right, as the moon hangs in a
/// northern sky — y north, z toward us.
private enum Selene {
  typealias V3 = SIMD3<Double>

  static func at(_ lat: Double, _ lon: Double) -> V3 {
    let la = lat * .pi / 180, lo = lon * .pi / 180
    return V3(cos(la) * sin(lo), sin(la), cos(la) * cos(lo))
  }

  /// A sea of old dark lava, or a piece of one: where it lies, how far it
  /// spreads (degrees of arc) and how dark it is.
  struct Sea {
    let at: V3
    let r, dark: Double
    let near: Double  // the cosine of the farthest it is felt

    init(_ lat: Double, _ lon: Double, _ deg: Double, _ dark: Double) {
      at = Selene.at(lat, lon)
      r = deg * .pi / 180
      self.dark = dark
      near = cos(r * 2.2)
    }
  }

  static let seas: [Sea] = [
    // Oceanus Procellarum, sprawling down the western side
    Sea(50, -52, 7, 0.6), Sea(40, -57, 9, 0.68), Sea(29, -54, 10, 0.76), Sea(18, -60, 11, 0.8),
    Sea(8, -54, 10, 0.8), Sea(-1, -50, 8, 0.72), Sea(-8, -42, 6.5, 0.64), Sea(12, -70, 8, 0.8),
    Sea(27, -69, 8, 0.78), Sea(-3, -63, 6, 0.68), Sea(40, -45, 6, 0.64), Sea(20, -44, 6, 0.7),
    // Imbrium and the Bay of Rainbows
    Sea(34, -18, 14.5, 0.76), Sea(29, -8, 7, 0.72), Sea(44, -31, 4.5, 0.78),
    Sea(7.5, -30, 7, 0.66), Sea(3, -24, 4, 0.6),  // Insularum
    Sea(-10, -22, 5, 0.6),  // Cognitum
    Sea(-20, -16, 9, 0.52), Sea(-27, -11, 5, 0.48),  // Nubium
    Sea(-24.4, -38.6, 5.6, 0.8),  // Humorum
    Sea(11, -8, 3, 0.66), Sea(13.3, 4, 3.5, 0.62), Sea(17, 7, 2.5, 0.6),  // Aestuum, Vaporum
    Sea(27, 17.5, 10, 0.64), Sea(22, 22, 5, 0.7),  // Serenitatis
    Sea(8, 31, 11, 0.9), Sea(15, 25, 5.5, 0.88), Sea(2, 38, 7, 0.84), Sea(12, 38, 5, 0.86),  // Tranquillitatis
    Sea(17, 59, 7.5, 0.92),  // Crisium
    Sea(-6, 51, 8.5, 0.72), Sea(-1, 50, 6, 0.72), Sea(-14, 54, 5, 0.64),  // Fecunditatis
    Sea(-15.2, 35.5, 4.8, 0.72),  // Nectaris
    // Frigoris, a long pale band across the north
    Sea(55, -40, 4.2, 0.44), Sea(56, -29, 4.4, 0.46), Sea(57, -18, 4.4, 0.48),
    Sea(57, -7, 4.4, 0.48), Sea(57, 4, 4.4, 0.47), Sea(58, 15, 4.2, 0.45), Sea(59, 26, 4, 0.43),
    Sea(61, 37, 3.6, 0.4),
    Sea(38, 29, 5, 0.42), Sea(45, 27, 2.5, 0.42),  // Somniorum, Mortis
    Sea(1.1, 65, 2.6, 0.6), Sea(6.8, 68.4, 2.6, 0.6), Sea(22.6, 67.7, 2.2, 0.55),  // Spumans, Undarum, Anguis
    Sea(1.3, 87, 6, 0.74), Sea(13, 86, 5, 0.66), Sea(57, 81, 5.5, 0.6), Sea(-39, 93, 9, 0.5),  // on the limb
    Sea(54, -57, 4.5, 0.56),  // Sinus Roris
    // dark-floored craters: Grimaldi, Riccioli, Plato, Endymion; the edge of Orientale
    Sea(-5.2, -68.6, 2.6, 0.9), Sea(-3, -74.6, 1.8, 0.6), Sea(51.6, -9.4, 1.4, 0.8),
    Sea(53.6, 56.5, 1.8, 0.66), Sea(-19, -93, 8, 0.42),
  ]

  /// How deep in the seas `p` lies: 0 on the highlands … 1 in the darkest
  /// lava. The pieces are summed like soft light, so neighbours run
  /// together, and their shores are worn ragged.
  static func sea(_ p: V3) -> Double {
    var dry = 1.0, dark = 0.0, weight = 0.0
    for s in seas {
      let c = simd_dot(p, s.at)
      guard c > s.near else { continue }
      let u = acos(min(1, c)) / s.r
      let k = exp(-u * u * u * 0.693)  // a half at its nominal shore
      dry *= 1 - k
      dark += k * s.dark
      weight += k
    }
    let wet = 1 - dry
    guard wet > 0.001 else { return 0 }
    let wear =
      0.48 * (fbm(p * 4.2 + V3(3, 9, 1), 4) - 0.5) + 0.32 * (fbm(p * 9.5 + V3(5, 1, 3), 3) - 0.5)
      + 0.14 * (fbm(p * 15 + V3(7, 2, 5), 3) - 0.5)
    let shore = ramp(wet + wear * ramp(wet, 0, 0.08), 0.25, 0.75)
    guard shore > 0 else { return 0 }
    let within = 0.78 + 0.44 * fbm(p * 7 + V3(2, 2, 8), 3)
    return min(1, shore * dark / weight * within)
  }

  /// A crater: a bowl, a raised rim and a skirt of thrown ground. Fresh
  /// ones are bright, and the youngest threw rays across the older ground.
  struct Crater {
    struct Ray {
      let dir, across: V3
      let width, reach, light: Double
    }

    let at: V3
    let r: Double  // radians
    let wall: Double  // how steep its walls are
    let fresh: Double  // 0 worn … 1 young
    let near: Double  // the cosine of the edge of its skirt
    var rays: [Ray] = []

    init(_ at: V3, km: Double, wall: Double, fresh: Double = 0) {
      self.at = at
      r = km / 2 / 1737.4
      self.wall = wall
      self.fresh = fresh
      near = cos(r * 2.6)
    }

    init(_ lat: Double, _ lon: Double, km: Double, wall: Double = 0.35, fresh: Double = 0) {
      self.init(Selene.at(lat, lon), km: km, wall: wall, fresh: fresh)
    }

    /// The same crater, with `count` rays thrown as far as `reach`.
    func rayed(_ count: Int, reach: Double, light: Double, seed: UInt32) -> Crater {
      let e = V3(at.z, 0, -at.x)
      let east = simd_length(e) < 1e-6 ? V3(1, 0, 0) : simd_normalize(e)
      let north = simd_cross(at, east)
      var rng = Rng(seed)
      var c = self
      c.rays = (0..<count).map { i in
        let a = (Double(i) + rng.next() * 0.8) / Double(count) * 2 * .pi
        return Ray(
          dir: east * cos(a) + north * sin(a), across: north * cos(a) - east * sin(a),
          width: 0.010 + rng.next() * 0.022, reach: reach * (0.35 + rng.next() * 0.75),
          light: light * (0.4 + rng.next() * 0.6))
      }
      return c
    }
  }

  static let craters: [Crater] = {
    var out: [Crater] = [
      // young, and rayed: Tycho, Copernicus, Kepler, Aristarchus, Proclus,
      // Glushko, Stevinus, Anaxagoras
      Crater(-43.3, -11.4, km: 85, wall: 0.5, fresh: 1).rayed(18, reach: 0.95, light: 0.3, seed: 43),
      Crater(9.6, -20.1, km: 93, wall: 0.5, fresh: 0.9).rayed(16, reach: 0.42, light: 0.22, seed: 96),
      Crater(8.1, -38.0, km: 31, fresh: 0.9).rayed(10, reach: 0.3, light: 0.18, seed: 81),
      Crater(23.7, -47.4, km: 40, fresh: 1.2).rayed(8, reach: 0.18, light: 0.16, seed: 23),
      Crater(16.1, 46.8, km: 28, fresh: 0.9).rayed(7, reach: 0.25, light: 0.16, seed: 16),
      Crater(8.1, -77.6, km: 43, fresh: 0.8).rayed(8, reach: 0.3, light: 0.14, seed: 77),
      Crater(-32.5, 54.2, km: 74, fresh: 0.6).rayed(6, reach: 0.2, light: 0.1, seed: 32),
      Crater(73.4, -10.1, km: 50, fresh: 0.7).rayed(7, reach: 0.25, light: 0.12, seed: 73),
      // bright, without rays: Menelaus, Manilius, Censorinus
      Crater(16.3, 16.0, km: 26, fresh: 0.7), Crater(14.5, 9.1, km: 39, fresh: 0.6),
      Crater(-0.4, 32.7, km: 4, fresh: 0.5),
      // the old walled plains
      Crater(-58.4, -14.4, km: 225, wall: 0.25), Crater(-9.3, -1.9, km: 153, wall: 0.22),
      Crater(-13.4, -3.2, km: 108, wall: 0.3), Crater(-18.2, -1.9, km: 96, wall: 0.32),
      Crater(-11.4, 26.4, km: 100, wall: 0.42), Crater(-13.2, 24.0, km: 98, wall: 0.3),
      Crater(-18.1, 23.4, km: 100, wall: 0.28), Crater(-25.1, 60.4, km: 177, wall: 0.3),
      Crater(-8.9, 61.1, km: 132, wall: 0.36), Crater(-50.5, -6.3, km: 163, wall: 0.25),
      Crater(-49.6, -21.7, km: 145, wall: 0.25), Crater(-41.8, 14.0, km: 114, wall: 0.28),
      Crater(-41.1, 6.0, km: 126, wall: 0.25), Crater(-45.4, 41.5, km: 199, wall: 0.2),
      Crater(-33.1, 1.0, km: 128, wall: 0.25), Crater(-33.1, -4.8, km: 256, wall: 0.15),
      Crater(-11.2, 4.0, km: 114, wall: 0.28), Crater(-5.1, 5.2, km: 138, wall: 0.2),
      Crater(31.8, 29.9, km: 95, wall: 0.2), Crater(46.7, 44.4, km: 87, wall: 0.38),
      Crater(46.7, 39.1, km: 69, wall: 0.38), Crater(29.7, -4.0, km: 81, wall: 0.25),
      Crater(14.5, -11.3, km: 58, wall: 0.45), Crater(-17.6, -40.1, km: 110, wall: 0.28),
      Crater(-20.7, -22.2, km: 61, wall: 0.42), Crater(-44.3, -55.3, km: 227, wall: 0.2),
      Crater(51.6, -9.4, km: 101, wall: 0.3), Crater(50.2, 17.4, km: 88, wall: 0.4),
      Crater(44.3, 16.3, km: 67, wall: 0.4), Crater(27.7, 55.5, km: 125, wall: 0.28),
      Crater(34.5, 56.7, km: 85, wall: 0.35), Crater(39.2, 60.5, km: 125, wall: 0.25),
      Crater(-27.2, 80.9, km: 207, wall: 0.25), Crater(-36.0, 60.6, km: 135, wall: 0.25),
      Crater(-16.4, 61.6, km: 147, wall: 0.22), Crater(-29.7, 32.2, km: 88, wall: 0.35),
      Crater(-21.5, 33.2, km: 124, wall: 0.2), Crater(-25.5, -1.9, km: 118, wall: 0.25),
      Crater(-28.3, -1.0, km: 126, wall: 0.25), Crater(-29.9, -13.5, km: 106, wall: 0.22),
      Crater(-51.8, -39, km: 180, wall: 0.25), Crater(-70.6, -5.5, km: 114, wall: 0.3),
      Crater(-66.5, -69.1, km: 287, wall: 0.18), Crater(-5.2, -68.6, km: 172, wall: 0.25),
      Crater(2.2, -67.6, km: 115, wall: 0.25), Crater(-3.0, -74.6, km: 146, wall: 0.2),
      Crater(63.5, -63.0, km: 142, wall: 0.3), Crater(53.6, 56.5, km: 125, wall: 0.3),
    ]
    // and the uncounted rest, thick on the highlands, sparse on the seas
    var rng = Rng(1_969)
    let named = out.count
    while out.count < named + 300 {
      let z = rng.next()  // even over the near hemisphere
      let a = rng.next() * 2 * .pi
      let s = (1 - z * z).squareRoot()
      let p = V3(s * cos(a), s * sin(a), z)
      if rng.next() < sea(p) * 0.85 { continue }
      let km = 22 + pow(rng.next(), 2.6) * 110
      out.append(Crater(p, km: km, wall: 0.15 + rng.next() * 0.25, fresh: pow(rng.next(), 6) * 0.5))
    }
    return out
  }()

  static let rayed = craters.filter { !$0.rays.isEmpty }

  /// A coarse grid over the disc, and the craters whose skirts reach into
  /// each cell, so a point need only ask its neighbours.
  static let grid = 16

  static let cells: [[Int]] = {
    var cells = [[Int]](repeating: [], count: grid * grid)
    for (i, c) in craters.enumerated() {
      let e = c.r * 2.6
      for y in cell(c.at.y - e)...cell(c.at.y + e) {
        for x in cell(c.at.x - e)...cell(c.at.x + e) { cells[y * grid + x].append(i) }
      }
    }
    return cells
  }()

  static func cell(_ v: Double) -> Int { min(grid - 1, max(0, Int((v + 1) / 2 * Double(grid)))) }

  /// What the ground is at `p`: how pale it is (about 0.45 in the darkest
  /// sea, 1 on the highlands, more where it is fresh), and which way it
  /// slopes, as a vector along the surface.
  static func ground(_ p: V3) -> (albedo: Double, slope: V3, rough: Double) {
    let s = sea(p)
    // the highlands mottled and broken, the seas smoother
    let mottle = fbm(p * 9 + V3(1, 4, 2), 4) - 0.5
    var a = 1 - 0.56 * s + mottle * (0.22 - 0.1 * s)
    var g = V3.zero
    // the rays, thrown far across the older ground
    for c in rayed {
      let cd = simd_dot(p, c.at)
      guard cd > 0 else { continue }
      let q = p - c.at * cd
      for ray in c.rays {
        let along = simd_dot(q, ray.dir)
        guard along > 0, along < ray.reach else { continue }
        let across = simd_dot(q, ray.across) / (ray.width * (1 + along * 1.5))
        let fall = 1 - along / ray.reach
        a += ray.light * exp(-across * across) * fall * fall * ramp(along, c.r * 1.2, c.r * 3)
      }
    }
    // the craters near enough to touch it
    for i in cells[cell(p.y) * grid + cell(p.x)] {
      let c = craters[i]
      let cd = simd_dot(p, c.at)
      guard cd > c.near else { continue }
      let u = acos(min(1, cd)) / c.r
      let rim = exp(-(u - 1) * (u - 1) / 0.04)
      // fresh ground is pale — the bowl, the rim, what it threw out; old
      // floors have gone a little dark
      if c.fresh > 0 {
        a +=
          c.fresh
          * (0.3 * (1 - ramp(u, 0.6, 1.1)) + 0.3 * exp(-(u - 1) * (u - 1) / 0.0625)
            + 0.22 * (1 - ramp(u, 1, 2.6)))
      } else {
        a += 0.06 * rim - 0.03 * (1 - ramp(u, 0.5, 0.95))
      }
      // the lie of it: a bowl falling to the middle, the rim, the skirt
      let dh = (u < 1 ? 2 * u : -1.2 * exp(-(u - 1) * 3)) - 3 * (u - 1) * rim
      let toward = c.at - p * cd
      let len = simd_length(toward)
      if len > 1e-9 { g -= toward / len * (dh * c.wall) }
    }
    return (a, g, mottle * (1 - 0.7 * s))
  }

  // --- noise ---------------------------------------------------------

  /// 0…1, in octaves.
  static func fbm(_ p: V3, _ octaves: Int) -> Double {
    var sum = 0.0, amp = 0.5, norm = 0.0, q = p
    for _ in 0..<octaves {
      sum += noise(q) * amp
      norm += amp
      amp *= 0.5
      q = q * 2.03 + V3(17.1, 5.3, 11.7)
    }
    return sum / norm
  }

  /// Value noise: a random height at each whole point, eased between.
  static func noise(_ p: V3) -> Double {
    let i = p.rounded(.down)
    let f = p - i
    let u = f * f * (3 - 2 * f)
    let x = Int32(i.x), y = Int32(i.y), z = Int32(i.z)
    func h(_ a: Int32, _ b: Int32, _ c: Int32) -> Double {
      var n = UInt32(
        bitPattern: (x &+ a) &* 374_761_393 &+ (y &+ b) &* 668_265_263 &+ (z &+ c) &* 1_274_126_177)
      n = (n ^ (n >> 13)) &* 1_274_126_177
      n ^= n >> 16
      return Double(n) / 4_294_967_295.0
    }
    let x00 = h(0, 0, 0) + (h(1, 0, 0) - h(0, 0, 0)) * u.x
    let x10 = h(0, 1, 0) + (h(1, 1, 0) - h(0, 1, 0)) * u.x
    let x01 = h(0, 0, 1) + (h(1, 0, 1) - h(0, 0, 1)) * u.x
    let x11 = h(0, 1, 1) + (h(1, 1, 1) - h(0, 1, 1)) * u.x
    let y0 = x00 + (x10 - x00) * u.y
    let y1 = x01 + (x11 - x01) * u.y
    return y0 + (y1 - y0) * u.z
  }
}
