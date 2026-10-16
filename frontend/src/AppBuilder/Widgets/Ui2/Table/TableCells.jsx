import React, { useState } from 'react';
import DOMPurify from 'dompurify';
import { Check } from 'lucide-react';
import useStore from '@/AppBuilder/_stores/store';
import { initials } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Checkbox,
  Input,
  Progress,
  cn,
} from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { badgeLook, isSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { formatCell, matchesCondition, readCell } from './tableModel';

const BADGE_BY_STATUS = {
  active: 'success',
  approved: 'success',
  available: 'success',
  completed: 'success',
  confirmed: 'success',
  delivered: 'success',
  done: 'success',
  paid: 'success',
  success: 'success',
  pending: 'warning',
  processing: 'warning',
  review: 'warning',
  maintenance: 'warning',
  draft: 'secondary',
  open: 'secondary',
  new: 'secondary',
  inactive: 'secondary',
  cancelled: 'destructive',
  canceled: 'destructive',
  failed: 'destructive',
  overdue: 'destructive',
  rejected: 'destructive',
  blocked: 'destructive',
};

export const ROW_BORDER = 'border-[color:var(--lk-border,var(--sc-border))]';
export const MUTED = 'text-[color:var(--lk-muted,var(--sc-muted-foreground))]';

/** Keeps one broken cell (a bad value, a throwing binding) from taking the table or the app down. */
export class CellBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(previous) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? <span className={MUTED}>—</span> : this.props.children;
  }
}

/** A column option that may be a per-row binding: "{{rowData.amount < 0 ? '#dc2626' : ''}}". */
export const useCellResolver = () => {
  const getResolvedValue = useStore((state) => state.getResolvedValue);
  return (value, row, cellValue) => {
    if (typeof value !== 'string' || !value.includes('{{')) return value;
    try {
      return getResolvedValue(value, { rowData: row, cellValue });
    } catch {
      return undefined;
    }
  };
};

const BadgeCell = ({ value, column, badgeColors }) => {
  if (!isSet(value)) return null;
  const own = badgeLook(value, column.badgeColors) ?? badgeLook(value, badgeColors);
  const option = column.options?.find((o) => String(o?.value ?? o) === String(value));
  const label = String(option?.label ?? value);
  return own ? (
    <Badge
      variant="outline"
      style={own}
      className="border-transparent bg-[color:var(--kb-badge-bg)] text-[color:var(--kb-badge-fg)]"
    >
      {label}
    </Badge>
  ) : (
    <Badge variant={BADGE_BY_STATUS[String(value).toLowerCase()] || 'outline'}>{label}</Badge>
  );
};

