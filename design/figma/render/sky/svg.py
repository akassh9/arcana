#!/usr/bin/env python3
"""Vector rebuilds of the sky for Figma (figma.createNodeFromSvg): the backdrop's
gradients, the glint, the held star, the hold ring, the seeded-positions map and
the glint's brightness curve; and gradients.json, every gradient's exact stops.
Everything is rebuilt from the formulas in Sources/Arcana (Chamber.swift,
SkyRenderer.swift, Answers.swift, Keeping.swift), with the seeded values that
mksky wrote to positions/seeded-positions.json. Run after mksky."""
import json, math, pathlib

OUT = pathlib.Path(__file__).resolve().parents[2] / "assets" / "sky"
seeds = json.loads((OUT / "positions" / "seeded-positions.json").read_text())

# --- colours (Palette.swift; rendered sRGB hexes) ---------------------------
def hx(r, g, b):
    return "#%02X%02X%02X" % tuple(int(v * 255 + 0.5) for v in (r, g, b))
PEARL = hx(0.978, 0.968, 0.948)      # F9F7F2
SKY = hx(0.800, 0.858, 0.960)        # CCDBF5
LILAC = hx(0.880, 0.845, 0.970)      # E0D7F7
ROSE = hx(0.992, 0.868, 0.862)       # FDDDDC
DAWN = hx(1.000, 0.878, 0.690)       # FFE0B0
SHADE = "#4D381F"                    # 0.300 is a tie; renders 4D (critic)
GOLDINK = hx(0.560, 0.425, 0.130)    # 8F6C21
GOLD = hx(0.788, 0.659, 0.184)       # C9A82F
GOLDLIT = hx(0.925, 0.808, 0.431)    # ECCE6E
CLEAR = hx(0.846, 0.886, 0.960)      # D8E2F5
WHEEL = "#97782F"                    # Generic-RGB ink as drawn (critic)
WHITE = "#FFFFFF"
assert (PEARL, SKY, LILAC, ROSE, DAWN, GOLDINK, GOLD, GOLDLIT, CLEAR) == (
    "#F9F7F2", "#CCDBF5", "#E0D7F7", "#FDDDDC", "#FFE0B0", "#8F6C21", "#C9A82F", "#ECCE6E", "#D8E2F5")

def f(v):
    s = "%.3f" % v
    s = s.rstrip("0").rstrip(".")
    return "0" if s in ("-0", "") else s

def svg(w, h, body, defs=""):
    d = f"<defs>\n{defs}</defs>\n" if defs else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{f(w)}" height="{f(h)}" '
            f'viewBox="0 0 {f(w)} {f(h)}">\n{d}{body}</svg>\n')

def stops(ss):
    return "".join(f'<stop offset="{f(o)}" stop-color="{c}" stop-opacity="{f(a)}"/>' for o, c, a in ss)

def radial(id, cx, cy, r, ss):
    return (f'<radialGradient id="{id}" gradientUnits="userSpaceOnUse" cx="{f(cx)}" cy="{f(cy)}" '
            f'r="{f(r)}" fx="{f(cx)}" fy="{f(cy)}">{stops(ss)}</radialGradient>\n')

def linear(id, x1, y1, x2, y2, ss):
    return (f'<linearGradient id="{id}" gradientUnits="userSpaceOnUse" x1="{f(x1)}" y1="{f(y1)}" '
            f'x2="{f(x2)}" y2="{f(y2)}">{stops(ss)}</linearGradient>\n')

def write(rel, s):
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(s)
    print("✓", rel)

# --- the backdrop's fields, as data -----------------------------------------
def window(W, H, top=32):
    span = max(W, H)
    sh = H - top
    return dict(W=W, H=H, top=top, span=span,
                moon=(W * 0.86, max(70, sh * 0.12) + top),
                wheel=(W / 2, sh * 0.42 + top), dawn=(W / 2, H * 1.04))

