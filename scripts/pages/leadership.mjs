import { html, mdJoin } from "../lib/html.mjs";
import { LANGS } from "../lib/i18n.mjs";

function leadership(v) {
  const { p, t } = v;
  // `showOnLeadership` in content/profile.json decides which roles appear on this page.
  const roles = p.experience.filter((x) => x.showOnLeadership);
  const body = html`<div class="page-head"><p class="eyebrow">${t("leadership.eyebrow")}</p><h1>${t("nav.leadership")}</h1><p class="lead">${t("leadership.lead")}</p></div>${roles.map(
    (x) => html`<article class="work"><div class="work-meta"><span>${v.term(x.period)}</span><span>${x.role}</span></div><div><h2><a href="${x.url}">${x.organization} ↗</a></h2><p>${x.detail}</p></div></article>`,
  )}`;
  const md = mdJoin(
    `# ${t("nav.leadership")}`,
    roles.map((x) => `## ${x.organization}\n\n${x.role} · ${v.term(x.period)}\n\n${x.detail}\n\n[${t("leadership.website")}](${x.url})`),
  );
  return v.page({ base: "/leadership/", title: t("nav.leadership"), active: "leadership", body, md, description: t("leadership.lead") });
}

export const leadershipPages = (ctx) => LANGS.map((lang) => leadership(ctx.view(lang)));
