#!/usr/bin/env python3
"""Design history of Arcana as JSON: every commit (from git log --stat) with what it
changed in design terms, grouped into eras. The design notes are written by hand from
the commit bodies and the project's notes; the dates, SHAs, titles and files come from git."""
import json, re, sys
stat_path, bodies_path, out = sys.argv[1:4]

commits = []
for block in open(stat_path).read().split('@@@')[1:]:
    head, _, rest = block.partition('\n')
    sha, date, iso, title = head.split('|', 3)
    files = []
    for l in rest.split('\n'):
        m = re.match(r'\s*(\S.*?)\s+\|\s+(Bin .*|\d+ ?[+-]*)$', l)
        if m: files.append({'file': m.group(1), 'change': m.group(2).strip()})
    summ = re.search(r'(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?', rest)
    commits.append({'sha': sha, 'date': date, 'time': iso, 'title': title, 'files': files,
                    'files_changed': int(summ.group(1)) if summ else 0,
                    'insertions': int(summ.group(2) or 0) if summ else 0,
                    'deletions': int(summ.group(3) or 0) if summ else 0})
bodies = {}
for block in open(bodies_path).read().split('@@@')[1:]:
    sha, _, body = block.partition('\n')
    bodies[sha.strip()] = ' '.join(l.strip() for l in body.split('\n') if l.strip() and not l.startswith('Co-Authored'))

