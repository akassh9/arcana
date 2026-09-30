#!/usr/bin/env python3
"""Writes design/figma/assets/type-ink/manifest.json from what build.sh rendered.
Every file under assets/type-ink is listed; the words for each come from the
patterns below, the pixel sizes from the files themselves."""
import json, pathlib, re, struct

here = pathlib.Path(__file__).resolve().parent
assets = here.parents[1] / 'assets'
root = assets / 'type-ink'

def png_size(p):
    with open(p, 'rb') as f:
        head = f.read(24)
    return list(struct.unpack('>II', head[16:24]))

def svg_size(p):
    t = p.read_text()[:400]
    w = float(re.search(r'width="([\d.]+)"', t).group(1))
    h = float(re.search(r'height="([\d.]+)"', t).group(1))
    return [w, h]

scale_re = re.compile(r'@(\d)x\.png$')
type_scale = json.loads((root / 'type/type-scale.json').read_text())['styles']
by_png = {s['png']: s for s in type_scale}

R = 'Sources/Arcana/RootView.swift'
items = []

def add(rel, **kw):
    p = assets / rel
    it = {'file': rel}
    ext = p.suffix[1:]
    it['kind'] = ext
    if ext == 'png':
        px = png_size(p)
        sc = int(scale_re.search(rel).group(1))
        it['px'] = px
        it['scale'] = sc
        it['pt'] = [round(px[0] / sc, 2), round(px[1] / sc, 2)]
        it['vector'] = False
    elif ext == 'svg':
        it['pt'] = svg_size(p)
        it['vector'] = True
    else:
        it['vector'] = False
    it.update(kw)
    items.append(it)

files = sorted(str(p.relative_to(assets)) for p in root.rglob('*') if p.is_file() and p.name != 'manifest.json')
order = {}
def nxt(g):
    order[g] = order.get(g, 0) + 1
    return order[g]

