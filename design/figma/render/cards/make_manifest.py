#!/usr/bin/env python3
"""Writes assets/cards/manifest.json from deck.json and the files on disk."""
import json, os, struct

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '../../assets'))
deck = json.load(open(os.path.join(ROOT, 'cards/deck.json')))

def png_size(rel):
    with open(os.path.join(ROOT, rel), 'rb') as f:
        h = f.read(24)
    return list(struct.unpack('>II', h[16:24]))

def exists(rel):
    assert os.path.exists(os.path.join(ROOT, rel)), rel
    return rel

MAJOR_LINE = {'fool': 69, 'magician': 85, 'priestess': 93, 'empress': 112, 'emperor': 136, 'hierophant': 149,
              'lovers': 172, 'chariot': 183, 'strength': 199, 'hermit': 216, 'wheel': 231, 'justice': 246,
              'hanged': 262, 'death': 275, 'temperance': 294, 'devil': 308, 'tower': 323, 'star': 343,
              'moon': 362, 'sun': 382, 'judgement': 396, 'world': 415}
SUIT_LINE = {'cups': 237, 'wands': 504, 'swords': 652, 'pentacles': 808}

def art_source(c):
    if c['arcana'] == 'major':
        return 'Sources/Arcana/CardArt.swift:%d' % MAJOR_LINE[c['art']['kind']]
    if c['rank'] in ('page', 'knight', 'queen', 'king'):
        return 'Sources/Arcana/Suits.swift:1029 (court, %s of %s)' % (c['rank'], c['suit'])
    return 'Sources/Arcana/Suits.swift:%d (%s, %s)' % (SUIT_LINE[c['suit']], c['suit'], c['rank'])

def group_of(c):
    return 'Major Arcana' if c['arcana'] == 'major' else c['suit'].capitalize()

def gold_words(c):
    g = c['art']['gold'] or 'no gold'
    return g

