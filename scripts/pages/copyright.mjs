import { html, mdJoin } from "../lib/html.mjs";
import { LANGS } from "../lib/i18n.mjs";

function copyright(v, policy) {
  const { t } = v;
  const links = html`<p><a rel="license" href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a> · <a href="https://creativecommons.org/licenses/by/4.0/legalcode.en">${t("copyright.legalCode")}</a> · <a href="/LICENSE-CODE.txt">${t("copyright.mit")}</a> · <a href="/LICENSE-CONTENT.md">${t("copyright.scope")}</a></p>`;
  const body = html`<div class="page-head"><h1>${policy.title}</h1><p class="lead">${policy.intro}</p></div><article class="article">${policy.sections.map(([heading, text]) => html`<h2>${heading}</h2><p>${text}</p>`)}${links}</article>`;
  const md = mdJoin(
    `# ${policy.title}`,
    policy.sections.map(([heading, text]) => `## ${heading}\n\n${text}`).join("\n\n"),
    `[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · [MIT](/LICENSE-CODE.txt) · [${t("copyright.scopeShort")}](/LICENSE-CONTENT.md)`,
  );
  return v.page({ base: "/copyright/", title: policy.title, active: null, body, md, description: policy.intro });
}

// content/licensing.json holds one policy per language, keyed by language code.
export const copyrightPages = (ctx) => LANGS.map((lang) => copyright(ctx.view(lang), ctx.licensing[lang]));
