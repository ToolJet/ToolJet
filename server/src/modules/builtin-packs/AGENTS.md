# builtin-packs module

Serves the **component packs** that ship with ToolJet (shadcn, Ant Design, Material UI). Each release builds every pack
listed in `packs/builtin.json` with the custom-component CLI (`packs/build-builtin.mjs`, run by every Dockerfile) into
`server/builtin-packs/<pack>/`. The frontend draws a pack's components as `PackComponent` widgets.

## Domain terms

- **Pack** — a folder of components built from `packs/<pack>/` (`index.js`, `index.css`, `manifest.json`, `builtin.json`).
- **Hash** — the first 16 hex of a sha256 over the pack's files; part of every file URL, so an upgrade changes the URL.

## Key files

| File | Role |
|---|---|
| `builtin-packs.ts` | Reads the packs folder once (`loadBuiltinPacks`), serves one file at the current hash (`readBuiltinPackFile`) |
| `controller.ts` | `GET /builtin-packs` lists packs; `GET /builtin-packs/:pack/:hash/:file` serves a file, immutable-cached |
| `module.ts` | Plain module, controller only on the main import |

## Edition split

- None: CE code in every edition. No licence, login or database row — released and public apps load packs too.

## Invariants & gotchas

- Only `index.js`, `index.css` and `manifest.json` are served, and only at the hash the server currently ships; an old
  hash is a 404, never stale content.
- The folder is read once per process; it only changes with a release. `BUILTIN_PACKS_PATH` overrides where it is.
- Not part of custom-component libraries: no versions, pins, revisions or workspace scoping.

## Related modules

- `custom-component-libraries` — uploaded libraries; shares only the CLI build and the SDK, not storage or routes.
