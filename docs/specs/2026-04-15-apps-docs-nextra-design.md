# Design: Documentation site (`apps/docs`) with Nextra 4

## 1. Summary

Add a new workspace package at `apps/docs` that hosts a **usage-focused documentation site** for developers who choose and run the **`apps/basic`** or **`apps/with-lingui`** templates. The stack is **Next.js (App Router) + Nextra 4** with the **Documentation theme**. Content is primarily **Chinese** in the first iteration. The site is isolated from template runtime (no auth/MSW in the doc app); it links to repository READMEs and app directories where appropriate.

## 2. Goals and non-goals

**Goals**

- Explain monorepo layout, how to pick a template, install, run, and common configuration.
- Provide a **comparison** of `basic` vs `with-lingui` (Lingui, locales, package names, persistence keys, etc.).
- Document features and conventions (auth, RBAC, URL state, MSW, E2E) with notes when behavior differs between templates.
- Integrate with the monorepo: `pnpm` workspace, `turbo` `build`/`dev` where applicable, and a pointer from the root `README.md` Templates section.

**Non-goals (first iteration)**

- End-user “how to use the admin UI” manuals (previously scope D).
- Duplicating full contributor/PR workflows; link to root `README.md` / `CONTRIBUTING.md` if present instead.
- Unified meta-framework across docs and templates (docs stays on Next.js+Nextra; templates stay on Vite+).
- Automated link crawling, Lighthouse, or E2E against the doc site unless explicitly requested later.

## 3. Audience and language

- **Primary audience (B):** Developers evaluating or adopting the templates.
- **Language:** Simplified Chinese for main prose in v1; English can be added later as a separate milestone.

## 4. Information architecture (suggested)

| Section | Purpose |
| ------- | ------- |
| Home | One-screen overview of the monorepo and the two templates. |
| Quick start | Node/`vp`, choosing `apps/basic` or `apps/with-lingui`, install, dev server, default credentials; align with root README or link to it as source of truth for commands. |
| Template comparison | Side-by-side table: Lingui, languages, Ant Design locale behavior, `package.json` name, settings storage key, etc. |
| Features & conventions | Auth, RBAC, URL-first table state, MSW, Playwright; call out template-only differences in footnotes. |
| Configuration | Env vars, mock toggles, build/preview; keep tables short to avoid dual-maintenance drift. |

## 5. Technology choices

| Item | Choice |
| ---- | ------ |
| Framework | **Nextra 4** on **Next.js** using the **App Router** (required by Nextra 4). |
| Theme | **Documentation theme** (official). |
| Location | `apps/docs/` as a private workspace package (e.g. `name`: `antd-admin-docs` or equivalent naming consistent with the repo). |
| Coexistence | `apps/basic` and `apps/with-lingui` remain **Vite+** apps; `apps/docs` uses **Next.js** scripts (`next dev`, `next build`, `next start` or Nextra-documented equivalents). |

Exact **Next.js** and **Nextra** semver pins are left to the implementation plan after `pnpm create` / official quick start, to match current compatible releases.

## 6. Monorepo and Turbo integration

- **Workspace:** Already includes `apps/*`; new package under `apps/docs` is picked up automatically once `package.json` exists.
- **Turbo:** Extend `turbo.json` tasks so `apps/docs` has a defined `build` output (e.g. Next `.next` and any Nextra output paths) and non-cached `dev` if consistent with other apps.
- **Ports:** Document default ports explicitly (e.g. Next `3000` vs Vite `5173`) to avoid confusion.
- **Root README:** Add a line under Templates (or equivalent) pointing to how to run the doc site locally (and a placeholder for a deployed URL if applicable later).

## 7. Deployment and `basePath`

- First iteration defines **one** default deployment shape in the implementation plan:
  - either **root path** hosting, or
  - **subpath** (e.g. `/docs/`) with explicit `basePath` / asset configuration in Next/Nextra config.

Hosting provider (Vercel, GitHub Pages, etc.) is **optional** in v1; the spec only requires a reproducible static or Node build output as documented by Nextra/Next for the chosen mode.

## 8. Error handling and quality bar

- **`next build` (or documented production build) must pass** with zero errors before considering the milestone done.
- MDX/MD compile errors must surface at build time, not be swallowed at runtime.
- Broken internal links: best-effort manual review in v1; no mandatory automated link checker in scope.

## 9. Testing and acceptance

| Check | Required |
| ----- | -------- |
| From repo root, documented `pnpm`/`turbo` command builds `apps/docs` | Yes |
| Local dev shows home + at least two sidebar sections | Yes |
| Root README links to doc site usage | Yes |
| Link checker / Lighthouse / Playwright for docs | No (v1) |

## 10. Spec file location note

This design document lives under `docs/specs/` because `./docs/superpowers` is listed in `.gitignore` in this repository; superpowers default path would require `git add -f` or ignore rule changes. Implementation plans may still reference `docs/superpowers/plans/` if the team later adjusts ignore rules.

## 11. Implementation handoff

After the user approves this written spec, invoke the **writing-plans** skill to produce a step-by-step implementation plan (scaffold commands, exact config files, Turbo edits, README edits, and verification commands).
