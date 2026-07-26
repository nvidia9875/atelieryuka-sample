/* ============================================================
   Atelier Yuka — 共通ライトボックス(全プラン共用)
   使い方(各プランの script.js 末尾から):
     AYLightbox.attach(".product-grid", "li", {
       frame: ".product-media",          // 拡大ボタンを重ねる枠(省略時: 画像の親)
       title: ".product-name",           // キャプション見出し
       sub: [".product-meta", ".product-price"], // キャプション補足(結合)
     });
   グループ = attachしたコンテナ単位(カテゴリ内で前後移動)。
   矢印ボタン+キーボード(←→/Esc)。スワイプは粗いポインタ(SP)のみ。
   ============================================================ */
(function () {
  "use strict";

  var SWIPE_THRESHOLD = 44; // px
  var dlg = null;
  var imgEl, nameEl, subEl, countCur, countTotal, prevBtn, nextBtn, closeBtn, stage;
  var slides = [];
  var index = 0;
  var openerEl = null;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var coarsePointer = window.matchMedia("(pointer: coarse)");

  function icon(path) {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 20 20");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.5");
    svg.setAttribute("aria-hidden", "true");
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", path);
    svg.appendChild(p);
    return svg;
  }

  function build() {
    if (dlg) return;
    dlg = document.createElement("dialog");
    dlg.className = "ay-lb";
    dlg.setAttribute("aria-label", "画像の拡大表示");

    stage = document.createElement("div");
    stage.className = "ay-lb-stage";

    var fig = document.createElement("figure");
    fig.className = "ay-lb-fig";
    imgEl = document.createElement("img");
    imgEl.className = "ay-lb-img";
    imgEl.decoding = "async";
    var cap = document.createElement("figcaption");
    cap.className = "ay-lb-cap";
    nameEl = document.createElement("span");
    nameEl.className = "ay-lb-name";
    nameEl.setAttribute("translate", "no");
    subEl = document.createElement("span");
    subEl.className = "ay-lb-sub";
    cap.appendChild(nameEl);
    cap.appendChild(subEl);
    fig.appendChild(imgEl);
    fig.appendChild(cap);
    stage.appendChild(fig);

    prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "ay-lb-prev";
    prevBtn.setAttribute("aria-label", "前の画像");
    prevBtn.appendChild(icon("M12.5 4 6.5 10l6 6"));

    nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "ay-lb-next";
    nextBtn.setAttribute("aria-label", "次の画像");
    nextBtn.appendChild(icon("M7.5 4l6 6-6 6"));

    closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "ay-lb-close";
    closeBtn.setAttribute("aria-label", "閉じる");
    closeBtn.appendChild(icon("M5 5l10 10M15 5 5 15"));

    var count = document.createElement("p");
    count.className = "ay-lb-count";
    countCur = document.createElement("span");
    countTotal = document.createElement("span");
    count.appendChild(countCur);
    count.appendChild(document.createTextNode(" / "));
    count.appendChild(countTotal);
    count.setAttribute("aria-live", "polite");

    dlg.appendChild(stage);
    dlg.appendChild(prevBtn);
    dlg.appendChild(nextBtn);
    dlg.appendChild(closeBtn);
    dlg.appendChild(count);
    document.body.appendChild(dlg);

    prevBtn.addEventListener("click", function () { step(-1); });
    nextBtn.addEventListener("click", function () { step(1); });
    closeBtn.addEventListener("click", function () { dlg.close(); });

    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    });

    /* バックドロップ(dialog自身)クリックで閉じる */
    dlg.addEventListener("click", function (e) {
      if (e.target === dlg || e.target === stage) dlg.close();
    });

    dlg.addEventListener("close", function () {
      unlockScroll();
      if (openerEl && document.contains(openerEl)) openerEl.focus();
      openerEl = null;
    });

    /* スワイプ(粗いポインタ=SPのみ) */
    var startX = null, startY = null;
    stage.addEventListener("pointerdown", function (e) {
      if (!coarsePointer.matches) return;
      startX = e.clientX;
      startY = e.clientY;
    });
    stage.addEventListener("pointerup", function (e) {
      if (startX === null || !coarsePointer.matches) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      startX = startY = null;
      if (Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
        step(dx < 0 ? 1 : -1);
      }
    });
    stage.addEventListener("pointercancel", function () { startX = startY = null; });
  }

  function lockScroll() {
    var sw = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = "hidden";
    if (sw > 0) document.documentElement.style.paddingRight = sw + "px";
    if (window.__ayLenis && typeof window.__ayLenis.stop === "function") window.__ayLenis.stop();
  }
  function unlockScroll() {
    document.documentElement.style.overflow = "";
    document.documentElement.style.paddingRight = "";
    if (window.__ayLenis && typeof window.__ayLenis.start === "function") window.__ayLenis.start();
  }

  function preload(i) {
    var s = slides[(i + slides.length) % slides.length];
    if (s && !s._pre) {
      s._pre = new Image();
      s._pre.src = s.src;
    }
  }

  function render(direction) {
    var s = slides[index];
    if (!s) return;
    var swap = function () {
      imgEl.src = s.src;
      imgEl.alt = s.alt;
      nameEl.textContent = s.title;
      subEl.textContent = s.sub;
      countCur.textContent = String(index + 1);
      countTotal.textContent = String(slides.length);
    };
    if (direction && !reduceMotion.matches) {
      imgEl.classList.remove("is-settled");
      imgEl.style.setProperty("--aylb-shift", (direction > 0 ? 14 : -14) + "px");
      imgEl.classList.add("is-entering");
      swap();
      var settle = function () {
        imgEl.classList.add("is-settled");
        imgEl.classList.remove("is-entering");
      };
      if (imgEl.complete) {
        requestAnimationFrame(function () { requestAnimationFrame(settle); });
      } else {
        imgEl.addEventListener("load", function onload() {
          imgEl.removeEventListener("load", onload);
          requestAnimationFrame(function () { requestAnimationFrame(settle); });
        });
      }
    } else {
      imgEl.classList.remove("is-entering");
      imgEl.classList.add("is-settled");
      swap();
    }
    preload(index + 1);
    preload(index - 1);
  }

  function step(d) {
    if (slides.length < 2) return;
    index = (index + d + slides.length) % slides.length;
    render(d);
  }

  function open(groupSlides, i, opener) {
    build();
    slides = groupSlides;
    index = i;
    openerEl = opener;
    render(0);
    lockScroll();
    dlg.showModal();
    closeBtn.focus();
  }

  function textOf(root, sel) {
    var el = root.querySelector(sel);
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }

  /* 絞り込み・並び替えで表示対象が変わったとき再構築するため、attach の引数を保持する */
  var attachments = [];

  function bind(groupSel, itemSel, opts) {
    document.querySelectorAll(groupSel).forEach(function (group) {
      /* 再構築時に拡大ボタンが重複しないよう、既存のものを取り除く */
      group.querySelectorAll(".ay-lb-open").forEach(function (btn) { btn.remove(); });

      /* 非表示のアイテムはスライドに含めない(隠れた商品へ送られてしまうため) */
      var items = Array.prototype.slice.call(group.querySelectorAll(itemSel))
        .filter(function (item) { return !item.hidden; });
      var groupSlides = [];
      items.forEach(function (item) {
        var img = item.querySelector("img");
        if (!img) return;
        var title = opts.title ? textOf(item, opts.title) : (img.alt || "");
        var subParts = (opts.sub || []).map(function (sel) { return textOf(item, sel); }).filter(Boolean);
        groupSlides.push({
          /* srcset があるとスマホでは小サイズが選ばれるため、拡大時は data-full の原寸を使う */
          src: img.dataset.full || img.currentSrc || img.src,
          alt: img.alt || title,
          title: title,
          sub: subParts.join(" ・ "),
        });
        var slideIndex = groupSlides.length - 1;

        var frame = (opts.frame && item.querySelector(opts.frame)) || img.parentElement;
        if (getComputedStyle(frame).position === "static") frame.style.position = "relative";
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ay-lb-open";
        btn.setAttribute("aria-label", (title || "画像") + " を拡大表示");
        btn.addEventListener("click", function () { open(groupSlides, slideIndex, btn); });
        frame.appendChild(btn);
      });
    });
  }

  /**
   * @param {string} groupSel グループのコンテナ(この単位で前後移動)
   * @param {string} itemSel  コンテナ内のアイテム
   * @param {{frame?: string, title?: string, sub?: string[]}} opts
   */
  function attach(groupSel, itemSel, opts) {
    opts = opts || {};
    attachments.push({ groupSel: groupSel, itemSel: itemSel, opts: opts });
    bind(groupSel, itemSel, opts);
  }

  /** 表示中のアイテムだけでスライドを組み直す(絞り込み・並び替えの後に呼ぶ) */
  function refresh() {
    attachments.forEach(function (a) { bind(a.groupSel, a.itemSel, a.opts); });
  }

  window.AYLightbox = { attach: attach, refresh: refresh };
})();
