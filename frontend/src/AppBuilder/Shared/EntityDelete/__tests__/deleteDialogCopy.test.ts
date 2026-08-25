import {
  buildDeleteDialogCopy,
  nestedChildNote,
  pluralizeEntity,
  usedByLabel,
} from '@/AppBuilder/Shared/EntityDelete/deleteDialogCopy';

const subject = (name: string, dependentCount: number, viaDescendant: Record<string, string> = {}) => ({
  kind: 'component',
  id: name,
  name,
  dependents: Array.from({ length: dependentCount }, (_, i) => ({
    kind: 'component',
    id: `dep-${name}-${i}`,
    name: `dep-${name}-${i}`,
    details: [],
  })),
  viaDescendant,
});

const named = (...names: string[]) => names.map((name) => ({ id: name, name }));

describe('buildDeleteDialogCopy — blocked', () => {
  it('names the single subject and counts its references', () => {
    const copy = buildDeleteDialogCopy({
      entityLabel: 'component',
      subjects: named('userTable'),
      blockers: [subject('userTable', 4)],
    });

    expect(copy.blocked).toBe(true);
    expect(copy.title).toBe('Can\'t delete "userTable"');
    expect(copy.subtitle).toBe("It's used by 4 other things in this app. Remove these references, then try again.");
  });

  it('keeps "thing" singular for a lone reference', () => {
    const copy = buildDeleteDialogCopy({ subjects: named('userTable'), blockers: [subject('userTable', 1)] });
    expect(copy.subtitle).toBe("It's used by 1 other thing in this app. Remove these references, then try again.");
  });

  it('says "Both" when two of two are blocked', () => {
    const copy = buildDeleteDialogCopy({
      subjects: named('userTable', 'Container1'),
      blockers: [subject('userTable', 4), subject('Container1', 1)],
    });

    expect(copy.title).toBe("Can't delete 2 components");
    expect(copy.subtitle).toBe('Both are still in use elsewhere. Remove these references, then try again.');
  });

  it('says "All n" when more than two are blocked', () => {
    const copy = buildDeleteDialogCopy({
      subjects: named('a', 'b', 'c'),
      blockers: [subject('a', 1), subject('b', 1), subject('c', 1)],
    });

    expect(copy.title).toBe("Can't delete 3 components");
    expect(copy.subtitle).toBe('All 3 are still in use elsewhere. Remove these references, then try again.');
  });

  it('reports the blocked fraction of a partially blocked selection', () => {
    const copy = buildDeleteDialogCopy({
      subjects: named('userTable', 'Container1'),
      blockers: [subject('userTable', 1)],
    });

    expect(copy.title).toBe("Can't delete 2 components");
    expect(copy.subtitle).toBe('1 of 2 selected components is still in use elsewhere.');
  });

  it('uses a plural verb when several of many are blocked', () => {
    const copy = buildDeleteDialogCopy({
      subjects: named('a', 'b', 'c'),
      blockers: [subject('a', 1), subject('b', 1)],
    });

    expect(copy.subtitle).toBe('2 of 3 selected components are still in use elsewhere.');
  });

  it('points at the child when the reference only reaches a descendant', () => {
    const copy = buildDeleteDialogCopy({
      subjects: named('Container1'),
      blockers: [subject('Container1', 1, { 'component:dep-Container1-0': 'textinput7' })],
    });

    expect(copy.subtitle).toBe('A component inside it is still in use elsewhere.');
  });

  it('keeps the direct-reference wording when only some dependents come via a child', () => {
    const copy = buildDeleteDialogCopy({
      subjects: named('Container1'),
      blockers: [subject('Container1', 2, { 'component:dep-Container1-1': 'textinput7' })],
    });

    expect(copy.subtitle).toBe("It's used by 2 other things in this app. Remove these references, then try again.");
  });

  it('pluralises queries correctly', () => {
    const copy = buildDeleteDialogCopy({
      entityLabel: 'query',
      subjects: named('listUsers', 'listOrders'),
      blockers: [subject('listUsers', 12)],
    });

    expect(copy.title).toBe("Can't delete 2 queries");
    expect(copy.subtitle).toBe('1 of 2 selected queries is still in use elsewhere.');
  });
});

describe('buildDeleteDialogCopy — clear', () => {
  it('confirms a single deletion', () => {
    const copy = buildDeleteDialogCopy({ subjects: named('Container1'), blockers: [] });

    expect(copy.blocked).toBe(false);
    expect(copy.title).toBe('Delete "Container1"?');
    expect(copy.subtitle).toBe('Nothing outside this selection depends on it.');
  });

  it('confirms a multi-selection', () => {
    const copy = buildDeleteDialogCopy({ subjects: named('a', 'b'), blockers: [] });

    expect(copy.title).toBe('Delete 2 components?');
    expect(copy.subtitle).toBe('Nothing outside this selection depends on these.');
  });

  it('confirms a single query deletion', () => {
    const copy = buildDeleteDialogCopy({ entityLabel: 'query', subjects: named('listUsers'), blockers: [] });
    expect(copy.title).toBe('Delete "listUsers"?');
  });

  // A nameless subject used to render its internal id, so the dialog read
  // `Delete "e99186a0-1589-4f67-96cc-703f07b23252"?`.
  it('names an unresolvable subject by its kind rather than quoting nothing', () => {
    expect(buildDeleteDialogCopy({ subjects: [{}], blockers: [] }).title).toBe('Delete this component?');
    expect(buildDeleteDialogCopy({ entityLabel: 'query', subjects: [{}], blockers: [] }).title).toBe(
      'Delete this query?'
    );
  });

  it('names an unresolvable subject by its kind when blocked too', () => {
    const copy = buildDeleteDialogCopy({ subjects: [{}], blockers: [subject('x', 2)] });
    expect(copy.title).toBe("Can't delete this component");
  });
});

describe('labels', () => {
  it('singularises the card count', () => {
    expect(usedByLabel(1)).toBe('Used by 1 entity');
    expect(usedByLabel(4)).toBe('Used by 4 entities');
  });

  it('pluralises entity nouns', () => {
    expect(pluralizeEntity('component', 1)).toBe('component');
    expect(pluralizeEntity('component', 2)).toBe('components');
    expect(pluralizeEntity('query', 2)).toBe('queries');
  });

  it('explains a nested child', () => {
    expect(nestedChildNote('textinput7', 'Container1')).toBe('textinput7 lives inside Container1');
  });
});
