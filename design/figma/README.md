# The Figma design handoff

The tools that make **Arcana — Design Handoff**, a Figma file for a designer who is new to Arcana. The file
has 3 pages and 28 chapters: principles and provenance, the tokens, every screen, all 78 cards as components,
the sky, sound, brand, history and open questions. Everything in it is rendered from the code and built by code.

- `render/<family>/`: renders the assets from the app's own sources (shots, cards, glyphs, sky, type-ink,
  surfaces, brand, sound; each has a README) into `assets/<family>/`, with a `manifest.json` per family.
  They never touch the repo, your readings or the Keychain, and never put a window on screen.
- `bridge/`: Arcana Bridge, a Figma development plugin with a local server (127.0.0.1:7719). Steps sent
  from here run inside the open Figma file.
- `build/`: the layout kit (`lib.js`), the tokens (`tokens.js`), the plan (`PLAN.md`), the design history
  (`HISTORY.md`) and one step file per chapter (`pages/`). `rebuild.sh` lists and runs every step in order.

To rebuild:

```bash
node design/figma/bridge/server.mjs
```

Then, in Figma desktop, open the file and go to Plugins ▸ Development ▸ Import plugin from manifest…, choose
`design/figma/bridge/manifest.json` and run Arcana Bridge. Then:

```bash
design/figma/build/rebuild.sh --run
```

The rendered assets (about 1.6 GB) and exports are not committed; re-render them with each family's tool.
