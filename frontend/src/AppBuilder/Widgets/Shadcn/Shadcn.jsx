import React, { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, CalendarIcon, ChevronRight, Inbox, TrendingDown, TrendingUp } from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
  cn,
} from './ui';
import './shadcn.scss';

// shadcn/ui pack (experiment, exp/antd-pack): native ToolJet widgets rendering shadcn/ui components. Configs live in
// WidgetManager/widgets/shadcn.js (generated from WidgetManager/shadcnSource.js).

/** The widget's root: `.tj-shadcn` scopes the pack's Tailwind and maps shadcn's tokens to the app theme. */
export const Shell = ({ properties, styles, dataCy, children, innerRef, className }) => (
  <div
    ref={innerRef}
    data-cy={dataCy}
    className={cn('tj-shadcn', className)}
    style={{ width: '100%', display: properties.visibility === false ? 'none' : 'block', boxShadow: styles?.boxShadow }}
  >
    {children}
  </div>
);

/** shadcn's form field: label above, control, help text below. */
const Field = ({ id, label, description, children }) => (
  <div className="flex w-full flex-col gap-2">
    {label ? <Label htmlFor={id}>{String(label)}</Label> : null}
    {children}
    {description ? <p className="text-[0.8rem] text-muted-foreground">{String(description)}</p> : null}
  </div>
);

// ---- Actions and feedback ------------------------------------------------------------------------------------------

