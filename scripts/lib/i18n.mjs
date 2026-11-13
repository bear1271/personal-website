// Bilingual content helpers.
//
// Content files mark translatable text as a leaf object: { "en": "…", "zh": "…" }.
// Plain strings are language-neutral (names, course codes, URLs) and shown as-is.
// UI strings live in content/ui.json, are addressed by dotted keys, and must exist in
// every language: a missing key or translation fails the build instead of leaking through.
import { inline } from "./html.mjs";

export const LANGS = ["en", "zh"];
export const HTML_LANG = { en: "en", zh: "zh-CN" };

const isObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/** A translatable leaf is an object whose keys are all language codes. */
export const isLeaf = (v) => isObject(v) && Object.keys(v).length > 0 && Object.keys(v).every((k) => LANGS.includes(k));

export const createReport = () => ({ untranslated: new Set() });

/**
 * Resolve every translatable leaf in `value` to `lang`. A missing non-English text falls
 * back to English and is recorded in `report`, so gaps are visible but never break a page.
 */
export function resolve(value, lang, report) {
  if (isLeaf(value)) {
    const text = value[lang];
    if (text !== undefined && text !== null && text !== "") return text;
    if (lang !== "en" && value.en !== undefined && value.en !== null) {
      report?.untranslated.add(String(value.en));
      return value.en;
    }
    return undefined;
  }
  if (Array.isArray(value)) return value.map((item) => resolve(item, lang, report));
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, lang, report)]));
  return value;
}

/** UI strings for one language: text(key, vars), rich(key, vars) -> inline-Markdown HTML. */
export function createTranslator(ui, lang) {
  const fill = (key, vars = {}) => {
    const node = key.split(".").reduce((n, part) => (isObject(n) ? n[part] : undefined), ui);
    if (!isLeaf(node)) throw new Error(`Missing UI string "${key}" in content/ui.json`);
    const text = node[lang];
    if (text === undefined || text === null || text === "") throw new Error(`UI string "${key}" has no "${lang}" text`);
    return text.replace(/\{(\w+)\}/g, (_, name) => {
      if (!(name in vars)) throw new Error(`UI string "${key}" needs a value for {${name}}`);
      return vars[name];
    });
  };
  return { text: fill, rich: (key, vars) => inline(fill(key, vars)) };
}

/** Site route in the given language: "/research/" -> "/zh/research/", "/" -> "/zh/". */
export const localize = (route, lang) => (lang === "zh" ? (route === "/" ? "/zh/" : `/zh${route}`) : route);

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SEASONS = { Spring: "春季", Summer: "夏季", Fall: "秋季", Winter: "冬季" };

export function formatDate(iso, lang, month = "long") {
  if (lang === "zh") {
    const [y, m, d] = iso.split("-").map(Number);
    return `${y} 年 ${m} 月 ${d} 日`;
  }
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month, year: "numeric", timeZone: "UTC" }).format(new Date(iso));
}

/** "Fall 2026" -> "2026 年秋季", "June 2026 – present" -> "2026 年 6 月 – 至今". English is unchanged. */
export function localizeDates(text, lang) {
  if (lang !== "zh" || typeof text !== "string") return text;
  return text
    .replace(/\b(Spring|Summer|Fall|Winter) (\d{4})\b/g, (_, season, year) => `${year} 年${SEASONS[season]}`)
    .replace(new RegExp(`\\b(${MONTHS.join("|")}) (\\d{4})\\b`, "g"), (_, month, year) => `${year} 年 ${MONTHS.indexOf(month) + 1} 月`)
    .replace(/\bpresent\b/g, "至今");
}
