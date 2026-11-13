# Site architecture

A static site built by plain Node scripts (no npm dependencies) and deployed to GitHub Pages. English and Chinese pages are produced by the same templates; every word of copy lives in `content/`, never in the scripts.

## Layout

```
content/              everything the site says
  profile.json          identity, research questions, training, projects, experience
  ui.json               interface strings (labels, headings, status wording), by dotted key
  site.json             production origin, navigation, footer links, retired URLs
  pages/                long-form copy: for-agents.json (blocks), llms.template.txt
  licensing.json        copyright page, one policy per language
  notes-categories.json Notes subjects
  public-note-editions.json   reviewed reading editions (site-hosted or Drive)
  drive-links.json      optional Google Drive copies of site-hosted editions (hand-edited)
  poetics/              full text of the Poetics handouts
public/               copied into the site unchanged: style.css, images, CNAME, cv.pdf, note PDFs/DOCX
scripts/
  build.mjs             orchestrator: load content, collect pages, write dist/
  check.mjs             validates dist/ against the rules in AGENTS.md
  serve.mjs             local preview of dist/
  make_cv.py            generates public/cv.pdf (needs requirements.txt)
  lib/                  html (auto-escaping templates), i18n, context, layout, blocks, projects, fragments, discovery
  pages/                one module per page type (home, research, about, leadership, notes, poetics, agents, copyright)
```

## Content model

- **Translatable text** is a leaf object, `{ "en": "…", "zh": "…" }`. Plain strings are language-neutral (names, course codes, URLs) and shown as-is. A Chinese text that is missing falls back to English and is listed at the end of `npm run build`.
- **Interface strings** live in `content/ui.json` and are used as `t("section.key")`. A missing key, or a key without both languages, fails the build.
- **Project status is data.** `topic`, `mentor` and `abstract` on an in-progress paper are `null` until decided; the wording derived from them (detail-page rows and notices, card tags, status lists in Markdown, `llms.txt` and the CV) updates by itself when you set the field. The record's hand-written text (`status`, `description`, `availability`) does not, so edit those in the same record; `npm run check` fails if they still claim something is pending after the field is set.
- `experience[].showOnLeadership` chooses which roles appear on the Leadership page; the Berkeley Undergraduate Journal role is hidden on purpose.
- Machine-written manifests (`public-note-editions.json`, `poetics/*.json`) keep the snake_case keys produced by the private tooling in `local/`; hand-edited content uses camelCase.
- A site-hosted edition can also have a Google Drive copy. It is recorded by hand in `content/drive-links.json` (`href`, `access`, `access_domain`, `access_verified`), not in the manifest, because the private tooling regenerates the manifest entries and would drop extra fields. The check requires a `drive.google.com` file link, access limited to `berkeley.edu`, and the link shown on both language pages and on the subject page.
- The Poetics reading editions use Traditional Chinese labels (`poetics.*` in `ui.json`) on purpose, although the rest of the Chinese interface is Simplified.

## Build flow

`build.mjs` loads all content once (`lib/context.mjs`), asks each module in `pages/` for its page records, then renders them:

1. A page record is `{ lang, route, base, title, description, active, body, md, schema? }`. `base` is the English route; the Chinese twin is `/zh` + base, and the language switch, `hreflang` links and canonical URL are derived from it.
2. `lib/layout.mjs` wraps `body` in the shell (head metadata, header, navigation, footer) and writes `index.html`; `md` becomes the `index.md` companion.
3. Modules receive a per-language *view* (`view.t`, `view.p`, `view.r`, …), so templates never branch on language.
4. Discovery files (`profile.json`, `research.json`, `llms.txt`, `sitemap.xml`, `robots.txt`) are generated in `lib/discovery.mjs`. The public JSON keeps its English-only shape.
5. Retired URLs listed in `site.json` become small redirect stubs (GitHub Pages cannot send HTTP redirects).

Templates use the `html` tagged template in `lib/html.mjs`: interpolated values are escaped unless they are `raw(...)` or another `html` result.

## Checks

`npm run check` validates the built site rather than today's wording: one `<h1>` and a description on every page; canonical URLs; a working language twin, switch and `hreflang` for every page; link and anchor integrity; no inline styles or runtime JavaScript; every Markdown companion; sitemap parity; status wording that matches `topic`/`mentor`/`abstract` in the content; course work never labelled a publication; all notes in the manifest (site-hosted and Drive) listed on the right pages with their files; no orphan files; no private-material patterns in the pages or in `content/`, including a tripwire for graduation dates (the site states none: a "Class of" year, or a term more than a year past the edition date); and a CV whose edition date matches the profile.

## Deployment

GitHub Actions runs `npm run verify` (CV, build, check), uploads `dist/` and deploys it through GitHub Pages from `main`. Pull requests run the same build and checks without deploying. The workflow pins Node and the CV dependency. `public/CNAME` keeps `sirunwang.com` in the artifact; the production URL is `https://sirunwang.com/` and no server-side runtime is used.

`dist/` (generated) and `local/` (private drafts, QA, source material) are ignored by Git and never committed.
