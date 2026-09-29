/* Atelier Yuka — ご予約フォーム（5ステップ・Shopify のお問い合わせフォームで送信）
   サンプル assets/js/reserve-form.js から移植。

   仕組み:
   - 条件表示: data-when="name:id1,id2" を持つ要素は、そのラジオの値が一致するときだけ表示。
     隠れた要素の入力欄は disabled にして、検証・送信・要約から外す
   - 検証: 表示中のステップ内の [required] を総当たり。個別のエラー文は data-error
   - 送信: 確認画面と同じ要約を本文にして contact[body] に入れ、Shopify にそのまま送る。
     送信後はページが読み直されるので、完了画面用の要約と、エラーで戻ったとき用の下書きを sessionStorage に置く
   - 引き継ぎ: 商品ページからの ?code= &who= &size= &bust= … を初期値に入れる
   - 規約: assets/terms.js の AY_TERMS を、ご利用の目的（海外＝国外規約）で切り替えて描画 */
(function () {
  "use strict";

  var DRAFT_KEY = "ay-reserve-draft";
  var SENT_KEY = "ay-reserve-sent";
  var OVERSEAS = "overseas";
  var SUGGEST_LIMIT = 8;
  var SUGGEST_DELAY_MS = 250;

  var stringsEl = document.querySelector("[data-reserve-strings]");
  var t = stringsEl ? JSON.parse(stringsEl.textContent) : {};
  var format = function (template, vars) {
    return String(template || "").replace(/\{(\w+)\}/g, function (_, k) { return vars[k] == null ? "" : vars[k]; });
  };

  var storage = {
    get: function (key) {
      try { return JSON.parse(window.sessionStorage.getItem(key) || "null"); } catch (e) { return null; }
    },
    set: function (key, value) {
      try { window.sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* 保存できなくても送信はできる */ }
    },
    remove: function (key) {
      try { window.sessionStorage.removeItem(key); } catch (e) { /* 何もしない */ }
    },
  };

  var formatDate = function (isoValue) {
    var date = new Date(isoValue + "T00:00:00");
    if (isNaN(date.getTime())) return isoValue;
    return new Intl.DateTimeFormat(t.locale || "ja", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(date);
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
      div.appendChild(dt);
      div.appendChild(dd);
      dl.appendChild(div);
    });
  };

  /* ---------- 送信後（完了画面）: 一時保存した要約を出す ---------- */
  var complete = document.getElementById("form-complete");
  if (complete) {
    var sent = storage.get(SENT_KEY);
    storage.remove(DRAFT_KEY);
    if (sent) {
      document.getElementById("complete-greeting").textContent = format(t.greeting, { name: sent.name });
      renderRows(document.getElementById("complete-summary"), sent.rows);
      document.getElementById("complete-terms").textContent = sent.terms;
      storage.remove(SENT_KEY);
    }
    document.getElementById("complete-title").focus();
    return;
  }

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
  var currentStep = 0;

  /* ---------- 日付の下限 = 今日 ---------- */
  var today = new Date();
  var todayIso = today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2, "0") + "-" +
    String(today.getDate()).padStart(2, "0");
  $$('input[type="date"]').forEach(function (input) { input.min = todayIso; });

  var radioValue = function (name) {
    var checked = $('input[name="' + name + '"]:checked');
    return checked ? checked.value : "";
  };
  /* メール・確認画面には ID ではなく画面の文言を載せる */
  var choiceText = function (input) {
    var span = input.parentElement.querySelector("span");
    return span ? span.textContent.trim() : input.value;
  };

  /* ---------- 条件表示 ---------- */
  /* 入れ子（例: 目的の中のお届け日の中の日付指定）は、外側が隠れていれば内側も隠す。
     querySelectorAll は文書順なので、外側が先に決まっている */
  var applyConditions = function () {
    $$("[data-when]").forEach(function (block) {
      var spec = block.getAttribute("data-when").split(":");
      var outer = block.parentElement.closest("[data-when]");
      var show = spec[1].split(",").indexOf(radioValue(spec[0])) !== -1 && !(outer && outer.hidden);
      block.hidden = !show;
      $$("input, select, textarea", block).forEach(function (input) { input.disabled = !show; });
    });
  };

  /* ---------- エラー表示 ---------- */
  var wrapOf = function (input) { return input.closest(".measure, .field, .choice-group, .consent"); };
  var setError = function (input, message) {
    var wrap = wrapOf(input);
    var errorEl = wrap ? wrap.querySelector(".field-error") : null;
    if (errorEl) { errorEl.textContent = message; errorEl.hidden = false; }
    if (wrap) wrap.classList.add("has-error");
    var targets = input.type === "radio" ? $$('input[name="' + input.name + '"]') : [input];
    targets.forEach(function (el) { el.setAttribute("aria-invalid", "true"); });
  };
  var clearErrorOf = function (input) {
    var wrap = wrapOf(input);
    var errorEl = wrap ? wrap.querySelector(".field-error") : null;
    if (errorEl) { errorEl.textContent = ""; errorEl.hidden = true; }
    if (wrap) wrap.classList.remove("has-error");
    var targets = input.type === "radio" ? $$('input[name="' + input.name + '"]') : [input];
    targets.forEach(function (el) { el.removeAttribute("aria-invalid"); });
  };

  /* ステップ自体の hidden は見ない（確認ステップから他ステップの値を集めるため） */
  var isVisible = function (el) {
    for (var node = el; node && node !== form; node = node.parentElement) {
      if (node.hidden && !node.classList.contains("form-step")) return false;
    }
    return true;
  };

  var validateInput = function (input) {
    var message = input.getAttribute("data-error") || t.generic;
    if (input.type === "radio") {
      if (!radioValue(input.name)) { setError(input, message); return false; }
      return true;
    }
    if (input.type === "checkbox") {
      if (!input.checked) { setError(input, message); return false; }
      return true;
    }
    var value = input.value.trim();
    if (value === "") {
      if (!input.required) return true;
      setError(input, message);
      return false;
    }
    if (!input.checkValidity()) {
      setError(input, input.getAttribute("data-error-format") || t.format);
      return false;
    }
    if (input.type === "date" && value < todayIso) { setError(input, t.pastDate); return false; }
    /* data-before="date1": 指定した欄の日付より前でないといけない（お届け日は試着日より前） */
    var beforeName = input.getAttribute("data-before");
    var limit = beforeName ? $('[name="' + beforeName + '"]') : null;
    if (limit && limit.value && value >= limit.value) {
      setError(input, input.getAttribute("data-before-error") || t.format);
      return false;
    }
    return true;
  };

  /* 必須の欄に加えて、任意の欄も値が入っていれば範囲・形式を確かめる（ヒップ 234cm などを通さない） */
  var needsCheck = function (input) {
    if (input.required) return true;
    if (input.type === "radio" || input.type === "checkbox" || input.type === "hidden") return false;
    return input.value.trim() !== "";
  };

  var validateStep = function (index) {
    var seen = {};
    var firstInvalid = null;
    $$("input, textarea", steps[index]).forEach(function (input) {
      if (input.disabled || !isVisible(input) || !needsCheck(input)) return;
      if (input.type === "radio") {
        if (seen[input.name]) return;
        seen[input.name] = true;
      }
      if (!validateInput(input) && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) { firstInvalid.focus(); return false; }
    return true;
  };

  form.addEventListener("input", function (e) { clearErrorOf(e.target); });
  form.addEventListener("change", function (e) {
    if (e.target.type === "radio" || e.target.type === "checkbox") clearErrorOf(e.target);
    if (e.target.type === "radio") applyConditions();
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
    liveRegion.textContent = format(t.stepStatus, { current: index + 1, total: steps.length, legend: legend.textContent });
    if (index === steps.length - 1) renderReview();
    if (moveFocus) legend.focus();
  };

  btnNext.addEventListener("click", function () {
    if (validateStep(currentStep)) showStep(currentStep + 1, true);
  });
  btnPrev.addEventListener("click", function () { showStep(currentStep - 1, true); });

  /* ---------- 入力内容の要約（確認画面・メール本文・完了画面） ---------- */
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
      var group = step.querySelector(".step-legend").textContent.trim();
      $$(".field, .choice-group, .measure-group", step).forEach(function (wrap) {
        if (!isVisible(wrap)) return;
        var value = "";
        /* 採寸ブロックは凡例をラベルにして1行にまとめる */
        if (wrap.classList.contains("measure-group")) {
          value = $$("input", wrap).filter(function (i) { return !i.disabled && i.value.trim(); })
            .map(function (i) { return i.getAttribute("data-short") + " " + i.value.trim() + " " + i.getAttribute("data-unit"); })
            .join(" ／ ");
          if (value) rows.push({ group: group, label: wrap.querySelector("legend").textContent.trim(), value: value });
          return;
        }
        var label = labelOf(wrap);
        if (!label) return;
        var radios = $$('input[type="radio"]', wrap);
        var checks = $$('input[type="checkbox"]', wrap);
        if (radios.length) {
          if (seen[radios[0].name]) return;
          seen[radios[0].name] = true;
          var checked = radios.filter(function (r) { return r.checked; })[0];
          value = checked ? choiceText(checked) : "";
        } else if (checks.length) {
          value = checks.filter(function (c) { return c.checked && !c.disabled; }).map(choiceText).join("、");
        } else {
          value = $$("input, select, textarea", wrap).filter(function (i) { return !i.disabled; })
            .map(function (i) {
              var v = i.value.trim();
              if (!v) return "";
              if (i.type === "date") v = formatDate(v);
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

  /* ---------- 規約の描画（ご利用の目的で国内／国外を切り替え） ---------- */
  var termsDoc = function () {
    if (typeof AY_TERMS === "undefined") return null;
    return AY_TERMS[radioValue("purpose") === OVERSEAS ? "overseas" : "domestic"];
  };

  var renderTerms = function () {
    var box = document.getElementById("terms-box");
    var doc = termsDoc();
    if (!box || !doc) return;
    box.replaceChildren();
    var add = function (tag, className, text) {
      var el = document.createElement(tag);
      if (className) el.className = className;
      el.textContent = text;
      box.appendChild(el);
      return el;
    };
    add("p", "terms-box-title", doc.title);
    doc.sections.forEach(function (sec) {
      add("p", "terms-box-sec", sec.title);
      if (sec.lead) add("p", "terms-box-lead", sec.lead);
      var ul = document.createElement("ul");
      sec.items.forEach(function (text) {
        var li = document.createElement("li");
        li.textContent = text;
        ul.appendChild(li);
      });
      box.appendChild(ul);
      if (sec.note) add("p", "terms-box-note", "※ " + sec.note);
    });
    var links = document.getElementById("terms-links");
    var link = links ? links.querySelector("a") : null;
    if (link) link.href = links.getAttribute("data-base-url") + "#" + doc.key;
    document.getElementById("agree-label").textContent = format(t.agreeWithTitle, { title: doc.title });
  };

  var renderReview = function () {
    renderRows(document.getElementById("review-summary"), collect());
    renderTerms();
  };

  /* ---------- 送信 ---------- */
  var termsLine = function () {
    var doc = termsDoc();
    if (!doc) return "";
    var now = new Date();
    var time = new Intl.DateTimeFormat(t.locale || "ja", { hour: "2-digit", minute: "2-digit" }).format(now);
    return format(t.termsLine, { title: doc.title, version: AY_TERMS.version, date: formatDate(todayIso) + " " + time });
  };

  var bodyText = function (rows, terms) {
    var lines = [t.mailHeader, ""];
    var lastGroup = "";
    rows.forEach(function (row) {
      if (row.group !== lastGroup) {
        if (lastGroup) lines.push("");
        lines.push("■ " + row.group);
        lastGroup = row.group;
      }
      lines.push(row.label + ": " + row.value);
    });
    lines.push("", terms);
    return lines.join("\n");
  };

  var saveDraft = function () {
    var draft = {};
    $$("input, textarea").forEach(function (input) {
      var isShopifyField = input.name.indexOf("contact[") === 0 || (input.type === "hidden" && input.id !== "f-size-hint");
      if (!input.name || isShopifyField) return;
      if (input.type === "radio" || input.type === "checkbox") {
        if (input.checked) (draft[input.name] = draft[input.name] || []).push(input.value);
      } else if (input.value) {
        draft[input.name] = input.value;
      }
    });
    storage.set(DRAFT_KEY, draft);
  };

  var restoreDraft = function () {
    var draft = storage.get(DRAFT_KEY);
    if (!draft) return false;
    Object.keys(draft).forEach(function (name) {
      var value = draft[name];
      $$('[name="' + name + '"]').forEach(function (input) {
        if (input.type === "radio" || input.type === "checkbox") input.checked = value.indexOf(input.value) !== -1;
        else input.value = value;
      });
    });
    return true;
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validateStep(currentStep)) return;

    var rows = collect();
    var terms = termsLine();
    var name = $('[name="name"]').value.trim();
    var purposeInput = $('input[name="purpose"]:checked');
    var set = function (key, value) { $('[data-contact="' + key + '"]').value = value; };
    set("name", name);
    set("email", $('[name="email"]').value.trim());
    set("phone", $('[name="tel"]').value.trim());
    set("subject", format(t.mailSubject, { name: name, purpose: purposeInput ? choiceText(purposeInput) : "" }));
    set("terms", terms);
    set("body", bodyText(rows, terms));

    saveDraft();
    storage.set(SENT_KEY, { name: name, rows: rows, terms: terms });

    btnSubmit.disabled = true;
    btnPrev.disabled = true;
    btnSubmit.setAttribute("aria-busy", "true");
    btnSubmit.textContent = t.sending;
    liveRegion.textContent = t.sending;
    HTMLFormElement.prototype.submit.call(form); // submit イベントを通らずに送る
  });

  /* ---------- 衣裳番号の候補（Shopify の検索候補から） ---------- */
  var codeList = document.getElementById("code-list");
  var suggestTimer = null;
  var codeOf = function (product) {
    var code = String(product.title || "").replace(product.type || "", "").replace(/　/g, " ").trim();
    return code || product.title;
  };
  var suggest = function (query) {
    if (!codeList || query.length < 2) return;
    var url = "/search/suggest.json?q=" + encodeURIComponent(query) +
      "&resources[type]=product&resources[limit]=" + SUGGEST_LIMIT;
    fetch(url)
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (!data) return;
        codeList.replaceChildren();
        data.resources.results.products.forEach(function (product) {
          var option = document.createElement("option");
          option.value = codeOf(product);
          option.label = product.type || "";
          codeList.appendChild(option);
        });
      })
      .catch(function () { /* 候補が出なくても手入力はできる */ });
  };
  $$("[data-code-input]").forEach(function (input) {
    input.addEventListener("input", function () {
      window.clearTimeout(suggestTimer);
      var query = input.value.trim();
      suggestTimer = window.setTimeout(function () { suggest(query); }, SUGGEST_DELAY_MS);
    });
  });

  /* ---------- 商品ページからの引き継ぎ ---------- */
  var prefill = function () {
    var params = new URLSearchParams(window.location.search);
    var map = { code: "code1", height: "brideHeight", bust: "brideBust", waist: "brideWaist", hip: "brideHip" };
    Object.keys(map).forEach(function (key) {
      var value = params.get(key);
      var input = $('[name="' + map[key] + '"]');
      if (value && input) input.value = value;
    });
    var size = params.get("size");
    if (size) {
      $("#f-size-hint").value = size;
      var note = $("#size-hint-note");
      note.textContent = format(t.sizeHintNote, { size: size });
      note.hidden = false;
    }
    var who = params.get("who");
    var radio = who && $('input[name="who"][value="' + who + '"]');
    if (radio) radio.checked = true;
    /* ?purpose=order など（Elieca のページの「ご相談を予約する」から） */
    var purpose = params.get("purpose");
    var purposeRadio = purpose && $('input[name="purpose"][value="' + purpose + '"]');
    if (purposeRadio) purposeRadio.checked = true;
  };

  /* 送信に失敗して戻ってきたときは、下書きを戻す。そうでなければ商品ページからの引き継ぎ */
  if (document.querySelector("[data-server-error]") && restoreDraft()) {
    applyConditions();
    var sizeHint = $("#f-size-hint").value;
    if (sizeHint) {
      $("#size-hint-note").textContent = format(t.sizeHintNote, { size: sizeHint });
      $("#size-hint-note").hidden = false;
    }
  } else {
    prefill();
  }
  storage.remove(SENT_KEY);
  applyConditions();
  showStep(0, false);
})();
