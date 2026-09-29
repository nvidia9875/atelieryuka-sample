/* Atelier Yuka — 全ページ共通のふるまい */
(function () {
  "use strict";

  /* 静かなフェードイン。動きを減らす設定の人と、IntersectionObserver が無い環境では最初から表示する */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!("IntersectionObserver" in window) || prefersReduced) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* 言語切り替えのメニューは、外側のクリックと Esc で閉じる */
  var langMenus = Array.prototype.slice.call(document.querySelectorAll("details.lang"));
  if (langMenus.length) {
    document.addEventListener("click", function (e) {
      langMenus.forEach(function (d) {
        if (d.open && !d.contains(e.target)) d.open = false;
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      langMenus.forEach(function (d) {
        if (!d.open) return;
        d.open = false;
        d.querySelector("summary").focus();
      });
    });
  }
})();
