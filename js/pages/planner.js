/* planner.js
   The Planner page (index.html): your open source dashboard.
   1. Focus timer: aim for 2 hours of open source every day. Pick a program, press Start.
   2. Today: what you logged today, PRs, and your goal streak.
   3. Overall: total hours, days the goal was met, merged PRs, PRs in review.
   4. Last 14 days (hours per day vs the 2-hour line) and a 16-week consistency grid.
   5. One card per program: hours, entries and PRs.
   You add work entries on each program's own page (GSoC, ESoC, LFX, SoB). */

(function (App) {
  const esc = App.esc;
  const GOAL = App.GOAL_SECONDS;
  let pick = (App.timerRunning() && App.timerRunning().program) || App.PROGRAM_ORDER[0];

  // ---------- small helpers ----------
  function clock(sec) {
    sec = Math.max(0, Math.floor(sec));
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
  function hm(sec) {
    const h = Math.floor(sec / 3600), m = Math.round(sec % 3600 / 60);
    if (!h) return m + 'm';
    return h + 'h' + (m ? ' ' + m + 'm' : '');
  }
  function hours1(sec) { return (sec / 3600).toFixed(sec >= 36000 ? 0 : 1); }
  function greeting() {
    const h = new Date().getHours();
    return h < 5 ? 'Late night push' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  // ---------- 1. focus timer ----------
  const R = 92, C = 2 * Math.PI * R;
  function ringHTML() {
    return '<svg class="os-tring" viewBox="0 0 220 220" aria-hidden="true">' +
      '<circle cx="110" cy="110" r="' + R + '" fill="none" stroke="var(--track)" stroke-width="12"/>' +
      '<circle id="ring-fill" cx="110" cy="110" r="' + R + '" fill="none" stroke="var(--accent)" stroke-width="12" stroke-linecap="round" ' +
      'stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '" transform="rotate(-90 110 110)"/>' +
      '<circle id="ring-extra" cx="110" cy="110" r="' + (R - 16) + '" fill="none" stroke="var(--success)" stroke-width="4" stroke-linecap="round" ' +
      'stroke-dasharray="' + (2 * Math.PI * (R - 16)) + '" stroke-dashoffset="' + (2 * Math.PI * (R - 16)) + '" transform="rotate(-90 110 110)" opacity="0"/>' +
      '</svg>';
  }

  function splitBarHTML(by) {
    const total = Object.keys(by).reduce(function (n, k) { return n + by[k]; }, 0);
    if (!total) return '<div class="os-split-bar is-empty"><span style="width:100%"></span></div>' +
      '<p class="os-hint">Time per program shows here once you start.</p>';
    const segs = App.PROGRAM_ORDER.filter(function (id) { return by[id]; }).map(function (id) {
      return '<span style="width:' + (by[id] / total * 100) + '%;--prog:var(--' + id + ')" title="' + App.PROGRAMS[id].short + ': ' + hm(by[id]) + '"></span>';
    }).join('');
    const legend = App.PROGRAM_ORDER.filter(function (id) { return by[id]; }).map(function (id) {
      return '<span class="os-legend__i" style="--prog:var(--' + id + ')">' + esc(App.PROGRAMS[id].short) + ' <b class="os-mono">' + hm(by[id]) + '</b></span>';
    }).join('');
    return '<div class="os-split-bar">' + segs + '</div><div class="os-legend">' + legend + '</div>';
  }

  function timerHTML() {
    const running = App.timerRunning();
    const chips = App.PROGRAM_ORDER.map(function (id) {
      const on = id === pick;
      return '<button type="button" class="os-pchip' + (on ? ' is-on' : '') + '" style="--prog:var(--' + id + ')" data-pick="' + id + '" aria-pressed="' + on + '">' +
        esc(App.PROGRAMS[id].short) + '</button>';
    }).join('');
    return '<section class="os-card os-timer' + (running ? ' is-running' : '') + '" aria-label="Focus timer">' +
      '<div class="os-timer__top"><div><p class="os-label">Focus timer</p><h2 class="os-h2">2 hours of open source a day</h2></div>' +
      '<span class="os-live" ' + (running ? '' : 'hidden') + '><i></i>Running</span></div>' +
      '<div class="os-timer__main">' +
      '<div class="os-timer__ring">' + ringHTML() +
      '<div class="os-timer__center"><span class="os-timer__time os-mono" id="t-time">0:00:00</span>' +
      '<span class="os-timer__of">of 2:00:00 today</span><span class="os-timer__pct os-mono" id="t-pct">0%</span></div></div>' +
      '<div class="os-timer__side">' +
      '<p class="os-label">Working on</p><div class="os-pchips" role="group" aria-label="Program to time">' + chips + '</div>' +
      '<button type="button" class="os-btn os-btn--primary os-timer__go" data-timer="' + (running ? 'stop' : 'start') + '">' +
      App.icon(running ? 'pause' : 'play') + (running ? 'Pause' : 'Start focus') + '</button>' +
      '<p class="os-timer__msg" id="t-msg"></p>' +
      '<div id="t-split">' + splitBarHTML(App.focusOn(App.todayKey())) + '</div>' +
      '</div></div></section>';
  }

  // Runs every second: only the numbers and the ring move, the rest of the page stays.
  function tick() {
    const today = App.todayKey();
    const done = App.focusTotal(today);
    const running = App.timerRunning();
    const t = document.getElementById('t-time');
    if (!t) return;
    t.textContent = clock(done);
    document.getElementById('t-pct').textContent = Math.floor(done / GOAL * 100) + '%';
    document.getElementById('ring-fill').setAttribute('stroke-dashoffset', C * (1 - Math.min(1, done / GOAL)));
    const extra = document.getElementById('ring-extra');
    const c2 = 2 * Math.PI * (R - 16);
    extra.setAttribute('opacity', done > GOAL ? '1' : '0');
    extra.setAttribute('stroke-dashoffset', c2 * (1 - Math.min(1, (done - GOAL) / GOAL)));
    const msg = document.getElementById('t-msg');
    if (done >= GOAL) msg.innerHTML = '<b>Goal reached.</b> ' + (done > GOAL ? hm(done - GOAL) + ' extra today.' : 'Nice work.');
    else if (running) msg.innerHTML = 'On <b>' + esc(App.PROGRAMS[running.program].short) + '</b> since ' + new Date(running.since).toTimeString().slice(0, 5) + '. ' + hm(GOAL - done) + ' to go.';
    else msg.innerHTML = done ? hm(GOAL - done) + ' left to reach today\'s goal.' : 'Pick a program and press Start.';
    if (running && Date.now() % 15000 < 1000) document.getElementById('t-split').innerHTML = splitBarHTML(App.focusOn(today));
  }

  // ---------- 2. today ----------
  function todayHTML() {
    const today = App.todayKey();
    let entries = 0, prs = 0;
    const rows = App.PROGRAM_ORDER.map(function (id) {
      const list = App.getLog(today, id);
      entries += list.length;
      const n = list.reduce(function (a, e) { return a + App.entryPRs(e).length; }, 0);
      prs += n;
      const orgs = list.map(function (e) { return esc(e.org); }).filter(function (v, i, a) { return a.indexOf(v) === i; }).join(', ');
      return '<a class="os-todayrow" href="' + App.PROGRAMS[id].page + '" style="--prog:var(--' + id + ')">' +
        '<span class="os-todayrow__name">' + esc(App.PROGRAMS[id].short) + '</span>' +
        '<span class="os-todayrow__what">' + (list.length ? orgs : '<span class="os-muted">Nothing yet</span>') + '</span>' +
        '<span class="os-todayrow__n os-mono">' + list.length + (n ? ' · ' + n + ' PR' + (n > 1 ? 's' : '') : '') + '</span>' + App.icon('right') + '</a>';
    }).join('');
    const streak = App.goalStreak();
    return '<section class="os-card os-today" aria-label="Today">' +
      '<div class="os-today__head"><div><p class="os-label">' + greeting() + '</p>' +
      '<h2 class="os-today__day">' + App.dayName(today) + '</h2><p class="os-plan-date__num os-mono">' + App.formatDate(today) + '</p></div>' +
      '<div class="os-streak" title="Days in a row with 2 hours done"><span class="os-streak__n os-mono">' + streak + '</span>' +
      '<span class="os-streak__l">day' + (streak === 1 ? '' : 's') + '<br>goal streak</span></div></div>' +
      '<div class="os-today__nums"><div><span class="os-num-md os-mono">' + entries + '</span><span class="os-label">entries today</span></div>' +
      '<div><span class="os-num-md os-mono">' + prs + '</span><span class="os-label">PRs today</span></div></div>' +
      '<div class="os-todayrows">' + rows + '</div>' +
      '<p class="os-hint">Tap a program to add today\'s work on its page.</p></section>';
  }

  // ---------- 3. overall ----------
  function overallHTML(sum) {
    let total = 0, met = 0;
    App.focusAllDays().forEach(function (d) { const t = App.focusTotal(d); total += t; if (t >= GOAL) met++; });
    function tile(label, num, note, icon) {
      return '<div class="os-stat os-stat--fancy"><span class="os-stat__icon">' + App.icon(icon) + '</span>' +
        '<span class="os-label">' + label + '</span><span class="os-num-lg">' + num + '</span><span class="os-stat__note">' + note + '</span></div>';
    }
    return '<div class="os-grid-4 os-section">' +
      tile('Focus hours', hours1(total), 'All time, all programs', 'clock') +
      tile('Goal days', met, 'Days with 2 hours or more', 'check') +
      tile('Merged PRs', sum.merged, 'Across every program', 'branch') +
      tile('PRs in review', sum.review, sum.activeDays + ' active days logged', 'issue') +
      '</div>';
  }

  // ---------- 4. charts ----------
  function weekChartHTML() {
    const today = App.todayKey();
    const days = [];
    for (let i = 13; i >= 0; i--) days.push(App.addDays(today, -i));
    const vals = days.map(function (d) { return App.focusTotal(d); });
    const top = Math.max(GOAL * 1.5, Math.max.apply(null, vals));
    const goalPct = GOAL / top * 100;
    const bars = days.map(function (d, i) {
      const v = vals[i], h = v / top * 100;
      const cls = v >= GOAL ? ' is-met' : '';
      return '<div class="os-wbar' + (d === today ? ' is-today' : '') + '" title="' + App.dayName(d) + ' ' + App.formatDate(d) + ': ' + (v ? hm(v) : 'no focus time') + '">' +
        '<span class="os-wbar__fill' + cls + '" style="height:' + h + '%"></span></div>';
    }).join('');
    const labels = days.map(function (d) {
      return '<span class="os-wbar__d' + (d === today ? ' is-today' : '') + '">' + App.dayName(d).charAt(0) + '</span>';
    }).join('');
    const avg = vals.reduce(function (a, b) { return a + b; }, 0) / 14;
    return '<section class="os-card os-chartcard" aria-label="Last 14 days">' +
      '<div class="os-chartcard__head"><div><p class="os-label">Last 14 days</p><h2 class="os-h2">Focus time per day</h2></div>' +
      '<span class="os-card__meta">avg ' + hm(avg) + ' / day</span></div>' +
      '<div class="os-wchart"><div class="os-wchart__goal" style="bottom:' + goalPct + '%"><span>2h goal</span></div>' + bars + '</div>' +
      '<div class="os-wchart__labels">' + labels + '</div>' +
      '<table class="os-sr"><caption>Focus time per day</caption>' + days.map(function (d, i) { return '<tr><td>' + App.formatDate(d) + '</td><td>' + hm(vals[i]) + '</td></tr>'; }).join('') + '</table>' +
      '</section>';
  }

  function heatHTML() {
    const today = App.todayKey();
    const start = App.addDays(App.weekStart(today), -15 * 7); // 16 weeks, Monday first
    const cells = [];
    for (let d = start; d <= App.addDays(App.weekStart(today), 6); d = App.addDays(d, 1)) {
      const v = d > today ? -1 : App.focusTotal(d);
      const l = v < 0 ? 'f' : v === 0 ? 0 : v >= GOAL ? 4 : v >= GOAL * .66 ? 3 : v >= GOAL * .33 ? 2 : 1;
      cells.push('<span class="os-hcell" data-l="' + l + '"' + (d === today ? ' data-today' : '') + ' title="' + App.formatDate(d) + ': ' + (v > 0 ? hm(v) : v < 0 ? 'coming up' : 'no focus time') + '"></span>');
    }
    return '<section class="os-card os-chartcard" aria-label="Consistency">' +
      '<div class="os-chartcard__head"><div><p class="os-label">Last 16 weeks</p><h2 class="os-h2">Consistency</h2></div></div>' +
      '<div class="os-hgrid">' + cells.join('') + '</div>' +
      '<div class="os-hlegend">0 <span class="os-hcell" data-l="0"></span><span class="os-hcell" data-l="1"></span><span class="os-hcell" data-l="2"></span>' +
      '<span class="os-hcell" data-l="3"></span><span class="os-hcell" data-l="4"></span> 2h+</div></section>';
  }

  // ---------- 5. program cards ----------
  function programsHTML(sum) {
    const today = App.todayKey(), monday = App.weekStart(today);
    const allDays = App.focusAllDays();
    return '<div class="os-grid-4 os-section os-pcards">' + App.PROGRAM_ORDER.map(function (id) {
      const info = App.PROGRAMS[id];
      let week = 0, total = 0, entries = 0;
      allDays.forEach(function (d) { const s = App.focusOn(d)[id] || 0; total += s; if (d >= monday) week += s; });
      Object.keys(App.data.log || {}).forEach(function (d) { entries += App.getLog(d, id).length; });
      const merged = sum.prs.filter(function (p) { return p.program === id && p.status === 'merged'; }).length;
      const review = sum.prs.filter(function (p) { return p.program === id && p.status === 'review'; }).length;
      const weekPct = Math.min(100, week / (GOAL * 7) * 100);
      return '<a class="os-pcard" href="' + info.page + '" style="--prog:var(--' + id + ')">' +
        '<div class="os-pcard__top"><span class="os-pcard__dot">' + esc(info.short.charAt(0)) + '</span><span class="os-pcard__name">' + esc(info.short) + '</span>' + App.icon('right') + '</div>' +
        '<span class="os-pcard__hours os-mono">' + hours1(total) + '<small>h</small></span>' +
        '<span class="os-pcard__sub">' + hm(week) + ' this week</span>' +
        '<span class="os-pcard__bar"><span style="width:' + weekPct + '%"></span></span>' +
        '<span class="os-pcard__facts"><span><b class="os-mono">' + merged + '</b> merged</span><span><b class="os-mono">' + review + '</b> in review</span><span><b class="os-mono">' + entries + '</b> entries</span></span>' +
        '</a>';
    }).join('') + '</div>';
  }

  // ---------- page ----------
  App.render = function () {
    const sum = App.prSummary();
    App.mount(document.getElementById('app'),
      '<div class="os-dash-head"><p class="os-label">Your open source dashboard</p><h1 class="os-h1">Planner</h1></div>' +
      '<div class="os-hero">' + timerHTML() + todayHTML() + '</div>' +
      overallHTML(sum) +
      '<div class="os-split os-section os-charts">' + weekChartHTML() + heatHTML() + '</div>' +
      '<div class="os-section-head os-section"><h2 class="os-label">Programs</h2></div>' +
      programsHTML(sum));
    tick();
  };

  setInterval(tick, 1000);

  document.addEventListener('click', function (ev) {
    const chip = ev.target.closest('[data-pick]');
    if (chip) {
      pick = chip.dataset.pick;
      const r = App.timerRunning();
      if (r && r.program !== pick) App.startTimer(pick); // switch program: time so far stays with the old one
      App.render();
      return;
    }
    const btn = ev.target.closest('[data-timer]');
    if (!btn) return;
    if (btn.dataset.timer === 'start') App.startTimer(pick);
    else App.stopTimer();
    App.render();
  });
})(window.App);
