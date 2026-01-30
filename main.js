class LotteryGenerator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.drawCount = 0;
    this.history = [];
    this.maxHistory = 8;
    this.lastGenerated = null;
    this.isBatchRunning = false;

    this.dinnerCount = 0;
    this.dinnerHistory = [];
    this.dinnerMaxHistory = 6;
    this.lastDinnerTime = null;
    this.currentDinnerSet = [];

    this.dinnerMenus = [
      { name: "김치찌개", desc: "얼큰한 국물로 하루 마무리.", tags: ["뜨끈함", "매콤", "집밥"] },
      { name: "된장찌개", desc: "구수한 맛이 편안한 저녁.", tags: ["담백", "국물", "집밥"] },
      { name: "제육볶음", desc: "단짠과 매콤 사이의 균형.", tags: ["매콤", "볶음", "고기"] },
      { name: "불고기", desc: "달큰한 양념으로 든든하게.", tags: ["달콤", "고기", "한식"] },
      { name: "닭갈비", desc: "철판의 열기와 매콤한 향.", tags: ["매콤", "철판", "닭고기"] },
      { name: "삼겹살", desc: "기분 전환에 좋은 선택.", tags: ["고기", "직화", "모임"] },
      { name: "비빔밥", desc: "재료를 한 그릇에 가득.", tags: ["채소", "균형", "한그릇"] },
      { name: "칼국수", desc: "부드러운 면과 따뜻한 국물.", tags: ["면", "국물", "따뜻함"] },
      { name: "쌀국수", desc: "가볍고 향긋한 국물.", tags: ["면", "가벼움", "아시아"] },
      { name: "초밥", desc: "깔끔하게 즐기는 한 끼.", tags: ["해산물", "깔끔", "가벼움"] },
      { name: "회덮밥", desc: "신선함을 한 그릇에.", tags: ["해산물", "한그릇", "상큼"] },
      { name: "오므라이스", desc: "부드러운 달걀과 케첩 향.", tags: ["양식", "한그릇", "부드러움"] },
      { name: "파스타", desc: "집에서도 만들기 쉬운 메뉴.", tags: ["양식", "면", "간단"] },
      { name: "샐러드 + 단백질", desc: "가볍게 마무리하는 저녁.", tags: ["가벼움", "건강", "간단"] },
      { name: "치킨", desc: "바삭한 한 입으로 스트레스 해소.", tags: ["배달", "바삭", "간편"] },
      { name: "피자", desc: "모두가 좋아하는 클래식.", tags: ["배달", "치즈", "공유"] },
    ];

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
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .mode-switch {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .mode-btn {
          border: 1px solid rgba(148, 163, 184, 0.4);
          background: rgba(148, 163, 184, 0.18);
          color: var(--text-primary, #0f172a);
          padding: 8px 16px;
          border-radius: 999px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.12);
        }

        .mode-btn[aria-pressed="true"] {
          background: var(--text-primary, #0f172a);
          color: var(--card-bg, #f8fafc);
          border-color: transparent;
        }

        .mode-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          background: rgba(148, 163, 184, 0.35);
        }

        .topbar-actions {
          display: flex;
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

        .card[hidden] {
          display: none;
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

        .badge--dinner {
          background: rgba(15, 23, 42, 0.85);
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

        .dinner-display {
          display: grid;
          gap: 16px;
          padding: 18px;
          border-radius: 18px;
          background: rgba(248, 250, 252, 0.75);
          border: 1px dashed rgba(148, 163, 184, 0.5);
        }

        .dinner-main {
          display: grid;
          gap: 8px;
        }

        .dinner-label {
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 0.75rem;
          color: var(--text-secondary, #64748b);
        }

        .dinner-name {
          margin: 0;
          font-size: clamp(1.5rem, 2.2vw, 2rem);
        }

        .dinner-desc {
          margin: 0;
          color: var(--text-secondary, #475569);
          line-height: 1.5;
        }

        .dinner-tags,
        .alt-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tag {
          background: rgba(148, 163, 184, 0.22);
          color: var(--text-primary, #0f172a);
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .dinner-alternatives {
          display: grid;
          gap: 10px;
        }

        .alt-title {
          margin: 0;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-secondary, #64748b);
        }

        .alt-list {
          display: grid;
          gap: 12px;
        }

        .alt-item {
          padding: 12px 14px;
          border-radius: 14px;
          background: rgba(241, 245, 249, 0.6);
          display: grid;
          gap: 6px;
        }

        .alt-item strong {
          font-size: 1rem;
        }

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

        .partner-form {
          display: grid;
          gap: 12px;
          padding: 18px;
          border-radius: 18px;
          background: rgba(248, 250, 252, 0.7);
          border: 1px solid rgba(148, 163, 184, 0.4);
        }

        .partner-title {
          margin: 0;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-secondary, #64748b);
        }

        .partner-subtitle {
          margin: 0;
          color: var(--text-secondary, #475569);
          line-height: 1.5;
          font-size: 0.95rem;
        }

        .partner-form-body {
          display: grid;
          gap: 12px;
        }

        .field {
          display: grid;
          gap: 6px;
        }

        .field-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
        }

        .field input,
        .field textarea {
          width: 100%;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.5);
          padding: 10px 12px;
          font-size: 0.95rem;
          font-family: inherit;
          background: rgba(248, 250, 252, 0.9);
          color: var(--text-primary, #0f172a);
        }

        .field textarea {
          min-height: 110px;
          resize: vertical;
        }

        .partner-note {
          margin: 0;
          font-size: 0.85rem;
          color: var(--text-secondary, #64748b);
        }

        @keyframes roll {
          0% { transform: scale(0.9) rotate(-6deg); }
          50% { transform: scale(1.06) rotate(4deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        @media (max-width: 760px) {
          .topbar {
            justify-content: center;
          }
          .topbar-actions {
            width: 100%;
            justify-content: center;
          }
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
          <div class="mode-switch">
            <button class="mode-btn" type="button" data-view="lotto" data-label="viewLotto" aria-pressed="true">Lotto</button>
            <button class="mode-btn" type="button" data-view="dinner" data-label="viewDinner" aria-pressed="false">Dinner</button>
          </div>
          <div class="topbar-actions">
            <button class="theme-toggle" type="button" aria-pressed="false">Dark mode</button>
            <button class="lang-toggle" type="button">한국어</button>
          </div>
        </div>
        <section class="card" data-view="lotto">
          <div class="header">
            <span class="badge">K-Lotto 6/45</span>
            <h1 class="title">Lotto Number Generator</h1>
            <p class="subtitle">Generate six numbers between 1 and 45. Your recent draws are saved automatically.</p>
          </div>
          <div class="numbers" aria-live="polite"></div>
          <div class="actions">
            <button class="primary" type="button" data-label="generate">Generate numbers</button>
            <button class="ghost" type="button" data-action="batch" data-label="batch">Auto x5</button>
            <button class="ghost copy-lotto" type="button" data-action="copy" data-label="copyIdle">Copy numbers</button>
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
        <section class="card" data-view="dinner" hidden>
          <div class="header">
            <span class="badge badge--dinner">Dinner Compass</span>
            <h1 class="dinner-title">Dinner Menu Recommender</h1>
            <p class="dinner-subtitle">Pick a comforting, quick, or celebratory dinner in one tap.</p>
          </div>
          <div class="dinner-display" aria-live="polite">
            <div class="dinner-main">
              <span class="dinner-label">Today\'s pick</span>
              <h3 class="dinner-name">-</h3>
              <div class="dinner-tags"></div>
              <p class="dinner-desc"></p>
            </div>
            <div class="dinner-alternatives" hidden>
              <p class="alt-title">Other options</p>
              <div class="alt-list"></div>
            </div>
          </div>
          <div class="actions">
            <button class="primary dinner-primary" type="button" data-action="dinner" data-label="dinnerRecommend">Get recommendation</button>
            <button class="ghost" type="button" data-action="dinner-3" data-label="dinnerBatch">3 options</button>
            <button class="ghost copy-dinner" type="button" data-action="copy-dinner" data-label="dinnerCopy">Copy menu</button>
          </div>
          <div class="meta">
            <span><span class="dinner-count-label">Recommendations</span>: <strong class="dinner-count">0</strong></span>
            <span><span class="dinner-last-label">Last pick</span>: <strong class="dinner-last">-</strong></span>
          </div>
          <div class="history">
            <h2 class="dinner-history-title">Recent picks</h2>
            <ol class="dinner-history-list history-list"></ol>
          </div>
          <div class="partner-form">
            <h2 class="partner-title">Partnership inquiry</h2>
            <p class="partner-subtitle">Leave a short note and we will get back to you.</p>
            <form class="partner-form-body" action="https://formspree.io/f/mzdgkkov" method="POST">
              <label class="field">
                <span class="field-label partner-name-label">Name</span>
                <input class="partner-name-input" type="text" name="name" required placeholder="Your name" />
              </label>
              <label class="field">
                <span class="field-label partner-email-label">Email</span>
                <input class="partner-email-input" type="email" name="email" required placeholder="you@example.com" />
              </label>
              <label class="field">
                <span class="field-label partner-message-label">Message</span>
                <textarea class="partner-message-input" name="message" required placeholder="Tell us about the partnership."></textarea>
              </label>
              <button class="primary" type="submit" data-label="partnerSubmit">Send inquiry</button>
              <p class="partner-note">Powered by Formspree.</p>
            </form>
          </div>
        </section>
      </div>
    `;

    this.numbersWrap = this.shadowRoot.querySelector(".numbers");
    this.generateButton = this.shadowRoot.querySelector(".primary");
    this.batchButton = this.shadowRoot.querySelector("[data-action='batch']");
    this.copyButton = this.shadowRoot.querySelector(".copy-lotto");
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

    this.viewButtons = Array.from(this.shadowRoot.querySelectorAll(".mode-btn"));
    this.cards = Array.from(this.shadowRoot.querySelectorAll("section.card"));

    this.dinnerTitleEl = this.shadowRoot.querySelector(".dinner-title");
    this.dinnerSubtitleEl = this.shadowRoot.querySelector(".dinner-subtitle");
    this.dinnerLabelEl = this.shadowRoot.querySelector(".dinner-label");
    this.dinnerNameEl = this.shadowRoot.querySelector(".dinner-name");
    this.dinnerTagsEl = this.shadowRoot.querySelector(".dinner-tags");
    this.dinnerDescEl = this.shadowRoot.querySelector(".dinner-desc");
    this.dinnerAltWrap = this.shadowRoot.querySelector(".dinner-alternatives");
    this.dinnerAltTitleEl = this.shadowRoot.querySelector(".alt-title");
    this.dinnerAltList = this.shadowRoot.querySelector(".alt-list");
    this.dinnerButton = this.shadowRoot.querySelector("[data-action='dinner']");
    this.dinnerBatchButton = this.shadowRoot.querySelector("[data-action='dinner-3']");
    this.copyDinnerButton = this.shadowRoot.querySelector(".copy-dinner");
    this.dinnerCountEl = this.shadowRoot.querySelector(".dinner-count");
    this.dinnerLastEl = this.shadowRoot.querySelector(".dinner-last");
    this.dinnerCountLabelEl = this.shadowRoot.querySelector(".dinner-count-label");
    this.dinnerLastLabelEl = this.shadowRoot.querySelector(".dinner-last-label");
    this.dinnerHistoryTitleEl = this.shadowRoot.querySelector(".dinner-history-title");
    this.dinnerHistoryList = this.shadowRoot.querySelector(".dinner-history-list");
    this.partnerTitleEl = this.shadowRoot.querySelector(".partner-title");
    this.partnerSubtitleEl = this.shadowRoot.querySelector(".partner-subtitle");
    this.partnerNameLabelEl = this.shadowRoot.querySelector(".partner-name-label");
    this.partnerEmailLabelEl = this.shadowRoot.querySelector(".partner-email-label");
    this.partnerMessageLabelEl = this.shadowRoot.querySelector(".partner-message-label");
    this.partnerNameInput = this.shadowRoot.querySelector(".partner-name-input");
    this.partnerEmailInput = this.shadowRoot.querySelector(".partner-email-input");
    this.partnerMessageInput = this.shadowRoot.querySelector(".partner-message-input");

    this.actionButtons = Array.from(this.shadowRoot.querySelectorAll("[data-label]"));

    this.translations = {
      en: {
        viewLotto: "Lotto",
        viewDinner: "Dinner",
        title: "Lotto Number Generator",
        subtitle: "Generate six numbers between 1 and 45. Your recent draws are saved automatically.",
        generate: "Generate numbers",
        batch: "Auto x5",
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
        dinnerTitle: "Dinner Menu Recommender",
        dinnerSubtitle: "Pick a comforting, quick, or celebratory dinner in one tap.",
        dinnerLabel: "Today\'s pick",
        dinnerAltTitle: "Other options",
        dinnerRecommend: "Get recommendation",
        dinnerBatch: "3 options",
        dinnerCopy: "Copy menu",
        dinnerCopyIdle: "Copy menu",
        dinnerCopySuccess: "Copied!",
        dinnerCopyFail: "Copy failed",
        dinnerCountLabel: "Recommendations",
        dinnerLastLabel: "Last pick",
        dinnerHistoryTitle: "Recent picks",
        dinnerHistoryPrefix: "Pick",
        partnerTitle: "Partnership inquiry",
        partnerSubtitle: "Leave a short note and we will get back to you.",
        partnerNameLabel: "Name",
        partnerNamePlaceholder: "Your name",
        partnerEmailLabel: "Email",
        partnerEmailPlaceholder: "you@example.com",
        partnerMessageLabel: "Message",
        partnerMessagePlaceholder: "Tell us about the partnership.",
        partnerSubmit: "Send inquiry",
        timeLocale: "en-US",
      },
      ko: {
        viewLotto: "로또",
        viewDinner: "저녁추천",
        title: "로또 번호 생성기",
        subtitle: "1부터 45까지 6개의 번호를 생성합니다. 최근 기록은 자동으로 저장됩니다.",
        generate: "번호 생성",
        batch: "자동 5회",
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
        dinnerTitle: "저녁 메뉴 추천",
        dinnerSubtitle: "든든한 메뉴부터 가벼운 메뉴까지 한 번에 추천합니다.",
        dinnerLabel: "오늘의 추천",
        dinnerAltTitle: "다른 후보",
        dinnerRecommend: "추천 받기",
        dinnerBatch: "3가지 후보",
        dinnerCopy: "메뉴 복사",
        dinnerCopyIdle: "메뉴 복사",
        dinnerCopySuccess: "복사 완료!",
        dinnerCopyFail: "복사 실패",
        dinnerCountLabel: "추천 횟수",
        dinnerLastLabel: "마지막 추천",
        dinnerHistoryTitle: "최근 추천",
        dinnerHistoryPrefix: "추천",
        partnerTitle: "제휴 문의",
        partnerSubtitle: "간단히 남겨주시면 빠르게 연락드릴게요.",
        partnerNameLabel: "이름",
        partnerNamePlaceholder: "성함을 입력해주세요",
        partnerEmailLabel: "이메일",
        partnerEmailPlaceholder: "you@example.com",
        partnerMessageLabel: "문의 내용",
        partnerMessagePlaceholder: "제휴 내용을 간단히 적어주세요.",
        partnerSubmit: "문의 보내기",
        timeLocale: "ko-KR",
      },
    };

    this.renderBalls();
    this.generateButton.addEventListener("click", () => this.generateOnce());
    this.batchButton.addEventListener("click", () => this.generateBatch(5));
    this.copyButton.addEventListener("click", () => this.copyNumbers());
    this.dinnerButton.addEventListener("click", () => this.recommendDinner(1));
    this.dinnerBatchButton.addEventListener("click", () => this.recommendDinner(3));
    this.copyDinnerButton.addEventListener("click", () => this.copyDinner());
    this.themeToggle.addEventListener("click", () => this.toggleTheme());
    this.langToggle.addEventListener("click", () => this.toggleLanguage());
    this.viewButtons.forEach((button) => {
      button.addEventListener("click", () => this.switchView(button.dataset.view));
    });

    this.syncTheme();
    this.syncLanguage();

    this.generateOnce();
    this.recommendDinner(1);
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

  getDinnerPicks(count) {
    const pool = [...this.dinnerMenus];
    const picks = [];
    while (picks.length < count && pool.length) {
      const index = Math.floor(Math.random() * pool.length);
      picks.push(pool.splice(index, 1)[0]);
    }
    return picks;
  }

  recommendDinner(count = 1) {
    const picks = this.getDinnerPicks(count);
    if (!picks.length) return;
    this.currentDinnerSet = picks;
    this.dinnerCount += 1;
    this.lastDinnerTime = new Date();
    this.updateDinnerDisplay();
    this.pushDinnerHistory(picks[0]);
  }

  updateDinnerDisplay() {
    const [main, ...others] = this.currentDinnerSet;
    if (!main) return;
    this.dinnerNameEl.textContent = main.name;
    this.dinnerDescEl.textContent = main.desc || "";
    this.dinnerTagsEl.innerHTML = "";
    main.tags.forEach((tag) => {
      const span = document.createElement("span");
      span.classList.add("tag");
      span.textContent = tag;
      this.dinnerTagsEl.appendChild(span);
    });

    if (others.length > 0) {
      this.dinnerAltWrap.hidden = false;
      this.dinnerAltList.innerHTML = "";
      others.forEach((item) => {
        const div = document.createElement("div");
        div.classList.add("alt-item");
        const tagsHtml = item.tags
          .map((tag) => `<span class="tag">${tag}</span>`)
          .join("");
        div.innerHTML = `
          <strong>${item.name}</strong>
          <div class="alt-tags">${tagsHtml}</div>
        `;
        this.dinnerAltList.appendChild(div);
      });
    } else {
      this.dinnerAltWrap.hidden = true;
      this.dinnerAltList.innerHTML = "";
    }

    this.dinnerCountEl.textContent = this.dinnerCount.toString();
    if (this.lastDinnerTime) {
      const time = this.lastDinnerTime.toLocaleTimeString(this.getLocale(), {
        hour: "2-digit",
        minute: "2-digit",
      });
      this.dinnerLastEl.textContent = time;
    }
  }

  pushDinnerHistory(item) {
    const time = new Date().toLocaleTimeString(this.getLocale(), {
      hour: "2-digit",
      minute: "2-digit",
    });
    this.dinnerHistory.unshift({ name: item.name, time });
    if (this.dinnerHistory.length > this.dinnerMaxHistory) {
      this.dinnerHistory.pop();
    }
    this.renderDinnerHistory();
  }

  renderDinnerHistory() {
    this.dinnerHistoryList.innerHTML = "";
    this.dinnerHistory.forEach((item, index) => {
      const li = document.createElement("li");
      li.classList.add("history-item");
      const prefix = this.t("dinnerHistoryPrefix");
      li.innerHTML = `
        <span>${prefix} ${this.dinnerHistory.length - index} · ${item.name}</span>
        <span class="history-time">${item.time}</span>
      `;
      this.dinnerHistoryList.appendChild(li);
    });
  }

  async copyDinner() {
    if (!this.currentDinnerSet || this.currentDinnerSet.length === 0) return;
    const text = this.currentDinnerSet.map((item) => item.name).join(" / ");
    try {
      await navigator.clipboard.writeText(text);
      this.copyDinnerButton.textContent = this.t("dinnerCopySuccess");
    } catch (error) {
      this.copyDinnerButton.textContent = this.t("dinnerCopyFail");
    }
    setTimeout(() => {
      this.copyDinnerButton.textContent = this.t("dinnerCopyIdle");
    }, 1200);
  }

  switchView(view) {
    this.currentView = view === "dinner" ? "dinner" : "lotto";
    this.cards.forEach((card) => {
      card.hidden = card.dataset.view !== this.currentView;
    });
    this.viewButtons.forEach((button) => {
      const pressed = button.dataset.view === this.currentView;
      button.setAttribute("aria-pressed", pressed ? "true" : "false");
    });
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
    this.dinnerTitleEl.textContent = this.t("dinnerTitle");
    this.dinnerSubtitleEl.textContent = this.t("dinnerSubtitle");
    this.dinnerLabelEl.textContent = this.t("dinnerLabel");
    this.dinnerAltTitleEl.textContent = this.t("dinnerAltTitle");
    this.dinnerCountLabelEl.textContent = this.t("dinnerCountLabel");
    this.dinnerLastLabelEl.textContent = this.t("dinnerLastLabel");
    this.dinnerHistoryTitleEl.textContent = this.t("dinnerHistoryTitle");
    this.partnerTitleEl.textContent = this.t("partnerTitle");
    this.partnerSubtitleEl.textContent = this.t("partnerSubtitle");
    this.partnerNameLabelEl.textContent = this.t("partnerNameLabel");
    this.partnerEmailLabelEl.textContent = this.t("partnerEmailLabel");
    this.partnerMessageLabelEl.textContent = this.t("partnerMessageLabel");
    this.partnerNameInput.placeholder = this.t("partnerNamePlaceholder");
    this.partnerEmailInput.placeholder = this.t("partnerEmailPlaceholder");
    this.partnerMessageInput.placeholder = this.t("partnerMessagePlaceholder");
    this.actionButtons.forEach((button) => {
      const key = button.dataset.label;
      if (key) button.textContent = this.t(key);
    });
    this.langToggle.textContent = this.t("langToggle");
    this.applyTheme(document.body.dataset.theme || "light");
    this.updateMeta();
    this.renderHistory();
    this.updateDinnerDisplay();
    this.renderDinnerHistory();
  }

  t(key) {
    return this.translations[this.language || "en"][key] || "";
  }

  getLocale() {
    return this.t("timeLocale") || "en-US";
  }
}

customElements.define("lottery-generator", LotteryGenerator);
