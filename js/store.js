/* store.js
   Keeps all your data in one object (App.data) and saves it to localStorage
   (localStorage = a small storage space inside your browser that stays after you close the tab).

   Shape of App.data:
   {
     days:          { "2026-11-01": { tasks: [{ id, text, done }], rating: 0..5 } },
     weekFocus:     { "2026-10-26": "text for that week" },      key = the Monday
     programs:      { gsoc: { orgs, daily, milestones, journal, proposals, timeline }, ... },
     contributions: [{ id, date, what, project, type, status }],
     log:           { "2026-11-22": { gsoc: [{ id, org, tech, issue, issueLink, repo, prs: [{ link, status }], did, learned }] } }
     prs:           [{ id, program: "gsoc", org, title, link, status: "review" | "merged" | "closed", opened, updated }]
                    the "My PRs" list on each program page
     ratings:       { "2026-11-25": 4 }   focus & productivity stars (1 to 5) per day
     weekFocus:     { "2026-11-23": "text" }   weekly focus note, key = Monday of that week
     todos:         { "2026-11-23": [{ id, text, tag: "gsoc", done }] }   Today's tasks on the Planner
     focus:         { days: { "2026-11-22": { gsoc: 3600 } },   seconds of focus time per program
                      running: { program: "gsoc", since: 1795000000000 } or null }   the timer that is ticking now
                    (the work log on each program page; the Planner shows a summary)
   } */

