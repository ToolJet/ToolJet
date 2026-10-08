import { isPlainObject } from 'lodash';
import {
  allowedOptionValues,
  isKnownComponentType,
  SECTION_TO_COLUMN,
  SETTING_SECTIONS,
  settingLabel,
  SettingSection,
  valueSchemaOf,
} from '../catalog';
import { ComponentWrite, Issue, Rule, RuleContext, Severity, WriteSource } from '../types';
import { findBrokenBraces, hasBraces, plainValueFit } from '../values';

// Matches the editor's rename validation (Inspector.jsx → validateQueryName): code references
// components as `components.<name>`, so names stay identifier-like. Imports are the main way
// spaced names get in today — the editor itself never allows them.
export const COMPONENT_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

// Sources that reproduce stored data: dangling references there are defects to report,
// not reasons to reject the whole app.
const BULK_SOURCES: ReadonlySet<WriteSource> = new Set(['import', 'git', 'copy', 'restore']);

function referenceSeverity(source: WriteSource): Severity {
  return BULK_SOURCES.has(source) ? 'medium' : 'high';
}

function labelOf(write: ComponentWrite): string {
  return write.data?.name ?? write.id;
}

// A section/key was changed by this write. Creates check everything the write carries.
function touchedSetting(write: ComponentWrite, section: SettingSection, key: string): boolean {
  if (write.op !== 'update' || !write.touched) return true;
  return write.touched.includes(`${section}.${key}`);
}

function sectionEntries(write: ComponentWrite, section: SettingSection): [string, unknown][] {
  const stored = write.data?.[SECTION_TO_COLUMN[section]];
  return isPlainObject(stored) ? Object.entries(stored) : [];
}

// Strips the `-<slot>` suffix (`-header`, `-tab1`, `-modal`, ...) the canvas appends to
// container parents. Mirrors ComponentsService.extractBaseParentId.
function baseParentId(parentId: string): string {
  const match = parentId.match(/([a-fA-F0-9-]{36})-(.+)/);
  return match ? match[1] : parentId;
}

// The call site must fill in `data.type`: partial MCP updates don't carry it.
export const componentKnownType: Rule<ComponentWrite> = {
  id: 'component-known-type',
  description: 'The component type is a registered widget',
  check(write) {
    if (write.op === 'delete' || !write.data?.type) return [];
    if (write.op === 'update' && !write.touched?.includes('type')) return [];
    if (isKnownComponentType(write.data.type)) return [];

    const name = write.data.name ?? write.id;
    return [
      {
        code: 'COMPONENT_UNKNOWN_TYPE',
        severity: 'critical',
        confidence: 'certain',
        path: `${name}.type`,
        message: `${name} → type: "${write.data.type}" is not a registered widget`,
        entity: { type: 'component', id: write.id, name: write.data.name },
        fix: 'Use one of the widget types from the component catalog, e.g. "Button" or "Table".',
      },
    ];
  },
};

export const componentNameFormat: Rule<ComponentWrite> = {
  id: 'component-name-format',
  description: 'The component name is a valid identifier',
  check(write) {
    if (write.op === 'delete' || write.data?.name === undefined) return [];
    if (write.op === 'update' && !write.touched?.includes('name')) return [];
    const name = write.data.name;
    if (typeof name === 'string' && COMPONENT_NAME_PATTERN.test(name)) return [];
    return [
      {
        code: 'COMPONENT_NAME_INVALID',
        severity: 'high',
        confidence: 'certain',
        path: `${name || write.id}.name`,
        message: `${name || write.id} → name: only letters, numbers, underscore and hyphen are allowed, got "${name}"`,
        entity: { type: 'component', id: write.id, name: typeof name === 'string' ? name : undefined },
        fix: 'Rename the component, e.g. "button1" — code refers to it as components.<name>.',
      },
    ];
  },
};

// Code resolves `components.<name>` per page, so a duplicate makes the reference ambiguous.
// Run inside the save transaction after lockForValidation(manager, 'component_name', versionId),
// with an index that includes the components created in the same request.
export const componentNameUnique: Rule<ComponentWrite> = {
  id: 'component-name-unique',
  description: 'The component name is unique on its page',
  async check(write, ctx: RuleContext) {
    if (write.op === 'delete' || !write.data?.name || !write.data.pageId) return [];
    if (write.op === 'update' && !write.touched?.includes('name')) return [];
    const index = await ctx.index();
    if (!index.isComponentNameTaken(write.data.pageId, write.data.name, [write.id])) return [];
    return [
      {
        code: 'COMPONENT_NAME_TAKEN',
        severity: 'high',
        confidence: 'certain',
        path: `${labelOf(write)}.name`,
        message: `${labelOf(write)} → name: another component on this page is already called "${write.data.name}"`,
        entity: { type: 'component', id: write.id, name: write.data.name },
      },
    ];
  },
};

