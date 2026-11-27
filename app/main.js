// Bargain Beacon: the app itself. It renders the deal board from deals.js,
// keeps the shopper's filters in the address hash so a view can be shared,
// and re-renders live as the shopper types or picks a filter.
//
//   #/                       the board, best discount first
//   #/?q=airpods&cat=Audio   the board, pre-filtered
//   #/deal/<id>              one deal, with its verdict and evidence
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

import { deals } from "./deals.js";
import {
  applyFilters,
  bestDeals,
  categoriesOf,
  emptyFilters,
  storesOf,
} from "./filters.js";
import { dealRows, detailPage, listPage, missingPage } from "./views.js";

const app = document.getElementById("app");

function readHash() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, query] = raw.split("?");
  const params = new URLSearchParams(query ?? "");
  const filters = emptyFilters();
  filters.q = params.get("q") ?? "";
  const cat = params.get("cat");
  if (cat && categoriesOf(deals).includes(cat)) filters.category = cat;
  const store = params.get("store");
  if (store && storesOf(deals).includes(store)) filters.store = store;
  const min = Number(params.get("minOff"));
  if ([25, 40, 50].includes(min)) filters.minOff = min;
  const sort = params.get("sort");
  if (["discount", "saving", "price", "title"].includes(sort)) filters.sort = sort;
  return { path, filters };
}

function writeHash(filters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category !== "All") params.set("cat", filters.category);
  if (filters.store !== "All") params.set("store", filters.store);
  if (filters.minOff) params.set("minOff", String(filters.minOff));
  if (filters.sort !== "discount") params.set("sort", filters.sort);
  const qs = params.toString();
  history.replaceState(null, "", `#/${qs ? `?${qs}` : ""}`);
}

function renderList(filters) {
  // The board re-renders only its count line and its grid on each keystroke,
  // so the search box never loses focus while the shopper types.
  const shown = applyFilters(deals, filters);
  document.title = "Bargain Beacon — Black Friday deals, checked today";
  app.innerHTML = listPage(deals, shown, filters, categoriesOf(deals), storesOf(deals));
  const form = app.querySelector("#controls");
  form.addEventListener("input", () => {
    const data = new FormData(form);
    filters.q = String(data.get("q") ?? "");
    filters.category = String(data.get("category") ?? "All");
    filters.store = String(data.get("store") ?? "All");
    filters.minOff = Number(data.get("minOff") ?? 0);
    filters.sort = String(data.get("sort") ?? "discount");
    writeHash(filters);
    const next = applyFilters(deals, filters);
    app.querySelector("#count").textContent =
      `Showing ${next.length} of ${deals.length} deals.`;
    app.querySelector("#results").innerHTML = dealRows(next);
  });
  form.addEventListener("submit", (event) => event.preventDefault());
}

function render() {
  window.__shotReady = false;
  const { path, filters } = readHash();
  const match = path.match(/^deal\/([^/?]+)/);
  if (match) {
    const found = deals.find((d) => d.id === decodeURIComponent(match[1]));
    if (found) {
      document.title = `${found.title} | Bargain Beacon`;
      const sameCategory = deals.filter((d) => d.category === found.category);
      app.innerHTML = detailPage(found, bestDeals(sameCategory, 4));
    } else {
      document.title = "Deal not found | Bargain Beacon";
      app.innerHTML = missingPage();
    }
  } else {
    renderList(filters);
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

window.addEventListener("hashchange", render);
render();
