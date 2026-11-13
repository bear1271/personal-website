// Builds the static site into dist/. Content lives in content/, page templates in pages/,
// shared helpers in lib/. Nothing here contains page copy.
import { cp, mkdir, rm, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { html } from "./lib/html.mjs";
import { loadContext } from "./lib/context.mjs";
import { discoveryFiles } from "./lib/discovery.mjs";
import { renderDocument, renderMarkdown, renderRedirect } from "./lib/layout.mjs";
import { homePages } from "./pages/home.mjs";
import { researchPages } from "./pages/research.mjs";
import { aboutPages } from "./pages/about.mjs";
import { leadershipPages } from "./pages/leadership.mjs";
import { notesPages } from "./pages/notes.mjs";
import { poeticsPages } from "./pages/poetics.mjs";
import { agentsPages } from "./pages/agents.mjs";
import { copyrightPages } from "./pages/copyright.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist");
const ctx = await loadContext(root);

const pages = [
  ...homePages(ctx),
  ...researchPages(ctx),
  ...aboutPages(ctx),
  ...leadershipPages(ctx),
  ...notesPages(ctx),
  ...poeticsPages(ctx),
  ...agentsPages(ctx),
  ...copyrightPages(ctx),
];
const seen = new Set();
for (const page of pages) {
  if (seen.has(page.route)) throw new Error(`Two pages claim the route ${page.route}`);
  seen.add(page.route);
}

async function save(file, content) {
  const target = path.join(out, file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
}
const dirOf = (route) => (route === "/" ? "" : route.slice(1));

try {
  await stat(path.join(root, "public/cv.pdf"));
} catch {
  throw new Error("public/cv.pdf is missing. Generate it first with `npm run cv` (needs: pip install -r requirements.txt).");
}

// Retries ride out Windows briefly locking a file (antivirus, indexers) while dist/ is being replaced.
await rm(out, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
await mkdir(out, { recursive: true });
// Unreviewed note sources must never be deployed; scripts/check.mjs enforces the same rule.
const unreviewed = ["html", "library"].map((name) => path.join(root, "public", "notes", name));
await cp(path.join(root, "public"), out, { recursive: true, filter: (source) => !unreviewed.some((dir) => source === dir || source.startsWith(dir + path.sep)) });
// The repository-level license files are the single source for the copies served on the site.
await cp(path.join(root, "LICENSE-CODE"), path.join(out, "LICENSE-CODE.txt"));
await cp(path.join(root, "LICENSE-CONTENT.md"), path.join(out, "LICENSE-CONTENT.md"));

for (const page of pages) {
  await save(`${dirOf(page.route)}index.html`, renderDocument(ctx, page));
  await save(`${dirOf(page.route)}index.md`, renderMarkdown(ctx, page));
}
for (const redirect of ctx.site.redirects) await save(`${dirOf(redirect.from)}index.html`, renderRedirect(ctx, redirect));

const english = ctx.view("en");
await save(
  "404.html",
  renderDocument(ctx, english.page({
    base: "/",
    route: "/404.html",
    title: english.t("notFound.title"),
    active: null,
    markdown: false,
    body: html`<div class="page-head"><p class="eyebrow">404</p><h1>${english.t("notFound.heading")}</h1><p class="lead">${english.t("notFound.lead")}</p><a href="/">${english.t("notFound.home")}</a></div>`,
  })),
);
for (const [file, content] of Object.entries(await discoveryFiles(ctx, pages))) await save(file, content);

console.log(`Built ${pages.length} pages with Markdown equivalents, ${ctx.site.redirects.length} redirect, profile/research JSON and discovery files in ${out}`);
const gaps = [...ctx.report.untranslated];
if (gaps.length) {
  console.log(`Note: ${gaps.length} text(s) have no Chinese translation yet and are shown in English on zh pages:`);
  for (const text of gaps.slice(0, 8)) console.log(`  - ${text.length > 90 ? `${text.slice(0, 90)}…` : text}`);
  if (gaps.length > 8) console.log(`  … and ${gaps.length - 8} more`);
}
