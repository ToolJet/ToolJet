import { toComponentWrites, toIndexData } from '@modules/app-validation/export-reader';
import {
  componentInVersion,
  componentKnownType,
  componentModuleContainerUndeletable,
  componentNameFormat,
  componentNameUnique,
  componentNoModuleInModule,
  componentParentValid,
  componentRules,
  componentSettingsWellFormed,
  componentValueTypes,
} from '@modules/app-validation/rules/component.rules';
import { runRules } from '@modules/app-validation/runner';
import { ComponentWrite, RuleContext } from '@modules/app-validation/types';
import { VersionIndex } from '@modules/app-validation/version-index';
import { templateAppVersions } from '../helpers/templates';

const ctx: RuleContext = { appVersionId: 'v1', source: 'pat', index: async () => VersionIndex.fromData({}) };

const CONTAINER_ID = '0b1a2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';

const populatedIndex = VersionIndex.fromData({
  components: [
    { id: 'c1', name: 'button1', type: 'Button', parent: null, pageId: 'p1' },
    { id: CONTAINER_ID, name: 'container1', type: 'Container', parent: null, pageId: 'p1' },
    { id: 'c3', name: 'text1', type: 'Text', parent: null, pageId: 'p2' },
    { id: 'mc1', name: 'module container', type: 'ModuleContainer', parent: null, pageId: 'p1' },
  ],
  pages: [
    { id: 'p1', name: 'Home', handle: 'home' },
    { id: 'p2', name: 'Other', handle: 'other' },
  ],
});
const populatedCtx: RuleContext = { ...ctx, index: async () => populatedIndex };

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

  describe('component-name-format', () => {
    const write = (name: unknown, overrides: Partial<ComponentWrite> = {}): ComponentWrite => ({
      op: 'create',
      id: 'c1',
      data: { name: name as string, type: 'Button' },
      ...overrides,
    });

    it('rejects names with spaces, which imports can carry but the editor never creates', () => {
      expect(componentNameFormat.check(write('button 1'), ctx)).toEqual([
        expect.objectContaining({
          code: 'COMPONENT_NAME_INVALID',
          severity: 'high',
          confidence: 'certain',
          path: 'button 1.name',
        }),
      ]);
    });

    it('rejects empty and non-string names', () => {
      expect(componentNameFormat.check(write(''), ctx)).toHaveLength(1);
      expect(componentNameFormat.check(write(42), ctx)).toHaveLength(1);
    });

    it('accepts identifier-like names, matching the editor rename rule', () => {
      expect(componentNameFormat.check(write('button1'), ctx)).toEqual([]);
      expect(componentNameFormat.check(write('my_button-2'), ctx)).toEqual([]);
    });

    it('only checks an update when the update changes the name, so old apps stay editable', () => {
      expect(componentNameFormat.check(write('button 1', { op: 'update', touched: ['properties.text'] }), ctx)).toEqual(
        []
      );
      expect(componentNameFormat.check(write('button 1', { op: 'update', touched: ['name'] }), ctx)).toHaveLength(1);
    });

    it('skips writes that do not carry a name', () => {
      expect(componentNameFormat.check(write(undefined), ctx)).toEqual([]);
    });
  });

  describe('component-name-unique', () => {
    const write = (name: string, overrides: Partial<ComponentWrite> = {}): ComponentWrite => ({
      op: 'create',
      id: 'new',
      data: { name, type: 'Button', pageId: 'p1' },
      ...overrides,
    });

    it('rejects a name another component on the page already uses', async () => {
      expect(await componentNameUnique.check(write('button1'), populatedCtx)).toEqual([
        expect.objectContaining({ code: 'COMPONENT_NAME_TAKEN', severity: 'high', confidence: 'certain' }),
      ]);
    });

    it('scopes uniqueness to the page and lets a rename keep its own name', async () => {
      expect(await componentNameUnique.check(write('text1'), populatedCtx)).toEqual([]); // text1 lives on p2
      expect(
        await componentNameUnique.check(write('button1', { op: 'update', id: 'c1', touched: ['name'] }), populatedCtx)
      ).toEqual([]);
    });
  });

  describe('component-settings-well-formed', () => {
    it('rejects a literal "undefined" key and a double-wrapped value', () => {
      const issues = componentSettingsWellFormed.check(
        {
          op: 'create',
          id: 'c1',
          data: {
            name: 'button1',
            type: 'Button',
            properties: { undefined: { value: 'x' }, text: { value: { value: 'Click' } } },
          },
        },
        ctx
      );
      expect(issues).toEqual([
        expect.objectContaining({ code: 'COMPONENT_SETTING_UNDEFINED_KEY', severity: 'high' }),
        expect.objectContaining({ code: 'COMPONENT_SETTING_DOUBLE_WRAPPED', severity: 'high' }),
      ]);
    });

    it('accepts the { value, fxActive } wrapper shape', () => {
      expect(
        componentSettingsWellFormed.check(
          {
            op: 'create',
            id: 'c1',
            data: { name: 'b', type: 'Button', properties: { text: { value: 'Click', fxActive: false } } },
          },
          ctx
        )
      ).toEqual([]);
    });
  });

  describe('component-value-types', () => {
    const write = (properties: Record<string, any>, overrides: Partial<ComponentWrite> = {}): ComponentWrite => ({
      op: 'create',
      id: 'c1',
      data: { name: 'button1', type: 'Button', properties },
      ...overrides,
    });

    it('rejects broken {{ }} code for agents, and only warns in the editor', () => {
      const broken = write({ text: { value: '{{queries.q1.data' } });
      expect(componentValueTypes.check(broken, ctx)).toEqual([
        expect.objectContaining({ code: 'COMPONENT_BROKEN_CODE', severity: 'high', confidence: 'certain' }),
      ]);
      expect(componentValueTypes.check(broken, { ...ctx, source: 'ui' })).toEqual([
        expect.objectContaining({ code: 'COMPONENT_BROKEN_CODE', severity: 'medium' }),
      ]);
    });

    it('never type-checks well-formed dynamic values', () => {
      expect(componentValueTypes.check(write({ loadingState: { value: '{{queries.q1.isLoading}}' } }), ctx)).toEqual(
        []
      );
    });

    it('rejects a value outside a dropdown-style setting\u2019s options', () => {
      const styled: ComponentWrite = {
        op: 'create',
        id: 'c1',
        data: { name: 'button1', type: 'Button', styles: { type: { value: 'ghost' } } },
      };
      expect(componentValueTypes.check(styled, ctx)).toEqual([
        expect.objectContaining({ code: 'PROPERTY_ENUM_MISMATCH', severity: 'high', confidence: 'certain' }),
      ]);
    });

    it('blocks structure mismatches but only warns on scalar ones, like ToolJet\u2019s own numbers-as-text', () => {
      const table = (value: unknown): ComponentWrite => ({
        op: 'create',
        id: 't1',
        data: { name: 'table1', type: 'Table', properties: { rowsPerPage: { value } } },
      });
      expect(componentValueTypes.check(table('10'), ctx)).toEqual([]);
      expect(componentValueTypes.check(table(['ten']), ctx)).toEqual([
        expect.objectContaining({ code: 'PROPERTY_TYPE_MISMATCH', severity: 'high', confidence: 'certain' }),
      ]);
      expect(componentValueTypes.check(table('ten'), ctx)).toEqual([
        expect.objectContaining({ code: 'PROPERTY_TYPE_MISMATCH', severity: 'medium', confidence: 'heuristic' }),
      ]);
    });

    it('only checks the settings an update touches', () => {
      const update = write({ text: { value: '{{broken' } }, { op: 'update', touched: ['properties.label'] });
      expect(componentValueTypes.check(update, ctx)).toEqual([]);
    });
  });

  describe('component-parent-valid', () => {
    const write = (parent: string, pageId = 'p1'): ComponentWrite => ({
      op: 'create',
      id: 'new',
      data: { name: 'child1', type: 'Button', pageId, parent },
    });

    it('rejects a parent that does not exist in this version', async () => {
      expect(await componentParentValid.check(write('missing-parent'), populatedCtx)).toEqual([
        expect.objectContaining({ code: 'COMPONENT_PARENT_NOT_FOUND', severity: 'high', confidence: 'certain' }),
      ]);
    });

    it('reports instead of blocking when bulk data reproduces an orphan', async () => {
      expect(await componentParentValid.check(write('missing-parent'), { ...populatedCtx, source: 'import' })).toEqual([
        expect.objectContaining({ code: 'COMPONENT_PARENT_NOT_FOUND', severity: 'medium' }),
      ]);
    });

    it('rejects a parent on another page', async () => {
      expect(await componentParentValid.check(write('c3'), populatedCtx)).toEqual([
        expect.objectContaining({ code: 'COMPONENT_PARENT_OTHER_PAGE' }),
      ]);
    });

    it('resolves slot suffixes the canvas appends to container parents', async () => {
      expect(await componentParentValid.check(write(`${CONTAINER_ID}-header`), populatedCtx)).toEqual([]);
      expect(await componentParentValid.check(write(CONTAINER_ID), populatedCtx)).toEqual([]);
    });
  });

  describe('component-in-version', () => {
    it('rejects updating or deleting a component of another app version', async () => {
      expect(await componentInVersion.check({ op: 'update', id: 'foreign', data: {} }, populatedCtx)).toEqual([
        expect.objectContaining({ code: 'COMPONENT_NOT_IN_VERSION', severity: 'high', confidence: 'certain' }),
      ]);
      expect(await componentInVersion.check({ op: 'delete', id: 'foreign' }, populatedCtx)).toHaveLength(1);
    });

    it('accepts components of this version and all creates', async () => {
      expect(await componentInVersion.check({ op: 'update', id: 'c1', data: {} }, populatedCtx)).toEqual([]);
      expect(await componentInVersion.check({ op: 'create', id: 'anything', data: {} }, populatedCtx)).toEqual([]);
    });
  });

  describe('module rules', () => {
    it('rejects a ModuleViewer inside a module', () => {
      const moduleCtx = { ...ctx, appType: 'module' };
      expect(
        componentNoModuleInModule.check(
          { op: 'create', id: 'c1', data: { name: 'viewer1', type: 'ModuleViewer' } },
          moduleCtx
        )
      ).toEqual([expect.objectContaining({ code: 'COMPONENT_MODULE_IN_MODULE', severity: 'high' })]);
      expect(
        componentNoModuleInModule.check(
          { op: 'create', id: 'c1', data: { name: 'viewer1', type: 'ModuleViewer' } },
          ctx
        )
      ).toEqual([]);
    });

    it('rejects deleting the ModuleContainer, the module\u2019s canvas', async () => {
      expect(await componentModuleContainerUndeletable.check({ op: 'delete', id: 'mc1' }, populatedCtx)).toEqual([
        expect.objectContaining({ code: 'COMPONENT_MODULE_CONTAINER_DELETE', severity: 'high' }),
      ]);
      expect(await componentModuleContainerUndeletable.check({ op: 'delete', id: 'c1' }, populatedCtx)).toEqual([]);
    });
  });

  // Calibration: ToolJet ships these templates, so no component rule may block their import.
  // Known template defects stay warnings there: one broken expression (url-splitter-and-parser
  // references a query by raw UUID) and 35 orphaned components whose parent was deleted before
  // export. Anything else firing is a rule bug.
  it('finds no blocking problem in any ToolJet template', async () => {
    const errors = [];
    const unexpectedWarnings = [];
    for (const version of templateAppVersions()) {
      const versionCtx: RuleContext = {
        appVersionId: version.appVersionId,
        appType: version.appType,
        source: 'import',
        index: async () => VersionIndex.fromData(toIndexData(version)),
      };
      const result = await runRules(componentRules, toComponentWrites(version), versionCtx);
      errors.push(...result.errors);
      unexpectedWarnings.push(
        ...result.warnings.filter((w) => !['COMPONENT_BROKEN_CODE', 'COMPONENT_PARENT_NOT_FOUND'].includes(w.code))
      );
    }
    expect(errors).toEqual([]);
    expect(unexpectedWarnings).toEqual([]);
  });
});
