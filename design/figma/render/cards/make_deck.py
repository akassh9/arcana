#!/usr/bin/env python3
"""Builds assets/cards/deck.json from cardkit's measurements (check/deck-measured.json)
and the per-card art notes (art-notes.json, taken from the design inventory)."""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.normpath(os.path.join(HERE, '../../assets/cards'))
m = json.load(open(os.path.join(HERE, 'check/deck-measured.json')))
notes = json.load(open(os.path.join(HERE, 'art-notes.json')))

def r(v):
    return None if v is None else round(v, 2)

def box(b):
    if not b: return None
    return {'x': r(b['x']), 'y': r(b['y']), 'w': r(b['w']), 'h': r(b['h'])}

NOTE = {55: 'G3', 60: 'C4', 62: 'D4', 64: 'E4', 67: 'G4', 69: 'A4', 76: 'E5'}

cards = []
for c in m['cards']:
    cid = c['id']
    n = notes[cid]
    t = {}
    for o in ('upright', 'reversed'):
        L = c['layout'][o]
        ink = L['ink_bbox']
        e = {}
        if c['numeral']:
            f = L['numeral_frame']
            e['numeral'] = {
                'text': c['numeral'],
                'swiftui_frame': box(f),
                'ink_bbox': box(ink['numeral']),
                'figma': {'x': r(f['x'] + 0.33), 'y': r(f['y']), 'auto_width': True, 'line_height': 19,
                          'note': 'auto-width text node; Figma leaves the trailing letter-spacing out of the box, SwiftUI keeps it, so align left edges (+0.33)'},
            }
        else:
            e['numeral'] = None
        f = L['name_frame']
        e['name'] = {
            'text': '\n'.join(c['name_lines']),
            'swiftui_frame': box(f),
            'ink_bbox': box(ink['name']),
            'figma': {'x': 22, 'y': r(f['y']), 'w': 182, 'align': 'center', 'line_height': 21},
        }
        f = L['essence_frame']
        e['essence'] = {
            'text': c['essence'],
            'swiftui_frame': box(f),
            'ink_bbox': box(ink['essence']),
            'figma': {'x': 22, 'y': r(f['y']), 'w': 182, 'align': 'center', 'line_height': 16},
        }
        if o == 'reversed':
            d = ink['diamond']
            e['diamond'] = {
                'shape': '5 x 5 pt square rotated 45 deg (7.07 pt tip to tip), oxblood #8C2E25',
                'center': [r(d['x'] + d['w'] / 2), r(d['y'] + d['h'] / 2)],
                'ink_bbox': box(d),
            }
        e['stack_frame'] = box(L['stack_frame'])
        t[o] = e
    art = {
        'kind': c['art_kind'],
        'pen_seed': 'seedHash("%s") ^ 0x9E3779B9' % c['art_kind'],
        'what_it_shows': n['what_it_shows'],
        'gold': n['gold'],
        'gold_detail': n['gold_detail'],
        'oxblood': n['oxblood'],
        'anatomy': n['anatomy'],
        'source': n['source'],
        'marks': c['marks'], 'pressed_marks': c['pressed_marks'], 'leaf_marks': c['leaf_marks'],
        'stroke_widths_pt': c['stroke_widths'],
        'gold_shapes': [{'mark': g['mark'], 'art_bbox': box(g['art_bbox']), 'card_bbox': box(g['card_bbox']),
                         'outline': g['outline']} for g in c['gold']],
        'oxblood_marks': [{'mark': b['mark'], 'as': b['as'], 'art_bbox': box(b['art_bbox'])} for b in c['oxblood']],
        'paper_cuts': [{'mark': p['mark'], 'art_bbox': box(p['art_bbox'])} for p in c['paper_cuts']],
    }
    cards.append({
        'index': c['index'], 'id': cid, 'arcana': c['arcana'], 'suit': c['suit'], 'rank': c['rank'],
        'numeral': c['numeral'], 'name': c['name'], 'name_drawn': c['name_drawn'],
        'name_lines': c['name_lines'],
        'name_lines_check': 'pixel-identical to SwiftUI automatic wrap' if len(c['name_lines']) == 1 or c['name_lines_verified_by_pixels'] else 'unverified',
        'essence': c['essence'], 'upright': c['upright'], 'reversed': c['reversed'],
        'keys': c['keys'], 'keys_reversed': c['keys_reversed'],
        'art': art,
        'type': t,
        'files': {
            'face': 'cards/faces/%s.png' % cid,
            'face_reversed': 'cards/faces-reversed/%s-reversed.png' % cid,
            'blank': 'cards/blanks/%s-blank.png' % cid,
            'blank_reversed': 'cards/blanks-reversed/%s-blank-reversed.png' % cid,
            'art_svg': 'cards/art/%s.svg' % cid,
            'blank_art_svg': 'cards/blank-art/%s-blank.svg' % cid,
            'leaf_svg': 'cards/leaf/%s-leaf.svg' % cid,
        },
    })

