/* contributions.js
   Every PR from My PRs (program pages) and work entries, newest first, with its status.
   Nothing is added here by hand: add PRs under My PRs on a program page
   and it shows up here (and on the Progress page) by itself. */

(function (App) {
  const esc = App.esc;

  function tableHTML(prs) {
    if (!prs.length) {
      return '<div class="os-card__body">' + App.emptyHTML('branch', 'No PRs yet',
        'Add your PRs under My PRs on a program page (GSoC, ESoC, LFX, SoB). They show up here automatically.') + '</div>';
    }
    const body = prs.map(function (p) {
      const info = App.PROGRAMS[p.program];
      return '<tr><td class="os-mono">' + App.formatDate(p.lastDay) + '</td>' +
        '<td><span class="os-prog-chip" style="--prog:var(--' + p.program + ')">' + esc(info.short) + '</span></td>' +
        '<td>' + esc(p.org) + '</td>' +
        '<td class="os-prcell">' + App.prLinkHTML(p) + '</td>' +
        '<td><span class="os-pill os-pill--' + p.status + '">' + App.PR_STATUS[p.status] + '</span></td></tr>';
    }).join('');
    return '<div class="os-tablewrap"><table class="os-table"><thead><tr><th>Last update</th><th>Program</th><th>Organization</th><th>PR</th><th>Status</th>' +
      '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }

  App.render = function () {
    const s = App.prSummary();
    const prs = s.prs.sort(function (a, b) { return a.lastDay < b.lastDay ? 1 : a.lastDay > b.lastDay ? -1 : 0; });
    App.mount(document.getElementById('app'),
      '<div class="os-phead"><div><p class="os-label">Added from your program pages automatically</p><h1 class="os-h1">Contributions</h1></div></div>' +
      App.statTilesHTML(s) +
      '<section class="os-card os-section">' + App.cardHead('All PRs', '<span class="os-card__meta">Newest first &middot; to change a status, use My PRs on the program page</span>') +
      tableHTML(prs) + '</section>');
  };
})(window.App);
