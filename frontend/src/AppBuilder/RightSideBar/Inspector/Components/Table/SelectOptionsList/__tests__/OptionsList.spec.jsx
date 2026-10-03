import React from 'react';
import { render, screen } from '@testing-library/react';
import { OptionsList } from '../OptionsList';

// The inspector accordion only renders `items[].children` behind a click; the
// placeholder under test lives inside those children, so flatten it here.
jest.mock('@/AppBuilder/RightSideBar/Inspector/InspectorAccordion', () => ({
  __esModule: true,
  default: ({ items }) => (
    <div>
      {items.map((item, i) => (
        <div key={i}>{item.children}</div>
      ))}
    </div>
  ),
}));

// CodeHinter is a CodeMirror wrapper. Nothing here asserts on editing — only on
// the props the inspector hands it — so a prop-recording stub is the cheap seam.
jest.mock('@/AppBuilder/CodeEditor', () => ({
  __esModule: true,
  default: ({ placeholder, componentName }) => (
    <div data-testid="code-hinter" data-component-name={componentName} data-placeholder={placeholder} />
  ),
}));

jest.mock('../../ProgramaticallyHandleProperties', () => ({
  ProgramaticallyHandleProperties: ({ label }) => <div data-testid="prop-toggle">{label}</div>,
}));

const renderOptionsList = (columnOverrides = {}) => {
  const column = {
    columnType: 'selectV2',
    useDynamicOptions: true,
    dynamicOptions: '',
    ...columnOverrides,
  };

  return render(
    <OptionsList
      column={column}
      index={0}
      darkMode={false}
      currentState={{}}
      component={{ component: { definition: { properties: {} } } }}
      props={{
        component: { component: { definition: { properties: { columns: { value: [column] } } } } },
        paramUpdated: jest.fn(),
      }}
      getPopoverFieldSource={(columnType, field) => `${columnType}::${field}`}
      setColumnPopoverRootCloseBlocker={jest.fn()}
      onColumnItemChange={jest.fn()}
      paramToUpdate="columns"
    />
  );
};

describe('OptionsList dynamic options placeholder', () => {
  it('advertises optionColor and labelColor in the dynamic options placeholder', () => {
    renderOptionsList();

    const placeholder = screen.getByTestId('code-hinter').getAttribute('data-placeholder');

    expect(placeholder).toContain('optionColor');
    expect(placeholder).toContain('labelColor');
  });

  it('keeps label and value in the dynamic options placeholder', () => {
    renderOptionsList();

    const placeholder = screen.getByTestId('code-hinter').getAttribute('data-placeholder');

    expect(placeholder).toContain("label: 'Reading'");
    expect(placeholder).toContain("value: 'Reading'");
  });
});
