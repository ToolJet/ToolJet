import React, { useEffect } from 'react';
import {
  Alert as MuiAlert,
  AlertTitle,
  Avatar as MuiAvatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip as MuiChip,
  Divider as MuiDivider,
  LinearProgress as MuiLinearProgress,
  Pagination as MuiPagination,
  Skeleton,
  Stack,
  Step,
  StepButton,
  StepLabel,
  Stepper as MuiStepper,
  Typography as MuiTypography,
} from '@mui/material';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { toText, useStateText } from '../lib/text';
import { MuiProvider, useThemeStyles } from '../lib/MuiProvider';
import { PALETTE_COLORS } from '../lib/field';
import { iconOf, ICONS } from '../lib/icons';
import { str, toArray, type Row } from '../lib/data';
import { formatNumber, toNumber, type NumberFormat } from '../lib/format';
import { BlockSkeleton, Loading, Spinner, TextSkeleton } from '../lib/loading';
import { useFitText } from '../lib/fitText';

const COLORS = ['default', ...PALETTE_COLORS];

// MUI's Chip: label, color (default or a palette colour), variant (filled, outlined), size, icon (an icon name),
// clickable; events onClick and onDelete (shows the delete icon).
export const Chip = () => {
  const [label] = useStateText({ name: 'label', label: 'Label', initialValue: 'Chip' });
  const [colorProp] = ToolJet.useStateEnumeration({ name: 'color', label: 'Color', enumDefinition: COLORS, initialValue: 'default' });
  const [variantProp] = ToolJet.useStateEnumeration({ name: 'variant', label: 'Variant', enumDefinition: ['filled', 'outlined'], initialValue: 'filled' });
  // A role value can set both: { color, variant }.
  const look = variantProp && typeof variantProp === 'object' ? (variantProp as Record<string, string>) : null;
  const color = look?.color ?? colorProp;
  const variant = look?.variant ?? variantProp;
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'medium'], initialValue: 'medium' });
  const [icon] = useStateText({ name: 'icon', label: 'Icon', description: 'An icon name, such as Check.', initialValue: '' });
  const [deletable] = ToolJet.useStateBoolean({ name: 'deletable', label: 'Deletable', description: 'Show the delete icon (fires onDelete).', initialValue: false });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const onDelete = ToolJet.useEventCallback({ name: 'onDelete' });
  const { loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 4, defaultHeight: 3.6 });
  return (
    <MuiProvider overrides={overrides} fill className="tj-mui-center tj-mui-start">
      <Loading loading={loading} look={<Skeleton variant="rounded" width="100%" height="100%" sx={{ borderRadius: 16 }} />}>
        <MuiChip
          label={label}
          color={color as 'default'}
          variant={variant as 'filled'}
          size={size as 'small'}
          icon={iconOf(icon, 'small') as React.ReactElement | undefined}
          onClick={() => onClick()}
          onDelete={deletable ? () => onDelete() : undefined}
        />
      </Loading>
    </MuiProvider>
  );
};

