#!/usr/bin/env python3
"""Writes assets/sky/manifest.json from what mksky, svg.py and sheets.sh made."""
import json, pathlib, re, struct

ASSETS = pathlib.Path(__file__).resolve().parents[2] / "assets"
SKY = ASSETS / "sky"

def png_size(p):
    with open(p, "rb") as f:
        head = f.read(24)
    return list(struct.unpack(">II", head[16:24]))

def svg_size(p):
    s = p.read_text()[:400]
    w = float(re.search(r'width="([\d.]+)"', s).group(1))
    h = float(re.search(r'height="([\d.]+)"', s).group(1))
    return [w, h]

phases = json.loads((SKY / "moon" / "moon-phases.json").read_text())
tonight = phases["tonight"]
ILL = tonight["illumination"]

items = []
def add(rel, title, description, group, source, states="", figma_hint="", caveats="", scale=None,
        vector=None, pt=None):
    p = SKY / rel
    assert p.exists(), rel
    kind = p.suffix[1:]
    it = {"file": f"sky/{rel}", "title": title, "description": description, "kind": kind,
          "group": group, "order": len(items) + 1, "source": source, "states": states,
          "figma_hint": figma_hint, "caveats": caveats}
    if kind == "png":
        px = png_size(p)
        if scale is None:
            m = re.search(r"@(\d+)x", rel)
            scale = int(m.group(1)) if m else 1
        it["px"] = px
        it["scale"] = scale
        it["pt"] = pt or [round(px[0] / scale, 2), round(px[1] / scale, 2)]
        it["vector"] = False if vector is None else vector
    elif kind == "svg":
        it["pt"] = svg_size(p)
        it["vector"] = True
    else:
        it["vector"] = False if vector is None else vector
    items.append(it)

W = "1260x860 window (1260x828 stage under the 32 pt hidden title bar)"

# ---------------------------------------------------------------- backdrop
layers = [
    ("pearl", "Pearl ground", "The opaque ground of the whole sky, #F9F7F2, under everything. Also the window background.",
     "Chamber.swift:184; Palette.swift:13", "", "Solid fill; rebuild natively as a #F9F7F2 rectangle."),
    ("high-sky", "High sky (linear)", "Pale cornflower blue #CCDBF5 overhead, clearing toward the table: 100% at the top, 55% at 0.34 of the window height, 0% at 0.70. Linear, straight down the full window.",
     "Chamber.swift:187-193", "", "Linear gradient top to bottom over the full frame; stops in gradients.json."),
    ("lilac", "Lilac in the air (radial)", "Lilac #E0D7F7 pooled high on the right around the moon: 80% at (0.86, 0.14) of the window, fading to 0 at 0.44 x span (554.4 pt at 1260x860; span = the window's longer side).",
     "Chamber.swift:196-198", "", "Circular radial: a 1108.8 pt square layer centred on (1083.6, 120.4), clipped by the window."),
    ("rose", "Rose in the air (radial)", "Rose #FDDDDC low on the left: 70% at (0.08, 0.82), fading to 0 at 0.42 x span (529.2 pt).",
     "Chamber.swift:199-201", "", "Circular radial: a 1058.4 pt square layer centred on (100.8, 705.2), clipped."),
    ("dawn", "First light (radial)", "Warm apricot #FFE0B0 rising from just under the foot of the window: 95% at (0.5, 1.04), 42% at 0.36, 0% at 0.74 x span (932.4 pt). The PNG is the gradient at layer opacity 100%.",
     "Chamber.swift:204-212", "Layer opacity 86% at rest, rising to 100% as the question is held (charge 0 to 1, over 3.2 s).",
     "Circular radial centred below the frame at (630, 894.4); set the layer opacity to 86%."),
    ("rays", "The nine rays", "Nine soft white shafts fanning up from the dawn point (630, 894.4): wedges 2.5-4.4 degrees half-wide, 0.85-1.19 x span long, each a radial gradient white 17-27% at the point, 6% halfway, 0 at the tip. Seeded (1919), identical every launch. The PNG is at layer opacity 100%.",
     "Chamber.swift:214-215, 313-341", "Layer opacity 80% at rest, 100% at full charge.",
     "Vector in backdrop-native-*.svg (group 'rays', one polygon per ray); set the group opacity to 80%."),
    ("wheel", "The engraved wheel (bitmap, as shown)", "The celestial wheel of twelve houses and a star of eight, brown-gold #97782F, drawn by the cards' unsteady pen. 1663.2 pt square (1.32 x span) centred on (630, 379.76), overflowing the window. The PNG is at full ink (layer opacity 100%).",
     "Chamber.swift:58-90, 220-222, 250-269", "Layer opacity 5.5% at rest, 10.5% at full charge. Turned 30 degrees clockwise while the Wheel is answered.",
     "Prefer the vector wheel/engraved-wheel.svg; set the layer opacity to 5.5%.",
     "The app draws this from a 1500 px bitmap, so it is slightly softer than the vector. At 5.5% the difference cannot be seen."),
    ("vignette", "The edge of the page (vignette)", "A breath of warm shade #4D381F toward the corners: clear inside 0.38 x span (478.8 pt) of the window centre, rising to 9% at 0.8 x span (1008 pt). The PNG holds the shade at 100% for precision.",
     "Chamber.swift:230-233", "Constant.", "Circular radial centred on the window; set the layer opacity to 9%. The native SVG carries the true 0-9% stops.",
     "An 8-bit PNG of a 9% gradient would band, so this one is the shade at full strength. Use 9% layer opacity."),
]
for i, (n, t, d, src, st, hint, *cav) in enumerate(layers):
    add(f"backdrop/sky-layer-{i + 1}-{n}-1260x860.png", f"Sky layer {i + 1}: {t}", d, "Sky / backdrop layers", src, st,
        hint + " Stack the eight layers in number order (the As Above lights go between 6 and 7; the moon and near sky between 7 and 8).",
        cav[0] if cav else "Rendered at 1x through ImageRenderer from the same SwiftUI code. Stacked at the stated layer opacities, it matches the chamber's composite within 0.5/255 mean.")
