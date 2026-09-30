// Experience & notes · the shared kit for the notes chapters (History & rejected directions,
// Open questions & issues, Engineering notes). It installs S.nk. Run it in front of each of those steps:
//   node design/figma/bridge/run.mjs design/figma/build/pages/notes-kit.js design/figma/build/pages/<step>.js
{ // block scope, so the step that follows can declare its own L and N
const L = S.lib
const N = {}

// A chapter header board: kicker, title, lead, the chapter's contents, and provenance notes.
N.header = (name, o) => {
  const b = L.board({ name, kicker: o.kicker || 'NOTES', title: o.title, w: 1600, lead: o.lead, leadW: 1100 })
  L.add(b, L.rich([['In this chapter   ', 'smallStrong'], [o.toc.join('  ·  '), 'small']], 'small', { w: 1456 }))
  if (o.notes) {
    const n = o.notes.length, hw = Math.floor((1456 - (n - 1) * 24) / n)
    const row = L.row(o.notes.map(x => L.note(Object.assign({ w: hw }, x))), { gap: 24, name: 'Provenance', align: 'MIN' })
    L.add(b, row)
    N.equalize(row.children)
  }
  return b
}

// Make a row's cards the same height (auto layout: fixed heights after measuring).
N.equalize = nodes => {
  const h = Math.max(...nodes.map(n => n.height))
  for (const n of nodes) { n.layoutSizingVertical = 'FIXED'; n.resize(n.width, h) }
}

// A tile of fixed size that centres its content (image, text, anything) on a soft ground.
N.tile = (w, h, kids, o = {}) => {
  const f = L.frame({ name: o.name || 'Tile', dir: o.dir || 'h', w, h, r: o.r == null ? 12 : o.r, fill: o.fill || L.C.paper, fillA: o.fillA == null ? 1 : o.fillA,
    stroke: o.stroke === false ? null : '#000000', strokeA: 0.06, gap: o.gap || 24, pad: o.pad || 0, align: 'CENTER', justify: 'CENTER', clip: true })
  L.add(f, kids)
  return f
}

// A real window render (shots-window/), scaled to width w.
N.win = async (path, w, o = {}) => {
  const win = await L.window(path, { name: o.name || ('Window · ' + path.split('/').pop().replace(/\.png$/, '')), shadow: o.shadow })
  win.rescale(w / win.width)
  return win
}
// A stage-only render (no title bar): rounded, with a soft shadow.
N.stage = async (path, w, o = {}) => L.img(path, { w, h: o.h, r: o.r == null ? 12 : o.r, shadow: o.shadow !== false, stroke: '#000000', strokeA: 0.08, name: o.name || ('Render · ' + path.split('/').pop().replace(/\.png$/, '')), mode: o.mode })

// An honest gap: a dashed box where no render exists.
N.missing = (w, h, title, body, o = {}) => {
  const f = L.frame({ name: 'No render · ' + title, dir: 'v', w, h, r: o.r == null ? 12 : o.r, fill: '#FFFFFF', fillA: 0.45, stroke: '#8A4B12', strokeA: 0.4, pad: 24, gap: 8, justify: 'CENTER', align: 'CENTER' })
  f.dashPattern = [7, 6]
  L.add(f, L.text(o.kicker || 'Not preserved', 'kicker', { color: '#8A4B12' }), L.text(title, 'smallStrong', { w: w - 48, align: 'CENTER' }),
    body ? L.text(body, 'caption', { w: w - 48, align: 'CENTER', alpha: 0.72 }) : null)
  return f
}

// Akash's (or anyone's) own words, quoted: Didot Italic with an attribution.
// People's words are the file's own face (Inter Italic), as in the Brand, Launch film and Agents chapters;
// Didot Italic is kept for Arcana's own words (PLAN.md).
N.quote = (words, who, w, o = {}) => L.col([
  L.text('“' + words + '”', 'body', { family: 'Inter', style: 'Italic', size: o.small ? 15 : 17, lh: o.small ? 23 : 26, w, color: o.color || L.C.ink, alpha: 0.9 }),
  who ? L.text('— ' + who, 'caption', { w }) : null,
], { gap: 4, name: 'Quote · ' + words.slice(0, 32) })

// Source refs that link to GitHub at L.SHA: Swift files (bare names are in Sources/Arcana), and any other
// path in the repository (build.sh, README.md, agent/…, film/…, docs/…, Assets/…, _original/…, Tools/…).
// Paths under design/ are not in that commit, so they stay plain text.
N.TOP = /^(Sources|Tools|agent|film|docs|Assets|_original)\//
N.BARE = { 'build.sh': 1, 'rebuild-shots.sh': 1, 'README.md': 1, 'Package.swift': 1, '.gitignore': 1 }
N.linkAll = t => {
  const s = t.characters
  const re = /(\.gitignore|(?:[\w.-]+\/)*[\w.-]+\.(?:swift|sh|md|js|mjs|html|toml|json|png|mp4))(?::(\d+)(?:[-–](\d+))?)?/g
  let m
  while ((m = re.exec(s))) {
    if (s[m.index - 1] === '/' || s[m.index - 1] === '~') continue
    let p = m[1]
    if (!p.includes('/')) p = N.BARE[p] ? p : (p.endsWith('.swift') ? 'Sources/Arcana/' + p : null)
    if (!p || !(N.TOP.test(p) || N.BARE[p]) || /^film\/out\//.test(p)) continue
    try { t.setRangeHyperlink(m.index, m.index + m[0].length, { type: 'URL', value: `${L.REPO}/blob/${L.SHA}/${p}${m[2] ? '#L' + m[2] + (m[3] ? '-L' + m[3] : '') : ''}` }) } catch (e) {}
  }
  const dir = /(^|[\s(·])((?:agent|film|docs|_original|Tools|Assets)\/)(?=[\s,)·]|$)/g
  while ((m = dir.exec(s))) {
    const a = m.index + m[1].length
    try { t.setRangeHyperlink(a, a + m[2].length, { type: 'URL', value: `${L.REPO}/tree/${L.SHA}/${m[2].slice(0, -1)}` }) } catch (e) {}
  }
  return t
}
N.src = (str, o = {}) => N.linkAll(L.text(str, 'code', Object.assign({ size: 11, lh: 16, alpha: 0.55 }, o)))

// Commit refs that link to GitHub.
N.commit = (sha, title, w) => {
  const t = L.text(sha + '  ' + title, 'code', { size: 11, lh: 17, w, alpha: 0.7 })
  L.link(t, L.REPO + '/commit/' + sha, 0, sha.length)
  t.setRangeFills(0, sha.length, [L.solid(L.C.gold, 1)])
  return t
}

// Severity and "needs" pills for issues.
N.SEV = { High: { fill: '#F6E2DF', color: '#8C2E25' }, Medium: { fill: '#FBE9D5', color: '#8A4B12' }, Low: { fill: '#EDE8E2', color: '#5E554C' } }
N.pill = (label, fill, color) => {
  const t = L.text(label, 'label', { family: 'Inter', style: 'Semi Bold', size: 10, lh: 14, ls: 8, upper: true, color, alpha: 1 })
  return L.frame({ name: 'Pill · ' + label, dir: 'h', pad: [4, 9], r: 999, fill, kids: [t], align: 'CENTER' })
}
N.sev = s => N.pill(s, N.SEV[s].fill, N.SEV[s].color)
N.NEEDS = { design: ['Design decision', '#EAE4F8', '#54457F'], eng: ['Engineering fix', '#E2E9F6', '#34507F'], both: ['Design + engineering', '#F3EAD0', '#7A5B17'], know: ['Know it', '#E9E6E1', '#4A433D'] }
N.needs = k => { const n = N.NEEDS[k]; return N.pill(n[0], n[1], n[2]) }

N.clearMine = (sec, ORDER, MINE) => { for (const n of [...sec.children]) if (MINE.includes(n.name) || !ORDER.includes(n.name)) n.remove() }
N.sortIn = (sec, ORDER) => { const kids = ORDER.map(n => sec.children.find(c => c.name === n)).filter(Boolean); kids.forEach(k => sec.appendChild(k)) }
N.snap = async (boards, dir, prefix, o = {}) => {
  const out = []
  for (const b of boards) out.push(await L.snap(b, 'pages/' + dir + '/' + b.name.replace(prefix, '').toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '') + '.png', { scale: o.scale || 0.3, wait: out.length ? 300 : 2000 }))
  return out
}
S.nk = N
}
