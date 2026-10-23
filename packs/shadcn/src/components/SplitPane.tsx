import React, { useRef } from "react";
import { ToolJet } from "@tooljet/custom-component-sdk";

// Container with two drop areas and a draggable divider. The divider position is exposed as `split`
// (percent of the first pane), so the layout can be read or set from the app.
export const SplitPane = () => {
  const [direction] = ToolJet.useStateEnumeration({
    name: "direction",
    label: "Direction",
    enumDefinition: ["horizontal", "vertical"],
    enumLabels: { horizontal: "Side by side", vertical: "Stacked" },
    initialValue: "horizontal",
    inspector: "switch",
  });
  const [split, setSplit] = ToolJet.useStateNumber({
    name: "split",
    label: "First pane (%)",
    initialValue: 40,
  });
  const [minPane] = ToolJet.useStateNumber({
    name: "minPane",
    label: "Minimum pane (%)",
    initialValue: 15,
  });
  const onResize = ToolJet.useEventCallback({ name: "onResize" });
  const dividerColor = ToolJet.useStyleString({
    name: "dividerColor",
    label: "Divider",
    inspector: "color",
    initialValue: "var(--cc-default-border)",
  });
  const gap = ToolJet.useStyleNumber({
    name: "gap",
    label: "Divider width",
    initialValue: 6,
  });
  // The container's own surface, like a native container: without it the canvas grid shows through
  // around the drop areas while a component is dragged in.
  const background = ToolJet.useStyleString({
    name: "backgroundColor",
    label: "Background",
    inspector: "color",
    initialValue: "var(--cc-surface1-surface)",
  });
  const radius = ToolJet.useStyleNumber({
    name: "borderRadius",
    label: "Border radius",
    initialValue: "",
  });
  const padding = ToolJet.useStyleNumber({
    name: "padding",
    label: "Padding",
    initialValue: 12,
    section: "Spacing",
  });
  ToolJet.useComponentSettings({ defaultWidth: 24, defaultHeight: 40 });

  const rootRef = useRef<HTMLDivElement>(null);
  const horizontal = direction !== "vertical";
  const lo = Math.max(0, Math.min(45, Number(minPane) || 0));
  const clamp = (n: number) => Math.round(Math.min(100 - lo, Math.max(lo, n)));
  const percent = clamp(Number(split) || 50);

  ToolJet.useAction(
    {
      name: "setSplit",
      displayName: "Set split",
      params: [{ handle: "percent", displayName: "First pane (%)" }],
    },
    (next) => setSplit(clamp(Number(next))),
  );

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    if (!root) return;
    e.preventDefault();
    const handle = e.currentTarget;
    handle.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const ratio = horizontal
        ? (ev.clientX - rect.left) / rect.width
        : (ev.clientY - rect.top) / rect.height;
      setSplit(clamp(ratio * 100));
    };
    const end = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", end);
      onResize();
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", end);
  };

  return (
    <div
      ref={rootRef}
      className="ui ui-split ui-surface"
      style={{
        flexDirection: horizontal ? "row" : "column",
        background,
        borderRadius: radius === "" || radius == null ? "var(--ui-radius)" : radius,
        padding,
      }}
    >
      <ToolJet.Slot
        name="first"
        style={{ flex: `0 0 calc(${percent}% - ${gap / 2}px)` }}
      />
      <div
        // Dragging the divider resizes the panes; it must not start a widget drag in the editor.
        data-tj-no-drag=""
        className="ui-split-handle"
        role="separator"
        aria-orientation={horizontal ? "vertical" : "horizontal"}
        aria-valuenow={percent}
        onPointerDown={startDrag}
        style={{
          flex: `0 0 ${gap}px`,
          background: dividerColor,
          cursor: horizontal ? "col-resize" : "row-resize",
        }}
      />
      <ToolJet.Slot name="second" style={{ flex: 1 }} />
    </div>
  );
};
