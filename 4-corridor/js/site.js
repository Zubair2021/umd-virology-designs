(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  // Mobile menu
  var btn = document.querySelector(".menu-btn"), nav = document.getElementById("site-nav");
  function setMenu(open) { nav.classList.toggle("open", open); btn.setAttribute("aria-expanded", open ? "true" : "false"); btn.textContent = open ? "Close" : "Menu"; }
  if (btn && nav) {
    btn.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) { setMenu(false); btn.focus(); } });
  }

  // Header border once the page scrolls
  var head = document.querySelector(".site-head");
  function onScroll() { if (head) head.classList.toggle("scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  // Reveal on scroll, only for content below the first screen
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.remove("pre"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -6% 0px" });
    $$(".reveal").forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add("pre"); io.observe(el); }
    });
  }

  // Google map: switch the embedded location when a campus is chosen
  var PREVIEW = /claude|anthropic/i.test(location.hostname);
  if (PREVIEW) $$(".mapbox").forEach(function (b) { b.classList.add("is-preview"); var t = b.querySelector(".map-fallback span"); if (t) t.innerHTML = "<b>Map preview</b>The Google map is blocked inside this preview. It loads when the site is opened normally."; });
  var frame = document.getElementById("gmap"), open = document.getElementById("gmap-open");
  var sites = $$(".site[data-q]");
  function showSite(s) {
    sites.forEach(function (o) { o.setAttribute("aria-pressed", o === s ? "true" : "false"); });
    var q = encodeURIComponent(s.dataset.q);
    if (frame && !PREVIEW) frame.src = "https://maps.google.com/maps?q=" + q + "&z=" + (s.dataset.z || 15) + "&output=embed";
    if (open) open.href = "https://www.google.com/maps/search/?api=1&query=" + q;
  }
  sites.forEach(function (s) { s.addEventListener("click", function () { showSite(s); }); });
  if (sites.length) showSite(sites[0]);

  // Faculty filters (directory and the search-led homepage)
  var cards = $$("[data-person]");
  if (cards.length) {
    var chips = $$(".chip[data-filter]"), topics = $$(".topic[data-topic]");
    var q = document.getElementById("fac-search");
    var empty = document.getElementById("fac-empty"), count = document.getElementById("fac-count");
    var inst = "all", topic = "";
    var lim = document.querySelector(".people[data-limit]"), limit = lim ? parseInt(lim.dataset.limit, 10) || 0 : 0;
    function apply() {
      var term = (q && q.value || "").trim().toLowerCase(), shown = 0;
      var filtering = !!(term || topic || inst !== "all");
      cards.forEach(function (c) {
        var ok = (inst === "all" || c.dataset.inst === inst) &&
                 (!term || c.textContent.toLowerCase().indexOf(term) !== -1) &&
                 (!topic || (" " + c.dataset.topics + " ").indexOf(" " + topic + " ") !== -1);
        if (ok && limit && !filtering && shown >= limit) ok = false;
        c.hidden = !ok; if (ok) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
      if (count) count.textContent = filtering ? shown + (shown === 1 ? " scientist matches" : " scientists match") : count.dataset.idle;
    }
    chips.forEach(function (ch) { ch.addEventListener("click", function () {
      inst = ch.dataset.filter;
      chips.forEach(function (o) { o.setAttribute("aria-pressed", o === ch ? "true" : "false"); }); apply();
    }); });
    topics.forEach(function (t) { t.addEventListener("click", function () {
      topic = topic === t.dataset.topic ? "" : t.dataset.topic;
      topics.forEach(function (o) { o.setAttribute("aria-pressed", o.dataset.topic === topic ? "true" : "false"); }); apply();
    }); });
    if (q) q.addEventListener("input", apply);
    var form = document.getElementById("fac-form");
    if (form) form.addEventListener("submit", function (e) { e.preventDefault(); apply(); var r = document.getElementById("results"); if (r) r.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); });
    var h = location.hash.replace("#", "");
    chips.forEach(function (c) { if (c.dataset.filter === h) c.click(); });
    apply();
  }

  // Group meeting dates
  var sched = $$(".schedule li[data-date]");
  if (sched.length) {
    var today = new Date(); today.setHours(0, 0, 0, 0); var marked = false;
    sched.forEach(function (li) {
      var day = new Date(li.dataset.date + "T00:00:00");
      if (day < today) li.classList.add("past");
      else if (!marked) { marked = true; li.classList.add("next"); var k = li.querySelector(".k"); if (k) k.textContent = day.getTime() === today.getTime() ? "Today" : "Next meeting"; }
    });
  }
})();


