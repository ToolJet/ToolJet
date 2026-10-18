/**
 * Materialization engine: widget modules.
 *
 * A widget inside a long ListView's row exists only while its row is drawn. To read a row that isn't drawn, or run an
 * action on it, the engine needs what the widget itself would expose for that row. Each module here is that, for one
 * widget type, and it is the widget's own source of truth: the widget calls the same functions when it mounts and when
 * an action runs, so a drawn and an undrawn row can't disagree.
 *
 * A module is `{ initial, actions, liveActions }`:
 * - `initial(input)` → the exposed values (no functions) the widget exposes right after mounting, from
 *   `input = { properties, styles, general, validation, validate }`: the widget's resolved props as it receives them
 *   (after `validateProperty` coercion), and `validate(value)` → `{ isValid, validationError }` (the widget's own
 *   validator; only widgets with validation use it).
 * - `actions[name](current, args, input)` → the exposed values that change when the action `name` runs with `args`
 *   (an array) on a widget whose exposed values are `current`: a pure patch, applied over `current`. Only actions
 *   whose whole effect is a change of exposed values (setVisibility, setLoading …) are here.
 * - `liveActions` → names of the actions that need the drawn widget: DOM, focus, or events they fire (click,
 *   setFocus, and TextInput's setText and clear, which fire onChange).
 *
 * Every module has a parity test that mounts the real widget and compares (`__tests__`).
 */
import { textExposure } from './Text';
import { textInputExposure } from './TextInput';
import { buttonExposure } from './Button';
import { imageExposure } from './Image';

const modules = {
  Text: textExposure,
  TextInput: textInputExposure,
  Button: buttonExposure,
  Image: imageExposure,
};

/** The module for a widget type, or undefined when it has none yet (the engine then draws the row instead). */
export const exposureOf = (componentType) =>
  Object.hasOwn(modules, componentType) ? modules[componentType] : undefined;
