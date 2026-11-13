import { html, mdJoin, paragraphs } from "../lib/html.mjs";
import { HTML_LANG, LANGS, localize } from "../lib/i18n.mjs";
import { portrait, unique } from "../lib/fragments.mjs";
import { ongoingCard, ongoingMdItem, courseMdItem, projectRoute } from "../lib/projects.mjs";

function about(v) {
  const { p, t } = v;
  const updated = v.ctx.updated;
  const inProgressTerms = unique(p.training.inProgress.map((c) => v.term(c.term))).join(", ");
  const studies = p.studies.join(t("about.studiesJoin"));

  const training = html`<h2>${t("about.training")}</h2><p>${p.training.summary}</p><h3 class="training-label">${t("about.inProgressTerm", { term: inProgressTerms })}</h3><ul class="course-list">${p.training.inProgress.map((c) => html`<li><span>${c.code}</span><div>${c.title}</div></li>`)}</ul><details class="completed-courses"><summary>${t("about.completed")}</summary><ul class="course-list">${p.training.completed.map((c) => html`<li><span>${c.code}</span><div>${c.title}<small>${v.term(c.term)}</small></div></li>`)}</ul></details>`;
  const entries = p.projects.map(
    (x) => html`<div class="cv-entry"><div class="cv-date">${v.term(x.period)} · ${x.type}</div><h3><a href="${projectRoute(v, x)}">${x.title}</a></h3><p>${x.description}</p><p>${x.context} · ${t("projects.instructor")}${v.colon}${x.instructor}</p></div>`,
  );
  const body = html`
<div class="page-head"><p class="eyebrow">${t("about.eyebrow")}</p><h1>${t("about.heading")}</h1><p class="lead">${p.name}</p></div>
<div class="about-grid"><article class="article"><p class="lead">${p.bio}</p>${paragraphs(p.approach)}<div class="tools"><a class="download" href="/cv.pdf" download="Green-Wang-CV.pdf">${t("about.downloadCv")} <span>↓ PDF</span></a><a href="${localize("/about/", v.other)}" lang="${HTML_LANG[v.other]}">${t("about.otherLanguage")} ↗</a></div>
<h2>${t("about.education")}</h2><div class="cv-entry"><h3>${p.institution}</h3><p>${p.role} · ${studies}</p></div>
<h2>${t("about.interests")}</h2><p>${p.interests.join(" · ")}</p>
${training}
<h2>${t("about.papersInProgress")}</h2>${p.ongoingProjects.map((x) => ongoingCard(v, x))}
<h2>${t("research.selected")}</h2>${entries}
<p class="fineprint">${t("about.fineprint")}</p></article><aside>${portrait(v, "about-portrait")}<p class="eyebrow">${t("about.glance")}</p><p>${p.institutionShort}<br>${p.role}</p><p>${p.studies.map((s, i) => (i ? html`<br>${s}` : s))}</p><p class="eyebrow">${t("about.contact")}</p><a href="mailto:${p.email}">${p.email}</a><p class="eyebrow">${t("about.updated")}</p><time datetime="${updated}">${v.date(updated)}</time></aside></div>`;

  const trainingMd = [
    `## ${t("about.training")}\n${p.training.summary}`,
    `### ${t("about.mdInProgressTerm", { term: inProgressTerms })}\n${p.training.inProgress.map((c) => `- ${t("about.courseInProgress", { code: c.code, title: c.title, term: v.term(c.term) })}`).join("\n")}`,
    `### ${t("about.completed")}\n${p.training.completed.map((c) => `- ${t("about.courseCompleted", { code: c.code, title: c.title, term: v.term(c.term) })}`).join("\n")}`,
  ];
  const md = mdJoin(
    `# ${t("about.mdTitle", { name: p.name })}`,
    p.bio,
    p.approach,
    `## ${t("about.education")}\n${p.institution}\n${t("about.mdLevel", { role: p.role, studies: p.studies.join(t("list.and")) })}`,
    `## ${t("about.interests")}\n${p.interests.join(v.semi)}`,
    trainingMd,
    `## ${t("about.papersInProgress")}\n${p.ongoingProjects.map((x) => ongoingMdItem(v, x)).join("\n")}`,
    `## ${t("research.selected")}\n${p.projects.map((x) => courseMdItem(v, x)).join("\n")}`,
    `## ${t("about.contact")}\n${p.email}`,
    `[${t("about.cvPdf")}](/cv.pdf)`,
  );
  const route = localize("/about/", v.lang);
  const schema = {
    "@type": "ProfilePage",
    "@id": v.url(route),
    name: t("about.schemaName", { name: p.name }),
    mainEntity: { "@id": v.url("/#person") },
    dateModified: updated,
  };
  return v.page({ base: "/about/", title: t("about.title"), active: "about", body, md, description: p.bio, schema });
}

export const aboutPages = (ctx) => LANGS.map((lang) => about(ctx.view(lang)));
