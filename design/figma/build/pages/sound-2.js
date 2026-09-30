// Chapter: Sound, step 2 of 3 (notes in Hz, the event map and the drone's levels). Run after sound-1.js.
//   node design/figma/bridge/run.mjs design/figma/build/pages/foundations-b-lib.js design/figma/build/pages/sound-2.js
const L = S.lib, F = S.fb
const sec = await L.chapter('Sound', { clear: false })
for (const n of sec.children.filter(n => ['Sound · Notes in Hz', 'Sound · The event map'].includes(n.name))) n.remove()
const SP = JSON.parse(await text('sound/sound-spec.json'))
const hz = x => (Math.round(x * 100) / 100).toFixed(2)
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12)
const NOTE = { C4: 60, G4: 67, C5: 72, E5: 76, G5: 79, C6: 84 }
const link = n => { n.findAll(x => x.type === 'TEXT' && /\.swift/.test(x.characters)).forEach(x => L.linkRefs(x)); return n }
const titled = (title, kids, o = {}) => L.col([L.text(title, 'h2'), ...(o.lead ? [L.text(o.lead, 'small', { w: o.w || 900 })] : []), ...kids, ...(o.source ? [L.source(o.source, { w: o.w || 900 })] : [])], { gap: 10, name: 'Block · ' + title })

// ---- Notes in Hz ----------------------------------------------------------------------------------------------
const bN = L.board({ name: 'Sound · Notes in Hz', kicker: 'SOUND', title: 'Notes in Hz', titleStyle: 'h1', w: 2600,
  lead: 'One scale for everything: C major pentatonic (C D E G A), equal temperament, A4 = 440 Hz. Any spread is a consonant chord, and the chimes can never clash with the bowls.', tags: [['claude'], ['shipped']] })
const spreadRows = []
for (const s of SP.notes.spreads) s.slots.forEach((sl, i) => spreadRows.push({ sp: i ? '' : s.name + (s.chord_part_scale !== 1 ? '  ×' + s.chord_part_scale.toFixed(3) : ''), pos: sl.slot, up: sl.upright, uh: hz(sl.upright_hz), rv: sl.reversed + ' dark', rh: hz(sl.reversed_hz), pan: String(sl.pan) }))
spreadRows.push({ sp: 'The question', pos: 'the cut · read back · forget', up: '—', uh: '', rv: 'C3 dark', rh: hz(SP.notes.question_bowl.hz), pan: '0' })
const chime = SP.voices.find(v => v.id === 'chime')
const drone = SP.voices.find(v => v.id === 'drone')
const swell = SP.voices.find(v => v.id === 'swell')
const bb = SP.voices.find(v => v.id === 'bowl-bright').recipe.partials, bd = SP.voices.find(v => v.id === 'bowl-dark').recipe.partials
L.add(bN, L.row([
  titled('Spread positions', [L.table([
    { key: 'sp', label: 'Spread · chord part', w: 200, style: 'smallStrong' }, { key: 'pos', label: 'Position', w: 190 },
    { key: 'up', label: 'Upright', w: 70, style: 'codeStrong' }, { key: 'uh', label: 'Hz', w: 80, style: 'code' },
    { key: 'rv', label: 'Reversed', w: 90, style: 'codeStrong' }, { key: 'rh', label: 'Hz', w: 80, style: 'code' }, { key: 'pan', label: 'Pan', w: 60, style: 'code' },
  ], spreadRows, { zebra: true, name: 'Spread notes' })], { w: 950, lead: 'Upright: the bright bowl. Reversed: an octave down on the dark bowl. Pan = (slot/(n − 1) × 2 − 1) × 0.55. In the chord each part is × 1/√n.', source: 'Deck.swift:32-50; Sfx.swift:112-120, 182-203; Game.swift:656-658' }),
  titled('Ribbon chimes', [L.table([
    { key: 'n', label: 'Note', w: 60, style: 'codeStrong' }, { key: 'h', label: 'Hz', w: 90, style: 'code' }, { key: 'p', label: 'Pan', w: 70, style: 'code' },
    { key: 'g', label: 'Peak gain', w: 90, style: 'code' }, { key: 't', label: 'Tame', w: 70, style: 'code' }, { key: 'c', label: 'Cards', w: 60, style: 'code' },
  ], chime.tables.map(t => ({ n: t.note, h: hz(t.hz), p: (Math.round(t.pan_at_note_centre * 100) / 100).toString(), g: (Math.round(t.peak_gain * 1000) / 1000).toString(), t: (Math.round(t.tame * 1000) / 1000).toString(), c: String(t.ribbon_cards) })), { zebra: true, name: 'Chime scale' })],
    { w: 620, lead: 'C4 to A6 across the 78-card fan, low on the left. Tame = 1/√(f/400) above 400 Hz keeps the top from piercing.', source: 'Sfx.swift:205-219, 415-429' }),
  L.col([
    titled('The drone', [L.table([
      { key: 'n', label: 'Note', w: 60, style: 'codeStrong' }, { key: 'h', label: 'Loop Hz', w: 80, style: 'code' }, { key: 'a', label: 'Amp', w: 60, style: 'code' },
      { key: 'b', label: 'Breathes', w: 80 }, { key: 'x', label: 'Harmonics (Hz)', w: 240, style: 'code' },
    ], drone.recipe.voices.map(v => ({ n: v.note, h: String(v.loop_hz), a: String(v.amp), b: v.breathes ? 'yes' : 'no, steady', x: v.harmonics_hz.map(x => Math.round(x * 10) / 10).join(' · ') })), { zebra: true, name: 'Drone voices' })],
      { w: 620, lead: 'Harmonic amps 1, .5, .28, .14. Right channel +0.15 Hz. Frequencies rounded to 0.05 Hz so the 20 s loop is seamless.', source: 'Sfx.swift:431-460' }),
    titled('The swell', [L.table([
      { key: 'n', label: 'Note', w: 60, style: 'codeStrong' }, { key: 'h', label: 'Hz', w: 90, style: 'code' }, { key: 'a', label: 'Amp', w: 60, style: 'code' }, { key: 'd', label: 'Detune Hz (L −d/2, R +d/2)', w: 240, style: 'code' },
    ], swell.recipe.partials.map(p => ({ n: p.note, h: hz(midiHz(NOTE[p.note])), a: String(p.amp), d: String(p.detune_hz) })), { zebra: true, name: 'Swell partials' })],
      { w: 620, source: 'Sfx.swift:462-486' }),
  ], { gap: 40, name: 'Drone and swell' }),
], { gap: 64, align: 'MIN', name: 'Note tables' }))
L.add(bN, titled('The bowls’ partials', [L.table([
  { key: 'r', label: 'Ratio', w: 80, style: 'codeStrong' },
  { key: 'a', label: 'Bright amp', w: 110, style: 'code' }, { key: 'd', label: 'Bright decay /s', w: 130, style: 'code' }, { key: 'b', label: 'Bright beat Hz', w: 130, style: 'code' },
  { key: 'a2', label: 'Dark amp', w: 110, style: 'code' }, { key: 'd2', label: 'Dark decay /s', w: 130, style: 'code' }, { key: 'b2', label: 'Dark beat Hz', w: 130, style: 'code' },
], bb.map((p, i) => ({ r: '× ' + p.ratio, a: String(p.amp), d: String(p.decay_per_s), b: String(p.beat_hz), a2: String(bd[i].amp), d2: String(bd[i].decay_per_s), b2: String(bd[i].beat_hz) })), { zebra: true, name: 'Bowl partials' })],
  { w: 1000, lead: 'Each partial is two sines at f ± beat/2, the lower leaning left (0.64 / 0.36) and the upper right, so the beating moves between the ears. Strike 3 ms bright, 14 ms dark; output × 0.24; partials at 14 kHz or above are skipped.', source: 'Sfx.swift:387-413' }))
