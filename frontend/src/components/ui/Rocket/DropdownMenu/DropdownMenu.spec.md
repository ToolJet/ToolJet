# DropdownMenu — Rocket Design Spec
<!-- synced: 2026-03-20 -->

## Props

| Sub-component | Prop | Type | Values | Default |
|---|---|---|---|---|
| DropdownMenuItem | `inset` | boolean | — | false |
| DropdownMenuItem | `destructive` | boolean | — | false |
| DropdownMenuItem | `disabled` | boolean | — | false |
| DropdownMenuLabel | `inset` | boolean | — | false |
| DropdownMenuSubTrigger | `inset` | boolean | — | false |

## Token Mapping

| Element | State | ToolJet class |
|---|---|---|
| content bg | default | `tw-bg-background-surface-layer-01` |
| content border | default | `tw-border-solid tw-border-border-default` |
| content shadow | default | `tw-shadow-[var(--elevation-300-box-shadow)]` |
| item text | default | `tw-text-text-default` |
| item bg | hover/focus | `focus:tw-bg-interactive-hover` |
| item text | destructive | `tw-text-text-danger` |
| item bg | destructive + focus | `focus:tw-bg-interactive-hover` |
| item | disabled | `data-[disabled]:tw-opacity-50 data-[disabled]:tw-pointer-events-none` |
| label text | default | `tw-text-text-default tw-font-semibold` |
| separator | default | `tw-bg-border-default` |
| shortcut text | default | `tw-text-text-placeholder` |
| check/radio indicator | default | `tw-text-text-default` |

## Sub-components

| Component | Wraps shadcn? | Styling |
|---|---|---|
| `DropdownMenu` | Re-export (Root) | none |
| `DropdownMenuTrigger` | Re-export | none |
| `DropdownMenuContent` | HOC wrapper | token bg/border/shadow |
| `DropdownMenuItem` | HOC wrapper | token text + hover + destructive + disabled |
| `DropdownMenuCheckboxItem` | HOC wrapper | token text + hover + disabled + indicator |
| `DropdownMenuRadioItem` | HOC wrapper | token text + hover + disabled + indicator |
| `DropdownMenuLabel` | HOC wrapper | token text + font |
| `DropdownMenuSeparator` | HOC wrapper | token bg |
| `DropdownMenuShortcut` | HOC wrapper | token text |
| `DropdownMenuGroup` | Re-export | none |
| `DropdownMenuPortal` | Re-export | none |
| `DropdownMenuSub` | Re-export | none |
| `DropdownMenuSubTrigger` | HOC wrapper | token text + hover + chevron |
| `DropdownMenuSubContent` | HOC wrapper | token bg/border/shadow |
| `DropdownMenuRadioGroup` | Re-export | none |

## CVA Shape

Shape E — compound/multi-part. No CVA needed — all sub-components use static `cn()` with ToolJet tokens.

## Notes

- No anchor context needed — Radix auto-anchors Content to Trigger
- No items collection API — action menu, not filterable/selectable
- forwardRef on every HOC wrapper — Radix uses cloneElement with refs internally
- `tw-border-solid` required alongside border color (preflight is off)
- Content uses `elevation-300` shadow for floating panel depth
- `destructive` is a boolean prop on DropdownMenuItem (not a variant)
- Focus is keyboard-driven via Radix — `focus:` modifier on items
- Animations kept from shadcn (animate-in/out, fade, zoom, slide)
