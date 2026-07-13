import Fuse from 'fuse.js';

export interface FaqEntry { id: string; question: string; answer: string; category: string; keywords: string[] }

export function buildIndex(faqs: any[], lang: 'en' | 'fr'): FaqEntry[] {
  return faqs.map((f) => ({
    id: f.data.id,
    question: f.data.question[lang],
    answer: f.data.answer[lang],
    category: f.data.category,
    keywords: f.data.keywords[lang] ?? [],
  }));
}

export function search(index: FaqEntry[], query: string): string[] {
  const q = query.trim();
  if (!q) return index.map((e) => e.id);
  const fuse = new Fuse(index, {
    includeScore: true, threshold: 0.45, ignoreLocation: true,
    keys: [
      { name: 'question', weight: 3 },
      { name: 'keywords', weight: 2 },
      { name: 'answer', weight: 1 },
    ],
  });
  return fuse.search(q).map((r) => r.item.id);
}
