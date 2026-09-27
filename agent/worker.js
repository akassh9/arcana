// ===================================================================
//  Arcana, for an agent. A fresh reading on every fetch, as plain text,
//  in the deck's own words (deck.json, written out of Deck.swift by
//  deploy.sh). People have the app.
//
//    /today              three fates; the bare address answers the same
//    /today?spread=one   one card; ?spread=road for the long road's five
//
//  Nothing is stored and there is no key. The shuffle happens here, so
//  the cards are really random; the agent only reads them.
// ===================================================================

import words from "./deck.json";

/// As often as the app turns a card when it shuffles (Game.reshuffle).
const REVERSED = 0.42;
const THREE = words.spreads.find((s) => s.id === "three");

export default {
  fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (path !== "/today" && path !== "/") return new Response("Not found.\n", { status: 404 });

    const asked = words.spreads.find((s) => s.id === url.searchParams.get("spread"));
    const spread = asked ?? THREE;
    return new Response(asText(spread, draw(spread)), {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        // every fetch is a new cut; a cache must not hand back yesterday's cards
        "cache-control": "no-store",
        "access-control-allow-origin": "*",
      },
    });
  },
};

/// The whole deck, each card turned or not, shuffled; the spread takes
/// its cards from the top, as the app's does.
function draw(spread) {
  const order = words.cards.map((card) => ({ card, reversed: Math.random() < REVERSED }));
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return spread.slots.map((slot, i) => ({ slot, ...order[i] }));
}

function asText(spread, draws) {
  const cards = draws.map(
    (d) =>
      `${d.slot} · ${d.card.name}${d.reversed ? ", reversed" : ""}\n` +
      (d.reversed ? d.card.reversed : d.card.upright));
  return [`Arcana · ${spread.name} · drawn just now`, ...cards].join("\n\n") + "\n";
}