def fields(w):
    W, H, span = w["W"], w["H"], w["span"]
    return [
        dict(id="pearl", kind="solid", color=PEARL, alpha=1, opacity_rest=1, opacity_charge1=1,
             source="Chamber.swift:184; Palette.swift:13"),
        dict(id="high-sky", kind="linear", start=[0, 0], end=[0, H],
             stops=[[0, SKY, 1], [0.34, SKY, 0.55], [0.7, SKY, 0]], opacity_rest=1, opacity_charge1=1,
             source="Chamber.swift:187-193"),
        dict(id="lilac", kind="radial", center=[W * 0.86, H * 0.14], radius=span * 0.44,
             stops=[[0, LILAC, 0.8], [1, LILAC, 0]], opacity_rest=1, opacity_charge1=1,
             source="Chamber.swift:196-198"),
        dict(id="rose", kind="radial", center=[W * 0.08, H * 0.82], radius=span * 0.42,
             stops=[[0, ROSE, 0.7], [1, ROSE, 0]], opacity_rest=1, opacity_charge1=1,
             source="Chamber.swift:199-201"),
        dict(id="dawn", kind="radial", center=[W * 0.5, H * 1.04], radius=span * 0.74,
             stops=[[0, DAWN, 0.95], [0.36, DAWN, 0.42], [1, DAWN, 0]], opacity_rest=0.86,
             opacity_charge1=1.0, source="Chamber.swift:204-212"),
        dict(id="rays", kind="nine wedges, each a radial gradient from the dawn point",
             opacity_rest=0.8, opacity_charge1=1.0, source="Chamber.swift:214-215, 313-341",
             rays=[dict(index=r["index"], triangle=r["triangle_pt"], radius=r["length_pt"],
                        stops=[[0, WHITE, r["center_white_opacity"]], [0.5, WHITE, 0.06], [1, WHITE, 0]])
                   for r in seeds["at_%dx%d" % (W, H)]["rays"]]),
        dict(id="as-above-slot", kind="(the Moon's and the Sun's lights go here, see answers)",
             source="Chamber.swift:218"),
        dict(id="wheel", kind="vector line art (wheel/engraved-wheel.svg)", color=WHEEL,
             side=span * 1.32, center=list(w["wheel"]), opacity_rest=0.055, opacity_charge1=0.105,
             source="Chamber.swift:220-222, 58-90; CardArt.swift:496-526"),
        dict(id="moon", kind="see moon/", center=list(w["moon"]), source="Chamber.swift:224, 348-400"),
        dict(id="near-sky", kind="GPU layer (see near/)", source="Chamber.swift:226-228"),
        dict(id="vignette", kind="radial", center=[W / 2, H / 2], radius=span * 0.8,
             stops=[[0, SHADE, 0], [0.38 / 0.8, SHADE, 0], [1, SHADE, 0.09]], opacity_rest=1,
             opacity_charge1=1, source="Chamber.swift:231-233",
             note="SwiftUI startRadius 0.38 span, endRadius 0.8 span: clear inside 0.38 span"),
    ]

def backdrop_svg(w):
    W, H = w["W"], w["H"]
    defs, body = "", ""
    for L in fields(w):
        i = L["id"]
        if L["kind"] == "solid":
            body += f'<g id="{i}"><rect x="0" y="0" width="{f(W)}" height="{f(H)}" fill="{L["color"]}"/></g>\n'
        elif L["kind"] == "linear":
            defs += linear(f"g-{i}", *L["start"], *L["end"], L["stops"])
            body += f'<g id="{i}"><rect x="0" y="0" width="{f(W)}" height="{f(H)}" fill="url(#g-{i})"/></g>\n'
        elif L["kind"] == "radial":
            defs += radial(f"g-{i}", *L["center"], L["radius"], L["stops"])
            op = f' opacity="{f(L["opacity_rest"])}"' if L["opacity_rest"] != 1 else ""
            body += f'<g id="{i}"{op}><rect x="0" y="0" width="{f(W)}" height="{f(H)}" fill="url(#g-{i})"/></g>\n'
        elif i == "rays":
            body += f'<g id="rays" opacity="{f(L["opacity_rest"])}">\n'
            for r in L["rays"]:
                o = r["triangle"][0]
                defs += radial(f"g-ray-{r['index']}", o[0], o[1], r["radius"], r["stops"])
                pts = " ".join(f"{f(x)},{f(y)}" for x, y in r["triangle"])
                body += f'<polygon id="ray-{r["index"]}" points="{pts}" fill="url(#g-ray-{r["index"]})"/>\n'
            body += "</g>\n"
    return svg(W, H, body, defs)

