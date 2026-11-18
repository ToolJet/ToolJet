import React, { useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { Popover, PopoverContent } from '@/components/ui/Rocket/Popover/Popover';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import { Switch } from '@/components/ui/Rocket/Switch/Switch';
import { PopoverAnchor } from '@/components/ui/Rocket/shadcn/popover';

export const CELL_RING = 'tw-shadow-[inset_0_0_0_2px_var(--interactive-focus-outline)]';

type Draft = { text: string; isNull: boolean };

// A null cell opens with the switch on and nothing typed; turning it off leaves an empty string, as the old menu did.
export const useCellDraft = (value: unknown) => {
  const [draft, setDraft] = useState<Draft>({ text: value == null ? '' : String(value), isNull: value == null });
  const [initial] = useState(draft);
  return {
    ...draft,
    setText: (text: string) => setDraft((current) => ({ ...current, text })),
    setIsNull: (isNull: boolean) => setDraft((current) => ({ ...current, isNull })),
    changed: draft.isNull !== initial.isNull || (!draft.isNull && draft.text !== initial.text),
    payload: draft.isNull ? null : draft.text,
  };
};

type ShellProps = {
  /** What the cell shows while the popover is open. */
  cell: ReactNode;
  /** Extra popover content above the footer. */
  children?: ReactNode;
  nullable: boolean;
  isNull: boolean;
  onNullChange: (isNull: boolean) => void;
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
  nullable,
  isNull,
  onNullChange,
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
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={2}
        className="tw-w-auto tw-gap-2 tw-py-2 tw-pl-3 tw-pr-2"
        data-testid="cell-editor"
        // Each editor focuses its own field, without scrolling the grid (a scroll closes the editor).
        onOpenAutoFocus={(event) => event.preventDefault()}
        onFocusOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => {
          if (cellRef.current?.contains(event.target as Node)) event.preventDefault();
        }}
      >
        {children}
        <div className="tw-flex tw-items-center tw-gap-3">
          {nullable && (
            <>
              <div className="tw-flex tw-items-center tw-gap-2">
                <Switch id="cell-editor-null" checked={isNull} disabled={saving} onCheckedChange={onNullChange} />
                <label htmlFor="cell-editor-null" className="tw-font-body-default tw-text-text-default">
                  Set to null
                </label>
              </div>
              <Separator orientation="vertical" className="tw-h-4" />
            </>
          )}
          <div className="tw-flex tw-items-center tw-gap-2">
            <Button variant="ghost" size="medium" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" size="medium" onClick={onSave} disabled={!canSave || saving}>
              Save
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
