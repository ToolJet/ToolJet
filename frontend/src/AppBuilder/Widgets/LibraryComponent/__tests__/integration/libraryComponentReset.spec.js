import React from 'react';
import { render, act } from '@testing-library/react';
import LibraryComponent from '../../../LibraryComponent';
import useStore from '@/AppBuilder/_stores/store';
import { dashlessId } from '../../../libraryComponentRevision';

const CORRELATION_ID = '11111111-2222-3333-4444-555555555555';
const PIN_KEY = dashlessId(CORRELATION_ID);

const setPin = (value) =>
  act(() => useStore.getState().setGlobalSettings({ customComponentLibraries: { [PIN_KEY]: value } }));

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
    // The rendered revision is driven entirely by the library-level pin now
    // (no per-instance fallback — see useEffectiveLibraryRevision), so this
    // moves the pin, not a `revisionId` property.
    setPin('v1');
    const resetExposedVariables = jest.fn();

    const { rerender } = render(
      <LibraryComponent
        {...baseProps}
        properties={{ libraryId: 'lib-1', correlationId: CORRELATION_ID, componentName: 'Comp' }}
        resetExposedVariables={resetExposedVariables}
      />
    );

    expect(resetExposedVariables).not.toHaveBeenCalled();

    setPin('v2');
    rerender(
      <LibraryComponent
        {...baseProps}
        properties={{ libraryId: 'lib-1', correlationId: CORRELATION_ID, componentName: 'Comp' }}
        resetExposedVariables={resetExposedVariables}
      />
    );

    expect(resetExposedVariables).toHaveBeenCalledTimes(1);
  });
});
