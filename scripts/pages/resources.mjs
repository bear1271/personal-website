import { html, mdJoin } from "../lib/html.mjs";
import { LANGS } from "../lib/i18n.mjs";

// Resources link to public study materials and independently hosted projects.
function resources(v) {
  const { t } = v;
  const body = html`<div class="page-head"><p class="eyebrow">${t("resources.eyebrow")}</p><h1>${t("nav.resources")}</h1><p class="lead">${t("resources.lead")}</p></div><article class="work"><div class="work-meta"><span>${t("resources.mathMeta")}</span></div><div><h2><a href="${t("resources.mathUrl")}">${t("resources.mathTitle")} ↗</a></h2><p>${t("resources.mathDetail")}</p></div></article><article class="work"><div class="work-meta"><span>${t("resources.boardMeta")}</span></div><div><h2><a href="${t("resources.boardUrl")}">${t("resources.boardTitle")} ↗</a></h2><p>${t("resources.boardDetail")}</p><p><a href="${t("resources.boardUrl")}">${t("resources.play")} ↗</a> · <a href="${t("resources.sourceUrl")}">${t("resources.source")} ↗</a></p></div></article>`;
  const md = mdJoin(
    `# ${t("nav.resources")}`,
    t("resources.lead"),
    `## [${t("resources.mathTitle")}](${t("resources.mathUrl")})\n\n${t("resources.mathMeta")}\n\n${t("resources.mathDetail")}`,
    `## ${t("resources.boardTitle")}\n\n${t("resources.boardMeta")}\n\n${t("resources.boardDetail")}\n\n[${t("resources.play")}](${t("resources.boardUrl")}) · [${t("resources.source")}](${t("resources.sourceUrl")})`,
  );
  return v.page({ base: "/resources/", title: t("nav.resources"), active: "resources", body, md, description: t("resources.lead") });
}

export const resourcesPages = (ctx) => LANGS.map((lang) => resources(ctx.view(lang)));
