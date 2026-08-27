/**
 * Regression: pasting a widget whose `options` array (RadioButtonV2,
 * DropdownV2, MultiselectV2) was edited to fewer entries than the widget's
 * default brings back the missing default option(s). Cause: pasteComponents()
 * merges the pasted instance onto the widget's default config with
 * `_.merge`, which merges arrays by index instead of replacing them.
 */
import { http, HttpResponse } from 'msw';
import config from 'config';
import '@/test/setupMsw';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { pasteComponents } from '@/AppBuilder/AppCanvas/copyPasteWidgetsUtils';
import { seedApp } from '@/test/app-builder';
import { deepClone } from '@/_helpers/utilities/utils.helpers';

const state = () => useStore.getState();

describe('paste preserves an edited array-valued options property', () => {
  beforeEach(() => {
    // Paste always fires a real batch-save call; stub it so only the merge bug can fail this test.
    server.use(
      http.put(`${config.apiUrl}/v2/apps/:appId/versions/:versionId/components/batch`, () => HttpResponse.json({}))
    );
  });

  test('a RadioButtonV2 edited down to 2 options still has 2 options after paste', async () => {
    const editedOptions = [
      { label: 'option1', value: '1', disable: { value: false }, visible: { value: true }, default: { value: false } },
      { label: 'option2', value: '2', disable: { value: false }, visible: { value: true }, default: { value: true } },
    ];

    // Widget's default config (3 options) with `options` overridden to the edited 2, like a real instance.
    const editedComponent = deepClone(componentTypeDefinitionMap.RadioButtonV2);
    editedComponent.name = 'radio1';
    editedComponent.definition.properties.options.value = editedOptions;

    const originalLayouts = { desktop: { top: 0, left: 0, width: 8, height: 40 } };

    seedApp({
      radio1: { id: 'radio1', name: 'radio1', component: editedComponent, layouts: originalLayouts },
    });

    // Clipboard payload shape produced by copyComponents() for one selected component.
    const copiedComponentObj = {
      newComponents: [
        {
          component: editedComponent,
          layouts: originalLayouts,
          parent: undefined,
          id: 'radio1',
          events: [],
        },
      ],
      isCut: false,
      isCloning: false,
      pageId: 'page-1',
    };

    await pasteComponents(undefined, copiedComponentObj);

    const components = state().getCurrentPageComponents();
    const pasted = Object.values(components).find(
      (c) => c.component.component === 'RadioButtonV2' && c.id !== 'radio1'
    );

    expect(pasted).toBeDefined();
    expect(pasted.component.definition.properties.options.value).toHaveLength(2);
    expect(pasted.component.definition.properties.options.value.map((o) => o.value)).toEqual(['1', '2']);
  });
});
