/* planner.js
   The Planner page (index.html): your daily open source work and learning.
   Top: the day's date on the right, with arrows to move between days.
   Below: one block per program (GSoC, ESoC, LFX, Summer of Bitcoin), one under the other.
   Each block holds that day's entries. One entry =
     organization, tech stack, the issue you're working on, issue link,
     GitHub repo link, PR link + PR status, what you did, what you learned.
   PRs with a status show up on the Progress and Contributions pages by themselves. */

(function (App) {
  const esc = App.esc;
  let day = App.todayKey(); // the day on screen

  // ---------- top: title on the left, date on the right ----------
  function headHTML() {
    const today = App.todayKey();
    const isToday = day === today;
    let total = 0;
    App.PROGRAM_ORDER.forEach(function (id) { total += App.getLog(day, id).length; });

    return '<div class="os-plan-head">' +
      '<div><p class="os-label">Daily open source log</p><h1 class="os-h1">Planner</h1>' +
      '<p class="os-phead__sub">' + total + (total === 1 ? ' entry' : ' entries') + ' on this day across all programs</p></div>' +
      '<div class="os-plan-date">' +
      '<div class="os-plan-date__text">' +
      (isToday ? '<span class="os-flag os-flag--today">Today</span>' : '<span class="os-flag">' + (day < today ? 'Past day' : 'Planned') + '</span>') +
      '<span class="os-plan-date__day">' + App.dayName(day) + '</span>' +
      '<span class="os-plan-date__num os-mono">' + App.formatDate(day) + '</span></div>' +
      '<div class="os-row os-plan-date__nav">' +
      '<button type="button" class="os-btn os-btn--ghost os-btn--sq" data-action="day-prev" aria-label="Previous day">' + App.icon('left') + '</button>' +
      '<button type="button" class="os-btn os-btn--ghost" data-action="day-today"' + (isToday ? ' disabled' : '') + '>Today</button>' +
      '<button type="button" class="os-btn os-btn--ghost os-btn--sq" data-action="day-next" aria-label="Next day">' + App.icon('right') + '</button>' +
      '</div></div></div>';
  }

  // ---------- one entry ----------
  function linkHTML(icon, url, text) {
    if (!url) return '';
    return '<a class="os-entry-link" href="' + esc(App.safeUrl(url)) + '" target="_blank" rel="noopener">' +
      App.icon(icon) + '<span>' + esc(text || App.shortUrl(url)) + '</span></a>';
  }

  function prHTML(e) {
    if (!e.pr) return '';
    const status = App.PR_STATUS[e.prStatus];
    return '<div class="os-log__pr">' + linkHTML('branch', e.pr, 'Pull request') +
      (status ? '<span class="os-pill os-pill--' + e.prStatus + '">' + status + '</span>' : '<span class="os-pill">No status</span>') + '</div>';
  }

  function entryHTML(programId, e) {
    const tech = (e.tech || []).map(function (t) { return '<span class="os-tech">' + esc(t) + '</span>'; }).join('');
    const issueTitle = e.issue ? esc(e.issue) : '<span class="os-muted">No issue written</span>';
    return '<article class="os-log">' +
      '<div class="os-log__top">' +
      '<div class="os-log__org">' + App.icon('org') + '<h3 class="os-h3">' + esc(e.org) + '</h3></div>' +
      '<div class="os-row os-log__actions">' +
      '<button type="button" class="os-btn os-btn--quiet os-btn--sm os-btn--sq" data-action="edit" data-program="' + programId + '" data-id="' + e.id + '" aria-label="Edit entry">' + App.icon('edit') + '</button>' +
      '<button type="button" class="os-btn os-btn--quiet os-btn--sm os-btn--sq" data-action="delete" data-program="' + programId + '" data-id="' + e.id + '" aria-label="Delete entry">' + App.icon('trash') + '</button>' +
      '</div></div>' +
      (tech ? '<div class="os-log__tech">' + tech + '</div>' : '') +
      '<div class="os-log__grid">' +
      '<div class="os-log__cell"><p class="os-label">Issue I\'m working on</p><p class="os-p">' + issueTitle + '</p>' +
      '<div class="os-log__links">' + linkHTML('issue', e.issueLink, 'Issue link') + linkHTML('github', e.repo) + '</div>' +
      prHTML(e) + '</div>' +
      '<div class="os-log__cell"><p class="os-label">' + App.icon('check') + 'What I did</p><p class="os-p os-log__text">' + (esc(e.did) || '<span class="os-muted">Not written</span>') + '</p></div>' +
      '<div class="os-log__cell"><p class="os-label">' + App.icon('bulb') + 'What I learned</p><p class="os-p os-log__text">' + (esc(e.learned) || '<span class="os-muted">Not written</span>') + '</p></div>' +
      '</div></article>';
  }

  // ---------- one block per program ----------
  function blockHTML(id) {
    const info = App.PROGRAMS[id];
    const list = App.getLog(day, id);
    const body = list.length
      ? list.map(function (e) { return entryHTML(id, e); }).join('')
      : '<p class="os-list-empty os-plan-empty">Nothing logged for ' + esc(info.short) + ' on this day.</p>';

    return '<section class="os-card os-plan-block" style="--prog:var(--' + id + ')" aria-label="' + esc(info.title) + '">' +
      '<div class="os-card__head os-plan-block__head">' +
      '<div class="os-row" style="gap:10px"><span class="os-plan-block__dot" aria-hidden="true"></span>' +
      '<h2 class="os-h2">' + esc(info.title) + '</h2>' +
      '<span class="os-card__meta">' + list.length + (list.length === 1 ? ' entry' : ' entries') + '</span></div>' +
      '<div class="os-row" style="gap:6px">' +
      '<a class="os-btn os-btn--quiet os-btn--sm" href="' + info.page + '">Open page</a>' +
      '<button type="button" class="os-btn os-btn--primary os-btn--sm" data-action="add" data-program="' + id + '">' + App.icon('plus') + ' Add entry</button>' +
      '</div></div>' +
      '<div class="os-card__body os-plan-block__body">' + body + '</div></section>';
  }

  // ---------- add / edit form ----------
  function openForm(programId, entry) {
    const info = App.PROGRAMS[programId];
    const e = entry || { org: '', tech: [], issue: '', issueLink: '', repo: '', pr: '', prStatus: '', did: '', learned: '' };
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
        App.field('PR link', App.textInput('pr', e.pr, 'github.com/org/repo/pull/456')) +
        App.field('PR status', App.selectInput('prStatus', [
          { value: '', label: 'No PR yet' },
          { value: 'review', label: 'Open / in review' },
          { value: 'merged', label: 'Merged' }
        ], e.prStatus || ''), { hint: 'Shows on Progress and Contributions.' }) +
        App.field('What you did', '<textarea class="os-textarea" name="did" rows="3" maxlength="2000" placeholder="e.g. Set up the repo, reproduced the bug, opened a draft PR">' + esc(e.did) + '</textarea>', { full: true }) +
        App.field('What you learned', '<textarea class="os-textarea" name="learned" rows="3" maxlength="2000" placeholder="e.g. How pytest fixtures work">' + esc(e.learned) + '</textarea>', { full: true }),
      onSubmit: function (v) {
        if (!(v.org || '').trim()) return 'Write the organization name.';
        if (v.prStatus && !v.pr) return 'Add the PR link, or set PR status to "No PR yet".';
        const data = {
          org: v.org.trim(),
          tech: v.tech ? v.tech.split(',').map(function (t) { return t.trim(); }).filter(Boolean) : [],
          issue: (v.issue || '').trim(),
          issueLink: (v.issueLink || '').trim(),
          repo: (v.repo || '').trim(),
          pr: (v.pr || '').trim(),
          prStatus: v.pr ? (v.prStatus || '') : '',
          did: (v.did || '').trim(),
          learned: (v.learned || '').trim()
        };
        if (entry) Object.assign(entry, data);
        else App.ensureLog(day, programId).push(Object.assign({ id: App.uid() }, data));
        App.commit();
      }
    });
  }

  App.render = function () {
    App.mount(document.getElementById('app'),
      headHTML() +
      '<div class="os-stack">' + App.PROGRAM_ORDER.map(blockHTML).join('') + '</div>');
  };

  document.addEventListener('click', function (ev) {
    const el = ev.target.closest('[data-action]');
    if (!el || !document.getElementById('app').contains(el)) return;
    const action = el.dataset.action;
    if (action === 'day-prev') { day = App.addDays(day, -1); App.render(); }
    if (action === 'day-next') { day = App.addDays(day, 1); App.render(); }
    if (action === 'day-today') { day = App.todayKey(); App.render(); }
    if (action === 'add') openForm(el.dataset.program);
    if (action === 'edit') {
      const entry = App.getLog(day, el.dataset.program).find(function (x) { return x.id === el.dataset.id; });
      if (entry) openForm(el.dataset.program, entry);
    }
    if (action === 'delete' && confirm('Delete this entry?')) {
      const list = App.getLog(day, el.dataset.program);
      const i = list.findIndex(function (x) { return x.id === el.dataset.id; });
      if (i > -1) { list.splice(i, 1); App.tidyLog(day); App.commit(); }
    }
  });
})(window.App);
