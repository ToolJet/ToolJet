/**
 * @group platform
 *
 * Declared-variable maps are keyed by variable name, and names are case-sensitive identifiers
 * (`selectedOrderID`, `user_name`, `$total`). App and version responses run through humps, which
 * would rewrite those keys (`selectedOrderID` → `selected_order_i_d`). These helpers transform the
 * rest of the payload as before and leave every `globalSettings.variables` map exactly as stored.
 */
import {
  camelizeKeysKeepingVariableMaps,
  decamelizeKeysKeepingVariableMaps,
} from 'src/helpers/variable-map-keys.helper';

const variables = {
  selectedOrderID: { value: '42', fxActive: false },
  user_name: { value: 'a', fxActive: true },
  $total: { value: '{{1}}', fxActive: false },
};

describe('decamelizeKeysKeepingVariableMaps', () => {
  it('decamelizes an app payload but keeps the nested variables map as stored', () => {
    const app = {
      id: 'app-1',
      editingVersion: {
        homePageId: 'page-1',
        globalSettings: { hideHeader: true, variables },
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
      appVersions: [{ globalSettings: { appMode: 'auto', variables } }],
    };

    expect(decamelizeKeysKeepingVariableMaps(app)).toEqual({
      id: 'app-1',
      editing_version: {
        home_page_id: 'page-1',
        global_settings: { hide_header: true, variables },
        created_at: new Date('2026-01-01T00:00:00Z'),
      },
      app_versions: [{ global_settings: { app_mode: 'auto', variables } }],
    });
  });

  it('does not change the object it is given', () => {
    const app = { editingVersion: { globalSettings: { variables } } };
    decamelizeKeysKeepingVariableMaps(app);
    expect(app).toEqual({ editingVersion: { globalSettings: { variables } } });
  });

  it('transforms a payload without variables exactly like humps', () => {
    expect(decamelizeKeysKeepingVariableMaps({ globalSettings: { appMode: 'auto' }, isPublic: false })).toEqual({
      global_settings: { app_mode: 'auto' },
      is_public: false,
    });
    expect(decamelizeKeysKeepingVariableMaps({ globalSettings: null })).toEqual({ global_settings: null });
  });
});

describe('camelizeKeysKeepingVariableMaps', () => {
  it('camelizes a version payload but keeps the variables map as stored', () => {
    expect(
      camelizeKeysKeepingVariableMaps({ home_page_id: 'p', global_settings: { hide_header: true, variables } })
    ).toEqual({ homePageId: 'p', globalSettings: { hideHeader: true, variables } });
  });
});
