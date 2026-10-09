import React from 'react';
import { Code } from './Elements/Code';
import { QuerySelector } from './QuerySelector';
import { convertToKebabCase } from '@/_helpers/utils';
import { LabeledDivider } from './Components/Form/_components';
import { getPrivateRoute, getSubpath } from '@/_helpers/routes';
import useStore from '@/AppBuilder/_stores/store';

// Resolves against the live zustand store instead of the (stale/unsynced)
// legacy `currentState`, so a conditionallyRender driver bound to another
// component's value (e.g. `{{components.toggle1.value}}`) resolves correctly.
function resolveLiveValue(propertyDefinition) {
  if (!propertyDefinition) return propertyDefinition;
  return { value: useStore.getState().getResolvedValue(propertyDefinition.value) };
}

export function renderQuerySelector(component, dataQueries, eventOptionUpdated, eventName, eventMeta) {
  let definition = component.component.definition.events[eventName];
  definition = definition || {};

  return (
    <QuerySelector
      param={{ name: eventName }}
      definition={definition}
      eventMeta={eventMeta}
      dataQueries={dataQueries}
      eventOptionUpdated={eventOptionUpdated}
    />
  );
}
export function renderCustomStyles(
  component,
  componentMeta,
  paramUpdated,
  dataQueries,
  param,
  paramType,
  currentState,
  components = {},
  accordian,
  darkMode = false,
  placeholder = '',
  customMeta
) {
  const componentConfig = component.component;
  const componentDefinition = componentConfig.definition;
  const paramTypeDefinition = componentDefinition[paramType] || {};
  const definition = paramTypeDefinition[param] || {};
  const meta = customMeta ?? componentMeta[paramType]?.[accordian]?.[param];

  if (
    componentConfig.component == 'DropDown' ||
    componentConfig.component == 'Form' ||
    componentConfig.component == 'Listview' ||
    componentConfig.component == 'TextInput' ||
    componentConfig.component == 'NumberInput' ||
    componentConfig.component == 'PasswordInput' ||
    componentConfig.component == 'EmailInput' ||
    componentConfig.component == 'PhoneInput' ||
    componentConfig.component == 'CurrencyInput' ||
    componentConfig.component == 'ToggleSwitchV2' ||
    componentConfig.component == 'Checkbox' ||
    componentConfig.component == 'Table' ||
    componentConfig.component == 'DropdownV2' ||
    componentConfig.component == 'MultiselectV2' ||
    componentConfig.component == 'Cascader' ||
    componentConfig.component == 'RadioButtonV2' ||
    componentConfig.component == 'TagsInput' ||
    componentConfig.component == 'Button' ||
    componentConfig.component == 'ButtonGroupV2' ||
    componentConfig.component == 'Image' ||
    componentConfig.component == 'ModalV2' ||
    componentConfig.component == 'RangeSlider' ||
    componentConfig.component == 'DatetimePickerV2' ||
    componentConfig.component == 'RangeSliderV2' ||
    componentConfig.component == 'DatePickerV2' ||
    componentConfig.component == 'TextArea' ||
    componentConfig.component == 'Timepicker' ||
    componentConfig.component == 'PhoneInput' ||
    componentConfig.component == 'CurrencyInput' ||
    componentConfig.component == 'DaterangePicker' ||
    componentConfig.component == 'StarRating' ||
    componentConfig.component == 'PopoverMenu' ||
    componentConfig.component == 'ReorderableList' ||
    componentConfig.component == 'KeyValuePair' ||
    componentConfig.component == 'ProgressBar' ||
    componentConfig.component == 'TreeSelect' ||
    componentConfig.component == 'FilePicker' ||
    componentConfig.component == 'FileInput' ||
    componentConfig.component == 'FileButton' ||
    componentConfig.component == 'ColorPicker'
  ) {
    const paramTypeConfig = componentMeta[paramType] || {};
    const paramConfig = paramTypeConfig[param] || {};
    const { conditionallyRender = null } = paramConfig;

    const getResolvedValue = (key, parentObjectKey = 'styles') => {
      if (componentConfig.component == 'PopoverMenu' && key == 'buttonType') {
        return resolveLiveValue(componentDefinition?.properties?.buttonType);
      }
      const value = paramTypeDefinition?.[key] || componentDefinition?.[parentObjectKey]?.[key];
      return resolveLiveValue(value);
    };

    const utilFuncForMultipleChecks = (conditionallyRender) => {
      return conditionallyRender.reduce((acc, condition) => {
        const { key, value, parentObjectKey } = condition;
        if ((paramTypeDefinition?.[key] || componentDefinition?.[parentObjectKey]?.[key]) ?? value) {
          const resolvedValue = getResolvedValue(key, parentObjectKey);
          acc.push(resolvedValue?.value !== value);
        }
        return acc;
      }, []);
    };

    if (conditionallyRender) {
      const isConditionallyRenderArray = Array.isArray(conditionallyRender);

      if (isConditionallyRenderArray && utilFuncForMultipleChecks(conditionallyRender).includes(true)) {
        return;
      } else {
        const { key, value } = conditionallyRender;
        if (paramTypeDefinition?.[key] ?? value) {
          const resolvedValue = getResolvedValue(key);
          if (resolvedValue?.value !== value) {
            return;
          }
        }
      }
    }
  }

  return (
    <>
      <Code
        param={{ name: param, ...component.component.properties?.[param] }}
        definition={definition}
        dataQueries={dataQueries}
        onChange={paramUpdated}
        paramType={paramType}
        components={components}
        componentMeta={componentMeta}
        darkMode={darkMode}
        componentName={component.component.name || null}
        type={meta?.type}
        fxActive={definition.fxActive ?? false}
        onFxPress={(active) => {
          paramUpdated({ name: param, ...component.component.properties[param] }, 'fxActive', active, paramType);
        }}
        component={component}
        accordian={accordian}
        placeholder={placeholder}
        customMeta={customMeta}
      />
    </>
  );
}

