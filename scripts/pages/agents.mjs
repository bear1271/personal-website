import { html, mdJoin } from "../lib/html.mjs";
import { LANGS } from "../lib/i18n.mjs";
import { renderBlocks } from "../lib/blocks.mjs";
import { pendingSentence, projectRoute } from "../lib/projects.mjs";

function agents(v) {
  const { p, t } = v;
  const content = v.ctx.agents[v.lang];

  // Project status lists are generated from the data, so they cannot go stale.
  const projectList = (kind) => {
    const inProgress = kind === "inProgress";
    const items = inProgress ? p.ongoingProjects : p.projects;
    const heading = inProgress ? t("projects.inProgress") : t("research.selected");
    const line = (x) =>
      v.sentences(
        `${x.type}${v.comma}${v.term(x.period)}${v.stop}`,
        inProgress ? pendingSentence(v, x) : "",
        `${x.publicationStatus}${v.stop}`,
        inProgress ? "" : x.availability,
      );
    return {
      html: html`<h3>${heading}</h3><ul>${items.map((x) => html`<li><a href="${projectRoute(v, x)}">${x.title}</a> — ${line(x)}</li>`)}</ul>`,
      md: `### ${heading}\n${items.map((x) => `- [${x.title}](${projectRoute(v, x)}index.md) — ${line(x)}`).join("\n")}`,
    };
  };

  const { html: parts, md: mdParts } = renderBlocks(content.blocks, {
    vars: { name: p.name, institution: p.institution, institutionShort: p.institutionShort, studies: p.studies.join(t("list.and")).toLowerCase() },
    custom: { projects: projectList },
  });
  const body = html`
<div class="page-head"><p class="eyebrow">${content.eyebrow}</p><h1>${content.title}</h1><p class="lead">${content.lead}</p></div><article class="article">${parts}</article>`;
  const md = mdJoin(`# ${content.mdTitle}`, mdParts);
  return v.page({ base: "/for-agents/", title: content.title, active: null, body, md, description: content.description ?? p.bio });
}

export const agentsPages = (ctx) => LANGS.map((lang) => agents(ctx.view(lang)));
