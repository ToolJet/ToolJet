import React, { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { CalendarIcon, ChevronRight, Inbox, TrendingDown, TrendingUp } from 'lucide-react';
import { initials, list, toOptions, useAutoHeight, useExposed } from '../packHooks';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Calendar,
  Card,
  Checkbox,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Slider,
  Switch,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
  cn,
} from './ui';
import { badgeLook, isSet } from './kanbanLook';
import { lookVars, whenSet } from './shadcnLook';
import './shadcn.scss';

// shadcn/ui pack (experiment, exp/antd-pack): native ToolJet widgets rendering shadcn/ui components. Configs live in
// WidgetManager/widgets/shadcn.js (generated from WidgetManager/shadcnSource.js).

/** The widget's root: `.tj-shadcn` scopes the pack's Tailwind and maps shadcn's tokens to the app theme; the widget's
 *  set styles arrive as CSS variables its classes read (shadcnLook.js). */
export const Shell = ({ properties, styles, componentType, dataCy, children, innerRef, className }) => (
  <div
    ref={innerRef}
    data-cy={dataCy}
    className={cn('tj-shadcn', className)}
    style={{
      width: '100%',
      display: properties.visibility === false ? 'none' : 'block',
      boxShadow: styles?.boxShadow,
      ...lookVars(componentType, styles),
    }}
  >
    {children}
  </div>
);

// Label and help text colours of form controls: the labelColor and helpTextColor styles, else the theme's.
const LABEL = 'text-[color:var(--lk-label,var(--sc-foreground))]';
const HELP = 'text-[color:var(--lk-help,var(--sc-muted-foreground))]';
// A form control's box: the background, text, placeholder, border and radius styles, else shadcn's.
const CONTROL =
  'bg-[color:var(--lk-bg,transparent)] text-[color:var(--lk-fg,var(--sc-foreground))] border-[color:var(--lk-border,var(--sc-input))] rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))] placeholder:text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]';

/** shadcn's form field: label above, control, help text below. */
const Field = ({ id, label, description, children }) => (
  <div className="flex w-full flex-col gap-2">
    {label ? (
      <Label htmlFor={id} className={LABEL}>
        {String(label)}
      </Label>
    ) : null}
    {children}
    {description ? <p className={cn('text-[0.8rem]', HELP)}>{String(description)}</p> : null}
  </div>
);

const textAlign = (styles) => (['left', 'center', 'right'].includes(styles?.textAlign) ? styles.textAlign : undefined);

// ---- Actions and feedback ------------------------------------------------------------------------------------------

export const ShadButton = (props) => {
  const { properties, styles, setExposedVariables, fireEvent } = props;
  useExposed(setExposedVariables, properties, {});
  // Each variant has its own colours, so a style replaces them only when set. A set background darkens a little on
  // hover unless the hover background is set too.
  const hover = isSet(styles?.hoverBackgroundColor)
    ? 'hover:bg-[color:var(--lk-hover)]'
    : whenSet(styles, 'backgroundColor', 'hover:bg-[color:color-mix(in_srgb,var(--lk-bg)_88%,#000)]');
  return (
    <Shell {...props}>
      <Button
        variant={properties.variant || 'default'}
        size={properties.size || 'default'}
        className={cn(
          properties.fullWidth === true && 'w-full',
          whenSet(styles, 'backgroundColor', 'bg-[color:var(--lk-bg)]'),
          hover,
          whenSet(styles, 'textColor', 'text-[color:var(--lk-fg)] hover:text-[color:var(--lk-fg)]'),
          whenSet(styles, 'borderColor', 'border border-[color:var(--lk-border)]'),
          whenSet(styles, 'borderRadius', 'rounded-[var(--lk-radius)]')
        )}
        disabled={!!properties.disabledState || !!properties.loadingState}
        onClick={() => fireEvent('onClick')}
      >
        {properties.loadingState ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {String(properties.text ?? '')}
      </Button>
    </Shell>
  );
};

export const ShadAlert = (props) => {
  const { properties, styles, setExposedVariables } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props} innerRef={ref}>
      <Alert
        variant={properties.variant === 'destructive' ? 'destructive' : 'default'}
        className={cn(
          whenSet(styles, 'backgroundColor', 'bg-[color:var(--lk-bg)]'),
          whenSet(styles, 'borderColor', 'border-[color:var(--lk-border)]'),
          whenSet(styles, 'borderRadius', 'rounded-[var(--lk-radius)]')
        )}
      >
        <AlertTitle className={whenSet(styles, 'titleColor', 'text-[color:var(--lk-title)]')}>
          {String(properties.title ?? '')}
        </AlertTitle>
        {properties.description ? (
          <AlertDescription className={whenSet(styles, 'textColor', 'text-[color:var(--lk-fg)] opacity-100')}>
            {String(properties.description)}
          </AlertDescription>
        ) : null}
      </Alert>
    </Shell>
  );
};

