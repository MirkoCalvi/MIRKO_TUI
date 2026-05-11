# MIRKO_TUI

My portfolio, styled as a developer's terminal. Static, single-page, no build step.

Live: <https://mirkocalvi.github.io/MIRKO_TUI/>

## Run locally

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Run tests

```bash
node --test tests/
```

(Requires Node ≥ 18. No `npm install` needed.)

## Edit

- **Add a project** → append an object to `data/projects.json`.
- **Update CV** → edit the relevant `<div class="cat-block">` inside `<section id="home">` in `index.html`.
- **Update About Me** → edit `<section id="about">` in `index.html`.
- **Tweak look** → `styles.css`.

## Layout

```
index.html       three sections in one file
styles.css       GitHub Dark theme + layout
main.mjs         hash router + projects loader (DOM glue)
lib.mjs          pure helpers (renderer, hash mapper, escape)
data/projects.json  curated project list
tests/lib.test.mjs  unit tests for lib.mjs
docs/superpowers/   design spec and implementation plan
```

*Open Source Everything - Mirko Calvi*