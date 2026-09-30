// Chapter: Sound, step 1 of 3 (header and files, what the sound is for and the graph, the voices). Clears the chapter.
//   node design/figma/bridge/run.mjs design/figma/build/pages/foundations-b-lib.js design/figma/build/pages/sound-1.js
const L = S.lib, F = S.fb
const sec = await L.chapter('Sound')
const P = 'sound/png/'
const MAN = JSON.parse(await text('sound/manifest.json')).items
const durOf = f => { const it = MAN.find(i => i.file === P + f + '-spectrum.png'); const m = it && /whole ([\d.]+) s/.exec(it.description || ''); return m ? +m[1] : null }
// a waveform or spectrogram with native axes (log frequency 40 Hz to 20 kHz; time across the whole file)
const pic = async (file, kind, w) => {
  const im = await L.img(P + file + '-' + kind + '.png', { w, r: 6, stroke: L.C.stroke, name: file + ' · ' + (kind === 'wave' ? 'waveform' : 'spectrogram') })
  const h = L.frame({ name: (kind === 'wave' ? 'Waveform · ' : 'Spectrogram · ') + file, w: im.width, h: im.height })
  h.appendChild(im)
  if (kind === 'spectrum') {
    const lh = Math.log(20000) - Math.log(40)
    for (const [f, lab] of [[10000, '10 kHz'], [1000, '1 kHz'], [100, '100 Hz']]) { const y = (Math.log(20000) - Math.log(f)) / lh * im.height; F.poly(h, [[0, y], [10, y]], { color: L.C.ink, alpha: 0.45, name: 'Tick' }); F.put(h, F.mono(lab, { size: 10, lh: 13, alpha: 0.6 }), 14, y - 6.5) }
  }
  const d = durOf(file)
  if (d) { const t = F.mono(d + ' s', { size: 10, lh: 13, alpha: 0.6 }); F.put(h, t, im.width - t.width - 8, im.height - 16) }
  return h
}

// ---- Header ------------------------------------------------------------------------------------------------
const head = L.board({ name: 'Sound · Header', kicker: 'FOUNDATIONS', title: 'Sound', w: 1600,
  lead: 'The room is never silent. Every sound is synthesised in code when the app launches (no sample files) and played in two rooms: the hand (card stock, the table) in a small room, the air (singing bowls, chimes, the held question) in a cathedral. Under both, a drone breathes with the sky.' })
L.add(head, F.intro(['What the sound is for', 'The voices', 'Notes in Hz', 'The event map', 'Sequences & loudness', 'Known issues']))
L.add(head, L.row([
  L.note({ w: 346, tags: ['fixed'], title: 'Figma can’t play audio', body: 'Every sound here has a WAV in the handoff kit, in design/figma/assets/sound/wav (48 kHz, 24-bit stereo). The pictures are waveforms and spectrograms of those files.' }),
  L.note({ w: 346, tags: ['measured'], title: 'Quiet by design', body: 'A landing bowl peaks around −20 dBFS before reverb, the drone at rest around −21 dBFS. Whole sequences measure −26 to −32 LUFS integrated.', source: 'Sfx.swift:25, 96' }),
  L.note({ w: 346, tags: ['claude', 'shipped'], title: 'Where it came from', body: 'The bowls that form a chord, the breathing drone and the chimes across the fan were built by Claude on 23 Sep and kept when Akash moved the app to first light.' }),
  L.note({ w: 346, tags: ['claude'], title: 'The sky has no voice', body: 'As Above is silent by design. From the code: “The sky has no voice of its own: nothing here sounds.”', source: 'Answers.swift:28' }),
], { gap: 24, name: 'Notes' }))
L.add(head, L.specs([
  ['dry-*.wav', '40 files. The raw buffers the app makes (its own Synth functions), before gain, reverb and the master: every bowl note, all 15 chimes, the chords, the drone loop, the swell and the hand sounds.'],
  ['room-*.wav', '11 files. Single voices through the rebuilt graph at their usual gain, without the drone: what one sound is like in the room.'],
  ['seq-*.wav', '11 files. Timed sequences through the graph with the drone, as the app plays them, and “-intended” without its voice-stealing and gain-glide faults.'],
  ['Pictures and data', 'sound/png: a waveform and a spectrogram per file (1200 × 300 pt). sound/sequences: cue lists. sound/sound-spec.json: every recipe, note, level and event. Rendered by design/figma/render/sound (its README says how).'],
], { w: 1456, keyW: 180, name: 'The files' }))
L.add(sec, head)

