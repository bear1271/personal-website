# Website working agreement

## Deployment contract

- Production URL: `https://sirunwang.com`
- Production base path: `/`
- Hosting: GitHub Pages
- The site is static. Do not add a server, API routes, databases, or other runtime dependencies.

## Source, generated files, and deployment

- Edit public content in `content/` — `profile.json` (profile, research, training, projects), `ui.json` (interface strings), `site.json` (navigation, origin) and `pages/` — presentation assets in `public/`, and build behavior in `scripts/`. `docs/site-architecture.md` explains the layout; page copy never goes in `scripts/`.
- `npm run build` writes the deployable site to `dist/`. Do not hand-edit generated output.
- `python scripts/make_cv.py` regenerates `public/cv.pdf` before the site build (install its dependency once with `python -m pip install -r requirements.txt`).
- GitHub Actions deploys the `dist/` artifact from `main`. Keep `public/CNAME` in the build output so the custom domain is included in every deployment.

## Required checks

After a public-content, build, style, or deployment change, run:

```powershell
python scripts/make_cv.py
npm run build
npm run check
```

`npm run verify` runs the same three steps in one command.

Before committing, review the generated-file diff. Do not commit files from `local/`, `qa/`, logs, or `dist/`.

## Local workspace

`local/` is the private, ignored workspace for drafts, decision notes, research scratch files, and local QA material. It must never contain publishable source of record; move final public content into the tracked source locations above.

## Content safeguards

- Preserve the distinction between course research, in-progress work, and publications. Status wording (topic, mentor, abstract, publication status) comes from `content/profile.json`; do not hand-write it in templates.
- Every translatable string needs English and Chinese text; the build lists any Chinese text still missing.
- Do not add private records, application materials, unredacted identifiers, or private CV source files.
- Keep public pages accessible without client-side JavaScript and retain the Markdown and structured-data outputs produced by the build.
