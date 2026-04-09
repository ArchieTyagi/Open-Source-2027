/* worklog.js
   The daily work log, used on every program page (GSoC, ESoC, LFX, Summer of Bitcoin)
   and read by the Planner, Progress and Contributions pages.

   One entry = organization, tech stack, the issue you're working on, issue link,
   GitHub repo link, any number of PRs (each with its own link and status),
   what you did, what you learned.

   Saved in App.data.log["2026-11-22"].gsoc = [entry, entry, ...] */

(function (App) {
  const esc = App.esc;

  // The day shown in the log (the arrows change it). Starts on today.
  App.logDay = App.todayKey();

  // PRs of one entry as a list. Old entries had a single pr + prStatus: read those too.
  App.entryPRs = function (e) {
    if (Array.isArray(e.prs)) return e.prs.filter(function (p) { return p && p.link; });
    return e.pr ? [{ link: e.pr, status: e.prStatus || '' }] : [];
  };

  // ---------- small pieces ----------
  function linkHTML(icon, url, text) {
    if (!url) return '';
    return '<a class="os-entry-link" href="' + esc(App.safeUrl(url)) + '" target="_blank" rel="noopener">' +
      App.icon(icon) + '<span>' + esc(text || App.shortUrl(url)) + '</span></a>';
  }
  App.prPillHTML = function (status) {
    return App.PR_STATUS[status]
      ? '<span class="os-pill os-pill--' + status + '">' + App.PR_STATUS[status] + '</span>'
      : '<span class="os-pill">No status</span>';
  };

  function prsHTML(e) {
    const prs = App.entryPRs(e);
    if (!prs.length) return '';
    return '<div class="os-log__prs"><p class="os-label">' + App.icon('branch') + (prs.length === 1 ? 'PR' : prs.length + ' PRs') + '</p>' +
      prs.map(function (p, i) {
        return '<div class="os-log__pr">' + linkHTML('branch', p.link, App.prShortName(p.link)) + App.prPillHTML(p.status) + '</div>';
      }).join('') + '</div>';
  }

  function entryHTML(programId, e) {
    const tech = (e.tech || []).map(function (t) { return '<span class="os-tech">' + esc(t) + '</span>'; }).join('');
    const issueTitle = e.issue ? esc(e.issue) : '<span class="os-muted">No issue written</span>';
    return '<article class="os-log">' +
      '<div class="os-log__top">' +
      '<div class="os-log__org">' + App.icon('org') + '<h3 class="os-h3">' + esc(e.org) + '</h3></div>' +
      '<div class="os-row os-log__actions">' +
      '<button type="button" class="os-btn os-btn--quiet os-btn--sm os-btn--sq" data-log="edit" data-program="' + programId + '" data-id="' + e.id + '" aria-label="Edit entry">' + App.icon('edit') + '</button>' +
      '<button type="button" class="os-btn os-btn--quiet os-btn--sm os-btn--sq" data-log="delete" data-program="' + programId + '" data-id="' + e.id + '" aria-label="Delete entry">' + App.icon('trash') + '</button>' +
      '</div></div>' +
      (tech ? '<div class="os-log__tech">' + tech + '</div>' : '') +
      '<div class="os-log__grid">' +
      '<div class="os-log__cell"><p class="os-label">Issue I\'m working on</p><p class="os-p">' + issueTitle + '</p>' +
      '<div class="os-log__links">' + linkHTML('issue', e.issueLink, 'Issue link') + linkHTML('github', e.repo) + '</div>' +
      prsHTML(e) + '</div>' +
      '<div class="os-log__cell"><p class="os-label">' + App.icon('check') + 'What I did</p><p class="os-p os-log__text">' + (esc(e.did) || '<span class="os-muted">Not written</span>') + '</p></div>' +
      '<div class="os-log__cell"><p class="os-label">' + App.icon('bulb') + 'What I learned</p><p class="os-p os-log__text">' + (esc(e.learned) || '<span class="os-muted">Not written</span>') + '</p></div>' +
      '</div></article>';
  }

  // Date on the right with arrows: used by the Planner and the program pages.
  App.logDateHTML = function () {
    const today = App.todayKey();
    const day = App.logDay;
    const isToday = day === today;
    return '<div class="os-plan-date">' +
      '<div class="os-plan-date__text">' +
      (isToday ? '<span class="os-flag os-flag--today">Today</span>' : '<span class="os-flag">' + (day < today ? 'Past day' : 'Planned') + '</span>') +
      '<span class="os-plan-date__day">' + App.dayName(day) + '</span>' +
      '<span class="os-plan-date__num os-mono">' + App.formatDate(day) + '</span></div>' +
      '<div class="os-row os-plan-date__nav">' +
      '<button type="button" class="os-btn os-btn--ghost os-btn--sq" data-log="prev" aria-label="Previous day">' + App.icon('left') + '</button>' +
      '<button type="button" class="os-btn os-btn--ghost" data-log="today"' + (isToday ? ' disabled' : '') + '>Today</button>' +
      '<button type="button" class="os-btn os-btn--ghost os-btn--sq" data-log="next" aria-label="Next day">' + App.icon('right') + '</button>' +
      '</div></div>';
  };

  // The work log block on a program page.
  App.workLogHTML = function (programId) {
    const info = App.PROGRAMS[programId];
    const day = App.logDay;
    const list = App.getLog(day, programId);
    const label = day === App.todayKey() ? "Today's work" : 'Work on ' + App.formatDate(day);
    const body = list.length
      ? list.map(function (e) { return entryHTML(programId, e); }).join('')
      : '<p class="os-list-empty os-plan-empty">Nothing logged for ' + esc(info.short) + ' on this day. Add what you worked on: org, issue, PRs, what you did and learned.</p>';
    return '<section class="os-card os-plan-block os-section" style="--prog:var(--' + programId + ')" aria-label="' + esc(label) + '">' +
      '<div class="os-worklog-head">' +
      '<div><p class="os-label">Daily open source log</p><h2 class="os-h2">' + esc(label) + '</h2>' +
      '<p class="os-phead__sub">' + list.length + (list.length === 1 ? ' entry' : ' entries') + ' &middot; ' +
      '<button type="button" class="os-btn os-btn--primary os-btn--sm" data-log="add" data-program="' + programId + '">' + App.icon('plus') + ' Add entry</button></p></div>' +
      App.logDateHTML() + '</div>' +
      '<div class="os-card__body os-plan-block__body">' + body + '</div></section>';
  };

  // ---------- PR rows inside the form ----------
  const STATUS_OPTIONS = [
    { value: '', label: 'No status yet' },
    { value: 'review', label: 'Open / in review' },
    { value: 'merged', label: 'Merged' }
  ];
  function prRowHTML(p) {
    return '<div class="os-prrow" data-pr-row>' +
      '<input class="os-input" data-pr-link value="' + esc(p.link || '') + '" placeholder="github.com/org/repo/pull/456" maxlength="300" aria-label="PR link">' +
      '<select class="os-select" data-pr-status aria-label="PR status">' +
      STATUS_OPTIONS.map(function (o) { return '<option value="' + o.value + '"' + (o.value === (p.status || '') ? ' selected' : '') + '>' + o.label + '</option>'; }).join('') +
      '</select>' +
      '<button type="button" class="os-iconbtn os-iconbtn--danger" data-pr-remove aria-label="Remove this PR">' + App.icon('trash') + '</button></div>';
  }
  function prRowsHTML(prs) {
    const rows = prs.length ? prs : [{ link: '', status: '' }];
    return '<div class="os-field os-full"><span class="os-field__name">Pull requests</span>' +
      '<div class="os-prrows" data-pr-rows>' + rows.map(prRowHTML).join('') + '</div>' +
      '<button type="button" class="os-btn os-btn--ghost os-btn--sm os-prrows__add" data-pr-add>' + App.icon('plus') + ' Add another PR</button>' +
      '<p class="os-hint">Add every PR you made in this org. Each one shows on Progress and Contributions.</p></div>';
  }

  // ---------- add / edit form ----------
  App.openLogForm = function (programId, entry) {
    const info = App.PROGRAMS[programId];
    const day = App.logDay;
    const e = entry || { org: '', tech: [], issue: '', issueLink: '', repo: '', did: '', learned: '' };
    App.openModal({
      title: entry ? 'Edit entry' : 'Add entry',
      subtitle: info.title + ' · ' + App.dayName(day) + ' ' + App.formatDate(day),
      submitLabel: entry ? 'Save changes' : 'Add entry',
      body:
        App.field('Organization', App.textInput('org', e.org, 'e.g. sktime'), { full: true }) +
        App.chipInput('tech', e.tech, 'e.g. Python') +
        App.field('Issue you are working on', App.textInput('issue', e.issue, 'e.g. #4521 Fix date parsing in forecaster'), { full: true }) +
        App.field('Issue link', App.textInput('issueLink', e.issueLink, 'github.com/org/repo/issues/123')) +
        App.field('GitHub repo link', App.textInput('repo', e.repo, 'github.com/org/repo')) +
        prRowsHTML(App.entryPRs(e)) +
        App.field('What you did', '<textarea class="os-textarea" name="did" rows="3" maxlength="2000" placeholder="e.g. Set up the repo, reproduced the bug, opened a draft PR">' + esc(e.did) + '</textarea>', { full: true }) +
        App.field('What you learned', '<textarea class="os-textarea" name="learned" rows="3" maxlength="2000" placeholder="e.g. How pytest fixtures work">' + esc(e.learned) + '</textarea>', { full: true }),
      onReady: function (form) {
        const rows = form.querySelector('[data-pr-rows]');
        form.querySelector('[data-pr-add]').addEventListener('click', function () {
          rows.insertAdjacentHTML('beforeend', prRowHTML({ link: '', status: '' }));
          rows.lastElementChild.querySelector('[data-pr-link]').focus();
        });
        rows.addEventListener('click', function (ev) {
          const x = ev.target.closest('[data-pr-remove]');
          if (!x) return;
          const row = x.closest('[data-pr-row]');
          if (rows.children.length > 1) row.remove();
          else { row.querySelector('[data-pr-link]').value = ''; row.querySelector('[data-pr-status]').value = ''; }
        });
      },
      onSubmit: function (v, form) {
        if (!(v.org || '').trim()) return 'Write the organization name.';
        const prs = [];
        let problem = '';
        form.querySelectorAll('[data-pr-row]').forEach(function (row) {
          const link = row.querySelector('[data-pr-link]').value.trim();
          const status = row.querySelector('[data-pr-status]').value;
          if (!link && status) problem = 'One PR has a status but no link. Add the link or remove that PR.';
          if (link) prs.push({ link: link, status: status });
        });
        if (problem) return problem;
        const data = {
          org: v.org.trim(),
          tech: v.tech ? v.tech.split(',').map(function (t) { return t.trim(); }).filter(Boolean) : [],
          issue: (v.issue || '').trim(),
          issueLink: (v.issueLink || '').trim(),
          repo: (v.repo || '').trim(),
          prs: prs,
          did: (v.did || '').trim(),
          learned: (v.learned || '').trim()
        };
        if (entry) {
          delete entry.pr; delete entry.prStatus; // old single-PR fields
          Object.assign(entry, data);
        } else {
          App.ensureLog(day, programId).push(Object.assign({ id: App.uid() }, data));
        }
        App.commit();
      }
    });
  };

  // ---------- clicks on any log button, on any page ----------
  document.addEventListener('click', function (ev) {
    const el = ev.target.closest('[data-log]');
    if (!el || !document.getElementById('app').contains(el)) return;
    const action = el.dataset.log;
    const day = App.logDay;
    if (action === 'prev') { App.logDay = App.addDays(day, -1); App.render(); }
    if (action === 'next') { App.logDay = App.addDays(day, 1); App.render(); }
    if (action === 'today') { App.logDay = App.todayKey(); App.render(); }
    if (action === 'add') App.openLogForm(el.dataset.program);
    if (action === 'edit') {
      const entry = App.getLog(day, el.dataset.program).find(function (x) { return x.id === el.dataset.id; });
      if (entry) App.openLogForm(el.dataset.program, entry);
    }
    if (action === 'delete' && confirm('Delete this entry?')) {
      const list = App.getLog(day, el.dataset.program);
      const i = list.findIndex(function (x) { return x.id === el.dataset.id; });
      if (i > -1) { list.splice(i, 1); App.tidyLog(day); App.commit(); }
    }
  });
  // ---------- running focus timer, shown in the top bar on every page ----------
  function timerPill() {
    const top = document.querySelector('.os-top');
    if (!top || !App.timerRunning) return;
    let pill = document.getElementById('os-timer-pill');
    const r = App.timerRunning();
    if (!r || document.body.dataset.page === 'planner') { if (pill) pill.remove(); return; }
    if (!pill) {
      pill = document.createElement('a');
      pill.id = 'os-timer-pill';
      pill.className = 'os-timer-pill';
      pill.href = 'index.html';
      pill.title = 'Focus timer is running. Open the Planner to pause it.';
      top.insertBefore(pill, document.getElementById('save-status'));
    }
    const sec = App.focusTotal(App.todayKey());
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), sx = sec % 60;
    pill.innerHTML = '<i></i>' + App.esc(App.PROGRAMS[r.program].short) + ' <span class="os-mono">' + h + ':' + String(m).padStart(2, '0') + ':' + String(sx).padStart(2, '0') + '</span>';
  }
  setInterval(timerPill, 1000);
  document.addEventListener('DOMContentLoaded', timerPill);
})(window.App);