// News bar: keep only upcoming events, in date order, and flag the next one
(function () {
  var bar = document.querySelector(".newsbar"), track = bar && bar.querySelector(".nb-track");
  if (!track) return;
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var items = Array.prototype.slice.call(track.querySelectorAll("a[data-date]"))
    .filter(function (a) { return new Date(a.dataset.date + "T00:00:00") >= today; })
    .sort(function (a, b) { return a.dataset.date < b.dataset.date ? -1 : 1; });
  if (!items.length) { bar.hidden = true; return; }
  track.innerHTML = "";
  var first = items[0], tag = document.createElement("b");
  tag.textContent = new Date(first.dataset.date + "T00:00:00").getTime() === today.getTime() ? "Today" : "Next";
  first.insertBefore(tag, first.firstChild);
  var loop = document.createElement("span"); loop.className = "nb-loop"; loop.textContent = "Upcoming in date order";
  var set = [loop].concat(items);
  set.forEach(function (n) { track.appendChild(n); });
  set.forEach(function (n) { var c = n.cloneNode(true); c.setAttribute("aria-hidden", "true"); if (c.tagName === "A") c.tabIndex = -1; track.appendChild(c); });
  track.style.setProperty("--nb-dur", Math.max(24, items.length * 9) + "s");
})();

