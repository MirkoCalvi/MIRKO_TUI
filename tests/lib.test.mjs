import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickSection } from '../lib.mjs';
import { linkLabel } from '../lib.mjs';

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
