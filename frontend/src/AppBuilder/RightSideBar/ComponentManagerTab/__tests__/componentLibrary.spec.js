import { DEFAULT_PACK, UI1, choiceLabel, libraryChoices, resolveLibraryChoice } from '../componentLibrary';

const pack = (id, pack, name) => ({
  id,
  name,
  manifest: { manifestVersion: 2, pack, components: { Button: { role: 'button' } } },
});
const choices = libraryChoices([pack('lib-shad', 'shadcn', 'shadcn UI'), pack('lib-ant', 'antd', 'Ant Design')]);
const page = (...components) => ({ id: 'p', components: Object.fromEntries(components.map((c, i) => [`c${i}`, c])) });
const native = (type) => ({ component: { name: type, component: type } });
const packWidget = (libraryId) => ({
  component: { component: 'LibraryComponent', definition: { properties: { libraryId: { value: libraryId } } } },
});

describe('resolveLibraryChoice', () => {
  it('[ComponentManagerTab-LIB-001] keeps a saved ToolJet UI 1.0 or a saved pack the picker offers', () => {
    expect(resolveLibraryChoice(UI1, choices, [page()])).toBe(UI1);
    expect(resolveLibraryChoice('pack:antd', choices, [page(native('Button'))])).toBe('pack:antd');
  });

  it('[ComponentManagerTab-LIB-002] reads ToolJet UI 2.0, saved by earlier builds, as Rocket 2.0', () => {
    expect(resolveLibraryChoice('ui2', choices, [page(native('ShadStat'))])).toBe(DEFAULT_PACK);
  });

  it('[ComponentManagerTab-LIB-003] infers the pack most of an unsaved app\'s pack widgets come from', () => {
    expect(resolveLibraryChoice(undefined, choices, [page(packWidget('lib-ant'), packWidget('lib-ant'))])).toBe('pack:antd');
  });

  it('[ComponentManagerTab-LIB-004] opens a blank app on Rocket 2.0 and an app of native widgets on UI 1.0', () => {
    expect(resolveLibraryChoice(undefined, choices, [page()])).toBe(DEFAULT_PACK);
    expect(resolveLibraryChoice(undefined, choices, [page(native('Table'))])).toBe(UI1);
    expect(resolveLibraryChoice(undefined, { packs: [], custom: [] }, [page()])).toBe(UI1);
  });

  it('[ComponentManagerTab-LIB-005] labels ToolJet UI 1.0 and the packs', () => {
    expect(choiceLabel(UI1, choices)).toBe('ToolJet UI 1.0');
    expect(choiceLabel(DEFAULT_PACK, choices)).toBe('Rocket 2.0');
  });
});
