import React from 'react';
import { act, render } from '@testing-library/react';
import { withControlState } from '../../packHooks';

const seen = [];
const Probe = ({ properties }) => {
  seen.push(properties);
  return null;
};
const Controlled = withControlState(Probe);

const mount = (properties) => {
  const exposed = {};
  const setExposedVariables = (values) => Object.assign(exposed, values);
  const setExposedVariable = (key, value) => (exposed[key] = value);
  const view = render(
    <Controlled
      properties={properties}
      setExposedVariables={setExposedVariables}
      setExposedVariable={setExposedVariable}
    />
  );
  return { exposed, view, setExposedVariables, setExposedVariable };
};
const last = () => seen[seen.length - 1];

beforeEach(() => (seen.length = 0));

describe('withControlState', () => {
  it('reads unset control properties as their defaults: visible, enabled, not loading', () => {
    const { exposed } = mount({ label: 'Save' });
    expect(last()).toMatchObject({ label: 'Save', visibility: true, loadingState: false, disabledState: false });
    expect(exposed).toMatchObject({ isVisible: true, isLoading: false, isDisabled: false });
  });

  it('exposes setVisibility, setLoading and setDisable, which change what the widget receives', async () => {
    const { exposed } = mount({ visibility: true });
    await act(() => exposed.setLoading(true));
    expect(last().loadingState).toBe(true);
    expect(exposed.isLoading).toBe(true);
    await act(() => exposed.setDisable(true));
    expect(last().disabledState).toBe(true);
    await act(() => exposed.setVisibility(false));
    expect(last().visibility).toBe(false);
    expect(exposed.isVisible).toBe(false);
  });

  it('follows a property change after an action, as native widgets do', async () => {
    const { exposed, view, setExposedVariables, setExposedVariable } = mount({ loadingState: false });
    await act(() => exposed.setLoading(true));
    view.rerender(
      <Controlled
        properties={{ loadingState: true }}
        setExposedVariables={setExposedVariables}
        setExposedVariable={setExposedVariable}
      />
    );
    view.rerender(
      <Controlled
        properties={{ loadingState: false }}
        setExposedVariables={setExposedVariables}
        setExposedVariable={setExposedVariable}
      />
    );
    expect(last().loadingState).toBe(false);
  });
});
