/* program.js
   ONE template for every program page: GSoC, ESoC, LFX and Summer of Bitcoin.
   The HTML page says which program it is with <body data-program="gsoc">.
   The page shows: the program header (Add org and Add PR buttons on the right), and
   "Organizations & PRs": every org with its PRs. Change a PR's status right in the table,
   and click a PR to read its full story: what, how and why you did it, what you learned.
   (The daily work log is on the Planner only.) */

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
      '</div><div class="os-phead__side">' + chip +
      '<div class="os-row" style="gap:8px">' +
      '<button type="button" class="os-btn os-btn--ghost os-btn--sm" data-org-add>' + App.icon('org') + ' Add org</button>' +
      '<a class="os-btn os-btn--primary os-btn--sm" href="prs.html?program=' + id + '">' + App.icon('plus') + ' Add PR</a></div></div></div>';
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
  // ---------- organizations: the ones you added + any org that has a PR ----------
  function orgList() {
    const p = App.getProgram(id);
    const map = {};
    p.orgs.forEach(function (o) { if (o.name) map[o.name.toLowerCase()] = { name: o.name, saved: o, prs: [] }; });
    myPRs().forEach(function (pr) {
      const k = (pr.org || 'No organization').toLowerCase();
      if (!map[k]) map[k] = { name: pr.org || 'No organization', saved: null, prs: [] };
      map[k].prs.push(pr);
    });
    return Object.keys(map).map(function (k) { return map[k]; })
      .sort(function (a, b) { return b.prs.length - a.prs.length || a.name.localeCompare(b.name); });
  }

  const NOTES = [
    { key: 'what', label: 'What I did', icon: 'check' },
    { key: 'how', label: 'How I did it', icon: 'branch' },
    { key: 'why', label: 'Why I did it', icon: 'issue' },
    { key: 'learned', label: 'What I learned', icon: 'bulb' }
  ];
  const open = {}; // PR ids whose full description is shown

  function detailHTML(p) {
    const notes = NOTES.map(function (n) {
      const t = (p[n.key] || '').trim();
      return '<div class="os-prcard__note' + (t ? '' : ' is-empty') + '"><p class="os-label">' + App.icon(n.icon) + n.label + '</p>' +
        '<p class="os-p">' + (t ? esc(t) : 'Not written yet') + '</p></div>';
    }).join('');
    return '<tr class="os-prdetail"><td></td><td colspan="5">' +
      '<div class="os-prdetail__box">' +
      '<div class="os-prdetail__meta"><a class="os-entry-link" href="' + esc(App.safeUrl(p.link)) + '" target="_blank" rel="noopener">' + App.icon('ext') + '<span>Open on GitHub</span></a>' +
      '<span class="os-mono os-small os-muted">Opened ' + App.formatDate(p.opened) + (p.updated && p.updated !== p.opened ? ' &middot; updated ' + App.formatDate(p.updated) : '') + '</span>' +
      '<a class="os-btn os-btn--ghost os-btn--sm" href="prs.html?edit=' + p.id + '">' + App.icon('edit') + ' Edit notes</a></div>' +
      '<div class="os-prcard__notes">' + notes + '</div></div></td></tr>';
  }

  function orgHTML(o) {
    const prs = o.prs.slice().sort(function (a, b) { return a.opened < b.opened ? -1 : a.opened > b.opened ? 1 : 0; });
    const rows = prs.map(function (p, i) {
      const isOpen = !!open[p.id];
      return '<tr class="os-prrow-click' + (isOpen ? ' is-open' : '') + '" data-pr-open="' + p.id + '" tabindex="0" aria-expanded="' + isOpen + '" title="Click to see what, how and why">' +
        '<td class="os-mono os-muted">' + (i + 1) + '</td>' +
        '<td class="os-prcell"><span class="os-prtitle">' + App.icon(isOpen ? 'down' : 'right') + esc(p.title || App.prShortName(p.link)) + '</span>' +
        '<span class="os-mono os-small os-muted">' + esc(App.prShortName(p.link)) + '</span></td>' +
        '<td>' + statusSelect(p) + '</td>' +
        '<td class="os-mono os-small">' + App.formatDate(p.opened) + '</td>' +
        '<td class="os-mono os-small">' + (p.updated && p.updated !== p.opened ? App.formatDate(p.updated) : '&ndash;') + '</td>' +
        '<td class="os-prtable__act"><button type="button" class="os-iconbtn os-iconbtn--danger" data-pr-del="' + p.id + '" aria-label="Delete PR">' + App.icon('trash') + '</button></td></tr>' +
        (isOpen ? detailHTML(p) : '');
    }).join('');
    const saved = o.saved;
    const extra = saved ? ((saved.stack || []).map(function (t) { return '<span class="os-tech">' + esc(t) + '</span>'; }).join('') +
      (saved.repo ? '<a class="os-entry-link" href="' + esc(App.safeUrl(saved.repo)) + '" target="_blank" rel="noopener">' + App.icon('github') + '<span>' + esc(App.shortUrl(saved.repo)) + '</span></a>' : '')) : '';
    return '<div class="os-prorg">' +
      '<div class="os-prorg__head"><div class="os-log__org">' + App.icon('org') + '<h3 class="os-h3">' + esc(o.name) + '</h3>' +
      '<span class="os-card__meta">' + prs.length + ' PR' + (prs.length === 1 ? '' : 's') + '</span></div>' +
      '<div class="os-row" style="gap:8px">' + (prs.length ? countsHTML(prs) : '') +
      (saved ? '<button type="button" class="os-iconbtn" data-org-edit="' + saved.id + '" aria-label="Edit organization">' + App.icon('edit') + '</button>' +
        '<button type="button" class="os-iconbtn os-iconbtn--danger" data-org-del="' + saved.id + '" aria-label="Remove organization">' + App.icon('trash') + '</button>' : '') +
      '</div></div>' +
      (extra ? '<div class="os-log__tech">' + extra + '</div>' : '') +
      (prs.length ? '<div class="os-tablewrap"><table class="os-table os-prtable"><thead><tr><th>#</th><th>PR</th><th>Status</th><th>Opened</th><th>Updated</th><th><span class="os-sr">Actions</span></th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>'
        : '<p class="os-list-empty os-plan-empty">No PRs in this org yet. Use Add PR at the top.</p>') +
      '</div>';
  }

  function myPRsHTML() {
    const list = myPRs();
    const orgs = orgList();
    return '<section class="os-card os-plan-block os-section" style="--prog:var(--' + id + ')" aria-label="Organizations and PRs">' +
      '<div class="os-card__head os-plan-block__head"><div class="os-row" style="gap:10px"><span class="os-plan-block__dot" aria-hidden="true"></span>' +
      '<h2 class="os-h2">Organizations &amp; PRs</h2><span class="os-card__meta">' + orgs.length + ' org' + (orgs.length === 1 ? '' : 's') + ' &middot; ' + list.length + ' PR' + (list.length === 1 ? '' : 's') + '</span></div>' +
      (list.length ? '<div class="os-row" style="gap:8px">' + countsHTML(list) + '</div>' : '') + '</div>' +
      '<div class="os-card__body os-plan-block__body">' +
      (orgs.length ? orgs.map(orgHTML).join('')
        : '<p class="os-list-empty os-plan-empty">No organizations yet. Use Add org at the top right, then Add PR for each PR you open. Click a PR to read what, how and why you did it.</p>') +
      '</div></section>';
  }

  function openOrgForm(org) {
    const o = org || { name: '', repo: '', stack: [] };
    App.openModal({
      title: org ? 'Edit organization' : 'Add organization',
      subtitle: info.title,
      submitLabel: org ? 'Save changes' : 'Add organization',
      body:
        App.field('Organization name', App.textInput('name', o.name, 'e.g. Swift', ' maxlength="80"'), { full: true }) +
        App.field('Repo link', App.textInput('repo', o.repo, 'github.com/org/repo'), { full: true }) +
        App.chipInput('stack', o.stack, 'e.g. Python'),
      onSubmit: function (v) {
        const name = (v.name || '').trim();
        if (!name) return 'Write the organization name.';
        const p = App.getProgram(id);
        const same = p.orgs.find(function (x) { return x !== org && (x.name || '').toLowerCase() === name.toLowerCase(); });
        if (same) return name + ' is already in your list.';
        const data = { name: name, repo: (v.repo || '').trim(), stack: v.stack ? v.stack.split(',').map(function (t) { return t.trim(); }).filter(Boolean) : [] };
        if (org) {
          const old = org.name;
          Object.assign(org, data);
          if (old !== name) App.getPRs().forEach(function (pr) { if (pr.program === id && pr.org === old) pr.org = name; });
        } else {
          p.orgs.push(Object.assign({ id: App.uid(), status: 'contributing' }, data));
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
  function toggle(row) {
    const pid = row.dataset.prOpen;
    if (open[pid]) delete open[pid]; else open[pid] = true;
    App.render();
    const again = document.querySelector('[data-pr-open="' + pid + '"]');
    if (again) again.focus();
  }
  document.addEventListener('keydown', function (ev) {
    const row = ev.target.closest && ev.target.closest('[data-pr-open]');
    if (row && ev.target === row && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); toggle(row); }
  });
  document.addEventListener('click', function (ev) {
    if (ev.target.closest('[data-org-add]')) { openOrgForm(); return; }
    const oe = ev.target.closest('[data-org-edit]');
    if (oe) { openOrgForm(App.getProgram(id).orgs.find(function (o) { return o.id === oe.dataset.orgEdit; })); return; }
    const od = ev.target.closest('[data-org-del]');
    if (od) {
      const p = App.getProgram(id), o = p.orgs.find(function (x) { return x.id === od.dataset.orgDel; });
      if (o && confirm('Remove ' + o.name + ' from your list? Its PRs stay.')) { p.orgs.splice(p.orgs.indexOf(o), 1); App.commit(); }
      return;
    }
    const row = ev.target.closest('[data-pr-open]');
    if (row && !ev.target.closest('select, button, a, input')) { toggle(row); return; }
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
    App.mount(document.getElementById('app'), headerHTML(p) + myPRsHTML());
  };
})(window.App);
