/* progress.js
   4 stat tiles and a day-by-day heatmap from Nov 2026 to Aug 2027.
   "Things done" on a day = ticked planner tasks + ticked program to-dos
   + journal entries + contributions logged that day. */

(function (App) {
  const START = '2026-11-01';
  const END = '2027-08-31';

  function doneCount(list) { return (list || []).filter(function (t) { return t.done; }).length; }

  function activityByDay() {
    const counts = {};
    function add(key, n) { if (key && n > 0) counts[key] = (counts[key] || 0) + n; }

    Object.keys(App.data.days).forEach(function (key) { add(key, doneCount(App.data.days[key].tasks)); });
    App.PROGRAM_ORDER.forEach(function (id) {
      const p = App.data.programs[id];
      if (!p) return;
      Object.keys(p.daily || {}).forEach(function (key) { add(key, doneCount(p.daily[key])); });
      (p.journal || []).forEach(function (j) { add(j.date, 1); });
    });
    App.data.contributions.forEach(function (c) { add(c.date, 1); });
    return counts;
  }

  function tasksDone() {
    let n = 0;
    Object.keys(App.data.days).forEach(function (key) { n += doneCount(App.data.days[key].tasks); });
    App.PROGRAM_ORDER.forEach(function (id) {
      const p = App.data.programs[id];
      if (p) Object.keys(p.daily || {}).forEach(function (key) { n += doneCount(p.daily[key]); });
    });
    return n;
  }

  // Streak = days in a row with something done. Today still counts as "in progress",
  // so if today is empty the streak is counted up to yesterday.
  function streaks(counts) {
    let key = App.todayKey();
    if (!counts[key]) key = App.addDays(key, -1);
    let current = 0;
    while (counts[key]) { current++; key = App.addDays(key, -1); }

    const keys = Object.keys(counts).sort();
    let best = 0, run = 0, prev = null;
    keys.forEach(function (k) {
      run = prev && App.addDays(prev, 1) === k ? run + 1 : 1;
      best = Math.max(best, run);
      prev = k;
    });
    return { current: current, best: best };
  }

  function tileHTML(label, number, note) {
    return '<div class="os-stat"><span class="os-label">' + label + '</span><span class="os-num-lg">' + number + '</span>' +
      '<span class="os-stat__note">' + note + '</span></div>';
  }

  function heatmapHTML(counts) {
    const today = App.todayKey();
    const cells = [
      '<span class="os-heat__d" style="grid-row:3">Mon</span>',
      '<span class="os-heat__d" style="grid-row:5">Wed</span>',
      '<span class="os-heat__d" style="grid-row:7">Fri</span>'
    ];
    let key = App.weekStart(START); // start on a Monday
    let week = 0, lastMonth = '';
    while (key <= END) {
      const col = week + 2;
      const row = (App.fromKey(key).getDay() + 6) % 7 + 2; // Monday = row 2
      const inRange = key >= START;
      if (inRange && key.slice(0, 7) !== lastMonth) {
        lastMonth = key.slice(0, 7);
        const m = App.MONTHS[Number(key.slice(5, 7)) - 1];
        const label = key.slice(5, 7) === '01' || key === START ? m + ' ' + key.slice(2, 4) : m;
        cells.push('<span class="os-heat__m" style="grid-column:' + col + ' / span 4">' + label + '</span>');
      }
      const n = counts[key] || 0;
      const cls = 'os-heat__c' + (key > today ? ' is-future' : '') + (key === today ? ' is-today' : '');
      cells.push('<span class="' + cls + '" data-l="' + Math.min(4, n) + '" style="grid-row:' + row + ';grid-column:' + col +
        (inRange ? '' : ';visibility:hidden') + '" title="' + App.formatDate(key) + ': ' + n + (n === 1 ? ' thing' : ' things') + ' done"></span>');
      if (row === 8) week++;
      key = App.addDays(key, 1);
    }
    return '<div class="os-heat" role="img" aria-label="Heatmap of things done each day from 01.11.2026 to 31.08.2027">' +
      '<div class="os-heat__grid" style="grid-template-columns:28px">' + cells.join('') + '</div></div>' +
      '<div class="os-heat__legend">Less <span class="os-heat__c"></span><span class="os-heat__c" data-l="1"></span>' +
      '<span class="os-heat__c" data-l="2"></span><span class="os-heat__c" data-l="3"></span><span class="os-heat__c" data-l="4"></span> More</div>';
  }

  App.render = function () {
    const counts = activityByDay();
    const s = streaks(counts);
    const active = Object.keys(counts).length;
    const merged = App.data.contributions.filter(function (c) { return c.status === 'merged'; }).length;

    App.mount(document.getElementById('app'),
      '<div class="os-phead"><div><p class="os-label">Nov 2026 to Aug 2027</p><h1 class="os-h1">Progress</h1></div></div>' +
      '<div class="os-grid-4">' +
      tileHTML('Current streak', s.current + ' <span class="os-small os-muted">' + (s.current === 1 ? 'day' : 'days') + '</span>', 'Best so far: ' + s.best + (s.best === 1 ? ' day' : ' days')) +
      tileHTML('Active days', active, 'Days with at least one thing done') +
      tileHTML('Tasks done', tasksDone(), 'Planner and program to-dos') +
      tileHTML('Merged PRs', merged, 'Marked Merged on Contributions') +
      '</div>' +
      '<section class="os-card os-section">' + App.cardHead('Every day', '<span class="os-card__meta">01.11.2026 &ndash; 31.08.2027</span>') +
      '<div class="os-card__body">' + heatmapHTML(counts) + '</div></section>');
  };
})(window.App);
