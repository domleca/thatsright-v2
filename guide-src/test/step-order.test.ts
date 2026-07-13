import { describe, it, expect } from 'vitest';
import { neighbors } from '../src/lib/steps';

describe('step neighbors', () => {
  const steps = [
    { data: { order: 2, slug: 'welcome', title: { en: 'W', fr: 'W' } } },
    { data: { order: 1, slug: 'install', title: { en: 'I', fr: 'I' } } },
    { data: { order: 3, slug: 'interview', title: { en: 'T', fr: 'T' } } },
  ] as any;
  it('sorts by order and finds prev/next', () => {
    const { prev, next } = neighbors(steps, 'welcome');
    expect(prev.slug).toBe('install');
    expect(next.slug).toBe('interview');
  });
  it('has no prev on the first step', () => {
    expect(neighbors(steps, 'install').prev).toBeUndefined();
  });
  it('has no next on the last step', () => {
    expect(neighbors(steps, 'interview').next).toBeUndefined();
  });
});
