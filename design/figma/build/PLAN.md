# Arcana — Design Handoff (Figma) · build plan

The Figma file **Arcana — Design Handoff** is built by code through the Arcana Bridge plugin
(`design/figma/bridge/`). It is for a professional product designer who has never seen Arcana and
was not part of building it. Akash (the owner) and Claude (who designed and coded it with Akash, in
sessions from 21 to 29 September 2026) are handing it over. The code is the source of truth; every
value in the file should say where it comes from.

## Three pages of chapters

Akash's Figma is on the Starter plan, which allows **three pages per file**. So the file has three pages —
`Start here`, `Design system`, `Experience & notes` — and each topic is a **chapter**: a Figma Section on its
page, laid out left to right in reading order (see L.PAGES in lib.js and the table below). Never create pages
(it fails) and never rename them.

## How to build a chapter

- Each chapter has one step file, `design/figma/build/pages/<slug>.js`. It is the body of an async function run
  inside Figma by `node design/figma/bridge/run.mjs design/figma/build/pages/<slug>.js`. In scope: `figma`,
  `S` (state; `S.lib` is the kit from `build/lib.js`, auto-installed), `text(path)`, `bytes(path)`
  (read from `design/figma/assets/`), `save(path, u8)` (writes under `design/figma/out/`), `log()`.
