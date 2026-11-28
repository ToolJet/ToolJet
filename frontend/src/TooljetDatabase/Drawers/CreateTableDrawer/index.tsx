import React, { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus } from 'lucide-react';
import Drawer from '@/_ui/Drawer';
import { authenticationService } from '@/_services/authentication.service';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import posthogHelper from '@/modules/common/helpers/posthogHelper';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { useTooljetDatabaseContext, type TjdbTable } from '../../TooljetDatabaseContext';
import { useGuardedClose, useReportUnsaved } from '../../_stores/unsavedChanges';
import { DrawerShell } from '../TableDrawer/DrawerShell';
import { RelationList } from '../TableDrawer/RelationList';
import { SchemaTable } from '../TableDrawer/SchemaTable';
import { SectionHeader } from '../TableDrawer/SectionHeader';
import { TableNameField } from '../TableDrawer/TableNameField';
import { useTableDraft } from '../TableDrawer/useTableDraft';

const DOCS = 'https://docs.tooljet.com/docs/tooljet-db/database-editor/#create-new-table';

export interface CreateTableDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type CreateTableFormProps = {
  onCreated: (table: TjdbTable) => void;
  onCancel: () => void;
};

// Every opening is a new form, so a cancelled draft never comes back.
function CreateTableForm({ onCreated, onCancel }: CreateTableFormProps) {
  const { organizationId, tables } = useTooljetDatabaseContext();
  const existingNames = useMemo(() => ((tables ?? []) as TjdbTable[]).map((table) => table.table_name), [tables]);
  const draft = useTableDraft(existingNames);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Once the table exists the draft is saved. The drawer stays mounted while it slides out, and opening the new table
  // meanwhile would otherwise ask about discarding it.
  const [isCreated, setIsCreated] = useState(false);
  useReportUnsaved('createTable', draft.isDirty && !isCreated);

  const submit = async () => {
    const { tableName, columns, foreignKeyDetails, checkingValues } = draft.toPayload();
    setIsSubmitting(true);
    const { error, data } = await tooljetDatabaseService.createTable(
      organizationId,
      tableName,
      columns,
      foreignKeyDetails,
      checkingValues
    );
    setIsSubmitting(false);
    if (error) {
      toast.error(error?.message ?? 'Failed to create table');
      return;
    }
    setIsCreated(true);
    toast.success(`${tableName} created successfully`);
    onCreated({ id: data.result.id, table_name: tableName });
    posthogHelper?.captureEvent('click_create_tooljet_table', {
      workspace_id: authenticationService.currentSessionValue?.current_organization_id,
      datasource: 'tooljet_db',
    });
  };

  return (
    <DrawerShell
      title="Create a new table"
      data-cy="create-new-table-header"
      onClose={onCancel}
      submitLabel="Create"
      submitDisabled={!draft.canSubmit}
      isSubmitting={isSubmitting}
      onSubmit={submit}
    >
      <div className="tw-flex tw-flex-col tw-gap-6">
        <TableNameField value={draft.tableName} onChange={draft.setTableName} existingNames={existingNames} autoFocus />
        <section className="tw-flex tw-flex-col tw-gap-4">
          <SectionHeader
            title="Table schema"
            description="Define the columns in this table: their names, data types, default values and constraints."
            docsHref={DOCS}
            data-cy="add-columns-header"
            action={
              <Button
                variant="ghostBrand"
                size="medium"
                leadingVisual={<Plus />}
                onClick={draft.addColumn}
                data-cy="add-more-columns-button"
              >
                Add column
              </Button>
            }
          />
          <SchemaTable draft={draft} />
        </section>
        <RelationList tableName={draft.tableName || 'This table'} draft={draft} />
      </div>
    </DrawerShell>
  );
}

// Controlled: whoever has a "Create new table" button owns the open state. A created table becomes the open one.
export default function CreateTableDrawer({ isOpen, onClose }: CreateTableDrawerProps) {
  const { organizationId, openTable, setTables } = useTooljetDatabaseContext();
  // Backdrop, Cancel and Escape ask about unsaved input; a created table closes through `handleCreated`, unasked.
  const requestClose = useGuardedClose('createTable', onClose);
  const [session, setSession] = useState({ open: false, count: 0 });
  if (isOpen !== session.open) setSession({ open: isOpen, count: session.count + (isOpen ? 1 : 0) });

  const handleCreated = (tableInfo: TjdbTable) => {
    tooljetDatabaseService
      .findAll(organizationId)
      .then(({ data, error }: { data?: { result?: TjdbTable[] }; error?: Error }) => {
        if (error) {
          toast.error(error?.message ?? 'Failed to fetch tables');
          return;
        }
        if (Array.isArray(data?.result) && data.result.length > 0) {
          setTables(data.result);
          openTable({ table_name: tableInfo.table_name, id: tableInfo.id });
        }
      });
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={requestClose}
      position="right"
      drawerStyle={{ width: '880px' }}
      className="tj-db-drawer"
    >
      <CreateTableForm key={session.count} onCreated={handleCreated} onCancel={requestClose} />
    </Drawer>
  );
}
