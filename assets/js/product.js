/* A案 Timeless Classic — 衣裳詳細ページ(データは assets/js/data.js の AY を参照) */
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
   * 説明文・素材(assets/js/details.js)を描画する。
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
      if (row.en === "Size") appendSizeNote(dd, row.value);
      div.appendChild(dt); div.appendChild(dd);
      spec.appendChild(div);
    });
    spec.hidden = false;
  }

  /**
   * サイズ記号（7FTTT など）の読み方を添える。
   * 1サイズなら「（7〜9号相当・身長170cm基準）」、複数なら凡例を1行。読めない記号なら何も足さない。
   */
  function appendSizeNote(dd, value) {
    if (typeof AY.describeDressSize !== "function") return;
    var sizes = value.split("・");
    var note = document.createElement("small");
    note.className = "pd-spec-note";
    if (sizes.length === 1) {
      var desc = AY.describeDressSize(sizes[0]);
      if (!desc) return;
      note.textContent = "（" + desc + "）";
    } else {
      if (!sizes.some(AY.describeDressSize)) return;
      note.textContent = "数字＝号数相当 ／ T＝身長160cm基準、TT＝165cm、TTT＝170cm";
    }
    dd.appendChild(note);
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

    /* このドレスの展開（details.js の size。「3FT・7FT・…」の中黒区切り）。
       バストは DESIGN にビスチェがあればビスチェの列で見る。DESIGN の記載が無いドレスもビスチェ扱い（先方に伝えた基準） */
    var detail = typeof AY_DETAILS !== "undefined" ? AY_DETAILS[item.code] : null;
    var available = detail && detail.size ? detail.size.split("・") : [];
    var design = detail ? detail.design : [];
    var isBustier = !(design.length && design.indexOf("ビスチェ") === -1);

    /* 目安サイズと、このドレスの展開との照合文 */
    var availabilityText = function (r) {
      var head = "このドレスのご用意: " + available.join(" / ");
      var mine = AY.parseDressSize(r.size);
      var sameNumber = available.some(function (s) {
        var p = AY.parseDressSize(s);
        return p && mine && p.number === mine.number;
      });
      if (!sameNumber) return head + " — 目安サイズとは異なります。お直しやご相談が必要な場合がありますので、お問い合わせください。";
      if (!r.heightGiven) return head + " — 号数は同じです。丈は身長が未入力のため判定していません。";
      if (available.indexOf(r.size) !== -1 && r.tierConfirmed) return head + " — 目安サイズと同じです。";
      return head + " — 号数は同じですが、丈の基準身長が異なります。ご試着時に丈をお確かめください。";
    };

    /* 結果2行目: 号数の幅と、丈（身長の段階）の扱い */
    var heightText = function (r) {
      if (!r.heightGiven) return "丈の段階は身長が未入力のため付けていません";
      if (r.tierConfirmed) return "丈は身長" + r.height + "cm基準";
      return "身長" + r.height + "cm向けの丈（" + r.heightSuffix + "）はサイズ表に記載がないため、号数のみでご案内しています。丈はご試着時にご相談ください";
    };

    var num = function (id) { var v = parseFloat(el(id).value); return isNaN(v) ? 0 : v; };
    /* 任意項目: 空欄は 0（未入力）、何か入っていて数値にならない・0 のときは -1 にして範囲検証で弾く */
    var optional = function (id) {
      var raw = el(id).value.trim();
      return raw === "" ? 0 : (parseFloat(raw) || -1);
    };
    el("size-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var bust = num("sz-bust"), waist = num("sz-waist"), hip = optional("sz-hip"), height = optional("sz-height");
      var r = AY.suggestDressSize(bust, waist, hip, { height: height, bustier: isBustier });
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
      el("sz-go").textContent = r.go + "相当 ・ " + heightText(r);
      var spec = el("sz-spec");
      spec.textContent = "";
      [["バスト（" + r.bustColumn + "）", r.spec.bust], ["ウエスト", r.spec.waist], [hip ? "ヒップ" : "ヒップ（未入力・参考）", r.spec.hip]].forEach(function (row) {
        var div = document.createElement("div");
        var dt = document.createElement("dt"); dt.textContent = row[0];
        var dd = document.createElement("dd"); dd.textContent = row[1] + " cm";
        div.appendChild(dt); div.appendChild(dd);
        spec.appendChild(div);
      });
      var avail = el("sz-avail");
      avail.textContent = available.length ? availabilityText(r) : "";
      avail.hidden = !available.length;
      var caution = el("sz-caution");
      caution.textContent = r.caution;
      caution.hidden = !r.caution;
      /* 予約フォームには判定の状態も添える（f-size-hint に入り、送信内容に含まれる）。
         丈が未確認・未判定のまま「9FT」だけ渡すと、160cm基準で確定した結果と区別がつかないため */
      var sizeForForm = !r.heightGiven ? r.size + "（丈は身長未入力のため未判定）"
        : !r.tierConfirmed ? r.size + "（身長" + r.height + "cm向けの丈は要確認）"
        : r.size;
      el("sz-cta").href = reserveUrl({ size: sizeForForm, bust: bust, waist: waist, hip: hip > 0 ? hip : 0, height: height > 0 ? height : 0 });
      result.hidden = false;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
