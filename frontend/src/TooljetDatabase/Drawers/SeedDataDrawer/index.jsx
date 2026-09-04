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
import CodeMirror from '@uiw/react-codemirror';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { githubLight } from '@uiw/codemirror-theme-github';
import { sql as sqlLang } from '@codemirror/lang-sql';
import { EditorView } from '@codemirror/view';
import { search, openSearchPanel } from '@codemirror/search';
import './styles.scss';

// Same basicSetup shape as AppBuilder/Widgets/CodeEditor.jsx - the only other standalone (non
// resolver-bound) CodeMirror usage in this codebase.
const basicSetup = {
  lineNumbers: true,
  syntaxHighlighting: true,
  bracketMatching: true,
  foldGutter: true,
  highlightActiveLine: false,
  autocompletion: true,
  highlightActiveLineGutter: false,
  completionKeymap: true,
  searchKeymap: true,
};

const SeedDataDrawer = ({ isSeedDataDrawerOpen, setIsSeedDataDrawerOpen }) => {
  const { organizationId, selectedTable, setSelectedTableData, setTotalRecords, columns } =
    useContext(TooljetDatabaseContext);
  const selectedEnvironment = useTjdbStore((state) => state.selectedEnvironment);
  const pageSize = useTjdbStore((state) => state.pageSize);
  const [sql, setSql] = useState('');
  const [isRunningSql, setIsRunningSql] = useState(false);
  const [error, setError] = useState(null);
  const [editorView, setEditorView] = useState(null);
  const darkMode = localStorage.getItem('darkMode') === 'true';

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
          <div
            className="tj-db-seed-data-editor tw-overflow-hidden tw-rounded"
            style={{ border: '1px solid var(--slate5)' }}
            data-cy="seed-data-sql-textarea"
          >
            {editorView && (
              <span
                className="tj-db-seed-data-search-btn"
                data-cy="seed-data-sql-search-button"
                onClick={() => openSearchPanel(editorView)}
              >
                <SolidIcon name="search" width="14" fill="#889096" />
              </span>
            )}
            <CodeMirror
              value={sql}
              height="25vh"
              theme={darkMode ? okaidia : githubLight}
              extensions={[sqlLang(), EditorView.lineWrapping, search()]}
              onChange={setSql}
              basicSetup={basicSetup}
              placeholder="INSERT INTO your_table (column1, column2) VALUES (value1, value2);"
              indentWithTab={true}
              onCreateEditor={(view) => setEditorView(view)}
            />
          </div>
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
