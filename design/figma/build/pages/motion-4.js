// Chapter: Motion, step 4 of 4 (frame strips from the renders). Run after motion-3.js.
//   node design/figma/bridge/run.mjs design/figma/build/pages/foundations-b-lib.js design/figma/build/pages/motion-4.js
const L = S.lib, F = S.fb
const sec = await L.chapter('Motion', { clear: false })
for (const n of sec.children.filter(n => n.name === 'Motion · Frame strips')) n.remove()
const bez = (x1, y1, x2, y2) => t => { if (t <= 0) return 0; if (t >= 1) return 1; let u = t; for (let i = 0; i < 14; i++) { const x = 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u - t; const dx = 3 * (1 - u) * (1 - u) * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u * u * (1 - x2); if (Math.abs(dx) < 1e-6) break; u = Math.max(0, Math.min(1, u - x / dx)) } return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u }
const easeInOut = bez(0.42, 0, 0.58, 1)
const invEase = v => { let a = 0, b = 1; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (easeInOut(m) < v) a = m; else b = m } return (a + b) / 2 }
const b = L.board({ name: 'Motion · Frame strips', kicker: 'MOTION', title: 'Frame strips', titleStyle: 'h1', w: 2400,
  lead: 'Four motions as the app draws them, frame by frame. Each frame is a real render from the app’s own drawing code (design/figma/assets/type-ink).', tags: [['shipped']] })
const strip = async (files, labels, o = {}) => {
  const frames = []
  for (let i = 0; i < files.length; i++) {
    const im = await L.img(files[i], { w: o.w, name: files[i].split('/').pop(), r: o.r || 0 })
    frames.push(L.col([im, F.mono(labels[i][0], { w: im.width, alpha: 0.9, style: 'Medium' }), labels[i][1] ? L.text(labels[i][1], 'caption', { w: im.width }) : null].filter(Boolean), { gap: 6, name: 'Frame ' + (i + 1) }))
  }
  return L.row(frames, { gap: o.gap || 20, align: 'MIN', name: 'Strip' })
}
const block = (title, body, tags, source, kids) => L.col([L.chips(tags), L.text(title, 'h2'), L.text(body, 'small', { w: 1000 }), L.source(source, { w: 1000 }), ...kids], { gap: 10, name: 'Strip · ' + title })

// The flip
const fl = JSON.parse(await text('type-ink/ink/ink.json'))
const flipLab = arr => arr.map(f => [`${f.t_s} s · ${Math.round(f.angle_deg)}°`, null])
L.add(b, block('card/flip · the turn', 'A 3D turn about the vertical axis, 0.5 s easeInOut, perspective 0.4. Taken: it starts 0.16 s after the click and shows its blank face (the ink starts at 0.46 s). Returned: it turns back once every face has sunk. The middle frame is 0.01 s before edge-on.', [['claude'], ['shipped']], 'Game.swift:356, 470-472',
  [L.row([
    L.col([L.text('Taken', 'smallStrong'), await strip(fl.flip_taken.map(f => f.png), flipLab(fl.flip_taken))], { gap: 8, name: 'Taken' }),
    L.col([L.text('Returned', 'smallStrong'), await strip(fl.flip_returned.map(f => f.png), flipLab(fl.flip_returned))], { gap: 8, name: 'Returned' }),
  ], { gap: 80, name: 'Flip strips' })]))

// The writing
const inks = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]
const wfiles = inks.map((v, i) => `type-ink/ink/writing-the-star-${i + 1}-of-9-ink-${v.toFixed(3)}@2x.png`)
const wstrip = await strip(wfiles, inks.map(v => [`ink ${v.toFixed(3)}`, `+${(0.46 + 2.1 * invEase(v)).toFixed(2)} s after the take`]))
// the stages of the ink under the frames
const cw = 226, gap = 20, x0 = cw / 2, x1 = x0 + 8 * (cw + gap)
const IX = v => x0 + v * (x1 - x0)
const stages = [['frame', 0, 0.22], ['art', 0.05, 0.92], ['numeral', 0.46, 0.74], ['name', 0.62, 0.9], ['essence', 0.72, 1], ['reversed mark', 0.8, 1]]
const gg = L.frame({ name: 'Ink stages', w: x1 + cw / 2, h: stages.length * 24 + 4 })
stages.forEach(([n, a, e], i) => {
  F.rect(gg, IX(a), i * 24 + 2, IX(e) - IX(a), 18, { fill: '#F1E6C6', color: '#6B4F12', alpha: 0.35, r: 4, align: 'INSIDE', name: 'Stage · ' + n })
  F.put(gg, L.text(`${n} ${a}–${e}`, 'caption', { size: 11, lh: 14, color: '#6B4F12', alpha: 1, family: 'Inter', style: 'Medium' }), IX(a) + 7, i * 24 + 4)
})
L.add(b, block('card/write · a card writing itself', 'ink runs 0 → 1 over 2.1 s easeInOut from 0.46 s after the take. The frame is laid first, then the art (each stroke led by its gold nib, then cooling), then the numeral, the name and the essence. Reduce Motion: the card arrives written.', [['claude'], ['shipped']], 'Game.swift:39, 477-487; CardImages.swift:57-101',
  [wstrip, L.col([L.text('What is being laid, by ink', 'smallStrong'), gg], { gap: 8, name: 'Stages' })]))

// The sink
const sp = [0, 0.2, 0.4, 0.6, 0.8, 1], sk = [0, 0.055, 0.192, 0.399, 0.669, 1]
L.add(b, block('return/sink · the Star given back', 'While the cards are held to be returned, each face fades off the pressed blank beneath it: the heavy lines stay as grooves, the leaf stays where it was laid, the type goes. sink = p^1.8 through the card’s own window.', [['panel'], ['shipped']], 'Game.swift:298-319; CardImages.swift',
  [await strip(sp.map((p, i) => `type-ink/ink/sink-the-star-${i + 1}-of-6@2x.png`), sp.map((p, i) => [`p ${p} · sink ${sk[i]}`, null]))]))

// Given as dust
const dust = JSON.parse(await text('type-ink/quill/given-as-dust.json')).frames
L.add(b, block('quill/give · the question given as dust', 'While the question is held, each letter thins and its gold leaves as one mote of the room’s dust, falling from its letter and turning in to the deck, in the order it was written: from charge 0.45, each letter over a tenth of the charge. Reduce Motion: the line simply fades.', [['panel'], ['shipped']], 'Quill.swift:219-235; Chamber.swift:469',
  [await strip(dust.map(f => f.png), dust.map(f => [`charge ${f.charge.toFixed(2)} · ${f.held_for_s.toFixed(2)} s`, null]), { w: 300, gap: 16, r: 8 })]))

L.add(sec, b)
L.fit(sec)
await L.arrange('Design system')
return [await L.snap(b, 'pages/motion/motion-frame-strips.png', { scale: 0.3, wait: 2000 })]
