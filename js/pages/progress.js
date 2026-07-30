/* progress.js
   Three numbers: active days, merged PRs, PRs in review.
   Then one block per program: each organization with its merged and in-review PRs and their links.
   Everything comes from My PRs and the work log (App.prSummary in store.js), nothing is typed in here. */

(function (App) {
  const esc = App.esc;

  function orgHTML(name, list) {
    const merged = list.filter(function (p) { return p.status === 'merged'; });
    const review = list.filter(function (p) { return p.status === 'review'; });
    const closed = list.filter(function (p) { return p.status === 'closed'; });
    function group(items, status) {
      if (!items.length) return '';
      return '<ul class="os-prlist">' + items.map(function (p) {
        return '<li>' + App.prLinkHTML(p) + '<span class="os-mono os-small os-muted">' + App.formatDate(p.lastDay) + '</span></li>';
      }).join('') + '</ul>';
    }
    return '<div class="os-prorg">' +
      '<div class="os-prorg__head"><div class="os-log__org">' + App.icon('org') + '<h3 class="os-h3">' + esc(name) + '</h3></div>' +
      '<div class="os-row" style="gap:8px">' +
      '<span class="os-pill os-pill--merged">' + merged.length + ' merged</span>' +
      '<span class="os-pill os-pill--review">' + review.length + ' in review</span>' +
      (closed.length ? '<span class="os-pill os-pill--closed">' + closed.length + ' closed</span>' : '') + '</div></div>' +
      (merged.length ? '<p class="os-label os-prorg__label">Merged</p>' + group(merged) : '') +
      (review.length ? '<p class="os-label os-prorg__label">In review</p>' + group(review) : '') +
      (closed.length ? '<p class="os-label os-prorg__label">Closed</p>' + group(closed) : '') +
      '</div>';
  }

  function programHTML(id, prs) {
    const info = App.PROGRAMS[id];
    const mine = prs.filter(function (p) { return p.program === id; });
    const byOrg = {};
    mine.forEach(function (p) {
      const k = (p.org || 'No organization').trim();
      (byOrg[k] = byOrg[k] || []).push(p);
    });
    const orgs = Object.keys(byOrg).sort(function (a, b) { return a.localeCompare(b); });
    const merged = mine.filter(function (p) { return p.status === 'merged'; }).length;
    return '<section class="os-card os-plan-block" style="--prog:var(--' + id + ')" aria-label="' + esc(info.title) + '">' +
      '<div class="os-card__head os-plan-block__head"><div class="os-row" style="gap:10px"><span class="os-plan-block__dot" aria-hidden="true"></span>' +
      '<h2 class="os-h2">' + esc(info.title) + '</h2></div>' +
      '<span class="os-card__meta">' + merged + ' merged &middot; ' + mine.filter(function (p) { return p.status === 'review'; }).length + ' in review</span></div>' +
      '<div class="os-card__body os-plan-block__body">' +
      (orgs.length ? orgs.map(function (o) { return orgHTML(o, byOrg[o]); }).join('')
        : '<p class="os-list-empty os-plan-empty">No PRs yet. Add them under My PRs on the ' + esc(info.short) + ' page.</p>') +
      '</div></section>';
  }

  App.render = function () {
    const s = App.prSummary();
    s.prs.sort(function (a, b) { return a.lastDay < b.lastDay ? 1 : a.lastDay > b.lastDay ? -1 : 0; });
    App.mount(document.getElementById('app'),
      '<div class="os-phead"><div><p class="os-label">From My PRs on each program page</p><h1 class="os-h1">Progress</h1></div></div>' +
      App.statTilesHTML(s) +
      '<div class="os-stack os-section">' + App.PROGRAM_ORDER.map(function (id) { return programHTML(id, s.prs); }).join('') + '</div>');
  };
})(window.App);
