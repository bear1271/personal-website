// Loads every content file once and hands page modules a per-language "view".
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { HTML_LANG, createReport, createTranslator, formatDate, localize, localizeDates, resolve } from "./i18n.mjs";

const readJson = async (...parts) => JSON.parse(await readFile(path.join(...parts), "utf8"));

export async function loadContext(root, env = process.env) {
  const content = (name) => readJson(root, "content", name);
  const [site, ui, profile, agents, licensing, notes, categories, driveLinks] = await Promise.all([
    content("site.json"),
    content("ui.json"),
    content("profile.json"),
    content("pages/for-agents.json"),
    content("licensing.json"),
    content("public-note-editions.json"),
    content("notes-categories.json"),
    content("drive-links.json"),
  ]);
  const poeticsDir = path.join(root, "content/poetics");
  const poetics = await Promise.all(
    (await readdir(poeticsDir))
      .filter((file) => file.endsWith(".json"))
      .sort()
      .map((file) => readJson(poeticsDir, file)),
  );

  const origin = (env.SITE_ORIGIN || site.origin).replace(/\/$/, "");
  const basePath = (env.SITE_BASE ?? site.basePath).replace(/\/$/, "");
  const ctx = {
    root,
    site,
    ui,
    profile,
    agents,
    licensing,
    notes,
    categories,
    driveLinks, // optional Google Drive copies of site-hosted notes, keyed by note id
    poetics,
    origin,
    basePath,
    updated: profile.updated,
    report: createReport(),
    url: (route) => `${origin}${basePath}${route}`,
  };
  const views = new Map();
  ctx.view = (lang) => {
    if (!views.has(lang)) views.set(lang, createView(ctx, lang));
    return views.get(lang);
  };
  return ctx;
}

/** Everything a template needs for one language, so templates never branch on copy. */
function createView(ctx, lang) {
  const zh = lang === "zh";
  const translator = createTranslator(ctx.ui, lang);
  const tr = (value) => resolve(value, lang, ctx.report);
  return {
    ctx,
    lang,
    zh,
    other: zh ? "en" : "zh",
    htmlLang: HTML_LANG[lang],
    p: tr(ctx.profile), // profile with every {en, zh} leaf resolved to this language
    tr,
    t: translator.text, // plain-text UI string
    rich: translator.rich, // UI string with inline Markdown rendered to HTML
    r: (route) => localize(route, lang), // link to a page in the same language
    url: ctx.url,
    date: (iso, month) => formatDate(iso, lang, month),
    term: (text) => localizeDates(text, lang),
    // Punctuation conventions, so templates join clauses without branching on language.
    semi: zh ? "；" : "; ",
    stop: zh ? "。" : ".",
    comma: zh ? "，" : ", ",
    colon: zh ? "：" : ": ",
    sentences: (...parts) => parts.filter(Boolean).join(zh ? "" : " "),
    /** Page record consumed by the layout; `base` is the English route. */
    page: (fields) => ({ lang, route: localize(fields.base, lang), ...fields }),
  };
}
