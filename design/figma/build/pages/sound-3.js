// Chapter: Sound, step 3 of 3 (sequences and loudness, known issues). Run after sound-2.js.
//   node design/figma/bridge/run.mjs design/figma/build/pages/foundations-b-lib.js design/figma/build/pages/sound-3.js
const L = S.lib, F = S.fb
const sec = await L.chapter('Sound', { clear: false })
for (const n of sec.children.filter(n => ['Sound · Sequences & loudness', 'Sound · Known issues'].includes(n.name))) n.remove()
const SP = JSON.parse(await text('sound/sound-spec.json'))
const MAN = JSON.parse(await text('sound/manifest.json')).items
const P = 'sound/png/'
const item = f => MAN.find(i => i.file === f) || {}
const first = s => String(s || '').split(/(?<=[.!?])\s/)[0]
const durOf = f => { const m = /whole ([\d.]+) s/.exec(item(P + f + '-spectrum.png').description || ''); return m ? +m[1] : null }
const pic = async (file, kind, w) => {
  const im = await L.img(P + file + '-' + kind + '.png', { w, r: 6, stroke: L.C.stroke, name: file + ' · ' + kind })
  const h = L.frame({ name: (kind === 'wave' ? 'Waveform · ' : 'Spectrogram · ') + file, w: im.width, h: im.height }); h.appendChild(im)
  if (kind === 'spectrum') { const lh = Math.log(20000) - Math.log(40); for (const [f, lab] of [[10000, '10 kHz'], [1000, '1 kHz'], [100, '100 Hz']]) { const y = (Math.log(20000) - Math.log(f)) / lh * im.height; F.poly(h, [[0, y], [10, y]], { color: L.C.ink, alpha: 0.45, name: 'Tick' }); F.put(h, F.mono(lab, { size: 10, lh: 13, alpha: 0.6 }), 14, y - 6.5) } }
  const d = durOf(file); if (d) { const t = F.mono(d + ' s', { size: 10, lh: 13, alpha: 0.6 }); F.put(h, t, im.width - t.width - 8, im.height - 16) }
  return h
}
const loud = f => item('sound/wav/' + f + '.wav').loudness || {}
const lufs = l => (l.integrated_lufs == null ? '—' : l.integrated_lufs + ' LUFS')

// ---- Sequences & loudness ------------------------------------------------------------------------------------
const bQ = L.board({ name: 'Sound · Sequences & loudness', kicker: 'SOUND', title: 'Sequences & loudness', titleStyle: 'h1', w: 3000,
  lead: 'Whole moments rendered through the rebuilt graph with the drone, timed as the app times them. Each has a twin, “-intended”, with the same score but without the voice stealing and gain glide listed under Known issues.', tags: [['measured']] })
