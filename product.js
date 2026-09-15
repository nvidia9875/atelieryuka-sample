/* A案 Timeless Classic — 衣裳詳細ページ(データは assets/data.js の AY を参照) */
(function () {
  "use strict";

  var yen = function (n) {
    return "¥" + Number(n).toLocaleString("ja-JP");
  };

  function findItem(code) {
    var keys = Object.keys(AY.collections);
    for (var i = 0; i < keys.length; i++) {
      var col = AY.collections[keys[i]];
      for (var j = 0; j < col.items.length; j++) {
        if (col.items[j].code === code) {
          return { item: col.items[j], collection: col, key: keys[i] };
        }
      }
    }
    return null;
  }

  function el(id) { return document.getElementById(id); }

  /**
   * 説明文・素材(assets/details.js)を描画する。
   * 実サイトに記載のない衣裳もあるため、値のある項目だけを出し、
   * 何も無ければブロックごと隠したままにする。
   */
  function renderDetail(code) {
    var detail = typeof AY_DETAILS !== "undefined" ? AY_DETAILS[code] : null;
    if (!detail) return;

    if (detail.desc) {
      var descBox = el("pd-desc");
      detail.desc.split("\n").forEach(function (line) {
        var p = document.createElement("p");
        p.textContent = line;
        descBox.appendChild(p);
      });
      descBox.hidden = false;
    }

    /* 実サイトの見出し語(MATERIAL / DESIGN / GENRES / SIZE)をそのまま欧文ラベルに使う */
    var rows = [
      { en: "Material", ja: "素材", value: detail.material.join("・") },
      { en: "Design", ja: "デザイン", value: detail.design.join("・") },
      { en: "Genre", ja: "雰囲気", value: detail.genres.join("・") },
      { en: "Size", ja: "サイズ", value: detail.size },
    ].filter(function (row) { return row.value; });
    if (!rows.length) return;

    var spec = el("pd-spec");
    rows.forEach(function (row) {
      var div = document.createElement("div");
      var dt = document.createElement("dt");
      var en = document.createElement("span");
      en.className = "pd-spec-en";
      en.setAttribute("translate", "no");
      en.textContent = row.en;
      dt.appendChild(en);
      dt.appendChild(document.createTextNode(row.ja));
      var dd = document.createElement("dd");
      dd.textContent = row.value;
      div.appendChild(dt); div.appendChild(dd);
      spec.appendChild(div);
    });
    spec.hidden = false;
  }

  function showMissing() {
    el("pd-missing").hidden = false;
    document.title = "衣裳が見つかりません | Atelier Yuka";
  }

  function init() {
    if (typeof AY === "undefined") { showMissing(); return; }
    var code = new URLSearchParams(location.search).get("code") || "";
    var found = findItem(code);
    if (!found) { showMissing(); return; }

    var item = found.item;
    var col = found.collection;
    document.title = item.name + " — " + col.label + " | Atelier Yuka";

    /* ---- 概要 ---- */
    el("crumb-cat").textContent = col.label;
    el("crumb-name").textContent = item.name;
    el("pd-line").textContent = item.line;
    el("pd-name").textContent = item.name;
    el("pd-code").textContent = item.code;
    el("pd-silhouette").textContent = item.silhouette ? "シルエット: " + item.silhouette : "";
    el("pd-price").textContent = yen(item.price);
    renderDetail(item.code);

    var img1 = el("pd-img-1");
    img1.src = "assets/img/" + item.img;
    img1.alt = col.label + " " + item.name;
    var shot2 = el("pd-shot-2");
    if (item.img2) {
      var img2 = el("pd-img-2");
      img2.src = "assets/img/" + item.img2;
      img2.alt = item.name + " の別カット";
    } else {
      shot2.remove();
    }
    el("pd").hidden = false;

    /* ---- ギャラリーを拡大表示に対応 ---- */
    if (window.AYLightbox) {
      window.AYLightbox.attach("#pd-gallery", ".pd-shot", {});
    }

    /* ---- 関連(同じコレクションから3点) ---- */
    var grid = el("pd-related-grid");
    col.items.filter(function (it) { return it.code !== item.code; })
      .slice(0, 3)
      .forEach(function (it) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = "product.html?code=" + encodeURIComponent(it.code);
        var fig = document.createElement("figure");
        var img = document.createElement("img");
        img.src = "assets/img/" + it.img;
        /* サムネイルは最大でも約305px表示なので、440w があればそれで足りる */
        var small = it.img.replace(/\.webp$/, "-440.webp");
        img.srcset = "assets/img/" + small + " 440w, assets/img/" + it.img + " 900w";
        img.sizes = "(max-width: 860px) 46vw, 320px";
        img.alt = col.label + " " + it.name;
        img.width = 600; img.height = 800; img.loading = "lazy"; img.decoding = "async";
        fig.appendChild(img);
        var name = document.createElement("p");
        name.className = "pd-related-name";
        name.setAttribute("translate", "no");
        name.textContent = it.name;
        var price = document.createElement("p");
        price.className = "pd-related-price";
        price.textContent = it.code + " ・ " + yen(it.price);
        a.appendChild(fig); a.appendChild(name); a.appendChild(price);
        li.appendChild(a);
        grid.appendChild(li);
      });

    /* ---- 予約フォーム(index.html)への引き継ぎ ---- */
    var isDress = found.key === "wedding" || found.key === "color";
    var who = isDress ? "新婦" : "新郎";
    var reserveUrl = function (extra) {
      var params = new URLSearchParams({ code: item.code, who: who });
      Object.keys(extra || {}).forEach(function (k) { if (extra[k]) params.set(k, extra[k]); });
      return "index.html?" + params.toString() + "#reserve";
    };
    el("pd-cta").href = reserveUrl();

    /* ---- サイズの目安(ドレスのみ) ---- */
    var sizeSection = el("size");
    if (!isDress || typeof AY.suggestDressSize !== "function") {
      sizeSection.remove();
      return;
    }
    el("sz-cta").href = reserveUrl();
    var status = el("sz-chart-status");
    if (AY.dressSizeChartStatus === "仮") {
      status.textContent = "（対応表は仮のもので、正式版に差し替え予定です）";
    }

    var num = function (id) { var v = parseFloat(el(id).value); return isNaN(v) ? 0 : v; };
    el("size-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var bust = num("sz-bust"), waist = num("sz-waist"), hip = num("sz-hip"), height = num("sz-height");
      var r = AY.suggestDressSize(bust, waist, hip);
      var result = el("sz-result");
      var error = el("sz-error");
      if (!r.ok) {
        result.hidden = true;
        error.textContent = r.reason;
        error.hidden = false;
        (bust ? el("sz-waist") : el("sz-bust")).focus();
        return;
      }
      error.hidden = true;
      el("sz-value").textContent = r.size;
      el("sz-go").textContent = "参考: " + r.go + "（参考身長 " + AY.dressSizeRefHeight + "cm）";
      var spec = el("sz-spec");
      spec.textContent = "";
      [["バスト", r.spec.bust], ["ウエスト", r.spec.waist], ["ヒップ", r.spec.hip]].forEach(function (row) {
        var div = document.createElement("div");
        var dt = document.createElement("dt"); dt.textContent = row[0];
        var dd = document.createElement("dd"); dd.textContent = row[1] + " cm";
        div.appendChild(dt); div.appendChild(dd);
        spec.appendChild(div);
      });
      var caution = el("sz-caution");
      caution.textContent = r.caution;
      caution.hidden = !r.caution;
      el("sz-cta").href = reserveUrl({ size: r.size, bust: bust, waist: waist, hip: hip, height: height });
      result.hidden = false;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
