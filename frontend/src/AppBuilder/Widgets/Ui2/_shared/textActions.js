// setText and clear for the text widgets (Heading, Text): they hold until the Text property itself changes.
import { useExposed } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { textArg, useHasEvent, useOverrides } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';

/** The native Text's events and actions, shared by Heading and Text: onClick and onHover, setText and clear (which
 *  hold until the Text property itself changes), and the shown text exposed as `text`. */
export const useTextActions = (props) => {
  const { setExposedVariables, fireEvent, id } = props;
  const [properties, override] = useOverrides(props.properties);
  useExposed(setExposedVariables, properties, {
    text: String(properties.text ?? ''),
    setText: async (text) => override('text', textArg(text)),
    clear: async () => override('text', ''),
  });
  const clickable = useHasEvent(id, 'onClick') && !busy(properties);
  return {
    properties,
    handlers: {
      onClick: () => !busy(properties) && fireEvent('onClick'),
      onMouseEnter: () => fireEvent('onHover'),
      ...(clickable
        ? { role: 'button', tabIndex: 0, onKeyDown: (e) => e.key === 'Enter' && fireEvent('onClick') }
        : {}),
    },
    clickable,
  };
};
