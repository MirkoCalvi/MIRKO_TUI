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
  projectsLoaded = true; // mark early so a quick re-entry doesn't kick off a second fetch
  try {
    const res = await fetch('./data/projects.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    target.innerHTML = renderProjectsHtml(data);
  } catch (err) {
    target.innerHTML = '<p class="error">error: failed to load projects.json (' +
      (err && err.message ? err.message : 'unknown') + ')</p>';
    projectsLoaded = false; // allow retry on next visit
  }
}

function onHashChange() {
  showSection(pickSection(window.location.hash));
}

window.addEventListener('hashchange', onHashChange);
document.addEventListener('DOMContentLoaded', onHashChange);

// If DOM already parsed (script at end of body), kick once.
if (document.readyState !== 'loading') onHashChange();
