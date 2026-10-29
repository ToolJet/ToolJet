import React, { useEffect, useRef, useState } from 'react';
import { Circle, Heart, Star } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Field } from '../lib/Field';
import { cn } from '../lib/cn';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { useLooks } from '../lib/ui2/inputs/looks';
import type { Look } from '../lib/ui2/inputs/looks';
import { TOKEN } from '../lib/styleDefaults';
import { useReseed } from '../lib/ui2/inputs/parts';
import * as M from '../lib/ui2/inputs/model';
import { InlineLoading } from '../lib/ui2/loading/look';
import '../styles/ui2-inputs.css';

const LOOKS: Look[] = [
  ['filledColor', 'Filled icon color', '--lk-on', '#f59e0b'],
  ['emptyColor', 'Empty icon color', '--lk-off', TOKEN.mutedText],
  ['valueTextColor', 'Value text color', '--lk-value', TOKEN.mutedText],
  ['labelColor', 'Label color', '--lk-label', TOKEN.text],
  ['helpTextColor', 'Help text color', '--lk-help', TOKEN.mutedText],
  // Only the focus ring: a filled circle keeps the theme's primary.
  ['accentColor', 'Focus ring color', '--ui2-ring', TOKEN.brand],
  ['errorColor', 'Error color', '--lk-error', TOKEN.error],
];

const SIZES: Record<string, number> = { sm: 16, default: 20, lg: 28 };
const ICONS: Record<string, LucideIcon> = { star: Star, heart: Heart, circle: Circle };

