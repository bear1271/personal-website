import { html, mdJoin, paragraphs } from "../lib/html.mjs";
import { LANGS } from "../lib/i18n.mjs";
import { unique } from "../lib/fragments.mjs";
import { courseCard, courseMdItem, ongoingCard, ongoingMdItem, projectRoute } from "../lib/projects.mjs";

function indexPage(v) {
  const { p, t } = v;
  const body = html`
<div class="page-head"><p class="eyebrow">${t("research.eyebrow")}</p><h1>${t("nav.research")}</h1><p class="lead">${p.researchLead}</p></div>
<div class="research-intro">${paragraphs(p.approach)}</div>
<div class="question-grid">${p.questions.map((q, i) => html`<div><div class="question-number">0${i + 1}</div><h2>${q.title}</h2><p>${q.question}</p></div>`)}</div>
<section class="section"><div class="section-head"><h2>${t("research.inProgress")}</h2><span class="tag">${unique(p.ongoingProjects.map((x) => v.term(x.period))).join(", ")}</span></div>${p.ongoingProjects.map((x) => ongoingCard(v, x))}</section>
<section class="section page-bottom"><div class="section-head"><h2>${t("research.selected")}</h2><span class="tag">${unique(p.projects.map((x) => x.startDate.slice(0, 4))).join(", ")}</span></div>${p.projects.map((x) => courseCard(v, x))}<p class="fineprint">${t("research.courseNote")}</p></section>`;
  const md = mdJoin(
    `# ${t("nav.research")}`,
    p.approach,
    `## ${t("research.questions")}\n${p.questions.map((q) => `- ${q.question}`).join("\n")}`,
    `## ${t("research.inProgress")}\n${p.ongoingProjects.map((x) => ongoingMdItem(v, x)).join("\n")}`,
    `## ${t("research.selected")}\n${p.projects.map((x) => courseMdItem(v, x)).join("\n")}`,
    t("research.mdNote"),
  );
  return v.page({ base: "/research/", title: t("nav.research"), active: "research", body, md });
}

const header = (v, x, lead) => {
  const { t, r } = v;
  return html`<div class="page-head"><a class="back" href="${r("/research/")}">← ${t("research.back")}</a><p class="eyebrow">${x.type} · ${v.term(x.period)}</p><h1>${x.title}</h1><p class="lead">${lead}</p></div>`;
};

const tools = (v, x) =>
  html`<div class="tools"><a href="${projectRoute(v, x)}index.md">${v.t("research.readMd")} ↗</a><a href="/research.json">${v.t("research.metadata")} ↗</a></div>`;

const field = (v, label, value) => `${label}${v.colon}${value}`;

function ongoingPage(v, x) {
  const { t } = v;
  const route = projectRoute(v, x);
  const topic = x.topic ?? t("projects.notDetermined");
  const mentor = x.mentor ?? t("projects.notConfirmed");
  const body = html`
${header(v, x, x.description)}
<article class="article"><dl class="details"><dt>${t("projects.course")}</dt><dd>${x.courseCode} · ${x.courseTitle}</dd><dt>${t("projects.stage")}</dt><dd>${x.status}</dd><dt>${t("projects.topic")}</dt><dd>${topic}</dd><dt>${t("projects.mentor")}</dt><dd>${mentor}</dd><dt>${t("projects.publication")}</dt><dd>${x.publicationStatus}</dd></dl>${
    x.abstract == null
      ? html`<div class="notice"><strong>${t("projects.abstractSoonSentence")}</strong><br>${v.sentences(t("projects.topicDeveloping"), t("projects.followUp"))}</div>`
      : html`<h2>${t("projects.abstract")}</h2>${paragraphs(x.abstract)}`
  }${x.topic == null ? html`<p class="fineprint">${t("projects.areaLabelNote")}</p>` : ""}${tools(v, x)}</article>`;
  const md = mdJoin(
    `# ${x.title}`,
    [
      `${x.titleStatus}${v.stop}`,
      field(v, t("projects.type"), x.type),
      field(v, t("projects.period"), v.term(x.period)),
      field(v, t("projects.course"), `${x.courseCode} — ${x.courseTitle}`),
      field(v, t("projects.stage"), x.status),
      field(v, t("projects.topic"), topic),
      field(v, t("projects.mentor"), mentor),
      field(v, t("projects.publication"), x.publicationStatus),
    ].join("\n"),
    x.description,
    [x.availability, x.abstract == null ? t("projects.followUp") : x.abstract].join("\n"),
  );
  const schema = { "@type": "WebPage", "@id": v.url(route), name: x.title, description: x.description, about: { "@id": v.url("/#person") }, dateModified: v.ctx.updated };
  return v.page({ base: `/research/${x.id}/`, title: x.title, active: "research", body, md, description: x.description, schema });
}

function coursePage(v, x, english) {
  const { p, t } = v;
  const route = projectRoute(v, x);
  const body = html`
${header(v, x, x.description)}
<article class="article"><dl class="details"><dt>${t("projects.context")}</dt><dd>${x.context}</dd><dt>${t("projects.instructor")}</dt><dd>${x.instructor}</dd><dt>${t("projects.period")}</dt><dd>${v.term(x.period)}</dd><dt>${t("projects.workType")}</dt><dd>${x.type}</dd><dt>${t("projects.publication")}</dt><dd>${x.publicationStatus}</dd></dl><h2>${t("projects.question")}</h2><p class="lead">${x.question}</p><h2>${t("projects.scope")}</h2><p>${x.scope}</p><h2>${t("projects.aboutSummary")}</h2><p>${x.sourceNote}</p><div class="notice">${x.availability}</div>${tools(v, x)}</article>`;
  const md = mdJoin(
    `# ${x.title}`,
    [
      field(v, t("md.author"), p.name),
      field(v, t("projects.type"), x.type),
      field(v, t("projects.period"), v.term(x.period)),
      field(v, t("projects.publication"), x.publicationStatus),
      field(v, t("md.availability"), x.availability),
    ].join("\n"),
    `## ${t("md.question")}\n${x.question}`,
    `## ${t("projects.scope")}\n${x.description}`,
    x.scope,
    `## ${t("md.courseContext")}\n${x.context}\n${field(v, t("projects.instructor"), x.instructor)}`,
    `## ${t("projects.aboutSummary")}\n${x.sourceNote}`,
  );
  const schema = {
    "@type": "CreativeWork",
    "@id": v.url(route),
    name: x.title,
    description: x.description,
    author: { "@id": v.url("/#person") },
    genre: x.type,
    dateModified: v.ctx.updated,
    creativeWorkStatus: `${english.type}; summary only`,
    url: v.url(route),
  };
  return v.page({ base: `/research/${x.id}/`, title: x.shortTitle, active: "research", body, md, description: x.description, schema });
}

export function researchPages(ctx) {
  const en = ctx.view("en").p;
  return LANGS.flatMap((lang) => {
    const v = ctx.view(lang);
    return [
      indexPage(v),
      ...v.p.ongoingProjects.map((x) => ongoingPage(v, x)),
      ...v.p.projects.map((x, i) => coursePage(v, x, en.projects[i])),
    ];
  });
}