// ---- What the sound is for -------------------------------------------------------------------------------------
const bW = L.board({ name: 'Sound · What the sound is for', kicker: 'SOUND', title: 'What the sound is for', titleStyle: 'h1', w: 2400,
  lead: 'Three ideas, all in one C major pentatonic so nothing can clash.', tags: [['claude'], ['shipped']] })
const idea = async (title, body, img, cap, source) => L.col([
  L.text(title, 'h2', { w: 680 }), L.text(body, 'body', { w: 680 }),
  await pic(img.replace(P, '').replace(/-(spectrum|wave)\.png$/, ''), /spectrum/.test(img) ? 'spectrum' : 'wave', 680), L.text(cap, 'caption', { w: 680 }), L.source(source, { w: 680 }),
], { gap: 12, name: 'Idea · ' + title })
L.add(bW, L.row([
  await idea('A bowl for every card, and the reading as a chord', 'Each position in a spread has its note. An upright card sounds it on a bright singing bowl as it lands; a reversed card an octave lower on a dark one. When the verse is spoken each card sounds again, and then the whole spread rings together as one chord.', P + 'room-chord-three-fates-spectrum.png', 'Three Fates as a chord (C4 E4 G4) in the cathedral: room-chord-three-fates.wav, spectrogram.', 'Deck.swift:32-50; Sfx.swift:182-203; Game.swift:501-535'),
  await idea('The drone breathes with the room', 'Four low sines (C2 G2 C3 G3) on a seamless 20 s loop. The upper three swell on the sky’s 10 s breath, in step with the wall clock. Its level follows the ritual: 0.42 at rest, up to 0.92 while the question is held, 0.78 in the reading, down to 0.30 as the cards go back.', P + 'dry-drone-loop-wave.png', 'The drone loop, dry: dry-drone-loop.wav, waveform (20 s).', 'Sfx.swift:144-154, 221-242, 431-460'),
  await idea('The ribbon is a harp', 'Sweep the fanned deck and it plays: 15 chimes from C4 on the left to A6 on the right, about 5.5 cards to a note, panned across ±0.7. Each note sounds once as the hand crosses into it.', P + 'seq-2-ribbon-sweep-spectrum.png', 'A sweep across the fan: seq-2-ribbon-sweep.wav, spectrogram.', 'Sfx.swift:205-219; Game.swift:418-455'),
], { gap: 56, align: 'MIN', name: 'Three ideas' }))
// the graph, drawn
const G = L.frame({ name: 'Diagram · the audio graph', w: 2256, h: 420, fill: '#FFFFFF', fillA: 0.5, r: 14, stroke: L.C.stroke })
const box = (x, y, w, title, sub, fill = '#FFFFFF') => { const n = L.col([L.text(title, 'smallStrong', { w: w - 28 }), sub ? F.mono(sub, { w: w - 28 }) : null].filter(Boolean), { gap: 2, pad: [10, 14], w, fill, r: 10, stroke: L.C.stroke, name: 'Node · ' + title }); F.put(G, n, x, y); return n }
const ar = (a, b, o = {}) => L.arrow(G, a.x + a.width, a.y + a.height / 2 + (o.dy1 || 0), b.x - 4, b.y + b.height / 2 + (o.dy2 || 0), { alpha: 0.5 })
const hand = box(30, 40, 320, 'Hand sounds', 'tick · slide · thud · riffle', '#F3EDE0')
const hp = box(420, 40, 250, '6 hand players', 'round robin, .interrupts')
const hb = box(740, 40, 200, 'handBus', 'mixer')
const hr = box(1010, 40, 330, 'Medium room reverb', 'factory .mediumRoom · wet 12')
const air = box(30, 170, 320, 'Air sounds', 'bowls · chimes · chords', '#EAE4F8')
const ap = box(420, 170, 250, '12 air players', 'round robin, .interrupts')
const ab = box(740, 170, 200, 'airBus', 'mixer')
const ar2 = box(1010, 170, 330, 'Cathedral reverb', 'factory .cathedral · wet 42')
const sw = box(420, 290, 250, 'Swell player', 'the held question · 0.55')
const dr = box(1010, 300, 330, 'Drone player', 'volume = the mood (0–1), dry', '#E4EFE6')
const mm = box(1440, 150, 330, 'Main mixer', 'master 0.5 (outputVolume)', '#F6E2DF')
const out = box(1860, 150, 300, 'Output', '44.1 kHz stereo, float')
ar(hand, hp); ar(hp, hb); ar(hb, hr); ar(air, ap); ar(ap, ab); ar(ab, ar2); ar(ar2, mm); ar(dr, mm); ar(mm, out)
L.arrow(G, hr.x + hr.width, hr.y + hr.height / 2, mm.x - 4, mm.y + 12, { alpha: 0.5 })
L.arrow(G, sw.x + sw.width, sw.y + sw.height / 2, ab.x + 40, ab.y + ab.height + 2, { alpha: 0.5 })
F.put(G, L.text('Each cue takes the next player of its bus; the cue’s gain becomes the player’s volume and its pan the player’s pan, just before the buffer is scheduled.', 'caption', { w: 560 }), 1440, 290)
L.add(bW, L.col([L.text('The graph', 'h2'), G, L.source('Sfx.swift:25, 64-87, 96, 324-338', { w: 800 })], { gap: 12, name: 'Graph' }))
L.add(sec, bW)