export const ShadBreadcrumb = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  const items = list(properties.items).map((it) => (typeof it === 'string' ? it : it?.title ?? ''));
  return (
    <Shell {...props}>
      <nav aria-label="breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
          {items.map((item, i) => (
            <li key={i} className="inline-flex items-center gap-1.5">
              <span
                className={
                  i === items.length - 1
                    ? 'font-normal text-[color:var(--lk-current,var(--sc-foreground))]'
                    : 'transition-colors'
                }
              >
                {String(item)}
              </span>
              {i < items.length - 1 ? (
                <ChevronRight className="h-3.5 w-3.5 text-[color:var(--lk-sep,currentColor)]" />
              ) : null}
            </li>
          ))}
        </ol>
      </nav>
    </Shell>
  );
};

// ---- Typography ----------------------------------------------------------------------------------------------------

const HEADING = {
  h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight',
  h2: 'scroll-m-20 text-3xl font-semibold tracking-tight',
  h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
  h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
};

export const ShadHeading = (props) => {
  const { properties, setExposedVariables } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {});
  const level = HEADING[properties.level] ? properties.level : 'h2';
  const Tag = level;
  return (
    <Shell {...props} innerRef={ref}>
      <Tag
        className={cn(HEADING[level], 'text-[color:var(--lk-fg,var(--sc-foreground))]')}
        style={{ textAlign: textAlign(props.styles) }}
      >
        {String(properties.text ?? '')}
      </Tag>
    </Shell>
  );
};

const TONE = {
  paragraph: 'leading-7',
  lead: 'text-xl text-muted-foreground',
  muted: 'text-sm text-muted-foreground',
  small: 'text-sm font-medium leading-none',
  large: 'text-lg font-semibold',
};

export const ShadText = (props) => {
  const { properties, setExposedVariables } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props} innerRef={ref}>
      <p
        className={cn(
          TONE[properties.tone] || TONE.paragraph,
          'whitespace-pre-line',
          whenSet(props.styles, 'textColor', 'text-[color:var(--lk-fg)]')
        )}
        style={{ textAlign: textAlign(props.styles) }}
      >
        {String(properties.text ?? '')}
      </p>
    </Shell>
  );
};

// ---- Data display --------------------------------------------------------------------------------------------------

// The Table lives in ShadTable.jsx.

