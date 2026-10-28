import { useEffect, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';

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

type Check = { isValid?: boolean; error: string; required: boolean; touch: () => void };

/**
 * The host's validation with one more rule on top: `error` shows the rule's message once the field is touched (or the
 * host's own message), and the exposed isValid is false while either fails, so a Form will not submit it.
 */
export const useRuleCheck = <C extends Check>(check: C, rule: string): C => {
  const [touched, setTouched] = useState(false);
  const [, setIsValid] = (ToolJet as unknown as {
    useStateBoolean: (o: Record<string, unknown>) => [boolean, (v: boolean) => void];
  }).useStateBoolean({ name: 'isValid', initialValue: true, inspector: 'hidden' });
  const isValid = check.isValid !== false && !rule;
  // Declared after the host's useValidation, so it runs after the host publishes its own isValid and has the last word.
  useEffect(() => {
    setIsValid(isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid, check.isValid]);
  return {
    ...check,
    isValid,
    error: (touched && rule) || check.error || '',
    touch: () => {
      setTouched(true);
      check.touch();
    },
  };
};
