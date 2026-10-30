import React, { useEffect, useRef } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { useThemeRadius } from '../lib/styleDefaults';
import { usePointerDrag } from '../lib/pointerDrag';

// Container with two drop areas and a draggable divider. The divider position is exposed as `split`
// (percent of the first pane), so the layout can be read or set from the app.
export const SplitPane = () => {
  const [direction] = ToolJet.useStateEnumeration({
    name: 'direction',
    label: 'Direction',
    enumDefinition: ['horizontal', 'vertical'],
    enumLabels: { horizontal: 'Side by side', vertical: 'Stacked' },
    initialValue: 'horizontal',
    inspector: 'switch',
  });
  const [split, setSplit] = ToolJet.useStateNumber({
    name: 'split',
    label: 'First pane (%)',
    initialValue: 40,
  });
  const [minPane] = ToolJet.useStateNumber({
    name: 'minPane',
    label: 'Minimum pane (%)',
    initialValue: 15,
  });
  const onResize = ToolJet.useEventCallback({ name: 'onResize' });
  const dividerColor = ToolJet.useStyleString({
    name: 'dividerColor',
    label: 'Divider',
    inspector: 'color',
    initialValue: 'var(--cc-default-border)',
  });
  const gap = ToolJet.useStyleNumber({
    name: 'gap',
    label: 'Divider width',
    initialValue: 6,
  });
  // The container's own surface, like a native container: without it the canvas grid shows through
  // around the drop areas while a component is dragged in.
  const background = ToolJet.useStyleString({
    name: 'backgroundColor',
    label: 'Background',
    inspector: 'color',
    initialValue: 'var(--cc-surface1-surface)',
  });
  const radius = useThemeRadius('borderRadius', 'Border radius');
  const padding = ToolJet.useStyleNumber({
    name: 'padding',
    label: 'Padding',
    initialValue: 12,
    section: 'Spacing',
  });
  ToolJet.useComponentSettings({ role: 'split-pane', fit: false, defaultWidth: 24, defaultHeight: 40 });

  const { disabled, loading } = ToolJet.useControlState();

  const rootRef = useRef<HTMLDivElement>(null);
  const horizontal = direction !== 'vertical';
  const lo = Math.max(0, Math.min(45, Number(minPane) || 0));
  const clamp = (n: number) => Math.round(Math.min(100 - lo, Math.max(lo, n)));
  // A finite number is a split, 0 included (minPane 0 allows it); blank, null, a boolean or text is none. `|| 50` read
  // a valid 0 as none, so setSplit(0) exposed 0 and drew half and half (SP-37).
  const toSplit = (v: unknown): number | null => {
    if (typeof v !== 'number' && typeof v !== 'string') return null;
    if (typeof v === 'string' && !v.trim()) return null;
    const n = Number(v);
    return Number.isFinite(n) ? clamp(n) : null;
  };
  const percent = toSplit(split) ?? clamp(50);

  ToolJet.useAction(
    {
      name: 'setSplit',
      displayName: 'Set split',
      params: [{ handle: 'percent', displayName: 'First pane (%)' }],
    },
    (next) => {
      const to = toSplit(next);
      if (to !== null) setSplit(to);
    }
  );

  // The separator resizes by keyboard as well as by pointer (SP-38): it is a tab stop, the arrows along its axis move
  // it a step (Shift for ten), PageUp/PageDown ten, Home and End to the limits; each change fires onResize once. Only
  // the separator's own keys: arrows typed in the panes stay theirs.
  const busy = disabled || loading;
  const onSeparatorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (busy || e.target !== e.currentTarget || e.metaKey || e.ctrlKey || e.altKey) return;
    const step = e.shiftKey ? 10 : 1;
    const less = horizontal ? 'ArrowLeft' : 'ArrowUp';
    const more = horizontal ? 'ArrowRight' : 'ArrowDown';
    let to: number | null = null;
    if (e.key === less) to = percent - step;
    else if (e.key === more) to = percent + step;
    else if (e.key === 'PageUp') to = percent - 10;
    else if (e.key === 'PageDown') to = percent + 10;
    else if (e.key === 'Home') to = lo;
    else if (e.key === 'End') to = 100 - lo;
    if (to === null) return;
    e.preventDefault();
    const next = clamp(to);
    if (next === percent) return;
    setSplit(next);
    onResize();
  };

  // One drag at a time with one teardown (lib/pointerDrag): pointerup fires onResize once if the split moved; a
  // cancelled drag (pointercancel, lost capture, a disable mid-drag) puts the split back and fires nothing.
  const drag = usePointerDrag();
  useEffect(() => {
    if (busy) drag.cancel();
  }, [busy]); // eslint-disable-line react-hooks/exhaustive-deps
  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    if (!root || busy) return;
    e.preventDefault();
    const from = percent;
    let to = from;
    drag.begin(e.currentTarget, e.pointerId, {
      move: (ev) => {
        const rect = root.getBoundingClientRect();
        const ratio = horizontal ? (ev.clientX - rect.left) / rect.width : (ev.clientY - rect.top) / rect.height;
        const next = clamp(ratio * 100);
        if (!Number.isFinite(next) || next === to) return;
        to = next;
        setSplit(next);
      },
      commit: () => {
        if (to !== from) onResize();
      },
      cancel: () => {
        if (to !== from) setSplit(from);
      },
    });
  };

  return (
    <div
      ref={rootRef}
      className="ui ui-split ui-surface"
      style={{
        flexDirection: horizontal ? 'row' : 'column',
        background,
        borderRadius: radius === '' || radius == null ? 'var(--ui-radius)' : radius,
        padding,
      }}
    >
      <ToolJet.Slot name="first" style={{ flex: `0 0 calc(${percent}% - ${gap / 2}px)` }} />
      <div
        // Dragging the divider resizes the panes; it must not start a widget drag in the editor.
        data-tj-no-drag=""
        className="ui-split-handle ui-focus"
        role="separator"
        aria-label="Resize panes"
        aria-orientation={horizontal ? 'vertical' : 'horizontal'}
        aria-valuenow={percent}
        aria-valuemin={lo}
        aria-valuemax={100 - lo}
        aria-disabled={busy || undefined}
        tabIndex={busy ? -1 : 0}
        onKeyDown={onSeparatorKeyDown}
        onPointerDown={startDrag}
        style={{
          flex: `0 0 ${gap}px`,
          background: dividerColor,
          cursor: horizontal ? 'col-resize' : 'row-resize',
        }}
      />
      <ToolJet.Slot name="second" style={{ flex: 1 }} />
    </div>
  );
};
