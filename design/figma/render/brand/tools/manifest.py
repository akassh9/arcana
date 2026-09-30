#!/usr/bin/env python3
"""Writes design/figma/assets/brand/manifest.json from what make.sh produced."""
import json, os, re, subprocess, sys, glob

repo, out = sys.argv[1], sys.argv[2]
ASSETS = os.path.dirname(os.path.dirname(os.path.abspath(out)))
INV = '/private/tmp/claude-501/-Users-akashkhanikor-tarot/7548ca2d-8134-4fad-865a-b7311d777a44/scratchpad/inventory/assets-history.json'
inv_what = {}
if os.path.exists(INV):
    for e in json.load(open(INV))['export_assets']:
        inv_what[e['name']] = e['what']

def dims(path):
    r = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', path], capture_output=True, text=True).stdout
    w = re.search(r'pixelWidth: (\d+)', r); h = re.search(r'pixelHeight: (\d+)', r)
    return [int(w.group(1)), int(h.group(1))] if w and h else None

def vdims(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
                        '-of', 'csv=p=0', path], capture_output=True, text=True).stdout.strip()
    return [int(x) for x in r.split(',')] if r else None

items = []
def add(file, title, description, group, source, kind=None, scale=None, pt=None, vector=False,
        states='', figma_hint='', caveats=''):
    full = os.path.join(ASSETS, file)
    assert os.path.exists(full), full
    kind = kind or os.path.splitext(file)[1][1:].lower().replace('jpeg', 'jpg').replace('md', 'txt')
    it = {'file': file, 'title': title, 'description': description, 'kind': kind}
    if kind in ('png', 'jpg'):
        px = dims(full); it['px'] = px
        it['scale'] = scale if scale is not None else 1
        it['pt'] = pt if pt is not None else [round(px[0] / it['scale'], 2), round(px[1] / it['scale'], 2)]
    elif kind == 'mp4':
        px = vdims(full); it['px'] = px; it['scale'] = 1; it['pt'] = px
    elif kind == 'svg':
        s = open(full).read(2000)
        w = float(re.search(r'width="([\d.]+)"', s).group(1)); h = float(re.search(r'height="([\d.]+)"', s).group(1))
        it['pt'] = [w, h]; it['scale'] = 1
    it.update({'vector': vector, 'group': group, 'order': len(items) + 1, 'source': source,
               'states': states, 'figma_hint': figma_hint, 'caveats': caveats,
               'bytes': os.path.getsize(full)})
    items.append(it)

B = 'brand/'
# ---------------------------------------------------------------- the mark
G = 'Brand mark (logo)'
LOGO_SRC = 'Assets/arcana-logo.png; README.md:156; build.sh:40-43'
FRINGE = ('The anti-aliased edge carries a red matte: 9,903 partly clear pixels (bbox 94,27..1152,1226) whose stored colour '
          'un-premultiplies to about #E9110F. Their alpha is tiny (75% have alpha 1/255, all are at most 16/255), so composited '
          'correctly the fringe adds about 1/255 of red and is invisible on light and dark grounds alike; it appears as soon as '
          'alpha is dropped, thresholded, boosted, or the edge is bled/blurred in straight alpha. It wants a clean re-matte (or a vector redraw) before any new use.')
add(B + 'logo/arcana-logo.png', 'Arcana mark — source PNG, as shipped',
    'The compass/eclipse mark exactly as it is in the repo: a cream paper-grain crescent eclipsed by a large near-black disc (#171617), a thin gold rim, a broken gold orbit ring, four tapered gold compass spikes (N/S long with oxblood #3C0D0B jewels in gold bezels, E/W shorter with gold ball ends) and two small gold planets with three-dot trails at about 10 and 4 o\'clock, on transparency (73% of pixels). It is the only raster brand asset and the source of the macOS app icon; the app never shows it inside the room.',
    G, LOGO_SRC, states='on transparency (as shipped)', vector=False,
    figma_hint='image fill in a 1254x1254 frame; the master of the mark',
    caveats='Untagged RGB (no embedded profile; read as sRGB). Dark and dense: it predates the light redesign (Palette.void\'s comment: from the night the mark was drawn in). ' + FRINGE + ' Origin of the artwork (2026-09-21, before the repo) is not recorded.')
add(B + 'logo/arcana-logo-on-pearl.png', 'Arcana mark on pearl #F9F7F2',
    'The mark composited on Palette.pearl, the app\'s ground colour: how it reads on the app\'s own light surfaces (and in the light Finder/Dock). The eclipse disc is the darkest thing in the whole brand.',
    G, LOGO_SRC + '; Sources/Arcana/Palette.swift:13', states='light ground', figma_hint='image, beside the dark version',
    caveats='The fringe is invisible here.')
