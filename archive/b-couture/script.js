/* Atelier Yuka — B案 Couture「光のアトリエ」 interactions */
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var SUBMIT_DELAY_MS = 800;
  var SCROLL_THRESHOLD_PX = 24;
  var MIN_TEL_DIGITS = 10;

  /* ---------- scroll reveal ---------- */
  var revealTargets = document.querySelectorAll("[data-reveal]");
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealTargets.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- header state ---------- */
  var head = document.getElementById("siteHead");
  if (head) {
    var headTicking = false;
    var updateHead = function () {
      head.classList.toggle("is-scrolled", window.scrollY > SCROLL_THRESHOLD_PX);
      headTicking = false;
    };
    window.addEventListener("scroll", function () {
      if (!headTicking) {
        headTicking = true;
        window.requestAnimationFrame(updateHead);
      }
    }, { passive: true });
    updateHead();
  }

  /* ---------- collection rails ---------- */
  document.querySelectorAll("[data-gallery]").forEach(function (cat) {
    var rail = cat.querySelector(".rail");
    if (!rail) return;
    var buttons = cat.querySelectorAll(".rail-btn");

    var updateButtons = function () {
      var maxScroll = rail.scrollWidth - rail.clientWidth - 1;
      buttons.forEach(function (btn) {
        var dir = Number(btn.dataset.dir);
        btn.disabled = dir < 0 ? rail.scrollLeft <= 0 : rail.scrollLeft >= maxScroll;
      });
    };

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var step = Math.max(rail.clientWidth * 0.85, 240) * Number(btn.dataset.dir);
        rail.scrollBy({ left: step, behavior: reducedMotion.matches ? "auto" : "smooth" });
      });
    });

    var railTicking = false;
    rail.addEventListener("scroll", function () {
      if (!railTicking) {
        railTicking = true;
        window.requestAnimationFrame(function () {
          updateButtons();
          railTicking = false;
        });
      }
    }, { passive: true });
    window.addEventListener("resize", updateButtons);
    updateButtons();
  });

  /* ---------- alternate-cut toggles(ホバーの代替操作) ---------- */
  document.querySelectorAll(".alt-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var work = btn.closest(".work");
      if (!work) return;
      var pressed = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", String(!pressed));
      work.classList.toggle("is-alt", !pressed);
    });
  });

  /* ---------- concierge wizard ---------- */
  var form = document.getElementById("wizard");
  if (!form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll(".step"));
  var dots = form.querySelectorAll("[data-dot]");
  var stepNow = document.getElementById("stepNow");
  var statusEl = document.getElementById("wizardStatus");
  var submitBtn = document.getElementById("submitBtn");
  var doneDate = document.getElementById("doneDate");
  var dateInput = document.getElementById("date");
  var stepLabels = { 1: "ご来訪の目的", 2: "衣裳のご希望", 3: "ご連絡先" };

  /* 本日以降のみ選択可 */
  if (dateInput) {
    var today = new Date();
    var pad = function (n) { return String(n).padStart(2, "0"); };
    dateInput.min = today.getFullYear() + "-" + pad(today.getMonth() + 1) + "-" + pad(today.getDate());
  }

  var setError = function (input, errorEl, show) {
    if (errorEl) errorEl.hidden = !show;
    if (input) input.setAttribute("aria-invalid", show ? "true" : "false");
  };

  var setGroupError = function (groupName, errorEl, show) {
    if (errorEl) errorEl.hidden = !show;
    form.querySelectorAll("input[name='" + groupName + "']").forEach(function (radio) {
      radio.setAttribute("aria-invalid", show ? "true" : "false");
    });
  };

  /* 選択・入力し直したらエラーを消す */
  form.addEventListener("input", function (event) {
    var input = event.target;
    if (input.type === "radio") {
      setGroupError(input.name, document.getElementById(input.name + "-err"), false);
      return;
    }
    var errorEl = document.getElementById(input.id + "-err");
    if (errorEl && !errorEl.hidden) setError(input, errorEl, false);
  });

  var validators = {
    1: function () {
      var failures = [];
      var purposeChecked = form.querySelector("input[name='purpose']:checked");
      setGroupError("purpose", document.getElementById("purpose-err"), !purposeChecked);
      if (!purposeChecked) failures.push(form.querySelector("input[name='purpose']"));

      var dateOk = dateInput.value !== "" && dateInput.validity.valid;
      setError(dateInput, document.getElementById("date-err"), !dateOk);
      if (!dateOk) failures.push(dateInput);
      return failures;
    },
    2: function () {
      var failures = [];
      var categoryChecked = form.querySelector("input[name='category']:checked");
      setGroupError("category", document.getElementById("category-err"), !categoryChecked);
      if (!categoryChecked) failures.push(form.querySelector("input[name='category']"));
      return failures;
    },
    3: function () {
      var failures = [];
      var name = document.getElementById("name");
      var email = document.getElementById("email");
      var tel = document.getElementById("tel");

      var nameOk = name.value.trim() !== "";
      setError(name, document.getElementById("name-err"), !nameOk);
      if (!nameOk) failures.push(name);

      var emailOk = email.value.trim() !== "" && email.validity.valid;
      setError(email, document.getElementById("email-err"), !emailOk);
      if (!emailOk) failures.push(email);

      var telOk = tel.value.replace(/\D/g, "").length >= MIN_TEL_DIGITS;
      setError(tel, document.getElementById("tel-err"), !telOk);
      if (!telOk) failures.push(tel);
      return failures;
    }
  };

  var showStep = function (key, moveFocus) {
    steps.forEach(function (step) {
      var isTarget = step.dataset.step === String(key);
      step.hidden = !isTarget;
      step.classList.toggle("is-entering", isTarget && !reducedMotion.matches);
    });

    var numeric = Number(key);
    dots.forEach(function (dot) {
      var dotNo = Number(dot.dataset.dot);
      if (key === "done") {
        dot.removeAttribute("aria-current");
        dot.classList.add("is-done");
        return;
      }
      if (dotNo === numeric) {
        dot.setAttribute("aria-current", "step");
      } else {
        dot.removeAttribute("aria-current");
      }
      dot.classList.toggle("is-done", dotNo < numeric);
    });

    if (key === "done") {
      if (stepNow) stepNow.textContent = "3";
      if (statusEl) statusEl.textContent = "送信が完了しました。ご予約を承りました。";
    } else {
      if (stepNow) stepNow.textContent = String(numeric);
      if (statusEl) statusEl.textContent = "ステップ" + numeric + "/3:" + stepLabels[numeric];
    }

    if (moveFocus) {
      var activeStep = form.querySelector(".step:not([hidden])");
      var heading = activeStep && activeStep.querySelector(".wizard-q");
      if (heading) heading.focus();
    }
  };

  var currentStep = function () {
    var active = form.querySelector(".step:not([hidden])");
    return active ? active.dataset.step : "1";
  };

  var focusFirstFailure = function (failures) {
    if (failures.length > 0 && failures[0]) failures[0].focus();
  };

  form.addEventListener("click", function (event) {
    var next = event.target.closest("[data-next]");
    var prev = event.target.closest("[data-prev]");
    var restart = event.target.closest("[data-restart]");

    if (next) {
      var step = Number(currentStep());
      var failures = validators[step]();
      if (failures.length > 0) {
        focusFirstFailure(failures);
        return;
      }
      showStep(step + 1, true);
    } else if (prev) {
      showStep(Number(currentStep()) - 1, true);
    } else if (restart) {
      form.reset();
      form.querySelectorAll("[aria-invalid]").forEach(function (input) {
        input.setAttribute("aria-invalid", "false");
      });
      form.querySelectorAll(".field-error").forEach(function (errorEl) { errorEl.hidden = true; });
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "この内容で予約する";
      }
      showStep(1, true);
    }
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var failures = validators[3]();
    if (failures.length > 0) {
      focusFirstFailure(failures);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "送信しています…";
    form.setAttribute("aria-busy", "true");
    if (statusEl) statusEl.textContent = "送信しています…";

    window.setTimeout(function () {
      form.removeAttribute("aria-busy");
      if (doneDate) {
        doneDate.textContent = dateInput.value
          ? new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" }).format(new Date(dateInput.value + "T00:00:00"))
          : "未定";
      }
      showStep("done", true);
    }, SUBMIT_DELAY_MS);
  });
})();

/* ---------- 画像ライトボックス(共通 assets/lightbox.js) ---------- */
(function () {
  "use strict";
  if (!window.AYLightbox) return;
  window.AYLightbox.attach(".rail-track", ".work", {
    frame: ".work-media",
    title: ".work-name",
    sub: [".work-code", ".work-price"],
  });
})();
(function () {
  "use strict";
  if (!window.AYLightbox) return;
  window.AYLightbox.attach(".journey-grid", ".journey-item", {
    frame: ".journey-media",
    title: ".journey-city",
    sub: [".journey-tags", ".journey-plan"],
  });
})();
