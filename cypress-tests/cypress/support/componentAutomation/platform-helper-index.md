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
| gitSyncConfig.createApi | `apiConfigureGitSync` | platform/apiUtils/gitSyncApi.js | gitSync | `apiConfigureGitSync({ orgId, gitUrl, branch })` |
| gitSyncConfig.deleteApi | `apiDeleteGitSync` | platform/apiUtils/gitSyncApi.js | gitSync | `apiDeleteGitSync(orgId)` |
| appSlug.verifyValidations | `verifySlugValidations` | platform/apps.js | apps | `verifySlugValidations(inputSelector)` |
| appSlug.verifyUpdate | `verifySuccessfulSlugUpdate` | platform/apps.js | apps | `verifySuccessfulSlugUpdate(workspaceId, 'my-app')` |
| appSlug.verifyUrls | `verifyURLs` | platform/apps.js | apps | `verifyURLs(workspaceId, 'my-app', 'home')` |
| appSlug.set | `setUpSlug` | platform/apps.js | apps | `setUpSlug('my-app')` |
| app.createWithSlug | `setupAppWithSlug` | platform/apps.js | apps | `setupAppWithSlug(appName, slug)` |
| app.verifyRestrictedAccess | `verifyRestrictedAccess` | platform/apps.js | apps | `verifyRestrictedAccess()` |
| user.onboardFromAppLink | `onboardUserFromAppLink` | platform/apps.js | onboarding | `onboardUserFromAppLink(...)` |
| - | `resolveHost` | platform/apps.js | common | `resolveHost()` |
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
| app.changeIcon | `modifyAndVerifyAppCardIcon` | platform/dashboard.js | apps | `modifyAndVerifyAppCardIcon('MyApp')` |
| app.verifyDeleted | `verifyAppDelete` | platform/dashboard.js | apps | `verifyAppDelete('MyApp')` |
| app.verifyExportModal | `verifyElementsOfExportModal` | platform/exportImport.js | apps | `verifyElementsOfExportModal(...)` |
| appVersion.create | `createNewVersion` | platform/exportImport.js | apps | `createNewVersion([], 'v1')` |
| app.export | `clickOnExportButtonAndVerify` | platform/exportImport.js | apps | `clickOnExportButtonAndVerify('Export selected version', 'MyApp')` |
| app.exportAllVersions | `exportAllVersionsAndVerify` | platform/exportImport.js | apps | `exportAllVersionsAndVerify(...)` |
| app.import | `importAndVerifyApp` | platform/exportImport.js | apps | `importAndVerifyApp('cypress/fixtures/app.json', 'App imported successfully')` |
| app.verifyImportModal | `verifyImportModalElements` | platform/exportImport.js | apps | `verifyImportModalElements('MyApp')` |
| datasource.setupWithConstants | `setupDataSourceWithConstants` | platform/exportImport.js | workspace | `setupDataSourceWithConstants(...)` |
| app.validateExportStructure | `validateExportedAppStructure` | platform/exportImport.js | apps | `validateExportedAppStructure(...)` |
| - | `invalidAuthHeader` | platform/externalApi.js | externalApi | `invalidAuthHeader()` |
| - | `emptyAuthHeader` | platform/externalApi.js | externalApi | `emptyAuthHeader()` |
| - | `apiRequest` | platform/externalApi.js | externalApi | `apiRequest('GET', '/api/ext/users')` |
| extUser.create | `createUser` | platform/externalApi.js | externalApi | `createUser(userData)` |
| extUser.get | `getUser` | platform/externalApi.js | externalApi | `getUser(userId)` |
| extUser.list | `getAllUsers` | platform/externalApi.js | externalApi | `getAllUsers()` |
| extUser.update | `updateUser` | platform/externalApi.js | externalApi | `updateUser(userId, userData)` |
| extUser.updateRole | `updateUserRole` | platform/externalApi.js | externalApi | `updateUserRole(workspaceId, userData)` |
| extUser.replaceWorkspace | `replaceUserWorkspace` | platform/externalApi.js | externalApi | `replaceUserWorkspace(userId, workspaceId, userData)` |
| extUser.replaceWorkspaceRelations | `replaceUserWorkspacesRelations` | platform/externalApi.js | externalApi | `replaceUserWorkspacesRelations(userId, userData)` |
| extWorkspace.list | `getAllWorkspaces` | platform/externalApi.js | externalApi | `getAllWorkspaces()` |
| extApp.import | `importApp` | platform/externalApi.js | externalApi | `importApp(workspaceId, appData, headers)` |
| extApp.export | `exportApp` | platform/externalApi.js | externalApi | `exportApp(workspaceId, appId, endpoint, headers)` |
| extApp.listByWorkspace | `fetchWorkspaceApps` | platform/externalApi.js | externalApi | `fetchWorkspaceApps(workspaceId, authToken)` |
| extApp.listAll | `allAppsDetails` | platform/externalApi.js | externalApi | `allAppsDetails(workspaceIds)` |
| extModule.list | `listWorkspaceModules` | platform/externalApi.js | externalApi | `listWorkspaceModules(workspaceId)` |
| extModule.export | `exportModule` | platform/externalApi.js | externalApi | `exportModule(workspaceId, moduleId)` |
| extModule.import | `importModule` | platform/externalApi.js | externalApi | `importModule(workspaceId, moduleData)` |
| extUserMetadata.get | `getUserMetadata` | platform/externalApi.js | externalApi | `getUserMetadata(userId)` |
| extUserMetadata.update | `updateUserMetadata` | platform/externalApi.js | externalApi | `updateUserMetadata(userId, metadata)` |
| extGitSync.configure | `configureOrganizationGit` | platform/externalApi.js | gitSync | `configureOrganizationGit(workspaceId, config)` |
| extGitSync.push | `pushAppVersionToGit` | platform/externalApi.js | gitSync | `pushAppVersionToGit(workspaceId, appId, versionId)` |
| extGitSync.createApp | `createAppFromGit` | platform/externalApi.js | gitSync | `createAppFromGit(workspaceId, gitAppName)` |
| extGitSync.pull | `pullAppChangesFromGit` | platform/externalApi.js | gitSync | `pullAppChangesFromGit(workspaceId, appId)` |
| extGitSync.release | `releaseAppFromGit` | platform/externalApi.js | gitSync | `releaseAppFromGit(workspaceId, appId)` |
| extApp.saveVersion | `saveAppVersion` | platform/externalApi.js | externalApi | `saveAppVersion(workspaceId, appId, versionId)` |
| extGroup.create | `createGroup` | platform/externalApi.js | externalApi | `createGroup('QA Team')` |
| extUser.verifyGroups | `verifyUserInGroups` | platform/externalApi.js | externalApi | `verifyUserInGroups(userEmail, ['QA Team'], true)` |
| extWorkspace.usersByGroups | `getWorkspaceUsersByGroups` | platform/externalApi.js | externalApi | `getWorkspaceUsersByGroups(workspaceId, payload, headers)` |
| license.getExpiry | `getLicenseExpiryDate` | platform/license.js | licensing | `getLicenseExpiryDate()` |
| license.switchTab | `switchTabs` | platform/license.js | licensing | `switchTabs('Access')` |
| license.verifyTab | `verifyLicenseTab` | platform/license.js | licensing | `verifyLicenseTab()` |
| license.verifyLimitsTab | `verifySubTabsAndStoreCurrentLimits` | platform/license.js | licensing | `verifySubTabsAndStoreCurrentLimits(...)` |
| license.verifyAccessTab | `verifyAccessTab` | platform/license.js | licensing | `verifyAccessTab(false)` |
| license.verifyDomainTab | `verifyDomainTab` | platform/license.js | licensing | `verifyDomainTab()` |
| - | `verifyTooltip` | platform/license.js | licensing | `verifyTooltip(selector, message)` |
| license.verifyFeatureBanner | `verifyFeatureBanner` | platform/license.js | licensing | `verifyFeatureBanner('apps', 'Upgrade')` |
| - | `isBannerType` | platform/license.js | licensing | `isBannerType('limit')` |
| license.handleBanner | `handleFeatureBanner` | platform/license.js | licensing | `handleFeatureBanner('limit', 'Upgrade')` |
| - | `getResourceKey` | platform/license.js | licensing | `getResourceKey('apps')` |
| license.assertLimitState | `assertLimitState` | platform/license.js | licensing | `assertLimitState(...)` |
| license.verifyResourceLimit | `verifyResourceLimit` | platform/license.js | licensing | `verifyResourceLimit(...)` |
| license.verifyTotalLimits | `verifyTotalLimitsWithPlan` | platform/license.js | licensing | `verifyTotalLimitsWithPlan(...)` |
| license.apply | `applyLicense` | platform/license.js | licensing | `applyLicense(licenseKey)` |
| license.getLimits | `getLicenseLimits` | platform/license.js | licensing | `getLicenseLimits()` |
| user.createApi | `createUserViaAPI` | platform/license.js | licensing | `createUserViaAPI(...)` |
| user.archive | `archiveUser` | platform/license.js | licensing | `archiveUser(userEmail)` |
| user.unarchive | `unarchiveUser` | platform/license.js | licensing | `unarchiveUser(userEmail)` |
| user.changeRole | `changeUserRole` | platform/license.js | licensing | `changeUserRole(userEmail, 'builder')` |
| license.verifyLimitPayload | `verifyLimitPayload` | platform/license.js | licensing | `verifyLimitPayload(limitData, 'apps')` |
| - | `verifyButtonDisabledWithTooltip` | platform/license.js | licensing | `verifyButtonDisabledWithTooltip(...)` |
| license.readBannerCount | `getCurrentCountFromBanner` | platform/license.js | licensing | `getCurrentCountFromBanner('apps')` |
| - | `waitForLicenseUpdate` | platform/license.js | licensing | `waitForLicenseUpdate(2000)` |
| user.generateBulkCsv | `generateBulkUsersCSV` | platform/license.js | licensing | `generateBulkUsersCSV(...)` |
| user.bulkUpload | `bulkUploadUsersViaCSV` | platform/license.js | licensing | `bulkUploadUsersViaCSV(...)` |
| license.verifyLimitBanner | `verifyLimitBanner` | platform/license.js | licensing | `verifyLimitBanner('Limit reached', 'Upgrade your plan')` |
| license.verifyUpgradeModal | `verifyUpgradeModal` | platform/license.js | licensing | `verifyUpgradeModal('Upgrade to add more', false)` |
| user.createExpectStatus | `createUserAndExpectStatus` | platform/license.js | licensing | `createUserAndExpectStatus(userEmail, 'builder', 201)` |
| user.archiveAndVerify | `archiveUserAndVerify` | platform/license.js | licensing | `archiveUserAndVerify(userEmail)` |
| user.changeRoleExpectLimit | `changeRoleAndExpectLimit` | platform/license.js | licensing | `changeRoleAndExpectLimit(...)` |
| user.openInviteModal | `openInviteUserModal` | platform/license.js | licensing | `openInviteUserModal('QA', userEmail, 'builder')` |
| app.multiEnvSetup | `multiEnvAppSetup` | platform/license.js | licensing | `multiEnvAppSetup('MyApp')` |
| group.createApi | `apiCreateGroup` | platform/manageGroups.js | access | `apiCreateGroup('QA Team')` |
| group.deleteApi | `apiDeleteGroup` | platform/manageGroups.js | access | `apiDeleteGroup('QA Team')` |
| group.delete | `deleteGroup` | platform/manageGroups.js | access | `deleteGroup('QA Team', workspaceId)` |
| group.openCardMenu | `OpenGroupCardOption` | platform/manageGroups.js | access | `OpenGroupCardOption('QA Team')` |
| group.duplicateMany | `duplicateMultipleGroups` | platform/manageGroups.js | access | `duplicateMultipleGroups(['QA Team'])` |
| group.verifyCardMenu | `verifyGroupCardOptions` | platform/manageGroups.js | access | `verifyGroupCardOptions('QA Team')` |
| groupPermission.set | `groupPermission` | platform/manageGroups.js | access | `groupPermission(...)` |
| userRole.update | `updateRole` | platform/manageGroups.js | access | `updateRole(user, 'builder', userEmail)` |
| group.createWithUser | `createGroupsAndAddUserInGroup` | platform/manageGroups.js | access | `createGroupsAndAddUserInGroup('QA Team', userEmail)` |
| groupUser.add | `addUserInGroup` | platform/manageGroups.js | access | `addUserInGroup('QA Team', userEmail)` |
| user.inviteWithRole | `inviteUserBasedOnRole` | platform/manageGroups.js | access | `inviteUserBasedOnRole('QA', userEmail, 'end-user')` |
| workspace.setupWithUser | `setupWorkspaceAndInviteUser` | platform/manageGroups.js | access | `setupWorkspaceAndInviteUser(...)` |
| userRole.verifyPrivileges | `verifyUserPrivileges` | platform/manageGroups.js | access | `verifyUserPrivileges(...)` |
| userRole.setupAndUpdate | `setupAndUpdateRole` | platform/manageGroups.js | access | `setupAndUpdateRole('end-user', 'builder', userEmail)` |
| userRole.verify | `verifyUserRole` | platform/manageGroups.js | access | `verifyUserRole(userIdAlias, 'builder', ['QA Team'])` |
| groupUser.addApi | `apiAddUserToGroup` | platform/manageGroups.js | access | `apiAddUserToGroup(groupId, userEmail)` |
| sso.verifyLoginSettings | `verifyLoginSettings` | platform/manageSSO.js | onboarding | `verifyLoginSettings('workspace')` |
| sso.verifyLoginSettingsPage | `loginSettingPageElements` | platform/manageSSO.js | onboarding | `loginSettingPageElements('workspace')` |
| googleSso.verifyPage | `googleSSOPageElements` | platform/manageSSO.js | onboarding | `googleSSOPageElements('workspace')` |
| githubSso.verifyPage | `gitSSOPageElements` | platform/manageSSO.js | onboarding | `gitSSOPageElements('workspace')` |
| oidcSso.verifyPage | `oidcSSOPageElements` | platform/manageSSO.js | onboarding | `oidcSSOPageElements('workspace')` |
| ldapSso.verifyPage | `ldapSSOPageElements` | platform/manageSSO.js | onboarding | `ldapSSOPageElements()` |
| samlSso.verifyPage | `samlSSOPageElements` | platform/manageSSO.js | onboarding | `samlSSOPageElements()` |
| sso.visitWorkspaceLogin | `visitWorkspaceLoginPage` | platform/manageSSO.js | onboarding | `visitWorkspaceLoginPage()` |
| sso.verifyWorkspaceLoginPage | `workspaceLoginPageElements` | platform/manageSSO.js | onboarding | `workspaceLoginPageElements('My workspace')` |
| sso.verifySignInPage | `signInPageElements` | platform/manageSSO.js | onboarding | `signInPageElements()` |
| sso.enableSignup | `enableSignUp` | platform/manageSSO.js | onboarding | `enableSignUp()` |
| sso.disableSignup | `disableSignUp` | platform/manageSSO.js | onboarding | `disableSignUp()` |
| workspaceInvite.verifyPage | `invitePageElements` | platform/manageSSO.js | onboarding | `invitePageElements()` |
| sso.updateIdApi | `updateSsoId` | platform/manageSSO.js | onboarding | `updateSsoId(ssoId, sso, workspaceId)` |
| sso.setStatusApi | `setSSOStatus` | platform/manageSSO.js | onboarding | `setSSOStatus('My workspace', 'google', true)` |
| sso.setDefault | `defaultSSO` | platform/manageSSO.js | onboarding | `defaultSSO(true)` |
| sso.setSignupStatus | `setSignupStatus` | platform/manageSSO.js | onboarding | `setSignupStatus(true, 'My workspace')` |
| sso.deleteConfig | `deleteOrganisationSSO` | platform/manageSSO.js | onboarding | `deleteOrganisationSSO('My workspace', services)` |
| sso.resetDomain | `resetDomain` | platform/manageSSO.js | onboarding | `resetDomain()` |
| sso.enableInstanceSignup | `enableInstanceSignup` | platform/manageSSO.js | onboarding | `enableInstanceSignup(true)` |
| oidcSso.updateConfig | `updateOIDCConfig` | platform/manageSSO.js | onboarding | `updateOIDCConfig(orgId)` |
| - | `authResponse` | platform/manageSSO.js | onboarding | `authResponse(matcher)` |
| oidcSso.addOkta | `addOktaOIDCConfig` | platform/manageSSO.js | onboarding | `addOktaOIDCConfig(...)` |
| oidcSso.loginOkta | `uiOktaLogin` | platform/manageSSO.js | onboarding | `uiOktaLogin(userEmail, password)` |
| sso.toggle | `toggleSsoViaUI` | platform/manageSSO.js | onboarding | `toggleSsoViaUI(...)` |
| githubSso.signIn | `gitHubSignInWithAssertion` | platform/manageSSO.js | onboarding | `gitHubSignInWithAssertion(...)` |
| user.cleanup | `cleanupTestUser` | platform/manageSSO.js | onboarding | `cleanupTestUser(userEmail)` |
| - | `verifyLabelAndInput` | platform/manageSSO.js | common | `verifyLabelAndInput(selectors, texts)` |
| - | `verifyElementText` | platform/manageSSO.js | common | `verifyElementText(selectors, texts)` |
| user.verifyPage | `verifyManageUsersPageElements` | platform/manageUsers.js | access | `verifyManageUsersPageElements()` |
| user.invite | `inviteUserToWorkspace` | platform/manageUsers.js | access | `inviteUserToWorkspace('QA', userEmail)` |
| workspaceInvite.verifyConfirmPage | `confirmInviteElements` | platform/manageUsers.js | onboarding | `confirmInviteElements(...)` |
| user.readStatus | `userStatus` | platform/manageUsers.js | access | `userStatus(userEmail)` |
| user.bulkUpload | `bulkUserUpload` | platform/manageUsers.js | access | `bulkUserUpload(...)` |
| user.copyInviteLink | `copyInvitationLink` | platform/manageUsers.js | access | `copyInvitationLink('QA', userEmail)` |
| user.fillInviteForm | `fillUserInviteForm` | platform/manageUsers.js | access | `fillUserInviteForm('QA', userEmail)` |
| user.selectGroup | `selectUserGroup` | platform/manageUsers.js | access | `selectUserGroup('QA Team')` |
| user.selectGroupByName | `selectGroup` | platform/manageUsers.js | access | `selectGroup('QA Team', 1000)` |
| user.updateGroup | `updateUserGroup` | platform/manageUsers.js | access | `updateUserGroup('QA Team')` |
| user.inviteWithGroups | `inviteUserWithUserGroups` | platform/manageUsers.js | access | `inviteUserWithUserGroups('QA', userEmail, 'QA Team')` |
| workspaceInvite.fetchAndVisit | `fetchAndVisitInviteLink` | platform/manageUsers.js | onboarding | `fetchAndVisitInviteLink(...)` |
| workspaceInvite.fetchViaMailhog | `fetchAndVisitInviteLinkViaMH` | platform/manageUsers.js | onboarding | `fetchAndVisitInviteLinkViaMH(userEmail)` |
| user.inviteWithRole | `inviteUserWithUserRole` | platform/manageUsers.js | access | `inviteUserWithUserRole('QA', userEmail, 'builder')` |
| user.verifyStatusAndMetadata | `verifyUserStatusAndMetadata` | platform/manageUsers.js | access | `verifyUserStatusAndMetadata(...)` |
| user.openEditModal | `openEditUserDetails` | platform/manageUsers.js | access | `openEditUserDetails(...)` |
| user.navigateToEdit | `navigateToEditUser` | platform/manageUsers.js | access | `navigateToEditUser(userEmail)` |
| user.cleanAll | `cleanAllUsers` | platform/manageUsers.js | access | `cleanAllUsers()` |
| user.archiveApi | `apiArchiveUnarchiveUser` | platform/manageUsers.js | access | `apiArchiveUnarchiveUser(...)` |
| signup.verifyConfirmEmail | `verifyConfirmEmailPage` | platform/onboarding.js | onboarding | `verifyConfirmEmailPage(userEmail)` |
| onboardingFlow.verifyQuestions | `verifyOnboardingQuestions` | platform/onboarding.js | onboarding | `verifyOnboardingQuestions('My workspace')` |
| workspaceInvite.verifyInvalidLink | `verifyInvalidInvitationLink` | platform/onboarding.js | onboarding | `verifyInvalidInvitationLink()` |
| signup.submit | `userSignUp` | platform/onboarding.js | onboarding | `userSignUp('QA User', userEmail, 'test')` |
| user.inviteViaOnboarding | `inviteUser` | platform/onboarding.js | onboarding | `inviteUser('QA', userEmail)` |
| user.addNew | `addNewUser` | platform/onboarding.js | onboarding | `addNewUser('QA', userEmail)` |
| onboardingFlow.byRole | `roleBasedOnboarding` | platform/onboarding.js | onboarding | `roleBasedOnboarding('QA', userEmail, 'builder')` |
| workspaceInvite.visit | `visitWorkspaceInvitation` | platform/onboarding.js | onboarding | `visitWorkspaceInvitation(userEmail, 'My workspace')` |
| signup.verifyPage | `SignUpPageElements` | platform/onboarding.js | onboarding | `SignUpPageElements()` |
| signup.readLink | `signUpLink` | platform/onboarding.js | onboarding | `signUpLink(userEmail)` |
| signup.verifyBanner | `bannerElementsVerification` | platform/onboarding.js | onboarding | `bannerElementsVerification()` |
| instanceSetting.enableSignup | `enableInstanceSignUp` | platform/onboarding.js | onboarding | `enableInstanceSignUp(true)` |
| onboardingFlow.stepOne | `onboardingStepOne` | platform/onboarding.js | onboarding | `onboardingStepOne()` |
| onboardingFlow.stepTwo | `onboardingStepTwo` | platform/onboarding.js | onboarding | `onboardingStepTwo('My workspace')` |
| onboardingFlow.stepThree | `onboardingStepThree` | platform/onboarding.js | onboarding | `onboardingStepThree()` |
| userMetadata.add | `addUserMetadata` | platform/onboarding.js | access | `addUserMetadata(metadataList)` |
| userMetadata.onboarding | `userMetadataOnboarding` | platform/onboarding.js | access | `userMetadataOnboarding(...)` |
| userMetadata.verifyElements | `verifyUserMetadataElements` | platform/onboarding.js | access | `verifyUserMetadataElements(0)` |
| user.selectGroupOnboarding | `selectUserGroup` | platform/onboarding.js | onboarding | `selectUserGroup('QA Team')` |
| workspaceInvite.acceptWithPassword | `enterPasswordAndAcceptInvite` | platform/onboarding.js | onboarding | `enterPasswordAndAcceptInvite('password')` |
| profile.verifyPage | `profilePageElements` | platform/profile.js | workspace | `profilePageElements()` |
| profile.updateExtApi | `extApiUpdateUser` | platform/profile.js | workspace | `extApiUpdateUser(userEmail, userId)` |
| profile.removeAvatar | `removeAvatar` | platform/profile.js | workspace | `removeAvatar(userEmail)` |
| selfHostSignup.verifyCommon | `selfHostCommonElements` | platform/selfHostSignUp.js | onboarding | `selfHostCommonElements()` |
| selfHostSignup.verifyWorkspaceSetup | `commonElementsWorkspaceSetup` | platform/selfHostSignUp.js | onboarding | `commonElementsWorkspaceSetup()` |
| selfHostSignup.setUserRole | `verifyandModifyUserRole` | platform/selfHostSignUp.js | onboarding | `verifyandModifyUserRole()` |
| selfHostSignup.setCompanySize | `verifyandModifySizeOftheCompany` | platform/selfHostSignUp.js | onboarding | `verifyandModifySizeOftheCompany()` |
| app.createUi | `uiCreateApp` | platform/uiPermissions.js | access | `uiCreateApp(name)` |
| app.verifyCreated | `uiVerifyAppCreated` | platform/uiPermissions.js | access | `uiVerifyAppCreated(name, true)` |
| app.deleteUi | `uiDeleteApp` | platform/uiPermissions.js | access | `uiDeleteApp(name)` |
| app.verifyDeleted | `uiVerifyAppDeleted` | platform/uiPermissions.js | access | `uiVerifyAppDeleted(name)` |
| app.verifyCreatePrivilege | `uiVerifyAppCreatePrivilege` | platform/uiPermissions.js | access | `uiVerifyAppCreatePrivilege(true)` |
| folder.createUi | `uiCreateFolder` | platform/uiPermissions.js | access | `uiCreateFolder(name)` |
| folder.verifyCreated | `uiVerifyFolderCreated` | platform/uiPermissions.js | access | `uiVerifyFolderCreated(name, true)` |
| folder.verifyDeleted | `uiVerifyFolderDeleted` | platform/uiPermissions.js | access | `uiVerifyFolderDeleted(name)` |
| folder.verifyCreatePrivilege | `uiVerifyFolderCreatePrivilege` | platform/uiPermissions.js | access | `uiVerifyFolderCreatePrivilege(true)` |
| workspaceConstant.verifyCreatePrivilege | `uiVerifyWorkspaceConstantCreatePrivilege` | platform/uiPermissions.js | access | `uiVerifyWorkspaceConstantCreatePrivilege(true)` |
| datasource.createUi | `uiCreateDataSource` | platform/uiPermissions.js | access | `uiCreateDataSource(name)` |
| datasource.verifyCreated | `uiVerifyDataSourceCreated` | platform/uiPermissions.js | access | `uiVerifyDataSourceCreated(name, true)` |
| datasource.deleteUi | `uiDeleteDataSource` | platform/uiPermissions.js | access | `uiDeleteDataSource(name)` |
| datasource.verifyDeleted | `uiVerifyDataSourceDeleted` | platform/uiPermissions.js | access | `uiVerifyDataSourceDeleted(name)` |
| datasource.verifyCreatePrivilege | `uiVerifyDataSourceCreatePrivilege` | platform/uiPermissions.js | access | `uiVerifyDataSourceCreatePrivilege(true)` |
| workflow.createUi | `uiCreateWorkflow` | platform/uiPermissions.js | access | `uiCreateWorkflow(name)` |
| workflow.verifyCreated | `uiVerifyWorkflowCreated` | platform/uiPermissions.js | access | `uiVerifyWorkflowCreated(name, true)` |
| workflow.deleteUi | `uiDeleteWorkflow` | platform/uiPermissions.js | access | `uiDeleteWorkflow(name)` |
| workflow.verifyDeleted | `uiVerifyWorkflowDeleted` | platform/uiPermissions.js | access | `uiVerifyWorkflowDeleted(name)` |
| workflow.verifyCreatePrivilege | `uiVerifyWorkflowCreatePrivilege` | platform/uiPermissions.js | access | `uiVerifyWorkflowCreatePrivilege(true)` |
| role.verifyAllCreatePrivileges | `uiVerifyAllCreatePrivileges` | platform/uiPermissions.js | access | `uiVerifyAllCreatePrivileges(...)` |
| role.verifyBuilder | `uiVerifyBuilderPrivileges` | platform/uiPermissions.js | access | `uiVerifyBuilderPrivileges()` |
| role.verifyAdmin | `uiVerifyAdminPrivileges` | platform/uiPermissions.js | access | `uiVerifyAdminPrivileges()` |
| app.crudFlow | `uiAppCRUDWorkflow` | platform/uiPermissions.js | access | `uiAppCRUDWorkflow('MyApp')` |
| folder.crudFlow | `uiFolderCRUDWorkflow` | platform/uiPermissions.js | access | `uiFolderCRUDWorkflow('QA folder')` |
| workspaceConstant.crudFlow | `uiWorkspaceConstantCRUDWorkflow` | platform/uiPermissions.js | access | `uiWorkspaceConstantCRUDWorkflow(...)` |
| datasource.crudFlow | `uiDataSourceCRUDWorkflow` | platform/uiPermissions.js | access | `uiDataSourceCRUDWorkflow(...)` |
| workflow.crudFlow | `uiWorkflowCRUDWorkflow` | platform/uiPermissions.js | access | `uiWorkflowCRUDWorkflow('QA flow')` |
| - | `constantsOperations` | platform/userPermissions.js | access | `constantsOperations   // permission fixture data` |
| role.verifyPermissions | `verifyPermissions` | platform/userPermissions.js | access | `verifyPermissions   // permission fixture data` |
| groupPermission.getInput | `getGroupPermissionInput` | platform/userPermissions.js | access | `getGroupPermissionInput(true, flag)` |
| role.verifyBuilderPermissions | `verifyBuilderPermissions` | platform/userPermissions.js | access | `verifyBuilderPermissions(...)` |
| role.verifyBasicPermissions | `verifyBasicPermissions` | platform/userPermissions.js | access | `verifyBasicPermissions(true)` |
| role.verifySettingsAccess | `verifySettingsAccess` | platform/userPermissions.js | access | `verifySettingsAccess(true)` |
| granularPermission.verifyEnvTagsUi | `verifyEnvironmentTagsInGranularUI` | platform/userPermissions.js | access | `verifyEnvironmentTagsInGranularUI('QA Team', tags)` |
| granularPermission.verifyEnvAccess | `verifyEnvironmentAccess` | platform/userPermissions.js | access | `verifyEnvironmentAccess(environments, options)` |
| role.verifyAppBuilderAccess | `verifyAppBuilderAccess` | platform/userPermissions.js | access | `verifyAppBuilderAccess(envNames, opts)` |
| role.verifyPreviewAccess | `verifyPreviewAccess` | platform/userPermissions.js | access | `verifyPreviewAccess(...)` |
| role.verifyPreviewUrlAccess | `verifyPreviewURLAccess` | platform/userPermissions.js | access | `verifyPreviewURLAccess(envNames, opts)` |
| signup.viaPermissions | `signup` | platform/userPermissions.js | onboarding | `signup('QA User', userEmail)` |
| appVersion.openCreateModal | `navigateToCreateNewVersionModal` | platform/version.js | apps | `navigateToCreateNewVersionModal('v1')` |
| appVersion.openEditModal | `navigateToEditVersionModal` | platform/version.js | apps | `navigateToEditVersionModal('v1')` |
| appVersion.verifyCreateModal | `verifyElementsOfCreateNewVersionModal` | platform/version.js | apps | `verifyElementsOfCreateNewVersionModal([])` |
| appVersion.edit | `editVersionAndVerify` | platform/version.js | apps | `editVersionAndVerify(...)` |
| appVersion.delete | `deleteVersionAndVerify` | platform/version.js | apps | `deleteVersionAndVerify('v2')` |
| appVersion.verifyDuplicate | `verifyDuplicateVersion` | platform/version.js | apps | `verifyDuplicateVersion([], 'v1')` |
| appVersion.release | `releasedVersionAndVerify` | platform/version.js | apps | `releasedVersionAndVerify('v1')` |
| appVersion.verifyAfterPreview | `verifyVersionAfterPreview` | platform/version.js | apps | `verifyVersionAfterPreview('v1')` |
| appVersion.switch | `switchVersionAndVerify` | platform/version.js | apps | `switchVersionAndVerify('v1', 'v2')` |
| app.openPreviewSettings | `openPreviewSettings` | platform/version.js | apps | `openPreviewSettings()` |
| appVersion.createDraft | `createDraftVersion` | platform/version.js | apps | `createDraftVersion('v2-draft', 'v1')` |
| appVersion.openSwitcher | `openVersionSwitcher` | platform/version.js | apps | `openVersionSwitcher()` |
| appVersion.openCreateDraftModal | `openCreateDraftVersionModal` | platform/version.js | apps | `openCreateDraftVersionModal()` |
| whiteLabel.open | `openWhiteLabelingSettings` | platform/whitelabel.js | superAdmin | `openWhiteLabelingSettings()` |
| whiteLabel.verifyPage | `verifyWhiteLabelingUI` | platform/whitelabel.js | superAdmin | `verifyWhiteLabelingUI()` |
| whiteLabel.fillForm | `fillWhiteLabelingForm` | platform/whitelabel.js | superAdmin | `fillWhiteLabelingForm(...)` |
| whiteLabel.save | `saveWhiteLabelingChanges` | platform/whitelabel.js | superAdmin | `saveWhiteLabelingChanges()` |
| whiteLabel.verifyLogo | `verifyCustomLogo` | platform/whitelabel.js | superAdmin | `verifyCustomLogo(...)` |
| whiteLabel.verifyTitleFavicon | `verifyPageTitleAndFavicon` | platform/whitelabel.js | superAdmin | `verifyPageTitleAndFavicon(...)` |
| whiteLabel.verifyLogoLogin | `verifyLogoOnLoginPage` | platform/whitelabel.js | superAdmin | `verifyLogoOnLoginPage()` |
| whiteLabel.verifyLogoWorkspaceLogin | `verifyLogoOnWorkspaceLoginPage` | platform/whitelabel.js | superAdmin | `verifyLogoOnWorkspaceLoginPage('My workspace')` |
| whiteLabel.verifyLogoDashboard | `verifyLogoOnDashboard` | platform/whitelabel.js | superAdmin | `verifyLogoOnDashboard()` |
| - | `cleanEmailBody` | platform/whitelabel.js | superAdmin | `cleanEmailBody(mailBody)` |
| whiteLabel.verifyInEmail | `verifyWhiteLabelInEmail` | platform/whitelabel.js | superAdmin | `verifyWhiteLabelInEmail(...)` |
| whiteLabel.verifyInviteEmail | `verifyInvitationEmail` | platform/whitelabel.js | superAdmin | `verifyInvitationEmail(...)` |
| whiteLabel.verifyInputs | `verifyWhiteLabelInputs` | platform/whitelabel.js | superAdmin | `verifyWhiteLabelInputs(...)` |
| workspaceConstant.verifyNameValidation | `contantsNameValidation` | platform/workspaceConstants.js | workspace | `contantsNameValidation(...)` |
| workspaceConstant.create | `addAndVerifyConstants` | platform/workspaceConstants.js | workspace | `addAndVerifyConstants('API_KEY', 'abc', 'global')` |
| workspaceConstant.delete | `deleteConstant` | platform/workspaceConstants.js | workspace | `deleteConstant('API_KEY', 'Global')` |
| workspaceConstant.verifyDuplicateName | `existingNameValidation` | platform/workspaceConstants.js | workspace | `existingNameValidation(...)` |
| workspaceConstant.verifyForm | `verifyConstantFormUI` | platform/workspaceConstants.js | workspace | `verifyConstantFormUI()` |
| workspaceConstant.switchTab | `switchToConstantTab` | platform/workspaceConstants.js | workspace | `switchToConstantTab('Secrets')` |
| workspaceConstant.verifyValueVisibility | `verifyConstantValueVisibility` | platform/workspaceConstants.js | workspace | `verifyConstantValueVisibility(selector, 'abc')` |
| workspaceConstant.verifySearch | `verifySearch` | platform/workspaceConstants.js | workspace | `verifySearch(data)` |
| workspaceConstant.verifyFormValidation | `VerifyConstantsFormInputValidation` | platform/workspaceConstants.js | workspace | `VerifyConstantsFormInputValidation()` |
| workspaceConstant.crudFlow | `constantsCRUDAndValidations` | platform/workspaceConstants.js | workspace | `constantsCRUDAndValidations(data)` |
| workspaceConstant.verifyEmptyState | `VerifyEmptyScreenUI` | platform/workspaceConstants.js | workspace | `VerifyEmptyScreenUI('production')` |
| environment.selectForConstants | `selectEnv` | platform/workspaceConstants.js | workspace | `selectEnv('production')` |
| workspaceConstant.createAndUpdate | `createAndUpdateConstant` | platform/workspaceConstants.js | workspace | `createAndUpdateConstant(...)` |
| workspaceConstant.verifyInputs | `verifyInputValues` | platform/workspaceConstants.js | workspace | `verifyInputValues(...)` |
| workspaceConstant.importApp | `importConstantsApp` | platform/workspaceConstants.js | workspace | `importConstantsApp('cypress/fixtures/app.json', true)` |
| workspaceConstant.verifySecretMasked | `verifySecretConstantNotResolved` | platform/workspaceConstants.js | workspace | `verifySecretConstantNotResolved(inputWidget)` |
| workspaceConstant.verifyInStaticQuery | `verifyGlobalConstInStaticQuery` | platform/workspaceConstants.js | workspace | `verifyGlobalConstInStaticQuery(selector, expected)` |
| workspaceConstant.verifyQueryPreview | `verifyStaticQueryPreview` | platform/workspaceConstants.js | workspace | `verifyStaticQueryPreview(selector, expected)` |
| workspaceConstant.verifySecretInQueryRaw | `verifySecretInStaticQueryRaw` | platform/workspaceConstants.js | workspace | `verifySecretInStaticQueryRaw(selector)` |
| workspaceConstant.verifyInPreview | `previewAppAndVerify` | platform/workspaceConstants.js | workspace | `previewAppAndVerify(start, end, 'abc')` |
| environment.promoteAndVerify | `promoteEnvAndVerify` | platform/workspaceConstants.js | workspace | `promoteEnvAndVerify(...)` |
| - | `assertTooltipText` | platform/workspaceConstants.js | common | `assertTooltipText(selector, expected)` |
