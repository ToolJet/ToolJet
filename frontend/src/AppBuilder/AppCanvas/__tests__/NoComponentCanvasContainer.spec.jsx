import React from 'react';
import { render, screen } from '@testing-library/react';

// A blank canvas: the AI-era ways in where the AI builder ships, else the legacy cards. A Code mode app is never built
// by dragging components, so it never gets the legacy cards, AI or not.
let mockState;
jest.mock('@/AppBuilder/_stores/store', () => {
  const useStore = (selector) => selector(mockState);
  useStore.getState = () => mockState;
  return { __esModule: true, default: useStore };
});
jest.mock('@/AppBuilder/_contexts/ModuleContext', () => ({ useModuleContext: () => ({ isModuleEditor: false }) }));
jest.mock('@ee/modules/AiBuilder/components/CanvasBuild', () => ({
  EmptyCanvasAiState: () => <div data-testid="ways-in" />,
}));

import NoComponentCanvasContainer from '../NoComponentCanvasContainer';

const stateWith = ({ aiFeaturesEnabled, buildMode = 'visual' }) => ({
  sampleDataSource: null,
  dataQuery: { createDataQuery: jest.fn() },
  queryPanel: { setPreviewData: jest.fn(), expandQueryPaneIfNeeded: jest.fn() },
  getShouldFreeze: () => false,
  ai: { aiFeaturesEnabled },
  appStore: { modules: { canvas: { app: { buildMode } } } },
});

test('a Code mode app without AI gets the ways in, not the drag-and-drop cards', () => {
  mockState = stateWith({ aiFeaturesEnabled: false, buildMode: 'code' });
  render(<NoComponentCanvasContainer />);
  expect(screen.getByTestId('ways-in')).toBeInTheDocument();
  expect(screen.queryByText('Drag and drop a component')).toBeNull();
});

test('a visual app without AI keeps the drag-and-drop cards', () => {
  mockState = stateWith({ aiFeaturesEnabled: false });
  render(<NoComponentCanvasContainer />);
  expect(screen.getByText('Drag and drop a component')).toBeInTheDocument();
  expect(screen.queryByTestId('ways-in')).toBeNull();
});

test('a visual app with AI gets the ways in', () => {
  mockState = stateWith({ aiFeaturesEnabled: true });
  render(<NoComponentCanvasContainer />);
  expect(screen.getByTestId('ways-in')).toBeInTheDocument();
});
