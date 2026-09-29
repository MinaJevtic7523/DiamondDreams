/* Diamond Dreams: shared code (menu, cart, wishlist, checkout, home page, forms) */
(function () {
  "use strict";
  var BASE = document.body.getAttribute("data-base") || "";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return "£" + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0); };
  var byId = function (id) { return PRODUCTS.filter(function (p) { return p.id === Number(id); })[0]; };
  var imgSrc = function (p) { return BASE + "slike/" + encodeURIComponent(p.img); };
  var SHOP = (BASE ? '' : 'html/') + 'gallery.html';
  var FREE_SHIPPING = 150, SHIPPING = 5, PROMO = { code: "DREAMS10", pct: 10 };

  /* ---------- storage ---------- */
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var cart = load("dd_cart2", {});        // { id: qty }
  var wish = load("dd_wish", []);         // [id]
  var promoOn = load("dd_promo", false);

  /* ---------- toast ---------- */
  var toastEl = $("#toast"), toastT;
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 2400);
  }

  /* ---------- totals ---------- */
  function totals() {
    var sub = 0, count = 0;
    Object.keys(cart).forEach(function (id) { var p = byId(id); if (p) { sub += p.price * cart[id]; count += cart[id]; } });
    var discount = promoOn ? Math.round(sub * PROMO.pct) / 100 : 0;
    var ship = count === 0 ? 0 : (sub - discount >= FREE_SHIPPING ? 0 : SHIPPING);
    return { sub: sub, count: count, discount: discount, ship: ship, total: sub - discount + ship };
  }

  /* ---------- cart actions ---------- */
  function addToCart(id, qty) {
    id = Number(id); cart[id] = Math.min(10, (cart[id] || 0) + (qty || 1));
    save("dd_cart2", cart); refresh(); toast(byId(id).name + " added to cart");
  }
  function setQty(id, q) {
    if (q <= 0) delete cart[id]; else cart[id] = Math.min(10, q);
    save("dd_cart2", cart); refresh();
  }
  function toggleWish(id) {
    id = Number(id); var i = wish.indexOf(id);
    if (i === -1) { wish.push(id); toast("Saved to wishlist"); } else { wish.splice(i, 1); toast("Removed from wishlist"); }
    save("dd_wish", wish); refresh();
  }

  /* ---------- drawer (cart + wishlist) ---------- */
  var drawer = $("#drawer"), overlay = $("#overlay"), lastFocus = null, tab = "cart";
  function openDrawer(which) {
    tab = which || "cart"; lastFocus = document.activeElement;
    drawer.classList.add("open"); overlay.classList.add("open"); drawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll"); renderDrawer(); $("#drawerClose").focus();
  }
  function closeDrawer() {
    drawer.classList.remove("open"); overlay.classList.remove("open"); drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll"); if (lastFocus) lastFocus.focus();
  }
  function renderDrawer() {
    $$(".d-tab").forEach(function (b) { var on = b.getAttribute("data-tab") === tab; b.setAttribute("aria-selected", String(on)); b.classList.toggle("on", on); });
    var body = $("#drawerBody"), foot = $("#drawerFoot"), html = "";
    if (tab === "cart") {
      var ids = Object.keys(cart).filter(function (id) { return byId(id); });
      if (!ids.length) {
        body.innerHTML = '<div class="empty"><p>Your cart is empty.</p><a class="btn" href="' + SHOP + '">Start shopping</a></div>'; foot.innerHTML = ""; return;
      }
      ids.forEach(function (id) {
        var p = byId(id), q = cart[id];
        html += '<div class="line"><img src="' + imgSrc(p) + '" alt="" width="72" height="72"><div class="line-info"><strong>' + p.name + '</strong><span class="muted">' + p.cat + " · " + p.material + '</span>' +
          '<div class="qty" role="group" aria-label="Quantity for ' + p.name + '"><button type="button" data-act="dec" data-id="' + id + '" aria-label="Decrease quantity">&minus;</button><span>' + q + '</span><button type="button" data-act="inc" data-id="' + id + '" aria-label="Increase quantity">+</button></div></div>' +
          '<div class="line-end"><strong>' + money(p.price * q) + '</strong><button type="button" class="link-btn" data-act="rm" data-id="' + id + '">Remove</button></div></div>';
      });
      body.innerHTML = html;
      var t = totals(), left = Math.max(0, FREE_SHIPPING - (t.sub - t.discount));
      foot.innerHTML =
        '<p class="ship-note">' + (left > 0 ? "Add " + money(left) + " more for free shipping" : "You get free shipping") + '</p>' +
        '<form class="promo" id="promoForm"><label class="sr" for="promoInput">Promo code</label><input id="promoInput" placeholder="Promo code (try ' + PROMO.code + ')" autocomplete="off"><button class="btn small ghost" type="submit">Apply</button></form>' +
        '<p class="msg" id="promoMsg" role="status">' + (promoOn ? "Code " + PROMO.code + " applied: -" + PROMO.pct + "%" : "") + '</p>' +
        '<dl class="sum"><div><dt>Subtotal</dt><dd>' + money(t.sub) + '</dd></div>' + (t.discount ? '<div><dt>Discount</dt><dd>-' + money(t.discount) + '</dd></div>' : "") +
        '<div><dt>Shipping</dt><dd>' + (t.ship ? money(t.ship) : "Free") + '</dd></div><div class="grand"><dt>Total</dt><dd>' + money(t.total) + '</dd></div></dl>' +
        '<button class="btn wide" type="button" id="checkoutBtn">Checkout</button><button class="link-btn center-btn" type="button" data-act="clear">Empty cart</button>';
    } else {
      if (!wish.length) { body.innerHTML = '<div class="empty"><p>Your wishlist is empty. Tap the heart on a product to save it.</p></div>'; foot.innerHTML = ""; return; }
      wish.forEach(function (id) {
        var p = byId(id); if (!p) return;
        html += '<div class="line"><img src="' + imgSrc(p) + '" alt="" width="72" height="72"><div class="line-info"><strong>' + p.name + '</strong><span class="muted">' + money(p.price) + '</span>' +
          '<button type="button" class="btn small" data-act="wadd" data-id="' + id + '">Add to cart</button></div><div class="line-end"><button type="button" class="link-btn" data-act="wrm" data-id="' + id + '">Remove</button></div></div>';
      });
      body.innerHTML = html; foot.innerHTML = "";
    }
  }
  function refresh() {
    var t = totals();
    $$("[data-cart-count]").forEach(function (e) { e.textContent = t.count; e.hidden = t.count === 0; });
    $$("[data-wish-count]").forEach(function (e) { e.textContent = wish.length; e.hidden = wish.length === 0; });
    if (drawer.classList.contains("open")) renderDrawer();
    document.dispatchEvent(new CustomEvent("dd:change"));
  }

  drawer.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (b) {
      var id = b.getAttribute("data-id"), a = b.getAttribute("data-act");
      if (a === "inc") setQty(id, (cart[id] || 0) + 1);
      else if (a === "dec") setQty(id, (cart[id] || 0) - 1);
      else if (a === "rm") setQty(id, 0);
      else if (a === "clear") { cart = {}; save("dd_cart2", cart); refresh(); }
      else if (a === "wadd") { addToCart(id, 1); }
      else if (a === "wrm") { toggleWish(id); }
      return;
    }
    var t = e.target.closest(".d-tab"); if (t) { tab = t.getAttribute("data-tab"); renderDrawer(); }
    if (e.target.id === "checkoutBtn") openCheckout();
  });
  drawer.addEventListener("submit", function (e) {
    if (e.target.id !== "promoForm") return; e.preventDefault();
    var v = $("#promoInput").value.trim().toUpperCase(), m = $("#promoMsg");
    if (v === PROMO.code) { promoOn = true; save("dd_promo", true); refresh(); } else { m.className = "msg err"; m.textContent = "This code is not valid."; }
  });
  $("#drawerClose").addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.classList.contains("open")) closeDrawer(); });
  $$("[data-open]").forEach(function (b) { b.addEventListener("click", function () { openDrawer(b.getAttribute("data-open")); }); });

  /* ---------- checkout (demo) ---------- */
  var co = $("#checkoutDialog");
  function openCheckout() {
    if (!totals().count) return; closeDrawer();
    var t = totals();
    $("#coSummary").textContent = t.count + " item" + (t.count > 1 ? "s" : "") + " · Total " + money(t.total);
    $("#coForm").hidden = false; $("#coDone").hidden = true; $("#coMsg").textContent = "";
    if (co.showModal) co.showModal(); else co.setAttribute("open", "");
  }
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  $("#coForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, req = ["coName", "coEmail", "coAddress", "coCity", "coZip"], ok = true;
    req.forEach(function (id) {
      var el = $("#" + id), v = el.value.trim(), good = v.length >= 2 && (id !== "coEmail" || EMAIL.test(v)) && (id !== "coZip" || /^[\w\s-]{3,10}$/.test(v));
      el.classList.toggle("bad", !good); el.setAttribute("aria-invalid", String(!good)); if (!good) ok = false;
    });
    var m = $("#coMsg"); m.className = "msg " + (ok ? "ok" : "err");
    if (!ok) { m.textContent = "Please check the highlighted fields."; return; }
    var t = totals(), no = "DD-" + Math.floor(100000 + Math.random() * 900000);
    $("#coOrderNo").textContent = no; $("#coDoneEmail").textContent = $("#coEmail").value.trim(); $("#coDoneTotal").textContent = money(t.total);
    cart = {}; promoOn = false; save("dd_cart2", cart); save("dd_promo", false); refresh();
    f.reset(); f.hidden = true; $("#coDone").hidden = false;
  });
  $$("[data-close-dialog]").forEach(function (b) { b.addEventListener("click", function () { b.closest("dialog").close(); }); });
  $$("dialog").forEach(function (d) { d.addEventListener("click", function (e) { if (e.target === d) d.close(); }); });

  /* ---------- mobile menu ---------- */
  var menuBtn = $("#menuBtn"), nav = $("#nav");
  menuBtn.addEventListener("click", function () {
    var o = nav.classList.toggle("open"); menuBtn.setAttribute("aria-expanded", String(o)); menuBtn.setAttribute("aria-label", o ? "Close menu" : "Open menu");
  });

  /* ---------- shared product card (used by home and shop) ---------- */
  window.DD = {
    money: money, byId: byId, imgSrc: imgSrc, addToCart: addToCart, toggleWish: toggleWish, isWish: function (id) { return wish.indexOf(Number(id)) !== -1; }, BASE: BASE,
    card: function (p) {
      var w = wish.indexOf(p.id) !== -1;
      return '<article class="product" data-id="' + p.id + '"><div class="p-img"><button type="button" class="p-open" data-act="view" data-id="' + p.id + '" aria-label="Quick view: ' + p.name + '"><img src="' + imgSrc(p) + '" alt="' + p.name + ', ' + p.cat.toLowerCase().replace(/s$/, "") + '" width="368" height="368" loading="lazy"></button>' +
        (p.badge ? '<span class="badge">' + p.badge + '</span>' : "") +
        '<button type="button" class="heart' + (w ? " on" : "") + '" data-act="wish" data-id="' + p.id + '" aria-pressed="' + w + '" aria-label="' + (w ? "Remove " : "Save ") + p.name + (w ? " from" : " to") + ' wishlist"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.500-4.600-9.500-9.200C1.200 8.600 3 5.500 6.200 5.500c1.900 0 3.200 1 3.800 2.200.600-1.200 1.900-2.200 3.800-2.200 3.200 0 5 3.100 3.700 6.300C19.500 16.400 12 21 12 21z"/></svg></button></div>' +
        '<div class="p-body"><p class="kicker">' + p.cat + " · " + p.material + '</p><h3>' + p.name + '</h3><p class="price">' + money(p.price) + '</p><button type="button" class="btn small" data-act="add" data-id="' + p.id + '">Add to cart</button></div></article>';
    },
    bind: function (root) {
      root.addEventListener("click", function (e) {
        var b = e.target.closest("[data-act]"); if (!b) return; var id = b.getAttribute("data-id"), a = b.getAttribute("data-act");
        if (a === "add") addToCart(id, 1); else if (a === "wish") toggleWish(id); else if (a === "view") openView(id);
      });
    }
  };

  /* ---------- quick view ---------- */
  var qv = $("#quickView"), qvId = null;
  function openView(id) {
    var p = byId(id); if (!p || !qv) return; qvId = p.id;
    $("#qvImg").src = imgSrc(p); $("#qvImg").alt = p.name;
    $("#qvCat").textContent = p.cat + " · " + p.material; $("#qvName").textContent = p.name; $("#qvDesc").textContent = p.desc; $("#qvPrice").textContent = money(p.price);
    $("#qvQty").value = 1; syncQvWish();
    var rel = PRODUCTS.filter(function (x) { return x.cat === p.cat && x.id !== p.id; }).slice(0, 3);
    $("#qvRel").innerHTML = rel.map(function (r) { return '<button type="button" data-rel="' + r.id + '"><img src="' + imgSrc(r) + '" alt="' + r.name + '" width="64" height="64"></button>'; }).join("");
    if (qv.showModal) qv.showModal(); else qv.setAttribute("open", "");
  }
  function syncQvWish() { var w = wish.indexOf(qvId) !== -1; var b = $("#qvWish"); b.setAttribute("aria-pressed", String(w)); b.textContent = w ? "♥ Saved" : "♡ Save"; }
  if (qv) {
    $("#qvAdd").addEventListener("click", function () { addToCart(qvId, Math.max(1, Math.min(10, parseInt($("#qvQty").value, 10) || 1))); qv.close(); });
    $("#qvWish").addEventListener("click", function () { toggleWish(qvId); syncQvWish(); });
    $("#qvRel").addEventListener("click", function (e) { var b = e.target.closest("[data-rel]"); if (b) openView(b.getAttribute("data-rel")); });
  }
  document.addEventListener("dd:change", function () { if (qv && qv.open) syncQvWish(); });

  /* ---------- home page ---------- */
  var feat = $("#featured");
  if (feat) {
    var best = PRODUCTS.filter(function (p) { return p.badge === "Best seller"; }).concat(PRODUCTS.filter(function (p) { return p.badge === "New"; })).slice(0, 4);
    var render = function () { feat.innerHTML = best.map(DD.card).join(""); };
    render(); DD.bind(feat); document.addEventListener("dd:change", render);
  }
  var car = $("#carousel");
  if (car) {
    var slides = $$(".slide", car), dots = $("#dots"), i = 0, timer;
    slides.forEach(function (s, n) { var d = document.createElement("button"); d.type = "button"; d.setAttribute("aria-label", "Go to slide " + (n + 1)); d.addEventListener("click", function () { go(n); restart(); }); dots.appendChild(d); });
    var go = function (n) { i = (n + slides.length) % slides.length; slides.forEach(function (s, k) { s.classList.toggle("active", k === i); }); $$("button", dots).forEach(function (d, k) { d.setAttribute("aria-current", String(k === i)); }); };
    var restart = function () { clearInterval(timer); if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) timer = setInterval(function () { go(i + 1); }, 5000); };
    $(".prev", car).addEventListener("click", function () { go(i - 1); restart(); });
    $(".next", car).addEventListener("click", function () { go(i + 1); restart(); });
    go(0); restart();
  }
  var news = $("#newsForm");
  if (news) news.addEventListener("submit", function (e) {
    e.preventDefault(); var f = $("#newsEmail"), m = $("#newsMsg"), ok = EMAIL.test(f.value.trim());
    f.classList.toggle("bad", !ok); m.className = "msg " + (ok ? "ok" : "err");
    m.textContent = ok ? "Thank you! Use code " + PROMO.code + " for " + PROMO.pct + "% off your cart." : "Please enter a valid email address."; if (ok) f.value = "";
  });

  /* ---------- contact page ---------- */
  var form = $("#contactForm");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var n = $("#cname"), em = $("#cemail"), s = $("#csubject"), msg = $("#cmessage"), m = $("#formMsg");
    var checks = [[n, n.value.trim().length >= 2], [em, EMAIL.test(em.value.trim())], [s, s.value !== ""], [msg, msg.value.trim().length >= 10]], ok = true;
    checks.forEach(function (c) { c[0].classList.toggle("bad", !c[1]); c[0].setAttribute("aria-invalid", String(!c[1])); if (!c[1]) ok = false; });
    m.className = "msg " + (ok ? "ok" : "err");
    if (!ok) { m.textContent = "Please fill in all fields correctly (message: at least 10 characters)."; return; }
    var body = msg.value.trim() + "\n\n" + n.value.trim() + "\n" + em.value.trim();
    window.location.href = "mailto:jevticm319@gmail.com?subject=" + encodeURIComponent("Diamond Dreams: " + s.value) + "&body=" + encodeURIComponent(body);
    m.textContent = "Your email app should open with the message ready to send.";
  });

  refresh();
})();
