import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * The UI 2.0 Key-value list's inspector showed every setting all the time. Label width now shows only side by side
 * (ui2ConditionalProperties.spec.js). Currency, Locale, Date format and Badge colours depend on each row's type, which
 * is data, so they stay shown: under one heading, each with a note saying which rows it affects. Columns stays too (both
 * layouts take it) with a note that it is capped by width: side by side, a column needs about 300px, so a default-size
 * Key-value list draws one.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { seedApp, componentDefinition } from '@/test/app-builder';
import { renderElement } from '@/AppBuilder/RightSideBar/Inspector/Utils';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';

jest.mock('@/modules/common/helpers/onboardingStoreHelper', () => ({ __esModule: true, default: undefined }));
jest.mock('@/modules/common/helpers/invitationStoreHelper', () => ({ __esModule: true, default: undefined }));
// The field's editor itself (CodeMirror) is not what this spec is about: the note is drawn by the inspector's Code
// element around it.
jest.mock('@/AppBuilder/CodeEditor', () => ({ __esModule: true, default: () => null }));

const meta = componentTypeDefinitionMap.ShadKeyValue;
const field = (param) => {
  seedApp({ kv1: componentDefinition('kv1', 'keyValue1', 'ShadKeyValue') });
  const component = {
    id: 'kv1',
    component: { ...meta, ...componentDefinition('kv1', 'keyValue1', 'ShadKeyValue').component },
  };
  return render(<>{renderElement(component, meta, () => {}, [], param, 'properties', {}, {}, false)}</>);
};

describe('UI 2.0 Key-value list inspector', () => {
  test('the typed-row formats sit under one heading, after the general settings', () => {
    const keys = Object.keys(meta.properties);
    const heading = keys.indexOf('typedRowFormats');
    expect(meta.properties.typedRowFormats).toMatchObject({
      type: 'sectionSubHeader',
      displayName: 'Formats for typed rows',
    });
    expect(keys.slice(heading + 1, heading + 5)).toEqual(['currency', 'locale', 'dateFormat', 'badgeColors']);
    expect(heading).toBeGreaterThan(keys.indexOf('emptyText'));
  });

  test.each([
    ['currency', /type currency/],
    ['locale', /number, currency, date and datetime/],
    ['dateFormat', /date and datetime/],
    ['badgeColors', /type badge/],
    ['columns', /300px a column side by side, 160px with the label above/],
  ])('%s says which rows it affects', (param, note) => {
    field(param);
    expect(screen.getByText(note)).toBeInTheDocument();
  });
});