for c in (0, 1):
    for w, note in (("1260x860", W), ("940x660", "940x660 minimum window (940x628 stage)")):
        add(f"backdrop/backdrop-composite-charge-{c}-{w}.png",
            f"Backdrop composite, charge {c}, {w}",
            f"The eight backdrop layers together, as the real Chamber view draws them, without the moon or the near sky. {note}. "
            + ("At rest: dawn 86%, rays 80%, wheel 5.5%." if c == 0 else "At the full charge of a held question: dawn, rays 100%, wheel 10.5%."),
            "Sky / composites", "Chamber.swift:157-240",
            "Charge 0 = the room at rest; charge 1 = the moment before the cut (3.2 s of holding).",
            "Screen-frame background; lock it under everything.",
            "The sky runs under the transparent title bar, so y 0-32 is the title-bar strip where the traffic lights sit.")
for w in ("1260x860", "940x660"):
    add(f"backdrop/backdrop-native-{w}.svg", f"Backdrop gradients, native vector, {w}",
        "Pearl, high sky, lilac, rose, dawn (group opacity 86%), the nine rays (group opacity 80%) and the vignette as SVG gradients with exact stops, centres and radii, ready for figma.createNodeFromSvg. The wheel is separate (wheel/engraved-wheel.svg).",
        "Sky / backdrop layers", "Chamber.swift:183-234, 313-341",
        "At rest. For the held state set dawn and rays to 100%.",
        "Import as the native, editable backdrop; each group becomes a named layer.",
        "Checked: imported into Figma and exported back, it matches the Swift render within 0.5/255 mean, 5/255 max (1260x860).")
add("backdrop/gradients.json", "Every sky gradient, as data",
    "Stops (hex, alpha, position), centres and radii in window points for both window sizes: the backdrop layers, the As Above lights, the moon's aureole, hover halo and 5 s glow, and the near sky's primitives (mote, bloom, glint, held star, ring, flash, given dust) with their formulas.",
    "Sky / specs", "Chamber.swift, Answers.swift, Keeping.swift:1083-1113, SkyRenderer.swift",
    figma_hint="Reference for rebuilding gradients natively (draw each radial on a square 2R layer centred on its point).")

# ---------------------------------------------------------------- composite
for c in (0, 1):
    for w in ("1260x860", "940x660"):
        add(f"composite/sky-full-charge-{c}-{w}@2x.png", f"The whole sky, charge {c}, {w}",
            "Everything the sky draws, as the app's shot route renders it: the backdrop, tonight's moon (waning gibbous, 2026-09-30) and the near sky (gold dust, lens blooms, glints and the hold ring around the deck). No type, no cards. "
            + ("At rest." if c == 0 else "Held to full charge: the ring's gold arc complete, the dust drawn in and spiralling toward the deck, dawn, rays and wheel brightened."),
            "Sky / composites", "Chamber.swift:157-240; SkyRenderer.swift:280-306",
            "One still at a fixed moment (breath 0.88, several glints lit). Live, the near sky moves at 60-120 fps.",
            "Screen-frame background at the given window size.",
            "The near sky is a Metal layer, drawn here as SkyRenderer.still. The words (ARCANA, the invitation, the moon's label, 'press and hold') are not in it.")

# ---------------------------------------------------------------- wheel
add("wheel/engraved-wheel.svg", "The engraved wheel (vector)",
    "The celestial wheel as clean line art from CardArt.wheelMarks: six rings (300-740 of a 1500 unit square), twelve house lines, twelve small house rings, 120 + 72 ticks, the star of eight and sixteen rays in the inner court, all in the pen's unsteady hand. 241 round-capped strokes in #97782F at full ink.",
    "Sky / wheel", "CardArt.swift:494-526; Chamber.swift:65-90",
    "Shown at 5.5% opacity at rest, 10.5% at full charge. 1663.2 pt at the default window (1.32 x span), centred on (630, 379.76).",
    "Component; place centred on the wheel point, clip by the window frame, layer opacity 5.5%.",
    "Checked: Figma import vs CoreGraphics stroke of the same paths, mean 0.12/255. The ink is #97782F as drawn (the code's CGColor is Generic RGB; #856624 is wrong).")
