# 1. Widget custom CSS class targets the inner content node

Date: 2026-06-16
Status: Accepted

## Context

We are adding a universal per-widget **CSS class** field (`cssClass`) so clients
can tag a widget and target it from the existing app/workspace Custom CSS. Every
rendered widget has two candidate "root" DOM nodes, and the client's CSS is
written against whichever one we choose:

- **Outer** `WidgetWrapper` (`widget-${id}`, `WidgetWrapper.jsx:181`) — carries
  the layout engine: absolute positioning, width/height, drag/resize handles
  (`target`, `moveable-box`).
- **Inner** `canvas-component _tooljet-{component} _tooljet-{name}`
  (`RenderWidget.jsx:302`) — the existing styling hook clients already target
  (e.g. `._tooljet-button1 {}`), wrapping the widget's visual content.

This is hard to reverse: once clients ship CSS against the chosen node, moving the
class to the other node silently breaks their styling.

## Decision

Apply `cssClass` to the **inner `canvas-component` node** only.

## Consequences

**Positive**
- Consistent with the `_tooljet-*` hooks clients already style against — the
  custom class lands exactly where they expect.
- Keeps client CSS away from the layout engine, so custom styles can't fight
  ToolJet's absolute positioning or break drag/resize in the editor.
- Single injection point; works for all widgets via one edit.

**Negative / accepted**
- Clients cannot restyle the widget's outer position/size box via this field. If
  that need arises, it's a separate, deliberate decision (e.g. a second
  wrapper-level hook) — not a default.
- A custom rule that hides the widget can make it hard to select in the editor
  (the class applies in both environments).

## Alternatives considered

- **Outer wrapper** — gives positioning/size control but exposes the layout
  engine to arbitrary client CSS; high blast radius on editor UX. Rejected.
- **Both nodes** — maximal flexibility but doubles the surface area and the
  "which node won?" confusion when CSS conflicts. Rejected for v1.
