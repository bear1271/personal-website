// Machine-readable companions of the site: profile.json, research.json, llms.txt,
// sitemap.xml and robots.txt. Public JSON keeps its long-standing English-only shape.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { esc, json } from "./html.mjs";
import { pendingSentence, projectRoute } from "./projects.mjs";

export async function discoveryFiles(ctx, sitemapPages) {
  const v = ctx.view("en");
  const { p } = v;
  const url = ctx.url;

  const profile = {
    schemaVersion: 1,
    updated: p.updated,
    name: p.name,
    alternateNames: p.alternateNames,
    role: p.role,
    institution: p.institution,
    studies: p.studies,
    bio: p.bio,
    interests: p.interests,
    training: p.training,
    exploratoryQuestion: p.workingHypothesis,
    email: p.email,
    url: url("/"),
    cv: url("/cv.pdf"),
    contentNote: "Studies does not specify formal degree declaration or graduation date. Update date refers to this site edition.",
  };
  const withLinks = (x) => ({ ...x, url: url(projectRoute(v, x)), markdown: url(`${projectRoute(v, x)}index.md`) });
  const research = {
    schemaVersion: 1,
    updated: p.updated,
    ongoingProjects: p.ongoingProjects.map(withLinks),
    projects: p.projects.map(withLinks),
  };

  const template = await readFile(path.join(ctx.root, "content/pages/llms.template.txt"), "utf8");
  const section = (items, line) => items.map((x) => `- [${x.title}](${url(`${projectRoute(v, x)}index.md`)}): ${line(x)}`).join("\n");
  const values = {
    name: p.name,
    tagline: `${p.institutionShort} ${p.role.toLowerCase()} studying ${p.studies.join(" and ").toLowerCase()}.`,
    bio: p.bio,
    updated: p.updated,
    inProgress: section(p.ongoingProjects, (x) => `${x.type}, ${x.period}. ${pendingSentence(v, x)}`.trim()),
    courseResearch: section(p.projects, (x) => `${x.type}, ${x.period}. ${x.publicationStatus}. ${x.availability}`),
  };
  const llms = template
    .replace(/\{url:([^}]+)\}/g, (_, route) => url(route))
    .replace(/\{(\w+)\}/g, (_, key) => {
      if (!(key in values)) throw new Error(`Unknown placeholder {${key}} in llms.template.txt`);
      return values[key];
    });

  const urls = [...sitemapPages].sort((a, b) => a.route.localeCompare(b.route)).map((page) => `<url><loc>${esc(url(page.route))}</loc><lastmod>${ctx.updated}</lastmod></url>`);
  return {
    "profile.json": json(profile),
    "research.json": json(research),
    "llms.txt": llms,
    "sitemap.xml": `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`,
    "robots.txt": `User-agent: *\nAllow: /\nSitemap: ${url("/sitemap.xml")}\n`,
  };
}