// ---- The voices -------------------------------------------------------------------------------------------------
const bV = L.board({ name: 'Sound · The voices', kicker: 'SOUND', title: 'The voices', titleStyle: 'h1', w: 3200,
  lead: 'Ten voices make every sound in the app. Each picture is the voice as it is heard: through its room at its usual gain (the drone dry, as it plays). Waveform above; spectrogram below (log frequency, 40 Hz to 20 kHz, time across the whole file, ink = loudest).', tags: [['claude'], ['shipped']] })
const V = [
  ['Singing bowl, bright', 'an upright card', 'air · 5.5 s', 'Five partials (×1, 2, 2.71, 4.13, 5.4; amps 1, .12, .4, .15, .1), each a pair of sines beating 1–3.9 Hz, the lower twin left and the upper right, so the shimmer moves between the ears. 3 ms strike; decays 0.55–2.9 per s. Stops at 5.5 s with no release.', 'Lands 0.5 · line 0.26 · altar 0.3 · return 0.2 · remember 0.2 · in the chord', 'room-bowl-bright-g4', 'Sfx.swift:387-413'],
  ['Singing bowl, dark', 'a reversed card, an octave down', 'air · 6.5 s', 'The same bowl, softer above (amps 1, .1, .2, .05, .025), slower beating (0.6–2.9 Hz), a 14 ms strike. Dark C3 also marks the cut (0.55), a question read back (0.3) and forgetting a kept reading (0.22).', 'Reversed cards as above · the cut 0.55 · question 0.3 · forget 0.22', 'room-bowl-dark-g3', 'Sfx.swift:387-413'],
  ['The chord', 'the reading as one sound', 'air · as long as its longest bowl', 'Every card’s bowl of the spread summed into one buffer, each part × 1/√n (one card 1, three 0.577, five 0.447), on one air player, centred; each bowl keeps its own beating.', 'After the recital 0.34 · a thread found 0.22 · a kept reading remembered 0.34', 'room-chord-three-fates', 'Sfx.swift:182-203'],
  ['Ribbon chime', 'the fan as a harp', 'air · 1.7 s', 'sin(f) + 0.16 sin(2f) e^−3t + 0.06 sin(2.76f) e^−7t, envelope e^−2.8t with a 2.5 ms attack, tamed above 400 Hz by 1/√(f/400). Mono, panned by its player.', 'Hover or arrow along the fan 0.11', 'room-chime-06-c5', 'Sfx.swift:205-219, 415-429'],
  ['The drone', 'the room’s breath', 'dry · 20 s loop', 'C2 G2 C3 G3 (amps .3, .16, .12, .05), each with harmonics 1, .5, .28, .14. The right channel is 0.15 Hz higher (a 6.7 s beat between the ears). The upper three breathe 0.72 + 0.28 b. Every frequency is a multiple of 0.05 Hz, so the loop is seamless.', 'Always, at the mood level (0.30–0.92)', 'dry-drone-loop', 'Sfx.swift:431-460'],
  ['The swell', 'the held question', 'air, own player · 3.7 s', 'Six detuned partials (C4 G4 C5 E5 G5 C6) and a wind of L/R noise through a low-pass opening from ~106 to ~857 Hz. Rises (t/3.2)^2.2 over the hold with a tremolo quickening from 3 to 7 Hz, then a 0.5 s tail. A new press starts it at charge × 3.2 s.', 'Hold to ask 0.55 (not with Reduce Motion) · let go: fades 0.35 s · the cut: fades 0.5 s', 'room-swell', 'Sfx.swift:284-308, 462-486'],
  ['Tick', 'a small choice', 'hand · 0.06 s', 'White noise and its low-pass (≈2.7 kHz), 50/50, envelope e^−62t, 2 ms attack. Mono.', 'Spread chosen 0.45 · a card opened 0.35 · unmute 0.4', 'room-tick', 'Sfx.swift:90, 488-499'],
  ['Slide', 'card stock moving', 'hand · 0.3 s', '82% low-passed noise (≈740 Hz) and 18% white, envelope e^−14t. Mono.', 'Take 0.45 · home 0.22 · esc 0.35 · keys 0.16 / 0.12 · the door 0.22 / 0.25 · a page 0.18', 'room-slide', 'Sfx.swift:91, 488-499'],
  ['Thud', 'a card landing', 'hand · 0.26 s', 'Low-passed noise (≈434 Hz) e^−18t × 0.7 and a 92 Hz sine body e^−26t × 0.35, all × 0.8. Mono.', 'A card lands 0.4 · the cards home 0.25', 'room-thud', 'Sfx.swift:92, 501-512'],
  ['Riffle', 'the cut', 'hand · 0.74 s', 'Eleven onsets 28–70 ms apart, each e^−70 (t − onset), on noise low-passed at ≈3.6 kHz, then a 0.2 s tail. Mono.', 'The cut 0.8', 'room-riffle', 'Sfx.swift:93, 514-535'],
]
const cardsV = []
for (const [name, what, bus, recipe, heard, file, src] of V) {
  const IW = 820
  cardsV.push(L.row([
    L.col([
      L.text(name, 'h2', { w: 520 }), L.text(what, 'voiceSmall', { w: 520, color: L.C.gold }),
      F.mono(bus, { w: 520, alpha: 0.9, style: 'Medium' }),
      L.text(recipe, 'small', { w: 520 }),
      L.rich([['Heard  ', 'smallStrong'], [heard, 'small']], 'small', { w: 520, name: 'Heard' }),
      F.mono(`sound/wav/${file}.wav` + (file.startsWith('room-') ? `\nsound/wav/dry-${file.slice(5).replace(/-cut$/, '').replace(/chord-three-fates$/, 'chord-three-fates-upright')}.wav (dry)` : ''), { w: 520, alpha: 0.6 }),
      L.source(src, { w: 520 }),
    ], { gap: 8, name: 'Voice text' }),
    L.col([
      await pic(file, 'wave', IW),
      await pic(file, 'spectrum', IW),
    ], { gap: 8, name: 'Voice pictures' }),
  ], { gap: 32, align: 'MIN', pad: 24, fill: '#FFFFFF', fillA: 0.55, r: 16, stroke: L.C.stroke, name: 'Voice · ' + name }))
}
for (let i = 0; i < cardsV.length; i += 2) L.add(bV, L.row(cardsV.slice(i, i + 2), { gap: 40, align: 'MIN', name: 'Voices row ' + (i / 2 + 1) }))
L.add(sec, bV)

L.fit(sec)
await L.arrange('Design system')
const res = []
for (const b of [head, bW, bV]) res.push(await L.snap(b, 'pages/sound/' + b.name.replace(/[^\w]+/g, '-').toLowerCase() + '.png', { scale: 0.3, wait: res.length ? 600 : 2000 }))
return res
