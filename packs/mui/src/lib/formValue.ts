import { useEffect, useRef } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { sameValue } from './sameValue';

const UNSET = Symbol('unset');

/**
 * A field whose own state has the vendor's name (checked, fileList, targetKeys) also exposes it as `value`, the key a
 * native Form reads into its data and submission (as the shadcn pack's Checkbox does). Without it a Form silently left
 * the field out, checked or not. Hidden: the field's own property stays the one to set.
 *
 * Returns `publish`: a change the component makes calls it with the new value next to its own setter, before it fires
 * its event, so a handler reads `value` and the vendor key alike already changed. Copying it over in an effect left
 * onChange seeing checked true and value false (Codex review CODE-01, 2026-10-25). The effect stays for a value the app
 * sets through the property, and writes nothing that is already published.
 */
export const useFormValue = (current: unknown, kind: 'boolean' | 'array') => {
  const hook = kind === 'boolean' ? ToolJet.useStateBoolean : ToolJet.useStateArray;
  const [, setValue] = (hook as typeof ToolJet.useStateArray)({ name: 'value', initialValue: (kind === 'boolean' ? false : []) as never, inspector: 'hidden' });
  const published = useRef<unknown>(UNSET);
  const publish = (next: unknown) => {
    published.current = next;
    setValue(next as never);
  };
  useEffect(() => {
    if (published.current === UNSET || !sameValue(published.current, current)) publish(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);
  return publish;
};
