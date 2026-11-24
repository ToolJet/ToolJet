// Elements/Code pulls CodeMirror, which jsdom cannot run (as in pdfAdditionalActions.spec.jsx); the stub stands in for
// the existing Border radius number input / Box shadow control that Custom shows.
jest.mock('../Elements/Code', () => {
  const React = require('react');
  return {
    Code: ({ param }) => React.createElement('div', { 'data-testid': `inspector-element-${param.name}` }),
  };
});
jest.mock('../Components/Form/_components', () => ({ LabeledDivider: () => null }));

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { seedApp, componentDefinition } from '@/test/app-builder';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager/componentTypes';
import { renderElement, renderCustomStyles } from '../Utils';

const buttonMeta = componentTypeDefinitionMap.Button;

// Button is a redesigned widget: its Styles are grouped in accordions and drawn by renderCustomStyles (Inspector
// RenderStyleOptions); older widgets go through renderElement. Both must offer the theme dropdown.
const field = (param, styles, { path = 'accordion' } = {}) => {
  const paramUpdated = jest.fn();
  const component = {
    id: 'btnInspect1',
    component: {
      id: 'btnInspect1',
      name: 'button1',
      component: 'Button',
      properties: {},
      definition: { ...buttonMeta.definition, styles },
    },
  };
  const accordian = buttonMeta.styles[param].accordian;
  render(
    <>
      {path === 'accordion'
        ? renderCustomStyles(component, buttonMeta, paramUpdated, [], param, 'styles', {}, {}, accordian)
        : renderElement(component, buttonMeta, paramUpdated, [], param, 'styles', {}, {})}
    </>
  );
  return { paramUpdated, user: userEvent.setup() };
};

describe('Button inspector: theme border radius and box shadow', () => {
  beforeEach(() => seedApp({ btnInspect1: componentDefinition('btnInspect1', 'button1', 'Button') }));

  test('[Button-THEME-005] Border radius and Box shadow offer the app theme items plus Custom', async () => {
    // Break this catches: renderElement rendering the bare number input (no theme dropdown) for a themeTokens style,
    // or the dropdown not saving the item id under borderRadiusStyle.
    const { paramUpdated, user } = field('borderRadius', { ...buttonMeta.definition.styles });
    const radius = screen.getByRole('combobox', { name: 'Border radius' });
    expect(within(screen.getByRole('group', { name: 'Border radius' })).getByText('Large')).toBeInTheDocument();
    expect(screen.queryByTestId('inspector-element-borderRadius')).toBeNull();

    await user.click(radius);
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'None0px',
      'Small2px',
      'Medium4px',
      'Large6px',
      'Custom',
    ]);
    await user.click(screen.getByRole('option', { name: /Medium/ }));
    expect(paramUpdated).toHaveBeenCalledWith({ name: 'borderRadiusStyle' }, 'value', 'medium', 'styles');
  });

  test('[Button-THEME-005] a Button with no theme style (saved before) shows Custom and its number input', () => {
    const { borderRadiusStyle, boxShadowStyle, ...savedStyles } = buttonMeta.definition.styles;
    field('borderRadius', savedStyles);
    expect(within(screen.getByRole('group', { name: 'Border radius' })).getByText('Custom')).toBeInTheDocument();
    expect(screen.getByTestId('inspector-element-borderRadius')).toBeInTheDocument();
  });

  test('[Button-THEME-005] Box shadow lists the theme shadows', async () => {
    const { user } = field('boxShadow', { ...buttonMeta.definition.styles });
    const shadow = screen.getByRole('combobox', { name: 'Box shadow' });
    expect(within(screen.getByRole('group', { name: 'Box shadow' })).getByText('None')).toBeInTheDocument();
    await user.click(shadow);
    expect(screen.getByRole('option', { name: /^300/ })).toHaveTextContent('0 4px 8px 0');
  });

  test('[Button-THEME-005] the same dropdown on the ungrouped inspector path (renderElement)', () => {
    field('borderRadius', { ...buttonMeta.definition.styles }, { path: 'flat' });
    expect(within(screen.getByRole('group', { name: 'Border radius' })).getByText('Large')).toBeInTheDocument();
  });
});
