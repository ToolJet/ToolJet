import React from 'react';
import { TJ } from './ui2/inputs/sdk';

// The host already dims a disabled pack component once, to half opacity (RenderWidget's .disabled on the widget's
// box), as it dims a native widget. The pack's controls dim themselves when disabled too (.ui-btn:disabled and the
// rest), so a disabled Button or field read at a quarter opacity. While the host disables a component it renders this
// marker as the first child of its root, and ui.css keeps the parts that dim themselves at full opacity after it, as
// UI 2.0 does under .ui2-disabled. A part the component disables on its own (a disabled option, a step out of reach,
// the pack's earlier Disable property) still dims, since then the host has not dimmed the box.
export const HOST_DISABLED_ATTR = 'data-tj-host-disabled';

/** The marker ui.css reads: a <template>, which draws nothing and takes no space in any layout. */
export const HostDisabledMarker = ({ on }: { on: boolean }) =>
  on ? React.createElement('template', { [HOST_DISABLED_ATTR]: '' }) : null;

/** Wraps a component that reads the host's control state (its manifest says controlState), so wrapping it records
 *  nothing new in the manifest. The marker sits before the component, so it never moves or remounts it. */
export function withHostDisabled<P extends object>(Component: React.ComponentType<P>, name: string) {
  const Wrapped = (props: P) => {
    const { disabled } = TJ.useControlState();
    return React.createElement(React.Fragment, null, React.createElement(HostDisabledMarker, { on: !!disabled }), React.createElement(Component, props));
  };
  Wrapped.displayName = name;
  return Wrapped;
}