add("wheel/engraved-wheel-turned-30.svg", "The engraved wheel, turned 30 degrees",
    "The same wheel turned one house (30 degrees clockwise), where the upright Wheel's answer ends and stays while the card lies on the table. The house lines and ticks land on themselves; the star of eight and the inner rays show the turn.",
    "Sky / wheel", "Answers.swift:150-166, 485-540",
    "Upright Wheel: turns 0 to 30 degrees over 9 s (ramp S curve) and stays. Reversed: to 30 by 46%, holds to 54%, back to 0 at 14 s. Reduce Motion: the turned wheel cross-fades in over 1.2 s.",
    "Variant of the wheel component (rotation 30 degrees clockwise).")
add("wheel/engraved-wheel-bitmap-1500px.png", "The engraved wheel, the app's own bitmap",
    "The 1500 px bitmap the app actually displays (scaled to 1663.2 pt), at full ink. For comparison with the vector.",
    "Sky / wheel", "Chamber.swift:65-90", figma_hint="Reference only.", scale=round(1500 / 1663.2, 4),
    caveats="Device RGB bitmap converted to sRGB. Use the SVG for design work.")

# ---------------------------------------------------------------- moon
for ph in phases["phases"]:
    add(ph["file"][4:], f"Moon phase {ph['index'] + 1:02d}/16: {ph['name']} (age {ph['age']})",
        f"The day moon's face at {ph['days']} days into the synodic month ({round(ph['illumination'] * 100)}% lit): pearl-ivory highlands where the sun is on it, the seas a lilac veil the sky shows through, the unlit part a translucent lilac ghost with the seas faintly in it. Real near-side seas and craters (Tycho's rays and more), lit as seen from the northern hemisphere, waxing on the right.",
        "Sky / moon / phases", "Moon.swift:51-177 (face), 184-465 (the near side)",
        "The moon on screen is tonight's; with the moon's door open it is the night a kept reading was asked.",
        "Strip of 16 frames; place at 32.25 pt (the disc is 32 pt, radius 16, plus a pixel of margin). Premultiplied alpha: put it over the sky, never over white.",
        "Raster only (per-pixel shading, 9 samples a pixel). 16 pt radius at 8x = 258 px.", pt=[32.25, 32.25])
add("moon/moon-tonight-2026-09-30.png", f"Tonight's moon (2026-09-30): {tonight['name']}",
    f"The face as it hangs on the night of the handoff, 2026-09-30 21:00 Chicago: age {tonight['age']}, {round(ILL * 100)}% lit, '{tonight['name'].upper()}'.",
    "Sky / moon", "Moon.swift:20, 51-177", "", "Component: 'moon face'. The label beneath reads WANING GIBBOUS.",
    "The app recomputes the phase whenever the room redraws; a shot on another night shows that night's moon.", pt=[32.25, 32.25])
add("moon/moon-phases.json", "Moon phases, as data",
    "Age, days, illumination and name for each of the 16 phase frames and for tonight, plus the naming thresholds (new moon < 0.03, waxing crescent < 0.22, first quarter < 0.28, waxing gibbous < 0.47, full < 0.53, waning gibbous < 0.72, last quarter < 0.78, waning crescent).",
    "Sky / moon", "Moon.swift:16-47")
add("moon/moon-composite-tonight@8x.png", "The moon as it hangs (aureole + face)",
    f"Tonight's moon as seen: the face over its white aureole, clear inside the limb (r 16) and fading from {round((0.22 + 0.14 * ILL) * 100)}% at the limb to 0 at r 48 (the aureole is 22% + 14% x illumination). On a 192 pt square centred on the moon.",
    "Sky / moon", "Chamber.swift:343-400",
    "Top right of the window at (0.86 W, max(70, 0.12 stage H) + 32) = (1083.6, 131.36) at 1260x860.",
    "Component 'moon'; centre it on the moon point.", pt=[192, 192])
add("moon/moon-composite-hover@8x.png", "The moon under the hand (hover)",
    "The moon with its hover halo: white 50% at the limb fading to 0 at r 46, eased in over 0.3 s. Only when the moon can open (there are kept readings, the room is at rest) or its door is open; the cursor becomes a pointing hand.",
    "Sky / moon", "Chamber.swift:360-367; Keeping.swift:979-1011", "Hover state of the moon component.",
    "Variant: hover.", pt=[192, 192])
add("moon/moon-composite-took-glow-peak@8x.png", "The moon taking a reading (5 s glow, peak)",
    "The moon brightening for one breath as it keeps a returned reading: a white light 70% to r 16 (0.17), 28% at r 40 (0.42), 0 at r 96, at its peak.",
    "Sky / moon", "Keeping.swift:1083-1169",
    "Opacity 0 -> 1 -> 1 -> 0 at 0, 1.4, 2.0, 5.0 s (keyTimes 0, 0.28, 0.40, 1), each span on the ramp S curve.",
    "Variant: took-glow, peak frame.", pt=[192, 192])
