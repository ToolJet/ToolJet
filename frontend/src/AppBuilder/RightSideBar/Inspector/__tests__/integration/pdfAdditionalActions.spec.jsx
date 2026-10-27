// Every inspector element funnels through Elements/Code (which pulls the whole
// CodeMirror/mdxeditor tree jsdom can't run — same reasoning as
// conditionallyRenderResolution.spec.js in this directory). The stub is
// param-aware so the spec can assert WHICH controls the real DefaultComponent
// list/filter logic placed in each accordion, without faking any of that logic.
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

// The inspector always receives the universal-merged meta (tooltip under
// `general`, cssClass/boxShadow merged in), never the raw widget config.
const pdfMeta = componentTypeDefinitionMap.PDF;

/**
 * [Inspector-ADDITIONAL-ACTIONS-PDF-001]
 *
 * PDF registers `collapseWhenHidden` under `section: 'additionalActions'`
 * (pdf.js), and the reflow engine honors it — but the inspector's
 * SHOW_ADDITIONAL_ACTIONS allow-list (DefaultComponent.jsx) decides whether the
 * "Additional Actions" accordion renders at all. A widget missing from that
 * list ships a toggle no user can reach (bug-fix batch 2026-10-26, bug 6:
 * "pdf doesn't have collapse on hidden feature").
 */
describe('Inspector Additional Actions accordion for PDF', () => {
  beforeEach(() => {
    seedApp({ pdfInspect1: componentDefinition('pdfInspect1', 'pdf1', 'PDF') });
  });

  test('[Inspector-ADDITIONAL-ACTIONS-PDF-001] renders the Additional Actions accordion with the Collapse when hidden toggle', () => {
    // Break this catches: dropping 'PDF' from SHOW_ADDITIONAL_ACTIONS
    // (DefaultComponent.jsx), which filters the whole accordion out of the PDF
    // inspector and makes the registered collapseWhenHidden property unreachable.
    const component = {
      id: 'pdfInspect1',
      component: {
        id: 'pdfInspect1',
        name: 'pdf1',
        component: 'PDF',
        properties: {},
        definition: pdfMeta.definition,
      },
    };

    render(
      <DefaultComponent
        componentMeta={pdfMeta}
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
        selectedComponentId="pdfInspect1"
      />
    );

    expect(screen.getByText('Additional Actions')).toBeInTheDocument();
    // The collapseWhenHidden control must render INSIDE the Additional Actions
    // accordion item (not merely somewhere in the inspector).
    const accordionItem = screen.getByText('Additional Actions').closest('.accordion-item');
    expect(within(accordionItem).getByTestId('inspector-element-collapseWhenHidden')).toBeInTheDocument();
  });
});
