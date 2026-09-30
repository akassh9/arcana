#!/usr/bin/env python3
"""Copies the app's sources into ./src and opens the few private views and
helpers the glyph tool draws. The repo is never touched."""
import os, re, shutil, sys
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '../../../..'))
SRC = os.path.join(REPO, 'Sources/Arcana')
OUT = os.path.join(HERE, 'src')
if os.path.isdir(OUT): shutil.rmtree(OUT)
os.makedirs(OUT)
for f in sorted(os.listdir(SRC)):
    if f.endswith('.swift') and f != 'ArcanaApp.swift':
        shutil.copy(os.path.join(SRC, f), os.path.join(OUT, f))

def patch(name, fn):
    p = os.path.join(OUT, name)
    s = open(p).read()
    t = fn(s)
    if t == s: sys.exit('patch did nothing: ' + name)
    open(p, 'w').write(t)

# never the Keychain: the thread is simply not offered
patch('Weave.swift', lambda s: s.replace(
    'static var ready: Bool { APIKeyStore.value().map(OpenAIKey.usable) ?? false }',
    'static var ready: Bool { false }'))
# never the user's kept.json
patch('Keeping.swift', lambda s: re.sub(r'static var file: URL\? = \{.*?\n  \}\(\)',
    'static var file: URL? = nil', s, count=1, flags=re.S))
# open the private views and helpers
def opened(s):
    s = re.sub(r'^private (struct|enum) ', r'\1 ', s, flags=re.M)
    s = re.sub(r'^(\s+)private static ', r'\1static ', s, flags=re.M)
    s = re.sub(r'^(\s+)private (struct|enum) ', r'\1\2 ', s, flags=re.M)
    return s
for f in ['Suits.swift', 'Legend.swift', 'RootView.swift', 'Keeping.swift']:
    patch(f, opened)
print('prepared', OUT)
