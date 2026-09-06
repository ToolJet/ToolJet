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
| app-crud | `cy.apiDeleteAllModules` | platform/platformApiCommands.js | delete every module in the workspace - teardown | `cy.apiDeleteAllModules()` |
| gitsync | `cy.gitSyncCheckAndConfigure` | platform/gitSyncCommands.js | ensure git-sync is configured for the workspace, configuring it if not | `cy.gitSyncCheckAndConfigure()` |
| gitsync | `cy.gitSyncGetBranchId` | platform/gitSyncCommands.js | resolve the internal id of a git-sync branch | `cy.gitSyncGetBranchId('main')` |
| gitsync | `cy.gitSyncCreateBranchViaApi` | platform/gitSyncCommands.js | create a git-sync branch through the API | `cy.gitSyncCreateBranchViaApi('feature-x')` |
| gitsync | `cy.gitSyncImportAppFromFixture` | platform/gitSyncCommands.js | import an app from a fixture into the current branch | `cy.gitSyncImportAppFromFixture('app.json')` |
| gitsync | `cy.gitSyncCreateBranchViaUI` | platform/gitSyncCommands.js | create a git-sync branch through the branch picker | `cy.gitSyncCreateBranchViaUI('feature-x')` |
| gitsync | `cy.gitSyncSwitchBranch` | platform/gitSyncCommands.js | switch the active git-sync branch | `cy.gitSyncSwitchBranch('main')` |
| gitsync | `cy.gitSyncDashboardPush` | platform/gitSyncCommands.js | push the current workspace state from the dashboard | `cy.gitSyncDashboardPush('commit message')` |
| wait | `cy.gitHubWaitForCommitsAhead` | platform/gitSyncCommands.js | wait until the branch is N commits ahead on GitHub | `cy.gitHubWaitForCommitsAhead('main', 1)` |
| gitsync | `cy.gitHubCreatePR` | platform/gitSyncCommands.js | open a pull request on GitHub | `cy.gitHubCreatePR('feature-x', 'main')` |
| gitsync | `cy.gitHubMergePR` | platform/gitSyncCommands.js | merge an open pull request on GitHub | `cy.gitHubMergePR(prNumber)` |
| gitsync | `cy.gitHubDeleteBranch` | platform/gitSyncCommands.js | delete a branch on GitHub - teardown | `cy.gitHubDeleteBranch('feature-x')` |
| gitsync | `cy.gitSyncGoToDashboard` | platform/gitSyncCommands.js | navigate to the dashboard with git-sync context intact | `cy.gitSyncGoToDashboard()` |
| app-crud | `cy.apiCreateModule` | platform/gitSyncCommands.js | create a module via the API | `cy.apiCreateModule('billing-widget')` |
| api | `cy.apiGetModuleCorrelationId` | platform/gitSyncCommands.js | resolve a module's correlation id | `cy.apiGetModuleCorrelationId(moduleId)` |
| app-crud | `cy.apiRenameModule` | platform/gitSyncCommands.js | rename a module via the API | `cy.apiRenameModule(moduleId, 'new-name')` |
| gitsync | `cy.apiCreateAppOnBranch` | platform/gitSyncCommands.js | create an app on a specific git-sync branch | `cy.apiCreateAppOnBranch('MyApp', 'feature-x')` |
| gitsync | `cy.apiGetAppIdByNameOnBranch` | platform/gitSyncCommands.js | resolve an app id by name within a branch | `cy.apiGetAppIdByNameOnBranch('MyApp', 'feature-x')` |
| gitsync | `cy.gitSyncOpenAppInBuilder` | platform/gitSyncAppCommands.js | open a git-synced app in the builder on a given branch | `cy.gitSyncOpenAppInBuilder('MyApp', 'main')` |
| gitsync | `cy.gitHubResetRepo` | platform/gitSyncAppCommands.js | reset the test repo: branches, tags and tree - teardown | `cy.gitHubResetRepo()` |
| app-crud | `cy.apiRenameApp` | platform/gitSyncAppCommands.js | rename an app via the API | `cy.apiRenameApp(appId, 'new-name')` |
| gitsync | `cy.apiListAppsOnBranch` | platform/gitSyncAppCommands.js | list the apps present on a branch | `cy.apiListAppsOnBranch('feature-x')` |
| gitsync | `cy.gitHubGetFileJson` | platform/gitSyncAppCommands.js | read and parse a JSON file from the GitHub repo | `cy.gitHubGetFileJson(path)` |
| gitsync | `cy.gitHubListAppPaths` | platform/gitSyncAppCommands.js | list the repo paths belonging to an app | `cy.gitHubListAppPaths('MyApp')` |
| gitsync | `cy.gitHubFetchAppData` | platform/gitSyncAppCommands.js | fetch an app's committed definition from GitHub | `cy.gitHubFetchAppData('MyApp')` |
| assertion | `cy.gitHubAssertAppMeta` | platform/gitSyncAppCommands.js | assert an app's metadata file in the repo | `cy.gitHubAssertAppMeta('MyApp', expected)` |
| assertion | `cy.gitHubAssertAppFolderExists` | platform/gitSyncAppCommands.js | assert the app folder exists in the repo | `cy.gitHubAssertAppFolderExists('MyApp')` |
| assertion | `cy.gitHubAssertAppFolderGone` | platform/gitSyncAppCommands.js | assert the app folder is absent from the repo | `cy.gitHubAssertAppFolderGone('MyApp')` |
| wait | `cy.gitHubWaitForCommitMessage` | platform/gitSyncAppCommands.js | wait for a commit with the given message to appear | `cy.gitHubWaitForCommitMessage('feat: x')` |
| api | `cy.apiGetAppDefinition` | platform/gitSyncAppCommands.js | fetch an app's full definition | `cy.apiGetAppDefinition(appId)` |
| assertion | `cy.gitHubValidateCommit` | platform/gitSyncAppCommands.js | validate the contents of the latest commit | `cy.gitHubValidateCommit(expected)` |
| assertion | `cy.gitHubAssertComponentLayout` | platform/gitSyncAppCommands.js | assert a component's layout as committed to the repo | `cy.gitHubAssertComponentLayout('MyApp', 'button1', layout)` |
| gitsync | `cy.apiGitSyncPush` | platform/gitSyncAppCommands.js | push the current app version to the branch | `cy.apiGitSyncPush(appId, 'commit message')` |
| api | `cy.apiUpdateComponentLayout` | platform/gitSyncAppCommands.js | move or resize a component via the API | `cy.apiUpdateComponentLayout(versionId, componentId, layout)` |
| api | `cy.apiUpdateDataSourceUrl` | platform/gitSyncAppCommands.js | change a datasource URL via the API | `cy.apiUpdateDataSourceUrl(dsId, url)` |
| api | `cy.apiGetEditingVersionId` | platform/gitSyncAppCommands.js | resolve the app's current editing version id | `cy.apiGetEditingVersionId(appId)` |
| gitsync | `cy.apiEditorPush` | platform/gitSyncAppCommands.js | push from the app editor context | `cy.apiEditorPush(appId, 'commit message')` |
| app-crud | `cy.apiCreateAppVersion` | platform/gitSyncAppCommands.js | create a new app version via the API | `cy.apiCreateAppVersion(appId, 'v2')` |
| gitsync | `cy.apiCreateGitTag` | platform/gitSyncAppCommands.js | create a git tag for an app version | `cy.apiCreateGitTag(appId, 'v1.0.0')` |
| gitsync | `cy.apiCreateGitTagExpectError` | platform/gitSyncAppCommands.js | attempt a git tag expecting a failure - negative cases | `cy.apiCreateGitTagExpectError(appId, 'bad tag', 400)` |
| assertion | `cy.apiCheckTagExists` | platform/gitSyncAppCommands.js | assert whether a git tag exists | `cy.apiCheckTagExists('v1.0.0')` |
| app-crud | `cy.apiRenameAppVersion` | platform/gitSyncAppCommands.js | rename an app version via the API | `cy.apiRenameAppVersion(versionId, 'v2')` |
| gitsync | `cy.gitHubGetTagInfo` | platform/gitSyncAppCommands.js | read tag metadata from GitHub | `cy.gitHubGetTagInfo('v1.0.0')` |
| wait | `cy.gitHubWaitForTagGone` | platform/gitSyncAppCommands.js | wait until a tag disappears from GitHub | `cy.gitHubWaitForTagGone('v1.0.0')` |
| gitsync | `cy.apiGitSyncPull` | platform/gitSyncAppCommands.js | pull the branch state into the workspace | `cy.apiGitSyncPull('main')` |
| gitsync | `cy.apiSwitchBranch` | platform/gitSyncAppCommands.js | switch the active branch via the API | `cy.apiSwitchBranch('feature-x')` |
| api | `cy.apiCreateQueryFolder` | platform/gitSyncAppCommands.js | create a query folder in an app version | `cy.apiCreateQueryFolder(versionId, 'folder')` |
| api | `cy.apiReorderFolderItem` | platform/gitSyncAppCommands.js | reorder an item inside a folder | `cy.apiReorderFolderItem(folderId, itemId, 1)` |
| api | `cy.apiDeleteQueryFolder` | platform/gitSyncAppCommands.js | delete a query folder | `cy.apiDeleteQueryFolder(folderId)` |
| api | `cy.apiCreatePage` | platform/gitSyncAppCommands.js | add a page to an app version | `cy.apiCreatePage(versionId, 'Reports')` |
| api | `cy.apiDeletePage` | platform/gitSyncAppCommands.js | delete a page from an app version | `cy.apiDeletePage(pageId)` |
| api | `cy.apiCreateQuery` | platform/gitSyncAppCommands.js | add a data query to an app version | `cy.apiCreateQuery(versionId, payload)` |
| api | `cy.apiDeleteQuery` | platform/gitSyncAppCommands.js | delete a data query | `cy.apiDeleteQuery(queryId)` |
| api | `cy.apiDeleteComponent` | platform/gitSyncAppCommands.js | delete a component from the canvas via the API | `cy.apiDeleteComponent(versionId, componentId)` |
| gitsync | `cy.gitHubMergePR` | platform/gitSyncAppCommands.js | merge an open pull request on GitHub | `cy.gitHubMergePR(prNumber)` |
| app-crud | `cy.apiAddAppToFolder` | platform/gitSyncAppCommands.js | move an app into a dashboard folder | `cy.apiAddAppToFolder(appId, folderId)` |
| assertion | `cy.gitHubAssertAppInFolder` | platform/gitSyncAppCommands.js | assert the repo reflects an app's folder placement | `cy.gitHubAssertAppInFolder('MyApp', 'QA folder')` |
| assertion | `cy.gitHubAssertAppMetaPath` | platform/gitSyncAppCommands.js | assert the metadata path for an app in the repo | `cy.gitHubAssertAppMetaPath('MyApp', path)` |
| app-crud | `cy.apiSaveAppVersion` | platform/gitSyncAppCommands.js | persist changes to an app version | `cy.apiSaveAppVersion(versionId, definition)` |
| wait | `cy.gitHubWaitForTag` | platform/gitSyncAppCommands.js | wait until a tag appears on GitHub | `cy.gitHubWaitForTag('v1.0.0')` |
| app-crud | `cy.apiEnsureAppDraft` | platform/gitSyncAppCommands.js | ensure the app has an editable draft version | `cy.apiEnsureAppDraft(appId)` |
