#!/usr/bin/env python3
"""Turn mksound's native renders into the Figma hand-off assets.

native/*.wav (44.1 kHz float32, the app's own format)
  -> assets/sound/wav/*.wav      48 kHz 24-bit PCM (afconvert, mastering-grade SRC;
                                 the drone loop resampled circularly so it still loops)
  -> assets/sound/png/*-wave.png, *-spectrum.png   (ffmpeg showwavespic / showspectrumpic)
  -> assets/sound/sequences/*.json                 (cue lists of the event renders)
  -> assets/sound/sound-spec.json, manifest.json
Loudness (EBU R128 via ffmpeg ebur128, peaks/RMS via astats) is measured on the 48 kHz files.
Stdlib only; needs ffmpeg/ffprobe and macOS afconvert.
"""
import json, math, os, re, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
NATIVE = os.path.join(HERE, 'native')
ASSETS = '/Users/akashkhanikor/tarot/design/figma/assets'
OUT = os.path.join(ASSETS, 'sound')
WAV, PNG, SEQ = (os.path.join(OUT, d) for d in ('wav', 'png', 'sequences'))
TMP = os.path.join(HERE, 'tmp')
for d in (WAV, PNG, SEQ, TMP):
    os.makedirs(d, exist_ok=True)

PEARL, INK, GOLD = (0xF9, 0xF7, 0xF2), (0x26, 0x20, 0x1C), (0xC9, 0xA8, 0x2F)
W, H = 2400, 600  # PNG px; shown @2x as 1200 x 300 pt

def run(*a, **k):
    return subprocess.run(a, capture_output=True, text=True, check=True, **k)

facts = json.load(open(os.path.join(NATIVE, 'facts.json')))
dry_facts = {d['name']: d for d in facts['dry']}

# ---------------------------------------------------------------- convert
def convert(name):
    src = os.path.join(NATIVE, name + '.wav')
    dst = os.path.join(WAV, name + '.wav')
    if name == 'dry-drone-loop':
        # three laps, resampled, the middle one kept: the loop stays seamless
        three = os.path.join(TMP, 'drone-x3.wav')
        run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-i', src, '-i', src,
            '-filter_complex', '[0:a][1:a][2:a]concat=n=3:v=0:a=1', '-c:a', 'pcm_f32le', three)
        three48 = os.path.join(TMP, 'drone-x3-48.wav')
        run('afconvert', '-f', 'WAVE', '-d', 'LEI24@48000', '-r', '127', '--src-complexity', 'bats', three, three48)
        run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', three48,
            '-af', 'atrim=start_sample=960000:end_sample=1920000', '-c:a', 'pcm_s24le', dst)
        os.remove(three)
        os.remove(three48)
    else:
        run('afconvert', '-f', 'WAVE', '-d', 'LEI24@48000', '-r', '127', '--src-complexity', 'bats', src, dst)
    return dst

