#!/usr/bin/env python3
"""Write assets/sound/sound-spec.json and assets/sound/manifest.json from mksound's facts,
make_assets.py's items and loudness, and the event map read from the app's sources."""
import json, math, os

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = '/Users/akashkhanikor/tarot/design/figma/assets'
OUT = os.path.join(ASSETS, 'sound')
facts = json.load(open(os.path.join(HERE, 'native', 'facts.json')))
items = json.load(open(os.path.join(HERE, 'tmp', 'items.json')))
loud = json.load(open(os.path.join(HERE, 'tmp', 'loudness.json')))['loudness']
dry = {d['name']: d for d in facts['dry']}
r3 = lambda x: round(x, 3)

def files(prefix):
    return [f'sound/wav/{n}.wav' for n in sorted(loud) if n.startswith(prefix)]

# ------------------------------------------------------------ voice stealing, from the renders
DUR = {'bowl bright': 5.5, 'bowl dark': 6.5, 'chime': 1.7, 'chord': 6.5, 'tick': 0.06, 'slide': 0.30,
       'thud': 0.26, 'riffle': 0.737}
def dur(voice):
    if voice.startswith('chord'):
        return 6.5 if 'reversed' in voice else 5.5
    return next(v for k, v in DUR.items() if voice.startswith(k))
steals = []
for n in sorted(loud):
    if not n.startswith('seq-') or n.endswith('-intended'):
        continue
    cues = json.load(open(os.path.join(OUT, 'sequences', n + '.json')))['cues']
    last = {}
    for c in cues:
        if c['what'] != 'sound':
            continue
        p = c['player']
        if p in last:
            prev = last[p]
            age = c['t'] - prev['t']
            if age < dur(prev['voice']):
                steals.append({'render': n, 't': c['t'], 'player': p, 'new': c['voice'], 'cut': prev['voice'],
                               'cut_at_age_s': r3(age), 'of_s': dur(prev['voice'])})
        last[p] = c

