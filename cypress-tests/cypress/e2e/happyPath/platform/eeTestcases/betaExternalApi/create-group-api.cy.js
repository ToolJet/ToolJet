import { fake } from "Fixtures/fake";
import { apiRequest as baseApiRequest } from "Support/utils/externalApi";

const apiBaseUrl = Cypress.env("API_URL");
const authHeader = {
  Authorization: Cypress.env("AUTH_TOKEN"),
  "Content-Type": "application/json",
};

const sendApiRequest = (method, endpoint, body, headers = authHeader) =>
  baseApiRequest(method, `${apiBaseUrl}${endpoint}`, body, headers);

describe("External API Beta - Create Group", () => {
  let workspaceId;

  // We will create exactly ONE custom group and use its name for the UI verification later
  const createdGroupName = fake.firstName.replace(/[^A-Za-z]/g, "");

  before(() => {
    // External API Tests don't rely on UI sessions, so we fetch valid workspaces natively
    sendApiRequest("GET", "/ext/workspaces").then(({ body, status }) => {
      expect(status).to.eq(200);
      expect(body).to.be.an("array").that.is.not.empty;

      workspaceId = body[0].id;
    });
  });

  const groupsUrl = (id) => `/ext/workspace/${id}/groups`;


  it("Creating unique custom group name with valid permission and granular permission", () => {
    
    // 1. Creates groups with permission and granular permission
    sendApiRequest("POST", groupsUrl(workspaceId), {
      name: createdGroupName,
      permissions: { 
        appCreate: true,
        appDelete: true,
        workflowCreate: true,
        workflowDelete: true,
        folderCreate: true, 
        folderDelete: true,
        orgConstantCRUD: true,
        dataSourceCreate: true,
        dataSourceDelete: true,
        appPromote: true,
        appRelease: true 
      },
      granularPermissions: [
        { 
          type: "app", 
          applyToAll: true, 
          resources: [],
          permissions: { canEdit: true }
        },
        { 
          type: "data_source", 
          applyToAll: true, 
          resources: [],
          permissions: { canUse: true }
        },
        { 
          type: "workflow",  
          applyToAll: true, 
          resources: [],
          permissions: { canEdit: true }
        },
        { 
          type: "folder", 
          applyToAll: true, 
          resources: [],
          permissions: { canEditFolder: true, canEditApps: false, canViewApps: false }
        },
      ],
    }).then(({ status }) => {
      // Assuming no errors, this will strictly expect 201 for success
      // We ONLY create this single valid group in the entire suite!
      expect(status).to.eq(201); 
    });


    // 2. Creates only Permissions 
    sendApiRequest("POST", groupsUrl(workspaceId), {
      name: fake.lastName.replace(/[^A-Za-z]/g, ""),
      permissions: { 
        appCreate: true,
        appDelete: true,
        workflowCreate: true,
        workflowDelete: true,
        folderCreate: true, 
        folderDelete: true,
        orgConstantCRUD: true,
        dataSourceCreate: true,
        dataSourceDelete: true,
        appPromote: true,
        appRelease: true 
      }
    }).then(({ status }) => {
      expect(status).to.eq(201); 
    });


    // 3. Create Group with Multiple Granular Permissions in One Request
    sendApiRequest("POST", groupsUrl(workspaceId), {
      name: fake.companyName.replace(/[^A-Za-z]/g, ""),
      granularPermissions: [
        { 
          type: "app", 
          applyToAll: true, 
          resources: [],
          permissions: { canEdit: true }
        },
        { 
          type: "data_source", 
          applyToAll: true, 
          resources: [],
          permissions: { canUse: true }
        },
        { 
          type: "workflow",  
          applyToAll: true, 
          resources: [],
          permissions: { canEdit: true }
        },
        { 
          type: "folder", 
          applyToAll: true, 
          resources: [],
          permissions: { canEditFolder: true, canEditApps: false, canViewApps: false }
        },
        { 
          type: "app", 
          applyToAll: true, 
          resources: [],
          permissions: { canEdit: true }
        },
        { 
          type: "data_source", 
          applyToAll: true, 
          resources: [],
          permissions: { canUse: false }
        },
        { 
          type: "workflow",  
          applyToAll: true, 
          resources: [],
          permissions: { canEdit: true }
        },
        { 
          type: "folder", 
          applyToAll: true, 
          resources: [],
          permissions: { canEditFolder: false, canEditApps: false, canViewApps: true }
        }
      ],
    }).then(({ status }) => {
      expect(status).to.eq(201); 
    });

  });

  it("Validation Errors 400 for invalid cases", () => {

    // All invalid cases: what we send and what the API is expected to say back
    [
      {
        label: "Empty request body — name is required",
        body: {},
        expectedMessage: "name should not be empty",
      },
      {
        label: "Empty group name — name cannot be blank",
        body: { name: "" },
        expectedMessage: "name should not be empty",
      },
      {
        label: "Invalid characters in group name",
        body: { name: "!!!###@@@" },
        expectedMessage: "Group name can only contain letters, numbers, underscores, spaces and hyphens",
      },
      {
        label: "Missing type field in granular permission",
        body: {
          name: fake.firstName.replace(/[^A-Za-z]/g, ""),
          granularPermissions: [{ applyToAll: true, resources: [], permissions: { canEdit: true } }],
        },
        expectedMessage: "type must be one of the following values",
      },
      {
        label: "Invalid permission type value",
        body: {
          name: fake.firstName.replace(/[^A-Za-z]/g, ""),
          granularPermissions: [{ type: "invalid_resource", applyToAll: true, resources: [], permissions: { canEdit: true } }],
        },
        expectedMessage: "type must be one of the following values",
      },
      {
        label: "Missing permissions object in granular permission",
        body: {
          name: fake.firstName.replace(/[^A-Za-z]/g, ""),
          granularPermissions: [{ type: "app", applyToAll: true, resources: [] }],
        },
        expectedMessage: "permissions should not be empty",
      },
      {
        label: "Non-existing App ID with applyToAll false",
        body: {
          name: fake.firstName.replace(/[^A-Za-z]/g, ""),
          granularPermissions: [{ type: "app", applyToAll: false, resources: ["00000000-0000-0000-0000-000000000000"], permissions: { canEdit: true } }],
        },
        expectedMessage: "not found in workspace",
      },
      {
        label: "Non-existing Datasource ID with applyToAll false",
        body: {
          name: fake.firstName.replace(/[^A-Za-z]/g, ""),
          granularPermissions: [{ type: "data_source", applyToAll: false, resources: ["00000000-0000-0000-0000-000000000000"], permissions: { canUse: true } }],
        },
        expectedMessage: "not found in workspace",
      },
      {
        label: "Non-existing Workflow ID with applyToAll false",
        body: {
          name: fake.firstName.replace(/[^A-Za-z]/g, ""),
          granularPermissions: [{ type: "workflow", applyToAll: false, resources: ["00000000-0000-0000-0000-000000000000"], permissions: { canEdit: true } }],
        },
        expectedMessage: "not found in workspace",
      },
      {
        label: "Non-existing Folder ID with applyToAll false",
        body: {
          name: fake.firstName.replace(/[^A-Za-z]/g, ""),
          granularPermissions: [{ type: "folder", applyToAll: false, resources: ["00000000-0000-0000-0000-000000000000"], permissions: { canEditFolder: true, canEditApps: false, canViewApps: false } }],
        },
        expectedMessage: "not found in workspace",
      },
      {
        label: "Conflict: applyToAll true but resources provided",
        body: {
          name: fake.firstName.replace(/[^A-Za-z]/g, ""),
          granularPermissions: [{ type: "app", applyToAll: true, resources: ["00000000-0000-0000-0000-000000000000"], permissions: { canEdit: true } }],
        },
        expectedMessage: "resources must be empty when applyToAll is true",
      },
      {
        label: "Conflict: applyToAll false but resources list is empty",
        body: {
          name: fake.firstName.replace(/[^A-Za-z]/g, ""),
          granularPermissions: [{ type: "workflow", applyToAll: false, resources: [], permissions: { canEdit: true } }],
        },
        expectedMessage: "resources must not be empty when applyToAll is false",
      },
    ].forEach(({ label, body, expectedMessage }) => {
      sendApiRequest("POST", groupsUrl(workspaceId), body).then(({ status, body: resBody }) => {
        expect(status, `[${label}] expected status 400`).to.eq(400);
        expect(JSON.stringify(resBody), `[${label}] expected: "${expectedMessage}"`).to.include(expectedMessage);
      });
    });
  });
});