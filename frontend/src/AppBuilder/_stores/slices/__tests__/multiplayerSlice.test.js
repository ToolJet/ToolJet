import { createMultiplayerSlice } from '../multiplayerSlice';

// setComponentProperty(componentId, property, value, paramType, attr, skipResolve, moduleId, options)
// — 'canvas' used to land on skipResolve and the options object on moduleId, which
// made getCurrentPageIndex(object) throw and skipped FX resolution for remote updates.
describe('multiplayerSlice processUpdate — components/update', () => {
  const makeSlice = () => {
    const setComponentProperty = jest.fn();
    const get = () => ({
      getCurrentPageId: () => 'page1',
      selectedVersion: { id: 'v1' },
      setComponentProperty,
    });
    return { slice: createMultiplayerSlice(jest.fn(), get), setComponentProperty };
  };

  const updateDiff = {
    componentId: 'c1',
    property: 'value',
    value: '{{components.text1.value}}',
    paramType: 'properties',
    attr: 'value',
  };

  it('forwards skipResolve=false, moduleId=canvas and the options object in the right positions', () => {
    const { slice, setComponentProperty } = makeSlice();

    slice.multiplayer.processUpdate({
      diff: updateDiff,
      type: 'components',
      operation: 'update',
      pageId: 'page1',
      versionId: 'v1',
    });

    expect(setComponentProperty).toHaveBeenCalledTimes(1);
    const args = setComponentProperty.mock.calls[0];
    expect(args[0]).toBe('c1');
    expect(args[1]).toBe('value');
    expect(args[2]).toBe('{{components.text1.value}}');
    expect(args[3]).toBe('properties');
    expect(args[4]).toBe('value');
    expect(args[5]).toBe(false);
    expect(args[6]).toBe('canvas');
    expect(args[7]).toEqual({ saveAfterAction: false, skipUndoRedo: true });
  });

  it('ignores updates for a different page or version', () => {
    const { slice, setComponentProperty } = makeSlice();

    slice.multiplayer.processUpdate({
      diff: updateDiff,
      type: 'components',
      operation: 'update',
      pageId: 'other-page',
      versionId: 'v1',
    });
    slice.multiplayer.processUpdate({
      diff: updateDiff,
      type: 'components',
      operation: 'update',
      pageId: 'page1',
      versionId: 'other-version',
    });

    expect(setComponentProperty).not.toHaveBeenCalled();
  });
});