# ------------------------------------------------------------ the spec
spec = {
    'title': 'Arcana: the sound',
    'about': ("Everything is synthesised at launch from code: no sample files, one binary (Sfx.swift:3-10). Two rooms: "
              "the hand (card stock, the table) in a small room and the air (bowls, chimes, the swell) in a cathedral. "
              "Under both, a drone that breathes in step with the light of the sky. Every value here is read from the "
              "source and, where marked 'computed', produced by the app's own functions (Synth, Rng, Spread) in "
              "design/figma/render/sound/main.swift."),
    'sources': ['Sources/Arcana/Sfx.swift', 'Sources/Arcana/Game.swift', 'Sources/Arcana/Keeping.swift',
                'Sources/Arcana/Deck.swift:26-50', 'Sources/Arcana/RootView.swift:41', 'Sources/Arcana/Ink.swift:10-24 (Rng)'],
    'format': {'sample_rate_hz': 44100, 'channels': 2, 'sample': '32-bit float, deinterleaved (AVAudioFormat standard)',
               'source': 'Sources/Arcana/Sfx.swift:27, 371',
               'hand_off_files': '48 kHz 24-bit WAV, resampled from the 44.1 kHz buffers with afconvert (mastering-grade SRC). '
                                 'The noise voices use per-sample filters, so they were not re-synthesised at 48 kHz.'},
    'graph': {
        'master': {'value': 0.5, 'what': 'mainMixerNode.outputVolume', 'source': 'Sfx.swift:25, 96'},
        'air': {'what': 'bowls, chimes, chords, the swell', 'bus': '12 AVAudioPlayerNodes -> airBus (mixer) -> hall',
                'reverb': 'AVAudioUnitReverb factory preset .cathedral, wetDryMix 42', 'source': 'Sfx.swift:64-65, 69-70, 74, 76-81'},
        'hand': {'what': 'tick, slide, thud, riffle', 'bus': '6 AVAudioPlayerNodes -> handBus (mixer) -> room',
                 'reverb': 'AVAudioUnitReverb factory preset .mediumRoom, wetDryMix 12', 'source': 'Sfx.swift:66-67, 71-72, 82-87'},
        'drone': {'what': 'the drone loop', 'path': 'its own player -> main mixer, dry (no reverb)', 'volume': 'the mood level',
                  'source': 'Sfx.swift:73'},
        'swell': {'what': 'the held question', 'path': 'its own player -> airBus (so into the cathedral)', 'volume': 0.55,
                  'source': 'Sfx.swift:74, 290'},
        'voice_allocation': ("Every cue picks the next player of its bus round robin (12 air, 6 hand); the sound replaces "
                             "whatever that player was still playing (.interrupts). The cue's gain becomes the player's "
                             "volume (clamped 0-1) and its pan the player's pan, set just before the buffer is scheduled."),
        'voice_allocation_source': 'Sfx.swift:76-87, 324-338',
        'levels_note': ("A landing bowl peaks around -20 dBFS before reverb (buffer x0.24, gain 0.5, master 0.5); the drone at "
                        "rest peaks around -21 dBFS. The room is quiet by design; measured loudness per file is in manifest.json."),
    },
    'voices': [],
    'notes': {},
    'mood': {
        'what': "The drone's level ('mood'), 0-1. Every change eases: level += (target - level) x 0.035 every 33 ms "
                "(time constant ~0.93 s, 95% in ~2.8 s); the loop stops once within 0.001.",
        'source': 'Sfx.swift:221-242',
        'levels': [
            {'level': 0.42, 'when': 'rest: launch, after esc, after the return, the moon door closed, turning a kept page (not with Reduce Motion)',
             'source': 'RootView.swift:41; Game.swift:369, 737; Keeping.swift:242, 260'},
            {'level': '0.42 + 0.5 x charge (to 0.92)', 'when': 'holding the question; falls as the charge drains', 'source': 'Game.swift:266-267'},
            {'level': 0.62, 'when': 'the cut, through the draw', 'source': 'Game.swift:413'},
            {'level': 0.78, 'when': 'all cards written (the reading); the altar closed; a kept reading remembered', 'source': 'Game.swift:492, 673; Keeping.swift:306, 456'},
            {'level': 0.6, 'when': 'a card opened full size on the altar (table or kept)', 'source': 'Game.swift:666; Keeping.swift:299'},
            {'level': '0.78 - 0.48 x ramp(L, 0.08, 1) (to 0.30)', 'when': 'holding to return the cards', 'source': 'Game.swift:335'},
            {'level': '0.42 + 0.36 x ramp(R, 0.05, 1) (to 0.78)', 'when': "holding to remember a kept reading", 'source': 'Keeping.swift:439'},
        ],
        'ramp': 'ramp(x, a, b) = smoothstep of clamp01((x - a)/(b - a)) (Palette.swift:130-133)',
    },
    'events': [],
    'behaviours': [],
    'known_issues': [],
    'renders': {},
}

