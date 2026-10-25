import { useEffect } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';

/**
 * A field whose own state has the vendor's name (checked, fileList, targetKeys) also exposes it as `value`, the key a
 * native Form reads into its data and submission (as the shadcn pack's Checkbox does). Without it a Form silently left
 * the field out, checked or not. Hidden: the field's own property stays the one to set.
 */
export const useFormValue = (current: unknown, kind: 'boolean' | 'array') => {
  const hook = kind === 'boolean' ? ToolJet.useStateBoolean : ToolJet.useStateArray;
  const [, setValue] = (hook as typeof ToolJet.useStateArray)({ name: 'value', initialValue: (kind === 'boolean' ? false : []) as never, inspector: 'hidden' });
  useEffect(() => {
    setValue(current as never);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);
};
