import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { ChevronDown } from 'lucide-react';
import { isRecord, list, text } from '../lib/ui2/nav/model';
import { lookVars } from '../lib/ui2/nav/look';
import { useStable } from '../lib/ui2/nav/hooks';
import { LoadingFrame, blockLook, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useThemeColor } from '../lib/styleDefaults';
import '../styles/ui2-nav.css';

const MAX_SECTIONS = 200;

/** A section index: a whole number from 0 (as a number or numeric text) below `count`, as its key; else null. */
const sectionKey = (v: unknown, count = Infinity): string | null => {
  if (typeof v !== 'number' && !(typeof v === 'string' && v.trim() !== '')) return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n < count ? String(n) : null;
};

type Item = { value: string; title: string; content: string };

const toItems = (raw: unknown): Item[] =>
  list(raw)
    .slice(0, MAX_SECTIONS)
    .map((t, i) =>
      isRecord(t)
        ? { value: text(t.value) || `item-${i + 1}`, title: text(t.title ?? t.label), content: text(t.content ?? t.children) }
        : { value: `item-${i + 1}`, title: text(t), content: '' }
    );

const same = (a: string[], b: string[]) => a.length === b.length && a.every((k, i) => k === b[i]);

// UI 2.0 Accordion: sections by index (defaultOpen, openIndexes, expand / collapse), one or several open at once.
export const Accordion = () => {
  const [rawItems] = ToolJet.useStateArray({
    name: 'items',
    label: 'Items',
    description: 'Array of { title, content } objects (value is optional).',
    initialValue: [
      { title: 'Is it accessible?', content: 'Yes. It adheres to the WAI-ARIA design pattern.' },
      { title: 'Is it styled?', content: 'Yes. It follows your ToolJet app theme.' },
      { title: 'Is it animated?', content: 'Yes. It animates open and closed by default.' },
    ],
  });
  const [multiple] = ToolJet.useStateBoolean({ name: 'multiple', label: 'Several open at once', initialValue: false });
  const [defaultOpen] = ToolJet.useStateArray({ name: 'defaultOpen', label: 'Open by default (indexes)', initialValue: [] });
  // The pack's open item by value, kept for apps that set it; it follows the first open section.
  const [value, setValue] = ToolJet.useStateString({ name: 'value', label: 'Open item (value)', initialValue: '' });
  const [, setOpenIndexes] = ToolJet.useStateArray({ name: 'openIndexes', initialValue: [], inspector: 'hidden' });
  const [, setIsExpanded] = ToolJet.useStateBoolean({ name: 'isExpanded', initialValue: false, inspector: 'hidden' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onExpand = ToolJet.useEventCallback({ name: 'onExpand' });
  const onCollapse = ToolJet.useEventCallback({ name: 'onCollapse' });
  const { disabled } = ToolJet.useControlState();
  const titleColor = useThemeColor('titleColor', 'Item title color', TOKEN.text);
  const textColor = useThemeColor('textColor', 'Item content color', TOKEN.mutedText);
  const dividerColor = useThemeColor('dividerColor', 'Divider color', TOKEN.border);
  const iconColor = useThemeColor('iconColor', 'Chevron color', TOKEN.mutedText);
  const borderColor = ToolJet.useStyleString({ name: 'borderColor', label: 'Divider (legacy)', inspector: 'color', initialValue: '' });
  const ld = useLoadingLook();
  // The three sample sections (159px) in whole rows: 18 left a 17px band under them at the drop, 16 cuts the last.
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 17 });

  const source = useStable(rawItems);
  const items = useMemo(() => toItems(source), [source]);
  const count = items.length;
  const initial = useStable(list(defaultOpen).map((k) => sectionKey(k) ?? ''));
  const [stored, setStored] = useState<string[]>(initial);
  useEffect(() => setStored(initial), [initial]);
  // An Open item value set from outside (not the one this widget published) opens that section.
  const published = useRef<string | null>(null);
  useEffect(() => {
    if (value === published.current) return;
    const i = items.findIndex((it) => it.value === value);
    if (i >= 0) setStored((s) => (multiple ? [...new Set([...s, String(i)])] : [String(i)]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, items]);
  // What is open is read against the sections there are now; single-open keeps only the first.
  const open = useMemo(() => {
    const keys = [...new Set(stored.map((k) => sectionKey(k, count)).filter((k): k is string => k !== null))];
    return multiple ? keys : keys.slice(0, 1);
  }, [stored, count, multiple]);
  const openRef = useRef(open);
  openRef.current = open;
  const live = useRef({ multiple, count, items });
  live.current = { multiple, count, items };

  const publish = (next: string[]) => {
    setOpenIndexes(next.map(Number));
    setIsExpanded(next.length > 0);
    const first = next.length ? live.current.items[Number(next[0])] : undefined;
    published.current = first?.value ?? '';
    setValue(published.current);
  };
  useEffect(() => publish(open), [open.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // onExpand when a section opens, onCollapse when one closes, onChange after: the native Accordion's events.
  const apply = (next: string[], fire = true) => {
    const prev = openRef.current;
    openRef.current = next;
    setStored(next);
    publish(next);
    // The sections already open: nothing changes and nothing fires.
    if (!fire || same(next, prev)) return;
    if (next.some((k) => !prev.includes(k))) onExpand();
    if (prev.some((k) => !next.includes(k))) onCollapse();
    onChange();
  };
  const change = (v: string | string[]) => apply((Array.isArray(v) ? v : v ? [v] : []).map(String));
  const noIndex = (i: unknown) => i === undefined || i === null || i === '';
  // expand(index) / collapse(index) open or close one section (all of them without an index) and fire onExpand or
  // onCollapse when that changes what is open (a section already open or closed fires nothing); a single-open accordion
  // keeps one section open.
  ToolJet.useAction({ name: 'expand', displayName: 'Expand', params: [{ handle: 'index', displayName: 'Index (empty: all)' }] }, (index) => {
    const one = sectionKey(index, live.current.count);
    if (!noIndex(index) && one === null) return;
    const every = Array.from({ length: live.current.count }, (_, k) => String(k));
    const next = live.current.multiple ? (one === null ? every : [...new Set([...openRef.current, one])]) : [one ?? every[0]].filter(Boolean);
    if (same(next, openRef.current)) return;
    apply(next, false);
    onExpand();
  });
  ToolJet.useAction({ name: 'collapse', displayName: 'Collapse', params: [{ handle: 'index', displayName: 'Index (empty: all)' }] }, (index) => {
    const one = sectionKey(index, live.current.count);
    if (!noIndex(index) && one === null) return;
    const next = one === null ? [] : openRef.current.filter((k) => k !== one);
    if (same(next, openRef.current)) return;
    apply(next, false);
    onCollapse();
  });
  // The pack's earlier actions.
  ToolJet.useAction({ name: 'open', displayName: 'Open item', params: [{ handle: 'value', displayName: 'Item value' }] }, (v) => {
    const i = live.current.items.findIndex((it) => it.value === String(v ?? ''));
    if (i >= 0) apply(live.current.multiple ? [...new Set([...openRef.current, String(i)])] : [String(i)]);
  });
  ToolJet.useAction({ name: 'collapseAll', displayName: 'Collapse all' }, () => apply([]));

  const vars = lookVars([
    [titleColor, '--lk-title'],
    [textColor, '--lk-fg'],
    [dividerColor || borderColor, '--lk-border'],
    [iconColor, '--lk-icon'],
  ]);
  const sections = items.map((item, i) => (
    <AccordionPrimitive.Item key={i} value={String(i)} className="ui-accordion-item">
      <AccordionPrimitive.Header style={{ margin: 0 }}>
        <AccordionPrimitive.Trigger className="ui-accordion-trigger ui-focus">
          {item.title}
          <ChevronDown />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content className="ui-accordion-content">
        <div className="ui-accordion-content-inner">{item.content}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  ));
  return (
    <LoadingFrame loading={ld.loading} look={blockLook(ld.skeleton)}>
      <div className="ui n2-accordion" style={vars}>
        {multiple ? (
          <AccordionPrimitive.Root type="multiple" value={open} onValueChange={change} disabled={disabled}>
            {sections}
          </AccordionPrimitive.Root>
        ) : (
          <AccordionPrimitive.Root type="single" collapsible value={open[0] ?? ''} onValueChange={change} disabled={disabled}>
            {sections}
          </AccordionPrimitive.Root>
        )}
      </div>
    </LoadingFrame>
  );
};
