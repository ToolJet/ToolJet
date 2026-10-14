import React, { forwardRef } from 'react';
import cx from 'classnames';
import { ChevronDown, ChevronRight, FileText, Settings } from 'lucide-react';
import RawDataSourceIcon from '@/AppBuilder/QueryManager/Components/DataSourceIcon';
import WidgetIcon from '@/../assets/images/icons/widgets';
import type { PreviewSegment, ResultEntity, ResultRow as ResultRowData } from './searchRecords';

// Untyped JS component.
const DataSourceIcon = RawDataSourceIcon as React.ComponentType<any>;

export const EntityIcon = ({ entity, darkMode }: { entity: ResultEntity; darkMode: boolean }) => {
  const type = entity.entityType;
  if (type === 'query' && entity.query) return <DataSourceIcon source={entity.query} height={14} />;
  if (type === 'component' && entity.componentType)
    return (
      <WidgetIcon
        name={entity.componentType.toLowerCase()}
        fill={darkMode ? '#3A3F42' : '#D7DBDF'}
        width="14"
        height="14"
      />
    );
  if (type === 'page') return <FileText width="14" height="14" className="tw-text-icon-default" />;
  return <Settings width="14" height="14" className="tw-text-icon-default" />;
};

export const CountBadge = ({ count }: { count: number }) => (
  <span className="code-search-count">{count.toLocaleString()}</span>
);

export const Chevron = ({ open }: { open: boolean }) =>
  open ? (
    <ChevronDown width="12" height="12" className="code-search-chevron" />
  ) : (
    <ChevronRight width="12" height="12" className="code-search-chevron" />
  );

// Clicking a marked copy opens that copy; anywhere else on the row opens the first.
const Preview = ({
  segments,
  onOpenOccurrence,
}: {
  segments: PreviewSegment[];
  onOpenOccurrence: (occurrence?: number) => void;
}) => (
  <span className="code-search-row-preview">
    {segments.map((segment, index) =>
      segment.match ? (
        <mark
          key={index}
          onClick={(e) => {
            e.stopPropagation();
            onOpenOccurrence(segment.occurrence);
          }}
        >
          {segment.text}
        </mark>
      ) : (
        segment.text
      )
    )}
  </span>
);

// One field: short label, then the snippet with every occurrence marked; a badge when > 1.
interface ResultRowProps {
  row: ResultRowData;
  active: boolean;
  onOpen: (row: ResultRowData, occurrence?: number) => void;
}

export const ResultRow = forwardRef<HTMLButtonElement, ResultRowProps>(({ row, active, onOpen }, ref) => (
  <button
    ref={ref}
    type="button"
    className={cx('code-search-row', { active })}
    onClick={() => onOpen(row)}
    title={`${row.record.entityName} › ${row.record.fieldLabel}`}
  >
    <span className="code-search-row-label">{row.record.shortLabel}</span>
    <Preview segments={row.preview} onOpenOccurrence={(occurrence) => onOpen(row, occurrence)} />
    {row.matches.length > 1 && <CountBadge count={row.matches.length} />}
  </button>
));
ResultRow.displayName = 'ResultRow';
