/* progress.js
   Progress page: your daily reports.
   Top: focus hours, days the 2-hour goal was met, tasks done, active days, merged PRs.
   Then one card per program: hours, time this week, tasks done, work entries, merged PRs.
   Below: one report per day (newest first): focus time vs the goal, time per program,
   the tasks you planned and finished, the work you logged, and PRs opened or updated.
   Everything is read from what you already saved (timer, Today's tasks, work log, Add PR). */

(function (App) {
  const esc = App.esc;
  const GOAL = App.GOAL_SECONDS;
  let showDays = 14;

  function hm(sec) {
    sec = Math.round(sec);
    const h = Math.floor(sec / 3600), m = Math.round(sec % 3600 / 60);
    if (!h) return m + 'm';
    return h + 'h' + (m ? ' ' + m + 'm' : '');
  }
  function tag(id) {
    return '<span class="os-task__tag" style="--prog:var(--' + id + ')">' + esc(App.PROGRAMS[id] ? App.PROGRAMS[id].short : id) + '</span>';
  }

  // Every day that has anything saved, newest first.
  function activeDays() {
    const days = {};
    App.focusAllDays().forEach(function (d) { if (App.focusTotal(d) > 0) days[d] = true; });
    Object.keys(App.data.todos || {}).forEach(function (d) { if (App.getTodos(d).length) days[d] = true; });
    Object.keys(App.data.log || {}).forEach(function (d) { days[d] = true; });
    App.getPRs().forEach(function (p) { if (p.opened) days[p.opened] = true; if (p.updated) days[p.updated] = true; });
    days[App.todayKey()] = true;
    return Object.keys(days).filter(function (d) { return d <= App.todayKey(); }).sort().reverse();
  }

  // ---------- top numbers ----------
  function tilesHTML(sum) {
    let total = 0, met = 0;
    App.focusAllDays().forEach(function (d) { const t = App.focusTotal(d); total += t; if (t >= GOAL) met++; });
    function tile(label, num, note, icon) {
      return '<div class="os-stat os-stat--fancy"><span class="os-stat__icon">' + App.icon(icon) + '</span>' +
        '<span class="os-label">' + label + '</span><span class="os-num-lg">' + num + '</span><span class="os-stat__note">' + note + '</span></div>';
    }
    return '<div class="os-tiles5">' +
      tile('Focus hours', (total / 3600).toFixed(1), 'All time', 'clock') +
      tile('Goal days', met, 'Days with 2 hours or more', 'check') +
      tile('Tasks done', App.todosDone(), 'From Today\'s tasks', 'calendar') +
      tile('Active days', sum.activeDays, 'Days you logged work or a PR', 'org') +
      tile('Merged PRs', sum.merged, sum.review + ' in review' + (sum.closed ? ' · ' + sum.closed + ' closed' : ''), 'branch') +
      '</div>';
  }

  // ---------- one card per program ----------
  function programsHTML() {
    const today = App.todayKey(), monday = App.weekStart(today);
    const allDays = App.focusAllDays();
    const sum = App.prSummary();
    return '<div class="os-grid-4 os-pcards">' + App.PROGRAM_ORDER.map(function (id) {
      const info = App.PROGRAMS[id];
      let week = 0, total = 0, entries = 0, tasksDone = 0;
      allDays.forEach(function (d) { const s = App.focusOn(d)[id] || 0; total += s; if (d >= monday) week += s; });
      Object.keys(App.data.log || {}).forEach(function (d) { entries += App.getLog(d, id).length; });
      Object.keys(App.data.todos || {}).forEach(function (d) { App.data.todos[d].forEach(function (t) { if (t.tag === id && t.done) tasksDone++; }); });
      const merged = sum.prs.filter(function (p) { return p.program === id && p.status === 'merged'; }).length;
      const weekPct = Math.min(100, week / (GOAL * 7) * 100);
      return '<a class="os-pcard" href="' + info.page + '" style="--prog:var(--' + id + ')">' +
        '<div class="os-pcard__top"><span class="os-pcard__dot">' + esc(info.short.charAt(0)) + '</span><span class="os-pcard__name">' + esc(info.short) + '</span>' + App.icon('right') + '</div>' +
        '<span class="os-pcard__hours os-mono">' + (total / 3600).toFixed(1) + '<small>h</small></span>' +
        '<span class="os-pcard__sub">' + hm(week) + ' this week</span>' +
        '<span class="os-pcard__bar"><span style="width:' + weekPct + '%"></span></span>' +
        '<span class="os-pcard__facts"><span><b class="os-mono">' + tasksDone + '</b> tasks done</span><span><b class="os-mono">' + entries + '</b> work entries</span><span><b class="os-mono">' + merged + '</b> merged</span></span>' +
        '</a>';
    }).join('') + '</div>';
  }

  // ---------- one day's report ----------
  function reportHTML(day) {
    const isToday = day === App.todayKey();
    const by = App.focusOn(day);
    const focus = Object.keys(by).reduce(function (n, k) { return n + by[k]; }, 0);
    const pct = Math.min(100, Math.round(focus / GOAL * 100));
    const met = focus >= GOAL;

    // focus
    const split = App.PROGRAM_ORDER.filter(function (id) { return by[id]; }).map(function (id) {
      return '<span class="os-legend__i" style="--prog:var(--' + id + ')">' + esc(App.PROGRAMS[id].short) + ' <b class="os-mono">' + hm(by[id]) + '</b></span>';
    }).join('');
    const focusHTML = '<div class="os-rep__block"><p class="os-label">' + App.icon('clock') + 'Focus time</p>' +
      '<p class="os-rep__big os-mono">' + hm(focus) + ' <small>of 2h</small></p>' +
      '<span class="os-rep__bar' + (met ? ' is-met' : '') + '"><span style="width:' + pct + '%"></span></span>' +
      (split ? '<div class="os-legend">' + split + '</div>' : '<p class="os-hint">No timer used.</p>') + '</div>';

    // tasks
    const todos = App.getTodos(day);
    const done = todos.filter(function (t) { return t.done; });
    const tasksHTML = '<div class="os-rep__block"><p class="os-label">' + App.icon('check') + 'Tasks</p>' +
      '<p class="os-rep__big os-mono">' + done.length + ' <small>of ' + todos.length + ' done</small></p>' +
      (todos.length ? '<ul class="os-rep__list">' + todos.slice().sort(function (a, b) { return b.done - a.done; }).map(function (t) {
        return '<li class="' + (t.done ? 'is-done' : 'is-open') + '"><span class="os-rep__mark" aria-label="' + (t.done ? 'done' : 'not done') + '">' + (t.done ? App.icon('check') : '') + '</span>' +
          '<span class="os-rep__text">' + esc(t.text) + '</span>' + tag(t.tag) + '</li>';
      }).join('') + '</ul>' : '<p class="os-hint">No tasks planned.</p>') + '</div>';

    // work log + PRs
    const work = [];
    App.PROGRAM_ORDER.forEach(function (id) {
      App.getLog(day, id).forEach(function (e) {
        work.push('<li><span class="os-rep__text"><b>' + esc(e.org) + '</b>' + (e.issue ? ' &middot; ' + esc(e.issue) : '') + '</span>' + tag(id) + '</li>');
      });
    });
    const prs = App.getPRs().filter(function (p) { return p.opened === day || p.updated === day; });
    const prList = prs.map(function (p) {
      const what = p.opened === day ? 'Opened' : 'Updated';
      return '<li><span class="os-rep__text">' + what + ' ' + App.prLinkHTML({ link: p.link, title: p.title }) + '</span>' + App.prPillHTML(p.status) + '</li>';
    }).join('');
    const workHTML = '<div class="os-rep__block"><p class="os-label">' + App.icon('org') + 'Work and PRs</p>' +
      '<p class="os-rep__big os-mono">' + work.length + ' <small>entr' + (work.length === 1 ? 'y' : 'ies') + ' &middot; ' + prs.length + ' PR' + (prs.length === 1 ? '' : 's') + '</small></p>' +
      ((work.length || prs.length) ? '<ul class="os-rep__list">' + work.join('') + prList + '</ul>' : '<p class="os-hint">Nothing logged.</p>') + '</div>';

    const verdict = met
      ? '<span class="os-pill os-pill--merged">Goal met' + (focus > GOAL ? ' +' + hm(focus - GOAL) : '') + '</span>'
      : focus ? '<span class="os-pill os-pill--review">' + hm(GOAL - focus) + ' short</span>'
      : '<span class="os-pill">No focus time</span>';

    return '<article class="os-card os-rep' + (isToday ? ' is-today' : '') + '">' +
      '<div class="os-rep__head"><div class="os-rep__date">' +
      (isToday ? '<span class="os-flag os-flag--today">Today</span>' : '') +
      '<h3 class="os-rep__day">' + App.dayName(day) + '</h3><span class="os-mono os-muted">' + App.formatDate(day) + '</span></div>' + verdict + '</div>' +
      '<div class="os-rep__grid">' + focusHTML + tasksHTML + workHTML + '</div></article>';
  }

  App.render = function () {
    const sum = App.prSummary();
    const days = activeDays();
    const shown = days.slice(0, showDays);
    App.mount(document.getElementById('app'),
      '<div class="os-phead"><div><p class="os-label">Your daily reports</p><h1 class="os-h1">Progress</h1></div></div>' +
      tilesHTML(sum) +
      '<div class="os-section-head os-section"><h2 class="os-h2">Programs</h2></div>' +
      programsHTML() +
      '<div class="os-section-head os-section"><h2 class="os-h2">Day by day</h2><span class="os-card__meta">' + days.length + ' day' + (days.length === 1 ? '' : 's') + ' with activity</span></div>' +
      '<div class="os-stack">' + shown.map(reportHTML).join('') + '</div>' +
      (days.length > shown.length ? '<div class="os-row os-section" style="justify-content:center"><button type="button" class="os-btn os-btn--ghost" data-more>Show older days</button></div>' : ''));
  };

  document.addEventListener('click', function (ev) {
    if (ev.target.closest('[data-more]')) { showDays += 14; App.render(); }
  });
})(window.App);
