/* Rwiza Escapes — site interactions */
(function () {
  "use strict";
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var money = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
  var store = {
    get: function (k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- Mobile menu ---------- */
  var toggle = $(".nav-toggle"), nav = $("#site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open);
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
  }

  /* ---------- Toast ---------- */
  var toastEl = $(".toast"), toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2600);
  }

  /* ---------- Reveal on scroll ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Back to top ---------- */
  var top = $(".to-top");
  if (top) {
    window.addEventListener("scroll", function () { top.classList.toggle("is-visible", window.scrollY > 600); }, { passive: true });
    top.addEventListener("click", function () { window.scrollTo({ top: 0 }); });
  }

  /* ---------- Animated counters ---------- */
  $$("[data-count]").forEach(function (el) {
    var target = +el.getAttribute("data-count"), suffix = el.getAttribute("data-suffix") || "", done = false;
    function run() {
      if (done) return; done = true;
      var start = null;
      function step(t) {
        if (!start) start = t;
        var p = Math.min((t - start) / 1400, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString("en-US") + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e, o) { if (e[0].isIntersecting) { run(); o.disconnect(); } }).observe(el);
    } else { run(); }
  });

  /* ---------- Copy promo code ---------- */
  $$("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var code = btn.getAttribute("data-copy");
      var ok = function () { toast("Promo code " + code + " copied — paste it on the booking form"); };
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(ok, ok); else ok();
    });
  });

  /* ---------- Filters (packages & gallery) ---------- */
  $$(".filters").forEach(function (bar) {
    var target = $(bar.getAttribute("data-target"));
    if (!target) return;
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      $$("button", bar).forEach(function (x) { x.classList.toggle("is-active", x === b); x.setAttribute("aria-pressed", x === b); });
      var f = b.getAttribute("data-filter");
      $$("[data-region],[data-cat]", target).forEach(function (item) {
        var v = item.getAttribute("data-region") || item.getAttribute("data-cat") || "";
        var show = f === "all" || v.split(" ").indexOf(f) > -1;
        item.style.display = show ? "" : "none";
        if (show) item.classList.add("is-visible");
      });
    });
  });

  /* ---------- Gallery lightbox ---------- */
  var lb = $(".lightbox");
  if (lb) {
    var figs = $$(".gallery figure"), idx = 0, img = $("img", lb), cap = $("p", lb);
    var visible = function () { return figs.filter(function (f) { return f.style.display !== "none"; }); };
    var show = function (i) {
      var list = visible(); if (!list.length) return;
      idx = (i + list.length) % list.length;
      var f = list[idx];
      img.src = f.getAttribute("data-full");
      img.alt = $("img", f).alt;
      cap.textContent = $("figcaption", f).textContent;
    };
    figs.forEach(function (f) {
      f.tabIndex = 0;
      var open = function () { show(visible().indexOf(f)); lb.classList.add("is-open"); $(".lb-close", lb).focus(); };
      f.addEventListener("click", open);
      f.addEventListener("keydown", function (e) { if (e.key === "Enter") open(); });
    });
    $(".lb-close", lb).addEventListener("click", function () { lb.classList.remove("is-open"); });
    $(".lb-prev", lb).addEventListener("click", function () { show(idx - 1); });
    $(".lb-next", lb).addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.classList.remove("is-open"); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") lb.classList.remove("is-open");
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  }

  /* ---------- Countdown (offers) ---------- */
  $$("[data-countdown]").forEach(function (el) {
    var end = new Date(el.getAttribute("data-countdown")).getTime();
    var parts = $$("strong", el);
    function tick() {
      var d = Math.max(0, end - Date.now());
      var vals = [Math.floor(d / 864e5), Math.floor(d / 36e5) % 24, Math.floor(d / 6e4) % 60, Math.floor(d / 1e3) % 60];
      parts.forEach(function (p, i) { p.textContent = String(vals[i]).padStart(2, "0"); });
    }
    tick(); setInterval(tick, 1000);
  });

  /* ---------- Generic form validation ---------- */
  function validate(form) {
    var firstBad = null;
    $$("input, select, textarea", form).forEach(function (el) {
      if (el.type === "hidden" || el.closest(".hidden-field")) return;
      var bad = !el.checkValidity();
      el.classList.toggle("is-invalid", bad);
      if (bad && !firstBad) firstBad = el;
    });
    if (firstBad) {
      firstBad.focus();
      toast("Please complete the highlighted fields");
      return false;
    }
    return true;
  }
  $$("form[data-validate]").forEach(function (form) {
    form.setAttribute("novalidate", "");
    form.addEventListener("submit", function (e) {
      if (!validate(form)) { e.preventDefault(); return; }
      store.set("rwiza-last-form", form.getAttribute("name"));
    });
    form.addEventListener("input", function (e) { if (e.target.classList.contains("is-invalid") && e.target.checkValidity()) e.target.classList.remove("is-invalid"); });
    form.addEventListener("change", function (e) { if (e.target.classList.contains("is-invalid") && e.target.checkValidity()) e.target.classList.remove("is-invalid"); });
  });

  /* ---------- Home quick search -> booking ---------- */
  var quick = $("#quick-form");
  if (quick) {
    quick.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = new URLSearchParams();
      ["package", "date", "adults"].forEach(function (n) { var v = quick.elements[n].value; if (v) q.set(n, v); });
      location.href = "booking.html?" + q.toString();
    });
  }

  /* ---------- Star rating input ---------- */
  $$(".star-input").forEach(function (wrap) {
    var input = $("input", wrap), btns = $$("button", wrap);
    function paint(n) { btns.forEach(function (b, i) { b.textContent = i < n ? "★" : "☆"; b.setAttribute("aria-pressed", i < n); }); }
    btns.forEach(function (b, i) {
      b.addEventListener("click", function () { input.value = i + 1; paint(i + 1); });
    });
    paint(+input.value || 5);
  });

  /* =========================================================
     BOOKING CALCULATOR
     ========================================================= */
  var form = $("#booking-form");
  if (form && window.PACKAGES) {
    var P = window.PACKAGES;
    var ACCOM = { standard: 0, comfort: 0.15, luxury: 0.35 };
    var EXTRAS = {
      transfer: { label: "Airport transfers", per: "booking", price: 40 },
      insurance: { label: "Travel insurance", per: "person", price: 60 },
      visa: { label: "Visa assistance", per: "person", price: 30 },
      guide: { label: "Private guide upgrade", per: "day", price: 80 },
      photo: { label: "Photography package", per: "booking", price: 150 }
    };
    var PROMOS = {
      EARLY15: { pct: 15, label: "Early-bird 15% off", check: function (s) { return s.daysAhead >= 90 ? "" : "EARLY15 needs a travel date at least 90 days from today"; } },
      GROUP10: { pct: 10, label: "Group 10% off", check: function (s) { return s.adults + s.children >= 6 ? "" : "GROUP10 needs 6 or more travellers"; } },
      EAC20: { pct: 20, label: "EAC resident 20% off", check: function (s) { return s.region === "rwanda" || s.region === "east-africa" ? (s.resident ? "" : "EAC20 is for East African Community residents — tick the resident box") : "EAC20 applies to Rwanda & East Africa tours only"; } },
      ZANZI12: { pct: 12, label: "Festive Zanzibar 12% off", check: function (s) { return s.pkg === "zanzibar-6d" ? "" : "ZANZI12 applies to the Zanzibar Beach Getaway only"; } },
      HONEYMOON: { pct: 0, label: "Honeymoon perks (room upgrade, dinner & cake)", check: function (s) { return s.adults >= 2 ? "" : "HONEYMOON needs 2 adults"; } }
    };
    var el = function (n) { return form.elements[n]; };
    var appliedPromo = "";

    // Prefill from URL (?package=...&date=...&adults=...)
    var qs = new URLSearchParams(location.search);
    if (qs.get("package") && (P[qs.get("package")] || qs.get("package") === "custom")) el("package").value = qs.get("package");
    if (qs.get("date")) el("travel_date").value = qs.get("date");
    if (qs.get("adults")) el("adults").value = qs.get("adults");
    if (qs.get("promo")) { el("promo_code").value = qs.get("promo").toUpperCase(); appliedPromo = el("promo_code").value; }

    // Earliest travel date = 7 days from today (processing time)
    var min = new Date(); min.setDate(min.getDate() + 7);
    el("travel_date").min = min.toISOString().slice(0, 10);

    // Booking reference e.g. RWZ-261110-4821
    function makeRef() {
      var d = new Date();
      return "RWZ-" + String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0") + "-" + Math.floor(1000 + Math.random() * 9000);
    }
    el("booking_reference").value = makeRef();

    function state() {
      var pkgId = el("package").value, pkg = P[pkgId];
      var date = el("travel_date").value ? new Date(el("travel_date").value) : null;
      return {
        pkg: pkgId, p: pkg, region: pkg ? pkg.region : "",
        adults: Math.max(0, parseInt(el("adults").value, 10) || 0),
        children: Math.max(0, parseInt(el("children").value, 10) || 0),
        accom: (form.querySelector("input[name=accommodation]:checked") || {}).value || "standard",
        extras: $$("input[name='extras[]']:checked", form).map(function (c) { return c.value; }),
        resident: el("eac_resident").checked,
        date: date,
        daysAhead: date ? Math.round((date - new Date()) / 864e5) : 0
      };
    }

    function calc() {
      var s = state(), out = { lines: [] };
      $("#sum-ref").textContent = el("booking_reference").value;
      if (!s.p) {
        $("#sum-title").textContent = s.pkg === "custom" ? "Tailor-made trip" : "No package selected";
        $("#sum-sub").textContent = s.pkg === "custom" ? "Our consultants will send a personalised quote" : "Choose a tour package to see your price";
        $("#sum-img").src = "hero-hills-sm.jpg";
        $("#sum-lines").innerHTML = "";
        $("#sum-total").textContent = s.pkg === "custom" ? "Quote" : "$0";
        $("#sum-deposit").textContent = "—";
        el("estimated_total").value = s.pkg === "custom" ? "Quote on request" : "";
        return;
      }
      $("#sum-title").textContent = s.p.title;
      var ret = "";
      if (s.date) { var r = new Date(s.date); r.setDate(r.getDate() + s.p.days - 1); ret = " · " + s.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " – " + r.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
      $("#sum-sub").textContent = s.p.days + " days" + ret;
      $("#sum-img").src = "" + s.p.img + "-sm.jpg";
      var lines = [];
      var adultsCost = s.p.price * s.adults, kidsCost = s.p.price * 0.5 * s.children;
      lines.push(["Adults " + s.adults + " × " + money(s.p.price), adultsCost]);
      if (s.children) lines.push(["Children " + s.children + " × " + money(s.p.price * 0.5), kidsCost]);
      var base = adultsCost + kidsCost;
      if (ACCOM[s.accom]) lines.push([s.accom.charAt(0).toUpperCase() + s.accom.slice(1) + " accommodation +" + ACCOM[s.accom] * 100 + "%", base * ACCOM[s.accom]]);
      var pax = s.adults + s.children;
      s.extras.forEach(function (k) {
        var x = EXTRAS[k]; if (!x) return;
        var mult = x.per === "person" ? pax : x.per === "day" ? s.p.days : 1;
        if (k === "transfer" && s.p.days >= 5) { lines.push([x.label + " (free on 5+ days)", 0]); return; }
        lines.push([x.label, x.price * mult]);
      });
      var subtotal = lines.reduce(function (a, l) { return a + l[1]; }, 0);
      var discount = 0, promoLine = "";
      if (appliedPromo && PROMOS[appliedPromo]) {
        var pr = PROMOS[appliedPromo], err = pr.check(s);
        if (err) { setPromoMsg(err, false); }
        else {
          discount = (adultsCost + kidsCost) * pr.pct / 100;
          setPromoMsg("✓ " + pr.label + " applied", true);
          promoLine = pr.label;
        }
      }
      var total = subtotal - discount;
      var deposit = s.daysAhead > 0 && s.daysAhead <= 45 ? total : total * 0.3;
      var html = lines.map(function (l) { return "<dt>" + l[0] + "</dt><dd>" + money(l[1]) + "</dd>"; }).join("");
      if (discount) html += "<dt>" + promoLine + "</dt><dd class='discount'>−" + money(discount) + "</dd>";
      else if (promoLine) html += "<dt>" + promoLine + "</dt><dd class='discount'>Included</dd>";
      $("#sum-lines").innerHTML = html;
      $("#sum-total").textContent = money(total);
      $("#sum-deposit").textContent = money(deposit);
      $("#sum-deposit-label").textContent = s.daysAhead > 0 && s.daysAhead <= 45 ? "Full payment due (travel within 45 days)" : "30% deposit to confirm";
      el("estimated_total").value = money(total) + " (subtotal " + money(subtotal) + ", discount " + money(discount) + ", deposit " + money(deposit) + ")";
    }

    function setPromoMsg(msg, ok) {
      var m = $("#promo-msg");
      m.textContent = msg; m.className = "promo-msg " + (ok ? "ok" : "bad");
    }
    $("#apply-promo").addEventListener("click", function () {
      var code = el("promo_code").value.trim().toUpperCase();
      el("promo_code").value = code;
      if (!code) { appliedPromo = ""; setPromoMsg("", true); calc(); return; }
      if (!PROMOS[code]) { appliedPromo = ""; setPromoMsg("Sorry, “" + code + "” is not a valid promo code", false); calc(); return; }
      appliedPromo = code; calc();
    });
    el("promo_code").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); $("#apply-promo").click(); } });

    form.addEventListener("input", calc);
    form.addEventListener("change", calc);
    calc();
    if (appliedPromo) $("#apply-promo").click();

    form.addEventListener("submit", function (e) {
      if (form.querySelector(".is-invalid")) return;
      if (el("adults").value < 1) { e.preventDefault(); el("adults").classList.add("is-invalid"); el("adults").focus(); return; }
      if (!e.defaultPrevented) {
        var s = state();
        store.set("rwiza-booking", {
          ref: el("booking_reference").value,
          name: el("full_name").value,
          email: el("email").value,
          title: s.p ? s.p.title : "Tailor-made trip",
          date: el("travel_date").value,
          travellers: s.adults + " adult(s)" + (s.children ? ", " + s.children + " child(ren)" : ""),
          total: $("#sum-total").textContent,
          deposit: $("#sum-deposit").textContent,
          payment: (form.querySelector("input[name=payment_method]:checked") || {}).value || ""
        });
      }
    });
  }

  /* ---------- Thank-you page ---------- */
  var thanks = $("#thanks");
  if (thanks) {
    var kind = new URLSearchParams(location.search).get("form") || store.get("rwiza-last-form") || "booking";
    var b = store.get("rwiza-booking");
    $$("[data-kind]").forEach(function (x) { x.hidden = x.getAttribute("data-kind") !== kind; });
    if (kind === "booking" && b) {
      $("#t-ref").textContent = b.ref;
      $("#t-name").textContent = b.name.split(" ")[0];
      $("#t-email").textContent = b.email;
      var dl = $("#t-details");
      [["Package", b.title], ["Travel date", b.date ? new Date(b.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Flexible"], ["Travellers", b.travellers], ["Estimated total", b.total], ["Amount to confirm", b.deposit], ["Payment method", b.payment]].forEach(function (r) {
        if (!r[1]) return;
        dl.insertAdjacentHTML("beforeend", "<tr><th>" + r[0] + "</th><td></td></tr>");
        dl.lastElementChild.lastElementChild.textContent = r[1];
      });
    } else if (kind === "booking") {
      $$(".needs-booking").forEach(function (x) { x.hidden = true; });
    }
  }

  /* ---------- Send forms to Web3Forms (registered last, after validation & booking handlers) ---------- */
  $$("form[data-ajax]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      if (e.defaultPrevented) return; // validation failed
      e.preventDefault();
      var kind = form.getAttribute("data-ajax");
      var done = function () { store.set("rwiza-last-form", kind); location.href = "thank-you.html?form=" + kind; };
      if (form.elements.botcheck && form.elements.botcheck.checked) return; // spam bot
      var data = {};
      new FormData(form).forEach(function (v, k) {
        k = k.replace("[]", "");
        data[k] = data[k] ? data[k] + ", " + v : v;
      });
      delete data.botcheck;
      if (!data.access_key || data.access_key.indexOf("PASTE") === 0) {
        // No Web3Forms key configured yet: continue as a demo so the flow still works.
        if (window.console) console.warn("Web3Forms access key not set in build.py; submission was not emailed.");
        return done();
      }
      var btn = form.querySelector("[type=submit]"), label = btn ? btn.innerHTML : "";
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }
      fetch(form.action, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (res && res.success) return done();
        throw new Error(res && res.message);
      }).catch(function () {
        if (btn) { btn.disabled = false; btn.innerHTML = label; }
        toast("Sorry, we couldn't send that. Please try again or WhatsApp us.");
      });
    });
  });
})();