add(B + 'logo/arcana-logo-on-dark.png', 'Arcana mark on a dark ground #1E1E1E',
    'The mark composited on a dark Dock/desktop grey. The black eclipse disc (#171617) all but merges with a dark ground, leaving the crescent and gold floating; there is no tile to hold it.',
    G, LOGO_SRC, states='dark ground', figma_hint='image, beside the pearl version',
    caveats='#1E1E1E is a stand-in for a dark Dock, not measured from macOS. Composited correctly the red matte is not visible (see the zoom).')
add(B + 'logo/arcana-logo-alpha-ignored.png', 'Arcana mark with its alpha ignored (the red matte shown)',
    'Diagnostic: the PNG\'s stored straight RGB with alpha dropped, on the black the transparent pixels hold. The pure-red matte shows as a halo round the orbit ring, the spikes and the planets. This is what a tool that drops or thresholds alpha, or bleeds edges, will surface.',
    G, LOGO_SRC, states='diagnostic', figma_hint='image, in a "why it needs a re-matte" section', caveats=FRINGE)
add(B + 'logo/arcana-logo-fringe-reveal.png', 'Arcana mark — fringe reveal',
    'Diagnostic: every partly transparent pixel drawn at full strength in its own colour, opaque pixels dimmed to 35% over grey, empty pixels grey. The red ring of matte round every gold edge is plain.',
    G, LOGO_SRC, states='diagnostic', figma_hint='image, next to the alpha-ignored one', caveats=FRINGE)
add(B + 'logo/arcana-logo-fringe-zoom.png', 'Arcana mark — fringe zoom (4 panels, 4x nearest)',
    'The upper-left planet and its trail (logo px 340,190 200x150) at 4x with no smoothing, four ways: 1 on pearl, 2 on #1E1E1E as composited, 3 alpha ignored (the #E9110F matte), 4 reveal. Shows why the mark needs a re-matte even though it looks clean when composited.',
    G, LOGO_SRC, scale=4, pt=None, states='diagnostic', figma_hint='image; the captions are baked in (Helvetica)',
    caveats='Captions are raster text from the render tool, not app type. ' + FRINGE)
# ---------------------------------------------------------------- the icon
G = 'App icon'
ICON_SRC = 'build.sh:40-43 (sips -z 512 512 Assets/arcana-logo.png, then sips -s format icns) -> build/Arcana.app/Contents/Resources/AppIcon.icns'
HONEST = ('The shipped AppIcon.icns holds one representation only, icon_512x512.png (iconutil lists nothing else): no 16/32/128/256 sizes, no 512@2x (1024), no hand-tuned small sizes, and no macOS squircle tile, shadow or light/dark variant. The mark floats on transparency. macOS resamples the one 512 image to every size it draws.')
add(B + 'icon/app-icon-512-shipped.png', 'App icon — the one 512 px image in AppIcon.icns',
    'Extracted from the built app\'s icns with iconutil: the logo scaled to 512 x 512 by sips. This is the Dock, Finder, Launchpad and About-panel icon of Arcana 1.3.',
    G, ICON_SRC, pt=[512, 512], scale=1, states='as shipped (v1.3)', figma_hint='image in a 512x512 frame (1 pt = 1 px at 1x)',
    caveats=HONEST + ' On macOS 26 (this Mac runs Darwin 25.6), an icon that is not a full squircle may be shown inside a system tile; not verified, since no screen capture was allowed.')
for s in [16, 32, 64, 128, 256, 512, 1024]:
    add(B + 'icon/app-icon-%d.png' % s, 'App icon at %d px' % s,
        'The shipped 512 px image resampled (high quality) to %d x %d px, as macOS does when it draws the icon at that pixel size (%s).' % (
            s, s, {16: 'list views, menus at 1x', 32: 'Finder list at 2x, menus at 2x', 64: 'Finder icon view at 1x / small Dock at 2x',
                   128: 'Dock at 2x (64 pt), Finder at 1x', 256: 'Finder at 2x / Get Info', 512: 'as stored', 1024: 'Launchpad/Finder 512 pt at 2x: upsampled from 512, so soft — there is no 1024 rep'}[s]),
        G, ICON_SRC, pt=[s, s], scale=1, states='%d px' % s, figma_hint='strip of 7 sizes, left to right, at 1:1',
        caveats=HONEST if s in (16, 1024) else 'Resampled from the single 512 image; macOS\'s own resampler may differ slightly.')