add("moon/moon-aureole-tonight@8x.png", "Moon aureole alone",
    f"The aureole alone: white radial, clear inside r 16, {round((0.22 + 0.14 * ILL) * 100)}% at r 16 falling to 0 at r 48 (96 pt box).",
    "Sky / moon / lights", "Chamber.swift:386-393", "Strength 22% + 14% x tonight's illumination.",
    "Rebuild natively: radial on a 96 pt circle, stops in gradients.json.")
add("moon/moon-hover-halo@8x.png", "Moon hover halo alone",
    "White 50% at r 16 to 0 at r 46, on a 96 pt circle.", "Sky / moon / lights", "Chamber.swift:360-367",
    "Hidden at rest, eased in over 0.3 s on hover.", "Layer above the aureole, below the face.")
add("moon/moon-took-glow-peak@4x.png", "Moon 5 s glow alone (peak)",
    "White 70% / 70% at 0.17 / 28% at 0.42 / 0 at 1 of r 96, on a 192 pt square.", "Sky / moon / lights",
    "Keeping.swift:1083-1113", "Peak frame of the 5 s breath.", "Layer under the halo.")
add("moon/moon-took-glow-curve.json", "Moon glow timing, as data",
    "The 5 s glow's keyframes and its strength sampled every 0.25 s.", "Sky / moon / lights", "Keeping.swift:1087-1095")
add("moon/moon-label-tonight@8x.png", "The moon's phase label",
    "Tonight's phase name under the moon, in small tracked capitals: 'WANING GIBBOUS'. Didot Regular 8 pt, tracking 3.6, text #26201C at 40%, centred 36 pt below the moon's centre (moon.y + 16 + 20).",
    "Sky / moon / type", "RootView.swift:737-742; Palette.swift:88-100",
    "Fades with the rest of the room while a question is held (opacity 1 - 0.9 x charge).",
    "Reference for native type: set it in Figma as text (Didot 8, letter spacing 3.6 pt, uppercase), don't place the PNG.",
    "Didot is macOS-only. SwiftUI tracking adds space after the last glyph too (the PNG includes 4 pt padding).")
add("moon/moon-label-kept-night-example@8x.png", "The moon's label with its door open (example)",
    "While the moon's door is open the label names the night the reading was asked, e.g. 'SEPTEMBER 18' (with the year, 'SEPTEMBER 18, 2025', in another year). Didot 8 pt, tracking 3.6, text at 55%.",
    "Sky / moon / type", "Keeping.swift:1013-1045", "Cross-fades 0.6 s between nights.",
    "Reference for native type.")
add("moon/moon-in-sky-crop@2x.png", "The moon in its corner of the sky",
    "A 240 x 180 pt crop of the whole sky around the moon (window x 964-1204, y 41-221) with the aureole, the lilac pooling around it, two glints and some dust.",
    "Sky / moon", "Chamber.swift:157-240", figma_hint="Reference crop.")
add("moon/moon-phases-strip-on-sky.png", "The 16 phases on the sky, strip",
    "All sixteen phase frames side by side on flat lilac #DDD8F2 (a reference for how the translucent ghost reads on the sky).",
    "Sky / moon / phases", "Moon.swift", figma_hint="Reference strip.", scale=4,
    caveats="Built by sheets.sh: 129 px cells with 6 px gaps, about 4x.")

# ---------------------------------------------------------------- near: primitives
for s in (3, 5, 7):
    add(f"near/glint-size-{s}-peak@16x.png", f"Fading glint, size {s}, at its height",
        f"A glint catching the light: four fine arms of goldInk #8F6C21 at 44% thinning from 1 pt at the heart to nothing and fading as (1 - s)^2, the upright {round(1.6 * s, 1)} pt each way, the level ones 62% as long, over a 5 pt goldLit #ECCE6E glow at 56%. Sizes run 3-7.",
        "Sky / near sky / glint", "Chamber.swift:503-517; SkyRenderer.swift:90-94, 154-160",
        "Brightness = tw^6 x 0.8 (x (0.8 + 0.2 charge)), tw = sin(t x rate + phase); arms 1.6 x size x (0.6 + 0.4 tw).",
        "Component 'glint' (32 pt square, centred).", "Drawn on the GPU (SkyRenderer.still at 16x).")
for s in (3, 5, 7):
    add(f"near/glint-vector-size-{s}.svg", f"Fading glint, size {s}, vector",
        "The glint rebuilt as SVG: an upright and a level rhombus (1 pt at the heart, tapering to the tips), each filled with a mirrored goldInk gradient following (1 - s)^2, plus the 5 pt goldLit glow.",
        "Sky / near sky / glint", "Chamber.swift:514-516; SkyRenderer.swift:154-160, 197-201",
        "At its height (tw 1, charge 0).", "Component 'glint' (vector). Scale the arm groups for the twinkle.",
        "Checked in Figma: 0.03/255 mean against the Metal render at 16x. At the very heart the two arms add where the shader takes the brighter; the 1 x 1 pt overlap is invisible.")