for rel in files:
    name = pathlib.Path(rel).name
    sub = rel.split('/')[1]
    # --- type ---------------------------------------------------------------
    if sub == 'type' and rel in by_png:
        s = by_png[rel]
        glow = s.get('glow')
        spec = (f"{s['postscript']} {s['size_drawn']:g} pt"
                + (f" (code {s['size_in_code']:g})" if s['size_in_code'] != s['size_drawn'] else '')
                + f", tracking {s['tracking_pt']:g} ({s['tracking_percent']:g}%), line box {s['line_box_pt']:g}"
                + (f" + {s['line_spacing_extra_pt']:g} line spacing" if s['line_spacing_extra_pt'] else '')
                + f", {s['color_token']} {s['color_hex']} at {round(s['opacity'] * 100)}%"
                + (f", glow {glow['color_token']} {round(glow['opacity'] * 100)}% r{glow['radius_pt']:g}" if glow else ''))
        add(rel, title=f"Type · {s['style']}", group='Type scale', order=s['order'],
            description=f"'{s['sample']}' set as the app sets it: {spec}. {s['usage']}",
            source=s['source'], states=s.get('states', ''),
            figma_hint=f"Text-style reference: place a Figma text node with this style at ({s['text_frame_in_png_pt']['x']:g}, {s['text_frame_in_png_pt']['y']:g}) pt over the image to check it (text frame {s['text_frame_in_png_pt']['w']:g}x{s['text_frame_in_png_pt']['h']:g} pt; baseline {s['baseline_from_line_top_pt']:g} below the line top).",
            caveats=('Font.custom rounds the code size to a whole point; this is the drawn size. ' if s['size_in_code'] != s['size_drawn'] else '')
                    + ('Printed on the card, whose ground is paper #F3EDE0; shown on pearl here. ' if s['id'].startswith('card-') else '')
                    + ('SwiftUI adds tracking after the last glyph too; the leading pad re-centres the word. ' if s['leading_pad_pt'] else '')
                    + ('The field itself is an AppKit SecureField (rounded border, 250 wide); only its placeholder type is drawn, in the system placeholder colour as resolved at render time. ' if s['id'] == 'system-field' else '')
                    + ('Drawn with its 30x1 goldInk@45% rule 21 above the line centre, as the app composes it. ' if s['id'] == 'voice-epigraph' else ''))
        continue
    if rel == 'type-ink/type/type-scale.json':
        add(rel, title='Type scale · every style as numbers', group='Type scale', order=0,
            description='All 36 styles (the critic\'s 35, with the chosen spread name split out because it changes face): PostScript name, code and drawn size, tracking in pt/px and %, the SwiftUI line box, baseline and cap-top offsets measured from a rendered H, extra line spacing, colour token, hex and opacity, glow, case, alignment, column, the sample, and where the text frame sits in each PNG.',
            source='Sources/Arcana/Palette.swift:80-100 and each style\'s own source',
            figma_hint='Build the Figma text styles from this; check each against its PNG.', states='', caveats='Line boxes are SwiftUI\'s (they round to whole points); Figma\'s own auto line height for Didot differs, so set line height in px from line_box_pt.')
        continue
    # --- title ---------------------------------------------------------------
    if sub == 'title':
        g = 'Wordmark ARCANA'
        if name == 'wordmark@2x.png':
            add(rel, title='ARCANA at rest, on pearl', group=g, order=1,
                description='The wordmark as the opening room sets it: Didot Bold 62, tracking 20, text #26201C, a goldLit #ECCE6E glow at 55% r22, with its 10 pt optical leading pad. The Title frame (407x78 pt, pad included) sits at (60, 60) pt; the word\'s own frame (397x78) at (70, 60).',
                source=f'{R}:1029-1057', states='rest (no light)', figma_hint='component (hero); text node + drop shadow', caveats='')
        elif name == 'wordmark-alpha@2x.png':
            add(rel, title='ARCANA at rest, transparent', group=g, order=2,
                description='The same wordmark with no ground: the ink and its gold glow only, for laying over the sky.',
                source=f'{R}:1029-1057', states='rest', figma_hint='image fill over any ground', caveats='The glow is premultiplied into the alpha.')
        elif name == 'wordmark-in-room@2x.png':
            add(rel, title='ARCANA in the room', group=g, order=3,
                description='The wordmark where it lives: under its 46x1 goldInk@55% rule, over the dawn sky, above the invitation. Cropped from the opening room (stage 1260x828, x 330-930, y 112-280).',
                source=f'{R}:694-752', states='rest', figma_hint='reference crop beside the component', caveats='Near sky drawn still (shot mode).')
        elif name.startswith('light-') and 'of-8' in name:
            n = int(name.split('-')[1])
            add(rel, title=f'ARCANA light · frame {n} of 8', group='Title light sweep', order=n,
                description='The slow light passing across ARCANA: a band of gold #C9A82F at 95% masked by the glyphs, moving left to right across the visible pass (k 0.05-0.74, about 2.2 s of every 12 s). Frame times and the band\'s start/end points are in title-light.json.',
                source=f'{R}:1040-1053', states=f'frame {n} of 8, evenly spaced in time', figma_hint='strip of 8 frames (Smart Animate between them, or a gradient fill moved across)', caveats='Same framing as wordmark@2x.png.')
        elif name == 'light-strip@2x.png':
            add(rel, title='ARCANA light · the 8 frames together', group='Title light sweep', order=9,
                description='The eight light frames stacked top to bottom, for reading the pass at a glance.',
                source=f'{R}:1040-1053', states='8 frames', figma_hint='storyboard strip', caveats='')
        elif name == 'light-in-room@2x.png':
            add(rel, title='ARCANA light in the room, mid-pass', group='Title light sweep', order=10,
                description='The light at the middle of its pass (k 0.395) over the word in the room.',
                source=f'{R}:1040-1053', states='mid-pass', figma_hint='reference crop', caveats='')
        elif name == 'title-light.json':
            add(rel, title='ARCANA light · gradient and timing spec', group='Title light sweep', order=11,
                description='The sweep\'s gradient (stops, colour, opacity, and that SwiftUI blends its clear stops premultiplied), its geometry in unit and point space for each frame, the clock (k = (t mod 12)/3.2, runs 3.3 s of 12) and the measured visible pass.',
                source=f'{R}:1040-1083', states='', figma_hint='motion spec note', caveats='Critic-corrected timing: visible ≈ 0.16-2.37 s of each 12 s, not a 3.2 s crossing.')
        continue
    # --- quill ---------------------------------------------------------------
    if sub == 'quill':
        Q = 'Sources/Arcana/Quill.swift'
        if name == 'laying-winters@3x.png':
            add(rel, title='The pen laying a word, letter by letter', group='Quill · cooling', order=1,
                description="'winters' as it is typed: each letter a moment younger than the last (ages 0.9, 0.6, 0.4, 0.25, 0.1, 0 s; the final s not yet on the paper). The oldest has cooled to ink, the newest are lit gold from the nib. Pen italic: Didot-Italic 19 exact, ligatures off.",
                source=f'{R}:846-913; {Q}:246-257', states='typing', figma_hint='component with per-letter fills (colours in quill.json)', caveats='Same pose as Tools/shot 13c-quill.')
        elif name.startswith('cooling-winter-') and name != 'cooling-winter-strip@3x.png':
            a = name[len('cooling-winter-'):].split('s@')[0]
            add(rel, title=f'A pasted word cooling · {a} s', group='Quill · cooling', order=2 + [0, 0.05, 0.1, 0.15, 0.25, 0.4, 0.6, 0.9].index(float(a)),
                description=f"'winter' laid whole (a paste lands whole and cools as one), {a} s after it was laid: nib light goldLit over the first 0.15 s, gold cooling to text@62% over 0.08-0.9 s.",
                source=f'{Q}:216-257', states=f'age {a} s', figma_hint='one frame of an 8-frame strip', caveats='')
        elif name == 'cooling-winter-strip@3x.png':
            add(rel, title='A pasted word cooling · strip', group='Quill · cooling', order=10,
                description="The eight cooling frames side by side (0, 0.05, 0.1, 0.15, 0.25, 0.4, 0.6, 0.9 s).",
                source=f'{Q}:216-257', states='8 ages', figma_hint='strip of 8 frames', caveats='')
        elif name == 'full-width@3x.png':
            add(rel, title='The question at full width', group='Quill · the line', order=1,
                description="The longest line the pen lays, 'Should I leave the city before winter, or wait for the light to come back' (a paste cut back to its last whole word inside 560 pt), dry, text@62%. It replaces the invitation under ARCANA, centred.",
                source=f'{Q}:60-62, 285-298; {R}:803-841', states='dry', figma_hint='component; one line, no wrapping, max width 560', caveats='Measured width in quill.json.')
        elif name == 'spent-pen@3x.png':
            add(rel, title='The spent pen', group='Quill · the line', order=2,
                description='A key pressed when the line is full: the pen touches the paper just past the last stroke and lays nothing — a 2.4 pt goldInk dot at 45%, 0.5 pt past the line\'s end, 1.2 pt above the baseline.',
                source=f'{R}:895-912', states='the moment it is struck', figma_hint='component variant (dot on)', caveats='')
        elif name == 'spent-pen-fading@3x.png':
            add(rel, title='The spent pen, fading', group='Quill · the line', order=3,
                description='The same dot 0.35 s later, at half strength; it is gone after 0.7 s.',
                source=f'{R}:897', states='0.35 s after', figma_hint='component variant', caveats='')
        elif name == 'spent-pen-detail@3x.png':
            add(rel, title='The spent pen · close up', group='Quill · the line', order=4,
                description="The line's last words and the dot, cropped.", source=f'{R}:902-912', states='struck', figma_hint='detail crop', caveats='')
        elif name == 'composing@3x.png':
            add(rel, title='An input method composing', group='Quill · the line', order=5,
                description="'Should I go back to the caf' with a dead key's ´ still being composed, set in gold at 75% after the laid ink.",
                source=f'{R}:889-893', states='composing (marked text)', figma_hint='component variant', caveats='Synthetic pose: a real IME/dead-key composition cannot be driven offscreen.')
        elif name == 'ligatures@3x.png':
            add(rel, title='The pen never forms fi / fl', group='Quill · the line', order=6,
                description="'find the first flight' in the pen (top: ligatures off, so a colour change between letters never breaks an fi apart) and in the invitation's Font.italic(19) (bottom: fi and fl ligatures formed).",
                source=f'{Q}:139-152', states='', figma_hint='note beside the question style: turn common ligatures off', caveats='')
        elif name.startswith('held-'):
            c = name[len('held-'):].split('@')[0]
            add(rel, title=f'The question held · charge {c}', group='Quill · held', order=int(round(float(c) * 100)),
                description=f'The written question while it is held, at charge {c} (of 1, reached in 3.2 s): rest ink text@{round((0.62 + 0.36 * float(c)) * 100)}% gathering a goldLit glow at {round(90 * float(c))}% r14; from charge 0.45 each letter in turn thins away as its gold goes to the deck.',
                source=f'{R}:846-889; {Q}:219-231', states=f'charge {c}', figma_hint='frame of the held sequence', caveats='The line alone; see given-as-dust for the room around it.')
        elif name.startswith('given-as-dust-') and 'charge' in name:
            n = int(name.split('-')[3]); c = name.split('charge-')[1].split('@')[0]
            add(rel, title=f'The question given as dust · {n} of 7 (charge {c})', group='Quill · given as dust', order=n,
                description=f'The opening room while the question is held, charge {c} ({float(c) * 3.2:.2f} s into the hold): the room goes quiet (1 - 0.9 c), the ring\'s arc of light grows, and each letter\'s gold leaves as one mote of the sky\'s dust, falling from its letter and turning in to the deck, in the order it was written.',
                source='Sources/Arcana/Chamber.swift:583-615; ' + f'{R}:803-913', states=f'charge {c}', figma_hint='strip of 7 frames (prototype: after-delay transitions)', caveats='Cropped from the whole stage (x 290-970, y 105-817 of 1260x828); near sky drawn still.')
        elif name == 'given-as-dust-stage@2x.png':
            add(rel, title='The question given as dust · whole room', group='Quill · given as dust', order=8,
                description='The whole stage at charge 0.66, for context.', source='Sources/Arcana/Chamber.swift:583-615',
                states='charge 0.66', figma_hint='screen frame 1260x828', caveats='Stage only (no title bar or window chrome); near sky drawn still.')
        elif name == 'quill.json':
            add(rel, title='The pen · colours and timings', group='Quill · cooling', order=0,
                description="The cooling formula and Quill.tone's colour (hex + alpha) every 0.05 s from 0 to 0.9 s, the laying and held poses, the full line's width, the spent dot and composition rules.",
                source=f'{Q}:216-257', states='', figma_hint='spec note for the question line', caveats='')
        elif name == 'given-as-dust.json':
            add(rel, title='The dust · spec', group='Quill · given as dust', order=0,
                description='How each letter\'s mote is drawn and moves (size, colour, alpha and flight formulas), the line centre and the crop.',
                source='Sources/Arcana/Chamber.swift:583-615; Sources/Arcana/Quill.swift:219-236', states='', figma_hint='motion spec note', caveats='')
        continue
    # --- ink -------------------------------------------------------------------
    if sub == 'ink':
        C = 'Sources/Arcana/CardImages.swift'
        m = re.match(r'writing-(the-star|six-of-cups)-(\d)-of-9-ink-([\d.]+)@2x\.png', name)
        if m:
            card = 'The Star' if m.group(1) == 'the-star' else 'Six of Cups'
            add(rel, title=f'{card} writing itself · {m.group(2)} of 9 (ink {m.group(3)})', group=f'Card writing · {card}', order=int(m.group(2)),
                description=f'{card} as it is written after it is taken, ink {m.group(3)} of 1: the frame first, then the art stroke by stroke (each laid in lit gold and cooling to ink), then the numeral, name and essence fading in. Native card size 226x400.',
                source=f'{C}:45-125, 127-175; Sources/Arcana/Game.swift:477-487', states=f'ink {m.group(3)}', figma_hint='one frame of a 9-frame strip (component variants ink=0…1)', caveats='Times for each ink value in ink.json (2.1 s easeInOut).')
            continue
        m = re.match(r'writing-(the-star|six-of-cups)-strip@2x\.png', name)
        if m:
            card = 'The Star' if m.group(1) == 'the-star' else 'Six of Cups'
            add(rel, title=f'{card} writing itself · strip', group=f'Card writing · {card}', order=10,
                description=f'The nine writing frames of {card} side by side at the slot size of the default window (148x262 each).',
                source=f'{C}:45-175', states='ink 0 → 1', figma_hint='storyboard strip', caveats='')
            continue
        m = re.match(r'stroke-ramp-(line|leaf)(-detail)?@(\d)x\.png', name)
        if m:
            what = 'a line of the water' if m.group(1) == 'line' else 'the gold-leaf sun'
            add(rel, title=f"One stroke cooling · {what}{' · nib close up' if m.group(2) else ''}", group='Stroke cooling ramp', order=(1 if m.group(1) == 'line' else 4) + (1 if m.group(2) else 0),
                description=(f'A single mark of The Star ({what}) laid by its own progress 0 → 1 in 11 frames: laid to 1 - (1 - p)^2.2 of its length, drawn in gold fading as its ink comes up (c = smoothstep(0.25, 1, p)), with the goldLit nib (the last 6% of the laid length, 2.4x as wide, 0.9 (1 - p)) at its tip.'
                             + (' The leaf fill fades in at smoothstep(0.35, 1, p).' if m.group(1) == 'leaf' else '')) if not m.group(2)
                             else f'The nib at progress 0.3, 0.6 and 0.9, magnified (@6x).',
                source=f'{C}:127-175', states='progress 0…1' if not m.group(2) else 'progress 0.3 / 0.6 / 0.9',
                figma_hint='strip of 11 frames' if not m.group(2) else 'detail', caveats='On the card\'s paper #F3EDE0 (without grain or vignette).')
            continue
        m = re.match(r'stroke-ramp-(line|leaf)\.svg', name)
        if m:
            what = 'a line of the water' if m.group(1) == 'line' else 'the gold-leaf sun'
            add(rel, title=f'One stroke cooling · {what} · vector', group='Stroke cooling ramp', order=3 if m.group(1) == 'line' else 6,
                description=f'The same 11 frames as vectors, exact geometry: each frame a group ({m.group(1)}-progress-0.0 … 1.0) with paper, wet-gold, ink and nib paths (round caps and joins)' + (', and the gold-leaf fill with the Palette.leaf four-stop gradient across its own box.' if m.group(1) == 'leaf' else '.'),
                source=f'{C}:127-175; Sources/Arcana/Palette.swift:39-45', states='progress 0…1',
                figma_hint='import with createNodeFromSvg; each group is a frame of the ramp', caveats='Validated: imported into Figma and exported back, it matches the SwiftUI render.')
            continue
        m = re.match(r'sink-the-star-(\d)-of-6@2x\.png', name)
        if m:
            k = (int(m.group(1)) - 1) / 5
            add(rel, title=f'The Star given back · {m.group(1)} of 6', group='Sink', order=int(m.group(1)),
                description=f'The face sinking into its stock as the cards are returned, {round(k * 100)}% through the card\'s window (sink {k ** 1.8:.3f}): the printed face fades off the pressed blank beneath it — grooves where the heavy lines were, the leaf left where it was laid, the type gone.',
                source=f'{C}:198-237, 352-385; Sources/Arcana/Game.swift:298-319', states=f'sink {k ** 1.8:.3f}', figma_hint='one frame of a 6-frame strip', caveats='Native 226x400.')
            continue
        if name == 'sink-the-star-strip@2x.png':
            add(rel, title='The Star given back · strip', group='Sink', order=7,
                description='The six sink frames side by side at slot size (148x262).', source=f'{C}:352-385', states='face → blank', figma_hint='storyboard strip', caveats='')
            continue
        m = re.match(r'flip-(taken|returned)-(\d)-of-5@2x\.png', name)
        if m:
            add(rel, title=f"The flip, {'taken' if m.group(1) == 'taken' else 'returned'} · {m.group(2)} of 5", group='Flip', order=int(m.group(2)) + (0 if m.group(1) == 'taken' else 6),
                description=('A card turning face up as it is taken: back → blank face (its ink begins 0.3 s into the turn)' if m.group(1) == 'taken' else 'A returned card turning face down: pressed blank → back') + ', a 3D turn about the vertical axis (perspective 0.4, 0.5 s easeInOut), the face swapped at the edge. Slot size 148x262 with the placed card\'s shadow.',
                source=f'{C}:320-350; Sources/Arcana/Game.swift:470-472, 356', states='angle in ink.json', figma_hint='one frame of a 5-frame strip', caveats='Frame 3 is 0.24 s in (about 85°), just before the edge; exactly at the edge nothing shows. The slot\'s ±0.7° tilt is left out.')
            continue
        m = re.match(r'flip-(taken|returned)-strip@2x\.png', name)
        if m:
            add(rel, title=f"The flip, {m.group(1)} · strip", group='Flip', order=6 if m.group(1) == 'taken' else 12,
                description='The five flip frames side by side.', source=f'{C}:320-350', states='5 frames', figma_hint='storyboard strip', caveats='')
            continue
        if name == 'ink.json':
            add(rel, title='The ink · timings and values', group='Card writing · The Star', order=0,
                description='For every frame here: the ink value and its time after the take, the stroke ramp\'s per-frame opacities, the sink values and the flip angles, with the rules that make them.',
                source=f'{C}:45-385; Sources/Arcana/Game.swift:298-319, 457-490', states='', figma_hint='motion spec note', caveats='')
            continue
    # --- verse -----------------------------------------------------------------
    if sub == 'verse':
        m = re.match(r'recital-(\d)-([a-z0-9-]+?)(-verse)?@2x\.png', name)
        if m:
            n = int(m.group(1)); tag = m.group(2); crop = bool(m.group(3))
            words = {
                'cards-laid': 'the three cards laid, nothing yet spoken',
                'epigraph': 'the question read back above the spread (Didot Italic 16, text@62%, under a 30x1 goldInk rule)',
                'line-1-arriving': 'the first line half-way through its arrival (opacity 0.5, blur 2.5, 3.5 pt low)',
                'line-1': 'the first line spoken',
                'line-2': 'two lines spoken',
                'line-3': 'all three lines spoken',
                'rung': 'the spread has rung as one chord; HOLD · RETURN THE CARDS at the foot',
                'reading-a-line': 'the middle card hovered: its line lit with a goldLit glow, the others at 30%',
            }[tag]
            add(rel, title=f"The recital · {n} of 8 · {tag.replace('-', ' ')}" + (' (verse crop)' if crop else ''), group='Recital', order=n * 2 - (0 if crop else 1),
                description=f'A three-card reading being spoken back, one line per card (Didot 22, text@92%, gap 12): {words}.' + (' Cropped from the verse to the foot of the stage (x 230-1030).' if crop else ' The whole stage.'),
                source=f'{R}:973-1027, 1196-1244; Sources/Arcana/Game.swift:501-547', states=tag,
                figma_hint='screen frame 1260x828' if not crop else 'crop, for the verse block', caveats='Stage only (no title bar); near sky drawn still. Timing per frame in recital.json.')
            continue
        m = re.match(r'verse-(one|three|five)(-line|-lines)?@2x\.png', name)
        if m:
            n = {'one': 1, 'three': 3, 'five': 5}[m.group(1)]
            crop = bool(m.group(2))
            size = {1: '27', 3: '22', 5: '18.5 (draws 19), gap 8'}[n]
            add(rel, title=f"The verse · {m.group(1)} card{'s' if n > 1 else ''}" + (' (lines)' if crop else ''), group='Recital', order=20 + n * 2 + (1 if crop else 0),
                description=f'The verse as it lies once spoken for a {n}-card reading: Didot {size}, text@92%, centred.' + (' Just the lines.' if crop else ' The whole stage.'),
                source=f'{R}:1196-1244', states='spoken', figma_hint='crop' if crop else 'screen frame 1260x828', caveats='')
            continue
        m = re.match(r'epigraph-arriving-([\d.]+)@2x\.png', name)
        if m:
            p = float(m.group(1))
            add(rel, title=f'The epigraph arriving · {round(p * 100)}%', group='Epigraph', order=1 + int(p * 4),
                description=f'The question read back, {round(p * 100)}% through its 1.1 s easeOut arrival: opacity {p:g}, blur {5 * (1 - p):g}, {7 * (1 - p):g} pt low. The rule arrives with it.',
                source=f'{R}:973-1027', states=f'arrive {p:g}', figma_hint='strip of 5 frames', caveats='On pearl; the transition lerped by hand at these fractions exactly as SwiftUI interpolates it.')
            continue
        if name == 'epigraph-in-room@2x.png':
            add(rel, title='The epigraph in the room', group='Epigraph', order=6,
                description='The question read back above the spread, cropped from the stage.', source=f'{R}:968-1018', states='at rest', figma_hint='crop', caveats='')
            continue
        if name == 'recital.json':
            add(rel, title='The recital · cadence and layout', group='Recital', order=0,
                description='The recital\'s cadence (0.9 s, +1.8 s for a question, a line every 1.45 s), the arrival, the verse sizes and positions for 1, 3 and 5 cards, and the time of each frame.',
                source='Sources/Arcana/Game.swift:501-547', states='', figma_hint='motion spec note', caveats='')
            continue
    # --- altar -----------------------------------------------------------------
    if sub == 'altar':
        if name == 'altar.json':
            add(rel, title='The altar · column spec', group='Altar text column', order=0,
                description='The altar column\'s order, styles and spacing, and how its words rise in (item k over smoothstep(0.18 + 0.17k, 0.95 + 0.17k)).',
                source=f'{R}:1387-1586', states='', figma_hint='spec note', caveats='')
            continue
        m = re.match(r'altar-(.+?)(-column|-crop)?@2x\.png', name)
        tag, part = m.group(1), m.group(2)
        rising = tag.startswith('rising-')
        what = {'the-star': 'The Star, upright', 'the-star-reversed': 'The Star, reversed (· REVERSED in oxblood beside the numeral)',
                'court-reversed': 'the Queen of Wands, reversed (a court: no numeral, REVERSED alone; the name wraps)'}.get(tag, f"The Star, {tag[len('rising-'):]} after the altar opened: its words rising in, in order")
        base = 30 if rising else {'the-star': 0, 'the-star-reversed': 10, 'court-reversed': 20}[tag]
        idx = [0.25, 0.45, 0.65, 0.85, 1.05, 1.25, 1.5].index(float(tag[len('rising-'):-1])) * 3 if rising else 0
        add(rel, title=f"The altar · {tag.replace('-', ' ')}" + {None: ' (stage)', '-column': ' (column)', '-crop': ' (card and column)'}[part],
            group='Altar text column', order=base + idx + {None: 1, '-column': 2, '-crop': 3}[part],
            description=f'The altar with {what}.' + {None: ' The whole stage (veil, lit card, column).', '-column': ' Crop of the text column (x 590-1010, y 170-670).', '-crop': ' Crop of the card and column (x 230-1030, y 110-730).'}[part],
            source=f'{R}:1387-1586', states=tag, figma_hint='screen frame 1260x828' if part is None else 'crop', caveats='The card floats ±3 pt on the 10 s breath, so its height varies slightly between frames; no pointer tilt.')
        continue
    # --- thread ------------------------------------------------------------------
    if sub == 'thread':
        if name == 'thread.json':
            add(rel, title='The thread panel · states', group='Thread panel', order=0,
                description='What each state shows, and the styles and spacing of each.', source=f'{R}:1248-1385', states='', figma_hint='spec note', caveats='')
            continue
        m = re.match(r'thread-(.+?)(-panel)?@2x\.png', name)
        tag, panel = m.group(1), bool(m.group(2))
        st = json.loads((root / 'thread/thread.json').read_text())['states']
        what = next(s['what'] for s in st if s['state'] == tag)
        k = ['offered', 'settling', 'quiet', 'quiet-refused', 'found', 'found-asked'].index(tag)
        add(rel, title=f"The thread · {tag.replace('-', ' ')}" + (' (panel)' if panel else ''), group='Thread panel', order=k * 2 + (2 if panel else 1),
            description=what + (' Crop from the verse\'s top to the foot (x 250-1010).' if panel else ' The whole stage.'),
            source=f'{R}:1248-1385', states=tag, figma_hint='crop' if panel else 'screen frame 1260x828',
            caveats='The thread is offered only with a key in Settings; posed here without any key. The light on the thread while settling is wherever the clock put it.')
        continue
    raise SystemExit(f'manifest.py: no words for {rel}')

