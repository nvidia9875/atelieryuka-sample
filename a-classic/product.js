/* A案 Timeless Classic — 衣裳詳細ページ(データは ../assets/data.js の AY を参照) */
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

  function showMissing() {
    el("pd-missing").hidden = false;
    document.title = "衣裳が見つかりません | Atelier Yuka(A案)";
  }

  function init() {
    if (typeof AY === "undefined") { showMissing(); return; }
    var code = new URLSearchParams(location.search).get("code") || "";
    var found = findItem(code);
    if (!found) { showMissing(); return; }

    var item = found.item;
    var col = found.collection;
    document.title = item.name + " — " + col.label + " | Atelier Yuka(A案)";

    /* ---- 概要 ---- */
    el("crumb-cat").textContent = col.label;
    el("crumb-name").textContent = item.name;
    el("pd-line").textContent = item.line;
    el("pd-name").textContent = item.name;
    el("pd-code").textContent = item.code;
    el("pd-silhouette").textContent = item.silhouette ? "シルエット: " + item.silhouette : "";
    el("pd-price").textContent = yen(item.price);

    var img1 = el("pd-img-1");
    img1.src = "../assets/img/" + item.img;
    img1.alt = col.label + " " + item.name;
    var shot2 = el("pd-shot-2");
    if (item.img2) {
      var img2 = el("pd-img-2");
      img2.src = "../assets/img/" + item.img2;
      img2.alt = item.name + " の別カット";
    } else {
      shot2.remove();
    }
    el("pd").hidden = false;

    /* ---- ギャラリーを拡大表示に対応 ---- */
    if (window.AYLightbox) {
      window.AYLightbox.attach("#pd-gallery", ".pd-shot", {});
    }

    /* ---- 希望日の範囲(10日後〜4ヶ月先) ---- */
    var dateInput = el("f-date");
    var fmt = function (d) { return d.toISOString().slice(0, 10); };
    var min = new Date(); min.setDate(min.getDate() + 10);
    var max = new Date(); max.setMonth(max.getMonth() + 4);
    dateInput.min = fmt(min);
    dateInput.max = fmt(max);

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
        img.src = "../assets/img/" + it.img;
        img.alt = col.label + " " + it.name;
        img.width = 600; img.height = 800; img.loading = "lazy";
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

    /* ---- 申し込みフォーム(デモ) ---- */
    var form = el("pd-form");
    var fields = [
      { input: el("f-date"), err: el("err-date"), test: function (v) { return v !== ""; } },
      { input: el("f-name"), err: el("err-name"), test: function (v) { return v.trim().length > 0; } },
      { input: el("f-email"), err: el("err-email"), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); } },
      { input: el("f-tel"), err: el("err-tel"), test: function (v) { return v.replace(/[^0-9]/g, "").length >= 10; } },
    ];

    fields.forEach(function (f) {
      f.input.addEventListener("input", function () {
        f.input.removeAttribute("aria-invalid");
        f.err.hidden = true;
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstError = null;
      fields.forEach(function (f) {
        var ok = f.test(f.input.value);
        f.err.hidden = ok;
        if (!ok) {
          f.input.setAttribute("aria-invalid", "true");
          if (!firstError) firstError = f.input;
        }
      });
      if (firstError) { firstError.focus(); return; }

      var submit = el("pd-submit");
      var status = el("pd-status");
      submit.disabled = true;
      status.textContent = "送信中…";

      var purpose = form.querySelector('input[name="purpose"]:checked').value;
      var dateText = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })
        .format(new Date(el("f-date").value + "T00:00:00"));

      setTimeout(function () {
        form.hidden = true;
        var done = el("pd-done");
        var summary = el("pd-done-summary");
        summary.textContent = "";
        [["お申し込みの衣裳", item.name + "(" + item.code + ")"],
         ["ご利用の目的", purpose],
         ["ご利用希望日", dateText],
         ["お名前", el("f-name").value.trim() + " さま"]].forEach(function (row) {
          var div = document.createElement("div");
          var dt = document.createElement("dt");
          dt.textContent = row[0];
          var dd = document.createElement("dd");
          dd.textContent = row[1];
          div.appendChild(dt); div.appendChild(dd);
          summary.appendChild(div);
        });
        done.hidden = false;
        done.focus();
      }, 800);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
