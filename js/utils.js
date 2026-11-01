/* utils.js
   Small helpers used on every page: icons, safe text, ids and dates.
   Every file adds its code to one shared object called App, so files can
   use each other's functions without a build tool
   (build tool = a program that joins many files into one). */

window.App = window.App || {};

(function (App) {
  // ---------- icons (simple line drawings, 24x24) ----------
  const ICONS = {
    plus: 'M12 5v14M5 12h14',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3',
    edit: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    ext: 'M7 17L17 7M9 7h8v8',
    lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
    left: 'M15 6l-6 6 6 6',
    right: 'M9 6l6 6-6 6',
    down: 'M6 9l6 6 6-6',
    x: 'M6 6l12 12M18 6L6 18',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
    doc: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
    org: 'M4 21V7l8-4 8 4v14M9 21v-6h6v6M8 10h.01M12 10h.01M16 10h.01',
    book: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11',
    flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
    calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4'
  };

  App.icon = function (name) {
    return '<span class="os-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="' + (ICONS[name] || '') + '"/></svg></span>';
  };

  // ---------- safe text ----------
  // esc = escape. Turns < > & " ' into codes so typed text can never break the page.
  App.esc = function (value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  // uid = unique id for each saved item, like "lq3k9x2ab".
  App.uid = function () {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  };

  // A link the user typed, made safe and clickable.
  App.safeUrl = function (text) {
    const t = String(text || '').trim();
    if (!t) return '';
    return /^https?:\/\//i.test(t) ? t : 'https://' + t;
  };
  App.shortUrl = function (text) {
    return String(text || '').trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
  };

  // ---------- dates ----------
  // Dates are saved as text keys:
  //   "2026-11-01" = an exact day
  //   "2027-02"    = only the month is known
  // Text keys sort in the right order and are easy to read in the saved data.
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  App.MONTHS = MONTHS;

  function pad(n) { return String(n).padStart(2, '0'); }

  App.toKey = function (date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  };
  App.fromKey = function (key) {
    const p = key.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2] || 1);
  };
  App.todayKey = function () { return App.toKey(new Date()); };
  App.addDays = function (key, n) {
    const d = App.fromKey(key);
    d.setDate(d.getDate() + n);
    return App.toKey(d);
  };
  // Monday of the week that holds this day
  App.weekStart = function (key) {
    const d = App.fromKey(key);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return App.toKey(d);
  };
  App.weekDays = function (startKey) {
    return [0, 1, 2, 3, 4, 5, 6].map(function (i) { return App.addDays(startKey, i); });
  };
  App.isMonthOnly = function (key) { return /^\d{4}-\d{2}$/.test(key || ''); };
  App.isDayKey = function (key) { return /^\d{4}-\d{2}-\d{2}$/.test(key || ''); };

  // "2026-11-01" -> "01.11.2026", "2027-02" -> "Feb 2027"
  App.formatDate = function (key) {
    if (!key) return '';
    const p = key.split('-');
    if (p.length === 2) return MONTHS[Number(p[1]) - 1] + ' ' + p[0];
    return p[2] + '.' + p[1] + '.' + p[0];
  };
  App.dayName = function (key) { return DAYS[App.fromKey(key).getDay()]; };

  App.daysUntil = function (key) {
    return Math.round((App.fromKey(key) - App.fromKey(App.todayKey())) / 86400000);
  };

  // Is this date already over? A month counts as over once the month has ended.
  App.isPast = function (key) {
    const today = App.todayKey();
    return App.isMonthOnly(key) ? key < today.slice(0, 7) : key < today;
  };

  // How long until a date, in plain words. urgent = under 14 days away.
  App.countdown = function (key) {
    if (App.isMonthOnly(key)) {
      const now = App.todayKey().slice(0, 7);
      if (key < now) return { text: 'passed', urgent: false, past: true };
      if (key === now) return { text: 'this month', urgent: false };
      const a = now.split('-').map(Number);
      const b = key.split('-').map(Number);
      const months = (b[0] - a[0]) * 12 + (b[1] - a[1]);
      return { text: months === 1 ? 'next month' : 'in about ' + months + ' months', urgent: false };
    }
    const n = App.daysUntil(key);
    if (n < 0) return { text: 'passed', urgent: false, past: true };
    if (n === 0) return { text: 'today', urgent: true };
    if (n === 1) return { text: 'tomorrow', urgent: true };
    return { text: 'in ' + n + ' days', urgent: n < 14 };
  };

  App.countdownHTML = function (key) {
    const c = App.countdown(key);
    return '<span class="os-count' + (c.urgent ? ' is-urgent' : '') + '">' + App.icon('clock') + App.esc(c.text) + '</span>';
  };
})(window.App);
