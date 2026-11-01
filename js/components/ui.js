/* ui.js
   Small pieces of HTML used on many pages (checklists, stars, rings, pills, empty states)
   plus the clicks that make checklists and stars work on every page. */

(function (App) {
  const esc = App.esc;

  // ---------- drawing the page ----------
  // mount = put new HTML into the page, but keep what you were typing
  // in any box marked data-keep, and keep the cursor where it was.
  App.mount = function (container, html) {
    const kept = {};
    container.querySelectorAll('[data-keep]').forEach(function (el) { kept[el.dataset.keep] = el.value; });
    const active = document.activeElement;
    const activeKey = active && container.contains(active) ? (active.dataset.keep || active.dataset.addKey) : null;

    container.innerHTML = html;

    container.querySelectorAll('[data-keep]').forEach(function (el) {
      if (kept[el.dataset.keep] !== undefined) el.value = kept[el.dataset.keep];
    });
    if (activeKey) {
      const again = container.querySelector('[data-keep="' + activeKey + '"], [data-add-key="' + activeKey + '"]');
      if (again) again.focus();
    }
  };

  // ---------- small builders ----------
  App.countTasks = function (tasks) {
    const done = tasks.filter(function (t) { return t.done; }).length;
    return { done: done, total: tasks.length, pct: tasks.length ? Math.round(done / tasks.length * 100) : 0 };
  };

  App.barHTML = function (pct) {
    return '<div class="os-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '">' +
      '<span style="--p:' + pct + '%"></span></div>';
  };

  App.ringHTML = function (pct, size, empty) {
    return '<div class="os-ring' + (size ? ' os-ring--' + size : '') + (empty ? ' os-ring--none' : '') + '" style="--v:' + (empty ? 0 : pct) + '"' +
      ' role="img" aria-label="' + (empty ? 'No tasks' : pct + '% done') + '"><span>' + (empty ? '&ndash;' : pct + '%') + '</span></div>';
  };

  // Stars. Only editable when opts.editable is true (today).
  App.starsHTML = function (dayKey, value, opts) {
    opts = opts || {};
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += '<button type="button" class="os-star' + (i <= value ? ' is-on' : '') + '"' +
        (opts.editable ? ' data-action="rate" data-day="' + dayKey + '" data-value="' + i + '"' : ' tabindex="-1"') +
        ' aria-label="' + i + (i === 1 ? ' star' : ' stars') + '"' + (i === value ? ' aria-pressed="true"' : '') + '></button>';
    }
    return '<div class="os-stars' + (opts.size ? ' os-stars--' + opts.size : '') + '" role="group" aria-label="' + esc(opts.label || 'Rating') + ': ' + value + ' of 5"' +
      (opts.editable ? '' : ' data-readonly') + '>' + html + '</div>';
  };

  const STATUS = {
    exploring: 'Exploring', contributing: 'Contributing', applied: 'Applied', selected: 'Selected',
    open: 'Open', review: 'In review', merged: 'Merged', closed: 'Closed'
  };
  App.STATUS = STATUS;
  App.pillHTML = function (status) {
    return '<span class="os-pill os-pill--' + status + '">' + (STATUS[status] || esc(status)) + '</span>';
  };

  App.tagHTML = function (tag) {
    return '<span class="os-tag os-tag--' + tag + '">' + esc(tag) + '</span>';
  };

  // Empty state. button = { label, action } or nothing.
  App.emptyHTML = function (icon, title, text, button) {
    return '<div class="os-empty"><div class="os-empty__mark">' + App.icon(icon) + '</div>' +
      '<p class="os-empty__title">' + title + '</p><p class="os-empty__text">' + text + '</p>' +
      (button ? '<button type="button" class="os-btn os-btn--primary os-btn--sm" data-action="' + button.action + '">' + App.icon('plus') + ' ' + button.label + '</button>' : '') +
      '</div>';
  };

  App.cardHead = function (label, right) {
    return '<div class="os-card__head"><h2 class="os-label">' + label + '</h2>' + (right || '') + '</div>';
  };

  // ---------- checklists ----------
  // opts: key (unique name for the add box), placeholder, emptyText, small
  App.checklistHTML = function (listId, opts) {
    opts = opts || {};
    const tasks = App.getList(listId, false);
    const locked = App.isListLocked(listId);

    const items = tasks.map(function (t) {
      return '<li class="os-task' + (t.done ? ' is-done' : '') + '">' +
        '<input type="checkbox" class="os-box" data-action="toggle-task" data-list="' + listId + '" data-id="' + t.id + '"' +
        (t.done ? ' checked' : '') + (locked ? ' disabled' : '') + ' aria-label="Done: ' + esc(t.text) + '">' +
        '<span class="os-task__text">' + esc(t.text) + '</span>' +
        (locked ? '' : '<button type="button" class="os-iconbtn os-iconbtn--danger" data-action="delete-task" data-list="' + listId + '" data-id="' + t.id + '" aria-label="Delete task">' + App.icon('trash') + '</button>') +
        '</li>';
    }).join('');

    let html = tasks.length ? '<ul class="os-tasks">' + items + '</ul>' : (opts.emptyText ? '<p class="os-list-empty">' + opts.emptyText + '</p>' : '');
    if (!locked) {
      const placeholder = opts.placeholder || 'Add a task';
      html += '<div class="os-add">' +
        '<input class="os-input" data-add-key="' + (opts.key || listId) + '" data-add-list="' + listId + '" placeholder="' + placeholder + '" aria-label="' + placeholder + '" maxlength="200">' +
        '<button type="button" class="os-btn os-btn--primary os-btn--sq' + (opts.small ? ' os-btn--sm' : '') + '" data-action="add-task" data-list="' + listId + '" aria-label="' + placeholder + '">' + App.icon('plus') + '</button>' +
        '</div>';
    }
    return html;
  };

  function findTask(listId, id) {
    const list = App.getList(listId, false);
    return { list: list, index: list.findIndex(function (t) { return t.id === id; }) };
  }

  function addTask(input) {
    const listId = input.dataset.addList;
    if (App.isListLocked(listId)) return;
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    App.getList(listId, true).push({ id: App.uid(), text: text, done: false });
    input.value = '';
    App.commit(input.dataset.addKey);
  }

  // ---------- clicks shared by every page ----------
  document.addEventListener('click', function (e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;

    if (action === 'delete-task') {
      if (App.isListLocked(el.dataset.list)) return;
      const found = findTask(el.dataset.list, el.dataset.id);
      if (found.index > -1) { found.list.splice(found.index, 1); App.commit(); }
    }

    if (action === 'add-task') {
      addTask(el.closest('.os-add').querySelector('input'));
    }

    if (action === 'rate') {
      const key = el.dataset.day;
      if (key !== App.todayKey()) return; // only today can be rated
      const day = App.ensureDay(key);
      const value = Number(el.dataset.value);
      day.rating = day.rating === value ? 0 : value; // click the same star again to clear
      App.commit();
    }
  });

  document.addEventListener('change', function (e) {
    const box = e.target.closest('[data-action="toggle-task"]');
    if (!box) return;
    if (App.isListLocked(box.dataset.list)) return;
    const found = findTask(box.dataset.list, box.dataset.id);
    if (found.index > -1) { found.list[found.index].done = box.checked; App.commit(); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.matches && e.target.matches('[data-add-list]')) {
      e.preventDefault();
      addTask(e.target);
    }
  });
})(window.App);