# --- the near sky's primitives ---------------------------------------------
def arm_gradient(id, x1, y1, x2, y2, color, a):
    """Mirrored fade (1 - s)^2 from the heart to each tip (SkyRenderer.swift:156-160)."""
    n = 10
    ss = []
    for k in range(-n, n + 1):
        s = abs(k) / n
        ss.append(((k + n) / (2 * n), color, a * (1 - s) ** 2))
    return linear(id, x1, y1, x2, y2, ss)

def spikes(prefix, cx, cy, L, w, color, a, level=0.62):
    """Four arms thinning from w at the heart to nothing: an upright rhombus,
    and a level one 0.62 as long."""
    defs = arm_gradient(f"{prefix}-up", cx, cy - L, cx, cy + L, color, a)
    defs += arm_gradient(f"{prefix}-level", cx - L * level, cy, cx + L * level, cy, color, a)
    body = (f'<g id="{prefix}-arms">'
            f'<polygon id="upright-arm" points="{f(cx)},{f(cy - L)} {f(cx + w / 2)},{f(cy)} {f(cx)},{f(cy + L)} {f(cx - w / 2)},{f(cy)}" fill="url(#{prefix}-up)"/>'
            f'<polygon id="level-arm" points="{f(cx - L * level)},{f(cy)} {f(cx)},{f(cy - w / 2)} {f(cx + L * level)},{f(cy)} {f(cx)},{f(cy + w / 2)}" fill="url(#{prefix}-level)"/>'
            f'</g>\n')
    return defs, body

def glow(id, cx, cy, r, color, a0, a1=0, mid=None):
    ss = [(0, color, a0)] + ([(0.5, color, mid)] if mid is not None else []) + [(1, color, a1)]
    return radial(f"g-{id}", cx, cy, r, ss), f'<circle id="{id}" cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" fill="url(#g-{id})"/>\n'

def glint_svg(size, tw=1.0, charge=0.0):
    c = 16
    a = tw ** 6 * (0.8 + 0.2 * charge)
    L = 1.6 * size * (0.6 + 0.4 * tw)
    d1, b1 = spikes("glint", c, c, L, 1, GOLDINK, a * 0.55)
    d2, b2 = glow("glint-glow", c, c, 5, GOLDLIT, a * 0.7)
    return svg(32, 32, f'<g id="glint-size-{f(size)}">\n{b1}{b2}</g>\n', d1 + d2)

def star_svg(size, held=1.0, breath=0.5):
    c = 16
    d0, b0 = glow("star-halo", c, c, 14, WHITE, 0.5 * held)
    d1, b1 = spikes("star", c, c, 2.2 * size * (0.94 + 0.06 * breath), 1.1, GOLDINK, 0.5 * held)
    d2, b2 = glow("star-core", c, c, 4, GOLDLIT, 0.8 * held)
    b3 = f'<circle id="pearl-heart" cx="{c}" cy="{c}" r="0.9" fill="{WHITE}" fill-opacity="{f(0.9 * held)}"/>\n'
    return svg(32, 32, f'<g id="held-star-size-{f(size)}">\n{b0}{b1}{b2}{b3}</g>\n', d0 + d1 + d2)

def arc_path(cx, cy, r, a0, sweep):
    x0, y0 = cx + r * math.cos(a0), cy + r * math.sin(a0)
    x1, y1 = cx + r * math.cos(a0 + sweep), cy + r * math.sin(a0 + sweep)
    large = 1 if sweep > math.pi else 0
    return f"M{f(x0)} {f(y0)}A{f(r)} {f(r)} 0 {large} 1 {f(x1)} {f(y1)}"

RING_R = 117.48  # fanH 178 x 0.66 at the default window (Game.swift:891)

