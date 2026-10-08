import { toIndexData, toLayoutWrites } from '@modules/app-validation/export-reader';
import {
  layoutComponentInVersion,
  layoutNumbersValid,
  layoutRules,
  layoutTypeKnown,
} from '@modules/app-validation/rules/layout.rules';
import { runRules } from '@modules/app-validation/runner';
import { LayoutWrite, RuleContext } from '@modules/app-validation/types';
import { VersionIndex } from '@modules/app-validation/version-index';
import { templateAppVersions } from '../helpers/templates';

const index = VersionIndex.fromData({
  components: [{ id: 'c1', name: 'button1', type: 'Button', parent: null, pageId: 'p1' }],
});
const ctx: RuleContext = { appVersionId: 'v1', source: 'pat', index: async () => index };

const write = (overrides: Partial<LayoutWrite> = {}): LayoutWrite => ({
  op: 'update',
  id: 'c1',
  data: { componentId: 'c1', type: 'desktop', top: 10, left: 2, width: 10, height: 40 },
  touched: ['top', 'left', 'width', 'height'],
  ...overrides,
});

describe('layout rules', () => {
  describe('layout-type-known', () => {
    it('rejects a layout type that is not desktop or mobile', () => {
      expect(layoutTypeKnown.check(write({ data: { componentId: 'c1', type: 'tablet' } }), ctx)).toEqual([
        expect.objectContaining({ code: 'LAYOUT_UNKNOWN_TYPE', severity: 'critical', confidence: 'certain' }),
      ]);
    });

    it('accepts desktop and mobile', () => {
      expect(layoutTypeKnown.check(write(), ctx)).toEqual([]);
      expect(layoutTypeKnown.check(write({ data: { componentId: 'c1', type: 'mobile' } }), ctx)).toEqual([]);
    });
  });

  describe('layout-numbers-valid', () => {
    it('rejects NaN and non-numeric dimensions, which Postgres would store silently', () => {
      const issues = layoutNumbersValid.check(
        write({ data: { componentId: 'c1', type: 'desktop', top: NaN, width: 'wide' }, touched: ['top', 'width'] }),
        ctx
      );
      expect(issues).toEqual([
        expect.objectContaining({ code: 'LAYOUT_VALUE_NOT_NUMBER', path: 'c1.layouts.desktop.top' }),
        expect.objectContaining({ code: 'LAYOUT_VALUE_NOT_NUMBER', path: 'c1.layouts.desktop.width' }),
      ]);
    });

    it('warns on negative sizes and off-canvas offsets, which ToolJet templates themselves contain', () => {
      const issues = layoutNumbersValid.check(
        write({ data: { componentId: 'c1', type: 'desktop', width: -4, top: -20 }, touched: ['width', 'top'] }),
        ctx
      );
      expect(issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: 'LAYOUT_NEGATIVE_SIZE', severity: 'medium', confidence: 'heuristic' }),
          expect.objectContaining({ code: 'LAYOUT_OFFSCREEN_POSITION', severity: 'medium', confidence: 'heuristic' }),
        ])
      );
    });

    it('accepts the editor\u2019s own sub-grid floats and numeric strings from old exports', () => {
      expect(
        layoutNumbersValid.check(
          write({
            data: { componentId: 'c1', type: 'desktop', left: 2.3255813953488373, top: '20' },
            touched: ['left', 'top'],
          }),
          ctx
        )
      ).toEqual([]);
    });

    it('only checks the fields the update touches', () => {
      expect(
        layoutNumbersValid.check(
          write({ data: { componentId: 'c1', type: 'desktop', top: NaN }, touched: ['left'] }),
          ctx
        )
      ).toEqual([]);
    });
  });

  describe('layout-component-in-version', () => {
    it('rejects a layout for a component of another app version', async () => {
      expect(
        await layoutComponentInVersion.check(write({ id: 'foreign', data: { componentId: 'foreign' } }), ctx)
      ).toEqual([
        expect.objectContaining({ code: 'LAYOUT_COMPONENT_NOT_FOUND', severity: 'high', confidence: 'certain' }),
      ]);
    });

    it('accepts components of this version', async () => {
      expect(await layoutComponentInVersion.check(write(), ctx)).toEqual([]);
    });
  });

  // Calibration: ToolJet ships these templates, so no layout rule may block their import.
  // Templates genuinely contain negative divider heights and overlap tops, so those two
  // heuristic warnings are expected; anything else firing is a rule bug.
  it('finds no blocking problem in any ToolJet template', async () => {
    const errors = [];
    const unexpectedWarnings = [];
    for (const version of templateAppVersions()) {
      const versionCtx: RuleContext = {
        appVersionId: version.appVersionId,
        source: 'import',
        index: async () => VersionIndex.fromData(toIndexData(version)),
      };
      const result = await runRules(layoutRules, toLayoutWrites(version), versionCtx);
      errors.push(...result.errors);
      unexpectedWarnings.push(
        ...result.warnings.filter((w) => !['LAYOUT_NEGATIVE_SIZE', 'LAYOUT_OFFSCREEN_POSITION'].includes(w.code))
      );
    }
    expect(errors).toEqual([]);
    expect(unexpectedWarnings).toEqual([]);
  });
});