for i in range(9):
    th = 0.30 + 0.05 * i
    add(f"near/glint-twinkle-{i:02d}@16x.png", f"Glint twinkle frame {i + 1}/9",
        f"A size-5 glint at phase {th:.2f} pi of its sine: the arms grow and brighten to the middle frame and die away. The light is visible only while sin > 0.48, about a third of each 7-18 s period.",
        "Sky / near sky / glint", "Chamber.swift:509-516", "One twinkle, frames 1-9.", "Strip of 9 frames.")
add("near/glint-brightness-curve.json", "Glint brightness curve, as data",
    "tw, brightness (tw^6 x 0.8) and arm length sampled across half a period, with the formula.",
    "Sky / near sky / glint", "Chamber.swift:509-511")
add("near/glint-brightness-curve.svg", "Glint brightness curve, chart",
    "One full period of a glint's light: sharp, brief peaks (sin^6) and a long dark half. x = one period (7.4-18 s by glint), y = brightness 0-0.8.",
    "Sky / near sky / glint", "Chamber.swift:509-511", figma_hint="Motion-spec chart.")
for s in (3, 5, 7):
    add(f"near/star-held-size-{s}@16x.png", f"Held star (As Above: the Star), size {s}",
        f"A glint held as a star when the Star is drawn: a 14 pt white halo at 50%, arms of goldInk at 50%, 1.1 pt at the heart, {round(2.2 * s * 0.97, 1)} pt each way, a 4 pt goldLit core at 80% and a pearl heart (white 90%, r 0.9).",
        "Sky / As Above / star", "Chamber.swift:518-526",
        "Breathes: arms 2.2 x size x (0.94 + 0.06 x breath) on the 10 s breath.", "Component 'held star'.",
        "White on transparent: preview it over the sky.")
    add(f"near/star-held-vector-size-{s}.svg", f"Held star, size {s}, vector",
        "The held star as SVG: halo, tapered arms (mirrored gradients), gold core and pearl heart.",
        "Sky / As Above / star", "Chamber.swift:518-526", "Held 1, breath 0.5.", "Component 'held star' (vector).",
        "Checked in Figma: 0.03/255 mean against the Metal render.")
for i, h in enumerate((0.25, 0.5, 0.75)):
    add(f"near/star-coming-out-{i + 1}-held-{h}@16x.png", f"Star coming out, {int(h * 100)}%",
        f"A size-5 star {int(h * 100)}% of the way out (every part scaled by held = {h}).",
        "Sky / As Above / star", "Chamber.swift:518-526; Answers.swift:179-189",
        "Upright each star comes out over 28% of the 9 s answer, staggered by 6.5%.", "Strip with the held star.")
for s in ("0.6", "1.3", "2.0"):
    for c in (0, 1):
        add(f"near/mote-size-{s}-charge-{c}@16x.png", f"Mote of gold dust, size {s}, charge {c}",
            f"One mote: a gold #C9A82F core r {float(s) * (1 + 0.5 * c):.2f} over a goldLit halo 3.6x as wide at 22%. Alpha {min(1, 0.6 * (1 + 0.8 * c)):.2f} here " + ("(at rest)." if c == 0 else "(held: 1.5x larger, 1.8x brighter)."),
            "Sky / near sky / dust", "Chamber.swift:550-577",
            "Each of the 46 motes rises (0.010-0.036 screens/s), drifts sideways, flickers and fades in and out at the ends of its climb.",
            "Component 'mote' (two circles; see gradients.json near_sky_primitives.mote).")
for r in (9, 24, 39):
    add(f"near/bloom-r-{r}@8x.png", f"Lens bloom, r {r}",
        f"A soft disc of lens light, r {r} pt: white {round(0.55 * 0.55 * 0.875 * 100)}% at the centre, {round(0.35 * 0.55 * 0.875 * 100)}% at half, 0 at the edge, with a 0.8 pt gold rim at 0.92 r (5%). Radii run 9-39.",
        "Sky / near sky / blooms", "Chamber.swift:486-498",
        "Alpha 0.35-0.75 x (0.75 + 0.25 x breath); wanders 0.03 W / 0.02 H very slowly.", "Component 'bloom'.",
        "White on transparent: preview it over the sky.")

# ---------------------------------------------------------------- near: fields
add("near/field-blooms-1260x860@2x.png", "Near sky: the 13 blooms", "All thirteen lens blooms where they are at the still's moment, alone on transparent.",
    "Sky / near sky / fields", "Chamber.swift:122-134, 486-498", "One moment; they drift slowly.", "Overlay layer over the backdrop.")
add("near/field-glints-1260x860@2x.png", "Near sky: glints lit at the still's moment", "The glints as they are at the still's moment (8 of the 11 lit, 7 of them brightly), alone.",
    "Sky / near sky / fields", "Chamber.swift:136-153, 503-528", "Each glint lights for a moment every 7-18 s.", "Overlay layer.")