def ring_svg(c, b=0.5, shown=1.0, r=RING_R, S=360):
    """Chamber.swift:530-548."""
    cx = cy = S / 2
    defs, body = "", ""
    ro = r * 1.2 * (1 + 0.035 * b + 0.05 * c)
    body += (f'<g id="rings" fill="none" stroke="{GOLDINK}" stroke-width="1">'
             f'<circle id="outer-ring" cx="{f(cx)}" cy="{f(cy)}" r="{f(ro)}" stroke-opacity="{f((0.10 + 0.08 * b + 0.14 * c) * shown)}"/>'
             f'<circle id="inner-ring" cx="{f(cx)}" cy="{f(cy)}" r="{f(r * (1 + 0.02 * b))}" stroke-opacity="{f((0.26 + 0.14 * b) * shown)}"/>'
             f'</g>\n')
    if c > 0.004:
        body += '<g id="charge-arc" fill="none" stroke-linecap="round" stroke-linejoin="round">'
        for name, w, col, a in [("glow-14", 14, GOLDLIT, 0.20 + 0.18 * c), ("glow-6", 6, GOLDLIT, 0.45),
                                ("core-1.8", 1.8, GOLDINK, 0.95)]:
            sweep = 2 * math.pi * c
            if sweep >= 2 * math.pi - 1e-6:
                body += f'<circle id="arc-{name}" cx="{f(cx)}" cy="{f(cy)}" r="{f(r)}" stroke="{col}" stroke-width="{f(w)}" stroke-opacity="{f(a * shown)}"/>'
            else:
                body += f'<path id="arc-{name}" d="{arc_path(cx, cy, r, -math.pi / 2, sweep)}" stroke="{col}" stroke-width="{f(w)}" stroke-opacity="{f(a * shown)}"/>'
        body += "</g>\n"
        head = c * 2 * math.pi - math.pi / 2
        hx_, hy_ = cx + math.cos(head) * r, cy + math.sin(head) * r
        d, g = glow("head-glow", hx_, hy_, 14, GOLDLIT, 0.9 * shown)
        defs += d
        body += f'<g id="head">{g}<circle id="head-spark" cx="{f(hx_)}" cy="{f(hy_)}" r="2.5" fill="{GOLDINK}" fill-opacity="{f(shown)}"/></g>\n'
    return svg(S, S, f'<g id="hold-ring-charge-{f(c)}">\n{body}</g>\n', defs)

