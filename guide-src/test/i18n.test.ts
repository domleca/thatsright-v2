import { describe, it, expect } from 'vitest';
import { t, guidePath, otherLang } from '../src/lib/i18n';

describe('i18n', () => {
  it('picks the right language field', () => {
    expect(t({ en: 'Hi', fr: 'Salut' }, 'fr')).toBe('Salut');
  });
  it('builds EN guide paths without a lang prefix', () => {
    expect(guidePath('en', '')).toBe('/guide');
    expect(guidePath('en', 'faq')).toBe('/guide/faq');
  });
  it('builds FR guide paths under /fr', () => {
    expect(guidePath('fr', '')).toBe('/fr/guide');
    expect(guidePath('fr', 'install')).toBe('/fr/guide/install');
  });
  it('toggles language', () => {
    expect(otherLang('en')).toBe('fr');
    expect(otherLang('fr')).toBe('en');
  });
});
