/**
 * Query preview docks at the bottom of the right-side query panel. Expanded, it takes a share of
 * that panel's height (not of the bottom runtime panel's, which is unrelated now) and the builder
 * resizes it by dragging its top edge. The chosen height is remembered for the next query.
 */
import fs from 'fs';
import path from 'path';
import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import Preview from '@/AppBuilder/QueryManager/Components/Preview';
import { PREVIEW_PANEL, RUNTIME_PANEL_COLLAPSED_HEIGHT } from '@/AppBuilder/panelLayout';

const CONTAINER_HEIGHT = 600;

const renderPreview = () => {
  const calculatePreviewHeight = jest.fn();
  const container = document.createElement('div');
  container.className = PREVIEW_PANEL.containerClassName;
  Object.defineProperty(container, 'clientHeight', { configurable: true, value: CONTAINER_HEIGHT });
  document.body.appendChild(container);
  const view = render(<Preview darkMode={false} calculatePreviewHeight={calculatePreviewHeight} />, { container });
  const panel = () => container.querySelector('.preview-section');
  return { ...view, panel, calculatePreviewHeight };
};

beforeEach(() => {
  act(() => {
    useStore.setState((state) => {
      state.queryPanel.previewPanelHeight = 0;
      state.queryPanel.previewPanelExpanded = true;
      // The bottom runtime panel is collapsed; it must not decide the preview's size.
      state.queryPanel.queryPanelHeight = 38;
    });
  });
});

afterEach(() => {
  document.body.innerHTML = '';
});

test('opens at a share of the query panel height', () => {
  const { panel, calculatePreviewHeight } = renderPreview();

  expect(panel().style.height).toBe('240px');
  expect(calculatePreviewHeight).toHaveBeenLastCalledWith(240, true);
});

test('resizes from its top edge and remembers the height', () => {
  const { panel, calculatePreviewHeight } = renderPreview();

  fireEvent.mouseMove(document, { clientY: 0 });
  fireEvent.mouseDown(panel(), { clientY: 0 });
  fireEvent.mouseMove(document, { clientY: -100 });
  expect(panel().style.height).toBe('340px');

  fireEvent.mouseUp(document, { clientY: -100 });
  expect(useStore.getState().queryPanel.previewPanelHeight).toBe(340);
  expect(calculatePreviewHeight).toHaveBeenLastCalledWith(340, true);
});

test('keeps room for the query fields above it', () => {
  const { panel } = renderPreview();

  fireEvent.mouseMove(document, { clientY: 0 });
  fireEvent.mouseDown(panel(), { clientY: 0 });
  fireEvent.mouseMove(document, { clientY: -1000 });

  expect(panel().style.height).toBe(`${CONTAINER_HEIGHT - PREVIEW_PANEL.reservedAbovePx}px`);
});

test('collapses when dragged below its minimum height', () => {
  const { panel } = renderPreview();

  fireEvent.mouseMove(document, { clientY: 0 });
  fireEvent.mouseDown(panel(), { clientY: 0 });
  fireEvent.mouseMove(document, { clientY: 220 });
  fireEvent.mouseUp(document, { clientY: 220 });

  expect(useStore.getState().queryPanel.previewPanelExpanded).toBe(false);
});

test('reopens at the remembered height', () => {
  act(() => {
    useStore.setState((state) => {
      state.queryPanel.previewPanelHeight = 300;
    });
  });

  const { panel } = renderPreview();

  expect(panel().style.height).toBe('300px');
});

// Running a preview from the header expands the panel through the store, not through the toggle.
test('tells the query fields to make room when the preview opens from the header', () => {
  act(() => {
    useStore.setState((state) => {
      state.queryPanel.previewPanelExpanded = false;
    });
  });
  const { calculatePreviewHeight } = renderPreview();

  act(() => useStore.getState().queryPanel.setPreviewPanelExpanded(true));

  expect(calculatePreviewHeight).toHaveBeenLastCalledWith(240, true);
});

// A quick drag can deliver mousedown, mousemove and mouseup before React re-renders in between.
test('resizes on a drag that arrives in one burst', () => {
  const { panel } = renderPreview();
  const mouse = (type, target, clientY) => target.dispatchEvent(new MouseEvent(type, { bubbles: true, clientY }));

  act(() => {
    mouse('mousemove', document, 0);
    mouse('mousedown', panel(), 0);
    mouse('mousemove', document, -100);
    mouse('mouseup', document, -100);
  });

  expect(panel().style.height).toBe('340px');
  expect(useStore.getState().queryPanel.previewPanelHeight).toBe(340);
});

// The grab zone (and the resize cursor) extends a few pixels above the panel, over the query fields.
test('starts a drag from just above its top edge', () => {
  const { panel } = renderPreview();
  const fieldsAbove = document.createElement('div');
  document.body.appendChild(fieldsAbove);

  fireEvent.mouseMove(document, { clientY: -8 });
  fireEvent.mouseDown(fieldsAbove, { clientY: -8 });
  fireEvent.mouseMove(document, { clientY: -108 });
  fireEvent.mouseUp(document, { clientY: -108 });

  expect(panel().style.height).toBe('340px');
});

// Closed, the preview bar lines up with the closed Inspector/Debugger bar beside it.
test('closes to the height of the closed runtime panel bar', () => {
  act(() => {
    useStore.setState((state) => {
      state.queryPanel.previewPanelExpanded = false;
    });
  });

  const { panel } = renderPreview();

  expect(panel().style.height).toBe(`${RUNTIME_PANEL_COLLAPSED_HEIGHT}px`);
});

test('keeps its header row at the closed bar height when open or closed', () => {
  const styles = fs.readFileSync(path.join(__dirname, '../../../../../_styles/queryManager.scss'), 'utf8');

  expect(styles).toMatch(
    new RegExp(
      `\\.preview-toggle \\{\\s*flex: 0 0 ${RUNTIME_PANEL_COLLAPSED_HEIGHT}px;\\s*height: ${RUNTIME_PANEL_COLLAPSED_HEIGHT}px;`
    )
  );
});