# --- the seeded-positions map --------------------------------------------------
def positions_svg():
    W, H = 1260, 860
    P = seeds["at_1260x860"]
    b = ""
    b += f'<g id="window"><rect x="0" y="0" width="{W}" height="{H}" fill="{PEARL}" stroke="#26201C" stroke-opacity="0.4" stroke-width="1"/></g>\n'
    b += f'<g id="title-bar"><rect x="0" y="0" width="{W}" height="32" fill="#26201C" fill-opacity="0.06"/></g>\n'
    b += '<g id="rays" fill="none" stroke="#C9A82F" stroke-opacity="0.55" stroke-width="1">\n'
    for r in P["rays"]:
        pts = " ".join(f"{f(x)},{f(y)}" for x, y in r["triangle_pt"])
        b += f'<polygon id="ray-{r["index"]}" points="{pts}"/>\n'
    b += "</g>\n"
    cx, cy = P["wheel_center"]
    side = P["wheel_side"]
    u = side / 1500
    b += '<g id="wheel-rings" fill="none" stroke="#97782F" stroke-opacity="0.5" stroke-width="1">'
    for rad in (124, 300, 318, 470, 596, 610, 740):
        b += f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(rad * u)}"/>'
    b += f'<line x1="{f(cx - 8)}" y1="{f(cy)}" x2="{f(cx + 8)}" y2="{f(cy)}"/><line x1="{f(cx)}" y1="{f(cy - 8)}" x2="{f(cx)}" y2="{f(cy + 8)}"/></g>\n'
    b += '<g id="blooms" fill="#FFFFFF" fill-opacity="0.5" stroke="#8F6C21" stroke-opacity="0.6" stroke-width="1">\n'
    for i, bl in enumerate(P["blooms_pt_at_t0"]):
        b += f'<circle id="bloom-{i + 1}" cx="{f(bl["x"])}" cy="{f(bl["y"])}" r="{f(bl["r"])}"/>\n'
    b += "</g>\n"
    b += '<g id="glints" stroke="#8F6C21" stroke-width="1.2" stroke-linecap="round">\n'
    for i, (g, gg) in enumerate(zip(P["glints_pt"], seeds["glints"])):
        L = 1.6 * gg["size"] * 1.4
        x, y = g["x"], g["y"]
        b += (f'<g id="glint-{i + 1}"><line x1="{f(x)}" y1="{f(y - L)}" x2="{f(x)}" y2="{f(y + L)}"/>'
              f'<line x1="{f(x - L * 0.62)}" y1="{f(y)}" x2="{f(x + L * 0.62)}" y2="{f(y)}"/></g>\n')
    b += "</g>\n"
    b += '<g id="glint-keep-out" fill="none" stroke="#8C2E25" stroke-opacity="0.45" stroke-width="1" stroke-dasharray="6 5">'
    b += f'<rect x="{f(0.28 * W)}" y="{f(0.1 * H)}" width="{f(0.44 * W)}" height="{f(0.7 * H)}"/></g>\n'
    b += '<g id="motes-x" stroke="#C9A82F" stroke-width="1.5" stroke-linecap="round">\n'
    for i, m in enumerate(seeds["motes"]):
        x = m["x"] * W
        b += f'<line id="mote-{i + 1}-lane" x1="{f(x)}" y1="{H - 4}" x2="{f(x)}" y2="{H - 4 - 6 - m["size"] * 4}"/>\n'
    b += "</g>\n"
    b += '<g id="motes-at-T" fill="#C9A82F">\n'
    for i, (m, p) in enumerate(zip(seeds["motes"], seeds["motes_at_T_1260x860"])):
        if -10 < p["y"] < H + 10:
            b += f'<circle id="mote-{i + 1}" cx="{f(p["x"])}" cy="{f(p["y"])}" r="{f(max(1.2, m["size"]))}"/>\n'
    b += "</g>\n"
    mx, my = P["moon_center"]
    b += (f'<g id="moon"><circle cx="{f(mx)}" cy="{f(my)}" r="48" fill="none" stroke="#26201C" stroke-opacity="0.3" stroke-dasharray="3 3"/>'
          f'<circle cx="{f(mx)}" cy="{f(my)}" r="16" fill="#FFF9EE" stroke="#26201C" stroke-opacity="0.5"/></g>\n')
    dx, dy = P["deck_ring_center"]
    R = P["ringR"]
    b += (f'<g id="hold-ring" fill="none" stroke="#8F6C21" stroke-width="1">'
          f'<circle cx="{f(dx)}" cy="{f(dy)}" r="{f(R)}"/><circle cx="{f(dx)}" cy="{f(dy)}" r="{f(R * 1.2)}" stroke-opacity="0.5"/>'
          f'<circle cx="{f(dx)}" cy="{f(dy)}" r="2.5" fill="#8F6C21"/></g>\n')
    ox, oy = P["dawn_point"]
    b += f'<g id="dawn-point"><circle cx="{f(ox)}" cy="{f(min(oy, H - 3))}" r="5" fill="#FFE0B0" stroke="#8F6C21"/></g>\n'
    return svg(W, H, f'<g id="seeded-positions-1260x860">\n{b}</g>\n')

def curve_svg():
    W, H, pad = 400, 160, 20
    pts = []
    for k in range(0, 201):
        th = k / 200
        tw = max(0, math.sin(th * 2 * math.pi))
        a = tw ** 6 * 0.8
        pts.append((pad + th * (W - 2 * pad), H - pad - a / 0.8 * (H - 2 * pad)))
    poly = " ".join(f"{f(x)},{f(y)}" for x, y in pts)
    b = (f'<g id="axes" stroke="#26201C" stroke-opacity="0.4" stroke-width="1">'
         f'<line x1="{pad}" y1="{H - pad}" x2="{W - pad}" y2="{H - pad}"/><line x1="{pad}" y1="{pad}" x2="{pad}" y2="{H - pad}"/>'
         f'<line x1="{W / 2}" y1="{H - pad}" x2="{W / 2}" y2="{H - pad + 4}"/></g>\n'
         f'<g id="brightness" fill="none" stroke="#8F6C21" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="{poly}"/></g>\n')
    return svg(W, H, f'<g id="glint-brightness-one-period">\n{b}</g>\n')