DESIGN = {
 'e7c5761': ('first-light', 'First Light, the Return and the Question in Gold, in one first commit: the pale sky (skyBlue, lilac, rose, dawn on pearl), Didot in ink, cream cotton-stock cards with one gold leaf, the blind-embossed rose back, the hold-to-ask ring, cards that write themselves in gold cooling to ink, the verse, the Return (ink sinks into the stock, pressed lines and gold stay) and the typed question laid in gold and given to the deck as dust. _original/ keeps the rejected candle-black version and its six renders. The compass/eclipse logo (Assets/arcana-logo.png) enters the repo.'),
 'ca054f9': ('first-light', 'The README gets its picture (docs/arcana.png): a reading as the room shows it.'),
 '329a69b': ('first-light', 'No visual change: the room rests when no one can see it (clocks pause, the drone fades and the engine pauses).'),
 '506e03d': ('first-light', "No visual change: the hold's charge is read from a clock; the title's light sweep rests when the opening screen isn't showing."),
 'dede3f4': ('first-light', "The near sky (dust, blooms, glints, the hold ring, ripples) moves to one Metal shader at the display's pace, matched to the old canvas look; the title's sweep runs at 60 fps; card halos flare by fading; the altar's stuck-removal bug fixed."),
 '97bee64': ('first-light', "The day moon shows its face: real near-side seas and craters painted per pixel in the sky's own colours (pearl highlands, lilac seas, a translucent lilac ghost for the unlit disc), radius 12.5 -> 16 pt. The user's Apple-emoji reference, translated into the theme (a literal copy was 'very out of theme')."),
 '95c3ad2': ('as-above', "As Above: the four cards already in the sky answer. The Wheel turns the engraved wheel one house; the Star brings stars out in the day sky (fading glints: four fine arms, the upright longest, after the user said the plus-sign stars 'look bad'); the Moon lets its lilac half-light out as far as tonight's moon is lit; the Sun raises first light into morning with longer rays. Reversed, each answers as its line reads."),
 '6bf6fd0': ('as-above', 'The README picture redrawn with the Sun answered (morning light, fine-armed glints); shots are written 8 bits per channel.'),
 'c15d2ed': ('as-above', 'No new visuals: the arrow keys choose the spread and move the hand along the fan.'),
 'c60899b': ('moon-keeps', "What the Moon Keeps: returned readings are kept on this Mac; the moon becomes a door. The table shows a kept reading as the return left it (blanks keeping their gold, the question in ink), the corner moon turns back to that night's phase with only the date under it, chevrons page between readings, a hold brings the ink back, and one moon later the question returns faintly under the moon ('ONE MOON AGO')."),
 '3829999': ('seventy-eight', "The seventy-eight: four suits drawn by the same pen as Marseille-style pips laid out so the number tells its card (two cups standing beside three spilled, a heart with three swords, dawn behind ten blades, ten pentacles on the tree of life); courts set their suit's emblem where their rank belongs. The draw becomes a ribbon of 78 backs in a shallow arc with a hand that lifts a few cards."),
 'c00b0ed': ('seventy-eight', "The README picture as it stands: Six of Cups, the Star (answered: stars in the day sky), Six of Swords under 'Should I leave the city before winter', verse 'The old street is smaller now. / Less than you can, every day. / Row for the calmer water.'"),
 '2283c75': ('the-keys', "The keys: an old key drawn by the pen sits top left (mirroring the bowl top right) and turns gold while the keys page is open; six pen-drawn key lines over the veiled sky, after the user found the first version 'too wordy'. The README picture re-rendered with the key glyph."),
 '5bba8c3': ('agent-worker', "For your agent: a Cloudflare Worker answers every GET with a fresh reading as plain text (Three Fates, ?spread=one, ?spread=road). No page, no styling, no icon: the user cut the human page ('the for people is the app')."),
 '594c79e': ('agent-worker', "The README's one line for an agent now ends 'and read the cards in light of what you know about me and my day' (the asking lives in the user's line, not in the reading)."),
 '666ec87': ('releases', 'README: a download link to the latest release, for Apple silicon Macs on macOS 14 or later.'),
 'b42e592': ('releases', 'Settings (Arcana > Settings..., ⌘,): a small window with one field for an OpenAI key, kept in the Keychain; the thread is offered from the next reading.'),
 '9b09f7f': ('releases', 'Arcana 1.1 (build 2): the release that takes an OpenAI key in Settings.'),
 'a31b6e6': ('releases', "Settings asks OpenAI whether it will take the key; the line under the field says what it said (ready / this key won't open the thread / couldn't be reached)."),
 'd1edf24': ('releases', 'Arcana 1.2 (build 3): Settings checks the key.'),
 'a778f81': ('the-keys', "The keys page ends with '⌘ , settings'; the comma is drawn by the pen as a small filled drop with a tail (a typeset comma vanished; a hollow ring read as a 9)."),
 'd5a73f8': ('releases', "Arcana 1.3 (build 4): the release whose keys page lists Settings. The current release."),
 '14b7fc6': ('films', "The launch film 'Everyone's question, drawn': 21 s, square, every frame drawn on canvas; twelve places at first light printed as riso in four inks that give the app's sky; the cards are CardArt/Ink ported stroke for stroke; ends on ARCANA with the title's light. The user wanted it to 'evoke emotions, not explain'; an earlier real-app take was rejected as 'a product demo', and cut 1 (app code) preceded this hand-drawn riso cut."),
 'c7e12f4': ('films', 'The demo: one real 57 s take of the whole reading with its own sound, served by GitHub Pages at akassh9.github.io/arcana/demo.mp4 (never move it). For people who will not install the app.'),
}
ERAS = [
 {'id': 'first-build', 'title': 'First build', 'dates': '2026-09-21 (before the repo)',
  'summary': "The first Arcana, not preserved as a build. What survives from that day: the compass/eclipse logo (Assets/arcana-logo.png, file date 2026-09-21; its origin is not recorded) and the fallback code-drawn icon (Tools/icon: a sun-eye on near-black, build/icon.png and build/AppIcon.iconset dated 2026-09-21). Both marks are dark, from 'the night the mark was drawn in' (Palette.void's comment).",
  'artifacts': ['brand/logo/arcana-logo.png', 'brand/icon/fallback-icon.png'], 'commits': []},
 {'id': 'dark-era', 'title': 'The dark era: lapis night sky, then candle-black', 'dates': '2026-09-23',
  'summary': "Asked for an app that 'evokes more emotions… feels transcendental', Claude first built a dark 'lapis night sky' version (not preserved), then the candle-black chamber kept in _original/ (as of 2026-09-23 16:24): a near-black room (#0A0908) lit by a warm candle pool, gold embers on a screen blend, cream Didot, engraved ink card backs, only the 22 Majors in a fan, PRESS RETURN TO CUT THE DECK. On 2026-09-24 the user said they don't like dark themes and prefer light colours; the direction (the ritual, the craft) was kept.",
  'artifacts': ['brand/history/original-candle-1-invocation.png', 'brand/history/original-candle-2-draw.png', 'brand/history/original-candle-3-mid.png', 'brand/history/original-candle-4-reading.png', 'brand/history/original-candle-5-inspect.png', 'brand/history/original-candle-6-five.png'], 'commits': []},
 {'id': 'first-light', 'title': 'First light (with the Return and the Question in Gold)', 'dates': '2026-09-24',
  'summary': 'The light redesign, fused on the first commit with the two features a design panel chose: the Return (the cards go back) and the Question in Gold (the question stays). Then performance work that kept the look, and the moon\'s face.'},
 {'id': 'as-above', 'title': 'As Above', 'dates': '2026-09-25 – 2026-09-26', 'summary': 'The sky answers the Wheel, the Star, the Moon and the Sun.'},
 {'id': 'moon-keeps', 'title': 'What the Moon Keeps', 'dates': '2026-09-26', 'summary': 'Kept readings, opened from the moon.'},
 {'id': 'seventy-eight', 'title': 'The 78-card deck', 'dates': '2026-09-26', 'summary': 'Four pip suits by the same pen, the ribbon to draw from; the README picture as it stands.'},
 {'id': 'the-keys', 'title': 'The keys', 'dates': '2026-09-27 – 2026-09-28', 'summary': 'The old-key glyph and its six-line page (plus ⌘ , settings in 1.3).'},
 {'id': 'agent-worker', 'title': 'The agent Worker', 'dates': '2026-09-27', 'summary': 'A plain-text reading for AI agents; no human web surface by the user\'s decision.'},
 {'id': 'releases', 'title': 'Releases 1.0 – 1.3', 'dates': '2026-09-28',
  'summary': 'GitHub releases (Arcana.zip, ad hoc signed, not notarized: Open Anyway). 1.0 published 05:10Z (no version-bump commit of its own), 1.1 06:07Z (OpenAI key in Settings), 1.2 07:28Z (Settings checks the key), 1.3 07:49Z (⌘ , settings on the keys page; latest).',
  'releases': [{'tag': 'v1.0', 'published': '2026-09-28T05:10Z'}, {'tag': 'v1.1', 'published': '2026-09-28T06:07Z', 'commit': '9b09f7f'},
               {'tag': 'v1.2', 'published': '2026-09-28T07:28Z', 'commit': 'd1edf24'}, {'tag': 'v1.3', 'published': '2026-09-28T07:49:35Z', 'commit': 'd5a73f8', 'latest': True}],
  'releases_source': 'gh release view v1.3 (brand/release/release-v1.3.json); earlier publish times from the design inventory (assets-history, gh 2026-09-30)'},
 {'id': 'films', 'title': 'The films', 'dates': '2026-09-28 – 2026-09-29', 'summary': "The launch film (hand-drawn riso, 21 s) and the demo (one real take, 57 s)."},
]
byid = {e['id']: e for e in ERAS}
for e in ERAS: e.setdefault('commits', [])
for c in reversed(commits):   # oldest first
    era, note = DESIGN.get(c['sha'], ('unclassified', ''))
    c['design'] = note
    c['era'] = era
    c['body'] = bodies.get(c['sha'], '')[:1200]
    byid.get(era, byid['releases'])['commits'].append(c)
doc = {'source': 'git -C /Users/akashkhanikor/tarot log --date=short --stat (all commits by Akash, co-authored by Claude)',
       'commit_count': len(commits), 'first': commits[-1]['date'], 'last': commits[0]['date'],
       'eras': ERAS,
       'not_preserved': ["the 'lapis night sky' iteration (2026-09-23)", 'the saturated blue-and-gold card back', 'the emoji-literal moon',
                         'the plus-sign glints', 'the 15-entry keys page', 'the human web page for the Worker', 'the Notification Center widget (scrapped 2026-09-28)',
                         'launch-film cut 1 and the rejected real-app launch take']}
json.dump(doc, open(out, 'w'), indent=1, ensure_ascii=False)
print('timeline →', out, len(commits), 'commits;', {e['id']: len(e['commits']) for e in ERAS})