widest_ess = max(c['layout']['upright']['essence_ideal_width'] for c in m['cards'])
widest_ess_id = max(m['cards'], key=lambda c: c['layout']['upright']['essence_ideal_width'])['id']
two_line = [c['id'] for c in m['cards'] if len(c['name_lines']) == 2]

deck = {
    'about': 'Every card of Arcana (Sources/Arcana/Deck.swift), in deck order: the 22 Majors, then wands, cups, swords, pentacles (Ace-Ten, Page, Knight, Queen, King). '
             'Coordinates are points in the 226 x 400 card (origin top-left). Art coordinates are in the 186 x 248 art box, which sits at (20,52) on the face (add 20, 52). '
             'Type positions were measured from SwiftUI itself (GeometryReader frames of CardFace\'s own modifiers, rendered at 3x) and the "figma" placements were checked by building text in Figma and comparing the ink with the Swift render (within 1/3 pt).',
    'face': {
        'size_pt': [226, 400], 'corners': 'square (clipped rectangle, radius 0)',
        'stock': '#F3EDE0 (Palette.paper)',
        'art_box': {'x': 20, 'y': 52, 'w': 186, 'h': 248, 'center': [113, 176],
                    'reversed': 'the art alone turns 180 deg about its centre (113,176); the type never turns',
                    'clipping': 'none: a few compositions run past the window rule (Magician rays, Wheel side diamonds, World corner diamonds)'},
        'numeral_band': 'y 11-52 (between the heavy border and the art window). Numeral centred at (114,33): SwiftUI frame centre, which includes a trailing 3.2 tracking, so the ink centres near x 112.4. Courts leave the band empty.',
        'name_band': 'y 300-389. Name + essence (+ reversed diamond) in a VStack, spacing 4, 182 pt wide, centred at (113,345). Reversed adds the diamond (5 pt + 4 padding + 4 spacing), which lifts name and essence by 6.5 pt.',
        'source': 'Sources/Arcana/CardImages.swift:45-122 (CardFace)',
    },
    'type_styles': {
        'numeral': {'font': 'Didot Bold', 'size_pt': 15, 'letter_spacing_pt': 3.2, 'color': '#15110E', 'line_height_pt': 19, 'case': 'as written (roman numerals, the Fool is the letter O)', 'source': 'CardImages.swift:73-78'},
        'name': {'font': 'Didot Bold', 'size_pt': 17, 'letter_spacing_pt': 1.4, 'color': '#15110E', 'case': 'UPPERCASE', 'align': 'center', 'column_pt': 182,
                 'line_height_pt': 21, 'max_lines': 2, 'minimum_scale': 0.7,
                 'note': 'SwiftUI wraps it; no manual breaks. %d of 78 names take two lines (see name_lines). No name is shrunk by the 0.7 minimum scale.' % len(two_line),
                 'source': 'CardImages.swift:80-88'},
        'essence': {'font': 'Didot Italic', 'size_pt': 13, 'size_in_code': 12.5, 'color': '#8C2E25', 'align': 'center', 'column_pt': 182, 'line_height_pt': 16, 'max_lines': 1, 'minimum_scale': 0.7,
                    'note': 'Code asks for 12.5 but Font.custom rounds to whole points, so it draws at 13. Widest essence %.1f pt (%s): none is shrunk.' % (widest_ess, widest_ess_id),
                    'source': 'CardImages.swift:89-94'},
        'reversed_diamond': {'shape': 'square 5 x 5 pt rotated 45 deg', 'color': '#8C2E25', 'gap_above_pt': 8, 'source': 'CardImages.swift:95-102'},
        'figma_placement': 'Text nodes in Figma land on the SwiftUI glyphs when: numeral = auto-width node at (swiftui_frame.x + 0.33, swiftui_frame.y); name and essence = fixed 182-wide, centre-aligned nodes at x 22 and y = swiftui_frame.y, with fixed line heights 21 and 16. Figma sets Didot a hair lighter than Core Text (no stem darkening).',
        'font_note': 'Didot (Linotype) is a macOS system font: /System/Library/Fonts/Supplemental/Didot.ttc (Regular, Italic, Bold). Figma on other systems will substitute it.',
    },
    'finish': {
        'vignette': {'type': 'radial gradient, circular, centred on the card (113,200)', 'stops': [
            {'radius_pt': 0, 'color': '#734D20', 'alpha': 0}, {'radius_pt': 110, 'color': '#734D20', 'alpha': 0}, {'radius_pt': 250, 'color': '#734D20', 'alpha': 0.16}],
            'blend': 'multiply', 'applies_to': 'faces and blanks (not the back)',
            'figma': 'a 500 x 500 ellipse centred at (113,200) (x -137, y -50) inside the clipped card, GRADIENT_RADIAL with stops 0 and 0.44 at candle 0% and 1.0 at candle 16%, layer blend Multiply. Checked: matches the Swift face to within 0.3 of 255.',
            'code': 'RadialGradient(colors: [.clear, Palette.candle.opacity(0.16)], center: .center, startRadius: 110, endRadius: 250).blendMode(.multiply) - CardImages.swift:108-111',
            'note': 'candle is Color(0.450, 0.300, 0.125); it renders #734D20 (0.300 x 255 is a rounding tie). The clear end fades in alpha only (no darkening toward black). Corners are 229.7 pt from centre, so they get about 13.6% candle; the side edges (113 pt) almost none.'},
        'grain': {'file': 'cards/shared/grain-tile.png', 'tile_pt': 96, 'pixels': 'opaque greys 200-254 (#C8C8C8-#FEFEFE), one per point, from Rng(9121)',
                  'blend': 'multiply', 'opacity': {'face': 0.5, 'blank': 0.5, 'back': 0.35},
                  'figma': 'a 226 x 400 rectangle over everything with an IMAGE fill, scaleMode TILE, scalingFactor 1, layer blend Multiply, opacity 50% (35% on the back). Figma samples the tile nearest-neighbour, so its grain is crisper than SwiftUI (which smooths each grain pixel); the mean tone matches.',
                  'source': 'Palette.swift:103-127; CardImages.swift:113-118'},
        'order': 'stock, frame, art, type, vignette, grain (top)',
    },
    'gold_leaf': {'stops': [{'offset': 0, 'color': '#F6E08F'}, {'offset': 0.42, 'color': '#C9A333'}, {'offset': 0.66, 'color': '#E7C761'}, {'offset': 1, 'color': '#94701F'}],
                  'direction': 'linear, from the top-left corner (minX,minY) to the bottom-right corner (maxX,maxY) of each shape\'s own tight bounding box (SwiftUI Path.boundingRect = CGPath.boundingBoxOfPath, control points excluded)',
                  'outline': 'gold shapes carry a 0.8 pt ink outline (the back\'s sun: goldDeep #8A6819)',
                  'source': 'Palette.swift:40-46; CardImages.swift:31-39'},
    'emboss': {'passes': [
        {'group': 'emboss-light', 'color': '#FFFFFF', 'alpha': '0.95 x s', 'offset_pt': [0.7, 0.8]},
        {'group': 'emboss-shade', 'color': '#4D381F', 'alpha': '0.24 x s', 'offset_pt': [-0.5, -0.6]},
        {'group': 'emboss-floor', 'color': '#4D381F', 'alpha': '0.08 x s', 'offset_pt': [0, 0]}],
        'strength_s': {'back': 1.0, 'blank': 0.85},
        'note': 'Each pass is the same marks at the same widths in one flat colour, drawn stroke by stroke (overlaps compound), so the SVGs carry the alpha on every path, not on the group. On a reversed blank the art turns 180 deg but the light still falls from the upper left.',
        'kept_marks': 'strokes of 1.2 pt and more; filled ink/oxblood shapes become 1.0 pt outline grooves; hatching, hairlines, ticks and fine rays sink without trace; the leaf (gold fills without outline, and paper cuts) stays',
        'source': 'CardImages.swift:178-193 (Pressed), 198-235 (CardBlank); CardArt.swift:539-575'},
    'cards': cards,
    'spreads': [{
        'id': s['id'], 'name': s['name'], 'sub': s['sub'],
        'positions': [{'index': i, 'name': p, 'note_midi': s['notes_midi'][i], 'note': NOTE.get(s['notes_midi'][i])} for i, p in enumerate(s['positions'])],
    } for s in m['spreads']],
    'spreads_note': 'Each position sounds its note when a card lands there (all from one pentatonic, so any spread is a consonant chord); a reversed card sounds an octave under, in a darker voice. The position names are shown as the slot labels on the table (Caps 9 pt, tracking 3.2). The sub line is shown under the spread name in the chooser. Source: Deck.swift:27-50.',
    'other_text': {
        'suits_in_deck_order': ['Wands', 'Cups', 'Swords', 'Pentacles'],
        'courts': ['Page', 'Knight', 'Queen', 'King'],
        'pip_numbers': ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'],
        'pip_numerals': ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'],
        'major_numerals': [c['numeral'] for c in m['cards'][:22]],
        'name_pattern': 'Minors are named "<Number> of <Suit>" / "<Court> of <Suit>"; ids are "<suit>-<ace|2..10|page|knight|queen|king>".',
        'keys_note': 'The three keys per orientation are not on the face; they appear on the altar and are sent to the thread (Weave.swift:180).',
        'lines_note': 'The upright and reversed lines are the verse the reading speaks; the essence is the oxblood italic on the face.',
        'deck_comments': ['The deck. One line per card, per orientation. Nothing longer.', 'The twenty-two first, then the four suits of fourteen.'],
        'source': 'Sources/Arcana/Deck.swift:152-434',
    },
}
json.dump(deck, open(os.path.join(ASSETS, 'deck.json'), 'w'), indent=1, ensure_ascii=False)
print('deck.json:', len(cards), 'cards;', len(two_line), 'two-line names; widest essence', widest_ess, widest_ess_id)
