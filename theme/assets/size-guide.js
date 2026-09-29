/* Atelier Yuka — ドレスのサイズの目安（商品ページ）
   サンプル assets/js/data.js の AY.suggestDressSize と product.js から移植。
   サイズ表は 2026-09-19 受領の正式版（with a WISH Ladies' SIZE LIST 2026-2027・サイズフリー）。
   画面の文言はセクションが翻訳ファイルから JSON で渡す（[data-size-guide-strings]）。 */
(function () {
  "use strict";

  /* ---------- サイズ表 ----------
     bust = バスト(レギュラー)、bustier = バスト(ビスチェ)。ビスチェのドレスは bustier の列で判定する。
     3FT のバスト(レギュラー)「76-84」は誤植の疑いがあるが、推測で直さず印刷値のまま（サンプルと同じ）。 */
  var CHART = [
    { size: "3FT",  go: "3〜5号",   bust: [76, 84],   bustier: [74, 78],   waist: [56, 60],   hip: [84, 88] },
    { size: "5FT",  go: "5〜7号",   bust: [80, 84],   bustier: [78, 82],   waist: [60, 64],   hip: [88, 92] },
    { size: "7FT",  go: "7〜9号",   bust: [84, 88],   bustier: [82, 86],   waist: [64, 68],   hip: [92, 96] },
    { size: "9FT",  go: "9〜11号",  bust: [88, 92],   bustier: [86, 90],   waist: [68, 72],   hip: [96, 100] },
    { size: "11FT", go: "11〜13号", bust: [92, 96],   bustier: [90, 94],   waist: [72, 76],   hip: [100, 104] },
    { size: "13FT", go: "13〜15号", bust: [96, 100],  bustier: [94, 98],   waist: [76, 80],   hip: [104, 108] },
    { size: "15FT", go: "15〜17号", bust: [100, 104], bustier: [98, 102],  waist: [80, 84],   hip: [108, 112] },
    { size: "17FT", go: "17〜19号", bust: [104, 108], bustier: [102, 106], waist: [84, 88],   hip: [112, 116] },
    { size: "19FT", go: "19〜21号", bust: [108, 112], bustier: [106, 110], waist: [88, 92],   hip: [116, 120] },
    { size: "21FT", go: "21〜23号", bust: [112, 116], bustier: [110, 114], waist: [92, 96],   hip: [120, 124] },
    { size: "23FT", go: "23〜25号", bust: [116, 120], bustier: [114, 118], waist: [96, 100],  hip: [124, 128] },
    { size: "27FT", go: "27〜29号", bust: [124, 128], bustier: [122, 126], waist: [104, 108], hip: [132, 136] },
  ];

  /* 身長の段階（記号末尾の T の数）。表の 7FT / 7FTT / 7FTTT の参考身長から */
  var TIERS = [
    { suffix: "T", height: 160 },
    { suffix: "TT", height: 165 },
    { suffix: "TTT", height: 170 },
  ];
  /* 表にある身長違いの記号は 7 号だけ。他の号数は「9FTTT」のような記号を作らず、号数の記号に案内を添える */
  var HEIGHT_VARIANTS = ["7FTT", "7FTTT"];

  var LIMITS = { bust: [60, 150], waist: [45, 140], hip: [60, 160], height: [130, 200] };
  var FAR_FROM_CHART = 6; // 表の範囲からの外れ（cm 換算）がこれを超えたら、規格外の可能性を添える
  var HIP_WEIGHT = 0.6;   // ドレスはヒップより上半身で決まるので、ヒップは軽く見る

  function parseSize(symbol) {
    var m = /^(\d+)(F?)(T{1,3})$/.exec(String(symbol || "").trim());
    if (!m) return null;
    var tier = TIERS.filter(function (t) { return t.suffix === m[3]; })[0];
    return { number: Number(m[1]), suffix: m[3], height: tier.height };
  }

  /* 身長 → いちばん近い段階。中間（162.5 / 167.5）は低い方。未入力なら T（160cm）を仮に置く */
  function tierFor(height) {
    if (!height) return TIERS[0];
    return TIERS.reduce(function (best, t) {
      return Math.abs(t.height - height) < Math.abs(best.height - height) ? t : best;
    }, TIERS[0]);
  }

  function outOfRange(value, range) {
    return value && (value < range[0] || value > range[1]);
  }

  /* 各寸法が表の範囲に入っていれば距離0、外れた分を距離にして、合計が最小の行を選ぶ */
  function suggest(bust, waist, hip, height, bustier) {
    if (!bust || !waist) return { ok: false, reason: "need_bust_waist" };
    if (outOfRange(bust, LIMITS.bust) || outOfRange(waist, LIMITS.waist) ||
        hip < 0 || height < 0 || outOfRange(hip, LIMITS.hip) || outOfRange(height, LIMITS.height)) {
      return { ok: false, reason: "check_values" };
    }
    var bustKey = bustier ? "bustier" : "bust";
    var gap = function (v, r) { return v < r[0] ? r[0] - v : v > r[1] ? v - r[1] : 0; };
    var best = null;
    CHART.forEach(function (row) {
      var d = gap(bust, row[bustKey]) + gap(waist, row.waist) + (hip ? gap(hip, row.hip) * HIP_WEIGHT : 0);
      /* 同点（境界値）は大きい方を採る。先方の構想図の例（バスト84・ウエスト64 → 7）と同じ挙動 */
      if (!best || d <= best.d) best = { d: d, row: row };
    });
    var row = best.row;
    var tier = tierFor(height);
    var composed = row.size.replace(/T$/, tier.suffix);
    var tierConfirmed = tier.suffix === "T" || HEIGHT_VARIANTS.indexOf(composed) !== -1;
    var range = function (r) { return r[0] + "〜" + r[1]; };
    return {
      ok: true,
      size: tierConfirmed ? composed : row.size,
      go: row.go,
      height: tier.height,
      heightSuffix: tier.suffix,
      heightGiven: !!height,
      tierConfirmed: tierConfirmed,
      bustier: bustier,
      spec: { bust: range(row[bustKey]), waist: range(row.waist), hip: range(row.hip) },
      far: best.d > FAR_FROM_CHART,
    };
  }

  function format(template, vars) {
    return String(template || "").replace(/\{(\w+)\}/g, function (_, key) {
      return vars[key] == null ? "" : vars[key];
    });
  }

  function init(root) {
    var stringsEl = root.querySelector("[data-size-guide-strings]");
    var t = stringsEl ? JSON.parse(stringsEl.textContent) : {};
    var available = (root.getAttribute("data-available") || "").split(",").filter(Boolean);
    var bustier = root.getAttribute("data-bustier") === "true";
    var reserveBase = root.getAttribute("data-reserve-url") || "";

    var form = root.querySelector("[data-size-form]");
    var result = root.querySelector("[data-size-result]");
    var error = root.querySelector("[data-size-error]");
    var q = function (sel) { return root.querySelector(sel); };

    var num = function (name) {
      var raw = form.elements[name].value.trim();
      if (raw === "") return 0;
      var v = parseFloat(raw);
      return isNaN(v) || v <= 0 ? -1 : v; // 入っているのに数値にならないときは -1 にして範囲検証で弾く
    };

    /* 表の「9〜11号」を、表示中の言語の書き方（t.go_range）にする */
    function goLabel(go) {
      var m = /^(\d+)〜(\d+)号$/.exec(go);
      return m && t.go_range ? format(t.go_range, { from: m[1], to: m[2] }) : go;
    }

    function heightText(r) {
      if (!r.heightGiven) return t.height_none;
      if (r.tierConfirmed) return format(t.height_confirmed, { height: r.height });
      return format(t.height_unconfirmed, { height: r.height, suffix: r.heightSuffix });
    }

    function availabilityText(r) {
      var head = format(t.avail_head, { sizes: available.join(" / ") });
      var mine = parseSize(r.size);
      var sameNumber = available.some(function (s) {
        var p = parseSize(s);
        return p && mine && p.number === mine.number;
      });
      if (!sameNumber) return head + t.avail_diff;
      if (!r.heightGiven) return head + t.avail_no_height;
      if (available.indexOf(r.size) !== -1 && r.tierConfirmed) return head + t.avail_same;
      return head + t.avail_tier_diff;
    }

    function reserveUrl(extra) {
      if (!reserveBase) return "";
      var url = new URL(reserveBase, window.location.origin);
      Object.keys(extra).forEach(function (k) { if (extra[k]) url.searchParams.set(k, extra[k]); });
      return url.pathname + url.search;
    }

    function renderSpec(r, hipGiven) {
      var spec = q("[data-size-spec]");
      spec.textContent = "";
      var column = r.bustier ? t.column_bustier : t.column_regular;
      [
        [format(t.spec_bust, { column: column }), r.spec.bust],
        [t.spec_waist, r.spec.waist],
        [hipGiven ? t.spec_hip : t.spec_hip_ref, r.spec.hip],
      ].forEach(function (row) {
        var div = document.createElement("div");
        var dt = document.createElement("dt");
        dt.textContent = row[0];
        var dd = document.createElement("dd");
        dd.textContent = row[1] + " cm";
        div.appendChild(dt);
        div.appendChild(dd);
        spec.appendChild(div);
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var bust = num("bust"), waist = num("waist"), hip = num("hip"), height = num("height");
      var r = suggest(bust, waist, hip, height, bustier);
      if (!r.ok) {
        result.hidden = true;
        error.textContent = t[r.reason];
        error.hidden = false;
        form.elements[bust > 0 ? "waist" : "bust"].focus();
        return;
      }
      error.hidden = true;
      q("[data-size-value]").textContent = r.size;
      q("[data-size-go]").textContent = format(t.go_line, { go: goLabel(r.go), height: heightText(r) });
      renderSpec(r, hip > 0);

      var avail = q("[data-size-avail]");
      avail.textContent = available.length ? availabilityText(r) : "";
      avail.hidden = !available.length;
      var caution = q("[data-size-caution]");
      caution.textContent = r.far ? t.caution_far : "";
      caution.hidden = !r.far;

      /* 予約フォームには判定の状態も添える。丈が未判定のまま「9FT」だけ渡すと、確定した結果と区別がつかないため */
      var sizeForForm = !r.heightGiven ? format(t.form_size_no_height, { size: r.size })
        : !r.tierConfirmed ? format(t.form_size_unconfirmed, { size: r.size, height: r.height })
        : r.size;
      var cta = q("[data-size-cta]");
      var href = reserveUrl({ size: sizeForForm, bust: bust, waist: waist, hip: hip > 0 ? hip : 0, height: height > 0 ? height : 0 });
      if (cta && href) cta.href = href;
      result.hidden = false;
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll("[data-size-guide]"), init);
})();
