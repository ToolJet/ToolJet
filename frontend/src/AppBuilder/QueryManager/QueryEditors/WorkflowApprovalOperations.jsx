import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import Select from '@/_ui/Select';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { APPROVAL_STATUSES, WORKFLOW_OPERATIONS } from '@/AppBuilder/_stores/slices/workflowApprovalOperations';

export const WORKFLOW_OPERATION_OPTIONS = [
  { value: WORKFLOW_OPERATIONS.EXECUTE, label: 'Execute' },
  { value: WORKFLOW_OPERATIONS.LIST_APPROVALS, label: 'List approvals' },
  { value: WORKFLOW_OPERATIONS.RESOLVE_REQUEST, label: 'Resolve request' },
];

const STATUS_OPTIONS = APPROVAL_STATUSES.map((status) => ({
  value: status,
  label: status.charAt(0).toUpperCase() + status.slice(1),
}));

const ALL_WORKFLOWS = '';

const Field = ({ label, dataCy, children }) => (
  <div className="mb-2" data-cy={dataCy}>
    <label className="mb-1">{label}</label>
    {children}
  </div>
);

const CodeField = ({ label, optionKey, options, optionsChanged, currentState, placeholder }) => (
  <Field label={label} dataCy={`workflow-${optionKey}-field`}>
    <CodeHinter
      currentState={currentState}
      initialValue={options[optionKey] ?? ''}
      onChange={(value) => optionsChanged({ ...options, [optionKey]: value })}
      placeholder={placeholder}
    />
  </Field>
);

export function ListApprovalsSection({ options, optionsChanged, currentState, workflowOptions }) {
  const statuses = options.approvalStatuses ?? ['pending'];

  return (
    <>
      <Field label="Workflow" dataCy="workflow-approvals-workflow">
        <Select
          options={[{ value: ALL_WORKFLOWS, label: 'All workflows' }, ...workflowOptions]}
          value={options.approvalWorkflowId ?? ALL_WORKFLOWS}
          onChange={(workflowId) => optionsChanged({ ...options, approvalWorkflowId: workflowId || null })}
          placeholder="All workflows"
          height="32px"
          width="300px"
          useMenuPortal={true}
          customClassPrefix="workflow-approvals-workflow-select"
        />
      </Field>
      <Field label="Status" dataCy="workflow-approvals-status">
        <Select
          isMulti
          options={STATUS_OPTIONS}
          value={STATUS_OPTIONS.filter((option) => statuses.includes(option.value))}
          onChange={(selected) =>
            optionsChanged({ ...options, approvalStatuses: (selected ?? []).map((option) => option.value) })
          }
          placeholder="All statuses"
          width="300px"
          closeMenuOnSelect={false}
          useMenuPortal={true}
          customClassPrefix="workflow-approvals-status-select"
        />
      </Field>
      <CodeField
        label="Approver"
        optionKey="approver"
        placeholder="Name, email or group"
        {...{ options, optionsChanged, currentState }}
      />
      <div className="row">
        <div className="col-6">
          <CodeField
            label="Start"
            optionKey="from"
            placeholder="YYYY-MM-DD"
            {...{ options, optionsChanged, currentState }}
          />
        </div>
        <div className="col-6">
          <CodeField
            label="End"
            optionKey="to"
            placeholder="YYYY-MM-DD"
            {...{ options, optionsChanged, currentState }}
          />
        </div>
      </div>
      <div className="row">
        <div className="col-6">
          <CodeField label="Page" optionKey="page" placeholder="1" {...{ options, optionsChanged, currentState }} />
        </div>
        <div className="col-6">
          <CodeField
            label="Per page"
            optionKey="perPage"
            placeholder="25 (max 100)"
            {...{ options, optionsChanged, currentState }}
          />
        </div>
      </div>
    </>
  );
}

const withRowIds = (rows) => (rows?.length ? rows : [{ key: '', value: '' }]).map((row) => ({ id: uuidv4(), ...row }));

function KeyValueRows({ rows, onRowsChange, currentState }) {
  const updateRow = (index, patch) => onRowsChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <>
      {rows.map((row, index) => (
        <div className="row mb-2" key={row.id} data-cy={`workflow-resolve-input-row-${index}`}>
          <div className="col-4">
            <CodeHinter
              currentState={currentState}
              initialValue={row.key}
              onChange={(key) => updateRow(index, { key })}
              placeholder="key"
            />
          </div>
          <div className="col-7">
            <CodeHinter
              currentState={currentState}
              initialValue={row.value}
              onChange={(value) => updateRow(index, { value })}
              placeholder="value"
            />
          </div>
          <div className="col-1 tw-flex tw-items-center">
            <button
              type="button"
              className="tw-bg-transparent tw-border-0 tw-p-0 tw-text-icon-danger"
              aria-label="Remove input"
              data-cy={`workflow-resolve-input-delete-${index}`}
              onClick={() => onRowsChange(rows.filter((_, i) => i !== index))}
            >
              <IconTrash size={16} />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className="tw-bg-transparent tw-border-0 tw-p-0 tw-text-icon-accent"
        aria-label="Add input"
        data-cy="workflow-resolve-input-add"
        onClick={() => onRowsChange([...rows, { id: uuidv4(), key: '', value: '' }])}
      >
        <IconPlus size={18} />
      </button>
    </>
  );
}

export function ResolveRequestSection({ options, optionsChanged, currentState }) {
  // Local copy keeps row ids (React keys) stable.
  const [inputRows, setInputRows] = useState(() => withRowIds(options.resolveInput));
  const changeInputRows = (rows) => {
    setInputRows(rows);
    optionsChanged({ ...options, resolveInput: rows });
  };

  return (
    <>
      <CodeField
        label="Request ID"
        optionKey="requestId"
        placeholder="{{table1.selectedRow.id}}"
        {...{ options, optionsChanged, currentState }}
      />
      <CodeField
        label="Execution ID"
        optionKey="executionId"
        placeholder="Used when Request ID is empty"
        {...{ options, optionsChanged, currentState }}
      />
      <Field label="Input" dataCy="workflow-resolve-input">
        <KeyValueRows rows={inputRows} onRowsChange={changeInputRows} currentState={currentState} />
      </Field>
      <CodeField
        label="Outcome"
        optionKey="outcome"
        placeholder="approve"
        {...{ options, optionsChanged, currentState }}
      />
    </>
  );
}