manifest = {
    'category': 'type-ink',
    'tool': 'design/figma/render/type-ink/build.sh [sections] (then python3 design/figma/render/type-ink/manifest.py); see its README.md',
    'notes': ('Type and the pen in motion, all rendered offscreen by the app\'s own SwiftUI views (a patched copy of Sources/Arcana, silent, with no key and no kept readings), '
              'ImageRenderer into 8-bit sRGB. Whole-stage frames are the default window\'s content, 1260x828 (1260x860 under its 32 pt title bar), with the near sky drawn still as the shot tool does; they carry no window chrome. '
              'Type is to be set natively in Figma: the type PNGs are references to check the text styles against, and type-scale.json gives the numbers (drawn sizes: Font.custom rounds to whole points). '
              'The only vectors are the stroke-cooling ramps (SVG, validated through Figma). The question line was not converted to SVG: its type should be live text with per-letter fills (quill.json), not outlines. '
              'Cards used: the Star and the Six of Cups (writing), the Star (ramp, sink, flip, altar), the Six of Cups · Hermit · Six of Swords (recital, none answered by the sky), the README reading Six of Cups · Star · Six of Swords (thread, altar). The question is always "Should I leave the city before winter".'),
    'items': items,
}
(root / 'manifest.json').write_text(json.dumps(manifest, indent=1, ensure_ascii=False) + '\n')
print(len(items), 'items')
