const VALID_SECTIONS = new Set(['home', 'projects', 'about']);

export function pickSection(hash) {
  if (!hash) return 'home';
  const id = hash.replace(/^#/, '');
  return VALID_SECTIONS.has(id) ? id : 'home';
}

export function linkLabel(url) {
  if (typeof url === 'string' && /github\.(com|io)/.test(url)) {
    return 'github ↗';
  }
  return 'visit ↗';
}

export function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
