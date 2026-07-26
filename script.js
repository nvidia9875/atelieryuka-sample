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

    var selectTab = function (tab, focus) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute("aria-selected", selected ? "true" : "false");
        t.tabIndex = selected ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      });
      if (focus) tab.focus();

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

  /* ==========================================================
     3. 予約ステップフォーム(3ステップ・デモ送信)
     ========================================================== */
  var form = document.getElementById("reserve-form");
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll(".form-step"));
  var progressItems = Array.prototype.slice.call(form.querySelectorAll("[data-progress]"));
  var btnPrev = document.getElementById("btn-prev");
  var btnNext = document.getElementById("btn-next");
  var btnSubmit = document.getElementById("btn-submit");
  var liveRegion = document.getElementById("form-live");
  var completePanel = document.getElementById("form-complete");
  var currentStep = 0;
  var stepNames = ["日程", "衣裳", "お客さま情報"];
  var SUBMIT_DELAY_MS = 800;

  /* 希望日の下限 = 今日(ローカル日付) */
  var dateInput = document.getElementById("f-date");
  var today = new Date();
  var todayIso = today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2, "0") + "-" +
    String(today.getDate()).padStart(2, "0");
  dateInput.min = todayIso;

  /* ---------- エラー表示ヘルパー ---------- */
  var showError = function (errorEl, message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  };
  var clearError = function (errorEl) {
    errorEl.textContent = "";
    errorEl.hidden = true;
  };
  var markInvalid = function (input, invalid) {
    if (invalid) {
      input.setAttribute("aria-invalid", "true");
    } else {
      input.removeAttribute("aria-invalid");
    }
  };

  /* ---------- ラジオグループ検証 ---------- */
  var validateRadioGroup = function (name, errorId, message) {
    var radios = Array.prototype.slice.call(form.querySelectorAll('input[name="' + name + '"]'));
    var errorEl = document.getElementById(errorId);
    var group = radios[0].closest(".choice-group");
    var checked = radios.some(function (r) { return r.checked; });
    if (!checked) {
      showError(errorEl, message);
      group.classList.add("has-error");
      radios.forEach(function (r) { markInvalid(r, true); });
      return { valid: false, focusTarget: radios[0] };
    }
    clearError(errorEl);
    group.classList.remove("has-error");
    radios.forEach(function (r) { markInvalid(r, false); });
    return { valid: true, focusTarget: null };
  };

  /* ---------- テキスト系フィールド検証 ---------- */
  var validateField = function (input, errorId, check, message) {
    var errorEl = document.getElementById(errorId);
    if (!check()) {
      showError(errorEl, message);
      markInvalid(input, true);
      return { valid: false, focusTarget: input };
    }
    clearError(errorEl);
    markInvalid(input, false);
    return { valid: true, focusTarget: null };
  };

  var nameInput = document.getElementById("f-name");
  var emailInput = document.getElementById("f-email");
  var telInput = document.getElementById("f-tel");

  var validators = [
    /* ステップ1: 目的+希望日 */
    function () {
      var results = [];
      results.push(validateRadioGroup("purpose", "purpose-error", "ご利用の目的をお選びください。"));
      results.push(validateField(dateInput, "f-date-error", function () {
        if (dateInput.value === "") return false;
        return dateInput.value >= todayIso;
      }, dateInput.value === "" ? "ご希望日をお選びください。" : "本日以降の日付をお選びください。"));
      return results;
    },
    /* ステップ2: 衣裳カテゴリ(ドレスは任意) */
    function () {
      return [validateRadioGroup("category", "category-error", "衣裳カテゴリをお選びください。")];
    },
    /* ステップ3: お名前・メール・電話 */
    function () {
      var results = [];
      results.push(validateField(nameInput, "f-name-error", function () {
        return nameInput.value.trim() !== "";
      }, "お名前をご入力ください。"));
      results.push(validateField(emailInput, "f-email-error", function () {
        return emailInput.value.trim() !== "" && emailInput.checkValidity();
      }, emailInput.value.trim() === ""
        ? "メールアドレスをご入力ください。"
        : "メールアドレスの形式をご確認ください(例: hanako@example.com)。"));
      results.push(validateField(telInput, "f-tel-error", function () {
        return /^[0-9+\-() ]{10,15}$/.test(telInput.value.trim());
      }, telInput.value.trim() === ""
        ? "お電話番号をご入力ください。"
        : "お電話番号の形式をご確認ください(例: 09012345678)。"));
      return results;
    }
  ];

  var validateStep = function (index) {
    var results = validators[index]();
    var firstInvalid = null;
    results.forEach(function (r) {
      if (!r.valid && !firstInvalid) firstInvalid = r.focusTarget;
    });
    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }
    return true;
  };

  /* ---------- 入力し直したらエラーを消す ---------- */
  form.addEventListener("input", function (event) {
    var input = event.target;
    if (input.name === "purpose" || input.name === "category") {
      var errorEl = document.getElementById(input.name + "-error");
      clearError(errorEl);
      var group = input.closest(".choice-group");
      group.classList.remove("has-error");
      Array.prototype.slice.call(form.querySelectorAll('input[name="' + input.name + '"]'))
        .forEach(function (r) { markInvalid(r, false); });
      return;
    }
    var map = { "f-date": "f-date-error", "f-name": "f-name-error", "f-email": "f-email-error", "f-tel": "f-tel-error" };
    if (map[input.id]) {
      clearError(document.getElementById(map[input.id]));
      markInvalid(input, false);
    }
  });

  /* ---------- ステップ表示切り替え ---------- */
  var showStep = function (index, moveFocus) {
    currentStep = index;
    steps.forEach(function (step, i) { step.hidden = i !== index; });
    progressItems.forEach(function (item, i) {
      item.classList.toggle("is-current", i === index);
      item.classList.toggle("is-done", i < index);
      if (i === index) {
        item.setAttribute("aria-current", "step");
      } else {
        item.removeAttribute("aria-current");
      }
    });
    btnPrev.hidden = index === 0;
    btnNext.hidden = index === steps.length - 1;
    btnSubmit.hidden = index !== steps.length - 1;
    liveRegion.textContent = "ステップ" + (index + 1) + "/3: " + stepNames[index];
    if (moveFocus) {
      steps[index].querySelector(".step-legend").focus();
    }
  };

  btnNext.addEventListener("click", function () {
    if (validateStep(currentStep)) {
      showStep(currentStep + 1, true);
    }
  });

  btnPrev.addEventListener("click", function () {
    showStep(currentStep - 1, true);
  });

  /* ---------- デモ送信(800ms後に完了画面) ---------- */
  var formatDateJa = function (isoValue) {
    var date = new Date(isoValue + "T00:00:00");
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric", month: "long", day: "numeric", weekday: "short"
    }).format(date);
  };

  var getRadioValue = function (name) {
    var checked = form.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : "";
  };

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!validateStep(currentStep)) return;

    btnSubmit.disabled = true;
    btnPrev.disabled = true;
    btnSubmit.textContent = "送信中…";
    liveRegion.textContent = "送信中…";

    window.setTimeout(function () {
      document.getElementById("complete-name").textContent = nameInput.value.trim();
      document.getElementById("complete-date").textContent = formatDateJa(dateInput.value);
      document.getElementById("complete-purpose").textContent = getRadioValue("purpose");
      var dress = document.getElementById("f-dress").value;
      document.getElementById("complete-category").textContent =
        getRadioValue("category") + (dress !== "" ? " — " + dress : "");
      form.hidden = true;
      completePanel.hidden = false;
      document.getElementById("complete-title").focus();
    }, SUBMIT_DELAY_MS);
  });

  /* ---------- 最初からやり直す ---------- */
  document.getElementById("btn-reset").addEventListener("click", function () {
    form.reset();
    ["purpose-error", "category-error", "f-date-error", "f-name-error", "f-email-error", "f-tel-error"]
      .forEach(function (id) { clearError(document.getElementById(id)); });
    Array.prototype.slice.call(form.querySelectorAll('[aria-invalid="true"]'))
      .forEach(function (input) { markInvalid(input, false); });
    Array.prototype.slice.call(form.querySelectorAll(".choice-group.has-error"))
      .forEach(function (group) { group.classList.remove("has-error"); });
    btnSubmit.disabled = false;
    btnPrev.disabled = false;
    btnSubmit.textContent = "この内容で申し込む";
    completePanel.hidden = true;
    form.hidden = false;
    showStep(0, true);
  });
})();

/* ---------- 画像ライトボックス(共通 assets/lightbox.js) ---------- */
(function () {
  "use strict";
  if (!window.AYLightbox) return;
  window.AYLightbox.attach(".product-grid", "li", {
    frame: ".product-media",
    title: ".product-name",
    sub: [".product-meta", ".product-price"],
  });
})();
(function () {
  "use strict";
  if (!window.AYLightbox) return;
  window.AYLightbox.attach(".journey-grid", ".journey", {
    frame: ".journey-frame",
    title: ".journey-city",
    sub: [".journey-meta"],
  });
})();
