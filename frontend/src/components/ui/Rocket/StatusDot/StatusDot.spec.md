# StatusDot — Rocket Design Spec
<!-- figma: https://www.figma.com/design/Qbsk9zjX1MtrNRGZmZy09U/Dashboards--Sep-2026?node-id=4920-168 -->
<!-- synced: 2026-11-17 -->

## Overview

A fully rounded dot that shows the status of something at a glance, for example the environment of an app or a connection state. It carries no text, so always pair it with a visible label or a tooltip: colour alone must not carry the meaning.

## Props

| Prop | Type | Values | Default |
|---|---|---|---|
| tone | string | info \| success \| warning \| danger \| neutral | neutral |
| size | string | default \| small | default |
| className | string | — | — |

## Sizes

| Value | Size | Tailwind | Use |
|---|---|---|---|
| default | 8px | `tw-size-2` | Standalone, next to text |
| small | 6px | `tw-size-1.5` | Inside buttons and menu rows (the environment switcher) |

## Token Mapping

| Tone | ToolJet class |
|---|---|
| info | `tw-bg-background-accent-strong` |
| success | `tw-bg-background-success-strong` |
| warning | `tw-bg-background-warning-strong` |
| danger | `tw-bg-background-error-strong` |
| neutral | hollow ring: `tw-border-icon-weak`, transparent fill |

## CVA Shape

Shape A — tones × sizes.

## Notes

- Decorative: rendered `aria-hidden`. Not interactive, so there are no hover, focus, pressed or disabled states.
- Suggested environment mapping: development = info, staging = warning, production = success. The environment switcher frames draw production as warning; the app maps environments in `_helpers/environmentTone.ts`.
- Neutral is a ring, not a filled grey, so it also reads without colour.
