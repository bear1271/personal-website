// HTML building blocks. Interpolated values are escaped by default; only `raw()` and
// the result of `html` itself are trusted, so composing fragments never double-escapes.

const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ENTITIES[c]);

/** Markup that has already been written/escaped and must be inserted as-is. */
export class Raw {
  constructor(value) {
    this.value = String(value);
  }
  toString() {
    return this.value;
  }
}
export const raw = (value) => new Raw(value);

function render(value) {
  if (value === null || value === undefined || value === false) return "";
  if (value instanceof Raw) return value.value;
  if (Array.isArray(value)) return value.map(render).join("");
  return esc(value);
}

/** Tagged template: html`<p>${text}</p>` escapes `text`; nested html`` results pass through. */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += render(values[i]) + strings[i + 1];
  return new Raw(out);
}

/** Inline Markdown subset used in content strings: `code`, **bold** and [text](url). */
export function inline(source) {
  return raw(
    esc(source)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>'),
  );
}

/** Blank-line separated text -> one <p> per paragraph. */
export const paragraphs = (text) => html`${String(text).split("\n\n").map((part) => html`<p>${part}</p>`)}`;

/** JSON for a <script type="application/ld+json"> block. */
export const json = (value) => JSON.stringify(value, null, 2).replace(/</g, "\\u003c");

/** Join Markdown blocks with blank lines, skipping empty ones. */
export const mdJoin = (...blocks) =>
  blocks
    .flat()
    .filter((block) => block !== null && block !== undefined && block !== false && block !== "")
    .join("\n\n");
