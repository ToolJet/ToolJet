import React, { useEffect, useState } from 'react';
import { callActions, installGuards, interact, mountCase, problemsOf } from './harness';

// The fuzz harness catches what it claims to: each faulty widget below must be reported, and a healthy one not.
installGuards();

const check = async (Widget, { properties = {}, after } = {}) => {
  const { stats, view, unmount } = await mountCase({
    name: 'ShadButton',
    Widget,
    properties,
    styles: {},
  });
  if (after) await after(stats, view);
  unmount();
  return problemsOf(stats);
};

describe('fuzz harness', () => {
  it('passes a healthy widget', async () => {
    const Healthy = ({ setExposedVariables, properties }) => {
      useEffect(() => setExposedVariables({ value: properties.label }), [properties.label, setExposedVariables]);
      return <button>{String(properties.label)}</button>;
    };
    expect(await check(Healthy, { properties: { label: 'ok' } })).toEqual([]);
  });

  it('reports a render throw', async () => {
    const Throws = () => {
      throw new Error('boom');
    };
    expect((await check(Throws)).join()).toMatch(/render: boom/);
  });

  it('reports a widget that publishes a fresh object on every render (a store loop)', async () => {
    const Loops = ({ setExposedVariables, properties }) => {
      useEffect(() => setExposedVariables({ selected: { ...properties } }));
      return null;
    };
    expect((await check(Loops)).join()).toMatch(/loop|expose/);
  });

  it('reports a widget that sets its own state on every render', async () => {
    const Spins = () => {
      const [n, setN] = useState(0);
      useEffect(() => setN(n + 1)); // eslint-disable-line react-hooks/exhaustive-deps -- the loop under test
      return <span>{n}</span>;
    };
    expect((await check(Spins)).join()).toMatch(/loop|renders/);
  });

  it('reports a list sized by a property (unbounded render)', async () => {
    const Unbounded = ({ properties }) => (
      <div>
        {Array.from({ length: Number(properties.count) || 0 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
    );
    expect((await check(Unbounded, { properties: { count: 1e9 } })).join()).toMatch(/runaway render/);
  });

  it('reports a throw in an event handler and in an exposed action', async () => {
    const Handler = ({ setExposedVariables }) => {
      useEffect(
        () =>
          setExposedVariables({
            doIt: async (x) => x.y.z,
          }),
        [setExposedVariables]
      );
      return (
        <button
          onClick={() => {
            throw new Error('click failed');
          }}
        />
      );
    };
    const problems = await check(Handler, {
      after: async (stats, view) => {
        await interact(stats, view);
        await callActions(stats);
      },
    });
    expect(problems.join()).toMatch(/click failed/);
    expect(problems.join()).toMatch(/action doIt/);
  });
});
