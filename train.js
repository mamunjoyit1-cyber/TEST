// ==UserScript==
// @name         Bangladesh Railway Search & Seat Helper
// @namespace    http://tampermonkey.net/
// @version      6.4.0
// @description  Bangladesh Railway train search, coach and seat selection helper
// @match        https://eticket.railway.gov.bd/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // =========================================================
  // CONFIG
  // =========================================================

  const CLASSES = [
    'AC_B',
    'AC_S',
    'SNIGDHA',
    'F_BERTH',
    'F_SEAT',
    'F_CHAIR',
    'S_CHAIR',
    'SHOVAN',
    'SHULOV',
    'AC_CHAIR'
  ];

  const COACHES = [
    'ANY',
    'KA',
    'KHA',
    'GA',
    'GHA',
    'CHA',
    'CHHA',
    'JA',
    'JHA',
    'TA',
    'THA',
    'DA',
    'DHA',
    'NA',
    'PA',
    'MA',
    'UMA'
  ];

  const DEFAULTS = {
    from: 'Dhaka',
    to: 'Chattogram',
    date: '23-Sep-2026',
    className: 'SNIGDHA',

    train: 'MAHANAGAR PROVATI',
    trainNumber: '704',

    coach: 'ANY',

    passengerCount: 1,

    // ANY
    // 25
    // 1-60
    // 1,5,25
    // 1-10,25,40-45
    seatNumbers: 'ANY',

    // ANY / WINDOW / NORMAL
    seatType: 'ANY'
  };

  const SETTINGS_KEY =
    'BR_BOT_SETTINGS_640';

  const PENDING_KEY =
    'BR_BOT_PENDING_640';

  // =========================================================
  // STATE
  // =========================================================

  let calendarMonth = null;

  let targetTrain = {
    name: '',
    number: ''
  };

  let resultsObserver = null;

  let resultRetryTimer = null;

  let seatObserver = null;

  let seatRetryTimer = null;

  let botRunning = false;

  let searchRunning = false;

  let searchRunId = 0;

  let seatPageRunning = false;

  // =========================================================
  // HELPERS
  // =========================================================

  const sleep = ms =>
    new Promise(resolve =>
      setTimeout(resolve, ms)
    );

  function log(...args) {
    console.log('[BR BOT]', ...args);
  }

  function isVisible(el) {

    if (!el) {
      return false;
    }

    const style =
      window.getComputedStyle(el);

    const rect =
      el.getBoundingClientRect();

    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  function escapeHtml(str) {

    return String(str || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function normalizeText(text) {

    return String(text || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isBotElement(el) {

    return !!(
      el &&
      el.closest &&
      el.closest('#br-bot-panel')
    );
  }

  function currentRunIsValid(runId) {

    return (
      botRunning &&
      searchRunning &&
      runId === searchRunId
    );
  }

  // =========================================================
  // STATUS
  // =========================================================

  function status(message) {

    const el =
      document.getElementById(
        'br-status'
      );

    if (el) {
      el.textContent = message;
    }

    log(message);
  }

  function setBotState(text) {

    const el =
      document.getElementById(
        'br-bot-state'
      );

    if (el) {
      el.textContent = text;
    }
  }

  // =========================================================
  // SETTINGS
  // =========================================================

  function getSettings() {

    const get = id => {

      const el =
        document.getElementById(id);

      return el
        ? el.value
        : '';
    };

    return {
      from: get('br-from'),
      to: get('br-to'),
      date: get('br-date'),
      className: get('br-class'),
      train: get('br-train-name'),
      trainNumber: get('br-train-number'),
      coach: get('br-coach'),
      passengerCount:
        Number(
          get('br-passenger-count')
        ) || 1,
      seatNumbers:
        get('br-seat-numbers'),
      seatType:
        get('br-seat-type')
    };
  }

  function saveSettings() {

    try {

      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(
          getSettings()
        )
      );

    } catch (e) {

      log(
        'Could not save settings',
        e
      );
    }
  }

  function loadSettings() {

    try {

      const raw =
        localStorage.getItem(
          SETTINGS_KEY
        );

      if (!raw) {
        return;
      }

      const saved =
        JSON.parse(raw);

      const set = (
        id,
        value
      ) => {

        const el =
          document.getElementById(id);

        if (
          el &&
          value !== undefined &&
          value !== null
        ) {
          el.value = value;
        }
      };

      set(
        'br-from',
        saved.from ||
        DEFAULTS.from
      );

      set(
        'br-to',
        saved.to ||
        DEFAULTS.to
      );

      set(
        'br-date',
        saved.date ||
        DEFAULTS.date
      );

      set(
        'br-class',
        saved.className ||
        DEFAULTS.className
      );

      set(
        'br-train-name',
        saved.train ||
        DEFAULTS.train
      );

      set(
        'br-train-number',
        saved.trainNumber ||
        DEFAULTS.trainNumber
      );

      set(
        'br-coach',
        saved.coach ||
        DEFAULTS.coach
      );

      set(
        'br-passenger-count',
        saved.passengerCount ||
        DEFAULTS.passengerCount
      );

      set(
        'br-seat-numbers',
        saved.seatNumbers ||
        DEFAULTS.seatNumbers
      );

      set(
        'br-seat-type',
        saved.seatType ||
        DEFAULTS.seatType
      );

    } catch (e) {

      log(
        'Could not load settings',
        e
      );
    }
  }

  // =========================================================
  // TARGET TRAIN
  // =========================================================

  function getTargetTrain() {

    const nameInput =
      document.getElementById(
        'br-train-name'
      );

    const numberInput =
      document.getElementById(
        'br-train-number'
      );

    return {
      name: normalizeText(
        nameInput
          ? nameInput.value
          : ''
      ),
      number: normalizeText(
        numberInput
          ? numberInput.value
          : ''
      )
    };
  }

  function updateTargetTrain() {

    targetTrain =
      getTargetTrain();

    log(
      'Target train:',
      targetTrain
    );
  }

  // =========================================================
  // STOP
  // =========================================================

  function clearBotTimers() {

    if (resultRetryTimer) {

      clearTimeout(
        resultRetryTimer
      );

      resultRetryTimer = null;
    }

    if (seatRetryTimer) {

      clearTimeout(
        seatRetryTimer
      );

      seatRetryTimer = null;
    }
  }

  function disconnectObserver() {

    if (resultsObserver) {

      resultsObserver.disconnect();

      resultsObserver = null;
    }

    if (seatObserver) {

      seatObserver.disconnect();

      seatObserver = null;
    }
  }

  function stopBot(
    showMessage = true
  ) {

    botRunning = false;

    searchRunning = false;

    seatPageRunning = false;

    searchRunId++;

    clearBotTimers();

    disconnectObserver();

    setBotState(
      'STOPPED'
    );

    const button =
      document.getElementById(
        'br-start-search'
      );

    if (button) {
      button.disabled = false;
    }

    if (showMessage) {

      status(
        'Bot stopped.'
      );
    }

    log(
      'BOT STOPPED'
    );
  }

  // =========================================================
  // DATE
  // =========================================================

  function parseDate(
    dateString
  ) {

    const match =
      String(dateString).match(
        /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/
      );

    if (!match) {
      return null;
    }

    const months = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11
    };

    const month =
      match[2].toLowerCase();

    if (!(month in months)) {
      return null;
    }

    return {
      day: Number(match[1]),
      month: months[month],
      year: Number(match[3])
    };
  }

  function formatDateForBot(
    date
  ) {

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr',
      'May', 'Jun', 'Jul', 'Aug',
      'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return (
      String(
        date.getDate()
      ).padStart(2, '0') +
      '-' +
      months[
        date.getMonth()
      ] +
      '-' +
      date.getFullYear()
    );
  }

  // =========================================================
  // PANEL
  // =========================================================

  function createBotPanel() {

    if (
      document.getElementById(
        'br-bot-panel'
      )
    ) {
      return;
    }

    const panel =
      document.createElement(
        'div'
      );

    panel.id =
      'br-bot-panel';

    panel.innerHTML = `

      <div id="br-bot-header">

        <div>

          <div id="br-bot-title">
            🚆 Railway Bot
          </div>

          <div id="br-bot-subtitle">
            Search + Coach + Seat
          </div>

        </div>

        <div id="br-header-right">

          <span id="br-bot-state">
            READY
          </span>

          <button
            id="br-bot-minimize"
            type="button"
          >−</button>

        </div>

      </div>

      <div id="br-bot-content">

        <label class="br-label">
          From
        </label>

        <input
          id="br-from"
          class="br-input"
          type="text"
          value="${escapeHtml(
            DEFAULTS.from
          )}"
          autocomplete="off"
        >

        <label class="br-label">
          To
        </label>

        <input
          id="br-to"
          class="br-input"
          type="text"
          value="${escapeHtml(
            DEFAULTS.to
          )}"
          autocomplete="off"
        >

        <label class="br-label">
          Date of Journey
        </label>

        <div class="br-date-wrapper">

          <input
            id="br-date"
            class="br-input"
            type="text"
            value="${escapeHtml(
              DEFAULTS.date
            )}"
            readonly
          >

          <button
            id="br-calendar-button"
            type="button"
          >📅</button>

        </div>

        <div
          id="br-date-picker"
          class="br-date-picker hidden"
        >

          <div class="br-calendar-header">

            <button
              id="br-prev-month"
              type="button"
            >‹</button>

            <div
              id="br-calendar-month"
            ></div>

            <button
              id="br-next-month"
              type="button"
            >›</button>

          </div>

          <div class="br-weekdays">

            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>

          </div>

          <div
            id="br-calendar-days"
            class="br-calendar-days"
          ></div>

        </div>

        <label class="br-label">
          Class
        </label>

        <select
          id="br-class"
          class="br-input"
        >

          ${CLASSES.map(cls => `
            <option
              value="${cls}"
              ${
                cls === DEFAULTS.className
                  ? 'selected'
                  : ''
              }
            >
              ${cls}
            </option>
          `).join('')}

        </select>

        <div class="br-target-section">

          <div class="br-target-title">
            🎯 Target Train
          </div>

          <label class="br-small-label">
            Train Name
          </label>

          <input
            id="br-train-name"
            class="br-input"
            type="text"
            value="${escapeHtml(
              DEFAULTS.train
            )}"
            autocomplete="off"
          >

          <label class="br-small-label">
            Train Number
          </label>

          <input
            id="br-train-number"
            class="br-input"
            type="text"
            value="${escapeHtml(
              DEFAULTS.trainNumber
            )}"
            autocomplete="off"
          >

          <div
            id="br-target-preview"
            class="br-target-preview"
          >
            ${escapeHtml(
              DEFAULTS.train
            )}
            (${escapeHtml(
              DEFAULTS.trainNumber
            )})
          </div>

        </div>

        <div class="br-seat-section">

          <div class="br-target-title">
            💺 Seat Preferences
          </div>

          <label class="br-small-label">
            Coach
          </label>

          <select
            id="br-coach"
            class="br-input"
          >

            ${COACHES.map(coach => `
              <option
                value="${coach}"
                ${
                  coach === DEFAULTS.coach
                    ? 'selected'
                    : ''
                }
              >
                ${coach}
              </option>
            `).join('')}

          </select>

          <label class="br-small-label">
            Passenger / Seat Count
          </label>

          <select
            id="br-passenger-count"
            class="br-input"
          >

            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>

          </select>

          <label class="br-small-label">
            Seat Number
          </label>

          <input
            id="br-seat-numbers"
            class="br-input"
            type="text"
            value="${escapeHtml(
              DEFAULTS.seatNumbers
            )}"
            placeholder="ANY / 25 / 1-20 / 1,5,25"
            autocomplete="off"
          >

          <label class="br-small-label">
            Seat Type
          </label>

          <select
            id="br-seat-type"
            class="br-input"
          >

            <option value="ANY">
              ANY
            </option>

            <option value="WINDOW">
              WINDOW
            </option>

            <option value="NORMAL">
              NORMAL
            </option>

          </select>

        </div>

        <div class="br-main-buttons">

          <button
            id="br-start-search"
            type="button"
          >
            🔎 START SEARCH
          </button>

          <button
            id="br-stop-bot"
            type="button"
          >
            ⛔ STOP BOT
          </button>

        </div>

        <div id="br-status">
          Ready
        </div>

        <div
          id="br-results"
          class="br-results"
        ></div>

      </div>
    `;

    document.body.appendChild(
      panel
    );

    addBotStyles();

    setupCalendar();

    document
      .getElementById(
        'br-start-search'
      )
      .addEventListener(
        'click',
        startSearch
      );

    document
      .getElementById(
        'br-stop-bot'
      )
      .addEventListener(
        'click',
        () => stopBot(true)
      );

    document
      .getElementById(
        'br-bot-minimize'
      )
      .addEventListener(
        'click',
        togglePanel
      );

    const trainName =
      document.getElementById(
        'br-train-name'
      );

    const trainNumber =
      document.getElementById(
        'br-train-number'
      );

    if (trainName) {

      trainName.addEventListener(
        'input',
        updateTargetPreview
      );

      trainName.addEventListener(
        'change',
        saveSettings
      );
    }

    if (trainNumber) {

      trainNumber.addEventListener(
        'input',
        updateTargetPreview
      );

      trainNumber.addEventListener(
        'change',
        saveSettings
      );
    }

    [
      'br-from',
      'br-to',
      'br-date',
      'br-class',
      'br-coach',
      'br-passenger-count',
      'br-seat-numbers',
      'br-seat-type'
    ].forEach(id => {

      const el =
        document.getElementById(id);

      if (!el) {
        return;
      }

      el.addEventListener(
        'change',
        saveSettings
      );

      el.addEventListener(
        'input',
        saveSettings
      );
    });

    loadSettings();

    updateTargetPreview();

    log(
      'Railway Bot v6.4.0 panel created'
    );
  }

  // =========================================================
  // TARGET PREVIEW
  // =========================================================

  function updateTargetPreview() {

    const preview =
      document.getElementById(
        'br-target-preview'
      );

    if (!preview) {
      return;
    }

    const train =
      getTargetTrain();

    const parts = [];

    if (train.name) {
      parts.push(train.name);
    }

    if (train.number) {
      parts.push(
        `(${train.number})`
      );
    }

    preview.textContent =
      parts.length
        ? parts.join(' ')
        : 'No target train selected';
  }

  // =========================================================
  // CSS
  // =========================================================

  function addBotStyles() {

    if (
      document.getElementById(
        'br-bot-style'
      )
    ) {
      return;
    }

    const style =
      document.createElement(
        'style'
      );

    style.id =
      'br-bot-style';

    style.textContent = `

      #br-bot-panel {

        position: fixed;

        top: 90px;
        right: 20px;

        width: 330px;

        max-height:
          calc(100vh - 110px);

        overflow-y: auto;

        z-index: 2147483647;

        background: #fff;

        border:
          1px solid #d8d8d8;

        border-radius: 14px;

        box-shadow:
          0 12px 35px rgba(0,0,0,.20);

        font-family:
          Arial,
          Helvetica,
          sans-serif;

        color: #222;
      }

      #br-bot-header {

        display: flex;

        align-items: center;

        justify-content:
          space-between;

        padding: 12px 14px;

        background: #f5f5f5;

        border-radius:
          14px 14px 0 0;

        border-bottom:
          1px solid #ddd;

        cursor: move;

        position: sticky;

        top: 0;

        z-index: 5;
      }

      #br-bot-title {

        font-size: 17px;
        font-weight: 700;
      }

      #br-bot-subtitle {

        font-size: 11px;
        color: #777;
        margin-top: 2px;
      }

      #br-header-right {

        display: flex;
        align-items: center;
        gap: 6px;
      }

      #br-bot-state {

        font-size: 9px;
        font-weight: 700;

        padding: 4px 6px;

        border-radius: 5px;

        background: #e8e8e8;
        color: #555;
      }

      #br-bot-minimize {

        width: 30px;
        height: 30px;

        border: none;
        border-radius: 7px;

        background: #ddd;

        font-size: 20px;
        cursor: pointer;
      }

      #br-bot-content {
        padding: 14px;
      }

      .br-label {

        display: block;

        margin:
          9px 0 5px;

        font-size: 12px;
        font-weight: 700;
        color: #555;
      }

      .br-input {

        box-sizing: border-box;

        width: 100%;
        height: 40px;

        padding: 0 11px;

        border:
          1px solid #cfcfcf;

        border-radius: 8px;

        background: #fff;

        font-size: 14px;

        outline: none;
      }

      .br-input:focus {

        border-color: #777;
        outline: none;
        box-shadow: none;
      }

      .br-date-wrapper {

        position: relative;
        width: 100%;
      }

      #br-date {

        padding-right: 48px;
        cursor: pointer;
      }

      #br-calendar-button {

        position: absolute;

        right: 5px;
        top: 5px;

        width: 30px;
        height: 30px;

        border: none;
        border-radius: 6px;

        background: #f0f0f0;

        cursor: pointer;

        font-size: 16px;
      }

      .br-date-picker {

        position: relative;

        width:
          calc(100% - 20px);

        margin:
          6px auto 4px;

        padding: 10px;

        background: white;

        border:
          1px solid #d4d4d4;

        border-radius: 12px;

        box-shadow:
          0 10px 30px rgba(0,0,0,.18);

        z-index: 20;
      }

      .br-date-picker.hidden {
        display: none;
      }

      .br-calendar-header {

        display: flex;
        align-items: center;
        justify-content:
          space-between;

        margin-bottom: 9px;
      }

      .br-calendar-header button {

        width: 32px;
        height: 32px;

        border: none;
        border-radius: 7px;

        background: #f1f1f1;

        font-size: 22px;
        cursor: pointer;
      }

      #br-calendar-month {

        font-size: 14px;
        font-weight: 700;
      }

      .br-weekdays,
      .br-calendar-days {

        display: grid;

        grid-template-columns:
          repeat(7, 1fr);

        gap: 3px;
      }

      .br-weekdays span {

        text-align: center;

        font-size: 10px;
        font-weight: 700;

        color: #777;

        padding: 4px 0;
      }

      .br-day {

        height: 31px;

        border: none;
        border-radius: 6px;

        background: transparent;

        cursor: pointer;

        font-size: 12px;
      }

      .br-day:hover {
        background: #e9e9e9;
      }

      .br-day.empty {
        cursor: default;
      }

      .br-day.today {
        border:
          1px solid #999;
      }

      .br-day.selected {

        background: #222;
        color: #fff;

        font-weight: 700;
      }

      .br-target-section,
      .br-seat-section {

        margin-top: 13px;

        padding: 10px;

        border:
          1px solid #ddd;

        border-radius: 10px;

        background: #fafafa;
      }

      .br-seat-section {

        background: #f8f8f8;
      }

      .br-target-title {

        font-size: 13px;
        font-weight: 700;

        margin-bottom: 8px;
      }

      .br-small-label {

        display: block;

        margin:
          7px 0 4px;

        font-size: 10px;
        font-weight: 700;

        color: #666;
      }

      .br-target-section .br-input,
      .br-seat-section .br-input {

        height: 36px;
        font-size: 12px;
      }

      .br-target-preview {

        margin-top: 8px;

        padding: 7px;

        border-radius: 6px;

        background: #eee;

        font-size: 11px;
        font-weight: 700;

        color: #333;

        text-align: center;
      }

      .br-main-buttons {

        display: flex;
        gap: 7px;

        margin-top: 16px;
      }

      #br-start-search,
      #br-stop-bot {

        flex: 1;

        min-height: 43px;

        border: none;
        border-radius: 9px;

        color: white;

        font-size: 11px;
        font-weight: 700;

        cursor: pointer;
      }

      #br-start-search {
        background: #222;
      }

      #br-stop-bot {
        background: #a00000;
      }

      #br-start-search:disabled {

        opacity: .6;
        cursor: wait;
      }

      #br-status {

        margin-top: 10px;

        padding: 8px 9px;

        min-height: 18px;

        border-radius: 7px;

        background: #f5f5f5;

        font-size: 11px;

        color: #555;

        line-height: 1.4;
      }

      .br-results {
        margin-top: 12px;
      }

      .br-target-found {

        padding: 11px;

        border:
          1px solid #ddd;

        border-radius: 10px;

        background: #fafafa;
      }

      .br-target-found-title {

        font-size: 13px;
        font-weight: 700;

        margin-bottom: 6px;
      }

      .br-target-found-time {

        font-size: 11px;
        color: #666;
      }

      .br-target-class {

        margin-top: 8px;

        font-size: 12px;
        font-weight: 700;
      }

      .br-target-price {

        margin-top: 5px;

        font-size: 12px;
      }

      .br-target-available {

        margin-top: 4px;

        font-size: 11px;

        color: #555;
      }

      .br-target-available.sold {

        color: #a00000;
        font-weight: 700;
      }

      .br-no-target {

        padding: 10px;

        border-radius: 8px;

        background: #f5f5f5;

        color: #666;

        font-size: 11px;

        text-align: center;
      }

      #br-bot-panel.minimized {

        width: 190px;

        max-height: none;

        overflow: hidden;
      }

      #br-bot-panel.minimized
      #br-bot-content {

        display: none;
      }

      @media (max-width: 700px) {

        #br-bot-panel {

          top: 70px;
          right: 8px;
          width: 300px;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }

  // =========================================================
  // MINIMIZE
  // =========================================================

  function togglePanel() {

    const panel =
      document.getElementById(
        'br-bot-panel'
      );

    const button =
      document.getElementById(
        'br-bot-minimize'
      );

    if (!panel) {
      return;
    }

    panel.classList.toggle(
      'minimized'
    );

    button.textContent =
      panel.classList.contains(
        'minimized'
      )
        ? '+'
        : '−';
  }

  // =========================================================
  // CALENDAR
  // =========================================================

  function setupCalendar() {

    const dateInput =
      document.getElementById(
        'br-date'
      );

    const calendarButton =
      document.getElementById(
        'br-calendar-button'
      );

    if (
      !dateInput ||
      !calendarButton
    ) {
      return;
    }

    const parsed =
      parseDate(
        dateInput.value
      );

    if (parsed) {

      calendarMonth =
        new Date(
          parsed.year,
          parsed.month,
          1
        );

    } else {

      const now =
        new Date();

      calendarMonth =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );
    }

    dateInput.addEventListener(
      'click',
      toggleCalendar
    );

    calendarButton.addEventListener(
      'click',
      event => {

        event.stopPropagation();

        toggleCalendar();
      }
    );

    document.addEventListener(
      'click',
      event => {

        const picker =
          document.getElementById(
            'br-date-picker'
          );

        const wrapper =
          document.querySelector(
            '.br-date-wrapper'
          );

        if (
          !picker ||
          !wrapper
        ) {
          return;
        }

        if (
          !wrapper.contains(
            event.target
          ) &&
          !picker.contains(
            event.target
          )
        ) {

          picker.classList.add(
            'hidden'
          );
        }
      }
    );

    document.addEventListener(
      'keydown',
      event => {

        if (
          event.key === 'Escape'
        ) {

          const picker =
            document.getElementById(
              'br-date-picker'
            );

          if (picker) {

            picker.classList.add(
              'hidden'
            );
          }
        }
      }
    );

    document
      .getElementById(
        'br-prev-month'
      )
      .addEventListener(
        'click',
        event => {

          event.stopPropagation();

          calendarMonth =
            new Date(
              calendarMonth.getFullYear(),
              calendarMonth.getMonth() - 1,
              1
            );

          renderCalendar();
        }
      );

    document
      .getElementById(
        'br-next-month'
      )
      .addEventListener(
        'click',
        event => {

          event.stopPropagation();

          calendarMonth =
            new Date(
              calendarMonth.getFullYear(),
              calendarMonth.getMonth() + 1,
              1
            );

          renderCalendar();
        }
      );

    renderCalendar();
  }

  function toggleCalendar() {

    const picker =
      document.getElementById(
        'br-date-picker'
      );

    if (!picker) {
      return;
    }

    picker.classList.toggle(
      'hidden'
    );

    if (
      !picker.classList.contains(
        'hidden'
      )
    ) {

      renderCalendar();
    }
  }

  function renderCalendar() {

    const monthTitle =
      document.getElementById(
        'br-calendar-month'
      );

    const daysContainer =
      document.getElementById(
        'br-calendar-days'
      );

    const dateInput =
      document.getElementById(
        'br-date'
      );

    if (
      !monthTitle ||
      !daysContainer ||
      !dateInput ||
      !calendarMonth
    ) {
      return;
    }

    const year =
      calendarMonth.getFullYear();

    const month =
      calendarMonth.getMonth();

    monthTitle.textContent =
      calendarMonth.toLocaleString(
        'en-US',
        {
          month: 'long',
          year: 'numeric'
        }
      );

    daysContainer.innerHTML =
      '';

    const firstDay =
      new Date(
        year,
        month,
        1
      ).getDay();

    const daysInMonth =
      new Date(
        year,
        month + 1,
        0
      ).getDate();

    const selected =
      parseDate(
        dateInput.value
      );

    for (
      let i = 0;
      i < firstDay;
      i++
    ) {

      const empty =
        document.createElement(
          'button'
        );

      empty.type =
        'button';

      empty.className =
        'br-day empty';

      empty.disabled =
        true;

      daysContainer.appendChild(
        empty
      );
    }

    const today =
      new Date();

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {

      const button =
        document.createElement(
          'button'
        );

      button.type =
        'button';

      button.className =
        'br-day';

      button.textContent =
        day;

      if (
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === day
      ) {

        button.classList.add(
          'today'
        );
      }

      if (
        selected &&
        selected.year === year &&
        selected.month === month &&
        selected.day === day
      ) {

        button.classList.add(
          'selected'
        );
      }

      button.addEventListener(
        'click',
        event => {

          event.stopPropagation();

          const selectedDate =
            new Date(
              year,
              month,
              day
            );

          dateInput.value =
            formatDateForBot(
              selectedDate
            );

          saveSettings();

          const picker =
            document.getElementById(
              'br-date-picker'
            );

          if (picker) {

            picker.classList.add(
              'hidden'
            );
          }

          status(
            `Date ${dateInput.value} selected ✓`
          );

          renderCalendar();
        }
      );

      daysContainer.appendChild(
        button
      );
    }
  }

  // =========================================================
  // FIND STATION INPUTS
  // =========================================================

  function findStationInputs() {

    return [
      ...document.querySelectorAll(
        'input'
      )
    ].filter(
      input => {

        if (!isVisible(input)) {
          return false;
        }

        if (isBotElement(input)) {
          return false;
        }

        const type =
          (
            input.type ||
            ''
          ).toLowerCase();

        if (
          type === 'hidden' ||
          type === 'date' ||
          type === 'number'
        ) {
          return false;
        }

        return true;
      }
    );
  }

  // =========================================================
  // REACT VALUE
  // =========================================================

  function setNativeValue(
    element,
    value
  ) {

    const prototype =
      Object.getPrototypeOf(
        element
      );

    const descriptor =
      Object.getOwnPropertyDescriptor(
        prototype,
        'value'
      );

    if (
      descriptor &&
      descriptor.set
    ) {

      descriptor.set.call(
        element,
        value
      );

    } else {

      element.value =
        value;
    }
  }

  // =========================================================
  // TYPE STATION
  // =========================================================

  async function typeStation(
    input,
    value
  ) {

    if (!botRunning) {
      return false;
    }

    input.focus();

    setNativeValue(
      input,
      ''
    );

    input.dispatchEvent(
      new Event(
        'input',
        {
          bubbles: true
        }
      )
    );

    await sleep(150);

    for (
      const char of value
    ) {

      if (!botRunning) {
        return false;
      }

      setNativeValue(
        input,
        input.value + char
      );

      input.dispatchEvent(
        new InputEvent(
          'input',
          {
            bubbles: true,
            inputType:
              'insertText',
            data: char
          }
        )
      );

      await sleep(70);
    }

    input.dispatchEvent(
      new Event(
        'change',
        {
          bubbles: true
        }
      )
    );

    await sleep(900);

    return true;
  }

  // =========================================================
  // FIND STATION OPTION
  // =========================================================

  function findStationOption(
    stationName
  ) {

    const elements = [
      ...document.querySelectorAll(
        '[role="option"], li, button, div'
      )
    ];

    const target =
      stationName
        .trim()
        .toLowerCase();

    for (
      const el of elements
    ) {

      if (!isVisible(el)) {
        continue;
      }

      if (isBotElement(el)) {
        continue;
      }

      const text =
        normalizeText(
          el.innerText ||
          el.textContent
        ).toLowerCase();

      if (text === target) {
        return el;
      }
    }

    for (
      const el of elements
    ) {

      if (!isVisible(el)) {
        continue;
      }

      if (isBotElement(el)) {
        continue;
      }

      const text =
        normalizeText(
          el.innerText ||
          el.textContent
        ).toLowerCase();

      if (
        text &&
        text.includes(target)
      ) {
        return el;
      }
    }

    return null;
  }

  // =========================================================
  // SELECT STATION
  // =========================================================

  async function selectStation(
    input,
    stationName
  ) {

    if (!botRunning) {
      return false;
    }

    status(
      `Selecting ${stationName}...`
    );

    const typed =
      await typeStation(
        input,
        stationName
      );

    if (!typed) {
      return false;
    }

    let option = null;

    for (
      let i = 0;
      i < 15;
      i++
    ) {

      if (!botRunning) {
        return false;
      }

      option =
        findStationOption(
          stationName
        );

      if (option) {
        break;
      }

      await sleep(200);
    }

    if (option) {

      option.click();

      await sleep(500);

      status(
        `${stationName} selected ✓`
      );

      return true;
    }

    input.focus();

    input.dispatchEvent(
      new KeyboardEvent(
        'keydown',
        {
          key: 'ArrowDown',
          code: 'ArrowDown',
          keyCode: 40,
          which: 40,
          bubbles: true
        }
      )
    );

    await sleep(200);

    input.dispatchEvent(
      new KeyboardEvent(
        'keydown',
        {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true
        }
      )
    );

    await sleep(500);

    return botRunning;
  }

  // =========================================================
  // DATE INPUT
  // =========================================================

  function findDateInput() {

    const inputs = [
      ...document.querySelectorAll(
        'input'
      )
    ];

    for (
      const input of inputs
    ) {

      if (!isVisible(input)) {
        continue;
      }

      if (isBotElement(input)) {
        continue;
      }

      if (
        (
          input.type ||
          ''
        ).toLowerCase() === 'date'
      ) {
        return input;
      }
    }

    for (
      const input of inputs
    ) {

      if (!isVisible(input)) {
        continue;
      }

      if (isBotElement(input)) {
        continue;
      }

      const text = (
        (input.placeholder || '') +
        ' ' +
        (input.name || '') +
        ' ' +
        (input.id || '') +
        ' ' +
        (
          input.getAttribute(
            'aria-label'
          ) || ''
        )
      ).toLowerCase();

      if (
        text.includes('date') ||
        text.includes('journey')
      ) {
        return input;
      }
    }

    return null;
  }

  // =========================================================
  // CLOSE WEBSITE CALENDAR
  // =========================================================

  async function closeWebsiteCalendar() {

    document.dispatchEvent(
      new KeyboardEvent(
        'keydown',
        {
          key: 'Escape',
          code: 'Escape',
          keyCode: 27,
          which: 27,
          bubbles: true,
          cancelable: true
        }
      )
    );

    await sleep(250);

    try {

      if (
        document.activeElement &&
        typeof document.activeElement.blur ===
          'function'
      ) {

        document.activeElement.blur();
      }

    } catch (e) {}

    await sleep(300);
  }

  // =========================================================
  // SELECT DATE
  // =========================================================

  async function selectDate(
    dateString
  ) {

    const parsed =
      parseDate(
        dateString
      );

    if (!parsed) {

      status(
        'Invalid date format'
      );

      return false;
    }

    if (!botRunning) {
      return false;
    }

    status(
      `Setting date ${dateString}...`
    );

    const dateInput =
      findDateInput();

    if (
      dateInput &&
      dateInput.type === 'date'
    ) {

      const iso =
        `${parsed.year}-${String(parsed.month + 1).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`;

      setNativeValue(
        dateInput,
        iso
      );

      dateInput.dispatchEvent(
        new Event(
          'input',
          {
            bubbles: true
          }
        )
      );

      dateInput.dispatchEvent(
        new Event(
          'change',
          {
            bubbles: true
          }
        )
      );

      await sleep(500);

      await closeWebsiteCalendar();

      status(
        `Date ${dateString} selected ✓`
      );

      return true;
    }

    let calendarTrigger = null;

    const elements = [
      ...document.querySelectorAll(
        'input, button, img, div'
      )
    ];

    for (
      const el of elements
    ) {

      if (!isVisible(el)) {
        continue;
      }

      if (isBotElement(el)) {
        continue;
      }

      const text = (
        (el.innerText || '') +
        ' ' +
        (
          el.getAttribute(
            'aria-label'
          ) || ''
        ) +
        ' ' +
        (
          el.getAttribute(
            'placeholder'
          ) || ''
        ) +
        ' ' +
        (
          el.getAttribute(
            'alt'
          ) || ''
        ) +
        ' ' +
        (
          el.getAttribute(
            'title'
          ) || ''
        )
      ).toLowerCase();

      if (
        text.includes('pick a date') ||
        text.includes('date of journey') ||
        text.includes('calendar')
      ) {

        calendarTrigger =
          el;

        break;
      }
    }

    if (!calendarTrigger) {
      calendarTrigger =
        dateInput;
    }

    if (!calendarTrigger) {

      status(
        'Date field not found'
      );

      return false;
    }

    calendarTrigger.click();

    await sleep(500);

    let dayElement = null;

    const candidates = [
      ...document.querySelectorAll(
        '[role="gridcell"], [role="option"], button, td, div'
      )
    ];

    for (
      const el of candidates
    ) {

      if (!isVisible(el)) {
        continue;
      }

      if (isBotElement(el)) {
        continue;
      }

      const text =
        normalizeText(
          el.innerText ||
          el.textContent
        );

      if (
        text ===
        String(parsed.day)
      ) {

        dayElement =
          el;

        break;
      }
    }

    if (!dayElement) {

      status(
        `Day ${parsed.day} not found`
      );

      return false;
    }

    dayElement.click();

    await sleep(500);

    await closeWebsiteCalendar();

    status(
      `Date ${dateString} selected ✓`
    );

    return true;
  }

  // =========================================================
  // WEBSITE CLASS
  // =========================================================

  function findWebsiteClassSelect() {

    const selects = [
      ...document.querySelectorAll(
        'select'
      )
    ];

    for (
      const select of selects
    ) {

      if (!isVisible(select)) {
        continue;
      }

      if (isBotElement(select)) {
        continue;
      }

      const options = [
        ...select.options
      ].map(
        option =>
          (
            option.value ||
            option.textContent ||
            ''
          ).trim()
      );

      const matches =
        CLASSES.filter(
          cls =>
            options.includes(cls)
        );

      if (matches.length) {
        return select;
      }
    }

    return null;
  }

  async function selectClass(
    className
  ) {

    if (!botRunning) {
      return false;
    }

    status(
      `Selecting class ${className}...`
    );

    const select =
      findWebsiteClassSelect();

    if (!select) {

      status(
        'Website class select not found'
      );

      return false;
    }

    let targetOption = null;

    for (
      const option of select.options
    ) {

      const value =
        (
          option.value ||
          ''
        ).trim();

      const text =
        (
          option.textContent ||
          ''
        ).trim();

      if (
        value === className ||
        text === className
      ) {

        targetOption =
          option;

        break;
      }
    }

    if (!targetOption) {

      status(
        `Class ${className} not found`
      );

      return false;
    }

    select.value =
      targetOption.value;

    select.dispatchEvent(
      new Event(
        'input',
        {
          bubbles: true
        }
      )
    );

    select.dispatchEvent(
      new Event(
        'change',
        {
          bubbles: true
        }
      )
    );

    await sleep(500);

    status(
      `Class ${className} selected ✓`
    );

    return true;
  }

  // =========================================================
  // SEARCH BUTTON
  // =========================================================

  function findSearchButton() {

    const elements = [
      ...document.querySelectorAll(
        'button, input[type="button"], input[type="submit"]'
      )
    ];

    for (
      const el of elements
    ) {

      if (!isVisible(el)) {
        continue;
      }

      if (isBotElement(el)) {
        continue;
      }

      const text = (
        el.innerText ||
        el.value ||
        ''
      )
        .trim()
        .toLowerCase();

      if (
        text.includes(
          'search trains'
        ) ||
        text === 'search'
      ) {

        return el;
      }
    }

    return null;
  }

  async function clickSearch() {

    if (!botRunning) {
      return false;
    }

    status(
      'Searching trains...'
    );

    const button =
      findSearchButton();

    if (!button) {

      status(
        'SEARCH TRAINS button not found'
      );

      return false;
    }

    button.click();

    status(
      'Search submitted ✓'
    );

    return true;
  }

  // =========================================================
  // SECURITY CHALLENGE
  // =========================================================

  function hasSecurityChallenge() {

    const visibleFrames = [
      ...document.querySelectorAll(
        'iframe'
      )
    ].some(
      iframe => {

        if (!isVisible(iframe)) {
          return false;
        }

        const text = (
          iframe.src +
          ' ' +
          (
            iframe.title || ''
          )
        ).toLowerCase();

        return (
          text.includes('captcha') ||
          text.includes('turnstile')
        );
      }
    );

    if (visibleFrames) {
      return true;
    }

    const body =
      normalizeText(
        document.body.innerText
      ).toLowerCase();

    return (
      body.includes(
        'verify you are human'
      ) ||
      body.includes(
        'captcha'
      ) ||
      body.includes(
        'turnstile'
      ) ||
      body.includes(
        'one time password'
      ) ||
      /\botp\b/.test(body)
    );
  }

  function stopForSecurityChallenge() {

    botRunning = false;

    searchRunning = false;

    seatPageRunning = false;

    searchRunId++;

    clearBotTimers();

    disconnectObserver();

    setBotState(
      'SECURITY'
    );

    status(
      'Security/OTP challenge detected. Bot stopped. Complete it manually.'
    );
  }

  // =========================================================
  // RESULT PAGE
  // =========================================================

  function isResultsPage() {

    const bodyText =
      normalizeText(
        document.body.innerText
      );

    return (
      /BOOK NOW/i.test(
        bodyText
      ) &&
      /\(\d{3,4}\)/.test(
        bodyText
      )
    );
  }

  // =========================================================
  // FIND TARGET TRAIN CONTAINER
  // =========================================================

  function findTargetTrainContainer() {

    const train =
      getTargetTrain();

    if (
      !train.name &&
      !train.number
    ) {
      return null;
    }

    const bookButtons = [
      ...document.querySelectorAll(
        'button, a'
      )
    ].filter(
      el => {

        if (!isVisible(el)) {
          return false;
        }

        if (isBotElement(el)) {
          return false;
        }

        const text =
          normalizeText(
            el.innerText ||
            el.textContent
          ).toUpperCase();

        return text.includes(
          'BOOK NOW'
        );
      }
    );

    for (
      const button of bookButtons
    ) {

      let current =
        button.parentElement;

      for (
        let level = 0;
        level < 10 && current;
        level++
      ) {

        if (
          isBotElement(current)
        ) {
          break;
        }

        const text =
          normalizeText(
            current.innerText
          );

        const numberMatch =
          train.number &&
          new RegExp(
            `\\(${train.number}\\)`
          ).test(
            text
          );

        const nameMatch =
          train.name &&
          text
            .toLowerCase()
            .includes(
              train.name.toLowerCase()
            );

        if (
          (
            numberMatch ||
            nameMatch
          ) &&
          /\(\d{3,4}\)/.test(text) &&
          /BOOK NOW/i.test(text) &&
          text.length >= 80 &&
          text.length <= 4500
        ) {

          return current;
        }

        current =
          current.parentElement;
      }
    }

    return null;
  }

  // =========================================================
  // FIND CLASS BLOCK
  // =========================================================

  function findTargetClassBlock(
    trainContainer,
    className
  ) {

    if (!trainContainer) {
      return null;
    }

    const classRegex =
      new RegExp(
        `\\b${className}\\b`,
        'i'
      );

    const elements = [
      ...trainContainer.querySelectorAll(
        'div, section, li, article, td'
      )
    ]
      .filter(
        isVisible
      )
      .sort(
        (a, b) =>
          normalizeText(
            a.innerText
          ).length -
          normalizeText(
            b.innerText
          ).length
      );

    for (
      const el of elements
    ) {

      if (isBotElement(el)) {
        continue;
      }

      const text =
        normalizeText(
          el.innerText
        );

      if (
        !classRegex.test(text)
      ) {
        continue;
      }

      if (
        !/BOOK NOW/i.test(text)
      ) {
        continue;
      }

      const classMatches =
        text.match(
          new RegExp(
            `\\b(${CLASSES.join('|')})\\b`,
            'gi'
          )
        ) || [];

      const uniqueClasses =
        [
          ...new Set(
            classMatches.map(
              x =>
                x.toUpperCase()
            )
          )
        ];

      if (
        uniqueClasses.length > 1
      ) {
        continue;
      }

      return el;
    }

    return null;
  }

  // =========================================================
  // FIND BOOK BUTTON
  // =========================================================

  function findBookButton(
    element
  ) {

    if (!element) {
      return null;
    }

    const buttons = [
      ...element.querySelectorAll(
        'button, a'
      )
    ];

    for (
      const button of buttons
    ) {

      if (!isVisible(button)) {
        continue;
      }

      if (isBotElement(button)) {
        continue;
      }

      const text =
        normalizeText(
          button.innerText ||
          button.textContent
        ).toLowerCase();

      if (
        text.includes(
          'book now'
        )
      ) {

        return button;
      }
    }

    return null;
  }

  // =========================================================
  // PARSE TARGET CLASS
  // =========================================================

  function parseTargetClass(
    block,
    className
  ) {

    if (!block) {
      return null;
    }

    const text =
      normalizeText(
        block.innerText
      );

    const classRegex =
      new RegExp(
        `\\b${className}\\b`,
        'i'
      );

    if (
      !classRegex.test(text)
    ) {
      return null;
    }

    const priceMatch =
      text.match(
        /৳\s*[\d,]+/i
      );

    let available = null;

    const availabilityMatch =
      text.match(
        /Available Tickets[\s\S]*?(\d+)/i
      );

    if (
      availabilityMatch
    ) {

      available =
        Number(
          availabilityMatch[1]
        );
    }

    const bookButton =
      findBookButton(
        block
      );

    return {

      className,

      price:
        priceMatch
          ? priceMatch[0]
          : '',

      available,

      bookButton,

      element: block
    };
  }

  // =========================================================
  // PARSE TARGET TRAIN
  // =========================================================

  function parseTargetTrain(
    container
  ) {

    if (!container) {
      return null;
    }

    const text =
      normalizeText(
        container.innerText
      );

    const train =
      getTargetTrain();

    if (
      train.number &&
      !new RegExp(
        `\\(${train.number}\\)`
      ).test(text)
    ) {
      return null;
    }

    if (
      train.name &&
      !text
        .toLowerCase()
        .includes(
          train.name.toLowerCase()
        )
    ) {

      if (!train.number) {
        return null;
      }
    }

    const times =
      text.match(
        /\b\d{1,2}:\d{2}\s*(?:AM|PM)\b/gi
      ) || [];

    return {

      name:
        train.name,

      number:
        train.number,

      departure:
        times[0] || '',

      arrival:
        times[1] || '',

      element:
        container
    };
  }

  // =========================================================
  // FIND TARGET
  // =========================================================

  function findTargetResult() {

    const container =
      findTargetTrainContainer();

    if (!container) {
      return null;
    }

    const train =
      parseTargetTrain(
        container
      );

    if (!train) {
      return null;
    }

    const className =
      document.getElementById(
        'br-class'
      )?.value ||
      DEFAULTS.className;

    const classBlock =
      findTargetClassBlock(
        container,
        className
      );

    if (!classBlock) {

      return {
        train,
        classOption: null
      };
    }

    const classOption =
      parseTargetClass(
        classBlock,
        className
      );

    return {
      train,
      classOption
    };
  }

  // =========================================================
  // RENDER TARGET RESULT
  // =========================================================

  function renderTargetResult(
    result
  ) {

    const resultsEl =
      document.getElementById(
        'br-results'
      );

    if (!resultsEl) {
      return;
    }

    if (!result) {

      resultsEl.innerHTML = `

        <div class="br-no-target">

          Target train not found yet.

          <br><br>

          Searching only for:

          <strong>
            ${escapeHtml(
              targetTrain.name
            )}
            ${
              targetTrain.number
                ? `(${escapeHtml(
                    targetTrain.number
                  )})`
                : ''
            }
          </strong>

        </div>
      `;

      return;
    }

    const option =
      result.classOption;

    const available =
      option
        ? option.available
        : null;

    resultsEl.innerHTML = `

      <div class="br-target-found">

        <div
          class="br-target-found-title"
        >
          🎯 TARGET TRAIN FOUND
        </div>

        <div>
          <strong>
            ${escapeHtml(
              result.train.name
            )}
            ${
              result.train.number
                ? `(${escapeHtml(
                    result.train.number
                  )})`
                : ''
            }
          </strong>
        </div>

        <div
          class="br-target-found-time"
        >
          ${
            result.train.departure ||
            '--'
          }
          →
          ${
            result.train.arrival ||
            '--'
          }
        </div>

        <div class="br-target-class">

          Class:
          ${escapeHtml(
            document.getElementById(
              'br-class'
            )?.value ||
            DEFAULTS.className
          )}

        </div>

        <div class="br-target-price">

          ${
            option
              ? escapeHtml(
                  option.price ||
                  'Price unavailable'
                )
              : 'Class block not detected yet'
          }

        </div>

        <div
          class="br-target-available ${
            available === 0
              ? 'sold'
              : ''
          }"
        >

          ${
            available === null
              ? 'Availability unknown'
              : available === 0
                ? 'SOLD OUT'
                : `${available} available`
          }

        </div>

      </div>
    `;
  }

  // =========================================================
  // HANDLE TARGET RESULT
  // =========================================================

  function processTargetResult() {

    if (!botRunning) {
      return false;
    }

    const result =
      findTargetResult();

    if (!result) {

      status(
        'Target train not detected yet...'
      );

      renderTargetResult(
        null
      );

      return false;
    }

    renderTargetResult(
      result
    );

    const classOption =
      result.classOption;

    if (!classOption) {

      status(
        `Target train found. Waiting for ${
          document.getElementById(
            'br-class'
          )?.value ||
          DEFAULTS.className
        }...`
      );

      return false;
    }

    if (
      classOption.available === 0
    ) {

      status(
        'Target class is SOLD OUT.'
      );

      setBotState(
        'SOLD OUT'
      );

      return true;
    }

    if (
      !classOption.bookButton
    ) {

      status(
        'Target class found. BOOK NOW not ready yet...'
      );

      return false;
    }

    setBotState(
      'READY TO BOOK'
    );

    status(
      'Target train + class found. Opening BOOK NOW...'
    );

    clickTargetBook(
      result
    );

    return true;
  }

  // =========================================================
  // SAVE PENDING BOOKING
  // =========================================================

  function savePendingBooking() {

    try {

      const settings =
        getSettings();

      localStorage.setItem(
        PENDING_KEY,
        JSON.stringify({
          ...settings,
          train: targetTrain.name,
          trainNumber:
            targetTrain.number,
          createdAt:
            Date.now()
        })
      );

      log(
        'Pending booking saved'
      );

    } catch (e) {

      log(
        'Could not save pending booking',
        e
      );
    }
  }

  function getPendingBooking() {

    try {

      const raw =
        localStorage.getItem(
          PENDING_KEY
        );

      if (!raw) {
        return null;
      }

      return JSON.parse(raw);

    } catch (e) {

      return null;
    }
  }

  // =========================================================
  // BOOK TARGET
  // =========================================================

  function clickTargetBook(
    result
  ) {

    if (!botRunning) {

      status(
        'Bot is stopped.'
      );

      return;
    }

    const option =
      result &&
      result.classOption;

    if (!option) {

      status(
        'Target class not found.'
      );

      return;
    }

    if (
      option.available === 0
    ) {

      status(
        'Target class is SOLD OUT.'
      );

      return;
    }

    if (
      !option.bookButton
    ) {

      status(
        'Actual BOOK NOW button not found.'
      );

      return;
    }

    savePendingBooking();

    status(
      `Opening ${result.train.name} → ${option.className}...`
    );

    setBotState(
      'BOOKING'
    );

    option.bookButton.click();

    /*
     * Search-page automation ends here.
     * Pending booking remains in localStorage
     * so the next page can continue seat selection.
     */

    botRunning = false;

    searchRunning = false;

    searchRunId++;

    clearBotTimers();

    disconnectObserver();

    setBotState(
      'OPENING SEATS'
    );

    status(
      'BOOK NOW clicked. Waiting for seat page...'
    );

    waitForSeatPage();
  }

  // =========================================================
  // SEAT PAGE DETECTION
  // =========================================================

  function isSeatPage() {

    const body =
      normalizeText(
        document.body.innerText
      );

    return (
      /Choose your seat/i.test(body) ||
      /Choose your seats/i.test(body) ||
      /Maximum 4 seats/i.test(body) ||
      /Select Coach/i.test(body) ||
      /Seat Details/i.test(body)
    );
  }

  async function waitForSeatPage() {

    for (
      let i = 0;
      i < 80;
      i++
    ) {

      await sleep(500);

      if (
        hasSecurityChallenge()
      ) {

        stopForSecurityChallenge();

        return;
      }

      if (
        isSeatPage()
      ) {

        createOrRestorePanel();

        status(
          'Seat selection page detected.'
        );

        setBotState(
          'SEAT PAGE'
        );

        await sleep(500);

        startSeatSelection();

        return;
      }
    }

    /*
     * Page navigation may have replaced the
     * JavaScript context, so this may not execute
     * after a full navigation. The pending state
     * is also checked during init.
     */

    log(
      'Seat page wait ended'
    );
  }

  // =========================================================
  // COACH PARSER
  // =========================================================

  function parseCoachAvailability() {

    const coaches = [];

    const seen = new Set();

    const elements = [
      ...document.querySelectorAll(
        'button, [role="button"], li, div, span, label, a'
      )
    ];

    const coachRegex =
      /^([A-Z]{1,4})\s*-\s*(\d+)\s*Seat\s*\(s\)$/i;

    for (
      const el of elements
    ) {

      if (!isVisible(el)) {
        continue;
      }

      if (isBotElement(el)) {
        continue;
      }

      const text =
        normalizeText(
          el.innerText ||
          el.textContent
        );

      const match =
        text.match(
          coachRegex
        );

      if (!match) {
        continue;
      }

      const coach =
        match[1].toUpperCase();

      const count =
        Number(
          match[2]
        );

      if (!Number.isFinite(count)) {
        continue;
      }

      /*
       * Find the smallest useful clickable
       * ancestor for the coach.
       */

      let clickable =
        null;

      if (
        el.matches(
          'button, [role="button"], a'
        )
      ) {

        clickable = el;

      } else {

        let current = el;

        for (
          let level = 0;
          level < 5 && current;
          level++
        ) {

          if (
            current.matches &&
            current.matches(
              'button, [role="button"], a'
            )
          ) {

            clickable =
              current;

            break;
          }

          current =
            current.parentElement;
        }
      }

      /*
       * Use a stable key so duplicate
       * nested spans do not create duplicates.
       */

      const key =
        coach + ':' + count;

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);

      coaches.push({

        coach,
        count,
        element: el,
        clickable

      });
    }

    /*
     * Sometimes the website uses a container
     * whose text contains multiple coaches.
     * Parse individual lines as fallback.
     */

    if (!coaches.length) {

      const body =
        normalizeText(
          document.body.innerText
        );

      const matches =
        body.match(
          /[A-Z]{1,4}\s*-\s*\d+\s*Seat\s*\(s\)/gi
        ) || [];

      for (
        const raw of matches
      ) {

        const match =
          raw.match(
            /^([A-Z]{1,4})\s*-\s*(\d+)/i
          );

        if (!match) {
          continue;
        }

        const coach =
          match[1].toUpperCase();

        const count =
          Number(match[2]);

        if (
          !seen.has(
            coach + ':' + count
          )
        ) {

          coaches.push({
            coach,
            count,
            element: null,
            clickable: null
          });
        }
      }
    }

    return coaches;
  }

  // =========================================================
  // SEAT NUMBER
  // =========================================================

  function extractSeatNumber(
    text
  ) {

    const value =
      normalizeText(text);

    /*
     * Examples:
     * CHA-25
     * GA-27
     * Kha - 25
     */

    let match =
      value.match(
        /[-–]\s*(\d+)\s*$/
      );

    if (match) {
      return Number(
        match[1]
      );
    }

    match =
      value.match(
        /(?:seat\s*)?(\d+)\s*$/
      );

    if (match) {
      return Number(
        match[1]
      );
    }

    return null;
  }

  function extractCoachFromSeat(
    text
  ) {

    const value =
      normalizeText(text);

    const match =
      value.match(
        /^([A-Z]{1,4})\s*[-–]\s*\d+$/i
      );

    return match
      ? match[1].toUpperCase()
      : '';
  }

  // =========================================================
  // SEAT PREFERENCE
  // =========================================================

  function parseSeatPreference(
    value
  ) {

    const raw =
      normalizeText(value)
        .toUpperCase();

    if (
      !raw ||
      raw === 'ANY'
    ) {

      return {
        any: true,
        numbers: [],
        ranges: []
      };
    }

    const numbers = [];
    const ranges = [];

    const parts =
      raw
        .split(',')
        .map(x => x.trim())
        .filter(Boolean);

    for (
      const part of parts
    ) {

      const range =
        part.match(
          /^(\d+)\s*-\s*(\d+)$/
        );

      if (range) {

        let start =
          Number(range[1]);

        let end =
          Number(range[2]);

        if (
          start > end
        ) {

          const temp = start;

          start = end;
          end = temp;
        }

        ranges.push({
          start,
          end
        });

        continue;
      }

      const number =
        part.match(
          /^\d+$/
        );

      if (number) {

        numbers.push(
          Number(number[0])
        );
      }
    }

    return {
      any:
        numbers.length === 0 &&
        ranges.length === 0,

      numbers,

      ranges
    };
  }

  function seatMatchesPreference(
    number,
    preference
  ) {

    if (
      number === null ||
      !Number.isFinite(number)
    ) {
      return false;
    }

    if (preference.any) {
      return true;
    }

    if (
      preference.numbers.includes(
        number
      )
    ) {
      return true;
    }

    return preference.ranges.some(
      range =>
        number >= range.start &&
        number <= range.end
    );
  }

  // =========================================================
  // SEAT TYPE
  // =========================================================

  function seatMatchesType(
    element,
    requestedType
  ) {

    if (
      requestedType === 'ANY'
    ) {
      return true;
    }

    const text =
      (
        element.innerText ||
        element.textContent ||
        ''
      ).toLowerCase();

    const aria =
      (
        element.getAttribute(
          'aria-label'
        ) || ''
      ).toLowerCase();

    const title =
      (
        element.getAttribute(
          'title'
        ) || ''
      ).toLowerCase();

    const data =
      (
        element.getAttribute(
          'data-seat-type'
        ) || ''
      ).toLowerCase();

    const combined =
      `${text} ${aria} ${title} ${data}`;

    if (
      requestedType === 'WINDOW'
    ) {

      return (
        combined.includes(
          'window'
        ) ||
        combined.includes(
          'janala'
        )
      );
    }

    if (
      requestedType === 'NORMAL'
    ) {

      return !(
        combined.includes(
          'window'
        ) ||
        combined.includes(
          'janala'
        )
      );
    }

    return true;
  }

  // =========================================================
  // SEAT STATE
  // =========================================================

  function getSeatState(
    element
  ) {

    if (!element) {
      return 'unknown';
    }

    const chain = [];

    let current =
      element;

    for (
      let i = 0;
      i < 5 && current;
      i++
    ) {

      chain.push(
        current
      );

      current =
        current.parentElement;
    }

    const classText =
      chain
        .map(
          el =>
            String(
              el.className ||
              ''
            )
        )
        .join(' ')
        .toLowerCase();

    const attrs =
      chain
        .map(
          el =>
            [
              el.getAttribute(
                'aria-label'
              ),
              el.getAttribute(
                'title'
              ),
              el.getAttribute(
                'data-status'
              ),
              el.getAttribute(
                'data-state'
              ),
              el.getAttribute(
                'data-seat-status'
              ),
              el.getAttribute(
                'data-available'
              )
            ]
              .filter(Boolean)
              .join(' ')
              .toLowerCase()
        )
        .join(' ');

    const combined =
      classText +
      ' ' +
      attrs;

    if (
      /\bbooked\b/.test(
        combined
      ) ||
      /\boccupied\b/.test(
        combined
      ) ||
      /\breserved\b/.test(
        combined
      ) ||
      /\bsold\b/.test(
        combined
      ) ||
      /\bnot[-_\s]?available\b/.test(
        combined
      )
    ) {

      return 'booked';
    }

    if (
      /\bin[-_\s]?progress\b/.test(
        combined
      ) ||
      /\bprogress\b/.test(
        combined
      )
    ) {

      return 'in-progress';
    }

    if (
      /\bselected\b/.test(
        combined
      ) ||
      /\bactive\b/.test(
        combined
      )
    ) {

      return 'selected';
    }

    /*
     * aria-disabled is a strong indicator.
     */

    if (
      element.getAttribute(
        'aria-disabled'
      ) === 'true'
    ) {

      return 'booked';
    }

    if (
      element.disabled === true
    ) {

      return 'booked';
    }

    /*
     * Check computed background color.
     *
     * Railway commonly represents:
     * white  = available
     * black  = selected
     * green  = in progress
     * orange = booked
     */

    for (
      const el of chain
    ) {

      const style =
        window.getComputedStyle(
          el
        );

      const bg =
        style.backgroundColor;

      const color =
        style.color;

      const combinedColor =
        `${bg} ${color}`
          .toLowerCase();

      /*
       * RGB/rgba approximate detection.
       */

      const rgb =
        bg.match(
          /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i
        );

      if (rgb) {

        const r =
          Number(rgb[1]);

        const g =
          Number(rgb[2]);

        const b =
          Number(rgb[3]);

        /*
         * Black
         */

        if (
          r < 50 &&
          g < 50 &&
          b < 50
        ) {
          return 'selected';
        }

        /*
         * Green
         */

        if (
          g > r * 1.25 &&
          g > b * 1.15 &&
          g > 70
        ) {
          return 'in-progress';
        }

        /*
         * Orange
         */

        if (
          r > 150 &&
          g > 60 &&
          g < 190 &&
          b < 100
        ) {
          return 'booked';
        }

        /*
         * White/light background.
         */

        if (
          r > 220 &&
          g > 220 &&
          b > 220
        ) {
          return 'available';
        }
      }

      /*
       * Named color fallback.
       */

      if (
        combinedColor.includes(
          'orange'
        )
      ) {
        return 'booked';
      }

      if (
        combinedColor.includes(
          'green'
        )
      ) {
        return 'in-progress';
      }

      if (
        combinedColor.includes(
          'black'
        )
      ) {
        return 'selected';
      }

      if (
        combinedColor.includes(
          'white'
        )
      ) {
        return 'available';
      }
    }

    return 'unknown';
  }

  // =========================================================
  // FIND SEAT ELEMENTS
  // =========================================================

  function findSeatElements() {

    const candidates = [
      ...document.querySelectorAll(
        [
          '[data-seat]',
          '[data-seat-number]',
          '[data-seat-no]',
          '[aria-label*="seat" i]',
          '[title*="seat" i]',
          '[class*="seat" i]',
          '[id*="seat" i]',
          'button',
          '[role="button"]',
          'label'
        ].join(',')
      )
    ];

    const seats = [];

    const seen =
      new Set();

    for (
      const el of candidates
    ) {

      if (!isVisible(el)) {
        continue;
      }

      if (isBotElement(el)) {
        continue;
      }

      const text =
        normalizeText(
          el.innerText ||
          el.textContent ||
          el.getAttribute(
            'data-seat'
          ) ||
          el.getAttribute(
            'data-seat-number'
          ) ||
          el.getAttribute(
            'aria-label'
          ) ||
          el.getAttribute(
            'title'
          )
        );

      /*
       * Seat labels like:
       * CHA-1
       * GA-27
       */

      if (
        !/^[A-Z]{1,4}\s*[-–]\s*\d+$/i.test(
          text
        )
      ) {
        continue;
      }

      const number =
        extractSeatNumber(
          text
        );

      const coach =
        extractCoachFromSeat(
          text
        );

      if (
        number === null
      ) {
        continue;
      }

      /*
       * Deduplicate by actual DOM element.
       */

      if (
        seen.has(el)
      ) {
        continue;
      }

      seen.add(el);

      seats.push({

        element: el,

        text,

        number,

        coach,

        state:
          getSeatState(el)

      });
    }

    return seats;
  }

  // =========================================================
  // SELECT COACH
  // =========================================================

  async function selectCoach(
    desiredCoach
  ) {

    const coaches =
      parseCoachAvailability();

    if (!coaches.length) {

      status(
        'Coach availability not detected yet...'
      );

      return false;
    }

    log(
      'Coach availability:',
      coaches.map(
        x =>
          `${x.coach}=${x.count}`
      )
    );

    const available =
      coaches.filter(
        x =>
          x.count > 0
      );

    if (!available.length) {

      status(
        'No coach currently has available seats.'
      );

      return false;
    }

    let selectedCoach =
      null;

    if (
      desiredCoach &&
      desiredCoach !== 'ANY'
    ) {

      selectedCoach =
        available.find(
          x =>
            x.coach ===
            desiredCoach.toUpperCase()
        );

      if (!selectedCoach) {

        status(
          `${desiredCoach} has no available seat.`
        );

        return false;
      }

    } else {

      selectedCoach =
        available[0];
    }

    status(
      `Selecting coach ${selectedCoach.coach} (${selectedCoach.count} available)...`
    );

    /*
     * If we have a clickable element,
     * use it.
     */

    if (
      selectedCoach.clickable
    ) {

      selectedCoach.clickable.click();

      await sleep(700);

      status(
        `Coach ${selectedCoach.coach} selected ✓`
      );

      return true;
    }

    /*
     * Otherwise click the matched text element.
     */

    if (
      selectedCoach.element
    ) {

      selectedCoach.element.click();

      await sleep(700);

      status(
        `Coach ${selectedCoach.coach} selected ✓`
      );

      return true;
    }

    /*
     * Last safe fallback:
     * search again for exact text.
     */

    const elements = [
      ...document.querySelectorAll(
        'button, [role="button"], li, div, span, label, a'
      )
    ];

    const pattern =
      new RegExp(
        `^${selectedCoach.coach}\\s*-\\s*${selectedCoach.count}\\s*Seat\\s*\\(s\\)$`,
        'i'
      );

    for (
      const el of elements
    ) {

      if (!isVisible(el)) {
        continue;
      }

      if (isBotElement(el)) {
        continue;
      }

      if (
        pattern.test(
          normalizeText(
            el.innerText ||
            el.textContent
          )
        )
      ) {

        el.click();

        await sleep(700);

        status(
          `Coach ${selectedCoach.coach} selected ✓`
        );

        return true;
      }
    }

    return false;
  }

  // =========================================================
  // CHOOSE SEATS
  // =========================================================

  function getSeatCandidates(
    desiredCoach
  ) {

    const settings =
      getSettings();

    const preference =
      parseSeatPreference(
        settings.seatNumbers
      );

    const requestedType =
      String(
        settings.seatType ||
        'ANY'
      ).toUpperCase();

    const seats =
      findSeatElements();

    let candidates =
      seats.filter(
        seat => {

          if (
            desiredCoach &&
            desiredCoach !== 'ANY' &&
            seat.coach &&
            seat.coach !==
              desiredCoach.toUpperCase()
          ) {
            return false;
          }

          /*
           * Only available seats.
           */

          if (
            seat.state === 'booked' ||
            seat.state === 'in-progress' ||
            seat.state === 'selected'
          ) {
            return false;
          }

          /*
           * Unknown state is not automatically
           * treated as available when a specific
           * seat is requested.
           *
           * For ANY, allow unknown so the actual
           * click can determine the state.
           */

          if (
            seat.state === 'unknown' &&
            !preference.any
          ) {
            return false;
          }

          if (
            !seatMatchesPreference(
              seat.number,
              preference
            )
          ) {
            return false;
          }

          if (
            !seatMatchesType(
              seat.element,
              requestedType
            )
          ) {
            return false;
          }

          return true;
        }
      );

    /*
     * Requested number/range candidates first.
     */

    candidates.sort(
      (a, b) =>
        a.number -
        b.number
    );

    return candidates;
  }

  async function selectRequiredSeats(
    desiredCoach
  ) {

    const settings =
      getSettings();

    const requiredCount =
      Math.min(
        4,
        Math.max(
          1,
          Number(
            settings.passengerCount
          ) || 1
        )
      );

    const preference =
      parseSeatPreference(
        settings.seatNumbers
      );

    status(
      `Looking for ${requiredCount} seat(s)...`
    );

    let candidates =
      getSeatCandidates(
        desiredCoach
      );

    /*
     * If specific seat preference produced
     * nothing, fallback to ANY available seat
     * as requested.
     */

    if (
      candidates.length <
      requiredCount
    ) {

      status(
        'Requested seat not fully available. Falling back to available seats...'
      );

      const allSeats =
        findSeatElements()
          .filter(
            seat => {

              if (
                desiredCoach &&
                desiredCoach !== 'ANY' &&
                seat.coach &&
                seat.coach !==
                  desiredCoach.toUpperCase()
              ) {
                return false;
              }

              return (
                seat.state !== 'booked' &&
                seat.state !== 'in-progress' &&
                seat.state !== 'selected'
              );
            }
          );

      allSeats.sort(
        (a, b) =>
          a.number -
          b.number
      );

      candidates =
        allSeats;
    }

    if (
      candidates.length === 0
    ) {

      status(
        'No selectable seat found.'
      );

      return false;
    }

    const selected = [];

    for (
      const seat of candidates
    ) {

      if (
        selected.length >=
        requiredCount
      ) {
        break;
      }

      /*
       * Re-check state before clicking.
       */

      const state =
        getSeatState(
          seat.element
        );

      if (
        state === 'booked' ||
        state === 'in-progress' ||
        state === 'selected'
      ) {
        continue;
      }

      status(
        `Selecting ${seat.text}...`
      );

      try {

        seat.element.click();

      } catch (e) {

        log(
          'Seat click failed',
          e
        );

        continue;
      }

      await sleep(450);

      /*
       * Verify selected state after click.
       */

      const newState =
        getSeatState(
          seat.element
        );

      if (
        newState === 'selected' ||
        newState === 'in-progress'
      ) {

        selected.push(
          seat
        );

        status(
          `${seat.text} selected ✓`
        );

      } else {

        /*
         * Some sites do not expose the
         * selected state on the exact element.
         * Check Seat Details below.
         */

        selected.push(
          seat
        );

        status(
          `${seat.text} clicked ✓`
        );
      }

      await sleep(250);
    }

    if (
      selected.length <
      requiredCount
    ) {

      status(
        `Only ${selected.length}/${requiredCount} seat(s) selected.`
      );

      return false;
    }

    status(
      `Selected ${selected.length} seat(s) ✓`
    );

    return true;
  }

  // =========================================================
  // SEAT DETAILS VERIFICATION
  // =========================================================

  function getSeatDetailsText() {

    const body =
      document.body.innerText || '';

    const index =
      body.toLowerCase().indexOf(
        'seat details'
      );

    if (index < 0) {
      return '';
    }

    return normalizeText(
      body.slice(
        index,
        index + 1500
      )
    );
  }

  function verifySeatDetails(
    requiredCount
  ) {

    const text =
      getSeatDetailsText();

    if (!text) {

      log(
        'Seat Details section not detected'
      );

      return false;
    }

    const seatMatches =
      text.match(
        /\b[A-Z]{1,4}\s*[-–]\s*\d+\b/g
      ) || [];

    const unique =
      [
        ...new Set(
          seatMatches.map(
            x =>
              x
                .replace(/\s+/g, '')
                .toUpperCase()
          )
        )
      ];

    log(
      'Seat Details:',
      unique
    );

    return (
      unique.length >=
      requiredCount
    );
  }

  // =========================================================
  // CONTINUE PURCHASE
  // =========================================================

  function findContinuePurchaseButton() {

    const elements = [
      ...document.querySelectorAll(
        'button, a, [role="button"], input[type="button"], input[type="submit"]'
      )
    ];

    for (
      const el of elements
    ) {

      if (!isVisible(el)) {
        continue;
      }

      if (isBotElement(el)) {
        continue;
      }

      const text =
        normalizeText(
          el.innerText ||
          el.value ||
          el.textContent
        );

      if (
        /^CONTINUE PURCHASE$/i.test(
          text
        )
      ) {

        return el;
      }
    }

    return null;
  }

  async function clickContinuePurchase() {

    const button =
      findContinuePurchaseButton();

    if (!button) {

      status(
        'CONTINUE PURCHASE button not found.'
      );

      return false;
    }

    status(
      'Seats selected. Opening next page...'
    );

    setBotState(
      'CONTINUING'
    );

    await sleep(300);

    /*
     * User explicitly wants to proceed
     * to the OTP page.
     */

    button.click();

    await sleep(1000);

    /*
     * Do not fill or bypass OTP.
     */

    if (
      hasSecurityChallenge()
    ) {

      botRunning = false;

      seatPageRunning = false;

      setBotState(
        'OTP / SECURITY'
      );

      status(
        'OTP/security page reached. Manual action required.'
      );

      return true;
    }

    botRunning = false;

    seatPageRunning = false;

    setBotState(
      'DONE'
    );

    status(
      'CONTINUE PURCHASE clicked. Complete OTP manually.'
    );

    return true;
  }

  // =========================================================
  // SEAT PAGE FLOW
  // =========================================================

  async function startSeatSelection() {

    if (seatPageRunning) {
      return;
    }

    seatPageRunning = true;

    const pending =
      getPendingBooking();

    if (pending) {

      /*
       * Restore user preferences from
       * pending booking if panel was created
       * after navigation.
       */

      restorePendingIntoPanel(
        pending
      );
    }

    const settings =
      getSettings();

    const desiredCoach =
      String(
        settings.coach ||
        DEFAULTS.coach
      ).toUpperCase();

    const requiredCount =
      Math.min(
        4,
        Math.max(
          1,
          Number(
            settings.passengerCount
          ) || 1
        )
      );

    setBotState(
      'SEAT SEARCH'
    );

    status(
      `Finding available coach for ${requiredCount} seat(s)...`
    );

    /*
     * Wait for coach information.
     */

    let coachOK = false;

    for (
      let i = 0;
      i < 40;
      i++
    ) {

      if (
        hasSecurityChallenge()
      ) {

        stopForSecurityChallenge();

        return;
      }

      const coaches =
        parseCoachAvailability();

      if (
        coaches.some(
          x => x.count > 0
        )
      ) {

        coachOK =
          await selectCoach(
            desiredCoach
          );

        if (coachOK) {
          break;
        }
      }

      await sleep(500);
    }

    if (!coachOK) {

      status(
        'Could not select an available coach.'
      );

      setBotState(
        'NO COACH'
      );

      seatPageRunning = false;

      return;
    }

    /*
     * Give coach UI time to update.
     */

    await sleep(800);

    const selected =
      await selectRequiredSeats(
        desiredCoach === 'ANY'
          ? getCurrentlySelectedCoach()
          : desiredCoach
      );

    if (!selected) {

      setBotState(
        'NO SEAT'
      );

      seatPageRunning = false;

      return;
    }

    await sleep(700);

    const verified =
      verifySeatDetails(
        requiredCount
      );

    if (!verified) {

      /*
       * Do not block the user permanently if
       * the site doesn't expose Seat Details
       * in a normal DOM representation.
       */

      status(
        'Seat selected. Seat Details verification unavailable; proceeding.'
      );

    } else {

      status(
        'Seat Details verified ✓'
      );
    }

    await sleep(500);

    /*
     * CONTINUE PURCHASE intentionally proceeds
     * to the next page / OTP.
     */

    await clickContinuePurchase();
  }

  // =========================================================
  // CURRENT COACH
  // =========================================================

  function getCurrentlySelectedCoach() {

    const body =
      normalizeText(
        document.body.innerText
      );

    const match =
      body.match(
        /Coach\s*:\s*([A-Z]{1,4})/i
      );

    return match
      ? match[1].toUpperCase()
      : 'ANY';
  }

  // =========================================================
  // RESTORE PENDING SETTINGS
  // =========================================================

  function restorePendingIntoPanel(
    pending
  ) {

    if (!pending) {
      return;
    }

    const set = (
      id,
      value
    ) => {

      const el =
        document.getElementById(id);

      if (
        el &&
        value !== undefined &&
        value !== null
      ) {
        el.value =
          value;
      }
    };

    set(
      'br-from',
      pending.from
    );

    set(
      'br-to',
      pending.to
    );

    set(
      'br-date',
      pending.date
    );

    set(
      'br-class',
      pending.className
    );

    set(
      'br-train-name',
      pending.train
    );

    set(
      'br-train-number',
      pending.trainNumber
    );

    set(
      'br-coach',
      pending.coach
    );

    set(
      'br-passenger-count',
      pending.passengerCount
    );

    set(
      'br-seat-numbers',
      pending.seatNumbers
    );

    set(
      'br-seat-type',
      pending.seatType
    );

    updateTargetPreview();

    log(
      'Pending booking preferences restored'
    );
  }

  // =========================================================
  // CREATE / RESTORE PANEL
  // =========================================================

  function createOrRestorePanel() {

    if (
      !document.getElementById(
        'br-bot-panel'
      )
    ) {

      createBotPanel();

      enableDragging();
    }

    const pending =
      getPendingBooking();

    if (pending) {

      restorePendingIntoPanel(
        pending
      );
    }
  }

  // =========================================================
  // SEAT PAGE OBSERVER
  // =========================================================

  function startSeatObserver() {

    if (seatObserver) {
      seatObserver.disconnect();
    }

    seatObserver =
      new MutationObserver(
        mutations => {

          if (
            !seatPageRunning
          ) {
            return;
          }

          let changed = false;

          for (
            const mutation of mutations
          ) {

            if (
              mutation.target &&
              mutation.target.closest &&
              mutation.target.closest(
                '#br-bot-panel'
              )
            ) {
              continue;
            }

            if (
              mutation.addedNodes &&
              mutation.addedNodes.length
            ) {

              changed = true;

              break;
            }
          }

          if (!changed) {
            return;
          }

          clearTimeout(
            seatRetryTimer
          );

          seatRetryTimer =
            setTimeout(
              () => {

                if (
                  seatPageRunning
                ) {

                  /*
                   * Observer is mainly for
                   * dynamic coach/seat rendering.
                   *
                   * Don't start a second full
                   * selection if already done.
                   */

                  log(
                    'Seat page changed'
                  );
                }

              },
              500
            );
        }
      );

    seatObserver.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );
  }

  // =========================================================
  // WAIT / AUTO RESUME AFTER NAVIGATION
  // =========================================================

  async function resumePendingBooking() {

    const pending =
      getPendingBooking();

    if (!pending) {
      return;
    }

    if (!isSeatPage()) {
      return;
    }

    createOrRestorePanel();

    await sleep(1000);

    if (
      hasSecurityChallenge()
    ) {

      stopForSecurityChallenge();

      return;
    }

    setBotState(
      'SEAT PAGE'
    );

    status(
      'Pending booking found. Starting seat selection...'
    );

    startSeatSelection();
  }

  // =========================================================
  // WAIT FOR RESULTS
  // =========================================================

  async function waitForResults(
    runId
  ) {

    status(
      'Waiting for search results...'
    );

    setBotState(
      'SEARCHING'
    );

    for (
      let i = 0;
      i < 60;
      i++
    ) {

      if (
        !currentRunIsValid(
          runId
        )
      ) {
        return false;
      }

      await sleep(500);

      if (
        !currentRunIsValid(
          runId
        )
      ) {
        return false;
      }

      if (
        hasSecurityChallenge()
      ) {

        stopForSecurityChallenge();

        return false;
      }

      if (
        !isResultsPage()
      ) {
        continue;
      }

      status(
        'Results page detected. Looking for target train...'
      );

      await sleep(500);

      if (
        !currentRunIsValid(
          runId
        )
      ) {
        return false;
      }

      const found =
        processTargetResult();

      if (found) {

        startResultsObserver(
          runId
        );

        return true;
      }
    }

    status(
      'Results not detected automatically.'
    );

    setBotState(
      'READY'
    );

    return false;
  }

  // =========================================================
  // RESULTS OBSERVER
  // =========================================================

  function startResultsObserver(
    runId
  ) {

    disconnectObserver();

    resultsObserver =
      new MutationObserver(
        mutations => {

          if (
            !currentRunIsValid(
              runId
            )
          ) {
            return;
          }

          let websiteChanged =
            false;

          for (
            const mutation of mutations
          ) {

            const target =
              mutation.target;

            if (
              target &&
              target.closest &&
              target.closest(
                '#br-bot-panel'
              )
            ) {
              continue;
            }

            for (
              const node of
              mutation.addedNodes
            ) {

              if (
                node.nodeType !==
                Node.ELEMENT_NODE
              ) {
                continue;
              }

              if (
                node.closest &&
                node.closest(
                  '#br-bot-panel'
                )
              ) {
                continue;
              }

              websiteChanged =
                true;

              break;
            }

            if (
              websiteChanged
            ) {
              break;
            }
          }

          if (!websiteChanged) {
            return;
          }

          clearBotTimers();

          resultRetryTimer =
            setTimeout(
              () => {

                if (
                  !currentRunIsValid(
                    runId
                  )
                ) {
                  return;
                }

                if (
                  !isResultsPage()
                ) {
                  return;
                }

                processTargetResult();

              },
              350
            );
        }
      );

    resultsObserver.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );
  }

  // =========================================================
  // MAIN SEARCH
  // =========================================================

  async function startSearch() {

    if (searchRunning) {
      return;
    }

    botRunning = true;

    searchRunning = true;

    searchRunId++;

    const runId =
      searchRunId;

    clearBotTimers();

    disconnectObserver();

    updateTargetTrain();

    saveSettings();

    const startButton =
      document.getElementById(
        'br-start-search'
      );

    if (startButton) {
      startButton.disabled = true;
    }

    const results =
      document.getElementById(
        'br-results'
      );

    if (results) {
      results.innerHTML = '';
    }

    setBotState(
      'RUNNING'
    );

    if (
      !targetTrain.name &&
      !targetTrain.number
    ) {

      status(
        'Please enter a target train.'
      );

      stopBot(
        false
      );

      return;
    }

    try {

      const from =
        document.getElementById(
          'br-from'
        ).value.trim();

      const to =
        document.getElementById(
          'br-to'
        ).value.trim();

      const date =
        document.getElementById(
          'br-date'
        ).value.trim();

      const className =
        document.getElementById(
          'br-class'
        ).value;

      status(
        'Finding station fields...'
      );

      const stationInputs =
        findStationInputs();

      if (
        stationInputs.length < 2
      ) {

        status(
          'Could not find station inputs.'
        );

        return;
      }

      if (
        !currentRunIsValid(
          runId
        )
      ) {
        return;
      }

      const fromOK =
        await selectStation(
          stationInputs[0],
          from
        );

      if (
        !currentRunIsValid(
          runId
        ) ||
        !fromOK
      ) {
        return;
      }

      await sleep(400);

      const refreshedInputs =
        findStationInputs();

      const toInput =
        refreshedInputs[1] ||
        stationInputs[1];

      const toOK =
        await selectStation(
          toInput,
          to
        );

      if (
        !currentRunIsValid(
          runId
        ) ||
        !toOK
      ) {
        return;
      }

      await sleep(500);

      const dateOK =
        await selectDate(
          date
        );

      if (
        !currentRunIsValid(
          runId
        ) ||
        !dateOK
      ) {

        status(
          'Date selection failed.'
        );

        return;
      }

      await sleep(400);

      const classOK =
        await selectClass(
          className
        );

      if (
        !currentRunIsValid(
          runId
        ) ||
        !classOK
      ) {

        status(
          'Class selection failed.'
        );

        return;
      }

      await sleep(400);

      const searchOK =
        await clickSearch();

      if (
        !currentRunIsValid(
          runId
        ) ||
        !searchOK
      ) {
        return;
      }

      await waitForResults(
        runId
      );

    } catch (error) {

      console.error(
        '[BR BOT ERROR]',
        error
      );

      status(
        'Error: ' +
        (
          error.message ||
          error
        )
      );

    } finally {

      searchRunning = false;

      if (
        startButton &&
        botRunning
      ) {

        startButton.disabled =
          false;
      }
    }
  }

  // =========================================================
  // DRAG
  // =========================================================

  function enableDragging() {

    const panel =
      document.getElementById(
        'br-bot-panel'
      );

    const header =
      document.getElementById(
        'br-bot-header'
      );

    if (
      !panel ||
      !header
    ) {
      return;
    }

    let dragging = false;

    let offsetX = 0;

    let offsetY = 0;

    header.addEventListener(
      'mousedown',
      event => {

        if (
          event.target.closest(
            'button, input, select'
          )
        ) {
          return;
        }

        dragging = true;

        const rect =
          panel.getBoundingClientRect();

        offsetX =
          event.clientX -
          rect.left;

        offsetY =
          event.clientY -
          rect.top;

        panel.style.right =
          'auto';

        event.preventDefault();
      }
    );

    document.addEventListener(
      'mousemove',
      event => {

        if (!dragging) {
          return;
        }

        panel.style.left =
          `${
            event.clientX -
            offsetX
          }px`;

        panel.style.top =
          `${
            event.clientY -
            offsetY
          }px`;
      }
    );

    document.addEventListener(
      'mouseup',
      () => {

        dragging = false;
      }
    );
  }

  // =========================================================
  // INIT
  // =========================================================

  function init() {

    if (
      document.getElementById(
        'br-bot-panel'
      )
    ) {
      return;
    }

    createBotPanel();

    enableDragging();

    updateTargetPreview();

    /*
     * If BOOK NOW caused a full page navigation,
     * the old JS context is gone. The pending
     * booking stored in localStorage allows
     * the new page to resume.
     */

    if (
      isSeatPage()
    ) {

      setTimeout(
        () => {

          resumePendingBooking();

        },
        1200
      );
    }

    log(
      'Bangladesh Railway Search & Seat Helper v6.4.0 ready'
    );
  }

  // =========================================================
  // START
  // =========================================================

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      () => {

        setTimeout(
          init,
          1000
        );

      }
    );

  } else {

    setTimeout(
      init,
      1000
    );
  }

})();
