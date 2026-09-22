// Avoid pulling in the full CodeEditor/mdxeditor tree via Code.jsx/LabeledDivider.
jest.mock('../../Elements/Code', () => ({ Code: () => null }));
jest.mock('../../Components/Form/_components', () => ({ LabeledDivider: () => null }));

import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, binding } from '@/test/app-builder';
import { renderElement } from '../../Utils';
import { filepickerConfig } from '@/AppBuilder/WidgetManager/widgets/filepicker';
import { fileinputConfig } from '@/AppBuilder/WidgetManager/widgets/fileinput';
import { fileButtonConfig } from '@/AppBuilder/WidgetManager/widgets/fileButton';

const state = () => useStore.getState();

// parseFileType ("File type") is conditionallyRender-gated on parseContent
// ("Enable parsing") on all three file widgets. Real manifests are used so
// each widget's own conditionallyRender shape is exercised as shipped —
// FilePicker/FileButton use the single-object form, FileInput uses the array
// form, which is a separate branch in Utils.js (`utilFuncForMultipleChecks`).
const FILE_WIDGETS = [
  ['FilePicker', filepickerConfig],
  ['FileInput', fileinputConfig],
  ['FileButton', fileButtonConfig],
];

function buildComponent(componentType, parseContentExpression) {
  return {
    component: {
      component: componentType,
      properties: { parseFileType: {} },
      definition: {
        properties: {
          parseContent: binding(parseContentExpression),
          parseFileType: { value: 'auto-detect' },
        },
      },
    },
  };
}

function fileTypeFieldIsRendered(componentMeta, componentType, parseContentExpression) {
  const result = renderElement(
    buildComponent(componentType, parseContentExpression),
    componentMeta,
    () => {},
    [],
    'parseFileType',
    'properties',
    {},
    {}
  );
  return result !== undefined;
}

beforeEach(() => {
  seedApp({
    c1: componentDefinition('c1', 'file_parse', 'Checkbox'),
  });
});

describe.each(FILE_WIDGETS)(
  '%s: conditionallyRender resolves against the live store',
  (componentType, componentMeta) => {
    test('a literal Enable Parsing expression shows File type', () => {
      expect(fileTypeFieldIsRendered(componentMeta, componentType, '{{true}}')).toBe(true);
    });

    test('Enable Parsing bound to another component resolving to true shows File type', () => {
      state().setExposedValue('c1', 'value', true);

      expect(fileTypeFieldIsRendered(componentMeta, componentType, '{{components.file_parse.value}}')).toBe(true);
    });

    test('Enable Parsing bound to another component resolving to false hides File type', () => {
      state().setExposedValue('c1', 'value', false);

      expect(fileTypeFieldIsRendered(componentMeta, componentType, '{{components.file_parse.value}}')).toBe(false);
    });
  }
);