# ---------------------------------------------------------------- measure
def measure(path):
    dur = float(run('ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path).stdout)
    a = run('ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af',
            'astats=measure_perchannel=none:measure_overall=Peak_level+RMS_level', '-f', 'null', '-').stderr
    peak = float(re.search(r'Peak level dB: (-?[\d.]+|-inf)', a).group(1))
    rms = float(re.search(r'RMS level dB: (-?[\d.]+|-inf)', a).group(1))
    e = run('ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af',
            'apad=pad_dur=0.4,ebur128=peak=true:framelog=info', '-f', 'null', '-').stderr
    ms = [float(x) for x in re.findall(r'\bM:\s*(-?[\d.]+)', e)]
    summ = e[e.rfind('Summary:'):]
    I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', summ).group(1))
    lra = float(re.search(r'LRA:\s+(-?[\d.]+) LU', summ).group(1))
    tp = re.search(r'True peak:\s+Peak:\s+(-?[\d.]+|-inf)', summ)
    out = {
        'integrated_lufs': I if dur >= 0.4 and I > -70 else None,
        'momentary_max_lufs': round(max(ms), 1) if ms else None,
        'lra_lu': lra if dur >= 3 else None,
        'true_peak_dbtp': float(tp.group(1)) if tp else None,
        'sample_peak_dbfs': round(peak, 2),
        'rms_dbfs': round(rms, 2),
        'method': 'ffmpeg ebur128 (peak=true) and astats on the 48 kHz file; integrated only for files >= 0.4 s; '
                  'momentary max over 400 ms windows (0.4 s of silence appended so short sounds fit a window)',
    }
    return dur, out

# ---------------------------------------------------------------- pictures
def lut(i):
    # pearl -> gold (at 0.5) -> ink, on a 1.6 gamma so the quiet floor stays pearl
    stops = [(0, PEARL[i]), (0.5, GOLD[i]), (1, INK[i])]
    u = 'pow(val/255,1.6)'
    (a0, c0), (a1, c1), (a2, c2) = stops
    return (f"st(0,{u});if(lt(ld(0),{a1}),{c0}+({c1}-{c0})*ld(0)/{a1},{c1}+({c2}-{c1})*(ld(0)-{a1})/{1 - a1})")

def pictures(path, base, peak_db):
    g = -peak_db if peak_db > -200 else 0
    wave = os.path.join(PNG, base + '-wave.png')
    spec = os.path.join(PNG, base + '-spectrum.png')
    ink = '0x%02X%02X%02X' % INK
    pearl = '0x%02X%02X%02X' % PEARL
    run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', path, '-filter_complex',
        f'[0:a]volume={g:.3f}dB,showwavespic=s={W}x{H}:split_channels=1:colors={ink}|{ink}:scale=lin:draw=full:filter=peak[w];'
        f'color=c={pearl}:s={W}x{H},format=rgba[bg];[bg][w]overlay=format=auto,format=rgb24',
        '-frames:v', '1', wave)
    # tonal sounds: a long FFT (showspectrumpic sizes it from the picture's height, so the picture is
    # analysed 4x taller, then scaled down) so low partials resolve; the hand's short noises: a short one
    # so their clicks stay apart
    short = any(k in base for k in ('tick', 'slide', 'thud', 'riffle'))
    sh = H if short else 4 * H
    run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', path, '-filter_complex',
        f"[0:a]volume={g:.3f}dB,showspectrumpic=s={W}x{sh}:legend=0:mode=combined:color=intensity:saturation=0:"
        f"scale=log:fscale=log:start=40:stop=20000:drange=90:win_func=bharris,scale={W}:{H}:flags=area,"
        f"format=gray,format=rgb24,lutrgb=r='{lut(0)}':g='{lut(1)}':b='{lut(2)}'",
        '-frames:v', '1', spec)
    return wave, spec

# ---------------------------------------------------------------- words
spreads = facts['spreads']
def slots_for(note, reversed_):
    key = 'reversed' if reversed_ else 'upright'
    return [f"{s['name']}: {sl['slot']}" for s in spreads for sl in s['slots'] if sl[key] == note]

BOWL_WHEN = ('when a card lands (gain 0.5, panned by slot), when its line is spoken (0.26), when it is opened on the '
             'altar (0.3), as it sinks in the return (0.2), as it rises in a remembered reading (0.2) and inside the chord')