// Drifting icosahedral capsids (red line art). Interactive on the home hero: they dodge the pointer, and a click buds new virions.
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var t = (1 + Math.sqrt(5)) / 2, V = [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]], ED = [];
  for (var i = 0; i < 12; i++) for (var j = i + 1; j < 12; j++) { var a = V[i], b = V[j]; if (Math.abs((a[0]-b[0])*(a[0]-b[0]) + (a[1]-b[1])*(a[1]-b[1]) + (a[2]-b[2])*(a[2]-b[2]) - 4) < .01) ED.push([i, j]); }
  Array.prototype.forEach.call(document.querySelectorAll("canvas.capsids"), function (cv) {
    var CC = (getComputedStyle(cv).getPropertyValue("--capsid-rgb") || "211,16,43").trim(), x = cv.getContext("2d"), host = cv.parentNode, D = Math.min(window.devicePixelRatio || 1, 2), W = 0, H = 0, ps = [], m = { x: -1e4, y: -1e4 };
    var live = cv.hasAttribute("data-interactive"), big = cv.hasAttribute("data-feature"), visible = true;
    function rs() { var r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * D; cv.height = H * D; x.setTransform(D, 0, 0, D, 0, 0); }
    function mk(px, py, s) { var z = Math.random(); return { x: px, y: py, z: z, s: s || (12 + z * (live ? 46 : 34)), vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3,
      ax: Math.random() * 6, ay: Math.random() * 6, sa: (Math.random() - .5) * .01, sb: (Math.random() - .5) * .01, k: Math.random() < .35, life: 0 }; }
    rs();
    var n = Math.round((W * H) / (live ? 26000 : 30000)); n = Math.max(8, Math.min(live ? 26 : 16, n));
    for (var i = 0; i < n; i++) ps.push(mk(W * (.25 + Math.random() * .75), Math.random() * H));
    if (big) { var f = mk(W * .76, H * .48, Math.min(W, H) * .2); f.z = 1; f.big = true; f.k = true; f.vx = f.vy = 0; ps.push(f); }
    ps.sort(function (p, q) { return p.z - q.z; });
    function draw(p) {
      var ca = Math.cos(p.ax), sa = Math.sin(p.ax), cb = Math.cos(p.ay), sb = Math.sin(p.ay), s = p.s / 1.9, P = [];
      for (var i = 0; i < 12; i++) { var v = V[i], y1 = v[1] * ca - v[2] * sa, z1 = v[1] * sa + v[2] * ca, x2 = v[0] * cb + z1 * sb; P.push([p.x + x2 * s, p.y + y1 * s]); }
      var al = (p.big ? .55 : (.14 + p.z * .42)) * (p.life ? p.life : 1);
      x.strokeStyle = "rgba(" + CC + "," + al + ")"; x.lineWidth = p.big ? 1.6 : .7 + p.z * .9; x.beginPath();
      ED.forEach(function (e) { var a = P[e[0]], b = P[e[1]]; x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); }); x.stroke();
      if (p.k) { x.fillStyle = "rgba(" + CC + "," + al + ")"; P.forEach(function (q) { var dx = q[0] - p.x, dy = q[1] - p.y, l = Math.hypot(dx, dy) || 1;
        x.beginPath(); x.moveTo(q[0], q[1]); x.lineTo(q[0] + dx / l * s * .38, q[1] + dy / l * s * .38); x.stroke();
        x.beginPath(); x.arc(q[0] + dx / l * s * .44, q[1] + dy / l * s * .44, p.big ? 3.2 : 1 + p.z * 1.4, 0, 7); x.fill(); }); }
    }
    function step() {
      x.clearRect(0, 0, W, H);
      for (var i = ps.length - 1; i >= 0; i--) {
        var p = ps[i];
        if (p.big) { p.ax += .0025 + (m.y > 0 ? (m.y / H - .5) * .006 : 0); p.ay += .004 + (m.x > 0 ? (m.x / W - .5) * .006 : 0); continue; }
        var dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy);
        if (live && d < 150) { var k = (150 - d) / 150 * .55; p.vx += dx / d * k; p.vy += dy / d * k; }
        p.vx = p.vx * .97 + (Math.random() - .5) * .02; p.vy = p.vy * .97 + (Math.random() - .5) * .02;
        p.x += p.vx + .06 + p.z * .1; p.y += p.vy; p.ax += p.sa + p.vy * .004; p.ay += p.sb + p.vx * .004;
        if (p.life) { p.life -= .003; if (p.life <= 0) { ps.splice(i, 1); continue; } }
        var M = p.s; if (p.x > W + M) p.x = -M; if (p.x < -M) p.x = W + M; if (p.y > H + M) p.y = -M; if (p.y < -M) p.y = H + M;
      }
      ps.forEach(draw);
      if (!reduce && visible) requestAnimationFrame(step);
    }
    window.addEventListener("resize", function () { rs(); if (big) ps.forEach(function (p) { if (p.big) { p.x = W * .76; p.y = H * .48; p.s = Math.min(W, H) * .2; } }); if (reduce) step(); });
    if (live) {
      host.addEventListener("pointermove", function (e) { var r = cv.getBoundingClientRect(); m.x = e.clientX - r.left; m.y = e.clientY - r.top; });
      host.addEventListener("pointerleave", function () { m.x = m.y = -1e4; });
      host.addEventListener("click", function (e) {
        if (e.target.closest("a, button")) return;
        var r = cv.getBoundingClientRect();
        for (var i = 0; i < 6; i++) { var a = i / 6 * 6.283, q = mk(e.clientX - r.left, e.clientY - r.top, 8 + Math.random() * 12);
          q.vx = Math.cos(a) * (1.6 + Math.random() * 1.6); q.vy = Math.sin(a) * (1.6 + Math.random() * 1.6); q.life = 1; q.z = .6 + Math.random() * .4; ps.push(q); }
        if (ps.length > 90) ps.splice(0, ps.length - 90);
      });
    }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { var was = visible; visible = es[0].isIntersecting; if (visible && !was && !reduce) step(); }).observe(cv);
    step();
  });
})();

// Hero virion follows the pointer a little (parallax)
(function () {
  var v = document.querySelector(".hero-virion"), hero = document.querySelector(".vhero");
  if (!v || !hero || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
  var tx = 0, ty = 0, cx = 0, cy = 0, on = false;
  hero.addEventListener("pointermove", function (e) { var r = hero.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - .5) * -28; ty = ((e.clientY - r.top) / r.height - .5) * -20; if (!on) { on = true; loop(); } });
  hero.addEventListener("pointerleave", function () { tx = ty = 0; });
  function loop() { cx += (tx - cx) * .06; cy += (ty - cy) * .06; v.style.marginRight = (-cx) + "px"; v.style.marginTop = cy + "px"; if (Math.abs(tx - cx) + Math.abs(ty - cy) > .1) requestAnimationFrame(loop); else on = false; }
})();

// Countdown to the retreat (any element with data-countdown)
(function () {
  var els = document.querySelectorAll("[data-countdown]");
  if (!els.length) return;
  function tick() {
    els.forEach(function (el) {
      var t = new Date(el.dataset.countdown), now = new Date(), ms = t - now;
      var day0 = new Date(now); day0.setHours(0, 0, 0, 0);
      var tday = new Date(t); tday.setHours(0, 0, 0, 0);
      var days = Math.round((tday - day0) / 864e5);
      if (days < 0) { el.textContent = ""; return; }
      var short = el.hasAttribute("data-short");
      el.textContent = days === 0 ? "Today" : days === 1 ? "Tomorrow" : (short ? "in " + days + " days" : days + " days to go");
    });
  }
  tick(); setInterval(tick, 60000);
})();