// MUI's Alert: severity (success, info, warning, error), variant (standard, filled, outlined), title (AlertTitle),
// children (the message), icon (false to hide); closable shows the close button (event onClose); actionText adds a
// button at the right (event onAction). Actions show and close.
export const Alert = () => {
  const [severity] = ToolJet.useStateEnumeration({ name: 'severity', label: 'Severity', enumDefinition: ['success', 'info', 'warning', 'error'], initialValue: 'info' });
  const [variant] = ToolJet.useStateEnumeration({ name: 'variant', label: 'Variant', enumDefinition: ['standard', 'filled', 'outlined'], initialValue: 'standard' });
  const [title] = useStateText({ name: 'title', label: 'Title', initialValue: 'Heads up' });
  const [children] = useStateText({ name: 'children', label: 'Message', initialValue: 'This is an alert.' });
  const [icon] = ToolJet.useStateBoolean({ name: 'icon', label: 'Icon', description: 'The severity icon.', initialValue: true });
  const [closable] = ToolJet.useStateBoolean({ name: 'closable', label: 'Closable', initialValue: false });
  const [actionText] = useStateText({ name: 'actionText', label: 'Action text', description: 'A button at the right; empty for none.', initialValue: '' });
  const [open, setOpen] = ToolJet.useStateBoolean({ name: 'open', initialValue: true, inspector: 'hidden' });
  const onClose = ToolJet.useEventCallback({ name: 'onClose' });
  const onAction = ToolJet.useEventCallback({ name: 'onAction' });
  const { loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  // A title and a one-line message: MUI's natural 76px.
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 8 });
  ToolJet.useAction({ name: 'show', displayName: 'Show' }, () => setOpen(true));
  ToolJet.useAction({ name: 'close', displayName: 'Close' }, () => setOpen(false));
  if (open === false) return <MuiProvider overrides={overrides}>{null}</MuiProvider>;
  // Fills its box, and a long message scrolls inside it (MUI's message part scrolls): drawn at its natural height, the
  // host cut what did not fit.
  return (
    <MuiProvider overrides={overrides} fill>
      <Loading loading={loading} fill look={<BlockSkeleton variant="rounded" />}>
        <MuiAlert
          severity={severity as 'info'}
          variant={variant as 'standard'}
          sx={{ height: '100%', boxSizing: 'border-box', '& .MuiAlert-message': { overflow: 'auto', minHeight: 0 } }}
          icon={icon ? undefined : false}
          onClose={
            closable
              ? () => {
                  setOpen(false);
                  onClose();
                }
              : undefined
          }
          action={
            actionText ? (
              <Button color="inherit" size="small" onClick={() => onAction()}>
                {actionText}
              </Button>
            ) : undefined
          }
        >
          {title ? <AlertTitle>{title}</AlertTitle> : null}
          {children}
        </MuiAlert>
      </Loading>
    </MuiProvider>
  );
};

const TEXT_COLORS = ['text.primary', 'text.secondary', 'primary.main', 'success.main', 'warning.main', 'error.main', 'inherit'];

/** Typography's props that both text components share. */
const useTypography = (variants: string[], initial: string, text: string) => {
  const [children, setChildren] = useStateText({ name: 'children', label: 'Text', initialValue: text });
  const [variant] = ToolJet.useStateEnumeration({ name: 'variant', label: 'Variant', enumDefinition: variants, initialValue: initial });
  const [color] = ToolJet.useStateEnumeration({ name: 'color', label: 'Color', enumDefinition: TEXT_COLORS, initialValue: 'text.primary' });
  const [align] = ToolJet.useStateEnumeration({ name: 'align', label: 'Align', enumDefinition: ['left', 'center', 'right', 'justify'], initialValue: 'left' });
  const [noWrap] = ToolJet.useStateBoolean({ name: 'noWrap', label: 'No wrap', description: 'One line, cut with an ellipsis.', initialValue: false });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  ToolJet.useAction({ name: 'setText', displayName: 'Set text', params: [{ handle: 'text', displayName: 'Text' }] }, (next) => setChildren(str(next)));
  return { children, variant, color, align, noWrap, onClick };
};

const TypographyView = ({ t, gutterBottom = false, heading = false }: { t: ReturnType<typeof useTypography>; gutterBottom?: boolean; heading?: boolean }) => (
  <MuiTypography
    variant={t.variant as 'body1'}
    color={t.color}
    align={t.align as 'left'}
    noWrap={t.noWrap}
    gutterBottom={gutterBottom}
    onClick={() => t.onClick()}
    sx={{ whiteSpace: t.noWrap ? undefined : 'pre-wrap', ...(heading && t.variant.startsWith('subtitle') ? { fontWeight: 600 } : null) }}
  >
    {t.children}
  </MuiTypography>
);

