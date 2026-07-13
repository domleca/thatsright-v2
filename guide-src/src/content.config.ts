import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const bilingual = z.object({ en: z.string().min(1), fr: z.string().min(1) });

const CATEGORIES = ['installing', 'interview', 'family-group', 'daily-use', 'privacy'] as const;

// One chat bubble in an illustrated phone.
const bubble = z.object({
  from: z.enum(['them', 'you']),
  text: bilingual,
  who: bilingual.optional(),
});

// Discriminated union: each step's illustration is exactly one kind.
const illustration = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('voice'), caption: bilingual, speaking: bilingual }),
  z.object({ kind: z.literal('chat'), caption: bilingual, bubbles: z.array(bubble).min(1),
             app: z.enum(['thatsright', 'telegram']).default('telegram') }),
  z.object({ kind: z.literal('permission'), caption: bilingual, title: bilingual, body: bilingual,
             allowLabel: bilingual, denyLabel: bilingual }),
  z.object({ kind: z.literal('qr'), caption: bilingual, label: bilingual, sub: bilingual }),
  z.object({ kind: z.literal('two-phone'), left: z.any(), right: z.any() }), // validated in Task 4 refinement
]);

const steps = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/steps' }),
  schema: z.object({
    order: z.number().int().positive(),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: bilingual,
    actions: z.array(bilingual).min(1),
    youShouldSee: bilingual,
    snag: z.object({ text: bilingual, faqRef: reference('faqs') }).optional(),
    illustration,
  }),
});

const faqs = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/faqs' }),
  schema: z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    question: bilingual,
    answer: bilingual,
    category: z.enum(CATEGORIES),
    keywords: z.object({ en: z.array(z.string()), fr: z.array(z.string()) }),
  }),
});

export const collections = { steps, faqs };