items = []
order = 0
for c in deck['cards']:
    grp = group_of(c)
    nm = c['name']
    lab = ('%s (%s)' % (nm, c['numeral'])) if c['numeral'] else nm
    what = c['art']['what_it_shows']
    src = art_source(c)
    two = ' / '.join(c['name_lines'])
    base = c['index'] * 10
    face_desc = ('%s, upright and finished. Cream cotton stock (#F3EDE0), the double pen rule with oxblood corner brackets, the art in its window, '
                 '%sthe name %s in Didot Bold capitals and the essence "%s" in oxblood Didot italic, under a candle vignette and paper grain. '
                 'Seen whenever this card lies face up and upright: on the table once it has turned and written itself, raised on the altar, and when a kept reading is brought back up. Art: %s'
                 % (nm, ('the numeral %s at the top, ' % c['numeral']) if c['numeral'] else 'no numeral (courts leave the top band empty), ', two, c['essence'], what))
    rows = [
        ('png', c['files']['face'], '%s — face' % lab, face_desc, 'upright, finished (ink 1)',
         'component "Card/Face/%s"; one frame 226x400' % c['id'],
         'Raster @3x with grain and vignette baked in (the app caches faces at 2.5x). For an editable face, rebuild from the art SVG + shared/face-frame.svg + text per deck.json.',
         'Sources/Arcana/CardImages.swift:45 (CardFace); art %s' % src, False),
        ('png', c['files']['face_reversed'], '%s — face reversed' % lab,
         '%s lying reversed: only the art is turned 180 deg in its window; the numeral, name and essence stay upright and lift 6.5 pt, and a small oxblood diamond sits under the essence. '
         'Seen when the card is drawn reversed (on the table, the altar and kept readings).' % nm,
         'reversed, finished', 'component variant "Card/Face/%s" reversed=true' % c['id'],
         'Raster @3x. The reversed art is the same art SVG rotated 180 deg about (113,176); the leaf gradient turns with it.',
         'Sources/Arcana/CardImages.swift:70 (art rotation), 95-102 (diamond)', False),
        ('png', c['files']['blank'], '%s — returned blank' % lab,
         '%s once its ink has sunk into the stock: only the heavy lines stay, as blind grooves lit from the upper left, and the gold leaf stays where it was laid (%s); the type is gone. '
         'Seen at the end of a reading (a long hold returns the cards) and when a kept reading is laid out again from the moon, before a hold brings the ink back up.' % (nm, gold_words(c)),
         'upright, ink fully sunk (sink 1)', 'component "Card/Blank/%s"' % c['id'],
         'Raster @3x. Rebuild editable: shared/blank-frame.svg + blank-art SVG at (20,52) + vignette + grain.',
         'Sources/Arcana/CardImages.swift:198 (CardBlank)', False),
        ('png', c['files']['blank_reversed'], '%s — returned blank, reversed' % lab,
         'The returned blank of %s drawn reversed: the grooves and leaf turned 180 deg with the art, the light still falling from the upper left.' % nm,
         'reversed, ink fully sunk', 'component variant "Card/Blank/%s" reversed=true' % c['id'],
         'Raster @3x. Not the upright blank rotated: the emboss offsets are flipped so the light keeps its side.',
         'Sources/Arcana/CardImages.swift:210-217 (flip, rotation)', False),
        ('svg', c['files']['art_svg'], '%s — art (vector)' % lab,
         'The composition alone in its 186 x 248 art box, transparent, every mark as a hand-bowed pen path: groups by role in draw order (ink, oxblood, gold-leaf, paper; a role that has to come back above other marks gets -2, -3). '
         'Gold is laid as leaf: the four-stop gradient across each shape from its bounding box\'s top-left to bottom-right, with a 0.8 pt ink outline. %s Gold: %s' % (what, gold_words(c)),
         'upright art; reversed = rotate 180 deg about the box centre', 'vector component "Card/Art/%s"; place at (20,52) on the face with clip content OFF' % c['id'],
         'Imported through figma.createNodeFromSvg and checked against the Swift render (antialiasing-level differences only). The root frame clips by default: turn clipping off, since some art runs past its window. '
         '"paper" shapes are opaque #F3EDE0 cuts (e.g. a crescent\'s bite), not holes: keep them above what they cut. Strokes are centred, round caps and joins.',
         src, True),
        ('svg', c['files']['blank_art_svg'], '%s — blank art (vector)' % lab,
         'What this art leaves in the stock when returned: the pressed marks (strokes of 1.2 pt and more; filled shapes as 1.0 pt outlines) drawn three times as the blind emboss '
         '(emboss-light white 80.75% at +0.7,+0.8; emboss-shade #4D381F 20.4% at -0.5,-0.6; emboss-floor #4D381F 6.8%), then kept-leaf: the gold leaf without its outline and any paper cut.',
         'upright blank art', 'vector; place at (20,52) over the blank stock',
         'Opacity sits on each path (the app strokes each mark separately, so overlaps compound) - do not move it to the group. Offsets are baked into the coordinates.',
         'Sources/Arcana/CardImages.swift:178-193, 210-214; CardArt.swift:544-591', True),
        ('svg', c['files']['leaf_svg'], '%s — gold leaf only (vector)' % lab,
         'Only the leaf of this card, as kept on a returned blank: %s' % gold_words(c),
         'upright', 'vector; for gold-only studies or a leaf layer', 'Same geometry as the gold-leaf and paper groups of the art SVG, without the ink outline. Paper cuts are opaque cream.',
         'Sources/Arcana/CardArt.swift:560-575, 586-591', True),
    ]
    for k, (kind, f, title, desc, states, hint, cav, source, vec) in enumerate(rows):
        exists(f)
        it = {'file': f, 'title': title, 'description': desc, 'kind': kind}
        if kind == 'png':
            it['px'] = png_size(f); it['scale'] = 3; it['pt'] = [226, 400]
        else:
            it['pt'] = [186, 248]; it['scale'] = 1
        it.update({'vector': vec, 'group': grp, 'order': base + k, 'source': source, 'states': states, 'figma_hint': hint, 'caveats': cav, 'card_id': c['id']})
        items.append(it)

