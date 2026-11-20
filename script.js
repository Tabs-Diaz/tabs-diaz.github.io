(function () {
  var root = document.documentElement;
  root.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Opening chat: messages arrive one by one */
  document.querySelectorAll(".bubble").forEach(function (el) {
    setTimeout(function () { el.classList.add("is-shown"); }, reduce ? 0 : 600 + Number(el.dataset.delay) * 900);
  });

  /* Gradient: navy to eggshell as you scroll. Each section holds a mood and blends near its edges,
     so text never sits on a muddy mid-tone for long. Text color flips once the page is light. */
  var secs = [{ el: document.querySelector(".hero"), mood: 0 }];
  document.querySelectorAll("[data-mood]").forEach(function (el) { secs.push({ el: el, mood: parseFloat(el.dataset.mood) }); });
  var BLEND = 140;
  function updateMood() {
    var y = window.scrollY + window.innerHeight * 0.5, mood = null, i;
    for (i = 1; i < secs.length; i++) {
      var d = y - secs[i].el.offsetTop;
      if (Math.abs(d) < BLEND) { mood = secs[i - 1].mood + (secs[i].mood - secs[i - 1].mood) * ((d + BLEND) / (2 * BLEND)); break; }
    }
    if (mood === null) {
      mood = secs[secs.length - 1].mood;
      for (i = 0; i < secs.length - 1; i++) { if (y < secs[i + 1].el.offsetTop) { mood = secs[i].mood; break; } }
    }
    root.style.setProperty("--mood", mood.toFixed(3));
    root.classList.toggle("theme-light", mood > 0.5);
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { updateMood(); ticking = false; }); }
  }, { passive: true });
  window.addEventListener("resize", updateMood);
  updateMood();


  /* Tableau embeds: same behavior as Tableau's own embed code, one block for all three */
  function sizeViz(frame) {
    var obj = frame.querySelector("object.tableauViz");
    if (obj) { obj.style.width = "100%"; obj.style.height = Math.round(frame.querySelector(".tableauPlaceholder").offsetWidth * parseFloat(frame.dataset.ratio || "0.75")) + "px"; }
  }
  var frames = document.querySelectorAll(".viz-frame[data-ratio]");
  frames.forEach(function (frame) {
    var obj = frame.querySelector("object.tableauViz");
    if (!obj) { return; }
    sizeViz(frame);
    var s = document.createElement("script");
    s.src = "https://public.tableau.com/javascripts/api/viz_v1.js";
    obj.parentNode.insertBefore(s, obj);
  });
  window.addEventListener("resize", function () { frames.forEach(sizeViz); });

  /* Price bars draw once in view */
  var charts = document.querySelectorAll(".chart");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-drawn"); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    charts.forEach(function (c) { io.observe(c); });
  } else { charts.forEach(function (c) { c.classList.add("is-drawn"); }); }

  /* Tooltips */
  var pop = null, owner = null;
  function closeTip() { if (pop) { pop.remove(); pop = null; } if (owner) { owner.removeAttribute("aria-describedby"); owner = null; } }
  document.querySelectorAll(".tip").forEach(function (btn) {
    btn.setAttribute("type", "button");
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (owner === btn) { closeTip(); return; }
      closeTip();
      pop = document.createElement("span");
      pop.className = "tip-pop"; pop.id = "tip-pop"; pop.setAttribute("role", "tooltip");
      pop.textContent = btn.dataset.tip;
      document.body.appendChild(pop);
      var r = btn.getBoundingClientRect();
      pop.style.left = Math.min(Math.max(8, r.left + window.scrollX), window.scrollX + window.innerWidth - pop.offsetWidth - 8) + "px";
      pop.style.top = (r.bottom + window.scrollY + 8) + "px";
      btn.setAttribute("aria-describedby", "tip-pop");
      owner = btn;
    });
  });
  document.addEventListener("click", closeTip);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeTip(); });

  /* Share */
  var shareBtn = document.getElementById("share"), status = document.getElementById("share-status");
  shareBtn.addEventListener("click", function () {
    var data = { title: document.title, text: "A plain-language guide to why Puerto Rico's lights keep going out.", url: location.href };
    if (navigator.share) { navigator.share(data).catch(function () {}); }
    else if (navigator.clipboard) {
      navigator.clipboard.writeText(data.url).then(function () { status.textContent = "Link copied. Paste it into your family chat."; },
        function () { status.textContent = "Copy the link from your address bar."; });
    } else { status.textContent = "Copy the link from your address bar."; }
  });
})();