# --- voices
bowl_tables = facts['bowls']
spec['voices'].append({
    'id': 'bowl-bright', 'name': 'Singing bowl, bright (an upright card)', 'source': 'Sfx.swift:387-413',
    'duration_s': 5.5, 'bus': 'air',
    'recipe': {
        'partials': [{'ratio': r, 'amp': a, 'decay_per_s': d, 'beat_hz': b}
                     for r, a, d, b in zip([1, 2.0, 2.71, 4.13, 5.40], [1, 0.12, 0.40, 0.15, 0.10],
                                           [0.55, 1.4, 1.1, 2.1, 2.9], [1.0, 1.6, 2.3, 3.2, 3.9])],
        'each_partial': ("two sines at f - beat/2 and f + beat/2 with envelope amp x e^(-decay x t); the lower twin leans "
                         "left (0.64 L / 0.36 R), the upper right (0.36 / 0.64), so the beating moves between the ears; "
                         "start phases from Rng(midi x 7 + 1), the upper twin's phase x 1.7"),
        'strike': "1 - e^(-t / 3 ms)", 'output': 'x 0.24', 'drop': 'partials at or above 14 kHz are skipped',
        'end': 'the buffer stops at 5.5 s with no release',
    },
    'notes_made': sorted({b['note'] for b in bowl_tables if b['voice'] == 'bright' and b['midi'] != 79}),
    'tables': [b for b in bowl_tables if b['voice'] == 'bright'],
    'files': files('dry-bowl-bright') + ['sound/wav/room-bowl-bright-g4.wav'],
})
spec['voices'].append({
    'id': 'bowl-dark', 'name': 'Singing bowl, dark (a reversed card: an octave down)', 'source': 'Sfx.swift:387-413',
    'duration_s': 6.5, 'bus': 'air',
    'recipe': {
        'partials': [{'ratio': r, 'amp': a, 'decay_per_s': d, 'beat_hz': b}
                     for r, a, d, b in zip([1, 2.0, 2.71, 4.13, 5.40], [1, 0.10, 0.20, 0.05, 0.025],
                                           [0.40, 1.0, 0.9, 1.7, 2.3], [0.6, 1.0, 1.7, 2.3, 2.9])],
        'each_partial': 'as the bright bowl; start phases from Rng(midi x 7 + 3)',
        'strike': "1 - e^(-t / 14 ms)", 'output': 'x 0.24', 'end': 'the buffer stops at 6.5 s with no release',
    },
    'notes_made': sorted({b['note'] for b in bowl_tables if b['voice'] == 'dark'}),
    'tables': [b for b in bowl_tables if b['voice'] == 'dark'],
    'files': files('dry-bowl-dark') + ['sound/wav/room-bowl-dark-g3.wav', 'sound/wav/room-bowl-dark-c3-cut.wav'],
})
spec['voices'].append({
    'id': 'chord', 'name': 'The chord (the reading as one sound)', 'source': 'Sfx.swift:182-203', 'bus': 'air',
    'recipe': ("every card's bowl of the spread (its note; an octave down and dark if reversed) summed into one buffer as "
               "long as the longest part, each part x 1/sqrt(n) (1 card 1.0, 3 cards 0.577, 5 cards 0.447), fired on one "
               "air player, centred (each bowl keeps its own L/R beating)"),
    'files': files('dry-chord') + ['sound/wav/room-chord-three-fates.wav', 'sound/wav/room-chord-long-road.wav'],
})
spec['voices'].append({
    'id': 'chime', 'name': 'Ribbon chime (the fan as a harp)', 'source': 'Sfx.swift:415-429', 'duration_s': 1.7, 'bus': 'air',
    'recipe': {'wave': 'sin(f) + 0.16 sin(2f) e^(-3t) + 0.06 sin(2.76f) e^(-7t)',
               'envelope': 'e^(-2.8t) x (1 - e^(-t / 2.5 ms))', 'output': 'x 0.22 x tame, tame = 1 / max(1, sqrt(f / 400))',
               'channels': 'mono (L = R), panned by the player'},
    'scale': 'C major pentatonic, C4 to A6 (Synth.chimeScale)',
    'tables': facts['chimes'],
    'files': files('dry-chime') + ['sound/wav/room-chime-06-c5.wav'],
})
spec['voices'].append({
    'id': 'drone', 'name': 'The drone', 'source': 'Sfx.swift:431-460', 'duration_s': 20, 'bus': 'dry, straight to the main mixer',
    'recipe': {'voices': facts['drone'],
               'harmonic_amps': [1, 0.5, 0.28, 0.14],
               'loop': 'every frequency rounded to a multiple of 0.05 Hz, so every partial completes whole cycles in 20 s: a seamless loop',
               'right_channel': 'every partial + 0.15 Hz (a 6.7 s beating that moves between the ears)',
               'breath': "b = 0.5 - 0.5 cos(2 pi t / 10); the upper three voices x (0.72 + 0.28 b), the root steady",
               'output': 'x 0.36',
               'playback': ("starts at (wall-clock seconds mod 10) into the loop so it breathes with the sky's light "
                            "(Sfx.swift:144-154); started once all long voices are made; re-phased on unmute, return to "
                            "view and audio route change")},
    'files': ['sound/wav/dry-drone-loop.wav'],
})
spec['voices'].append({
    'id': 'swell', 'name': 'The swell (the held question)', 'source': 'Sfx.swift:462-486', 'duration_s': 3.7, 'bus': 'air (own player, volume 0.55)',
    'recipe': {'partials': [{'note': n, 'amp': a, 'detune_hz': d} for n, a, d in
                            zip(['C4', 'G4', 'C5', 'E5', 'G5', 'C6'], [0.30, 0.22, 0.18, 0.12, 0.10, 0.07],
                                [0.8, 1.15, 1.5, 1.85, 2.2, 2.55])],
               'detune': 'left f - d/2, right f + d/2',
               'rise': '(t / 3.2)^2.2 for t < 3.2 s, then e^(-7 (t - 3.2)) for the 0.5 s tail',
               'tremolo': '1 + 0.22 sin(2 pi (3 + 4 min(t, 3.2) / 3.2) t): the rate quickens over the hold',
               'wind': 'independent L/R white noise (Rng 301 / 302) through a one-pole low-pass, coefficient 0.015 + 0.10 x min(t, 3.2)/3.2 (about 106 Hz opening to about 857 Hz)',
               'mix': '(tones x 0.34 + wind x 0.5) x rise x tremolo x 0.5',
               'playback': 'a new press starts charge x 3.2 s into the buffer (Sfx.swift:284-293); let go: fades 0.35 s; the cut: fades 0.5 s (linear, 20 ms steps)'},
    'files': ['sound/wav/dry-swell.wav', 'sound/wav/room-swell.wav'],
})
for vid, name, src, d, recipe, f in [
    ('tick', 'Tick', 'Sfx.swift:90, 488-499', 0.06,
     'noise(dur 0.06, decay 62, cutoff 0.32, bite 0.5): white noise (Rng 77) and a one-pole low-pass of it (coefficient 0.32, about 2.7 kHz) mixed 50/50, envelope e^(-62t) x (1 - e^(-t / 2 ms)), x 0.5; mono',
     ['sound/wav/dry-tick.wav', 'sound/wav/room-tick.wav']),
    ('slide', 'Slide', 'Sfx.swift:91, 488-499', 0.30,
     'noise(dur 0.30, decay 14, cutoff 0.10, bite 0.18): 82% low-passed noise (coefficient 0.10, about 740 Hz) + 18% white (Rng 77), envelope e^(-14t) x (1 - e^(-t / 2 ms)), x 0.5; mono',
     ['sound/wav/dry-slide.wav', 'sound/wav/room-slide.wav']),
    ('thud', 'Thud (land)', 'Sfx.swift:92, 501-512', 0.26,
     'low-passed noise (Rng 1031, coefficient 0.06, about 434 Hz) x e^(-18t) x 0.7 + a 92 Hz sine body x e^(-26t) x 0.35, all x 0.8; mono',
     ['sound/wav/dry-thud.wav', 'sound/wav/room-thud.wav']),
    ('riffle', 'Riffle (the cut)', 'Sfx.swift:93, 514-535', facts['riffle_seconds'],
     'eleven onsets (gaps 28 + 42 x Rng(515) ms), envelope max over onsets of e^(-70 (t - onset)), on low-passed noise (Rng 909, coefficient 0.4, about 3.6 kHz), x 0.34, then a 0.2 s tail; mono',
     ['sound/wav/dry-riffle.wav', 'sound/wav/room-riffle.wav']),
]:
    v = {'id': vid, 'name': name, 'source': src, 'duration_s': r3(d), 'bus': 'hand', 'recipe': recipe, 'files': f}
    if vid == 'riffle':
        v['onsets_s'] = [r3(x) for x in facts['riffle_onsets_s']]
    spec['voices'].append(v)
