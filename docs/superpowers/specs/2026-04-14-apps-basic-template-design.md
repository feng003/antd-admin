# Design: `apps/basic` template (from `with-lingui`, English-only)

## 1. Summary

Add a new workspace app `apps/basic` created by copying `apps/with-lingui` and removing all Lingui-based internationalization, language switching UI, and related tooling. User-facing strings are **hard-coded English**. Ant Design uses a **fixed** `en_US` locale via `ConfigProvider`. Root `README.md` documents both templates.

## 2. Goals and non-goals

**Goals**

- Parity with `with-lingui` for product features: auth, RBAC, menus, CRUD, MSW, Playwright, build/lint stack.
- No `@lingui/*` dependencies, no `.po` catalogs, no `i18n:*` npm scripts, no Lingui Vite/SWC plugins.
- No runtime language switcher; `document.documentElement.lang` set to `en` once at app shell level.

**Non-goals**

- No shared `packages/*` extraction to deduplicate `basic` vs `with-lingui`.
- No changes to `with-lingui` behavior unless a follow-up explicitly requests README or cross-app consistency edits beyond what is listed here.

## 3. Recommended approach

**Copy-and-subtract (directory fork)** — duplicate `apps/with-lingui` → `apps/basic`, then delete Lingui artifacts and replace `t`/`msg` usage with equivalent English strings. **Rationale:** Clear mapping from source to target, predictable Turbo/pnpm layout (`apps/*` already wired), minimal architectural risk.

Alternatives rejected: shared core package (too large for this request); documentation-only template (does not deliver a runnable app).

## 4. Language and Ant Design

- All UI copy, `aria-label`s, menu titles, table empty states, etc.: **English literals** in TSX.
- `ConfigProvider`: `import enUS from "antd/locale/en_US"` and `locale={enUS}` (static, not from store).
- Remove `zh_CN` imports and any `locale` map keyed by user preference.

## 5. File and configuration changes

### 5.1 Remove entirely

- `lingui.config.ts`
- `src/lingui.d.ts`
- `src/locales/` (compiled and source catalogs as present in source tree)

### 5.2 `package.json` (`apps/basic`)

- Remove dependencies: `@lingui/core`, `@lingui/react`, `@lingui/cli`, `@lingui/swc-plugin`, `@lingui/vite-plugin`.
- Remove scripts: `i18n:extract`, `i18n:compile` (if present).
- Set `name` to a **unique** workspace package name (e.g. `antd-admin-basic`). The source app currently uses `antd-admin`; duplicate `name` values across `apps/*` can confuse tooling, so `basic` must not reuse the same `name`.

### 5.3 `vite.config.ts`

- Remove `lingui()` from plugins and `@lingui/swc-plugin` from React plugin options.

### 5.4 Entry and root

- **`src/main.tsx`:** Remove Lingui `i18n` load/activate and `.po` imports; keep React DOM render unchanged otherwise.
- **`src/routes/__root.tsx`:** Remove `I18nProvider`, `i18n` import/effects; wrap tree with `ConfigProvider` using fixed `enUS`; set `document.documentElement.lang = "en"` once (e.g. `useLayoutEffect` on mount or equivalent pattern already used in codebase).

### 5.5 Settings store

- Remove `Locale` type, `locale`, `setLocale`, and `locale` from `partialize`.
- Keep `darkMode`, `sidebarCollapsed`, and their actions unchanged.
- **Persist storage name:** Prefer a **distinct** `name` in `createPersistentStore` options (e.g. `settings-storage-basic`) so localStorage from `with-lingui` and `basic` never collide when developers alternate apps on the same origin during local testing.

### 5.6 Components and routes

Replace Lingui in every file that currently imports `useLingui` / `msg` / macro APIs with plain strings. Known touchpoints from repository scan:

- `src/routes/login/index.tsx` — remove language toggle UI and related store usage.
- `src/components/Layout/Header/index.tsx` — remove language toggle.
- `src/components/Layout/Sidebar/index.tsx` — replace `msg`/`t` menu labels with English strings.
- `src/components/Layout/AppFooter/index.tsx`, `NotFound`, `DataTable/DataTableEmpty.tsx`
- `src/routes/_auth/dashboard`, `403`, `users` (+ `-Toolbar`, `-FormModal`)

### 5.7 Mock data

- No i18n requirement; keep mock user names/emails as-is unless an assertion or UI string assumes Chinese (none identified in E2E for locale). If any visible mock field is Chinese-only for demos, translate to English for consistency with **A**.

## 6. Error handling and edge cases

- **Missing translations:** N/A after removal.
- **Hydration / SSR:** Current app is client Vite SPA; no change to strategy.
- **Table `locale` prop:** `DataTable` may still merge `restTableProps.locale`; default empty text remains English via updated `DataTableEmpty` copy. No user-controlled Antd locale switch.

## 7. Testing and acceptance

- `vp build` (or project-standard build) succeeds for `apps/basic`.
- `vp run lint` (or equivalent) passes.
- Playwright suite for `apps/basic` passes; update selectors only if any depended on Chinese UI text (grep during implementation).
- Manual smoke: login, dashboard, users list, 403, theme toggle, sidebar collapse — all labels English.

## 8. Documentation

- **`apps/basic/README.md` (if present after copy):** State English-only, no Lingui, pointer to `with-lingui` for i18n variant.
- **Root `README.md`:** Add a short "Templates" (or equivalent) subsection: describe `apps/with-lingui` vs `apps/basic`, how to run each (`vp dev` from app directory or documented `pnpm`/`turbo` filter), remove or soften global wording that implies a single Lingui-only stack if it would mislead (e.g. tech table row for i18n should clarify it applies to the Lingui app).

## 9. Maintenance note (drift control)

Two apps will duplicate business logic until a future extraction. **Convention for this repo:** feature and bugfix work lands in **`with-lingui` first** unless the change is basic-only; port to `basic` in the same PR when behavior should stay aligned, or document exception. This is guidance for contributors, not enforced by tooling.

## 10. Implementation handoff

After this spec is approved in review, use the **writing-plans** skill to produce a step-by-step implementation plan (ordered edits, verification commands, PR checklist).
