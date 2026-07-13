import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';

// The schema's real enforcement happens at `astro build`. These tests prove
// (a) valid content builds, (b) a missing FR field fails, (c) a dangling
// faqRef fails. We build in a throwaway way by adding/removing a bad file.
function build() {
  return execSync('npm run build', { cwd: new URL('..', import.meta.url).pathname, stdio: 'pipe' });
}

describe('content schema', () => {
  it('builds with valid content', () => {
    expect(() => build()).not.toThrow();
  });

  it('fails when a step is missing its French title', () => {
    const bad = new URL('../src/content/steps/zz-bad.json', import.meta.url).pathname;
    writeFileSync(bad, JSON.stringify({
      order: 99, slug: 'bad', title: { en: 'x' }, actions: [{ en: 'a', fr: 'a' }],
      youShouldSee: { en: 'y', fr: 'y' },
      illustration: { kind: 'voice', caption: { en: 'c', fr: 'c' }, speaking: { en: 's', fr: 's' } },
    }));
    try {
      expect(() => build()).toThrow();
    } finally {
      rmSync(bad, { force: true });
    }
  });

  it('fails when a snag points at a nonexistent FAQ', () => {
    const bad = new URL('../src/content/steps/zz-dangling.json', import.meta.url).pathname;
    writeFileSync(bad, JSON.stringify({
      order: 98, slug: 'dangling', title: { en: 'x', fr: 'x' }, actions: [{ en: 'a', fr: 'a' }],
      youShouldSee: { en: 'y', fr: 'y' },
      snag: { text: { en: 's', fr: 's' }, faqRef: 'does-not-exist' },
      illustration: { kind: 'voice', caption: { en: 'c', fr: 'c' }, speaking: { en: 's', fr: 's' } },
    }));
    try {
      expect(() => build()).toThrow();
    } finally {
      rmSync(bad, { force: true });
    }
  });
});
