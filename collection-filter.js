/* Atelier Yuka — コレクションの絞り込み・並び替え
   ・軸どうしは AND、同じ軸の複数選択は OR
   ・条件は URL に反映するので、絞り込んだ状態をそのまま共有できる
   ・モバイルは初期6件表示、「さらに表示」で追加（縦スクロールを短くするため）
   マークアップは tools/build-collection.mjs が生成する data-* 属性に依存する。 */
(function () {
  "use strict";

  var MOBILE_QUERY = "(max-width: 559px)";
  var MOBILE_INITIAL = 6;
  var CHECKBOX_AXES = ["color", "price", "silhouette", "line"];

  var mobile = window.matchMedia(MOBILE_QUERY);

  /** 検索用の正規化: 小文字化 + アクセント除去（"lumiere" で "Lumière" に当たるように） */
  function normalize(text) {
    return String(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  /* ==========================================================
     パネル1つぶんの絞り込み
     ========================================================== */
  function createPanel(panelEl) {
    var key = panelEl.id.replace(/^panel-/, "");
    var grid = panelEl.querySelector("[data-grid]");
    if (!grid) return null;

    var items = Array.prototype.slice.call(grid.querySelectorAll(".product"));
    var details = panelEl.querySelector("[data-filter]");
    var badge = panelEl.querySelector("[data-active-count]");
    var countEl = panelEl.querySelector("[data-count]");
    var emptyEl = panelEl.querySelector("[data-empty]");
    var clearBtn = panelEl.querySelector("[data-clear]");
    var sortEl = panelEl.querySelector("[data-sort]");
    var moreWrap = panelEl.querySelector("[data-more-wrap]");
    var moreBtn = panelEl.querySelector("[data-more]");
    var searchEl = panelEl.querySelector('[data-axis="q"]');
    var boxes = Array.prototype.slice.call(
      panelEl.querySelectorAll('.filter-body input[type="checkbox"][data-axis]')
    );

    /* 検索対象は名称と型番。毎回作り直さずカードに持たせておく */
    items.forEach(function (item, i) {
      item._order = i;
      item._haystack = normalize(item.dataset.name + " " + item.dataset.code);
    });

    var expanded = false;

    function selected(axis) {
      return boxes
        .filter(function (b) { return b.dataset.axis === axis && b.checked; })
        .map(function (b) { return b.value; });
    }

    function activeCount() {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      return n + (searchEl && searchEl.value.trim() !== "" ? 1 : 0);
    }

    /** 現在の条件を1回だけ集計して、判定関数を作る */
    function buildMatcher() {
      var active = CHECKBOX_AXES
        .map(function (axis) { return { axis: axis, values: selected(axis) }; })
        .filter(function (a) { return a.values.length > 0; }); /* 未選択の軸は絞り込まない */
      var q = searchEl ? normalize(searchEl.value.trim()) : "";

      return function (item) {
        for (var i = 0; i < active.length; i++) {
          if (active[i].values.indexOf(item.dataset[active[i].axis] || "") === -1) return false;
        }
        return q === "" || item._haystack.indexOf(q) !== -1;
      };
    }

    var SORTERS = {
      recommended: function (a, b) { return a._order - b._order; },
      "price-asc": function (a, b) {
        return Number(a.dataset.price) - Number(b.dataset.price) || a._order - b._order;
      },
      "price-desc": function (a, b) {
        return Number(b.dataset.price) - Number(a.dataset.price) || a._order - b._order;
      },
    };

    function apply(options) {
      options = options || {};
      var matches = buildMatcher();
      var matched = items.filter(matches);
      var rest = items.filter(function (item) { return !matches(item); });

      matched.sort(SORTERS[sortEl && sortEl.value ? sortEl.value : "recommended"] || SORTERS.recommended);

      /* 並び順を DOM に反映（一致しなかったものは末尾へ） */
      matched.concat(rest).forEach(function (item) { grid.appendChild(item); });

      var limit = mobile.matches && !expanded ? MOBILE_INITIAL : matched.length;
      matched.forEach(function (item, i) { item.hidden = i >= limit; });
      rest.forEach(function (item) { item.hidden = true; });

      var shown = Math.min(limit, matched.length);
      if (countEl) {
        countEl.textContent =
          matched.length === 0
            ? "該当なし"
            : shown < matched.length
              ? matched.length + "件中 " + shown + "件を表示"
              : matched.length + "件を表示";
      }
      if (emptyEl) emptyEl.hidden = matched.length > 0;
      if (moreWrap) moreWrap.hidden = shown >= matched.length;
      if (moreBtn) {
        moreBtn.textContent = "さらに表示（残り" + (matched.length - shown) + "件）";
      }

      var active = activeCount();
      if (badge) {
        badge.hidden = active === 0;
        badge.textContent = active + "件の条件";
      }
      if (clearBtn) clearBtn.hidden = active === 0;

      if (!options.silent) writeUrl();
    }

    /* ---------- URL への反映・復元 ---------- */
    function writeUrl() {
      var params = new URLSearchParams();
      params.set("cat", key);
      CHECKBOX_AXES.forEach(function (axis) {
        var values = selected(axis);
        if (values.length) params.set(axis, values.join(","));
      });
      if (searchEl && searchEl.value.trim() !== "") params.set("q", searchEl.value.trim());
      if (sortEl && sortEl.value !== "recommended") params.set("sort", sortEl.value);

      var url = location.pathname + "?" + params.toString() + "#collection";
      history.replaceState(null, "", url);
    }

    function restore(params) {
      CHECKBOX_AXES.forEach(function (axis) {
        var raw = params.get(axis);
        if (!raw) return;
        var values = raw.split(",");
        boxes.forEach(function (b) {
          if (b.dataset.axis === axis && values.indexOf(b.value) !== -1) b.checked = true;
        });
      });
      var q = params.get("q");
      if (q && searchEl) searchEl.value = q;
      var sort = params.get("sort");
      if (sort && sortEl && SORTERS[sort]) sortEl.value = sort;
    }

    function clearAll() {
      boxes.forEach(function (b) { b.checked = false; });
      if (searchEl) searchEl.value = "";
      expanded = false;
      apply();
    }

    /* ---------- イベント ---------- */
    boxes.forEach(function (b) {
      b.addEventListener("change", function () {
        expanded = false; /* 条件を変えたら件数が変わるので先頭から見せ直す */
        apply();
      });
    });
    if (searchEl) {
      searchEl.addEventListener("input", function () {
        expanded = false;
        apply();
      });
    }
    if (sortEl) sortEl.addEventListener("change", function () { apply(); });
    if (clearBtn) clearBtn.addEventListener("click", clearAll);
    if (moreBtn) {
      moreBtn.addEventListener("click", function () {
        expanded = true;
        apply();
        /* 追加分の先頭にフォーカスを移し、キーボード操作でも続きから読めるようにする */
        var next = items.filter(function (i) { return !i.hidden; })[MOBILE_INITIAL];
        var link = next && next.querySelector("a");
        if (link) link.focus();
      });
    }

    return {
      key: key,
      apply: apply,
      restore: restore,
      details: details,
      hasActiveFilters: function () { return activeCount() > 0; },
    };
  }

  /* ==========================================================
     初期化
     ========================================================== */
  var panels = Array.prototype.slice.call(document.querySelectorAll(".tabpanel"))
    .map(createPanel)
    .filter(Boolean);

  if (panels.length === 0) return;

  var byKey = {};
  panels.forEach(function (p) { byKey[p.key] = p; });

  /* URL に条件があれば、そのカテゴリを開いて復元する */
  var params = new URLSearchParams(location.search);
  var cat = params.get("cat");
  var target = cat && byKey[cat] ? byKey[cat] : null;
  if (target) {
    target.restore(params);
    if (window.AYCollectionTabs) window.AYCollectionTabs.select("tab-" + target.key);
    /* 条件つきのURLで開かれたときは、何が効いているか見えるようにパネルを開く */
    if (target.details && target.hasActiveFilters()) target.details.open = true;
  }

  /* 初期描画では URL を書き換えない（直リンクの条件をそのまま残す） */
  panels.forEach(function (p) { p.apply({ silent: true }); });

  /* タブを切り替えたら、そのカテゴリの条件を URL に載せ直す */
  document.addEventListener("ay:tabchange", function (event) {
    var panel = byKey[String(event.detail.key)];
    if (panel) panel.apply();
  });

  /* 画面幅がブレークポイントをまたぐと表示件数の上限が変わる（モバイルは6件まで） */
  if (mobile.addEventListener) {
    mobile.addEventListener("change", function () {
      panels.forEach(function (p) { p.apply({ silent: true }); });
    });
  }
})();
