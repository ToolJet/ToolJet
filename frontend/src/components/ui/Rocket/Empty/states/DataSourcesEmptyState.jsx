import React from 'react';
import { Plus } from 'lucide-react';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from '../Empty';
import { Button } from '../../Button/Button';
import DataSourcesIllustration from '../illustrations/DataSourcesIllustration';

function DataSourcesEmptyState({ className, size = 'large', onAddDatasource, ...props }) {
  return (
    <Empty size={size} className={className} {...props}>
      <EmptyMedia>
        <DataSourcesIllustration width="176" height="121" />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>Set up your data sources</EmptyTitle>
        <EmptyDescription>
          Connect your own data sources, or explore with sample data source to get started.
        </EmptyDescription>
      </EmptyHeader>
      {onAddDatasource && (
        <EmptyContent>
          <Button variant="outline" size="default" leadingVisual={<Plus size={14} />} onClick={onAddDatasource}>
            Add new datasource
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}

export default DataSourcesEmptyState;
