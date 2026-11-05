/* program.js
   ONE template for every program page: GSoC, ESoC, LFX, Summer of Bitcoin,
   Outreachy, FOSSEE (IIT Bombay) and FOSS Overflow (IIT Bhilai).
   The HTML page says which program it is with <body data-program="gsoc">.
   Sections, top to bottom (same order on a phone):
   Organizations, Daily progress, Total progress, Daily learning, Proposals, Timeline. */

(function (App) {
  const esc = App.esc;
  const id = document.body.dataset.program;
  const info = App.PROGRAMS[id];
  const expandedOrgs = {}; // which org rows are open (only while the page is open)
  let editingEntry = null; // id of the Daily learning entry being edited, or null

  const ORG_STATUS = [
    { value: 'exploring', label: 'Exploring', color: 'muted' },
    { value: 'contributing', label: 'Contributing', color: 'accent' },
    { value: 'applied', label: 'Applied', color: 'star' },
    { value: 'selected', label: 'Selected', color: 'success' }
  ];

  // Proposal status. The last step shows the result.
  const PROPOSAL_STATUS = [
    { value: 'idea', label: 'Idea' },
    { value: 'drafting', label: 'Drafting' },
    { value: 'feedback', label: 'Mentor feedback' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'not', label: 'Not selected' }
  ];
  const STEP_NAMES = ['Idea', 'Drafting', 'Mentor feedback', 'Submitted', 'Accepted / Not selected'];
  function stepIndex(status) {
    return { idea: 0, drafting: 1, feedback: 2, submitted: 3, accepted: 4, not: 4 }[status] || 0;
  }

  function sortedTimeline(p) {
    return p.timeline.slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  }

  // ---------- header ----------
  function headerHTML(p) {
    const next = sortedTimeline(p).find(function (t) { return !App.isPast(t.date); });
    const chip = next
      ? '<span class="os-chip">' + App.icon('clock') + esc(next.title) + ' <span class="os-mono">&middot; ' + esc(App.countdown(next.date).text) + '</span></span>'
      : '';
    return '<div class="os-phead"><div>' +
      '<p class="os-label">Program</p>' +
      '<h1 class="os-h1">' + esc(info.title) + '</h1>' +
      '<p class="os-phead__sub">' + esc(info.name) + ' &middot; <a href="' + info.site + '" target="_blank" rel="noopener">Official site' + App.icon('ext') + '</a></p>' +
      '</div>' + chip + '</div>';
  }

  // ---------- organizations ----------
  function orgRowHTML(o) {
    const open = !!expandedOrgs[o.id];
    const long = (o.desc || '').length > 140;
    const stack = (o.stack || []).map(function (s) { return '<span class="os-tech">' + esc(s) + '</span>'; }).join('');
    const repo = o.repo
      ? '<a class="os-org__repo" href="' + esc(App.safeUrl(o.repo)) + '" target="_blank" rel="noopener">' + App.icon('link') + esc(App.shortUrl(o.repo)) + '</a>'
      : '';
    return '<article class="os-org' + (open ? ' is-open' : '') + '" data-action="org-toggle" data-id="' + o.id + '"' +
      (long ? ' tabindex="0" aria-expanded="' + open + '"' : '') + '>' +
      '<div class="os-avatar" aria-hidden="true">' + esc((o.name || '?').charAt(0).toUpperCase()) + '</div>' +
      '<div class="os-org__main">' +
      '<div class="os-org__title"><h3 class="os-org__name">' + esc(o.name) + '</h3>' +
      (o.project ? '<span class="os-org__project">' + esc(o.project) + '</span>' : '') + '</div>' +
      repo +
      (o.desc ? '<p class="os-org__desc">' + esc(o.desc) + '</p>' : '') +
      (long ? '<span class="os-org__more"><span>' + (open ? 'Show less' : 'Show more') + '</span>' + App.icon('down') + '</span>' : '') +
      '</div>' +
      '<div class="os-org__stack">' + stack + '</div>' +
      '<div class="os-org__status">' + App.pillHTML(o.status) + '</div>' +
      '<div class="os-org__actions">' +
      '<button type="button" class="os-iconbtn" data-action="org-edit" data-id="' + o.id + '" aria-label="Edit ' + esc(o.name) + '">' + App.icon('edit') + '</button>' +
      '<button type="button" class="os-iconbtn os-iconbtn--danger" data-action="org-delete" data-id="' + o.id + '" aria-label="Delete ' + esc(o.name) + '">' + App.icon('trash') + '</button>' +
      '</div></article>';
  }

  function orgsHTML(p) {
    const head = '<div class="os-card__head"><div class="os-row" style="gap:10px"><h2 class="os-label">Organizations</h2>' +
      '<span class="os-card__meta">' + p.orgs.length + '</span></div>' +
      '<button type="button" class="os-btn os-btn--primary os-btn--sm" data-action="org-add">' + App.icon('plus') + ' Add organization</button></div>';
    const body = p.orgs.length
      ? '<div class="os-orgs__head"><span class="os-label">Organization</span><span class="os-label">Tech stack</span><span class="os-label">Status</span><span></span></div>' +
        p.orgs.map(orgRowHTML).join('')
      : App.emptyHTML('org', 'No organizations yet', 'Add your first one. Save the org, the project you like and its repo link.', { label: 'Add organization', action: 'org-add' });
    return '<section class="os-card" aria-label="Organizations">' + head + body + '</section>';
  }

  function openOrgModal(org) {
    const editing = !!org;
    org = org || { name: '', project: '', stack: [], repo: '', status: 'exploring', desc: '' };
    App.openModal({
      title: editing ? 'Edit organization' : 'Add organization',
      subtitle: editing ? '' : 'Save an org you want to work with for ' + info.title + '.',
      submitLabel: editing ? 'Save changes' : 'Add organization',
      body:
        App.field('Organization name', App.textInput('name', org.name, 'e.g. OpenSSF', ' maxlength="80"')) +
        App.field('Project', App.textInput('project', org.project, 'e.g. OSS-CRS', ' maxlength="120"')) +
        App.chipInput('stack', org.stack, 'Type and press Enter') +
        App.field('Repo link', '<span class="os-input-icon">' + App.icon('link') + App.textInput('repo', org.repo, 'github.com/org/repo') + '</span>', { full: true }) +
        App.segInput('status', 'Status', ORG_STATUS, org.status) +
        App.field('Description', '<textarea class="os-textarea" name="desc" rows="3" maxlength="1000" placeholder="Why this org, and what is your next step?">' + esc(org.desc) + '</textarea>',
          { full: true, hint: 'The first 2 lines show in the list. Click a row to read the rest.' }),
      onSubmit: function (v) {
        if (!v.name) return 'Write the organization name.';
        const p = App.getProgram(id);
        const data = {
          name: v.name,
          project: v.project,
          stack: v.stack ? v.stack.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [],
          repo: v.repo,
          status: v.status || 'exploring',
          desc: v.desc
        };
        if (editing) {
          Object.assign(p.orgs.find(function (o) { return o.id === org.id; }), data);
        } else {
          p.orgs.push(Object.assign({ id: App.uid() }, data));
        }
        App.commit();
      }
    });
  }

  // ---------- daily progress ----------
  function dailyHTML(p, today) {
    const listId = 'pdaily:' + id + ':' + today;
    const c = App.countTasks(App.getList(listId));
    return '<section class="os-card" aria-label="Daily progress">' +
      App.cardHead('Daily progress', '<span class="os-card__meta">' + App.formatDate(today) + '</span>') +
      '<div class="os-card__body">' +
      '<div class="os-done-row"><span><b>' + c.done + ' of ' + c.total + '</b> done</span><span class="os-mono">Today</span></div>' +
      App.barHTML(c.pct) +
      '<div style="margin-top:8px">' + App.checklistHTML(listId, { key: 'pdaily', placeholder: 'Add a task for today', emptyText: 'Nothing planned for ' + info.short + ' today.' }) + '</div>' +
      '</div></section>';
  }

  // ---------- total progress ----------
  function milestonesHTML(p) {
    const listId = 'milestones:' + id;
    const c = App.countTasks(p.milestones);
    return '<section class="os-card" aria-label="Total progress">' +
      App.cardHead('Total progress', '<span class="os-card__meta">Milestones</span>') +
      '<div class="os-card__body">' +
      '<div class="os-row" style="gap:16px;flex-wrap:nowrap">' + App.ringHTML(c.pct) +
      '<div><p class="os-p"><b>' + c.done + ' of ' + c.total + '</b> <span class="os-muted">done</span></p>' +
      '<p class="os-hint" style="margin-top:2px">The big steps from first look to final result.</p></div></div>' +
      '<div style="margin-top:8px">' + App.checklistHTML(listId, { key: 'milestones', placeholder: 'Add a milestone', emptyText: 'No milestones yet.' }) + '</div>' +
      '</div></section>';
  }

  // ---------- daily learning ----------
  function journalHTML(p) {
    const entries = p.journal.map(function (j) {
      const date = '<div class="os-entry__date">' + App.formatDate(j.date) + (j.edited ? ' &middot; edited' : '') + '</div>';
      if (editingEntry === j.id) {
        // Edit mode: the text turns into a box with Save and Cancel
        return '<li class="os-entry is-editing"><div class="os-entry__body">' + date +
          '<textarea class="os-textarea" rows="3" maxlength="1000" data-edit-entry="' + j.id + '" aria-label="Edit entry">' + esc(j.text) + '</textarea>' +
          '<div class="os-row" style="justify-content:flex-end;gap:8px;margin-top:8px">' +
          '<button type="button" class="os-btn os-btn--ghost os-btn--sm" data-action="journal-cancel">Cancel</button>' +
          '<button type="button" class="os-btn os-btn--primary os-btn--sm" data-action="journal-save" data-id="' + j.id + '">Save</button>' +
          '</div></div></li>';
      }
      return '<li class="os-entry"><div class="os-entry__body">' + date +
        '<p class="os-entry__text">' + esc(j.text) + '</p></div>' +
        '<div class="os-entry__actions">' +
        '<button type="button" class="os-iconbtn" data-action="journal-edit" data-id="' + j.id + '" aria-label="Edit entry">' + App.icon('edit') + '</button>' +
        '<button type="button" class="os-iconbtn os-iconbtn--danger" data-action="journal-delete" data-id="' + j.id + '" aria-label="Delete entry">' + App.icon('trash') + '</button>' +
        '</div></li>';
    }).join('');
    return '<section class="os-card" aria-label="Daily learning">' +
      App.cardHead('Daily learning', '<span class="os-card__meta">' + p.journal.length + (p.journal.length === 1 ? ' entry' : ' entries') + '</span>') +
      '<div class="os-card__body">' +
      '<label class="os-field"><span class="os-field__name">What I learned or did today</span>' +
      '<textarea class="os-textarea" rows="3" maxlength="1000" data-keep="journal-' + id + '" placeholder="One or two lines is enough"></textarea></label>' +
      '<div class="os-row" style="justify-content:flex-end;margin-top:10px">' +
      '<button type="button" class="os-btn os-btn--primary os-btn--sm" data-action="journal-add">' + App.icon('plus') + ' Add entry</button></div>' +
      (entries ? '<ul class="os-entries">' + entries + '</ul>'
        : App.emptyHTML('book', 'Nothing written yet', 'Write one line about what you learned or did today.')) +
      '</div></section>';
  }

  // ---------- proposals ----------
  function proposalHTML(pr) {
    const idx = stepIndex(pr.status);
    const steps = STEP_NAMES.map(function (name, i) {
      let cls = i < idx ? 'is-done' : i === idx ? 'is-now' : '';
      let label = name;
      if (i === 4 && pr.status === 'accepted') { cls = 'is-accepted'; label = 'Accepted'; }
      if (i === 4 && pr.status === 'not') { cls = 'is-not'; label = 'Not selected'; }
      return '<button type="button" class="os-step ' + cls + '" data-action="prop-step" data-id="' + pr.id + '" data-step="' + i + '"' +
        ' title="' + (i === 4 ? 'Click to switch between Accepted and Not selected' : 'Set status to ' + name) + '">' + label + '</button>';
    }).join('');

    const outline = (pr.outline || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
    const links = (pr.deadline ? App.countdownHTML(pr.deadline) + '<span class="os-muted os-small">Deadline ' + App.formatDate(pr.deadline) + '</span>' : '<span class="os-muted os-small">No deadline set</span>') +
      '<span class="os-spacer"></span>' +
      (pr.link ? '<a href="' + esc(App.safeUrl(pr.link)) + '" target="_blank" rel="noopener">' + App.icon('doc') + 'Open draft</a>' : '');

    return '<article class="os-prop">' +
      '<div class="os-prop__top"><div><h3 class="os-prop__title">' + esc(pr.title) + '</h3>' +
      (pr.org ? '<p class="os-prop__org">' + esc(pr.org) + '</p>' : '') + '</div>' +
      '<div class="os-row" style="gap:2px;flex-wrap:nowrap">' +
      '<button type="button" class="os-iconbtn" data-action="prop-edit" data-id="' + pr.id + '" aria-label="Edit proposal">' + App.icon('edit') + '</button>' +
      '<button type="button" class="os-iconbtn os-iconbtn--danger" data-action="prop-delete" data-id="' + pr.id + '" aria-label="Delete proposal">' + App.icon('trash') + '</button>' +
      '</div></div>' +
      '<div class="os-pipe" role="group" aria-label="Status">' + steps + '</div>' +
      '<div class="os-prop__links">' + links + '</div>' +
      (outline.length ? '<div class="os-outline"><span class="os-label">Outline</span><ol>' +
        outline.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div>' : '') +
      '</article>';
  }

  function proposalsHTML(p) {
    const body = p.proposals.length
      ? '<div class="os-props">' + p.proposals.map(proposalHTML).join('') + '</div>'
      : '<div class="os-card">' + App.emptyHTML('doc', 'No proposals yet', 'Start one as soon as you have an idea. A rough title is enough.', { label: 'Add proposal', action: 'prop-add' }) + '</div>';
    return '<section aria-label="Proposals"><div class="os-section-head"><h2 class="os-label">Proposals</h2>' +
      '<button type="button" class="os-btn os-btn--ghost os-btn--sm" data-action="prop-add">' + App.icon('plus') + ' Add proposal</button></div>' +
      body + '</section>';
  }

  function openProposalModal(pr) {
    const editing = !!pr;
    pr = pr || { title: '', org: '', status: 'idea', deadline: '', link: '', outline: '' };
    const orgNames = App.getProgram(id).orgs.map(function (o) { return '<option value="' + esc(o.name) + '">'; }).join('');
    App.openModal({
      title: editing ? 'Edit proposal' : 'Add proposal',
      submitLabel: editing ? 'Save changes' : 'Add proposal',
      body:
        App.field('Title', App.textInput('title', pr.title, 'e.g. LLM helper for finding bugs', ' maxlength="140"'), { full: true }) +
        App.field('Organization', App.textInput('org', pr.org, 'Pick or type', ' list="org-names"') + '<datalist id="org-names">' + orgNames + '</datalist>') +
        App.field('Status', App.selectInput('status', PROPOSAL_STATUS, pr.status)) +
        App.field('Deadline', '<input class="os-input os-mono" type="date" name="deadline" value="' + esc(pr.deadline) + '">') +
        App.field('Draft link', App.textInput('link', pr.link, 'docs.google.com/...')) +
        App.field('Outline', '<textarea class="os-textarea" name="outline" rows="4" placeholder="One point per line">' + esc(pr.outline) + '</textarea>', { full: true }),
      onSubmit: function (v) {
        if (!v.title) return 'Give the proposal a title.';
        const p = App.getProgram(id);
        const data = { title: v.title, org: v.org, status: v.status, deadline: v.deadline, link: v.link, outline: v.outline };
        if (editing) Object.assign(p.proposals.find(function (x) { return x.id === pr.id; }), data);
        else p.proposals.push(Object.assign({ id: App.uid() }, data));
        App.commit();
      }
    });
  }

  // ---------- timeline ----------
  function timelineHTML(p) {
    const items = sortedTimeline(p);
    const nowIndex = items.findIndex(function (t) { return !App.isPast(t.date); });
    const list = items.map(function (t, i) {
      const state = i === nowIndex ? ' is-now' : App.isPast(t.date) ? ' is-past' : '';
      return '<li class="os-tl__item' + state + '"><span class="os-tl__dot"></span><div class="os-tl__box">' +
        '<div class="os-tl__date">' + App.formatDate(t.date) + '</div>' +
        '<div class="os-tl__title">' + esc(t.title) + '</div>' + App.tagHTML(t.tag) +
        (t.note ? '<p class="os-tl__note">' + esc(t.note) + '</p>' : '') +
        '<button type="button" class="os-iconbtn os-iconbtn--danger os-tl__del" data-action="tl-delete" data-id="' + t.id + '" aria-label="Delete date">' + App.icon('trash') + '</button>' +
        '</div></li>';
    }).join('');
    return '<section class="os-card" aria-label="Timeline">' +
      App.cardHead('Timeline', '<button type="button" class="os-iconbtn" data-action="tl-add" aria-label="Add a date">' + App.icon('plus') + '</button>') +
      '<div class="os-card__body" style="padding-top:24px">' +
      (items.length ? '<ol class="os-tl">' + list + '</ol>' : '<p class="os-list-empty" style="margin:0">No dates yet. Use + to add one.</p>') +
      '</div></section>';
  }

  // ---------- the whole page ----------
  App.render = function () {
    const p = App.getProgram(id);
    const today = App.todayKey();
    document.title = info.title + ' · Open Source 2027';
    App.mount(document.getElementById('app'),
      headerHTML(p) +
      orgsHTML(p) +
      '<div class="os-grid-3 os-section">' + dailyHTML(p, today) + milestonesHTML(p) + journalHTML(p) + '</div>' +
      '<div class="os-split os-section">' + proposalsHTML(p) + timelineHTML(p) + '</div>');
  };

  // ---------- clicks for this page ----------
  function byId(list, itemId) { return list.find(function (x) { return x.id === itemId; }); }
  function removeById(list, itemId) {
    const i = list.findIndex(function (x) { return x.id === itemId; });
    if (i > -1) list.splice(i, 1);
  }

  function saveEntry(entryId) {
    const p = App.getProgram(id);
    const entry = byId(p.journal, entryId);
    const box = document.querySelector('[data-edit-entry="' + entryId + '"]');
    if (!entry || !box) return;
    const text = box.value.trim();
    if (!text) { box.focus(); return; } // empty: use Delete instead
    if (text !== entry.text) { entry.text = text; entry.edited = true; }
    editingEntry = null;
    App.commit();
  }

  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const p = App.getProgram(id);
    const itemId = el.dataset.id;

    switch (el.dataset.action) {
      case 'org-add': openOrgModal(); break;
      case 'org-edit': openOrgModal(byId(p.orgs, itemId)); break;
      case 'org-delete': {
        const org = byId(p.orgs, itemId);
        if (org && confirm('Delete ' + org.name + '?')) { removeById(p.orgs, itemId); App.commit(); }
        break;
      }
      case 'org-toggle':
        if (e.target.closest('a')) return; // let the repo link open
        if (!el.querySelector('.os-org__more')) return; // short description, nothing to expand
        expandedOrgs[itemId] = !expandedOrgs[itemId];
        App.render();
        break;

      case 'journal-add': {
        const box = document.querySelector('[data-keep="journal-' + id + '"]');
        const text = box.value.trim();
        if (!text) { box.focus(); return; }
        p.journal.unshift({ id: App.uid(), date: App.todayKey(), text: text });
        box.value = '';
        App.commit('journal-' + id);
        break;
      }
      case 'journal-delete':
        if (editingEntry === itemId) editingEntry = null;
        removeById(p.journal, itemId);
        App.commit();
        break;
      case 'journal-edit': {
        editingEntry = itemId;
        App.render();
        const box = document.querySelector('[data-edit-entry="' + itemId + '"]');
        if (box) { box.focus(); box.setSelectionRange(box.value.length, box.value.length); }
        break;
      }
      case 'journal-cancel': editingEntry = null; App.render(); break;
      case 'journal-save': saveEntry(itemId); break;

      case 'prop-add': openProposalModal(); break;
      case 'prop-edit': openProposalModal(byId(p.proposals, itemId)); break;
      case 'prop-delete': {
        const pr = byId(p.proposals, itemId);
        if (pr && confirm('Delete the proposal "' + pr.title + '"?')) { removeById(p.proposals, itemId); App.commit(); }
        break;
      }
      case 'prop-step': {
        const pr = byId(p.proposals, itemId);
        const step = Number(el.dataset.step);
        if (step < 4) pr.status = ['idea', 'drafting', 'feedback', 'submitted'][step];
        else pr.status = pr.status === 'accepted' ? 'not' : 'accepted';
        App.commit();
        break;
      }

      case 'tl-add': App.openDateModal(id); break;
      case 'tl-delete': removeById(p.timeline, itemId); App.commit(); break;
    }
  });

  // Enter or Space on a focused org row opens it, like a click.
  document.addEventListener('keydown', function (e) {
    // While editing an entry: Ctrl/Cmd + Enter saves, Escape cancels.
    const editBox = e.target.closest && e.target.closest('[data-edit-entry]');
    if (editBox) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); saveEntry(editBox.dataset.editEntry); }
      if (e.key === 'Escape') { editingEntry = null; App.render(); }
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('os-org')) {
      e.preventDefault();
      e.target.click();
    }
  });
})(window.App);
