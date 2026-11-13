import { DEFAULT_PACK, UI1, choiceLabel, libraryChoices, resolveLibraryChoice } from '../componentLibrary';

const packs = [
  { pack: 'mui', displayName: 'Material UI' },
  { pack: 'shadcn', displayName: 'shadcn UI' },
  { pack: 'antd', displayName: 'Ant Design' },
];
const libraries = [{ id: 'lib-1', name: 'Acme widgets' }];
const choices = libraryChoices(packs, libraries);

const packComponent = (pack) => ({
  component: { component: 'PackComponent', definition: { properties: { pack: { value: pack } } } },
});
const button = { component: { component: 'Button' } };

describe('component library choices', () => {
  it('offers the shipped packs by their picker names, in order, then the custom libraries', () => {
    // Break this catches: a pack missing from the picker, or the order shuffling between loads.
    expect(choices.packs.map((c) => [c.value, c.label])).toEqual([
      ['pack:shadcn', 'Rocket 2.0'],
      ['pack:antd', 'Ant Design'],
      ['pack:mui', 'Material UI'],
    ]);
    expect(choices.custom.map((c) => c.value)).toEqual(['lib:lib-1']);
  });

  it('names ToolJet UI 1.0 for the native widgets', () => {
    expect(choiceLabel(UI1, choices)).toBe('ToolJet UI 1.0');
    expect(choiceLabel('pack:antd', choices)).toBe('Ant Design');
  });
});

describe("an app's component library", () => {
  it('keeps the saved choice while the picker offers it', () => {
    expect(resolveLibraryChoice('pack:antd', choices, { b: button })).toBe('pack:antd');
    expect(resolveLibraryChoice(UI1, choices, {})).toBe(UI1);
  });

  it('starts a blank app on Rocket 2.0', () => {
    // Break this catches: a new app opening on the native widgets instead of the default pack.
    expect(resolveLibraryChoice(undefined, choices, {})).toBe(DEFAULT_PACK);
  });

  it('infers an older app from the pack most of its pack components come from', () => {
    // Break this catches: an app built in Ant Design opening its panel on another library.
    const components = { a: packComponent('antd'), b: packComponent('antd'), c: packComponent('shadcn'), d: button };
    expect(resolveLibraryChoice(undefined, choices, components)).toBe('pack:antd');
  });

  it('keeps an app of native widgets on ToolJet UI 1.0', () => {
    expect(resolveLibraryChoice(undefined, choices, { b: button })).toBe(UI1);
  });

  it('reads the earlier ToolJet UI 2.0 setting as Rocket 2.0', () => {
    expect(resolveLibraryChoice('ui2', choices, { b: button })).toBe(DEFAULT_PACK);
  });

  it('falls back when the saved pack no longer ships', () => {
    // Break this catches: the panel stuck on a pack this release removed.
    expect(resolveLibraryChoice('pack:retired', choices, { b: button })).toBe(UI1);
  });
});
