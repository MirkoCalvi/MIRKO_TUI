const VALID_SECTIONS = new Set(['home', 'projects', 'about']);

export function pickSection(hash) {
  if (!hash) return 'home';
  const id = hash.replace(/^#/, '');
  return VALID_SECTIONS.has(id) ? id : 'home';
}
