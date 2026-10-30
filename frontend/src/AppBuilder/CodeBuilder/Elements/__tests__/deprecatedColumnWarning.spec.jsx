/**
 * Every inspector select marked an option whose value is a deprecated Table column type: the Map's and the Table's
 * Look "ToolJet UI 1.0" (value 'default') carried a warning triangle and the tooltip "Deprecating column type ... the
 * new String".
 * The column-type warning now belongs to the Table's column-type field only; the generic select keeps its style
 * deprecations.
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SelectComponent from '@/_ui/Select';
import { Select } from '../Select';
import { ColumnTypeOption } from '@/AppBuilder/RightSideBar/Inspector/Components/Table/ColumnManager/PropertiesTabElements';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';

jest.mock('@/modules/common/helpers/onboardingStoreHelper', () => ({ __esModule: true, default: undefined }));
jest.mock('@/modules/common/helpers/invitationStoreHelper', () => ({ __esModule: true, default: undefined }));
// The tooltip's text is drawn inline, so the spec can read what a hover shows.
jest.mock('@/_components/ToolTip', () => ({
  ToolTip: ({ message, show = true, children }) => (
    <>
      {children}
      {show ? <div data-testid="tip">{message}</div> : null}
    </>
  ),
}));

const open = (container) => fireEvent.keyDown(container.querySelector('input'), { key: 'ArrowDown' });
// The menu may draw in a portal, so the whole document is searched.
const warnings = () => document.querySelectorAll('[data-cy="warning-icon"]').length;

test("the Map's Look ToolJet UI 1.0 has no deprecated column warning", () => {
  const meta = componentTypeDefinitionMap.Map.styles.mapLook;
  const { container } = render(<Select meta={meta} value="shadcn" onChange={() => {}} />);
  open(container);
  expect(screen.getAllByText('ToolJet UI 1.0').length).toBeGreaterThan(0);
  expect(warnings()).toBe(0);
  expect(screen.queryByText('Deprecating column type')).toBeNull();
});

test('a generic select still marks a deprecated style option', () => {
  const meta = {
    options: [
      { name: 'Label', value: 'ofLabel' },
      { name: 'Field', value: 'ofField' },
    ],
  };
  const { container } = render(<Select meta={meta} value="ofLabel" onChange={() => {}} />);
  open(container);
  expect(warnings()).toBe(1);
  expect(screen.getByText('This style will be deprecated in the future releases')).toBeInTheDocument();
});

test("the Table's column type field still marks its deprecated Default type", () => {
  const { container } = render(
    <SelectComponent
      options={[
        { label: 'String', value: 'string' },
        { label: 'Default', value: 'default' },
      ]}
      value="string"
      onChange={() => {}}
      components={{ Option: ColumnTypeOption }}
    />
  );
  open(container);
  expect(warnings()).toBe(1);
  expect(screen.getByText('Deprecating column type')).toBeInTheDocument();
});
