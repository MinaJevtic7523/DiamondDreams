(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Mobile menu
  var btn = $("#menuBtn"), nav = $("#nav");
  btn.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  // Toast
  var toast = $("#toast"), tt;
  function say(msg) {
    toast.textContent = msg; toast.classList.add("show");
    clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove("show"); }, 2600);
  }

  // Cart count (saved in the browser)
  var cart = 0;
  try { cart = parseInt(localStorage.getItem("dd_cart"), 10) || 0; } catch (e) {}
  var count = $("#cartCount");
  function showCount() { count.textContent = cart; }
  function saveCount() { try { localStorage.setItem("dd_cart", String(cart)); } catch (e) {} }
  showCount();

  // Shop: add to cart and sorting
  var products = $("#products");
  if (products) {
    var dialog = $("#cartDialog");
    products.addEventListener("click", function (e) {
      if (!e.target.classList.contains("add")) return;
      var card = e.target.closest(".product");
      cart++; saveCount(); showCount();
      $("#dlgText").textContent = card.getAttribute("data-name") + " was added to your cart.";
      if (dialog && dialog.showModal) dialog.showModal(); else say("Added to cart");
    });
    var items = $$(".product", products);
    $("#sort").addEventListener("change", function () {
      var v = this.value, list = items.slice();
      if (v === "low") list.sort(function (a, b) { return a.dataset.price - b.dataset.price; });
      if (v === "high") list.sort(function (a, b) { return b.dataset.price - a.dataset.price; });
      list.forEach(function (c) { products.appendChild(c); });
    });
  }

  // Carousel
  var car = $("#carousel");
  if (car) {
    var slides = $$(".slide", car), dots = $("#dots"), i = 0, timer;
    slides.forEach(function (s, n) {
      var d = document.createElement("button");
      d.type = "button"; d.setAttribute("aria-label", "Go to slide " + (n + 1));
      d.addEventListener("click", function () { go(n); restart(); });
      dots.appendChild(d);
    });
    function go(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("active", k === i); });
      $$("button", dots).forEach(function (d, k) { d.setAttribute("aria-current", String(k === i)); });
    }
    function restart() {
      clearInterval(timer);
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) timer = setInterval(function () { go(i + 1); }, 5000);
    }
    $(".prev", car).addEventListener("click", function () { go(i - 1); restart(); });
    $(".next", car).addEventListener("click", function () { go(i + 1); restart(); });
    go(0); restart();
  }

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Newsletter (demo)
  var news = $("#newsForm");
  if (news) news.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = $("#newsEmail"), m = $("#newsMsg"), ok = EMAIL.test(f.value.trim());
    f.classList.toggle("bad", !ok);
    m.className = "msg " + (ok ? "ok" : "err");
    m.textContent = ok ? "Thank you! (Demo only, your email was not stored.)" : "Please enter a valid email address.";
    if (ok) f.value = "";
  });

  // Contact form: validate, then open the email app
  var form = $("#contactForm");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var n = $("#cname"), em = $("#cemail"), s = $("#csubject"), msg = $("#cmessage"), m = $("#formMsg");
    var checks = [[n, n.value.trim().length >= 2], [em, EMAIL.test(em.value.trim())], [s, s.value !== ""], [msg, msg.value.trim().length >= 10]];
    var ok = true;
    checks.forEach(function (c) { c[0].classList.toggle("bad", !c[1]); c[0].setAttribute("aria-invalid", String(!c[1])); if (!c[1]) ok = false; });
    m.className = "msg " + (ok ? "ok" : "err");
    if (!ok) { m.textContent = "Please fill in all fields correctly (message: at least 10 characters)."; return; }
    var body = msg.value.trim() + "\n\n" + n.value.trim() + "\n" + em.value.trim();
    window.location.href = "mailto:jevticm319@gmail.com?subject=" + encodeURIComponent("Diamond Dreams: " + s.value) + "&body=" + encodeURIComponent(body);
    m.textContent = "Your email app should open with the message ready to send.";
  });
})();
