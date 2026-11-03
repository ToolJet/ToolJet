import { useEffect, useMemo, useRef, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { neighbourTab, toTabs } from './model';
import type { Tab } from './model';

const sameJson = (a: unknown, b: unknown) => {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};

/** The value, kept as the same object while its JSON is unchanged (a re-render with equal data keeps memos). */
export const useStable = <T>(value: T): T => {
  const ref = useRef(value);
  if (!sameJson(ref.current, value)) ref.current = value;
  return ref.current;
};

/** The latest value in a ref, for handlers that run later. */
export const useLatest = <T>(value: T) => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};

/** A boolean action argument: anything but false / 'false' is on. */
export const onArg = (v: unknown) => !(v === false || v === 'false' || v === '{{false}}');

interface TabsOptions {
  raw: unknown;
  fallbackLabel: string;
  /** The tab chosen (a state hook's value), and its setter. */
  current: string;
  setCurrent: (id: string) => void;
  /** UI 2.0's Default tab: a new one moves the tab, with no event. */
  defaultTab: string;
  /** setTab's parameter name. */
  setTabParam: string;
  onSwitched: () => void;
}

// UI 2.0 Tabs' tab state, shared by TabsContainer and Tabs: tabs patched at run time by setTabDisable,
// setTabLoading and setTabVisibility (until the Tabs property changes), the tab shown (the chosen one while it is
// visible, else the first visible one), the step position the wizard reads, and the tab actions.
export const useTabs = ({ raw, fallbackLabel, current, setCurrent, defaultTab, setTabParam, onSwitched }: TabsOptions) => {
  const source = useStable(raw);
  const base = useMemo(() => toTabs(source, fallbackLabel), [source, fallbackLabel]);
  const [patches, setPatches] = useState<Record<string, Partial<Tab>>>({});
  useEffect(() => setPatches({}), [base]);
  const tabs = useMemo(() => base.map((t) => ({ ...t, ...(patches[t.id] ?? {}) })), [base, patches]);
  const shown = useMemo(() => tabs.filter((t) => t.visible), [tabs]);
  const active = shown.some((t) => t.id === String(current)) ? String(current) : shown[0]?.id ?? '';
  const stepIndex = Math.max(0, shown.findIndex((t) => t.id === active));
  const tab = shown[stepIndex];

  const [, setTitle] = ToolJet.useStateString({ name: 'currentTabTitle', initialValue: '', inspector: 'hidden' });
  const [, setStepIndex] = ToolJet.useStateNumber({ name: 'currentStepIndex', initialValue: 0, inspector: 'hidden' });
  const [, setFirst] = ToolJet.useStateBoolean({ name: 'isFirstStep', initialValue: true, inspector: 'hidden' });
  const [, setLast] = ToolJet.useStateBoolean({ name: 'isLastStep', initialValue: false, inspector: 'hidden' });

  const publish = (id: string, list: Tab[]) => {
    const visible = list.filter((t) => t.visible);
    const index = Math.max(0, visible.findIndex((t) => t.id === id));
    setTitle(visible[index]?.title ?? '');
    setStepIndex(index);
    setFirst(index === 0);
    setLast(index === visible.length - 1);
  };
  const live = useLatest({ tabs, active, publish, setCurrent, onSwitched });
  // The exposed values follow the tab shown (a hidden current tab gives way to the next one, with no event).
  useEffect(() => {
    live.current.publish(active, tabs);
    if (active && active !== String(current)) live.current.setCurrent(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, tabs]);
  // A new Default tab moves the tab. The first run applies it only when it names a tab.
  useEffect(() => {
    const id = String(defaultTab ?? '');
    if (id && live.current.tabs.some((t) => t.visible && t.id === id) && id !== live.current.active) live.current.setCurrent(id);
  }, [defaultTab, live]);

  const switchTo = (id: unknown, fire = true) => {
    const { tabs: all, active: now } = live.current;
    const target = all.find((t) => t.visible && t.id === String(id ?? ''));
    if (!target || target.id === now) return;
    live.current.active = target.id;
    live.current.setCurrent(target.id);
    // Published before the event, so its handler reads the tab it switched to.
    live.current.publish(target.id, all);
    if (fire) live.current.onSwitched();
  };
  const patch = (id: unknown, change: Partial<Tab>) => setPatches((p) => ({ ...p, [String(id)]: { ...(p[String(id)] ?? {}), ...change } }));
  const step = (delta: number) => {
    const next = neighbourTab(live.current.tabs, live.current.active, delta);
    if (next) switchTo(next.id);
  };

  ToolJet.useAction({ name: 'setTab', displayName: 'Set tab', params: [{ handle: setTabParam, displayName: 'Tab id' }] }, (id) => switchTo(id));
  ToolJet.useAction({ name: 'nextTab', displayName: 'Next tab' }, () => step(1));
  ToolJet.useAction({ name: 'previousTab', displayName: 'Previous tab' }, () => step(-1));
  const tabParams = (label: string) => [
    { handle: 'tabId', displayName: 'Tab id' },
    { handle: 'value', displayName: label, type: 'toggle' as const, defaultValue: '{{true}}' },
  ];
  ToolJet.useAction({ name: 'setTabDisable', displayName: 'Set tab disable', params: tabParams('Disable') }, (id, v) => patch(id, { disable: onArg(v) }));
  ToolJet.useAction({ name: 'setTabLoading', displayName: 'Set tab loading', params: tabParams('Loading') }, (id, v) => patch(id, { loading: onArg(v) }));
  ToolJet.useAction({ name: 'setTabVisibility', displayName: 'Set tab visibility', params: tabParams('Visible') }, (id, v) => patch(id, { visible: onArg(v) }));

  return {
    tabs,
    shown,
    active,
    tab,
    stepIndex,
    isFirstStep: stepIndex === 0,
    isLastStep: stepIndex === shown.length - 1,
    switchTo,
    step,
  };
};
