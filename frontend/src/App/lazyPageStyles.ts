// Stylesheets of the ToolJet Database and profile settings pages, which App.jsx lazy-loads. Their code
// loads only when the page opens, but these styles keep loading with the app: they define classes other
// screens use too (e.g. the ToolJet DB query editor), which were always present before the pages were
// split out. Imported where App.jsx used to import these pages, so CSS order matches.
// __tests__/lazyPageStyles.spec.js fails when a lazy page imports a stylesheet missing from here or
// workspaceSettingsStyles.ts.
import '@/TooljetDatabase/styles/styles.scss';
import '@/TooljetDatabase/Forms/styles.scss';
import '@/TooljetDatabase/Filter/styles.scss';
import '@/TooljetDatabase/Table/styles.scss';
import '@/TooljetDatabase/Table/ActionsPopover/styles.scss';
import '@/TooljetDatabase/Menu/CellEditMenu/styles.scss';
import '@/TooljetDatabase/Drawers/BulkUploadDrawer/styles.scss';
import '@/SettingsPage/resources/styles/access-tokens-card.styles.scss';
import '@/SettingsPage/resources/styles/two-factor-auth-card.styles.scss';
