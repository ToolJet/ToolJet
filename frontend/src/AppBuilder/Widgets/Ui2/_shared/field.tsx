// A form control's label, help text and validation message, and the class names inputs share.
import React, { useContext } from 'react';
import { Label, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Spinner } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { LoadingContext } from './Shell';
import type { CssVars, Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

// Label and help text colours of form controls: the labelColor and helpTextColor styles, else the theme's.
export const LABEL = 'tw-text-[color:var(--lk-label,var(--sc-foreground))]';

export const HELP = 'tw-text-[color:var(--lk-help,var(--sc-muted-foreground))]';

// A form control's box: the background, text, placeholder, border and radius styles, else shadcn's.
export const CONTROL =
  'tw-bg-[color:var(--lk-bg,transparent)] tw-text-[color:var(--lk-fg,var(--sc-foreground))] tw-border-[color:var(--lk-invalid,var(--lk-border,var(--sc-input)))] tw-rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))] placeholder:tw-text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]';

// A failed validation's colour: the errorColor style, else the theme's error colour.
export const ERROR = 'tw-text-[color:var(--lk-error,var(--sc-destructive))]';

export const INVALID_VARS: CssVars = { '--lk-invalid': 'var(--lk-error, var(--sc-destructive))' };

/** shadcn's form field: label above (with a mark when mandatory), control, then the validation error or the help
 *  text below. While loading, a spinner sits inside the control. An error also turns the control's border to the
 *  error colour (CONTROL reads --lk-invalid). */
export interface FieldProps {
  /** The control's id, so the label names it. */
  id?: string;
  /** Bound values, shown as text: no label or help text when empty. */
  label?: unknown;
  description?: unknown;
  /** The validation message (useValidation's `error`); shown instead of the help text. */
  error?: string;
  required?: boolean;
  children?: React.ReactNode;
}

export const Field = ({ id, label, description, error, required, children }: FieldProps) => {
  const loading = useContext(LoadingContext);
  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-gap-2" style={error ? INVALID_VARS : undefined}>
      {label ? (
        <Label htmlFor={id} className={LABEL}>
          {String(label)}
          {required ? <span className={cn('tw-ml-0.5', ERROR)}>*</span> : null}
        </Label>
      ) : null}
      {loading ? (
        <div className="tw-relative">
          {children}
          <Spinner className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2" />
        </div>
      ) : (
        children
      )}
      {error ? (
        <p role="alert" className={cn('tw-text-[0.8rem] tw-font-medium', ERROR)}>
          {String(error)}
        </p>
      ) : description ? (
        <p className={cn('tw-text-[0.8rem]', HELP)}>{String(description)}</p>
      ) : null}
    </div>
  );
};

/** A field's accessible name when it has no visible label (which names it through <label for>): the placeholder,
 *  else the component's name, else `fallback`. Undefined when the label names it. */
export const fieldName = (
  props: { properties?: Resolved; componentName?: WidgetProps['componentName'] },
  fallback = 'Text field'
): string | undefined => {
  const { properties = {}, componentName } = props;
  if (typeof properties.label === 'string' && properties.label.trim()) return undefined;
  const placeholder = typeof properties.placeholder === 'string' ? properties.placeholder.trim() : '';
  return placeholder || (typeof componentName === 'string' && componentName) || fallback;
};

export const textAlign = (styles: Resolved | undefined): 'left' | 'center' | 'right' | undefined =>
  ['left', 'center', 'right'].includes(styles?.textAlign) ? styles?.textAlign : undefined;
