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
     focus:         { days: { "2026-11-22": { gsoc: 3600 } },   seconds of focus time per program
                      running: { program: "gsoc", since: 1795000000000 } or null }   the timer that is ticking now
                    (the work log on each program page; the Planner shows a summary)
   } */

(function (App) {
  const STORAGE_KEY = 'open-source-2027';

  function emptyData() {
    return { version: 1, days: {}, weekFocus: {}, programs: {}, contributions: [], log: {}, focus: { days: {}, running: null } };
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
    merged: 'Merged'
  };
  App.prSummary = function () {
    const prs = {};
    let activeDays = 0;
    Object.keys(App.data.log || {}).sort().forEach(function (dayKey) {
      let any = false;
      App.PROGRAM_ORDER.forEach(function (programId) {
        App.getLog(dayKey, programId).forEach(function (e) {
          any = true;
          App.entryPRs(e).forEach(function (pr) {
            if (!App.PR_STATUS[pr.status]) return;
            const key = App.shortUrl(pr.link).toLowerCase().replace(/\/+$/, '');
            const old = prs[key];
            prs[key] = {
              link: pr.link,
              program: programId,
              org: e.org,
              title: e.issue || (old && old.title) || '',
              status: pr.status,
              firstDay: old ? old.firstDay : dayKey,
              lastDay: dayKey
            };
          });
        });
      });
      if (any) activeDays++;
    });
    const list = Object.keys(prs).map(function (k) { return prs[k]; });
    return {
      activeDays: activeDays,
      prs: list,
      merged: list.filter(function (p) { return p.status === 'merged'; }).length,
      review: list.filter(function (p) { return p.status === 'review'; }).length
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
