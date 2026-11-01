/* contributions.js
   A log of everything you sent: date, what, project, type, status and delete.
   The add form sits on top. Rows marked Merged feed the Progress page. */

(function (App) {
  const esc = App.esc;
  const TYPES = ['Code', 'Docs', 'Issue', 'Review', 'Other'];
  const STATUSES = [
    { value: 'open', label: 'Open' },
    { value: 'review', label: 'In review' },
    { value: 'merged', label: 'Merged' },
    { value: 'closed', label: 'Closed' }
  ];

  function formHTML() {
    return '<form class="os-addform" data-contrib-form novalidate>' +
      App.field('Date', '<input class="os-input os-mono" type="date" name="date" value="' + App.todayKey() + '" data-keep="c-date">') +
      App.field('What', '<input class="os-input" name="what" placeholder="What did you do?" maxlength="200" data-keep="c-what">') +
      App.field('Project', '<input class="os-input" name="project" placeholder="e.g. OSS-CRS" maxlength="80" data-keep="c-project">') +
      App.field('Type', '<select class="os-select" name="type" data-keep="c-type">' + TYPES.map(function (t) { return '<option>' + t + '</option>'; }).join('') + '</select>') +
      App.field('Status', '<select class="os-select" name="status" data-keep="c-status">' + STATUSES.map(function (s) { return '<option value="' + s.value + '">' + s.label + '</option>'; }).join('') + '</select>') +
      '<button type="submit" class="os-btn os-btn--primary">' + App.icon('plus') + ' Add</button>' +
      '</form><p class="os-modal__error" style="margin:10px 0 0" role="alert" hidden data-contrib-error></p>';
  }

  function tableHTML(rows) {
    if (!rows.length) {
      return App.emptyHTML('flag', 'No contributions yet', 'Add your first one above: a PR, an issue or a docs fix.');
    }
    const body = rows.map(function (c) {
      const select = '<select class="os-select os-select--sm" data-action="contrib-status" data-id="' + c.id + '" aria-label="Status">' +
        STATUSES.map(function (s) { return '<option value="' + s.value + '"' + (s.value === c.status ? ' selected' : '') + '>' + s.label + '</option>'; }).join('') +
        '</select>';
      return '<tr><td class="os-mono">' + App.formatDate(c.date) + '</td><td>' + esc(c.what) + '</td><td>' + esc(c.project) + '</td>' +
        '<td><span class="os-tech">' + esc(c.type) + '</span></td>' +
        '<td><div class="os-row" style="gap:8px;flex-wrap:nowrap"><span class="os-pill os-pill--' + c.status + '" style="padding:0 6px" aria-hidden="true"></span>' + select + '</div></td>' +
        '<td style="text-align:right"><button type="button" class="os-iconbtn os-iconbtn--danger" data-action="contrib-delete" data-id="' + c.id + '" aria-label="Delete">' + App.icon('trash') + '</button></td></tr>';
    }).join('');
    return '<div class="os-tablewrap"><table class="os-table"><thead><tr><th>Date</th><th>What</th><th>Project</th><th>Type</th><th>Status</th>' +
      '<th><span class="os-sr">Delete</span></th></tr></thead><tbody>' + body + '</tbody></table></div>';
  }

  App.render = function () {
    const rows = App.data.contributions.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
    const merged = rows.filter(function (c) { return c.status === 'merged'; }).length;
    App.mount(document.getElementById('app'),
      '<div class="os-phead"><div><p class="os-label">PRs, issues and docs</p><h1 class="os-h1">Contributions</h1></div>' +
      '<span class="os-card__meta">' + rows.length + ' total &middot; ' + merged + ' merged</span></div>' +
      '<section class="os-card">' + App.cardHead('Add a contribution') + '<div class="os-card__body">' + formHTML() + '</div></section>' +
      '<section class="os-card os-section">' + App.cardHead('All contributions', '<span class="os-card__meta">Newest first</span>') + tableHTML(rows) + '</section>');
  };

  document.addEventListener('submit', function (e) {
    const form = e.target.closest('[data-contrib-form]');
    if (!form) return;
    e.preventDefault();
    const v = {};
    new FormData(form).forEach(function (value, key) { v[key] = String(value).trim(); });
    const error = document.querySelector('[data-contrib-error]');
    if (!v.what) { error.textContent = 'Write what you did.'; error.hidden = false; form.what.focus(); return; }
    if (!v.date) { error.textContent = 'Pick a date.'; error.hidden = false; return; }
    App.data.contributions.push({ id: App.uid(), date: v.date, what: v.what, project: v.project, type: v.type, status: v.status });
    form.what.value = '';
    form.project.value = '';
    App.commit('c-what');
  });

  document.addEventListener('change', function (e) {
    const sel = e.target.closest('[data-action="contrib-status"]');
    if (!sel) return;
    const c = App.data.contributions.find(function (x) { return x.id === sel.dataset.id; });
    if (c) { c.status = sel.value; App.commit(); }
  });

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-action="contrib-delete"]');
    if (!btn) return;
    const i = App.data.contributions.findIndex(function (x) { return x.id === btn.dataset.id; });
    if (i > -1) { App.data.contributions.splice(i, 1); App.commit(); }
  });
})(window.App);
