#!/usr/bin/env python3
"""What the agent Worker is, for the handoff: endpoints, format, headers, the line people paste."""
import json, re, sys, os
repo, fetched, out = sys.argv[1:4]
w = open(os.path.join(repo, 'agent/worker.js')).read()
readme = open(os.path.join(repo, 'README.md')).read()
def ln(needle, src=w):
    i = src.find(needle); return None if i < 0 else src.count('\n', 0, i) + 1
line = next(l.strip() for l in readme.split('\n') if 'workers.dev/today' in l and l.strip().startswith('Add'))
doc = {
 'what': 'A Cloudflare Worker that answers every GET with a fresh tarot reading as plain UTF-8 text, for AI agents (e.g. a morning brief). Server-side shuffle of all 78, each card turned with p = 0.42 as the app turns them, the spread taken from the top. No key, no page, nothing stored.',
 'decision': "Plain text for agents by the user's decision: the user cut the human web page Claude had made ('the for people is the app'). It has no HTML, styling, icon or visual layer, so it needs no Figma design; show it, if at all, as a text frame in a system or monospace font.",
 'the_line_people_paste': line,
 'the_line_source': 'README.md:%d (section "For your agent")' % (readme[:readme.find(line)].count('\n') + 1),
 'endpoints': [
   {'url': 'https://arcana.khanikad.workers.dev/today', 'spread': 'Three Fates (What Was · What Is · What Tends)', 'sample': 'brand/agent/reading-three.txt'},
   {'url': 'https://arcana.khanikad.workers.dev/today?spread=one', 'spread': 'One Card (The Answer)', 'sample': 'brand/agent/reading-one.txt'},
   {'url': 'https://arcana.khanikad.workers.dev/today?spread=road', 'spread': 'The Long Road (Situation · Crossing · Root · Counsel · Outcome)', 'sample': 'brand/agent/reading-road.txt'},
   {'url': 'https://arcana.khanikad.workers.dev/', 'spread': 'the bare address answers as /today'},
   {'url': 'any other path', 'spread': "404, body 'Not found.' (from agent/worker.js; not fetched)"},
 ],
 'format': {
   'line_1': 'Arcana · {Spread name} · drawn just now',
   'then_per_card': '{position} · {card name}[, reversed]\\n{the card\'s line for that way up}',
   'blocks': 'separated by one blank line; trailing newline',
   'separator': 'U+00B7 middle dot with a space either side',
 },
 'headers': {'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'access-control-allow-origin': '*'},
 'words': 'agent/deck.json, exported from Deck.swift by Tools/deck (the same essences and lines as the cards)',
 'never_rename': 'agent/worker.js and the workers.dev address are in the published launch post; never rename them.',
 'samples_fetched_utc': fetched,
 'samples_note': 'Each fetch is a new shuffle, so the three samples are one moment, not fixed copy.',
 'source': 'agent/worker.js:1-%d; agent/wrangler.toml; README.md' % w.count('\n'),
}
json.dump(doc, open(out, 'w'), indent=1, ensure_ascii=False)
print('worker →', out)
