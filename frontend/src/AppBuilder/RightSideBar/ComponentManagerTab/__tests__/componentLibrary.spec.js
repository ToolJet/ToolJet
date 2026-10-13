import { appUsesPackComponents, resolveComponentLibrary } from '../componentLibrary';

const page = (...types) => ({
  id: types.join('-'),
  components: Object.fromEntries(types.map((type, i) => [`c${i}`, { component: { name: `w${i}`, component: type } }])),
});

describe('resolveComponentLibrary', () => {
  it('[ComponentManagerTab-LIB-001] uses the saved library over what the app contains', () => {
    expect(resolveComponentLibrary({ componentLibrary: 'ui1' }, [page('ShadButton')])).toEqual({
      library: 'ui1',
      source: 'saved',
    });
    expect(resolveComponentLibrary({ componentLibrary: 'ui2' }, [page('Button')])).toEqual({
      library: 'ui2',
      source: 'saved',
    });
  });

  it('[ComponentManagerTab-LIB-002] infers UI 2.0 for an unsaved app that already holds a Shad* widget on any page', () => {
    expect(resolveComponentLibrary({}, [page('Text'), page('FlexContainer', 'ShadStat')])).toEqual({
      library: 'ui2',
      source: 'inferred',
    });
  });

  it('[ComponentManagerTab-LIB-003] infers UI 1.0 for an unsaved app with native widgets only, or none', () => {
    expect(resolveComponentLibrary(undefined, [page('Table', 'FlexContainer')])).toEqual({
      library: 'ui1',
      source: 'inferred',
    });
    expect(resolveComponentLibrary({}, [])).toEqual({ library: 'ui1', source: 'inferred' });
    expect(resolveComponentLibrary({}, undefined)).toEqual({ library: 'ui1', source: 'inferred' });
  });

  it('[ComponentManagerTab-LIB-004] ignores an unknown saved value', () => {
    expect(resolveComponentLibrary({ componentLibrary: 'shadcn' }, [page('Button')])).toEqual({
      library: 'ui1',
      source: 'inferred',
    });
  });
});

describe('appUsesPackComponents', () => {
  it('[ComponentManagerTab-LIB-005] reads both component entry shapes and skips empty pages', () => {
    expect(appUsesPackComponents([{ components: { a: { type: 'ShadCard' } } }])).toBe(true);
    expect(appUsesPackComponents([{}, { components: null }, page('Button')])).toBe(false);
  });
});
