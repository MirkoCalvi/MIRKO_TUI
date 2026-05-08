import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickSection, linkLabel, escapeHtml, renderProjectsHtml } from '../lib.mjs';

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
  assert.match(html, /X/);
});

test('renderProjectsHtml: blocks javascript: URL scheme (XSS guard)', () => {
  const html = renderProjectsHtml([{
    name: 'X',
    description: '.',
    url: 'javascript:alert(1)',
    tags: []
  }]);
  assert.doesNotMatch(html, /href="javascript:/);
});

test('renderProjectsHtml: blocks data: URL scheme', () => {
  const html = renderProjectsHtml([{
    name: 'X',
    description: '.',
    url: 'data:text/html,<script>alert(1)</script>',
    tags: []
  }]);
  assert.doesNotMatch(html, /href="data:/);
});

test('renderProjectsHtml: allows http: URLs', () => {
  const html = renderProjectsHtml([{
    name: 'X', description: '.', url: 'http://example.com', tags: []
  }]);
  assert.match(html, /href="http:\/\/example\.com"/);
});

test('renderProjectsHtml: allows https: URLs', () => {
  const html = renderProjectsHtml([{
    name: 'X', description: '.', url: 'https://github.com/a/b', tags: []
  }]);
  assert.match(html, /href="https:\/\/github\.com\/a\/b"/);
});

test('renderProjectsHtml: allows mailto: URLs', () => {
  const html = renderProjectsHtml([{
    name: 'X', description: '.', url: 'mailto:foo@bar.com', tags: []
  }]);
  assert.match(html, /href="mailto:foo@bar\.com"/);
});

test('renderProjectsHtml: missing name renders without crash', () => {
  const html = renderProjectsHtml([{ description: '.', url: 'https://github.com/a/b', tags: [] }]);
  assert.match(html, /class="project"/);
});

test('renderProjectsHtml: missing url falls back to # and visit label', () => {
  const html = renderProjectsHtml([{ name: 'X', description: '.', tags: [] }]);
  assert.match(html, /href="#"/);
  assert.match(html, /visit ↗/);
});

test('renderProjectsHtml: missing description renders without crash', () => {
  const html = renderProjectsHtml([{ name: 'X', url: 'https://github.com/a/b', tags: [] }]);
  assert.match(html, /X/);
});

test('renderProjectsHtml: escapes HTML in name (XSS guard)', () => {
  const html = renderProjectsHtml([{
    name: '<img src=x onerror=alert(1)>',
    description: '.',
    url: 'https://github.com/a/b',
    tags: []
  }]);
  assert.doesNotMatch(html, /<img src=x onerror=/);
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

test('renderProjectsHtml: escapes HTML in tags (XSS guard)', () => {
  const html = renderProjectsHtml([{
    name: 'X', description: '.', url: 'https://github.com/a/b',
    tags: ['<script>alert(1)</script>']
  }]);
  assert.doesNotMatch(html, /<script>alert\(1\)/);
  assert.match(html, /&lt;script&gt;/);
});
