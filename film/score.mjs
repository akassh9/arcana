// Render the film's score offline, from the page's own score() and timeline, to a 32-bit float WAV.
// Usage: node score.mjs film.html out/score.wav
import puppeteer from 'puppeteer-core';
import {writeFileSync, existsSync} from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const [file, out = 'out/score.wav'] = process.argv.slice(2);
const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({executablePath: chrome, headless: true});
try {
  const page = await browser.newPage(); const errs = []; page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(path.resolve(file)).href + '?bare=1', {waitUntil: 'load'});
  await page.waitForFunction('window.__ready === true', {timeout: 120000});
  const b64 = await page.evaluate(async () => {
    const sr = 48000, n = Math.ceil(sr * window.__FILM.DUR), oac = new OfflineAudioContext(2, n, sr);
    window.__FILM.score(oac, 0, oac.destination); const buf = await oac.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1), bytes = new ArrayBuffer(44 + n * 8), v = new DataView(bytes), ws = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); v.setUint32(4, 36 + n * 8, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 3, true); v.setUint16(22, 2, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 8, true); v.setUint16(32, 8, true); v.setUint16(34, 32, true); ws(36, 'data'); v.setUint32(40, n * 8, true);
    let o = 44, peak = 0; for (let i = 0; i < n; i++) { v.setFloat32(o, L[i], true); v.setFloat32(o + 4, R[i], true); o += 8; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
    const u8 = new Uint8Array(bytes); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    console.log('peak', peak); return btoa(s);
  });
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
  writeFileSync(out, Buffer.from(b64, 'base64')); console.log('score:', out);
} finally { await browser.close(); }
