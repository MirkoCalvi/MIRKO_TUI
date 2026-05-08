# MIRKO_TUI — Terminal-styled personal portfolio (design)

Date: 2026-05-08
Status: design approved, ready for implementation plan

## Goal

A static personal portfolio for Mirko Calvi, styled visually as a developer's terminal. Three sections (Home with CV, Projects, About Me) served from one HTML file with JS-driven section swapping. No build step, no framework, no runtime dependencies beyond a web font. Hosted on GitHub Pages first; later movable to a self-hosted server in Mirko's home (no design impact — any static HTTP server will do).

## Non-goals (intentionally not building)

- Typeable command input (no real REPL — clicks only)
- Theme switcher (single GitHub Dark theme)
- Boot/typing animations (content visible immediately on load)
- GitHub API integration (project list is manually curated)
- Search, blog, contact form, analytics, dark/light toggle, i18n
- Any build step, package manager, or framework

## Architecture

Single-page application using vanilla HTML/CSS/JS. All three sections live in `index.html` as sibling `<section>` elements; JS toggles which section is visible via the URL hash.

```
index.html  ──┐
              │   <section id="home">    <-- CV-as-terminal
              │   <section id="projects"> <-- list rendered from data/projects.json
              │   <section id="about">    <-- personal bio
              ▼
        styles.css   (GitHub Dark palette, monospace, layout)
        main.js      (hash router + projects renderer)
        data/projects.json  (curated repo list)
```

### Why this shape

- **Single HTML file** — chosen over a 3-file static site because the terminal aesthetic benefits from no page-flicker on navigation; clicking `[ projects ]` should feel like running a command, not loading a new document.
- **Hash routing** — gives deep-linkability (`mirkocalvi.github.io/MIRKO_TUI/#projects`) and browser back/forward support without a build step or History API complexity.
- **JSON for projects, HTML for CV** — projects benefit from data-driven rendering (uniform cards, easy to add). CV content is one-off prose; encoding it as data adds friction without payoff. Edit it where it lives.

## File layout

```
/
├── index.html              <-- 3 sections, ~200 lines
├── styles.css              <-- ~150 lines
├── main.js                 <-- ~30 lines
├── data/
│   └── projects.json       <-- curated repo list
├── README.md
├── .gitignore              <-- already includes .superpowers/
└── docs/superpowers/specs/ <-- this file
```

Total expected source: ~400 lines across all files. Easy to scan, easy to edit by hand.

## Data model

### `data/projects.json`

```json
[
  {
    "name": "Z-Ant",
    "description": "Zig-based ONNX inference engine for microcontrollers. 375+ stars, used by 15 PoliMi master's students, cited in 2 academic papers.",
    "url": "https://github.com/ZantFoundation/Z-Ant",
    "tags": ["zig", "onnx", "edge-ai", "embedded"]
  },
  {
    "name": "Mathpilot",
    "description": "Cross-platform B2B SaaS for AI-driven correction of university-level STEM exercises. 100+ users.",
    "url": "https://mathpilot.ai",
    "tags": ["saas", "ai", "edutech", "fastapi"]
  },
  {
    "name": "CrowDJ",
    "description": "<one-line description — confirm with Mirko>",
    "url": "<github URL — confirm with Mirko>",
    "tags": []
  },
  {
    "name": "My Shelfie",
    "description": "<one-line description — confirm with Mirko>",
    "url": "<github URL — confirm with Mirko>",
    "tags": []
  }
]
```

Schema: each project is `{ name, description, url, tags[] }`. Order in the file = order on the page. `tags[]` is rendered as `[zig, onnx, edge-ai]` chips.

