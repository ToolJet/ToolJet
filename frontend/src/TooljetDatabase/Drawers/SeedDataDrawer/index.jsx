import React, { useContext, useState } from 'react';
import Drawer from '@/_ui/Drawer';
import { toast } from 'react-hot-toast';
import { DrawerShell } from '../TableDrawer/DrawerShell';
import { TooljetDatabaseContext } from '../../index';
import { tooljetDatabaseService } from '@/_services';
import { useTjdbStore } from '../../_stores/tjdbStore';
import SqlEditor from '../../_components/SqlEditor';

const SeedDataDrawer = ({ isSeedDataDrawerOpen, setIsSeedDataDrawerOpen }) => {
  const { organizationId, selectedTable, handleRefetchQuery } = useContext(TooljetDatabaseContext);
  const selectedEnvironment = useTjdbStore((state) => state.selectedEnvironment);
  const [sql, setSql] = useState('');
  const [isRunningSql, setIsRunningSql] = useState(false);

  const handleClose = () => {
    setIsSeedDataDrawerOpen(false);
    setSql('');
  };

  // Keeps the active filters, sort and page, and applies an empty result too (the grid must not keep
  // showing rows the SQL just deleted).
  const refetchRows = () => handleRefetchQuery();

  const handleRunSql = async () => {
    if (!sql.trim()) return;
    setIsRunningSql(true);

    try {
      const { error, data } = await tooljetDatabaseService.sqlExecution(organizationId, selectedTable.id, {
        sql,
        environment_id: selectedEnvironment.id,
      });

      // sqlExecution catches SQL-level failures (syntax errors, permission errors, ...) and
      // returns them as a 2xx response body shaped { result: { status: 'failed', ... } } rather
      // than a non-2xx HTTP error - the adapter's own `error` field stays unset for these, so it
      // has to be checked separately or a failed query reads as a silent success.
      const result = data?.result;
      if (error || result?.status === 'failed') {
        // result.error_message is the friendly summary ("Syntax error encountered"); result.data.message
        // (present for the parser's own failures) carries the actual detail - both together are what's
        // actionable, not either alone.
        const message =
          error?.message ||
          [result?.error_message, result?.data?.message].filter(Boolean).join(': ') ||
          'Failed to run SQL';
        toast.error(message, { position: 'top-center' });
        return;
      }

      toast.success('SQL executed successfully', { position: 'top-center' });
      refetchRows();
      handleClose();
    } catch (err) {
      // Belt-and-suspenders: tooljetDatabaseService.sqlExecution should always resolve with
      // { error } rather than throw, but a network failure or an unexpected non-JSON response
      // must still surface something rather than leaving the button stuck mid-spin.
      const message = err?.message ?? 'Failed to run SQL';
      toast.error(message, { position: 'top-center' });
    } finally {
      setIsRunningSql(false);
    }
  };

  return (
    <Drawer
      isOpen={isSeedDataDrawerOpen}
      onClose={handleClose}
      position="right"
      drawerStyle={{ width: '480px' }}
      className="tj-db-drawer"
    >
      <DrawerShell
        title="Seed data with SQL"
        data-cy="seed-data-sql-header"
        onClose={handleClose}
        submitLabel="Run SQL"
        submitDisabled={!sql.trim()}
        isSubmitting={isRunningSql}
        onSubmit={handleRunSql}
      >
        {/* The table must be referenced as {{self}} - the backend rejects anything else, including this table's own
            literal name, to keep seed-data SQL provably scoped to the table this drawer was opened for. No quotes:
            {{self}} substitutes to the table's logical name, which flows through the same AST-based table resolution
            Query Manager's SQL mode uses (unlike the migration DDL step, which substitutes directly to a physical
            uuid and does need quoting). The placeholder is where the rule is shown. */}
        <SqlEditor
          value={sql}
          onChange={setSql}
          height="100%"
          placeholder={'-- Seed data into the table, e.g. INSERT INTO {{self}} (column) VALUES (value);'}
          dataCy="seed-data-sql-textarea"
        />
      </DrawerShell>
    </Drawer>
  );
};

export default SeedDataDrawer;
