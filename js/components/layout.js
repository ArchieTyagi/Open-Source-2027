/* layout.js
   Draws the parts every page shares: the top bar, the tabs and the footer.
   Each HTML page only says which tab it is, with <body data-page="...">. */

(function (App) {
  const TABS = [
    { page: 'planner', label: 'Planner', href: 'index.html' },
    { page: 'gsoc', label: 'GSoC', href: 'gsoc.html', program: 'gsoc' },
    { page: 'esoc', label: 'ESoC', href: 'esoc.html', program: 'esoc' },
    { page: 'lfx', label: 'LFX', href: 'lfx.html', program: 'lfx' },
    { page: 'sob', label: 'Summer of Bitcoin', href: 'sob.html', program: 'sob' },
    { page: 'outreachy', label: 'Outreachy', href: 'outreachy.html', program: 'outreachy' },
    { page: 'fossee', label: 'IIT Bombay', href: 'fossee.html', program: 'fossee' },
    { page: 'fossoverflow', label: 'IIT Bhilai', href: 'fossoverflow.html', program: 'fossoverflow' },
    { page: 'deadlines', label: 'Deadlines', href: 'deadlines.html' },
    { page: 'progress', label: 'Progress', href: 'progress.html' },
    { page: 'contributions', label: 'Contributions', href: 'contributions.html' }
  ];

  function headerHTML(current) {
    const tabs = TABS.map(function (t) {
      const active = t.page === current;
      const dot = t.program ? '<i style="--prog:var(--' + t.program + ')"></i>' : '';
      return '<a class="os-tab' + (active ? ' is-active' : '') + '" href="' + t.href + '"' +
        (active ? ' aria-current="page"' : '') + '>' + dot + t.label + '</a>';
    }).join('');
    return '<header class="os-top">' +
      '<a class="os-brand" href="index.html">Open Source <b>2027</b></a>' +
      '<span class="os-saved" id="save-status" role="status">All changes saved</span>' +
      '</header>' +
      '<nav class="os-tabs" aria-label="Pages">' + tabs + '</nav>';
  }

  function footerHTML() {
    return '<div class="os-foot">' +
      '<span>Your data is saved in this browser only. Export a backup now and then.</span>' +
      '<div class="os-row">' +
      '<button class="os-btn os-btn--quiet os-btn--sm" type="button" data-foot="export">Export backup</button>' +
      '<label class="os-btn os-btn--quiet os-btn--sm">Import backup<input type="file" accept=".json,application/json" hidden data-foot="import"></label>' +
      '<button class="os-btn os-btn--quiet os-btn--sm" type="button" data-foot="reset">Reset everything</button>' +
      '</div></div>';
  }

  App.renderShell = function () {
    const current = document.body.dataset.page;
    document.getElementById('app-header').innerHTML = headerHTML(current);
    const footer = document.getElementById('app-footer');
    footer.innerHTML = footerHTML();

    // Program pages take their program colour (--prog) everywhere on the page.
    const program = document.body.dataset.program;
    if (program) document.body.style.setProperty('--prog', 'var(--' + program + ')');

    // On a phone the tabs scroll sideways: bring the current tab into view.
    const active = document.querySelector('.os-tab.is-active');
    if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest', inline: 'center' });

    footer.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-foot]');
      if (!btn) return;
      if (btn.dataset.foot === 'export') App.exportData();
      if (btn.dataset.foot === 'reset' && confirm('Delete ALL your data in this browser? Export a backup first if you want to keep it.')) {
        App.resetData();
        if (App.render) App.render();
      }
    });

    footer.addEventListener('change', function (e) {
      const input = e.target.closest('[data-foot="import"]');
      if (!input || !input.files[0]) return;
      const reader = new FileReader();
      reader.onload = function () {
        try {
          if (!confirm('Replace your current data with this backup?')) return;
          App.importData(reader.result);
          if (App.render) App.render();
        } catch (err) {
          alert(err.message || 'Could not read that file.');
        } finally {
          input.value = '';
        }
      };
      reader.readAsText(input.files[0]);
    });
  };

  // Start the page once the HTML is ready.
  App.start = function () {
    App.renderShell();
    if (App.render) App.render();
  };
  document.addEventListener('DOMContentLoaded', function () { App.start(); });
})(window.App);
