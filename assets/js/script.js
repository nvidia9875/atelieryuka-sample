/* Atelier Yuka — A案 Timeless Classic
   インタラクション: 静かなフェードイン / コレクションタブ / 予約ステップフォーム(デモ) */
(function () {
  "use strict";

  /* ==========================================================
     1. 静かなフェードイン(IntersectionObserver)
     ========================================================== */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!("IntersectionObserver" in window) || prefersReduced) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ==========================================================
     2. コレクションタブ(WAI-ARIA tabs)
     ========================================================== */
  var tablist = document.querySelector('[role="tablist"]');
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));

    /* 狭い画面ではタブが横スクロールで隠れるため、選択中のタブを見える位置へ寄せる。
       タブ列だけを動かすので、ページ自体はスクロールしない。 */
    var scrollTabIntoView = function (tab) {
      if (tablist.scrollWidth <= tablist.clientWidth + 1) return;
      var pad = parseFloat(getComputedStyle(tablist).paddingInlineStart) || 0;
      var listRect = tablist.getBoundingClientRect();
      var tabRect = tab.getBoundingClientRect();
      /* はみ出している分だけ動かす(中央寄せにするとスナップと引っ張り合うため) */
      var delta = 0;
      if (tabRect.left < listRect.left + pad) delta = tabRect.left - listRect.left - pad;
      else if (tabRect.right > listRect.right - pad) delta = tabRect.right - listRect.right + pad;
      if (Math.abs(delta) < 1) return;
      if (tablist.scrollBy) {
        tablist.scrollBy({ left: delta, behavior: prefersReduced ? "auto" : "smooth" });
      } else {
        tablist.scrollLeft += delta;
      }
    };

    var selectTab = function (tab, focus) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute("aria-selected", selected ? "true" : "false");
        t.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      });
      if (focus) tab.focus();
      scrollTabIntoView(tab);

      /* 絞り込み(collection-filter.js)へ、表示中のカテゴリが変わったことを伝える */
      document.dispatchEvent(new CustomEvent("ay:tabchange", {
        detail: { key: tab.id.replace(/^tab-/, "") },
      }));
    };

    /* URL の ?cat= からカテゴリを復元するために外部へ公開する */
    window.AYCollectionTabs = {
      select: function (tabId) {
        var tab = document.getElementById(tabId);
        if (tab) selectTab(tab, false);
      },
    };

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () { selectTab(tab, false); });
      tab.addEventListener("keydown", function (event) {
        var next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          next = tabs[(index + 1) % tabs.length];
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          next = tabs[(index - 1 + tabs.length) % tabs.length];
        } else if (event.key === "Home") {
          next = tabs[0];
        } else if (event.key === "End") {
          next = tabs[tabs.length - 1];
        }
        if (next) {
          event.preventDefault();
          selectTab(next, true);
        }
      });
    });
  }

  /* 3. 予約フォームは reserve-form.js に分離した（申込書の項目に拡張したため） */
})();

/* ---------- 画像ライトボックス(共通 assets/js/lightbox.js) ----------
   商品カードは拡大せず詳細ページへ遷移させるため、ここでは付けない。
   拡大表示は product.html のギャラリー(product.js)だけが持つ。 */
(function () {
  "use strict";
  if (!window.AYLightbox) return;
  window.AYLightbox.attach(".journey-grid", ".journey", {
    frame: ".journey-frame",
    title: ".journey-city",
    sub: [".journey-meta"],
  });
})();
