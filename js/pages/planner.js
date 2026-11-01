/* planner.js
   The weekly planner (index.html):
   week bar, then Daily to-do, Overall progress, Focus & productivity,
   then the full week as 7 day columns. Past days are locked. */

(function (App) {
  const esc = App.esc;
  let weekStart = App.weekStart(App.todayKey()); // Monday of the week on screen

  function weekBarHTML(days) {
    return '<div class="os-weekbar">' +
      '<button type="button" class="os-btn os-btn--ghost os-btn--sq" data-action="week-prev" aria-label="Previous week">' + App.icon('left') + '</button>' +
      '<span class="os-weekbar__range">' + App.formatDate(days[0]) + ' &ndash; ' + App.formatDate(days[6]) + '</span>' +
      '<button type="button" class="os-btn os-btn--ghost os-btn--sq" data-action="week-next" aria-label="Next week">' + App.icon('right') + '</button>' +
      '<button type="button" class="os-btn os-btn--ghost" data-action="week-today">Today</button>' +
      '</div>';
  }

  // 1. Daily to-do (always today)
  function todoHTML(today) {
    const c = App.countTasks(App.getDay(today).tasks);
    return '<section class="os-card" aria-label="Daily to-do">' +
      App.cardHead('Daily to-do', '<span class="os-flag os-flag--today">Today</span>') +
      '<div class="os-card__body">' +
      '<div class="os-today-title"><h3 class="os-h3" style="font-size:20px;line-height:26px">Today &middot; ' + App.dayName(today) + '</h3>' +
      '<span class="os-mono os-small os-muted">' + App.formatDate(today) + '</span></div>' +
      '<div class="os-done-row" style="margin-top:12px"><span><b>' + c.done + ' of ' + c.total + '</b> done</span></div>' +
      App.barHTML(c.pct) +
      '<div style="margin-top:6px">' + App.checklistHTML('day:' + today, { key: 'todo-card', emptyText: 'Nothing planned yet. Add your first task below.' }) + '</div>' +
      '<p class="os-hint" style="margin-top:10px">Past days are locked. You can change today and plan ahead.</p>' +
      '</div></section>';
  }

  // 2. Overall progress: one bar per day, pink = done, dark = left
  function chartHTML(days, today) {
    const counts = days.map(function (d) { return App.countTasks(App.getDay(d).tasks); });
    const max = Math.max(1, Math.max.apply(null, counts.map(function (c) { return c.total; })));
    const unit = Math.min(20, 104 / max); // pixels per task, so the tallest bar fits
    let done = 0, total = 0;

    const cols = counts.map(function (c) {
      done += c.done; total += c.total;
      let stack = '';
      if (!c.total) stack = '<span class="left" style="height:3px;opacity:.6"></span>';
      if (c.total - c.done) stack += '<span class="left" style="height:' + ((c.total - c.done) * unit) + 'px"></span>';
      if (c.done) stack += '<span class="done" style="height:' + (c.done * unit) + 'px"></span>';
      return '<div class="os-bars__col"><span class="os-bars__n">' + (c.total ? c.done + '/' + c.total : '&ndash;') + '</span>' +
        '<div class="os-bars__stack">' + stack + '</div></div>';
    }).join('');

    const labels = days.map(function (d) {
      return '<span' + (d === today ? ' class="is-today"' : '') + '>' + App.dayName(d).slice(0, 3) + '</span>';
    }).join('');
    const summary = days.map(function (d, i) { return App.dayName(d).slice(0, 3) + ' ' + counts[i].done + ' of ' + counts[i].total; }).join(', ');
    const pct = total ? Math.round(done / total * 100) : 0;

    return '<section class="os-card" aria-label="Overall progress">' +
      App.cardHead('Overall progress', '<span class="os-card__meta">' + (days.indexOf(today) > -1 ? 'This week' : 'Week of ' + App.formatDate(days[0])) + '</span>') +
      '<div class="os-card__body"><div class="os-chart"><div class="os-chart__plot">' +
      '<div class="os-bars" role="img" aria-label="Tasks done each day: ' + summary + '">' + cols + '</div>' +
      '<div class="os-bars__x" aria-hidden="true">' + labels + '</div></div>' +
      '<div style="display:flex;flex-direction:column;align-items:center;gap:10px">' + App.ringHTML(pct, 'lg', !total) +
      '<p class="os-p" style="text-align:center"><span class="os-mono" style="font-weight:600">' + done + ' / ' + total + '</span><br>' +
      '<span class="os-small os-muted">completed this week</span></p></div></div>' +
      '<div class="os-legend"><span style="--c:var(--accent)">Done</span><span style="--c:var(--track)">Left</span></div>' +
      '</div></section>';
  }

  // 3. Focus & productivity
  function focusHTML(days, today) {
    const rated = days.map(function (d) { return App.getDay(d).rating; }).filter(function (r) { return r > 0; });
    const avg = rated.length ? (rated.reduce(function (a, b) { return a + b; }, 0) / rated.length).toFixed(1) : '&ndash;';
    const rows = days.map(function (d) {
      return '<div class="os-rate-row' + (d === today ? ' is-today' : '') + '"><span>' + App.dayName(d).slice(0, 3) + '</span>' +
        App.starsHTML(d, App.getDay(d).rating, { size: 'sm', label: App.dayName(d) }) + '</div>';
    }).join('');
    return '<section class="os-card" aria-label="Focus and productivity">' +
      App.cardHead('Focus &amp; productivity', '<span class="os-card__meta">Week average <b style="color:var(--ink)">' + avg + ' / 5</b></span>') +
      '<div class="os-card__body">' +
      '<p class="os-small os-muted os-p">How focused were you today?</p>' +
      '<div style="margin:8px 0 14px">' + App.starsHTML(today, App.getDay(today).rating, { size: 'lg', editable: true, label: 'Rate today' }) + '</div>' +
      '<div style="border-top:1px solid var(--line);padding-top:8px">' + rows + '</div>' +
      '<label class="os-field" style="margin-top:14px"><span class="os-field__name">Weekly focus</span>' +
      '<textarea class="os-textarea" rows="2" style="min-height:64px" data-week-focus maxlength="500" placeholder="The one thing that matters most this week">' +
      esc(App.data.weekFocus[weekStart] || '') + '</textarea></label>' +
      '</div></section>';
  }

  // One day column in the full week
  function dayHTML(key, today) {
    const day = App.getDay(key);
    const c = App.countTasks(day.tasks);
    const isToday = key === today;
    const locked = key < today;
    const flag = isToday ? '<span class="os-flag os-flag--today">Today</span>'
      : locked ? '<span class="os-flag">' + App.icon('lock') + 'Locked</span>' : '';
    return '<article class="os-day' + (isToday ? ' is-today' : '') + '" aria-label="' + App.dayName(key) + ' ' + App.formatDate(key) + '">' +
      '<div class="os-day__head"><h3 class="os-day__name">' + App.dayName(key) + '</h3>' +
      '<div class="os-day__sub"><span class="os-day__date">' + App.formatDate(key) + '</span>' + flag + '</div></div>' +
      '<div class="os-day__stats">' + App.ringHTML(c.pct, 'sm', !c.total) +
      App.starsHTML(key, day.rating, { size: 'sm', editable: isToday, label: App.dayName(key) }) + '</div>' +
      App.checklistHTML('day:' + key, { small: true, emptyText: 'No tasks' }) +
      '</article>';
  }

  App.render = function () {
    const today = App.todayKey();
    const days = App.weekDays(weekStart);
    let done = 0, total = 0;
    days.forEach(function (d) { const c = App.countTasks(App.getDay(d).tasks); done += c.done; total += c.total; });

    App.mount(document.getElementById('app'),
      weekBarHTML(days) +
      '<div class="os-grid-3">' + todoHTML(today) + chartHTML(days, today) + focusHTML(days, today) + '</div>' +
      '<section class="os-section" aria-label="Full week"><div class="os-section-head"><h2 class="os-label">Full week</h2>' +
      '<span class="os-card__meta">' + done + ' of ' + total + ' done</span></div>' +
      '<div class="os-days">' + days.map(function (d) { return dayHTML(d, today); }).join('') + '</div></section>');
  };

  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    if (el.dataset.action === 'week-prev') { weekStart = App.addDays(weekStart, -7); App.render(); }
    if (el.dataset.action === 'week-next') { weekStart = App.addDays(weekStart, 7); App.render(); }
    if (el.dataset.action === 'week-today') { weekStart = App.weekStart(App.todayKey()); App.render(); }
  });

  // Weekly focus saves as you type (no redraw, so the cursor stays put).
  document.addEventListener('input', function (e) {
    if (!e.target.matches('[data-week-focus]')) return;
    const text = e.target.value;
    if (text.trim()) App.data.weekFocus[weekStart] = text;
    else delete App.data.weekFocus[weekStart];
    App.save();
  });
})(window.App);
