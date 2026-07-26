/* Atelier Yuka — C案 Storytelling「Journey」 interaction layer
   コンテンツはHTMLに直接記述。ここではリビール・進捗ライン・チャット式予約デモのみ扱う。 */
(() => {
  "use strict";

  const doc = document;
  doc.documentElement.classList.add("js");

  const motionOK = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

  /* ---------- scroll reveal (IntersectionObserver) ---------- */

  const revealEls = [...doc.querySelectorAll("[data-reveal]")];

  doc.querySelectorAll("[data-stagger]").forEach((group) => {
    [...group.querySelectorAll("[data-reveal]")].forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 70, 420)}ms`;
    });
  });

  if (motionOK && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- header state + 旅の道のりライン(scaleY) ---------- */

  const head = doc.querySelector(".site-head");
  const progress = doc.querySelector(".journey-line-progress");
  let ticking = false;

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      const y = window.scrollY;
      if (head) head.classList.toggle("is-scrolled", y > 24);
      if (progress) {
        const max = doc.documentElement.scrollHeight - window.innerHeight;
        const ratio = max > 0 ? Math.min(1, y / max) : 0;
        progress.style.transform = `scaleY(${ratio})`;
      }
      ticking = false;
    });
  };

  doc.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- チャット式予約フォーム(デモ) ---------- */

  const form = doc.getElementById("reserve-form");
  if (!form) return;

  const bots = [doc.getElementById("bot-1"), doc.getElementById("bot-2"), doc.getElementById("bot-3")];
  const steps = [doc.getElementById("step-1"), doc.getElementById("step-2"), doc.getElementById("step-3")];
  const done = doc.getElementById("chat-done");
  const submitBtn = doc.getElementById("submit-btn");
  const echoes = [null, null];
  let current = 1;
  let submitted = false;

  /* 初期状態: STEP 2/3 は隠す(JSなし環境では全質問が最初から見える) */
  [bots[1], bots[2], steps[1], steps[2]].forEach((el) => { el.hidden = true; });

  const field = (id) => doc.getElementById(id);
  const dateInput = field("f-date");
  const dressInput = field("f-dress");
  const nameInput = field("f-name");
  const emailInput = field("f-email");
  const telInput = field("f-tel");

  const checkedValue = (name) => {
    const el = form.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : "";
  };

  /* 希望日の下限 = 今日(ローカル日付) */
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const todayISO = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  dateInput.min = todayISO;

  const dateFmt = new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric" });
  const formatDate = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return dateFmt.format(new Date(y, m - 1, d));
  };

  const showError = (errId, msg, input) => {
    const el = doc.getElementById(errId);
    if (msg) el.textContent = msg;
    el.hidden = false;
    if (input) input.setAttribute("aria-invalid", "true");
  };

  const hideError = (errId, input) => {
    const el = doc.getElementById(errId);
    el.hidden = true;
    if (input) input.removeAttribute("aria-invalid");
  };

  const setGroupInvalid = (name, invalid) => {
    form.querySelectorAll(`input[name="${name}"]`).forEach((r) => {
      if (invalid) r.setAttribute("aria-invalid", "true");
      else r.removeAttribute("aria-invalid");
    });
  };

  /* ---------- validation ---------- */

  const validateStep1 = () => {
    let firstBad = null;
    if (!checkedValue("purpose")) {
      showError("err-purpose");
      setGroupInvalid("purpose", true);
      firstBad = form.querySelector('input[name="purpose"]');
    } else {
      hideError("err-purpose");
      setGroupInvalid("purpose", false);
    }
    const v = dateInput.value;
    let msg = "";
    if (!v) msg = "ご希望日をお選びください。";
    else if (v < todayISO) msg = "本日以降の日付をお選びください。";
    if (msg) {
      showError("err-date", msg, dateInput);
      firstBad = firstBad || dateInput;
    } else {
      hideError("err-date", dateInput);
    }
    return firstBad;
  };

  const validateStep2 = () => {
    if (!checkedValue("category")) {
      showError("err-category");
      setGroupInvalid("category", true);
      return form.querySelector('input[name="category"]');
    }
    hideError("err-category");
    setGroupInvalid("category", false);
    return null;
  };

  const validateStep3 = () => {
    let firstBad = null;
    if (!nameInput.value.trim()) {
      showError("err-name", "お名前をご入力ください。", nameInput);
      firstBad = nameInput;
    } else {
      hideError("err-name", nameInput);
    }
    const email = emailInput.value.trim();
    if (!email) {
      showError("err-email", "メールアドレスをご入力ください。", emailInput);
      firstBad = firstBad || emailInput;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("err-email", "メールアドレスの形式をご確認ください(例: hana@example.com)。", emailInput);
      firstBad = firstBad || emailInput;
    } else {
      hideError("err-email", emailInput);
    }
    const tel = telInput.value.trim().replace(/[\s()-]/g, "");
    if (!tel) {
      showError("err-tel", "お電話番号をご入力ください。", telInput);
      firstBad = firstBad || telInput;
    } else if (!/^\+?\d{10,13}$/.test(tel)) {
      showError("err-tel", "お電話番号は数字10〜13桁でご入力ください。", telInput);
      firstBad = firstBad || telInput;
    } else {
      hideError("err-tel", telInput);
    }
    return firstBad;
  };

  /* ---------- step transitions ---------- */

  const makeEcho = (text) => {
    const div = doc.createElement("div");
    div.className = "msg msg-user";
    const p = doc.createElement("p");
    p.textContent = text;
    div.appendChild(p);
    return div;
  };

  const focusPanel = (el) => {
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "center", behavior: motionOK ? "smooth" : "auto" });
  };

  const echoTextFor = (step) => {
    if (step === 1) return `${checkedValue("purpose")}・${formatDate(dateInput.value)} 希望`;
    const dress = dressInput.value.trim();
    return `${checkedValue("category")}${dress ? `・気になる一着: ${dress}` : ""}`;
  };

  const goNext = (fromStep) => {
    const bad = fromStep === 1 ? validateStep1() : validateStep2();
    if (bad) {
      bad.focus();
      return;
    }
    if (echoes[fromStep - 1]) echoes[fromStep - 1].remove();
    const echo = makeEcho(echoTextFor(fromStep));
    steps[fromStep - 1].after(echo);
    echoes[fromStep - 1] = echo;
    steps[fromStep - 1].hidden = true;
    bots[fromStep].hidden = false;
    steps[fromStep].hidden = false;
    current = fromStep + 1;
    focusPanel(steps[fromStep]);
  };

  const goBack = (toStep) => {
    steps[current - 1].hidden = true;
    bots[current - 1].hidden = true;
    if (echoes[toStep - 1]) {
      echoes[toStep - 1].remove();
      echoes[toStep - 1] = null;
    }
    steps[toStep - 1].hidden = false;
    current = toStep;
    focusPanel(steps[toStep - 1]);
  };

  doc.getElementById("next-1").addEventListener("click", () => goNext(1));
  doc.getElementById("next-2").addEventListener("click", () => goNext(2));
  doc.getElementById("back-2").addEventListener("click", () => goBack(1));
  doc.getElementById("back-3").addEventListener("click", () => goBack(2));

  /* 入力し直したらエラーを消す */
  [
    [dateInput, "err-date"],
    [nameInput, "err-name"],
    [emailInput, "err-email"],
    [telInput, "err-tel"],
  ].forEach(([input, errId]) => {
    input.addEventListener("input", () => hideError(errId, input));
  });

  form.querySelectorAll('input[name="purpose"], input[name="category"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      hideError(radio.name === "purpose" ? "err-purpose" : "err-category");
      setGroupInvalid(radio.name, false);
    });
  });

  /* ---------- submit(デモ: 800ms後に完了) ---------- */

  const SUBMIT_DELAY_MS = 800;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (submitted) return;
    if (current === 1) { goNext(1); return; }
    if (current === 2) { goNext(2); return; }

    const bad = validateStep3();
    if (bad) {
      bad.focus();
      return;
    }

    submitted = true;
    submitBtn.disabled = true;
    submitBtn.classList.add("is-loading");
    submitBtn.querySelector(".btn-label").textContent = "送信中…";
    form.setAttribute("aria-busy", "true");

    window.setTimeout(() => {
      form.removeAttribute("aria-busy");
      steps[2].hidden = true;
      const echo = makeEcho(`${nameInput.value.trim()}・${emailInput.value.trim()}・${telInput.value.trim()}`);
      steps[2].after(echo);

      doc.getElementById("done-name").textContent = `ありがとうございました、${nameInput.value.trim()}さま。`;

      const summary = doc.getElementById("done-summary");
      summary.textContent = "";
      const rows = [
        ["ご予定", checkedValue("purpose")],
        ["ご希望日", formatDate(dateInput.value)],
        ["衣裳カテゴリ", checkedValue("category")],
      ];
      const dress = dressInput.value.trim();
      if (dress) rows.push(["気になる一着", dress]);
      rows.forEach(([key, value]) => {
        const li = doc.createElement("li");
        const strong = doc.createElement("strong");
        strong.textContent = `${key}: `;
        li.appendChild(strong);
        li.appendChild(doc.createTextNode(value));
        summary.appendChild(li);
      });

      done.hidden = false;
      focusPanel(done);
    }, SUBMIT_DELAY_MS);
  });
})();

/* ---------- 画像ライトボックス(共通 assets/lightbox.js) ---------- */
(function () {
  "use strict";
  if (!window.AYLightbox) return;
  window.AYLightbox.attach(".dress-grid", ".dress-card", {
    frame: ".frame",
    title: ".d-name",
    sub: [".d-meta", ".d-price"],
  });
})();
(function () {
  "use strict";
  if (!window.AYLightbox) return;
  window.AYLightbox.attach(".journey-album", ".stamp", {
    frame: ".frame",
    title: ".stamp-ja",
    sub: [".stamp-tags"],
  });
})();