export const ShadStat = (props) => {
  const { properties, setExposedVariables } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {});
  const trend = properties.trend || 'neutral';
  const TrendIcon = trend === 'down' ? TrendingDown : TrendingUp;
  // The change badge takes the positive or negative colour for its trend (text, on a light tint) when set.
  const trendColor = { up: props.styles?.positiveColor, down: props.styles?.negativeColor }[trend];
  const body = (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-[color:var(--lk-label,var(--sc-muted-foreground))]">
          {String(properties.label ?? '')}
        </span>
        {properties.change ? (
          <Badge
            variant="outline"
            style={isSet(trendColor) ? badgeLook('change', { change: trendColor }) : undefined}
            className={cn(
              'gap-1',
              isSet(trendColor) && 'border-transparent bg-[color:var(--kb-badge-bg)] text-[color:var(--kb-badge-fg)]'
            )}
          >
            {trend !== 'neutral' ? <TrendIcon className="h-3 w-3" /> : null}
            {String(properties.change)}
          </Badge>
        ) : null}
      </div>
      <span className="text-2xl font-semibold tabular-nums tracking-tight text-[color:var(--lk-value,var(--sc-foreground))]">
        {properties.loadingState ? <Skeleton className="h-8 w-24" /> : String(properties.value ?? '')}
      </span>
      {properties.footnote ? (
        <span className="text-sm text-[color:var(--lk-help,var(--sc-muted-foreground))]">
          {String(properties.footnote)}
        </span>
      ) : null}
    </div>
  );
  return (
    <Shell {...props} innerRef={ref}>
      {properties.card === false ? (
        body
      ) : (
        <Card className="rounded-[var(--lk-radius,calc(var(--sc-radius)+4px))] border-[color:var(--lk-border,var(--sc-border))] bg-[color:var(--lk-bg,var(--sc-card))] px-6 py-5">
          {body}
        </Card>
      )}
    </Shell>
  );
};

export const ShadBadge = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props}>
      <Badge
        variant={properties.variant || 'default'}
        className={cn(
          whenSet(props.styles, 'backgroundColor', 'bg-[color:var(--lk-bg)]'),
          whenSet(props.styles, 'textColor', 'text-[color:var(--lk-fg)]'),
          whenSet(props.styles, 'borderColor', 'border-[color:var(--lk-border)]'),
          whenSet(props.styles, 'borderRadius', 'rounded-[var(--lk-radius)]')
        )}
      >
        {String(properties.text ?? '')}
      </Badge>
    </Shell>
  );
};

