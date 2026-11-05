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


/* ===== Capsid Field theme: interactive field of icosahedral capsids (ported from the first draft, recoloured to UMD red) ===== */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Page heads and the footer get their own field canvas; the core line-art canvas is hidden by theme.css.
  document.querySelectorAll(".page-head").forEach(function (h) {
    var c = document.createElement("canvas"); c.className = "cf-field"; c.setAttribute("aria-hidden", "true");
    c.dataset.mode = h.classList.contains("slim") ? "slim" : "head"; h.insertBefore(c, h.firstChild);
  });
  var foot = document.querySelector(".site-foot");
  if (foot) { var fc = document.createElement("canvas"); fc.className = "cf-field"; fc.setAttribute("aria-hidden", "true"); fc.dataset.mode = "foot"; foot.insertBefore(fc, foot.firstChild); }

  var phi = (1 + Math.sqrt(5)) / 2, L = Math.sqrt(1 + phi * phi);
  var V = [[-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0], [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi], [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]]
    .map(function (v) { return [v[0] / L, v[1] / L, v[2] / L]; });
  var ED = [];
  for (var i = 0; i < 12; i++) for (var j = i + 1; j < 12; j++)
    if (Math.hypot(V[i][0] - V[j][0], V[i][1] - V[j][1], V[i][2] - V[j][2]) < 1.1) ED.push([i, j]);

  var INK = "#231c20", RED = "#c8102e", ROSE = "#f6cdd5", REDF = "#d9233f";
  // line-art ink, rose-filled, ink, red line-art, ink, red-filled (the draft's accent capsids are now rose or red)
  var PAL = [{ s: INK, f: null }, { s: INK, f: ROSE }, { s: INK, f: null }, { s: RED, f: null }, { s: INK, f: null }, { s: "#7d0a1d", f: REDF }, { s: RED, f: null }, { s: INK, f: ROSE }];
  var CONF = {
    hero: { dens: 36000, min: 10, max: 30, rmin: 10, rmax: 40, right: .6, link: 170, live: true },
    head: { dens: 24000, min: 7, max: 18, rmin: 8, rmax: 30, right: .6, link: 140, live: true },
    slim: { dens: 20000, min: 4, max: 9, rmin: 5, rmax: 12, right: .62, link: 110, live: false },
    foot: { dens: 30000, min: 5, max: 12, rmin: 6, rmax: 16, right: .6, link: 130, live: false }
  };

  document.querySelectorAll("canvas.cf-field").forEach(function (cv) {
    if (!cv.getContext) return;
    var cfg = CONF[cv.dataset.mode] || CONF.head, ctx = cv.getContext("2d"), host = cv.parentElement;
    var W = 0, H = 0, dpr = 1, small = false, parts = [], mouse = { x: -9999, y: -9999 }, visible = true, running = false, linkD = cfg.link;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight; if (!W || !H) return;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      small = W < 760; linkD = small ? cfg.link * .7 : cfg.link;
      var n = Math.round(Math.min(cfg.max, Math.max(cfg.min, W * H / cfg.dens)));
      if (small) n = Math.max(cfg.min - 2, Math.round(n * (cv.dataset.mode === "hero" ? 1.1 : .55)));
      parts = [];
      for (var k = 0; k < n; k++) {
        var r = (small ? .7 : 1) * (cfg.rmin + Math.pow(Math.random(), 2) * (cfg.rmax - cfg.rmin));
        // keep most capsids (and all the big ones) toward the right so the copy stays readable
        var rt0 = small ? .5 : cfg.right, x = Math.random() < .8 || r > cfg.rmax * .55 ? W * (rt0 + Math.random() * (1 - rt0)) : Math.random() * W;
        parts.push({ x: x, y: Math.random() * H, r: r, vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18,
          a: Math.random() * 6, b: Math.random() * 6, va: (Math.random() - .5) * .006, vb: (Math.random() - .5) * .006, c: PAL[k % PAL.length], P: [] });
      }
      parts.sort(function (p, q) { return p.r - q.r; });
      // keep solid red to the small capsids so the red never floods; large filled ones are soft rose
      parts.forEach(function (p) { if (p.c.f === REDF && p.r > cfg.rmax * .5) p.c = PAL[1]; });
    }
    function project(p) {
      var ca = Math.cos(p.a), sa = Math.sin(p.a), cb = Math.cos(p.b), sb = Math.sin(p.b);
      for (var i = 0; i < 12; i++) {
        var v = V[i], x = v[0] * ca + v[2] * sa, z = -v[0] * sa + v[2] * ca;
        p.P[i] = [x, v[1] * cb - z * sb, v[1] * sb + z * cb];
      }
    }
    function drawCapsid(p) {
      project(p);
      var P = p.P, r = p.r, s = p.c.s, i, q, e, A, B;
      ctx.lineWidth = r > 24 ? 1.4 : 1.1; ctx.strokeStyle = s;
      // back edges (faint), in one path
      ctx.globalAlpha = .2; ctx.beginPath();
      for (i = 0; i < ED.length; i++) { e = ED[i]; A = P[e[0]]; B = P[e[1]]; if (A[2] + B[2] <= 0) { ctx.moveTo(p.x + A[0] * r, p.y + A[1] * r); ctx.lineTo(p.x + B[0] * r, p.y + B[1] * r); } }
      ctx.stroke();
      // spikes with knobs
      for (i = 0; i < 12; i++) {
        q = P[i]; if (q[2] < -.2) continue;
        var x2 = p.x + q[0] * r * 1.45, y2 = p.y + q[1] * r * 1.45;
        ctx.globalAlpha = .5 + q[2] * .4;
        ctx.beginPath(); ctx.moveTo(p.x + q[0] * r, p.y + q[1] * r); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.beginPath(); ctx.arc(x2, y2, Math.max(1.5, r * .07), 0, 6.283); ctx.fillStyle = p.c.f || "#fff"; ctx.fill(); ctx.stroke();
      }
      if (p.c.f) { ctx.globalAlpha = .9; ctx.fillStyle = p.c.f; ctx.beginPath(); ctx.arc(p.x, p.y, r * .93, 0, 6.283); ctx.fill(); }
      // front edges
      ctx.globalAlpha = .9; ctx.beginPath();
      for (i = 0; i < ED.length; i++) { e = ED[i]; A = P[e[0]]; B = P[e[1]]; if (A[2] + B[2] > 0) { ctx.moveTo(p.x + A[0] * r, p.y + A[1] * r); ctx.lineTo(p.x + B[0] * r, p.y + B[1] * r); } }
      ctx.stroke();
    }
    function frame() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // dashed links between neighbours: the inter-institution network (3 alpha buckets, 3 strokes)
      ctx.lineWidth = 1; ctx.strokeStyle = "#b9a7ac"; ctx.setLineDash([2, 4]);
      for (var b = 0; b < 3; b++) {
        ctx.globalAlpha = (b + 1) * .12; ctx.beginPath();
        for (var i = 0; i < parts.length; i++) for (var j = i + 1; j < parts.length; j++) {
          var p = parts[i], q = parts[j], dx = p.x - q.x, dy = p.y - q.y;
          if (Math.abs(dx) > linkD || Math.abs(dy) > linkD) continue;
          var d = Math.sqrt(dx * dx + dy * dy); if (d >= linkD) continue;
          if (Math.min(2, Math.floor((1 - d / linkD) * 3)) !== b) continue;
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      for (var k = 0; k < parts.length; k++) drawCapsid(parts[k]);
      ctx.globalAlpha = 1;
    }
    function move() {
      for (var k = 0; k < parts.length; k++) {
        var p = parts[k];
        if (cfg.live) {
          var dx = p.x - mouse.x, dy = p.y - mouse.y, dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140 && dist > .1) { var f = (140 - dist) / 140 * .6; p.vx += dx / dist * f; p.vy += dy / dist * f; p.va += .002; }
        }
        p.vx = p.vx * .96 + (Math.random() - .5) * .02; p.vy = p.vy * .96 + (Math.random() - .5) * .02; p.va *= .98;
        p.x += p.vx + .12; p.y += p.vy; p.a += p.va + .003; p.b += p.vb + .002;
        var M = p.r * 1.6;
        if (p.x > W + M) p.x = -M; if (p.x < -M) p.x = W + M; if (p.y > H + M) p.y = -M; if (p.y < -M) p.y = H + M;
      }
    }
    function loop() {
      if (!visible || document.hidden || reduce) { running = false; return; }
      move(); frame(); requestAnimationFrame(loop);
    }
    function start() { if (!running && !reduce && visible && !document.hidden) { running = true; requestAnimationFrame(loop); } }

    if (cfg.live && !reduce) {
      host.addEventListener("pointermove", function (e) { var r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
      host.addEventListener("pointerleave", function () { mouse.x = mouse.y = -9999; });
      host.addEventListener("click", function (e) {
        if (e.target.closest("a, button, input, select")) return;
        var r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        parts.forEach(function (p) { var dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy) || 1; if (d < 260) { p.vx += dx / d * 5 * (1 - d / 260); p.vy += dy / d * 5 * (1 - d / 260); p.va += .05; } });
      });
    }
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { var w = cv.clientWidth; if (Math.abs(w - W) > 40 || !parts.length) resize(); else { W = w; H = cv.clientHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); } frame(); }, 120); });
    document.addEventListener("visibilitychange", start);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; start(); }).observe(cv);
    resize(); frame(); start();
  });
})();

// Typed rotating research topics in the hero lede
(function () {
  var el = document.querySelector(".cf-typed");
  if (!el) return;
  var w = el.querySelector(".cf-word"), words = (el.dataset.words || "").split("|");
  if (words.length < 2 || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
  el.classList.add("is-typing");
  var i = 0, n = words[0].length, del = true;
  function tick() {
    var word = words[i];
    if (del) {
      n--; w.textContent = word.slice(0, n);
      if (n <= 0) { del = false; i = (i + 1) % words.length; return setTimeout(tick, 260); }
      return setTimeout(tick, 38);
    }
    word = words[i]; n++; w.textContent = word.slice(0, n);
    if (n >= word.length) { del = true; return setTimeout(tick, 1900); }
    setTimeout(tick, 70 + Math.random() * 50);
  }
  setTimeout(tick, 2200);
})();
