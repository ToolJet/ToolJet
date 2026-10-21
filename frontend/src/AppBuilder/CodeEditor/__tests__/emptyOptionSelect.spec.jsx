import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * The UI 2.0 Heading's and Text's Weight style offers "Default" (value '', the theme's weight). The inspector's select
 * read '' as no value, so the field was blank when nothing was set and right after picking Default. It now shows
 * Default for '' and unset, and picking it writes '' (which leaves the theme's weight; typeLook.fontWeight).
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { DynamicFxTypeRenderer } from '../DynamicFxTypeRenderer';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { fontWeight } from '@/AppBuilder/Widgets/Ui2/_shared/looks/typeLook';

jest.mock('@/modules/common/helpers/onboardingStoreHelper', () => ({ __esModule: true, default: undefined }));
jest.mock('@/modules/common/helpers/invitationStoreHelper', () => ({ __esModule: true, default: undefined }));
// The menu's options carry the Table's deprecated-column tooltip, whose native ToolTip logs a prop-type warning when an
// option opens; not what this spec is about.
jest.mock('@/AppBuilder/RightSideBar/Inspector/Components/Table/ColumnManager/DeprecatedColumnTypeMsg', () => ({
  DeprecatedColumnTooltip: ({ children }) => children,
  checkIfTableColumnDeprecated: () => false,
}));

const field = (type, value, onChange = () => {}) =>
  render(
    <DynamicFxTypeRenderer
      paramType="select"
      component={type}
      componentId="w1"
      paramName="fontWeight"
      value={value}
      onChange={onChange}
      cyLabel="weight"
      meta={componentTypeDefinitionMap[type].styles.fontWeight}
    />
  );

describe.each(['ShadHeading', 'ShadText'])('%s Weight', (type) => {
  test.each([[''], [undefined]])('shows Default when the value is %p', (value) => {
    field(type, value);
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  test('shows a set weight by its name', () => {
    field(type, '600');
    expect(screen.getByText('Semibold')).toBeInTheDocument();
  });

  test('picking Default writes the empty value, which leaves the theme weight', () => {
    const onChange = jest.fn();
    const { container } = field(type, '700', onChange);
    fireEvent.keyDown(container.querySelector('input'), { key: 'ArrowDown' });
    fireEvent.click(screen.getByText('Default'));
    expect(onChange).toHaveBeenLastCalledWith('');
    expect(fontWeight('')).toBe('');
  });
});

test('a select with no empty option is unchanged', () => {
  const onChange = jest.fn();
  render(
    <DynamicFxTypeRenderer
      paramType="select"
      component="ShadHeading"
      componentId="w1"
      paramName="fontFamily"
      value="serif"
      onChange={onChange}
      cyLabel="font"
      meta={componentTypeDefinitionMap.ShadHeading.styles.fontFamily}
    />
  );
  expect(screen.getByText(/serif/i)).toBeInTheDocument();
});
