/* Atelier Yuka — 予約フォーム（5ステップ・デモ送信）
   「試着予約申込書」と同じ項目を1回で受け取り、最後に規約への同意を取る。

   仕組み:
   - 条件表示: data-when="name:value1,value2" を持つ要素は、そのラジオの値が一致する
     ときだけ表示。隠れた要素の入力欄は disabled にして検証・送信・要約から外す
   - 検証: 表示中のステップ内の [required] を総当たり。個別のエラー文は data-error
   - 引き継ぎ: ?code= / ?size= / ?height= などのURL引数を初期値に入れる（商品ページから）
   - 規約: assets/terms.js を、ご利用の目的（海外＝国外規約）で切り替えて描画 */
(function () {
  "use strict";

  var form = document.getElementById("reserve-form");
  if (!form) return;

  var $ = function (sel, root) { return (root || form).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || form).querySelectorAll(sel)); };

  var steps = $$(".form-step");
  var progressItems = $$("[data-progress]");
  var btnPrev = document.getElementById("btn-prev");
  var btnNext = document.getElementById("btn-next");
  var btnSubmit = document.getElementById("btn-submit");
  var liveRegion = document.getElementById("form-live");
  var completePanel = document.getElementById("form-complete");
  var currentStep = 0;
  var SUBMIT_DELAY_MS = 800;
  var OVERSEAS_PURPOSE = "海外挙式・フォト相談";

  /* ---------- 日付の下限 = 今日 ---------- */
  var today = new Date();
  var todayIso = today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2, "0") + "-" +
    String(today.getDate()).padStart(2, "0");
  $$('input[type="date"]').forEach(function (input) { input.min = todayIso; });

  /* ---------- ラジオの値 ---------- */
  var radioValue = function (name) {
    var checked = $('input[name="' + name + '"]:checked');
    return checked ? checked.value : "";
  };

  /* ---------- 条件表示 ---------- */
  var applyConditions = function () {
    $$("[data-when]").forEach(function (block) {
      var spec = block.getAttribute("data-when").split(":");
      var values = spec[1].split(",");
      var show = values.indexOf(radioValue(spec[0])) !== -1;
      block.hidden = !show;
      $$("input, select, textarea", block).forEach(function (input) { input.disabled = !show; });
    });
    /* 条件つき必須: data-required-when="name:value" */
    $$("[data-required-when]").forEach(function (input) {
      var spec = input.getAttribute("data-required-when").split(":");
      input.required = spec[1].split(",").indexOf(radioValue(spec[0])) !== -1;
    });
  };

  /* ---------- エラー表示 ---------- */
  var errorFor = function (input) {
    var wrap = input.closest(".measure, .field, .choice-group, .consent");
    return wrap ? wrap.querySelector(".field-error") : null;
  };
  var setError = function (input, message) {
    var errorEl = errorFor(input);
    var wrap = input.closest(".measure, .field, .choice-group, .consent");
    if (errorEl) { errorEl.textContent = message; errorEl.hidden = false; }
    if (wrap) wrap.classList.add("has-error");
    if (input.type === "radio") {
      $$('input[name="' + input.name + '"]').forEach(function (r) { r.setAttribute("aria-invalid", "true"); });
    } else {
      input.setAttribute("aria-invalid", "true");
    }
  };
  var clearErrorOf = function (input) {
    var errorEl = errorFor(input);
    var wrap = input.closest(".measure, .field, .choice-group, .consent");
    if (errorEl) { errorEl.textContent = ""; errorEl.hidden = true; }
    if (wrap) wrap.classList.remove("has-error");
    if (input.type === "radio") {
      $$('input[name="' + input.name + '"]').forEach(function (r) { r.removeAttribute("aria-invalid"); });
    } else {
      input.removeAttribute("aria-invalid");
    }
  };

  /* ---------- 検証（表示中のステップ内の required を総当たり） ---------- */
  /* ステップ自体の hidden は見ない（確認ステップから他ステップの値を集めるため） */
  var isVisible = function (el) {
    for (var node = el; node && node !== form; node = node.parentElement) {
      if (node.hidden && !node.classList.contains("form-step")) return false;
    }
    return true;
  };

  var validateInput = function (input) {
    var message = input.getAttribute("data-error") || "ご入力ください。";
    if (input.type === "radio") {
      if (!radioValue(input.name)) { setError(input, message); return false; }
      return true;
    }
    if (input.type === "checkbox") {
      if (!input.checked) { setError(input, message); return false; }
      return true;
    }
    var value = input.value.trim();
    if (value === "") { setError(input, message); return false; }
    if (!input.checkValidity()) {
      setError(input, input.getAttribute("data-error-format") || "入力形式をご確認ください。");
      return false;
    }
    if (input.type === "date" && value < todayIso) {
      setError(input, "本日以降の日付をお選びください。");
      return false;
    }
    return true;
  };

  var validateStep = function (index) {
    var seen = {};
    var firstInvalid = null;
    $$("[required]", steps[index]).forEach(function (input) {
      if (input.disabled || !isVisible(input)) return;
      if (input.type === "radio") {
        if (seen[input.name]) return;
        seen[input.name] = true;
      }
      if (!validateInput(input) && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) { firstInvalid.focus(); return false; }
    return true;
  };

  form.addEventListener("input", function (event) {
    clearErrorOf(event.target);
  });
  form.addEventListener("change", function (event) {
    if (event.target.type === "radio") applyConditions();
  });

  /* ---------- ステップ切り替え ---------- */
  var showStep = function (index, moveFocus) {
    currentStep = index;
    steps.forEach(function (step, i) { step.hidden = i !== index; });
    progressItems.forEach(function (item, i) {
      item.classList.toggle("is-current", i === index);
      item.classList.toggle("is-done", i < index);
      if (i === index) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
    btnPrev.hidden = index === 0;
    btnNext.hidden = index === steps.length - 1;
    btnSubmit.hidden = index !== steps.length - 1;
    var legend = steps[index].querySelector(".step-legend");
    liveRegion.textContent = "ステップ" + (index + 1) + "/" + steps.length + ": " + legend.textContent;
    if (index === steps.length - 1) renderReview();
    if (moveFocus) legend.focus();
  };

  btnNext.addEventListener("click", function () {
    if (validateStep(currentStep)) showStep(currentStep + 1, true);
  });
  btnPrev.addEventListener("click", function () { showStep(currentStep - 1, true); });

  /* ---------- 入力内容の要約（確認ステップと完了画面で使う） ---------- */
  var labelOf = function (wrap) {
    var label = wrap.querySelector(".field-label");
    if (!label) return "";
    var clone = label.cloneNode(true);
    $$(".req, .opt", clone).forEach(function (el) { el.remove(); });
    return clone.textContent.trim();
  };

  var collect = function () {
    var rows = [];
    var seen = {};
    steps.forEach(function (step) {
      if (step.classList.contains("form-step-review")) return;
      var group = step.querySelector(".step-legend").textContent;
      $$(".field, .choice-group, .measure-group", step).forEach(function (wrap) {
        if (!isVisible(wrap)) return;
        var value = "";
        /* 採寸ブロックは凡例をラベルにして1行にまとめる */
        if (wrap.classList.contains("measure-group")) {
          value = $$("input", wrap).filter(function (i) { return !i.disabled && i.value.trim(); })
            .map(function (i) { return i.getAttribute("data-short") + " " + i.value.trim() + " " + i.getAttribute("data-unit"); })
            .join(" ／ ");
          if (value) rows.push({ group: group, label: wrap.querySelector("legend").textContent, value: value });
          return;
        }
        var label = labelOf(wrap);
        if (!label) return;
        var radios = $$('input[type="radio"]', wrap);
        var checks = $$('input[type="checkbox"]', wrap);
        if (radios.length) {
          if (seen[radios[0].name]) return;
          seen[radios[0].name] = true;
          value = radioValue(radios[0].name);
        } else if (checks.length) {
          value = checks.filter(function (c) { return c.checked && !c.disabled; })
            .map(function (c) { return c.value; }).join("、");
        } else {
          value = $$("input, select, textarea", wrap).filter(function (i) { return !i.disabled; })
            .map(function (i) {
              var v = i.value.trim();
              if (!v) return "";
              if (i.type === "date") v = formatDateJa(v);
              var unit = i.getAttribute("data-unit");
              var name = i.getAttribute("data-short");
              return (name ? name + " " : "") + v + (unit ? " " + unit : "");
            })
            .filter(Boolean).join(" ／ ");
        }
        if (value) rows.push({ group: group, label: label, value: value });
      });
    });
    return rows;
  };

  var renderRows = function (dl, rows) {
    dl.replaceChildren();
    var lastGroup = "";
    rows.forEach(function (row) {
      if (row.group !== lastGroup) {
        var h = document.createElement("div");
        h.className = "review-group";
        h.textContent = row.group;
        dl.appendChild(h);
        lastGroup = row.group;
      }
      var div = document.createElement("div");
      var dt = document.createElement("dt");
      dt.textContent = row.label;
      var dd = document.createElement("dd");
      dd.textContent = row.value;
      div.appendChild(dt); div.appendChild(dd);
      dl.appendChild(div);
    });
  };

  /* ---------- 規約の描画（ご利用の目的で国内／国外を切り替え） ---------- */
  var termsVariant = function () {
    return radioValue("purpose") === OVERSEAS_PURPOSE ? "overseas" : "domestic";
  };

  var renderTerms = function () {
    var box = document.getElementById("terms-box");
    if (!box || typeof AY_TERMS === "undefined") return;
    var key = termsVariant();
    var doc = AY_TERMS[key];
    box.replaceChildren();
    var h = document.createElement("p");
    h.className = "terms-box-title";
    h.textContent = doc.title;
    box.appendChild(h);
    doc.sections.forEach(function (sec) {
      var st = document.createElement("p");
      st.className = "terms-box-sec";
      st.textContent = sec.title;
      box.appendChild(st);
      if (sec.lead) {
        var lead = document.createElement("p");
        lead.className = "terms-box-lead";
        lead.textContent = sec.lead;
        box.appendChild(lead);
      }
      var ul = document.createElement("ul");
      sec.items.forEach(function (text) {
        var li = document.createElement("li");
        li.textContent = text;
        ul.appendChild(li);
      });
      box.appendChild(ul);
      if (sec.note) {
        var note = document.createElement("p");
        note.className = "terms-box-note";
        note.textContent = "※ " + sec.note;
        box.appendChild(note);
      }
    });
    var link = document.getElementById("terms-link");
    if (link) link.href = "terms.html#" + key;
    var agreeLabel = document.getElementById("agree-label");
    if (agreeLabel) agreeLabel.textContent = "上記の" + doc.title + "を確認し、同意します";
    $("#f-terms-version").value = doc.title + " " + AY_TERMS.version;
  };

  var renderReview = function () {
    renderRows(document.getElementById("review-summary"), collect());
    renderTerms();
  };

  /* ---------- 送信（デモ: 800ms後に完了画面） ---------- */
  var formatDateJa = function (isoValue) {
    var date = new Date(isoValue + "T00:00:00");
    if (isNaN(date.getTime())) return isoValue;
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric", month: "long", day: "numeric", weekday: "short"
    }).format(date);
  };

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!validateStep(currentStep)) return;

    /* 同意の記録（送信内容に含める） */
    $("#f-terms-agreed-at").value = new Date().toISOString();

    btnSubmit.disabled = true;
    btnPrev.disabled = true;
    btnSubmit.textContent = "送信中…";
    liveRegion.textContent = "送信中…";

    var rows = collect();
    window.setTimeout(function () {
      document.getElementById("complete-name").textContent = $("#f-name").value.trim();
      renderRows(document.getElementById("complete-summary"), rows);
      document.getElementById("complete-terms").textContent =
        $("#f-terms-version").value + " に同意（" + formatDateJa(todayIso) + "）";
      form.hidden = true;
      completePanel.hidden = false;
      document.getElementById("complete-title").focus();
    }, SUBMIT_DELAY_MS);
  });

  /* ---------- 最初からやり直す ---------- */
  document.getElementById("btn-reset").addEventListener("click", function () {
    form.reset();
    $$("[aria-invalid]").forEach(function (input) { input.removeAttribute("aria-invalid"); });
    $$(".has-error").forEach(function (wrap) { wrap.classList.remove("has-error"); });
    $$(".field-error").forEach(function (el) { el.textContent = ""; el.hidden = true; });
    btnSubmit.disabled = false;
    btnPrev.disabled = false;
    btnSubmit.textContent = "この内容で申し込む";
    completePanel.hidden = true;
    form.hidden = false;
    applyConditions();
    showStep(0, true);
  });

  /* ---------- 衣裳番号の候補（assets/data.js があれば） ---------- */
  var fillCodeList = function () {
    var list = document.getElementById("code-list");
    if (!list || typeof AY === "undefined") return;
    Object.keys(AY.collections).forEach(function (key) {
      AY.collections[key].items.forEach(function (item) {
        var opt = document.createElement("option");
        opt.value = item.code;
        opt.label = item.name + "（" + AY.collections[key].label + "）";
        list.appendChild(opt);
      });
    });
  };

  /* ---------- 商品ページからの引き継ぎ（?code= &size= &height= ...） ---------- */
  var prefill = function () {
    var params = new URLSearchParams(location.search);
    var map = {
      code: "f-code-1",
      height: "f-b-height", bust: "f-b-bust", waist: "f-b-waist", hip: "f-b-hip",
    };
    var touched = false;
    Object.keys(map).forEach(function (key) {
      var value = params.get(key);
      var input = document.getElementById(map[key]);
      if (value && input) { input.value = value; touched = true; }
    });
    var size = params.get("size");
    var sizeInput = document.getElementById("f-size-hint");
    var sizeNote = document.getElementById("size-hint-note");
    if (size && sizeInput) {
      sizeInput.value = size;
      if (sizeNote) {
        sizeNote.textContent = "商品ページのサイズ診断結果「" + size + "」を添えてお送りします。";
        sizeNote.hidden = false;
      }
      touched = true;
    }
    var who = params.get("who");
    if (who) {
      var radio = $('input[name="who"][value="' + who + '"]');
      if (radio) { radio.checked = true; touched = true; }
    }
    return touched;
  };

  fillCodeList();
  var prefilled = prefill();
  applyConditions();
  showStep(0, false);
  if (prefilled && location.hash === "#reserve") {
    var section = document.getElementById("reserve");
    /* html の scroll-behavior: smooth に引きずられないよう即時に寄せる */
    if (section) section.scrollIntoView({ block: "start", behavior: "instant" });
  }
})();