// MUI's Typography for headings: children, variant h1 to h6 (MUI's type scale: h1 is display size, h4 to h6 suit page
// and section titles) or subtitle1/subtitle2 (a card or list item's title, drawn semibold as a heading), color (a theme path such as text.secondary), align, noWrap, gutterBottom. Event onClick.
export const TypographyHeading = () => {
  const t = useTypography(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle1', 'subtitle2'], 'h5', 'Heading');
  const [gutterBottom] = ToolJet.useStateBoolean({ name: 'gutterBottom', label: 'Gutter bottom', initialValue: false });
  const { loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 12, defaultHeight: 3.6 });
  return (
    <MuiProvider overrides={overrides}>
      <Loading loading={loading} look={<TextSkeleton variant={t.variant as 'h5'} />}>
        <TypographyView t={t} gutterBottom={gutterBottom} heading />
      </Loading>
    </MuiProvider>
  );
};

// MUI's Typography for body text: children, variant (body1, body2, subtitle1, subtitle2, caption, overline), color,
// align, noWrap. Event onClick.
export const Typography = () => {
  const t = useTypography(['body1', 'body2', 'subtitle1', 'subtitle2', 'caption', 'overline'], 'body1', 'Text');
  const { loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 12, defaultHeight: 2.8 });
  return (
    <MuiProvider overrides={overrides}>
      <Loading loading={loading} look={<TextSkeleton variant={t.variant as 'body1'} lines={3} />}>
        <TypographyView t={t} />
      </Loading>
    </MuiProvider>
  );
};

// The stat card of MUI's dashboard template (Card + Typography + Chip): title, value with format (auto, number,
// currency, percent, compact) and currency, trend (up, down, neutral) as a coloured Chip with trendLabel, and interval
// (the period, under the value). No trend label, no chip: a sample trend would read as real data. variant
// (outlined, elevation). Event onClick.
export const StatCard = () => {
  const [title] = useStateText({ name: 'title', label: 'Title', initialValue: 'Users' });
  const [value] = useStateText({ name: 'value', label: 'Value', initialValue: '14k' });
  const [format] = ToolJet.useStateEnumeration({ name: 'format', label: 'Format', enumDefinition: ['auto', 'number', 'currency', 'percent', 'compact'], initialValue: 'auto' });
  const [currency] = useStateText({ name: 'currency', label: 'Currency', initialValue: 'USD', visibleWhen: { key: 'format', value: 'currency' } });
  const [trend, setTrend] = ToolJet.useStateEnumeration({ name: 'trend', label: 'Trend', enumDefinition: ['up', 'down', 'neutral'], initialValue: 'neutral' });
  const [rawTrendLabel, setTrendLabel] = ToolJet.useStateString({
    name: 'trendLabel',
    label: 'Trend label',
    description: 'Text in the trend chip, such as +25%; a number is the change, its sign the direction. Empty: no chip.',
    initialValue: '',
  });
  const [interval] = useStateText({ name: 'interval', label: 'Interval', description: 'The period, such as Last 30 days.', initialValue: '' });
  const [variant] = ToolJet.useStateEnumeration({ name: 'variant', label: 'Variant', enumDefinition: ['outlined', 'elevation'], initialValue: 'outlined' });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const { loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 10, defaultHeight: 12 });
  // The trend chip from a query: the direction (up, down or neutral; anything else keeps it) and, when given, the
  // label (a number is the change, shown signed in the value's format).
  ToolJet.useAction(
    {
      name: 'setTrend',
      displayName: 'Set trend',
      params: [
        { handle: 'trend', displayName: 'Trend (up, down or neutral)', defaultValue: 'up' },
        { handle: 'trendLabel', displayName: 'Trend label (optional, e.g. +25%)', defaultValue: '' },
      ],
    },
    (next: unknown, nextLabel: unknown) => {
      const t = str(next).trim().toLowerCase();
      if (t === 'up' || t === 'down' || t === 'neutral') setTrend(t);
      if (typeof nextLabel === 'number' || (typeof nextLabel === 'string' && nextLabel !== '')) setTrendLabel(nextLabel as string);
    }
  );
  const n = toNumber(value);
  const shown = n === null ? str(value) : formatNumber(n, format as NumberFormat, currency);
  // A number bound to trendLabel (today - yesterday) is the change: shown signed, in the value's format, and with
  // trend left neutral its sign gives the direction. NaN (a query not loaded yet) shows no chip.
  const change = typeof rawTrendLabel === 'number' ? (Number.isFinite(rawTrendLabel) ? (rawTrendLabel as number) : null) : undefined;
  const trendLabel =
    change === undefined ? toText(rawTrendLabel) : change === null ? '' : `${change > 0 ? '+' : ''}${formatNumber(change, format as NumberFormat, currency)}`;
  // With trend left neutral the change's sign gives the direction: a number's, or a label's leading + or -.
  const sign = change ? Math.sign(change) : /^\s*\+/.test(trendLabel) ? 1 : /^\s*[-\u2212]/.test(trendLabel) ? -1 : 0;
  const direction = trend === 'neutral' && sign ? (sign > 0 ? 'up' : 'down') : trend;
  const chipColor = direction === 'up' ? 'success' : direction === 'down' ? 'error' : 'default';
  const fitRef = useFitText<HTMLParagraphElement>([shown, loading]);
  const TrendIcon = direction === 'up' ? ICONS.TrendingUp : direction === 'down' ? ICONS.TrendingDown : ICONS.TrendingFlat;
  return (
    <MuiProvider overrides={overrides} fill>
      <Loading loading={loading} fill look={<BlockSkeleton />}>
        <Card variant={variant as 'outlined'} sx={{ height: '100%' }} onClick={() => onClick()}>
          <CardContent>
            {/* The trend chip sits on the title's line, so the figure has the card's width (shrunk to fit past that) and
                a chip never pushes the interval out of the card. */}
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <MuiTypography component="h2" variant="subtitle2" sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {title}
              </MuiTypography>
              {trendLabel ? <MuiChip size="small" color={chipColor} label={trendLabel} icon={<TrendIcon fontSize="small" />} sx={{ flexShrink: 0 }} /> : null}
            </Stack>
            <MuiTypography ref={fitRef} variant="h4" component="p" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {shown}
            </MuiTypography>
            {interval ? (
              <MuiTypography variant="caption" sx={{ color: 'text.secondary' }}>
                {interval}
              </MuiTypography>
            ) : null}
          </CardContent>
        </Card>
      </Loading>
    </MuiProvider>
  );
};

