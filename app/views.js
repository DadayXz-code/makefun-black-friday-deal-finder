// HTML for every page, built from the deal data. Every value is escaped
// before it goes into the page, so a deal's text can never break the markup.

import { percentOff, saving } from "./filters.js";

export const escape = (s) =>
  String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export const usd = (n) =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`;

export function checkTime(iso) {
  return (
    new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    }) + " UTC"
  );
}

const VERDICT_LABEL = {
  "new-low": "NEW LOW",
  strong: "STRONG PRICE",
  routine: "ROUTINE SALE",
};

const VERDICT_NOTE = {
  "new-low": "The lowest price the source has tracked for this product.",
  strong: "A real cut well below the usual price.",
  routine: "On sale, but only a modest cut from the usual price.",
};

export function verdictChip(deal) {
  return `<span class="verdict verdict-${escape(deal.verdict)}">${escape(VERDICT_LABEL[deal.verdict])}</span>`;
}

export function dealCard(deal) {
  return `<article class="card">
  <div class="card-top"><span class="store">${escape(deal.store)}</span><span class="cat">${escape(deal.category)}</span></div>
  <h3><a href="#/deal/${encodeURIComponent(deal.id)}">${escape(deal.title)}</a></h3>
  <p class="prices"><span class="now">${usd(deal.price)}</span> <s class="was">${usd(deal.was)}</s> <span class="off">${percentOff(deal)}% off</span></p>
  <p class="save">You save ${usd(saving(deal))}</p>
  <p class="verdict-line">${verdictChip(deal)}</p>
  <p class="meta">Checked ${checkTime(deal.checked)} &middot; ${escape(deal.source)}</p>
  <p class="go"><a class="btn" href="${escape(deal.url)}" rel="noopener" target="_blank">View at ${escape(deal.store)} &rarr;</a></p>
</article>`;
}

export function dealRows(deals) {
  if (deals.length === 0) {
    return `<p class="empty">No deal matches those filters. Clear the search or lower the minimum discount.</p>`;
  }
  return `<div class="grid">${deals.map(dealCard).join("")}</div>`;
}

export function statsBar(deals) {
  const total = deals.length;
  const stores = new Set(deals.map((d) => d.store)).size;
  const avg = Math.round(deals.reduce((sum, d) => sum + percentOff(d), 0) / total);
  const biggest = Math.max(...deals.map(percentOff));
  const saved = deals.reduce((sum, d) => sum + saving(d), 0);
  const lows = deals.filter((d) => d.verdict === "new-low").length;
  return `<section class="stats" aria-label="Sale at a glance">
  <div><strong>${total}</strong><span>verified deals</span></div>
  <div><strong>${stores}</strong><span>stores</span></div>
  <div><strong>${avg}%</strong><span>average discount</span></div>
  <div><strong>${biggest}%</strong><span>biggest cut</span></div>
  <div><strong>${usd(Math.round(saved))}</strong><span>total savings</span></div>
  <div><strong>${lows}</strong><span>new lows</span></div>
</section>`;
}

export function listPage(deals, shown, filters, cats, stores) {
  const options = (items, current) =>
    items.map((v) => `<option value="${escape(v)}"${v === current ? " selected" : ""}>${escape(v)}</option>`).join("");
  const sorts = Object.entries({
    discount: "Biggest discount",
    saving: "Biggest saving ($)",
    price: "Lowest price",
    title: "Name A-Z",
  })
    .map(([v, label]) => `<option value="${escape(v)}"${v === filters.sort ? " selected" : ""}>${escape(label)}</option>`)
    .join("");
  return `${statsBar(deals)}
<h1>Black Friday deals, checked today</h1>
<p class="lede">Every price below was read at the store or in a deals source that names the store, on Black Friday 2026. The verdict on each card says whether it is really a deal.</p>
<form class="controls" id="controls">
  <label class="search">Search <input type="search" name="q" value="${escape(filters.q)}" placeholder="Try &ldquo;airpods&rdquo; or &ldquo;tv&rdquo;" autocomplete="off"></label>
  <label>Category <select name="category"><option value="All">All categories</option>${options(cats, filters.category)}</select></label>
  <label>Store <select name="store"><option value="All">All stores</option>${options(stores, filters.store)}</select></label>
  <label>Min. discount <select name="minOff">
    <option value="0"${filters.minOff === 0 ? " selected" : ""}>Any discount</option>
    <option value="25"${filters.minOff === 25 ? " selected" : ""}>25% off or more</option>
    <option value="40"${filters.minOff === 40 ? " selected" : ""}>40% off or more</option>
    <option value="50"${filters.minOff === 50 ? " selected" : ""}>50% off or more</option>
  </select></label>
  <label>Sort <select name="sort">${sorts}</select></label>
</form>
<p class="count" id="count">Showing ${shown.length} of ${deals.length} deals.</p>
<div id="results">${dealRows(shown)}</div>`;
}

export function detailPage(deal, related) {
  const rel = related
    .filter((d) => d.id !== deal.id)
    .slice(0, 3)
    .map(
      (d) =>
        `<li><a href="#/deal/${encodeURIComponent(d.id)}">${escape(d.title)}</a> &mdash; ${usd(d.price)} <s>${usd(d.was)}</s> at ${escape(d.store)}</li>`,
    )
    .join("");
  return `<p class="back"><a href="#/">&larr; All deals</a></p>
<article class="detail">
  <div class="card-top"><span class="store">${escape(deal.store)}</span><span class="cat">${escape(deal.category)}</span></div>
  <h1>${escape(deal.title)}</h1>
  <p class="prices big"><span class="now">${usd(deal.price)}</span> <s class="was">${usd(deal.was)}</s> <span class="off">${percentOff(deal)}% off</span></p>
  <p class="save">You save ${usd(saving(deal))} off the usual price of ${usd(deal.was)}.</p>
  <div class="verdict-box verdict-${escape(deal.verdict)}">
    <strong>${escape(VERDICT_LABEL[deal.verdict])}</strong>
    <p>${escape(VERDICT_NOTE[deal.verdict])}</p>
    <p class="evidence">Evidence: ${escape(deal.evidence)}</p>
  </div>
  <dl class="facts">
    <dt>Store</dt><dd>${escape(deal.store)}</dd>
    <dt>Category</dt><dd>${escape(deal.category)}</dd>
    <dt>Price checked</dt><dd>${checkTime(deal.checked)}</dd>
    <dt>Price read in</dt><dd>${escape(deal.source)}</dd>
  </dl>
  <p><a class="btn big" href="${escape(deal.url)}" rel="noopener" target="_blank">Buy it at ${escape(deal.store)} &rarr;</a></p>
  <p class="note">Prices move fast on Black Friday. Check the price at the store before you order; the link opens the product search at ${escape(deal.store)}.</p>
</article>
<section class="related"><h2>More ${escape(deal.category)} deals</h2><ul>${rel}</ul></section>`;
}

export function missingPage() {
  return `<h1>Deal not found</h1><p>There is no deal at this address. <a href="#/">See all Black Friday deals</a>.</p>`;
}
