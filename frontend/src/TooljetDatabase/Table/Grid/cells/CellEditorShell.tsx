import React, { useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { Popover, PopoverContent } from '@/components/ui/Rocket/Popover/Popover';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import { cn } from '@/lib/utils';
import { Toggle } from '@/components/ui/Rocket/Toggle/Toggle';
import { CircleSlash, RotateCw } from 'lucide-react';
import { PopoverAnchor } from '@/components/ui/Rocket/shadcn/popover';
import {
  draftCanSave,
  draftChanged,
  draftPayload,
  initialDraft,
  setDraftMode,
  setDraftText,
  type CellMode,
} from './cellDraft';

export const CELL_RING = 'tw-shadow-[inset_0_0_0_2px_var(--interactive-focus-outline)]';

/** The editor's draft state: the reducer-free hook every editor shares. */
export const useCellDraft = (value: unknown, dataType: string) => {
  const [initial] = useState(() => initialDraft(value, dataType));
  const [draft, setDraft] = useState(initial);
  return {
    text: draft.text,
    mode: draft.mode,
    isNull: draft.mode === 'null',
    setMode: (mode: CellMode) => setDraft((current) => setDraftMode(current, mode)),
    setText: (text: string) => setDraft((current) => setDraftText(current, text)),
    // A chip is a toggle: pressing the one that is on goes back to the typed value.
    toggleMode: (mode: 'null' | 'default') =>
      setDraft((current) => setDraftMode(current, current.mode === mode ? 'value' : mode)),
    changed: draftChanged(initial, draft, dataType),
    canSave: draftCanSave(initial, draft, dataType),
    payload: () => draftPayload(draft, dataType),
  };
};

type ShellProps = {
  /** What the cell shows while the popover is open. */
  cell: ReactNode;
  /** Extra popover content above the footer. */
  children?: ReactNode;
  /** Width of the popover: 296px for the footer alone, 320px for the date picker, 352px for JSON (design: Cell edit popover). */
  widthClass?: string;
  /** Closes the popover without ending the edit (the expanded JSON dialog takes over). */
  hidden?: boolean;
  /** The body draws its own padding and dividers (the date picker does). */
  bareBody?: boolean;
  nullable: boolean;
  /** The column's SQL default, when it has one: turns on the Default chip. */
  columnDefault?: string | null;
  mode: CellMode;
  onModeChange: (mode: 'null' | 'default') => void;
  canSave: boolean;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
};

// The editor popover: Set to null, Cancel, Save. It anchors to the cell and is portalled, so the cell's own overflow
// does not clip it. Escape and an outside press cancel; the cell itself counts as inside, because the input lives there.
export function CellEditorShell({
  cell,
  children,
  widthClass = 'tw-w-[296px]',
  bareBody = false,
  hidden = false,
  nullable,
  columnDefault,
  mode,
  onModeChange,
  canSave,
  saving,
  onSave,
  onCancel,
}: ShellProps) {
  const cellRef = useRef<HTMLDivElement>(null);
  return (
    <Popover open onOpenChange={(open) => !open && onCancel()}>
      <PopoverAnchor asChild>
        <div ref={cellRef} className="tw-h-full tw-w-full">
          {cell}
        </div>
      </PopoverAnchor>
      {!hidden && (
        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={2}
          className={cn('tw-gap-0 tw-p-0', widthClass)}
          data-testid="cell-editor"
          // Each editor focuses its own field, without scrolling the grid (a scroll closes the editor).
          onOpenAutoFocus={(event) => event.preventDefault()}
          onFocusOutside={(event) => event.preventDefault()}
          // An unsaved draft is not dropped by a press elsewhere: the press may start a tab or environment switch, which
          // asks about it. Escape and Cancel still close it.
          onPointerDownOutside={(event) => {
            if (canSave || cellRef.current?.contains(event.target as Node)) event.preventDefault();
          }}
        >
          {children && (
            <>
              {bareBody ? children : <div className="tw-p-3">{children}</div>}
              <Separator />
            </>
          )}
          <EditorFooter
            className="tw-p-3"
            nullable={nullable}
            columnDefault={columnDefault}
            mode={mode}
            onModeChange={onModeChange}
            canSave={canSave}
            saving={saving}
            onSave={onSave}
            onCancel={onCancel}
          />
        </PopoverContent>
      )}
    </Popover>
  );
}

type FooterProps = Omit<ShellProps, 'cell' | 'children' | 'widthClass' | 'bareBody' | 'hidden'> & {
  className?: string;
};

// Null / Default chips, Cancel, Save: the popover's footer, and the expanded JSON dialog's.
export function EditorFooter({
  nullable,
  columnDefault,
  mode,
  onModeChange,
  canSave,
  saving,
  onSave,
  onCancel,
  className,
}: FooterProps) {
  return (
    <div className={cn('tw-flex tw-w-full tw-items-center tw-gap-1', className)}>
      {(nullable || columnDefault != null) && (
        <>
          <div className="tw-flex tw-items-center tw-gap-1">
            {nullable && (
              <ModeChip label="Null" pressed={mode === 'null'} disabled={saving} onPress={() => onModeChange('null')} />
            )}
            {columnDefault != null && (
              <ModeChip
                label="Default"
                pressed={mode === 'default'}
                disabled={saving}
                onPress={() => onModeChange('default')}
              />
            )}
          </div>
        </>
      )}
      <div className="tw-flex-1" />
      <div className="tw-flex tw-items-center tw-gap-2">
        <Button variant="outline" size="medium" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button variant="primary" size="medium" onClick={onSave} disabled={!canSave || saving}>
          Save
        </Button>
      </div>
    </div>
  );
}

type ModeChipProps = { label: 'Null' | 'Default'; pressed: boolean; disabled: boolean; onPress: () => void };

const CHIP_ICONS = { Null: CircleSlash, Default: RotateCw };

// Null / Default: a chip that can be pressed off again; pressed, it takes the accent colours.
const ModeChip = ({ label, pressed, disabled, onPress }: ModeChipProps) => {
  const Icon = CHIP_ICONS[label];
  return (
    <Toggle
      size="medium"
      variant="ghost"
      // Toggle squares anything whose only element child is an icon (text nodes do not count), which would clip the
      // label. Rest is a grey icon with a default label and no shadow (Toggle's off state has one), pressed is the accent tint on both (design: Cell edit footer).
      className="tw-shrink-0 !tw-aspect-auto !tw-px-2 tw-text-text-default data-[state=off]:!tw-shadow-none data-[state=on]:tw-bg-background-accent-weak data-[state=on]:tw-text-text-accent"
      pressed={pressed}
      disabled={disabled}
      onPressedChange={onPress}
      aria-label={label}
      data-cy={`cell-editor-${label.toLowerCase()}-chip`}
    >
      {/* Toggle forces `svg { size: auto }`, so the icon needs an important size of its own. */}
      <Icon className="!tw-size-3.5 tw-shrink-0 tw-text-icon-default [[data-state=on]_&]:tw-text-text-accent" />
      {label}
    </Toggle>
  );
};
