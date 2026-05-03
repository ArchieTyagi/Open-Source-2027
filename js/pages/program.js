/* program.js
   ONE template for every program page: GSoC, ESoC, LFX and Summer of Bitcoin.
   The HTML page says which program it is with <body data-program="gsoc">.
   The page shows the program header and the daily work log (js/components/worklog.js). */

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

  App.render = function () {
    const p = App.getProgram(id);
    document.title = info.title + ' · Open Source 2027';
    App.mount(document.getElementById('app'), headerHTML(p) + App.workLogHTML(id));
  };
})(window.App);