const SEQ = ['seq-1-ask-and-cut', 'seq-1b-let-go-and-hold-again', 'seq-2-ribbon-sweep', 'seq-3-three-cards-and-chord', 'seq-4-the-return', 'seq-5-mute-unmute']
const seqCards = []
for (const s of SEQ) {
  const it = item('sound/wav/' + s + '.wav'), l = loud(s), li = loud(s + '-intended')
  seqCards.push(L.col([
    L.text(it.title || s, 'h3', { w: 1380 }),
    L.text(first(it.description), 'small', { w: 1380 }),
    L.row([await pic(s, 'wave', 680), await pic(s, 'spectrum', 680)], { gap: 20, name: 'Pictures' }),
    F.mono(`${s}.wav · ${lufs(l)} · momentary max ${l.momentary_max_lufs} · true peak ${l.true_peak_dbtp} dBTP` + (li.integrated_lufs != null ? `\n${s}-intended.wav · ${lufs(li)} · true peak ${li.true_peak_dbtp} dBTP` : '') + `\nsound/sequences/${s}.json (cue list)`, { w: 1380, alpha: 0.75 }),
  ], { gap: 10, pad: 24, fill: '#FFFFFF', fillA: 0.55, r: 16, stroke: L.C.stroke, name: 'Sequence · ' + s }))
}
for (let i = 0; i < seqCards.length; i += 2) L.add(bQ, L.row(seqCards.slice(i, i + 2), { gap: 40, align: 'MIN', name: 'Sequences row' }))
const loudRows = MAN.filter(i => /sound\/wav\/room-/.test(i.file)).map(i => ({ f: i.file.replace('sound/wav/', ''), t: i.title.replace(/^In the room: /, ''), i: lufs(i.loudness || {}), m: String((i.loudness || {}).momentary_max_lufs), p: String((i.loudness || {}).true_peak_dbtp), r: String((i.loudness || {}).rms_dbfs) }))
L.add(bQ, L.col([L.text('Single voices in the room', 'h2'), L.text('Each voice at its usual gain through its reverb and the master 0.5, no drone. EBU R128 (ffmpeg ebur128 and astats on the 48 kHz file); integrated only for files of 0.4 s or more.', 'small', { w: 1200 }),
  L.table([
    { key: 'f', label: 'File', w: 300, style: 'code' }, { key: 't', label: 'Voice and gain', w: 420 }, { key: 'i', label: 'Integrated', w: 150, style: 'codeStrong' },
    { key: 'm', label: 'Momentary max LUFS', w: 190, style: 'code' }, { key: 'p', label: 'True peak dBTP', w: 150, style: 'code' }, { key: 'r', label: 'RMS dBFS', w: 120, style: 'code' },
  ], loudRows, { zebra: true, name: 'Loudness' })], { gap: 10, name: 'Loudness block' }))
L.add(sec, bQ)

// ---- Known issues -----------------------------------------------------------------------------------------------
const bI = L.board({ name: 'Sound · Known issues', kicker: 'SOUND', title: 'Known issues', titleStyle: 'h1', w: 2400,
  lead: 'Found by rendering the app’s own sound code offline and measuring it. None has been checked by ear; nothing was played aloud.', tags: [['open'], ['measured']] })
const iss = SP.known_issues
const inote = (x, extra) => L.note({ w: 700, tags: [['open'], [/measured|rendered|renders/i.test(x.detail) ? 'measured' : 'fixed']], title: x.issue, body: x.detail, source: x.source + (x.hear ? '\nhear: ' + x.hear : ''), kids: extra ? [extra] : null })
const g5 = L.col([await pic('dry-bowl-bright-g5-unheard', 'wave', 650), L.text('The bell that was meant to ring: dry-bowl-bright-g5-unheard.wav.', 'caption', { w: 650 })], { gap: 6, name: 'G5 evidence' })
const rr = iss.find(x => /round robin/i.test(x.issue))
const rrT = rr && rr.in_the_renders ? L.table([
  { key: 't', label: 'At', w: 60, style: 'code' }, { key: 'p', label: 'Player', w: 56, style: 'code' }, { key: 'n', label: 'New', w: 150, style: 'code' }, { key: 'c', label: 'Cuts', w: 150, style: 'code' }, { key: 'a', label: 'At age', w: 96, style: 'code' },
], rr.in_the_renders.map(r => ({ t: r.t + ' s', p: r.player, n: r.new, c: r.cut, a: r.cut_at_age_s + ' of ' + r.of_s + ' s' })), { name: 'Voice stealing in seq-2', gap: 12 }) : null
const notes = iss.map(x => inote(x, /never sounds/.test(x.issue) ? g5 : x === rr ? rrT : null))
for (let i = 0; i < notes.length; i += 3) L.add(bI, L.row(notes.slice(i, i + 3), { gap: 28, align: 'MIN', name: 'Issues row' }))
bI.findAll(n => n.type === 'TEXT' && /\.swift/.test(n.characters)).forEach(t => L.linkRefs(t))
L.add(sec, bI)

L.fit(sec)
await L.arrange('Design system')
const res = []
for (const b of [bQ, bI]) res.push(await L.snap(b, 'pages/sound/' + b.name.replace(/[^\w]+/g, '-').toLowerCase() + '.png', { scale: 0.3, wait: res.length ? 300 : 1800 }))
return res