add(B + 'icon/app-icon-sizes-light-dark.png', 'App icon at 16-1024 px on light and dark',
    'Contact strip: the shipped icon at 16, 32, 64, 128, 256, 512 and 1024 px, each drawn at 1:1 and centred in a 1024 px row, on a light #ECECEC row and a dark #1E1E1E row. At small sizes on dark the black eclipse disc vanishes into the ground and the mark reads as a thin crescent; the fine orbit, jewels and trails break up below 64 px.',
    G, ICON_SRC, scale=1, states='light and dark grounds', figma_hint='image; one row per ground, sizes left to right',
    caveats=HONEST + ' Grounds are stand-ins, not measured macOS colours.')
add(B + 'icon/fallback-icon.png', 'Fallback code-drawn icon (IconView), 1144 px',
    'The mark build.sh draws only if the logo PNG cannot be read: a sun of 16 cream rays (#F3EDE0, width 7) through a wobbly cream ring (r 196, width 8.5), an oxblood diamond (#8C2E25, r 226, width 5.5), and the Magician\'s gold-leaf eye (112 x 50) with an ink pupil (#15110E), drawn by the same seeded pen as the cards (Pen seed 31), on a near-black rounded tile #030409 (1024 body, continuous corner radius 180, in a 1144 canvas) with a faint warm radial glow (#382B14 -> clear, r 40-560) and the paper grain overlaid at 10%.',
    G, 'Tools/icon/main.swift:5-22; Sources/Arcana/CardArt.swift:455-463; Sources/Arcana/Palette.swift:38', scale=1, pt=[1144, 1144],
    states='static', figma_hint='image, beside its SVG',
    caveats='Never shipped (the logo PNG is always found). A different mark from the logo, and dark, against the light direction. The tile is 89.5% of the canvas (Apple\'s macOS grid is 824/1024 = 80.5%). Rendered fresh from today\'s sources (ImageRenderer, 1x); build/icon.png from 2026-09-21 is older.')
add(B + 'icon/fallback-icon.svg', 'Fallback code-drawn icon — vector',
    'The same icon as SVG, 1144 x 1144 pt: group "tile" (the #030409 continuous-corner squircle path and the radial glow, clipped to it), group "marks" with "paper" (16 rays + the ring, stroked, round caps and joins), "oxblood" (the diamond), "gold-leaf" (the eye, filled with Palette.leaf #F6E08F 0 / #C9A333 .42 / #E7C761 .66 / #94701F 1 across its own bounding box, top-left to bottom-right, userSpaceOnUse) and "ink" (the pupil). Every path is the pen\'s own geometry (CardArt.iconMarks()).',
    G, 'Tools/icon/main.swift:5-22; Sources/Arcana/CardArt.swift:455-463; Sources/Arcana/CardImages.swift:9-39', vector=True,
    states='static', figma_hint='createNodeFromSvg; keep the group names as layers; component',
    caveats='Validated: imported into Figma and exported back, it matches the Swift render (gold bands in the same direction). The 10% overlay grain is a raster tile and is left out; the glow is a radial gradient (stops at 40/560 and 1). Figma names the tile\'s clip group "Clip path group".')
# ---------------------------------------------------------------- the wordmark
G = 'Wordmark (ARCANA)'
WM_SRC = 'Sources/Arcana/RootView.swift:1029-1056 (private struct Title); Sources/Arcana/Palette.swift:82'
WM_SPEC = ('Didot-Bold 62 pt, tracking 20 (after every letter, the last included), ink #26201C (Palette.text), a gold glow behind (shadow Palette.goldLit #ECCE6E at 55%, radius 22), and 10 pt of leading padding as optical correction for the tracked last letter. '
           'Every 12 s a slanted band of gold (clear -> Palette.gold #C9A82F at 95% -> clear; start (x -0.5+2k, y .1), end (x -0.1+2k, y .9) in the word\'s unit box, k = (t mod 12)/3.2) passes across the letters, masked to them: it touches the word for k of about .05-.75 (~2.2 s) and rests the other ~9.8 s; paused with Reduce Motion or when the opening screen isn\'t showing.')
wm_txt = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'scratch', 'wordmark.txt')).read() if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'scratch', 'wordmark.txt')) else ''
add(B + 'wordmark/wordmark-arcana.svg', 'ARCANA wordmark — glyph outlines',
    'The title as the room sets it, outlined: six Didot-Bold glyph paths (layers A-1 R-2 C-3 A-4 N-5 A-6 in group "arcana-wordmark"), fill #26201C. The frame is SwiftUI\'s own text box (396.75 x 78 pt: line height round(ascent+descent) = 78, baseline 60 from the top, trailing tracking kept) widened 2 pt on the left because the first A\'s serif overhangs its advance by 1.55 pt. ' + WM_SPEC,
    G, WM_SRC, vector=True, states='at rest (no glow, no light)', figma_hint='createNodeFromSvg; component "Wordmark". Rebuild the glow as a Drop shadow #ECCE6E 55%, x 0 y 0 (match its blur against title-rest@2x.png). For live type use Didot Bold 62, letter spacing 20 px, instead.',
    caveats='Checked against SwiftUI: the outlines drawn over SwiftUI\'s own Text at 4x differ by a mean of 0.042/255 in alpha, with no pixel off by more than 64 (%s). Validated in Figma. Didot ships with macOS only; outlines keep the wordmark exact where Didot is missing (Figma on Windows/web) — check the font licence before using the outlines in marketing.' % (wm_txt.strip().split('\n')[0] if wm_txt else 'see scratch/wordmark.txt'))
