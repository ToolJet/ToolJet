import React, { useContext, useState } from 'react';
import Drawer from '@/_ui/Drawer';
import { toast } from 'react-hot-toast';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { TooljetDatabaseContext } from '../../index';
import { tooljetDatabaseService } from '@/_services';
import { useTjdbStore } from '../../_stores/tjdbStore';
import { listAllPrimaryKeyColumns } from '@/TooljetDatabase/constants';
import PostgrestQueryBuilder from '@/_helpers/postgrestQueryBuilder';
import SqlEditor from '../../_components/SqlEditor';
import './styles.scss';

const SeedDataDrawer = ({ isSeedDataDrawerOpen, setIsSeedDataDrawerOpen }) => {
  const { organizationId, selectedTable, setSelectedTableData, setTotalRecords, columns } =
    useContext(TooljetDatabaseContext);
  const selectedEnvironment = useTjdbStore((state) => state.selectedEnvironment);
  const pageSize = useTjdbStore((state) => state.pageSize);
  const [sql, setSql] = useState('');
  const [isRunningSql, setIsRunningSql] = useState(false);
  const [error, setError] = useState(null);

  const handleClose = () => {
    setIsSeedDataDrawerOpen(false);
    setSql('');
    setError(null);
  };

  const refetchRows = () => {
    const primaryKeyColumns = listAllPrimaryKeyColumns(columns);
    const sortQuery = new PostgrestQueryBuilder();
    primaryKeyColumns.map((primaryKeyColumnName) => {
      sortQuery.order(primaryKeyColumnName, 'desc');
    });

    tooljetDatabaseService
      .findOne(selectedTable.id, `${sortQuery.url.toString()}&limit=${pageSize}`)
      .then(({ headers, data = [], error }) => {
        if (error) {
          toast.error(error?.message ?? `Failed to fetch table "${selectedTable.table_name}"`);
          return;
        }
        if (Array.isArray(data) && data?.length > 0) {
          const totalContentRangeRecords = headers['content-range'].split('/')[1] || 0;
          setTotalRecords(totalContentRangeRecords);
          setSelectedTableData(data);
        }
      });
  };

  const handleRunSql = async () => {
    if (!sql.trim()) return;
    setIsRunningSql(true);
    setError(null);

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
          error?.message ??
          [result?.error_message, result?.data?.message].filter(Boolean).join(': ') ??
          'Failed to run SQL';
        setError(message);
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
      setError(message);
      toast.error(message, { position: 'top-center' });
    } finally {
      setIsRunningSql(false);
    }
  };

  return (
    <Drawer isOpen={isSeedDataDrawerOpen} onClose={handleClose} position="right" className="tj-db-drawer">
      <div className="drawer-card-wrapper">
        <div className="drawer-card-title d-flex align-items-center justify-content-between">
          <h3 data-cy="seed-data-sql-header">Seed data with SQL</h3>
          <span className="cursor-pointer" data-cy="seed-data-sql-close-button" onClick={handleClose}>
            <SolidIcon name="remove" width="16" fill="#889096" />
          </span>
        </div>
        <div className="card-body tjdb-seed-data-drawer" style={{ padding: '0.5rem 1rem 1rem 1rem' }}>
          {/* Table reference must go through {{self}} - the backend rejects anything else,
              including this table's own literal name, to keep seed-data SQL provably scoped to
              the table this drawer was opened for. No quotes needed: {{self}} substitutes to the
              table's logical name, which flows through the same AST-based table resolution
              Query Manager's SQL mode uses (unlike the migration DDL step, which substitutes
              directly to a physical uuid and does need quoting). */}
          <div className="tw-text-muted tw-mb-1" style={{ fontSize: '12px' }}>
            Reference this table as <code>{'{{self}}'}</code> - not by name.
          </div>
          <SqlEditor
            value={sql}
            onChange={setSql}
            height="25vh"
            placeholder={'-- e.g. INSERT INTO {{self}} (column) VALUES (value);'}
            dataCy="seed-data-sql-textarea"
          />
          {error && (
            <div className="text-danger mt-2" data-cy="seed-data-sql-error">
              {error}
            </div>
          )}
        </div>
      </div>
      <DrawerFooter
        onClose={handleClose}
        onCreate={handleRunSql}
        initiator="SeedDataForm"
        shouldDisableCreateBtn={!sql.trim()}
        fetching={isRunningSql}
      />
    </Drawer>
  );
};

export default SeedDataDrawer;
