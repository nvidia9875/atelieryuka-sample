/* Atelier Yuka — コレクションの絞り込み・並び替え・ページ送り
   条件を変えたら Section Rendering API でこのセクションだけ取り直して差し替える。
   失敗したときは普通にページを移動する（JS が無いときと同じ動き）。 */
(function () {
  "use strict";

  var root = document.querySelector("[data-collection]");
  if (!root) return;

  var sectionId = root.getAttribute("data-section-id");
  var DEBOUNCE_MS = 400; // 価格の入力中に何度も取りに行かないよう、少し待つ
  var timer = null;
  var controller = null;

  function formUrl() {
    var form = root.querySelector("[data-filter-form]");
    var sort = root.querySelector("[data-sort]");
    var base = form ? form.action : window.location.pathname;
    var params = form ? new URLSearchParams(new FormData(form)) : new URLSearchParams();
    if (sort) params.set("sort_by", sort.value);
    // 空の価格欄は送らない（送ると 0 円で絞り込まれる）
    Array.from(params.keys()).forEach(function (key) {
      if (params.get(key) === "") params.delete(key);
    });
    var query = params.toString();
    return query ? base + "?" + query : base;
  }

  function render(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var next = doc.querySelector("[data-collection]");
    if (!next) throw new Error("section not found in response");

    var panel = root.querySelector("[data-filter-panel]");
    var wasOpen = panel ? panel.open : false;
    var focusedId = document.activeElement && document.activeElement.id;

    root.innerHTML = next.innerHTML;

    var nextPanel = root.querySelector("[data-filter-panel]");
    if (nextPanel && wasOpen) nextPanel.open = true;
    // キーボード操作の人が、差し替えのあとも同じ場所から続けられるようにする
    if (focusedId) {
      var again = document.getElementById(focusedId);
      if (again) again.focus({ preventScroll: true });
    }
  }

  function load(url, options) {
    var push = !options || options.push !== false;
    var scroll = options && options.scroll;
    var target = new URL(url, window.location.origin);
    var fetchUrl = new URL(target);
    fetchUrl.searchParams.set("section_id", sectionId);

    if (controller) controller.abort();
    controller = new AbortController();
    root.setAttribute("aria-busy", "true");

    fetch(fetchUrl, { signal: controller.signal })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (html) {
        render(html);
        if (push) window.history.pushState({ collection: true }, "", target);
        // ページ送りのあとは、章の見出しではなく絞り込み＋一覧の頭に戻す（すぐ商品が見えるように）
        if (scroll) (root.querySelector(".collection-body") || root).scrollIntoView({ block: "start" });
      })
      .catch(function (err) {
        if (err.name === "AbortError") return;
        window.location.href = target.href;
      })
      .finally(function () {
        root.removeAttribute("aria-busy");
      });
  }

  root.addEventListener("change", function (e) {
    var input = e.target;
    if (!input.closest("[data-filter-form]") && !input.matches("[data-sort]")) return;
    window.clearTimeout(timer);
    var wait = input.type === "number" ? DEBOUNCE_MS : 0;
    timer = window.setTimeout(function () { load(formUrl()); }, wait);
  });

  root.addEventListener("submit", function (e) {
    if (!e.target.matches("[data-filter-form]")) return;
    e.preventDefault();
    load(formUrl());
  });

  root.addEventListener("click", function (e) {
    var link = e.target.closest("a[data-filter-link]");
    if (!link || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    // ページ送りのときだけ一覧の先頭に戻す
    load(link.href, { scroll: !!link.closest(".pagination") });
  });

  window.addEventListener("popstate", function () {
    load(window.location.href, { push: false });
  });
})();
