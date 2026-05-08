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