export const ShadButton = (props) => {
  const { properties, setExposedVariables, fireEvent } = props;
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props}>
      <Button
        variant={properties.variant || 'default'}
        size={properties.size || 'default'}
        className={properties.fullWidth === true ? 'w-full' : undefined}
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
  const { properties, setExposedVariables } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props} innerRef={ref}>
      <Alert variant={properties.variant === 'destructive' ? 'destructive' : 'default'}>
        <AlertTitle>{String(properties.title ?? '')}</AlertTitle>
        {properties.description ? <AlertDescription>{String(properties.description)}</AlertDescription> : null}
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
        <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground">
          {items.map((item, i) => (
            <li key={i} className="inline-flex items-center gap-1.5">
              <span className={i === items.length - 1 ? 'font-normal text-foreground' : 'transition-colors'}>
                {String(item)}
              </span>
              {i < items.length - 1 ? <ChevronRight className="h-3.5 w-3.5" /> : null}
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
      <Tag className={HEADING[level]}>{String(properties.text ?? '')}</Tag>
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
      <p className={cn(TONE[properties.tone] || TONE.paragraph, 'whitespace-pre-line')}>
        {String(properties.text ?? '')}
      </p>
    </Shell>
  );
};

// ---- Data display --------------------------------------------------------------------------------------------------

const BADGE_BY_STATUS = {
  active: 'success',
  available: 'success',
  confirmed: 'success',
  completed: 'success',
  done: 'success',
  paid: 'success',
  pending: 'warning',
  maintenance: 'warning',
  draft: 'secondary',
  open: 'secondary',
  cancelled: 'destructive',
  canceled: 'destructive',
  failed: 'destructive',
  overdue: 'destructive',
};

const cellValue = (kind, value, currency) => {
  if (value === null || value === undefined || value === '') return '';
  if (kind === 'money')
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(
      Number(value) || 0
    );
  if (kind === 'number') return new Intl.NumberFormat().format(Number(value) || 0);
  if (kind === 'date')
    return dayjs(String(value)).isValid() ? dayjs(String(value)).format('DD MMM YYYY') : String(value);
  return String(value);
};

export const ShadTable = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const data = useMemo(() => list(properties.data), [properties.data]);
  const [selected, setSelected] = useState({ row: {}, index: null });
  useExposed(setExposedVariables, properties, { selectedRow: selected.row, selectedRowIndex: selected.index });
  // After a reload (for example after a write), point the selection at the fresh copy of the same record.
  useEffect(() => {
    const id = selected.row?.id;
    if (id === undefined) return;
    const index = data.findIndex((r) => r?.id === id);
    if (index >= 0 && JSON.stringify(data[index]) !== JSON.stringify(selected.row))
      setSelected({ row: data[index], index });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);
  const [sorting, setSorting] = useState([]);
  const columns = useMemo(
    () =>
      list(properties.columns).map((c) => {
        const right = c.align === 'right' || c.kind === 'money' || c.kind === 'number';
        return {
          id: String(c.dataIndex),
          accessorFn: (row) => row?.[c.dataIndex],
          header: ({ column }) => (
            <button
              type="button"
              className={cn('inline-flex items-center gap-1 hover:text-foreground', right && 'ml-auto')}
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
              {String(c.title ?? c.dataIndex)}
              <ArrowUpDown className="h-3 w-3 opacity-50" />
            </button>
          ),
          cell: ({ getValue }) => {
            const value = getValue();
            if (c.kind === 'badge') {
              if (value === null || value === undefined || value === '') return null;
              return <Badge variant={BADGE_BY_STATUS[String(value).toLowerCase()] || 'outline'}>{String(value)}</Badge>;
            }
            return cellValue(c.kind, value, properties.currency);
          },
          meta: { right, width: c.width },
        };
      }),
    [properties.columns, properties.currency]
  );
  const pageSize = Number(properties.pageSize) || 0;
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(pageSize > 0
      ? { getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize } } }
      : {}),
  });
  const rows = table.getRowModel().rows;
  return (
    <Shell {...props} innerRef={ref}>
      <div className="flex flex-col gap-3">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id} className="hover:bg-transparent">
                  {group.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(header.column.columnDef.meta?.right && 'text-right')}
                      style={
                        header.column.columnDef.meta?.width ? { width: header.column.columnDef.meta.width } : undefined
                      }
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {properties.loadingState ? (
                [0, 1, 2].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={columns.length || 1}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length ? (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={selected.row === row.original ? 'selected' : undefined}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelected({ row: row.original, index: row.index });
                      setExposedVariable('selectedRow', row.original);
                      setExposedVariable('selectedRowIndex', row.index);
                      fireEvent('onRowClicked');
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(cell.column.columnDef.meta?.right && 'text-right tabular-nums')}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length || 1} className="h-24 text-center text-muted-foreground">
                    {String(properties.emptyText || 'No results.')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        {pageSize > 0 && table.getPageCount() > 1 ? (
          <div className="flex items-center justify-end gap-2">
            <span className="flex-1 text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </Shell>
  );
};

export const ShadStat = (props) => {
  const { properties, setExposedVariables, height } = props;
  useExposed(setExposedVariables, properties, {});
  const trend = properties.trend || 'neutral';
  const TrendIcon = trend === 'down' ? TrendingDown : TrendingUp;
  const body = (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-muted-foreground">{String(properties.label ?? '')}</span>
        {properties.change ? (
          <Badge variant="outline" className="gap-1">
            {trend !== 'neutral' ? <TrendIcon className="h-3 w-3" /> : null}
            {String(properties.change)}
          </Badge>
        ) : null}
      </div>
      <span className="text-2xl font-semibold tabular-nums tracking-tight">
        {properties.loadingState ? <Skeleton className="h-8 w-24" /> : String(properties.value ?? '')}
      </span>
      {properties.footnote ? (
        <span className="text-sm text-muted-foreground">{String(properties.footnote)}</span>
      ) : null}
    </div>
  );
  return (
    <Shell {...props}>
      {properties.card === false ? (
        body
      ) : (
        <Card className="px-6 py-5" style={{ minHeight: height }}>
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
      <Badge variant={properties.variant || 'default'}>{String(properties.text ?? '')}</Badge>
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
          <Avatar key={`${name}-${i}`} className="ring-2 ring-background" style={{ width: size, height: size }}>
            {names.length === 1 && properties.src ? <AvatarImage src={properties.src} alt={String(name)} /> : null}
            <AvatarFallback>{initials(name)}</AvatarFallback>
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
            <span className="font-medium">{String(properties.label ?? '')}</span>
            {properties.showValue ? (
              <span className="tabular-nums text-muted-foreground">{Math.round(value)}%</span>
            ) : null}
          </div>
        ) : null}
        <Progress value={value} />
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
        <Separator orientation={vertical ? 'vertical' : 'horizontal'} />
      </div>
    </Shell>
  );
};

export const ShadSkeleton = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  const lines = Math.max(1, Number(properties.lines) || 3);
  return (
    <Shell {...props}>
      <div className="flex items-start gap-4">
        {properties.avatar ? <Skeleton className="h-12 w-12 shrink-0 rounded-full" /> : null}
        <div className="flex flex-1 flex-col gap-2">
          {Array.from({ length: lines }, (_, i) => (
            <Skeleton key={i} className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full')} />
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
          <AccordionItem key={i} value={String(i)}>
            <AccordionTrigger>{String(item?.title ?? item?.label ?? '')}</AccordionTrigger>
            <AccordionContent className="whitespace-pre-line text-muted-foreground">
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
        className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center"
        style={{ minHeight: height }}
      >
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Inbox className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">{String(properties.title ?? '')}</p>
        {properties.description ? (
          <p className="max-w-xs text-sm text-muted-foreground">{String(properties.description)}</p>
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
          <SelectTrigger id={`shad-${id}`}>
            <SelectValue placeholder={String(properties.placeholder ?? '')} />
          </SelectTrigger>
          <SelectContent>
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
      <Label htmlFor={id}>{String(label ?? '')}</Label>
      {description ? <p className="text-sm text-muted-foreground">{String(description)}</p> : null}
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
          <Checkbox id={id} checked={checked} disabled={!!props.properties.disabledState} onCheckedChange={change} />
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
          <Switch id={id} checked={checked} disabled={!!props.properties.disabledState} onCheckedChange={change} />
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
                <Label htmlFor={itemId} className="font-normal">
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
              className={cn('w-full justify-start text-left font-normal', !text && 'text-muted-foreground')}
            >
              <CalendarIcon className="h-4 w-4" />
              {text || String(properties.placeholder ?? '')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
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
        className={properties.fullWidth === true ? 'flex w-full' : undefined}
        onValueChange={(next) => next && change(next)}
      >
        {options.map((o) => (
          <ToggleGroupItem key={String(o.value)} value={String(o.value)}>
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Shell>
  );
};
