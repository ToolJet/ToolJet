// Every inspector element funnels through Elements/Code (which pulls the whole
// CodeMirror/mdxeditor tree jsdom can't run — same reasoning as
// pdfAdditionalActions.spec.jsx in this directory). The stub is param-aware so
// the spec can assert WHICH controls the real DefaultComponent list/filter
// logic placed in each accordion, without faking any of that logic.
jest.mock('../../Elements/Code', () => {
  const React = require('react');
  return {
    Code: ({ param }) => React.createElement('div', { 'data-testid': `inspector-element-${param.name}` }),
  };
});
jest.mock('../../Components/Form/_components', () => ({ LabeledDivider: () => null }));

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { seedApp, componentDefinition } from '@/test/app-builder';
import { DefaultComponent } from '../../Components/DefaultComponent';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager/componentTypes';

// The inspector always receives the universal-merged meta (cssClass merged in,
// legacy tooltip under `general` when a widget still uses it), never the raw
// widget config.
const calendarMeta = componentTypeDefinitionMap.Calendar;

/**
 * [Inspector-ADDITIONAL-ACTIONS-Calendar-001]
 *
 * Calendar's visibility toggle and modern tooltip/tooltipFormat pair register
 * under `section: 'additionalActions'` (calendar.js, bug-fix batch 2026-10-27:
 * "Visibility toggle is under the styles section" / "Tooltip is old one") —
 * but the inspector's SHOW_ADDITIONAL_ACTIONS allow-list decides whether that
 * accordion renders, and the `General` accordionFilters list decides whether
 * the OLD universal General>Tooltip section is suppressed. Both lists live in
 * DefaultComponent.jsx and both must name 'Calendar'.
 */
describe('Inspector Additional Actions accordion for Calendar', () => {
  beforeEach(() => {
    seedApp({ calInspect1: componentDefinition('calInspect1', 'calendar1', 'Calendar') });
  });

  const renderInspector = () => {
    const component = {
      id: 'calInspect1',
      component: {
        id: 'calInspect1',
        name: 'calendar1',
        component: 'Calendar',
        properties: {},
        definition: calendarMeta.definition,
      },
    };

    render(
      <DefaultComponent
        componentMeta={calendarMeta}
        component={component}
        darkMode={false}
        layoutPropertyChanged={jest.fn()}
        paramUpdated={jest.fn()}
        dataQueries={[]}
        currentState={{}}
        eventsChanged={jest.fn()}
        apps={[]}
        components={{}}
        pages={[]}
        selectedComponentId="calInspect1"
      />
    );
  };

  test('[Inspector-ADDITIONAL-ACTIONS-Calendar-001] renders Additional Actions with visibility + tooltip pair and no old General section', () => {
    // Break this catches: dropping 'Calendar' from SHOW_ADDITIONAL_ACTIONS
    // (whole accordion filtered out, registered visibility/tooltip unreachable)
    // or from the General accordionFilters list (the OLD universal
    // General>Tooltip section renders alongside the modern pair).
    renderInspector();

    expect(screen.getByText('Additional Actions')).toBeInTheDocument();
    const accordionItem = screen.getByText('Additional Actions').closest('.accordion-item');
    expect(within(accordionItem).getByTestId('inspector-element-visibility')).toBeInTheDocument();
    expect(within(accordionItem).getByTestId('inspector-element-tooltipFormat')).toBeInTheDocument();
    expect(within(accordionItem).getByTestId('inspector-element-tooltip')).toBeInTheDocument();

    // The old universal General accordion (tooltip under `general`) must be gone.
    expect(screen.queryByText('General')).not.toBeInTheDocument();
  });
});
