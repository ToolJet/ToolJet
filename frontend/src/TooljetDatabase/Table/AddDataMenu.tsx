import React from 'react';
import { FileUp, Plus, Rows3, Terminal } from 'lucide-react';

import { Button } from '@/components/ui/Rocket/Button/Button';
import DropdownMenu, { type DropdownMenuSection } from '@/components/ui/Rocket/DropdownMenu';

export interface AddDataMenuProps {
  onAddRow: () => void;
  onBulkUpload: () => void;
  onSeedData: () => void;
  /** Seed data runs SQL, so it is left out when SQL mode is off. */
  hideSeedDataOption?: boolean;
  disabled?: boolean;
}

// The toolbar's "Add data" button and the menu of ways to add rows to the open table.
export function AddDataMenu({
  onAddRow,
  onBulkUpload,
  onSeedData,
  hideSeedDataOption = false,
  disabled,
}: AddDataMenuProps) {
  const sections: DropdownMenuSection[] = [
    {
      id: 'add',
      items: [
        { id: 'row', label: 'Add new row', icon: <Rows3 />, onSelect: onAddRow, 'data-cy': 'add-new-row-option' },
        {
          id: 'bulk',
          label: 'Bulk upload data',
          icon: <FileUp />,
          onSelect: onBulkUpload,
          'data-cy': 'bulk-upload-data-option',
        },
        ...(hideSeedDataOption
          ? []
          : [
              {
                id: 'seed',
                label: 'Seed data with SQL',
                icon: <Terminal />,
                onSelect: onSeedData,
                'data-cy': 'seed-data-sql-option',
              },
            ]),
      ],
    },
  ];

  return (
    <DropdownMenu
      align="end"
      classes={{ group: 'tw-p-2' }}
      sections={sections}
      trigger={
        <Button
          variant="secondary"
          size="medium"
          leadingVisual={<Plus />}
          disabled={disabled}
          className="data-[state=open]:tw-bg-button-secondary-pressed"
          data-cy="add-new-data-button"
        >
          Add data
        </Button>
      }
    />
  );
}
