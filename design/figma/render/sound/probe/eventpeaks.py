import json, math, sys
sys.path.insert(0, 'probe')
from onsets import read
for name in sys.argv[1:]:
    cues = json.load(open(f'native/cues-{name}.json'))['cues']
    sr, (l, r) = read(f'native/{name}.wav')
    sr2, (l2, r2) = read(f'native/{name}-intended.wav')
    print(name)
    for c in cues:
        if c['what'] != 'sound': continue
        a = int(c['t'] * sr); b = a + int(0.03 * sr)
        p1 = max(max(abs(x) for x in l[a:b]), max(abs(x) for x in r[a:b]))
        p2 = max(max(abs(x) for x in l2[a:b]), max(abs(x) for x in r2[a:b]))
        print('  %6.3f %-28s %-8s gain %.2f  first 30 ms peak: app %6.1f dB  intended %6.1f dB  (%+.1f)' % (c['t'], c['voice'], c.get('player',''), c['gain'], 20*math.log10(p1), 20*math.log10(p2), 20*math.log10(p1/p2)))
