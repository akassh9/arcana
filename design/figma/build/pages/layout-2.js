// Chapter: Layout, step 2 of 3 (redlines at 1260 × 860 and at the minimum). Run after layout-1.js.
//   node design/figma/bridge/run.mjs design/figma/build/pages/foundations-b-lib.js design/figma/build/pages/layout-2.js
const L = S.lib, F = S.fb
const sec = await L.chapter('Layout', { clear: false })
for (const n of sec.children.filter(n => /^Layout · Redlines/.test(n.name))) n.remove()
const f1 = F.fmt
const V = (y, off = 32) => `${f1(y)} · window ${f1(y + off)}`

const rest = (P) => ({
  guides: [
    { y: P.invocationY, name: 'Invocation centre', f: 'max(170, (40 + ringTop) ÷ 2)', v: V(P.invocationY) },
    { y: P.ringTop, name: 'ringTop', f: 'deck.y − 1.25 ringR − 16', v: V(P.ringTop) },
    { y: P.deck.y, name: 'Deck, ring centre', f: 'handY − 11 = 0.775 H − 11', v: V(P.deck.y) },
    { y: P.pressY, name: 'PRESS AND HOLD', f: 'deck.y + 1.2 ringR + 26', v: V(P.pressY) },
    { y: P.moon.y, name: 'Moon', f: 'max(70, 0.12 H), r 16', v: V(P.moon.y) },
    { y: P.moonLabelY, name: 'Moon’s phase label', f: 'moon.y + 36', v: V(P.moonLabelY) },
    { y: 31, name: 'Corner glyphs', f: '26 × 26, 18 in', v: 'centre 31 · window 63' },
  ],
  rings: [{ x: P.W / 2, y: P.deck.y, r: P.ringR, name: 'ringR ' + f1(P.ringR) + ' = 0.66 fanH' }],
  vs: [{ x: P.W / 2, name: 'W/2' }, { x: P.moon.x, name: '0.86 W = ' + f1(P.moon.x) }],
  boxes: [{ x: 18, y: 18, w: 26, h: 26 }, { x: P.W - 44, y: 18, w: 26, h: 26 }],
})
const reading = (P, o = {}) => ({
  guides: [
    o.epigraph !== false ? { y: P.epigraphY, name: 'Epigraph', f: 'max(44, rowY − slotH/2 − 40)', v: V(P.epigraphY) } : null,
    { y: P.rowY, name: 'rowY', f: P.n === 1 ? '0.38 H' : '0.36 H', v: V(P.rowY) },
    { y: P.threadY, name: 'threadY', f: 'rowY + slotH/2 + 26', v: V(P.threadY) },
    { y: P.labelY, name: 'labelY', f: 'threadY + 20', v: V(P.labelY) },
    { y: P.stanzaTop, name: 'stanzaTop', f: 'labelY + 38', v: V(P.stanzaTop) + ` · verse ${f1(P.verse, 2)} pt` },
    { y: P.stanzaTop + P.verseH, name: 'Verse foot', f: `stanzaTop + ${P.n} × 1.34 size + gaps`, v: V(P.stanzaTop + P.verseH) },
    { y: P.findY, name: 'FIND THE THREAD', f: 'min(inviteY, verse foot + 44)', v: V(P.findY) },
    Math.abs(P.findY - P.inviteY) > 1 ? { y: P.inviteY, name: 'inviteY', f: 'askY − 44', v: V(P.inviteY) } : null,
    { y: P.askY, name: 'askY', f: 'H − 32', v: V(P.askY) + ' · return prompt, after the chord' },
  ].filter(Boolean),
  boxes: P.slots.map((x, i) => ({ x: x - P.slotW / 2, y: P.rowY - P.slotH / 2, w: P.slotW, h: P.slotH, name: i === 0 ? `slot ${f1(P.slotW)} × ${f1(P.slotH)}` : null })),
  vs: [{ x: P.W / 2, name: 'W/2' }],
})

const A = F.layout(1260, 828, 3), B = F.layout(940, 628, 3), B5 = F.layout(940, 628, 5)
const block = async (title, caption, path, spec) => L.col([
  L.text(title, 'h2'),
  L.text(caption, 'small', { w: 1100 }),
  await F.redlines(path, Object.assign({ labelW: 400, title }, spec)),
], { gap: 12, name: 'Redlined · ' + title })

const bA = L.board({ name: 'Layout · Redlines at 1260 × 860', kicker: 'LAYOUT', title: 'Redlines at 1260 × 860', titleStyle: 'h1', w: 1980,
  lead: 'The default window, drawn over real renders of the live window (shots-window/). Red is y, blue is x. Numbers are stage points, then window points.', tags: [['shipped']] })
L.add(bA, await block('At rest', 'The title block (the rule, ARCANA, the question line and the spreads) centres between y 40 and the top of the ring, so it rises and falls with the deck.', 'shots-window/1-invocation.png', rest(A)))
L.add(bA, await block('The reading, with a written question', 'Three Fates spoken. The return prompt at askY appears only after the chord, so this render doesn’t show it yet (see The reading).', 'shots-window/22-epigraph.png', reading(A)))
L.add(sec, bA)

const bB = L.board({ name: 'Layout · Redlines at the minimum', kicker: 'LAYOUT', title: 'Redlines at the minimum, 940 × 660', titleStyle: 'h1', w: 1660,
  lead: 'The same formulas at the smallest window. The ring and the ribbon shrink with the height; five cards is the tightest case, the only one where the verse falls to its 13 pt floor.', tags: [['shipped']] })
L.add(bB, await block('At rest', 'The invocation centre is ' + f1(B.invocationY) + ', just above its 170 floor.', 'shots-window/12-invocation-small.png', rest(B)))
L.add(bB, await block('The Long Road, five cards', `Verse fitted to ${f1(B5.verse, 2)} pt (draws 13); FIND THE THREAD lands on inviteY.`, 'shots-window/11-five-small.png', reading(B5, { epigraph: false })))
L.add(sec, bB)

L.fit(sec)
await L.arrange('Design system')
const out = []
for (const b of [bA, bB]) out.push(await L.snap(b, 'pages/layout/' + b.name.replace(/[^\w]+/g, '-').toLowerCase() + '.png', { scale: 0.3, wait: 1500 }))
return out
