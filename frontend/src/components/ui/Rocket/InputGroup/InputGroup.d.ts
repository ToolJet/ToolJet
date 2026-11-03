// Types for InputGroup.jsx, which TS can't infer from its untyped components.
// Delete this file once InputGroup is converted to TypeScript.
import type {
  ButtonHTMLAttributes,
  FC,
  ForwardRefExoticComponent,
  HTMLAttributes,
  InputHTMLAttributes,
  RefAttributes,
  TextareaHTMLAttributes,
} from 'react';

type InputGroupSize = 'large' | 'default' | 'small';

export interface InputGroupProps extends HTMLAttributes<HTMLDivElement> {
  size?: InputGroupSize;
}

export interface InputGroupAddonProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'inline-start' | 'inline-end';
}

export interface InputGroupInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputGroupSize;
}

export interface InputGroupButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'xs' | 'sm' | 'icon-xs' | 'icon-sm';
}

export interface InputGroupSelectProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: InputGroupSize;
}

export declare const InputGroup: FC<InputGroupProps>;
export declare const InputGroupAddon: FC<InputGroupAddonProps>;
export declare const InputGroupButton: FC<InputGroupButtonProps>;
export declare const InputGroupText: FC<HTMLAttributes<HTMLSpanElement>>;
export declare const InputGroupInput: ForwardRefExoticComponent<InputGroupInputProps & RefAttributes<HTMLInputElement>>;
export declare const InputGroupSelect: ForwardRefExoticComponent<
  InputGroupSelectProps & RefAttributes<HTMLButtonElement>
>;
export declare const InputGroupTextarea: FC<TextareaHTMLAttributes<HTMLTextAreaElement>>;
