# Arcana — design history (curated from the building sessions, for the handoff)

Arcana was designed and built by Akash (owner) and Claude (design and code) between 21 and 29 September 2026.
No designer has worked on it before. Akash judged by eye and by feeling: Claude rendered candidates, Akash chose.

## Timeline

- **21 Sep** — First build. Tarot for the Mac: 22 Major Arcana, a draw, a reading. The raster logo
  (`Assets/arcana-logo.png`, a dark eclipse-and-compass mark) dates from this time and predates everything below.
- **23 Sep** — Akash asked for the app to "evoke more emotions… feel transcendental to be on", and said they were
  open to radical changes. Claude built a dark "lapis night sky" version. (`_original/` in the repo keeps the
  pre-redesign candle-black version with its renders.)
- **24 Sep — First light.** Akash: they don't like dark themes and prefer lighter colours in general, but the direction was
  right. The world became "first light": a pale blue sky, dawn rising from below, ink type, cream card backs with a
  blind-embossed rose and one gold-leaf sun. Kept from the dark direction: the hold-to-ask ritual with a breathing ring;
  quiet embossed cream card backs (a saturated blue-and-gold back with gilt edges was called tacky — ornament stays
  restrained); cards that write themselves in gold cooling to ink; per-card singing-bowl tones that form a chord; a
  breathing drone; hover chimes across the fan; a thread of light under the spread; the reading recited as verse; the
  inspector as an altar; tonight's real moon phase. The repo went public on GitHub the same day.
- **24 Sep — The panel.** A 15-agent design panel, asked "what's the next feature", recommended **The Return** (a
  closing hold after the recital: the ink sinks into the stock, last drawn first, the bowls falling to the root, leaving
  pressed grooves with the gold leaf kept; then the cards turn face down) and, as runner-up, **Question in Gold** (the
  typed question is written by the pen and taken into the deck by the hold). They were fused as "the cards go back, the
  question stays". Akash approved both; both were built that day. Akash deleted the pre-return backup: "we won't be going
  back". The panel's own spec choices (not Akash's rules): nothing persists; gold never re-appears on the way out; the
  question is printed (arrives whole) when read back. The panel rejected: a persistent "firmament" where past readings
  become constellations (reads as a tracker), the Minor Arcana (dilutes the small word list and the fan instrument),
  and a cross layout for five cards (polish, not a new feeling).
- **24 Sep — The moon.** Akash asked for a prettier moon and sent Apple's emoji moons as the reference ("texture and
  color"). A literal copy (saturated yellow lit side, navy shadow) was "very out of theme". What stayed was the idea:
  real near-side seas and craters and a jagged terminator, painted per pixel, translated into the sky's palette as a day
  moon (pearl-ivory highlands, lilac seas, a translucent lilac ghost for the unlit disc). Lesson: take a reference's
  idea, not its palette.
- **24 Sep — Speed.** "I love how good it looks" — Akash asked whether it could be faster on their 120 Hz display. The near
  sky moved to Metal (60 fps calm, 120 lively), pixel-faithful to the old Canvas. Akash also found a white strip at the
  bottom of the live window that renders never showed (a safe-area bug). Lesson: static renders can hide window-level
  layout bugs.
- **25 Sep — As Above.** Asked again for the next feature, Claude proposed As Above and Akash approved it: the four cards
  with a counterpart in the sky make it answer after their ink cools — the Wheel turns the engraved wheel one house, the
  Star keeps the glints lit, the Moon spreads lilac half-light scaled by the real moon's illumination, the Sun raises the
  dawn. No new shapes, words or sounds; opacity and transform only. Unbuilt ideas the panel had scored (out of 10):
  turning in the light 5.9, when the draw answers 5.75, arriving at first light 5.6, the handled deck 5.25, the hours
  5.0, given to the moon 5.0, shuffle 4.75, hinges 4.6.