ST_SRC = 'Tools/shot/main.swift:85 (pose 1-invocation), rendered by render/brand/tools/brand/main.swift "stage"; ' + WM_SRC
add(B + 'wordmark/opening-screen-rest@2x.png', 'The opening screen, fresh @2x (title at rest)',
    'The room as it opens (shot pose 1-invocation), rendered 2026-09-30 from the current sources at 2x: the key glyph top left, the bowl top right, the day moon with tonight\'s phase label, the short gold rule, ARCANA, "Hold the question in your mind.", the three spreads (Three Fates chosen, in its corner brackets), the deck in its ring, PRESS AND HOLD, over the first-light sky with the engraved wheel and dawn rays. The source of the wordmark crops.',
    G, ST_SRC, scale=2, states='invocation, title light resting', figma_hint='screen frame 1260 x 860 pt (image fill at 2x)',
    caveats='ImageRenderer has no safe area or title bar; the Metal near sky is drawn as a still (stillSky), so the dust motes\' positions are one random moment; the moon\'s phase is the render night\'s (WANING GIBBOUS). A placeholder key in the environment made the renderer think a key exists (no Keychain, no .env.local, no network).')
add(B + 'wordmark/title-block-rest@2x.png', 'Title block in context — rule, ARCANA, invitation',
    'Crop of the fresh opening screen (px 700,200 1120x380 @2x = 560 x 190 pt): the short gold rule, ARCANA with its faint gold glow, and the invitation "Hold the question in your mind." in Didot italic, over the sky and the wheel\'s fine lines.',
    G, ST_SRC, scale=2, states='at rest', figma_hint='image; reference for spacing between rule, title and invitation', caveats='Crop of a raster render.')
add(B + 'wordmark/title-rest@2x.png', 'ARCANA in the room, at rest',
    'Tight crop (px 800,280 920x210 @2x = 460 x 105 pt) of the title at rest, with its glow on the sky. ' + WM_SPEC,
    G, ST_SRC, scale=2, states='rest (about 9.8 s of every 12)', figma_hint='strip of 4 frames: rest, k .25, k .45, k .65',
    caveats='A sky mote may sit between letters (a random still of the near sky).')
for k, t, what in [(25, '0.80', 'the band on the first A, R and C'), (45, '1.44', 'the band on the second A and the N'), (65, '2.08', 'the band leaving on the last A')]:
    add(B + 'wordmark/title-light-k%d@2x.png' % k, 'ARCANA — the passing light at k = .%d' % k,
        'The same crop rendered when (t mod 12) = %s s, so the title\'s light is at k = .%d: %s, gold #C9A82F at 95%% at its centre, fading to clear either side, slanted (lower right leads).' % (t, k, what),
        G, ST_SRC, scale=2, states='light passing, k = .%d' % k, figma_hint='strip of 4 frames: rest, k .25, k .45, k .65',
        caveats='The renderer waited for that moment of the 12 s cycle; measured within 3 ms. For motion: 60 fps, the TimelineView clock runs 3.3 s of every 12.')
