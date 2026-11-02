/** @jest-environment node */
// Counts sandboxes: isolated-vm is a native boundary, so it is wrapped (not replaced) to observe construction.
jest.mock('isolated-vm', () => {
  const actual = jest.requireActual('isolated-vm');
  const Isolate = jest.fn((options) => new actual.Isolate(options));
  // The native module's exports are non-enumerable, so proxy them instead of spreading.
  return new Proxy(actual, { get: (target, key) => (key === 'Isolate' ? Isolate : target[key]) });
});
import * as ivm from 'isolated-vm';
import type { buildLibraryVariableMap as Build } from '@modules/data-queries/library/library-query.util';

// The shared test setup may already hold the real module; load a fresh copy that sees the wrapper.
let buildLibraryVariableMap: typeof Build;
jest.isolateModules(() => {
  ({ buildLibraryVariableMap } = jest.requireActual('@modules/data-queries/library/library-query.util'));
});

// A sandbox is a synchronous isolate plus the moment/lodash bundles, on the request thread: only templates pay for it.
describe('buildLibraryVariableMap | sandbox cost', () => {
  beforeEach(() => (ivm.Isolate as unknown as jest.Mock).mockClear());

  it('should not start a sandbox for a query without templates', () => {
    const result = buildLibraryVariableMap(
      { url: 'https://example.com', inputs: [{ name: 'id', defaultValue: '7' }] },
      {}
    );

    expect(result).toMatchObject({ variableMap: {}, input: { id: '7' } });
    expect(ivm.Isolate).not.toHaveBeenCalled();
  });

  it('should start one sandbox for a run with templates', () => {
    const result = buildLibraryVariableMap(
      { url: '{{input.id}}/{{_.upperFirst(input.id)}}', inputs: [{ name: 'id', defaultValue: '{{"a" + "b"}}' }] },
      {}
    );

    expect(result.variableMap).toEqual({ '{{input.id}}': 'ab', '{{_.upperFirst(input.id)}}': 'Ab' });
    expect(ivm.Isolate).toHaveBeenCalledTimes(1);
  });
});
