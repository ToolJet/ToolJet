// setText and clear for the text widgets (Heading, Text): they hold until the Text property itself changes.
import { useExposed } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { useHasEvent, useOverrides } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { onKeyActivate } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';
import type { KeyboardEvent } from 'react';
import type { Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';

/** Spread on the text's element: its events, and a button's role and keyboard when the app wires onClick. */
export interface TextHandlers {
  onClick: () => void;
  onMouseEnter: () => void;
  role?: 'button';
  tabIndex?: number;
  onKeyDown?: (e: KeyboardEvent) => void;
}

export interface TextActions {
  /** The properties with setText and clear applied. */
  properties: Resolved;
  handlers: TextHandlers;
  clickable: boolean;
}

/** The native Text's events and actions, shared by Heading and Text: onClick and onHover, setText and clear (which
 *  hold until the Text property itself changes), and the shown text exposed as `text`. */
export const useTextActions = (
  props: Pick<WidgetProps, 'id' | 'properties' | 'setExposedVariables' | 'fireEvent'>
): TextActions => {
  const { setExposedVariables, fireEvent, id } = props;
  const [properties, override] = useOverrides(props.properties);
  useExposed(setExposedVariables, properties, {
    text: String(properties.text ?? ''),
    setText: async (text: unknown) => override('text', toText(text)),
    clear: async () => override('text', ''),
  });
  const clickable = useHasEvent(id, 'onClick') && !busy(properties);
  return {
    properties,
    handlers: {
      onClick: () => !busy(properties) && fireEvent('onClick'),
      onMouseEnter: () => fireEvent('onHover'),
      ...(clickable ? { role: 'button', tabIndex: 0, onKeyDown: onKeyActivate(() => fireEvent('onClick')) } : {}),
    },
    clickable,
  };
};
