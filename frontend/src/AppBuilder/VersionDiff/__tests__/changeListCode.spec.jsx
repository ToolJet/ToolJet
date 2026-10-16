import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ChangeList } from '../ChangeList';
import { codeEntries } from '../codeChanges';

const diff = {
  base: { name: 'Before the AI edit' },
  target: { name: 'Draft' },
  identical: false,
  summary: {
    pages: { added: 0, removed: 0, changed: 0 },
    components: { added: 0, removed: 0, changed: 0 },
    queries: { added: 0, removed: 0, changed: 1 },
    events: { added: 0, removed: 0, changed: 0 },
    settings: 0,
  },
  settings: [],
  pages: [],
  queries: [
    {
      key: 'pipelineStats',
      name: 'pipelineStats',
      status: 'changed',
      dataSource: 'Run JavaScript',
      changes: [
        {
          group: 'query',
          path: 'options.code',
          label: 'Code',
          from: 'return 1;',
          to: 'return 2;',
          summary: 'Code edited (1 line added, 1 removed)',
        },
        {
          group: 'query',
          path: 'options.runOnPageLoad',
          label: 'Run on page load',
          from: false,
          to: true,
          summary: 'Run on page load changed from off to on',
        },
      ],
      events: [],
    },
  ],
};

const renderList = (props = {}) =>
  render(
    <ChangeList
      diff={diff}
      filter="all"
      onFilter={() => {}}
      pageKey={null}
      onPageSelect={() => {}}
      selectedKey="query:pipelineStats"
      onSelect={() => {}}
      hoveredKey={null}
      onHover={() => {}}
      codeIds={new Set(codeEntries(diff).map((entry) => entry.id))}
      {...props}
    />
  );

describe('code changes in the change list', () => {
  it('lets a code change open its line diff', () => {
    const onOpenCode = jest.fn();
    renderList({ onOpenCode });
    fireEvent.click(screen.getByRole('button', { name: /Code edited \(1 line added, 1 removed\)/ }));
    expect(onOpenCode).toHaveBeenCalledWith('query:pipelineStats|options.code');
  });

  it('marks the change whose code is open', () => {
    renderList({ onOpenCode: () => {}, activeCodeId: 'query:pipelineStats|options.code' });
    expect(screen.getByRole('button', { name: /Code edited/ }).getAttribute('aria-pressed')).toBe('true');
  });

  it('keeps changes without code as plain lines', () => {
    renderList({ onOpenCode: () => {} });
    expect(screen.queryByRole('button', { name: /Run on page load/ })).toBeNull();
    expect(screen.getByText('Run on page load changed from off to on')).toBeTruthy();
  });
});
