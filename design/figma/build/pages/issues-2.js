// Experience & notes · Open questions & issues (2 of 2) — Motion, Sound, Copy, Surfaces, Engineering, and what was corrected.
// Run: node design/figma/bridge/run.mjs design/figma/build/pages/notes-kit.js design/figma/build/pages/issues-data.js design/figma/build/pages/issues-2.js
const L = S.lib, N = S.nk, Q = S.iq
const CH = 'Open questions & issues', PX = 'Issues · '
const ORDER = ['Header', 'The ten that matter most', ...Q.GROUPS.map(g => g[1]), 'Checked and corrected'].map(n => PX + n)
const MINE = ORDER.slice(6)
const sec = await L.chapter(CH, { clear: false })
N.clearMine(sec, ORDER, MINE)

const made = []
for (const [g, name, lead] of Q.GROUPS.slice(4)) {
  const b = Q.groupBoard(PX + name, g, name, lead)
  sec.appendChild(b); made.push(b)
}

// ---------- checked and corrected -------------------------------------------------------------------
const FIX = [
  ['The moon’s door plays a light bowl on G5.', 'It is silent: G5 is never synthesised, so only the slide is heard (S1).', 'Keeping.swift:227 · Sfx.swift:177-178', 'surfaces'],
  ['MarksCanvas’s .drawingGroup() rasterises the cards in PDF.', 'It stays vector (58 curve operations, no images). Only the grain and the vignette are raster, and the vignette renders black.', 'CardImages.swift:9-28', 'assets-history, color-ink, room, surfaces, minors'],
  ['No render shows “HOLD · RETURN THE CARDS”.', 'The posed readings set it: shots-window/31-wheel shows it, and 42-one-moon the singular “RETURN THE CARD”.', 'Tools/shot/main.swift:64-80, 200-208', 'flow'],
  ['The README picture shows only the Majors.', 'Since c00b0ed it shows the Six of Cups, the Star and the Six of Swords.', 'docs/arcana.png · README.md:6', 'minors'],
  ['The engraved wheel is #856624.', 'It draws #97782F: Generic RGB components painted into a device-RGB bitmap (E1).', 'Chamber.swift:65-90', 'color-ink, sky, answers-sound'],
  ['Palette.shade is #4C381F; candle is #734C20.', '0.300 × 255 is a rounding tie; they draw #4D381F and #734D20.', 'Palette.swift:18, 32', 'most inventories'],
  ['The title’s light is a 3.2 s crossing.', 'It is on the word for about 2.2 s and its centre crosses in about 1.6 s (M8).', 'RootView.swift:1040-1050', 'color-ink, room, flow, assets-history'],
  ['The card essence is 12.5 pt.', 'It is 12.5 in code and draws at 13 (T1).', 'CardImages.swift:89-94', 'minors'],
  ['A kept date in another year reads “SEPTEMBER 18 2025”.', 'en_US adds a comma: “SEPTEMBER 18, 2025” (W3).', 'Keeping.swift:1016-1022', 'room'],
]
const fb = L.board({ name: PX + 'Checked and corrected', kicker: 'OPEN QUESTIONS', title: 'Checked and corrected', titleStyle: 'h1', w: Q.W, leadW: 1300,
  lead: 'Claims in the inventories that turned out to be wrong when the critic checked them against the code, measured or rendered. If you read the inventories themselves, trust these corrections.',
  tags: [['measured', 'Checked by the critic']] })
L.add(fb, L.table([
  { label: 'The inventories said', w: 560, style: 'small' },
  { label: 'What is true', w: 820, style: 'bodyStrong' },
  { label: 'Source', w: 420 },
  { label: 'Said in', w: 260, style: 'caption' },
], FIX.map(([a, b, s, w]) => [a, Q.ref(b), N.src(s, { w: 420 }), w]), { name: 'Corrections', zebra: true, gap: 24 }))
L.add(fb, N.src('_critic.json (errors 0–13), 30 September', { w: 1456 }))
sec.appendChild(fb); made.push(fb)

N.sortIn(sec, ORDER)
L.fit(sec)
await L.arrange('Experience & notes')
return await N.snap(made, 'issues', PX, { scale: 0.3 })