S = 'Card shared'
shared = [
    ('png', 'cards/shared/card-back.png', 'Card back', 'The reverse of every card: a celestial rose blind-embossed into cream stock (#F2EBDD), seen only as light and shade from the upper left, a gold hairline border and one small sun of gold leaf at the centre; mirrored so it never shows which way up a card lies. Grain 35%, a 1.2 pt shaded stock edge, no vignette. Seen on every face-down card: the ribbon, the deal, the flip\'s first half.',
     [226, 400], 3, False, 'Sources/Arcana/CardImages.swift:239-260 (CardBackStatic); CardArt.swift:468-491', 'the only state', 'component "Card/Back"', 'Raster @3x with grain baked.'),
    ('svg', 'cards/shared/card-back.svg', 'Card back — layered vector', 'The back exploded into layers: stock (#F2EBDD); blind-emboss with its three passes (emboss-light white 95% offset +0.7,+0.8; emboss-shade #4D381F 24% offset -0.5,-0.6; emboss-floor #4D381F 8%); gold-hairline (flat gold #C9A82F, 0.9 pt); gold-leaf-sun (leaf disc r 11 with a goldDeep #8A6819 0.8 pt outline); stock-edge (#4D381F 13%, 1.2 pt inside the edge). Add grain-tile at 35% Multiply on top to finish.',
     [226, 400], 1, True, 'Sources/Arcana/CardImages.swift:239-260; CardArt.swift:468-491', 'the only state', 'vector component "Card/Back"; add the grain as a top layer',
     'Checked in Figma against the Swift back without grain (antialiasing-level differences). Pass opacity is per path, as in the app.'),
    ('svg', 'cards/shared/face-frame.svg', 'Face frame', 'Everything printed on a face that is not art, type, grain or vignette: the outer hairline (5..221 x 5..395, 1.1 pt), the heavy border (11..215 x 11..389, 2.4 pt), the art window (20..206 x 52..300, 1.3 pt; its top edge is the numeral band\'s rule), the band rule across the full inner width at y 300 (2.2 pt), and four oxblood corner brackets inside the window corners (arms 4..13 pt in, 1.1 pt). Every line bows a hair, from the pen.',
     [226, 400], 1, True, 'Sources/Arcana/CardArt.swift:439-453 (frameMarks)', 'shared by all 78 faces', 'vector component "Card/Frame" inside the face',
     'No stock rectangle: put a #F3EDE0 rectangle under it. Groups: ink, oxblood.'),
    ('svg', 'cards/shared/blank-frame.svg', 'Blank frame (pressed)', 'The face frame as it survives on a returned blank: only the heavy border, the art window and the band rule, as blind grooves (three emboss passes at strength 0.85).',
     [226, 400], 1, True, 'Sources/Arcana/CardImages.swift:208; CardArt.swift:577', 'shared by all blanks', 'vector, under the blank art', 'Opacity per path.'),
    ('png', 'cards/shared/face-template.png', 'Empty face', 'A face with no art and no type: stock, frame, vignette and grain. The ground every face is built on.',
     [226, 400], 3, False, 'Sources/Arcana/CardImages.swift:45-122', 'no art, no type', 'reference / background for rebuilt faces', 'Raster @3x.'),
    ('png', 'cards/shared/face-stock.png', 'Face stock finish', 'Plain face stock with the candle vignette and the grain, nothing printed on it.',
     [226, 400], 3, False, 'Sources/Arcana/CardImages.swift:48, 108-118', 'finish only', 'reference for matching the vignette and grain', 'Raster @3x.'),
    ('png', 'cards/shared/blank-stock.png', 'Blank stock', 'The stock of a returned blank: the pressed frame, vignette and grain, with no art.',
     [226, 400], 3, False, 'Sources/Arcana/CardImages.swift:198-235', 'no art', 'background for rebuilt blanks', 'Raster @3x.'),
    ('png', 'cards/shared/face-vignette.png', 'Face vignette layer', 'The candle vignette alone, transparent: a circular radial gradient centred on the card, clear to 110 pt, then candle #734D20 rising to 16% at 250 pt. Lay it over the face with Multiply. Native Figma rebuild: a 500 x 500 ellipse at (-137,-50) with GRADIENT_RADIAL stops 0 and 0.44 at #734D20 0% and 1.0 at #734D20 16%, blend Multiply (checked: within 0.3/255 of the app).',
     [226, 400], 3, False, 'Sources/Arcana/CardImages.swift:108-111, 220-223', 'faces and blanks only; the back has none', 'layer with blend Multiply over a face', 'The clear end fades in alpha only; do not fade toward black.'),
    ('png', 'cards/shared/grain-tile.png', 'Paper grain tile', 'The paper grain: a 96 x 96 tile of opaque greys 200-254, one per point, seeded (Rng 9121) so it is the same every launch. Tiled over faces and blanks at 50% Multiply and over the back at 35%.',
     [96, 96], 1, False, 'Sources/Arcana/Palette.swift:103-127', 'one tile', 'image fill, TILE, scaling 1, on a rectangle over the card; blend Multiply, opacity 50% (35% on the back)',
     'Identical to the app\'s Grain.image (0 differing pixels). Figma samples it nearest-neighbour, so the grain looks crisper than the app\'s smoothed one; the mean tone matches.'),
]
for k, (kind, f, title, desc, pt, scale, vec, source, states, hint, cav) in enumerate(shared):
    exists(f)
    it = {'file': f, 'title': title, 'description': desc, 'kind': kind}
    if kind == 'png':
        it['px'] = png_size(f)
    it.update({'scale': scale, 'pt': pt, 'vector': vec, 'group': S, 'order': 1000 + k, 'source': source, 'states': states, 'figma_hint': hint, 'caveats': cav})
    items.append(it)

