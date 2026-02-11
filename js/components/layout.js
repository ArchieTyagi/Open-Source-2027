/* layout.js
   Draws the parts every page shares: the top bar, the side menu and the footer.
   Each HTML page only says which tab it is, with <body data-page="...">. */

(function (App) {
  // The pages in the side menu. icon = a line drawing from utils.js,
  // program = colour dot instead of an icon, short = name in the small menu.
  const NAV = [
    { group: '', items: [
      { page: 'planner', label: 'Planner', short: 'Planner', href: 'index.html', icon: 'calendar' }
    ] },
    { group: 'Programs', items: [
      { page: 'gsoc', label: 'GSoC', short: 'GSoC', href: 'gsoc.html', program: 'gsoc' },
      { page: 'esoc', label: 'ESoC', short: 'ESoC', href: 'esoc.html', program: 'esoc' },
      { page: 'lfx', label: 'LFX', short: 'LFX', href: 'lfx.html', program: 'lfx' },
      { page: 'sob', label: 'Summer of Bitcoin', short: 'SoB', href: 'sob.html', program: 'sob' }
    ] },
    { group: 'You', items: [
      { page: 'prs', label: 'Add PR', short: 'Add PR', href: 'prs.html', icon: 'plus' },
      { page: 'progress', label: 'Progress', short: 'Progress', href: 'progress.html', icon: 'chart' },
      { page: 'contributions', label: 'Contributions', short: 'PRs', href: 'contributions.html', icon: 'branch' }
    ] }
  ];

  // Open or closed side menu is remembered in this browser.
  const NAV_KEY = 'open-source-2027-nav';
  function navWasClosed() {
    try { return localStorage.getItem(NAV_KEY) === 'closed'; } catch (e) { return false; }
  }
  function rememberNav(closed) {
    try { localStorage.setItem(NAV_KEY, closed ? 'closed' : 'open'); } catch (e) { /* private mode */ }
  }

  function navItemHTML(t, current) {
    const active = t.page === current;
    const mark = t.program
      ? '<span class="os-nav__dot" style="--prog:var(--' + t.program + ')" aria-hidden="true">' + t.short.charAt(0) + '</span>'
      : App.icon(t.icon);
    return '<a class="os-nav__item' + (active ? ' is-active' : '') + '" href="' + t.href + '"' +
      (active ? ' aria-current="page"' : '') + ' title="' + t.label + '">' + mark +
      '<span class="os-nav__label">' + t.label + '</span>' +
      '<span class="os-nav__short" aria-hidden="true">' + t.short + '</span></a>';
  }

  function headerHTML(current) {
    const groups = NAV.map(function (g) {
      return '<div class="os-nav__group">' +
        (g.group ? '<p class="os-nav__title">' + g.group + '</p>' : '') +
        g.items.map(function (t) { return navItemHTML(t, current); }).join('') + '</div>';
    }).join('');
    return '<header class="os-top">' +
      '<button type="button" class="os-menu" data-nav-toggle aria-controls="os-nav" aria-expanded="true" aria-label="Open or close the menu">' + App.icon('menu') + '</button>' +
      '<a class="os-brand" href="index.html">Open Source <b>2027</b></a>' +
      '<span class="os-spacer"></span>' +
      '<span class="os-saved" id="save-status" role="status">All changes saved</span>' +
      '<button type="button" class="os-menu os-theme" data-theme-toggle aria-label="Switch light or dark mode"></button>' +
      '</header>' +
      '<nav class="os-nav" id="os-nav" aria-label="Pages">' + groups + '</nav>' +
      '<div class="os-nav-scrim" data-nav-close hidden></div>';
  }

  // Menu works like YouTube:
  //   big screen  = button switches between the full menu and the small icon menu
  //   phone       = menu is hidden, button slides it in over the page
  // ---------- light / dark switch ----------
  // Saved in this browser. Until you press it, the site follows the device setting.
  const THEME_KEY = 'open-source-2027-theme';
  function currentTheme() {
    const set = document.documentElement.dataset.theme;
    if (set) return set;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function drawThemeButton() {
    const btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    const dark = currentTheme() === 'dark';
    btn.innerHTML = App.icon(dark ? 'sun' : 'moon');
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.title = dark ? 'Light mode' : 'Dark mode';
  }
  function setupTheme() {
    const btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    btn.addEventListener('click', function () {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* private mode */ }
      drawThemeButton();
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', drawThemeButton);
    drawThemeButton();
  }

  function setupNav() {
    const app = document.querySelector('.os-app');
    const btn = document.querySelector('[data-nav-toggle]');
    const scrim = document.querySelector('[data-nav-close]');
    const phone = window.matchMedia('(max-width: 760px)');

    function sync() {
      const open = phone.matches ? app.classList.contains('is-nav-open') : !app.classList.contains('is-nav-mini');
      btn.setAttribute('aria-expanded', String(open));
      scrim.hidden = !(phone.matches && open);
    }
    if (navWasClosed()) app.classList.add('is-nav-mini');

    btn.addEventListener('click', function () {
      if (phone.matches) {
        app.classList.toggle('is-nav-open');
      } else {
        const mini = app.classList.toggle('is-nav-mini');
        rememberNav(mini);
      }
      sync();
    });
    scrim.addEventListener('click', function () { app.classList.remove('is-nav-open'); sync(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && app.classList.contains('is-nav-open')) { app.classList.remove('is-nav-open'); sync(); btn.focus(); }
    });
    phone.addEventListener('change', function () { app.classList.remove('is-nav-open'); sync(); });
    sync();
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

    setupNav();
    setupTheme();

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
