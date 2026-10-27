/**
 * Materialization engine: widget modules.
 *
 * A widget inside a long ListView's row exists only while its row is drawn. To read a row that isn't drawn, or run an
 * action on it, the engine needs what the widget itself would expose for that row. Each module here is that, for one
 * widget type, and it is the widget's own source of truth: the widget calls the same functions when it mounts and when
 * an action runs, so a drawn and an undrawn row can't disagree.
 *
 * A module is `{ initial, actions, liveActions, keepsRow }`:
 * - `initial(input)` → the exposed values (no functions) the widget exposes right after mounting, from
 *   `input = { properties, styles, general, validation, validate }`: the widget's resolved props as it receives them
 *   (after `validateProperty` coercion), and `validate(value)` → `{ isValid, validationError }` (the widget's own
 *   validator; only widgets with validation use it).
 * - `actions[name](current, args, input)` → the exposed values that change when the action `name` runs with `args`
 *   (an array) on a widget whose exposed values are `current`: a pure patch, applied over `current`. Only actions
 *   whose whole effect is a change of exposed values (setVisibility, setLoading …) are here.
 * - `liveActions` → names of the actions that need the drawn widget: DOM, focus, or events they fire (click,
 *   setFocus, and TextInput's setText and clear, which fire onChange).
 * - `keepsRow` (optional) → the live actions that leave something only the drawn widget keeps (a typed value, focus):
 *   in a long ListView their row then stays drawn, as a row the user typed in does (the last 50 such rows).
 *
 * Every module has a parity test that mounts the real widget and compares (`__tests__`). One known gap: a custom rule
 * that reads the widget's own exposed value gives a drawn widget's first isValid from whatever the store held when it
 * mounted (another row's, or an earlier read's), which no pure module can reproduce; the computed row settles on the
 * row's own value.
 */
import { textExposure } from './Text';
import { textInputExposure } from './TextInput';
import { buttonExposure } from './Button';
import { imageExposure } from './Image';
import { checkboxExposure } from './Checkbox';
import { toggleSwitchV2Exposure } from './ToggleSwitchV2';
import { numberInputExposure } from './NumberInput';
import { dropdownV2Exposure } from './DropdownV2';
import { multiselectV2Exposure } from './MultiselectV2';
import { radioButtonV2Exposure } from './RadioButtonV2';
import { datePickerV2Exposure } from './DatePickerV2';
import { timePickerExposure } from './TimePicker';
import { datetimePickerV2Exposure } from './DatetimePickerV2';
import { daterangePickerExposure } from './DaterangePicker';

const modules = {
  Text: textExposure,
  TextInput: textInputExposure,
  Button: buttonExposure,
  Image: imageExposure,
  Checkbox: checkboxExposure,
  ToggleSwitchV2: toggleSwitchV2Exposure,
  NumberInput: numberInputExposure,
  DropdownV2: dropdownV2Exposure,
  MultiselectV2: multiselectV2Exposure,
  RadioButtonV2: radioButtonV2Exposure,
  DatePickerV2: datePickerV2Exposure,
  TimePicker: timePickerExposure,
  DatetimePickerV2: datetimePickerV2Exposure,
  DaterangePicker: daterangePickerExposure,
};

/** The module for a widget type, or undefined when it has none yet (the engine then draws the row instead). */
export const exposureOf = (componentType) =>
  Object.hasOwn(modules, componentType) ? modules[componentType] : undefined;