for c in (0, 1):
    add(f"near/field-motes-charge-{c}-1260x860@2x.png", f"Near sky: the 46 motes, charge {c}",
        "The gold dust alone. " + ("At rest, spread across the window, rising." if c == 0 else "Held to full charge: drawn in toward the deck and turned about it, larger and brighter."),
        "Sky / near sky / fields", "Chamber.swift:95-120, 550-577", "", "Overlay layer.")
add("near/near-sky-rest-1260x860@2x.png", "Near sky at rest (everything)", "The whole GPU layer at rest: blooms, glints, the hold ring around the deck (two faint gold circles) and the dust.",
    "Sky / near sky / fields", "Chamber.swift:443-484", "Room at rest.", "Overlay layer over the backdrop, under the vignette.")
add("near/near-sky-charge-1-1260x860@2x.png", "Near sky held to full charge", "The whole GPU layer at full charge: the arc closed, dust gathered to the deck.",
    "Sky / near sky / fields", "Chamber.swift:443-484", "The instant before the cut.", "Overlay layer.")
for c in ("0.5", "0.6", "0.7", "0.8", "0.9"):
    add(f"near/given-dust-charge-{c}-1260x860@2x.png", f"Given dust, charge {c}",
        f"A written question ('Should I leave the city before winter') giving its gold: each letter lets go of one mote, in the order it was written, which falls from its letter and turns in toward the deck. Charge {c}; only these motes are drawn.",
        "Sky / near sky / given dust", "Chamber.swift:579-611; Quill.swift:177-235",
        "Starts once the charge passes 0.44; the motes only move forward (let go, they stay; they fade where they are as their letters ink again).",
        "Sequence of 5 frames; overlay above the backdrop, under the question type.",
        "The question's letters (type) are not drawn; the line sits at y 278.6 window pt.")
add("near/near-sky-giving-charge-0.7-1260x860@2x.png", "Near sky while a written question is given (0.7)",
    "The whole near sky at charge 0.7 with a written question: the arc three-quarters round, the room's dust gathering, and the letters' motes streaming down into the deck.",
    "Sky / near sky / given dust", "Chamber.swift:443-484", "", "Overlay layer.")
add("near/given-dust.json", "Given dust, as data", "The letters' mote origins (window pt), the deck, and mote counts per frame.",
    "Sky / near sky / given dust", "Quill.swift:177-182")
for kind, strength, where, when in (
    ("landing", 1, "the middle slot of three (630, 305.24)", "a card lands in its place in the row"),
    ("cut", 1.5, "the deck (630, 662.7)", "the held question reaches full charge and the deck is cut")):
    for i, age in enumerate((0.0, 0.15, 0.35, 0.65, 1.0, 1.6)):
        add(f"near/flash-{kind}-{i + 1}-age-{age:.2f}s-1260x860.png",
            f"{kind.capitalize()} flash, frame {i + 1}/6 ({age:.2f} s)",
            f"When {when}: a white-to-gold bloom at {where} swells from r 70 and fades over 1.3 s (k^2), while a ring of light (7 pt goldLit + 1 pt goldInk) goes out across the sky, easing out (cubic) over 2.2 s. Strength {strength}. Frame at {age:.2f} s.",
            "Sky / near sky / flashes", "Chamber.swift:613-636; Game.swift:414, 479",
            "Bloom r = 70 + (1 - k) 240 s; ripple r = 30 + (1 - (1 - age/2.2)^3) 520 s; fade (1 - age/2.2)^2.2.",
            "Strip of 6 frames (alpha overlays for the whole window).",
            "Not drawn with Reduce Motion." + (" The cut's centre asks for 119% white and clamps at 100%, so it opens as a flat white disc." if kind == "cut" else ""))
    add(f"near/flash-{kind}-strip-over-sky.png", f"{kind.capitalize()} flash over the sky, strip",
        f"The six {kind} frames composited over the resting backdrop, side by side (0 to 1.6 s).",
        "Sky / near sky / flashes", "Chamber.swift:613-636", figma_hint="Reference strip.", scale=0.5,
        caveats="Built by sheets.sh: 630 px cells (0.5x) with 6 px gaps.")
for c in ("0.0", "0.25", "0.5", "0.75", "1.0"):
    add(f"near/ring-charge-{c}@4x.png", f"Hold ring, charge {c}",
        f"The ring the question is held in, around the deck: an outer hairline at 1.2 R and the ring at R (117.48 pt), both goldInk; "
        + ("at rest, no arc." if c == "0.0" else f"the charge arc filling clockwise from twelve o'clock ({int(float(c) * 100)}%): 14 pt and 6 pt goldLit glows under a 1.8 pt goldInk core, round-capped, with a glowing spark at its head."),
        "Sky / near sky / hold ring", "Chamber.swift:530-548",
        "Charge fills over 3.2 s while held and drains twice as fast when let go; the ring breathes (radius +2%, opacity +14%) on the 10 s breath. Here breath 0.5.",
        "Component 'hold ring', variants by charge (360 pt square centred on the deck).")
