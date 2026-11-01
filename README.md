# Open Source 2027

A personal planner for applying to GSoC, ESoC, LFX Mentorship and Summer of Bitcoin in 2027.
Plain HTML, CSS and JavaScript. No framework, no install, no server.

## Run it

Double-click `index.html`. That's it.

Or, if you want a local server (a program that serves the files at a web address on your own laptop), open the folder in a terminal and run one of these:

```bash
npx serve .            # needs Node.js
python -m http.server  # needs Python, then open http://localhost:8000
```

Your data is saved in the browser's localStorage (a small storage space inside the browser that stays after you close the tab). It does not leave your laptop. Use **Export backup** in the footer now and then, and **Import backup** to load it on another browser.

## Folder structure

```
open-source-2027/
├── index.html            Planner (weekly to-dos, progress, focus)
├── gsoc.html             ┐
├── esoc.html             │ Program pages. All four use the SAME template:
├── lfx.html              │ js/pages/program.js
├── sob.html              ┘
├── deadlines.html        Every date from all programs in one list
├── progress.html         Streak, active days, tasks done, merged PRs, heatmap
├── contributions.html    Log of PRs, issues and docs fixes
│
├── css/
│   ├── tokens.css        Colours, fonts, spacing, corners (change the look here)
│   ├── components.css    Styles for every building block (cards, buttons, lists...)
│   └── app.css           Small extras: footer, modal form, phone tweaks
│
└── js/
    ├── utils.js          Helpers: icons, safe text, ids, dates
    ├── programs.js       The 4 programs: names, links, starting milestones and dates
    ├── store.js          All your data, and saving it to localStorage
    ├── components/
    │   ├── ui.js         Shared HTML pieces: checklist, stars, rings, pills, empty states
    │   ├── modal.js      The pop-up form (Add organization, Add proposal, Add date)
    │   └── layout.js     Top bar, tabs and footer on every page
    └── pages/
        ├── planner.js
        ├── program.js    One template for GSoC, ESoC, LFX and Summer of Bitcoin
        ├── deadlines.js
        ├── progress.js
        └── contributions.js
```

## How a page works

Every HTML page is the same empty shell. Only two things change:

```html
<body data-page="esoc" data-program="esoc">
...
<script src="js/pages/program.js"></script>
```

1. The shared scripts load first (`utils.js`, `programs.js`, `store.js`, then the components).
2. The page script sets `App.render`, a function that builds the page's HTML from `App.data`.
3. When the page is ready, `layout.js` draws the top bar and footer, then calls `App.render()`.
4. When you click something, the code changes `App.data`, then calls `App.commit()`.
   `commit` = save to localStorage, then draw the page again.

That is the whole idea: **data → render → click → change data → save → render again.**

## How the 4 program pages share one template

`program.js` reads `data-program` from the `<body>` tag, then looks up that program in `programs.js`:

```js
const id = document.body.dataset.program;   // "esoc"
const info = App.PROGRAMS[id];               // name, title, link, milestones, dates
```

The program colour comes from CSS. `layout.js` sets `--prog: var(--esoc)` on the page, and every place that uses `var(--prog)` (title, chips, timeline, org avatars) turns teal.

**To add a 5th program** (say Outreachy):
1. Add a colour in `css/tokens.css`, like `--outreachy: #...;`
2. Add an entry in `js/programs.js` and put its id in `App.PROGRAM_ORDER`.
3. Copy `esoc.html` to `outreachy.html` and change `data-page` and `data-program`.
4. Add a tab in `js/components/layout.js`.

## What the data looks like

Everything lives in one object, `App.data`:

```js
{
  days: {
    "2026-11-01": { tasks: [{ id, text, done }], rating: 4 }
  },
  weekFocus: { "2026-10-26": "Get OSS-CRS running" },   // key = Monday of that week
  programs: {
    esoc: {
      orgs:       [{ id, name, project, stack: [], repo, status, desc }],
      daily:      { "2026-11-01": [{ id, text, done }] },
      milestones: [{ id, text, done }],
      journal:    [{ id, date, text }],
      proposals:  [{ id, title, org, status, deadline, link, outline }],
      timeline:   [{ id, date, title, tag, note }]
    }
  },
  contributions: [{ id, date, what, project, type, status }]
}
```

Dates are text keys: `"2026-11-01"` is an exact day, `"2027-02"` means only the month is known.
They are shown as `01.11.2026` and `Feb 2027`.

## About the starting dates

The 2027 dates are not announced yet. Every starting date in `programs.js` is labelled:

| Label | Means |
| --- | --- |
| official | Copied from the program's own site |
| proposed | Your own plan |
| pending | Known, but could still move |
| expected | A guess based on the 2026 dates (the note says which date) |

When a program announces its 2027 dates, delete the guess on its page and add the real date as **official**.

Sources for the 2026 dates:
- GSoC: https://developers.google.com/open-source/gsoc/timeline
- LFX Mentorship: https://docs.linuxfoundation.org/lfx/mentorship/mentorship-program-timelines
- Summer of Bitcoin: https://blog.summerofbitcoin.org
- ESoC posts projects on a rolling basis: https://www.esoc.dev

## Good order to read the code

1. `index.html`, to see the shell every page shares
2. `css/tokens.css`
3. `js/utils.js` (small, plain functions)
4. `js/store.js` (where data lives and how saving works)
5. `js/components/ui.js` (the checklist is the best example of the render and click pattern)
6. `js/pages/contributions.js` (the shortest page)
7. `js/pages/program.js` (the biggest page, same ideas)