# --- write -------------------------------------------------------------------
big, small = window(1260, 860), window(940, 660)
write("backdrop/backdrop-native-1260x860.svg", backdrop_svg(big))
write("backdrop/backdrop-native-940x660.svg", backdrop_svg(small))
for s in (3, 5, 7):
    write(f"near/glint-vector-size-{s}.svg", glint_svg(s))
    write(f"near/star-held-vector-size-{s}.svg", star_svg(s))
for c in (0, 0.25, 0.5, 0.75, 1):
    write(f"near/ring-vector-charge-{c}.svg", ring_svg(c))
write("positions/seeded-positions-map.svg", positions_svg())
write("near/glint-brightness-curve.svg", curve_svg())

# --- gradients.json ------------------------------------------------------------
def moon_lights(w):
    W, H, span = w["W"], w["H"], w["span"]
    mx, my = w["moon"]
    r0, R = 16 * 1.02, 130.0
    at = lambda k: (r0 + k * (R - r0)) / R
    return [
        dict(id="clearing", answers="The Moon reversed", center=[W * 0.86, H * 0.14], radius=span * 0.44,
             stops=[[0, CLEAR, 0.78], [0.5, CLEAR, 0.36], [1, CLEAR, 0]], peak_opacity="tonight's illumination",
             source="Answers.swift:210-218"),
        dict(id="moonlight", answers="The Moon upright", center=[mx, my], radius=span * 1.25,
             stops=[[0, LILAC, 0.9], [0.42, LILAC, 0.5], [1, LILAC, 0]], peak_opacity="tonight's illumination",
             source="Answers.swift:219-225"),
        dict(id="halo", answers="The Moon upright", center=[mx, my], radius=R,
             stops=[[0, LILAC, 0.55], [round(at(0), 4), LILAC, 0.55], [round(at(0.16), 4), WHITE, 0.5],
                    [round(at(0.5), 4), LILAC, 0.28], [1, LILAC, 0]], peak_opacity="tonight's illumination",
             source="Answers.swift:226-237"),
        dict(id="morning", answers="The Sun upright", center=[W * 0.5, H * 1.04], radius=span * 1.2,
             stops=[[0, DAWN, 0.9], [0.38, DAWN, 0.55], [1, DAWN, 0]], peak_opacity=1,
             source="Answers.swift:238-244"),
        dict(id="rays", answers="The Sun, either way", kind="the nine shafts again, 1.4x as long, centre opacity x1.1, mid stop 0.066 at 0.5",
             peak_opacity=0.8, source="Answers.swift:253-292"),
        dict(id="glare", answers="The Sun reversed", kind="solid", color=WHITE, peak_opacity=0.42,
             source="Answers.swift:245, 294; Chamber.swift:294-295"),
    ]

