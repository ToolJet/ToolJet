// tsconfig.json pins `types` to node/rxjs, so the jest globals are not ambient here.
import { describe, expect, test } from '@jest/globals';
import { AppsUtilService } from '../../../../src/modules/apps/util.service';

/** BackfillStatisticsHideSecondary's pin only holds if a config default never overrides a saved value. */
describe('AppsUtilService.buildComponentMetaDefinition — Statistics hideSecondary', () => {
  // buildComponentMetaDefinition reads none of the injected dependencies.
  const noDependency = null as any;
  const service = new AppsUtilService(
    noDependency,
    noDependency,
    noDependency,
    noDependency,
    noDependency,
    noDependency
  );

  const statisticsComponent = (properties: Record<string, unknown>) => ({
    stat1: {
      component: {
        component: 'Statistics',
        name: 'statistics1',
        definition: { properties, styles: {}, general: {}, generalStyles: {}, others: {}, events: [] },
      },
      layouts: {},
    },
  });

  const hideSecondaryOf = (components: Record<string, any>) =>
    components.stat1.component.definition.properties.hideSecondary;

  test('a component that saved hideSecondary false keeps it', () => {
    const merged = service.buildComponentMetaDefinition(statisticsComponent({ hideSecondary: { value: '{{false}}' } }));

    expect(hideSecondaryOf(merged)).toEqual({ value: '{{false}}' });
  });

  test('a component that saved hideSecondary true keeps it', () => {
    const merged = service.buildComponentMetaDefinition(statisticsComponent({ hideSecondary: { value: '{{true}}' } }));

    expect(hideSecondaryOf(merged)).toEqual({ value: '{{true}}' });
  });

  test('a component with no saved hideSecondary takes the shipped default', () => {
    // The absent-key case the migration exists to remove.
    const merged = service.buildComponentMetaDefinition(statisticsComponent({}));

    expect(hideSecondaryOf(merged)).toEqual({ value: '{{true}}' });
  });
});