for b in (0, 1):
    add(f"near/ring-rest-breath-{b}@4x.png", f"Hold ring at rest, breath {b}",
        "The resting ring at the " + ("bottom" if b == 0 else "top") + " of its 10 s breath (six breaths a minute).",
        "Sky / near sky / hold ring", "Chamber.swift:530-535", "Breath 0 and 1.", "Variant 'breath'.")
for i, (t, c, sh) in enumerate(((0.4, 0.75, 1.0), (0.8, 0.5, 0.75), (1.2, 0.25, 0.375), (1.44, 0.1, 0.15))):
    add(f"near/ring-draining-{i + 1}-{t:.2f}s@4x.png", f"Hold ring draining after the cut, {t:.2f} s",
        f"After the cut the gathered light drains (charge {c}): the arc runs back counter-clockwise and the whole ring fades with it (shown = min(1, 1.5 x charge) = {sh}).",
        "Sky / near sky / hold ring", "Chamber.swift:449-452; Game.swift:258",
        "Charge falls at 2/3.2 per second after the cut (1.6 s to empty).", "Strip of 4 frames.")
for c in ("0", "0.25", "0.5", "0.75", "1"):
    add(f"near/ring-vector-charge-{c}.svg", f"Hold ring, charge {c}, vector",
        "The hold ring rebuilt from its stroke specs: outer and inner hairline circles; the charge arc as three round-capped strokes (14/6/1.8 pt) from twelve o'clock clockwise; the head's glow and spark.",
        "Sky / near sky / hold ring", "Chamber.swift:530-548",
        "Breath 0.5, shown 1. After the cut multiply every opacity by shown.", "Component 'hold ring' (vector), variants by charge.",
        "Checked in Figma: 0.01-0.04/255 mean against the Metal render at 4x.")
add("near/ring-geometry.json", "Hold ring geometry", "Deck centre and ring radius at both window sizes.",
    "Sky / near sky / hold ring", "Game.swift:885-891")

# ---------------------------------------------------------------- answers
lights = [
    ("moonlight", "The Moon: moonlight", f"The Moon upright: its lilac half-light over the whole room, lilac 90% at the moon, 50% at 0.42, 0 at 1.25 x span (1575 pt). Shown at its peak tonight ({round(ILL * 100)}%, the moon's illumination).", "Answers.swift:219-225"),
    ("halo", "The Moon: halo", f"The Moon upright: lilac 55% close to the limb (so the face keeps its seas), a ring of pale white light 50% just outside it (r 34.5), lilac 28% at r 73, 0 at r 130. Peak {round(ILL * 100)}%.", "Answers.swift:226-237"),
    ("clearing", "The Moon reversed: clearing", f"The Moon reversed: the lilac clears off the sky, a plain-sky blue #D8E2F5 at 78% / 36% / 0 over the lilac field's place (0.86, 0.14, r 0.44 span). Peak {round(ILL * 100)}%.", "Answers.swift:210-218"),
    ("morning", "The Sun: morning", "The Sun upright: first light risen into morning, dawn #FFE0B0 90% / 55% at 0.38 / 0 at 1.2 x span, from under the foot of the window. Peak 100%.", "Answers.swift:238-244"),
    ("rays", "The Sun: the rays reaching further", "The Sun, either way: the nine rays again, 1.4x as long and a little brighter, over the morning. Peak 80%.", "Answers.swift:250-292"),
    ("glare", "The Sun reversed: white glare", "The Sun reversed: the light comes up white and the colour drains out of the sky: a flat white wash at 42%.", "Answers.swift:245, 294"),
]
for n, t, d, src in lights:
    add(f"answers/as-above-{n}-1260x860.png", f"As Above: {t}", d, "Sky / As Above / lights", src,
        "Comes over 9 s on the ramp S curve once the card has written itself (1.2 s with Reduce Motion), stays while the card lies on the table, and is given back as its ink sinks on the return.",
        "Overlay between the rays (layer 6) and the wheel (layer 7); baked at its peak opacity.",
        "The Moon's three lights peak at tonight's illumination, so they differ night to night; gradients.json has the raw stops.")
add("answers/as-above-stars-held-1260x860@2x.png", "As Above: the Star's stars, all held",
    "The Star upright, fully come: all eleven glints held as stars where they stand, each with its white halo, gold arms, gold core and pearl heart.",
    "Sky / As Above / star", "Chamber.swift:503-528; Answers.swift:175-189",
    "Upright: they come out one by one across the 9 s answer and stay. Reversed: one at a time comes out and goes in again (6.5 s each).",
    "Overlay layer (near sky).")
for i, p in enumerate((0.2, 0.45, 0.7)):
    add(f"answers/as-above-stars-coming-{i + 1}-p-{p}-1260x860.png", f"As Above: stars coming out ({int(p * 100)}%)",
        f"The Star upright {int(p * 100)}% of the way through its 9 s answer: the first stars out, the next coming.",
        "Sky / As Above / star", "Answers.swift:179-184", "Frames of the coming.", "Strip of 3 frames + the held field.")
