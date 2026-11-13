// Validates the built site in dist/ against the rules in AGENTS.md. It checks properties that
// must stay true (bilingual parity, link integrity, status wording derived from data, no private
// material, no orphan files), not today's exact copy. All failures are listed together.
import { readFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createTranslator, resolve } from "./lib/i18n.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist");
const readJson = async (file) => JSON.parse(await readFile(path.join(root, file), "utf8"));
const [site, ui, source, manifest, categories] = await Promise.all([
  readJson("content/site.json"),
  readJson("content/ui.json"),
  readJson("content/profile.json"),
  readJson("content/public-note-editions.json"),
  readJson("content/notes-categories.json"),
]);
const origin = (process.env.SITE_ORIGIN || site.origin).replace(/\/$/, "");
const basePath = (process.env.SITE_BASE ?? site.basePath).replace(/\/$/, "");
const url = (route) => `${origin}${basePath}${route}`;
const en = resolve(source, "en");

const failures = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
const exists = async (file) => { try { await stat(file); return true; } catch { return false; } };

// ---- inventory ---------------------------------------------------------------------------
const files = [];
async function walk(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) await walk(full);
    else files.push(path.relative(out, full).split(path.sep).join("/"));
  }
}
await walk(out);
const TEXT = /\.(html|md|json|txt|xml|css|svg)$/;
const text = new Map();
for (const rel of files) if (TEXT.test(rel)) text.set(rel, await readFile(path.join(out, rel), "utf8"));

