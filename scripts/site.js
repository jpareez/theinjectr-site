/* THE INJECTR — shared behavior.
   Pre-rendered content: everything here is progressive enhancement.
   All motion no-ops under prefers-reduced-motion. */

(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ---------- Scroll reveal (quiet fade-and-rise, ~600ms) ---------- */
  if (!reducedMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("reveal-ready");
    var ioHealthy = false;
    var io = new IntersectionObserver(
      function (entries) {
        ioHealthy = true;
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      io.observe(el);
    });
    /* Fail-safe: if the observer never reports (it should fire immediately
       with the initial intersection state), reveal everything rather than
       leaving content hidden. */
    setTimeout(function () {
      if (!ioHealthy) {
        document.documentElement.classList.remove("reveal-ready");
        io.disconnect();
      }
    }, 500);
  }

  /* ---------- Before / After sliders ---------- */
  document.querySelectorAll(".ba").forEach(function (ba) {
    var handle = ba.querySelector(".ba-handle");
    if (!handle) return;

    function setPos(pct) {
      pct = Math.max(2, Math.min(98, pct));
      ba.style.setProperty("--pos", pct + "%");
      handle.setAttribute("aria-valuenow", String(Math.round(pct)));
    }

    function pctFromEvent(e) {
      var rect = ba.getBoundingClientRect();
      return ((e.clientX - rect.left) / rect.width) * 100;
    }

    var dragging = false;

    handle.addEventListener("pointerdown", function (e) {
      dragging = true;
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    handle.addEventListener("pointermove", function (e) {
      if (dragging) setPos(pctFromEvent(e));
    });
    handle.addEventListener("pointerup", function () { dragging = false; });
    handle.addEventListener("pointercancel", function () { dragging = false; });

    handle.addEventListener("keydown", function (e) {
      var now = parseFloat(handle.getAttribute("aria-valuenow")) || 50;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        setPos(now - 5);
        e.preventDefault();
      } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        setPos(now + 5);
        e.preventDefault();
      } else if (e.key === "Home") {
        setPos(2);
        e.preventDefault();
      } else if (e.key === "End") {
        setPos(98);
        e.preventDefault();
      }
    });
  });

  /* ---------- Toolbox treatment explorer ---------- */
  document.querySelectorAll("[data-toolbox]").forEach(function (box) {
    var tabs = Array.prototype.slice.call(box.querySelectorAll("[data-tool]"));
    var panels = Array.prototype.slice.call(box.querySelectorAll("[data-tool-panel]"));
    var medias = Array.prototype.slice.call(box.querySelectorAll("[data-tool-media]"));
    function select(name) {
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-tool") === name;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach(function (p) {
        p.classList.toggle("is-active", p.getAttribute("data-tool-panel") === name);
      });
      medias.forEach(function (m) {
        m.classList.toggle("is-active", m.getAttribute("data-tool-media") === name);
      });
    }
    tabs.forEach(function (t) {
      var name = t.getAttribute("data-tool");
      t.addEventListener("click", function () { select(name); });
      t.addEventListener("mouseenter", function () { select(name); });
      t.addEventListener("focus", function () { select(name); });
    });
  });

  /* ---------- Magnetic primary CTA (hover devices only) ---------- */
  if (!reducedMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    document.querySelectorAll(".btn-primary, .btn-light").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        btn.style.transition = "background-color 200ms, color 200ms";
        btn.style.transform = "translate(" + (dx * 5).toFixed(1) + "px," + (dy * 4).toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", function () {
        btn.style.transition = "transform 420ms cubic-bezier(0.2, 0.9, 0.3, 1.35), background-color 200ms, color 200ms";
        btn.style.transform = "";
      });
    });
  }

  /* ---------- Cursor halo ---------- */
  if (!reducedMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var halo = document.createElement("div");
    halo.className = "cursor-halo";
    halo.setAttribute("aria-hidden", "true");
    document.body.appendChild(halo);
    var hx = -100, hy = -100, htx = -100, hty = -100;
    document.addEventListener("pointermove", function (e) { htx = e.clientX; hty = e.clientY; });
    document.addEventListener("pointerover", function (e) {
      halo.classList.toggle("on", !!(e.target.closest && e.target.closest("a, button, summary, .ba-handle, .toolbox-tab")));
    });
    (function haloLoop() {
      hx += (htx - hx) * 0.18;
      hy += (hty - hy) * 0.18;
      halo.style.transform = "translate(" + hx.toFixed(1) + "px," + hy.toFixed(1) + "px)";
      requestAnimationFrame(haloLoop);
    })();
  }

  /* ---------- Parallax decorations ---------- */
  var parEls = document.querySelectorAll("[data-parallax]");
  function parallaxUpdate() {
    var y = window.scrollY;
    parEls.forEach(function (el) {
      el.style.transform = "translateY(" + (y * parseFloat(el.getAttribute("data-parallax"))).toFixed(1) + "px)";
    });
  }

  /* ---------- Scroll-lit manifesto words ---------- */
  var wordEls = [];
  if (!reducedMotion) {
    document.querySelectorAll("[data-words]").forEach(function (el) {
      Array.prototype.slice.call(el.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          var frag = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
            } else {
              var s = document.createElement("span");
              s.className = "w";
              s.textContent = part;
              frag.appendChild(s);
            }
          });
          el.replaceChild(frag, node);
        } else if (node.nodeType === 1) {
          node.classList.add("w");
        }
      });
      wordEls.push({ el: el, words: el.querySelectorAll(".w") });
    });
  }
  function wordsUpdate() {
    var vh = window.innerHeight;
    wordEls.forEach(function (item) {
      var r = item.el.getBoundingClientRect();
      var p = (vh * 0.88 - r.top) / (vh * 0.55);
      p = Math.max(0, Math.min(1, p));
      var n = Math.round(p * item.words.length);
      for (var i = 0; i < item.words.length; i++) {
        item.words[i].classList.toggle("lit", i < n);
      }
    });
  }

  if (!reducedMotion && (parEls.length || wordEls.length)) {
    var scrollTicking = false;
    function onScrollFx() {
      if (scrollTicking) return;
      scrollTicking = true;
      requestAnimationFrame(function () {
        parallaxUpdate();
        wordsUpdate();
        scrollTicking = false;
      });
    }
    window.addEventListener("scroll", onScrollFx, { passive: true });
    window.addEventListener("resize", onScrollFx);
    onScrollFx();
  }

  /* ---------- Lazy media video ----------
     Ambient loops (data-autoplay): load + play only while in view, pause when
     out. Skipped under reduced motion (poster stays). Click-to-play players
     ([data-vplayer]): nothing downloads until the user presses play. */
  (function () {
    var ambient = Array.prototype.slice.call(document.querySelectorAll("video[data-autoplay]"));
    if (ambient.length && "IntersectionObserver" in window) {
      var startVideo = function (v) {
        // iOS will NOT autoplay unless muted/playsInline are set as PROPERTIES
        // (the HTML attributes alone are unreliable once src is assigned by JS).
        v.muted = true;
        v.playsInline = true;
        v.setAttribute("muted", "");
        if (!v.getAttribute("src") && v.dataset.src) v.setAttribute("src", v.dataset.src);
        var p = v.play();
        if (p && p.catch) {
          p.catch(function () {
            // iOS can reject a play() issued before the freshly-set src has data; retry when it loads.
            v.addEventListener("loadeddata", function retry() {
              v.removeEventListener("loadeddata", retry);
              var p2 = v.play();
              if (p2 && p2.catch) p2.catch(function () {});
            });
          });
        }
      };
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var v = en.target;
          if (en.isIntersecting) startVideo(v);
          else if (!v.paused) v.pause();
        });
      }, { threshold: 0.25 });
      ambient.forEach(function (v) { vio.observe(v); });
    }

    document.querySelectorAll("[data-vplayer]").forEach(function (p) {
      var v = p.querySelector("video");
      var btn = p.querySelector(".vplay");
      if (!v || !btn) return;
      btn.addEventListener("click", function () {
        if (!v.getAttribute("src") && v.dataset.src) v.setAttribute("src", v.dataset.src);
        p.classList.add("is-playing");
        v.setAttribute("controls", "");
        var pr = v.play();
        if (pr && pr.catch) pr.catch(function () {});
      });
    });
  })();

  /* ---------- Contact form (front-end only for now) ---------- */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.querySelector("[data-form-note]");
      if (note) {
        note.hidden = false;
        note.focus();
      }
      form.querySelector("button[type='submit']").disabled = true;
    });
  }
})();
