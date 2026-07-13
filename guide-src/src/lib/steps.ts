export interface StepLike {
  data: { order: number; slug: string; title: { en: string; fr: string } };
}

export function sorted(steps: StepLike[]): StepLike[] {
  return [...steps].sort((a, b) => a.data.order - b.data.order);
}

export function neighbors(steps: StepLike[], slug: string) {
  const s = sorted(steps);
  const i = s.findIndex((x) => x.data.slug === slug);
  return {
    prev: i > 0 ? s[i - 1].data : undefined,
    next: i < s.length - 1 ? s[i + 1].data : undefined,
  };
}