for v in spec['voices']:
    for f in v['files']:
        n = f.split('/')[-1][:-4]
        if n in dry:
            v.setdefault('measured', {})[n] = {'peak_dbfs': round(dry[n]['peak_dbfs'], 1),
                                                'buffer_end_vs_loudest_20ms_db': round(dry[n]['end_vs_loudest_20ms_db'], 1)}

spec['notes'] = {
    'what': ("Each spread position has a note, all from one C major pentatonic, so any spread is a consonant chord. An "
             "upright card sounds its note on the bright bowl; a reversed card an octave under on the dark bowl. MIDI 69 = "
             "A4 = 440 Hz, equal temperament."),
    'source': 'Deck.swift:32-50; Sfx.swift:112-120',
    'spreads': facts['spreads'],
    'question_bowl': {'note': 'C3 dark', 'hz': 130.8127826502993,
                      'when': 'the cut (0.55), a written question read back (0.3), forgetting a kept reading (0.22)'},
    'slot_pan': 'pan = (slot / (n - 1) x 2 - 1) x 0.55; 1 card 0 (Game.swift:656-658; Keeping.swift:406-408)',
    'synthesised_at_launch': 'the spread notes (G3 C4 D4 E4 G4 A4 E5) bright, their octaves down dark (G2 C3 D3 E3 G3 A3 E4), dark C3 (Sfx.swift:112-120)',
}