# ---------------------------------------------------------------- the film
G = 'Launch film — Everyone\'s question, drawn'
FILM_SRC = 'film/arcana.html (TIMELINE :921-948, scenes :750-857, places PLACES :418-) + film/core.js; film/out/arcana-frames/'
FRAME_DESC = {
 'window': 'a city at first light, one tall window lit; a gold light at the frame\'s centre rings like a struck bowl (riso, four inks on pearl)',
 'pier': 'the end of a pier, a lamp, someone facing the sea', 'crossroads': 'a signpost at a fork in the road',
 'door': 'a doorway lit gold, someone on the step with a case', 'bench': 'two people on a bench under a lamp (the montage begins, faster and faster)',
 'clock': 'a station clock over a platform, someone waiting', 'boat': 'someone in a rowing boat with a lamp', 'hill': 'someone sitting on a hilltop',
 'bridge': 'someone on a footbridge with a lamp', 'lighthouse': 'a lighthouse, its beam, someone on the rock', 'field': 'someone in a field holding a light up',
 'ring': 'an open ring box, the ring lit gold',
 'gather-wheel-of-houses': 'the gather: every place in a round thumbnail in the celestial wheel\'s twelve houses, the engraved wheel turning behind (paper)',
 'gather-into-the-light': 'the wheel shrinking into the light as gold dust spirals in',
 'flash': 'the cut: one near-white frame', 'riffle-the-sun': 'the riffle: the Majors flick past on cotton stock, one per frame (here the Sun), each with its gold pinned to the centre',
 'riffle-strength-slowing': 'the riffle slowing on Strength (held 3 frames)', 'the-back': 'the card back: blind-embossed rose, gold hairline, one gold sun',
 'the-turn': 'the turn: the back narrowed to its edge', 'star-writing': 'the Star writing itself: frame and gold first',
 'star-cooling': 'the Star\'s strokes cooling from gold to ink', 'star-written': 'the Star written: numeral XVII, name, essence "Water Under Starlight"',
 'answer-window-stars': 'the window again, stars (fading glints) coming out in the day sky', 'answer-pier-stars': 'the pier with stars out',
 'answer-boat-stars': 'the boat with stars out', 'answer-hill-stars': 'the hill with stars out', 'answer-lighthouse-stars': 'the lighthouse with stars out (fullest)',
 'signoff-laying': 'the sign-off: ARCANA laid letter by letter in gold that cools to ink, on the riso first-light sky',
 'signoff-light-passing': 'the title\'s light passing across ARCANA once', 'signoff-end': 'the last frame: ARCANA in ink on the riso sky (the sound fades out)',
}
for f in sorted(glob.glob(os.path.join(ASSETS, 'brand/film/frames/*.png'))):
    b = os.path.basename(f)
    m = re.match(r'film-(\d{4})-(\d\d)-(.*)\.png', b)
    n, idx, name = int(m.group(1)), m.group(2), m.group(3)
    add(B + 'film/frames/' + b, 'Film frame %s — %s' % (m.group(1), name.replace('-', ' ')),
        'Frame %d of 256 (t = %.2f s, drawn at 12 fps): %s.' % (n, n / 12, FRAME_DESC.get(name, name)),
        G, FILM_SRC + '%04d.png' % n, scale=1, states='t = %.2f s' % (n / 12),
        figma_hint='strip of 30 frames in film order (1080 x 1080 each), or a 6-column grid',
        caveats='Untagged canvas PNG re-saved as tagged sRGB without conversion. Frames 1080 x 1080 px; the film has no point size. Judge the riso halftone at 100%: any downscale makes moiré.')
add(B + 'film/film-contact-picks.png', 'Launch film — contact sheet of the 30 picks',
    'The 30 chosen frames in film order, 6 to a row, each captioned with its frame number and name, on pearl.', G, FILM_SRC, scale=1,
    figma_hint='image; overview board', caveats='Captions are raster Helvetica from the render tool.')
add(B + 'film/film-contact-every-6th-frame.jpg', 'Launch film — the film\'s own contact sheet (every 6th frame)',
    'The film\'s make.sh contact sheet: 43 tiles, one every 0.5 s, the whole film at a glance (places, gather, riffle, Star, answers, sign-off).', G,
    'film/out/arcana-contact.jpg (film/make.sh)', scale=1, figma_hint='image', caveats='JPEG as made by the film tool.')
add(B + 'film/film-palette.json', 'Launch film — palette, inks, plates, halftone, format',
    'FIRST_LIGHT (the riso places: paper #f6f1e7, ink #2a2230, fills, accents) and CARD_STOCK (the deck: paper #f3ede0, ink #15110e, gold #c9a82f / #ecce6e / #8a6819, oxblood #8c2e25) as the film defines them; the four riso inks in printing order with screen angles and misregistration (cornflower #6f97e0 14.9°, lavender #9f8be0 75.1°, rose #ef9690 45.3°, apricot #f4b454 0°); the halftone (5.4 px cell, dot r = cell x .62 x sqrt(coverage), coverage cap .72, multiply at 95%); stock grain; the film type; format and timeline.',
    G, 'film/arcana.html:29-51, 284-295; film/core.js:209-222', kind='json', figma_hint='colour styles "Film/Riso/*" and "Film/Card stock/*"; swatch board with plate angles',
    caveats='Read from the film\'s code, not retyped. The film\'s comment gives rose #fdddcc; the app\'s Palette.rose is #FDDDDC. The film\'s paper #f6f1e7 is warmer than the app\'s pearl #F9F7F2.')
