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
          justify-content: flex-end;
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

        .theme-toggle {
          background: rgba(148, 163, 184, 0.2);
          color: var(--text-primary, #0f172a);
          border: 1px solid rgba(148, 163, 184, 0.35);
          padding: 8px 14px;
          font-size: 0.9rem;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.15);
        }

        .theme-toggle:hover:not(:disabled) {
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
          <button class="theme-toggle" type="button" aria-pressed="false">다크 모드</button>
        </div>
        <section class="card">
          <div class="header">
            <span class="badge">K-Lotto 6/45</span>
            <h1>로또 번호 생성기</h1>
            <p class="subtitle">생성 버튼을 누르면 1부터 45까지 중 6개의 번호를 뽑아드립니다. 기록은 자동으로 저장됩니다.</p>
          </div>
          <div class="numbers" aria-live="polite"></div>
          <div class="actions">
            <button class="primary" type="button">번호 생성</button>
            <button class="ghost" type="button" data-action="batch">자동 5회</button>
            <button class="ghost" type="button" data-action="copy">번호 복사</button>
          </div>
          <div class="meta">
            <span>생성 횟수: <strong class="draw-count">0</strong></span>
            <span>마지막 생성: <strong class="last-generated">-</strong></span>
          </div>
          <div class="history">
            <h2>최근 기록</h2>
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
    this.drawCountEl = this.shadowRoot.querySelector(".draw-count");
    this.lastGeneratedEl = this.shadowRoot.querySelector(".last-generated");
    this.historyList = this.shadowRoot.querySelector(".history-list");

    this.renderBalls();
    this.generateButton.addEventListener("click", () => this.generateOnce());
    this.batchButton.addEventListener("click", () => this.generateBatch(5));
    this.copyButton.addEventListener("click", () => this.copyNumbers());
    this.themeToggle.addEventListener("click", () => this.toggleTheme());

    this.syncTheme();

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
      const time = this.lastGenerated.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      this.lastGeneratedEl.textContent = time;
    }
  }

  pushHistory(numbers) {
    const time = new Date().toLocaleTimeString("ko-KR", {
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
      li.innerHTML = `
        <span>#${this.history.length - index} ${numbersText}</span>
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
      this.copyButton.textContent = "복사 완료!";
    } catch (error) {
      this.copyButton.textContent = "복사 실패";
    }
    setTimeout(() => {
      this.copyButton.textContent = "번호 복사";
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
    this.themeToggle.textContent = isDark ? "라이트 모드" : "다크 모드";
    this.themeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
  }
}

customElements.define("lottery-generator", LotteryGenerator);