export function renderElement(
  component,
  componentMeta,
  paramUpdated,
  dataQueries,
  param,
  paramType,
  currentState,
  components = {},
  darkMode = false,
  placeholder = '',
  validationFn,
  setCodeEditorView = null,
  customMeta = null
) {
  const componentConfig = component.component;
  const componentDefinition = componentConfig.definition;
  const paramTypeDefinition = componentDefinition[paramType] || {};
  const definition = paramTypeDefinition[param] || {};
  const meta = componentMeta[paramType][param];
  const isHidden = component.component.properties[param]?.isHidden ?? false;

  if (
    componentConfig.component == 'DropDown' ||
    componentConfig.component == 'DropdownV2' ||
    componentConfig.component == 'MultiselectV2' ||
    componentConfig.component == 'TagsInput' ||
    componentConfig.component == 'Form' ||
    componentConfig.component == 'Listview' ||
    componentConfig.component == 'Image' ||
    componentConfig.component == 'RangeSliderV2' ||
    componentConfig.component == 'Statistics' ||
    componentConfig.component == 'Table' ||
    componentConfig.component == 'CircularProgressBar' ||
    componentConfig.component == 'KeyValuePair' ||
    componentConfig.component == 'ProgressBar' ||
    componentConfig.component == 'ButtonGroupV2' ||
    componentConfig.component == 'FilePicker' ||
    componentConfig.component == 'FileInput' ||
    componentConfig.component == 'FileButton' ||
    componentConfig.component == 'Tabs'
  ) {
    const paramTypeConfig = componentMeta[paramType] || {};
    const paramConfig = paramTypeConfig[param] || {};
    const { conditionallyRender = null } = paramConfig;

    const getResolvedValue = (key, parentObjectKey = paramType) => {
      const value = paramTypeDefinition?.[key] || componentDefinition?.[parentObjectKey]?.[key];
      return resolveLiveValue(value);
    };

    const utilFuncForMultipleChecks = (conditionallyRender) => {
      return conditionallyRender.reduce((acc, condition) => {
        const { key, value, parentObjectKey } = condition;
        if ((paramTypeDefinition?.[key] || componentDefinition?.[parentObjectKey]?.[key]) ?? value) {
          const resolvedValue = getResolvedValue(key, parentObjectKey);
          acc.push(resolvedValue?.value !== value);
        }
        return acc;
      }, []);
    };

    if (conditionallyRender) {
      const isConditionallyRenderArray = Array.isArray(conditionallyRender);

      if (isConditionallyRenderArray && utilFuncForMultipleChecks(conditionallyRender).includes(true)) {
        return;
      } else if (!isConditionallyRenderArray) {
        const { key, value, parentObjectKey } = conditionallyRender;
        if ((paramTypeDefinition?.[key] || componentDefinition?.[parentObjectKey]?.[key]) ?? value) {
          const resolvedValue = getResolvedValue(key, parentObjectKey);
          if (Array.isArray(value) ? !value.includes(resolvedValue?.value) : resolvedValue?.value !== value) {
            return;
          }
        }
      }
    }
  }

  if (meta?.type === 'sectionSubHeader') {
    return <LabeledDivider label={meta.displayName} />;
  }

  return (
    <Code
      param={{ name: param, ...component.component.properties?.[param] }}
      definition={definition}
      dataQueries={dataQueries}
      onChange={paramUpdated}
      paramType={paramType}
      components={components}
      componentMeta={componentMeta}
      darkMode={darkMode}
      componentName={component.component.name || null}
      type={meta?.type}
      fxActive={definition.fxActive ?? false}
      onFxPress={(active) => {
        paramUpdated({ name: param, ...component.component.properties[param] }, 'fxActive', active, paramType);
      }}
      component={component}
      placeholder={placeholder}
      validationFn={validationFn}
      isHidden={isHidden}
      setCodeEditorView={setCodeEditorView}
      customMeta={customMeta}
    />
  );
}

