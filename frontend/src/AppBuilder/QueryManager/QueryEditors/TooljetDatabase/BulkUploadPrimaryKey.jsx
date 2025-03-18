import React, { useContext, useEffect } from 'react';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import { resolveReferences } from '@/AppBuilder/CodeEditor/utils';
import CodeHinter from '@/AppBuilder/CodeEditor';

export const BulkUploadPrimaryKey = () => {
  const {
    columns,
    bulkUpdatePrimaryKey,
    handleBulkUpdateWithPrimaryKeysRowsUpdateOptionChanged,
    handlePrimaryKeyOptionChangedForBulkUpdate,
  } = useContext(TooljetDatabaseContext);

  useEffect(() => {
    const primaryKeys = columns.reduce((acc, column) => {
      if (column?.isPrimaryKey) {
        acc.push(column?.accessor);
      }
      return acc;
    }, []);

    handlePrimaryKeyOptionChangedForBulkUpdate(primaryKeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns]);

  return (
    <div className="tab-content-wrapper tj-db-field-wrapper mt-2 d-flex flex-column custom-gap-16">
      <div className="field-container d-flex tooljetdb-worflow-operations">
        <label className="form-label flex-shrink-0">Primary key</label>
        <div
          className="field flex-grow-1 minw-400-w-400 px-1"
          style={{ height: '28px', background: 'var(--controls-switch-tag)', borderRadius: '6px' }}
        >
          <input
            type="text"
            value={bulkUpdatePrimaryKey?.primary_key?.join(', ') || ''}
            style={{
              width: '100%',
              height: '100%',
              border: '0',
              color: 'var(--text-placeholder)',
              background: 'transparent',
            }}
            disabled
            placeholder="Column1"
          />
        </div>
      </div>
      <div className="field-container d-flex tooljetdb-worflow-operations">
        <label className="form-label flex-shrink-0" data-cy="">
          Rows to update
        </label>
        <div className="field flex-grow-1 minw-400-w-400">
          <CodeHinter
            type="basic"
            initialValue={`{{${JSON.stringify(bulkUpdatePrimaryKey?.rows_update ?? [])}}}`}
            className="codehinter-plugins"
            placeholder="{{ [ { 'column1': 'value', ... } ] }}"
            onChange={(newValue) => {
              const [_, __, resolvedValue] = resolveReferences(newValue);
              handleBulkUpdateWithPrimaryKeysRowsUpdateOptionChanged(resolvedValue);
            }}
          />
        </div>
      </div>
    </div>
  );
};
