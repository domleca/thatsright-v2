export type Lang = 'en' | 'fr';

export function t(field: { en: string; fr: string }, lang: Lang): string {
  return field[lang];
}

export function guidePath(lang: Lang, rest: string): string {
  const base = lang === 'fr' ? '/fr/guide' : '/guide';
  return rest ? `${base}/${rest}` : base;
}

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'fr' : 'en';
}
