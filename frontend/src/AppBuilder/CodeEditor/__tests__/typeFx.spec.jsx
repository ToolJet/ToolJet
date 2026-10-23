import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * The UI 2.0 Input's Type takes a binding (a password field's show/hide toggle), but the inspector drew no fx button
 * for it: the shared code editor withheld fx from every field labelled Type. A config now opts its Type field in
 * (`isFxAllowed`); the native Type selectors (Button, Table) stay without fx.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { Code } from '@/AppBuilder/RightSideBar/Inspector/Elements/Code';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';

jest.mock('@/modules/common/helpers/onboardingStoreHelper', () => ({ __esModule: true, default: undefined }));
jest.mock('@/modules/common/helpers/invitationStoreHelper', () => ({ __esModule: true, default: undefined }));
jest.mock('@/AppBuilder/RightSideBar/Inspector/Components/Table/ColumnManager/DeprecatedColumnTypeMsg', () => ({
  DeprecatedColumnTooltip: ({ children }) => children,
  checkIfTableColumnDeprecated: () => false,
}));

// The Inspector's own property field (Elements/Code), as the Properties panel draws it.
const field = (type, param, value, paramType = 'properties') => {
  const componentMeta = componentTypeDefinitionMap[type];
  return render(
    <Code
      param={{ name: param }}
      definition={{ value }}
      onChange={() => {}}
      paramType={paramType}
      accordian={paramType === 'styles'}
      componentMeta={componentMeta}
      componentName="widget1"
      onFxPress={() => {}}
      fxActive={false}
      component={{ id: 'w1', component: { component: type, definition: { styles: {} } } }}
    />
  );
};

test('the UI 2.0 Input Type field has an fx button', () => {
  const { container } = field('ShadInput', 'inputType', 'text');
  expect(container.querySelector('[data-cy="type-fx-button"]')).not.toBeNull();
});

test("a native Button's Type field still has no fx button", () => {
  const { container } = field('Button', 'type', 'primary', 'styles');
  expect(container.textContent).toMatch(/Type/);
  expect(container.querySelector('[data-cy="type-fx-button"]')).toBeNull();
});