export const ShadAvatar = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  const size = Number(properties.size) || 32;
  const names = Array.isArray(properties.names)
    ? properties.names
    : String(properties.names ?? '')
        .split(',')
        .map((n) => n.trim())
        .filter(Boolean);
  return (
    <Shell {...props}>
      <div className="flex -space-x-2">
        {names.map((name, i) => (
          <Avatar
            key={`${name}-${i}`}
            className="ring-2 ring-[color:var(--lk-ring,var(--sc-background))]"
            style={{ width: size, height: size }}
          >
            {names.length === 1 && properties.src ? <AvatarImage src={properties.src} alt={String(name)} /> : null}
            <AvatarFallback className="bg-[color:var(--lk-bg,var(--sc-muted))] text-[color:var(--lk-fg,var(--sc-foreground))]">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
    </Shell>
  );
};

export const ShadProgress = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  const value = Math.max(0, Math.min(100, Number(properties.value) || 0));
  return (
    <Shell {...props}>
      <div className="flex flex-col gap-2">
        {properties.label || properties.showValue ? (
          <div className="flex items-center justify-between text-sm">
            <span className={cn('font-medium', LABEL)}>{String(properties.label ?? '')}</span>
            {properties.showValue ? <span className={cn('tabular-nums', HELP)}>{Math.round(value)}%</span> : null}
          </div>
        ) : null}
        <Progress value={value} className="h-[var(--lk-height,0.5rem)]" />
      </div>
    </Shell>
  );
};

export const ShadSeparator = (props) => {
  const { properties, setExposedVariables, height } = props;
  useExposed(setExposedVariables, properties, {});
  const vertical = properties.orientation === 'vertical';
  return (
    <Shell {...props}>
      <div className="flex items-center justify-center" style={{ height }}>
        <Separator
          orientation={vertical ? 'vertical' : 'horizontal'}
          className={cn(
            'bg-[color:var(--lk-line,var(--sc-border))]',
            vertical ? 'w-[var(--lk-thick,1px)]' : 'h-[var(--lk-thick,1px)]'
          )}
        />
      </div>
    </Shell>
  );
};

const SKELETON = 'bg-[color:var(--lk-bg,color-mix(in_srgb,var(--sc-primary)_10%,transparent))]';

export const ShadSkeleton = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  const lines = Math.max(1, Number(properties.lines) || 3);
  return (
    <Shell {...props}>
      <div className="flex items-start gap-4">
        {properties.avatar ? <Skeleton className={cn('h-12 w-12 shrink-0 rounded-full', SKELETON)} /> : null}
        <div className="flex flex-1 flex-col gap-2">
          {Array.from({ length: lines }, (_, i) => (
            <Skeleton key={i} className={cn('h-4', SKELETON, i === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full')} />
          ))}
        </div>
      </div>
    </Shell>
  );
};

export const ShadAccordion = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const multiple = properties.multiple === true;
  const initial = list(properties.defaultOpen).map(String);
  const [open, setOpen] = useState(initial);
  useEffect(() => setOpen(initial), [JSON.stringify(initial)]); // eslint-disable-line react-hooks/exhaustive-deps
  useExposed(setExposedVariables, properties, { openIndexes: open.map(Number) });
  const change = (value) => {
    const next = (Array.isArray(value) ? value : value ? [value] : []).map(String);
    setOpen(next);
    setExposedVariable('openIndexes', next.map(Number));
    fireEvent('onChange');
  };
  const items = list(properties.items);
  const rootProps = multiple
    ? { type: 'multiple', value: open, onValueChange: change }
    : { type: 'single', collapsible: true, value: open[0] ?? '', onValueChange: change };
  return (
    <Shell {...props} innerRef={ref}>
      <Accordion {...rootProps} className="w-full">
        {items.map((item, i) => (
          <AccordionItem key={i} value={String(i)} className="border-[color:var(--lk-border,var(--sc-border))]">
            <AccordionTrigger className="text-[color:var(--lk-title,var(--sc-foreground))] [&>svg]:text-[color:var(--lk-icon,var(--sc-muted-foreground))]">
              {String(item?.title ?? item?.label ?? '')}
            </AccordionTrigger>
            <AccordionContent className="whitespace-pre-line text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
              {String(item?.content ?? item?.children ?? '')}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Shell>
  );
};

export const ShadEmpty = (props) => {
  const { properties, setExposedVariables, fireEvent, height } = props;
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props}>
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-[var(--lk-radius,var(--sc-radius))] border border-dashed border-[color:var(--lk-border,var(--sc-border))] bg-[color:var(--lk-bg,transparent)] p-6 text-center"
        style={{ minHeight: height }}
      >
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--lk-icon-bg,var(--sc-muted))]">
          <Inbox className="h-5 w-5 text-[color:var(--lk-icon,var(--sc-muted-foreground))]" />
        </div>
        <p className="text-sm font-medium text-[color:var(--lk-title,var(--sc-foreground))]">
          {String(properties.title ?? '')}
        </p>
        {properties.description ? (
          <p className="max-w-xs text-sm text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
            {String(properties.description)}
          </p>
        ) : null}
        {properties.actionLabel ? (
          <Button size="sm" variant="outline" className="mt-2" onClick={() => fireEvent('onAction')}>
            {String(properties.actionLabel)}
          </Button>
        ) : null}
      </div>
    </Shell>
  );
};

// ---- Inputs --------------------------------------------------------------------------------------------------------

/** A single-value input: local state seeded from defaultValue, published as `value` (through `toExposed`, for
 *  controls that key options by string), plus actions built from the setter. */
