import { describe, it, expect } from 'vitest';
import { buildIndex, search } from '../src/lib/search';

const faqs = [
  { data: { id: 'mic', question: { en: 'Should I allow the microphone?', fr: 'x' },
    answer: { en: 'Yes, it is how your parent speaks to the app.', fr: 'x' },
    category: 'installing', keywords: { en: ['microphone', 'permission'], fr: [] } } },
  { data: { id: 'no-telegram', question: { en: "I don't have Telegram", fr: 'x' },
    answer: { en: 'You only need it on your own phone.', fr: 'x' },
    category: 'family-group', keywords: { en: ['telegram'], fr: [] } } },
] as any;

describe('faq search', () => {
  const idx = buildIndex(faqs, 'en');
  it('finds by exact keyword', () => {
    expect(search(idx, 'microphone')[0]).toBe('mic');
  });
  it('tolerates a typo', () => {
    expect(search(idx, 'microfone')).toContain('mic');
  });
  it('matches words in the answer body', () => {
    expect(search(idx, 'telegram')).toContain('no-telegram');
  });
  it('returns all ids for an empty query', () => {
    expect(search(idx, '').sort()).toEqual(['mic', 'no-telegram']);
  });
});
