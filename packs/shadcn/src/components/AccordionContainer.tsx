import React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ToolJet } from "@tooljet/custom-component-sdk";
import { ChevronDown } from "lucide-react";
import { toItems, toSlotName } from "../lib/slots";
import { lookVars } from "../lib/ui2/nav/look";
import "../styles/ui2-nav.css";

// Container: one drop area per section. Sections come from a property, so the slots are dynamic.
// forceMount keeps closed sections (and the components in them) mounted; CSS hides them.
export const AccordionContainer = () => {
  const [rawSections] = ToolJet.useStateArray({
    name: "sections",
    label: "Sections",
    description:
      "Array of { id, title } objects. Keep ids stable: dropped components stay with their section id.",
    initialValue: [
      { id: "general", title: "General" },
      { id: "billing", title: "Billing" },
      { id: "advanced", title: "Advanced" },
    ],
  });
  const [openSections, setOpenSections] = ToolJet.useStateArray({
    name: "openSections",
    label: "Open sections",
    description: "Ids of the sections that start open.",
    initialValue: ["general"],
  });
  const [allowMultiple] = ToolJet.useStateBoolean({
    name: "allowMultiple",
    label: "Allow several open",
    initialValue: true,
  });
  const onToggle = ToolJet.useEventCallback({ name: "onToggle" });
  // UI 2.0 Accordion's events and exposed values.
  const onChange = ToolJet.useEventCallback({ name: "onChange" });
  const onExpand = ToolJet.useEventCallback({ name: "onExpand" });
  const onCollapse = ToolJet.useEventCallback({ name: "onCollapse" });
  const [, setIsExpanded] = ToolJet.useStateBoolean({ name: "isExpanded", initialValue: false, inspector: "hidden" });
  const [, setOpenIndexes] = ToolJet.useStateArray({ name: "openIndexes", initialValue: [], inspector: "hidden" });
  const { disabled } = ToolJet.useControlState();
  const panelHeight = ToolJet.useStyleNumber({
    name: "panelHeight",
    label: "Section height",
    initialValue: 160,
  });
  const headerColor = ToolJet.useStyleString({
    name: "headerColor",
    label: "Header text (legacy)",
    inspector: "color",
    initialValue: "",
  });
  const titleColor = ToolJet.useStyleString({ name: "titleColor", label: "Item title color", inspector: "color", initialValue: "" });
  const dividerColor = ToolJet.useStyleString({ name: "dividerColor", label: "Divider color", inspector: "color", initialValue: "" });
  const iconColor = ToolJet.useStyleString({ name: "iconColor", label: "Chevron color", inspector: "color", initialValue: "" });
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
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 60 });

  const sections = toItems(rawSections, "Section");
  const open = (Array.isArray(openSections) ? openSections : []).map(String);
  const indexes = (ids: string[]) => ids.map((id) => sections.findIndex((s) => s.id === id)).filter((i) => i >= 0);
  React.useEffect(() => {
    setIsExpanded(open.length > 0);
    setOpenIndexes(indexes(open));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open.join("|"), sections.length]);
  const update = (next: string[], fire = true) => {
    setOpenSections(next);
    if (!fire) return;
    if (next.some((id) => !open.includes(id))) onExpand();
    if (open.some((id) => !next.includes(id))) onCollapse();
    onToggle();
    onChange();
  };
  // A section by id, or by index (UI 2.0 Accordion's expand / collapse take an index).
  const idOf = (key: unknown): string | null => {
    if (key === undefined || key === null || key === "") return null;
    const byId = sections.find((s) => s.id === String(key));
    if (byId) return byId.id;
    const n = Number(key);
    return Number.isInteger(n) && sections[n] ? sections[n].id : null;
  };
  ToolJet.useAction(
    { name: "expand", displayName: "Expand", params: [{ handle: "index", displayName: "Section id or index (empty: all)" }] },
    (key) => {
      const one = idOf(key);
      const all = sections.map((s) => s.id);
      update(allowMultiple ? (one ? [...new Set([...open, one])] : all) : [one ?? all[0]].filter(Boolean), false);
      onExpand();
    },
  );
  ToolJet.useAction(
    { name: "collapse", displayName: "Collapse", params: [{ handle: "index", displayName: "Section id or index (empty: all)" }] },
    (key) => {
      const one = idOf(key);
      update(one ? open.filter((id) => id !== one) : [], false);
      onCollapse();
    },
  );

  ToolJet.useAction(
    {
      name: "openSection",
      displayName: "Open section",
      params: [{ handle: "id", displayName: "Section id" }],
    },
    (id) =>
      update(
        allowMultiple ? [...new Set([...open, String(id)])] : [String(id)],
      ),
  );
  ToolJet.useAction({ name: "collapseAll", displayName: "Collapse all" }, () =>
    update([]),
  );

  const items = sections.map((section) => (
    <AccordionPrimitive.Item
      key={section.id}
      value={section.id}
      className="ui-accordion-item"
    >
      <AccordionPrimitive.Header style={{ margin: 0 }}>
        <AccordionPrimitive.Trigger
          className="ui-accordion-trigger ui-focus"
          style={headerColor ? { color: headerColor } : undefined}
        >
          {section.label}
          <ChevronDown />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content
        forceMount
        className="ui-accordion-container-panel"
      >
        <ToolJet.Slot
          name={toSlotName("section", section.id)}
          style={{ height: panelHeight }}
        />
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  ));

  return (
    <div
      className="ui ui-scroll ui-surface n2-accordion"
      style={{
        ...lookVars([
          [titleColor, "--lk-title"],
          [dividerColor, ["--lk-border", "--ui-border"]],
          [iconColor, "--lk-icon"],
        ]),
        background,
        borderRadius: radius === "" || radius == null ? "var(--ui-radius)" : radius,
        padding,
      }}
    >
      {allowMultiple ? (
        <AccordionPrimitive.Root
          type="multiple"
          disabled={disabled}
          value={open}
          onValueChange={update}
        >
          {items}
        </AccordionPrimitive.Root>
      ) : (
        <AccordionPrimitive.Root
          type="single"
          collapsible
          disabled={disabled}
          value={open[0] ?? ""}
          onValueChange={(next) => update(next ? [next] : [])}
        >
          {items}
        </AccordionPrimitive.Root>
      )}
    </div>
  );
};
