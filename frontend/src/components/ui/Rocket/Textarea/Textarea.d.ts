import type { ForwardRefExoticComponent, RefAttributes, TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  size?: 'large' | 'default' | 'small';
}

export const Textarea: ForwardRefExoticComponent<TextareaProps & RefAttributes<HTMLTextAreaElement>>;
export function textareaVariants(props?: { size?: TextareaProps['size']; className?: string }): string;
