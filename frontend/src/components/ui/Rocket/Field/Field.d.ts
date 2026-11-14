// Types for Field.jsx, which TS can't infer from its untyped components.
// Delete this file once Field is converted to TypeScript.
import type { ComponentPropsWithoutRef, ForwardRefExoticComponent, RefAttributes } from 'react';

type DivProps = ComponentPropsWithoutRef<'div'>;

export const Field: ForwardRefExoticComponent<
  DivProps & { orientation?: 'vertical' | 'horizontal' | 'responsive' } & RefAttributes<HTMLDivElement>
>;
export const FieldLabel: ForwardRefExoticComponent<ComponentPropsWithoutRef<'label'> & RefAttributes<HTMLLabelElement>>;
export const FieldDescription: ForwardRefExoticComponent<
  ComponentPropsWithoutRef<'p'> & RefAttributes<HTMLParagraphElement>
>;
export const FieldError: ForwardRefExoticComponent<DivProps & RefAttributes<HTMLDivElement>>;
export const FieldGroup: ForwardRefExoticComponent<DivProps & RefAttributes<HTMLDivElement>>;
