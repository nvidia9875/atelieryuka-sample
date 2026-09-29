/**
 * 質問に答えて探す（sections/dress-finder.liquid）
 *
 * 衣裳の種類 → ご利用のシーン → シルエット → 色 の順に1問ずつ出し、
 * 最後に絞り込み済みのコレクション URL へのリンクを出す。
 * 件数は /collections/{handle}?view=finder（templates/collection.finder.json）から読む。
 * 0着になる選択肢は隠す。件数が読めないときは全部出したまま進める。
 */
(() => {
  const STEPS = ["category", "venue", "silhouette", "color", "result"];
  const QUESTION_COUNT = STEPS.length - 1;
  const PARAM = {
    silhouette: "filter.p.m.custom.silhouette",
    color: "filter.p.m.custom.color",
  };
  const ADVANCE_DELAY_MS = 180;

  const format = (template, values) =>
    template.replace(/%(\w+)%/g, (_, key) => (key in values ? values[key] : ""));

  function buildUrl(collectionUrl, filters, view) {
    const params = new URLSearchParams();
    if (view) params.set("view", view);
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.append(PARAM[key], value);
    }
    const query = params.toString();
    return query ? `${collectionUrl}?${query}` : collectionUrl;
  }

  const cache = new Map();
  async function fetchCounts(collectionUrl, filters) {
    const url = buildUrl(collectionUrl, filters, "finder");
    if (!cache.has(url)) {
      const request = fetch(url, { headers: { Accept: "text/html" } })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
        .then((html) => {
          const doc = new DOMParser().parseFromString(html, "text/html");
          const node = doc.querySelector("[data-finder-data]");
          if (!node) throw new Error("finder data not found");
          return JSON.parse(node.textContent);
        });
      // 失敗した結果は覚えない（次に選び直したとき再取得する）
      request.catch(() => cache.delete(url));
      cache.set(url, request);
    }
    return cache.get(url);
  }

  function init(root) {
    if (root.dataset.ready !== undefined) return;
    const strings = JSON.parse(root.querySelector("[data-finder-strings]").textContent);
    const steps = Object.fromEntries(
      STEPS.map((name) => [name, root.querySelector(`[data-finder-step="${name}"]`)])
    );
    const progress = root.querySelector("[data-finder-progress]");
    const back = root.querySelector("[data-finder-back]");
    const restart = root.querySelector("[data-finder-restart]");
    const reason = root.querySelector("[data-finder-reason]");
    const link = root.querySelector("[data-finder-link]");
    const total = root.querySelector("[data-finder-total]");
    const summary = root.querySelector("[data-finder-summary]");

    let answers = {};
    let current = "category";
    // 操作のたびに増やす番号。待っている間に別の操作があったら、古い処理の結果は捨てる
    let generation = 0;
    const isStale = (token) => token !== generation;

    const optionsOf = (step) => [...steps[step].querySelectorAll(".finder-option")];

    function show(step, { focus = true } = {}) {
      current = step;
      for (const [name, el] of Object.entries(steps)) el.hidden = name !== step;
      const index = STEPS.indexOf(step);
      progress.textContent =
        index < QUESTION_COUNT ? format(strings.step_of, { step: index + 1, total: QUESTION_COUNT }) : "";
      back.hidden = index === 0;
      restart.hidden = index === 0;
      for (const option of optionsOf(step)) {
        option.setAttribute("aria-pressed", String(answers[step]?.value === option.dataset.value));
      }
      if (focus) steps[step].querySelector(".finder-q").focus({ preventScroll: true });
      if (focus && root.getBoundingClientRect().top < 0) {
        root.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      }
    }

    function selectedFilters(upTo) {
      const filters = {};
      for (const key of ["silhouette", "color"]) {
        if (key === upTo) break;
        if (answers[key]?.value) filters[key] = answers[key].value;
      }
      return filters;
    }

    function showAllOptions(options) {
      for (const option of options) {
        option.hidden = false;
        option.querySelector("[data-finder-count]").textContent = "";
      }
    }

    /** 選択肢に件数を付け、0着のものを隠す */
    async function applyCounts(step, token) {
      const options = optionsOf(step);
      showAllOptions(options);
      options.forEach((o) => o.classList.add("is-loading"));
      try {
        const data = await fetchCounts(answers.category.value, selectedFilters(step));
        if (isStale(token)) return;
        const values = data.filters[PARAM[step]];
        // その絞り込みが Search & Discovery で有効になっていないときは、件数なしで全部出す
        if (!values) return;
        const counts = new Map(values.map((v) => [v.value, v.count]));
        for (const option of options) {
          const count = option.dataset.value === "" ? data.count : counts.get(option.dataset.value) || 0;
          option.hidden = count === 0 && option.dataset.value !== "";
          option.querySelector("[data-finder-count]").textContent = format(strings.option_count, { count });
        }
      } catch (error) {
        // 件数が読めなくても質問は続けられるので、選択肢は全部出したままにする
        console.warn("[finder] 件数を読めませんでした", error);
      } finally {
        if (!isStale(token)) options.forEach((o) => o.classList.remove("is-loading"));
      }
    }

    function markRecommended() {
      const venue = answers.venue;
      const handles = (venue?.recommend || "").split(",").filter(Boolean);
      for (const option of optionsOf("silhouette")) {
        const badge = option.querySelector("[data-finder-badge]");
        if (badge) badge.hidden = !handles.includes(option.dataset.handle);
      }
      reason.textContent = venue?.reason || "";
      reason.hidden = !venue?.reason;
    }

    async function showResult(token) {
      const filters = selectedFilters();
      link.href = buildUrl(answers.category.value, filters);
      summary.replaceChildren(
        ...["category", "venue", "silhouette", "color"].flatMap((key) => {
          const dt = document.createElement("dt");
          dt.textContent = strings.summary[key];
          const dd = document.createElement("dd");
          dd.textContent = answers[key]?.label || "";
          return [dt, dd];
        })
      );
      total.textContent = strings.loading;
      show("result");
      try {
        const data = await fetchCounts(answers.category.value, filters);
        if (isStale(token)) return;
        total.textContent = format(strings.count, { count: data.count });
      } catch (error) {
        if (isStale(token)) return;
        console.warn("[finder] 件数を読めませんでした", error);
        total.textContent = strings.error;
      }
    }

    async function choose(step, option) {
      const token = ++generation;
      answers = { ...answers, [step]: { ...option.dataset } };
      // 前の答えが変わったら、そのあとの答えは消す
      for (const later of STEPS.slice(STEPS.indexOf(step) + 1)) delete answers[later];
      optionsOf(step).forEach((o) => o.setAttribute("aria-pressed", String(o === option)));
      await new Promise((resolve) => setTimeout(resolve, ADVANCE_DELAY_MS));
      if (isStale(token)) return;

      const next = STEPS[STEPS.indexOf(step) + 1];
      if (next === "result") return showResult(token);
      if (next === "silhouette") markRecommended();
      if (next === "silhouette" || next === "color") applyCounts(next, token);
      show(next);
    }

    root.addEventListener("click", (event) => {
      const option = event.target.closest(".finder-option");
      if (!option || !root.contains(option)) return;
      const step = option.closest("[data-finder-step]").dataset.finderStep;
      choose(step, option);
    });
    back.addEventListener("click", () => {
      generation++;
      show(STEPS[Math.max(0, STEPS.indexOf(current) - 1)]);
    });
    restart.addEventListener("click", () => {
      generation++;
      answers = {};
      show("category");
    });

    root.dataset.ready = "";
    show("category", { focus: false });
  }

  document.querySelectorAll("[data-finder]").forEach(init);
})();
