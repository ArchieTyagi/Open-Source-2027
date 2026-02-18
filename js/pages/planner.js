/* planner.js
   The Planner page (index.html): your open source dashboard.
   1. Focus timer: aim for 2 hours of open source every day. Pick a program, press Start.
   2. Today: tasks done today per program, focus time today, and your goal streak.
   3. Three cards: Daily to-do (tasks tagged GSoC / ESoC / LFX / SoB), Overall progress
      of the week split by program colour, and Focus & productivity stars.
   4. Full week: 7 days with a progress donut and task list each. Past days are locked.
   5. Last 14 days of focus time and a 16-week consistency grid.
   Totals (focus hours, goal days, tasks done, active days, program cards) are on Progress.
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
    const todos = App.getTodos(today);
    const tasksDone = todos.filter(function (t) { return t.done; }).length;
    let entries = 0;
    const rows = App.PROGRAM_ORDER.map(function (id) {
      const mine = todos.filter(function (t) { return t.tag === id; });
      const done = mine.filter(function (t) { return t.done; }).length;
      const work = App.getLog(today, id);
      entries += work.length;
      const what = mine.length
        ? mine.map(function (t) { return esc(t.text); }).join(', ')
        : work.length ? work.map(function (e) { return esc(e.org); }).join(', ') : '<span class="os-muted">Nothing yet</span>';
      return '<a class="os-todayrow" href="' + App.PROGRAMS[id].page + '" style="--prog:var(--' + id + ')">' +
        '<span class="os-todayrow__name">' + esc(App.PROGRAMS[id].short) + '</span>' +
        '<span class="os-todayrow__what">' + what + '</span>' +
        '<span class="os-todayrow__n os-mono">' + (mine.length ? done + '/' + mine.length : '0') + '</span>' + App.icon('right') + '</a>';
    }).join('');
    const streak = App.goalStreak();
    return '<section class="os-card os-today" aria-label="Today">' +
      '<div class="os-today__head"><div><p class="os-label">' + greeting() + '</p>' +
      '<h2 class="os-today__day">' + App.dayName(today) + '</h2><p class="os-plan-date__num os-mono">' + App.formatDate(today) + '</p></div>' +
      '<div class="os-streak" title="Days in a row with 2 hours done"><span class="os-streak__n os-mono">' + streak + '</span>' +
      '<span class="os-streak__l">day' + (streak === 1 ? '' : 's') + '<br>goal streak</span></div></div>' +
      '<div class="os-today__nums"><div><span class="os-num-md os-mono">' + tasksDone + '<small> / ' + todos.length + '</small></span><span class="os-label">tasks done today</span></div>' +
      '<div><span class="os-num-md os-mono">' + hm(App.focusTotal(today)) + '</span><span class="os-label">focus time today</span></div></div>' +
      '<div class="os-todayrows">' + rows + '</div>' +
      '<p class="os-hint">Tasks done / planned per program. Tap a program to open its page.</p></section>';
  }

  // ---------- the week shown in the dashboard ----------
  let weekStart = App.weekStart(App.todayKey());
  let selDay = App.todayKey();
  let tag = App.PROGRAM_ORDER[0];
  const SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const STAR = '<svg class="os-starsvg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4L2.8 9.5l6.4-.8z"/></svg>';
  const RATE_WORDS = ['Not rated yet', 'Rough day', 'Below par', 'Okay', 'Good day', 'Fully locked in'];
  function weekDays() { const d = []; for (let i = 0; i < 7; i++) d.push(App.addDays(weekStart, i)); return d; }
  function isPast(day) { return day < App.todayKey(); }
  // Done tasks per program on one day: { gsoc: 2, sob: 1 }, plus total planned.
  function doneBy(day) {
    const out = { total: 0, done: 0 };
    App.PROGRAM_ORDER.forEach(function (id) { out[id] = 0; });
    App.getTodos(day).forEach(function (t) {
      out.total++;
      if (t.done) { out.done++; if (out[t.tag] !== undefined) out[t.tag]++; }
    });
    return out;
  }

  // Donut split by program colour: each program's done tasks, grey for what's left.
  function donutSVG(by, size, stroke) {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r, cx = size / 2;
    let off = 0, segs = '';
    if (by.total) {
      App.PROGRAM_ORDER.forEach(function (id) {
        if (!by[id]) return;
        const len = by[id] / by.total * c;
        segs += '<circle cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" stroke="var(--' + id + ')" stroke-width="' + stroke + '" ' +
          'stroke-dasharray="' + Math.max(0, len - 2) + ' ' + (c - Math.max(0, len - 2)) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 ' + cx + ' ' + cx + ')"><title>' + App.PROGRAMS[id].short + ': ' + by[id] + ' done</title></circle>';
        off += len;
      });
    }
    const pct = by.total ? Math.round(by.done / by.total * 100) + '%' : '–';
    return '<svg class="os-donut" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="' + by.done + ' of ' + by.total + ' tasks done">' +
      '<circle cx="' + cx + '" cy="' + cx + '" r="' + r + '" fill="none" stroke="var(--track)" stroke-width="' + stroke + '"/>' + segs +
      '<text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="var(--ink)" font-family="JetBrains Mono, monospace" font-weight="600" font-size="' + Math.round(size / 6.2) + '">' + pct + '</text></svg>';
  }

  function tagChipsHTML() {
    return App.PROGRAM_ORDER.map(function (id) {
      return '<button type="button" class="os-pchip os-pchip--sm' + (id === tag ? ' is-on' : '') + '" style="--prog:var(--' + id + ')" data-tag="' + id + '" aria-pressed="' + (id === tag) + '">' + esc(App.PROGRAMS[id].short) + '</button>';
    }).join('');
  }
  function taskItemHTML(t, locked) {
    return '<li class="os-task' + (t.done ? ' is-done' : '') + '" style="--prog:var(--' + t.tag + ')">' +
      '<label class="os-task__check"><input type="checkbox" data-todo="toggle" data-day="' + t.day + '" data-id="' + t.id + '"' + (t.done ? ' checked' : '') + (locked ? ' disabled' : '') + '>' +
      '<span class="os-task__box" aria-hidden="true">' + App.icon('check') + '</span><span class="os-task__text">' + esc(t.text) + '</span></label>' +
      '<span class="os-task__tag">' + esc(App.PROGRAMS[t.tag] ? App.PROGRAMS[t.tag].short : t.tag) + '</span>' +
      (locked ? '<span></span>' : '<button type="button" class="os-iconbtn os-iconbtn--danger" data-todo="delete" data-day="' + t.day + '" data-id="' + t.id + '" aria-label="Delete task">' + App.icon('trash') + '</button>') + '</li>';
  }
  function withDay(day) { return App.getTodos(day).map(function (t) { return Object.assign({ day: day }, t); }); }

  // ---------- 3a. daily to-do (the selected day) ----------
  function dailyTodoHTML() {
    const day = selDay, locked = isPast(day);
    const by = doneBy(day);
    const pct = by.total ? Math.round(by.done / by.total * 100) : 0;
    const segs = App.PROGRAM_ORDER.filter(function (id) { return by[id]; }).map(function (id) {
      return '<span style="width:' + (by[id] / by.total * 100) + '%;--prog:var(--' + id + ')" title="' + App.PROGRAMS[id].short + ': ' + by[id] + ' done"></span>';
    }).join('');
    const items = withDay(day).sort(function (a, b) { return a.done - b.done; });
    return '<section class="os-card os-dcard" aria-label="Daily to-do">' +
      '<div class="os-dcard__cap">Daily to-do</div>' +
      '<div class="os-dcard__title"><h2 class="os-h2">' + (day === App.todayKey() ? 'Today · ' : '') + App.dayName(day) + '</h2>' +
      (locked ? '<span class="os-flag">Locked</span>' : '') + '</div>' +
      '<p class="os-mono os-muted os-small">' + App.formatDate(day) + '</p>' +
      '<div class="os-dcard__prog"><span><b>' + by.done + '</b> of ' + by.total + ' done</span><span class="os-mono">' + pct + '%</span></div>' +
      '<div class="os-split-bar os-dcard__bar">' + segs + '</div>' +
      '<ul class="os-tasklist">' + (items.length ? items.map(function (t) { return taskItemHTML(t, locked); }).join('')
        : '<li class="os-list-empty os-task-empty">' + (locked ? 'No tasks were planned.' : 'No tasks yet. Add one below.') + '</li>') + '</ul>' +
      (locked ? '<p class="os-hint">This day has passed, so it is locked.</p>'
        : '<form class="os-taskform os-taskform--stack" data-todo-form data-day="' + day + '">' +
          '<div class="os-row" style="gap:8px"><input class="os-input" id="todo-text" name="text" placeholder="Add a task" maxlength="200" aria-label="New task" autocomplete="off">' +
          '<button type="submit" class="os-btn os-btn--primary os-btn--sq" aria-label="Add task">' + App.icon('plus') + '</button></div>' +
          '<div class="os-pchips" role="group" aria-label="Tag">' + tagChipsHTML() + '</div></form>') +
      '</section>';
  }

  // ---------- 3b. overall progress of the week, split by program colour ----------
  function weekProgressHTML() {
    const days = weekDays();
    const per = days.map(doneBy);
    const total = { total: 0, done: 0 };
    App.PROGRAM_ORDER.forEach(function (id) { total[id] = 0; });
    per.forEach(function (b) { total.total += b.total; total.done += b.done; App.PROGRAM_ORDER.forEach(function (id) { total[id] += b[id]; }); });
    const top = Math.max(4, Math.max.apply(null, per.map(function (b) { return b.total; })));
    const step = top <= 8 ? 2 : Math.ceil(top / 4);
    const max = Math.ceil(top / step) * step;
    const W = 260, H = 180, L = 22, B = 22, T = 6, plotH = H - B - T, plotW = W - L - 4, slot = plotW / 7, bw = Math.min(26, slot * 0.6);
    const y = function (v) { return T + plotH - v / max * plotH; };
    let g = '';
    for (let v = 0; v <= max; v += step) g += '<line x1="' + L + '" x2="' + (W - 4) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="var(--line)"/>' +
      '<text x="' + (L - 6) + '" y="' + y(v) + '" text-anchor="end" dominant-baseline="central" font-size="10" fill="var(--muted)" font-family="JetBrains Mono, monospace">' + v + '</text>';
    per.forEach(function (b, i) {
      const x = L + i * slot + (slot - bw) / 2;
      const tip = App.dayName(days[i]) + ': ' + b.done + ' of ' + b.total + ' done';
      if (b.total) g += '<rect x="' + x + '" y="' + y(b.total) + '" width="' + bw + '" height="' + (y(0) - y(b.total)) + '" rx="4" fill="var(--track)"><title>' + tip + '</title></rect>';
      let base = 0;
      App.PROGRAM_ORDER.forEach(function (id) {
        if (!b[id]) return;
        const h = y(base) - y(base + b[id]);
        g += '<rect x="' + x + '" y="' + (y(base + b[id]) + 1) + '" width="' + bw + '" height="' + Math.max(0, h - 2) + '" rx="3" fill="var(--' + id + ')"><title>' + App.PROGRAMS[id].short + ' on ' + App.dayName(days[i]) + ': ' + b[id] + ' done</title></rect>';
        base += b[id];
      });
      const sel = days[i] === selDay;
      g += '<text x="' + (x + bw / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="11" fill="' + (sel ? 'var(--ink)' : 'var(--muted)') + '" font-weight="' + (sel ? 700 : 400) + '">' + SHORT[i] + '</text>';
    });
    const legend = App.PROGRAM_ORDER.map(function (id) {
      return '<span class="os-legend__i" style="--prog:var(--' + id + ')">' + esc(App.PROGRAMS[id].short) + ' <b class="os-mono">' + total[id] + '</b></span>';
    }).join('') + '<span class="os-legend__i" style="--prog:var(--track)">Left <b class="os-mono">' + (total.total - total.done) + '</b></span>';
    return '<section class="os-card os-dcard" aria-label="Overall progress this week">' +
      '<div class="os-dcard__cap">Overall progress</div>' +
      '<div class="os-wprog"><svg class="os-wprog__bars" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Tasks done per day this week, by program">' + g + '</svg>' +
      '<div class="os-wprog__donut">' + donutSVG(total, 170, 26) + '</div></div>' +
      '<div class="os-legend os-wprog__legend">' + legend + '</div>' +
      '<p class="os-wprog__sum os-mono">' + total.done + ' / ' + total.total + ' completed this week</p></section>';
  }

  // ---------- 3c. focus & productivity stars ----------
  function focusCardHTML() {
    const day = selDay, locked = isPast(day), r = App.getRating(day);
    let stars = '';
    for (let n = 1; n <= 5; n++) {
      stars += '<button type="button" class="os-star' + (n <= r ? ' is-on' : '') + '" data-rate="' + n + '"' + (locked ? ' disabled' : '') +
        ' aria-label="' + n + ' star' + (n > 1 ? 's' : '') + '" aria-pressed="' + (n === r) + '">' + STAR + '</button>';
    }
    const days = weekDays();
    const week = days.map(function (d, i) {
      const v = App.getRating(d);
      return '<div><div class="os-wstars' + (v ? '' : ' is-none') + '">' + (v ? STAR.repeat(v) : '·') + '</div>' + SHORT[i] + '</div>';
    }).join('');
    const rated = days.map(App.getRating).filter(Boolean);
    const avg = rated.length ? (rated.reduce(function (a, b) { return a + b; }, 0) / rated.length).toFixed(1) : null;
    const note = (App.data.weekFocus || {})[weekStart] || '';
    return '<section class="os-card os-dcard" aria-label="Focus and productivity">' +
      '<div class="os-dcard__cap">Focus &amp; productivity</div>' +
      '<div class="os-stars" role="group" aria-label="Rate ' + App.dayName(day) + '">' + stars + '</div>' +
      '<p class="os-rate__label">' + SHORT[(new Date(day + 'T12:00').getDay() + 6) % 7] + ': ' + RATE_WORDS[r] + (locked ? ' (locked)' : '') + '</p>' +
      '<div class="os-weekstars">' + week + '</div>' +
      '<p class="os-rate__avg">' + (avg ? 'Week average <b class="os-mono">' + avg + '</b> / 5' : '<span class="os-muted">Rate each day out of 5</span>') + '</p>' +
      '<textarea class="os-textarea os-weeknote" id="week-note" rows="3" maxlength="1000" placeholder="Weekly focus: what matters most this week?"' + (isPast(App.addDays(weekStart, 6)) ? ' disabled' : '') + '>' + esc(note) + '</textarea></section>';
  }

  // ---------- 4. full week board ----------
  function weekBoardHTML() {
    const days = weekDays(), today = App.todayKey();
    const cols = days.map(function (d, i) {
      const locked = isPast(d), by = doneBy(d);
      const items = withDay(d);
      return '<article class="os-wday' + (d === today ? ' is-today' : '') + (locked ? ' is-past' : '') + (d === selDay ? ' is-sel' : '') + '">' +
        '<button type="button" class="os-wday__head" data-sel="' + d + '" aria-label="Open ' + App.dayName(d) + ' in the daily to-do">' +
        '<span class="os-wday__name">' + App.dayName(d) + '</span><span class="os-mono os-small">' + App.formatDate(d) + '</span>' +
        '<span class="os-wday__tag">' + (d === today ? 'Today' : locked ? 'Locked' : '&nbsp;') + '</span></button>' +
        '<div class="os-wday__donut">' + donutSVG(by, 92, 16) + '</div>' +
        '<div class="os-wday__label"><span>Tasks</span><span class="os-wstars">' + (App.getRating(d) ? STAR.repeat(App.getRating(d)) : '') + '</span></div>' +
        '<ul class="os-tasklist os-tasklist--sm">' + (items.length ? items.map(function (t) { return taskItemHTML(t, locked); }).join('')
          : '<li class="os-list-empty os-task-empty">' + (locked ? 'No tasks were planned.' : 'No tasks yet.') + '</li>') + '</ul>' +
        (locked ? '<div class="os-wday__locked">Locked</div>'
          : '<form class="os-wday__add" data-todo-form data-day="' + d + '"><input class="os-input" name="text" placeholder="Add a task" maxlength="200" aria-label="Add a task for ' + App.dayName(d) + '" autocomplete="off">' +
            '<select class="os-select os-select--sm" name="tag" aria-label="Tag">' + App.PROGRAM_ORDER.map(function (id) {
              return '<option value="' + id + '"' + (id === tag ? ' selected' : '') + '>' + esc(App.PROGRAMS[id].short) + '</option>'; }).join('') + '</select>' +
            '<button type="submit" class="os-btn os-btn--primary os-btn--sm os-btn--sq" aria-label="Add">' + App.icon('plus') + '</button></form>') +
        '</article>';
    }).join('');
    const end = App.addDays(weekStart, 6);
    return '<section class="os-card os-weekboard os-section" aria-label="Full week">' +
      '<div class="os-weekboard__head"><h2 class="os-h2">Full week</h2>' +
      '<div class="os-row os-weeknav"><button type="button" class="os-btn os-btn--ghost os-btn--sq" data-week="-1" aria-label="Previous week">' + App.icon('left') + '</button>' +
      '<span class="os-mono">' + App.formatDate(weekStart) + ' – ' + App.formatDate(end) + '</span>' +
      '<button type="button" class="os-btn os-btn--ghost os-btn--sq" data-week="1" aria-label="Next week">' + App.icon('right') + '</button>' +
      '<button type="button" class="os-btn os-btn--ghost" data-week="0"' + (weekStart === App.weekStart(App.todayKey()) ? ' disabled' : '') + '>This week</button></div>' +
      '<p class="os-hint">Tap a day\'s name to open it in the daily to-do. Past days are locked.</p></div>' +
      '<div class="os-wdays">' + cols + '</div></section>';
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

  // ---------- page ----------
  App.render = function () {
    App.mount(document.getElementById('app'),
      '<div class="os-dash-head"><p class="os-label">Your open source dashboard</p><h1 class="os-h1">Planner</h1></div>' +
      '<div class="os-hero">' + timerHTML() + todayHTML() + '</div>' +
      '<div class="os-drow">' + dailyTodoHTML() + weekProgressHTML() + focusCardHTML() + '</div>' +
      weekBoardHTML() +
      '<div class="os-split os-section os-charts">' + weekChartHTML() + heatHTML() + '</div>');
    tick();
  };

  setInterval(tick, 1000);

  // ---------- events ----------
  function keepTyping(fn) {
    const box = document.getElementById('todo-text');
    const typed = box ? box.value : '';
    fn();
    const again = document.getElementById('todo-text');
    if (again) { again.value = typed; }
  }
  document.addEventListener('submit', function (ev) {
    const form = ev.target.closest('[data-todo-form]');
    if (!form) return;
    ev.preventDefault();
    const day = form.dataset.day;
    if (isPast(day)) return;
    const text = form.text.value.trim();
    if (!text) { form.text.focus(); return; }
    const t = form.tag ? form.tag.value : tag;
    App.ensureTodos(day).push({ id: App.uid(), text: text, tag: t, done: false });
    App.commit();
    const box = form.id ? null : document.querySelector('[data-todo-form][data-day="' + day + '"] input[name="text"]');
    if (box) box.focus();
  });
  document.addEventListener('change', function (ev) {
    const box = ev.target.closest('[data-todo="toggle"]');
    if (!box || isPast(box.dataset.day)) return;
    const t = App.getTodos(box.dataset.day).find(function (x) { return x.id === box.dataset.id; });
    if (t) { t.done = box.checked; App.commit(); }
  });
  let noteTimer;
  document.addEventListener('input', function (ev) {
    if (ev.target.id !== 'week-note') return;
    if (!App.data.weekFocus) App.data.weekFocus = {};
    App.data.weekFocus[weekStart] = ev.target.value;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(function () { App.save(); }, 600);
  });

  document.addEventListener('click', function (ev) {
    const tg = ev.target.closest('[data-tag]');
    if (tg) { keepTyping(function () { tag = tg.dataset.tag; App.render(); }); const b = document.getElementById('todo-text'); if (b) b.focus(); return; }
    const sel = ev.target.closest('[data-sel]');
    if (sel) { keepTyping(function () { selDay = sel.dataset.sel; App.render(); }); document.querySelector('.os-drow').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); return; }
    const wk = ev.target.closest('[data-week]');
    if (wk) {
      const n = +wk.dataset.week;
      weekStart = n ? App.addDays(weekStart, 7 * n) : App.weekStart(App.todayKey());
      const today = App.todayKey();
      selDay = today >= weekStart && today <= App.addDays(weekStart, 6) ? today : weekStart;
      keepTyping(App.render);
      return;
    }
    const rate = ev.target.closest('[data-rate]');
    if (rate) {
      if (isPast(selDay)) return;
      const n = +rate.dataset.rate;
      App.setRating(selDay, App.getRating(selDay) === n ? 0 : n);
      keepTyping(App.commit);
      return;
    }
    const del = ev.target.closest('[data-todo="delete"]');
    if (del) {
      if (isPast(del.dataset.day)) return;
      const list = App.getTodos(del.dataset.day);
      const i = list.findIndex(function (x) { return x.id === del.dataset.id; });
      if (i > -1) { list.splice(i, 1); keepTyping(App.commit); }
      return;
    }
    const chip = ev.target.closest('[data-pick]');
    if (chip) {
      pick = chip.dataset.pick;
      const r = App.timerRunning();
      if (r && r.program !== pick) App.startTimer(pick); // switch program: time so far stays with the old one
      keepTyping(App.render);
      return;
    }
    const btn = ev.target.closest('[data-timer]');
    if (!btn) return;
    if (btn.dataset.timer === 'start') App.startTimer(pick);
    else App.stopTimer();
    keepTyping(App.render);
  });
})(window.App);
