import React from 'react';
import { render, screen } from '@testing-library/react';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import CustomJSONViewer from '../CustomJSONViewer';

describe('CustomJSONViewer', () => {
  // OverflowTooltip measures labels with a ResizeObserver, which jsdom lacks.
  const controls = createAppBuilderControls();
  beforeEach(() => controls.observers.install());
  afterEach(() => controls.restore());

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
});
