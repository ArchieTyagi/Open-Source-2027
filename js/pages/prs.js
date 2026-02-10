/* prs.js
   The "Add PR" page (prs.html).
   Top: a form to add a PR (or edit one): program, org, title, link, status, date,
        and four notes: what I did, how I did it, why I did it, what I learned.
   Below: every PR as a card with those notes. Change the status right on the card.
   Links into this page:  prs.html?program=gsoc&org=Swift   (Add PR from a program page)
                          prs.html?edit=<id>                 (edit one PR) */

(function (App) {
  const esc = App.esc;
  const params = new URLSearchParams(location.search);
  const STATUS_LIST = [
    { value: 'review', label: 'In review' },
    { value: 'merged', label: 'Merged' },
    { value: 'closed', label: 'Closed' }
  ];
  const NOTES = [
    { key: 'what', label: 'What I did', icon: 'check', hint: 'e.g. Added a test for the ARIMA forecaster and fixed the date bug' },
    { key: 'how', label: 'How I did it', icon: 'branch', hint: 'e.g. Reproduced it locally, read the forecaster base class, wrote the test first' },
    { key: 'why', label: 'Why I did it', icon: 'issue', hint: 'e.g. The issue was labelled good first issue and the mentor asked for it' },
    { key: 'learned', label: 'What I learned', icon: 'bulb', hint: 'e.g. How pytest parametrize works and how the CI runs' }
  ];

  let program = App.PROGRAMS[params.get('program')] ? params.get('program') : App.PROGRAM_ORDER[0];
  let editId = params.get('edit') || null;
  let filter = 'all';
  let draft = null; // what is typed in the form, kept when the page redraws
  let fresh = false; // true right after saving or cancelling: don't read the old form back

  function blank() {
    return { org: params.get('org') || '', title: '', link: '', status: 'review', opened: App.todayKey(), what: '', how: '', why: '', learned: '' };
  }
  function editing() { return editId ? App.getPRs().find(function (p) { return p.id === editId; }) : null; }
  (function start() {
    const pr = editing();
    if (pr) { program = pr.program; draft = Object.assign(blank(), pr); }
    else { editId = null; draft = blank(); }
  })();

  function knownOrgs() {
    const names = {};
    App.getPRs().forEach(function (p) { if (p.program === program) names[p.org] = true; });
    Object.keys(App.data.log || {}).forEach(function (d) { App.getLog(d, program).forEach(function (e) { if (e.org) names[e.org] = true; }); });
    return Object.keys(names).sort(function (a, b) { return a.localeCompare(b); });
  }

  // ---------- the form ----------
  function formHTML() {
    const d = draft;
    const chips = App.PROGRAM_ORDER.map(function (id) {
      return '<button type="button" class="os-pchip' + (id === program ? ' is-on' : '') + '" style="--prog:var(--' + id + ')" data-prog="' + id + '" aria-pressed="' + (id === program) + '">' + esc(App.PROGRAMS[id].short) + '</button>';
    }).join('');
    const notes = NOTES.map(function (n) {
      return '<label class="os-note"><span class="os-note__label">' + App.icon(n.icon) + n.label + '</span>' +
        '<textarea class="os-textarea" name="' + n.key + '" rows="4" maxlength="3000" placeholder="' + esc(n.hint) + '">' + esc(d[n.key] || '') + '</textarea></label>';
    }).join('');
    return '<form class="os-card os-prform" id="pr-form" novalidate>' +
      '<div class="os-prform__head"><div><p class="os-label">' + (editId ? 'Editing a PR' : 'New PR') + '</p>' +
      '<h2 class="os-h2">' + (editId ? 'Edit PR' : 'Add a PR') + '</h2></div>' +
      '<div class="os-pchips" role="group" aria-label="Program">' + chips + '</div></div>' +
      '<div class="os-prform__grid">' +
      '<label class="os-field"><span class="os-field__name">Organization</span><input class="os-input" name="org" list="org-list" autocomplete="off" value="' + esc(d.org) + '" placeholder="e.g. Swift" maxlength="80">' +
      '<datalist id="org-list">' + knownOrgs().map(function (o) { return '<option value="' + esc(o) + '">'; }).join('') + '</datalist></label>' +
      '<label class="os-field"><span class="os-field__name">PR title</span><input class="os-input" name="title" value="' + esc(d.title) + '" placeholder="e.g. Improve diagnostics for missing return" maxlength="160"></label>' +
      '<label class="os-field os-prform__link"><span class="os-field__name">PR link</span><input class="os-input" name="link" value="' + esc(d.link) + '" placeholder="github.com/org/repo/pull/456" maxlength="300"></label>' +
      '<label class="os-field"><span class="os-field__name">Status</span>' + App.selectInput('status', STATUS_LIST, d.status) + '</label>' +
      '<label class="os-field"><span class="os-field__name">Opened on</span><input class="os-input" type="date" name="opened" value="' + esc(d.opened) + '"></label>' +
      '</div>' +
      '<div class="os-notes">' + notes + '</div>' +
      '<p class="os-prform__error" id="pr-error" role="alert"></p>' +
      '<div class="os-prform__foot">' +
      (editId ? '<button type="button" class="os-btn os-btn--ghost" data-cancel>Cancel</button>' : '') +
      '<button type="submit" class="os-btn os-btn--primary">' + App.icon(editId ? 'check' : 'plus') + (editId ? 'Save changes' : 'Add PR') + '</button></div>' +
      '</form>';
  }

  function readForm() {
    const f = document.getElementById('pr-form');
    if (fresh) { fresh = false; return; }
    if (!f) return;
    ['org', 'title', 'link', 'status', 'opened'].concat(NOTES.map(function (n) { return n.key; })).forEach(function (k) {
      if (f.elements[k]) draft[k] = f.elements[k].value;
    });
  }

  // ---------- the list ----------
  function cardHTML(p) {
    const info = App.PROGRAMS[p.program];
    const notes = NOTES.map(function (n) {
      const t = (p[n.key] || '').trim();
      return '<div class="os-prcard__note' + (t ? '' : ' is-empty') + '"><p class="os-label">' + App.icon(n.icon) + n.label + '</p>' +
        '<p class="os-p">' + (t ? esc(t) : 'Not written yet') + '</p></div>';
    }).join('');
    return '<article class="os-prcard" style="--prog:var(--' + p.program + ')">' +
      '<div class="os-prcard__top">' +
      '<div class="os-prcard__id"><span class="os-task__tag">' + esc(info.short) + '</span><span class="os-prcard__org">' + esc(p.org) + '</span></div>' +
      '<div class="os-row" style="gap:6px">' +
      '<select class="os-select os-select--sm os-prstatus os-prstatus--' + p.status + '" data-status="' + p.id + '" aria-label="Status">' +
      STATUS_LIST.map(function (o) { return '<option value="' + o.value + '"' + (o.value === p.status ? ' selected' : '') + '>' + o.label + '</option>'; }).join('') + '</select>' +
      '<button type="button" class="os-iconbtn" data-edit="' + p.id + '" aria-label="Edit PR">' + App.icon('edit') + '</button>' +
      '<button type="button" class="os-iconbtn os-iconbtn--danger" data-del="' + p.id + '" aria-label="Delete PR">' + App.icon('trash') + '</button></div></div>' +
      '<h3 class="os-prcard__title">' + esc(p.title || App.prShortName(p.link)) + '</h3>' +
      '<div class="os-prcard__meta"><a class="os-entry-link" href="' + esc(App.safeUrl(p.link)) + '" target="_blank" rel="noopener">' + App.icon('branch') + '<span>' + esc(App.prShortName(p.link)) + '</span></a>' +
      '<span class="os-mono os-small os-muted">Opened ' + App.formatDate(p.opened) + (p.updated && p.updated !== p.opened ? ' &middot; updated ' + App.formatDate(p.updated) : '') + '</span></div>' +
      '<div class="os-prcard__notes">' + notes + '</div></article>';
  }

  function listHTML() {
    const all = App.getPRs().slice().sort(function (a, b) {
      const x = a.updated || a.opened, y = b.updated || b.opened;
      return x < y ? 1 : x > y ? -1 : 0;
    });
    const shown = all.filter(function (p) { return filter === 'all' || p.program === filter; });
    const filters = ['all'].concat(App.PROGRAM_ORDER).map(function (id) {
      const n = id === 'all' ? all.length : all.filter(function (p) { return p.program === id; }).length;
      return '<button type="button" class="os-tfilter' + (filter === id ? ' is-on' : '') + '" data-filter="' + id + '"' + (id !== 'all' ? ' style="--prog:var(--' + id + ')"' : '') + '>' +
        (id === 'all' ? 'All' : esc(App.PROGRAMS[id].short)) + ' <span class="os-mono">' + n + '</span></button>';
    }).join('');
    return '<section class="os-section" aria-label="Your PRs">' +
      '<div class="os-section-head"><h2 class="os-h2">Your PRs</h2><div class="os-tfilters os-tfilters--plain" role="group" aria-label="Show program">' + filters + '</div></div>' +
      (shown.length ? '<div class="os-prcards">' + shown.map(cardHTML).join('') + '</div>'
        : '<div class="os-card"><div class="os-card__body">' + App.emptyHTML('branch', 'No PRs here yet', 'Add one with the form above. Write what you did, how, why and what you learned, so you remember it for your proposal.') + '</div></div>') +
      '</section>';
  }

  App.render = function () {
    readForm();
    App.mount(document.getElementById('app'),
      '<div class="os-phead"><div><p class="os-label">Every PR, with the story behind it</p><h1 class="os-h1">Add PR</h1></div></div>' +
      formHTML() + listHTML());
  };

  function leaveEdit() {
    editId = null;
    draft = blank();
    draft.org = '';
    fresh = true;
    history.replaceState(null, '', 'prs.html');
  }

  document.addEventListener('submit', function (ev) {
    if (ev.target.id !== 'pr-form') return;
    ev.preventDefault();
    readForm();
    const err = document.getElementById('pr-error');
    const d = draft;
    const data = { program: program, org: d.org.trim(), title: d.title.trim(), link: d.link.trim(), status: d.status, opened: d.opened || App.todayKey(),
      what: d.what.trim(), how: d.how.trim(), why: d.why.trim(), learned: d.learned.trim() };
    if (!data.org) { err.textContent = 'Write the organization name.'; ev.target.org.focus(); return; }
    if (!data.link) { err.textContent = 'Add the PR link.'; ev.target.link.focus(); return; }
    const pr = editing();
    const dupe = App.getPRs().find(function (p) { return p !== pr && App.prKey(p.link) === App.prKey(data.link); });
    if (dupe) { err.textContent = 'This PR link is already saved (' + dupe.org + '). Edit that one instead.'; return; }
    if (pr) {
      if (pr.status !== data.status) data.updated = App.todayKey();
      Object.assign(pr, data);
    } else {
      App.getPRs().push(Object.assign({ id: App.uid(), updated: data.opened }, data));
    }
    leaveEdit();
    App.commit();
  });

  document.addEventListener('change', function (ev) {
    const sel = ev.target.closest('[data-status]');
    if (!sel) return;
    const pr = App.getPRs().find(function (p) { return p.id === sel.dataset.status; });
    if (pr && pr.status !== sel.value) { pr.status = sel.value; pr.updated = App.todayKey(); App.commit(); }
  });

  document.addEventListener('click', function (ev) {
    const pg = ev.target.closest('[data-prog]');
    if (pg) { readForm(); fresh = true; program = pg.dataset.prog; App.render(); return; }
    const fl = ev.target.closest('[data-filter]');
    if (fl) { filter = fl.dataset.filter; App.render(); return; }
    if (ev.target.closest('[data-cancel]')) { leaveEdit(); App.render(); return; }
    const ed = ev.target.closest('[data-edit]');
    if (ed) {
      const pr = App.getPRs().find(function (p) { return p.id === ed.dataset.edit; });
      if (!pr) return;
      editId = pr.id; program = pr.program; draft = Object.assign(blank(), pr);
      fresh = true;
      history.replaceState(null, '', 'prs.html?edit=' + pr.id);
      App.render();
      document.getElementById('pr-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const del = ev.target.closest('[data-del]');
    if (del && confirm('Delete this PR?')) {
      const list = App.getPRs();
      const i = list.findIndex(function (p) { return p.id === del.dataset.del; });
      if (i > -1) { if (list[i].id === editId) leaveEdit(); list.splice(i, 1); App.commit(); }
    }
  });
})(window.App);
