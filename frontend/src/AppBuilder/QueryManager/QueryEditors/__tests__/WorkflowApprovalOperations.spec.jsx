import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ListApprovalsSection, ResolveRequestSection } from '../WorkflowApprovalOperations';

jest.mock('@/AppBuilder/CodeEditor', () => (props) => (
  <input
    data-testid={`code-hinter-${props.placeholder}`}
    defaultValue={props.initialValue}
    onChange={(e) => props.onChange(e.target.value)}
  />
));

const type = (placeholder, value, index = 0) =>
  fireEvent.change(screen.getAllByTestId(`code-hinter-${placeholder}`)[index], { target: { value } });

describe('ResolveRequestSection', () => {
  it('saves the request id, execution id and outcome onto the query options', () => {
    const optionsChanged = jest.fn();
    const options = { operation: 'resolveRequest' };
    render(<ResolveRequestSection options={options} optionsChanged={optionsChanged} currentState={{}} />);

    type('{{table1.selectedRow.id}}', 'req-1');
    type('Used when Request ID is empty', 'run-1');
    type('approve', 'reject');

    expect(optionsChanged).toHaveBeenCalledWith({ operation: 'resolveRequest', requestId: 'req-1' });
    expect(optionsChanged).toHaveBeenCalledWith({ operation: 'resolveRequest', executionId: 'run-1' });
    expect(optionsChanged).toHaveBeenCalledWith({ operation: 'resolveRequest', outcome: 'reject' });
  });

  it('saves input key-value rows as resolveInput', () => {
    const optionsChanged = jest.fn();
    render(
      <ResolveRequestSection
        options={{ operation: 'resolveRequest' }}
        optionsChanged={optionsChanged}
        currentState={{}}
      />
    );

    type('key', 'comment');
    type('value', 'lgtm');

    expect(optionsChanged).toHaveBeenLastCalledWith({
      operation: 'resolveRequest',
      resolveInput: [expect.objectContaining({ key: 'comment', value: 'lgtm' })],
    });
  });

  it('adds and removes input rows', () => {
    const optionsChanged = jest.fn();
    render(
      <ResolveRequestSection
        options={{ resolveInput: [{ key: 'a', value: '1' }] }}
        optionsChanged={optionsChanged}
        currentState={{}}
      />
    );

    fireEvent.click(screen.getByLabelText('Add input'));
    expect(screen.getAllByTestId('code-hinter-key')).toHaveLength(2);

    fireEvent.click(screen.getAllByLabelText('Remove input')[0]);
    expect(optionsChanged).toHaveBeenLastCalledWith({
      resolveInput: [expect.objectContaining({ key: '', value: '' })],
    });
  });

  it('does not rewrite the saved options just by opening the section', () => {
    const optionsChanged = jest.fn();
    render(
      <ResolveRequestSection options={{ resolveInput: [{ key: 'a', value: '1' }] }} optionsChanged={optionsChanged} />
    );

    expect(optionsChanged).not.toHaveBeenCalled();
  });
});

describe('ListApprovalsSection', () => {
  const renderList = (options, optionsChanged = jest.fn()) => {
    render(
      <ListApprovalsSection
        options={options}
        optionsChanged={optionsChanged}
        currentState={{}}
        workflowOptions={[{ value: 'wf-ref', label: 'wf1' }]}
      />
    );
    return optionsChanged;
  };

  it('shows pending as the default status and all workflows as the default workflow', () => {
    renderList({ operation: 'listApprovals' });

    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('All workflows')).toBeInTheDocument();
  });

  it('saves the approver, date range and paging filters onto the query options', () => {
    const optionsChanged = renderList({ operation: 'listApprovals' });

    type('Name, email or group', 'ana@x.io');
    type('YYYY-MM-DD', '2026-11-01', 0);
    type('YYYY-MM-DD', '2026-11-17', 1);
    type('1', '2');
    type('25 (max 100)', '50');

    expect(optionsChanged).toHaveBeenCalledWith({ operation: 'listApprovals', approver: 'ana@x.io' });
    expect(optionsChanged).toHaveBeenCalledWith({ operation: 'listApprovals', from: '2026-11-01' });
    expect(optionsChanged).toHaveBeenCalledWith({ operation: 'listApprovals', to: '2026-11-17' });
    expect(optionsChanged).toHaveBeenCalledWith({ operation: 'listApprovals', page: '2' });
    expect(optionsChanged).toHaveBeenCalledWith({ operation: 'listApprovals', perPage: '50' });
  });
});
