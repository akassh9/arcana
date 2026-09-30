// Experience & notes · Open questions & issues — the de-duplicated issue list and its board builder (installs S.iq).
// Every issue from the nine inventories' open_issues and _critic.json's missing items, merged where they say the same thing.
// "inv" says where each came from (inventory name and open_issues index; "critic m#" = _critic.json missing[#]).
{
const L = S.lib, N = S.nk
const Q = {}
Q.GROUPS = [
  ['B', 'Brand', 'The mark, the icon and everything around the app that isn’t the room.'],
  ['A', 'Accessibility', 'The room was designed for one kind of reader. These are the people it doesn’t yet serve.'],
  ['T', 'Consistency of type and layout', 'Where what is drawn differs from the spec, or two similar things differ from each other.'],
  ['C', 'Cards and art', 'The 78 faces, their returned blanks and the back.'],
  ['M', 'Motion', 'How things move, light and settle.'],
  ['S', 'Sound', 'Everything is synthesised at launch. Several of these were found in the code and haven’t been checked by ear.'],
  ['W', 'Copy', 'The words, and the language they assume.'],
  ['U', 'Surfaces', 'The moon’s door, Settings, the keys and the system around them.'],
  ['E', 'Engineering bugs that affect design', 'Bugs and constraints in the code and the render pipeline that change what you see.'],
]
// [id, title, evidence, source, severity, needs, inventory]
Q.ISSUES = [
  ['B1', 'Two dark marks, neither drawn by the pen', 'The shipped icon is a raster compass-and-eclipse logo with a bold black disc (21 Sep, origin unrecorded). The fallback icon is cream on near-black #030409. Both are dark, against the light-only direction.', 'Assets/arcana-logo.png · Tools/icon/main.swift:8 · Palette.swift:13-38', 'High', 'design', 'assets-history 2 · cards 13 · color-ink 5'],
  ['B2', 'The icon ignores the macOS icon grid', 'A free-floating transparent mark with no squircle tile. build.sh packs one 512 px image into AppIcon.icns: no 1024 px, no tuned small sizes. macOS 26 may put a tile-less icon in a system tile; nobody has checked the Dock.', 'build.sh (sips -z 512 512)', 'High', 'both', 'assets-history 1'],
  ['B3', 'A red fringe round the logo', '9,903 semi-transparent edge pixels un-premultiply to about #E9110F: a faint red halo on a dark Dock or desktop, invisible on pearl. It needs a clean re-matte.', 'Assets/arcana-logo.png · assets brand/logo/arcana-logo-fringe-reveal.png', 'Medium', 'eng', 'assets-history 0'],
  ['B4', 'The README picture shows a feature most people won’t see', '“FIND THE THREAD” is in docs/arcana.png only because the build machine had an OpenAI key. A fresh download without a key never shows it.', 'docs/arcana.png · README.md:6', 'Medium', 'design', 'assets-history 5'],
  ['B5', 'Didot is a macOS font', 'Figma on Windows or the web substitutes it, and marketing use outside macOS may need a licence check. The launch film falls back to Bodoni 72.', 'Palette.swift:13-38 · /System/Library/Fonts/Supplemental/Didot.ttc', 'Medium', 'design', 'assets-history 15 · critic notes'],
  ['B6', 'The film and the app disagree in small ways', 'The film’s rose is #fdddcc (the app’s #FDDDDC), its paper #f6f1e7 is warmer than pearl #F9F7F2, and its moon is a flat pearl disc with halftone seas, not the painted moon.', 'film/arcana.html · Palette.swift:13-38 · Moon.swift', 'Low', 'design', 'assets-history 13, 14'],
  ['B7', 'The fallback icon’s proportions', 'Its body is 1024 px in a 1144 px canvas (89.5%); Apple’s grid is 824 of 1024 (80.5%). It is drawn only if the logo can’t be read.', 'Tools/icon/main.swift · build.sh', 'Low', 'design', 'assets-history 2'],
  ['B8', 'The logo has no colour profile', 'Untagged RGB, while every render is tagged sRGB, so its colours may shift between tools.', 'Assets/arcana-logo.png', 'Low', 'eng', 'assets-history 3'],
  ['B9', 'The launch post isn’t in the repo', 'Its text lives only in Akash’s draft. Ask Akash for it.', 'not in the repository', 'Low', 'know', 'assets-history 18'],

  ['A1', 'Faint, small labels fall below WCAG AA', 'Labels are 7–11 pt capitals at text 28–55% or goldInk 60–75%: about 1.8–3.3:1 on pearl, less on the blue top of the sky. “ONE MOON AGO” is 7 pt at 36% (2.2:1). Quiet on purpose (Akash wants as few words as possible), but a real legibility risk.', 'Palette.swift:82-92 · RootView.swift:448-450, 737-739', 'High', 'design', 'color-ink 3 · room 3'],
  ['A2', 'Only Reduce Motion is read', 'Increase Contrast, Reduce Transparency, Differentiate Without Colour and larger text are all ignored, so the faint labels have no high-contrast variant.', 'RootView.swift:12', 'High', 'both', 'critic m1'],
  ['A3', 'VoiceOver can’t reach the table', 'Cards have no accessibility elements (their hit targets are clear rectangles), so the draw and the altar can’t be reached without sight. The spread choices read only their caps text.', 'RootView.swift:367-400', 'High', 'both', 'room 11'],
  ['A4', 'No keyboard route to the altar or the thread', '“find the thread” and “try again” can only be clicked, and the altar opens only by click. A keyboard-only person can ask, draw and return, but can’t open a card or find the thread.', 'RootView.swift:161-229, 393-399', 'High', 'both', 'flow 1'],
  ['A5', 'No focus ring, and no hover on text buttons', 'The stage is .focusable() with .focusEffectDisabled(). The spread choices, FIND THE THREAD, “try again”, the bowl and the key are plain buttons: arrow cursor, no hover look, only the system dim when pressed.', 'RootView.swift:35-36, 1091-1131, 1295-1325 · Legend.swift:318-323', 'Medium', 'design', 'critic m0 · surfaces 7'],
  ['A6', 'Reduce Motion: the hold’s arc may not fill', 'The Metal sky’s clock pauses and a still sky redraws only when state changes, so the arc probably jumps from empty to full at the cut. From the code; not seen on screen.', 'Chamber.swift:419-426, 437-439 · SkyRenderer.swift:325-328', 'Medium', 'eng', 'sky 0'],
  ['A7', 'Reduce Motion: the title’s gold may freeze mid-word', 'The paused title clock yields its start instant once. If the room appears inside the 3.3 s of a 12 s cycle, the band stays painted across ARCANA. Plausible; not seen.', 'RootView.swift:1040-1050, 1071-1075', 'Medium', 'eng', 'color-ink 7 · room 0'],
  ['A8', 'Reduce Motion: the flip still animates', 'Only the writing is skipped; the card still turns over.', 'Game.swift:472', 'Low', 'both', 'cards 11'],
  ['A9', 'Reduce Motion: a still sky nobody composed', 'The sky freezes at t = 0, five of eleven glints part-lit; the reversed Star freezes at about 37% and can jump on a later redraw. The moon’s glows aren’t reduced (opacity only).', 'Chamber.swift:423-426, 444, 509-511 · Keeping.swift:1153-1169', 'Low', 'design', 'sky 5, 8 · answers-sound 3'],

  ['T1', 'Fractional sizes draw rounded', 'Font.custom rounds to whole points: 8.5→9, 9.5→10, 11.5→12, 12.5→13 (the card essence), 13.5→14, 18.5→19. Verified by rendering. Spec the drawn size, or use Font.custom(_:fixedSize:). Only the written question (NSFont 19) is exact.', 'Palette.swift:82-84 · CardImages.swift:89-94', 'High', 'both', 'color-ink 0 · cards 1 · room 1 · surfaces 10'],
  ['T2', 'Large windows were never designed', 'Past the default size the cards stop growing (slots cap at 262 or 360 pt, the fan at 178, the altar card at 480, verse at 27/22/18.5 pt) while the sky, wheel and ribbon keep scaling. Full screen is sparser, and nobody has looked at it.', 'Game.swift:853-863, 896-905 · RootView.swift:1406 · Chamber.swift:220', 'High', 'design', 'critic m2'],
  ['T3', 'No single label style', 'Caps declares defaults (10 pt, tracking 3.4, text 50%) that no call site uses: all 19 override them, giving 14 variants from 7 to 11 pt and tracking 1.6 to 4.2.', 'Palette.swift:90-92', 'Medium', 'design', 'color-ink 4'],
  ['T4', 'The two foot captions don’t match', '“PRESS AND HOLD”: 9 pt, tracking 4.2, goldInk 75%, at 822.5 pt. “HOLD · RETURN THE CARDS”: 8.5 pt (draws 9), tracking 4, goldInk 60%, at H − 32 (828). They could be one style on one baseline.', 'RootView.swift:448-450, 1179-1182', 'Medium', 'design', 'room 2'],
  ['T5', 'Card names break unevenly', 'About 29 of 78 names overflow the 182 pt column and TextKit breaks them: “THE / HIEROPHANT” (an orphaned THE), “THREE / OF WANDS” but “THREE OF / SWORDS”.', 'CardImages.swift:81-88', 'Medium', 'design', 'cards 0'],
  ['T6', 'Tight spots in the smallest window', 'At 940 × 660 the ribbon’s lifted cards touch the “DRAW THREE” caption, and the longest returned question wraps to two lines about 27 pt from the edge under the moon.', 'shots-window/60-ribbon-small · shots-window/55-brought-back-small', 'Medium', 'design', 'assets-history 6, 7'],
  ['T7', 'A long thread may run into the closing prompt', 'The finished thread has a fixed frame but its text is fixed-size vertically. In the smallest window (~165 pt for it) a long thread could reach “HOLD · RETURN THE CARDS”. No render covers it.', 'RootView.swift:1265-1268, 1342, 1359', 'Medium', 'both', 'room 8'],
  ['T8', 'Reversed cards set their words 6.5 pt higher', 'The reversal diamond joins a vertically centred stack, so the name and essence rise.', 'CardImages.swift:80-105', 'Low', 'design', 'cards 2'],
  ['T9', 'The numeral sits 1 pt right', 'Centred at x 114 while the card, art and name centre at x 113. Perhaps optical; nothing says so.', 'CardImages.swift:71-77, 105', 'Low', 'know', 'cards 3 · minors 8'],
  ['T10', 'Verse lines shrink on their own', 'Each line has lineLimit 1 and minimumScaleFactor 0.7, so one long line can draw smaller than its neighbours in the same stanza.', 'RootView.swift:1225-1226', 'Low', 'design', 'room 7'],
  ['T11', 'Fixed sizes that don’t scale', 'The question line is 560 pt wide in every window; As Above’s halo is 130 pt while every other light scales with the window.', 'Quill.swift:62 · Answers.swift:229', 'Low', 'design', 'flow 10 · answers-sound 7'],
  ['T12', 'The window always reopens full size', 'On appear it is enlarged to min(1260, screen − 80) × min(860, screen − 80), so a shrunk window comes back full size.', 'RootView.swift:1664-1676', 'Low', 'design', 'room 6'],
  ['T13', 'Two greys in one place', 'Tonight’s phase label is text 40%; the kept date in the same spot is text 55%.', 'RootView.swift:739 · Keeping.swift:1036', 'Low', 'design', 'surfaces 9'],

  ['C1', 'The Knight and Page of Pentacles are the plainest cards', 'The Knight is a gilt pentacle and four straight furrows (12 marks); the Page a pentacle, a sapling and five furrows (20). Noted as a follow-up after the build.', 'Suits.swift:1058-1072, 1102-1110', 'Medium', 'design', 'cards 15 · minors 0'],
  ['C2', 'The High Priestess’s crescent leaves a pale disc', 'The crescent is a paper-coloured disc over a gold one; the disc also blanks the veil’s hatching, so a pale full disc shows beside the crescent. Long-standing: it is in _original/ too.', 'CardArt.swift (the High Priestess) · shots-window/45-47', 'Medium', 'design', 'assets-history 17'],
  ['C3', '“About one gold per card” has exceptions', 'The High Priestess (diamond and crescent), the Sun (disc and eye), the Five of Cups (two cups) and the Two of Pentacles (two pentacles).', 'Suits.swift:289-290, 849-850', 'Low', 'design', 'cards 7 · minors 1'],
  ['C4', 'Art that leaves its window', 'The Magician’s rays reach the heavy border, the Wheel’s side diamonds straddle the window rule, and the World’s corner diamonds crowd the brackets. Intent unknown.', 'CardArt.swift:86, 240, 429', 'Low', 'design', 'cards 4'],
  ['C5', 'Square corners, and two different edges', 'Every card is square-cornered (real stock is rounded). The back has a 1.2 pt shaded edge, the face only a vignette. Grain is 50% on the face, 35% on the back.', 'CardImages.swift:108-121, 249-256', 'Low', 'design', 'cards 5, 6'],
  ['C6', 'Cards that may read wrong', 'The Hanged Man is drawn upside down, so reversed he stands upright. Death’s nine rays fall below the horizon and read as noise when small.', 'CardArt.swift:262-272, 283', 'Low', 'design', 'cards 9, 10'],
  ['C7', 'Names the art doesn’t show', 'The Four of Swords is “The Knight at Rest”, but no knight is drawn. The Page’s small oxblood diamond is never explained and may read as a star or a seed.', 'Deck.swift:313 · Suits.swift:688-696, 1033', 'Low', 'design', 'minors 3, 12'],
  ['C8', 'The courts’ empty numeral band', '41 pt of blank band at the top of 16 cards. Claude’s choice; a rank device could go there.', 'Deck.swift:430 · CardImages.swift:73', 'Low', 'design', 'cards 8 · minors 9'],
  ['C9', 'Pips, or scenes?', 'Suits.swift says the suits are laid “as the old Marseille pips did”, but the layouts follow Rider–Waite–Smith scenes without their figures. Treat them as RWS iconography in pip form.', 'Suits.swift:4-7', 'Low', 'know', 'minors 2'],
  ['C10', 'Small drawing slips', 'The Nine of Swords’ gilt flower has about 1 pt either side between quilt diamonds; wand buds stay upright on diagonal staves; the Ace of Wands’ ink bud peeks under the gold flame.', 'Suits.swift:123, 509-511, 780-783 · Ink.swift:202-204', 'Low', 'design', 'minors 4, 5, 6'],
  ['C11', 'Returned blanks hide some grooves', 'Paper-filled shapes (the clouds of the Seven of Cups, Three and Queen of Swords, the Six of Swords’ hull) paint over their own pressed groove, so those read fainter.', 'CardArt.swift:556-573 · CardImages.swift:210-215', 'Low', 'eng', 'minors 7'],
  ['C12', 'The pen has one width', 'Every stroke has one width and round caps: no pressure, no taper. Akash’s choice of tapered glints shows a taste the pen can’t yet serve.', 'Ink.swift:40 · CardImages.swift:23', 'Medium', 'design', 'color-ink 9'],
  ['C13', 'Editing one stroke re-rolls a card', 'The pen’s wobble is drawn from a seeded random stream in call order, so changing or inserting a stroke changes every later stroke on that card. Tweaks aren’t local.', 'Ink.swift:77-81', 'Medium', 'know', 'color-ink 10'],
  ['C14', 'Gold leaf bands at a different angle on every shape', 'The leaf gradient runs corner to corner of each shape’s bounding box, so tall shapes band steeply and wide ones shallowly.', 'CardImages.swift:34-38', 'Low', 'know', 'color-ink 8'],
  ['C15', 'Suit order differs by place', 'The deck deals Wands, Cups, Swords, Pentacles; Suits.swift and the written table put Cups first. This file follows the deck.', 'Deck.swift:156, 179, 417', 'Low', 'know', 'cards 14 · minors 10'],
  ['C16', 'Off-brand fallbacks and export traps', 'A face that fails to render falls back to the SF Symbol “rectangle”. In PDF the multiply vignette renders as a black disc (the marks stay vector). MarksCanvas scales from the top left, not the centre.', 'CardImages.swift:9-28, 274 · Legend.swift:240-248', 'Low', 'eng', 'cards 12, 16 · color-ink 11'],

  ['M1', 'Two different “gold cools to ink”', 'Card strokes cross-fade two stacked strokes (dipping to about 75% opacity mid-cool) and end at ink #15110E. The question lerps its colour to text #26201C and fades to 62%. Different end inks, curves and durations.', 'CardImages.swift:159-160 · Quill.swift:248-257', 'Medium', 'design', 'color-ink 1'],
  ['M2', 'The gold goes olive halfway', 'Colours blend in gamma-encoded sRGB, so the midpoint of gold → ink is khaki (#8F7F4D on the question at 0.5 s). A perceptual (OKLCH) blend would stay warmer.', 'Quill.swift:248-257', 'Low', 'design', 'color-ink 2'],
  ['M3', 'The Wheel’s answer is hard to see', 'A 30° turn is the wheel’s own symmetry, so its houses and rings land on themselves; only the star of eight and 16 rays change, at 5.5% opacity. The motion shows; the end state hardly differs.', 'CardArt.swift:498-522 · Chamber.swift:222', 'Medium', 'design', 'answers-sound 4'],
  ['M4', 'The moon is always the northern hemisphere’s', 'The terminator is vertical, with no tilt for latitude or hour, and the waxing moon is lit on the right. “The sky over the table is the sky over the reader” holds only in the north.', 'Moon.swift:7-8, 112-115, 181-183', 'Medium', 'design', 'sky 1'],
  ['M5', 'Answers that don’t settle, or don’t show', 'The reversed Star cycles 11 stars every 71.5 s for as long as the card lies there. The reversed Moon’s clearing scales with the real moon, so at the new moon it does almost nothing.', 'Answers.swift:124', 'Low', 'design', 'answers-sound 5, 10'],
  ['M6', 'As Above isn’t replayed in kept readings', 'Remembering a kept Star brings back its ink, not its stars. Claude’s choice; a possible follow-up.', 'Keeping.swift', 'Low', 'design', 'answers-sound 13'],
  ['M7', 'Choosing a spread is the one instant change', 'The brackets and bold swap with no easing, out of character with everything else. Perhaps meant as a crisp selection.', 'RootView.swift (SpreadChoice) · Game.swift (chooseSpread)', 'Low', 'design', 'room 9'],
  ['M8', 'The title’s light shows for about 2.2 s, not 3.2', 'k = (t mod 12) / 3.2, but the band moves two widths per unit of k, so light touches the word for about 2.2 s and its centre crosses in about 1.6 s. Spec the visible timing.', 'RootView.swift:1040-1050', 'Low', 'know', 'critic m7'],
  ['M9', 'The thread’s light runs on two clocks', 'Game.recite re-sparks every 13 s (a 1.8 s pass); the Thread view has its own 13 s / 2.2 s loop that its clock almost never reaches. It may leave a faint light at the first node. Unverified.', 'Game.swift:536-546, 563, 572 · RootView.swift:600-603', 'Low', 'eng', 'flow 3 · room 4'],
  ['M10', 'Small timing slips', 'The cut’s flash asks for 1.19 alpha, clamped to 1: a flat white centre. MoonReturn has a transition but no animation, so it may pop in. Motes have no pointer parallax; blooms and glints do.', 'Chamber.swift:490-491, 513, 556-557, 623-626 · Keeping.swift:1071', 'Low', 'design', 'sky 4, 7 · surfaces 8'],
  ['M11', 'The moon may show yesterday', 'Tonight’s phase is read only when views re-evaluate (no clock, to keep idle CPU low), so a window left untouched across a phase boundary may show the old moon or name.', 'RootView.swift:738 · Chamber.swift:355', 'Low', 'eng', 'sky 2'],

  ['S1', 'The moon’s door never rings', 'Opening the door asks for a bell on G5 (MIDI 79), which is never synthesised, so tone() returns silently; only the slide is heard. Choose the door’s sound, or synthesise G5.', 'Keeping.swift:227 · Sfx.swift:112-120, 177-178', 'Medium', 'both', 'answers-sound 0 · critic error 4'],
  ['S2', 'Voices steal each other', 'Bowls, chimes and chords share 12 round-robin players and each new sound interrupts the oldest, so a fast sweep can cut a ringing bowl mid-tone. Not checked by ear.', 'Sfx.swift:331-337', 'Medium', 'eng', 'answers-sound 2'],
  ['S3', 'Mute isn’t remembered', 'It resets at every launch. m isn’t on the keys page (on purpose), and it is a letter while a question is being written; the bowl always works.', 'QuillInput.swift:151-152, 282-292', 'Medium', 'design', 'answers-sound 11 · flow 7'],
  ['S4', 'Bowls end without a release', 'Their buffers stop at 5.5 s and 6.5 s while still −26 and −23 dB, which could tick under the reverb tail. Not checked by ear.', 'Sfx.swift:394, 399', 'Low', 'eng', 'answers-sound 1'],
  ['S5', 'The hand sounds never vary', 'Fixed seeds (77, 1031, 515) make them identical every time; tick and slide share seed 77.', 'Sfx.swift:369-536', 'Low', 'design', 'answers-sound 9'],
  ['S6', 'The drone may start partway up', 'It starts only once every long voice is synthesised and eases toward 0.42 from launch, so a slow synthesis could bring it in mid-fade. Not verified.', 'Sfx.swift:111-139', 'Low', 'eng', 'answers-sound 12'],

  ['W1', 'Every thread failure says the same thing', '“the thread stayed quiet” covers no key, a network error, a refused key, no credit and a bad reply; only “try again” differs. The reason shows only in Settings. It fits the minimal-words rule.', 'RootView.swift:1317-1330', 'Medium', 'design', 'flow 4'],
  ['W2', 'English only', 'Every string is a literal, dates are forced to en_US, and fixed widths assume English: the 560 pt question line holds about 73 Latin characters; the name column is 182 pt.', 'Keeping.swift:1019 · Quill.swift:62', 'Medium', 'design', 'critic m3'],
  ['W3', 'American dates in British copy', '“SEPTEMBER 15”, and “SEPTEMBER 15, 2025” (a comma under wide tracking) for another year.', 'Keeping.swift:1016-1022', 'Low', 'design', 'surfaces 3 · critic error 5'],
  ['W4', '“try again” is the only lower-case action', 'Every other control is set in Caps.', 'RootView.swift:1299-1327', 'Low', 'design', 'flow 11 · room 10'],
  ['W5', 'DRAW ONE CARD, DRAW THREE, DRAW FIVE', 'The one-card prompt is longer than the others, and any count but 1 or 3 reads “draw five”.', 'RootView.swift:1159-1165', 'Low', 'both', 'room 10 · flow 9'],
  ['W6', 'Settings copy', 'Straight apostrophes (won\'t, couldn\'t) where everything else is typographic, and “For find the thread.” reads oddly unless the feature’s name is set off.', 'Settings.swift:61-68', 'Low', 'design', 'surfaces 1, 2'],
  ['W7', 'The keys page leaves keys out', 'return, 1 2 3, ↓, m and ? are omitted, and in kept readings ← → turn pages while the page says only “choose”. Minimal words, by Akash’s rule.', 'Legend.swift', 'Low', 'know', 'surfaces 14'],

  ['U1', 'One key loses a reading', 'esc during the draw or the reading clears the table and keeps nothing, with no confirmation (the keys page calls it “back”). ⌘⌫ forgets a kept reading at once: no undo, no pointer route.', 'Game.swift:729-752 · Keeping.swift:176-189', 'Medium', 'design', 'flow 5 · surfaces 4'],
  ['U2', 'Settings is off the room’s look', 'A system SecureField (SF type, a focus ring in the user’s accent colour) in standard window chrome: the only non-Didot type in the app.', 'Settings.swift:30-32', 'Medium', 'design', 'surfaces 0 · color-ink 12'],
  ['U3', 'The moon’s door can’t be discovered', 'With nothing kept the moon is simply inert, and only the keys page’s “↑ past readings” mentions it. Its target is 60 × 60 pt round a 16 pt moon, with no focus ring.', 'Keeping.swift:986-994', 'Medium', 'design', 'surfaces 5, 7'],
  ['U4', 'System surfaces nobody designed', 'About Arcana (the raster logo, no tile), the app, Edit and Window menus, Settings’ title bar, the Keychain prompt after each ad hoc update, and Gatekeeper’s Open Anyway. None is captured.', 'ArcanaApp.swift:16-29 · Settings.swift:85-93', 'Medium', 'design', 'critic m4 · surfaces 15'],
  ['U5', 'Hidden timing in the hold and the draw', 'Space on an empty line holds at once, on a written line after 0.28 s. In the draw nothing happens until an arrow puts the hand on the ribbon. Before the cut, m and ? are letters.', 'RootView.swift:201-212 · QuillInput.swift:282-323', 'Low', 'design', 'flow 6, 7, 8'],
  ['U6', 'The thread can be asked mid-recital', '“find the thread” appears as the last verse line begins, about 1.45 s before the chord; “hold · return the cards” waits for the chord.', 'RootView.swift:1156, 1252-1254', 'Low', 'design', 'flow 2'],
  ['U7', 'A folio can’t be put away', 'Game.dismissWeave() exists but nothing calls it; only returning the cards or esc clears the thread.', 'Game.swift:722-727', 'Low', 'both', 'flow 0'],
  ['U8', 'A new key waits for the next reading', 'Whether the thread is offered is re-read only at each cut, so a key pasted mid-reading appears next time. Nothing in the room says so.', 'Game.swift:404, 714', 'Low', 'design', 'flow 12'],
  ['U9', 'Settings flickers on open', 'It asks OpenAI about a kept key every time the window opens, so the line shows “Asking OpenAI…” each time. Harmless and free.', 'Settings.swift:53', 'Low', 'eng', 'surfaces 16'],
  ['U10', 'No count on kept pages', 'Deliberate (“nothing is counted”): the only sense of place is the date and which chevrons show.', 'Keeping.swift:21-22', 'Low', 'know', 'surfaces 6'],
  ['U11', 'Input the room ignores', 'No context menus, scroll, pinch, swipe or drag and drop, and Tab does nothing: only hover, click, press-and-hold and keys. Don’t spec gestures without engineering.', 'RootView.swift:161-288, 420-436', 'Low', 'know', 'critic m5'],

  ['E1', 'The wheel’s ink isn’t the hex in the docs', 'CGColor(red: 0.52, green: 0.40, blue: 0.14) is Generic RGB painted into a device-RGB bitmap, so it draws #97782F, not #856624. Use #97782F, or switch the code to sRGB.', 'Chamber.swift:65-90', 'Low', 'eng', 'critic m6 · answers-sound 8 · color-ink 6'],
  ['E2', 'Colour-space odds and ends', 'The grain is built in device RGB, and the window background repeats pearl as a literal NSColor instead of Palette.pearl.', 'Palette.swift:109 · RootView.swift:1659-1660', 'Low', 'eng', 'color-ink 6'],
  ['E3', 'Raster lights under vector cards', 'As Above’s rays are raster at half resolution (4× upscaled on Retina); the engraved wheel is a 1500 px bitmap shown at about 1663 pt. Fine at their opacity; export the vector redraws.', 'Answers.swift:253-264 · Chamber.swift:66-71, 220', 'Low', 'know', 'answers-sound 14 · sky 3'],
  ['E4', 'Renders depend on the day', 'Every render shuffles fresh, the moon and its answer come from the render night, and kept dates are relative to the render day. A phase can’t be posed for exports.', 'Answers.swift:172, 464 · Tools/shot/main.swift:64-80', 'Low', 'eng', 'answers-sound 6 · assets-history 4'],
  ['E5', 'Most room views are private', 'Title, SpreadChoice, Thread, Halos, the altar and more are file-private in RootView.swift, so isolated renders copy the sources and drop “private”, as design/figma/render does.', 'RootView.swift', 'Low', 'know', 'flow 15 · room 13'],
  ['E6', '“HoldRing” draws no ring', 'It draws only the “PRESS AND HOLD” caption; the ring and its arc belong to the Metal sky.', 'RootView.swift:438-460 · Chamber.swift:412-560', 'Low', 'know', 'room 5'],
  ['E7', 'The repo’s own renders are stale', 'build/shots and docs/arcana.png predate 2283c75 and the 28 Sep changes, are stage-only, mix 1× and 2×, and repeat names (19-, 26-). This file uses fresh renders from design/figma/render (30 Sep); docs/arcana.png still needs one.', 'rebuild-shots.sh · Tools/shot/main.swift:14, 58', 'Medium', 'eng', 'assets-history 8, 9, 10 · room 12 · sky 6 · surfaces 11–13 · flow 13, 14 · critic m9'],
  ['E8', 'Things that live only on this Mac', 'build/ (the 78-card preview tools and sheets, stale fallback icons), film/out (271 MB) and the film’s mp4 are gitignored or uncommitted, and would be lost on a clean.', '.gitignore · film/make.sh', 'Medium', 'eng', 'assets-history 11, 12, 21'],
  ['E9', 'Renders still missing', 'Reduce Motion stills, large and full-screen windows, a hovered kept card, the fly-home and the cut in context, a faithful IME composition (shots/75 sits about 76 pt off centre), button states, the Settings focus ring, system surfaces, and the icon in the Dock.', 'design/figma/assets/_index.json (gaps, problems)', 'Medium', 'eng', 'critic m8 · asset index'],
  ['E10', 'docs/ is public', 'GitHub Pages serves docs/, and docs/demo.mp4 is linked from the launch post: never move or rename it. Anything added there is public.', 'docs/demo.mp4', 'Low', 'know', 'assets-history 19'],
  ['E11', 'Loose ends', 'Unused constants H and CY in Suits.swift; courts render an empty Text(""); the first commit’s message stops mid-sentence.', 'Suits.swift:17, 19 · CardImages.swift:73', 'Low', 'eng', 'minors 9, 11 · assets-history 22'],
]
// Within each area, High first, then Medium, then Low; ids follow that order. Q.MAP maps the ids above to the shown ones.
{
  const RANK = { High: 0, Medium: 1, Low: 2 }, out = []
  Q.MAP = {}
  for (const [g] of Q.GROUPS) {
    const items = Q.ISSUES.filter(i => i[0].replace(/\d+/, '') === g).sort((a, b) => RANK[a[4]] - RANK[b[4]])
    items.forEach((it, k) => { Q.MAP[it[0]] = g + (k + 1); out.push([g + (k + 1), ...it.slice(1)]) })
  }
  Q.ISSUES = out
}
Q.ref = s => s.replace(/\b([BATCMSWUE]\d+)\b/g, m => Q.MAP[m] || m)
Q.byGroup = g => Q.ISSUES.filter(i => i[0].replace(/\d+/, '') === g)
Q.W = 2300
Q.COLS = { id: 56, title: 340, ev: 900, src: 420, sev: 100, needs: 188 }
Q.headRow = () => {
  const C = Q.COLS
  const r = L.row([['#', C.id], ['Issue', C.title], ['Evidence', C.ev], ['Source', C.src], ['Severity', C.sev], ['Needs', C.needs]].map(([t, w]) => L.text(t, 'kicker', { w })), { gap: 24, pad: [8, 12], name: 'Header row' })
  r.strokes = [L.solid(L.C.gold, 0.5)]; r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 1; r.strokeAlign = 'INSIDE'
  return r
}
Q.row = (it, i) => {
  const C = Q.COLS
  const [id, t, ev, src, sev, needs, inv] = it
  const r = L.row([
    L.text(id, 'codeStrong', { w: C.id, color: L.C.gold, alpha: 1 }),
    L.text(t, 'bodyStrong', { w: C.title }),
    L.text(ev, 'small', { w: C.ev, alpha: 0.86 }),
    L.col([N.src(src, { w: C.src }), L.text('Inventory: ' + inv, 'caption', { w: C.src, size: 11, lh: 16, alpha: 0.45 })], { gap: 4, w: C.src, name: 'Source' }),
    L.col([N.sev(sev)], { w: C.sev, name: 'Severity' }),
    L.col([N.needs(needs)], { w: C.needs, name: 'Needs' }),
  ], { gap: 24, pad: [14, 12], align: 'MIN', name: id + ' · ' + t })
  r.fills = i % 2 ? [L.solid('#FFFFFF', 0.55)] : []
  r.strokes = [L.solid(L.C.rule)]; r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0; r.strokeBottomWeight = 1; r.strokeAlign = 'INSIDE'
  return r
}
Q.groupBoard = (name, g, title, lead) => {
  const items = Q.byGroup(g)
  const counts = ['High', 'Medium', 'Low'].map(s => [s, items.filter(i => i[4] === s).length]).filter(x => x[1])
  const b = L.board({ name, kicker: 'OPEN QUESTIONS · ' + g, title, titleStyle: 'h1', w: Q.W, lead, leadW: 1300 })
  L.add(b, L.row([L.text(items.length + ' issues', 'smallStrong'), ...counts.map(([s, n]) => L.row([N.sev(s), L.text(String(n), 'codeStrong')], { gap: 6, align: 'CENTER', name: 'Count · ' + s }))], { gap: 20, align: 'CENTER', name: 'Counts' }))
  const t = L.col([Q.headRow(), ...items.map((it, i) => Q.row(it, i))], { gap: 0, name: 'Issues · ' + title })
  L.add(b, t)
  return b
}
S.iq = Q
}
