# platform-helper-index (AUTO-GENERATED — do not edit)

| entity.op | helper | file | block | usage |
|---|---|---|---|---|
| oidcSso.verifyPage | `oidcSSOPageElements` | platform/eeCommon.js | onboarding | `oidcSSOPageElements()` |
| datasourcePermission.reset | `resetDsPermissions` | platform/eeCommon.js | access | `resetDsPermissions()` |
| datasourcePermission.deleteAssigned | `deleteAssignedDatasources` | platform/eeCommon.js | access | `deleteAssignedDatasources()` |
| user.signUp | `userSignUp` | platform/eeCommon.js | onboarding | `userSignUp('QA User', userEmail, 'QA workspace')` |
| instanceSetting.allowPersonalWorkspace | `allowPersonalWorkspace` | platform/eeCommon.js | superAdmin | `allowPersonalWorkspace(true)` |
| user.createEE | `addNewUserEE` | platform/eeCommon.js | onboarding | `addNewUserEE('QA', userEmail)` |
| user.invite | `inviteUser` | platform/eeCommon.js | onboarding | `inviteUser('QA', userEmail)` |
| workspace.goToDefault | `defaultWorkspace` | platform/eeCommon.js | workspace | `defaultWorkspace()` |
| instanceSetting.disablePersonalWorkspace | `trunOffAllowPersonalWorkspace` | platform/eeCommon.js | superAdmin | `trunOffAllowPersonalWorkspace()` |
| sso.verifySignUpPage | `verifySSOSignUpPageElements` | platform/eeCommon.js | onboarding | `verifySSOSignUpPageElements()` |
| workspaceInvite.verifyPage | `VerifyWorkspaceInvitePageElements` | platform/eeCommon.js | onboarding | `VerifyWorkspaceInvitePageElements()` |
| workspaceInvite.openLink | `WorkspaceInvitationLink` | platform/eeCommon.js | onboarding | `WorkspaceInvitationLink(userEmail)` |
| sso.enableDefault | `enableDefaultSSO` | platform/eeCommon.js | onboarding | `enableDefaultSSO()` |
| sso.disable | `disableSSO` | platform/eeCommon.js | onboarding | `disableSSO(ssoSelector, toggleSelector)` |
| datasourcePermission.assign | `AddDataSourceToGroup` | platform/eeCommon.js | access | `AddDataSourceToGroup('QA Team', 'Postgres')` |
| - | `enableToggle` | platform/eeCommon.js | common | `enableToggle(toggleSelector)` |
| - | `disableToggle` | platform/eeCommon.js | common | `disableToggle(toggleSelector)` |
| appVersion.verifyPromoteModal | `verifyPromoteModalUI` | platform/eeCommon.js | workspace | `verifyPromoteModalUI('v1', 'development', 'staging')` |
| user.resetPassword | `resetPassword` | platform/eeCommon.js | onboarding | `resetPassword(userEmail)` |
| - | `verifyTooltipDisabled` | platform/eeCommon.js | common | `verifyTooltipDisabled(selector, 'You do not have permission')` |
| app.createWithSlug | `createAnAppWithSlug` | platform/eeCommon.js | apps | `createAnAppWithSlug('MyApp', 'my-app')` |
| instanceSetting.open | `openInstanceSettings` | platform/eeCommon.js | superAdmin | `openInstanceSettings()` |
| user.openRowMenu | `openUserActionMenu` | platform/eeCommon.js | access | `openUserActionMenu(userEmail)` |
| workspace.archive | `archiveWorkspace` | platform/eeCommon.js | workspace | `archiveWorkspace('QA workspace')` |
| instanceSetting.passwordToggle | `passwordToggle` | platform/eeCommon.js | superAdmin | `passwordToggle(true, 'instance')` |
| instanceSetting.ssoConfig | `InstanceSSO` | platform/eeCommon.js | superAdmin | `InstanceSSO(true, true, true)` |
| instanceSetting.resetDomain | `resetInstanceDomain` | platform/eeCommon.js | superAdmin | `resetInstanceDomain()` |
| instanceSetting.defaultSso | `defaultInstanceSSO` | platform/eeCommon.js | superAdmin | `defaultInstanceSSO(true)` |
| instanceSetting.ssoAllow | `instanceSSOConfig` | platform/eeCommon.js | superAdmin | `instanceSSOConfig(true)` |
| instanceSetting.update | `updateInstanceSettings` | platform/eeCommon.js | superAdmin | `updateInstanceSettings('ALLOWED_DOMAINS', 'tooljet.com')` |
| instanceSetting.autoSso | `updateAutoSSOToggle` | platform/eeCommon.js | superAdmin | `updateAutoSSOToggle(false)` |
| app.verifyPreviewDisabled | `verifyPreviewIsDisabled` | platform/eeCommon.js | apps | `verifyPreviewIsDisabled()` |
| groupRole.verifyAdminHelper | `verifyAdminHelperText` | platform/groupsUI.js | access | `verifyAdminHelperText(0)` |
| userRole.verifyEditModal | `verifyEditUserRoleModal` | platform/groupsUI.js | access | `verifyEditUserRoleModal(userEmail)` |
| groupPermission.toggleAll | `toggleAllPermissions` | platform/groupsUI.js | access | `toggleAllPermissions(['uncheck','check'])` |
| group.verifyDeleteModal | `verifyDeleteConfirmationModal` | platform/groupsUI.js | access | `verifyDeleteConfirmationModal()` |
| granularPermission.verifyEnvState | `verifyEnvironmentSelectionStateInModal` | platform/groupsUI.js | access | `verifyEnvironmentSelectionStateInModal(role, userType, envs)` |
| granularPermission.selectEnvs | `selectEnvironments` | platform/groupsUI.js | access | `selectEnvironments(['development','production'])` |
| granularPermission.verifyEditModal | `verifyGranularEditModal` | platform/groupsUI.js | access | `verifyGranularEditModal(role, userType)` |
| granularPermission.verifyAddModal | `verifyGranularAddModal` | platform/groupsUI.js | access | `verifyGranularAddModal(role)` |
| groupRole.verifyEnduserHelper | `verifyEnduserHelperText` | platform/groupsUI.js | access | `verifyEnduserHelperText(0)` |
| granularPermission.verifyModalUI | `verifyGranularPermissionModalUI` | platform/groupsUI.js | access | `verifyGranularPermissionModalUI(...)` |
| granularPermission.verifyModalStates | `verifyGranularPermissionModalStates` | platform/groupsUI.js | access | `verifyGranularPermissionModalStates(...)` |
| group.verifyEmptyStates | `verifyEmptyStates` | platform/groupsUI.js | access | `verifyEmptyStates()` |
| group.verifyLinks | `verifyGroupLinks` | platform/groupsUI.js | access | `verifyGroupLinks()` |
| group.verifyCommon | `commonGroupVerification` | platform/groupsUI.js | access | `commonGroupVerification()` |
| - | `permissions` | platform/groupsUI.js | access | `permissions   // permission-matrix fixture data` |
| groupPermission.verifyStates | `verifyCheckPermissionStates` | platform/groupsUI.js | access | `verifyCheckPermissionStates('admin', 'check')` |
| groupPermission.verifyLabels | `verifyPermissionCheckBoxLabelsAndHelperTexts` | platform/groupsUI.js | access | `verifyPermissionCheckBoxLabelsAndHelperTexts()` |
| granularPermission.verifyEnvTags | `verifyEnvironmentsTags` | platform/groupsUI.js | access | `verifyEnvironmentsTags(selector, role, userType, expectedEnvs)` |
| granularPermission.verifyByRole | `verifyGranularAccessByRole` | platform/groupsUI.js | access | `verifyGranularAccessByRole('builder')` |
| - | `permissionModal` | platform/groupsUI.js | access | `permissionModal()   // selector/text bundle for the permission modal` |
| groupUser.verifyRow | `verifyUserRow` | platform/groupsUI.js | access | `verifyUserRow('QA User', userEmail)` |
| granularPermission.verifyEmptyState | `granularPermissionEmptyState` | platform/groupsUI.js | access | `granularPermissionEmptyState()` |
| customGroup.create | `createGroupViaUI` | platform/customGroups.js | access | `createGroupViaUI('QA Team')` |
| customGroup.verifyInList | `verifyGroupCreatedInSidebar` | platform/customGroups.js | access | `verifyGroupCreatedInSidebar('QA Team')` |
| customGroup.rename | `renameGroupViaUI` | platform/customGroups.js | access | `renameGroupViaUI('QA Team', 'QA Team v2')` |
| customGroup.delete | `deleteGroupViaUI` | platform/customGroups.js | access | `deleteGroupViaUI('QA Team')` |
| customGroup.verifyAbsent | `verifyGroupRemovedFromSidebar` | platform/customGroups.js | access | `verifyGroupRemovedFromSidebar('QA Team')` |
| granularPermission.create | `addGranularPermissionViaUI` | platform/customGroups.js | access | `addGranularPermissionViaUI('Apps access', { resource: 'apps' })` |
| customGroup.switchScope | `switchBetweenAllAndCustom` | platform/customGroups.js | access | `switchBetweenAllAndCustom('custom')` |
| customGroup.openRowMenu | `openGroupThreeDotMenu` | platform/customGroups.js | access | `openGroupThreeDotMenu('QA Team')` |
| customGroup.verifyDuplicateModal | `verifyDuplicateModal` | platform/customGroups.js | access | `verifyDuplicateModal('QA Team')` |
| instanceUser.list | `openAllUsersPage` | platform/allUsers.js | superAdmin | `openAllUsersPage()` |
| instanceUser.verifyHeader | `verifyAllUsersHeaderUI` | platform/allUsers.js | superAdmin | `verifyAllUsersHeaderUI()` |
| instanceUser.verifyControls | `verifyTableControls` | platform/allUsers.js | superAdmin | `verifyTableControls()` |
| instanceUser.verifyFilters | `verifyUsersFilterOptions` | platform/allUsers.js | superAdmin | `verifyUsersFilterOptions()` |
| instanceUser.verifyRow | `verifyUserRow` | platform/allUsers.js | superAdmin | `verifyUserRow(email, name, status)` |
| instanceUser.openResetPassword | `openResetPasswordModal` | platform/allUsers.js | superAdmin | `openResetPasswordModal()` |
| instanceUser.verifyResetPasswordModal | `verifyResetPasswordModalUI` | platform/allUsers.js | superAdmin | `verifyResetPasswordModalUI(userEmail)` |
| instanceUser.verifyRowMenu | `verifyUserActionMenu` | platform/allUsers.js | superAdmin | `verifyUserActionMenu(userEmail)` |
| instanceUser.openArchiveModal | `openArchiveUserModal` | platform/allUsers.js | superAdmin | `openArchiveUserModal('QA User')` |
| instanceUser.verifyArchiveModal | `verifyArchiveUserModalUI` | platform/allUsers.js | superAdmin | `verifyArchiveUserModalUI('QA User', userEmail)` |
| instanceUser.openEditModal | `openEditUserModal` | platform/allUsers.js | superAdmin | `openEditUserModal(userEmail)` |
| instanceUser.updateName | `updateUserNameAndVerifyChanges` | platform/allUsers.js | superAdmin | `updateUserNameAndVerifyChanges({ email, firstName, lastName })` |
| instanceUser.unarchive | `verifyUnarchiveUserModal` | platform/allUsers.js | superAdmin | `verifyUnarchiveUserModal('QA User', userEmail)` |
| session.loginAs | `loginAsUser` | platform/allUsers.js | onboarding | `loginAsUser(userEmail)` |
| session.loginExpectToast | `loginAndExpectToast` | platform/allUsers.js | onboarding | `loginAndExpectToast(userEmail, 'Invalid credentials')` |
| instanceUser.visitAs | `visitAllUsersPage` | platform/allUsers.js | superAdmin | `visitAllUsersPage(adminEmail)` |
| instanceWorkspace.list | `openAllWorkspaces` | platform/allWorkspace.js | superAdmin | `openAllWorkspaces()` |
| instanceWorkspace.verifyHeader | `verifyWorkspacePageHeader` | platform/allWorkspace.js | superAdmin | `verifyWorkspacePageHeader()` |
| instanceWorkspace.verifyControls | `verifyWorkspaceTableControls` | platform/allWorkspace.js | superAdmin | `verifyWorkspaceTableControls()` |
| instanceWorkspace.verifyRow | `verifyWorkspaceRow` | platform/allWorkspace.js | superAdmin | `verifyWorkspaceRow('QA workspace', true)` |
| instanceWorkspace.verifyDropdown | `verifyWorkspaceSelectDropdown` | platform/allWorkspace.js | superAdmin | `verifyWorkspaceSelectDropdown('QA workspace')` |
| instanceWorkspace.verifyTabs | `verifyWorkspaceTabs` | platform/allWorkspace.js | superAdmin | `verifyWorkspaceTabs()` |
| instanceWorkspace.verifyRowTags | `verifyWorkspaceRowTags` | platform/allWorkspace.js | superAdmin | `verifyWorkspaceRowTags('QA workspace')` |
| instanceWorkspace.openArchiveModal | `openArchiveWorkspaceModal` | platform/allWorkspace.js | superAdmin | `openArchiveWorkspaceModal('QA workspace')` |
| instanceWorkspace.verifyArchiveModal | `verifyArchiveWorkspaceModalUI` | platform/allWorkspace.js | superAdmin | `verifyArchiveWorkspaceModalUI('QA workspace')` |
| instanceWorkspace.unarchive | `verifyUnarchiveWorkspaceModalUI` | platform/allWorkspace.js | superAdmin | `verifyUnarchiveWorkspaceModalUI('QA workspace')` |
| instanceWorkspace.verifyOpenTooltip | `verifyOpenWorkspaceTooltip` | platform/allWorkspace.js | superAdmin | `verifyOpenWorkspaceTooltip('QA workspace')` |
| instanceWorkspace.search | `searchWorkspace` | platform/allWorkspace.js | superAdmin | `searchWorkspace('QA workspace')` |
| instanceWorkspace.verifyDefaultTooltip | `verifyDefaultWorkspaceTooltip` | platform/allWorkspace.js | superAdmin | `verifyDefaultWorkspaceTooltip()` |
| appVersion.promote | `promoteApp` | platform/multiEnv.js | workspace | `promoteApp()` |
| appVersion.release | `releaseApp` | platform/multiEnv.js | workspace | `releaseApp()` |
| app.launch | `launchApp` | platform/multiEnv.js | apps | `launchApp()` |
| appVersion.createFromDraft | `createVersionFromDraft` | platform/multiEnv.js | workspace | `createVersionFromDraft('v2')` |
| environment.promote | `promoteEnv` | platform/multiEnv.js | workspace | `promoteEnv('development')` |
| appVersion.promoteTo | `appPromote` | platform/multiEnv.js | workspace | `appPromote('development', 'staging')` |
| appVersion.create | `createNewVersion` | platform/multiEnv.js | workspace | `createNewVersion('v2', [], 'v1')` |
| appVersion.select | `selectVersion` | platform/multiEnv.js | workspace | `selectVersion('v2')` |
| environment.select | `selectEnv` | platform/multiEnv.js | workspace | `selectEnv('production')` |
| datasource.setupPostgres | `setupPostgreSQLDataSource` | platform/multiEnv.js | workspace | `setupPostgreSQLDataSource(...)` |
| app.createWithComponents | `createAppWithComponents` | platform/multiEnv.js | apps | `createAppWithComponents(...)` |
| environment.verifyData | `verifyEnvironmentData` | platform/multiEnv.js | workspace | `verifyEnvironmentData(dbValue, queryValue)` |
| environment.selectByName | `selectEnvironment` | platform/multiEnv.js | workspace | `selectEnvironment('staging')` |
| app.releaseAndVisit | `releaseAndVisitApp` | platform/multiEnv.js | apps | `releaseAndVisitApp('my-app')` |
| environment.verifyQueryEditorDisabled | `verifyQueryEditorDisabled` | platform/multiEnv.js | workspace | `verifyQueryEditorDisabled()` |
| environment.verifyGlobalSettingsDisabled | `verifyGlobalSettingsDisabled` | platform/multiEnv.js | workspace | `verifyGlobalSettingsDisabled()` |
| environment.verifyInspectorNoDelete | `verifyInspectorMenuHasNoDeleteOption` | platform/multiEnv.js | workspace | `verifyInspectorMenuHasNoDeleteOption()` |
| environment.verifyComponentsManagerDisabled | `verifyComponentsManagerDisabled` | platform/multiEnv.js | workspace | `verifyComponentsManagerDisabled()` |
| environment.verifyPageSettingsDisabled | `verifyPageSettingsDisabled` | platform/multiEnv.js | workspace | `verifyPageSettingsDisabled()` |
| environment.verifyComponentInspectorDisabled | `verifyComponentInspectorDisabled` | platform/multiEnv.js | workspace | `verifyComponentInspectorDisabled()` |
| workspaceConstant.setup | `setupWorkspaceConstant` | platform/multiEnv.js | workspace | `setupWorkspaceConstant(...)` |
| smtpSettings.open | `openSMTPSettings` | platform/smtp.js | superAdmin | `openSMTPSettings()` |
| - | `verifyLabel` | platform/smtp.js | common | `verifyLabel('Host')` |
| - | `verifyInputPlaceholder` | platform/smtp.js | common | `verifyInputPlaceholder(smtpSelectors.smtpHostInput, 'smtp.example.com')` |
| smtpSettings.verifyUI | `verifySmtpSettingsUI` | platform/smtp.js | superAdmin | `verifySmtpSettingsUI()` |
| llmKey.open | `navigateToLlmKeyPage` | platform/ai.js | licensing | `navigateToLlmKeyPage()` |
| llmKey.verifyEnvToggle | `verifyEnvToggleState` | platform/ai.js | licensing | `verifyEnvToggleState(true)` |
| llmKey.save | `enterAndSaveApiKey` | platform/ai.js | licensing | `enterAndSaveApiKey('sk-...')` |
| llmKey.verifyInputDisabled | `verifyKeyInputDisabled` | platform/ai.js | licensing | `verifyKeyInputDisabled()` |
| llmKey.verifyInputEnabled | `verifyKeyInputEnabled` | platform/ai.js | licensing | `verifyKeyInputEnabled()` |
| llmKey.verifySaveDisabled | `verifySaveButtonDisabled` | platform/ai.js | licensing | `verifySaveButtonDisabled()` |
| llmKey.verifyMasked | `verifyKeyMasked` | platform/ai.js | licensing | `verifyKeyMasked()` |
| aiCredits.verifyNoCreditUI | `verifyNoCreditUI` | platform/ai.js | licensing | `verifyNoCreditUI()` |
| aiCredits.verifySectionAbsent | `verifyNoAiCreditSection` | platform/ai.js | licensing | `verifyNoAiCreditSection()` |
| aiChat.open | `openAiChat` | platform/ai.js | licensing | `openAiChat()` |
| aiChat.send | `sendAiChatMessage` | platform/ai.js | licensing | `sendAiChatMessage('Create a button')` |
| aiChat.verifyResponse | `verifyAiChatResponse` | platform/ai.js | licensing | `verifyAiChatResponse()` |
| llmKey.ensureEnvToggleOff | `ensureEnvToggleOff` | platform/ai.js | licensing | `ensureEnvToggleOff()` |
| aiChat.verifyWithCredits | `verifyAiChatWorksWithCredits` | platform/ai.js | licensing | `verifyAiChatWorksWithCredits('MyApp')` |
| aiChat.verifyWithoutCredits | `verifyAiChatWorksWithoutCredits` | platform/ai.js | licensing | `verifyAiChatWorksWithoutCredits('MyApp')` |
| llmKey.verifyRequiredInApp | `verifyApiKeyRequiredInApp` | platform/ai.js | licensing | `verifyApiKeyRequiredInApp('MyApp')` |
| copilot.verifyInQueryPanel | `verifyCopilotInQueryPanel` | platform/ai.js | licensing | `verifyCopilotInQueryPanel('MyApp')` |
| fixWithAi.verifyInStyles | `verifyFixWithAiInStyles` | platform/ai.js | licensing | `verifyFixWithAiInStyles('MyApp')` |
| profile.update | `apiUpdateProfile` | platform/apiUtils/commonApi.js | workspace | `apiUpdateProfile('The', 'Developer')` |
| workspaceConstant.listApi | `getAllConstants` | platform/apiUtils/apiWSConstants.js | workspace | `getAllConstants()` |
| workspaceConstant.listWithCountApi | `getAllConstantsWithCount` | platform/apiUtils/apiWSConstants.js | workspace | `getAllConstantsWithCount()` |
| workspaceConstant.findApi | `findConstantByName` | platform/apiUtils/apiWSConstants.js | workspace | `findConstantByName('API_KEY')` |
| workspaceConstant.deleteApi | `deleteConstantFromEnvironment` | platform/apiUtils/apiWSConstants.js | workspace | `deleteConstantFromEnvironment(id, envId, name, type, envName)` |
| workspaceConstant.deleteByNameApi | `deleteConstantFromEnvironmentByName` | platform/apiUtils/apiWSConstants.js | workspace | `deleteConstantFromEnvironmentByName('API_KEY', 'production')` |
| workspaceConstant.deleteAllEnvsApi | `deleteConstantFromAllEnvironmentsByName` | platform/apiUtils/apiWSConstants.js | workspace | `deleteConstantFromAllEnvironmentsByName('API_KEY')` |
| workspaceConstant.deleteAllApi | `deleteAllUIConstants` | platform/apiUtils/apiWSConstants.js | workspace | `deleteAllUIConstants()` |
| appSlug.verifyValidations | `verifySlugValidations` | apps.js | apps | `verifySlugValidations(inputSelector)` |
| appSlug.verifyUpdate | `verifySuccessfulSlugUpdate` | apps.js | apps | `verifySuccessfulSlugUpdate(workspaceId, 'my-app')` |
| appSlug.verifyUrls | `verifyURLs` | apps.js | apps | `verifyURLs(workspaceId, 'my-app', 'home')` |
| appSlug.set | `setUpSlug` | apps.js | apps | `setUpSlug('my-app')` |
| app.createWithSlug | `setupAppWithSlug` | apps.js | apps | `setupAppWithSlug(appName, slug)` |
| app.verifyRestrictedAccess | `verifyRestrictedAccess` | apps.js | apps | `verifyRestrictedAccess()` |
| user.onboardFromAppLink | `onboardUserFromAppLink` | apps.js | onboarding | `onboardUserFromAppLink(...)` |
| - | `resolveHost` | apps.js | common | `resolveHost()` |
| nav.profile | `navigateToProfile` | common.js | common | `navigateToProfile()` |
| session.logout | `logout` | common.js | common | `logout()` |
| nav.manageUsers | `navigateToManageUsers` | common.js | common | `navigateToManageUsers()` |
| nav.manageGroups | `navigateToManageGroups` | common.js | common | `navigateToManageGroups()` |
| nav.workspaceVariable | `navigateToWorkspaceVariable` | common.js | common | `navigateToWorkspaceVariable()` |
| nav.manageSSO | `navigateToManageSSO` | common.js | common | `navigateToManageSSO()` |
| - | `randomDateOrTime` | common.js | common | `randomDateOrTime('DD/MM/YYYY')` |
| folder.create | `createFolder` | common.js | apps | `createFolder('QA folder')` |
| folder.delete | `deleteFolder` | common.js | apps | `deleteFolder('QA folder')` |
| - | `deleteDownloadsFolder` | common.js | common | `deleteDownloadsFolder()` |
| app.openEditor | `navigateToAppEditor` | common.js | apps | `navigateToAppEditor('MyApp')` |
| app.openCardMenu | `viewAppCardOptions` | common.js | apps | `viewAppCardOptions('MyApp')` |
| folder.openCardMenu | `viewFolderCardOptions` | common.js | apps | `viewFolderCardOptions('QA folder')` |
| modal.verify | `verifyModal` | common.js | common | `verifyModal('Create app', 'Create', inputSelector)` |
| modal.verifyConfirmation | `verifyConfirmationModal` | common.js | common | `verifyConfirmationModal('Are you sure?')` |
| modal.close | `closeModal` | common.js | common | `closeModal('Cancel')` |
| modal.cancel | `cancelModal` | common.js | common | `cancelModal('Cancel')` |
| nav.auditLogs | `navigateToAuditLogsPage` | common.js | common | `navigateToAuditLogsPage()` |
| user.paginate | `manageUsersPagination` | common.js | access | `manageUsersPagination(userEmail)` |
| user.search | `searchUser` | common.js | access | `searchUser(userEmail)` |
| app.selectCardOption | `selectAppCardOption` | common.js | apps | `selectAppCardOption('MyApp', 'Rename')` |
| nav.database | `navigateToDatabase` | common.js | common | `navigateToDatabase()` |
| - | `randomValue` | common.js | common | `randomValue()` |
| - | `verifyTooltip` | common.js | common | `verifyTooltip(selector, 'Copy')` |
| inspector.pin | `pinInspector` | common.js | apps | `pinInspector()` |
| nav.workspaceConstants | `navigateToworkspaceConstants` | common.js | workspace | `navigateToworkspaceConstants()` |
| app.release | `releaseApp` | common.js | apps | `releaseApp()` |
| - | `verifyTooltipDisabled` | common.js | common | `verifyTooltipDisabled(selector, 'No permission')` |
| - | `fillInputField` | common.js | common | `fillInputField(data)` |
| nav.settings | `navigateToSettingPage` | common.js | common | `navigateToSettingPage()` |
| instanceSetting.updateApi | `apiUpdateInstanceSettings` | common.js | superAdmin | `apiUpdateInstanceSettings(variables)` |
| - | `sanitize` | common.js | common | `sanitize(str)` |
| app.changeIcon | `modifyAndVerifyAppCardIcon` | dashboard.js | apps | `modifyAndVerifyAppCardIcon('MyApp')` |
| app.verifyDeleted | `verifyAppDelete` | dashboard.js | apps | `verifyAppDelete('MyApp')` |
| app.verifyExportModal | `verifyElementsOfExportModal` | exportImport.js | apps | `verifyElementsOfExportModal(...)` |
| appVersion.create | `createNewVersion` | exportImport.js | apps | `createNewVersion([], 'v1')` |
| app.export | `clickOnExportButtonAndVerify` | exportImport.js | apps | `clickOnExportButtonAndVerify('Export selected version', 'MyApp')` |
| app.exportAllVersions | `exportAllVersionsAndVerify` | exportImport.js | apps | `exportAllVersionsAndVerify(...)` |
| app.import | `importAndVerifyApp` | exportImport.js | apps | `importAndVerifyApp('cypress/fixtures/app.json', 'App imported successfully')` |
| app.verifyImportModal | `verifyImportModalElements` | exportImport.js | apps | `verifyImportModalElements('MyApp')` |
| datasource.setupWithConstants | `setupDataSourceWithConstants` | exportImport.js | workspace | `setupDataSourceWithConstants(...)` |
| app.validateExportStructure | `validateExportedAppStructure` | exportImport.js | apps | `validateExportedAppStructure(...)` |
| - | `apiRequest` | externalApi.js | externalApi | `apiRequest('GET', '/api/ext/users')` |
| extUser.create | `createUser` | externalApi.js | externalApi | `createUser(userData)` |
| extUser.get | `getUser` | externalApi.js | externalApi | `getUser(userId)` |
| extUser.list | `getAllUsers` | externalApi.js | externalApi | `getAllUsers()` |
| extUser.update | `updateUser` | externalApi.js | externalApi | `updateUser(userId, userData)` |
| extUser.updateRole | `updateUserRole` | externalApi.js | externalApi | `updateUserRole(workspaceId, userData)` |
| extUser.replaceWorkspace | `replaceUserWorkspace` | externalApi.js | externalApi | `replaceUserWorkspace(userId, workspaceId, userData)` |
| extUser.replaceWorkspaceRelations | `replaceUserWorkspacesRelations` | externalApi.js | externalApi | `replaceUserWorkspacesRelations(userId, userData)` |
| extWorkspace.list | `getAllWorkspaces` | externalApi.js | externalApi | `getAllWorkspaces()` |
| extApp.import | `importApp` | externalApi.js | externalApi | `importApp(workspaceId, appData, headers)` |
| extApp.export | `exportApp` | externalApi.js | externalApi | `exportApp(workspaceId, appId, endpoint, headers)` |
| extApp.listAll | `allAppsDetails` | externalApi.js | externalApi | `allAppsDetails(workspaceIds)` |
| extApp.listByWorkspace | `fetchWorkspaceApps` | externalApi.js | externalApi | `fetchWorkspaceApps(workspaceId, authToken)` |
| extGroup.create | `createGroup` | externalApi.js | externalApi | `createGroup('QA Team')` |
| extUser.verifyGroups | `verifyUserInGroups` | externalApi.js | externalApi | `verifyUserInGroups(userEmail, ['QA Team'], true)` |
| license.getExpiry | `getLicenseExpiryDate` | license.js | licensing | `getLicenseExpiryDate()` |
| license.switchTab | `switchTabs` | license.js | licensing | `switchTabs('Access')` |
| license.verifyTab | `verifyLicenseTab` | license.js | licensing | `verifyLicenseTab()` |
| license.verifyLimitsTab | `verifySubTabsAndStoreCurrentLimits` | license.js | licensing | `verifySubTabsAndStoreCurrentLimits(...)` |
| license.verifyAccessTab | `verifyAccessTab` | license.js | licensing | `verifyAccessTab(false)` |
| license.verifyDomainTab | `verifyDomainTab` | license.js | licensing | `verifyDomainTab()` |
| - | `verifyTooltip` | license.js | licensing | `verifyTooltip(selector, message)` |
| license.verifyFeatureBanner | `verifyFeatureBanner` | license.js | licensing | `verifyFeatureBanner('apps', 'Upgrade')` |
| - | `isBannerType` | license.js | licensing | `isBannerType('limit')` |
| license.handleBanner | `handleFeatureBanner` | license.js | licensing | `handleFeatureBanner('limit', 'Upgrade')` |
| - | `getResourceKey` | license.js | licensing | `getResourceKey('apps')` |
| license.assertLimitState | `assertLimitState` | license.js | licensing | `assertLimitState(...)` |
| license.verifyResourceLimit | `verifyResourceLimit` | license.js | licensing | `verifyResourceLimit(...)` |
| license.verifyTotalLimits | `verifyTotalLimitsWithPlan` | license.js | licensing | `verifyTotalLimitsWithPlan(...)` |
| license.apply | `applyLicense` | license.js | licensing | `applyLicense(licenseKey)` |
| license.getLimits | `getLicenseLimits` | license.js | licensing | `getLicenseLimits()` |
| user.createApi | `createUserViaAPI` | license.js | licensing | `createUserViaAPI(...)` |
| user.archive | `archiveUser` | license.js | licensing | `archiveUser(userEmail)` |
| user.unarchive | `unarchiveUser` | license.js | licensing | `unarchiveUser(userEmail)` |
| user.changeRole | `changeUserRole` | license.js | licensing | `changeUserRole(userEmail, 'builder')` |
| license.verifyLimitPayload | `verifyLimitPayload` | license.js | licensing | `verifyLimitPayload(limitData, 'apps')` |
| - | `verifyButtonDisabledWithTooltip` | license.js | licensing | `verifyButtonDisabledWithTooltip(...)` |
| license.readBannerCount | `getCurrentCountFromBanner` | license.js | licensing | `getCurrentCountFromBanner('apps')` |
| - | `waitForLicenseUpdate` | license.js | licensing | `waitForLicenseUpdate(2000)` |
| user.generateBulkCsv | `generateBulkUsersCSV` | license.js | licensing | `generateBulkUsersCSV(...)` |
| user.bulkUpload | `bulkUploadUsersViaCSV` | license.js | licensing | `bulkUploadUsersViaCSV(...)` |
| license.verifyLimitBanner | `verifyLimitBanner` | license.js | licensing | `verifyLimitBanner('Limit reached', 'Upgrade your plan')` |
| license.verifyUpgradeModal | `verifyUpgradeModal` | license.js | licensing | `verifyUpgradeModal('Upgrade to add more', false)` |
| user.createExpectStatus | `createUserAndExpectStatus` | license.js | licensing | `createUserAndExpectStatus(userEmail, 'builder', 201)` |
| user.archiveAndVerify | `archiveUserAndVerify` | license.js | licensing | `archiveUserAndVerify(userEmail)` |
| user.changeRoleExpectLimit | `changeRoleAndExpectLimit` | license.js | licensing | `changeRoleAndExpectLimit(...)` |
| user.openInviteModal | `openInviteUserModal` | license.js | licensing | `openInviteUserModal('QA', userEmail, 'builder')` |
| app.multiEnvSetup | `multiEnvAppSetup` | license.js | licensing | `multiEnvAppSetup('MyApp')` |
| group.createApi | `apiCreateGroup` | manageGroups.js | access | `apiCreateGroup('QA Team')` |
| group.deleteApi | `apiDeleteGroup` | manageGroups.js | access | `apiDeleteGroup('QA Team')` |
| group.delete | `deleteGroup` | manageGroups.js | access | `deleteGroup('QA Team', workspaceId)` |
| group.openCardMenu | `OpenGroupCardOption` | manageGroups.js | access | `OpenGroupCardOption('QA Team')` |
| group.duplicateMany | `duplicateMultipleGroups` | manageGroups.js | access | `duplicateMultipleGroups(['QA Team'])` |
| group.verifyCardMenu | `verifyGroupCardOptions` | manageGroups.js | access | `verifyGroupCardOptions('QA Team')` |
| groupPermission.set | `groupPermission` | manageGroups.js | access | `groupPermission(...)` |
| userRole.update | `updateRole` | manageGroups.js | access | `updateRole(user, 'builder', userEmail)` |
| group.createWithUser | `createGroupsAndAddUserInGroup` | manageGroups.js | access | `createGroupsAndAddUserInGroup('QA Team', userEmail)` |
| groupUser.add | `addUserInGroup` | manageGroups.js | access | `addUserInGroup('QA Team', userEmail)` |
| user.inviteWithRole | `inviteUserBasedOnRole` | manageGroups.js | access | `inviteUserBasedOnRole('QA', userEmail, 'end-user')` |
| workspace.setupWithUser | `setupWorkspaceAndInviteUser` | manageGroups.js | access | `setupWorkspaceAndInviteUser(...)` |
| userRole.verifyPrivileges | `verifyUserPrivileges` | manageGroups.js | access | `verifyUserPrivileges(...)` |
| userRole.setupAndUpdate | `setupAndUpdateRole` | manageGroups.js | access | `setupAndUpdateRole('end-user', 'builder', userEmail)` |
| userRole.verify | `verifyUserRole` | manageGroups.js | access | `verifyUserRole(userIdAlias, 'builder', ['QA Team'])` |
| groupUser.addApi | `apiAddUserToGroup` | manageGroups.js | access | `apiAddUserToGroup(groupId, userEmail)` |
| sso.verifyLoginSettings | `verifyLoginSettings` | manageSSO.js | onboarding | `verifyLoginSettings('workspace')` |
| sso.verifyLoginSettingsPage | `loginSettingPageElements` | manageSSO.js | onboarding | `loginSettingPageElements('workspace')` |
| googleSso.verifyPage | `googleSSOPageElements` | manageSSO.js | onboarding | `googleSSOPageElements('workspace')` |
| githubSso.verifyPage | `gitSSOPageElements` | manageSSO.js | onboarding | `gitSSOPageElements('workspace')` |
| oidcSso.verifyPage | `oidcSSOPageElements` | manageSSO.js | onboarding | `oidcSSOPageElements('workspace')` |
| ldapSso.verifyPage | `ldapSSOPageElements` | manageSSO.js | onboarding | `ldapSSOPageElements()` |
| samlSso.verifyPage | `samlSSOPageElements` | manageSSO.js | onboarding | `samlSSOPageElements()` |
| sso.visitWorkspaceLogin | `visitWorkspaceLoginPage` | manageSSO.js | onboarding | `visitWorkspaceLoginPage()` |
| sso.verifyWorkspaceLoginPage | `workspaceLoginPageElements` | manageSSO.js | onboarding | `workspaceLoginPageElements('My workspace')` |
| sso.verifySignInPage | `signInPageElements` | manageSSO.js | onboarding | `signInPageElements()` |
| sso.enableSignup | `enableSignUp` | manageSSO.js | onboarding | `enableSignUp()` |
| sso.disableSignup | `disableSignUp` | manageSSO.js | onboarding | `disableSignUp()` |
| workspaceInvite.verifyPage | `invitePageElements` | manageSSO.js | onboarding | `invitePageElements()` |
| sso.updateIdApi | `updateSsoId` | manageSSO.js | onboarding | `updateSsoId(ssoId, sso, workspaceId)` |
| sso.setStatusApi | `setSSOStatus` | manageSSO.js | onboarding | `setSSOStatus('My workspace', 'google', true)` |
| sso.setDefault | `defaultSSO` | manageSSO.js | onboarding | `defaultSSO(true)` |
| sso.setSignupStatus | `setSignupStatus` | manageSSO.js | onboarding | `setSignupStatus(true, 'My workspace')` |
| sso.deleteConfig | `deleteOrganisationSSO` | manageSSO.js | onboarding | `deleteOrganisationSSO('My workspace', services)` |
| sso.resetDomain | `resetDomain` | manageSSO.js | onboarding | `resetDomain()` |
| sso.enableInstanceSignup | `enableInstanceSignup` | manageSSO.js | onboarding | `enableInstanceSignup(true)` |
| oidcSso.updateConfig | `updateOIDCConfig` | manageSSO.js | onboarding | `updateOIDCConfig(orgId)` |
| - | `authResponse` | manageSSO.js | onboarding | `authResponse(matcher)` |
| oidcSso.addOkta | `addOktaOIDCConfig` | manageSSO.js | onboarding | `addOktaOIDCConfig(...)` |
| oidcSso.loginOkta | `uiOktaLogin` | manageSSO.js | onboarding | `uiOktaLogin(userEmail, password)` |
| sso.toggle | `toggleSsoViaUI` | manageSSO.js | onboarding | `toggleSsoViaUI(...)` |
| githubSso.signIn | `gitHubSignInWithAssertion` | manageSSO.js | onboarding | `gitHubSignInWithAssertion(...)` |
| user.cleanup | `cleanupTestUser` | manageSSO.js | onboarding | `cleanupTestUser(userEmail)` |
| - | `verifyLabelAndInput` | manageSSO.js | common | `verifyLabelAndInput(selectors, texts)` |
| - | `verifyElementText` | manageSSO.js | common | `verifyElementText(selectors, texts)` |
| user.verifyPage | `verifyManageUsersPageElements` | manageUsers.js | access | `verifyManageUsersPageElements()` |
| user.invite | `inviteUserToWorkspace` | manageUsers.js | access | `inviteUserToWorkspace('QA', userEmail)` |
| workspaceInvite.verifyConfirmPage | `confirmInviteElements` | manageUsers.js | onboarding | `confirmInviteElements(...)` |
| user.readStatus | `userStatus` | manageUsers.js | access | `userStatus(userEmail)` |
| user.bulkUpload | `bulkUserUpload` | manageUsers.js | access | `bulkUserUpload(...)` |
| user.copyInviteLink | `copyInvitationLink` | manageUsers.js | access | `copyInvitationLink('QA', userEmail)` |
| user.fillInviteForm | `fillUserInviteForm` | manageUsers.js | access | `fillUserInviteForm('QA', userEmail)` |
| user.selectGroup | `selectUserGroup` | manageUsers.js | access | `selectUserGroup('QA Team')` |
| user.selectGroupByName | `selectGroup` | manageUsers.js | access | `selectGroup('QA Team', 1000)` |
| user.updateGroup | `updateUserGroup` | manageUsers.js | access | `updateUserGroup('QA Team')` |
| user.inviteWithGroups | `inviteUserWithUserGroups` | manageUsers.js | access | `inviteUserWithUserGroups('QA', userEmail, 'QA Team')` |
| workspaceInvite.fetchAndVisit | `fetchAndVisitInviteLink` | manageUsers.js | onboarding | `fetchAndVisitInviteLink(...)` |
| workspaceInvite.fetchViaMailhog | `fetchAndVisitInviteLinkViaMH` | manageUsers.js | onboarding | `fetchAndVisitInviteLinkViaMH(userEmail)` |
| user.inviteWithRole | `inviteUserWithUserRole` | manageUsers.js | access | `inviteUserWithUserRole('QA', userEmail, 'builder')` |
| user.verifyStatusAndMetadata | `verifyUserStatusAndMetadata` | manageUsers.js | access | `verifyUserStatusAndMetadata(...)` |
| user.openEditModal | `openEditUserDetails` | manageUsers.js | access | `openEditUserDetails(...)` |
| user.navigateToEdit | `navigateToEditUser` | manageUsers.js | access | `navigateToEditUser(userEmail)` |
| user.cleanAll | `cleanAllUsers` | manageUsers.js | access | `cleanAllUsers()` |
| user.archiveApi | `apiArchiveUnarchiveUser` | manageUsers.js | access | `apiArchiveUnarchiveUser(...)` |
| signup.verifyConfirmEmail | `verifyConfirmEmailPage` | onboarding.js | onboarding | `verifyConfirmEmailPage(userEmail)` |
| onboardingFlow.verifyQuestions | `verifyOnboardingQuestions` | onboarding.js | onboarding | `verifyOnboardingQuestions('My workspace')` |
| workspaceInvite.verifyInvalidLink | `verifyInvalidInvitationLink` | onboarding.js | onboarding | `verifyInvalidInvitationLink()` |
| signup.submit | `userSignUp` | onboarding.js | onboarding | `userSignUp('QA User', userEmail, 'test')` |
| user.inviteViaOnboarding | `inviteUser` | onboarding.js | onboarding | `inviteUser('QA', userEmail)` |
| user.addNew | `addNewUser` | onboarding.js | onboarding | `addNewUser('QA', userEmail)` |
| onboardingFlow.byRole | `roleBasedOnboarding` | onboarding.js | onboarding | `roleBasedOnboarding('QA', userEmail, 'builder')` |
| workspaceInvite.visit | `visitWorkspaceInvitation` | onboarding.js | onboarding | `visitWorkspaceInvitation(userEmail, 'My workspace')` |
| signup.verifyPage | `SignUpPageElements` | onboarding.js | onboarding | `SignUpPageElements()` |
| signup.readLink | `signUpLink` | onboarding.js | onboarding | `signUpLink(userEmail)` |
| signup.verifyBanner | `bannerElementsVerification` | onboarding.js | onboarding | `bannerElementsVerification()` |
| instanceSetting.enableSignup | `enableInstanceSignUp` | onboarding.js | onboarding | `enableInstanceSignUp(true)` |
| onboardingFlow.stepOne | `onboardingStepOne` | onboarding.js | onboarding | `onboardingStepOne()` |
| onboardingFlow.stepTwo | `onboardingStepTwo` | onboarding.js | onboarding | `onboardingStepTwo('My workspace')` |
| onboardingFlow.stepThree | `onboardingStepThree` | onboarding.js | onboarding | `onboardingStepThree()` |
| userMetadata.add | `addUserMetadata` | onboarding.js | access | `addUserMetadata(metadataList)` |
| userMetadata.onboarding | `userMetadataOnboarding` | onboarding.js | access | `userMetadataOnboarding(...)` |
| userMetadata.verifyElements | `verifyUserMetadataElements` | onboarding.js | access | `verifyUserMetadataElements(0)` |
| user.selectGroupOnboarding | `selectUserGroup` | onboarding.js | onboarding | `selectUserGroup('QA Team')` |
| workspaceInvite.acceptWithPassword | `enterPasswordAndAcceptInvite` | onboarding.js | onboarding | `enterPasswordAndAcceptInvite('password')` |
| profile.verifyPage | `profilePageElements` | profile.js | workspace | `profilePageElements()` |
| profile.updateExtApi | `extApiUpdateUser` | profile.js | workspace | `extApiUpdateUser(userEmail, userId)` |
| profile.removeAvatar | `removeAvatar` | profile.js | workspace | `removeAvatar(userEmail)` |
| selfHostSignup.verifyCommon | `selfHostCommonElements` | selfHostSignUp.js | onboarding | `selfHostCommonElements()` |
| selfHostSignup.verifyWorkspaceSetup | `commonElementsWorkspaceSetup` | selfHostSignUp.js | onboarding | `commonElementsWorkspaceSetup()` |
| selfHostSignup.setUserRole | `verifyandModifyUserRole` | selfHostSignUp.js | onboarding | `verifyandModifyUserRole()` |
| selfHostSignup.setCompanySize | `verifyandModifySizeOftheCompany` | selfHostSignUp.js | onboarding | `verifyandModifySizeOftheCompany()` |
| app.createUi | `uiCreateApp` | uiPermissions.js | access | `uiCreateApp(name)` |
| app.verifyCreated | `uiVerifyAppCreated` | uiPermissions.js | access | `uiVerifyAppCreated(name, true)` |
| app.deleteUi | `uiDeleteApp` | uiPermissions.js | access | `uiDeleteApp(name)` |
| app.verifyDeleted | `uiVerifyAppDeleted` | uiPermissions.js | access | `uiVerifyAppDeleted(name)` |
| app.verifyCreatePrivilege | `uiVerifyAppCreatePrivilege` | uiPermissions.js | access | `uiVerifyAppCreatePrivilege(true)` |
| folder.createUi | `uiCreateFolder` | uiPermissions.js | access | `uiCreateFolder(name)` |
| folder.verifyCreated | `uiVerifyFolderCreated` | uiPermissions.js | access | `uiVerifyFolderCreated(name, true)` |
| folder.verifyDeleted | `uiVerifyFolderDeleted` | uiPermissions.js | access | `uiVerifyFolderDeleted(name)` |
| folder.verifyCreatePrivilege | `uiVerifyFolderCreatePrivilege` | uiPermissions.js | access | `uiVerifyFolderCreatePrivilege(true)` |
| workspaceConstant.verifyCreatePrivilege | `uiVerifyWorkspaceConstantCreatePrivilege` | uiPermissions.js | access | `uiVerifyWorkspaceConstantCreatePrivilege(true)` |
| datasource.createUi | `uiCreateDataSource` | uiPermissions.js | access | `uiCreateDataSource(name)` |
| datasource.verifyCreated | `uiVerifyDataSourceCreated` | uiPermissions.js | access | `uiVerifyDataSourceCreated(name, true)` |
| datasource.deleteUi | `uiDeleteDataSource` | uiPermissions.js | access | `uiDeleteDataSource(name)` |
| datasource.verifyDeleted | `uiVerifyDataSourceDeleted` | uiPermissions.js | access | `uiVerifyDataSourceDeleted(name)` |
| datasource.verifyCreatePrivilege | `uiVerifyDataSourceCreatePrivilege` | uiPermissions.js | access | `uiVerifyDataSourceCreatePrivilege(true)` |
| workflow.createUi | `uiCreateWorkflow` | uiPermissions.js | access | `uiCreateWorkflow(name)` |
| workflow.verifyCreated | `uiVerifyWorkflowCreated` | uiPermissions.js | access | `uiVerifyWorkflowCreated(name, true)` |
| workflow.deleteUi | `uiDeleteWorkflow` | uiPermissions.js | access | `uiDeleteWorkflow(name)` |
| workflow.verifyDeleted | `uiVerifyWorkflowDeleted` | uiPermissions.js | access | `uiVerifyWorkflowDeleted(name)` |
| workflow.verifyCreatePrivilege | `uiVerifyWorkflowCreatePrivilege` | uiPermissions.js | access | `uiVerifyWorkflowCreatePrivilege(true)` |
| role.verifyAllCreatePrivileges | `uiVerifyAllCreatePrivileges` | uiPermissions.js | access | `uiVerifyAllCreatePrivileges(...)` |
| role.verifyBuilder | `uiVerifyBuilderPrivileges` | uiPermissions.js | access | `uiVerifyBuilderPrivileges()` |
| role.verifyAdmin | `uiVerifyAdminPrivileges` | uiPermissions.js | access | `uiVerifyAdminPrivileges()` |
| app.crudFlow | `uiAppCRUDWorkflow` | uiPermissions.js | access | `uiAppCRUDWorkflow('MyApp')` |
| folder.crudFlow | `uiFolderCRUDWorkflow` | uiPermissions.js | access | `uiFolderCRUDWorkflow('QA folder')` |
| workspaceConstant.crudFlow | `uiWorkspaceConstantCRUDWorkflow` | uiPermissions.js | access | `uiWorkspaceConstantCRUDWorkflow(...)` |
| datasource.crudFlow | `uiDataSourceCRUDWorkflow` | uiPermissions.js | access | `uiDataSourceCRUDWorkflow(...)` |
| workflow.crudFlow | `uiWorkflowCRUDWorkflow` | uiPermissions.js | access | `uiWorkflowCRUDWorkflow('QA flow')` |
| - | `constantsOperations` | userPermissions.js | access | `constantsOperations   // permission fixture data` |
| role.verifyPermissions | `verifyPermissions` | userPermissions.js | access | `verifyPermissions   // permission fixture data` |
| groupPermission.getInput | `getGroupPermissionInput` | userPermissions.js | access | `getGroupPermissionInput(true, flag)` |
| role.verifyBuilderPermissions | `verifyBuilderPermissions` | userPermissions.js | access | `verifyBuilderPermissions(...)` |
| role.verifyBasicPermissions | `verifyBasicPermissions` | userPermissions.js | access | `verifyBasicPermissions(true)` |
| role.verifySettingsAccess | `verifySettingsAccess` | userPermissions.js | access | `verifySettingsAccess(true)` |
| granularPermission.verifyEnvTagsUi | `verifyEnvironmentTagsInGranularUI` | userPermissions.js | access | `verifyEnvironmentTagsInGranularUI('QA Team', tags)` |
| granularPermission.verifyEnvAccess | `verifyEnvironmentAccess` | userPermissions.js | access | `verifyEnvironmentAccess(environments, options)` |
| role.verifyAppBuilderAccess | `verifyAppBuilderAccess` | userPermissions.js | access | `verifyAppBuilderAccess(envNames, opts)` |
| role.verifyPreviewAccess | `verifyPreviewAccess` | userPermissions.js | access | `verifyPreviewAccess(...)` |
| role.verifyPreviewUrlAccess | `verifyPreviewURLAccess` | userPermissions.js | access | `verifyPreviewURLAccess(envNames, opts)` |
| signup.viaPermissions | `signup` | userPermissions.js | onboarding | `signup('QA User', userEmail)` |
| appVersion.openCreateModal | `navigateToCreateNewVersionModal` | version.js | apps | `navigateToCreateNewVersionModal('v1')` |
| appVersion.openEditModal | `navigateToEditVersionModal` | version.js | apps | `navigateToEditVersionModal('v1')` |
| appVersion.verifyCreateModal | `verifyElementsOfCreateNewVersionModal` | version.js | apps | `verifyElementsOfCreateNewVersionModal([])` |
| appVersion.edit | `editVersionAndVerify` | version.js | apps | `editVersionAndVerify(...)` |
| appVersion.delete | `deleteVersionAndVerify` | version.js | apps | `deleteVersionAndVerify('v2')` |
| appVersion.verifyDuplicate | `verifyDuplicateVersion` | version.js | apps | `verifyDuplicateVersion([], 'v1')` |
| appVersion.release | `releasedVersionAndVerify` | version.js | apps | `releasedVersionAndVerify('v1')` |
| appVersion.verifyAfterPreview | `verifyVersionAfterPreview` | version.js | apps | `verifyVersionAfterPreview('v1')` |
| appVersion.switch | `switchVersionAndVerify` | version.js | apps | `switchVersionAndVerify('v1', 'v2')` |
| app.openPreviewSettings | `openPreviewSettings` | version.js | apps | `openPreviewSettings()` |
| appVersion.createDraft | `createDraftVersion` | version.js | apps | `createDraftVersion('v2-draft', 'v1')` |
| appVersion.openSwitcher | `openVersionSwitcher` | version.js | apps | `openVersionSwitcher()` |
| appVersion.openCreateDraftModal | `openCreateDraftVersionModal` | version.js | apps | `openCreateDraftVersionModal()` |
| whiteLabel.open | `openWhiteLabelingSettings` | whitelabel.js | superAdmin | `openWhiteLabelingSettings()` |
| whiteLabel.verifyPage | `verifyWhiteLabelingUI` | whitelabel.js | superAdmin | `verifyWhiteLabelingUI()` |
| whiteLabel.fillForm | `fillWhiteLabelingForm` | whitelabel.js | superAdmin | `fillWhiteLabelingForm(...)` |
| whiteLabel.save | `saveWhiteLabelingChanges` | whitelabel.js | superAdmin | `saveWhiteLabelingChanges()` |
| whiteLabel.verifyLogo | `verifyCustomLogo` | whitelabel.js | superAdmin | `verifyCustomLogo(...)` |
| whiteLabel.verifyTitleFavicon | `verifyPageTitleAndFavicon` | whitelabel.js | superAdmin | `verifyPageTitleAndFavicon(...)` |
| whiteLabel.verifyLogoLogin | `verifyLogoOnLoginPage` | whitelabel.js | superAdmin | `verifyLogoOnLoginPage()` |
| whiteLabel.verifyLogoWorkspaceLogin | `verifyLogoOnWorkspaceLoginPage` | whitelabel.js | superAdmin | `verifyLogoOnWorkspaceLoginPage('My workspace')` |
| whiteLabel.verifyLogoDashboard | `verifyLogoOnDashboard` | whitelabel.js | superAdmin | `verifyLogoOnDashboard()` |
| - | `cleanEmailBody` | whitelabel.js | superAdmin | `cleanEmailBody(mailBody)` |
| whiteLabel.verifyInEmail | `verifyWhiteLabelInEmail` | whitelabel.js | superAdmin | `verifyWhiteLabelInEmail(...)` |
| whiteLabel.verifyInviteEmail | `verifyInvitationEmail` | whitelabel.js | superAdmin | `verifyInvitationEmail(...)` |
| whiteLabel.verifyInputs | `verifyWhiteLabelInputs` | whitelabel.js | superAdmin | `verifyWhiteLabelInputs(...)` |
| workspaceConstant.verifyNameValidation | `contantsNameValidation` | workspaceConstants.js | workspace | `contantsNameValidation(...)` |
| workspaceConstant.create | `addAndVerifyConstants` | workspaceConstants.js | workspace | `addAndVerifyConstants('API_KEY', 'abc', 'global')` |
| workspaceConstant.delete | `deleteConstant` | workspaceConstants.js | workspace | `deleteConstant('API_KEY', 'Global')` |
| workspaceConstant.verifyDuplicateName | `existingNameValidation` | workspaceConstants.js | workspace | `existingNameValidation(...)` |
| workspaceConstant.verifyForm | `verifyConstantFormUI` | workspaceConstants.js | workspace | `verifyConstantFormUI()` |
| workspaceConstant.switchTab | `switchToConstantTab` | workspaceConstants.js | workspace | `switchToConstantTab('Secrets')` |
| workspaceConstant.verifyValueVisibility | `verifyConstantValueVisibility` | workspaceConstants.js | workspace | `verifyConstantValueVisibility(selector, 'abc')` |
| workspaceConstant.verifySearch | `verifySearch` | workspaceConstants.js | workspace | `verifySearch(data)` |
| workspaceConstant.verifyFormValidation | `VerifyConstantsFormInputValidation` | workspaceConstants.js | workspace | `VerifyConstantsFormInputValidation()` |
| workspaceConstant.crudFlow | `constantsCRUDAndValidations` | workspaceConstants.js | workspace | `constantsCRUDAndValidations(data)` |
| workspaceConstant.verifyEmptyState | `VerifyEmptyScreenUI` | workspaceConstants.js | workspace | `VerifyEmptyScreenUI('production')` |
| environment.selectForConstants | `selectEnv` | workspaceConstants.js | workspace | `selectEnv('production')` |
| workspaceConstant.createAndUpdate | `createAndUpdateConstant` | workspaceConstants.js | workspace | `createAndUpdateConstant(...)` |
| workspaceConstant.verifyInputs | `verifyInputValues` | workspaceConstants.js | workspace | `verifyInputValues(...)` |
| workspaceConstant.importApp | `importConstantsApp` | workspaceConstants.js | workspace | `importConstantsApp('cypress/fixtures/app.json', true)` |
| workspaceConstant.verifySecretMasked | `verifySecretConstantNotResolved` | workspaceConstants.js | workspace | `verifySecretConstantNotResolved(inputWidget)` |
| workspaceConstant.verifyInStaticQuery | `verifyGlobalConstInStaticQuery` | workspaceConstants.js | workspace | `verifyGlobalConstInStaticQuery(selector, expected)` |
| workspaceConstant.verifyQueryPreview | `verifyStaticQueryPreview` | workspaceConstants.js | workspace | `verifyStaticQueryPreview(selector, expected)` |
| workspaceConstant.verifySecretInQueryRaw | `verifySecretInStaticQueryRaw` | workspaceConstants.js | workspace | `verifySecretInStaticQueryRaw(selector)` |
| workspaceConstant.verifyInPreview | `previewAppAndVerify` | workspaceConstants.js | workspace | `previewAppAndVerify(start, end, 'abc')` |
| environment.promoteAndVerify | `promoteEnvAndVerify` | workspaceConstants.js | workspace | `promoteEnvAndVerify(...)` |
| - | `assertTooltipText` | workspaceConstants.js | common | `assertTooltipText(selector, expected)` |
