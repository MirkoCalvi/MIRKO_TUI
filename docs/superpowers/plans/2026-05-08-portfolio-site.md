# MIRKO_TUI Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship v1 of Mirko Calvi's terminal-styled personal portfolio: single-page static site with three sections (Home/Projects/About) hash-routed in a single `index.html`, deployable to GitHub Pages with no build step.

**Architecture:** Vanilla HTML + CSS + ES-module JS. Pure logic lives in `lib.mjs` (testable with Node's built-in test runner), DOM glue lives in `main.mjs`. The CV is hand-written HTML. The Projects list is rendered from `data/projects.json`.

**Tech Stack:** HTML5, CSS3 (custom properties + flexbox), ES modules, JetBrains Mono via Google Fonts, Node.js `--test` (built in, no install) for the few unit-tested helpers, `python3 -m http.server` for local serving, GitHub Pages for hosting.

**Scope note:** Spec calls the JS files `main.js` / (no lib file). This plan splits into `main.mjs` + `lib.mjs` so pure logic is unit-testable without a DOM. The `.mjs` extension means Node treats them as ES modules without needing a `package.json`. Browser handles `.mjs` via `<script type="module">` — GitHub Pages serves it with the right MIME type.

**Reference:** Design spec at `docs/superpowers/specs/2026-05-08-portfolio-site-design.md`. Read it first for context on what each section should contain.

---

## File map

What gets created (and roughly its responsibility):

| Path | Responsibility | Approx. LOC |
|---|---|---|
| `index.html` | Three `<section>` elements, font import, page chrome | ~170 |
| `styles.css` | GitHub Dark palette via CSS vars, typography, layout, cursor blink, mobile | ~150 |
| `lib.mjs` | Pure functions: `pickSection`, `linkLabel`, `escapeHtml`, `renderProjectsHtml` | ~40 |
| `main.mjs` | DOM glue: hashchange listener, lazy projects fetch, section toggle | ~35 |
| `data/projects.json` | Curated project list seed data | ~40 |
| `tests/lib.test.mjs` | Unit tests for the four pure helpers | ~70 |
| `README.md` | Updated description + run-locally snippet | ~20 |

Why this split: the only code worth unit-testing is in `lib.mjs` (logic that can break in non-obvious ways — escaping, URL classification, hash mapping). `main.mjs` is wiring; verified by browser walkthrough. HTML/CSS are verified visually.

---

## Task 1: Create directory structure

**Files:**
- Create: `data/` (directory)
- Create: `tests/` (directory)

- [ ] **Step 1: Make the directories**

```bash
mkdir -p data tests
```

- [ ] **Step 2: Verify**

```bash
ls -d data tests
```

Expected output:
```
data
tests
```

(No commit yet — we'll commit at the end of Task 2 when there's actual content.)

---

## Task 2: TDD `pickSection(hash)` — hash → section ID mapper

**Files:**
- Create: `tests/lib.test.mjs`
- Create: `lib.mjs`

`pickSection(hash)` reads `window.location.hash` (e.g. `#projects`, `#about`, `''`, or junk) and returns the section ID to show. Default is `'home'`.

- [ ] **Step 1: Write the failing test**

Create `tests/lib.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickSection } from '../lib.mjs';

test('pickSection: empty hash defaults to home', () => {
  assert.equal(pickSection(''), 'home');
});

test('pickSection: bare # defaults to home', () => {
  assert.equal(pickSection('#'), 'home');
});

test('pickSection: #projects → projects', () => {
  assert.equal(pickSection('#projects'), 'projects');
});

test('pickSection: #about → about', () => {
  assert.equal(pickSection('#about'), 'about');
});

test('pickSection: #home → home', () => {
  assert.equal(pickSection('#home'), 'home');
});

test('pickSection: unknown hash falls back to home', () => {
  assert.equal(pickSection('#nope'), 'home');
});

test('pickSection: undefined input falls back to home', () => {
  assert.equal(pickSection(undefined), 'home');
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
node --test tests/lib.test.mjs
```

Expected: all 7 tests fail with module-not-found error pointing at `../lib.mjs`.

- [ ] **Step 3: Write minimal implementation**

Create `lib.mjs`:

```javascript
const VALID_SECTIONS = new Set(['home', 'projects', 'about']);

export function pickSection(hash) {
  if (!hash) return 'home';
  const id = hash.replace(/^#/, '');
  return VALID_SECTIONS.has(id) ? id : 'home';
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
node --test tests/lib.test.mjs
```

Expected: 7 tests pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add tests/lib.test.mjs lib.mjs
git commit -m "Add pickSection: hash → section ID mapper"
```

---

## Task 3: TDD `linkLabel(url)` — choose link text

**Files:**
- Modify: `tests/lib.test.mjs` (add tests at end)
- Modify: `lib.mjs` (add export at end)

`linkLabel(url)` returns `'github ↗'` for GitHub URLs, `'visit ↗'` for everything else. Used to render project cards.

- [ ] **Step 1: Add the failing tests**

Append to `tests/lib.test.mjs`:

```javascript
import { linkLabel } from '../lib.mjs';

test('linkLabel: github.com URL → github label', () => {
  assert.equal(linkLabel('https://github.com/foo/bar'), 'github ↗');
});

test('linkLabel: github.io URL → github label', () => {
  assert.equal(linkLabel('https://example.github.io/site'), 'github ↗');
});

test('linkLabel: external site → visit label', () => {
  assert.equal(linkLabel('https://mathpilot.ai'), 'visit ↗');
});

test('linkLabel: empty string → visit label (defensive)', () => {
  assert.equal(linkLabel(''), 'visit ↗');
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
node --test tests/lib.test.mjs
```

Expected: 4 new tests fail with `linkLabel is not a function` (or import error).

- [ ] **Step 3: Add the implementation**

Append to `lib.mjs`:

```javascript
export function linkLabel(url) {
  if (typeof url === 'string' && /github\.(com|io)/.test(url)) {
    return 'github ↗';
  }
  return 'visit ↗';
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
node --test tests/lib.test.mjs
```

Expected: all 11 tests pass.

- [ ] **Step 5: Commit**

```bash
git add tests/lib.test.mjs lib.mjs
git commit -m "Add linkLabel: classify project URLs"
```

---

## Task 4: TDD `escapeHtml(s)` — XSS-safe text

**Files:**
- Modify: `tests/lib.test.mjs`
- Modify: `lib.mjs`

`escapeHtml` is a building block for `renderProjectsHtml` — keeps user-controlled strings (project names, descriptions, tags) from breaking out of attributes/elements. Even though *you* control `projects.json`, escaping prevents accidents (e.g. an `&` in a description rendering as a broken entity).

- [ ] **Step 1: Add the failing tests**

Append to `tests/lib.test.mjs`:

```javascript
import { escapeHtml } from '../lib.mjs';

test('escapeHtml: ampersand', () => {
  assert.equal(escapeHtml('A & B'), 'A &amp; B');
});

test('escapeHtml: angle brackets', () => {
  assert.equal(escapeHtml('<script>alert(1)</script>'),
    '&lt;script&gt;alert(1)&lt;/script&gt;');
});

test('escapeHtml: quotes', () => {
  assert.equal(escapeHtml('she said "hi"'), 'she said &quot;hi&quot;');
});

test('escapeHtml: single quote', () => {
  assert.equal(escapeHtml("it's"), 'it&#39;s');
});

test('escapeHtml: undefined returns empty string', () => {
  assert.equal(escapeHtml(undefined), '');
});

test('escapeHtml: null returns empty string', () => {
  assert.equal(escapeHtml(null), '');
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
node --test tests/lib.test.mjs
```

Expected: 6 new tests fail.

- [ ] **Step 3: Add the implementation**

Append to `lib.mjs`:

```javascript
export function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
node --test tests/lib.test.mjs
```

Expected: all 17 tests pass.

- [ ] **Step 5: Commit**

```bash
git add tests/lib.test.mjs lib.mjs
git commit -m "Add escapeHtml helper"
```

---

## Task 5: TDD `renderProjectsHtml(projects)` — generate Projects markup

**Files:**
- Modify: `tests/lib.test.mjs`
- Modify: `lib.mjs`

Produces the HTML string injected into `<section id="projects">`. Each project becomes one `<article class="project">` with a name, description, tag chips, and a link.

- [ ] **Step 1: Add the failing tests**

Append to `tests/lib.test.mjs`:

```javascript
import { renderProjectsHtml } from '../lib.mjs';

test('renderProjectsHtml: empty array produces empty-state message', () => {
  const html = renderProjectsHtml([]);
  assert.match(html, /no projects/i);
});

test('renderProjectsHtml: includes project name and description', () => {
  const html = renderProjectsHtml([{
    name: 'Z-Ant',
    description: 'ONNX inference engine.',
    url: 'https://github.com/ZantFoundation/Z-Ant',
    tags: ['zig', 'onnx']
  }]);
  assert.match(html, /Z-Ant/);
  assert.match(html, /ONNX inference engine\./);
});

test('renderProjectsHtml: includes tag chips', () => {
  const html = renderProjectsHtml([{
    name: 'Z-Ant', description: '.', url: 'https://github.com/x/y',
    tags: ['zig', 'onnx']
  }]);
  assert.match(html, /class="tag"[^>]*>zig</);
  assert.match(html, /class="tag"[^>]*>onnx</);
});

test('renderProjectsHtml: github URL gets github label', () => {
  const html = renderProjectsHtml([{
    name: 'X', description: '.', url: 'https://github.com/a/b', tags: []
  }]);
  assert.match(html, /github ↗/);
});

test('renderProjectsHtml: external URL gets visit label', () => {
  const html = renderProjectsHtml([{
    name: 'X', description: '.', url: 'https://mathpilot.ai', tags: []
  }]);
  assert.match(html, /visit ↗/);
});

test('renderProjectsHtml: link has rel=noopener and target=_blank', () => {
  const html = renderProjectsHtml([{
    name: 'X', description: '.', url: 'https://github.com/a/b', tags: []
  }]);
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test('renderProjectsHtml: escapes HTML in description (XSS guard)', () => {
  const html = renderProjectsHtml([{
    name: 'X',
    description: '<script>alert(1)</script>',
    url: 'https://github.com/a/b',
    tags: []
  }]);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;/);
});

test('renderProjectsHtml: handles missing tags array', () => {
  const html = renderProjectsHtml([{
    name: 'X', description: '.', url: 'https://github.com/a/b'
  }]);
  // no crash — tags section just empty
  assert.match(html, /X/);
});
```

- [ ] **Step 2: Run tests to verify failure**

```bash
node --test tests/lib.test.mjs
```

Expected: 8 new tests fail.

- [ ] **Step 3: Add the implementation**

Append to `lib.mjs`:

```javascript
export function renderProjectsHtml(projects) {
  if (!Array.isArray(projects) || projects.length === 0) {
    return '<p class="empty">no projects yet.</p>';
  }
  return projects.map(p => {
    const name = escapeHtml(p.name);
    const description = escapeHtml(p.description);
    const url = escapeHtml(p.url);
    const label = linkLabel(p.url);
    const tags = (p.tags || [])
      .map(t => `<span class="tag">${escapeHtml(t)}</span>`)
      .join(' ');
    return `<article class="project">
  <h3 class="project-name">&gt; ${name}</h3>
  <p class="project-desc">${description}</p>
  <div class="project-meta">
    <div class="project-tags">${tags}</div>
    <a class="project-link" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>
  </div>
</article>`;
  }).join('\n');
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
node --test tests/lib.test.mjs
```

Expected: all 25 tests pass.

- [ ] **Step 5: Commit**

```bash
git add tests/lib.test.mjs lib.mjs
git commit -m "Add renderProjectsHtml: build projects section markup"
```

---

## Task 6: Create `data/projects.json`

**Files:**
- Create: `data/projects.json`

Seed data from the design spec. CrowDJ and My Shelfie are placeholders — Mirko will fill them in later.

- [ ] **Step 1: Write the file**

Create `data/projects.json`:

```json
[
  {
    "name": "Z-Ant",
    "description": "Zig-based ONNX inference engine for microcontrollers. 375+ stars, used by 15 PoliMi master's students, cited in 2 academic papers.",
    "url": "https://github.com/ZantFoundation/Z-Ant",
    "tags": ["zig", "c", "onnx", "edge-ai", "embedded", "arm-cortex-m", "stm32", "freertos", "tflm", "quantization", "neural-networks", "open-source", "ci-cd"]
  },
  {
    "name": "Mathpilot",
    "description": "Cross-platform B2B SaaS for AI-driven correction of university-level STEM exercises. 100+ users.",
    "url": "https://mathpilot.ai",
    "tags": ["saas", "edutech", "full-stack", "python", "fastapi", "dart", "swift", "ios", "postgresql", "gcp", "docker", "ci-cd", "llm", "langchain", "prompt-engineering"]
  },
  {
    "name": "CrowDJ",
    "description": "TODO: one-line description (placeholder)",
    "url": "https://github.com/MirkoCalvi",
    "tags": ["TODO"]
  },
  {
    "name": "My Shelfie",
    "description": "TODO: one-line description — PoliMi software-engineering board game project (placeholder)",
    "url": "https://github.com/MirkoCalvi",
    "tags": ["java", "TODO"]
  }
]
```

- [ ] **Step 2: Verify it's valid JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('data/projects.json','utf8')); console.log('ok')"
```

Expected output: `ok`

- [ ] **Step 3: Commit**

```bash
git add data/projects.json
git commit -m "Add projects.json seed data"
```

---

## Task 7: Create `index.html` skeleton

**Files:**
- Create: `index.html`

Doctype, head with font + CSS link, three empty `<section>` elements with the right IDs, script tag at the end. Content goes in later tasks.

- [ ] **Step 1: Write the file**

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mirko Calvi — Software Engineer</title>
<meta name="description" content="Mirko Calvi — Software Engineer, Edge AI, Robotics. Personal portfolio.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="./styles.css">
</head>
<body>
<main class="terminal" role="main">

  <section id="home" class="screen" data-section="home">
    <!-- Home content goes here in Task 8 -->
  </section>

  <section id="projects" class="screen" data-section="projects" hidden>
    <!-- Projects scaffolding goes here in Task 10 -->
  </section>

  <section id="about" class="screen" data-section="about" hidden>
    <!-- About content goes here in Task 9 -->
  </section>

</main>
<script type="module" src="./main.mjs"></script>
</body>
</html>
```

- [ ] **Step 2: Verify file exists**

```bash
test -f index.html && echo "ok"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add index.html skeleton with three empty sections"
```

---

## Task 8: Fill `#home` section with CV-as-terminal content

**Files:**
- Modify: `index.html` (replace the comment inside `<section id="home">`)

Each CV section becomes a `<div class="cat-block">` with a prompt line and an output block. Content drawn from `CV_Mirko_Calvi.pdf`.

- [ ] **Step 1: Replace the home section content**

In `index.html`, replace the line `<!-- Home content goes here in Task 8 -->` with:

```html
    <header class="banner">
      <h1 class="name">Mirko Calvi</h1>
      <p class="tagline">Software Engineer · Edge AI Engineer · Robotics</p>
    </header>

    <div class="cat-block">
      <p class="prompt"><span class="user">mirko@cv</span>:<span class="path">~</span>$ whoami</p>
      <div class="output">Mirko Calvi — Software Engineer, Edge AI Engineer, Robotics</div>
    </div>

    <div class="cat-block">
      <p class="prompt"><span class="user">mirko@cv</span>:<span class="path">~</span>$ cat about.txt</p>
      <div class="output">
        <p>CTO and Software Engineer specializing in Edge AI, Embedded Systems, and Robotics. Cofounder of Zant, a high-performance inference engine for microcontrollers. Proven track record of securing venture capital (€170k Seed Round), shipping cross-platform SaaS products, and building global developer communities. Expert in optimizing neural networks (ONNX) for constrained hardware.</p>
      </div>
    </div>

    <div class="cat-block">
      <p class="prompt"><span class="user">mirko@cv</span>:<span class="path">~</span>$ cat experience.txt</p>
      <div class="output">
        <article class="job">
          <h3 class="job-title">Zant s.r.l. — CTO &amp; Cofounder</h3>
          <p class="job-meta">Jun 2025 – Apr 2026 · Milan</p>
          <ul>
            <li>Raised €170k seed round; followed 3 pilot contracts; collaborated with Arduino. Operations dissolved due to strategic misalignment; open-source project remains active.</li>
            <li>Developed Zant SDK: high-performance ONNX inference engine for ARM Cortex-M; custom memory allocator + quantization pipeline; 15% improvement on peak memory usage on CNN vs TFLM.</li>
            <li>Architected Mathpilot.ai: cross-platform B2B SaaS for AI-driven STEM correction; 100+ users.</li>
            <li>Smart Retail Analytics: CV system for real-time crowd analysis and age estimation; delivered insights to 2 clients.</li>
          </ul>
        </article>
        <article class="job">
          <h3 class="job-title">Zant Foundation — Founder &amp; Lead Developer</h3>
          <p class="job-meta">Jun 2024 – present · worldwide</p>
          <ul>
            <li>Created Zant, a Zig-based open-source inference engine for ONNX neural networks on microcontrollers.</li>
            <li>375+ GitHub stars, 48 forks, 30+ contributors. Adopted by 15 PoliMi master's students; 5 continued post-graduation.</li>
            <li>Referenced in 2 academic papers on Edge AI performance (INT8 quantization, memory-latency tradeoffs).</li>
            <li>Speaker at LinuxDay and ZigDays. Lead Coordinator of TinyHack (50+ participants).</li>
          </ul>
        </article>
        <article class="job">
          <h3 class="job-title">AIRLAB — FRE Competition Robotic Engineer</h3>
          <p class="job-meta">Sep 2024 – Jun 2025 · Milan</p>
          <ul>
            <li>Led 4-person team building an autonomous agricultural robot for the FRE competition.</li>
            <li>SLAM (gmapping) + ROS 2 Nav 2 + sensor fusion (LiDAR + depth camera) on NVIDIA Jetson Orin with CUDA, 58 fps.</li>
            <li>Tuned DWB controller and BT recovery behaviors; achieved 94% row-following accuracy at 15 km/h.</li>
          </ul>
        </article>
        <article class="job">
          <h3 class="job-title">Bitpolimi — Associate Member &amp; Event Organizer</h3>
          <p class="job-meta">Polytechnic University of Milan</p>
          <ul>
            <li>Cofounded a student organization focused on Bitcoin open-source development and education.</li>
            <li>Organized technical events and a university course on Bitcoin technology with international speakers.</li>
          </ul>
        </article>
      </div>
    </div>

    <div class="cat-block">
      <p class="prompt"><span class="user">mirko@cv</span>:<span class="path">~</span>$ cat education.txt</p>
      <div class="output">
        <article class="degree">
          <h3>Polytechnic University of Milan — MSc Computer Science &amp; Engineering</h3>
          <p class="job-meta">Mar 2024 – Dec 2025 · Milan</p>
          <p>Specialization in Artificial Intelligence, Robotics, and Computing Architectures.</p>
        </article>
        <article class="degree">
          <h3>Malmö University — Erasmus</h3>
          <p class="job-meta">Jan 2025 – Jun 2025 · Malmö</p>
          <p>In-depth study of Edge AI and IoT. Opened communication channels between Zant Foundation and Arduino S.r.l.</p>
        </article>
        <article class="degree">
          <h3>Polytechnic University of Milan — BSc Computer Science &amp; Engineering</h3>
          <p class="job-meta">Sep 2020 – Mar 2024 · Milan</p>
        </article>
      </div>
    </div>

    <div class="cat-block">
      <p class="prompt"><span class="user">mirko@cv</span>:<span class="path">~</span>$ cat skills.txt</p>
      <div class="output">
        <dl class="skills">
          <dt>Languages</dt>
          <dd>C, C++, Zig, Python, Dart, Java, VHDL, Swift</dd>
          <dt>Embedded &amp; Edge AI</dt>
          <dd>ARM Cortex-M, STM32, FreeRTOS, JTAG/SWD, TFLM, model quantization (post-training), inference on constrained hardware</dd>
          <dt>Machine Learning &amp; AI</dt>
          <dd>PyTorch, TensorFlow, ONNX, prompt engineering, LangChain, LLM tooling (Claude CLI)</dd>
          <dt>Robotics &amp; CV</dt>
          <dd>ROS, ROS 2, OpenCV, SLAM (gmapping), Nav2, LiDAR (Velodyne, RPLiDAR), depth cameras, sensor fusion, Gazebo</dd>
          <dt>Infrastructure</dt>
          <dd>Docker, CI/CD, PostgreSQL, GCP, Git, pytest</dd>
          <dt>OS</dt>
          <dd>Linux (Ubuntu), FreeRTOS, Windows</dd>
        </dl>
      </div>
    </div>

    <div class="cat-block">
      <p class="prompt"><span class="user">mirko@cv</span>:<span class="path">~</span>$ cat publications.txt</p>
      <div class="output">
        <p>Calvi, M. — <em>Zant: lightweight neural network inference engine for microcontrollers</em>. Master's Thesis, Politecnico di Milano. <a href="https://www.politesi.polimi.it/handle/10589/247070" target="_blank" rel="noopener noreferrer">politesi.polimi.it ↗</a></p>
      </div>
    </div>

    <div class="cat-block">
      <p class="prompt"><span class="user">mirko@cv</span>:<span class="path">~</span>$ cat contact.txt</p>
      <div class="output">
        <ul class="contact">
          <li>email: <a href="mailto:mirkocalvi.job@gmail.com">mirkocalvi.job@gmail.com</a></li>
          <li>location: Milan (IT)</li>
          <li>github: <a href="https://github.com/MirkoCalvi" target="_blank" rel="noopener noreferrer">github.com/MirkoCalvi ↗</a></li>
          <li>linkedin: <a href="https://www.linkedin.com/in/mirko-calvi/" target="_blank" rel="noopener noreferrer">linkedin.com/in/mirko-calvi ↗</a></li>
        </ul>
      </div>
    </div>

    <div class="cat-block nav-block">
      <p class="prompt"><span class="user">mirko@cv</span>:<span class="path">~</span>$ ls</p>
      <div class="output nav">
        <a href="#projects" class="nav-link">[ projects ]</a>
        <a href="#about" class="nav-link">[ about-me ]</a>
        <a href="https://github.com/MirkoCalvi" target="_blank" rel="noopener noreferrer" class="nav-link">[ github ↗ ]</a>
        <a href="mailto:mirkocalvi.job@gmail.com" class="nav-link">[ email ↗ ]</a>
      </div>
    </div>

    <p class="prompt prompt-tail"><span class="user">mirko@cv</span>:<span class="path">~</span>$ <span class="cursor">▍</span></p>
```

- [ ] **Step 2: Verify the file still parses (sanity check)**

```bash
grep -c '<div class="cat-block"' index.html
```

Expected: `8` (eight cat-blocks).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Fill home section with CV-as-terminal content"
```

---

## Task 9: Fill `#about` section with placeholder content

**Files:**
- Modify: `index.html`

About Me content is placeholder until Mirko provides the bio. The structure stays so styling/layout work end-to-end.

- [ ] **Step 1: Replace the about section content**

In `index.html`, replace the line `<!-- About content goes here in Task 9 -->` with:

```html
    <header class="banner">
      <h1 class="name">about-me.md</h1>
    </header>

    <div class="cat-block">
      <p class="prompt"><span class="user">mirko@cv</span>:<span class="path">~</span>$ cat about-me.md</p>
      <div class="output">
        <p><em>Bio placeholder — fill me in.</em></p>
        <p>This page is for the human side: who I am beyond the CV. Interests, hobbies, what I care about, things I'm learning, why I do what I do.</p>
      </div>
    </div>

    <div class="cat-block">
      <p class="prompt"><span class="user">mirko@cv</span>:<span class="path">~</span>$ cat interests.txt</p>
      <div class="output">
        <p><em>Interests placeholder — fill me in.</em></p>
      </div>
    </div>

    <div class="cat-block nav-block">
      <p class="prompt"><span class="user">mirko@cv</span>:<span class="path">~</span>$ cd ..</p>
      <div class="output nav">
        <a href="#home" class="nav-link">[ ← back ]</a>
      </div>
    </div>

    <p class="prompt prompt-tail"><span class="user">mirko@cv</span>:<span class="path">~/about</span>$ <span class="cursor">▍</span></p>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "Add about-me section placeholder"
```

---

## Task 10: Add `#projects` section scaffolding

**Files:**
- Modify: `index.html`

The list itself is rendered by `main.mjs` from `data/projects.json`. The scaffolding wraps it with prompt/back-nav.

- [ ] **Step 1: Replace the projects section content**

In `index.html`, replace the line `<!-- Projects scaffolding goes here in Task 10 -->` with:

```html
    <header class="banner">
      <h1 class="name">projects/</h1>
    </header>

    <div class="cat-block">
      <p class="prompt"><span class="user">mirko@cv</span>:<span class="path">~/projects</span>$ ls</p>
      <div id="project-list" class="output project-list" aria-live="polite">
        <p class="loading">loading projects…</p>
      </div>
    </div>

    <div class="cat-block nav-block">
      <p class="prompt"><span class="user">mirko@cv</span>:<span class="path">~/projects</span>$ cd ..</p>
      <div class="output nav">
        <a href="#home" class="nav-link">[ ← back ]</a>
      </div>
    </div>

    <p class="prompt prompt-tail"><span class="user">mirko@cv</span>:<span class="path">~/projects</span>$ <span class="cursor">▍</span></p>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "Add projects section scaffolding"
```

---

## Task 11: Create `styles.css` (GitHub Dark theme + layout)

**Files:**
- Create: `styles.css`

CSS custom properties for the palette, monospace typography, centered column, cat-block / project / nav styles, blinking cursor, and a mobile breakpoint.

- [ ] **Step 1: Write the file**

Create `styles.css`:

```css
:root {
  --bg: #0d1117;
  --fg: #c9d1d9;
  --muted: #8b949e;
  --prompt: #7ee787;
  --link: #79c0ff;
  --accent: #ffa657;
  --tag-bg: #161b22;
  --tag-border: #30363d;
  --maxw: 860px;
}

*, *::before, *::after { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
  color: var(--fg);
  font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
  font-size: 15px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

main.terminal {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 48px 24px 96px;
}

.screen[hidden] { display: none; }

.banner {
  margin-bottom: 32px;
  border-bottom: 1px solid var(--tag-border);
  padding-bottom: 16px;
}
.banner .name {
  font-size: 28px;
  margin: 0 0 4px;
  font-weight: 600;
}
.banner .tagline {
  margin: 0;
  color: var(--muted);
}

.cat-block {
  margin: 24px 0;
}

.prompt {
  margin: 0 0 6px;
  color: var(--fg);
  white-space: pre-wrap;
  word-break: break-word;
}
.prompt .user { color: var(--prompt); }
.prompt .path { color: var(--link); }

.prompt-tail {
  margin-top: 32px;
  color: var(--muted);
}

.cursor {
  display: inline-block;
  width: 0.55em;
  background: var(--fg);
  color: var(--bg);
  animation: blink 1.05s steps(2) infinite;
  vertical-align: -1px;
}
@keyframes blink { 50% { opacity: 0; } }

.output {
  padding-left: 16px;
  border-left: 1px solid var(--tag-border);
}
.output > * { margin: 0 0 8px; }
.output > *:last-child { margin-bottom: 0; }

a { color: var(--link); text-decoration: none; }
a:hover { text-decoration: underline; }

.job, .degree { margin: 0 0 16px; }
.job-title, .degree h3 { font-size: 15px; margin: 0 0 4px; }
.job-meta { color: var(--muted); margin: 0 0 6px; font-size: 13px; }
.job ul { padding-left: 18px; margin: 4px 0 0; }
.job li { margin-bottom: 4px; }

.skills { display: grid; grid-template-columns: max-content 1fr; gap: 4px 16px; margin: 0; }
.skills dt { color: var(--accent); }
.skills dd { margin: 0; }

.contact { list-style: none; padding: 0; margin: 0; }
.contact li { margin-bottom: 4px; }

.nav { display: flex; flex-wrap: wrap; gap: 12px; }
.nav-link { color: var(--link); }
.nav-link:hover { color: var(--accent); text-decoration: none; }

.project-list .project { margin-bottom: 18px; }
.project-name { color: var(--accent); margin: 0 0 4px; font-size: 15px; font-weight: 600; }
.project-desc { margin: 0 0 6px; }
.project-meta { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; }
.project-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tag {
  display: inline-block;
  padding: 1px 8px;
  font-size: 12px;
  color: var(--muted);
  background: var(--tag-bg);
  border: 1px solid var(--tag-border);
  border-radius: 9999px;
}
.project-link { white-space: nowrap; }

.empty, .loading, .error { color: var(--muted); font-style: italic; }
.error { color: var(--accent); font-style: normal; }

@media (max-width: 600px) {
  body { font-size: 14px; }
  main.terminal { padding: 24px 16px 64px; }
  .banner .name { font-size: 22px; }
  .skills { grid-template-columns: 1fr; gap: 0 0; }
  .skills dt { margin-top: 8px; }
}
```

- [ ] **Step 2: Verify file exists**

```bash
test -f styles.css && wc -l styles.css
```

Expected: line count > 100.

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "Add styles.css with GitHub Dark palette and layout"
```

---

## Task 12: Create `main.mjs` (DOM glue)

**Files:**
- Create: `main.mjs`

Wires up: hash-driven section visibility, lazy-loaded projects render on first projects view, and an error path if `projects.json` fails to fetch.

- [ ] **Step 1: Write the file**

Create `main.mjs`:

```javascript
import { pickSection, renderProjectsHtml } from './lib.mjs';

const SECTIONS = ['home', 'projects', 'about'];
let projectsLoaded = false;

function showSection(id) {
  for (const s of SECTIONS) {
    const el = document.getElementById(s);
    if (!el) continue;
    el.hidden = (s !== id);
  }
  if (id === 'projects' && !projectsLoaded) {
    loadProjects();
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

async function loadProjects() {
  const target = document.getElementById('project-list');
  if (!target) return;
  try {
    const res = await fetch('./data/projects.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    target.innerHTML = renderProjectsHtml(data);
    projectsLoaded = true;
  } catch (err) {
    target.innerHTML = '<p class="error">error: failed to load projects.json (' +
      (err && err.message ? err.message : 'unknown') + ')</p>';
  }
}

function onHashChange() {
  showSection(pickSection(window.location.hash));
}

window.addEventListener('hashchange', onHashChange);
document.addEventListener('DOMContentLoaded', onHashChange);

// If DOM already parsed (script at end of body), kick once.
if (document.readyState !== 'loading') onHashChange();
```

- [ ] **Step 2: Verify file exists**

```bash
test -f main.mjs && echo "ok"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add main.mjs
git commit -m "Add main.mjs: hash router and projects loader"
```

---

## Task 13: Manual end-to-end browser verification

No code changes — this task is a verification gate before deployment.

- [ ] **Step 1: Start a local server**

In one terminal, from the repo root:

```bash
python3 -m http.server 8080
```

Expected: server logs `Serving HTTP on 0.0.0.0 port 8080`.

- [ ] **Step 2: Open and walk through the site**

In a browser, open `http://localhost:8080/` and verify each item:

- [ ] Page loads with no console errors (open devtools → Console).
- [ ] **Home is visible by default**: name banner, then 8 `cat`-style blocks (whoami, about, experience, education, skills, publications, contact, ls), then a blinking cursor at the bottom.
- [ ] Cursor at bottom of section is blinking.
- [ ] All four CV experience entries render (Zant s.r.l., Zant Foundation, AIRLAB, Bitpolimi).
- [ ] All three education entries render (PoliMi MSc, Malmö, PoliMi BSc).
- [ ] **Click `[ projects ]`**: URL becomes `…/#projects`, Home hides, Projects shows. After ~100ms (fetch round-trip) the project list renders with Z-Ant, Mathpilot, CrowDJ, My Shelfie.
- [ ] Each project shows: name with `>` prefix, description, tag chips, and a link labelled `github ↗` (Z-Ant, CrowDJ, Shelfie) or `visit ↗` (Mathpilot).
- [ ] Z-Ant link points to `https://github.com/ZantFoundation/Z-Ant` and opens in a new tab.
- [ ] **Click `[ ← back ]`**: returns to Home.
- [ ] **Click `[ about-me ]`**: URL becomes `…/#about`, About visible.
- [ ] **Direct deep link**: open `http://localhost:8080/#projects` in a new tab → Projects section is shown immediately.
- [ ] **Browser back button** from `#projects` to `#home` works (Home becomes visible).
- [ ] **Mobile layout**: open devtools → toggle device toolbar → set width to ~375px → page is readable, font-size scales down, no horizontal scroll, skill list stacks single-column.
- [ ] **Console**: no errors throughout.

- [ ] **Step 3: Stop the server**

`Ctrl+C` in the server terminal.

- [ ] **Step 4: If anything failed**, fix it inline (don't continue) and re-run Step 2. Each fix gets its own focused commit.

- [ ] **Step 5: Once everything passes, no commit needed for this task** — verification only. Move to Task 14.

---

## Task 14: Update README.md

**Files:**
- Modify: `README.md`

Replace the placeholder `# MIRKO_TUI` with a real description, run-locally snippet, and project structure.

- [ ] **Step 1: Replace README contents**

Overwrite `README.md`:

```markdown
# MIRKO_TUI

Personal portfolio for Mirko Calvi, styled as a developer's terminal. Static, single-page, no build step.

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
lib.mjs          pure helpers (rendered, hash mapper, escape)
data/projects.json  curated project list
tests/lib.test.mjs  unit tests for lib.mjs
docs/superpowers/   design spec and implementation plan
```
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "Rewrite README with run-locally + edit guide"
```

---

## Task 15: Deploy to GitHub Pages

No code changes in this task — it's repo configuration on GitHub. The plan documents the steps so the engineer can perform them without guessing.

- [ ] **Step 1: Push the branch**

```bash
git push origin main
```

Expected: GitHub accepts the push.

- [ ] **Step 2: Enable GitHub Pages (browser, manual)**

1. Open <https://github.com/MirkoCalvi/MIRKO_TUI/settings/pages>.
2. Under **Build and deployment** → **Source**, choose **Deploy from a branch**.
3. Under **Branch**, choose `main`, folder `/ (root)`. Click **Save**.
4. Wait 1–2 minutes for the first deploy. The page will show a green banner with the live URL once ready.

- [ ] **Step 3: Verify the live site**

Open `https://mirkocalvi.github.io/MIRKO_TUI/` and re-run the manual checklist from Task 13 against the live URL (just the Home → Projects → About click-through and console-clean check; mobile re-check optional).

- [ ] **Step 4: If anything broke**, common causes and fixes:

| Symptom | Likely cause | Fix |
|---|---|---|
| Blank page, console says `Failed to load module script: text/html` | `.mjs` MIME issue (rare on GH Pages) | Add a `_headers` file with `*.mjs: Content-Type: text/javascript` (Cloudflare Pages) — not normally needed for GH Pages. |
| Projects show "error: failed to load projects.json" | path case mismatch | Verify `data/projects.json` exists with that exact case in the repo. |
| Font missing (system mono visible) | Google Fonts blocked by user / network | Acceptable — fallback `Menlo`/`Consolas` is intentional. |
| CSS not applied | hard-cached old version | Hard refresh (Cmd/Ctrl-Shift-R). |

No commit unless something needs fixing.

---

## Done criteria

- [ ] All 25 unit tests pass (`node --test tests/lib.test.mjs`).
- [ ] Local server walkthrough (Task 13) passes every checkbox.
- [ ] Live site at `mirkocalvi.github.io/MIRKO_TUI/` matches local behavior.
- [ ] No browser console errors on any of the three sections.
- [ ] `README.md` reflects current state.
- [ ] `data/projects.json` contains the four projects (CrowDJ + Shelfie still placeholders — Mirko fills these in as a follow-up edit, no plan needed).

## Out of scope (deliberately not in this plan)

- Filling in the About Me bio prose (Mirko writes it directly into `index.html` whenever).
- Real CrowDJ / My Shelfie URLs and descriptions (Mirko edits `data/projects.json`).
- Custom domain (`CNAME` file + DNS) — covered in design spec but defer until Mirko decides on a domain.
- Self-hosted deployment on home machine — once `mirkocalvi.github.io/MIRKO_TUI/` is live, no design changes are needed; clone repo, run any HTTP server in the directory.