URLs may point to GitHub repos in any namespace (Mirko's account, Zant org, third-party orgs) or external sites (e.g. mathpilot.ai). The `url` field is opaque — no GitHub-specific parsing.

**Adding a project** = append one object, push to GitHub. No code changes.

## Section content

All three sections share the visual frame: a fake terminal session with `mirko@portfolio:~$` prompts, monospace, GitHub Dark colors.

### `#home` (default visible)

CV rendered as a sequence of `cat <file>` "commands" with their output. Each command/output pair is a `<div class="cat-block">` with two children: a `.prompt` line and a `.output` block.

Sections, in order:

1. `whoami` → "Mirko Calvi — Software Engineer | Edge AI Engineer | Robotics"
2. `cat about.txt` → professional summary paragraph
3. `cat experience.txt` → roles list (Zant s.r.l. CTO, Zant Foundation Founder, AIRLAB FRE engineer, Bitpolimi cofounder), each with title, dates, location, 2-3 bullet highlights
4. `cat education.txt` → PoliMi MSc, Malmö Erasmus, PoliMi BSc, with dates
5. `cat skills.txt` → grouped skill list (Languages / Edge AI & Embedded / ML & AI / Robotics & CV / Infrastructure / OS), matching the CV grouping
6. `cat publications.txt` → master's thesis link
7. `cat contact.txt` → email, phone, location, LinkedIn, GitHub
8. `ls` → navigation row: `[ projects ]   [ about-me ]   [ github ↗ ]   [ linkedin ↗ ]   [ email ↗ ]`

The navigation row is the only interactive element. Internal links (`[ projects ]`, `[ about-me ]`) update the hash; external links (`[ github ↗ ]`, `[ email ↗ ]`) open in new tabs (`target="_blank" rel="noopener"`).

A blinking cursor (CSS `@keyframes blink`) sits at the end of the final prompt line.

### `#projects`

```
mirko@portfolio:~$ ls projects/

> Z-Ant
  Zig-based ONNX inference engine for microcontrollers...
  [zig] [onnx] [edge-ai] [embedded]                  github ↗

> Mathpilot
  Cross-platform B2B SaaS for AI-driven STEM correction...
  [saas] [ai] [edutech] [fastapi]                    visit ↗

[ ← back ]
```

Rendered by `main.js` from `data/projects.json` on first visit to the section. Each entry is one `<article class="project">` with name, description, tag chips, and an external link. Link text is "github ↗" if the URL contains `github.com`, otherwise "visit ↗".

`[ ← back ]` returns to home (sets hash to empty string).

### `#about`

```
mirko@portfolio:~$ cat about-me.md

<longer bio paragraph — to be written by Mirko>

interests: <hobbies, what you care about>

[ ← back ]
```

Single block of prose written directly in the HTML. Initial content is a placeholder Mirko fills in. Optional ASCII-art header/portrait if desired (not in scope for v1).

## Navigation behavior

Implemented in `main.js`, ~30 lines total.

- On page load: read `window.location.hash`. If `#projects` or `#about`, show that section; else show `#home`. Default section is `#home`.
- Clicking any internal link (`<a href="#projects">`) updates the hash. A `hashchange` event listener swaps which section has `display:block` (others `display:none`).
- The first time `#projects` becomes visible, `main.js` fetches `data/projects.json` and renders into `#projects .project-list`. Subsequent visits reuse the rendered DOM (cached).
- A render error (network failure, malformed JSON) shows a single line: `error: failed to load projects.json` inside the projects section. No crash, no infinite spinner.
- Browser back/forward triggers `hashchange` → correct section shown. Direct deep-links work.

## Theme & aesthetic

- **Palette:** GitHub Dark
  - bg `#0d1117`
  - text `#c9d1d9`
  - prompt-green `#7ee787`
  - link-blue `#79c0ff`
  - accent-orange `#ffa657` (used sparingly for `★` markers, tag chips border)
  - muted `#8b949e` (dates, metadata)
- **Font:** JetBrains Mono via Google Fonts (`@import` at top of `styles.css`). Fallback: `'Menlo', 'Consolas', monospace`. Loading the font is the only network request beyond the page itself.
- **Layout:** centered column, max-width ~860px, padding scales down on mobile. No grid frameworks, just flexbox where needed.
- **Cursor:** CSS-only blinking `▍` at the end of the last prompt of each section. No JS.
- **No transitions, no animations on load.**

## Hosting & deployment

### Phase 1 (immediate): GitHub Pages

- Push to `main` branch of `github.com/MirkoCalvi/MIRKO_TUI`.
- In repo settings, enable Pages: source = `main`, folder = `/` (root).
- URL becomes `https://mirkocalvi.github.io/MIRKO_TUI/`.
- No CI, no workflow file needed — Pages serves static files directly from the branch.

### Phase 2 (later, optional): self-hosted on Mirko's home PC

Because every artifact is a static file, any of these works with zero changes:
- `python3 -m http.server 8080` (quickest)
- nginx serving the project directory as a `root`
- caddy with a one-line Caddyfile
- The user can pull the repo on the home machine, point an HTTP server at it, and (optionally) attach a domain via DDNS or a tunnel like Cloudflare Tunnel / Tailscale Funnel.

No design or code changes are needed for Phase 2.

## Maintenance flow ("easy to update" promise)

| Change | What you edit | Then |
|---|---|---|
| Add a project | `data/projects.json` (append one object) | `git push` |
| Update CV section (e.g. new job) | `index.html` → `<section id="home">` → relevant `.cat-block` | `git push` |
| Update About Me bio | `index.html` → `<section id="about">` | `git push` |
| Tweak colors / spacing | `styles.css` | `git push` |

No `npm install`. No build. No webpack config to fight.

## Open questions for Mirko

1. **CrowDJ and My Shelfie URLs/descriptions** — the CV mentions both but doesn't include their repository URLs or descriptions. Need a one-liner and a link for each before `projects.json` is finalized.
2. **About Me content** — the spec scaffolds an empty `<section id="about">`. Mirko provides the bio paragraph and any hobbies/interests when ready (can be a follow-up after v1 ships).
3. **Custom domain?** — defaults to `mirkocalvi.github.io/MIRKO_TUI/`. If Mirko has or wants a custom domain (e.g. `mirko.dev`), a `CNAME` file in repo root + DNS config does it. Not blocking v1.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| GitHub API rate-limits | N/A — we don't call the GitHub API. |
| `projects.json` fetch fails (offline, 404) | Show a single-line error inside the section. Rest of site works. |
| JetBrains Mono CDN goes down | `font-family` falls back to `Menlo`/`Consolas`/`monospace` — site still legible, just slightly less branded. |
| GitHub Pages caching old CSS after edit | Append `?v=<date>` to the CSS link manually if it bites; not a concern for normal usage. |
