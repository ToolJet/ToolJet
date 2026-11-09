import type { HTMLAttributes, LabelHTMLAttributes } from 'react';

export interface FieldProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'vertical' | 'horizontal' | 'responsive';
}

export function Field(props: FieldProps): JSX.Element;
export function FieldLabel(props: LabelHTMLAttributes<HTMLLabelElement>): JSX.Element;
export function FieldDescription(props: HTMLAttributes<HTMLParagraphElement>): JSX.Element;
export function FieldError(props: HTMLAttributes<HTMLDivElement>): JSX.Element;
export function FieldGroup(props: HTMLAttributes<HTMLDivElement>): JSX.Element;
export function FieldContent(props: HTMLAttributes<HTMLDivElement>): JSX.Element;
export function FieldSet(props: HTMLAttributes<HTMLFieldSetElement>): JSX.Element;
export function FieldLegend(props: HTMLAttributes<HTMLLegendElement>): JSX.Element;
export function FieldTitle(props: HTMLAttributes<HTMLDivElement>): JSX.Element;
export function FieldSeparator(props: HTMLAttributes<HTMLDivElement>): JSX.Element;
