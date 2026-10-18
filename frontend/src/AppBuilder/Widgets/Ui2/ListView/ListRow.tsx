import React, { useMemo } from 'react';
import { SubContainer } from '@/AppBuilder/Widgets/Ui2/_shared/SubContainer';
import { SubcontainerContext } from '@/AppBuilder/Widgets/Ui2/_shared/SubcontainerContext';
import type { ContextSegment } from '@/AppBuilder/Widgets/Ui2/_shared/SubcontainerContext';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import type { listLook } from '@/AppBuilder/Widgets/Ui2/_shared/listModel';
import { useFittedRowHeight } from '@/AppBuilder/Widgets/Ui2/_shared/useDynamicHeight';
import { onKeyActivate } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';

export type ListMode = 'list' | 'grid';

interface RowProps {
  id: string;
  index: number;
  item: unknown;
  parentPath: ContextSegment[];
  height: number;
  fit: boolean;
  currentLayout?: string;
  width: number;
  onPick: (index: number) => void;
  selected: boolean;
  look: ReturnType<typeof listLook>;
  mode: ListMode;
  showBorder: boolean;
  darkMode?: boolean;
}

/** One row of the List view: the row template's canvas for the item at `index`, read as {{listItem}}. */
export const Row = ({
  id,
  index,
  item,
  parentPath,
  height: rowHeight,
  fit,
  currentLayout,
  width,
  onPick,
  selected,
  look,
  mode,
  showBorder,
  darkMode,
}: RowProps) => {
  // With dynamic height on (in an app), a row grows with its components, as the native Listview's rows do.
  const height = useFittedRowHeight({
    id,
    path: parentPath,
    index,
    value: item,
    fit,
    height: rowHeight,
    currentLayout,
  });
  const activate = onKeyActivate(() => onPick(index));
  const contextValue = useMemo(
    () => ({ contextPath: [...parentPath, { containerId: id, index }] }),
    [parentPath, id, index]
  );
  return (
    <SubcontainerContext.Provider value={contextValue}>
      {/* A tab stop like RecordList's rows: Enter or Space on the row itself picks it (keys typed in its components
          stay theirs). */}
      <div
        role="listitem"
        tabIndex={0}
        onClickCapture={() => onPick(index)}
        onKeyDown={(e) => e.target === e.currentTarget && activate(e)}
        className={cn(
          'tw-relative tw-overflow-hidden tw-outline-none tw-transition-colors focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-[color:var(--sc-ring)] hover:tw-bg-[color:var(--lv-hover-bg,color-mix(in_srgb,var(--sc-muted)_50%,transparent))]',
          selected &&
            'tw-bg-[color:var(--lv-selected-bg,color-mix(in_srgb,var(--sc-primary)_8%,transparent))] tw-ring-1 tw-ring-inset tw-ring-ui2-primary',
          look.framed && 'tw-border tw-border-[color:var(--lv-item-border,var(--sc-border))]',
          mode === 'list' &&
            showBorder &&
            'tw-border-b tw-border-b-[color:var(--lv-divider,var(--sc-border))] last:tw-border-b-0'
        )}
        style={{ height, ...look.item }}
      >
        {width > 0 ? (
          <SubContainer
            index={index}
            id={id}
            canvasHeight={height}
            canvasWidth={width}
            styles={{ backgroundColor: 'transparent' }}
            darkMode={darkMode}
            componentType="ShadListView"
          />
        ) : null}
      </div>
    </SubcontainerContext.Provider>
  );
};