const useValue = (props, initial, actions = () => ({}), toExposed = (v) => v) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const [value, setValue] = useState(initial);
  const key = JSON.stringify(initial ?? null);
  useEffect(() => setValue(initial), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useExposed(setExposedVariables, properties, { value: toExposed(value) ?? '', ...actions(setValue) });
  const change = (v, event = 'onChange') => {
    setValue(v);
    setExposedVariable('value', toExposed(v) ?? '');
    fireEvent(event);
  };
  return [value, change];
};

export const ShadInput = (props) => {
  const { properties, fireEvent, id } = props;
  const [value, change] = useValue(props, String(properties.defaultValue ?? ''), (set) => ({
    setText: async (t) => set(String(t ?? '')),
    clear: async () => set(''),
  }));
  return (
    <Shell {...props}>
      <Field id={`shad-${id}`} label={properties.label} description={properties.description}>
        <Input
          id={`shad-${id}`}
          type={properties.inputType || 'text'}
          className={CONTROL}
          value={value}
          placeholder={String(properties.placeholder ?? '')}
          disabled={!!properties.disabledState}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fireEvent('onEnterPressed')}
        />
      </Field>
    </Shell>
  );
};

export const ShadTextarea = (props) => {
  const { properties, id, height } = props;
  const [value, change] = useValue(props, String(properties.defaultValue ?? ''), (set) => ({
    setText: async (t) => set(String(t ?? '')),
    clear: async () => set(''),
  }));
  const chrome = (properties.label ? 22 : 0) + (properties.description ? 24 : 0);
  return (
    <Shell {...props}>
      <Field id={`shad-${id}`} label={properties.label} description={properties.description}>
        <Textarea
          id={`shad-${id}`}
          className={CONTROL}
          value={value}
          placeholder={String(properties.placeholder ?? '')}
          disabled={!!properties.disabledState}
          style={{ height: Math.max(60, (Number(height) || 96) - chrome) }}
          onChange={(e) => change(e.target.value)}
        />
      </Field>
    </Shell>
  );
};