export const renderCell = ({ value, row, column, properties, resolve, onAction, rowIndex }) => {
  const format = {
    ...column.format,
    currency: column.format.currency ?? properties.currency,
    locale: column.format.locale ?? properties.locale,
    dateFormat: column.format.dateFormat ?? properties.dateFormat,
  };
  const shown = column.transformation ? resolve(column.transformation, row, value) : value;
  switch (column.type) {
    case 'badge':
      return <BadgeCell value={shown} column={column} badgeColors={properties.badgeColors} />;
    case 'tags': {
      const tags = (Array.isArray(shown) ? shown : isSet(shown) ? String(shown).split(',') : [])
        .map((t) => String(t?.label ?? t).trim())
        .filter(Boolean);
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="px-1.5 py-0 text-[11px] font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      );
    }
    case 'boolean':
      return shown === true || shown === 'true' ? (
        <Check className="h-4 w-4 text-[color:var(--sc-primary-ink)]" aria-label="Yes" />
      ) : (
        <span className={MUTED} aria-label="No">
          —
        </span>
      );
    case 'link': {
      if (!isSet(shown)) return null;
      const text = resolve(column.linkText, row, shown);
      return (
        <a
          href={String(shown)}
          target={column.openInNewTab ? '_blank' : '_self'}
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-[color:var(--sc-primary-ink)] underline-offset-4 hover:underline"
        >
          {String(isSet(text) ? text : shown)}
        </a>
      );
    }
    case 'image':
      return isSet(shown) ? (
        <img
          src={String(shown)}
          alt=""
          loading="lazy"
          className={cn('h-8 w-8 object-cover', column.imageShape === 'square' ? 'rounded-md' : 'rounded-full')}
        />
      ) : null;
    case 'avatar':
      return isSet(shown) ? (
        <span className="flex items-center gap-2">
          <Avatar className="h-7 w-7">
            {typeof shown === 'object' && shown?.src ? <AvatarImage src={shown.src} alt="" /> : null}
            <AvatarFallback className="text-[11px]">
              {initials(typeof shown === 'object' ? shown?.name : shown)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{String(typeof shown === 'object' ? shown?.name ?? '' : shown)}</span>
        </span>
      ) : null;
    case 'progress': {
      const n = Number(shown);
      if (!Number.isFinite(n)) return null;
      const pct = Math.max(0, Math.min(100, (n / (column.maxValue || 100)) * 100));
      return (
        <span className="flex min-w-[96px] items-center gap-2">
          <Progress value={pct} className="h-1.5" />
          <span className={cn('w-9 text-right text-xs tabular-nums', MUTED)}>{Math.round(pct)}%</span>
        </span>
      );
    }
    case 'button':
      return (
        <span className="flex items-center justify-end gap-1.5">
          {(column.buttons ?? []).map((button, i) => {
            const id = String(button.id ?? button.buttonId ?? `button${i + 1}`);
            // Rules are data ({ key, condition, value }); a binding inside the columns binding would end it early.
            const when = (rule) =>
              rule && typeof rule === 'object' && matchesCondition(readCell(row, rule.key), rule.condition, rule.value);
            if (resolve(button.visible ?? button.buttonVisibility, row, value) === false || when(button.hiddenWhen)) {
              return null;
            }
            const disabled =
              resolve(button.disabled ?? button.disableButton, row, value) === true || when(button.disabledWhen);
            const label = resolve(button.label ?? button.buttonLabel ?? 'Action', row, value);
            const variant = button.variant ?? (button.buttonType === 'solid' ? 'default' : 'outline');
            return (
              <Button
                key={id}
                size="sm"
                variant={
                  ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'].includes(variant)
                    ? variant
                    : 'outline'
                }
                className="h-7 px-2.5 text-xs"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(id, column, row, rowIndex);
                }}
              >
                {String(label ?? '')}
              </Button>
            );
          })}
        </span>
      );
    case 'html':
      return isSet(shown) ? <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(shown)) }} /> : null;
    case 'json':
      return isSet(shown) ? (
        <code className="block max-w-[320px] truncate rounded bg-muted px-1.5 py-0.5 text-xs">
          {typeof shown === 'object' ? stringify(shown) : String(shown)}
        </code>
      ) : null;
    default:
      return formatCell(shown, { ...column, format });
  }
};

/** An editable cell's input: text, number, date, a checkbox, or a select of the column's options. */
export const CellEditor = ({ column, value, onCommit, onCancel }) => {
  const [draft, setDraft] = useState(value ?? '');
  const commit = (next) =>
    onCommit(column.type === 'number' || column.type === 'currency' ? (next === '' ? null : Number(next)) : next);
  if (column.type === 'boolean') {
    return (
      <Checkbox
        autoFocus
        checked={draft === true || draft === 'true'}
        onCheckedChange={(checked) => onCommit(!!checked)}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }
  if (column.type === 'badge' && column.options?.length) {
    return (
      <select
        autoFocus
        value={String(draft)}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => commit(e.target.value)}
        onBlur={() => onCancel()}
        className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
      >
        {column.options.map((o) => (
          <option key={String(o?.value ?? o)} value={String(o?.value ?? o)}>
            {String(o?.label ?? o?.value ?? o)}
          </option>
        ))}
      </select>
    );
  }
  return (
    <Input
      autoFocus
      className="h-8 px-2"
      type={
        column.type === 'number' || column.type === 'currency' ? 'number' : column.type === 'date' ? 'date' : 'text'
      }
      value={draft === null ? '' : String(draft)}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => commit(draft)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit(draft);
        if (e.key === 'Escape') onCancel();
      }}
    />
  );
};
