/* modal.js
   One reusable pop-up form (modal = a box that opens over the page).
   Used for: Add organization, Add proposal, Add date.

   App.openModal({
     title, subtitle, submitLabel,
     body: '...fields HTML...',
     onSubmit: function (values) { ... return 'error text' to keep it open }
   }) */

(function (App) {
  const esc = App.esc;

  // ---------- field builders ----------
  App.field = function (label, control, opts) {
    opts = opts || {};
    return '<label class="os-field' + (opts.full ? ' os-full' : '') + '"><span class="os-field__name">' + label + '</span>' +
      control + (opts.hint ? '<span class="os-hint">' + opts.hint + '</span>' : '') + '</label>';
  };
  App.textInput = function (name, value, placeholder, extra) {
    return '<input class="os-input" name="' + name + '" value="' + esc(value || '') + '" placeholder="' + esc(placeholder || '') + '"' + (extra || '') + '>';
  };
  App.selectInput = function (name, options, current) {
    return '<select class="os-select" name="' + name + '">' + options.map(function (o) {
      return '<option value="' + esc(o.value) + '"' + (o.value === current ? ' selected' : '') + '>' + esc(o.label) + '</option>';
    }).join('') + '</select>';
  };

  // Chip input for a list of words (tech stack). Saved as "Python, Docker".
  App.chipInput = function (name, values, placeholder) {
    return '<div class="os-field os-full"><span class="os-field__name">Tech stack</span>' +
      '<div class="os-chipinput" data-chips="' + name + '">' +
      '<input type="hidden" name="' + name + '" value="' + esc((values || []).join(', ')) + '">' +
      '<input data-chip-entry placeholder="' + esc(placeholder) + '" aria-label="Add a tech">' +
      '</div><span class="os-hint">Press Enter or comma after each one.</span></div>';
  };

  // Segmented switch: one of a few choices. options = [{ value, label, color }]
  App.segInput = function (name, label, options, current) {
    return '<div class="os-field os-full"><span class="os-field__name">' + label + '</span>' +
      '<div class="os-seg" role="radiogroup" aria-label="' + esc(label) + '" data-seg="' + name + '">' +
      '<input type="hidden" name="' + name + '" value="' + esc(current) + '">' +
      options.map(function (o) {
        return '<button type="button" role="radio" style="--c:var(--' + o.color + ')" data-value="' + o.value + '" aria-checked="' + (o.value === current) + '" aria-pressed="' + (o.value === current) + '">' + o.label + '</button>';
      }).join('') + '</div></div>';
  };

  function setupChips(form) {
    form.querySelectorAll('[data-chips]').forEach(function (box) {
      const hidden = box.querySelector('input[type="hidden"]');
      const entry = box.querySelector('[data-chip-entry]');
      let chips = hidden.value ? hidden.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [];

      function draw() {
        box.querySelectorAll('.os-tech').forEach(function (c) { c.remove(); });
        chips.forEach(function (text, i) {
          const span = document.createElement('span');
          span.className = 'os-tech';
          span.innerHTML = esc(text) + '<button type="button" aria-label="Remove ' + esc(text) + '" data-i="' + i + '">' + App.icon('x') + '</button>';
          box.insertBefore(span, entry);
        });
        hidden.value = chips.join(', ');
      }
      function addFromEntry() {
        entry.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (t) {
          if (chips.indexOf(t) === -1) chips.push(t);
        });
        entry.value = '';
        draw();
      }

      entry.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addFromEntry(); }
        if (e.key === 'Backspace' && !entry.value && chips.length) { chips.pop(); draw(); }
      });
      box.addEventListener('click', function (e) {
        const x = e.target.closest('button[data-i]');
        if (x) { chips.splice(Number(x.dataset.i), 1); draw(); entry.focus(); return; }
        if (e.target === box) entry.focus();
      });
      // Anything still typed in the box when you press Save is added too.
      form.addEventListener('submit', addFromEntry);
      draw();
    });
  }

  function setupSegs(form) {
    form.querySelectorAll('[data-seg]').forEach(function (seg) {
      const hidden = seg.querySelector('input[type="hidden"]');
      seg.addEventListener('click', function (e) {
        const b = e.target.closest('button[data-value]');
        if (!b) return;
        hidden.value = b.dataset.value;
        seg.querySelectorAll('button').forEach(function (x) {
          x.setAttribute('aria-pressed', x === b);
          x.setAttribute('aria-checked', x === b);
        });
      });
    });
  }

  App.openModal = function (opts) {
    const old = document.querySelector('.os-scrim');
    if (old) old.remove();

    const scrim = document.createElement('div');
    scrim.className = 'os-scrim';
    scrim.innerHTML =
      '<form class="os-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" novalidate>' +
      '<div class="os-modal__head"><div><h2 class="os-h2" id="modal-title">' + esc(opts.title) + '</h2>' +
      (opts.subtitle ? '<p class="os-modal__sub">' + esc(opts.subtitle) + '</p>' : '') + '</div>' +
      '<button type="button" class="os-iconbtn" data-modal-close aria-label="Close">' + App.icon('x') + '</button></div>' +
      '<div class="os-modal__body">' + opts.body + '</div>' +
      '<p class="os-modal__error" role="alert" hidden></p>' +
      '<div class="os-modal__foot"><button type="button" class="os-btn os-btn--ghost" data-modal-close>Cancel</button>' +
      '<button type="submit" class="os-btn os-btn--primary">' + esc(opts.submitLabel || 'Save') + '</button></div>' +
      '</form>';
    document.body.appendChild(scrim);
    document.body.classList.add('has-modal');

    const form = scrim.querySelector('form');
    const errorBox = scrim.querySelector('.os-modal__error');
    const lastFocus = document.activeElement;

    function close() {
      scrim.remove();
      document.body.classList.remove('has-modal');
      document.removeEventListener('keydown', onKey);
      if (lastFocus && lastFocus.focus && document.contains(lastFocus)) lastFocus.focus();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    document.addEventListener('keydown', onKey);
    scrim.addEventListener('mousedown', function (e) { if (e.target === scrim) close(); });
    scrim.querySelectorAll('[data-modal-close]').forEach(function (b) { b.addEventListener('click', close); });

    setupChips(form);
    setupSegs(form);
    if (opts.onReady) opts.onReady(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const values = {};
      new FormData(form).forEach(function (v, k) { values[k] = typeof v === 'string' ? v.trim() : v; });
      const problem = opts.onSubmit(values, form);
      if (typeof problem === 'string') {
        errorBox.textContent = problem;
        errorBox.hidden = false;
        return;
      }
      close();
    });

    const first = form.querySelector('.os-modal__body input:not([type="hidden"]), .os-modal__body textarea, .os-modal__body select');
    if (first) first.focus();
  };

  // ---------- the "Add date" form, used on program pages and the Deadlines page ----------
  // fixedProgram = program id, or empty to show a program picker.
  App.openDateModal = function (fixedProgram) {
    const programField = fixedProgram ? '' : App.field('Program', App.selectInput('program',
      App.PROGRAM_ORDER.map(function (id) { return { value: id, label: App.PROGRAMS[id].short }; }), 'gsoc'), { full: true });

    App.openModal({
      title: 'Add a date',
      subtitle: fixedProgram ? 'For ' + App.PROGRAMS[fixedProgram].title + '.' : 'It shows on the program page and here.',
      submitLabel: 'Add date',
      body: programField +
        App.field('What happens', App.textInput('title', '', 'e.g. Applications close'), { full: true }) +
        App.field('Date', '<input class="os-input os-mono" type="date" name="date">') +
        App.field('Label', App.selectInput('tag', [
          { value: 'official', label: 'official (from the program site)' },
          { value: 'proposed', label: 'proposed (my own plan)' },
          { value: 'pending', label: 'pending (known, may move)' },
          { value: 'expected', label: 'expected (a guess)' }
        ], 'official')) +
        '<label class="os-check os-full"><input type="checkbox" class="os-box" name="monthOnly" value="yes"> I only know the month</label>' +
        App.field('Note', App.textInput('note', '', 'Optional, e.g. where you found it'), { full: true }),
      onSubmit: function (v) {
        if (!v.title) return 'Write what happens on this date.';
        if (!v.date) return 'Pick a date.';
        const program = fixedProgram || v.program;
        App.getProgram(program).timeline.push({
          id: App.uid(),
          date: v.monthOnly ? v.date.slice(0, 7) : v.date,
          title: v.title,
          tag: v.tag,
          note: v.note
        });
        App.commit();
      }
    });
  };
})(window.App);
