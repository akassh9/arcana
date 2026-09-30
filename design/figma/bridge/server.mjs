// Serves design/figma/assets to the Arcana Bridge plugin and hands it build steps.
//   node design/figma/bridge/server.mjs            (listens on 127.0.0.1:7719)
//   node design/figma/bridge/run.mjs step.js       (sends one step, prints its result)
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = 7719
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const ASSETS = path.join(ROOT, 'assets')
const OUT = path.join(ROOT, 'out')

const queue = []
const jobs = new Map()
let inflight = null
let pollers = []
let lastPoll = 0
let seq = 0

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Private-Network', 'true')
}

function dispatch() {
  while (!inflight && queue.length && pollers.length) {
    const job = queue.shift()
    inflight = job
    const p = pollers.shift()
    clearTimeout(p.timer)
    p.res.writeHead(200, { 'content-type': 'application/json' })
    p.res.end(JSON.stringify({ id: job.id, code: job.code }))
  }
}

function body(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function inside(base, rel) {
  const p = path.resolve(base, rel)
  return p.startsWith(base + path.sep) ? p : null
}

const TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.txt': 'text/plain', '.md': 'text/plain' }

http.createServer(async (req, res) => {
  cors(res)
  const url = new URL(req.url, 'http://localhost')
  try {
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }

    if (req.method === 'GET' && url.pathname === '/next') {
      lastPoll = Date.now()
      const p = { res }
      p.timer = setTimeout(() => {
        pollers = pollers.filter(x => x !== p)
        res.writeHead(204); res.end()
      }, 20000)
      req.on('close', () => { clearTimeout(p.timer); pollers = pollers.filter(x => x !== p) })
      pollers.push(p)
      return dispatch()
    }

    if (req.method === 'POST' && url.pathname === '/result') {
      const r = JSON.parse((await body(req)).toString('utf8'))
      if (inflight && inflight.id === r.id) { inflight.done(r); inflight = null }
      res.writeHead(204); res.end()
      return dispatch()
    }

    if (req.method === 'POST' && url.pathname === '/enqueue') {
      // Answers at once with the job id; the client then long-polls /wait (fetch gives up on
      // responses that take longer than five minutes).
      const { code } = JSON.parse((await body(req)).toString('utf8'))
      const job = { id: 'step-' + (++seq), code, result: null, waiters: [] }
      job.done = r => {
        job.result = r
        for (const w of job.waiters) w(r)
        job.waiters = []
        setTimeout(() => jobs.delete(job.id), 3600 * 1000)
      }
      jobs.set(job.id, job)
      queue.push(job)
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify({ id: job.id }))
      return dispatch()
    }

    if (req.method === 'GET' && url.pathname === '/wait') {
      const job = jobs.get(url.searchParams.get('id'))
      const send = r => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(r)) }
      if (!job) return send({ ok: false, error: 'unknown job' })
      if (job.result) return send(job.result)
      const timer = setTimeout(() => { job.waiters = job.waiters.filter(w => w !== waiter); send({ pending: true, queuedAhead: queue.indexOf(job), running: inflight === job }) }, 50000)
      const waiter = r => { clearTimeout(timer); send(r) }
      job.waiters.push(waiter)
      req.on('close', () => { clearTimeout(timer); job.waiters = job.waiters.filter(w => w !== waiter) })
      return
    }

    if (req.method === 'GET' && url.pathname === '/status') {
      res.writeHead(200, { 'content-type': 'application/json' })
      return res.end(JSON.stringify({ connected: Date.now() - lastPoll < 25000, lastPollAgoMs: Date.now() - lastPoll, inflight: inflight && inflight.id, queued: queue.length }))
    }

    if (req.method === 'POST' && url.pathname === '/reset') {
      if (inflight) inflight.done({ ok: false, error: 'reset', id: inflight.id })
      inflight = null
      res.writeHead(204); return res.end()
    }

    if (req.method === 'GET' && url.pathname.startsWith('/a/')) {
      const file = inside(ASSETS, decodeURIComponent(url.pathname.slice(3)))
      if (!file || !fs.existsSync(file)) { res.writeHead(404); return res.end('not found') }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
      return fs.createReadStream(file).pipe(res)
    }

    if (req.method === 'POST' && url.pathname === '/save') {
      const file = inside(OUT, url.searchParams.get('path') || '')
      if (!file) { res.writeHead(400); return res.end('bad path') }
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, await body(req))
      res.writeHead(204); return res.end()
    }

    res.writeHead(404); res.end('not found')
  } catch (e) {
    res.writeHead(500); res.end(String(e))
  }
}).listen(PORT, '127.0.0.1', () => console.log(`Arcana Bridge server on http://localhost:${PORT} (assets: ${ASSETS})`))
