/**
 * Old migrations (before the cutoff) that async mode may still run the split way.
 *
 * This is the list of migrations a 3.21.58 database has not run yet. We checked them: their schema
 * steps only add things, and the destructive steps sit in the data phase. So if the data phase fails,
 * 3.21.58 still runs on the database.
 *
 * Any other old migration pending means the database is older than 3.21.58. Then the whole upgrade
 * runs in one transaction before the server starts.
 *
 * Add a name here only after repeating that check for it.
 */
export const ASYNC_SAFE_PRE_CUTOFF_MIGRATIONS: ReadonlySet<string> = new Set([
  'ConsolidatedBranchModelSetup1773500000000',
  'EnsureDefaultBranchForAllOrganizations1781740800000',
  'BackfillPublishedVersionMetadataFromDraft1781740850000',
  'MakeDataSourceVersionBranchIdNotNullAndDropIsDefault1781740900000',
  'MakeAppVersionBranchIdNotNullAndGitSyncFlags1781741000000',
  'SyncPublishedMetaFromSyncedDraft1781741200000',
  'AddSyncFlagColumnsToVersions1782000000000',
  'ExemptUnsyncedDraftsFromDefaultBranchUniqueIndex1782100000000',
  'AddLastBranchIdToOrganizationUsers1782200000000',
  'CopyWorkflowAppMetaToAppVersions1782250000000',
  'AddWorkflowSlugUniqueTrigger1782300000000',
  'BackfillWorkflowBranchIdAndEnforceNotNull1782400000000',
  'DropGitSyncMetaHashColumns1782500000000',
  'MergeWorkflowSlugUniqueTrigger1782500000000',
  'AddGitTreeShaColumns1782600000000',
  'AddUseEnvConfigColumnToSsoConfigsTable1782900000000',
  'DropOrganizationGitSshTable1782900000000',
  'AddWebhookColumnsToOrgGitSync1783400000000',
  'CreateGitSyncWebhookEventsTable1783400000001',
  'AddWebhookEventsColumn1783400000002',
  'MigrateVisibilityTooltipForTimeline1783915254008',
  'AddMfaColumnsToUsers1784073600000',
  'AddMfaEnabledInInstanceSettings1784073600001',
  'AddWorkflowFolderGranularPermissions1784112371030',
  'AddWorkflowFolderGranularPermissionsToExistingAdminGroups1784112436513',
  'AddCanRunQueryToDataSourcesGroupPermissions1784505600000',
  'AddGrokAndOpenRouterToOrganizationAiKeysProvider1784527463000',
  'AddUserLevelLlmPreference1784527464000',
  'AddAiActiveRuns1784527465000',
  'AddModelToOrganizationAiKeys1784527467000',
  'AddAiBuildNotificationPreference1784527468000',
  'AddModuleFolderGranularPermissions1784551352800',
  'AddModuleFolderGranularPermissionsToExistingAdminAndBuilderGroups1784551394230',
  'BackfillLegacyInputSizeProperty1784874333000',
  'BackfillMysqlDatasourceConnectionType1785283260000',
  'CreateCustomComponentLibraryTables1785405680975',
  'AddUserLevelLlmModel1785456000000',
  'MakeDataSourceVersionNameCaseSensitive1785500000000',
  'DropPulledAtAndRemoteUpdatedAt1785600000000',
  'BackfillFolderAppsDefaultBranchIdAndEnforceNotNull1785700000000',
  'BackfillIsSyncedForSavedVersions1785800000000',
  'AddDsUserTokenData1785900000000',
  'MoveOauthTokens1785950000000',
  'RenameFolderGranularPermissionToAppFolders1786702061672',
  'FinalizeBranchModelConstraints1786800000000',
  'ClearGitSyncStateForUnconfiguredOrgs1786900000000',
  'AddConversationLevelLlmSelection1787000000000',
  'BackfillKeyValuePairPaddingInside1787702400000',
  'GeneralizeUserPersonalAccessTokens1787724102950',
  'ClearSalesforceUserTokensWithoutInstanceUrl1787800000000',
  'AddAiRunCancellation1788820000000',
]);

/**
 * Data migrations in that list which also alter tables. Their locks last until the data phase commits and
 * block reads of those tables too. All first shipped in 3.21.63, so only upgrades from 3.21.58 to 3.21.62 run them.
 */
export const TABLE_ALTERING_DATA_MIGRATIONS: ReadonlySet<string> = new Set([
  'MakeDataSourceVersionBranchIdNotNullAndDropIsDefault1781740900000',
  'MakeAppVersionBranchIdNotNullAndGitSyncFlags1781741000000',
  'BackfillWorkflowBranchIdAndEnforceNotNull1782400000000',
  'DropGitSyncMetaHashColumns1782500000000',
  'MergeWorkflowSlugUniqueTrigger1782500000000',
  'DropOrganizationGitSshTable1782900000000',
  'MakeDataSourceVersionNameCaseSensitive1785500000000',
  'DropPulledAtAndRemoteUpdatedAt1785600000000',
  'BackfillFolderAppsDefaultBranchIdAndEnforceNotNull1785700000000',
]);
