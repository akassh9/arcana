#!/usr/bin/env python3
"""README.md as a structure: sections (heading, level, lines), and what each holds."""
import json, re, sys
src, out = sys.argv[1], sys.argv[2]
lines = open(src).read().split('\n')
secs, cur, fence = [], None, False
for i, l in enumerate(lines, 1):
    if l.startswith('```'):
        fence = not fence
        if cur is not None and fence: cur['code_blocks'] += 1
        if cur is not None: cur['_raw'].append(l)
        continue
    m = None if fence else re.match(r'^(#{1,6}) (.*)', l)
    if m:
        if cur: cur['lines'][1] = i - 1
        cur = {'heading': m.group(2), 'level': len(m.group(1)), 'lines': [i, None],
               'code_blocks': 0, '_raw': []}
        secs.append(cur)
    elif cur is not None:
        cur['_raw'].append(l)
if cur: cur['lines'][1] = len(lines)
for s in secs:
    raw = s.pop('_raw')
    body = '\n'.join(raw)
    paras = [p.strip() for p in re.split(r'\n\s*\n', re.sub(r'```.*?```', '', body, flags=re.S)) if p.strip()]
    s['paragraphs'] = len([p for p in paras if not p.startswith('|') and not p.startswith('![')])
    s['tables'] = len([p for p in paras if p.startswith('|')])
    s['list_items'] = len([l for l in raw if re.match(r'^\s*([-*]|\d+\.) ', l)])
    s['images'] = re.findall(r'!\[([^\]]*)\]\(([^)]+)\)', body)
    s['links'] = sorted(set(re.findall(r'(?<!!)\[[^\]]*\]\(([^)]+)\)', body) + re.findall(r'(?<![(\w])https?://[^\s)>`]+', body)))
    first = next((p for p in paras if not p.startswith('|') and not p.startswith('![')), '')
    s['opening'] = re.sub(r'\s+', ' ', first)[:300]
    s['words'] = len(re.findall(r"[A-Za-z’']+", body))
doc = {
    'file': 'README.md', 'total_lines': len(lines),
    'hero_image': {'file': 'docs/arcana.png', 'line': next(i for i, l in enumerate(lines, 1) if l.startswith('![')),
                   'alt': re.search(r'!\[([^\]]*)\]', '\n'.join(lines)).group(1)},
    'agent_line': next((l.strip() for l in lines if 'workers.dev/today' in l and l.strip().startswith('Add')), None),
    'sections': secs,
}
json.dump(doc, open(out, 'w'), indent=1, ensure_ascii=False)
print('readme →', out, len(secs), 'sections')
