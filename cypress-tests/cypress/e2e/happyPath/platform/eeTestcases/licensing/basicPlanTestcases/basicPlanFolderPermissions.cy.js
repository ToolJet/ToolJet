import { commonSelectors } from 'Selectors/common';
import { cleanAllUsers } from 'Support/utils/manageUsers';
import {
  RESOURCES,
  apiAddItemToFolder,
  apiCreateItem,
  apiFolderAction,
  apiGetGranularPermissions,
  expectFolderListed,
  expectFolderMenuAbsent,
  loginAs,
  openAppsDashboard,
  phase,
} from 'Support/utils/platform/folderPermissions';

const FOLDER_TYPES = {
  app: { type: 'front-end', label: 'App folders', short: 'app', resource: RESOURCES.app },
  workflow: { type: 'workflow', label: 'Workflow folders', short: 'workflow', resource: RESOURCES.workflow },
  module: { type: 'module', label: 'Module folders', short: 'module' },
  dataSource: { type: 'data_source', label: 'Data source folders', short: 'DS' },
};
const FOLDER_KEYS = Object.keys(FOLDER_TYPES);
const ITEM_KEYS = ['app', 'workflow', 'dataSource'];

const EDIT_FOLDER = { canEditFolder: true, canEditApps: false, canViewApps: false };
const VIEW_ITEMS = { canEditFolder: false, canEditApps: false, canViewApps: true };
const NO_ACCESS = { canEditFolder: false, canEditApps: false, canViewApps: false };

// Basic plan defaults. Modules are paid on Basic, so module folders have no items.
const EXPECTED = {
  builder: {
    screen: { app: EDIT_FOLDER, workflow: EDIT_FOLDER, module: EDIT_FOLDER, dataSource: EDIT_FOLDER },
    seesFolderWithItem: { app: true, workflow: true, dataSource: true },
    seesEmptyFolder: { app: true, workflow: true, module: true, dataSource: true },
    create: 201,
    addItem: 201,
    removeItem: 200,
    rename: 200,
    delete: 200,
  },
  endUser: {
    screen: { app: VIEW_ITEMS, workflow: VIEW_ITEMS, module: null, dataSource: NO_ACCESS },
    seesFolderWithItem: { app: true, workflow: true, dataSource: false },
    // End users only see folders holding something they can view.
    seesEmptyFolder: { app: false, workflow: false, module: false, dataSource: false },
    create: 403,
    addItem: 403,
    removeItem: 403,
    rename: 403,
    delete: 403,
  },
};

// Creating a folder is blocked by a different guard than the folder actions, so its message differs.
const NO_ACCESS_MESSAGES = [
  'You do not have access to perform this action',
  'You do not have permission to access this resource',
];

