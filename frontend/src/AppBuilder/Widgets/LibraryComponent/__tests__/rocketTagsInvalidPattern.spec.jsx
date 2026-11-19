import { act, fireEvent } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';
import { addTags } from '../../../../../../packs/shadcn/src/lib/ui2/inputs/model';

installBrowserStubs();

// QA: a Rocket 2.0 Tags Input whose Tag pattern is not a valid regular expression ('[') accepted every tag with no
// error. ToolJet's own inputs fail an invalid Regex validation with "Invalid regex pattern"; the Tags Input now refuses
// the tag with the same message. The pack component, the inline SDK and the host renderer are the real ones; only
// module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Tags Input: a Tag pattern that is not a valid regular expression', () => {
  test('[PackComponent-TAGS-PAT-001] addTags refuses the tag with "Invalid regex pattern"', () => {
    const result = addTags([], ['zzz'], { pattern: '[', patternError: 'bad' });
    expect(result.tags).toEqual([]);
    expect(result.error).toBe('Invalid regex pattern');
  });

  test('[PackComponent-TAGS-PAT-002] controls: no pattern accepts, a valid pattern refuses with its own error', () => {
    expect(addTags([], ['zzz'], { pattern: '' }).tags).toEqual(['zzz']);
    const refused = addTags([], ['123'], { pattern: '^[a-z]+$', patternError: 'bad' });
    expect(refused.tags).toEqual([]);
    expect(refused.error).toBe('bad');
  });

  test('[PackComponent-TAGS-PAT-003] typing zzz and Enter adds no tag and shows the error', async () => {
    const v = await mountPack('shadcn', 'TagsInput', { tagPattern: '[', patternError: 'bad' });
    const input = v.root().querySelector('input');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'zzz' } });
    });
    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', keyCode: 13 });
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(v.exposed.values ?? []).toEqual([]);
    expect(v.root().textContent).toContain('Invalid regex pattern');
  });
});