E = spec['events']
def ev(name, trigger, sounds, mood=None, source='', notes=''):
    e = {'event': name, 'trigger': trigger, 'sounds': sounds, 'source': source}
    if mood is not None:
        e['mood'] = mood
    if notes:
        e['notes'] = notes
    E.append(e)
def s(voice, gain, t=0, pan=0, bus=None):
    return {'t_s': t, 'voice': voice, 'gain': gain, 'pan': pan}
ev('Launch', 'the app appears', [], mood='eases 0 -> 0.42 once the drone buffer is ready ("the room is never silent")',
   source='RootView.swift:41; Sfx.swift:127, 138')
ev('Choose a spread', 'left/right or 1/2/3 before the ask', [s('tick', 0.45)], source='Game.swift:171-176')
ev('Hold to ask', 'press and hold anywhere, or hold space/return', [s('swell', 0.55)],
   mood='0.42 + 0.5 x charge (to 0.92 over the 3.2 s hold)', source='Game.swift:194-203, 266-267',
   notes='The swell starts at the current charge; not with Reduce Motion. A haptic pulse at half.')
ev('Let go early', 'release before the charge completes', [], mood='follows the charge down (it drains at 2x)',
   source='Game.swift:219-233', notes='The swell fades over 0.35 s.')
ev('The cut', 'the charge reaches 1', [s('riffle', 0.8), s('bowl dark C3', 0.55)], mood=0.62,
   source='Game.swift:379-416', notes='The swell fades over 0.5 s (its own 0.5 s tail also plays). Haptic land.')
ev('Sweep the ribbon', 'hover or arrow along the dealt fan', [s('chime (by position)', 0.11, pan='(i/(n-1) x 2 - 1) x 0.7')],
   source='Game.swift:418-425; Sfx.swift:205-219', notes='See behaviours: the harp.')
ev('Take a card', 'click, or space on a hovered card',
   [s('slide', 0.45), s('thud', 0.4, t=0.32), s("the position's bowl (dark, octave down, if reversed)", 0.5, t=0.42, pan='slot pan')],
   source='Game.swift:457-488',
   notes='The flip starts at +0.16 s (0.5 s), the flash and ink at +0.46 s (2.1 s); As Above begins at +2.56 s for a sky card, silently. Haptic tap.')
ev('The reading begins', 'the last card written (+2.1 s + 0.35 s)', [], mood=0.78, source='Game.swift:489-494')
ev('The recital', '0.9 s after the reading begins',
   [s('bowl dark C3 (only if a question was written)', 0.3), s("each line's bowl, 1.45 s apart (0.15 s with Reduce Motion)", 0.26, t='after 1.8 s (0.5 s RM) if a question was read, else 0', pan='slot pan'),
    s('the chord', 0.34, t='1.45 s after the last line')],
   source='Game.swift:501-535', notes='Light runs the thread with the chord.')
ev('Open a card on the altar', 'click a drawn card', [s('tick', 0.35), s("that card's bowl", 0.3, pan='slot pan')], mood='0.6; closing: 0.78',
   source='Game.swift:660-675')
ev('The thread is found', 'OpenAI returns the thread', [s('the chord', 0.22)], source='Game.swift:689-699')
ev('Return the cards (hold)', 'press and hold after the chord',
   [s("each card's bowl as its sink window begins, last drawn first", 0.20, t='L >= window start (3 cards: L 0.30, 0.435, 0.57 of the 3.2 s hold)', pan='slot pan')],
   mood='0.78 - 0.48 x ramp(L, 0.08, 1) (to 0.30)', source='Game.swift:308-340',
   notes='Let go early and a bowl re-arms to sound again. Haptic pulse at half.')
ev('The cards go home', 'the return hold completes', [s('slide', 0.22), s('thud', 0.25, t=1.05)], mood='0.42 at +0.45 s',
   source='Game.swift:344-375', notes='The faces turn over (0.5 s); the table clears at +0.45 s. Haptic land.')