const isStub = (html) => html.includes('http-equiv="refresh"');
const routeOf = (rel) => (rel === "404.html" ? "/404.html" : `/${rel.replace(/index\.html$/, "")}`);
const peerOf = (route) => (route.startsWith("/zh/") ? route.slice(3) : `/zh${route}`);
const pages = new Map(); // route -> html, real pages only
const stubs = new Map();
for (const [rel, html] of text) {
  if (!rel.endsWith(".html")) continue;
  (isStub(html) ? stubs : pages).set(routeOf(rel), html);
}
const pageFile = (route) => (route === "/404.html" ? "404.html" : `${route.slice(1)}index.html`);
const idsOf = new Map();
const ids = (route) => {
  if (!idsOf.has(route)) idsOf.set(route, new Set([...pages.get(route).matchAll(/\s(?:id|name)="([^"]+)"/g)].map((m) => m[1])));
  return idsOf.get(route);
};

// ---- per-page rules ---------------------------------------------------------------------
const cssText = text.get("style.css") ?? "";
const cssClasses = new Set([...cssText.matchAll(/\.([a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const PRIVATE = [/Student ID|\bSID\b/i, /Expected (?:Spring|Summer|Fall|Winter) \d{4}/, /file:\/\//, /[A-Za-z]:\\{1,2}[A-Za-z]/, /\/Users\/[A-Za-z0-9_.-]+/];
const references = new Set();
const addReference = (value) => {
  const target = value.split("#")[0].split("?")[0];
  if (!target.startsWith("/")) return;
  try { references.add(decodeURIComponent(basePath && target.startsWith(`${basePath}/`) ? target.slice(basePath.length) : target)); } catch { /* reported by the link check */ }
};
let linkCount = 0;

for (const [route, html] of pages) {
  const where = route;
  const isZh = route.startsWith("/zh/");
  const peer = peerOf(route);
  check((html.match(/<h1[ >]/g) || []).length === 1, `${where}: needs exactly one <h1>`);
  check(html.includes(`<html lang="${isZh ? "zh-CN" : "en"}"`), `${where}: wrong <html lang>`);
  check(/<meta name="description" content="[^"]+"/.test(html), `${where}: missing description`);
  check(html.includes(`<link rel="canonical" href="${url(route)}">`), `${where}: canonical must be ${url(route)}`);
  check(!/ style="/.test(html), `${where}: inline style attribute (use a class in style.css)`);
  for (const script of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (!script[1].includes("application/ld+json")) { check(false, `${where}: runtime JavaScript is not allowed`); continue; }
    try { JSON.parse(script[2]); } catch { check(false, `${where}: invalid JSON-LD`); }
  }
  for (const img of html.matchAll(/<img\b[^>]*>/g)) check(/\salt="[^"]+"/.test(img[0]), `${where}: <img> without alt text`);
  for (const cls of new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/)))) check(cssClasses.has(cls), `${where}: class "${cls}" has no CSS`);

  // markdown companion
  const md = text.get(route === "/404.html" ? "" : `${route.slice(1)}index.md`);
  if (route !== "/404.html") check(md && md.startsWith("# "), `${where}: missing or malformed index.md`);

  // language pairing (404 has no Chinese twin)
  if (route !== "/404.html") {
    const twin = pages.get(peer);
    check(Boolean(twin), `${where}: no ${isZh ? "English" : "Chinese"} counterpart at ${peer}`);
    check(html.includes(`class="language-switch" href="${basePath}${peer}"`), `${where}: language switch must point to ${peer}`);
    check(html.includes(`rel="alternate" hreflang="${isZh ? "en" : "zh-CN"}" href="${url(peer)}"`), `${where}: hreflang for ${peer} missing`);
    check(html.includes(`rel="alternate" hreflang="${isZh ? "zh-CN" : "en"}" href="${url(route)}"`), `${where}: self hreflang missing`);
  }

  // links and anchors
  for (const m of html.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
    const link = m[1];
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(link)) continue; // external, mailto:, …
    const [target, fragment] = link.split("#");
    if (!target) { check(!fragment || ids(route).has(fragment), `${where}: #${fragment} has no target on this page`); continue; }
    if (!target.startsWith("/")) { check(false, `${where}: relative link "${link}" (use root-relative paths)`); continue; }
    addReference(target);
    let rel = target.split("?")[0];
    if (basePath) { if (!rel.startsWith(`${basePath}/`)) { check(false, `${where}: link outside base path: ${link}`); continue; } rel = rel.slice(basePath.length); }
    let decoded;
    try { decoded = decodeURIComponent(rel); } catch { check(false, `${where}: bad escape in ${link}`); continue; }
    const isDir = decoded.endsWith("/");
    const file = path.join(out, isDir ? `${decoded}index.html` : decoded);
    if (!(await exists(file))) { check(false, `${where}: broken link ${link}`); continue; }
    linkCount++;
    if (fragment) {
      const route2 = isDir ? decoded : null;
      check(route2 && pages.has(route2) && ids(route2).has(fragment), `${where}: anchor ${link} has no target`);
    }
  }
}

// ---- stubs, sitemap, discovery files ------------------------------------------------------
for (const [route, html] of stubs) {
  const to = site.redirects.find((r) => r.from === route)?.to;
  check(Boolean(to) && pages.has(to), `${route}: redirect target missing`);
  check(!to || html.includes(`<link rel="canonical" href="${url(to)}">`), `${route}: redirect must canonicalize to its target`);
}
for (const redirect of site.redirects) check(stubs.has(redirect.from), `${redirect.from}: redirect stub not built`);
const sitemap = text.get("sitemap.xml") ?? "";
const listed = new Set([...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]));
const expected = new Set([...pages.keys()].filter((r) => r !== "/404.html").map(url));
for (const u of expected) check(listed.has(u), `sitemap.xml: missing ${u}`);
for (const u of listed) check(expected.has(u), `sitemap.xml: lists a page that is not published: ${u}`);
check((text.get("robots.txt") ?? "").includes(`Sitemap: ${url("/sitemap.xml")}`), "robots.txt: sitemap line missing");
check(Boolean(text.get("llms.txt")?.startsWith("# ")), "llms.txt: missing");
check((await readFile(path.join(out, "CNAME"), "utf8")).trim() === new URL(origin).hostname, "CNAME must contain the production domain (AGENTS.md)");

// ---- profile / research consistency with the source of truth --------------------------------
const profile = JSON.parse(text.get("profile.json"));
const research = JSON.parse(text.get("research.json"));
for (const key of ["name", "alternateNames", "role", "institution", "studies", "bio", "interests", "training", "email", "updated"]) {
  check(JSON.stringify(profile[key]) === JSON.stringify(en[key]), `profile.json: "${key}" differs from content/profile.json`);
}
check(/^\d{4}-\d{2}-\d{2}$/.test(source.updated), "content/profile.json: updated must be YYYY-MM-DD");
check(research.ongoingProjects.length === source.ongoingProjects.length && research.projects.length === source.projects.length, "research.json: project counts differ from content");

// Course work must never be presented as a publication (AGENTS.md content safeguards).
for (const x of [...en.ongoingProjects, ...en.projects]) {
  check(/^not /i.test(x.publicationStatus), `${x.id}: course work must have a publicationStatus starting with "Not"`);
}
// The derived wording follows topic/mentor/abstract automatically; the hand-written text of the same
// record (description, status, availability) must not keep claiming something is pending.
for (const x of en.ongoingProjects) {
  const prose = `${x.description} ${x.status} ${x.availability}`;
  if (x.topic != null) check(!/topic[^.]*not yet (?:been )?determined/i.test(prose), `${x.id}: topic is set, but description/status/availability still say it is not yet determined`);
  if (x.mentor != null) check(!/mentor[^.]*not yet (?:been )?(?:determined|confirmed)/i.test(prose), `${x.id}: mentor is set, but description/status/availability still say it is not yet confirmed`);
  if (x.topic != null && x.mentor != null && x.abstract != null) check(!/planned|coming soon|not yet (?:been )?(?:determined|confirmed|started)/i.test(prose), `${x.id}: topic, mentor and abstract are set, but description/status/availability still read as pending`);
}
for (const lang of ["en", "zh"]) {
  const t = createTranslator(ui, lang).text;
  const prefix = lang === "zh" ? "/zh" : "";
  const view = resolve(source, lang);
  for (const x of view.ongoingProjects) {
    const html = pages.get(`${prefix}/research/${x.id}/`) ?? "";
    check(html.includes(x.publicationStatus), `${prefix}/research/${x.id}/: publication status not shown`);
    check(x.topic == null ? html.includes(t("projects.notDetermined")) : html.includes(x.topic), `${prefix}/research/${x.id}/: topic text does not match content (topic ${x.topic == null ? "is null" : "is set"})`);
    check(x.mentor == null ? html.includes(t("projects.notConfirmed")) : html.includes(x.mentor), `${prefix}/research/${x.id}/: mentor text does not match content`);
    check(x.abstract == null ? html.includes(t("projects.abstractSoonSentence")) : !html.includes(t("projects.abstractSoonSentence")), `${prefix}/research/${x.id}/: abstract notice does not match content`);
  }
  for (const x of view.projects) {
    const html = pages.get(`${prefix}/research/${x.id}/`) ?? "";
    check(html.includes(x.publicationStatus) && html.includes(x.availability), `${prefix}/research/${x.id}/: publication status or availability not shown`);
  }
}

// ---- CV ----------------------------------------------------------------------------------
const cv = await readFile(path.join(root, "public/cv.pdf")).catch(() => null);
check(cv && cv.subarray(0, 4).toString() === "%PDF", "public/cv.pdf missing or not a PDF (run npm run cv)");
check(cv && cv.toString("latin1").includes(`edition ${source.updated}`), `public/cv.pdf is stale: regenerate it (npm run cv); profile.updated is ${source.updated}`);
check(files.includes("cv.pdf"), "dist/cv.pdf missing");

// ---- notes -------------------------------------------------------------------------------
const STATUS = { public: "site", catalog: "drive" };
const categoryIds = new Set(categories.map((c) => c.id));
const seenIds = new Set(), seenHrefs = new Set();
const poeticsDir = path.join(root, "content/poetics");
for (const note of manifest) {
  const label = `notes manifest "${note.title}"`;
  check(note.status in STATUS, `${label}: unknown status "${note.status}"`);
  check(note.hosting === STATUS[note.status], `${label}: status ${note.status} needs hosting ${STATUS[note.status]}`);
  check(note.access_verified === true, `${label}: unverified entries must not be in the manifest`);
  check(categoryIds.has(note.categoryId), `${label}: unknown categoryId ${note.categoryId}`);
  check(!seenIds.has(note.id) && !seenHrefs.has(note.href), `${label}: duplicate id or href`);
  seenIds.add(note.id); seenHrefs.add(note.href);
  if (note.hosting === "drive") {
    let link; try { link = new URL(note.href); } catch { check(false, `${label}: invalid URL`); continue; }
    check(link.hostname === "drive.google.com" && /^\/file\/d\/[\w-]+\/view$/.test(link.pathname), `${label}: not a drive.google.com /file/d/<id>/view link`);
  } else {
    check(note.href.startsWith("/notes/poetics/"), `${label}: unexpected site route`);
    for (const prefix of ["", "/zh"]) {
      const route = `${prefix}${note.href}`;
      const html = pages.get(route) ?? "";
      const edition = JSON.parse(await readFile(path.join(poeticsDir, `${note.id}.json`), "utf8"));
      check(Boolean(html), `${route}: edition page missing`);
      check((html.match(/<h2 id="section-/g) || []).length === edition.blocks.filter((b) => b.kind === "h2").length, `${route}: section count differs from source`);
      for (const block of edition.blocks.filter((b) => b.kind === "p")) check(html.includes(block.html), `${route}: source paragraph missing: ${block.text.slice(0, 40)}`);
      for (const fn of edition.footnotes) check(html.includes(`id="fn-${fn.id}"`), `${route}: footnote ${fn.id} missing`);
    }
    const pdf = await readFile(path.join(out, note.pdf)).catch(() => null);
    check(pdf && pdf.subarray(0, 4).toString() === "%PDF", `${label}: PDF missing`);
    const docx = await readFile(path.join(out, note.original)).catch(() => null);
    check(docx && docx.subarray(0, 2).toString() === "PK", `${label}: DOCX missing`);
  }
  for (const prefix of ["", "/zh"]) {
    const all = pages.get(`${prefix}/notes/all/`) ?? "";
    const group = pages.get(`${prefix}/notes/${note.categoryId}/`) ?? "";
    const link = note.hosting === "site" ? `${basePath}${prefix}${note.href}` : note.href;
    check(all.includes(`href="${link}"`) && group.includes(`href="${link}"`), `${label}: not listed (or wrong language link) on ${prefix}/notes/`);
  }
}
for (const category of categories) {
  for (const prefix of ["", "/zh"]) {
    check(pages.has(`${prefix}/notes/${category.id}/`), `${prefix}/notes/${category.id}/: subject page missing`);
    check((pages.get(`${prefix}/notes/all/`) ?? "").includes(`id="${category.id}"`), `${prefix}/notes/all/: no section for ${category.id}`);
  }
}
check(![...files].some((f) => /^notes\/(?:html|library)\//.test(f)), "unreviewed note sources (notes/html or notes/library) must not be deployed");

// ---- privacy, leaks, orphans --------------------------------------------------------------
const emails = new Set([en.email]);
for (const [rel, body] of text) {
  if (/review-notes|make_cv|profile\.json\.bak|academic_record/.test(rel)) check(false, `internal source leaked: ${rel}`);
  for (const pattern of PRIVATE) check(!pattern.test(body), `${rel}: matches private-material pattern ${pattern}`);
  for (const m of body.matchAll(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g)) check(emails.has(m[0]), `${rel}: unexpected email address ${m[0]}`);
  if (rel.endsWith(".md") || rel === "llms.txt") for (const m of body.matchAll(/\]\((\/[^)\s]*)\)/g)) addReference(m[1]);
  for (const m of body.matchAll(new RegExp(`${origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}${basePath}(/[^\\s"')<>]*)`, "g"))) addReference(m[1]);
  if (rel.endsWith(".css")) for (const m of body.matchAll(/url\(["']?([^"')]+)/g)) addReference(m[1]);
}
const ALWAYS = new Set(["CNAME", "robots.txt"]);
for (const rel of files) {
  if (rel.endsWith(".html") || ALWAYS.has(rel)) continue;
  check(references.has(`/${rel}`), `orphan file: ${rel} is deployed but nothing links to it`);
}

if (failures.length) {
  console.error(`FAIL: ${failures.length} problem(s)\n` + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log(`PASS: ${pages.size} pages (+${stubs.size} redirect), ${linkCount} internal links; bilingual parity, hreflang, anchors, sitemap, status wording vs content, ${manifest.length} notes, CV freshness, no orphans or private material.`);