(function (App) {
  const STORAGE_KEY = 'open-source-2027';

  function emptyData() {
    return { version: 1, days: {}, weekFocus: {}, programs: {}, contributions: [], log: {}, focus: { days: {}, running: null }, todos: {}, prs: [], ratings: {} };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return Object.assign(emptyData(), JSON.parse(raw));
    } catch (err) {
      console.warn('Could not read saved data', err);
    }
    return emptyData();
  }

  App.data = load();

  App.save = function () {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(App.data));
      App.setSaveStatus(true);
    } catch (err) {
      console.error('Could not save', err);
      App.setSaveStatus(false);
    }
  };

  App.setSaveStatus = function (ok) {
    const el = document.getElementById('save-status');
    if (!el) return;
    el.textContent = ok ? 'All changes saved' : 'Could not save. Export a backup.';
    el.classList.toggle('is-error', !ok);
  };

  // Save, then draw the page again. Pages set App.render.
  App.commit = function (focusKey) {
    App.save();
    if (App.render) App.render();
    if (focusKey) {
      const el = document.querySelector('[data-add-key="' + focusKey + '"], [data-keep="' + focusKey + '"]');
      if (el) el.focus();
    }
  };

  // ---------- days ----------
  App.getDay = function (key) {
    return App.data.days[key] || { tasks: [], rating: 0 };
  };
  App.ensureDay = function (key) {
    if (!App.data.days[key]) App.data.days[key] = { tasks: [], rating: 0 };
    return App.data.days[key];
  };

  // ---------- daily log (Planner page) ----------
  App.getLog = function (dayKey, programId) {
    const day = App.data.log[dayKey];
    return (day && day[programId]) || [];
  };
  App.ensureLog = function (dayKey, programId) {
    if (!App.data.log[dayKey]) App.data.log[dayKey] = {};
    if (!App.data.log[dayKey][programId]) App.data.log[dayKey][programId] = [];
    return App.data.log[dayKey][programId];
  };
  // Remove empty days so the saved data stays small.
  App.tidyLog = function (dayKey) {
    const day = App.data.log[dayKey];
    if (!day) return;
    Object.keys(day).forEach(function (id) { if (!day[id].length) delete day[id]; });
    if (!Object.keys(day).length) delete App.data.log[dayKey];
  };

  // ---------- Today's tasks (Planner to-do list, each task tagged with a program) ----------
  App.getTodos = function (dayKey) {
    if (!App.data.todos) App.data.todos = {};
    return App.data.todos[dayKey] || [];
  };
  App.ensureTodos = function (dayKey) {
    if (!App.data.todos) App.data.todos = {};
    if (!App.data.todos[dayKey]) App.data.todos[dayKey] = [];
    return App.data.todos[dayKey];
  };
  App.getRating = function (dayKey) { return (App.data.ratings || {})[dayKey] || 0; };
  App.setRating = function (dayKey, n) {
    if (!App.data.ratings) App.data.ratings = {};
    if (n) App.data.ratings[dayKey] = n; else delete App.data.ratings[dayKey];
  };
  App.todosDone = function () {
    let n = 0;
    Object.keys(App.data.todos || {}).forEach(function (d) { App.data.todos[d].forEach(function (t) { if (t.done) n++; }); });
    return n;
  };

  // ---------- focus timer (daily goal: 2 hours of open source) ----------
  App.GOAL_SECONDS = 2 * 60 * 60; // change the 2 to set a different daily goal

  function focusData() {
    if (!App.data.focus) App.data.focus = { days: {}, running: null };
    if (!App.data.focus.days) App.data.focus.days = {};
    return App.data.focus;
  }
  // Add the time from startMs to endMs to the right day(s). A session past midnight is split.
  function addSpan(program, startMs, endMs) {
    const f = focusData();
    let t = startMs;
    while (t < endMs) {
      const d = new Date(t);
      const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
      const stop = Math.min(endMs, midnight);
      const key = App.toKey(d);
      if (!f.days[key]) f.days[key] = {};
      f.days[key][program] = (f.days[key][program] || 0) + Math.round((stop - t) / 1000);
      t = stop;
    }
  }
  App.timerRunning = function () { return focusData().running; };
  App.startTimer = function (program) {
    const f = focusData();
    if (f.running) App.stopTimer();
    f.running = { program: program, since: Date.now() };
    App.save();
  };
  App.stopTimer = function () {
    const f = focusData();
    if (!f.running) return;
    addSpan(f.running.program, f.running.since, Date.now());
    f.running = null;
    App.save();
  };
  // Seconds per program on one day, including the timer that is running right now.
  App.focusOn = function (dayKey) {
    const f = focusData();
    const out = Object.assign({}, f.days[dayKey] || {});
    if (f.running) {
      const r = f.running, now = Date.now();
      let t = r.since;
      while (t < now) {
        const d = new Date(t);
        const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
        const stop = Math.min(now, midnight);
        if (App.toKey(d) === dayKey) out[r.program] = (out[r.program] || 0) + Math.round((stop - t) / 1000);
        t = stop;
      }
    }
    return out;
  };
  App.focusTotal = function (dayKey) {
    const by = App.focusOn(dayKey);
    return Object.keys(by).reduce(function (n, k) { return n + by[k]; }, 0);
  };
  // Days in a row that reached the goal, counting back from today (today counts once reached).
  App.goalStreak = function () {
    let day = App.todayKey(), n = 0;
    if (App.focusTotal(day) < App.GOAL_SECONDS) day = App.addDays(day, -1);
    while (App.focusTotal(day) >= App.GOAL_SECONDS) { n++; day = App.addDays(day, -1); }
    return n;
  };
  App.focusAllDays = function () {
    const keys = Object.keys(focusData().days);
    if (focusData().running && keys.indexOf(App.todayKey()) === -1) keys.push(App.todayKey());
    return keys.sort();
  };

  // ---------- PRs and active days, built from the Planner log ----------
  // Nothing is typed in twice: the Progress and Contributions pages read this.
  // A PR is known by its link. If the same link is in entries on several days,
  // the newest day's status wins (so "In review" today and "Merged" tomorrow = Merged).
  App.PR_STATUS = {
    review: 'In review',
    merged: 'Merged',
    closed: 'Closed'
  };
  App.prKey = function (link) { return App.shortUrl(link).toLowerCase().replace(/\/+$/, ''); };

  // ---------- My PRs (the PR list on each program page) ----------
  App.getPRs = function () {
    if (!Array.isArray(App.data.prs)) App.data.prs = [];
    return App.data.prs;
  };

  // Every PR from two places: the "My PRs" lists and PR links inside daily work entries.
  // A PR is known by its link: if it is in both places or on several days, the newest update wins.
  App.prSummary = function () {
    const prs = {};
    const days = {};
    function put(key, pr) {
      const old = prs[key];
      if (old && old.lastDay > pr.lastDay) return;
      if (old) { pr.firstDay = old.firstDay < pr.firstDay ? old.firstDay : pr.firstDay; pr.title = pr.title || old.title; }
      prs[key] = pr;
    }
    Object.keys(App.data.log || {}).sort().forEach(function (dayKey) {
      App.PROGRAM_ORDER.forEach(function (programId) {
        App.getLog(dayKey, programId).forEach(function (e) {
          days[dayKey] = true;
          App.entryPRs(e).forEach(function (pr) {
            if (!App.PR_STATUS[pr.status]) return;
            put(App.prKey(pr.link), { link: pr.link, program: programId, org: e.org, title: e.issue || '',
              status: pr.status, firstDay: dayKey, lastDay: dayKey });
          });
        });
      });
    });
    App.getPRs().forEach(function (p) {
      if (p.opened) days[p.opened] = true;
      if (p.updated) days[p.updated] = true;
      put(App.prKey(p.link), { link: p.link, program: p.program, org: p.org, title: p.title || '',
        status: p.status, firstDay: p.opened || p.updated, lastDay: p.updated || p.opened });
    });
    const list = Object.keys(prs).map(function (k) { return prs[k]; });
    function count(st) { return list.filter(function (p) { return p.status === st; }).length; }
    return {
      activeDays: Object.keys(days).length,
      prs: list,
      merged: count('merged'),
      review: count('review'),
      closed: count('closed')
    };
  };

  // ---------- programs ----------
  // The first time a program is opened it gets its starting milestones and dates.
  App.getProgram = function (id) {
    let p = App.data.programs[id];
    if (!p) {
      const info = App.PROGRAMS[id];
      p = App.data.programs[id] = {
        orgs: [],
        daily: {},
        milestones: info.milestones.map(function (text) { return { id: App.uid(), text: text, done: false }; }),
        journal: [],
        proposals: [],
        timeline: info.timeline.map(function (item) { return Object.assign({ id: App.uid() }, item); })
      };
    }
    return p;
  };

  // ---------- checklists ----------
  // Every checklist has a list id:
  //   "day:2026-11-01"           planner tasks for one day
  //   "pdaily:gsoc:2026-11-01"   one program's to-dos for one day
  //   "milestones:gsoc"          one program's long-term milestones
  App.getList = function (listId, create) {
    const parts = listId.split(':');
    if (parts[0] === 'day') {
      return create ? App.ensureDay(parts[1]).tasks : App.getDay(parts[1]).tasks;
    }
    if (parts[0] === 'pdaily') {
      const p = App.getProgram(parts[1]);
      if (create && !p.daily[parts[2]]) p.daily[parts[2]] = [];
      return p.daily[parts[2]] || [];
    }
    if (parts[0] === 'milestones') return App.getProgram(parts[1]).milestones;
    return [];
  };

  // Past days are locked (read only).
  App.isListLocked = function (listId) {
    const parts = listId.split(':');
    const key = parts[0] === 'day' ? parts[1] : parts[0] === 'pdaily' ? parts[2] : null;
    return key ? key < App.todayKey() : false;
  };

  // ---------- backup ----------
  App.exportData = function () {
    const blob = new Blob([JSON.stringify(App.data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'open-source-2027-backup-' + App.todayKey() + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  };

  App.importData = function (text) {
    const obj = JSON.parse(text);
    if (!obj || typeof obj !== 'object' || !obj.days || !obj.programs) throw new Error('This is not an Open Source 2027 backup file.');
    App.data = Object.assign(emptyData(), obj);
    App.save();
  };

  App.resetData = function () {
    App.data = emptyData();
    App.save();
  };

  // If you have the app open in two tabs, keep them in step.
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY) {
      App.data = load();
      if (App.render) App.render();
    }
  });
})(window.App);