- Start every step with `const L = S.lib; const sec = await L.chapter('<Exact chapter name>')`. It finds or
  makes the chapter's section on the right page and clears it, so a step always rebuilds its chapter from
  nothing and can be re-run. Append your boards to `sec`; end with `L.fit(sec)` (stacks the boards and sizes the
  section) and `await L.arrange('<page name>')` (puts the page's chapters in order). Never touch another chapter.
  Steps run one at a time and other builders share the bridge; never assume which page is current, and
  keep single steps under ~2 minutes (split a heavy chapter into several steps with `L.chapter(name, { clear: false })`,
  then fit once at the end).
- Screens: use `await L.window(path)` — a render at its point size with 16 pt corners, the **Window/Title bar**
  component on top (for real-window renders in `shots-window/` and `surfaces/window/`) and a soft shadow. Prefer
  `shots-window/` renders: every stage pose has one, laid out exactly as the live window (32 pt title bar, stage
  1260×828 or 940×628). `shots/` renders are stage-only (no title-bar inset, so everything sits 16–28 pt higher
  than in the app) — use them only for poses without a window version, and caption them so.
- Read `build/lib.js` before you start: it has the board, section, note, specs, table, swatch, figure,
  annotated-screen (numbered pins with a legend), arrow, chip (provenance tag), source (auto-linked
  file:line refs), style and variable helpers. Extend with local helpers in your own step file; don't edit lib.js.
- After building, export every board with `L.snap` / `L.snapChapter(sec, 'pages/<slug>')` to `out/pages/<slug>/` and
  LOOK at the PNGs (Read them). Fix overlaps, clipped text, empty images (images need ~1.5 s to decode
  before an export), misaligned grids, orphaned words, inconsistent spacing. Iterate until it looks like
  the work of a meticulous senior designer.

## Layout conventions (all pages)

- Canvas `#ECE7DE`; chapters are sections filled `#E4DED3`. Boards are pearl `#F9F7F2` frames (L.board), 24 radius,
  72 padding, stacked vertically inside the section with 160 between them (L.fit). Standard width 1600; wide boards
  (grids of cards or screens) may be 2400–3600. The first board of every chapter is its header: kicker = the part
  in capitals (e.g. `FOUNDATIONS`), title = the chapter name, a lead of one or two sentences, and an
  "In this chapter" line.
- The file's own words are Inter (L.TS presets). Arcana's own words, when quoted, are Didot Italic
  (`voice` preset) or — for specimens and real UI text — the file's **Arcana text styles** (L.useText).
- Values are in JetBrains Mono. Every value, colour, size and timing carries a source ref via L.source
  (e.g. `RootView.swift:1035-1055`), which links to GitHub at commit c7e12f4.
- Swatches bind to the **Arcana colour** variables (`figma.variables.setBoundVariableForPaint`), specimens use
  the **text styles**, glows use the **effect styles** — so a designer inspecting a layer sees the token.
- Name every layer meaningfully (no "Frame 123"). Top-level boards are named like `Colour · The sky`.
- Show the thing big and let it breathe; words are for what the picture can't say. Write like a precise,
  friendly senior designer: short sentences, no jargon without a gloss, no marketing voice. British spelling
  in Arcana's own copy; plain English in the file's notes.
- Pronouns: refer to the owner as **Akash** (or "they"). Refer to the builder as **Claude**.

## Provenance (tag decisions with L.chip)

- `akash` — Akash's own stated preferences and decisions: light colours only, no dark themes (the dark
  version was rejected); a transcendental, emotionally evocative feel over efficiency of flow; open to
  radical change; on-screen words as few as possible ("too wordy king… as minimal as possible"); the app is
  the only place for people — the web Worker is plain text for agents ("the for people is the app… reign in
  the implementation"); no widget ("meh scrap the widget idea"); Settings as a window; the full 78-card deck
  (after first saying "not yet"); the Star's glints: chose "fading glints" from five renders and asked for all
  glints to take that shape; the moon: sent Apple's emoji moon as a reference, a literal copy was "very out of
  theme"; the cream embossed back (a saturated blue-and-gold back was called tacky); keep only readings returned
  with the hold, and keep the question with them; the returned question disappears once the door opens —
  keep it that way; ⌘ , settings on the keys page (couldn't find Settings); the launch film's riso halftone
  ("a dither like effect") and no off-register "drop shadow" on type; the launch video is emotion, not a
  product demo; the demo walks through the app for people who won't install it.
- `panel` — a design panel's choices on 2026-09-24, approved by Akash as a package, not Akash's rules:
  The Return (the closing hold) and Question in Gold; nothing persists (since overturned by What the Moon
  Keeps); gold never re-appears on the way out; the question arrives whole (printed) when read back. The panel
  also rejected: a persistent "firmament" of constellations (reads as a tracker), the Minor Arcana (later
  built at Akash's request), a cross layout for five cards.
- `claude` — Claude's choices while building, all open: the court-card scheme (page on the ground, knight
  on the road, queen in the ring, king on the squared seat; wings only on the Knight of Cups); about one gold per
  card; roman numerals on pips (Ace = I) and an empty numeral band on courts; a pentagram on each Pentacle;
  Marseille-style pips with Rider–Waite–Smith scenes; the sky answers only four Majors (Wheel, Star, Moon, Sun);
  British spelling; the old key glyph turned 45° (a keycap read as UI chrome); ⌘/ for the keys; the seven key
  lines and their words; the date-only moon label while the door is open; ⌘⌫ to forget (no undo, so it wants a
  modifier); "ONE MOON AGO"; the pen-drawn chevrons; "hold · remember"; pages drifting in from the side time was
  turned; As Above not replayed in kept readings; the radial altar veil; the twelve questions, the places and the
  Star in the launch film.
- `lesson` — lessons from iterations with Akash: take a reference's idea, not its palette (the emoji moon);
  small lights drawn with equal, square arms read as plus signs — taper them; off-register copies of type read as
  drop shadows; any walkthrough reads as a demo; render candidates side by side and let Akash choose; an anchor
  rule must never push the hero object out of frame; in riso, four inks at low coverage everywhere read as
  confetti; static renders can hide window-level layout bugs (check a real titled window).
- `measured` — measured engineering facts (performance, rendering). `open` — open questions for the designer.
  `rejected` — tried and rejected. `shipped` — in the released app (1.3).

## The chapters (in this order; exact names)

| Page | Chapter | Builder |
|---|---|---|
| Start here | `Cover` | intro |
| Start here | `Read me first` | intro |
| Start here | `Principles & provenance` | intro |
| Design system | `Colour` | foundations-a |
| Design system | `Type` | foundations-a |
| Design system | `Ink, gold & materials` | foundations-a |
| Design system | `Layout` | foundations-b |
| Design system | `Motion` | foundations-b |
| Design system | `Sound` | foundations-b |
| Design system | `Components` | parts (keep the existing board `Components · Window chrome` and its component set **Window/Title bar**: build with `{ clear: false }` and remove only your own boards) |
| Design system | `Card anatomy & back` | deck |
| Design system | `Major Arcana` | deck |
| Design system | `Minor Arcana` | deck |
| Design system | `The words` | deck |
| Design system | `Sky & moon` | sky |
| Design system | `As Above` | sky |
| Experience & notes | `Flow & keys` | experience-a |
| Experience & notes | `The room` | experience-a |
| Experience & notes | `The reading` | experience-a |
| Experience & notes | `The return & the moon's door` | experience-b |
| Experience & notes | `Keys & Settings` | experience-b |
| Experience & notes | `Edge cases & accessibility` | experience-b |
| Experience & notes | `Brand & icon` | outside |
| Experience & notes | `Launch film & demo` | outside |
| Experience & notes | `Agents & releases` | outside |
| Experience & notes | `History & rejected directions` | notes |
| Experience & notes | `Open questions & issues` | notes |
| Experience & notes | `Engineering notes` | notes |

## Sources

- Inventory (exact values, strings, states, motion, decisions, open issues):
  `/private/tmp/claude-501/-Users-akashkhanikor-tarot/7548ca2d-8134-4fad-865a-b7311d777a44/scratchpad/inventory/*.json`
  — `_critic.json` corrects the others and wins on conflicts.
- Canonical tokens: `design/figma/assets/tokens/tokens.json` (already created in the file as 60 colour variables
  in the "Arcana colour" collection, 35 text styles, 14 effect styles, 3 gradient paint styles).
- Rendered assets: `design/figma/assets/<family>/manifest.json` and `design/figma/assets/_index.json`
  (families: shots — which also lists shots-window/, cards, glyphs, sky, type-ink, surfaces, brand, sound; the shots manifest is newer than _index.json and lists all 76 window renders). Use them; if something
  you need is missing, say so in your summary rather than faking it.
- The repo: `/Users/akashkhanikor/tarot` (README.md, Sources/Arcana/*.swift). Do not modify it.