grad = {
    "notes": ("Every sky gradient is sRGB, interpolated in gamma-encoded sRGB, premultiplied (SwiftUI); each "
              "fades one colour to itself at 0 alpha, so Figma's straight-alpha interpolation matches. Radial "
              "gradients are CIRCLES with radii in points: in Figma draw each on a square layer 2R wide centred "
              "on its point (or import backdrop-native-*.svg, whose gradients carry the circle), clipped by the "
              "window frame. Coordinates are WINDOW points, y down, with the 32 pt hidden title bar included "
              "(the sky runs under it). Stack order is the list order, bottom first."),
    "stack_order": ["pearl", "high-sky", "lilac", "rose", "dawn", "rays", "as-above lights", "wheel", "moon",
                    "near sky (GPU)", "vignette"],
    "window_1260x860": {"geometry": big, "layers": fields(big), "as_above": moon_lights(big)},
    "window_940x660": {"geometry": small, "layers": fields(small), "as_above": moon_lights(small)},
    "moon": {
        "aureole": dict(kind="radial", box_pt=96, center="moon centre", start_radius=16, end_radius=48,
                        stops=[[0, WHITE, "0.22 + 0.14 x illumination"], [1, WHITE, 0]],
                        note="clear inside r 16 (under the face)", source="Chamber.swift:386-393"),
        "hover_halo": dict(kind="radial", box_pt=96, start_radius=16, end_radius=46,
                           stops=[[0, WHITE, 0.5], [1, WHITE, 0]], shown="opacity 0 -> 1, ease-out 0.3 s, only when the moon can open",
                           source="Chamber.swift:360-367"),
        "took_glow": dict(kind="radial", box_pt=192, start_radius=0, end_radius=96,
                          stops=[[0, WHITE, 0.7], [0.17, WHITE, 0.7], [0.42, WHITE, 0.28], [1, WHITE, 0]],
                          shown="opacity keyframes 0, 1, 1, 0 at 0, 0.28, 0.40, 1.0 of 5 s, each span cubic-bezier(1/3,0,2/3,1)",
                          source="Keeping.swift:1083-1113, 1153-1169"),
        "cross_fade": "0.9 s ease-in-out opacity between nights (Chamber.swift:370-372)",
    },
    "near_sky_primitives": {
        "blend": "premultiplied source-over on a transparent layer; every edge antialiased by coverage (SkyRenderer.swift:119-207)",
        "glow": "disc of radius r, colour linear from c0 at the centre (through c1 at r/2) to c2 at the edge; hard edge at r",
        "mote": dict(halo=["disc r x 3.6", GOLDLIT, "0.22 a"], core=["disc r", GOLD, "a"],
                     r="size (0.6-2.0) x (1 + 0.5 charge)",
                     a="min(1, alpha x edge x (0.72 + 0.28 sin(t flicker + phase)) x (0.8 + 0.2 breath) x (1 + 0.8 charge))",
                     source="Chamber.swift:550-577"),
        "bloom": dict(glow=["r 9-39", WHITE, "0.55a -> 0.35a at r/2 -> 0"], rim=["ring r x 0.92, 0.8 pt", GOLD, "0.10a"],
                      a="alpha (0.35-0.75) x (0.75 + 0.25 breath)", drift="x 0.03 W sin(t speed + phase), y 0.02 H cos(0.8 t speed + phase); pointer parallax 22/14 pt",
                      source="Chamber.swift:486-498"),
        "glint": dict(arms=["upright 1.6 x size x (0.6 + 0.4 tw) each way, level 0.62 of it; 1 pt at the heart thinning to 0, alpha (1-s)^2 along", GOLDINK, "0.55a"],
                      glow=["r 5", GOLDLIT, "0.7a -> 0"], a="tw^6 x (0.8 + 0.2 charge), tw = max(0, sin(t rate + phase))",
                      parallax="16/11 pt", source="Chamber.swift:503-528; SkyRenderer.swift:90-94, 154-160, 197-201"),
        "held_star": dict(halo=["r 14", WHITE, "0.5 h -> 0"], arms=["2.2 x size x (0.94 + 0.06 breath), 1.1 pt", GOLDINK, "0.5 h"],
                          core=["r 4", GOLDLIT, "0.8 h -> 0"], heart=["disc r 0.9", WHITE, "0.9 h"],
                          h="upright: ramp(p, k/11 x 0.72, +0.28); reversed: one at a time, 6.5 s each, 0.85 x ramp(f,0,0.42) x (1 - ramp(f,0.55,0.95))",
                          source="Chamber.swift:518-526; Answers.swift:179-189"),
        "ring": dict(outer=["circle R x 1.2 x (1 + 0.035 b + 0.05 c), 1 pt", GOLDINK, "(0.10 + 0.08 b + 0.14 c) x shown"],
                     inner=["circle R x (1 + 0.02 b), 1 pt", GOLDINK, "(0.26 + 0.14 b) x shown"],
                     arc=[["14 pt", GOLDLIT, "0.20 + 0.18 c"], ["6 pt", GOLDLIT, "0.45"], ["1.8 pt", GOLDINK, "0.95"]],
                     arc_geometry="radius R, from 12 o'clock clockwise through 360 c degrees, round caps",
                     head=[["glow r 14", GOLDLIT, "0.9 -> 0"], ["disc r 2.5", GOLDINK, "1"]],
                     R="fanH x 0.66 = 117.48 at 1260x860 (89.11 at 940x660)",
                     shown="1 while asking; after the cut min(1, 1.5 c) as c drains at 2/3.2 per s",
                     source="Chamber.swift:449-467, 530-548"),
        "flash": dict(bloom="age < 1.3 s: k = 1 - age/1.3; glow r 70 + (1-k) 240 s; white 0.85 k^2 s' -> goldLit 0.35 k^2 s' at r/2 -> 0 (s' = min(s, 1.4), alpha clamps at 1)",
                      ripple="k = age/2.2; r 30 + (1 - (1-k)^3) 520 s; fade (1-k)^2.2 x min(s, 1.3); ring 7 pt goldLit 0.35 fade + ring 1 pt goldInk 0.45 fade",
                      strength="1 when a card lands (at its slot), 1.5 at the cut (at the deck)",
                      source="Chamber.swift:613-636; Game.swift:414, 479"),
        "given_dust": dict(mote="as a mote: disc 3.6 rad goldLit 0.22 al + disc rad gold al; rad = (0.8-2.1) x (1 + 0.5 c)",
                           path="from its letter, turning (0.6-1.5) u^2 rad about the deck while closing to it by (1 - u)",
                           source="Chamber.swift:583-611; Quill.swift:226-235"),
    },
}
write("backdrop/gradients.json", json.dumps(grad, indent=1) + "\n")

