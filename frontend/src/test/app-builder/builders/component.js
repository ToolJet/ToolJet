import { applyDeclaredOverrides } from '../shared';

export function buildComponent(overrides = {}) {
  const result = applyDeclaredOverrides(
    'component',
    {
      id: 'component-1',
      name: 'dropdown1',
      component: {
        component: 'DropdownV2',
        definition: { properties: {}, styles: {}, validation: {} },
      },
      layouts: { desktop: { top: 0, left: 0, width: 8, height: 40 } },
    },
    overrides,
    ['id', 'name', 'component', 'layouts']
  );
  if (!result.component?.component) throw new Error('Component fixture requires component.component');
  return result;
}