// MUI's LinearProgress: value (0 to 100), variant (determinate, indeterminate, buffer with valueBuffer), color; a
// label above and the percentage at the right (MUI's LinearProgressWithLabel). Action setValue.
export const LinearProgress = () => {
  const [value, setValue] = ToolJet.useStateNumber({ name: 'value', label: 'Value', initialValue: 40, min: 0, max: 100 });
  const [variant] = ToolJet.useStateEnumeration({ name: 'variant', label: 'Variant', enumDefinition: ['determinate', 'indeterminate', 'buffer'], initialValue: 'determinate' });
  const [valueBuffer] = ToolJet.useStateNumber({ name: 'valueBuffer', label: 'Value buffer', initialValue: 60, min: 0, max: 100, visibleWhen: { key: 'variant', value: 'buffer' } });
  const [color] = ToolJet.useStateEnumeration({ name: 'color', label: 'Color', enumDefinition: [...PALETTE_COLORS, 'inherit'], initialValue: 'primary' });
  const [label] = useStateText({ name: 'label', label: 'Label', initialValue: '' });
  const [showValue] = ToolJet.useStateBoolean({ name: 'showValue', label: 'Show value', initialValue: true });
  const { loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 12, defaultHeight: 4.8 });
  ToolJet.useAction({ name: 'setValue', displayName: 'Set value', params: [{ handle: 'value', displayName: 'Value' }] }, (next) => setValue(toNumber(next) ?? 0));
  const pct = Math.max(0, Math.min(100, toNumber(value) ?? 0));
  // The exposed value is the drawn one (a literal 150 drew a full bar and exposed 150).
  useEffect(() => {
    if (value !== pct) setValue(pct);
  }, [value, pct, setValue]);
  return (
    <MuiProvider overrides={overrides} fill className="tj-mui-progress">
      {label ? (
        <MuiTypography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
          {label}
        </MuiTypography>
      ) : null}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <MuiLinearProgress variant={loading ? 'indeterminate' : (variant as 'determinate')} value={pct} valueBuffer={toNumber(valueBuffer) ?? 0} color={color as 'primary'} />
        </Box>
        {showValue && variant !== 'indeterminate' && !loading ? (
          <MuiTypography variant="body2" sx={{ color: 'text.secondary', minWidth: 36, textAlign: 'right' }}>
            {`${Math.round(pct)}%`}
          </MuiTypography>
        ) : null}
      </Box>
    </MuiProvider>
  );
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

