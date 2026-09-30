// Arcana Bridge: runs build steps sent from a server on this Mac, one at a time.
// Each step is the body of an async function with figma, bytes, text, save, log and S in scope.
figma.showUI(__html__, { width: 280, height: 44, title: 'Arcana Bridge' })

const waiters = new Map()
let rid = 0
function ask(msg) {
  return new Promise((resolve, reject) => {
    const id = ++rid
    waiters.set(id, { resolve, reject })
    figma.ui.postMessage(Object.assign({}, msg, { rid: id }))
  })
}
const bytes = path => ask({ type: 'fetch', path })
const text = path => ask({ type: 'fetchText', path })
const save = (path, data) => ask({ type: 'save', path, bytes: data })

// State that survives between steps while the plugin stays open.
const S = {}

function safe(v, depth) {
  depth = depth || 0
  if (v === undefined || v === null) return v === undefined ? null : v
  if (typeof v !== 'object') return v
  if (depth > 6) return '…'
  if (typeof v.type === 'string' && typeof v.id === 'string' && 'parent' in v) return { id: v.id, name: v.name, type: v.type }
  if (v instanceof Uint8Array) return '<' + v.length + ' bytes>'
  if (Array.isArray(v)) return v.slice(0, 500).map(x => safe(x, depth + 1))
  const o = {}
  for (const k of Object.keys(v).slice(0, 500)) o[k] = safe(v[k], depth + 1)
  return o
}

figma.ui.onmessage = async m => {
  if (m.type === 'reply') {
    const w = waiters.get(m.rid)
    waiters.delete(m.rid)
    if (!w) return
    if (m.error) w.reject(new Error(m.error))
    else w.resolve(m.bytes !== undefined ? m.bytes : m.text)
    return
  }
  if (m.type !== 'run') return
  const logs = []
  const log = function () {
    logs.push(Array.prototype.map.call(arguments, x => (typeof x === 'string' ? x : JSON.stringify(safe(x)))).join(' '))
  }
  let out
  try {
    const fn = new Function('figma', 'bytes', 'text', 'save', 'log', 'S', 'return (async () => {\n' + m.code + '\n})()')
    const value = await fn(figma, bytes, text, save, log, S)
    out = { type: 'result', id: m.id, ok: true, value: safe(value), logs }
  } catch (e) {
    out = { type: 'result', id: m.id, ok: false, error: String((e && e.stack) || e), logs }
  }
  figma.ui.postMessage(out)
}