// Upcoming lists: hide past events, flag the next one, respect data-limit
(function () {
  var today = new Date(); today.setHours(0, 0, 0, 0);
  document.querySelectorAll(".ev-list").forEach(function (list) {
    var lim = +list.dataset.limit || 0, shown = 0;
    list.querySelectorAll(".ev-row").forEach(function (r) {
      var past = new Date(r.dataset.date + "T00:00:00") < today;
      var hide = past || (lim && shown >= lim);
      r.hidden = !!hide;
      if (!hide) { if (!shown) r.classList.add("is-next"); shown++; }
    });
  });
  // past meetings in the schedule fade
  document.querySelectorAll(".schedule li[data-date]").forEach(function (li) { if (new Date(li.dataset.date + "T00:00:00") < today) li.classList.add("past"); });
})();

// Faculty spotlight: rotate one person at a time, with dots
(function () {
  document.querySelectorAll(".spotlight[data-rotate]").forEach(function (box) {
    var items = box.querySelectorAll(".spot"), nav = box.querySelector(".spot-nav"), i = 0, timer;
    if (items.length < 2) return;
    var dots = document.createElement("div"); dots.className = "spot-dots";
    items.forEach(function (it, k) { var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-label", "Show " + (it.querySelector("b") || {}).textContent); b.onclick = function () { go(k); restart(); }; dots.appendChild(b); });
    if (nav) nav.insertBefore(dots, nav.firstChild);
    function go(k) { items[i].classList.remove("on"); i = (k + items.length) % items.length; items[i].classList.add("on"); dots.querySelectorAll("button").forEach(function (b, n) { b.setAttribute("aria-current", n === i ? "true" : "false"); }); }
    function restart() { clearInterval(timer); if (!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) timer = setInterval(function () { go(i + 1); }, +box.dataset.rotate || 7000); }
    box.addEventListener("mouseenter", function () { clearInterval(timer); }); box.addEventListener("mouseleave", restart);
    go(0); restart();
  });
})();

// Gallery tabs
(function () {
  var tabs = document.querySelectorAll(".gal-tabs [data-g]"), groups = document.querySelectorAll(".gal-group");
  if (!tabs.length) return;
  function sel(g) { tabs.forEach(function (t) { t.setAttribute("aria-selected", t.dataset.g === g ? "true" : "false"); }); groups.forEach(function (gr) { gr.hidden = !(g === "all" || gr.dataset.g === g); }); }
  tabs.forEach(function (t) { t.addEventListener("click", function () { sel(t.dataset.g); }); });
  if (/science|3d/.test(location.hash)) sel("science");
})();

// Lightbox for the 3D models
(function () {
  var lb = document.getElementById("lightbox");
  if (!lb) return;
  var img = lb.querySelector("img"), cap = lb.querySelector("figcaption"), last;
  function close() { lb.hidden = true; document.body.style.overflow = ""; if (last) last.focus(); }
  document.querySelectorAll(".lb-open").forEach(function (b) {
    b.addEventListener("click", function () { last = b; img.src = b.dataset.full; img.alt = b.dataset.caption; cap.textContent = b.dataset.caption; lb.hidden = false; document.body.style.overflow = "hidden"; lb.querySelector(".lb-close").focus(); });
  });
  lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb-close")) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lb.hidden) close(); });
})();

// Publications filter by faculty member
(function () {
  var s = document.getElementById("pub-filter");
  if (!s) return;
  function run() {
    var v = s.value;
    document.querySelectorAll(".pub-year").forEach(function (y) {
      var any = false;
      y.querySelectorAll("li[data-person]").forEach(function (li) { var ok = !v || li.dataset.person === v; li.hidden = !ok; if (ok) any = true; });
      y.hidden = !any;
    });
  }
  s.addEventListener("change", run);
  var m = location.hash.match(/^#by-(.+)$/); if (m) { s.value = m[1]; run(); }
})();

/* Corridor theme script */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Event lines ("Monday, November 23 · 12:15–1:15 pm · Microbiology 1123") wrap between parts,
  // never inside a date, time range or room.
  document.querySelectorAll(".ev-t small").forEach(function (s) {
    if (s.children.length || s.textContent.indexOf(" \u00b7 ") < 0) return;
    var parts = s.textContent.split(" \u00b7 "); s.textContent = "";
    parts.forEach(function (t, i) {
      if (i) s.appendChild(document.createTextNode("\u00a0\u00b7 "));
      var sp = document.createElement("span"); sp.className = "cx-nw"; sp.textContent = t; s.appendChild(sp);
    });
  });

  // Corridor schematic: a stop selects that institution in the map below and scrolls to it.
  var ORDER = { umd: 0, vet: 1, nih: 2, ibbr: 3 };
  var cards = Array.prototype.slice.call(document.querySelectorAll(".inst-card"));
  var stops = Array.prototype.slice.call(document.querySelectorAll("[data-stop]"));
  function keyOf(card) { var i = cards.indexOf(card); for (var k in ORDER) if (ORDER[k] === i) return k; return ""; }
  // Home: the site list under the map is a compact four-stop switcher (the full names are on the
  // corridor above, so they are not listed twice); the selected site's name sits on the map.
  var SHORT = { umd: ["UMD", "College Park"], vet: ["Vet Med", "College Park"], nih: ["NIH", "Bethesda"], ibbr: ["IBBR", "Rockville"] };
  var cap = null, mb0 = document.querySelector("#map .mapbox");
  if (document.body.classList.contains("page-index") && mb0) {
    cards.forEach(function (c) {
      var k = keyOf(c), t = SHORT[k], b = c.querySelector("b"), sm = c.querySelector("small");
      if (!t || c.querySelector(".cx-short")) return;
      c.setAttribute("aria-label", (b ? b.textContent : t[0]) + (sm ? ", " + sm.textContent : "") + ". Show on the map");
      var sp = document.createElement("span"); sp.className = "cx-short"; sp.setAttribute("aria-hidden", "true");
      sp.innerHTML = "<b>" + t[0] + "</b><small>" + t[1] + "</small>"; c.appendChild(sp);
    });
    cap = document.createElement("div"); cap.className = "cx-mapcap"; cap.setAttribute("aria-live", "polite"); mb0.appendChild(cap);
  }
  function sync() {
    var on = cards.filter(function (c) { return c.getAttribute("aria-pressed") === "true"; })[0];
    var k = on ? keyOf(on) : "";
    stops.forEach(function (s) { s.classList.toggle("on", s.dataset.stop === k); });
    if (cap) {
      var b = on && on.querySelector("span:not(.cx-short):not(.lg) b"), sm = on && on.querySelector("span:not(.cx-short):not(.lg) small");
      cap.innerHTML = b ? "<b>" + b.textContent + "</b>" + (sm ? "<small>" + sm.textContent + "</small>" : "") : "";
      cap.hidden = !b;
    }
  }
  cards.forEach(function (c) { c.addEventListener("click", function () { setTimeout(sync, 0); }); });
  stops.forEach(function (s) {
    function go() {
      var card = cards[ORDER[s.dataset.stop]];
      if (card) card.click();
      var sec = document.getElementById("map");
      if (sec) sec.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      if (card) setTimeout(function () { try { card.focus({ preventScroll: true }); } catch (e) {} }, reduce ? 0 : 600);
    }
    s.addEventListener("click", go);
    if (s.tagName !== "BUTTON") s.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  });
  sync(); setTimeout(sync, 0);

  // Fit each red line so it starts and ends exactly on its first and last visible stop.
  function fit() {
    [[".ev-list", ".ev-row"], [".cx-strip", "li"], [".nav", "a:not(.nav-join-m)"]].forEach(function (d) {
      document.querySelectorAll(d[0]).forEach(function (box) {
        var it = Array.prototype.filter.call(box.querySelectorAll(d[1]), function (e) { return e.offsetParent !== null; });
        if (it.length < 2) return;
        var r = box.getBoundingClientRect(), a = it[0].getBoundingClientRect(), z = it[it.length - 1].getBoundingClientRect();
        box.style.setProperty("--lt", Math.round(a.top + a.height / 2 - r.top) + "px");
        box.style.setProperty("--lb", Math.round(r.bottom - z.top - z.height / 2) + "px");
      });
    });
  }
  var mb = document.querySelector(".menu-btn"); if (mb) mb.addEventListener("click", function () { setTimeout(fit, 0); });
  fit(); setTimeout(fit, 50); window.addEventListener("resize", fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();
