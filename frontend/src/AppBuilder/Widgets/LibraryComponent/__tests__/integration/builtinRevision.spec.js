import { renderHook, act } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import { useEffectiveLibraryRevision } from '@/AppBuilder/Widgets/hooks/useEffectiveLibraryRevision';

describe('built-in pack version in the widget', () => {
  beforeEach(() => {
    // The listing itself is the server's; here the store gets it the way fetchBuiltinPacks writes it.
    useCustomComponentLibrariesStore.setState({
      builtinHashes: undefined,
      fetchBuiltinPacks: () => Promise.resolve([]),
    });
  });

  it('picks up the shipped version once the server lists the packs after the first render', () => {
    // Break this catches: the widget reading the pack list only once, so a component dropped or loaded before the list
    // arrives stays an empty placeholder.
    expect(useStore.getState()).toBeTruthy();
    const { result } = renderHook(() => useEffectiveLibraryRevision('builtin:shadcn'));
    expect(result.current).toBeUndefined();

    act(() => useCustomComponentLibrariesStore.setState({ builtinHashes: { shadcn: '56c11cd3ed11df1c' } }));

    expect(result.current).toBe('builtin:56c11cd3ed11df1c');
  });
});