// MUI's Avatar: src (an image URL), alt (the person's name; its initials show without an image), variant (circular,
// rounded, square), size in px, color (the initials' background). Event onClick.
export const Avatar = () => {
  const [src] = useStateText({ name: 'src', label: 'Src', description: 'Image URL.', initialValue: '' });
  const [alt] = useStateText({ name: 'alt', label: 'Alt', description: 'The name: initials show without an image.', initialValue: 'Ada Lovelace' });
  const [variant] = ToolJet.useStateEnumeration({ name: 'variant', label: 'Variant', enumDefinition: ['circular', 'rounded', 'square'], initialValue: 'circular' });
  const [size] = ToolJet.useStateNumber({ name: 'size', label: 'Size (px)', initialValue: 40, min: 16, max: 240 });
  const [color] = ToolJet.useStateEnumeration({ name: 'color', label: 'Color', enumDefinition: ['default', ...PALETTE_COLORS], initialValue: 'primary' });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const { loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 3, defaultHeight: 4.4 });
  const px = Math.max(16, Math.min(240, Number(size) || 40));
  return (
    <MuiProvider overrides={overrides} fill className="tj-mui-center">
      <Loading loading={loading} look={<Skeleton variant={variant === 'square' ? 'rectangular' : (variant as 'circular')} width={px} height={px} />}>
        <MuiAvatar
          src={src || undefined}
          alt={alt}
          variant={variant as 'circular'}
          onClick={() => onClick()}
          sx={{ width: px, height: px, fontSize: px * 0.4, ...(color === 'default' ? {} : { bgcolor: `${color}.main`, color: `${color}.contrastText` }) }}
        >
          {initials(alt) || undefined}
        </MuiAvatar>
      </Loading>
    </MuiProvider>
  );
};

// MUI's Divider: orientation, variant (fullWidth, inset, middle), children (text in the line); style textAlign.
export const Divider = () => {
  const [children] = useStateText({ name: 'children', label: 'Text', description: 'Text in the line; empty for none.', initialValue: '' });
  const [orientation] = ToolJet.useStateEnumeration({ name: 'orientation', label: 'Orientation', enumDefinition: ['horizontal', 'vertical'], initialValue: 'horizontal' });
  const [variant] = ToolJet.useStateEnumeration({ name: 'variant', label: 'Variant', enumDefinition: ['fullWidth', 'inset', 'middle'], initialValue: 'fullWidth' });
  const textAlign = ToolJet.useStyleEnumeration({ name: 'textAlign', label: 'Text align', enumDefinition: ['center', 'left', 'right'], initialValue: 'center' });
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 2 });
  const vertical = orientation === 'vertical';
  return (
    <MuiProvider overrides={overrides} fill className={vertical ? 'tj-mui-center tj-mui-divider-v' : 'tj-mui-center'}>
      <MuiDivider orientation={orientation as 'horizontal'} variant={variant as 'fullWidth'} textAlign={textAlign as 'center'} flexItem={vertical} sx={vertical ? undefined : { width: '100%' }}>
        {children || undefined}
      </MuiDivider>
    </MuiProvider>
  );
};

