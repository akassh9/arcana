# Compiles the canonical design tokens (from the inventory critic) into assets/tokens/tokens.json.
import json, sys, re
INV = sys.argv[1]
OUT = sys.argv[2]
crit = json.load(open(INV + '/_critic.json'))

CODE = {
  'sky/pearl': 'Palette.pearl', 'sky/blue': 'Palette.skyBlue', 'sky/lilac': 'Palette.lilac', 'sky/rose': 'Palette.rose',
  'sky/dawn': 'Palette.dawn', 'shade/warm': 'Palette.shade', 'ink/text': 'Palette.text', 'gold/ink': 'Palette.goldInk',
  'gold/metal': 'Palette.gold', 'gold/light': 'Palette.goldLit', 'gold/deep': 'Palette.goldDeep', 'card/paper': 'Palette.paper',
  'card/back-stock': 'Palette.backStock', 'card/ink': 'Palette.ink', 'card/oxblood': 'Palette.blood', 'card/candle': 'Palette.candle',
  'icon/void': 'Palette.void',
}
colors = []
for c in crit['canonical_colors']:
  name = c['name']
  code = CODE.get(name)
  m = re.match(r'(ink/text|gold/ink)-(\d+)$', name)
  if m:
    base = CODE[m.group(1)]
    code = f"{base}.opacity(0.{m.group(2)})" if len(m.group(2)) == 2 else base
  if name.startswith('gold/leaf-'):
    code = 'Palette.leaf stop ' + name.split('-')[1]
  colors.append({'name': name, 'hex': c['hex'].upper(), 'alpha': float(c.get('alpha') if c.get('alpha') is not None else 1), 'usage': c.get('usage', ''), 'source': c.get('source', ''), 'code': code or ''})

RATIO = {'Regular': 1.240, 'Italic': 1.232, 'Bold': 1.263}
types = []
for t in crit['canonical_type']:
  fam = t['family']
  face = t['face']
  if 'Didot' in fam:
    style = 'Bold' if face.startswith('Bold') else ('Italic' if 'Italic' in face else 'Regular')
    figfam = 'Didot'
  else:
    style, figfam = 'Regular', 'SF Pro'
  size = float(t['size'])
  lh = round(size * RATIO.get(style, 1.2))
  case = t.get('case', '')
  upper = case.startswith('uppercase') or 'roman capitals' in case
  types.append({'name': t['name'], 'family': figfam, 'style': style, 'size': size, 'lh': lh, 'lsPx': float(t.get('tracking') or 0), 'upper': upper,
                'case': case, 'usage': t.get('usage', ''), 'source': t.get('source', ''), 'face_note': face})

# Glows and shadows. SwiftUI's shadow radius is about half a Figma blur, so blur = 2 x radius.
def glow(name, color, alpha, r, usage, source, x=0, y=0):
  return {'name': name, 'color': color, 'alpha': alpha, 'swiftui_radius': r, 'figma_blur': 2 * r, 'x': x, 'y': y, 'usage': usage, 'source': source}
effects = [
  glow('Glow/Title — ARCANA', '#ECCE6E', 0.55, 22, 'The wordmark ARCANA', 'RootView.swift:1038'),
  glow('Glow/Keys title — THE KEYS', '#ECCE6E', 0.45, 14, 'Keys page title', 'Legend.swift:113'),
  glow('Glow/Altar name', '#ECCE6E', 0.45, 16, 'Card name on the altar', 'RootView.swift:1470'),
  glow('Glow/Held question', '#ECCE6E', 0.90, 14, 'Invitation / question at full charge (grows 0 → 0.9 with the hold)', 'RootView.swift:832, 950'),
  glow('Glow/Verse lit', '#ECCE6E', 0.90, 12, 'The verse line being read (live and kept)', 'RootView.swift:1224; Keeping.swift:832'),
  glow('Glow/Thread question', '#ECCE6E', 0.60, 12, "The thread's question (live and kept)", 'RootView.swift:1356; Keeping.swift:876'),
  glow('Glow/Thread end diamond', '#ECCE6E', 1.00, 5, "The diamond at the thread's end", 'RootView.swift:1348'),
  glow('Glow/Spread pips chosen', '#ECCE6E', 0.90, 4, 'Pips of the chosen spread', 'RootView.swift:1100'),
  glow('Glow/Glyph lit', '#ECCE6E', 0.80, 6, 'Lit key glyph; chevrons on hover', 'Legend.swift:372; Keeping.swift:956'),
  glow('Glow/Card lit', '#ECCE6E', 0.55, 26, 'A card lifted, hovered or being read (table, ribbon, kept pages)', 'RootView.swift:357; Keeping.swift:690'),
  glow('Shadow/Card on table', '#4D381F', 0.35, 18, 'A card lying on the table (shade x 0.5 x share; kept cards 35%)', 'RootView.swift:354-356; Keeping.swift:689', 0, 11),
  glow('Shadow/Card lifted', '#4D381F', 0.35, 28, 'A card lifted under the hand', 'RootView.swift:354-356', 0, 20),
  glow('Shadow/Altar card', '#4D381F', 0.32, 36, 'The card on the altar (plus a goldLit 30–45% r50 back-glow)', 'RootView.swift:1567-1568', 0, 22),
  glow('Glow/Altar back-light', '#ECCE6E', 0.38, 50, 'Behind the altar card, breathing 30–45%', 'RootView.swift:1567-1568'),
]
json.dump({'colors': colors, 'type': types, 'effects': effects, 'motion': crit['canonical_motion'], 'merges': crit['merges'], 'errors': crit['errors'], 'missing': crit['missing'], 'notes': crit['notes']}, open(OUT, 'w'), indent=1, ensure_ascii=False)
print(len(colors), 'colours', len(types), 'type styles', len(effects), 'effects', len(crit['canonical_motion']), 'motion')