ev('esc / start over', 'esc after the draw', [s('slide', 0.35)], mood=0.42, source='Game.swift:731-743')
ev('The keys page', '? / cmd-/ / the key glyph', [s('slide', 0.16)], source='Game.swift:601-615', notes='Closing: slide 0.12.')
ev('Mute', 'm (outside a written question) or the bowl glyph', [], source='Game.swift:806-810; Sfx.swift:268-279',
   notes='Silent: the master fades over 240 ms (12 x 20 ms), then every player stops and the engine pauses. Not remembered between launches.')
ev('Unmute', 'm or the bowl glyph', [s('tick', 0.4)], mood='the drone restarts from 0 in step with the breath and eases to its level',
   source='Game.swift:806-810; Sfx.swift:253-267')
ev('The window unseen / seen', 'window hidden or screens asleep, then back', [], source='Game.swift:106; Sfx.swift:20-23, 248-281',
   notes='As mute and unmute, without the tick.')
ev("The moon's door opens", 'click the moon / up arrow', [s('slide', 0.22), s('bowl bright G5 (never sounds)', 0.12, t=0.1)],
   source='Keeping.swift:206-229', notes='Only the slide is heard: G5 is never synthesised (known issue).')
ev("The moon's door closes", 'esc / down / the moon', [s('slide', 0.25)], mood=0.42, source='Keeping.swift:231-242')
ev('Turn a kept page', 'left/right or the chevrons', [s('slide', 0.18)], mood='0.42 (not with Reduce Motion)', source='Keeping.swift:254-261')
ev('Remember (hold on a kept reading)', 'press and hold with the door open',
   [s("each card's bowl as its ink begins to rise, first drawn first", 0.20, pan='slot pan')], mood='0.42 + 0.36 x ramp(R, 0.05, 1) (to 0.78)',
   source='Keeping.swift:412-444')
ev('Remembered', 'the remember hold completes',
   [s("each line's bowl, 1.45 s apart (0.15 s RM)", 0.26, t='after 0.7 s (0.1 s RM)', pan='slot pan'), s('the chord', 0.34, t='after the last line')],
   mood=0.78, source='Keeping.swift:449-474', notes='Haptic land.')
ev('Kept altar', 'click a remembered card', [s('tick', 0.35), s("that card's bowl", 0.3, pan='slot pan')], mood='0.6; closing: 0.78',
   source='Keeping.swift:291-308')
ev('Forget a kept reading', 'cmd-delete', [s('bowl dark C3', 0.22)], source='Keeping.swift:176-189')
ev('As Above', "a sky card's answer in the sky", [], source='Answers.swift:28',
   notes="Silent by design: 'The sky has no voice of its own: nothing here sounds.'")
ev('Audio route change', 'AVAudioEngineConfigurationChange (e.g. headphones)', [], source='Sfx.swift:105-110, 156-166',
   notes='The engine restarts, the players resume and the drone is re-phased.')

spec['behaviours'] = [
    {'name': 'The ribbon as a harp', 'source': 'Sfx.swift:205-219; Game.swift:418-455',
     'rule': ("Card i of n (n = 78, the fan's order; taken cards leave gaps but positions stay) maps to x = i/(n-1) and "
              "note index round(x x 14), about 5.5 cards per note, low on the left. Pan (x x 2 - 1) x 0.7, gain 0.11. At "
              "most one chime per 35 ms; a sweep sounds each note once as the hand crosses into it; the same note again "
              "only when stepped by arrow key or more than 0.5 s after the last chime. Held arrows move about 4 cards per repeat."),
     'hear': 'sound/wav/seq-2-ribbon-sweep.wav'},
    {'name': 'Drone easing', 'source': 'Sfx.swift:229-242', 'rule': spec['mood']['what']},
    {'name': 'Mute and presence', 'source': 'Sfx.swift:18-23, 244-281',
     'rule': ("audible = enabled && present. Going inaudible: master fades 240 ms, every player stops, the engine pauses (the "
              "Mac may sleep). Returning: the engine restarts, the drone restarts at volume 0 in step with the breath and eases "
              "up, master back to 0.5 at once."), 'hear': 'sound/wav/seq-5-mute-unmute.wav'},
    {'name': 'Voice allocation', 'source': 'Sfx.swift:76-87, 324-338', 'rule': spec['graph']['voice_allocation']},
    {'name': 'Wall-clock keying', 'source': 'Sfx.swift:146; Chamber.swift:40-41',
     'rule': "The drone's phase follows the wall clock (seconds since the reference date, mod 10), so after the window has been away it resumes in step with the sky's breath."},
]

