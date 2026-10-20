// A form control's label, help text and validation message, and the class names inputs share.
import React, { useContext } from 'react';
import { Label, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Spinner } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { LoadingContext, Shell } from './Shell';
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

/** A control's label, with a mark when the field is mandatory. */
export const FieldLabel = ({ id, text, required }: { id?: string; text: string; required?: boolean }) => (
  <Label htmlFor={id} className={LABEL}>
    {text}
    {required ? <span className={cn('tw-ml-0.5', ERROR)}>*</span> : null}
  </Label>
);

/** A widget's control DOM id: withControlState's domId, `shad-<id>-<instance>`, one per rendered instance (a component
 *  id repeats in List view rows, Kanban cards and module instances). `shad-<id>` only for a widget drawn without it. */
export const fieldIdOf = (props: { id?: string; domId?: string }): string => props.domId ?? `shad-${props.id}`;

/** The id of the note under a widget's control (its validation message, else its help text). */
export const noteIdOf = (props: { id?: string; domId?: string }) => `${fieldIdOf(props)}-note`;

/** A mandatory combobox (a picker's trigger) says so to assistive tech before it is touched too; the label's mark is
 *  only visual. Only for roles that take aria-required (combobox, textbox, listbox, radiogroup), not a button. */
export const requiredAria = (props: { validation?: Resolved }) => ({
  'aria-required': props.validation?.mandatory === true || undefined,
});

/** What a widget's form control carries for assistive tech: invalid while `error` shows, and described by the note
 *  under it (the error, else the help text), so a screen reader reads both with the control. */
export const controlAria = (props: { id?: string; domId?: string; properties?: Resolved }, error: unknown) => ({
  'aria-invalid': !!error || undefined,
  'aria-describedby': props.id && (error || props.properties?.description) ? noteIdOf(props) : undefined,
});

/** The validation message, else the help text, under a control; `size` is the text size class. `controlId` (the
 *  control's id, fieldIdOf) gives the note the id controlAria points at. */
export const FieldNote = ({
  error,
  description,
  size,
  controlId,
}: {
  error?: string;
  description?: unknown;
  size: string;
  controlId?: string;
}) => {
  const id = controlId ? `${controlId}-note` : undefined;
  return error ? (
    <p id={id} role="alert" className={cn(size, 'tw-font-medium', ERROR)}>
      {String(error)}
    </p>
  ) : description ? (
    <p id={id} className={cn(size, HELP)}>
      {String(description)}
    </p>
  ) : null;
};

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
      {label ? <FieldLabel id={id} text={String(label)} required={required} /> : null}
      {loading ? (
        <div className="tw-relative">
          {children}
          <Spinner className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2" />
        </div>
      ) : (
        children
      )}
      <FieldNote error={error} description={description} size="tw-text-[0.8rem]" controlId={id} />
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

/** A form widget's root: Shell (loading look, visibility) around its Field. The label and help text come from
 *  `properties` (the widget's properties with any action overrides applied); the error and mark from `check`. */
export interface FormFieldProps {
  props: WidgetProps;
  properties: Resolved;
  check: { error: string; required: boolean };
  innerRef?: React.Ref<HTMLDivElement>;
  /** In place of properties.label or check.error, where the widget shows its own. */
  label?: unknown;
  error?: string;
  children?: React.ReactNode;
}

export const FormField = ({ props, properties, check, innerRef, label, error, children }: FormFieldProps) => (
  <Shell {...props} innerRef={innerRef}>
    <Field
      id={fieldIdOf(props)}
      label={label ?? properties.label}
      description={properties.description}
      error={error ?? check.error}
      required={check.required}
    >
      {children}
    </Field>
  </Shell>
);
