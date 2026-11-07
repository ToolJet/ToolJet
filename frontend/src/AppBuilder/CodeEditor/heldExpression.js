// What a single {{ }} may hold and still be a literal: a boolean, null, a number, or a quoted string with no
// interpolation. Anything else (a reference, an operator, a call) is an expression.
const LITERAL = /^(?:true|false|null|undefined|-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?|'[^'\\]*'|"[^"\\]*"|`[^`$\\]*`)$/;

/** The fields whose control shows one chosen value (a dropdown, a switch, a toggle, a number or colour box): only these
 *  can show a resolved expression as if it were the choice made. Fields that read data (an options list, JSON) have
 *  their own rules. */
export const CHOICE_FIELDS = [
  'select',
  'switch',
  'toggle',
  'checkbox',
  'alignButtons',
  'clientServerSwitch',
  'number',
  'slider',
  'color',
  'colorSwatches',
];

/** Whether a field's stored value is an expression rather than a plain literal: a choice control (a dropdown, a
 *  switch) can only show what it resolves to, as if that were the choice made, so the field shows it in code. */
export const holdsExpression = (value) => {
  if (typeof value !== 'string') return false;
  const text = value.trim();
  if (!text.includes('{{') || !text.includes('}}')) return false;
  const whole = text.match(/^\{\{([\s\S]*)\}\}$/);
  if (whole && !whole[1].includes('{{') && !whole[1].includes('}}')) return !LITERAL.test(whole[1].trim());
  // Text around a binding, or several bindings.
  return true;
};
