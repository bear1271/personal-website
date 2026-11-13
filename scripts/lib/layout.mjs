// The page shell: head metadata, header/nav/footer, language switch, base-path rewriting.
import { html, json, raw } from "./html.mjs";
import { HTML_LANG, localize } from "./i18n.mjs";

/** Root-relative links become base-path-relative when the site is hosted below "/". */
function rebase(ctx, text, kind) {
  if (!ctx.basePath) return text;
  if (kind === "md") return text.replaceAll("](/", `](${ctx.basePath}/`);
  return text.replaceAll('href="/', `href="${ctx.basePath}/`).replaceAll('src="/', `src="${ctx.basePath}/`);
}

/**
 * page: { lang, route, base, title, description, active, body, schema?, markdown?, peer? }
 *   base    English route; the other language's page is localize(base)
 *   active  id of the nav item to highlight (see content/site.json)
 *   peer    override for the language switch target (null hides it)
 */
export function renderDocument(ctx, page) {
  const v = ctx.view(page.lang);
  const { p, t, r, zh } = v;
  const { route } = page;
  const peer = page.peer !== undefined ? page.peer : localize(page.base, v.other);
  const description = page.description ?? p.bio;
  const person = {
    "@type": "Person",
    "@id": ctx.url("/#person"),
    name: p.name,
    alternateName: p.alternateNames,
    url: ctx.url("/"),
    description: p.bio,
    email: `mailto:${p.email}`,
    affiliation: { "@type": "CollegeOrUniversity", name: p.institution },
    knowsAbout: p.interests,
  };
  const entity = page.schema ?? {
    "@type": "WebPage",
    "@id": ctx.url(route),
    name: page.title,
    about: { "@id": ctx.url("/#person") },
    dateModified: ctx.updated,
  };
  const nav = ctx.site.nav.map(
    (item) => html`<a href="${r(item.route)}"${page.active === item.id ? raw(' aria-current="page"') : ""}>${t(`nav.${item.id}`)}</a>`,
  );
  const footerLinks = ctx.site.footer.map(
    (link) => html`<a href="${link.localized ? r(link.route) : link.route}">${t(`footer.${link.id}`)}</a>`,
  );
  const markdownLink = page.markdown === false ? "" : html`<link rel="alternate" type="text/markdown" href="${route}index.md" title="Markdown version">`;
  const languageSwitch = peer
    ? html`<a class="language-switch" href="${peer}" lang="${HTML_LANG[v.other]}" aria-label="${t("layout.switchLabel")}">${t("layout.switchText")}</a>`
    : "";

  const document = html`<!doctype html>
<html lang="${v.htmlLang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${page.title} · ${p.shortName}</title><meta name="description" content="${description}">
<meta name="theme-color" content="#f8f7f3"><link rel="canonical" href="${ctx.url(route)}">
<meta property="og:title" content="${page.title} · ${p.shortName}"><meta property="og:description" content="${description}"><meta property="og:type" content="website"><meta property="og:url" content="${ctx.url(route)}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css">
${peer ? html`<link rel="alternate" hreflang="${HTML_LANG[v.other]}" href="${ctx.url(peer)}"><link rel="alternate" hreflang="${v.htmlLang}" href="${ctx.url(route)}">` : ""}
<link rel="alternate" type="application/json" href="/profile.json" title="Structured profile">${markdownLink}
<script type="application/ld+json">${raw(json({ "@context": "https://schema.org", "@graph": [person, entity] }))}</script></head>
<body><a class="skip" href="#main">${t("layout.skip")}</a><div class="container">
<header class="header"><a class="brand" href="${r("/")}">${p.shortName}<span aria-hidden="true"> / </span></a><div class="header-actions"><nav aria-label="${t("layout.navLabel")}">${nav}</nav>${languageSwitch}</div></header>
<main id="main">${page.body}</main>
<footer class="footer"><span>© ${ctx.site.copyrightYear} ${p.name} <span aria-hidden="true">·</span> ${t("layout.updated")} <time datetime="${ctx.updated}">${v.date(ctx.updated, "short")}</time></span><div class="footer-links">${footerLinks}<a href="mailto:${p.email}">${t("layout.email")} ↗</a></div></footer>
</div></body></html>`;
  return rebase(ctx, String(document), "html");
}

export function renderMarkdown(ctx, page) {
  return rebase(ctx, `${page.md}\n\nContent updated: ${ctx.updated}.\n`, "md");
}

/** A static stand-in for a retired URL (GitHub Pages cannot send HTTP redirects). */
export function renderRedirect(ctx, { to, lang }) {
  const target = ctx.url(to);
  const document = html`<!doctype html>
<html lang="${HTML_LANG[lang]}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Redirecting</title><meta name="robots" content="noindex"><link rel="canonical" href="${target}"><meta http-equiv="refresh" content="0; url=${ctx.basePath}${to}">
</head><body><p><a href="${to}">${target}</a></p></body></html>`;
  return rebase(ctx, String(document), "html");
}
