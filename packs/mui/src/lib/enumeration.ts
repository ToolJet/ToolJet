import { ToolJet } from '@tooljet/custom-component-sdk';
import { str } from './data';

/** One of `list` (matched by text, so a query's number 1 is '1'), or `fallback`. */
export const oneOf = <T extends string>(value: unknown, list: readonly T[], fallback: T): T =>
  list.find((option) => option === str(value).trim()) ?? fallback;

type EnumerationOptions<T extends string[]> = Parameters<typeof ToolJet.useStateEnumeration<T>>[0] & {
  initialValue: T[number];
};

/**
 * ToolJet.useStateEnumeration, but a value its list doesn't name (a typo or a query value in an fx field) reads as the
 * initial value. MUI draws an unknown variant, colour or size with no styles at all: a button with no fill or border,
 * a grey checkbox, a 14px radio.
 */
export const useEnumeration = <T extends string[]>(options: EnumerationOptions<T>) => {
  const [value, setValue] = ToolJet.useStateEnumeration(options);
  return [oneOf(value, options.enumDefinition, options.initialValue), setValue] as const;
};
