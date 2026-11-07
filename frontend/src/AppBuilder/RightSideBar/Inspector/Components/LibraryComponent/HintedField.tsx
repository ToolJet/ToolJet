import React from 'react';

import FxButton from '@/AppBuilder/CodeBuilder/Elements/FxButton';
import { ToolTip } from '@/AppBuilder/RightSideBar/Inspector/Elements/Components/ToolTip';
import { renderElement } from '@/AppBuilder/RightSideBar/Inspector/Utils';
import useStore from '@/AppBuilder/_stores/store';
import type { ManifestProp } from '@/AppBuilder/types/libraryComponent.types';

import { ColumnsEditor } from './ColumnsEditor';
import { IconPicker } from './fields';
import { readLiteralCode, writeLiteralCode } from './literal';
import { OptionsEditor } from './OptionsEditor';
import type { InspectorComponent, LibraryEditorHint, ParamUpdated } from './types';
import { fieldMeta } from './utils';

const ToolTipComponent = ToolTip as React.ComponentType<any>;
const FxButtonComponent = FxButton as React.ComponentType<any>;

const resolveLive = (value: unknown): unknown =>
  (useStore.getState() as { getResolvedValue: (v: unknown) => unknown }).getResolvedValue(value);

/** Whether a stored value can be drawn by the hint's editor (else the field stays in code). */
const editableBy = (hint: LibraryEditorHint, value: unknown): boolean =>
  value === undefined || (hint === 'icon' ? typeof value === 'string' : Array.isArray(value));

export interface HintedFieldProps {
  hint: LibraryEditorHint;
  prop: ManifestProp;
  component: InspectorComponent;
  componentMeta: Record<string, unknown>;
  paramUpdated: ParamUpdated;
  dataQueries: unknown;
  currentState: unknown;
  allComponents: Record<string, unknown>;
  darkMode: boolean;
}

/**
 * A manifest prop drawn by a purpose-built editor its `inspector` hint names (columns, options, icon), with the fx
 * button switching it to the code field, like UI 2.0's options field. The editor reads the field's stored code, never
 * its resolved value, so a binding ({{queries.x.data}}) is never overwritten: such a field stays in code. Every edit
 * writes the whole value back into the same definition value the code field holds.
 */
export const HintedField = ({
  hint,
  prop,
  component,
  componentMeta,
  paramUpdated,
  dataQueries,
  currentState,
  allComponents,
  darkMode,
}: HintedFieldProps) => {
  const properties = component?.component?.definition?.properties ?? {};
  const definition = (properties[prop.name] ?? {}) as { value?: unknown; fxActive?: boolean };
  const read = readLiteralCode(definition.value);
  const editable = read.ok && editableBy(hint, read.value);
  const codeMode = definition.fxActive === true || !editable;
  const meta = fieldMeta(prop);
  const label = meta.displayName ?? prop.name;
  const cyLabel = prop.name.toLowerCase();
  const param = { name: prop.name, ...((component?.component as any)?.properties?.[prop.name] ?? {}) };

  const write = (value: unknown) =>
    paramUpdated(param, 'value', hint === 'icon' ? (value ?? '') : writeLiteralCode(value), 'properties');

  const editor = () => {
    switch (hint) {
      case 'options':
        return (
          <OptionsEditor
            value={(read.value as unknown[]) ?? []}
            onChange={write}
            darkMode={darkMode}
            cyLabel={cyLabel}
          />
        );
      case 'columns':
        return (
          <ColumnsEditor
            value={(read.value as unknown[]) ?? []}
            onChange={write}
            data={resolveLive(properties.data?.value)}
            darkMode={darkMode}
            cyLabel={cyLabel}
          />
        );
      case 'icon':
        return <IconPicker value={read.value} onChange={write} darkMode={darkMode} cy={cyLabel} />;
    }
  };

  return (
    <div className="field tw-mb-2 last:tw-mb-0" data-cy={`${cyLabel}-hinted-field`}>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <ToolTipComponent label={label} meta={meta} labelClass="tj-text-xsm color-slate12 mb-0" />
        <div
          title={
            editable
              ? undefined
              : 'This value is code (a binding or an expression), so it is edited as code. Clear it to use the editor.'
          }
        >
          <FxButtonComponent
            active={codeMode}
            dataCy={cyLabel}
            onPress={() => {
              if (codeMode && !editable) return;
              paramUpdated(param, 'fxActive', !codeMode, 'properties');
            }}
          />
        </div>
      </div>
      {codeMode
        ? renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            prop.name,
            'properties',
            currentState,
            allComponents,
            darkMode,
            prop.placeholder ?? '',
            undefined,
            null,
            { ...meta, type: 'code', showLabel: false } as any
          )
        : editor()}
    </div>
  );
};
