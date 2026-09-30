// Imports each listed SVG into the _render-check page, exports it at 3x on clear, and removes it.
// Run: node ../../bridge/run.mjs --no-lib figma-check.js   (after setting FILES below)
let p = figma.root.children.find(x => x.name === "_render-check")
if (!p) { p = figma.createPage(); p.name = "_render-check" }
const out = []
for (const f of FILES) {
  const n = figma.createNodeFromSvg(await text("glyphs/" + f))
  p.appendChild(n)
  n.fills = []
  const png = await n.exportAsync({ format: "PNG", constraint: { type: "SCALE", value: 3 } })
  const name = f.split("/").pop().replace(".svg", "")
  await save("_render-check/glyphs-" + name + ".png", png)
  out.push([name, n.width, n.height, n.findAll(() => true).length])
  n.remove()
}
return out
