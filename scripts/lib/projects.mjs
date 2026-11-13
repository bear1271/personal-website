// Cards, status wording and Markdown lines for research projects.
// Everything about "what is still open" is derived from the data (topic / mentor / abstract
// being null), so changing a project's status means editing content/profile.json only.
import { html } from "./html.mjs";

export const projectRoute = (v, x) => v.r(`/research/${x.id}/`);

/** Clauses for what is still open on an in-progress paper, e.g. "topic not yet determined". */
export function pendingClauses(v, x) {
  return [
    x.topic == null && v.t("projects.statusTopic"),
    x.mentor == null && v.t("projects.statusMentor"),
    x.abstract == null && v.t("projects.statusAbstract"),
  ].filter(Boolean);
}

/** "Topic not yet determined; mentor not yet confirmed; abstract coming soon." ("" when nothing is open) */
export function pendingSentence(v, x) {
  const clauses = pendingClauses(v, x);
  if (!clauses.length) return "";
  const text = clauses.join(v.semi);
  return text.charAt(0).toUpperCase() + text.slice(1) + v.stop;
}

export const ongoingCard = (v, x) =>
  html`<article class="work"><div class="work-meta"><span>${v.term(x.period)}</span><span>${v.t("projects.inProgress")}</span></div><div><h3><a href="${projectRoute(v, x)}">${x.title}</a></h3><p>${x.description}</p><span class="tag">${x.type}${x.abstract == null ? html` · ${v.t("projects.abstractSoon")}` : ""}</span></div><span class="arrow" aria-hidden="true">↗</span></article>`;

export const courseCard = (v, x) =>
  html`<article class="work"><div class="work-meta"><span>${v.term(x.period)}</span><span>${x.type}</span></div><div><h3><a href="${projectRoute(v, x)}">${x.title}</a></h3><p>${x.description}</p><span class="tag">${x.area}</span></div><span class="arrow" aria-hidden="true">↗</span></article>`;

export const ongoingMdItem = (v, x) =>
  `- [${x.title}](${projectRoute(v, x)}index.md) — ${x.type}${v.comma}${v.term(x.period)}${v.stop} ${x.description} ${pendingSentence(v, x)} ${x.availability}`.replace(/ {2,}/g, " ").trim();

export const courseMdItem = (v, x) =>
  `- [${x.title}](${projectRoute(v, x)}index.md) — ${x.type}${v.comma}${v.term(x.period)}${v.stop} ${x.description} ${x.availability}`;