describe('Basic Plan — Default Role Access to Folders Created by Others', { retries: 0 }, () => {
  const testId = Date.now();
  const users = {
    builder: { email: `basic-folder-builder-${testId}@example.com`, role: 'builder', group: 'builder' },
    endUser: { email: `basic-folder-enduser-${testId}@example.com`, role: 'end-user', group: 'end-user' },
  };
  const adminItems = {};
  const builderItems = {};
  let folderIds = [];

  const loginAsAdmin = () => cy.apiLogin();

  const createItems = (owner, store) => {
    ['app', 'workflow'].forEach((key) => {
      apiCreateItem(FOLDER_TYPES[key].resource, `${owner}-${key}-${testId}`).then((id) => {
        store[key] = id;
      });
    });
    cy.apiCreateGlobalDataSource(`${owner}-ds-${testId}`).then((id) => {
      store.dataSource = id;
    });
  };

  const createFolder = (key, name) =>
    apiFolderAction('POST', '/folders', { name, type: FOLDER_TYPES[key].type }).then((res) => {
      expect(res.status, `create ${key} folder`).to.equal(201);
      folderIds.push(res.body.id);
      return res.body.id;
    });

  const itemPath = (key) => (key === 'dataSource' ? '/folder-data-sources' : '/folder-apps');
  const addBody = (key, folderId, itemId) =>
    key === 'dataSource' ? { folder_id: folderId, data_source_id: itemId } : { folder_id: folderId, app_id: itemId };
  const removeBody = (key, itemId) => (key === 'dataSource' ? { data_source_id: itemId } : { app_id: itemId });

  const expectStatus = (res, expected, what) => {
    expect(res.status, what).to.equal(expected);
    if (expected === 403) expect(res.body.message, what).to.be.oneOf(NO_ACCESS_MESSAGES);
  };

  const listFolderNames = (key) => {
    const path = key === 'dataSource' ? '/folder-data-sources' : `/folder-apps?type=${FOLDER_TYPES[key].type}`;
    return apiFolderAction('GET', path).then((res) => {
      expect(res.status).to.equal(200);
      return (res.body.folders || []).map((f) => f.name);
    });
  };

  const expectScreenTier = (roleKey, key) => {
    const { label } = FOLDER_TYPES[key];
    const expected = EXPECTED[roleKey].screen[key];
    cy.apiGetGroupId(users[roleKey].group).then((groupId) => {
      apiGetGranularPermissions(groupId).then((body) => {
        const perms = Array.isArray(body) ? body : body.granularPermissions || [];
        const perm = perms.find((p) => p.name === label);
        if (expected === null) {
          expect(perm, `${roleKey} has no ${label} row`).to.be.undefined;
          return;
        }
        expect(perm, `${roleKey} ${label} row`).to.exist;
        Object.entries(expected).forEach(([flag, value]) =>
          expect(perm.foldersGroupPermissions[flag], `${roleKey} ${label} ${flag}`).to.equal(value)
        );
      });
    });
  };

  // Admin creates a folder holding an item (none for modules) and an empty folder.
  const createAdminFolders = (key, roleKey) => {
    const { short, resource } = FOLDER_TYPES[key];
    const suffix = `${roleKey} ${Date.now()}`;
    const names = { withItem: `Admin ${short} ${suffix}`, empty: `Admin empty ${short} ${suffix}` };
    const ids = {};
    loginAsAdmin();
    createFolder(key, names.withItem).then((id) => {
      ids.withItem = id;
      if (key === 'dataSource') {
        cy.apiAddDataSourceToFolder(adminItems.dataSource, id, { failOnStatusCode: true });
      } else if (ITEM_KEYS.includes(key)) {
        apiAddItemToFolder(resource, adminItems[key], id);
      }
    });
    createFolder(key, names.empty).then((id) => {
      ids.empty = id;
    });
    return cy.wrap({ names, ids });
  };

  const checkRoleOnAdminFolders = (roleKey, key, { names, ids }) => {
    const expected = EXPECTED[roleKey];
    const { short, type, label } = FOLDER_TYPES[key];

    phase(`${roleKey}: ${label} on the permissions screen`);
    loginAsAdmin();
    expectScreenTier(roleKey, key);

    loginAs(users[roleKey].email);
    phase(`${roleKey}: create an own folder`);
    apiFolderAction('POST', '/folders', { name: `${roleKey} own ${short} ${Date.now()}`, type }).then((res) => {
      expectStatus(res, expected.create, `${roleKey} creates a ${key} folder`);
      if (res.status === 201) folderIds.push(res.body.id);
    });

    phase(`${roleKey}: list the admin's folders`);
    listFolderNames(key).then((list) => {
      if (ITEM_KEYS.includes(key)) {
        expect(list.includes(names.withItem), `${roleKey} sees admin's ${key} folder with an item`).to.equal(
          expected.seesFolderWithItem[key]
        );
      }
      expect(list.includes(names.empty), `${roleKey} sees admin's empty ${key} folder`).to.equal(
        expected.seesEmptyFolder[key]
      );
    });

    // End users only reach the apps dashboard, so app folders are the only UI check.
    if (roleKey === 'endUser' && key === 'app') {
      phase("endUser: apps dashboard shows the admin's folder read-only");
      openAppsDashboard();
      expectFolderMenuAbsent(names.withItem);
      expectFolderListed(names.empty, false);
      cy.get(commonSelectors.createNewFolderButton).should('not.exist');
    }

    if (ITEM_KEYS.includes(key)) {
      phase(`${roleKey}: add and remove items in the admin's folder`);
      apiFolderAction('POST', itemPath(key), addBody(key, ids.withItem, builderItems[key])).then((res) =>
        expectStatus(res, expected.addItem, `${roleKey} adds an item to admin's ${key} folder`)
      );
      apiFolderAction('PUT', `${itemPath(key)}/${ids.withItem}`, removeBody(key, adminItems[key])).then((res) =>
        expectStatus(res, expected.removeItem, `${roleKey} removes an item from admin's ${key} folder`)
      );
    }

    phase(`${roleKey}: rename and delete the admin's folder`);
    apiFolderAction('PUT', `/folders/${ids.empty}`, { name: `Renamed by ${roleKey} ${short} ${Date.now()}` }).then(
      (res) => expectStatus(res, expected.rename, `${roleKey} renames admin's ${key} folder`)
    );
    apiFolderAction('DELETE', `/folders/${ids.empty}`).then((res) =>
      expectStatus(res, expected.delete, `${roleKey} deletes admin's ${key} folder`)
    );
  };

  before(() => {
    loginAsAdmin();
    apiFolderAction('GET', '/session').then((res) => Cypress.env('workspaceSlug', res.body.current_organization_slug));
    cleanAllUsers();
    cy.apiDeleteAllApps();
    cy.apiDeleteAllWorkflows();

    phase('admin and builder each create an app, a workflow and a data source; an end user joins');
    createItems('admin', adminItems);
    Object.values(users).forEach(({ email, role }) => {
      loginAsAdmin();
      cy.apiFullUserOnboarding(`QA ${role}`, email, role, 'password', 'My workspace');
    });
    loginAs(users.builder.email);
    createItems('builder', builderItems);
  });

  beforeEach(() => {
    folderIds = [];
  });

  afterEach(() => {
    loginAsAdmin();
    cy.then(() => folderIds.forEach((id) => apiFolderAction('DELETE', `/folders/${id}`)));
  });

  after(() => {
    loginAsAdmin();
    cy.then(() => {
      [adminItems, builderItems].forEach((items) => {
        ['app', 'workflow'].forEach((key) => items[key] && cy.apiDeleteApp(items[key]));
        if (items.dataSource) apiFolderAction('DELETE', `/data-sources/${items.dataSource}`);
      });
    });
    cleanAllUsers();
  });

  FOLDER_KEYS.forEach((key) => {
    it(`should apply the Basic builder and end-user access on ${FOLDER_TYPES[key].label.toLowerCase()} created by the admin`, () => {
      ['endUser', 'builder'].forEach((roleKey) =>
        createAdminFolders(key, roleKey).then((folders) => checkRoleOnAdminFolders(roleKey, key, folders))
      );
    });
  });
});
