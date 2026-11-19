import type {
  ButtonHTMLAttributes,
  ForwardRefExoticComponent,
  HTMLAttributes,
  RefAttributes,
  TextareaHTMLAttributes,
} from 'react';
import type { ButtonProps } from '../Button/Button';
import type { InputProps } from '../Input/Input';

export type InputGroupSize = 'large' | 'default' | 'small';

export interface InputGroupProps extends HTMLAttributes<HTMLDivElement> {
  size?: InputGroupSize;
}

export interface InputGroupAddonProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'inline-start' | 'inline-end';
}

export function InputGroup(props: InputGroupProps): JSX.Element;
export function InputGroupAddon(props: InputGroupAddonProps): JSX.Element;
export function InputGroupButton(props: ButtonProps): JSX.Element;
export function InputGroupText(props: HTMLAttributes<HTMLSpanElement>): JSX.Element;
export const InputGroupInput: ForwardRefExoticComponent<InputProps & RefAttributes<HTMLInputElement>>;
export const InputGroupSelect: ForwardRefExoticComponent<
  ButtonHTMLAttributes<HTMLButtonElement> & { size?: InputGroupSize } & RefAttributes<HTMLButtonElement>
>;
export const InputGroupTextarea: ForwardRefExoticComponent<
  TextareaHTMLAttributes<HTMLTextAreaElement> & RefAttributes<HTMLTextAreaElement>
>;
