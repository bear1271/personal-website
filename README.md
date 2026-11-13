# Green Wang — Personal Website

Public source for Green (Sirun) Wang’s personal academic website.

The site is a static GitHub Pages website served at `https://sirunwang.com` from the root path (`/`). Its deployable artifact is `dist/`; no server-side runtime dependencies belong here.

## Build and check

One-time setup for the CV generator (the site itself needs no packages):

```powershell
python -m pip install -r requirements.txt
```

Then, after any content, style or build change:

```powershell
npm run verify
```

`verify` runs the three required steps in order — `python scripts/make_cv.py`, `npm run build`, `npm run check` — and each can also be run on its own.

For a local preview:

```powershell
npm start
```

Then open <http://127.0.0.1:4173/>.

## Where things live

See [docs/site-architecture.md](docs/site-architecture.md) for the full picture. In short:

- `content/` holds all copy: `profile.json` (profile, research, training, projects), `ui.json` (interface strings), `site.json` (navigation and origin), `pages/` (long-form pages), plus the notes manifest, categories and Poetics editions. Translatable text is written as `{ "en": …, "zh": … }`.
- `scripts/` holds the build (`build.mjs`, `lib/`, `pages/`), the checks (`check.mjs`), the preview server and the CV generator. It contains no page copy.
- `public/` is copied into the site unchanged: styles, images, the generated `cv.pdf`, and the notes PDFs/DOCX. `public/CNAME` keeps the custom domain in the deployed artifact.
- `dist/` is generated and uploaded by GitHub Actions; it is not committed.
- `local/` is an ignored private workspace for drafts, planning notes, references, and local QA material. See `local/README.md` locally.

## Maintenance

`AGENTS.md` is the repository’s working agreement for people and coding agents. It defines the source-of-truth files, generated-output rules, privacy boundaries, deployment contract, and required checks. Read it before making site changes.

The status of in-progress work comes from `content/profile.json`: while a paper’s `topic`, `mentor` or `abstract` is `null`, the pages, Markdown files, `llms.txt` and the CV say it is not yet determined, and setting the field removes that wording. Update the record’s own `status`, `description` and `availability` text at the same time; `npm run check` fails if they still claim something is pending. Earlier research is labeled as coursework and is not presented as publication.

Only public website content belongs in this repository. Do not add private CV sources, application records, internal notes, or personal identifiers.

## Licensing

Original website implementation code (build/check/preview scripts, CV-generation code, and original CSS and client-side code) is licensed under [MIT](LICENSE-CODE). Academic prose embedded in templates is content, not implementation code.

Original notes, prose, and diagrams authored by Green (Sirun) Wang are licensed under [CC BY 4.0](LICENSE-CONTENT.md). Personal photographs, portraits, institutional names/logos, and third-party materials are excluded. Third-party code, fonts, and libraries retain their own licenses and notices. Neither license grants rights to materials the site author does not own.

The repository-level license files are the single source for the copies the build places in `dist/`.

## Notes editorial workflow

Follow [NOTES_EDITORIAL.md](NOTES_EDITORIAL.md). Public reading editions must preserve the complete original notes rather than substitute abridged rewrites. English is the default; Chinese literary materials use Traditional Chinese with Chinese original names and appropriate English.

`content/public-note-editions.json` lists reviewed public reading editions: site-hosted full text and PDFs, or verified Drive destinations. Withdrawn editions are removed from the manifest. Only files referenced by a reviewed edition are deployed: `npm run check` fails on any orphan file, and unreviewed HTML/library source directories are excluded. Local originals and publication review material remain under ignored `local/` storage. A site-hosted edition can also link a Google Drive copy (berkeley.edu accounts only), recorded in `content/drive-links.json`; `npm run check` validates it.

The four Poetics handouts have complete reading text in `content/poetics/`, rendered by `scripts/pages/poetics.mjs`, with PDF editions and the original cited figure in `public/notes/poetics/`. These retain the original paragraph order, quotations, translations, bibliography and footnotes. Chinese is normalized to Traditional Chinese; unresolved source readings remain as in the handouts. They are course handouts, not publications. The edition date identifies publication preparation, not a substantive revision of the original notes.

`content/notes-categories.json` defines the bilingual Notes subjects and their stable routes. `scripts/pages/notes.mjs` renders the subject overview, complete catalog, and individual subject pages without client-side JavaScript. Public editions use a `categoryId` matching a subject's `id`. Empty subjects remain navigable and show that reading editions are in preparation; they do not expose archive files.
