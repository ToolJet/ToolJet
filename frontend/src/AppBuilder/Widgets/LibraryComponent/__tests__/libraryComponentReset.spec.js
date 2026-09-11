import React from 'react';
import { render } from '@testing-library/react';
import { LibraryComponent } from '../../LibraryComponent';

describe('LibraryComponent exposed-variable reset', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false });
  });

  const baseProps = {
    id: 'widget-1',
    setExposedVariable: jest.fn(),
    fireEvent: jest.fn(),
  };

  it('[LibraryComponent-RESET-001] resets exposed variables when the rendered revision changes, even with no dev pin involved', () => {
    // Break this catches: keying the reset effect on devNonce alone (its current
    // dependency) instead of also on the rendered library identity (libraryId +
    // effectiveRevision + componentName) — switching published revisions or
    // component exports would then leave stale state keys/actions behind.
    const resetExposedVariables = jest.fn();

    const { rerender } = render(
      <LibraryComponent
        {...baseProps}
        properties={{ libraryId: 'lib-1', componentName: 'Comp', revisionId: 'v1' }}
        resetExposedVariables={resetExposedVariables}
      />
    );

    expect(resetExposedVariables).not.toHaveBeenCalled();

    rerender(
      <LibraryComponent
        {...baseProps}
        properties={{ libraryId: 'lib-1', componentName: 'Comp', revisionId: 'v2' }}
        resetExposedVariables={resetExposedVariables}
      />
    );

    expect(resetExposedVariables).toHaveBeenCalledTimes(1);
  });
});
