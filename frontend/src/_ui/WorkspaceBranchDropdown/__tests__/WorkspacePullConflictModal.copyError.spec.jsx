// Copy error copies every issue, with full resource IDs, as text or JSON.
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { PullConflictModal } from '@/_ui/WorkspaceBranchDropdown/WorkspacePullConflictModal';

const conflictGroups = [
  {
    type: 'app',
    conflictField: 'slug',
    conflictKey: 'inventory',
    conflicts: [
      { name: 'Inventory app', status: 'existing', coRelationId: 'aaaaaaaa-1111-4111-8111-111111111111' },
      { name: 'Inventory dashboard', status: 'incoming', coRelationId: 'bbbbbbbb-2222-4222-8222-222222222222' },
    ],
  },
  {
    type: 'module',
    conflictField: 'name',
    conflictKey: 'm1',
    conflicts: [
      { name: 'm1', status: 'existing', coRelationId: 'cccccccc-3333-4333-8333-333333333333' },
      { name: 'm1', status: 'incoming', coRelationId: 'dddddddd-4444-4444-8444-444444444444' },
    ],
  },
];

let writeText;
const OriginalResizeObserver = window.ResizeObserver;

// jsdom lacks ResizeObserver.
beforeAll(() => {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterAll(() => {
  window.ResizeObserver = OriginalResizeObserver;
});

beforeEach(() => {
  writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
});

function renderModal(props = {}) {
  render(
    <PullConflictModal
      show
      onClose={() => {}}
      conflictGroups={conflictGroups}
      branchName="feature/inventory-v2"
      {...props}
    />
  );
}

async function clickCopyError() {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /copy error/i }));
  });
}

test('copies a text report of every issue with full resource IDs, including collapsed rows', async () => {
  renderModal();
  await clickCopyError();

  expect(writeText).toHaveBeenCalledTimes(1);
  const text = writeText.mock.calls[0][0];
  expect(text).toContain('Action:    Pull branch');
  expect(text).toContain('Branch:    feature/inventory-v2');
  expect(text).toContain('Summary:   2 issues across 2 groups');
  expect(text).toContain('== Duplicate data (requires manual resolution) (1) ==');
  expect(text).toContain('[1] Duplicate app slug');
  expect(text).toContain('      - App | Inventory app | ID aaaaaaaa-1111-4111-8111-111111111111 | Local');
  expect(text).toContain('== Duplicate data: Sync from git remote (1) ==');
  expect(text).toContain('[2] Duplicate module name');
  expect(text).toContain('    Resolution:  Can be synced from git remote');
  expect(text).toContain('      - Module | m1 | ID dddddddd-4444-4444-8444-444444444444 | Remote');

  expect(screen.getByRole('dialog', { name: /copied error details/i })).toBeInTheDocument();
  expect(screen.getByText('Copied to clipboard')).toBeInTheDocument();
});

test('the JSON tab copies the same report as JSON', async () => {
  renderModal({ context: 'branch-switch' });
  await clickCopyError();

  fireEvent.click(screen.getByRole('button', { name: 'JSON' }));
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Copy as JSON' }));
  });

  const report = JSON.parse(writeText.mock.calls[1][0]);
  expect(report.action).toBe('Open branch');
  expect(report.summary).toEqual({ issues: 2, groups: 1 });
  expect(report.groups[0].issues.map((i) => i.resources.map((r) => r.id))).toEqual([
    ['aaaaaaaa-1111-4111-8111-111111111111', 'bbbbbbbb-2222-4222-8222-222222222222'],
    ['cccccccc-3333-4333-8333-333333333333', 'dddddddd-4444-4444-8444-444444444444'],
  ]);
  expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
});

test('when the clipboard is unavailable the report is still shown for manual copy', async () => {
  writeText.mockRejectedValue(new Error('denied'));
  renderModal();
  await clickCopyError();

  expect(screen.getByText("Couldn't copy to clipboard")).toBeInTheDocument();
  expect(screen.getByText(/ID aaaaaaaa-1111-4111-8111-111111111111/)).toBeInTheDocument();
});
