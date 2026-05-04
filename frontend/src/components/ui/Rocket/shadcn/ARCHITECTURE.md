# Rocket/shadcn — DO NOT EDIT

This directory contains shadcn/ui primitives installed via the shadcn CLI.

**Never hand-edit files in this directory.**

All files here are managed by:

```bash
npx shadcn@latest add <component>
```

followed immediately by the `shadcn-to-v3` skill, which converts the
installed output from Tailwind v4 syntax to v3.4 with the `tw-` prefix.

## Why

- shadcn installs are reproducible — regenerate at any time by re-running `npx shadcn@latest add`
- Hand-edits would be silently overwritten on the next install
- All customisation lives in the Rocket HOC layer at `../Name/Name.jsx`

## Adding a new primitive

1. Run: `npx shadcn@latest add <component>` from `frontend/`
2. Run the `shadcn-to-v3` skill to convert the output
3. Wrap it in a Rocket HOC at `src/components/ui/Rocket/{Name}/{Name}.jsx`
4. Export from `src/components/ui/Rocket/index.js`
