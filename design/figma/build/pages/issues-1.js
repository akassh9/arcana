// Experience & notes · Open questions & issues (1 of 2) — header, the ten that matter most, Brand, Accessibility, Type and layout, Cards.
// Run: node design/figma/bridge/run.mjs design/figma/build/pages/notes-kit.js design/figma/build/pages/issues-data.js design/figma/build/pages/issues-1.js
const L = S.lib, N = S.nk, Q = S.iq
const CH = 'Open questions & issues', PX = 'Issues · '
const ORDER = ['Header', 'The ten that matter most', ...Q.GROUPS.map(g => g[1]), 'Checked and corrected'].map(n => PX + n)
const MINE = ORDER.slice(0, 6)
const sec = await L.chapter(CH, { clear: false })
N.clearMine(sec, ORDER, MINE)

// ---------- header ------------------------------------------------------------------------------
const total = Q.ISSUES.length
const head = N.header(PX + 'Header', {
  kicker: 'NOTES', title: 'Open questions & issues',
  lead: `Everything left open at the handoff: ${total} issues from the nine design inventories and their critic, merged where they said the same thing and grouped by area. Each has its evidence, a source link, a severity and what it needs. Start with the ten that matter most.`,
  toc: ['The ten that matter most', ...Q.GROUPS.map(g => g[1]), 'Checked and corrected'],
})
const legend = L.row([
  L.col([L.text('Severity', 'h3'),
    ...[['High', 'Affects many people, the brand, or every spec.'], ['Medium', 'A careful user or reviewer will notice.'], ['Low', 'Polish, or a detail of the spec.']].map(([s, d]) => L.row([L.col([N.sev(s)], { w: 90 }), L.text(d, 'small', { w: 420 })], { gap: 12, align: 'CENTER', name: 'Legend · ' + s }))], { gap: 10, w: 540, name: 'Severity legend' }),
  L.col([L.text('Needs', 'h3'),
    ...[['design', 'A choice for you (and Akash).'], ['eng', 'A code change; the intent is clear.'], ['both', 'A choice, then a code change.'], ['know', 'Not a bug: a constraint to design around.']].map(([k, d]) => L.row([L.col([N.needs(k)], { w: 170 }), L.text(d, 'small', { w: 360 })], { gap: 12, align: 'CENTER', name: 'Legend · ' + k }))], { gap: 10, w: 560, name: 'Needs legend' }),
], { gap: 56, align: 'MIN', name: 'Legend' })
L.add(head, legend)
// Overview: issues per group, by severity.
const PERW = 26
const ov = L.col([L.text('By area', 'h3')], { gap: 8, name: 'Overview' })
for (const [g, name] of Q.GROUPS) {
  const it = Q.byGroup(g)
  const bar = L.row([], { gap: 2, name: 'Stack' })
  for (const s of ['High', 'Medium', 'Low']) {
    const n = it.filter(i => i[4] === s).length
    if (!n) continue
    const r = figma.createRectangle(); r.name = s + ' · ' + n; r.resize(n * PERW, 16); r.cornerRadius = 3
    r.fills = [L.solid(N.SEV[s].color, s === 'Low' ? 0.35 : 0.75)]
    L.add(bar, r)
  }
  L.add(ov, L.row([L.text(g, 'codeStrong', { w: 24, color: L.C.gold, alpha: 1 }), L.text(name, 'small', { w: 280 }), bar, L.text(String(it.length), 'codeStrong', { alpha: 0.7 })], { gap: 12, align: 'CENTER', name: 'Area · ' + name }))
}
L.add(ov, L.text('Bars: dark red High, amber Medium, grey Low; one unit per issue.', 'caption'))
L.add(head, ov)
L.add(head, N.src('Sources: the nine inventories’ open_issues and _critic.json (missing, errors), 30 September. Every row names the inventory it came from.', { w: 1456 }))
sec.appendChild(head)

// ---------- the ten that matter most --------------------------------------------------------------
const TOP = [
  ['A1', 'Most of the room’s labels are 7–11 pt capitals at 1.8–3.3:1. Quiet is the brief; legibility is the cost.'],
  ['A3', 'A blind reader can ask a question but never draw or read a card.'],
  ['A4', 'Keyboard users can’t open a card on the altar or find the thread.'],
  ['A2', 'There is no high-contrast variant of anything, and no setting but Reduce Motion is read.'],
  ['B1', 'The icon is the first thing people see, and it is the last surface left in the dark, raster, off-grid language (with B2).'],
  ['T2', 'Full screen on a large display is sparser, and nobody has looked at it.'],
  ['T1', 'Every fractional size in the code draws at the nearest whole point (halves round up), so specs must state the drawn size.'],
  ['U1', 'One key discards a whole reading, and another forgets a kept one, with no confirmation and no undo.'],
  ['U3', 'What the Moon Keeps is a whole feature that can only be found from the keys page.'],
  ['S1', 'The door’s bell was designed and is never heard.'],
]
const top = L.board({ name: PX + 'The ten that matter most', kicker: 'OPEN QUESTIONS', title: 'The ten that matter most', titleStyle: 'h1', w: Q.W, leadW: 1300,
  lead: 'Chosen by Claude for reach and for how much each one shapes the product; the ordering is a suggestion. Four are accessibility: the room was designed for one kind of reader.', tags: [['claude', 'Claude ranked these'], 'open'] })
const list = L.col([], { gap: 0, name: 'Top ten' })
const GN = Object.fromEntries(Q.GROUPS.map(g => [g[0], g[1]]))
TOP.forEach(([id0, why0], i) => {
  const id = Q.MAP[id0], why = Q.ref(why0)
  const it = Q.ISSUES.find(x => x[0] === id)
  const row = L.row([
    L.text(String(i + 1), 'h1', { w: 72, color: L.C.gold, alpha: 1 }),
    L.col([L.text(it[1], 'h2', { w: 1350 }), L.text(why, 'body', { w: 1350 }), N.src(it[3], { w: 1350 })], { gap: 8, w: 1350, name: 'Words' }),
    L.col([L.text(id, 'codeStrong', { color: L.C.gold, alpha: 1 }), L.text(GN[id.replace(/\d+/, '')], 'caption', { w: 260 })], { gap: 4, w: 260, name: 'Area' }),
    L.col([N.sev(it[4])], { w: 100, name: 'Severity' }),
    L.col([N.needs(it[5])], { w: 188, name: 'Needs' }),
  ], { gap: 40, pad: [22, 12], align: 'MIN', name: 'Top ' + (i + 1) + ' · ' + id })
  row.strokes = [L.solid(L.C.rule)]; row.strokeTopWeight = i === 0 ? 1 : 0; row.strokeLeftWeight = 0; row.strokeRightWeight = 0; row.strokeBottomWeight = 1; row.strokeAlign = 'INSIDE'
  L.add(list, row)
})
L.add(top, list)
sec.appendChild(top)

// ---------- groups ---------------------------------------------------------------------------------
const made = [head, top]
for (const [g, name, lead] of Q.GROUPS.slice(0, 4)) {
  const b = Q.groupBoard(PX + name, g, name, lead)
  sec.appendChild(b); made.push(b)
}

N.sortIn(sec, ORDER)
L.fit(sec)
await L.arrange('Experience & notes')
return await N.snap(made, 'issues', PX, { scale: 0.3 })
