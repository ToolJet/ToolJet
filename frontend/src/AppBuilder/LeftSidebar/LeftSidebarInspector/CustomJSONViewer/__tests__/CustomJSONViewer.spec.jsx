import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import CustomJSONViewer from '../CustomJSONViewer';

describe('CustomJSONViewer', () => {
  // OverflowTooltip measures labels with a ResizeObserver, which jsdom lacks.
  const controls = createAppBuilderControls();
  beforeEach(() => controls.observers.install());
  afterEach(() => {
    controls.restore();
    delete navigator.clipboard;
  });

  const copied = () => navigator.clipboard.writeText.mock.calls.at(-1)[0];
  const installClipboard = () =>
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: jest.fn() } });

  // Break this catches: the Debugger renders log payloads without an icon list and the panel crashes.
  it('should render values without an icon list', () => {
    render(<CustomJSONViewer absolutePath="error" data={{ statusCode: 401 }} />);

    expect(screen.getByText('statusCode')).toBeInTheDocument();
  });

  it('should hide the copy-path action when path copying is off', () => {
    render(<CustomJSONViewer absolutePath="error" data={{ statusCode: 401 }} showPathCopy={false} />);

    expect(screen.queryByLabelText('Copy path of statusCode')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Copy value of statusCode')).toBeInTheDocument();
  });

  // Break this catches: the Inspector shows a variable or query result that is null and the whole
  // runtime panel crashes (Object.entries(null)) until the page is reloaded.
  it('should render a null value instead of crashing', () => {
    render(<CustomJSONViewer absolutePath="variables.vNull" data={null} />);

    expect(screen.getByText('null')).toBeInTheDocument();
  });

  // Break this catches: row Copy path on a primitive gives "variables.vString." (trailing dot).
  it('should copy the path of a primitive value without a trailing dot', () => {
    installClipboard();
    render(<CustomJSONViewer absolutePath="variables.vString" data="hello" />);

    fireEvent.click(screen.getByLabelText('Copy path of'));

    expect(copied()).toBe('variables.vString');
  });

  // Break this catches: nested keys are joined with dots, so a key with a space or an array index
  // gives a path that does not work inside {{ }}.
  it('should copy a nested path the way it is written inside {{ }}', () => {
    installClipboard();
    render(<CustomJSONViewer absolutePath="queries.q1" data={{ rows: [{ 'full name': 'Ada' }] }} />);

    fireEvent.click(screen.getByText('rows'));
    fireEvent.click(screen.getByText('0'));
    fireEvent.click(screen.getByLabelText('Copy path of full name'));

    expect(copied()).toBe('queries.q1.rows[0]["full name"]');
  });

  // Break this catches (review N1): an empty {} or [] row shows an expand caret that opens to nothing.
  it('should show no expand caret on empty objects and arrays', () => {
    render(<CustomJSONViewer absolutePath="variables.v" data={{ empty: {}, none: [], full: [1] }} />);

    const caretOf = (label) =>
      screen.getByText(label).closest('.json-viewer-row').querySelector('.json-viewer-expand-icon svg');
    expect(caretOf('empty')).toBeNull();
    expect(caretOf('none')).toBeNull();
    expect(caretOf('full')).not.toBeNull();
  });

  // Break this catches: Copy value on a function row throws (JSON.stringify gives undefined).
  it('should copy a function row without throwing', () => {
    installClipboard();
    render(<CustomJSONViewer absolutePath="components.text1" data={{ setText: () => {} }} />);

    fireEvent.click(screen.getByLabelText('Copy value of setText'));

    expect(copied()).toBe('function');
  });
});
