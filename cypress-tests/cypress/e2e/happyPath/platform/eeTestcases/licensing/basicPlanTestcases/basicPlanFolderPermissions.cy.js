import { cleanAllUsers } from 'Support/utils/manageUsers';
import {
  RESOURCES,
  apiAddItemToFolder,
  apiCreateItem,
  apiFolderAction,
  apiGetGranularPermissions,
  loginAs,
  phase,
} from 'Support/utils/platform/folderPermissions';

// Known bug: workflow, module and data source folders don't honour Builder's Edit folder on Basic.
// CURRENT is today's behaviour; switch to EXPECTED_AFTER_FIX once fixed.

const FOLDER_TYPES = {
  app: { type: 'front-end', label: 'App folders', short: 'app', resource: RESOURCES.app },
  workflow: { type: 'workflow', label: 'Workflow folders', short: 'workflow', resource: RESOURCES.workflow },
  module: { type: 'module', label: 'Module folders', short: 'module' },
  dataSource: { type: 'data_source', label: 'Data source folders', short: 'DS' },
};
const FOLDER_KEYS = Object.keys(FOLDER_TYPES);
const ITEM_KEYS = ['app', 'workflow', 'dataSource'];

const CURRENT = {
  addItem: { app: 201, workflow: 403, dataSource: 201 },
  removeItem: { app: 200, workflow: 403, dataSource: 200 },
  rename: { app: 200, workflow: 403, module: 403, dataSource: 403 },
  delete: { app: 200, workflow: 200, module: 200, dataSource: 200 },
  seesFolderWithItem: { app: true, workflow: true, dataSource: true },
  seesEmptyFolder: { app: true, workflow: false, module: false, dataSource: false },
};
const EXPECTED_AFTER_FIX = {
  addItem: { app: 201, workflow: 201, dataSource: 201 },
  removeItem: { app: 200, workflow: 200, dataSource: 200 },
  rename: { app: 200, workflow: 200, module: 200, dataSource: 200 },
  delete: { app: 200, workflow: 200, module: 200, dataSource: 200 },
  seesFolderWithItem: { app: true, workflow: true, dataSource: true },
  seesEmptyFolder: { app: true, workflow: true, module: true, dataSource: true },
};

const NO_ACCESS = 'You do not have access to perform this action';

describe('Basic Plan — Builder Access to Folders Created by Others', { retries: 0 }, () => {
  const testId = Date.now();
  const builderEmail = `basic-folder-builder-${testId}@example.com`;
  const adminItems = {};
  const builderItems = {};
  let folders = {};
  let emptyFolders = {};
  let folderNames = {};

  const loginAsAdmin = () => cy.apiLogin();
  const loginAsBuilder = () => loginAs(builderEmail);

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
      return res.body.id;
    });

  const itemPath = (key) => (key === 'dataSource' ? '/folder-data-sources' : '/folder-apps');
  const addBody = (key, folderId, itemId) =>
    key === 'dataSource' ? { folder_id: folderId, data_source_id: itemId } : { folder_id: folderId, app_id: itemId };
  const removeBody = (key, itemId) => (key === 'dataSource' ? { data_source_id: itemId } : { app_id: itemId });

  const expectStatus = (res, expected, what) => {
    expect(res.status, what).to.equal(expected);
    if (expected === 403) expect(res.body.message, what).to.equal(NO_ACCESS);
  };

  const listFolderNames = (key) => {
    const path = key === 'dataSource' ? '/folder-data-sources' : `/folder-apps?type=${FOLDER_TYPES[key].type}`;
    return apiFolderAction('GET', path).then((res) => {
      expect(res.status).to.equal(200);
      return (res.body.folders || []).map((f) => f.name);
    });
  };

  before(() => {
    loginAsAdmin();
    cleanAllUsers();
    cy.apiDeleteAllApps();
    cy.apiDeleteAllWorkflows();

    phase('admin and builder each create an app, a workflow and a data source');
    createItems('admin', adminItems);
    cy.apiFullUserOnboarding('QA Builder', builderEmail, 'builder', 'password', 'My workspace');
    loginAsBuilder();
    createItems('builder', builderItems);
  });

  beforeEach(() => {
    folders = {};
    emptyFolders = {};
    folderNames = {};
  });

  afterEach(() => {
    loginAsAdmin();
    cy.then(() => {
      [...Object.values(folders), ...Object.values(emptyFolders)].forEach((id) =>
        apiFolderAction('DELETE', `/folders/${id}`)
      );
    });
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
    const { label, short } = FOLDER_TYPES[key];
    const hasItems = ITEM_KEYS.includes(key);

    it(`should match the current builder access on ${label.toLowerCase()} created by the admin`, () => {
      phase(`admin creates a ${short} folder${hasItems ? ' with an item' : ''} and an empty one`);
      loginAsAdmin();
      folderNames = { withItem: `Admin ${short} ${Date.now()}`, empty: `Admin empty ${short} ${Date.now()}` };
      createFolder(key, folderNames.withItem).then((id) => {
        folders.withItem = id;
        if (key === 'dataSource') {
          cy.apiAddDataSourceToFolder(adminItems.dataSource, id, { failOnStatusCode: true });
        } else if (hasItems) {
          apiAddItemToFolder(FOLDER_TYPES[key].resource, adminItems[key], id);
        }
      });
      createFolder(key, folderNames.empty).then((id) => {
        emptyFolders.empty = id;
      });

      phase('Builder group shows Edit folder');
      cy.apiGetGroupId('builder').then((groupId) => {
        apiGetGranularPermissions(groupId).then((body) => {
          const perms = Array.isArray(body) ? body : body.granularPermissions || [];
          const perm = perms.find((p) => p.name === label);
          expect(perm, label).to.exist;
          expect(perm.foldersGroupPermissions.canEditFolder, `${label} Edit folder`).to.equal(true);
        });
      });

      phase('builder creates an own folder');
      loginAsBuilder();
      createFolder(key, `Builder own ${short} ${Date.now()}`).then((id) => {
        emptyFolders.own = id;
      });

      phase("builder lists the admin's folders");
      listFolderNames(key).then((list) => {
        if (hasItems) {
          expect(list.includes(folderNames.withItem), "sees admin's folder with an item").to.equal(
            CURRENT.seesFolderWithItem[key]
          );
        }
        expect(list.includes(folderNames.empty), "sees admin's empty folder").to.equal(CURRENT.seesEmptyFolder[key]);
      });

      if (hasItems) {
        phase("builder adds and removes items in the admin's folder");
        cy.then(() => {
          apiFolderAction('POST', itemPath(key), addBody(key, folders.withItem, builderItems[key])).then((res) =>
            expectStatus(res, CURRENT.addItem[key], "add item to admin's folder")
          );
          apiFolderAction('PUT', `${itemPath(key)}/${folders.withItem}`, removeBody(key, adminItems[key])).then((res) =>
            expectStatus(res, CURRENT.removeItem[key], "remove item from admin's folder")
          );
        });
      }

      phase("builder renames and deletes the admin's folder");
      cy.then(() => {
        apiFolderAction('PUT', `/folders/${folders.withItem}`, {
          name: `Renamed by builder ${short} ${Date.now()}`,
        }).then((res) => expectStatus(res, CURRENT.rename[key], "rename admin's folder"));
        apiFolderAction('DELETE', `/folders/${folders.withItem}`).then((res) =>
          expectStatus(res, CURRENT.delete[key], "delete admin's folder")
        );
      });
    });
  });
});
