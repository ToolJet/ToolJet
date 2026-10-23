import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * A UI 2.0 widget's segmented properties (Size, Align, Appearance, Change format...) lined up with nothing: the label ran
 * into the control, each control started at a different edge depending on its label, and long labels wrapped while the
 * control squeezed beside them. Two choices now take the dropdown's 144px column (the label wraps in the rest); three
 * or more go on their own line under the label. Native widgets' switches are unchanged.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { seedApp, componentDefinition } from '@/test/app-builder';
import { renderElement } from '@/AppBuilder/RightSideBar/Inspector/Utils';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { shadcnConfigs } from '@/AppBuilder/WidgetManager/widgets/shadcn';
import { segmentedLayout } from '../segmentedRow';

jest.mock('@/modules/common/helpers/onboardingStoreHelper', () => ({ __esModule: true, default: undefined }));
jest.mock('@/modules/common/helpers/invitationStoreHelper', () => ({ __esModule: true, default: undefined }));

const row = (type, param) => {
  const id = `${type}-1`;
  seedApp({ [id]: componentDefinition(id, 'w1', type) });
  const meta = componentTypeDefinitionMap[type];
  const component = {
    id,
    component: JSON.parse(JSON.stringify({ ...meta, ...componentDefinition(id, 'w1', type).component })),
  };
  const { container } = render(<>{renderElement(component, meta, () => {}, [], param, 'properties', {}, {}, false)}</>);
  return container.querySelector('.wrapper-div-code-editor');
};

describe('UI 2.0 segmented properties in the inspector', () => {
  test('two choices sit in the dropdown column, beside their label', () => {
    const wrapper = row('ShadHero', 'align');
    const line = wrapper.querySelector('.code-flex-wrapper');
    expect(line).toHaveClass('ui2-segmented-row');
    // The control is on the label's line, after it.
    expect(line.querySelector('.ToggleGroup')).not.toBeNull();
    expect(line.textContent).toMatch(/Align/);
  });

  test('three choices go on their own line, under the label', () => {
    const wrapper = row('ShadHero', 'size');
    expect(wrapper).toHaveClass('ui2-segmented-stacked');
    const line = wrapper.querySelector('.code-flex-wrapper');
    expect(line.querySelector('.ToggleGroup')).toBeNull();
    expect(line.textContent).toMatch(/Size/);
    expect(wrapper.lastElementChild.querySelector('.ToggleGroup')).not.toBeNull();
  });

  test('every UI 2.0 segmented property takes one of the two layouts; native switches keep theirs', () => {
    const layouts = shadcnConfigs.flatMap((config) =>
      Object.entries(config.properties ?? {})
        .filter(([, meta]) => meta.type === 'switch' && meta.fullWidth && !meta.isIcon)
        .map(([, meta]) => [
          meta.options.length,
          segmentedLayout({ component: config.name, paramType: 'switch', fieldMeta: meta }),
        ])
    );
    expect(layouts.length).toBeGreaterThan(10);
    layouts.forEach(([count, layout]) => expect(layout).toBe(count > 2 ? 'stacked' : 'column'));

    const nativeTooltip = componentTypeDefinitionMap.Button.properties.tooltipFormat ?? {
      fullWidth: true,
      options: [1, 2, 3],
    };
    expect(segmentedLayout({ component: 'Button', paramType: 'switch', fieldMeta: nativeTooltip })).toBeNull();
    expect(segmentedLayout({ component: 'ShadHero', paramType: 'select', fieldMeta: { fullWidth: true } })).toBeNull();
  });
});
