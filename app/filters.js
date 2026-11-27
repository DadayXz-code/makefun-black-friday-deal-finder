// Filtering and sorting for the deal board. One job: given the full deal list
// and the shopper's choices, return the deals to show, in order. Pure
// functions only: the same inputs always give the same order.

export const SORTS = {
  discount: "Biggest discount",
  saving: "Biggest saving ($)",
  price: "Lowest price",
  title: "Name A-Z",
};

export function percentOff(deal) {
  return Math.round((1 - deal.price / deal.was) * 100);
}

export function saving(deal) {
  return deal.was - deal.price;
}

export function categoriesOf(deals) {
  return [...new Set(deals.map((d) => d.category))].sort();
}

export function storesOf(deals) {
  return [...new Set(deals.map((d) => d.store))].sort();
}

export function emptyFilters() {
  return { q: "", category: "All", store: "All", minOff: 0, sort: "discount" };
}

export function applyFilters(deals, filters) {
  const q = filters.q.trim().toLowerCase();
  const shown = deals.filter((d) => {
    if (q !== "" && !`${d.title} ${d.store} ${d.category}`.toLowerCase().includes(q)) return false;
    if (filters.category !== "All" && d.category !== filters.category) return false;
    if (filters.store !== "All" && d.store !== filters.store) return false;
    if (percentOff(d) < filters.minOff) return false;
    return true;
  });
  const by = {
    discount: (a, b) => percentOff(b) - percentOff(a) || saving(b) - saving(a),
    saving: (a, b) => saving(b) - saving(a) || percentOff(b) - percentOff(a),
    price: (a, b) => a.price - b.price || percentOff(b) - percentOff(a),
    title: (a, b) => a.title.localeCompare(b.title),
  };
  return [...shown].sort(by[filters.sort] ?? by.discount);
}

export function verdictRank(deal) {
  return { "new-low": 0, strong: 1, routine: 2 }[deal.verdict] ?? 2;
}

export function bestDeals(deals, count) {
  return [...deals]
    .sort((a, b) => verdictRank(a) - verdictRank(b) || percentOff(b) - percentOff(a))
    .slice(0, count);
}