add(B + 'film/arcana-launch-film.mp4', 'Launch film — the mp4 (21.3 s, 1080², 24 fps, with score)',
    'The launch film, version 2 (committed as code in 14b7fc6): twelve people somewhere quiet at first light each hold a gold light; the lights gather into the wheel\'s twelve houses; the deck is cut; the Majors riffle; the back turns; the Star writes itself; the places return with stars out in the day sky; ARCANA is laid and the title\'s light passes. The score is the app\'s bowls, chimes, drone and swell in Web Audio (-16 LUFS).',
    G, 'film/out/arcana-final.mp4 (film/make.sh; gitignored, not committed)', kind='mp4', figma_hint='video fill if Figma accepts it; otherwise link out',
    caveats='H.264 yuv420p (no colour tags) + AAC 48 kHz stereo, 17.4 MB. Not in the repo: regenerate with cd film && npm install && ./make.sh (the score differs by about -86 dB between runs). The file actually posted is ~/Downloads/arcana-launch-2.mp4 per the project notes. The user rejected a real-app take for the launch film as "a product demo"; cut 1 (app code) is not kept.')
# ---------------------------------------------------------------- the demo
G = 'Demo video'
DEMO_SRC = 'docs/demo.mp4 (commit c7e12f4; public at https://akassh9.github.io/arcana/demo.mp4)'
DEMO_DESC = {
 'room-title-light': 'the room at rest as it opens, the title\'s light passing across ARCANA', 'spreads': 'the three spreads being chosen between (One Card / Three Fates / The Long Road)',
 'question-writing': '"Should I leave the city before winter" being written under ARCANA, the newest letters still wet gold', 'question-written': 'the question written in ink, replacing the invitation',
 'hold': 'the hold: a gold arc running round the deck ring, the room quieting', 'giving': 'the question\'s letters giving their gold as dust into the deck; the title greys',
 'cut': 'the hold complete: the full gold ring, the moment of the cut', 'ribbon-hand': 'the ribbon of 78 backs in a shallow arc, the hand sweeping it, a few cards lifted in a glow',
 'cards-drawn': 'the Six of Cups drawn into the first slot, the next card coming from the ribbon', 'three-cards-writing': 'the Six of Cups and the Star written, the Six of Swords arriving; the ribbon still below',
 'star-answers-in-the-sky': 'the three cards on their gold thread under the question; the Star\'s stars coming out in the day sky; the verse beginning',
 'verse': 'the verse spoken line by line: "The old street is smaller now. / Less than you can, every day. / Row for the calmer water."',
 'hover': 'a card risen under the pointer with its gold halo, its verse line in full ink', 'altar': 'the Star on the altar: the card large at left with its halo; at right WHAT IS / THE STAR / XVII / Water Under Starlight (gold italic) / a short rule / "Less than you can, every day." / HOPE · REPAIR · CLEAR SKY',
 'return': 'the return: ink sinking into the stock, last card first, pressed lines and gold kept', 'cards-go-home': 'the blank cards turning over and going home to the deck',
 'moons-door': 'the moon\'s door open: the kept reading as the return left it (blanks keeping their gold), the question above, the date under the moon',
 'remembering': 'remembering: a hold bringing the ink back, first card first', 'remembered': 'the kept reading remembered, the cards in ink again',
 'close': 'back in the room, as it opened', 'fade-to-pearl': 'the last moment: the fade toward pearl',
}
for f in sorted(glob.glob(os.path.join(ASSETS, 'brand/demo/stills/*.png'))):
    b = os.path.basename(f)
    m = re.match(r'demo-([\d.]+)s-(\d\d)-(.*)\.png', b)
    t, name = float(m.group(1)), m.group(3)
    add(B + 'demo/stills/' + b, 'Demo still %.1f s — %s' % (t, name.replace('-', ' ')),
        'docs/demo.mp4 at %.2f s: %s.' % (t, DEMO_DESC.get(name, name)), G, DEMO_SRC, scale=1.3333, pt=[1440, 900],
        states='t = %.2f s' % t, figma_hint='strip of 21 stills in order (screen frames 1440 x 900 pt, image at 4/3 px per pt)',
        caveats='A frame of H.264 video (BT.709, converted with ffmpeg, tagged sRGB): compression softens fine lines and shifts pale colours by a few levels (the end pearl reads #F9F5EF, not #F9F7F2). The window is the real app\'s content area captured at 1920 x 1200; the point size is inferred: ARCANA\'s ink measures 503 px across here against 378 pt in the app, so about 4/3 px per pt, i.e. a 1440 x 900 pt window (likely a 2x capture scaled to 1920 x 1200). No thread is offered in the take.')
add(B + 'demo/demo-contact.png', 'Demo — contact sheet of the 21 stills', 'The 21 stills in order, 4 to a row, captioned with time and name.', G, DEMO_SRC, scale=1,
    figma_hint='image; overview board', caveats='Captions are raster Helvetica from the render tool.')