type StepItem = { id: string; label: string; optional?: string; error?: boolean };
const toSteps = (raw: unknown): StepItem[] =>
  toArray(raw)
    .map((s): StepItem | null => {
      if (typeof s === 'string') return { id: s, label: s };
      if (!s || typeof s !== 'object') return null;
      const r = s as Row;
      const label = str(r.label ?? r.title ?? r.name ?? r.id);
      return { id: str(r.id ?? r.value) || label, label, optional: str(r.optional ?? r.description) || undefined, error: Boolean(r.error) };
    })
    .filter((s): s is StepItem => !!s && !!s.label);

// MUI's Stepper: steps [{ id, label, optional, error }], activeStep (an index; a step's id or label also works), orientation,
// alternativeLabel (labels under the icons), nonLinear (steps are clickable: event onStepClick). Actions
// setActiveStep, next, back, reset.
export const Stepper = () => {
  const [rawSteps] = ToolJet.useStateArray({
    name: 'steps',
    label: 'Steps',
    description: '[{ label, optional }]',
    initialValue: [{ label: 'Details' }, { label: 'Review' }, { label: 'Confirm' }],
  });
  const [activeStep, setActiveStep] = ToolJet.useStateNumber({ name: 'activeStep', label: 'Active step', description: 'The current step index, from 0.', initialValue: 0, min: 0 });
  const [orientation] = ToolJet.useStateEnumeration({ name: 'orientation', label: 'Orientation', enumDefinition: ['horizontal', 'vertical'], initialValue: 'horizontal' });
  const [alternativeLabel] = ToolJet.useStateBoolean({ name: 'alternativeLabel', label: 'Alternative label', initialValue: false });
  const [nonLinear] = ToolJet.useStateBoolean({ name: 'nonLinear', label: 'Non linear', description: 'Any step can be clicked.', initialValue: false });
  const onStepClick = ToolJet.useEventCallback({ name: 'onStepClick' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 24, defaultHeight: 2.8 });
  const steps = toSteps(rawSteps);
  const byLabel = steps.findIndex((s) => s.id === str(activeStep) || s.label === str(activeStep));
  const current = byLabel >= 0 ? byLabel : Math.max(0, Math.min(steps.length, toNumber(activeStep) ?? 0));
  // The step shown is the exposed one: an index past the steps (they shrank) or a step id that is gone falls back, and
  // activeStep now says so, with no onChange. An id or label that names a shown step is left as the app gave it.
  useEffect(() => {
    if (byLabel < 0 && activeStep !== current) setActiveStep(current);
  }, [byLabel, activeStep, current, setActiveStep]);
  // index may be a step from the latest one (a number; a label or id the app gave reads as the step shown), so two
  // nexts in one batch advance twice.
  const go = (index: number | ((latest: number) => number)) => {
    setActiveStep((a: unknown) => Math.max(0, Math.min(steps.length, typeof index === 'function' ? index(typeof a === 'number' ? a : current) : index)));
    onChange();
  };
  ToolJet.useAction({ name: 'setActiveStep', displayName: 'Set active step', params: [{ handle: 'step', displayName: 'Step index or label' }] }, (next) => {
    const i = steps.findIndex((s) => s.id === str(next) || s.label === str(next));
    go(i >= 0 ? i : (toNumber(next) ?? 0));
  });
  ToolJet.useAction({ name: 'next', displayName: 'Next' }, () => go((c) => c + 1));
  ToolJet.useAction({ name: 'back', displayName: 'Back' }, () => go((c) => c - 1));
  ToolJet.useAction({ name: 'reset', displayName: 'Reset' }, () => go(0));
  return (
    <MuiProvider overrides={overrides} fill className="tj-mui-center">
      <Loading loading={loading} look={<Spinner />} className="tj-mui-block">
        <MuiStepper activeStep={current} orientation={orientation as 'horizontal'} alternativeLabel={alternativeLabel} nonLinear={nonLinear} sx={{ width: '100%' }}>
          {steps.map((s, i) => {
            const optional = s.optional ? <MuiTypography variant="caption">{s.optional}</MuiTypography> : undefined;
            return (
              <Step key={`${s.label}-${i}`} completed={i < current}>
                {nonLinear ? (
                  <StepButton
                    optional={optional}
                    onClick={() => {
                      go(i);
                      onStepClick();
                    }}
                  >
                    {s.label}
                  </StepButton>
                ) : (
                  <StepLabel optional={optional} error={s.error}>
                    {s.label}
                  </StepLabel>
                )}
              </Step>
            );
          })}
        </MuiStepper>
      </Loading>
    </MuiProvider>
  );
};

