import React, { useEffect, useRef, useState } from 'react';
import isEqual from 'lodash/isEqual';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { useAutoHeight, useExposed, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { list } from '@/AppBuilder/Widgets/Ui2/_shared/values';

export const MAX_ACCORDION_ITEMS = 200;

export const ShadAccordion = (props: WidgetProps) => {
  const { properties, setExposedVariables, fireEvent } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const multiple = properties.multiple === true;
  const initial = useStable(list(properties.defaultOpen).map(String));
  const [open, setOpen] = useState<string[]>(initial);
  useEffect(() => setOpen(initial), [initial]);
  // An accordion of thousands of sections is a binding mistake, and drawing them all freezes the page.
  const items = list(properties.items).slice(0, MAX_ACCORDION_ITEMS);
  const openRef = useRef(open);
  openRef.current = open;
  const shape = useRef({ multiple, count: items.length });
  shape.current = { multiple, count: items.length };
  // The native Accordion's events: onExpand when a section opens, onCollapse when one closes (with onChange after).
  const apply = (next: string[], fire = true) => {
    const prev = openRef.current;
    openRef.current = next;
    setOpen(next);
    setExposedVariables({ openIndexes: next.map(Number), isExpanded: next.length > 0 });
    if (!fire) return;
    if (next.some((i) => !prev.includes(i))) fireEvent('onExpand');
    if (prev.some((i) => !next.includes(i))) fireEvent('onCollapse');
    fireEvent('onChange');
  };
  const change = (value: string | string[]) => apply((Array.isArray(value) ? value : value ? [value] : []).map(String));
  // expand(index) and collapse(index) open or close one section (all of them without an index), like the native
  // Accordion's expand() and collapse(); a single-open accordion keeps one section open.
  const indexArg = (i: unknown): string | null => {
    const n = Number(i);
    return Number.isInteger(n) && n >= 0 && n < shape.current.count ? String(n) : null;
  };
  const noIndex = (i: unknown): boolean => i === undefined || i === null || i === '';
  useExposed(setExposedVariables, properties, {
    openIndexes: open.map(Number),
    isExpanded: open.length > 0,
    expand: async (index?: unknown) => {
      const one = indexArg(index);
      if (!noIndex(index) && one === null) return;
      const all = Array.from({ length: shape.current.count }, (_, k) => String(k));
      const next = shape.current.multiple
        ? one === null
          ? all
          : [...new Set([...openRef.current, one])]
        : [one ?? all[0]].filter(Boolean);
      if (!isEqual(next, openRef.current)) apply(next);
    },
    collapse: async (index?: unknown) => {
      const one = indexArg(index);
      if (!noIndex(index) && one === null) return;
      const next = one === null ? [] : openRef.current.filter((k) => k !== one);
      if (!isEqual(next, openRef.current)) apply(next);
    },
  });
  const rootProps = multiple
    ? { type: 'multiple' as const, value: open, onValueChange: change }
    : { type: 'single' as const, collapsible: true, value: open[0] ?? '', onValueChange: change };
  return (
    <Shell {...props} innerRef={ref}>
      <Accordion {...rootProps} className="tw-w-full">
        {items.map((item, i) => (
          <AccordionItem key={i} value={String(i)} className="tw-border-[color:var(--lk-border,var(--sc-border))]">
            <AccordionTrigger className="tw-text-[color:var(--lk-title,var(--sc-foreground))] [&>svg]:tw-text-[color:var(--lk-icon,var(--sc-muted-foreground))]">
              {String(item?.title ?? item?.label ?? '')}
            </AccordionTrigger>
            <AccordionContent className="tw-whitespace-pre-line tw-text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
              {String(item?.content ?? item?.children ?? '')}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Shell>
  );
};

export default withControlState(ShadAccordion);
