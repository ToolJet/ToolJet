import { renderHook, act } from '@testing-library/react';
import { usePackRole } from '../../usePackRole';
import useStore from '@/AppBuilder/_stores/store';
import { useBuiltinPacksStore } from '@/_stores/builtinPacksStore';
import { seedApp, componentDefinition } from '@/test/app-builder';

// The role a pack widget declares, which layout rules read (a pack Stat stretches in an Equal heights row like
// UI 2.0's). Uses the real store: the role is looked up from the component's saved definition.
const MODULE_ID = 'canvas';

const packStat = () => {
  const def = componentDefinition('stat1', 'stat1', 'PackComponent', {
    pack: { value: 'shadcn' },
    componentName: { value: 'Stat' },
  });
  seedApp({ stat1: def }, { moduleId: MODULE_ID });
};

describe('usePackRole', () => {
  afterEach(() => useBuiltinPacksStore.setState({ packs: null, manifests: {} }));

  it("reads a shipped pack component's role from its pack's manifest", () => {
    // Break this catches: layout rules never seeing a PackComponent's role (only custom components'), so a pack Stat
    // stays short in an Equal heights row.
    packStat();
    const { result } = renderHook(() => usePackRole('PackComponent', 'stat1', MODULE_ID));
    expect(result.current).toBeUndefined(); // the manifest has not loaded yet

    act(() => useBuiltinPacksStore.setState({ manifests: { shadcn: { components: { Stat: { role: 'stat' } } } } }));
    expect(result.current).toBe('stat');
  });

  it('gives no role to a native widget', () => {
    seedApp({ b1: componentDefinition('b1', 'button1', 'Button', {}) }, { moduleId: MODULE_ID });
    act(() => useBuiltinPacksStore.setState({ manifests: { shadcn: { components: { Stat: { role: 'stat' } } } } }));
    const { result } = renderHook(() => usePackRole('Button', 'b1', MODULE_ID));
    expect(result.current).toBeUndefined();
  });
});
