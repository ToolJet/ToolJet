# platform-command-index (AUTO-GENERATED — do not edit)

| category | command | file | when to use it | usage |
|---|---|---|---|---|
| auth | `cy.apiLogin` | platform/platformApiCommands.js | log in via the API and store the session cookie | `cy.apiLogin(email, password, workspaceId)` |
| auth | `cy.apiLogout` | platform/platformApiCommands.js | end the current API session | `cy.apiLogout()` |
| api | `cy.apiGetEnvironments` | platform/platformApiCommands.js | fetch the environments configured for a workspace | `cy.apiGetEnvironments(workspaceId)` |
| workspace | `cy.apiCreateWorkspace` | platform/platformApiCommands.js | create a workspace via the API and store its id | `cy.apiCreateWorkspace('QA workspace', 'qa-workspace')` |
| user | `cy.apiUserInvite` | platform/platformApiCommands.js | invite a user to the current workspace via the API | `cy.apiUserInvite('QA', userEmail)` |
| workspace | `cy.apiCreateWorkspaceConstant` | platform/platformApiCommands.js | create a workspace constant in one environment | `cy.apiCreateWorkspaceConstant('API_KEY', 'abc', 'production')` |
| workspace | `cy.apiUpdateWsConstant` | platform/platformApiCommands.js | update an existing workspace constant | `cy.apiUpdateWsConstant(constantId, 'newValue')` |
| group | `cy.apiGetGroupId` | platform/platformApiCommands.js | resolve a group id from its name | `cy.apiGetGroupId('QA Team')` |
| api | `cy.apiGetDatasourceIds` | platform/platformApiCommands.js | list datasource ids for the current workspace | `cy.apiGetDatasourceIds()` |
| api | `cy.apiGetAppIdByName` | platform/platformApiCommands.js | resolve an app id from its display name | `cy.apiGetAppIdByName('MyApp')` |
| user | `cy.apiGetUserDetails` | platform/platformApiCommands.js | fetch a user record by email | `cy.apiGetUserDetails(userEmail)` |
| user | `cy.apiUpdateUserRole` | platform/platformApiCommands.js | change a user's workspace role | `cy.apiUpdateUserRole(userEmail, 'builder')` |
| user | `cy.apiUpdateSuperAdmin` | platform/platformApiCommands.js | grant or revoke instance super-admin | `cy.apiUpdateSuperAdmin(userEmail, true)` |
| group | `cy.apiCreateGranularPermission` | platform/platformApiCommands.js | create a granular permission on a group | `cy.apiCreateGranularPermission(groupId, payload)` |
| group | `cy.apiDeleteGranularPermission` | platform/platformApiCommands.js | delete a granular permission from a group | `cy.apiDeleteGranularPermission(permissionId)` |
| app-crud | `cy.apiDeleteAllApps` | platform/platformApiCommands.js | delete every app in the workspace - teardown | `cy.apiDeleteAllApps()` |
| sso | `cy.apiUpdateSSOConfig` | platform/platformApiCommands.js | update a workspace or instance SSO configuration | `cy.apiUpdateSSOConfig(orgId, 'google', config)` |
| sso | `cy.getSsoConfigId` | platform/platformApiCommands.js | resolve the config id for an SSO provider | `cy.getSsoConfigId('google')` |
| sso | `cy.getOktaAuthorizationCode` | platform/platformApiCommands.js | obtain an Okta authorization code for OIDC login | `cy.getOktaAuthorizationCode()` |
| sso | `cy.exchangeCodeForTokens` | platform/platformApiCommands.js | exchange an OIDC authorization code for tokens | `cy.exchangeCodeForTokens(code)` |
| auth | `cy.oidcLogin` | platform/platformApiCommands.js | complete an OIDC login without driving the IdP UI | `cy.oidcLogin()` |
| user | `cy.apiUpdateProfile` | platform/platformApiCommands.js | update the signed-in user's first and last name | `cy.apiUpdateProfile('The', 'Developer')` |
| sso | `cy.apiUpdateAllowSignUp` | platform/platformApiCommands.js | toggle open signup for a workspace or the instance | `cy.apiUpdateAllowSignUp(true)` |
| sso | `cy.apiUpdateAutoSSO` | platform/platformApiCommands.js | toggle automatic SSO redirect | `cy.apiUpdateAutoSSO(false)` |
| user | `cy.apiFullUserOnboarding` | platform/platformApiCommands.js | create a user and complete onboarding in one call - the standard test-user setup | `cy.apiFullUserOnboarding('QA', userEmail, 'QA workspace')` |
| auth | `cy.apiLoginByGoogle` | platform/platformApiCommands.js | log in through the Google SSO path via the API | `cy.apiLoginByGoogle(userEmail)` |
| app-crud | `cy.apiCreateFolder` | platform/platformApiCommands.js | create a dashboard folder | `cy.apiCreateFolder('QA folder')` |
| app-crud | `cy.apiDeleteFolder` | platform/platformApiCommands.js | delete a dashboard folder | `cy.apiDeleteFolder(folderId)` |
| group | `cy.apiUpdateGroupPermission` | platform/platformApiCommands.js | set the permission flags on a group | `cy.apiUpdateGroupPermission(groupId, { appCreate: true })` |
| group | `cy.apiUpdateEnvironmentPermission` | platform/platformApiCommands.js | set per-environment access for a group | `cy.apiUpdateEnvironmentPermission(groupId, envIds)` |
| api | `cy.getAuthHeaders` | platform/platformApiCommands.js | yield the auth headers for a raw cy.request call | `cy.getAuthHeaders().then((headers) => { ... })` |
| user | `cy.getUserIdByEmail` | platform/platformApiCommands.js | resolve a user id from an email address | `cy.getUserIdByEmail(userEmail)` |
| user | `cy.apiBulkUploadUsers` | platform/platformApiCommands.js | upload a users CSV via the API | `cy.apiBulkUploadUsers(csvPath)` |
| license | `cy.apiUpdateLicense` | platform/platformApiCommands.js | apply a licence key to the instance | `cy.apiUpdateLicense(licenseKey)` |
| workspace | `cy.apiArchiveWorkspace` | platform/platformApiCommands.js | archive a workspace - teardown | `cy.apiArchiveWorkspace(workspaceId)` |
| api | `cy.apiConfigureSmtp` | platform/platformApiCommands.js | configure instance SMTP settings | `cy.apiConfigureSmtp(config)` |
| workspace | `cy.apiGetWorkspaceIDs` | platform/platformApiCommands.js | list every workspace id on the instance | `cy.apiGetWorkspaceIDs()` |
| api | `cy.apiUpdateWhiteLabeling` | platform/platformApiCommands.js | set instance white-label values | `cy.apiUpdateWhiteLabeling({ logo, favicon })` |
| workspace | `cy.apiDeleteAllWorkspaces` | platform/platformApiCommands.js | archive every non-default workspace - teardown | `cy.apiDeleteAllWorkspaces()` |
| workspace | `cy.apiGetDefaultWorkspace` | platform/platformApiCommands.js | resolve the instance default workspace | `cy.apiGetDefaultWorkspace()` |
| license | `cy.apiUpdateLLMKey` | platform/platformApiCommands.js | set the LLM API key used by AI features | `cy.apiUpdateLLMKey(key)` |
