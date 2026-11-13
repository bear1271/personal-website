// Small pieces of markup and Markdown shared by several pages.
import { html } from "./html.mjs";

export const portrait = (v, className) =>
  html`<span class="${className}"><img src="/portrait.jpg" alt="${v.p.portraitAlt}" width="640" height="915"></span>`;

/** "[Research](/research/index.md) · [Notes](…) …" for the end of Markdown pages. */
export function mdNav(v) {
  const links = v.ctx.site.nav
    .filter((item) => item.id !== "home")
    .map((item) => `[${v.t(`nav.${item.id}`)}](${v.r(item.route)}index.md)`);
  links.push(`[${v.t("md.agents")}](${v.r("/for-agents/")}index.md)`);
  return links.join(" · ");
}

export const unique = (items) => [...new Set(items)];
