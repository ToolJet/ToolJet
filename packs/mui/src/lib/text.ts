import { ToolJet } from '@tooljet/custom-component-sdk';
import { str } from './data';

/** A text prop as a string: a binding can resolve to a number, null, NaN or an array, and components do string work
 *  on it (trim, split, compare). NaN and Infinity read as empty. */
export const toText = (v: unknown): string => (typeof v === 'number' && !Number.isFinite(v) ? '' : str(v));

// ToolJet.useStateString with its value always a string (the setter is the SDK's).
export const useStateText = (options: Parameters<typeof ToolJet.useStateString>[0]) => {
  const [value, setValue] = ToolJet.useStateString(options);
  return [toText(value), setValue] as const;
};