def describe(name):
    """(title, description, group, source, states, caveats) for a render."""
    f = dry_facts.get(name, {})
    if name.startswith('dry-bowl-'):
        note, dark = f['note'], f['voice'] == 'bowl-dark'
        hz = f"{f['hz']:.2f} Hz"
        if 'unheard' in name:
            return (f"Bowl, bright, {note} ({hz}) — never heard",
                    "The light bowl the moon's door asks for when it opens (Keeping.swift:227, gain 0.12 after 0.1 s). "
                    "The app never synthesises G5, so tone() finds no buffer and returns: in the app only the slide is "
                    "heard. Rendered here so the intended bell can be judged.",
                    'Sound — bowls (bright, upright cards)', 'Sources/Arcana/Sfx.swift:390-413; Sources/Arcana/Keeping.swift:227',
                    'not in the app', 'Known issue: never sounds (Sfx.swift:112-120 make only spread notes, their dark octaves and dark C3).')
        uses = slots_for(note, dark)
        if dark:
            extra = ''
            if note == 'C3':
                extra = (" Also 'the bowl the deck took the question on': the cut (0.55, centred), a written question "
                         "read back (0.3) and forgetting a kept reading (0.22).")
            return (f"Bowl, dark, {note} ({hz})",
                    f"The singing bowl in its dark, softer voice, an octave under the position's note: a reversed card. "
                    f"6.5 s, 14 ms strike, fundamental half-life 1.73 s. Reversed in: {', '.join(uses)}. Heard {BOWL_WHEN}.{extra}",
                    'Sound — bowls (dark, reversed cards)', 'Sources/Arcana/Sfx.swift:390-413',
                    'one fixed buffer, same every time', f"Ends abruptly at 6.5 s, {f['end_vs_loudest_20ms_db']:.0f} dB under its loudest 20 ms (no release).")
        return (f"Bowl, bright, {note} ({hz})",
                f"The struck singing bowl in its bright voice: an upright card. A pure fundamental and four inharmonic "
                f"partials (x2, 2.71, 4.13, 5.40), each split into a slowly beating twin pair leaning to opposite ears, so "
                f"the 'wah' of the metal moves. 5.5 s, 3 ms strike. Upright in: {', '.join(uses)}. Heard {BOWL_WHEN}.",
                'Sound — bowls (bright, upright cards)', 'Sources/Arcana/Sfx.swift:390-413',
                'one fixed buffer, same every time', f"Ends abruptly at 5.5 s, {f['end_vs_loudest_20ms_db']:.0f} dB under its loudest 20 ms (no release).")
    if name.startswith('dry-chime-'):
        c = facts['chimes'][f['index']]
        return (f"Ribbon chime {f['index'] + 1} of 15, {f['note']} ({f['hz']:.2f} Hz)",
                f"One string of the ribbon's harp: a sine with a soft octave and a faint 2.76x overtone, 1.7 s, 2.5 ms "
                f"attack, falling 2.8 per second. Sounds as the hand crosses the {c['ribbon_cards']} cards of the 78-card "
                f"fan that map to it (low on the left, high on the right), at gain 0.11, panned {c['pan_at_note_centre']:+.2f} "
                f"at its centre. Tamed x{c['tame']:.3f} so high notes are softer.",
                'Sound — ribbon chimes', 'Sources/Arcana/Sfx.swift:415-429; Sources/Arcana/Sfx.swift:205-219',
                'mono; one fixed buffer', 'Mono (L = R); the pan is applied by the player.')
    table = {
        'dry-drone-loop': ("The drone (20 s loop)",
            "The room's floor, 'never silent': C2, G2, C3 and G3, each with harmonics 1-4, the right ear 0.15 Hz higher so "
            "a 6.7 s beating crosses the head, the upper voices breathing 0.72-1.0 on a 10 s cycle in step with the sky's "
            "light. Loops seamlessly. Plays dry (no reverb) at the 'mood' level: 0.42 at rest, rising with a held question "
            "to 0.92, 0.62 after the cut, 0.78 in a reading, 0.6 at the altar, 0.30 as the cards return.",
            'Sound — the drone', 'Sources/Arcana/Sfx.swift:431-460; Sources/Arcana/Sfx.swift:141-154',
            'loops forever; level eased by mood', 'The app starts playback at (wall-clock seconds mod 10) into the loop.'),
        'dry-swell': ("The swell (the held question)",
            "3.7 s: an open C major chord (C4 G4 C5 E5 G5 C6, each detuned L/R) rising out of wind that opens from about "
            "106 Hz to 857 Hz, with a tremolo that quickens from 3 Hz; rise (t/3.2)^2.2, then a 0.5 s tail. Plays while "
            "the invocation is pressed and held (volume 0.55, into the cathedral); a new press picks it up at charge x 3.2 s.",
            'Sound — the question', 'Sources/Arcana/Sfx.swift:462-486; Sources/Arcana/Sfx.swift:283-308',
            'starts from the current charge; fades 0.35 s if let go, 0.5 s at the cut', 'Not played with Reduce Motion.'),
        'dry-tick': ("Tick",
            "60 ms of bright noise, 2 ms attack, falling fast: choosing a spread (0.45), opening a card on the altar "
            "(0.35) and unmuting (0.4).", 'Sound — the hand (card stock, the table)', 'Sources/Arcana/Sfx.swift:90, 488-499',
            'mono; identical every time (seed 77)', 'Shares its noise seed with the slide.'),
        'dry-slide': ("Slide",
            "0.3 s of card stock sliding: mostly low-passed noise (about 740 Hz). Taking a card (0.45), the cards going home "
            "(0.22), esc (0.35), the keys page (0.16 open / 0.12 close), the moon's door (0.22 / 0.25), turning a kept "
            "page (0.18).", 'Sound — the hand (card stock, the table)', 'Sources/Arcana/Sfx.swift:91, 488-499',
            'mono; identical every time (seed 77)', 'Shares its noise seed with the tick.'),
        'dry-thud': ("Thud (a card meeting the table)",
            "0.26 s: dark noise (about 434 Hz) with a 92 Hz body. A card landing face up (0.4) and the cards arriving home "
            "at the deck (0.25).", 'Sound — the hand (card stock, the table)', 'Sources/Arcana/Sfx.swift:92, 501-512',
            'mono; identical every time (seed 1031)', ''),
        'dry-riffle': ("Riffle (the cut)",
            "0.74 s: eleven quick ticks at uneven gaps (28-70 ms), the deck riffled as the held question completes (0.8), "
            "with the dark C3 bowl.", 'Sound — the hand (card stock, the table)', 'Sources/Arcana/Sfx.swift:93, 514-535',
            'mono; identical every time (seeds 515, 909)', ''),
    }
    if name in table:
        return table[name]
    if name.startswith('dry-chord-'):
        notes = ', '.join(f['notes'])
        spread = 'Three Fates' if 'three' in name else 'The Long Road'
        up = 'upright' in name
        return (f"Chord, {spread}, all {'upright' if up else 'reversed'}",
                f"Every bowl of the spread in one buffer ({notes}), each part x 1/sqrt(n): the reading heard as one chord. "
                f"Rung when light runs the thread at the end of the recital (0.34), when the thread is found (0.22) and when "
                f"a kept reading is remembered (0.34). "
                + ("All upright Three Fates is a C major triad." if spread == 'Three Fates' and up else
                   "All upright Long Road is G3-C4-D4-A4-E5 (C6/9)." if up else
                   "All reversed: every note an octave down in the dark voice."),
                'Sound — chords', 'Sources/Arcana/Sfx.swift:182-203', 'any mix of upright and reversed occurs; these are the two ends',
                'Mixed upright/reversed spreads combine the matching bright and dark bowls.')
    rooms = {
        'room-bowl-bright-g4': ("In the room: bright bowl G4 at 0.5",
            "The One Card landing bowl as it leaves the app: through the cathedral (42% wet), master 0.5, centred, no drone.",
            'Sources/Arcana/Sfx.swift:57-74, 324-338; Sources/Arcana/Game.swift:474-476'),
        'room-bowl-dark-g3': ("In the room: dark bowl G3 at 0.5",
            "The One Card landing bowl for a reversed card, through the cathedral, master 0.5, no drone.",
            'Sources/Arcana/Sfx.swift:57-74; Sources/Arcana/Game.swift:474-476'),
        'room-bowl-dark-c3-cut': ("In the room: dark bowl C3 at 0.55 (the cut)",
            "The low bowl the deck takes the question on, as at the cut, through the cathedral, master 0.5, no drone.",
            'Sources/Arcana/Game.swift:412; Sources/Arcana/Sfx.swift:57-74'),
        'room-chime-06-c5': ("In the room: chime C5 at 0.11",
            "One ribbon chime at its gain and its pan on the fan (-0.20), through the cathedral, master 0.5, no drone.",
            'Sources/Arcana/Sfx.swift:205-219'),
        'room-chord-three-fates': ("In the room: Three Fates chord at 0.34",
            "The all-upright C major chord at the end of the recital, through the cathedral, master 0.5, no drone.",
            'Sources/Arcana/Game.swift:531-534; Sources/Arcana/Sfx.swift:182-203'),
        'room-chord-long-road': ("In the room: Long Road chord at 0.34",
            "The all-upright five-card chord (C6/9) at the end of the recital, through the cathedral, master 0.5, no drone.",
            'Sources/Arcana/Game.swift:531-534; Sources/Arcana/Sfx.swift:182-203'),
        'room-swell': ("In the room: the swell at 0.55",
            "The whole held question, from rest to the end of its own tail, as if held to the cut but never faded, "
            "through the cathedral, master 0.5, no drone.", 'Sources/Arcana/Sfx.swift:283-293'),
        'room-tick': ("In the room: tick at 0.45", "Choosing a spread: the tick through the medium room (12% wet), master 0.5.",
            'Sources/Arcana/Game.swift:175'),
        'room-slide': ("In the room: slide at 0.45", "Taking a card: the slide through the medium room, master 0.5.",
            'Sources/Arcana/Game.swift:466'),
        'room-thud': ("In the room: thud at 0.4", "A card landing: the thud through the medium room, master 0.5.",
            'Sources/Arcana/Game.swift:473'),
        'room-riffle': ("In the room: riffle at 0.8", "The cut: the riffle through the medium room, master 0.5.",
            'Sources/Arcana/Game.swift:411'),
    }
    if name in rooms:
        t, d, src = rooms[name]
        return (t, d + ' Rendered in an offline AVAudioEngine rebuilt from Sfx (same reverb presets and mixes).',
                'Sound — voices in their rooms', src, 'as heard at full system volume',
                "Offline render of Apple's AVAudioUnitReverb presets; the player's gain is set before it plays (no gain ease).")
    return None