for tag, t, d in (
    ("moon", "The Moon upright", "moonlight and halo at tonight's peak"),
    ("moon-reversed", "The Moon reversed", "the lilac cleared"),
    ("sun", "The Sun upright", "morning and the longer rays"),
    ("sun-reversed", "The Sun reversed", "the white glare and the longer rays"),
    ("star", "The Star upright", "all eleven stars held"),
    ("star-reversed", "The Star reversed", "the third star at the height of its coming out (16.1 s in)"),
    ("wheel", "The Wheel upright", "the wheel turned 30 degrees"),
    ("wheel-reversed-mid-turn", "The Wheel reversed, mid-turn", "7 s into its 14 s loop: at the far end of its turn, about to come back"),
):
    add(f"answers/as-above-sky-{tag}-1260x860.png", f"As Above sky: {t}",
        f"The whole sky (backdrop, moon, near sky) answering {t.split(' ')[1]}: {d}. No cards or type; phase reading, so the hold ring is out.",
        "Sky / As Above / composites", "Chamber.swift:157-240; Answers.swift",
        "At the answer's end state (except where noted).", "Screen-frame background reference.")
add("answers/as-above-positions.json", "As Above: star positions and the Sun's rays",
    "The eleven stars (window pt at both sizes, size, arm length, when each comes out upright and its 6.5 s turn when reversed) and the Sun's nine longer rays (angle, half-width, length, centre opacity, triangle).",
    "Sky / As Above / specs", "Answers.swift:175-189, 250-292; Chamber.swift:136-153")

# ---------------------------------------------------------------- positions
add("positions/seeded-positions.json", "Seeded positions (blooms, glints, rays, motes)",
    "Every drifting thing is placed by a seeded generator, the same on every launch: 13 blooms, 11 glints, 9 rays, 46 motes as fractions of the full window with their radii, rates and phases; the same resolved to window points at 1260x860 and 940x660; the moon, wheel, dawn point and hold ring centres; where the motes stand at the stills' moment.",
    "Sky / specs", "Chamber.swift:95-153, 313-341; Ink.swift:10-24")
add("positions/seeded-positions-map.svg", "Seeded positions map (diagram)",
    "The 1260x860 window with the 32 pt title bar, the nine ray wedges from the dawn point, the wheel's rings, the thirteen blooms (circles at their radii), the eleven glints (crosses at their peak arm lengths), the box glints keep out of (the words' place), the 46 mote lanes along the foot and the motes where they stand at the stills' moment, the moon with its aureole, and the hold ring around the deck.",
    "Sky / specs", "Chamber.swift", figma_hint="Diagram on the specs page; each group is a named layer.",
    caveats="A diagram, not the look: its colours only tell the kinds apart.")

manifest = {
    "category": "sky",
    "tool": ("cd design/figma/render/sky && ./prepare.sh && ./mksky ../../assets/sky && python3 svg.py && ./sheets.sh "
             "&& python3 manifest.py  (see design/figma/render/sky/README.md; mksky takes name prefixes to render "
             "only some: backdrop, composite, wheel, moon, near, answers, positions)"),
    "notes": ("The sky, the moon and every light of Arcana, rendered offscreen from a scratch copy of the app's own "
              "sources (only file-private views opened up, a fixed clock and tonight's date put in the tool's hands, "
              "the key lookup switched off). Coordinates are WINDOW points, y down, for the default 1260x860 window "
              "with its 32 pt hidden title bar (the stage is 1260x828 below it; the sky runs under the title bar); "
              "940x660 is the minimum window. span = the window's longer side sizes every radial, the rays and the "
              "wheel. Stack: pearl, high sky, lilac, rose, dawn (86%), rays (80%), the As Above lights, the wheel "
              "(5.5%), the moon, the near sky, the vignette. Colours are sRGB hexes as rendered: pearl #F9F7F2, "
              "sky #CCDBF5, lilac #E0D7F7, rose #FDDDDC, dawn #FFE0B0, shade #4D381F, wheel ink #97782F, goldInk "
              "#8F6C21, gold #C9A82F, goldLit #ECCE6E. Stills of the moving parts are taken at one fixed moment "
              f"(reference time 812000506.125 s, breath 0.88); tonight's moon is 2026-09-30 21:00 Chicago "
              f"({tonight['name']}, {round(ILL * 100)}% lit). Vector SVGs were imported into Figma and exported "
              "back to check them against the Swift/Metal renders (all within 0.5/255 mean). PNGs are 8-bit sRGB "
              "with premultiplied-safe alpha; overlays have alpha; white lights are invisible over white, so put "
              "them over the sky. Radial gradients are circles: in Figma draw each on a square 2R layer centred on "
              "its point, or import the native SVGs, which keep the circles."),
    "items": items,
}
(SKY / "manifest.json").write_text(json.dumps(manifest, indent=1) + "\n")
print(len(items), "items")
listed = {i["file"] for i in items}
for p in sorted(SKY.rglob("*")):
    if p.is_file() and p.name != "manifest.json" and f"sky/{p.relative_to(SKY)}" not in listed:
        print("NOT LISTED:", p.relative_to(SKY))
