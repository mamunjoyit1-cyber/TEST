// ==UserScript==
// @name         Bangladesh Railway Search Helper
// @namespace    http://tampermonkey.net/
// @version      6.0.0
// @description  Bangladesh Railway search helper with direct train targeting
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

  const DEFAULTS = {
    from: 'Dhaka',
    to: 'Chattogram',
    date: '23-Sep-2026',
    className: 'SNIGDHA',

    // Example:
    // MAHANAGAR PROVATI (704)
    train: 'MAHANAGAR PROVATI',
    trainNumber: '704'
  };

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

  let botRunning = false;

  let searchRunning = false;

  let searchRunId = 0;

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
  }

  function disconnectObserver() {

    if (resultsObserver) {

      resultsObserver.disconnect();

      resultsObserver = null;
    }
  }

  function stopBot(
    showMessage = true
  ) {

    botRunning = false;

    searchRunning = false;

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
        'Bot stopped. No automatic actions will continue.'
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
            Direct Train Search
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
            placeholder="Example: MAHANAGAR PROVATI"
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
            placeholder="Example: 704"
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
    }

    if (trainNumber) {

      trainNumber.addEventListener(
        'input',
        updateTargetPreview
      );
    }

    log(
      'Railway Bot v6.0.0 panel created'
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

      /* TARGET TRAIN */

      .br-target-section {

        margin-top: 13px;

        padding: 10px;

        border:
          1px solid #ddd;

        border-radius: 10px;

        background: #fafafa;
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

      .br-target-section .br-input {

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
  // FIND ONLY TARGET TRAIN CONTAINER
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

        /*
         * Train number is the strongest
         * identifier.
         */

        const numberMatch =
          train.number &&
          new RegExp(
            `\\(${train.number}\\)`
          ).test(
            text
          );

        /*
         * Name is a secondary identifier.
         */

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

    /*
     * Search smaller visible elements first.
     */

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

      /*
       * Avoid selecting a giant parent
       * containing several classes.
       */

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

    /*
     * Fallback: walk from BOOK NOW buttons.
     */

    const buttons = [
      ...trainContainer.querySelectorAll(
        'button, a'
      )
    ];

    for (
      const button of buttons
    ) {

      if (!isVisible(button)) {
        continue;
      }

      const text =
        normalizeText(
          button.innerText ||
          button.textContent
        );

      if (
        !/BOOK NOW/i.test(text)
      ) {
        continue;
      }

      let current =
        button.parentElement;

      for (
        let level = 0;
        level < 7 && current;
        level++
      ) {

        const currentText =
          normalizeText(
            current.innerText
          );

        if (
          classRegex.test(
            currentText
          )
        ) {

          const matches =
            currentText.match(
              new RegExp(
                `\\b(${CLASSES.join('|')})\\b`,
                'gi'
              )
            ) || [];

          const unique =
            [
              ...new Set(
                matches.map(
                  x =>
                    x.toUpperCase()
                )
              )
            ];

          if (
            unique.length === 1
          ) {

            return current;
          }
        }

        current =
          current.parentElement;
      }
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

    /*
     * Fallback for availability.
     */

    if (
      available === null
    ) {

      const numbers =
        text.match(
          /\b\d+\b/g
        ) || [];

      /*
       * Don't blindly use train number.
       * Prefer numbers after "Available".
       */

      const lower =
        text.toLowerCase();

      const availableIndex =
        lower.indexOf(
          'available'
        );

      if (
        availableIndex >= 0
      ) {

        const after =
          text.slice(
            availableIndex
          );

        const match =
          after.match(
            /\b(\d+)\b/
          );

        if (match) {

          available =
            Number(
              match[1]
            );
        }
      }

      if (
        available === null &&
        numbers.length
      ) {

        const last =
          Number(
            numbers[
              numbers.length - 1
            ]
          );

        if (
          Number.isFinite(last)
        ) {
          available = last;
        }
      }
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

    /*
     * Verify again before accepting.
     */

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

      /*
       * If number matched, name mismatch
       * is allowed because the website text
       * may have formatting differences.
       */

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
  // HANDLE TARGET
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
        `Target train found. Waiting for ${document.getElementById('br-class')?.value || DEFAULTS.className}...`
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

    /*
     * We have found:
     *
     * target train
     * target class
     * actual BOOK NOW
     *
     * Do not automatically click here.
     *
     * The user should still press the
     * BOOK NOW action in the bot.
     */

    setBotState(
      'READY TO BOOK'
    );

    status(
      'Target train + class found. BOOK NOW is ready.'
    );

    showBookButton(
      result
    );

    return true;
  }

  // =========================================================
  // SHOW BOOK BUTTON
  // =========================================================

  function showBookButton(
    result
  ) {

    const resultsEl =
      document.getElementById(
        'br-results'
      );

    if (!resultsEl) {
      return;
    }

    const option =
      result.classOption;

    const available =
      option
        ? option.available
        : null;

    const disabled =
      !option ||
      !option.bookButton ||
      available === 0;

    resultsEl.innerHTML = `

      <div class="br-target-found">

        <div
          class="br-target-found-title"
        >
          🎯 TARGET READY
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
            option?.price
              ? escapeHtml(
                  option.price
                )
              : 'Price unavailable'
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

        <button
          id="br-book-target"
          class="br-book-target"
          ${
            disabled
              ? 'disabled'
              : ''
          }
        >
          📌 BOOK NOW
        </button>

      </div>

    `;

    const book =
      document.getElementById(
        'br-book-target'
      );

    if (book) {

      book.addEventListener(
        'click',
        event => {

          event.stopPropagation();

          clickTargetBook(
            result
          );
        }
      );
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

    status(
      `Opening ${result.train.name} → ${option.className}...`
    );

    setBotState(
      'BOOKING'
    );

    /*
     * Only here do we click the
     * website's actual BOOK NOW.
     */

    option.bookButton.click();

    /*
     * Stop after BOOK NOW.
     */

    botRunning = false;

    searchRunning = false;

    searchRunId++;

    clearBotTimers();

    disconnectObserver();

    setBotState(
      'STOPPED'
    );

    status(
      'BOOK NOW clicked. Bot stopped.'
    );
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
        !isResultsPage()
      ) {
        continue;
      }

      status(
        'Results page detected. Looking for target train...'
      );

      /*
       * Give the result cards time to render.
       */

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

    /*
     * Validate target train first.
     */

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

      // -----------------------------------------------------
      // STATIONS
      // -----------------------------------------------------

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

      // -----------------------------------------------------
      // FROM
      // -----------------------------------------------------

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

      // -----------------------------------------------------
      // TO
      // -----------------------------------------------------

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

      // -----------------------------------------------------
      // DATE
      // -----------------------------------------------------

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

      // -----------------------------------------------------
      // CLASS
      // -----------------------------------------------------

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

      // -----------------------------------------------------
      // SEARCH
      // -----------------------------------------------------

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

      // -----------------------------------------------------
      // RESULTS
      // -----------------------------------------------------

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

    log(
      'Bangladesh Railway Search Helper v6.0.0 ready'
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
