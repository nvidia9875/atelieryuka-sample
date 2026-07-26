/* ============================================================
   D案 Motion「Something Blue — 風をまとうメゾン」 script.js
   モーション原則: イージングは fabric / quiet の2種のみ。
   prefers-reduced-motion / JS無効時は一切起動しない(CSSが静的サイトを保証)。
   ============================================================ */
(() => {
  "use strict";

  const docEl = document.documentElement;
  const ANIM = docEl.classList.contains("js-anim");
  const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- collection tabs (JSがあれば動く・モーション不要) ---------- */
  function tabsInit() {
    const tabs = $$(".tab");
    if (!tabs.length) return;
    const panels = tabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
    const select = (i, focus) => {
      tabs.forEach((t, k) => {
        const on = k === i;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        if (panels[k]) panels[k].hidden = !on;
      });
      if (focus) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(i));
      t.addEventListener("keydown", (e) => {
        let n = null;
        if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
        else if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") n = 0;
        else if (e.key === "End") n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); select(n, true); }
      });
    });
  }

  /* ---------- reservation form (3 steps + veil wipe) ---------- */
  function formInit() {
    const form = $("#rform");
    if (!form) return;
    const steps = $$(".fstep", form);
    const done = $(".fdone", form);
    const veil = $(".fveil", form);
    const fill = $("#fthreadFill");
    const dots = $$(".fdots li", form);
    const status = $("#formStatus");
    const names = ["ご利用目的と希望日", "衣裳の候補", "ご連絡先"];
    let cur = 0;
    let busy = false;

    steps.forEach((s, i) => { s.hidden = i !== 0; });

    const dateInput = $("#f-date");
    const iso = (d) => d.toISOString().slice(0, 10);
    const min = new Date(); min.setDate(min.getDate() + 10);
    const max = new Date(); max.setMonth(max.getMonth() + 4);
    dateInput.min = iso(min);
    dateInput.max = iso(max);

    const setErr = (id, show, input) => {
      const err = document.getElementById(id);
      if (err) err.hidden = !show;
      if (input) input.setAttribute("aria-invalid", show ? "true" : "false");
    };

    const validate = (i) => {
      let bad = null;
      if (i === 0) {
        const p = form.querySelector('input[name="purpose"]:checked');
        setErr("err-purpose", !p);
        if (!p) bad = form.querySelector('input[name="purpose"]');
        const okDate = dateInput.value !== "";
        setErr("err-date", !okDate, dateInput);
        if (!okDate && !bad) bad = dateInput;
      } else if (i === 1) {
        const c = form.querySelector('input[name="category"]:checked');
        setErr("err-cat", !c);
        if (!c) bad = form.querySelector('input[name="category"]');
      } else if (i === 2) {
        const nameEl = $("#f-name"), emailEl = $("#f-email"), telEl = $("#f-tel");
        const okN = nameEl.value.trim() !== "";
        setErr("err-name", !okN, nameEl);
        if (!okN && !bad) bad = nameEl;
        const okE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim());
        setErr("err-email", !okE, emailEl);
        if (!okE && !bad) bad = emailEl;
        const okT = /^[0-9+\-() ]{10,15}$/.test(telEl.value.trim());
        setErr("err-tel", !okT, telEl);
        if (!okT && !bad) bad = telEl;
      }
      if (bad) bad.focus();
      return !bad;
    };

    /* ベールワイプ: 覆う(200ms)→差し替え→抜ける(240ms)。reduced/静的時は即時 */
    const transition = (swap) => {
      if (!ANIM || !veil) { swap(); return; }
      busy = true;
      let swapped = false;
      const doSwap = () => {
        if (swapped) return;
        swapped = true;
        swap();
        veil.classList.remove("cover");
        veil.classList.add("exit");
        const end = () => { veil.classList.remove("exit"); busy = false; };
        veil.addEventListener("transitionend", end, { once: true });
        setTimeout(end, 400);
      };
      veil.classList.add("cover");
      veil.addEventListener("transitionend", doSwap, { once: true });
      setTimeout(doSwap, 320);
    };

    const progress = (i) => {
      if (fill) fill.style.transform = `scaleX(${i / 2})`;
      dots.forEach((d, k) => d.classList.toggle("on", k <= i));
    };

    const announce = (text) => { if (status) status.textContent = text; };

    const go = (i) => {
      if (busy || i < 0 || i > 2) return;
      cur = i;
      transition(() => {
        steps.forEach((s, k) => { s.hidden = k !== i; });
        progress(i);
        const legend = steps[i].querySelector(".fstep-title");
        if (legend) { legend.setAttribute("tabindex", "-1"); legend.focus({ preventScroll: true }); }
      });
      announce(`ステップ${i + 1}/3: ${names[i]}`);
    };

    form.addEventListener("click", (e) => {
      if (e.target.closest("[data-next]")) { if (validate(cur)) go(cur + 1); }
      else if (e.target.closest("[data-back]")) go(cur - 1);
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (busy || !validate(2)) return;
      const btn = $("#fsubmit");
      btn.disabled = true;
      btn.textContent = "送信中…";
      form.setAttribute("aria-busy", "true");
      announce("送信中…");
      setTimeout(() => {
        form.removeAttribute("aria-busy");
        transition(() => {
          steps.forEach((s) => { s.hidden = true; });
          done.hidden = false;
          if (fill) fill.style.transform = "scaleX(1)";
          dots.forEach((d) => d.classList.add("on"));
          done.classList.add("draw"); /* 刺繍の一輪(2s・1回のみ) */
          const title = $(".fdone-title", done);
          if (title) title.focus({ preventScroll: true });
        });
        announce("ご予約を承りました(デモ送信)");
      }, 800);
    });
  }

  /* ---------- intro veil (初回のみ・1.4s以内・スキップ可) ---------- */
  function intro() {
    const el = $("#intro");
    if (!el) return Promise.resolve();
    if (!ANIM || sessionStorage.getItem("ayd-intro")) { el.remove(); return Promise.resolve(); }
    try { sessionStorage.setItem("ayd-intro", "1"); } catch (e) { /* private mode */ }
    el.hidden = false;
    return new Promise((resolve) => {
      let finished = false;
      const done = () => {
        if (finished) return;
        finished = true;
        cleanup();
        el.remove();
        resolve();
      };
      const lift = (isSkip) => {
        if (isSkip) el.classList.add("skip");
        el.classList.add("lift");
        el.addEventListener("transitionend", done, { once: true });
        setTimeout(done, isSkip ? 420 : 1000);
      };
      const skip = () => lift(true);
      const cleanup = () => {
        window.removeEventListener("keydown", skip);
        window.removeEventListener("wheel", skip);
        window.removeEventListener("touchstart", skip);
        el.removeEventListener("click", skip);
      };
      el.addEventListener("click", skip);
      window.addEventListener("keydown", skip);
      window.addEventListener("wheel", skip, { passive: true });
      window.addEventListener("touchstart", skip, { passive: true });
      requestAnimationFrame(() => {
        el.classList.add("play");
        setTimeout(() => { if (!finished && !el.classList.contains("lift")) lift(false); }, 550);
      });
    });
  }

  /* ---------- 英字ラベルの文字stagger(SRには元テキストを保持) ---------- */
  function splitLabels() {
    $$(".klabel").forEach((label) => {
      const text = label.textContent;
      const sr = document.createElement("span");
      sr.className = "sr-only";
      sr.textContent = text;
      const wrap = document.createElement("span");
      wrap.setAttribute("aria-hidden", "true");
      Array.from(text).forEach((ch, i) => {
        if (ch === " ") { wrap.appendChild(document.createTextNode(" ")); return; }
        const s = document.createElement("span");
        s.className = "kl";
        s.style.setProperty("--i", String(i));
        s.textContent = ch;
        wrap.appendChild(s);
      });
      label.textContent = "";
      label.append(sr, wrap);
    });
  }

  /* ---------- 単発リビール(IO+CSS) ---------- */
  function revealInit() {
    const els = $$("[data-reveal], .st-lines, .klabel").filter((el) => !el.closest(".hero"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -7% 0px" });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- ヒーローの行マスク+CTA(イントロ完了後に開幕) ---------- */
  function heroIn() {
    const hero = $(".hero");
    if (!hero) return;
    hero.classList.add("hero-ready");
    $$("[data-reveal], .klabel", hero).forEach((el) => el.classList.add("in"));
  }

  /* ---------- 料金カウントアップ(600ms・1回のみ) ---------- */
  function countInit() {
    const els = $$(".count");
    if (!els.length) return;
    const fmt = new Intl.NumberFormat("ja-JP");
    const run = (el) => {
      const target = parseInt(el.dataset.count, 10);
      const t0 = performance.now();
      const D = 600;
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / D);
        el.textContent = fmt.format(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        run(e.target);
      });
    }, { threshold: 0.6 });
    els.forEach((el) => io.observe(el));
  }

  /* ---------- Photo Journey 低速マーキー(rAF・画面外停止・hoverで減速) ---------- */
  function marqueeInit() {
    const vp = $("#jviewport");
    if (!vp) return;
    const rows = $$(".jrow", vp);
    const toggle = $("#jtoggle");
    vp.classList.add("is-marquee");
    if (toggle) toggle.hidden = false;

    const BASE = 24, SLOW = 6;
    const states = rows.map((row) => {
      const set = $(".jset", row);
      const setW = set.getBoundingClientRect().width;
      const copies = Math.max(2, Math.ceil((window.innerWidth * 2) / setW) + 1);
      for (let i = 0; i < copies; i += 1) {
        const clone = set.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        $$("img", clone).forEach((im) => { im.alt = ""; });
        row.appendChild(clone);
      }
      const stride = row.children[1].offsetLeft - set.offsetLeft; /* set幅+gap */
      const dir = parseFloat(row.dataset.dir || "-1");
      return { row, stride, dir, x: dir > 0 ? -stride : 0, speed: BASE, target: BASE };
    });

    let rafId = null, running = true, inView = false, last = 0;
    const step = (now) => {
      const dt = Math.min(50, now - last) / 1000;
      last = now;
      states.forEach((s) => {
        s.speed += (s.target - s.speed) * 0.06;
        s.x += s.dir * s.speed * dt;
        if (s.dir > 0 && s.x >= 0) s.x -= s.stride;
        if (s.dir < 0 && s.x <= -s.stride) s.x += s.stride;
        s.row.style.transform = `translate3d(${s.x.toFixed(2)}px,0,0)`;
      });
      rafId = requestAnimationFrame(step);
    };
    const start = () => {
      if (rafId !== null || !running || !inView) return;
      last = performance.now();
      states.forEach((s) => { s.row.style.willChange = "transform"; });
      rafId = requestAnimationFrame(step);
    };
    const stop = () => {
      if (rafId === null) return;
      cancelAnimationFrame(rafId);
      rafId = null;
      states.forEach((s) => { s.row.style.willChange = ""; });
    };
    new IntersectionObserver((entries) => {
      inView = entries[0].isIntersecting;
      if (inView) start(); else stop();
    }).observe(vp);

    const slow = () => states.forEach((s) => { s.target = SLOW; });
    const fast = () => states.forEach((s) => { s.target = BASE; });
    vp.addEventListener("pointerenter", slow);
    vp.addEventListener("pointerleave", fast);
    vp.addEventListener("focusin", slow);
    vp.addEventListener("focusout", fast);
    if (toggle) {
      toggle.addEventListener("click", () => {
        running = !running;
        toggle.textContent = running ? "流れを止める" : "流れを再開する";
        if (running) start(); else stop();
      });
    }
  }

  /* ---------- マグネットボタン(±4px・desktop fine pointerのみ) ---------- */
  function magnetInit() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    $$("[data-magnet]").forEach((btn) => {
      let raf = null, tx = 0, ty = 0, cx = 0, cy = 0;
      const loop = () => {
        cx += (tx - cx) * 0.2;
        cy += (ty - cy) * 0.2;
        btn.style.transform = `translate(${cx.toFixed(2)}px,${cy.toFixed(2)}px)`;
        if (Math.hypot(tx - cx, ty - cy) > 0.05) raf = requestAnimationFrame(loop);
        else { raf = null; if (tx === 0 && ty === 0) btn.style.transform = ""; }
      };
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        tx = Math.max(-4, Math.min(4, (e.clientX - r.left - r.width / 2) * 0.12));
        ty = Math.max(-4, Math.min(4, (e.clientY - r.top - r.height / 2) * 0.25));
        if (!raf) raf = requestAnimationFrame(loop);
      });
      btn.addEventListener("pointerleave", () => {
        tx = 0; ty = 0;
        if (!raf) raf = requestAnimationFrame(loop);
      });
    });
  }

  /* ---------- GSAP + Lenis: パララックス/ランウェイ/縫い糸 ---------- */
  function motionInit() {
    if (!(window.gsap && window.ScrollTrigger && window.Lenis)) return;
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis();
    window.__ayLenis = lenis; // ライトボックスがモーダル中にスクロールを止めるための参照
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    /* アンカーはLenisで滑らかに(スキップリンクは即時ジャンプを維持) */
    $$('a[href^="#"]:not(.skip-link)').forEach((a) => {
      a.addEventListener("click", (e) => {
        const href = a.getAttribute("href");
        if (!href || href.length < 2) return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80 });
        history.pushState(null, "", href);
      });
    });

    /* ヒーロー3層パララックス(transformのみ・scrub) */
    const hero = $(".hero");
    if (hero) {
      const st = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
      gsap.to(".hero-mist", { yPercent: -7, ease: "none", scrollTrigger: st });
      gsap.to(".hero-photo", { yPercent: -15, ease: "none", scrollTrigger: st });
      gsap.to(".hero-type", { yPercent: -28, ease: "none", scrollTrigger: st });
    }

    /* 縫い糸: ご利用の流れをstroke-dashoffsetで縫い進める */
    const thread = $(".thread-path");
    if (thread) {
      gsap.to(thread, {
        strokeDashoffset: 0,
        ease: "none",
        scrollTrigger: { trigger: ".flow-wrap", start: "top 78%", end: "bottom 58%", scrub: 0.8 },
      });
    }

    const mm = gsap.matchMedia();

    /* ランウェイ: desktop=唯一のピン区間 / mobile=scroll-snap縦ショー */
    mm.add("(min-width: 769px)", () => {
      const stage = $("#runway");
      if (!stage) return;
      const looks = $$(".look", stage);
      const imgs = looks.map((l) => $(".look-img", l));
      const caps = looks.map((l) => $(".look-cap", l));
      const lcins = looks.map((l) => $$(".lcin", l));
      const tapeFill = $(".tape-fill", stage);
      const tapeNow = $("#tapeNow");
      const N = looks.length;

      /* ランウェイ分は事前デコードしてカクつきを防ぐ */
      imgs.forEach((img) => { img.loading = "eager"; });
      Promise.allSettled(imgs.map((img) => (img.decode ? img.decode() : Promise.resolve())));

      gsap.set(imgs, { opacity: 0, scale: 0.6, yPercent: -9, transformOrigin: "50% 85%" });
      gsap.set(imgs[0], { opacity: 1, scale: 1, yPercent: 0 });
      lcins.forEach((set) => gsap.set(set, { yPercent: 115 }));
      gsap.set(caps, { opacity: 1 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: () => `+=${N * window.innerHeight * 0.72}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onToggle: (self) => stage.classList.toggle("is-animating", self.isActive),
          onUpdate: (self) => {
            if (tapeFill) tapeFill.style.transform = `scaleY(${self.progress.toFixed(4)})`;
            if (tapeNow) {
              const idx = Math.min(N, 1 + Math.floor(self.progress * N));
              tapeNow.textContent = String(idx).padStart(2, "0");
            }
          },
        },
      });

      tl.to(lcins[0], { yPercent: 0, duration: 0.1, stagger: 0.03 }, 0.02);
      tl.to(".runway-hint", { opacity: 0, duration: 0.25 }, 0.55);
      for (let i = 1; i < N; i += 1) {
        const at = i - 1;
        tl.to(lcins[i - 1], { yPercent: 115, duration: 0.18 }, at + 0.28)
          .to(imgs[i - 1], { opacity: 0, scale: 1.07, duration: 0.34 }, at + 0.32)
          .fromTo(imgs[i], { opacity: 0, scale: 0.6, yPercent: -9 },
            { opacity: 1, scale: 1, yPercent: 0, duration: 0.5 }, at + 0.42)
          .to(lcins[i], { yPercent: 0, duration: 0.22, stagger: 0.05 }, at + 0.78);
      }
      tl.to({}, { duration: 0.45 }); /* フィナーレ(Azur)を保持 */

      return () => { stage.classList.remove("is-animating"); };
    });

    mm.add("(max-width: 768px)", () => {
      docEl.classList.add("runway-snap");
      return () => docEl.classList.remove("runway-snap");
    });

    /* ヒーローのポインタドリフト(±6px・lerp 0.06・desktop fineのみ) */
    mm.add("(min-width: 769px) and (hover: hover) and (pointer: fine)", () => {
      if (!hero) return;
      const drifts = $$(".drift", hero);
      let raf = null, tx = 0, ty = 0, cx = 0, cy = 0;
      const loop = () => {
        cx += (tx - cx) * 0.06;
        cy += (ty - cy) * 0.06;
        drifts.forEach((d) => {
          const f = parseFloat(d.dataset.drift || "1");
          d.style.transform = `translate3d(${(cx * f).toFixed(2)}px,${(cy * f).toFixed(2)}px,0)`;
        });
        if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) raf = requestAnimationFrame(loop);
        else raf = null;
      };
      const onMove = (e) => {
        tx = (e.clientX / window.innerWidth - 0.5) * 12;
        ty = (e.clientY / window.innerHeight - 0.5) * 12;
        if (!raf) raf = requestAnimationFrame(loop);
      };
      hero.addEventListener("pointermove", onMove);
      return () => {
        hero.removeEventListener("pointermove", onMove);
        if (raf) cancelAnimationFrame(raf);
        drifts.forEach((d) => { d.style.transform = ""; });
      };
    });
  }

  /* ---------- init ---------- */
  const init = () => {
    tabsInit();
    formInit();
    if (!ANIM) { const el = $("#intro"); if (el) el.remove(); return; }

    /* 閲覧中にreduced-motionへ切り替えられたら静的表示で読み直す */
    mqReduce.addEventListener("change", () => { if (mqReduce.matches) window.location.reload(); });

    splitLabels();
    revealInit();
    countInit();
    marqueeInit();
    magnetInit();
    motionInit();
    intro().then(heroIn);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

/* ---------- 画像ライトボックス(共通 assets/lightbox.js) ---------- */
(function () {
  "use strict";
  if (!window.AYLightbox) return;
  window.AYLightbox.attach(".pgrid", ".pitem", {
    frame: ".pframe",
    title: ".pname",
    sub: [".pmeta", ".pprice"],
  });
})();
(function () {
  "use strict";
  if (!window.AYLightbox) return;
  window.AYLightbox.attach("#jviewport", ".jset:first-of-type .jcard", {
    title: ".jcity",
    sub: [".jja"],
  });
})();
