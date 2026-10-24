# tooljet-shadcn-library

shadcn/ui-style components for ToolJet, built as a **custom component library** (not native widgets)
with the `tooljet library` CLI. Radix primitives + plain CSS; colors follow the ToolJet app theme.

## Components (20)

| Group | Components |
| --- | --- |
| Inputs | Button, Input, Textarea, Select, Checkbox, Switch, RadioGroup, Slider, ToggleGroup, OtpInput |
| Display | Badge, Alert, Avatar, Progress, Skeleton, Stat |
| Structure / overlays | Tabs, Accordion, Dialog, DropdownMenu |

Each component's Inspector props, events and actions come from its `ToolJet.use*` calls
(see `dist/manifest.json` after a build). Default drop sizes are set with `useComponentSettings`
so the widget box fits the content (no scrolling).

## Commands

```bash
npm install
npm run lib:build     # tooljet library build → dist/ (local only, no upload)
npm run demo          # build + serve; open http://127.0.0.1:5179/demo/ (?all for all 20)
npm run lib:publish   # upload a revision to ToolJet (not done yet)
```

The demo copies ToolJet's vendored React into `demo/vendor/` (git-ignored); copy it from
`ToolJet/frontend/assets/custom-components/vendor/` on a fresh clone.

## Runtime notes

- Popups (Select list, DropdownMenu, Dialog) portal to the container from `usePortalContainer`:
  the inline runtime's body-level popup layer (`shadowRoot.tjOverlay`), or the iframe's body in
  sandboxed mode.
- Theme tokens: `--cc-primary-brand`, `--cc-primary-text`, `--cc-surface1/2-surface`,
  `--cc-default-border`, `--cc-placeholder-text`, `--cc-error/success-systemStatus`, each with a
  light-theme fallback for the iframe runtime.
- In the ToolJet editor, a press that starts in a text field or inside `[data-tj-no-drag]` doesn't
  start a widget drag (the runtime stops it at the shadow host). Mark other drag-sensitive regions
  the same way, as Slider does.
