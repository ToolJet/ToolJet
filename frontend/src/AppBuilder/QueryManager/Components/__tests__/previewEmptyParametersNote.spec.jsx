import React from 'react';
import { render, screen } from '@testing-library/react';

// Preview names the parameters a run had no value for, next to the result, so "0" is not read as lost data.
let mockState;
jest.mock('@/AppBuilder/_stores/store', () => ({
  __esModule: true,
  default: (selector) => selector(mockState),
}));
jest.mock('react-json-tree', () => ({ JSONTree: () => <div data-testid="json-tree" /> }));

import Preview from '../Preview';

const panel = (overrides) => ({
  queryPanel: {
    previewPanelHeight: 200,
    previewPanelExpanded: true,
    setPreviewPanelExpanded: jest.fn(),
    queryPreviewData: [{ expenses_id_count: 0 }],
    previewLoading: false,
    queryPanelHeight: 400,
    previewEmptyParameters: ['month'],
    ...overrides,
  },
});

beforeAll(() => {
  window.HTMLElement.prototype.scrollIntoView ??= () => {};
});

test('shows the note under Preview after a run with an empty parameter', () => {
  mockState = panel();
  render(<Preview darkMode={false} calculatePreviewHeight={() => {}} />);
  expect(screen.getByRole('note')).toHaveTextContent(
    'Ran with an empty parameter (month). The app passes its own value when it runs this query.'
  );
});

test('no note when every parameter had a value, while it runs, or with no result yet', () => {
  mockState = panel({ previewEmptyParameters: [] });
  const { unmount } = render(<Preview darkMode={false} calculatePreviewHeight={() => {}} />);
  expect(screen.queryByRole('note')).toBeNull();
  unmount();

  mockState = panel({ previewLoading: true });
  const loading = render(<Preview darkMode={false} calculatePreviewHeight={() => {}} />);
  expect(screen.queryByRole('note')).toBeNull();
  loading.unmount();

  mockState = panel({ queryPreviewData: '' });
  render(<Preview darkMode={false} calculatePreviewHeight={() => {}} />);
  expect(screen.queryByRole('note')).toBeNull();
});