export const ShadSelect = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent, id } = props;
  // Radix Select keys its items by string; keep the original values for the exposed value.
  const options = toOptions(properties.options);
  const byKey = new Map(options.map((o) => [String(o.value), o]));
  const initial =
    properties.defaultValue === '' || properties.defaultValue === undefined ? '' : String(properties.defaultValue);
  const [key, setKey] = useState(initial);
  useEffect(() => setKey(initial), [initial]);
  const selectedOption = byKey.get(key) || {};
  useExposed(setExposedVariables, properties, {
    value: selectedOption.value ?? '',
    selectedOption,
    selectOption: async (v) => setKey(v === undefined || v === null ? '' : String(v)),
    clear: async () => setKey(''),
  });
  return (
    <Shell {...props}>
      <Field id={`shad-${id}`} label={properties.label} description={properties.description}>
        <Select
          value={key}
          disabled={!!properties.disabledState}
          onValueChange={(next) => {
            setKey(next);
            setExposedVariable('value', byKey.get(next)?.value ?? '');
            setExposedVariable('selectedOption', byKey.get(next) || {});
            fireEvent('onChange');
          }}
        >
          <SelectTrigger
            id={`shad-${id}`}
            className={cn(CONTROL, 'data-[placeholder]:text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]')}
          >
            <SelectValue placeholder={String(properties.placeholder ?? '')} />
          </SelectTrigger>
          {/* The list opens in the pack's portal root, outside the widget: it takes the widget's style variables itself. */}
          <SelectContent style={lookVars(props.componentType, props.styles)}>
            {options.map((o) => (
              <SelectItem key={String(o.value)} value={String(o.value)}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </Shell>
  );
};

const useChecked = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const [checked, setChecked] = useState(!!properties.defaultChecked);
  useEffect(() => setChecked(!!properties.defaultChecked), [properties.defaultChecked]);
  useExposed(setExposedVariables, properties, { value: checked });
  const change = (v) => {
    setChecked(v === true);
    setExposedVariable('value', v === true);
    fireEvent('onChange');
  };
  return [checked, change];
};

const CheckedRow = ({ id, control, label, description }) => (
  <div className="flex items-start gap-3">
    {control}
    <div className="grid gap-1.5 leading-none">
      <Label htmlFor={id} className={LABEL}>
        {String(label ?? '')}
      </Label>
      {description ? <p className={cn('text-sm', HELP)}>{String(description)}</p> : null}
    </div>
  </div>
);

export const ShadCheckbox = (props) => {
  const [checked, change] = useChecked(props);
  const id = `shad-${props.id}`;
  return (
    <Shell {...props}>
      <CheckedRow
        id={id}
        label={props.properties.label}
        description={props.properties.description}
        control={
          <Checkbox
            id={id}
            checked={checked}
            disabled={!!props.properties.disabledState}
            onCheckedChange={change}
            className="data-[state=unchecked]:border-[color:var(--lk-border,var(--sc-primary))]"
          />
        }
      />
    </Shell>
  );
};

export const ShadSwitch = (props) => {
  const [checked, change] = useChecked(props);
  const id = `shad-${props.id}`;
  return (
    <Shell {...props}>
      <CheckedRow
        id={id}
        label={props.properties.label}
        description={props.properties.description}
        control={
          <Switch
            id={id}
            checked={checked}
            disabled={!!props.properties.disabledState}
            onCheckedChange={change}
            className="data-[state=unchecked]:bg-[color:var(--lk-off,var(--sc-input))]"
          />
        }
      />
    </Shell>
  );
};

export const ShadRadioGroup = (props) => {
  const { properties, id } = props;
  const options = toOptions(properties.options);
  const byKey = new Map(options.map((o) => [String(o.value), o]));
  const initial =
    properties.defaultValue === '' || properties.defaultValue === undefined ? '' : String(properties.defaultValue);
  const [key, change] = useValue(
    props,
    initial,
    (set) => ({ selectOption: async (v) => set(v === undefined || v === null ? '' : String(v)) }),
    (k) => byKey.get(k)?.value ?? ''
  );
  return (
    <Shell {...props}>
      <Field label={properties.label} description={properties.description}>
        <RadioGroup
          value={key}
          disabled={!!properties.disabledState}
          className={properties.horizontal === true ? 'flex flex-wrap gap-4' : undefined}
          onValueChange={(next) => change(next)}
        >
          {options.map((o) => {
            const itemId = `shad-${id}-${String(o.value)}`;
            return (
              <div key={String(o.value)} className="flex items-center gap-2">
                <RadioGroupItem value={String(o.value)} id={itemId} />
                <Label htmlFor={itemId} className="font-normal text-[color:var(--lk-fg,var(--sc-foreground))]">
                  {o.label}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </Field>
    </Shell>
  );
};

export const ShadSlider = (props) => {
  const { properties } = props;
  const raw = properties.defaultValue;
  const isRange = Array.isArray(raw);
  const initial = isRange ? raw.map(Number) : [Number(raw) || 0];
  const [value, change] = useValue(props, isRange ? initial : initial[0]);
  const [live, setLive] = useState(initial);
  useEffect(() => setLive(Array.isArray(value) ? value : [Number(value) || 0]), [JSON.stringify(value)]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Shell {...props}>
      <Field
        label={properties.label ? `${properties.label}${live.length ? `: ${live.join(' to ')}` : ''}` : ''}
        description={properties.description}
      >
        <div className="flex h-5 items-center">
          <Slider
            min={Number(properties.min) || 0}
            max={Number(properties.max ?? 100)}
            step={Number(properties.step) || 1}
            value={live}
            disabled={!!properties.disabledState}
            onValueChange={setLive}
            onValueCommit={(v) => change(isRange ? v : v[0])}
          />
        </div>
      </Field>
    </Shell>
  );
};

const ymd = (d) => (d ? dayjs(d).format('YYYY-MM-DD') : '');

export const ShadDatePicker = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent, id } = props;
  const range = properties.mode === 'range';
  const format = properties.format || 'DD MMM YYYY';
  const raw = properties.defaultValue;
  const initial = range
    ? {
        from: list(raw)[0] ? dayjs(list(raw)[0]).toDate() : undefined,
        to: list(raw)[1] ? dayjs(list(raw)[1]).toDate() : undefined,
      }
    : raw
    ? dayjs(raw).toDate()
    : undefined;
  const [selected, setSelected] = useState(initial);
  useEffect(() => setSelected(initial), [JSON.stringify(raw ?? null), range]); // eslint-disable-line react-hooks/exhaustive-deps
  const [open, setOpen] = useState(false);
  const values = range
    ? { value: [ymd(selected?.from), ymd(selected?.to)], startDate: ymd(selected?.from), endDate: ymd(selected?.to) }
    : { value: ymd(selected), startDate: '', endDate: '' };
  useExposed(setExposedVariables, properties, { ...values, clear: async () => setSelected(range ? {} : undefined) });
  const text = range
    ? selected?.from
      ? `${dayjs(selected.from).format(format)}${selected.to ? ` – ${dayjs(selected.to).format(format)}` : ''}`
      : ''
    : selected
    ? dayjs(selected).format(format)
    : '';
  return (
    <Shell {...props}>
      <Field id={`shad-${id}`} label={properties.label} description={properties.description}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={`shad-${id}`}
              variant="outline"
              disabled={!!properties.disabledState}
              className={cn(
                'w-full justify-start text-left font-normal',
                CONTROL,
                !text && 'text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]'
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {text || String(properties.placeholder ?? '')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" style={lookVars(props.componentType, props.styles)}>
            <Calendar
              mode={range ? 'range' : 'single'}
              numberOfMonths={range ? 2 : 1}
              selected={selected}
              defaultMonth={range ? selected?.from : selected}
              onSelect={(next) => {
                setSelected(next);
                if (range) {
                  setExposedVariable('value', [ymd(next?.from), ymd(next?.to)]);
                  setExposedVariable('startDate', ymd(next?.from));
                  setExposedVariable('endDate', ymd(next?.to));
                  if (next?.from && next?.to) setOpen(false);
                } else {
                  setExposedVariable('value', ymd(next));
                  setOpen(false);
                }
                fireEvent('onChange');
              }}
            />
          </PopoverContent>
        </Popover>
      </Field>
    </Shell>
  );
};

export const ShadToggleGroup = (props) => {
  const { properties } = props;
  const options = toOptions(properties.options);
  const byKey = new Map(options.map((o) => [String(o.value), o]));
  const initial =
    properties.defaultValue === '' || properties.defaultValue === undefined ? '' : String(properties.defaultValue);
  const [key, change] = useValue(props, initial, undefined, (k) => byKey.get(k)?.value ?? '');
  return (
    <Shell {...props}>
      <ToggleGroup
        type="single"
        value={key}
        disabled={!!properties.disabledState}
        className={cn(
          'rounded-[var(--lk-radius,var(--sc-radius))] bg-[color:var(--lk-bg,var(--sc-muted))] text-[color:var(--lk-fg,var(--sc-muted-foreground))]',
          properties.fullWidth === true && 'flex w-full'
        )}
        onValueChange={(next) => next && change(next)}
      >
        {options.map((o) => (
          <ToggleGroupItem
            key={String(o.value)}
            value={String(o.value)}
            className="rounded-[calc(var(--lk-radius,var(--sc-radius))*0.8)] data-[state=on]:bg-[color:var(--lk-on-bg,var(--sc-background))] data-[state=on]:text-[color:var(--lk-on-fg,var(--sc-foreground))]"
          >
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Shell>
  );
};
