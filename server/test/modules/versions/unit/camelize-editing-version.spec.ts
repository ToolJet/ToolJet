import { camelizeEditingVersion } from 'src/modules/versions/helpers/camelize-editing-version.helper';

type CamelizedVersion = { globalSettings?: { variables?: Record<string, unknown> } | null };

// Saved maps are keyed by variable name; names keep their exact case, underscores and $.
const variableId = 'selectedOrderID';
const variable = { value: '42', fxActive: false };

describe('camelizeEditingVersion', () => {
  it('keeps the name keys of app variables unchanged', () => {
    const result = camelizeEditingVersion({
      id: 'version-1',
      global_settings: { app_mode: 'auto', variables: { [variableId]: variable } },
    }) as CamelizedVersion;

    expect(result.globalSettings.variables).toEqual({ [variableId]: variable });
  });

  it('camelizes the rest of the version as before', () => {
    expect(
      camelizeEditingVersion({
        home_page_id: 'page-1',
        global_settings: { app_mode: 'auto', hide_header: true, variables: {} },
        page_settings: { show_navigation: true },
      })
    ).toEqual({
      homePageId: 'page-1',
      globalSettings: { appMode: 'auto', hideHeader: true, variables: {} },
      pageSettings: { showNavigation: true },
    });
  });

  it('handles settings that are already camelCase, missing or null', () => {
    const camel = camelizeEditingVersion({
      globalSettings: { variables: { [variableId]: variable } },
    }) as CamelizedVersion;
    expect(camel.globalSettings).toEqual({ variables: { [variableId]: variable } });
    expect(camelizeEditingVersion({ id: 'v', globalSettings: null })).toEqual({ id: 'v', globalSettings: null });
    expect(camelizeEditingVersion({ id: 'v' })).toEqual({ id: 'v' });
  });

  it('does not change the object it is given', () => {
    const version = { global_settings: { variables: { [variableId]: variable } } };
    camelizeEditingVersion(version);
    expect(version).toEqual({ global_settings: { variables: { [variableId]: variable } } });
  });
});