SEQS = {
    'seq-1-ask-and-cut': ("The ask and the cut",
        "Launch state, the room at rest (drone 0.42). At 1.5 s the invocation is pressed and held: the swell rises out of "
        "wind and the drone climbs with the charge (0.42 + 0.5 x charge). At 4.7 s the charge completes: the swell fades "
        "0.5 s, the riffle (0.8) and the dark C3 bowl (0.55) sound together and the drone settles to 0.62.",
        'Sources/Arcana/Game.swift:189-203, 236-268, 379-416; Sources/Arcana/Sfx.swift:283-308'),
    'seq-1b-let-go-and-hold-again': ("Letting go early, then holding again",
        "Pressed at 1.0 s, let go at 2.6 s at half charge: the swell fades 0.35 s and the charge drains at twice the speed, "
        "the drone following it down. Pressed again at 3.0 s (charge 0.25): the swell restarts 0.8 s into its buffer, "
        "where the gathered light is, and the hold completes at 5.4 s with the cut.",
        'Sources/Arcana/Game.swift:219-233; Sources/Arcana/Sfx.swift:284-308'),
    'seq-2-ribbon-sweep': ("The ribbon as a harp",
        "After the cut (drone 0.62): a fast sweep left to right across the 78-card fan in 1.4 s sounds each of the 15 "
        "notes once; a slow sweep back in 5 s; then eight arrow-key steps, each of which sounds even on the same note. "
        "Chimes at 0.11, panned -0.7 to +0.7 with the hand.",
        'Sources/Arcana/Sfx.swift:205-219; Sources/Arcana/Game.swift:418-455'),
    'seq-3-three-cards-and-chord': ("Three cards landing, the recital and the chord",
        "Three Fates, all upright, no written question, drone 0.62. Three cards taken 2.2 s apart: each a slide (0.45), a "
        "thud as it lands face up (0.4, +0.32 s) and its bowl (0.5, +0.42 s) panned where it lies (C4 left, E4 centre, G4 "
        "right). When the last card is written the drone rises to 0.78; 0.9 s later each line is spoken on its bowl (0.26) "
        "1.45 s apart, and then the whole spread rings as one C major chord (0.34).",
        'Sources/Arcana/Game.swift:457-535'),
    'seq-4-the-return': ("The return",
        "The reading lies open (drone 0.78). At 1.5 s the reader presses and holds to return the cards: the drone falls "
        "toward 0.30 and each card's bowl sounds (0.2) as it begins to sink, last drawn first (G4 right, E4, C4 left). At "
        "4.7 s the hold completes: the slide (0.22) as the faces turn over, the drone back to 0.42 as the table clears, "
        "and the thud (0.25) as the cards arrive at the deck.",
        'Sources/Arcana/Game.swift:291-375'),
    'seq-5-mute-unmute': ("Mute and unmute",
        "The room at rest (drone 0.42). At 4.0 s the bowl glyph (or m) mutes: the master fades out over 240 ms and every "
        "player stops (muting makes no sound of its own). At 7.0 s it is unmuted: the drone starts again from silence in "
        "step with the sky's breath and eases back to 0.42, and a tick (0.4) confirms.",
        'Sources/Arcana/Sfx.swift:244-281; Sources/Arcana/Game.swift:806-810'),
}

