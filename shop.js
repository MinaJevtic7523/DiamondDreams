/* Diamond Dreams: shop page (search, filters, sorting, wishlist filter) */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var grid = $("#products"), count = $("#resultCount"), empty = $("#noResults");
  var maxPrice = Math.max.apply(null, PRODUCTS.map(function (p) { return p.price; }));
  var state = { q: "", cat: "All", material: "All", max: maxPrice, sort: "featured", fav: false };

  var params = new URLSearchParams(location.search), c = params.get("cat");
  if (c && CATEGORIES.indexOf(c) !== -1) state.cat = c;
  if (params.get("q")) state.q = params.get("q");

  // category chips
  var chips = $("#chips");
  chips.innerHTML = ["All"].concat(CATEGORIES).map(function (n) {
    return '<button type="button" class="chip" data-cat="' + n + '" aria-pressed="false">' + n + '</button>';
  }).join("");
  var range = $("#priceRange"); range.max = maxPrice; range.value = maxPrice;

  function apply() {
    var q = state.q.trim().toLowerCase();
    var list = PRODUCTS.filter(function (p) {
      return (state.cat === "All" || p.cat === state.cat) &&
        (state.material === "All" || p.material === state.material) &&
        p.price <= state.max &&
        (!state.fav || DD.isWish(p.id)) &&
        (!q || (p.name + " " + p.desc + " " + p.cat + " " + p.material).toLowerCase().indexOf(q) !== -1);
    });
    if (state.sort === "low") list.sort(function (a, b) { return a.price - b.price; });
    else if (state.sort === "high") list.sort(function (a, b) { return b.price - a.price; });
    else if (state.sort === "name") list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    grid.innerHTML = list.map(DD.card).join("");
    count.textContent = list.length + (list.length === 1 ? " product" : " products");
    empty.hidden = list.length !== 0;
    Array.prototype.forEach.call(chips.children, function (b) { var on = b.getAttribute("data-cat") === state.cat; b.setAttribute("aria-pressed", String(on)); b.classList.toggle("on", on); });
    $("#priceVal").textContent = DD.money(state.max);
  }

  chips.addEventListener("click", function (e) { var b = e.target.closest("[data-cat]"); if (b) { state.cat = b.getAttribute("data-cat"); apply(); } });
  $("#search").value = state.q;
  $("#search").addEventListener("input", function () { state.q = this.value; apply(); });
  $("#material").addEventListener("change", function () { state.material = this.value; apply(); });
  range.addEventListener("input", function () { state.max = Number(this.value); apply(); });
  $("#sort").addEventListener("change", function () { state.sort = this.value; apply(); });
  $("#favOnly").addEventListener("change", function () { state.fav = this.checked; apply(); });
  $("#reset").addEventListener("click", function () {
    state = { q: "", cat: "All", material: "All", max: maxPrice, sort: "featured", fav: false };
    $("#search").value = ""; $("#material").value = "All"; range.value = maxPrice; $("#sort").value = "featured"; $("#favOnly").checked = false; apply();
  });
  var reset2 = $("#reset2"); if (reset2) reset2.addEventListener("click", function () { $("#reset").click(); });

  DD.bind(grid);
  document.addEventListener("dd:change", apply);
  apply();
})();
