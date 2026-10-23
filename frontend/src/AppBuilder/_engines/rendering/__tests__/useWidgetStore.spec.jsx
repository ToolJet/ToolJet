import React from 'react';
import { act, render } from '@testing-library/react';
import { create } from 'zustand';
import { shallow } from 'zustand/shallow';
import { useWidgetStore } from '../useWidgetStore';

const setup = () => {
  const useStore = create(() => ({ own: { label: 'a', styles: { color: 'red' } }, other: 0 }));
  const reads = { label: 0 };
  const renders = [];
  const Widget = ({ suffix }) => {
    const value = useWidgetStore(useStore, (state) => [state.own], [suffix], {
      label: [
        (state) => {
          reads.label++;
          return state.own.label + suffix;
        },
      ],
      styles: [(state) => ({ ...state.own.styles }), shallow],
    });
    renders.push(value);
    return null;
  };
  return { useStore, reads, renders, Widget };
};

describe('useWidgetStore', () => {
  test('a write to anything else reads no field and re-renders nothing', () => {
    const { useStore, reads, renders, Widget } = setup();
    render(<Widget suffix="" />);
    const before = reads.label;
    act(() => useStore.setState({ other: 1 }));
    expect(reads.label).toBe(before);
    expect(renders).toHaveLength(1);
  });

  test('a changed input re-renders with the changed field, keeping the equal ones', () => {
    const { useStore, renders, Widget } = setup();
    render(<Widget suffix="" />);
    const styles = renders[0].styles;
    act(() => useStore.setState((state) => ({ own: { ...state.own, label: 'b' } })));
    expect(renders.at(-1).label).toBe('b');
    expect(renders.at(-1).styles).toBe(styles);
  });

  test('an input that changed with every field equal keeps the value, so no re-render', () => {
    const { useStore, renders, Widget } = setup();
    render(<Widget suffix="" />);
    act(() => useStore.setState((state) => ({ own: { ...state.own, styles: { color: 'red' } } })));
    expect(renders).toHaveLength(1);
  });

  test('a changed dep reads the fields again', () => {
    const { renders, Widget } = setup();
    const { rerender } = render(<Widget suffix="" />);
    rerender(<Widget suffix="!" />);
    expect(renders.at(-1).label).toBe('a!');
  });
});
