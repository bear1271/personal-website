import { html, mdJoin } from "../lib/html.mjs";
import { LANGS } from "../lib/i18n.mjs";
import { mdNav, portrait } from "../lib/fragments.mjs";
import { ongoingCard, ongoingMdItem } from "../lib/projects.mjs";

function home(v) {
  const { p, t, r } = v;
  const alternate = p.alternateNames.find((name) => name !== p.shortName);
  const body = html`
<section class="hero"><div><p class="eyebrow">${p.institution}</p><h1>${p.shortName}<br><span>(${alternate})</span></h1><p class="intro">${p.bio}</p><div class="hero-links"><a class="text-link" href="${r("/research/")}">${t("home.explore")} <span aria-hidden="true">↗</span></a><a class="text-link" href="${r("/about/")}">${t("home.about")}</a><a class="text-link" href="mailto:${p.email}">${t("home.email")} <span aria-hidden="true">↗</span></a></div></div><div class="hero-side">${portrait(v, "portrait")}<aside class="lens" aria-label="${t("home.lens.label")}"><p class="lens-title">${t("home.lens.title")}</p><p class="lens-focus">${t("home.lens.first")}</p><p class="lens-focus">${t("home.lens.second")}</p><p class="lens-caption">${t("home.lens.captionA")}<br>${t("home.lens.captionB")}</p></aside></div></section>
<section class="section" aria-labelledby="selected"><div class="section-head"><h2 id="selected">${t("home.inProgress")}</h2><a class="text-link" href="${r("/research/")}">${t("home.allResearch")} ↗</a></div>${p.ongoingProjects.map((x) => ongoingCard(v, x))}</section>
<section class="bottom-grid"><div class="now"><p class="eyebrow">${t("home.interests")}</p><p>${p.currentFocus}</p><a class="text-link" href="${r("/notes/")}">${t("home.notes")} ↗</a></div><div class="contact"><h2>${t("home.contactHeading")}</h2><p>${p.contactNote}</p><a href="mailto:${p.email}">${p.email} ↗</a></div></section>`;
  const md = mdJoin(
    `# ${p.name}`,
    p.bio,
    `## ${t("home.inProgress")}\n${p.ongoingProjects.map((x) => ongoingMdItem(v, x)).join("\n")}`,
    `## ${t("home.contact")}\n${p.email}`,
    mdNav(v),
  );
  return v.page({ base: "/", title: t("home.title"), active: "home", body, md, description: p.bio });
}

export const homePages = (ctx) => LANGS.map((lang) => home(ctx.view(lang)));
