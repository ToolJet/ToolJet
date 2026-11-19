// Types for Spinner.jsx, which TS can't infer from its untyped forwardRef callback.
// Delete this file once Spinner is converted to TypeScript.
import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';

export interface SpinnerProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  size?: 'large' | 'default' | 'small';
  /** Accessible name; defaults to "Loading". */
  label?: string;
}

export declare const Spinner: ForwardRefExoticComponent<SpinnerProps & RefAttributes<SVGSVGElement>>;
export declare function spinnerVariants(props?: { size?: SpinnerProps['size'] }): string;
