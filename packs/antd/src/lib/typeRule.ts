// UI 2.0's format check for an input of type email or url (Ui2/Input/Input.tsx, as the shadcn pack's Input has it),
// run before the Validation section's rules. An empty value passes: Required is the Validation section's.
const EMAIL =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export const typeRule = (type: string, value: unknown): string => {
  const text = String(value ?? '').trim();
  if (!text) return '';
  if (type === 'email') return EMAIL.test(text) ? '' : 'Enter a valid email address';
  if (type === 'url') {
    try {
      new URL(text); // eslint-disable-line no-new
      return '';
    } catch {
      return 'Enter a valid URL';
    }
  }
  return '';
};
