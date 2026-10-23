// Stylesheets of the workspace settings page, which App.jsx lazy-loads. Loaded with the app for the same
// reason as lazyPageStyles.ts (e.g. instance SSO settings reuse its classes). Imported where App.jsx
// imports @/modules, which used to bring this page in, so CSS order matches.
import '@/modules/WorkspaceSettings/components/BaseSSOConfigurationList/Configuration.scss';
import '@/modules/WorkspaceSettings/components/ManageOrgConstantsSettings/ConstantFormStyle.scss';
import '@/modules/WorkspaceSettings/pages/CustomComponentLibraries/custom-component-libraries.styles.scss';
import '@/modules/WorkspaceSettings/pages/Groups/resources/styles/group-permissions.styles.scss';
import '@/modules/WorkspaceSettings/pages/Groups/components/BaseManageGroupPermissionResources/resources/styles/group-permission-resources.styles.scss';
import '@/modules/WorkspaceSettings/pages/Users/components/BulkUploadUsersDrawer/BulkUploadUsersDrawer.scss';