// Settings are stored as `{ value, fxActive? }` wrappers. A bare value, a double wrap or a
// literal "undefined" key is the signature of a buggy generator, and the editor reads it back
// as an empty setting.
export const componentSettingsWellFormed: Rule<ComponentWrite> = {
  id: 'component-settings-well-formed',
  description: 'Component settings keep the { value } wrapper shape',
  check(write) {
    if (write.op === 'delete' || !write.data) return [];
    const issues: Issue[] = [];
    for (const section of SETTING_SECTIONS) {
      for (const [key, entry] of sectionEntries(write, section)) {
        if (!touchedSetting(write, section, key)) continue;
        const path = `${labelOf(write)}.${section}.${key}`;

        if (key === 'undefined') {
          issues.push({
            code: 'COMPONENT_SETTING_UNDEFINED_KEY',
            severity: 'high',
            confidence: 'certain',
            path,
            message: `${labelOf(write)} → ${section}: a setting is literally named "undefined", a generator wrote a missing key`,
            entity: { type: 'component', id: write.id, name: write.data.name },
            fix: 'Remove the "undefined" entry and write the intended setting name.',
          });
          continue;
        }

        if (isPlainObject(entry) && isPlainObject((entry as any).value) && 'value' in (entry as any).value) {
          issues.push({
            code: 'COMPONENT_SETTING_DOUBLE_WRAPPED',
            severity: 'high',
            confidence: 'certain',
            path: `${path}.value`,
            message: `${labelOf(write)} → ${settingLabel(write.data.type ?? '', section, key)}: the value is wrapped twice ({ value: { value: … } })`,
            entity: { type: 'component', id: write.id, name: write.data.name },
            fix: 'Send { value: <the value> } once.',
          });
        }
      }
    }
    return issues;
  },
};

// The §6.2 value rule: broken {{ }} code, dropdown-style settings outside their options, and
// loose plain-value type fit against the widget definition. Dynamic values are never
// type-checked; numbers-as-text are fine (ToolJet itself stores them).
export const componentValueTypes: Rule<ComponentWrite> = {
  id: 'component-value-types',
  description: 'Plain setting values match the widget definition',
  check(write, ctx) {
    const type = write.data?.type;
    if (write.op === 'delete' || !type || !isKnownComponentType(type)) return [];
    const issues: Issue[] = [];

    for (const section of SETTING_SECTIONS) {
      for (const [key, entry] of sectionEntries(write, section)) {
        if (!touchedSetting(write, section, key)) continue;
        if (!isPlainObject(entry) || !('value' in (entry as any))) continue;
        const value = (entry as any).value;
        const path = `${labelOf(write)}.${section}.${key}.value`;

        if (hasBraces(value)) {
          const broken = findBrokenBraces(value);
          if (broken) {
            issues.push({
              code: 'COMPONENT_BROKEN_CODE',
              // The editor saves while the user types, and bulk paths reproduce apps that
              // already live with the broken expression (one ships in ToolJet's own
              // templates) — only agents and the API get blocked.
              severity: ctx.source === 'ui' || BULK_SOURCES.has(ctx.source) ? 'medium' : 'high',
              confidence: 'certain',
              path,
              message: `${labelOf(write)} → ${settingLabel(type, section, key)}: the {{ }} code is not valid JavaScript${
                broken.unclosed ? ' ({{ is never closed)' : ''
              }`,
              entity: { type: 'component', id: write.id, name: write.data.name },
              fix: 'Fix the expression inside {{ }} — the app compiles it as `return <code>`.',
            });
          }
          continue; // dynamic values are never type-checked
        }

        const allowed = allowedOptionValues(type, section, key);
        if (allowed) {
          if (!allowed.includes(value) && value !== undefined && value !== null && value !== '') {
            issues.push({
              code: 'PROPERTY_ENUM_MISMATCH',
              severity: 'high',
              confidence: 'certain',
              path,
              message: `${labelOf(write)} → ${settingLabel(type, section, key)}: must be one of ${allowed
                .map((option) => JSON.stringify(option))
                .join(', ')}, got ${JSON.stringify(value)}`,
              entity: { type: 'component', id: write.id, name: write.data.name },
            });
          }
          continue;
        }

        const fit = plainValueFit(value, valueSchemaOf(type, section, key));
        if (fit !== 'ok') {
          issues.push({
            code: 'PROPERTY_TYPE_MISMATCH',
            // Structure mistakes (a list where a single value belongs) are safe to block;
            // scalar mismatches stay warnings until a customer-data scan proves them safe.
            severity: fit === 'structure-mismatch' ? 'high' : 'medium',
            confidence: fit === 'structure-mismatch' ? 'certain' : 'heuristic',
            path,
            message: `${labelOf(write)} → ${settingLabel(type, section, key)}: does not fit the expected ${
              valueSchemaOf(type, section, key)?.type
            }, got ${JSON.stringify(value)}`,
            entity: { type: 'component', id: write.id, name: write.data.name },
          });
        }
      }
    }
    return issues;
  },
};

