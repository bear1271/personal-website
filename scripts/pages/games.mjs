import { html, mdJoin } from "../lib/html.mjs";
import { LANGS } from "../lib/i18n.mjs";

// Games page: links to browser games hosted in their own repositories (this site stays free of runtime JavaScript).
function games(v) {
  const { t } = v;
  const body = html`<div class="page-head"><p class="eyebrow">${t("games.eyebrow")}</p><h1>${t("nav.games")}</h1><p class="lead">${t("games.lead")}</p></div><article class="work"><div class="work-meta"><span>${t("games.boardMeta")}</span></div><div><h2><a href="${t("games.boardUrl")}">${t("games.boardTitle")} ↗</a></h2><p>${t("games.boardDetail")}</p><p><a href="${t("games.boardUrl")}">${t("games.play")} ↗</a> · <a href="${t("games.sourceUrl")}">${t("games.source")} ↗</a></p></div></article>`;
  const md = mdJoin(
    `# ${t("nav.games")}`,
    t("games.lead"),
    `## ${t("games.boardTitle")}\n\n${t("games.boardMeta")}\n\n${t("games.boardDetail")}\n\n[${t("games.play")}](${t("games.boardUrl")}) · [${t("games.source")}](${t("games.sourceUrl")})`,
  );
  return v.page({ base: "/games/", title: t("nav.games"), active: "games", body, md, description: t("games.lead") });
}

export const gamesPages = (ctx) => LANGS.map((lang) => games(ctx.view(lang)));
