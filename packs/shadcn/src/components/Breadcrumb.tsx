import React from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { ChevronRight } from 'lucide-react';
import { cn } from '../lib/cn';
import { isRecord, list, text } from '../lib/ui2/nav/model';
import { lookVars } from '../lib/ui2/nav/look';
import { LineSkel, LoadingBox, LoadingFrame, useLoadingLook } from '../lib/ui2/loading/look';
import '../styles/ui2-nav.css';

const MAX_CRUMBS = 8;
const ELLIPSIS = Symbol('ellipsis');

// UI 2.0 Breadcrumb: the trail, the last item the current page. A long trail keeps its first item and its last ones
// with an ellipsis between, so a list bound by mistake draws a handful.
export const Breadcrumb = () => {
  const [items] = ToolJet.useStateArray({
    name: 'items',
    label: 'Items',
    description: 'Strings or { title, value } objects; the last is the current page.',
    initialValue: ['Home', 'Section', 'Page'],
  });
  const [, setLastClickedItem] = ToolJet.useStateObject({ name: 'lastClickedItem', initialValue: {}, inspector: 'hidden' });
  const onItemClicked = ToolJet.useEventCallback({ name: 'onItemClicked' });
  const { disabled } = ToolJet.useControlState();
  const textColor = ToolJet.useStyleString({ name: 'textColor', label: 'Breadcrumb link color', inspector: 'color', initialValue: '' });
  const currentColor = ToolJet.useStyleString({ name: 'currentColor', label: 'Current page color', inspector: 'color', initialValue: '' });
  const separatorColor = ToolJet.useStyleString({ name: 'separatorColor', label: 'Separator color', inspector: 'color', initialValue: '' });
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 14, defaultHeight: 3 });

  const all = list(items);
  const trail: unknown[] = all.length > MAX_CRUMBS ? [all[0], ELLIPSIS, ...all.slice(-(MAX_CRUMBS - 2))] : all;
  // The index in the whole trail of each drawn item (the ellipsis hides some).
  const indexes =
    all.length > MAX_CRUMBS ? [0, -1, ...Array.from({ length: MAX_CRUMBS - 2 }, (_, k) => all.length - (MAX_CRUMBS - 2) + k)] : all.map((_, k) => k);
  const titleOf = (it: unknown) => (isRecord(it) ? text(it.title ?? it.label ?? it.value) : text(it));
  const click = (it: unknown, index: number) => {
    if (disabled || it === ELLIPSIS) return;
    const entry = isRecord(it) ? it : { title: titleOf(it) };
    const title = titleOf(it);
    // UI 2.0's shape (title, index), with the pack's label and value too.
    setLastClickedItem({ ...entry, title, label: title, value: isRecord(it) ? it.value ?? title : title, index });
    onItemClicked();
  };

  return (
    <LoadingFrame loading={ld.loading} look={ld.skeleton ? <LineSkel /> : <LoadingBox />}>
      <nav
        className="ui n2-breadcrumb"
        aria-label="breadcrumb"
        style={lookVars([
          [textColor, '--lk-fg'],
          [currentColor, '--lk-current'],
          [separatorColor, '--lk-sep'],
        ])}
      >
        <ol>
          {trail.map((it, i) => {
            const last = i === trail.length - 1;
            return (
              <li key={i}>
                {it === ELLIPSIS ? (
                  <span aria-hidden="true">…</span>
                ) : last ? (
                  <span aria-current="page" className="n2-crumb is-current">
                    {titleOf(it)}
                  </span>
                ) : (
                  <button type="button" disabled={disabled} className={cn('n2-crumb', !disabled && 'is-link')} onClick={() => click(it, indexes[i])}>
                    {titleOf(it)}
                  </button>
                )}
                {!last ? <ChevronRight size={14} className="n2-crumb-sep" /> : null}
              </li>
            );
          })}
        </ol>
      </nav>
    </LoadingFrame>
  );
};
