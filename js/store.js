/* store.js
   Keeps all your data in one object (App.data) and saves it to localStorage
   (localStorage = a small storage space inside your browser that stays after you close the tab).

   Shape of App.data:
   {
     days:          { "2026-11-01": { tasks: [{ id, text, done }], rating: 0..5 } },
     weekFocus:     { "2026-10-26": "text for that week" },      key = the Monday
     programs:      { gsoc: { orgs, daily, milestones, journal, proposals, timeline }, ... },
     contributions: [{ id, date, what, project, type, status }]
   } */

(function (App) {
  const STORAGE_KEY = 'open-source-2027';

  function emptyData() {
    return { version: 1, days: {}, weekFocus: {}, programs: {}, contributions: [] };
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
