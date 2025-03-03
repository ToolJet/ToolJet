export enum FEATURE_KEY {
  GIT_SYNC_GET_ORG_GIT = 'git_sync_get_org_git', // Corresponds to getOrgGitByOrgId (GET 'git-sync/:id')
  GIT_SYNC_GET_ORG_GIT_STATUS = 'git_sync_get_org_git_status', // Corresponds to getOrgGitStatusByOrgId (GET 'git-sync/:id/status')
  GIT_SYNC_CREATE_ORG_GIT = 'git_sync_create_org_git', // Corresponds to create (POST 'git-sync')
  GIT_SYNC_UPDATE_ORG_GIT = 'git_sync_update_org_git', // Corresponds to update (PUT 'git-sync/:id')
  GIT_SYNC_FINALIZE_ORG_GIT = 'git_sync_finalize_org_git', // Corresponds to setFinalizeConfig (PUT 'git-sync/finalize/:id')
  GIT_SYNC_CHANGE_STATUS = 'git_sync_change_status', // Corresponds to changeStatus (PUT 'git-sync/status/:id')
  GIT_SYNC_DELETE_ORG_GIT = 'git_sync_delete_org_git', // Corresponds to deleteConfig (DELETE 'git-sync/:id')
}
