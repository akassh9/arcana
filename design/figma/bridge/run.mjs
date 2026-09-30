// Sends one build step to the Arcana Bridge plugin and prints what it returned.
//   node run.mjs step.js [more.js …] [--timeout 900]
//   node run.mjs -e "return figma.currentPage.name"
//   node run.mjs --status
// The step runs as the body of an async function with figma, bytes, text, save, log and S in scope.
// If design/figma/build/lib.js exists it is installed into S.lib first (again only when it changes).
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const LIB = path.resolve(HERE, '../build/lib.js')
const args = process.argv.slice(2)
const BASE = 'http://localhost:7719'
if (args[0] === '--status') {
  console.log(await (await fetch(BASE + '/status')).text())
  process.exit(0)
}
let timeout = 3600
const t = args.indexOf('--timeout')
if (t >= 0) { timeout = Number(args[t + 1]); args.splice(t, 2) }
const noLib = args.includes('--no-lib')
let body = ''
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--no-lib') continue
  if (args[i] === '-e') body += args[++i] + '\n'
  else body += fs.readFileSync(args[i], 'utf8') + '\n'
}
let prelude = ''
if (!noLib && fs.existsSync(LIB)) {
  const lib = fs.readFileSync(LIB, 'utf8')
  const hash = crypto.createHash('sha1').update(lib).digest('hex').slice(0, 12)
  prelude = `if (!S.lib || S.libHash !== ${JSON.stringify(hash)}) { S.lib = await (async () => {\n${lib}\n})(); S.libHash = ${JSON.stringify(hash)} }\n`
}
// Figma's sandbox leaves the message out of e.stack, so report both.
const code = `try {\n${prelude}${body}\n} catch (e) { return { __error: String(e), stack: String(e && e.stack) } }`
const { id } = await (await fetch(BASE + '/enqueue', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) })).json()
const deadline = Date.now() + timeout * 1000
let r
for (;;) {
  r = await (await fetch(BASE + '/wait?id=' + id)).json()
  if (!r.pending) break
  if (Date.now() > deadline) { r = { ok: false, error: `still ${r.running ? 'running' : 'queued'} after ${timeout} s (job ${id})` }; break }
}
for (const l of r.logs || []) console.log('│ ' + l)
if (r.ok && r.value && r.value.__error) { console.error('✗ ' + r.value.__error + '\n' + r.value.stack); process.exit(1) }
if (r.ok) console.log(JSON.stringify(r.value, null, 1))
else { console.error('✗ ' + r.error); process.exit(1) }
