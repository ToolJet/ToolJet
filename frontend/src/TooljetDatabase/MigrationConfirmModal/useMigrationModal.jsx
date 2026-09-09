import React, { useCallback, useContext, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import { useTjdbActions } from '../_stores/tjdbStore';
import MigrationConfirmModal from './index';

const emptyState = {
  isOpen: false,
  title: '',
  sql: '',
  error: null,
  submitting: false,
  // `structuredApplied`: set once the request built by the call site's `run:` thunk has
  // succeeded. A retry after the SQL step fails skips `run()` again - `perform()` has no
  // "already applied, just record it" mode, so re-running it would either fail outright or
  // double-apply the same structured change.
  structuredApplied: false,
  depsLoading: false,
  dependents: null,
};

/**
 * Owns the modal's open/close, Title, SQL text, dependents fetch, run sequence, retry flag, and
 * error display. Call sites pass a thunk, not an action name - `runMigration({ run: (title) =>
 * tooljetDatabaseService.xyz(...), ... })` - so this hook never has to normalize nine unrelated
 * positional signatures.
 *
 * Run sequence (SQL after the structured change, never before - `create_table` has no `tableId`
 * until the create response, so before-order is impossible there; `drop_table`, the only case
 * needing before, never gets a SQL box at all):
 *   1. `run(title)` - the existing single request. On error: show it, stop.
 *   2. If `sql` is non-empty: record it as a raw SQL migration against the resolved table id. On
 *      error: show "schema change applied; SQL step failed: <message>", not a generic failure, and
 *      set `structuredApplied` so a retry skips step 1.
 *
 * Returns `{ runMigration, modal }` - render `{modal}` once, anywhere, in the calling component's
 * own JSX; `runMigration(options)` opens it.
 */
export default function useMigrationModal() {
  const { organizationId, tables } = useContext(TooljetDatabaseContext);
  const { bumpMigrations } = useTjdbActions();
  const [state, setState] = useState(emptyState);
  const optionsRef = useRef(null);
  const resolvedTableIdRef = useRef(null);
  const lastRunDataRef = useRef(null);

  const close = useCallback(() => {
    setState(emptyState);
    optionsRef.current = null;
    resolvedTableIdRef.current = null;
    lastRunDataRef.current = null;
  }, []);

  const runMigration = useCallback(
    (options) => {
      optionsRef.current = options;
      resolvedTableIdRef.current = options.tableId || null;
      lastRunDataRef.current = null;
      // `initialSql` pre-fills the SQL step - used by a column type change, where the cast has to be
      // spelled out as `ALTER ... USING ...` and the user reviews it before it is recorded.
      setState({ ...emptyState, isOpen: true, sql: options.initialSql || '', depsLoading: !!options.tableId });

      if (options.tableId) {
        tooljetDatabaseService.getTableDependents(organizationId, options.tableId).then(({ error, data }) => {
          setState((prev) => {
            // The modal was cancelled/closed before this resolved - nothing to update.
            if (!prev.isOpen) return prev;
            return { ...prev, depsLoading: false, dependents: error ? null : data?.result };
          });
        });
      }
    },
    [organizationId]
  );

  const handleConfirm = useCallback(async () => {
    const options = optionsRef.current;
    if (!options) return;
    setState((prev) => ({ ...prev, submitting: true, error: null }));

    try {
      let tableIdForSql = resolvedTableIdRef.current;

      if (!state.structuredApplied) {
        const runResult = await options.run(state.title);
        if (runResult?.error) {
          setState((prev) => ({
            ...prev,
            submitting: false,
            error: runResult.error?.message ?? 'Failed to run migration',
          }));
          return;
        }
        lastRunDataRef.current = runResult?.data;
        // create_table has no tableId until this response; every other action already carries one.
        tableIdForSql = options.tableId || runResult?.data?.result?.id;
        resolvedTableIdRef.current = tableIdForSql;
      }

      if (options.showSqlEditor && state.sql.trim()) {
        const { error: sqlError } = await tooljetDatabaseService.recordRawSqlMigration(
          organizationId,
          tableIdForSql,
          state.sql
        );
        if (sqlError) {
          setState((prev) => ({
            ...prev,
            submitting: false,
            structuredApplied: true,
            error: `Schema change applied; SQL step failed: ${sqlError?.message ?? 'unknown error'}`,
          }));
          return;
        }
      }

      toast.success('Migration applied successfully');
      bumpMigrations();
      options.onSuccess?.(lastRunDataRef.current);
      close();
    } catch (err) {
      setState((prev) => ({ ...prev, submitting: false, error: err?.message ?? 'Failed to run migration' }));
    }
  }, [state.title, state.sql, state.structuredApplied, organizationId, close, bumpMigrations]);

  const modal = (
    <MigrationConfirmModal
      show={state.isOpen}
      darkMode={localStorage.getItem('darkMode') === 'true'}
      modalTitle={optionsRef.current?.modalTitle}
      titlePlaceholder={optionsRef.current?.titlePlaceholder}
      title={state.title}
      onTitleChange={(title) => setState((prev) => ({ ...prev, title }))}
      changes={optionsRef.current?.changes || []}
      banner={optionsRef.current?.banner}
      showSqlEditor={!!optionsRef.current?.showSqlEditor}
      sql={state.sql}
      onSqlChange={(sql) => setState((prev) => ({ ...prev, sql }))}
      tableNames={tables.map((table) => table.table_name)}
      depsLoading={state.depsLoading}
      dependents={state.dependents}
      error={state.error}
      submitting={state.submitting}
      onConfirm={handleConfirm}
      onCancel={close}
    />
  );

  return { runMigration, modal };
}
