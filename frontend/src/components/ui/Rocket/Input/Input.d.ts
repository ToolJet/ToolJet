// Types for Input.jsx, which TS can't infer from its untyped forwardRef callback.
// Delete this file once Input is converted to TypeScript.
import type { ForwardRefExoticComponent, InputHTMLAttributes, RefAttributes } from 'react';

type InputSize = 'large' | 'default' | 'small';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
}

export declare const Input: ForwardRefExoticComponent<InputProps & RefAttributes<HTMLInputElement>>;

export declare function inputVariants(props?: { size?: InputSize | null; className?: string }): string;