bright_ends = [round(dry[n]['end_vs_loudest_20ms_db'], 1) for n in dry if n.startswith('dry-bowl-bright') and 'unheard' not in n]
dark_ends = [round(dry[n]['end_vs_loudest_20ms_db'], 1) for n in dry if n.startswith('dry-bowl-dark')]
spec['known_issues'] = [
    {'issue': "The moon's door bell never sounds",
     'detail': ("Keeping.openDoor asks for a bright G5 bowl (MIDI 79) at 0.12 after 0.1 s, but only the spread notes, "
                "their dark octaves and dark C3 are ever synthesised, so toneBuffers[158] is nil and tone() returns. Only "
                "the slide is heard. The intended bowl is rendered as dry-bowl-bright-g5-unheard.wav."),
     'source': 'Keeping.swift:227; Sfx.swift:112-120, 177-178', 'hear': 'sound/wav/dry-bowl-bright-g5-unheard.wav'},
    {'issue': 'Abrupt buffer ends (no release)',
     'detail': (f"The bowls stop dead at 5.5 s (bright) and 6.5 s (dark) while still ringing: measured, the last 20 ms "
                f"of the bright bowls are {min(bright_ends)} to {max(bright_ends)} dB under their loudest 20 ms (it depends on "
                f"where the beating is), the dark bowls {min(dark_ends)} to {max(dark_ends)} dB; the chords likewise. The "
                f"tick's 60 ms buffer ends {round(dry['dry-tick']['end_vs_loudest_20ms_db'], 1)} dB down. The cathedral "
                f"tail carries on past the cut. A short fade at the end (or longer buffers) would remove it. Not checked by ear."),
     'source': 'Sfx.swift:394, 399, 90'},
    {'issue': '12-voice round robin (voice stealing)',
     'detail': ("Bowls, chimes and chords share 12 air players and each new sound interrupts the oldest. A fast sweep "
                "sounds 15 chimes in about 1.4 s, so the last ones take players whose chimes are still ringing; a sweep "
                "soon after a card lands or the cut can cut that 5.5-6.5 s bowl mid-ring. The renders show where it "
                "happens (below); the '-intended' renders are the same score without it."),
     'source': 'Sfx.swift:76-87, 331-337', 'in_the_renders': steals},
    {'issue': "Each sound's first ~23 ms starts at its player's previous gain",
     'detail': ("The per-sound gain is set as the player node's volume just before its buffer is scheduled; "
                "AVAudioMixerNode eases a volume change linearly over about 1024 frames (~23 ms at 44.1 kHz, measured "
                "offline in design/figma/render/sound/probe/ramp.swift). So the attack of a sound plays at the gain its "
                "player last had, gliding to its own. At launch every player is at 1.0, so the first sound on each of "
                "the 18 players starts at full gain; later, a quiet sound on a player last used loudly starts loud, and "
                "the other way round. It matters most for the hand sounds, whose energy is in their first 20-60 ms. The "
                "live engine uses the same mixer unit, so the app is expected to do the same; not checked by ear. The "
                "renders marked 'as the app plays it' include it; '-intended' ones do not."),
     'source': 'Sfx.swift:335-337'},
    {'issue': 'The hand sounds are identical every time',
     'detail': 'Fixed seeds (tick and slide share Rng 77; thud 1031; riffle 515/909): every tick, slide, thud and riffle is the same sample. A sound designer may want small variations.',
     'source': 'Sfx.swift:90-93, 490, 503, 516, 523'},
    {'issue': 'The drone at launch may come in partway',
     'detail': ('The drone starts only once all long voices are synthesised, and its ease toward 0.42 starts at init, so if '
                'synthesis takes longer than the ease the drone enters at a nonzero level rather than fading in. Not verified.'),
     'source': 'Sfx.swift:111-139'},
    {'issue': 'Restarting the swell',
     'detail': ('A new press stops the swell player at once (cancelling any 0.35 s fade in progress) and starts it at charge x '
                '3.2 s into the buffer. Rendered in seq-1b (let go at half, pressed again 0.4 s later at charge 0.25): the '
                'fade had finished and the swell is quiet at that point, so no click; a re-press within 0.35 s of letting go '
                'cuts the fading swell instantly.'),
     'source': 'Sfx.swift:284-308', 'hear': 'sound/wav/seq-1b-let-go-and-hold-again.wav'},
    {'issue': 'Mute is not remembered',
     'detail': 'Game.muted is not persisted: every launch starts with sound on. The keys page does not list m (a deliberate cut; the bowl glyph shows it).',
     'source': 'Game.swift:806-810; RootView.swift:224, 242, 264, 281'},
]

