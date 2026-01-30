class LotteryGenerator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.drawCount = 0;
    this.history = [];
    this.maxHistory = 8;
    this.lastGenerated = null;
    this.isBatchRunning = false;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: "Space Grotesk", "Helvetica Neue", Arial, sans-serif;
          color: var(--text-primary, #0f172a);
        }

        .shell {
          display: grid;
          gap: 14px;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .card {
          background: var(--card-bg, rgba(255, 255, 255, 0.92));
          border: 1px solid var(--card-border, rgba(148, 163, 184, 0.4));
          border-radius: 28px;
          padding: clamp(24px, 4vw, 40px);
          box-shadow: var(--shadow-strong, 0 30px 60px rgba(15, 23, 42, 0.25));
          display: grid;
          gap: 28px;
          backdrop-filter: blur(18px);
        }

        .header {
          display: grid;
          gap: 10px;
        }

        .badge {
          align-self: start;
          background: var(--text-primary, #0f172a);
          color: var(--card-bg, #f8fafc);
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.8rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        h1 {
          font-family: "Fraunces", "Times New Roman", serif;
          font-size: clamp(2rem, 2.8vw, 3rem);
          margin: 0;
        }

        .subtitle {
          margin: 0;
          color: var(--text-secondary, #475569);
          max-width: 560px;
          line-height: 1.5;
        }

        .numbers {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
          gap: 14px;
          padding: 18px;
          border-radius: 18px;
          background: rgba(248, 250, 252, 0.85);
          border: 1px dashed rgba(148, 163, 184, 0.5);
        }

        .ball {
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-weight: 600;
          font-size: 1.3rem;
          color: #0f172a;
          position: relative;
          overflow: hidden;
          border: 2px solid rgba(15, 23, 42, 0.1);
          box-shadow: inset 0 6px 12px rgba(255, 255, 255, 0.8),
            0 10px 20px rgba(15, 23, 42, 0.15);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .ball.rolling {
          animation: roll 0.6s ease;
        }

        .ball.range-1 { background: linear-gradient(140deg, #fde68a, #f59e0b); }
        .ball.range-2 { background: linear-gradient(140deg, #93c5fd, #2563eb); color: #f8fafc; }
        .ball.range-3 { background: linear-gradient(140deg, #fca5a5, #ef4444); color: #f8fafc; }
        .ball.range-4 { background: linear-gradient(140deg, #cbd5f5, #64748b); color: #f8fafc; }
        .ball.range-5 { background: linear-gradient(140deg, #86efac, #16a34a); color: #f8fafc; }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        button {
          border: none;
          border-radius: 999px;
          padding: 12px 20px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        .theme-toggle,
        .lang-toggle {
          background: rgba(148, 163, 184, 0.2);
          color: var(--text-primary, #0f172a);
          border: 1px solid rgba(148, 163, 184, 0.35);
          padding: 8px 14px;
          font-size: 0.9rem;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.15);
        }

        .theme-toggle:hover:not(:disabled),
        .lang-toggle:hover:not(:disabled) {
          transform: translateY(-1px);
          background: rgba(148, 163, 184, 0.35);
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .primary {
          background: var(--text-primary, #0f172a);
          color: var(--card-bg, #f8fafc);
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.25);
        }

        .primary:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .ghost {
          background: rgba(148, 163, 184, 0.2);
          color: var(--text-primary, #0f172a);
        }

        .ghost:hover:not(:disabled) {
          background: rgba(148, 163, 184, 0.35);
          transform: translateY(-1px);
        }

        .meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          color: var(--text-secondary, #475569);
          font-size: 0.95rem;
        }

        .history {
          display: grid;
          gap: 12px;
        }

        .history h2 {
          margin: 0;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-secondary, #64748b);
        }

        .history-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 10px;
        }

        .history-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(241, 245, 249, 0.6);
        }

        .history-item span {
          font-size: 0.95rem;
          color: var(--text-primary, #0f172a);
        }

        .history-time {
          font-size: 0.85rem;
          color: var(--text-secondary, #64748b);
        }

        @keyframes roll {
          0% { transform: scale(0.9) rotate(-6deg); }
          50% { transform: scale(1.06) rotate(4deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        @media (max-width: 640px) {
          .actions {
            flex-direction: column;
          }
          button {
            width: 100%;
            justify-content: center;
          }
          .history-item {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      </style>
      <div class="shell">
        <div class="topbar">
          <button class="theme-toggle" type="button" aria-pressed="false">Dark mode</button>
          <button class="lang-toggle" type="button">한국어</button>
        </div>
        <section class="card">
          <div class="header">
            <span class="badge">K-Lotto 6/45</span>
            <h1 class="title">Lotto Number Generator</h1>
            <p class="subtitle">Generate six numbers between 1 and 45. Your recent draws are saved automatically.</p>
          </div>
          <div class="numbers" aria-live="polite"></div>
          <div class="actions">
            <button class="primary" type="button" data-label="generate">Generate numbers</button>
            <button class="ghost" type="button" data-action="batch" data-label="batch">Auto x5</button>
            <button class="ghost" type="button" data-action="copy" data-label="copy">Copy numbers</button>
          </div>
          <div class="meta">
            <span><span class="draw-label">Draw count</span>: <strong class="draw-count">0</strong></span>
            <span><span class="last-label">Last draw</span>: <strong class="last-generated">-</strong></span>
          </div>
          <div class="history">
            <h2 class="history-title">Recent history</h2>
            <ol class="history-list"></ol>
          </div>
        </section>
      </div>
    `;

    this.numbersWrap = this.shadowRoot.querySelector(".numbers");
    this.generateButton = this.shadowRoot.querySelector(".primary");
    this.batchButton = this.shadowRoot.querySelector("[data-action='batch']");
    this.copyButton = this.shadowRoot.querySelector("[data-action='copy']");
    this.themeToggle = this.shadowRoot.querySelector(".theme-toggle");
    this.langToggle = this.shadowRoot.querySelector(".lang-toggle");
    this.titleEl = this.shadowRoot.querySelector(".title");
    this.subtitleEl = this.shadowRoot.querySelector(".subtitle");
    this.drawLabelEl = this.shadowRoot.querySelector(".draw-label");
    this.lastLabelEl = this.shadowRoot.querySelector(".last-label");
    this.historyTitleEl = this.shadowRoot.querySelector(".history-title");
    this.drawCountEl = this.shadowRoot.querySelector(".draw-count");
    this.lastGeneratedEl = this.shadowRoot.querySelector(".last-generated");
    this.historyList = this.shadowRoot.querySelector(".history-list");
    this.actionButtons = Array.from(this.shadowRoot.querySelectorAll("[data-label]"));

    this.translations = {
      en: {
        title: "Lotto Number Generator",
        subtitle: "Generate six numbers between 1 and 45. Your recent draws are saved automatically.",
        generate: "Generate numbers",
        batch: "Auto x5",
        copy: "Copy numbers",
        copySuccess: "Copied!",
        copyFail: "Copy failed",
        copyIdle: "Copy numbers",
        drawLabel: "Draw count",
        lastLabel: "Last draw",
        historyTitle: "Recent history",
        historyPrefix: "Draw",
        themeDark: "Dark mode",
        themeLight: "Light mode",
        langToggle: "한국어",
        timeLocale: "en-US",
      },
      ko: {
        title: "로또 번호 생성기",
        subtitle: "1부터 45까지 6개의 번호를 생성합니다. 최근 기록은 자동으로 저장됩니다.",
        generate: "번호 생성",
        batch: "자동 5회",
        copy: "번호 복사",
        copySuccess: "복사 완료!",
        copyFail: "복사 실패",
        copyIdle: "번호 복사",
        drawLabel: "생성 횟수",
        lastLabel: "마지막 생성",
        historyTitle: "최근 기록",
        historyPrefix: "회차",
        themeDark: "다크 모드",
        themeLight: "라이트 모드",
        langToggle: "English",
        timeLocale: "ko-KR",
      },
    };

    this.renderBalls();
    this.generateButton.addEventListener("click", () => this.generateOnce());
    this.batchButton.addEventListener("click", () => this.generateBatch(5));
    this.copyButton.addEventListener("click", () => this.copyNumbers());
    this.themeToggle.addEventListener("click", () => this.toggleTheme());
    this.langToggle.addEventListener("click", () => this.toggleLanguage());

    this.syncTheme();
    this.syncLanguage();

    this.generateOnce();
  }

  renderBalls() {
    this.numbersWrap.innerHTML = "";
    for (let i = 0; i < 6; i += 1) {
      const ball = document.createElement("div");
      ball.classList.add("ball");
      ball.textContent = "--";
      this.numbersWrap.appendChild(ball);
    }
    this.ballEls = Array.from(this.numbersWrap.querySelectorAll(".ball"));
  }

  generateNumbers(count = 6, min = 1, max = 45) {
    const numbers = new Set();
    while (numbers.size < count) {
      numbers.add(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return Array.from(numbers).sort((a, b) => a - b);
  }

  updateBalls(numbers) {
    this.ballEls.forEach((ball, index) => {
      const value = numbers[index];
      if (value == null) return;
      ball.className = "ball";
      ball.classList.add(this.getBallRange(value), "rolling");
      ball.textContent = value.toString().padStart(2, "0");
      setTimeout(() => ball.classList.remove("rolling"), 650);
    });
  }

  getBallRange(number) {
    if (number <= 10) return "range-1";
    if (number <= 20) return "range-2";
    if (number <= 30) return "range-3";
    if (number <= 40) return "range-4";
    return "range-5";
  }

  generateOnce() {
    const numbers = this.generateNumbers();
    this.lastNumbers = numbers;
    this.drawCount += 1;
    this.lastGenerated = new Date();
    this.updateBalls(numbers);
    this.updateMeta();
    this.pushHistory(numbers);
  }

  async generateBatch(times) {
    if (this.isBatchRunning) return;
    this.isBatchRunning = true;
    this.toggleActions(true);

    for (let i = 0; i < times; i += 1) {
      this.generateOnce();
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    this.toggleActions(false);
    this.isBatchRunning = false;
  }

  updateMeta() {
    this.drawCountEl.textContent = this.drawCount.toString();
    if (this.lastGenerated) {
      const time = this.lastGenerated.toLocaleTimeString(this.getLocale(), {
        hour: "2-digit",
        minute: "2-digit",
      });
      this.lastGeneratedEl.textContent = time;
    }
  }

  pushHistory(numbers) {
    const time = new Date().toLocaleTimeString(this.getLocale(), {
      hour: "2-digit",
      minute: "2-digit",
    });
    this.history.unshift({ numbers, time });
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }
    this.renderHistory();
  }

  renderHistory() {
    this.historyList.innerHTML = "";
    this.history.forEach((item, index) => {
      const li = document.createElement("li");
      li.classList.add("history-item");
      const numbersText = item.numbers.map((n) => n.toString().padStart(2, "0")).join(" · ");
      const prefix = this.t("historyPrefix");
      li.innerHTML = `
        <span>${prefix} ${this.history.length - index} ${numbersText}</span>
        <span class="history-time">${item.time}</span>
      `;
      this.historyList.appendChild(li);
    });
  }

  async copyNumbers() {
    if (!this.lastNumbers || this.lastNumbers.length === 0) return;
    const text = this.lastNumbers.map((n) => n.toString().padStart(2, "0")).join(" ");
    try {
      await navigator.clipboard.writeText(text);
      this.copyButton.textContent = this.t("copySuccess");
    } catch (error) {
      this.copyButton.textContent = this.t("copyFail");
    }
    setTimeout(() => {
      this.copyButton.textContent = this.t("copyIdle");
    }, 1200);
  }

  toggleActions(disabled) {
    this.generateButton.disabled = disabled;
    this.batchButton.disabled = disabled;
    this.copyButton.disabled = disabled;
  }

  syncTheme() {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved || (prefersDark ? "dark" : "light");
    this.applyTheme(theme);
  }

  toggleTheme() {
    const current = document.body.dataset.theme === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    this.applyTheme(next);
    localStorage.setItem("theme", next);
  }

  applyTheme(theme) {
    document.body.dataset.theme = theme;
    const isDark = theme === "dark";
    this.themeToggle.textContent = isDark ? this.t("themeLight") : this.t("themeDark");
    this.themeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
  }

  syncLanguage() {
    const saved = localStorage.getItem("lang");
    const language = saved || "en";
    this.applyLanguage(language);
  }

  toggleLanguage() {
    const next = this.language === "ko" ? "en" : "ko";
    this.applyLanguage(next);
    localStorage.setItem("lang", next);
  }

  applyLanguage(language) {
    this.language = this.translations[language] ? language : "en";
    this.titleEl.textContent = this.t("title");
    this.subtitleEl.textContent = this.t("subtitle");
    this.drawLabelEl.textContent = this.t("drawLabel");
    this.lastLabelEl.textContent = this.t("lastLabel");
    this.historyTitleEl.textContent = this.t("historyTitle");
    this.actionButtons.forEach((button) => {
      const key = button.dataset.label;
      if (key) button.textContent = this.t(key);
    });
    this.langToggle.textContent = this.t("langToggle");
    this.applyTheme(document.body.dataset.theme || "light");
    this.updateMeta();
    this.renderHistory();
  }

  t(key) {
    return this.translations[this.language || "en"][key] || "";
  }

  getLocale() {
    return this.t("timeLocale") || "en-US";
  }
}

customElements.define("lottery-generator", LotteryGenerator);