items.append({'file': exists('cards/deck.json'), 'title': 'Deck data and type layout', 'kind': 'json', 'vector': False, 'group': 'Deck data', 'order': 2000,
    'description': 'Every word the deck holds, in deck order, with the exact layout of the type on each face: id, index, arcana, suit, rank, numeral, name (and its line break as SwiftUI sets it in the 182 pt column), essence, upright and reversed lines, keys, the art (what it shows, where the gold and oxblood are, with bounding boxes), and for upright and reversed the SwiftUI frame, ink box and a Figma placement for numeral, name, essence and the reversed diamond. Also the three spreads with their positions and notes, the type styles, the finish (vignette, grain), the leaf gradient and the emboss passes.',
    'source': 'Sources/Arcana/Deck.swift; Sources/Arcana/CardImages.swift:45-122', 'states': 'upright and reversed layouts', 'figma_hint': 'data for text layers and component properties',
    'caveats': 'Name breaks were checked pixel for pixel against SwiftUI (four match within 1/3 pt: the frame rounds). The figma placements were checked in Figma on four cards (upright and reversed): ink within 1/3 pt.'})

manifest = {
    'category': 'cards',
    'tool': 'design/figma/render/cards/build.sh  (then: python3 design/figma/render/cards/make_deck.py && python3 design/figma/render/cards/make_manifest.py). See design/figma/render/cards/README.md.',
    'notes': ('All 78 cards (22 Majors, then wands, cups, swords, pentacles; ids as in Deck.swift) rendered by the app\'s own code (Sources/Arcana compiled with a tool main.swift), offscreen with ImageRenderer. '
              'PNGs are 8-bit sRGB @3x (226 x 400 pt -> 678 x 1200 px). SVGs are in points, with groups named by role and leaf gradients per shape (userSpaceOnUse, bbox top-left -> bottom-right). '
              'Validated in Figma: art SVGs (Priestess, Sun, Moon, Magician, Seven of Cups, Queen of Swords), leaf SVGs, blank-art SVGs, face frame, blank frame and the back were imported with createNodeFromSvg and exported: they match the Swift renders to antialiasing. '
              'A complete test card (The Hierophant: paper rect + grain tile + radial vignette + frame SVG + art SVG + Didot text placed from deck.json) was built natively in Figma and compared with the Swift face: overall mean difference 3.9/255, tone within 0.3/255, type within 1/3 pt. '
              'Differences to know: (1) Figma draws Didot a hair lighter than Core Text; (2) Figma tiles the grain nearest-neighbour, so its grain is crisper (same mean tone); (3) createNodeFromSvg frames clip by default - turn clipping off for art, which is not clipped in the app; '
              '(4) Figma auto-width text leaves out the trailing letter-spacing that SwiftUI keeps, so the numeral must be placed by its left edge (deck.json gives figma x); (5) the essence is 12.5 in code but draws at 13 (use 13); '
              '(6) images made with figma.createImage must be loaded (await image.getBytesAsync()) before an export shows them. '
              'Didot is a macOS system font; the Figma file needs it installed. Square corners throughout.'),
    'items': items,
}
json.dump(manifest, open(os.path.join(ROOT, 'cards/manifest.json'), 'w'), indent=1, ensure_ascii=False)
print(len(items), 'items')