spec['renders'] = {
    'tool': 'design/figma/render/sound (see its README.md)',
    'dry': 'Synth buffers exactly as the app makes them (the app\'s own functions), resampled to 48 kHz 24-bit.',
    'room': "Offline AVAudioEngine (manual rendering) rebuilt from Sfx's graph: cathedral 42 / medium room 12, drone dry, master 0.5, 44.1 kHz inside like the app, resampled to 48 kHz after.",
    'sequences': ("Timed as Game times them. 'As the app plays it': the round-robin players with .interrupts and player "
                  "volumes carried through one session (launch -> ask and cut -> ribbon sweep -> three cards -> return -> "
                  "mute); seq-1b from its own fresh launch. '-intended': every sound on its own player at its exact gain and "
                  "sample. Sequence 0 s is the start of a breath of the drone (in the app it follows the wall clock). Onsets "
                  "fall within one 64-frame block (1.5 ms) of their times; renders are not bit-identical run to run for that reason."),
}
json.dump(spec, open(os.path.join(OUT, 'sound-spec.json'), 'w'), indent=1, ensure_ascii=False)

# ------------------------------------------------------------ manifest
for it in items:
    it.setdefault('pt', None)
    for k in ('px', 'scale', 'pt'):
        if it.get(k) is None:
            it.pop(k, None)
items.insert(0, {
    'file': 'sound/sound-spec.json', 'title': 'The sound, as a spec',
    'description': ('Every voice with its synthesis recipe (partials, ratios, amplitudes, decays, envelopes, seeds) and '
                    'computed note/Hz tables; the audio graph (rooms, reverbs, levels, players); the mood (drone) levels; '
                    'the full event map with gains, pans, delays and drone levels; behaviours (the harp, mute, easing); '
                    'known issues with measured evidence; how the files were rendered.'),
    'kind': 'json', 'vector': False, 'group': 'Sound — spec', 'order': 0,
    'source': 'Sources/Arcana/Sfx.swift; Sources/Arcana/Game.swift; Sources/Arcana/Keeping.swift; Sources/Arcana/Deck.swift:26-50',
    'states': '', 'figma_hint': 'a spec page: build the voice cards, note tables and event map natively from it',
    'caveats': 'Hand-transcribed recipes checked against Sfx.swift; tables and measurements are computed.'})
manifest = {
    'category': 'sound',
    'tool': ('cd /Users/akashkhanikor/tarot/design/figma/render/sound && ./run.sh   (compiles main.swift with '
             'Sources/Arcana/*.swift except ArcanaApp.swift into bin/mksound, renders native/ at 44.1 kHz, then '
             'make_assets.py converts to 48 kHz, draws the PNGs, measures loudness, and spec.py writes sound-spec.json '
             'and this manifest)'),
    'notes': ("The app's sound is synthesised in code (Sfx.swift). 'dry-*' WAVs are the raw Synth buffers from the app's "
              "own functions; 'room-*' are single voices through the rebuilt Sfx graph at their usual gain (no drone); "
              "'seq-*' are timed event sequences through the graph with the drone, both as the app plays them (round "
              "robin, interrupts, player-volume easing) and '-intended'. All WAVs are 48 kHz 24-bit stereo, resampled from "
              "the app's 44.1 kHz (the noise voices' filters are per-sample, so re-synthesising at 48 kHz would change "
              "them). Loudness per WAV is in each item's 'loudness' (EBU R128 integrated/momentary max/LRA/true peak and "
              "sample peak/RMS, measured on the 48 kHz file; dry files are at synth level, before gain and master 0.5). "
              "PNGs are @2x data pictures (2400 x 600 px = 1200 x 300 pt) on pearl #F9F7F2 with no text, for native "
              "labels. Figma cannot play audio: link the WAVs. Nothing was played aloud; no user data was touched."),
    'items': items,
}
json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1, ensure_ascii=False)
print('items', len(items), 'steals', len(steals))
