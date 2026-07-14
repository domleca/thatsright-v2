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

// The single-phone illustration kinds (used directly and as two-phone children).
const singlePhone = z.discriminatedUnion('kind', [
  // voice: resting orb + a spoken caption. `dark`+`live` render the patient's
  // dark listening screen with the pulsing terracotta ring (hand-over step).
  z.object({ kind: z.literal('voice'), caption: bilingual, speaking: bilingual,
             dark: z.boolean().optional(), live: z.boolean().optional() }),
  z.object({ kind: z.literal('chat'), caption: bilingual, bubbles: z.array(bubble).min(1),
             app: z.enum(['thatsright', 'telegram']).default('telegram') }),
  z.object({ kind: z.literal('permission'), caption: bilingual, title: bilingual, body: bilingual,
             allowLabel: bilingual, denyLabel: bilingual }),
  z.object({ kind: z.literal('qr'), caption: bilingual, label: bilingual, sub: bilingual }),
  // homescreen: iOS home grid with the app icon in slot 1 (install step).
  z.object({ kind: z.literal('homescreen'), caption: bilingual }),
  // welcome: orb + title + Sign-in-with-Apple button (welcome step).
  z.object({ kind: z.literal('welcome'), caption: bilingual, title: bilingual, signIn: bilingual }),
  // question: progress pill + question bubble + small orb (interview step).
  z.object({ kind: z.literal('question'), caption: bilingual, progress: z.string(),
             q: bilingual, who: bilingual }),
]);

// Discriminated union: each step's illustration is exactly one kind.
const illustration = z.union([
  singlePhone,
  z.object({ kind: z.literal('two-phone'), left: singlePhone, right: singlePhone }),
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