- **25 Sep — The Star's stars.** Akash said the Star's stars "look bad": they were equal-armed gold crosses with square
  ends, which read as plus signs. Claude rendered five looks over the real sky (crosses, soft points, fading glints, the
  card's eight-point star, a filled ✦ sparkle). Akash chose **fading glints** — four fine arms that thin to nothing, the
  upright one longest, a soft white halo and a pearl heart — and asked that every glint take that shape. Lesson: small
  lights drawn with uniform-width, equal arms read as typography; taper them. Render candidates side by side at 2× and
  let Akash choose.
- **25 Sep** — Akash asked whether there should be 78 cards; told that Arcana had only the 22 Majors: "no need to do
  anything about this yet". Also fixed: "find the thread" is shown only when an OpenAI key is found; the altar's veil
  became radial; the epigraph dims while the altar is open. A bug where a closed altar kept catching clicks was fixed.
- **26 Sep — What the Moon Keeps.** Every reading returned with the hold is kept on the Mac; click the moon (or ↑) to
  open them; ← → move through them; a hold brings the ink back; ⌘⌫ lets one go; one lunation later the question comes
  back faintly under the moon. No counts, streaks or notifications. Akash agreed that only readings returned with the hold
  are kept (esc keeps none) and that the written question is kept with them. When Akash noticed the returned question
  disappears once the door is opened, they said to keep it that way.
- **26 Sep — The full deck.** Akash raised the 78-card deck themselves. Claude recommended Marseille-style pips (not
  Rider–Waite–Smith scenes) in the pen's language, all 78 laid out as a ribbon, one suit at a time. Akash approved a
  preview (the ribbon and the Cups) and said: "build it out fully… we are aligned well enough in terms of direction and
  vision." The other suits were written without a per-suit review.
- **27 Sep — The keys.** Akash proposed a pop-up listing the controls, opened by a button like the sound bowl but top
  left; "go implement it fully… I trust your direction". The first version (four columns, fifteen entries with italic
  sentences, a subtitle and a footer) was "too wordy king, let's keep it simple and easy to read… As minimal as
  possible." It was cut to six lines of one to three words. The glyph became an old key turned 45°; a keycap had read as
  UI chrome over the sky.
- **27 Sep — Agents.** The launch post promises "connect your agent": a plain-text reading at
  https://arcana.khanikad.workers.dev/today for people's agents to fold into a morning brief. Claude also built a page for
  people; Akash cut it: "why do we need the for people on cloudflare? The for people is the app.. let's reign in the
  implementation a little - only have the agents part." The reading carries no instructions for the agent (that would
  read as prompt injection); the asking goes into the one line people paste.
- **27–28 Sep — No widget.** A Notification Center widget was built and could not appear (macOS drops widgets from apps
  without an Apple team signature). Akash: "meh scrap the widget idea. Fully clean, we are unlikely to build that in the
  future."
- **28 Sep — Releases.** 1.0 (the download), 1.1 (an OpenAI key in Settings, kept in the Keychain), 1.2 (Settings checks
  the key with OpenAI), 1.3 (a seventh line on the keys page, "⌘ , settings", because Akash couldn't find Settings).
  The app is ad hoc signed, not notarized: people open it once, then System Settings ▸ Privacy & Security ▸ Open Anyway.
- **28 Sep — The launch film.** Brief: "the point of the video is to evoke emotions not explain what the app is… The
  purpose of the video is to get that click, time and attention." A first cut from a real take was rejected as "a product
  demo". Akash chose "Everyone's question" (square). The film became a hand-drawn riso print: twelve private questions and
  twelve places at first light, the wheel of houses, the riffle of the Majors, the Star writing itself, ARCANA laid in
  gold cooling to ink. Akash: "Very good amazing in fact… Everything else is AMAZING." Their changes: remove the faint
  rings and two dots under the name; later they asked for the halftone "dither like effect" on the title card too, and
  said the gold copy printed off register read as a text "drop shadow", so it was removed. Lessons: in riso, four inks at
  low coverage read as confetti; an anchor rule must never push the hero object out of frame (the Star had drifted 54 px
  out of the frame).
- **28–29 Sep — The demo.** "Something that's not too long but still walks through what the app looks like for people
  that won't install it": one continuous 57 s take of a whole reading, published at
  https://akassh9.github.io/arcana/demo.mp4 (never move it; it is linked in the post).
- **30 Sep** — This handoff.

## Other rejected or replaced details

- The comma sign on the keys page: a Didot comma all but vanished; a larger hollow ring read as a "9"; it became a filled
  drop (rings within rings) with a short tail.
- The "plus sign" glints (see 25 Sep).
- The keycap glyph for the keys (see 27 Sep).
- The first, wordy keys page (see 27 Sep).
- The dark lapis / candle-black era (see 23–24 Sep).
- The saturated blue-and-gold card back with gilt edges.
- The emoji-coloured moon.
- The human web page for the agent reading; the widget.
- The panel's firmament, cross layout, and (at first) the Minor Arcana.
- Tooltips were removed (24 Sep) and the mute became a pen-drawn singing-bowl glyph.