export const Rating = () => {
  const [label] = ToolJet.useStateString({ name: 'label', label: 'Label', initialValue: 'Rating' });
  const [description] = ToolJet.useStateString({ name: 'description', label: 'Help text', initialValue: '' });
  const [defaultValue] = ToolJet.useStateNumber({ name: 'defaultValue', label: 'Default value', initialValue: 4 });
  const [maxProp] = ToolJet.useStateNumber({ name: 'max', label: 'Number of icons (1 to 10)', initialValue: 5 });
  const [icon] = ToolJet.useStateEnumeration({
    name: 'icon',
    label: 'Icon',
    enumDefinition: ['star', 'heart', 'circle'],
    enumLabels: { star: 'Star', heart: 'Heart', circle: 'Circle' },
    initialValue: 'star',
    inspector: 'switch',
  });
  const [size] = ToolJet.useStateEnumeration({
    name: 'size',
    label: 'Size',
    enumDefinition: ['sm', 'default', 'lg'],
    enumLabels: { sm: 'Small', default: 'Medium', lg: 'Large' },
    initialValue: 'default',
    inspector: 'switch',
  });
  const [allowHalf] = ToolJet.useStateBoolean({ name: 'allowHalf', label: 'Allow half values', initialValue: false });
  const [allowClear] = ToolJet.useStateBoolean({
    name: 'allowClear',
    label: 'Click the current value to clear',
    initialValue: true,
  });
  const [readOnly] = ToolJet.useStateBoolean({ name: 'readOnly', label: 'Read only', initialValue: false });
  const [showValue] = ToolJet.useStateBoolean({ name: 'showValue', label: 'Show value text', initialValue: false });
  const [valueLabels] = ToolJet.useStateArray({
    name: 'valueLabels',
    label: 'Value labels (one per icon)',
    placeholder: "['Poor', 'Fair', 'Good', 'Great', 'Excellent']",
    initialValue: [],
  });
  // Exposed: the rating, 0 for none.
  const [rawValue, setValue] = ToolJet.useStateNumber({
    name: 'value',
    initialValue: defaultValue,
    inspector: 'hidden',
  });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });

  const max = M.clampMax(maxProp);
  const half = allowHalf === true;
  const value = Math.min(M.normalizeRating(rawValue, max, half), max);
  // On mount an untouched Default value leaves a rating the app set (`value`, the pack's earlier name) alone.
  const keptOnMount = defaultValue === 4 && Number.isFinite(Number(rawValue));
  useReseed(defaultValue, () => setValue(M.normalizeRating(defaultValue, max, half)), { onMount: !keptOnMount });
  // A smaller maximum (or whole icons only) fits the rating, so what is exposed is what is drawn.
  useReseed([max, half], () => setValue(value), { onMount: false });
  // The same for a rating kept on mount, whose maximum was already known (a literal 3 icons under the untouched default
  // 4): exposed 4 while 3 icons are checked. An empty or fitting rating is left as the app set it, and fitting it is not
  // the user's change, so no onChange.
  useEffect(() => {
    if (keptOnMount && rawValue !== null && (rawValue as unknown) !== '' && Number(rawValue) !== value) setValue(value);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  ToolJet.useAction(
    { name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] },
    (v) => setValue(M.normalizeRating(v, max, half))
  );
  ToolJet.useAction({ name: 'clear', displayName: 'Clear' }, () => setValue(0));
  // The native Star rating's resetValue(): back to the default.
  ToolJet.useAction({ name: 'resetValue', displayName: 'Reset value' }, () =>
    setValue(M.normalizeRating(defaultValue, max, half))
  );

  const fieldId = ToolJet.useFieldId();
  const control = ToolJet.useControlState();
  // No icons is no rating, though 0 is a number.
  const rule = ToolJet.useValidation({ kind: 'choice', value, present: value > 0 });
  const looks = useLooks(LOOKS);
  ToolJet.useComponentSettings({ role: 'rating', fit: true, loading: 'own', defaultWidth: 6, defaultHeight: 5 });

  const [hover, setHover] = useState<number | null>(null);
  const radios = useRef<(HTMLSpanElement | null)[]>([]);
  const interactive = readOnly !== true && !control.disabled;
  const shown = interactive && hover !== null ? hover : value;
  const kind = ICONS[icon] ? icon : 'star';
  const Icon = ICONS[kind];
  const px = SIZES[size] || SIZES.default;
  const labels = M.list(valueLabels).map((l) => M.toText(l));
  const setTo = (next: number) => {
    if (next !== value) {
      setValue(next);
      onChange();
    }
    rule.touch();
  };
  const pointAt = (e: React.MouseEvent<HTMLSpanElement>, position: number) => {
    const r = e.currentTarget.getBoundingClientRect();
    return half && r.width && e.clientX - r.left < r.width / 2 ? position - 0.5 : position;
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>, position: number) => {
    if (!interactive) return;
    let next: number | null = null;
    // Space checks the focused icon, as it does a radio; on the checked one it keeps the rating.
    if (e.key === ' ') next = Math.ceil(value) === position ? value : position;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = M.stepRating(value, 1, max, half);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = M.stepRating(value, -1, max, half);
    else if (e.key === 'Home') next = half ? 0.5 : 1;
    else if (e.key === 'End') next = max;
    else if (/^[1-9]$/.test(e.key) && Number(e.key) <= max) next = Number(e.key);
    else if (['0', 'Delete', 'Backspace'].includes(e.key) && allowClear !== false) next = 0;
    if (next === null) return;
    e.preventDefault();
    setTo(next);
    radios.current[Math.max(1, Math.ceil(next)) - 1]?.focus();
  };
  const focusable = Math.max(1, Math.ceil(value));
  const valueText = shown > 0 ? labels[Math.ceil(shown) - 1] || `${shown} / ${max}` : labels.length ? '' : `0 / ${max}`;

  return (
    <div className="ui ui2-in" style={looks}>
      <InlineLoading loading={control.loading}>
        <Field label={label} description={description} error={rule.error} required={rule.required}>
          <div className="ui2-rating-row">
            <div
              id={fieldId}
              role="radiogroup"
              aria-label={label || 'Rating'}
              aria-readonly={readOnly || undefined}
              aria-disabled={control.disabled || undefined}
              aria-invalid={rule.error ? true : undefined}
              className={cn('ui2-rating', px >= 28 && 'is-lg')}
              onMouseLeave={() => setHover(null)}
            >
              {Array.from({ length: max }, (_, i) => {
                const position = i + 1;
                const fill = M.iconFill(position, shown);
                const on = cn('ui2-rating-on', `is-${kind}`);
                return (
                  <span
                    key={position}
                    ref={(el) => {
                      radios.current[i] = el;
                    }}
                    role="radio"
                    aria-checked={Math.ceil(value) === position}
                    aria-label={labels[i] || `${position} of ${max}`}
                    tabIndex={interactive && position === focusable ? 0 : -1}
                    onKeyDown={(e) => onKeyDown(e, position)}
                    onMouseMove={interactive ? (e) => setHover(pointAt(e, position)) : undefined}
                    onClick={
                      interactive
                        ? (e) => {
                            const next = pointAt(e, position);
                            setHover(null);
                            setTo(next === value && allowClear !== false ? 0 : next);
                          }
                        : undefined
                    }
                    className={cn('ui2-rating-item', interactive && 'is-interactive')}
                    style={{ width: px, height: px }}
                  >
                    <Icon
                      className={fill === 'full' ? on : 'ui2-rating-off'}
                      width={px}
                      height={px}
                      strokeWidth={1.5}
                    />
                    {fill === 'half' ? (
                      <span className="ui2-rating-half">
                        <Icon className={on} width={px} height={px} strokeWidth={1.5} />
                      </span>
                    ) : null}
                  </span>
                );
              })}
            </div>
            {showValue === true && valueText ? <span className="ui2-rating-value">{valueText}</span> : null}
          </div>
        </Field>
      </InlineLoading>
    </div>
  );
};
