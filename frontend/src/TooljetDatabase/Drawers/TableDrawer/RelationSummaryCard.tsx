import React from 'react';
import { ArrowRight, SquarePen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { Tag } from '@/components/ui/Rocket/Tag/Tag';
import type { DraftRelation } from './types';

type RelationSummaryCardProps = {
  relation: DraftRelation;
  sourceTableName: string;
  onEdit: () => void;
  onDelete: () => void;
};

const Endpoint = ({ column, table }: { column: string; table: string }) => (
  <div className="tw-min-w-0 tw-flex-1">
    <div className="tw-truncate tw-font-title-default tw-text-text-default">{column}</div>
    <div className="tw-truncate tw-font-body-small tw-text-text-placeholder">{table}</div>
  </div>
);

// A saved relation, collapsed to one line: source, arrow, target, the two actions, edit and delete.
export function RelationSummaryCard({ relation, sourceTableName, onEdit, onDelete }: RelationSummaryCardProps) {
  const [sourceColumn] = relation.column_names;
  const [targetColumn] = relation.referenced_column_names;
  return (
    <div
      className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-2 tw-rounded-default tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-py-3 tw-pl-4 tw-pr-2"
      data-cy={`relation-card-${sourceColumn}`}
    >
      <Endpoint column={sourceColumn} table={sourceTableName} />
      <ArrowRight className="tw-size-4 tw-shrink-0 tw-text-icon-strong" aria-hidden />
      <Endpoint column={targetColumn} table={relation.referenced_table_name} />
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-1">
        <Tag variant="outline" prefix="On update">
          {relation.on_update}
        </Tag>
        <Tag variant="outline" prefix="On remove">
          {relation.on_delete}
        </Tag>
      </div>
      <div className="tw-ml-auto tw-flex tw-items-center">
        <Button variant="ghost" iconOnly size="medium" aria-label={`Edit relation on ${sourceColumn}`} onClick={onEdit}>
          <SquarePen />
        </Button>
        <Button
          variant="ghost"
          iconOnly
          size="medium"
          danger
          aria-label={`Delete relation on ${sourceColumn}`}
          onClick={onDelete}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