// Settings every component stores without the widget declaring them.
// NOTE: an "unknown settings" warning rule was tried and dropped: ToolJet's own templates
// carry 200+ legacy keys from renames (`visible`→`visibility`, `clientSidePagination`, ...)
// that the app still reads, so the signal was pure noise.

// The save code only checks that a parent id exists somewhere in the database, so a typo'd
// or foreign parent orphans the component: it is saved but never rendered.
export const componentParentValid: Rule<ComponentWrite> = {
  id: 'component-parent-valid',
  description: 'The parent exists in this version, on the same page',
  async check(write, ctx: RuleContext) {
    if (write.op === 'delete' || !write.data?.parent) return [];
    if (write.op === 'update' && !write.touched?.includes('parent')) return [];
    const index = await ctx.index();
    const parent = index.component(baseParentId(write.data.parent));

    if (!parent) {
      return [
        {
          code: 'COMPONENT_PARENT_NOT_FOUND',
          severity: referenceSeverity(ctx.source),
          confidence: 'certain',
          path: `${labelOf(write)}.parent`,
          message: `${labelOf(write)} → parent: no component with id ${write.data.parent} exists in this app version, the component would never render`,
          entity: { type: 'component', id: write.id, name: write.data.name },
          fix: 'Use the id of a container on the same page, or null for the page canvas.',
        },
      ];
    }

    if (write.data.pageId && parent.pageId !== write.data.pageId) {
      return [
        {
          code: 'COMPONENT_PARENT_OTHER_PAGE',
          severity: referenceSeverity(ctx.source),
          confidence: 'certain',
          path: `${labelOf(write)}.parent`,
          message: `${labelOf(write)} → parent: ${parent.name || parent.id} lives on another page, the component would never render`,
          entity: { type: 'component', id: write.id, name: write.data.name },
        },
      ];
    }
    return [];
  },
};

// Today update and delete look rows up by id alone, so a caller who knows a foreign id can
// edit another app's components. Scoped to the version here.
export const componentInVersion: Rule<ComponentWrite> = {
  id: 'component-in-version',
  description: 'Updated or deleted components belong to this app version',
  async check(write, ctx: RuleContext) {
    if (write.op === 'create') return [];
    const index = await ctx.index();
    if (index.component(write.id)) return [];
    return [
      {
        code: 'COMPONENT_NOT_IN_VERSION',
        severity: 'high',
        confidence: 'certain',
        path: `${write.id}`,
        message: `${write.id}: no component with this id exists in this app version`,
        entity: { type: 'component', id: write.id },
        fix: 'Use the id of a component that belongs to the version being edited.',
      },
    ];
  },
};

// A module rendered by a ModuleViewer cannot itself contain a ModuleViewer.
export const componentNoModuleInModule: Rule<ComponentWrite> = {
  id: 'component-no-module-in-module',
  description: 'Modules cannot contain module viewers',
  check(write, ctx) {
    if (write.op === 'delete' || ctx.appType !== 'module' || write.data?.type !== 'ModuleViewer') return [];
    if (write.op === 'update' && !write.touched?.includes('type')) return [];
    return [
      {
        code: 'COMPONENT_MODULE_IN_MODULE',
        severity: 'high',
        confidence: 'certain',
        path: `${labelOf(write)}.type`,
        message: `${labelOf(write)} → type: a module cannot contain another module`,
        entity: { type: 'component', id: write.id, name: write.data?.name },
      },
    ];
  },
};

// The ModuleContainer is the module's canvas: without it the module cannot render at all.
export const componentModuleContainerUndeletable: Rule<ComponentWrite> = {
  id: 'component-module-container-undeletable',
  description: 'The module container cannot be deleted',
  async check(write, ctx: RuleContext) {
    if (write.op !== 'delete') return [];
    const index = await ctx.index();
    if (index.component(write.id)?.type !== 'ModuleContainer') return [];
    return [
      {
        code: 'COMPONENT_MODULE_CONTAINER_DELETE',
        severity: 'high',
        confidence: 'certain',
        path: `${write.id}`,
        message: `${write.id}: the ModuleContainer is the module's canvas and cannot be deleted`,
        entity: { type: 'component', id: write.id },
      },
    ];
  },
};

export const componentRules: Rule<ComponentWrite>[] = [
  componentKnownType,
  componentNameFormat,
  componentNameUnique,
  componentSettingsWellFormed,
  componentValueTypes,
  componentParentValid,
  componentInVersion,
  componentNoModuleInModule,
  componentModuleContainerUndeletable,
];
