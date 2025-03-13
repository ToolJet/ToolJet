export enum FEATURE_KEY {
  GIT_CREATE_APP = 'git_create_app', // Corresponds to createGitApp (POST 'gitpull/app')
  GIT_UPDATE_APP = 'git_update_app', // Corresponds to pullGitAppChanges (POST 'gitpull/app/:appId')
  GIT_GET_APPS = 'git_get_apps', // Corresponds to getAppsMetaFile (GET 'gitpull')
  GIT_GET_APP = 'git_get_app', // Corresponds to getAppMetaFile (GET 'gitpull/app/:appId')
  GIT_GET_APP_CONFIG = 'git_get_app_config', // Corresponds to getAppConfig (GET ':workspaceId/app/:versionId')
  GIT_SYNC_APP = 'git_sync_app', // Corresponds to gitSyncApp (POST 'gitpush/:appGitId/:versionId')
}
