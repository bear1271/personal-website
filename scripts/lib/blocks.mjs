// Long-form page content authored as a list of blocks in content/pages/*.json.
// One source renders to both HTML and Markdown, so the two can never drift apart.
//
//   { "h2": "…" } { "h3": "…" } { "p": "inline **Markdown** with [links](/x/)" }
//   { "ul": ["…"] } { "table": { "head": [...], "rows": [[...]] } }
//   plus any page-specific type passed in `custom` (e.g. generated project lists).
//
// Text may contain {placeholders}, filled from `vars`.
import { html, inline } from "./html.mjs";

const fill = (text, vars) =>
  text.replace(/\{(\w+)\}/g, (_, key) => {
    if (!(key in vars)) throw new Error(`Unknown placeholder {${key}} in page content`);
    return vars[key];
  });

/** Returns { html: [...], md: [...] } — one entry per block. */
export function renderBlocks(blocks, { vars = {}, custom = {} } = {}) {
  const rendered = blocks.map((block) => {
    const [type] = Object.keys(block);
    const value = block[type];
    if (custom[type]) return custom[type](value);
    const text = (s) => fill(s, vars);
    switch (type) {
      case "h2":
        return { html: html`<h2>${text(value)}</h2>`, md: `## ${text(value)}` };
      case "h3":
        return { html: html`<h3>${text(value)}</h3>`, md: `### ${text(value)}` };
      case "p":
        return { html: html`<p>${inline(text(value))}</p>`, md: text(value) };
      case "ul":
        return {
          html: html`<ul>${value.map((item) => html`<li>${inline(text(item))}</li>`)}</ul>`,
          md: value.map((item) => `- ${text(item)}`).join("\n"),
        };
      case "table":
        return {
          html: html`<table class="agent-table"><thead><tr>${value.head.map((cell) => html`<th>${text(cell)}</th>`)}</tr></thead><tbody>${value.rows.map((row) => html`<tr>${row.map((cell) => html`<td>${inline(text(cell))}</td>`)}</tr>`)}</tbody></table>`,
          md: [`| ${value.head.join(" | ")} |`, `| ${value.head.map(() => "---").join(" | ")} |`, ...value.rows.map((row) => `| ${row.map(text).join(" | ")} |`)].join("\n"),
        };
      default:
        throw new Error(`Unknown content block "${type}"`);
    }
  });
  return { html: rendered.map((b) => b.html), md: rendered.map((b) => b.md) };
}