add(B + 'demo/demo.mp4', 'Demo video — one real 57.5 s take (1920 x 1200, 60 fps, with sound)',
    'One continuous take of the real app for people who won\'t install it: the room at rest as the title light passes, the spreads, the question written, the hold and the cut, the hand on the ribbon, the three cards writing themselves as the Star answers in the sky, the verse, the altar, the return, the moon\'s door, remembering, back to the room and a fade to pearl.',
    G, DEMO_SRC, kind='mp4', figma_hint='video fill if Figma accepts it (19.3 MB); otherwise link to the public URL',
    caveats='Public on GitHub Pages and linked in the launch post: never move or rename docs/demo.mp4. The keys page was cut from the end.')
# ---------------------------------------------------------------- README
G = 'README'
add(B + 'readme/docs-arcana.png', 'README picture — docs/arcana.png',
    'The repo\'s public face (README.md:6): a Three Fates reading — Six of Cups, the Star (answered: stars out in the day sky), Six of Swords — under the written question "Should I leave the city before winter", the verse "The old street is smaller now. / Less than you can, every day. / Row for the calmer water.", FIND THE THREAD with its gold diamond, the key glyph top left, the bowl and the day moon top right.',
    G, 'Tools/shot/main.swift:257 (pose 00-readme) -> docs/arcana.png; README.md:6', scale=1, states='posed as the verse is spoken, before the chord (so no HOLD · RETURN prompt)',
    figma_hint='screen frame 1260 x 860 pt', caveats='1x only (re-render with ARCANA_SHOT_SCALE=2 for 2520 x 1720). Rendered 2026-09-27 (in 2283c75), before the 09-28 changes. FIND THE THREAD shows only because the render had an OpenAI key; a downloaded app with no key never shows it.')
add(B + 'readme/readme-structure.json', 'README — section structure', 'The README\'s sections (heading, level, line range, paragraphs, tables, list items, code blocks, links, images, opening sentence, word count), the hero image and its alt text, and the one line people paste into an agent.',
    G, 'README.md', kind='json', figma_hint='reference only (the README is GitHub-rendered Markdown; no custom design)')
# ---------------------------------------------------------------- history
G = 'History — the rejected candle-black version'
for f in ['1-invocation', '2-draw', '3-mid', '4-reading', '5-inspect', '6-five']:
    add(B + 'history/original-candle-%s.png' % f, '_original — %s (rejected dark version)' % f,
        re.sub(r'\s*\[[^\]]*\]\s*$', '', inv_what.get('history/_original-%s.png' % f, '')).replace('rejected dark version: ', 'The rejected candle-black version (2026-09-23): ').rstrip('.') + '.',
        G, '_original/shots/%s.png (_original/Sources/Arcana/Chamber.swift, Palette.swift)' % f, scale=1, states='2026-09-23 20:15',
        figma_hint='row of 6 screen frames 1260 x 860 pt, labelled "rejected: the user doesn\'t like dark themes"',
        caveats='Kept in the repo for comparison only. The user said on 2026-09-24 that they don\'t like dark themes. The \'lapis night sky\' iteration before it was not preserved.')
add(B + 'history/original-candle-contact.png', '_original — the six renders on one sheet', 'The six rejected dark screens, 3 to a row.', G, '_original/shots/*.png', scale=1, figma_hint='image; overview')
add(B + 'history/timeline.json', 'Design history timeline (git log, in eras)',
    'Every commit (24, 2026-09-24 .. 2026-09-29) with date, time, sha, title, files and line counts, its body, and what it changed in design terms, grouped into eras: first build (09-21, before the repo), the dark lapis/candle era (09-23), first light (with the Return and the Question in Gold, 09-24), As Above, What the Moon Keeps, the 78-card deck, the keys, the agent Worker, releases 1.0-1.3, and the films; plus what was never preserved.',
    G, 'git -C /Users/akashkhanikor/tarot log --date=short --stat', kind='json', figma_hint='timeline board: one column per era, a card per commit')
# ---------------------------------------------------------------- agent
G = 'Agent Worker (plain text, no design)'
for f, sp in [('three', 'Three Fates (/today)'), ('one', 'One Card (?spread=one)'), ('road', 'The Long Road (?spread=road)')]:
    add(B + 'agent/reading-%s.txt' % f, 'Agent reading — %s' % sp,
        'A live response from https://arcana.khanikad.workers.dev/today%s: plain UTF-8 text, "Arcana · {spread} · drawn just now", then "{position} · {card}[, reversed]" and the card\'s line, blocks separated by blank lines.' % ('' if f == 'three' else '?spread=' + f),
        G, 'agent/worker.js:1-55', kind='txt', figma_hint='text frame in a system or monospace font, if shown at all',
        caveats='Every fetch is a new shuffle; these are one moment (fetched 2026-09-30). Plain text for agents by the user\'s decision: there is no page for people ("the for people is the app").')