// Radix/Base UI popovers, selects and comboboxes portal their content into `document.body`, outside
// the DOM subtree of the react-bootstrap `Overlay` (`rootClose`) wrapping `NavItemPopover`. `rootClose`
// only checks DOM containment, so it wrongly treats a click inside one of these portals as "outside".
const PORTALED_OVERLAY_SELECTOR = [
  '[data-radix-popper-content-wrapper]', // Radix Popover/Select content
  '[data-slot="combobox-content"]', // Base UI Combobox content
  '.cm-tooltip-autocomplete', // CodeMirror autocomplete list
  '#codehinter-preview-box-popover', // CodeHinter's own preview/error popover, portaled to document.body
].join(', ');

// Radix Select can also make a click's real target unresolvable: it briefly disables page-wide
// pointer-events while open, and unmounts the clicked option on `pointerup` (before `click` fires)
// when selecting a value. Either way the browser falls back to `<html>` as the target. Treat that as
// noise from a closing Radix layer, not a genuine "click outside".
const isUnresolvedClickTarget = (target) => typeof document !== 'undefined' && target === document.documentElement;

export const isClickInsidePortaledOverlay = (target) =>
  isUnresolvedClickTarget(target) || !!target?.closest?.(PORTALED_OVERLAY_SELECTOR);

// Shared with validateStaticId's own trimmed comparison — a static id is always stored trimmed.
export const trimStaticId = (value) => (typeof value === 'string' ? value.trim() : value);

// Validate a candidate static id (Tabs' tab id, Nav item id, etc). Ids are compared with
// plain equality everywhere at runtime (never resolved), so a `{{ }}` binding can never work
// as an id and must be rejected outright rather than accepted and silently broken.
export const validateStaticId = (value, existingIds = [], currentId = null, messages = {}) => {
  const {
    emptyMessage = 'ID cannot be empty',
    bindingMessage = 'ID cannot contain a dynamic binding ({{ }}). Use a plain, static value.',
    duplicateMessage = 'ID must be unique. This ID is already used by another item.',
  } = messages;

  if (value === null || value === undefined || String(value).trim() === '') {
    return [false, emptyMessage];
  }
  const trimmedValue = String(value).trim();

  if (trimmedValue.includes('{{') || trimmedValue.includes('}}')) {
    return [false, bindingMessage];
  }

  if (existingIds.some((id) => id === trimmedValue && id !== currentId)) {
    return [false, duplicateMessage];
  }

  return [true, null];
};

export const getDocsLink = (componentType = '') => {
  switch (componentType) {
    case 'ToggleSwitchV2':
      return 'https://docs.tooljet.io/docs/widgets/toggle-switch';
    case 'DropdownV2':
      return 'https://docs.tooljet.com/docs/widgets/dropdown';
    case 'DropDown':
      return 'https://docs.tooljet.com/docs/widgets/dropdown';
    case 'MultiselectV2':
      return 'https://docs.tooljet.com/docs/widgets/multiselect';
    case 'DaterangePicker':
      return 'https://docs.tooljet.com/docs/widgets/date-range-picker';
    case 'RangeSliderV2':
      return 'https://docs.tooljet.com/docs/widgets/range-slider';
    case 'ModuleViewer':
    case 'ModuleContainer':
      return 'https://docs.tooljet.com/docs/app-builder/modules/overview';
    default:
      return `https://docs.tooljet.io/docs/widgets/${convertToKebabCase(componentType)}`;
  }
};

export const goToModule = (moduleAppId) => {
  const subpath = getSubpath();
  const slug =
    moduleAppId === undefined || moduleAppId === null || `${moduleAppId}`.trim() === '' ? '__invalid__' : moduleAppId;
  const appPath = getPrivateRoute('editor', { slug });
  const path = subpath ? `${subpath}${appPath}` : appPath;

  window.open(path, '_blank', 'noopener,noreferrer');
};
