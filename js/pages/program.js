/* program.js
   ONE template for every program page: GSoC, ESoC, LFX and Summer of Bitcoin.
   The HTML page says which program it is with <body data-program="gsoc">.
   The page shows: the program header, "My PRs" (every PR in every org, with link and
   status you can change any day), and the daily work log (js/components/worklog.js). */

(function (App) {
  const esc = App.esc;
  const id = document.body.dataset.program;
  const info = App.PROGRAMS[id];

  // ---------- header ----------
  function headerHTML(p) {
    const next = p.timeline.slice()
      .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; })
      .find(function (t) { return !App.isPast(t.date); });
    const chip = next
      ? '<span class="os-chip">' + App.icon('clock') + esc(next.title) + ' <span class="os-mono">&middot; ' + esc(App.countdown(next.date).text) + '</span></span>'
      : '';
    return '<div class="os-phead"><div>' +
      '<p class="os-label">Program</p>' +
      '<h1 class="os-h1">' + esc(info.title) + '</h1>' +
      '<p class="os-phead__sub">' + esc(info.name) + ' &middot; <a href="' + info.site + '" target="_blank" rel="noopener">Official site' + App.icon('ext') + '</a></p>' +
      '</div>' + chip + '</div>';
  }

  // ---------- My PRs: every PR in every org, with its link and status ----------
  const STATUS_LIST = [
    { value: 'review', label: 'In review' },
    { value: 'merged', label: 'Merged' },
    { value: 'closed', label: 'Closed' }
  ];
  function myPRs() {
    return App.getPRs().filter(function (p) { return p.program === id; });
  }
  // Org names already used on this program, for the suggestions in the form.
  function knownOrgs() {
    const names = {};
    myPRs().forEach(function (p) { names[p.org] = true; });
    Object.keys(App.data.log || {}).forEach(function (d) { App.getLog(d, id).forEach(function (e) { if (e.org) names[e.org] = true; }); });
    return Object.keys(names).sort(function (a, b) { return a.localeCompare(b); });
  }
  function statusSelect(p) {
    return '<select class="os-select os-select--sm os-prstatus os-prstatus--' + p.status + '" data-pr-change="' + p.id + '" aria-label="Status of ' + esc(p.title || 'PR') + '">' +
      STATUS_LIST.map(function (o) { return '<option value="' + o.value + '"' + (o.value === p.status ? ' selected' : '') + '>' + o.label + '</option>'; }).join('') + '</select>';
  }
  function countsHTML(list) {
    function n(st) { return list.filter(function (p) { return p.status === st; }).length; }
    return '<span class="os-pill os-pill--merged">' + n('merged') + ' merged</span>' +
      '<span class="os-pill os-pill--review">' + n('review') + ' in review</span>' +
      (n('closed') ? '<span class="os-pill os-pill--closed">' + n('closed') + ' closed</span>' : '');
  }
  function myPRsHTML() {
    const list = myPRs();
    const byOrg = {};
    list.forEach(function (p) { (byOrg[p.org] = byOrg[p.org] || []).push(p); });
    const orgs = Object.keys(byOrg).sort(function (a, b) { return a.localeCompare(b); });
    const body = orgs.length ? orgs.map(function (org) {
      const prs = byOrg[org].slice().sort(function (a, b) { return a.opened < b.opened ? -1 : a.opened > b.opened ? 1 : 0; });
      const rows = prs.map(function (p, i) {
        return '<tr><td class="os-mono os-muted">' + (i + 1) + '</td>' +
          '<td class="os-prcell"><span class="os-prtitle">' + esc(p.title || App.prShortName(p.link)) + '</span>' +
          '<a class="os-entry-link" href="' + esc(App.safeUrl(p.link)) + '" target="_blank" rel="noopener">' + App.icon('branch') + '<span>' + esc(App.prShortName(p.link)) + '</span></a></td>' +
          '<td>' + statusSelect(p) + '</td>' +
          '<td class="os-mono os-small">' + App.formatDate(p.opened) + '</td>' +
          '<td class="os-mono os-small">' + (p.updated && p.updated !== p.opened ? App.formatDate(p.updated) : '&ndash;') + '</td>' +
          '<td class="os-prtable__act"><button type="button" class="os-iconbtn" data-pr-edit="' + p.id + '" aria-label="Edit PR">' + App.icon('edit') + '</button>' +
          '<button type="button" class="os-iconbtn os-iconbtn--danger" data-pr-del="' + p.id + '" aria-label="Delete PR">' + App.icon('trash') + '</button></td></tr>';
      }).join('');
      return '<div class="os-prorg">' +
        '<div class="os-prorg__head"><div class="os-log__org">' + App.icon('org') + '<h3 class="os-h3">' + esc(org) + '</h3>' +
        '<span class="os-card__meta">' + prs.length + ' PR' + (prs.length === 1 ? '' : 's') + '</span></div>' +
        '<div class="os-row" style="gap:8px">' + countsHTML(prs) +
        '<button type="button" class="os-btn os-btn--ghost os-btn--sm" data-pr-add-org="' + esc(org) + '">' + App.icon('plus') + ' Add PR</button></div></div>' +
        '<div class="os-tablewrap"><table class="os-table os-prtable"><thead><tr><th>#</th><th>PR</th><th>Status</th><th>Opened</th><th>Updated</th><th><span class="os-sr">Actions</span></th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div></div>';
    }).join('') : '<p class="os-list-empty os-plan-empty">No PRs yet. Opened a PR? Press Add PR, write the org, the PR title and link. When it gets merged or closed, change its status right here.</p>';
    return '<section class="os-card os-plan-block os-section" style="--prog:var(--' + id + ')" aria-label="My PRs">' +
      '<div class="os-card__head os-plan-block__head"><div class="os-row" style="gap:10px"><span class="os-plan-block__dot" aria-hidden="true"></span>' +
      '<h2 class="os-h2">My PRs</h2><span class="os-card__meta">' + list.length + ' total</span></div>' +
      '<div class="os-row" style="gap:8px">' + (list.length ? countsHTML(list) : '') +
      '<button type="button" class="os-btn os-btn--primary os-btn--sm" data-pr-add-org="">' + App.icon('plus') + ' Add PR</button></div></div>' +
      '<div class="os-card__body os-plan-block__body">' + body + '</div></section>';
  }

  function openPRForm(pr, org) {
    const e = pr || { org: org || '', title: '', link: '', status: 'review', opened: App.todayKey() };
    const orgs = knownOrgs();
    App.openModal({
      title: pr ? 'Edit PR' : 'Add PR',
      subtitle: info.title,
      submitLabel: pr ? 'Save changes' : 'Add PR',
      body:
        App.field('Organization', App.textInput('org', e.org, 'e.g. sktime', ' list="org-list" autocomplete="off"') +
          '<datalist id="org-list">' + orgs.map(function (o) { return '<option value="' + esc(o) + '">'; }).join('') + '</datalist>', { full: true }) +
        App.field('PR title', App.textInput('title', e.title, 'e.g. Fix date parsing in forecaster'), { full: true }) +
        App.field('PR link', App.textInput('link', e.link, 'github.com/org/repo/pull/456'), { full: true }) +
        App.field('Status', App.selectInput('status', STATUS_LIST, e.status)) +
        App.field('Opened on', '<input class="os-input" type="date" name="opened" value="' + esc(e.opened || App.todayKey()) + '">'),
      onSubmit: function (v) {
        const data = { org: (v.org || '').trim(), title: (v.title || '').trim(), link: (v.link || '').trim(), status: v.status, opened: v.opened || App.todayKey() };
        if (!data.org) return 'Write the organization name.';
        if (!data.link) return 'Add the PR link.';
        const dupe = App.getPRs().find(function (p) { return p !== pr && App.prKey(p.link) === App.prKey(data.link); });
        if (dupe) return 'This PR link is already in your list (' + dupe.org + '). Change its status there instead.';
        if (pr) {
          if (pr.status !== data.status) data.updated = App.todayKey();
          Object.assign(pr, data);
        } else {
          App.getPRs().push(Object.assign({ id: App.uid(), program: id, updated: data.opened }, data));
        }
        App.commit();
      }
    });
  }

  document.addEventListener('change', function (ev) {
    const sel = ev.target.closest('[data-pr-change]');
    if (!sel) return;
    const pr = App.getPRs().find(function (p) { return p.id === sel.dataset.prChange; });
    if (pr && pr.status !== sel.value) { pr.status = sel.value; pr.updated = App.todayKey(); App.commit(); }
  });
  document.addEventListener('click', function (ev) {
    const add = ev.target.closest('[data-pr-add-org]');
    if (add) { openPRForm(null, add.dataset.prAddOrg); return; }
    const ed = ev.target.closest('[data-pr-edit]');
    if (ed) { const pr = App.getPRs().find(function (p) { return p.id === ed.dataset.prEdit; }); if (pr) openPRForm(pr); return; }
    const del = ev.target.closest('[data-pr-del]');
    if (del && confirm('Delete this PR from your list?')) {
      const list = App.getPRs();
      const i = list.findIndex(function (p) { return p.id === del.dataset.prDel; });
      if (i > -1) { list.splice(i, 1); App.commit(); }
    }
  });

  App.render = function () {
    const p = App.getProgram(id);
    document.title = info.title + ' · Open Source 2027';
    App.mount(document.getElementById('app'), headerHTML(p) + myPRsHTML() + App.workLogHTML(id));
  };
})(window.App);