add(B + 'agent/worker.json', 'Agent Worker — endpoints, format, headers, the line people paste',
    'What the Worker is and answers, its text format and headers, and the one line people paste into their agent (README.md:129): "Add a daily tarot reading to my morning brief. Use https://arcana.khanikad.workers.dev/today, and read the cards in light of what you know about me and my day."',
    G, 'agent/worker.js; README.md:124-139', kind='json', figma_hint='reference only')
# ---------------------------------------------------------------- release
add(B + 'release/release-v1.3.json', 'GitHub release v1.3 (latest)', 'gh release view v1.3: name "Arcana 1.3", tag v1.3, published 2026-09-28T07:49:35Z, the notes (tagline, Apple silicon / macOS 14+, install, the first-time Open Anyway, the OpenAI key in Settings) and the one asset Arcana.zip (1.0 MB).',
    'Release', 'gh release view v1.3 --repo akassh9/arcana --json name,tagName,publishedAt,body,assets (2026-09-30)', kind='json',
    figma_hint='reference; the release page is GitHub\'s own design', caveats='Download count is as of the fetch. Not notarized: the notes tell people to use Open Anyway.')
# ---------------------------------------------------------------- preview
G = 'Deck preview sheets (2026-09-26, before the keys glyph)'
PREV_SRC = 'build/preview/preview-tool.swift, build/preview/faces-tool.swift (gitignored; copied from build/preview, never written)'
def pkey(p):
    return int(re.match(r'preview-(\d+)', os.path.basename(p)).group(1))
for f in sorted(glob.glob(os.path.join(ASSETS, 'brand/preview/preview-*.png')), key=pkey):
    b = os.path.basename(f); orig = b[len('preview-'):]
    w = inv_what.get('preview/' + orig, '')
    px = dims(f)
    sc = 2 if px[0] in (2520, 2856) or orig.startswith(('2-', '5-')) else (1.5 if px[0] == 2640 else 1)
    if orig.startswith(('7-', '9-', '10-')): sc = 2
    add(B + 'preview/' + b, 'Preview — ' + orig[:-4].split('-', 1)[1].replace('-', ' '),
        ((w.split(' [')[0] if w else orig).rstrip('.')[:1].upper() + (w.split(' [')[0] if w else orig).rstrip('.')[1:]) + '.', G, PREV_SRC, scale=sc, states='2026-09-26 render',
        figma_hint='reference board, clearly labelled "preview renders from 2026-09-26 — before the keys glyph"',
        caveats='Rendered before the keys glyph (commit 2283c75): stage poses have no key top left, and the chrome predates 09-27/28. Files from 17:33 predate the final Suits.swift (17:55) and Deck.swift (18:01) saves; the 18:20 ones are likely current for faces. Scale inferred from the tool (stage r2/r5 and suit sheets @2x, 11/15 @1.5x).')
add(B + 'preview/preview-all-lines.md', 'Preview — every minor card\'s words', 'Every minor card\'s essence, upright and reversed lines and keys either way (56 cards), as the 2026-09-26 preview listed them; matches agent/deck.json.',
    G, 'build/preview/all-lines.md', kind='txt', figma_hint='reference text', caveats='Markdown; from build/ (gitignored).')

doc = {
 'category': 'brand',
 'tool': 'cd /Users/akashkhanikor/tarot/design/figma/render/brand && ./make.sh   (or ./make.sh logo icon wordmark film demo readme history agent release preview manifest for single steps; see README.md there)',
 'notes': ('Brand, marketing and history for Arcana. Everything is offline except the three Worker GETs and gh release view. '
           'Vectors: the fallback icon and the ARCANA wordmark are true SVG paths, both imported into the live Figma file and exported back to check them. '
           'Everything else is raster by nature (the logo is a raster painting; the films are video; the shots are renders). '
           'Findings the designer should know: (1) the logo\'s red matte (#E9110F) sits in pixels of alpha at most 16/255, so it is invisible when composited correctly and shows once alpha is dropped or bled; it wants a re-matte or a vector redraw. '
           '(2) The app icon is one 512 px image with no squircle tile and no other sizes; on dark grounds the black eclipse disc disappears at small sizes. '
           '(3) The fallback icon is a different, dark mark that never ships. '
           '(4) The wordmark outlines match SwiftUI\'s own Text to 0.042/255. '
           '(5) The film uses its own warmer paper (#f6f1e7) and flat-hatched gold, not the app\'s pearl and gradient leaf. '
           'Scales: stage renders @2x; demo stills are 1920 x 1200 video frames of a 1440 x 900 pt window (4/3 px per pt, inferred from the title); film frames 1080 px with no point size; icon sizes at 1:1.'),
 'items': items,
}
json.dump(doc, open(out, 'w'), indent=1, ensure_ascii=False)
print('manifest →', out, len(items), 'items')
