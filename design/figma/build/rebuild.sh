#!/bin/bash
# Rebuild the Figma file "Arcana — Design Handoff" from its step files, in order.
#
#   design/figma/build/rebuild.sh              list every step, numbered (runs nothing)
#   design/figma/build/rebuild.sh --run        run them all, one at a time, stopping at the first failure
#   design/figma/build/rebuild.sh --run 57     run from step 57 on (after fixing a failed step)
#
# Before running: start the bridge server (node design/figma/bridge/server.mjs) and run the Arcana Bridge
# plugin in the open file (Figma desktop ▸ Plugins ▸ Development, imported from design/figma/bridge/manifest.json).
#
# The order: the tokens (colour variables, text, effect and gradient styles), the title-bar component, then
# every chapter's steps in reading order (build/PLAN.md), each with its kit files in front, as each step's own
# header says. A chapter's first step may clear it, so its later steps always follow it. Last, each page's
# chapters are put back in order. Card steps rescue the deck's component masters before they clear a board
# (cards-lib.js, S.cards.rescue), so re-running them keeps every instance in the file alive.
set -euo pipefail
cd "$(dirname "$0")/../../.."          # the repository root; every path below is relative to it
P=design/figma/build/pages

STEPS=(
  # ---- the file's tokens and the one component other chapters need
  "design/figma/build/tokens.js"
  "$P/components-window.js"
  # ---- Start here
  "$P/cover.js"
  "$P/read-me-first-1.js" "$P/read-me-first-2.js" "$P/read-me-first-3.js"
  "$P/principles.js"
  # ---- Design system
  "$P/foundations-lib.js $P/colour-1.js" "$P/foundations-lib.js $P/colour-2.js"
  "$P/foundations-lib.js $P/type-1.js" "$P/foundations-lib.js $P/type-2.js" "$P/foundations-lib.js $P/type-3.js"
  "$P/foundations-lib.js $P/ink-gold-materials-1.js" "$P/foundations-lib.js $P/ink-gold-materials-2.js"
  "$P/foundations-b-lib.js $P/layout-1.js" "$P/foundations-b-lib.js $P/layout-2.js" "$P/foundations-b-lib.js $P/layout-3.js"
  "$P/foundations-b-lib.js $P/motion-1.js" "$P/foundations-b-lib.js $P/motion-2.js" "$P/foundations-b-lib.js $P/motion-3.js" "$P/foundations-b-lib.js $P/motion-4.js"
  "$P/foundations-b-lib.js $P/sound-1.js" "$P/foundations-b-lib.js $P/sound-2.js" "$P/foundations-b-lib.js $P/sound-3.js"
  "$P/components-lib.js $P/components-1.js" "$P/components-lib.js $P/components-2.js" "$P/components-lib.js $P/components-3.js" "$P/components-lib.js $P/components-4.js"
  "$P/cards-lib.js $P/card-anatomy-1.js" "$P/cards-lib.js $P/card-anatomy-2.js"
  "$P/cards-lib.js $P/major-arcana.js"
  "$P/cards-lib.js $P/minor-arcana-lib.js $P/minor-arcana-1.js" "$P/cards-lib.js $P/minor-arcana-lib.js $P/minor-arcana-2.js"
  "$P/cards-lib.js $P/minor-arcana-lib.js $P/minor-arcana-3.js" "$P/cards-lib.js $P/minor-arcana-lib.js $P/minor-arcana-4.js"
  "$P/cards-lib.js $P/minor-arcana-lib.js $P/minor-arcana-5.js" "$P/cards-lib.js $P/minor-arcana-lib.js $P/minor-arcana-6.js"
  "$P/cards-lib.js $P/the-words.js"
  "$P/sky-moon-1.js" "$P/sky-moon-2.js" "$P/sky-moon-3.js"
  "$P/as-above-lib.js $P/as-above-1.js" "$P/as-above-lib.js $P/as-above-2.js"
  # ---- Experience & notes
  "$P/flow-keys.js"
  "$P/room-1.js" "$P/room-2.js"
  "$P/reading-1.js" "$P/reading-2.js" "$P/reading-3.js"
  "$P/experience-b-kit.js $P/return-moon-1.js" "$P/experience-b-kit.js $P/return-moon-2.js" "$P/experience-b-kit.js $P/return-moon-3.js"
  "$P/experience-b-kit.js $P/keys-settings-1.js" "$P/experience-b-kit.js $P/keys-settings-2.js" "$P/experience-b-kit.js $P/keys-settings-3.js"
  "$P/experience-b-kit.js $P/edge-cases-1.js" "$P/experience-b-kit.js $P/edge-cases-2.js" "$P/experience-b-kit.js $P/edge-cases-3.js"
  "$P/outside-lib.js $P/brand-1.js" "$P/outside-lib.js $P/brand-2.js"
  "$P/outside-lib.js $P/film-1.js" "$P/outside-lib.js $P/film-2.js" "$P/outside-lib.js $P/film-3.js"
  "$P/outside-lib.js $P/agents.js"
  "$P/notes-kit.js $P/history-1.js" "$P/notes-kit.js $P/history-2.js"
  "$P/notes-kit.js $P/issues-data.js $P/issues-1.js" "$P/notes-kit.js $P/issues-data.js $P/issues-2.js"
  "$P/notes-kit.js $P/engineering-1.js" "$P/notes-kit.js $P/engineering-2.js"
  # ---- last: every page's chapters in reading order
  "ARRANGE"
)
# the last step, inline: L.arrange for each page (Start here, Design system, Experience & notes)
ARRANGE='const L = S.lib; const out = {}; for (const p of Object.keys(L.PAGES)) out[p] = await L.arrange(p); return out'


label() { local s="${1//$P\//}"; s="${s//design\/figma\/build\//}"; [[ $s == ARRANGE ]] && s="(inline) await L.arrange(page) for each of the three pages"; echo "$s"; }

if [[ "${1:-}" != "--run" ]]; then
  for i in "${!STEPS[@]}"; do printf '%3d  %s\n' "$((i + 1))" "$(label "${STEPS[$i]}")"; done
  echo; echo "${#STEPS[@]} steps. Run them with: $0 --run [from]"
  exit 0
fi

FROM=${2:-1}
for i in "${!STEPS[@]}"; do
  n=$((i + 1)); (( n < FROM )) && continue
  s="${STEPS[$i]}"
  echo "▸ $n/${#STEPS[@]}  $(label "$s")"
  if [[ $s == ARRANGE ]]; then
    node design/figma/bridge/run.mjs -e "$ARRANGE" --timeout 600 > /dev/null || { echo "✗ step $n failed; fix it, then: $0 --run $n"; exit 1; }
  else
    # shellcheck disable=SC2086  (a step is its kit files and the step, space-separated)
    node design/figma/bridge/run.mjs $s --timeout 600 > /dev/null || { echo "✗ step $n failed; fix it, then: $0 --run $n"; exit 1; }
  fi
done
echo "✓ rebuilt all ${#STEPS[@]} steps"
