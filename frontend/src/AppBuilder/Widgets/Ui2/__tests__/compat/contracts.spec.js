// Backward compatibility, layer 1: each UI 2.0 widget's public contract (the names and defaults a saved app relies on,
// see contract.js) is frozen in Ui2/__contracts__/<Type>.json. A new name passes once `npm run ui2:contracts` has
// written it. A removed or renamed name, a changed default, a changed value type or reordered action parameters fail,
// unless the same change records the rename in legacyNames.ts with a data migration, or lists an accepted break with
// its reason in __contracts__/acceptedBreaks.json. The failure message says which, and how.
import { shadcnConfigs } from '@/AppBuilder/WidgetManager/widgets/shadcn';
import { renamesFor } from '@/AppBuilder/Widgets/Ui2/legacyNames';
import { classify, compareWithFrozen, contractOf, diffContract, explainAll, readAcceptedBreaks } from './contract';

describe('UI 2.0 widget contracts', () => {
  it('match the frozen contracts in Ui2/__contracts__', () => {
    const { classified } = compareWithFrozen({ configs: shadcnConfigs, renamesFor });
    if (classified.length) throw new Error(explainAll(classified));
  });

  it('accept a break only with a reason', () => {
    const AREAS = ['property', 'style', 'validation', 'event', 'action', 'exposed', 'widget'];
    const CHANGES = ['removed', 'default', 'initial', 'valueType', 'params'];
    const invalid = readAcceptedBreaks().filter(
      (b) =>
        !/^Shad\w+$/.test(b.type) ||
        !AREAS.includes(b.area) ||
        !b.key ||
        !CHANGES.includes(b.change) ||
        !(typeof b.reason === 'string' && b.reason.trim().length >= 10)
    );
    expect(invalid).toEqual([]);
  });
});

// The rules above, on a copy of one config, so the guard itself cannot quietly stop guarding.
describe('UI 2.0 widget contract rules', () => {
  const base = shadcnConfigs.find((c) => c.name === 'ShadSelect');
  const frozen = { ShadSelect: contractOf(base) };
  const edit = (fn) => {
    const config = JSON.parse(JSON.stringify(base));
    fn(config);
    return config;
  };
  const verdicts = (config, { renames = {}, migrationTexts = [], acceptedBreaks = [] } = {}) =>
    classify(diffContract(frozen.ShadSelect, contractOf(config)), {
      renamesFor: (type) => ({ events: {}, actions: {}, exposed: {}, properties: {}, ...renames[type] }),
      migrationTexts,
      acceptedBreaks,
      liveContracts: { ShadSelect: contractOf(config) },
    });
  const renameOnSelect = edit((c) => {
    c.events.onPick = c.events.onSelect;
    delete c.events.onSelect;
  });

  it('[COMPAT-CONTRACT-001] a new event, action, exposed value or property is an addition', () => {
    const config = edit((c) => {
      c.events.onOpen = { displayName: 'On open' };
      c.exposedVariables.isOpen = false;
      c.properties.maxItems = { type: 'code', validation: { schema: { type: 'number' }, defaultValue: 5 } };
    });
    expect(verdicts(config).map((v) => [v.area, v.key, v.verdict])).toEqual([
      ['property', 'maxItems', 'addition'],
      ['event', 'onOpen', 'addition'],
      ['exposed', 'isOpen', 'addition'],
    ]);
  });

  it('[COMPAT-CONTRACT-002] renaming an event with no legacy name or migration is a break that says how to fix it', () => {
    const [removed] = verdicts(renameOnSelect).filter((v) => v.change === 'removed');
    expect(removed).toMatchObject({ area: 'event', key: 'onSelect', verdict: 'break' });
    const message = explainAll([removed]);
    expect(message).toContain('ShadSelect event "onSelect" was removed or renamed.');
    expect(message).toContain('UI2_RENAMES.ShadSelect.events in Widgets/Ui2/legacyNames.ts');
    expect(message).toContain('server/data-migrations');
    expect(message).toContain('acceptedBreaks.json');
  });

  it('[COMPAT-CONTRACT-003] a legacy name alone is not enough: the rename also needs a data migration', () => {
    const renames = { ShadSelect: { events: { onSelect: 'onPick' } } };
    const [noMigration] = verdicts(renameOnSelect, { renames }).filter((v) => v.change === 'removed');
    expect(noMigration.verdict).toBe('break');
    expect(explainAll([noMigration])).toContain(`no migration in server/data-migrations rewrites`);

    const migrationTexts = ["const RENAMES = { ShadSelect: { events: { onSelect: 'onPick' } } };"];
    const [migrated] = verdicts(renameOnSelect, { renames, migrationTexts }).filter((v) => v.change === 'removed');
    expect(migrated).toMatchObject({ verdict: 'renamed', to: 'onPick' });
  });

  it('[COMPAT-CONTRACT-004] a changed default is a break unless accepted with a reason', () => {
    const config = edit((c) => {
      c.properties.placeholder.validation.defaultValue = 'Choose';
    });
    const [change] = verdicts(config);
    expect(change).toMatchObject({ area: 'property', key: 'placeholder', change: 'default', verdict: 'break' });
    expect(explainAll([change])).toContain('changed its default from "Select" to "Choose"');

    const acceptedBreaks = [
      { type: 'ShadSelect', area: 'property', key: 'placeholder', change: 'default', reason: 'Design review' },
    ];
    expect(verdicts(config, { acceptedBreaks })[0].verdict).toBe('accepted');
  });

  it('[COMPAT-CONTRACT-005] reordering or renaming an action parameter is a break (saved calls pass by position)', () => {
    const config = edit((c) => {
      c.actions.find((a) => a.handle === 'selectOption').params[0].handle = 'option';
    });
    const [change] = verdicts(config);
    expect(change).toMatchObject({ area: 'action', key: 'selectOption', change: 'params', verdict: 'break' });
  });

  it('[COMPAT-CONTRACT-006] dropping an exposed value is a break', () => {
    const config = edit((c) => {
      delete c.exposedVariables.selectedOption;
    });
    const [change] = verdicts(config);
    expect(change).toMatchObject({ area: 'exposed', key: 'selectedOption', verdict: 'break' });
    expect(explainAll([change])).toContain('{{components.x.selectedOption}}');
  });
});