# ---------------------------------------------------------------- run
items = []
order = 0
def add(**k):
    global order
    order += 1
    k.setdefault('order', order)
    items.append(k)

names = sorted(n[:-4] for n in os.listdir(NATIVE) if n.endswith('.wav'))
def rank(n):
    groups = ['dry-bowl-bright', 'dry-bowl-dark', 'dry-chime', 'dry-chord', 'dry-drone', 'dry-swell', 'dry-tick',
              'dry-slide', 'dry-thud', 'dry-riffle', 'room-', 'seq-']
    g = next(i for i, p in enumerate(groups) if n.startswith(p))
    key = n
    if n.startswith('dry-bowl'):
        key = '%03d' % dry_facts[n]['midi'] + ('z' if 'unheard' in n else '')
    return (g, key)
names.sort(key=rank)

loud = {}
for n in names:
    path = convert(n)
    dur, L = measure(path)
    loud[n] = L
    wave, spec = pictures(path, n, L['sample_peak_dbfs'])
    if n.startswith('seq-'):
        base = n.replace('-intended', '')
        title, desc, src = SEQS[base]
        intended = n.endswith('-intended')
        cues = json.load(open(os.path.join(NATIVE, f'cues-{n}.json')))
        for c in cues['cues']:
            for k in ('gain', 'pan', 'level'):
                if k in c:
                    c[k] = round(c[k], 3)
        cues['file'] = f'sound/wav/{n}.wav'
        cues['note'] = ('t in seconds from the start of the file. "sound" cues give the voice, the bus (air = cathedral, hand = '
                        'medium room), the player gain and pan' + ('' if intended else ', and which of the 12 air / 6 hand '
                        'players it used') + '. Continuous drone moves are summarised as "mood ramp" cues.')
        json.dump(cues, open(os.path.join(SEQ, f'{n}.json'), 'w'), indent=1)
        group = 'Sound — event sequences'
        if intended:
            title += ' (as intended)'
            desc += (' AS INTENDED: every sound on a player of its own at its exact gain and time, with no voice stealing '
                     'and no gain easing — the score as written.')
            cav = 'Not what the app does sample for sample; see the as-the-app-plays-it render.'
        else:
            desc += (' AS THE APP PLAYS IT: the 12 air / 6 hand round-robin players carried over through one session '
                     '(launch, ask and cut, sweep, three cards, return, mute), each sound interrupting its player and '
                     'setting the player volume just before it plays.' if base != 'seq-1b-let-go-and-hold-again' else
                     ' AS THE APP PLAYS IT, from a fresh launch.')
            cav = ('The mixer eases each player-volume change over ~23 ms, so the first moments of a sound start from '
                   "that player's previous gain (measured offline; the app's live mixer is the same unit, not checked by ear).")
        states = 'drone breath phase: sequence 0 s = start of a breath (in the app it follows the wall clock)'
        add(file=f'sound/wav/{n}.wav', title=title, description=desc + ' Through the rebuilt Sfx graph: cathedral 42 / medium room 12, drone dry, master 0.5.',
            kind='wav', vector=False, group=group, source=src, states=states,
            figma_hint='audio file: show its waveform and spectrum strips side by side with the cue list as a timeline; link the WAV',
            caveats=cav + ' Onsets within one 64-frame block (1.5 ms) of their times; not bit-identical run to run.',
            seconds=round(dur, 3), loudness=L, sequence_cues=f'sound/sequences/{n}.json')
        add(file=f'sound/sequences/{n}.json', title=title + ' — cue list', kind='json', vector=False, group=group,
            description='Every cue of the render above with its time, voice, bus, gain and pan, for laying it out as a timeline.',
            source=src, states='', figma_hint='build a native timeline: one row per bus, a mark per sound, the mood as a line',
            caveats='Continuous moves (the drone following the charge or the return) are summarised as one "mood ramp" cue.')
    else:
        d = describe(n)
        title, desc, group, src, states, cav = d
        kind_note = ('Dry: the raw Synth buffer, before player gain, reverb and master.' if n.startswith('dry-') else '')
        add(file=f'sound/wav/{n}.wav', title=title, description=(desc + ' ' + kind_note).strip(), kind='wav', vector=False,
            group=group, source=src, states=states,
            figma_hint='audio file: link it from the voice card; show its waveform strip, spectrum strip beneath',
            caveats=(cav + ' 48 kHz 24-bit, resampled from the app\'s own 44.1 kHz buffer.').strip(),
            seconds=round(dur, 3), loudness=L)
    g = items[-1]['group'] if not n.startswith('seq-') else 'Sound — event sequences'
    wav_title = next(i['title'] for i in items if i['file'] == f'sound/wav/{n}.wav')
    for kind, p, what in (('wave', wave, 'Waveform'), ('spectrum', spec, 'Spectrogram')):
        rel = os.path.relpath(p, ASSETS)
        if kind == 'wave':
            dsc = (f'{what} of {n}.wav: left channel above, right below, ink #26201C on pearl #F9F7F2, linear amplitude '
                   f'normalised to the file\'s own peak ({L["sample_peak_dbfs"]:.1f} dBFS = full height), time across the '
                   f'whole {dur:.2f} s.')
        else:
            dsc = (f'{what} of {n}.wav (L+R combined): log frequency 40 Hz (bottom) to 20 kHz (top), time across the whole '
                   f'{dur:.2f} s; colour from pearl #F9F7F2 (below -90 dB of the file\'s peak) through gold #C9A82F to ink '
                   f'#26201C (loudest); Blackman-Harris window, ' + ('a short analysis window (analysed at 600 rows) so the clicks of the hand stay apart.' if any(k in n for k in ('tick', 'slide', 'thud', 'riffle')) else 'a long analysis window (analysed at 2400 rows, then scaled to 600) so the low partials resolve.'))
        add(file=rel, title=f'{wav_title} — {what.lower()}',
            description=dsc, kind='png', px=[W, H], scale=2, pt=[W // 2, H // 2], vector=False, group=g,
            source='design/figma/render/sound/make_assets.py (ffmpeg ' + ('showwavespic' if kind == 'wave' else 'showspectrumpic') + ')',
            states='', figma_hint=f'image, {W // 2} x {H // 2} pt, under the voice title; waveform above spectrogram; no labels baked in (set axes natively)',
            caveats='A picture of the file, not app UI. ' + ('Stereo split.' if kind == 'wave' else 'Short sounds (< 0.1 s) are smeared across few analysis windows.'))
    sys.stderr.write(f'  {n}\n')

# the drone still loops at 48 kHz? compare the seam with the middle
sys.stderr.write('assets done\n')
json.dump({'loudness': loud}, open(os.path.join(TMP, 'loudness.json'), 'w'), indent=1)
json.dump(items, open(os.path.join(TMP, 'items.json'), 'w'), indent=1)
