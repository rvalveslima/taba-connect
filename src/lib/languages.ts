export const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "pt", label: "Portuguese" },
  { code: "es", label: "Spanish" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "hi", label: "Hindi" },
  { code: "zh", label: "Mandarin" },
  { code: "ar", label: "Arabic" },
  { code: "ja", label: "Japanese" },
] as const;

export type LanguageCode = (typeof LANGUAGE_OPTIONS)[number]["code"];

export const LANGUAGE_ALIASES: Record<string, LanguageCode> = {
  en: "en", english: "en",
  fr: "fr", french: "fr", français: "fr", francais: "fr",
  pt: "pt", portuguese: "pt", português: "pt", portugues: "pt",
  es: "es", spanish: "es", español: "es", espanol: "es",
  de: "de", german: "de", deutsch: "de",
  it: "it", italian: "it", italiano: "it",
  hi: "hi", hindi: "hi", हिन्दी: "hi",
  zh: "zh", mandarin: "zh", chinese: "zh", 中文: "zh",
  ar: "ar", arabic: "ar", العربية: "ar",
  ja: "ja", japanese: "ja", 日本語: "ja",
};

export function normalizeLanguages(input: readonly (string | null | undefined)[] | null | undefined): LanguageCode[] {
  if (!input) return [];
  const out: LanguageCode[] = [];
  for (const raw of input) {
    if (!raw) continue;
    const code = LANGUAGE_ALIASES[raw.toString().trim().toLowerCase()];
    if (code && !out.includes(code)) out.push(code);
  }
  return out;
}

export function languageLabel(code: string): string {
  const found = LANGUAGE_OPTIONS.find((l) => l.code === code.toLowerCase());
  if (found) return found.label;
  const alias = LANGUAGE_ALIASES[code.toLowerCase()];
  if (alias) return LANGUAGE_OPTIONS.find((l) => l.code === alias)!.label;
  return code.toUpperCase();
}
