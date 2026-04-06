/* planner.js
   The Planner page (index.html): a summary of one day across all programs.
   Top: title on the left, the date on the right with arrows to move between days.
   Below: one block per program with what you logged that day (org, issue, PRs).
   You add and edit entries on each program's own page (GSoC, ESoC, LFX, SoB):
   the "Open GSoC" button takes you there. */

(function (App) {
  const esc = App.esc;

  function rowHTML(e) {
    const prs = App.entryPRs(e);
    return '<li class="os-sum__row">' +
      '<div class="os-sum__main"><span class="os-sum__org">' + App.icon('org') + esc(e.org) + '</span>' +
      (e.issue ? '<span class="os-sum__issue">' + esc(e.issue) + '</span>' : '') + '</div>' +
      (prs.length ? '<div class="os-sum__prs">' + prs.map(function (p) {
        return '<a class="os-entry-link" href="' + esc(App.safeUrl(p.link)) + '" target="_blank" rel="noopener">' + App.icon('branch') +
          '<span>' + esc(App.prShortName(p.link)) + '</span></a>' + App.prPillHTML(p.status);
      }).join('') + '</div>' : '') +
      '</li>';
  }

  function blockHTML(id) {
    const info = App.PROGRAMS[id];
    const list = App.getLog(App.logDay, id);
    const prCount = list.reduce(function (n, e) { return n + App.entryPRs(e).length; }, 0);
    return '<section class="os-card os-plan-block" style="--prog:var(--' + id + ')" aria-label="' + esc(info.title) + '">' +
      '<div class="os-card__head os-plan-block__head">' +
      '<div class="os-row" style="gap:10px"><span class="os-plan-block__dot" aria-hidden="true"></span>' +
      '<h2 class="os-h2">' + esc(info.title) + '</h2>' +
      '<span class="os-card__meta">' + list.length + (list.length === 1 ? ' entry' : ' entries') + ' &middot; ' + prCount + (prCount === 1 ? ' PR' : ' PRs') + '</span></div>' +
      '<a class="os-btn os-btn--ghost os-btn--sm" href="' + info.page + '">Open ' + esc(info.short) + ' ' + App.icon('right') + '</a></div>' +
      '<div class="os-card__body">' +
      (list.length ? '<ul class="os-sum">' + list.map(rowHTML).join('') + '</ul>'
        : '<p class="os-list-empty os-plan-empty">Nothing logged on this day. Add it on the <a href="' + info.page + '">' + esc(info.short) + ' page</a>.</p>') +
      '</div></section>';
  }

  App.render = function () {
    let total = 0;
    App.PROGRAM_ORDER.forEach(function (id) { total += App.getLog(App.logDay, id).length; });
    App.mount(document.getElementById('app'),
      '<div class="os-plan-head">' +
      '<div><p class="os-label">Summary of the day</p><h1 class="os-h1">Planner</h1>' +
      '<p class="os-phead__sub">' + total + (total === 1 ? ' entry' : ' entries') + ' across all programs</p></div>' +
      App.logDateHTML() + '</div>' +
      '<div class="os-stack">' + App.PROGRAM_ORDER.map(blockHTML).join('') + '</div>');
  };
})(window.App);