// MUI's Pagination: count (pages), page (from 1), siblingCount, boundaryCount, variant (text, outlined), shape
// (circular, rounded), color, size, showFirstButton / showLastButton; event onChange.
export const Pagination = () => {
  const [count] = ToolJet.useStateNumber({ name: 'count', label: 'Count', description: 'The number of pages.', initialValue: 10, min: 1 });
  const [page, setPage] = ToolJet.useStateNumber({ name: 'page', label: 'Page', description: 'The current page, from 1.', initialValue: 1, min: 1 });
  const [siblingCount] = ToolJet.useStateNumber({ name: 'siblingCount', label: 'Sibling count', initialValue: 1, min: 0, max: 5 });
  const [boundaryCount] = ToolJet.useStateNumber({ name: 'boundaryCount', label: 'Boundary count', initialValue: 1, min: 0, max: 5 });
  const [variant] = ToolJet.useStateEnumeration({ name: 'variant', label: 'Variant', enumDefinition: ['text', 'outlined'], initialValue: 'text' });
  const [shape] = ToolJet.useStateEnumeration({ name: 'shape', label: 'Shape', enumDefinition: ['circular', 'rounded'], initialValue: 'circular' });
  const [color] = ToolJet.useStateEnumeration({ name: 'color', label: 'Color', enumDefinition: ['standard', 'primary', 'secondary'], initialValue: 'primary' });
  const [size] = ToolJet.useStateEnumeration({ name: 'size', label: 'Size', enumDefinition: ['small', 'medium', 'large'], initialValue: 'medium' });
  const [showFirstButton] = ToolJet.useStateBoolean({ name: 'showFirstButton', label: 'Show first button', initialValue: false });
  const [showLastButton] = ToolJet.useStateBoolean({ name: 'showLastButton', label: 'Show last button', initialValue: false });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const { loading } = ToolJet.useControlState();
  const overrides = useThemeStyles();
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 3.6 });
  const pages = Math.max(1, Math.round(Number(count) || 1));
  const shown = Math.max(1, Math.min(pages, Math.round(toNumber(page) ?? 1)));
  // The exposed page is the one drawn: a page past count (count shrank, or a literal 50 of 10) exposed 50.
  useEffect(() => {
    if (page !== shown) setPage(shown);
  }, [page, shown, setPage]);
  const go = (p: number) => {
    setPage(Math.max(1, Math.min(pages, p)));
    onChange();
  };
  ToolJet.useAction({ name: 'setPage', displayName: 'Set page', params: [{ handle: 'page', displayName: 'Page' }] }, (p) => go(toNumber(p) ?? 1));
  return (
    <MuiProvider overrides={overrides} fill className="tj-mui-center tj-mui-start">
      <Loading loading={loading} look={<Spinner />}>
        <MuiPagination
          count={pages}
          page={shown}
          siblingCount={Number(siblingCount)}
          boundaryCount={Number(boundaryCount)}
          variant={variant as 'text'}
          shape={shape as 'circular'}
          color={color as 'primary'}
          size={size as 'medium'}
          showFirstButton={showFirstButton}
          showLastButton={showLastButton}
          onChange={(_, p) => go(p)}
        />
      </Loading>
    </MuiProvider>
  );
};
