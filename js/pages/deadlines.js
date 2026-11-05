/* deadlines.js
   Every date from all programs in one list, soonest first.
   Proposal deadlines are included too (until the result is in). */

(function (App) {
  const esc = App.esc;

  function allDates() {
    const rows = [];
    App.PROGRAM_ORDER.forEach(function (id) {
      const p = App.getProgram(id);
      p.timeline.forEach(function (t) {
        rows.push({ program: id, date: t.date, title: t.title, tag: t.tag, note: t.note });
      });
      p.proposals.forEach(function (pr) {
        if (pr.deadline && pr.status !== 'accepted' && pr.status !== 'not') {
          rows.push({ program: id, date: pr.deadline, title: 'Proposal: ' + pr.title, tag: 'proposed', note: pr.org });
        }
      });
    });
    return rows.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  }

  function rowHTML(r) {
    const info = App.PROGRAMS[r.program];
    return '<div class="os-dl' + (App.isPast(r.date) ? ' is-past' : '') + '">' +
      '<span class="os-chip os-chip--sm" style="--prog:var(--' + r.program + ')">' + esc(info.short) + '</span>' +
      '<span class="os-dl__what">' + esc(r.title) + (r.note ? '<span class="os-dl__note">' + esc(r.note) + '</span>' : '') + '</span>' +
      '<span class="os-dl__date">' + App.formatDate(r.date) + '</span>' +
      '<span>' + App.tagHTML(r.tag) + '</span>' +
      '<span class="os-dl__count">' + App.countdownHTML(r.date) + '</span>' +
      '</div>';
  }

  const LEGEND = [
    ['official', 'from the program site'],
    ['proposed', 'my own plan'],
    ['pending', 'known, may move'],
    ['expected', 'a guess, check later']
  ];

  App.render = function () {
    const rows = allDates();
    const upcoming = rows.filter(function (r) { return !App.isPast(r.date); });
    const past = rows.filter(function (r) { return App.isPast(r.date); }).reverse();

    App.mount(document.getElementById('app'),
      '<div class="os-phead"><div><p class="os-label">All programs</p><h1 class="os-h1">Deadlines</h1></div>' +
      '<button type="button" class="os-btn os-btn--primary" data-action="date-add">' + App.icon('plus') + ' Add date</button></div>' +
      '<div class="os-legend-row" aria-label="What the labels mean">' +
      LEGEND.map(function (l) { return '<span>' + App.tagHTML(l[0]) + l[1] + '</span>'; }).join('') + '</div>' +
      '<section class="os-card">' + App.cardHead('Coming up', '<span class="os-card__meta">Soonest first</span>') +
      (upcoming.length ? upcoming.map(rowHTML).join('')
        : App.emptyHTML('calendar', 'No dates coming up', 'Add the next date you need to remember.', { label: 'Add date', action: 'date-add' })) +
      '</section>' +
      (past.length ? '<section class="os-card os-section">' + App.cardHead('Already passed', '<span class="os-card__meta">' + past.length + '</span>') +
        past.map(rowHTML).join('') + '</section>' : ''));
  };

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-action="date-add"]')) App.openDateModal('');
  });
})(window.App);
