// Full reading editions of the Poetics handouts (content/poetics/*.json).
// The text is stored as reviewed HTML (entities already encoded), so it is inserted as-is;
// scripts/check.mjs verifies that every source paragraph reaches the page unchanged.
import { html, mdJoin, raw } from "../lib/html.mjs";
import { LANGS } from "../lib/i18n.mjs";

function markdownText(block) {
  return block.html
    .replace(/<sup><a[^>]*>(\d+)<\/a><\/sup>/g, "[^$1]")
    .replace(/<br>/g, "\n")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&"); // last, so "&amp;lt;" is not decoded twice
}

function edition(v, e) {
  const { t, r } = v;
  let section = 0;
  const toc = e.blocks.filter((b) => b.kind === "h2").map((b, i) => html`<li><a href="#section-${i}">${b.text}</a></li>`);
  const blocks = e.blocks.map((b) =>
    b.kind === "image"
      ? html`<figure><img src="${b.src}" alt="${b.alt}"><figcaption>${b.alt}</figcaption></figure>`
      : b.kind === "h2"
        ? html`<h2 id="section-${section++}">${raw(b.html)}</h2>`
        : html`<p>${raw(b.html)}</p>`,
  );
  const footnotes = e.footnotes.length
    ? html`<section class="poetics-footnotes"><h2>${t("poetics.footnotes")}</h2><ol>${e.footnotes.map((n) => html`<li id="fn-${n.id}" value="${n.id}">${n.text} <a href="#ref-${n.id}" aria-label="${t("poetics.backToText")}">↩</a></li>`)}</ol></section>`
    : "";
  const body = html`<div class="notes-breadcrumb"><a href="${r("/notes/")}">${t("poetics.notes")}</a><span>/</span><a href="${r("/notes/poetics-comparative-literature/")}">${t("poetics.category")}</a></div><div class="page-head poetics-head"><p class="eyebrow">${e.author} · ${e.course} · ${t("poetics.handout")}</p><h1>${e.title}</h1><p class="lead">${e.abstract}</p><a href="/notes/poetics/${e.id}.pdf">${t("poetics.downloadPdf")} ↓</a> · <a href="/notes/poetics/${e.id}.docx" download>${t("poetics.downloadDocx")} ↓</a></div><div class="poetics-layout"><nav class="poetics-toc" aria-label="${t("poetics.toc")}"><p class="eyebrow">${t("poetics.toc")}</p><ol>${toc}</ol></nav><article class="poetics-body" lang="zh-Hant"><p class="poetics-editorial">${e.editorial_note}</p>${raw(blocks.map(String).join("\n"))}${footnotes}<p class="poetics-editorial">${e.attribution_note}</p><p class="note-meta">${t("poetics.edition")} · ${e.edition_date}</p></article></div>`;
  const md = mdJoin(
    `# ${e.title}`,
    `${e.author} · ${e.course}`,
    `[PDF](/notes/poetics/${e.id}.pdf) · [${t("poetics.mdDocx")}](/notes/poetics/${e.id}.docx)`,
    e.editorial_note,
    e.blocks.map((b) => (b.kind === "image" ? `![${b.alt}](${b.src})` : (b.kind === "h2" ? "## " : "") + markdownText(b))),
    e.footnotes.length ? [`## ${t("poetics.footnotes")}`, e.footnotes.map((n) => `[^${n.id}]: ${n.text}`)] : [],
    e.attribution_note,
  );
  return v.page({ base: `/notes/poetics/${e.id}/`, title: e.title, active: "notes", body, md, description: e.abstract });
}

export const poeticsPages = (ctx) => ctx.poetics.flatMap((e) => LANGS.map((lang) => edition(ctx.view(lang), e)));