L.add(sec, link(bN))

// ---- The event map ---------------------------------------------------------------------------------------------
const bE = L.board({ name: 'Sound · The event map', kicker: 'SOUND', title: 'The event map', titleStyle: 'h1', w: 3000,
  lead: 'Every event that makes a sound (or deliberately doesn’t), with its gains, pans and delays, and the drone level it sets. Gain is the player’s volume (0–1) before the master 0.5.', tags: [['claude'], ['shipped']] })
const fmtSound = s => {
  let str = s.voice + ' ' + s.gain
  if (s.pan != null && s.pan !== 0) str += ', pan ' + s.pan
  if (s.t_s) str += typeof s.t_s === 'number' ? ' at +' + s.t_s + ' s' : ' — ' + s.t_s
  return str
}
const evRows = SP.events.map(e => ({ e: e.event, t: e.trigger, s: e.sounds.length ? e.sounds.map(fmtSound).join('\n') : 'silent', m: e.mood == null ? '' : String(e.mood), n: e.notes || '', src: e.source }))
L.add(bE, L.table([
  { key: 'e', label: 'Event', w: 230, style: 'smallStrong' }, { key: 't', label: 'Trigger', w: 380 },
  { key: 's', label: 'Sounds: voice, gain, pan, when', w: 860, style: 'code' }, { key: 'm', label: 'Drone (mood)', w: 330, style: 'code' },
  { key: 'n', label: 'Notes', w: 560 }, { key: 'src', label: 'Source', w: 330, style: 'code' },
], evRows, { zebra: true, name: 'Event map' }))
L.add(bE, L.row([
  titled('The drone’s levels', [L.table([
    { key: 'l', label: 'Level', w: 280, style: 'codeStrong' }, { key: 'w', label: 'When', w: 620 }, { key: 's', label: 'Source', w: 330, style: 'code' },
  ], SP.mood.levels.map(x => ({ l: String(x.level), w: x.when, s: x.source })), { zebra: true, name: 'Mood levels' })],
    { w: 1300, lead: 'Every change eases: level += (target − level) × 0.035 every 33 ms (time constant about 0.93 s, 95% in about 2.8 s). ramp() is a smoothstep between two bounds.', source: 'Sfx.swift:221-242; Palette.swift:130-133' }),
  titled('Behaviours', [L.specs(SP.behaviours.map(b => [b.name, b.rule, b.source]), { w: 1200, keyW: 200, name: 'Behaviours' })], { w: 1200 }),
], { gap: 80, align: 'MIN', name: 'Levels and behaviours' }))
L.add(sec, link(bE))

L.fit(sec)
await L.arrange('Design system')
const res = []
for (const b of [bN, bE]) res.push(await L.snap(b, 'pages/sound/' + b.name.replace(/[^\w]+/g, '-').toLowerCase() + '.png', { scale: 0.3, wait: 300 }))
return res
