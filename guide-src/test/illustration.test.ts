import { describe, it, expect } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Illustration from '../src/components/Illustration.astro';

const render = async (props: any) =>
  (await AstroContainer.create()).renderToString(Illustration, { props });

describe('Illustration', () => {
  it('renders a voice phone with the speaking line', async () => {
    const html = await render({ lang: 'en',
      illustration: { kind: 'voice', caption: { en: 'Parent phone', fr: 'x' }, speaking: { en: 'Welcome', fr: 'x' } } });
    expect(html).toContain('Welcome');
    expect(html).toContain('Parent phone');
  });

  it('renders a permission popup with allow/deny labels', async () => {
    const html = await render({ lang: 'en',
      illustration: { kind: 'permission', caption: { en: 'c', fr: 'c' },
        title: { en: 'Access the microphone?', fr: 'x' }, body: { en: 'So your parent can talk.', fr: 'x' },
        allowLabel: { en: 'Allow', fr: 'Autoriser' }, denyLabel: { en: "Don't allow", fr: 'Refuser' } } });
    expect(html).toContain('Access the microphone?');
    expect(html).toContain('Allow');
  });

  it('renders two phones at equal height', async () => {
    const html = await render({ lang: 'en',
      illustration: { kind: 'two-phone',
        left: { kind: 'qr', caption: { en: "Parent's phone", fr: 'x' }, label: { en: 'Almost there', fr: 'x' }, sub: { en: 'Scan with your phone', fr: 'x' } },
        right: { kind: 'chat', caption: { en: 'Your phone', fr: 'x' }, bubbles: [{ from: 'them', text: { en: 'Create the group', fr: 'x' } }] } } });
    expect(html).toContain('visual pair');
    expect(html).toContain('Almost there');
    expect(html).toContain('Create the group');
  });
});
