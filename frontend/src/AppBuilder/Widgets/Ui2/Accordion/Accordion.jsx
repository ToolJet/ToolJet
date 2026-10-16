import React, { useEffect, useRef, useState } from 'react';
import { list, useAutoHeight, useExposed } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';

export const MAX_ACCORDION_ITEMS = 200;

export const ShadAccordion = (props) => {
  const { properties, setExposedVariables, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const multiple = properties.multiple === true;
  const initial = list(properties.defaultOpen).map(String);
  const [open, setOpen] = useState(initial);
  useEffect(() => setOpen(initial), [stringify(initial)]); // eslint-disable-line react-hooks/exhaustive-deps
  // An accordion of thousands of sections is a binding mistake, and drawing them all freezes the page.
  const items = list(properties.items).slice(0, MAX_ACCORDION_ITEMS);
  const openRef = useRef(open);
  openRef.current = open;
  const shape = useRef({ multiple, count: items.length });
  shape.current = { multiple, count: items.length };
  // The native Accordion's events: onExpand when a section opens, onCollapse when one closes (with onChange after).
  const apply = (next, fire = true) => {
    const prev = openRef.current;
    openRef.current = next;
    setOpen(next);
    setExposedVariables({ openIndexes: next.map(Number), isExpanded: next.length > 0 });
    if (!fire) return;
    if (next.some((i) => !prev.includes(i))) fireEvent('onExpand');
    if (prev.some((i) => !next.includes(i))) fireEvent('onCollapse');
    fireEvent('onChange');
  };
  const change = (value) => apply((Array.isArray(value) ? value : value ? [value] : []).map(String));
  // expand(index) and collapse(index) open or close one section (all of them without an index), like the native
  // Accordion's expand() and collapse(); a single-open accordion keeps one section open.
  const indexArg = (i) => {
    const n = Number(i);
    return Number.isInteger(n) && n >= 0 && n < shape.current.count ? String(n) : null;
  };
  const noIndex = (i) => i === undefined || i === null || i === '';
  useExposed(setExposedVariables, properties, {
    openIndexes: open.map(Number),
    isExpanded: open.length > 0,
    expand: async (index) => {
      const one = indexArg(index);
      if (!noIndex(index) && one === null) return;
      const all = Array.from({ length: shape.current.count }, (_, k) => String(k));
      const next = shape.current.multiple
        ? one === null
          ? all
          : [...new Set([...openRef.current, one])]
        : [one ?? all[0]].filter(Boolean);
      if (stringify(next) !== stringify(openRef.current)) apply(next);
    },
    collapse: async (index) => {
      const one = indexArg(index);
      if (!noIndex(index) && one === null) return;
      const next = one === null ? [] : openRef.current.filter((k) => k !== one);
      if (stringify(next) !== stringify(openRef.current)) apply(next);
    },
  });
  const rootProps = multiple
    ? { type: 'multiple', value: open, onValueChange: change }
    : { type: 'single', collapsible: true, value: open[0] ?? '', onValueChange: change };
  return (
    <Shell {...props} innerRef={ref}>
      <Accordion {...rootProps} className="w-full">
        {items.map((item, i) => (
          <AccordionItem key={i} value={String(i)} className="border-[color:var(--lk-border,var(--sc-border))]">
            <AccordionTrigger className="text-[color:var(--lk-title,var(--sc-foreground))] [&>svg]:text-[color:var(--lk-icon,var(--sc-muted-foreground))]">
              {String(item?.title ?? item?.label ?? '')}
            </AccordionTrigger>
            <AccordionContent className="whitespace-pre-line text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
              {String(item?.content ?? item?.children ?? '')}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Shell>
  );
};
