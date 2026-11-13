// Notes catalog: overview, complete list and one page per subject, in both languages.
// All navigation is rendered at build time; unreviewed notes never reach the catalog.
import { html, mdJoin, raw } from "../lib/html.mjs";
import { LANGS } from "../lib/i18n.mjs";

const STATUSES = ["public", "catalog"];

function selectEntries(ctx) {
  for (const note of ctx.notes) {
    if (!STATUSES.includes(note.status)) throw new Error(`Unknown note status "${note.status}" (${note.title}); use ${STATUSES.join(" or ")}`);
  }
  // An edition is listed only after its reading file has been reviewed and its access verified.
  const entries = ctx.notes.filter((note) => note.access_verified);
  const groups = ctx.categories.map((category) => ({ ...category, entries: entries.filter((note) => note.categoryId === category.id) }));
  for (const entry of entries) {
    if (!groups.some((group) => group.entries.includes(entry))) throw new Error(`Public note needs a recognized categoryId: ${entry.title}`);
  }
  return { entries, groups };
}

function catalogPages(v, { entries, groups }) {
  const { t } = v;
  const root = v.r("/notes/");
  const title = t("notes.title");
  const all = t("notes.all");
  const topics = t("notes.topics");
  const intro = t("notes.intro");
  const status = t("notes.preparing");
  const scope = t("notes.scope");
  const label = (group) => v.tr(group.title);
  const describe = (group) => v.tr(group.description);
  const count = (n) => t(n === 1 ? "notes.countOne" : "notes.count", { n });
  // Site-hosted editions exist in both languages; Drive files are language-neutral.
  const href = (note) => (note.hosting === "site" ? v.r(note.href) : note.href);
  const meta = (note) => `${note.type} · ${note.language} · ${note.format || "PDF"}`;

  const empty = html`<div class="notes-empty"><h2>${status}</h2><p>${t("notes.emptyText")}</p></div>`;
  const card = (note) =>
    html`<article class="research-note"><p class="note-meta">${meta(note)}</p><h2><a href="${href(note)}">${note.title}</a></h2><p class="note-abstract">${note.abstract}</p><p class="note-meta note-edition">${t("notes.edition")} · ${note.edition_date} · <a href="${href(note)}">${note.hosting === "site" ? t("notes.readFull") : t("notes.readDrive")} ↗</a>${note.original ? html` · <a href="${note.original}" download>${t("notes.originalDocx")} ↓</a>` : ""}</p>${note.contents?.length ? html`<details><summary>${t("notes.included")} (${note.contents.length})</summary><ul>${note.contents.map((item) => html`<li>${item.title}</li>`)}</ul></details>` : ""}</article>`;
  const list = (group) =>
    group.entries.length
      ? html`<ul class="notes-list">${group.entries.map((note) => html`<li><a href="${href(note)}">${note.title}</a><span>${meta(note)}</span></li>`)}</ul>`
      : html`<p class="notes-preparing">${status}</p>`;
  const mdList = (group) =>
    group.entries.length ? group.entries.map((note) => `- [${note.title}](${href(note)}) — ${note.type}, ${note.language}, ${note.format || "PDF"}\n  ${note.abstract}`).join("\n") : status;
  const current = (flag) => (flag ? raw(' aria-current="page"') : "");
  const navigation = (which) =>
    html`<nav class="notes-navigation" aria-label="${t("notes.catalogLabel")}"><a href="${root}"${current(which === "topics")}>${topics}</a><a href="${root}all/"${current(which === "all")}>${all}</a></nav>`;
  const heading = (name, lead) =>
    html`<div class="page-head notes-head"><p class="eyebrow">${t("notes.eyebrow")}</p><h1>${name}</h1><p class="lead">${lead}</p></div>`;
  const page = (base, name, body, md, description) => v.page({ base, title: name, active: "notes", body, md, description });

  const overview = page(
    "/notes/",
    title,
    html`${heading(title, intro)}${navigation("topics")}<section aria-labelledby="notes-topics"><div class="notes-section-head"><h2 id="notes-topics">${topics}</h2><span>${count(entries.length)}</span></div><div class="notes-topic-grid">${groups.map((group, i) => html`<a class="notes-topic" href="${root}${group.id}/"><span class="notes-topic-number" aria-hidden="true">0${i + 1}</span><h3>${label(group)}<span aria-hidden="true">↗</span></h3><p>${describe(group)}</p><span class="notes-topic-status">${group.entries.length ? count(group.entries.length) : status}</span></a>`)}</div></section><p class="notes-scope">${scope}</p>`,
    mdJoin(
      `# ${title}`,
      intro,
      `[${all}](${root}all/index.md)`,
      `## ${topics}`,
      groups.map((group) => `### [${label(group)}](${root}${group.id}/index.md)\n\n${describe(group)}\n\n${group.entries.length ? count(group.entries.length) : status}`).join("\n\n"),
      scope,
    ),
    intro,
  );

  const complete = page(
    "/notes/all/",
    all,
    html`${heading(all, t("notes.allLead"))}${navigation("all")}<nav class="notes-subject-links" aria-label="${t("notes.jumpLabel")}">${groups.map((group) => html`<a href="#${group.id}">${label(group)}</a>`)}</nav>${entries.length ? "" : empty}${groups.map((group) => html`<section class="notes-group" id="${group.id}"><div class="notes-section-head"><h2><a href="${root}${group.id}/">${label(group)} <span aria-hidden="true">→</span></a></h2><span>${count(group.entries.length)}</span></div>${list(group)}</section>`)}`,
    mdJoin(`# ${all}`, `[${topics}](${root}index.md)`, groups.map((group) => `## ${label(group)}\n\n${mdList(group)}`).join("\n\n")),
    intro,
  );

  const subjects = groups.map((group) =>
    page(
      `/notes/${group.id}/`,
      label(group),
      html`<div class="notes-breadcrumb"><a href="${root}">${title}</a><span aria-hidden="true">/</span><span>${label(group)}</span></div>${heading(label(group), describe(group))}${navigation(null)}<nav class="notes-subject-links" aria-label="${t("notes.subjectLabel")}">${groups.map((other) => html`<a href="${root}${other.id}/"${current(other.id === group.id)}>${label(other)}</a>`)}</nav><div class="notes-section-head"><h2>${t("notes.catalogHeading")}</h2><span>${count(group.entries.length)}</span></div>${group.entries.length ? group.entries.map(card) : empty}<p class="notes-scope">${scope}</p>`,
      mdJoin(`# ${label(group)}`, `[${title}](${root}index.md) · [${all}](${root}all/index.md)`, describe(group), mdList(group), scope),
      describe(group),
    ),
  );
  return [overview, complete, ...subjects];
}

export function notesPages(ctx) {
  const selection = selectEntries(ctx);
  return LANGS.flatMap((lang) => catalogPages(ctx.view(lang), selection));
}