# --- As Above: where the stars come out, and the Sun's longer rays ---------------
def as_above(W, H):
    P = seeds["at_%dx%d" % (W, H)]
    return {
        "window_pt": [W, H],
        "stars": [dict(index=g["index"], x_pt=round(g["x"] * W, 2), y_pt=round(g["y"] * H, 2),
                       x=g["x"], y=g["y"], size=g["size"], star_arm_pt=g["star_arm_pt"],
                       comes_out_over_p=g["star_comes_out_p"],
                       reversed_turn_s=[round(6.5 * (g["index"] - 1), 1), round(6.5 * g["index"], 1)])
                  for g in seeds["glints"]],
        "sun_rays": [dict(index=r["index"], angle_deg_from_up=r["angle_deg_from_up"],
                          half_width_deg=r["half_width_deg"], length_pt=r["as_above_length_pt"],
                          center_white_opacity=r["as_above_center_opacity"], mid_stop=[0.5, 0.066],
                          triangle_pt=r["as_above_triangle_pt"]) for r in P["rays"]],
        "dawn_point": P["dawn_point"], "moon_center": P["moon_center"],
    }
write("answers/as-above-positions.json", json.dumps({
    "notes": ("The Star's stars are the eleven glints, held: they stand where the glints are (fractions of the "
              "full window, drifting a few points with the pointer). Upright, star k (1-11) comes out over p in "
              "[(k-1)/11 x 0.72, +0.28] of a 9 s answer and stays, breathing (arm x 0.94-1.0). Reversed, one at a "
              "time comes out and goes in again, 6.5 s each, in index order, never more than one (peak 0.85). "
              "The Sun's rays are the same nine shafts from the same seed (1919), drawn 1.4x as long, centre "
              "opacity x1.1, with the middle stop at 6.6%, rendered at half resolution, at 80% at their peak. "
              "Sources: Answers.swift:175-189, 250-292; Chamber.swift:136-153, 503-528."),
    "answer_timing": {"length_s": 9, "wheel_reversed_s": 14, "reduce_motion_s": 1.2, "let_go_fade_s": 0.6,
                      "curve": "ramp's S (3t^2 - 2t^3), cubic-bezier(1/3, 0, 2/3, 1)",
                      "peaks": {"moonlight": "illumination", "halo": "illumination", "clearing": "illumination",
                                "morning": 1, "rays": 0.8, "glare": 0.42},
                      "wheel": "upright: turns 30 deg clockwise and stays; reversed: 0 -> 30 by p 0.46, holds to 0.54, back to 0 at 1"},
    "tonight": {"date": "2026-09-30 21:00 America/Chicago", "illumination": 0.7909, "name": "waning gibbous"},
    "at_1260x860": as_above(1260, 860), "at_940x660": as_above(940, 660)}, indent=1) + "\n")
