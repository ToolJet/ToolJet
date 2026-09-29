import { toComponentWrites, toIndexData } from '@modules/app-validation/export-reader';
import { componentKnownType, componentRules } from '@modules/app-validation/rules/component.rules';
import { runRules } from '@modules/app-validation/runner';
import { ComponentWrite, RuleContext } from '@modules/app-validation/types';
import { VersionIndex } from '@modules/app-validation/version-index';
import { templateAppVersions } from '../helpers/templates';

const ctx: RuleContext = { appVersionId: 'v1', source: 'pat', index: async () => VersionIndex.fromData({}) };

describe('component rules', () => {
  describe('component-known-type', () => {
    const write = (overrides: Partial<ComponentWrite> = {}): ComponentWrite => ({
      op: 'create',
      id: 'c1',
      data: { name: 'button1', type: 'Buttonn' },
      ...overrides,
    });

    it('rejects a type that is not a registered widget', () => {
      expect(componentKnownType.check(write(), ctx)).toEqual([
        expect.objectContaining({
          code: 'COMPONENT_UNKNOWN_TYPE',
          severity: 'critical',
          confidence: 'certain',
          path: 'button1.type',
        }),
      ]);
    });

    it('accepts registered widgets', () => {
      expect(componentKnownType.check(write({ data: { name: 'button1', type: 'Button' } }), ctx)).toEqual([]);
    });

    it('only checks an update when the update changes the type', () => {
      expect(componentKnownType.check(write({ op: 'update', touched: ['properties.text'] }), ctx)).toEqual([]);
      expect(componentKnownType.check(write({ op: 'update', touched: ['type'] }), ctx)).toHaveLength(1);
    });

    it('ignores deletes', () => {
      expect(componentKnownType.check(write({ op: 'delete' }), ctx)).toEqual([]);
    });
  });

  // Calibration: ToolJet ships these templates, so every component rule must accept them.
  it('accepts every component in ToolJet templates', async () => {
    const problems = [];
    for (const version of templateAppVersions()) {
      const versionCtx = {
        ...ctx,
        appVersionId: version.appVersionId,
        index: async () => VersionIndex.fromData(toIndexData(version)),
      };
      const result = await runRules(componentRules, toComponentWrites(version), versionCtx);
      problems.push(...result.errors, ...result.warnings);
    }
    expect(problems).toEqual([]);
  });
});
