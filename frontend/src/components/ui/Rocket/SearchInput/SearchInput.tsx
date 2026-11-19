import React, { forwardRef, useCallback, useRef, type ComponentPropsWithoutRef } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '../Button/Button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../InputGroup/InputGroup';

export interface SearchInputProps extends Omit<
  ComponentPropsWithoutRef<'input'>,
  'value' | 'onChange' | 'type' | 'size'
> {
  value: string;
  onValueChange: (value: string) => void;
  /** Accessible name of the clear button. */
  clearLabel?: string;
}

// Controlled search field: leading search icon, clear button while there is text. It hands back exactly what was typed;
// trimming and case-folding are the caller's matching rules. `className` goes on the group, the rest on the <input>.
const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onValueChange, clearLabel = 'Clear search', className, ...props },
  ref
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    },
    [ref]
  );

  const clear = () => {
    onValueChange('');
    inputRef.current?.focus();
  };

  return (
    <InputGroup size="small" className={className}>
      <InputGroupAddon>
        <Search aria-hidden className="tw-size-4" />
      </InputGroupAddon>
      <InputGroupInput
        ref={setRefs}
        type="text"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        {...props}
      />
      {value && (
        <InputGroupAddon align="inline-end">
          <Button variant="ghost" size="small" iconOnly aria-label={clearLabel} onClick={clear}>
            <X aria-hidden />
          </Button>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
});

export { SearchInput };
