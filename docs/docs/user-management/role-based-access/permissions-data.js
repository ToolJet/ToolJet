/*
 * Facts for the roles and permissions pages. The components in
 * src/components/AccessBlocks render whatever is here, so a change to the
 * product is a change to this file, not to a component.
 *
 * How to add things
 *   A permission in the Permissions tab: one object in a resource's `flags`,
 *     with the label and helper text as the product shows them.
 *   A resource type: one object in RESOURCES (icon names come from
 *     src/components/DocBlocks/icons.js), then an <AccessLevels id="…" />
 *     line on the Access Control page.
 *   An environment or option: one entry in a modifier's `options`.
 *   A comparison table: one `{ roles, sections }` export like
 *     ADMIN_VS_SUPER_ADMIN.
 *
 * Cell values (the `states` and `summary` objects) are a state id or
 * `{ state, note }`:
 *   'always'  comes with the role and cannot be removed
 *   'default' the role's default group starts with it; an admin can turn it
 *             off for that group or grant it to a custom group
 *   'never'   cannot be given to this role, even through a custom group
 *   'na'      not applicable
 * `note` is a short qualifier shown after the chip, such as "View only".
 *
 * Links are site paths without a version ("/docs/…"); the components move
 * them into the version being read.
 */

const BUILDER_CONFIGURABLE = { admin: 'always', builder: 'default', 'end-user': 'never' };

export const ROLES = [
  {
    id: 'admin',
    label: 'Admin',
    tone: 'violet',
    icon: 'shield-check',
    kind: 'Workspace role',
    description: 'Runs the workspace. Admins invite users, change roles, configure groups and settings, and have every permission on every resource.',
    highlights: [
      'Every permission on every resource',
      'Manages users, groups and workspace settings',
      'Cannot be restricted by a group',
    ],
    href: '#permissions-for-user-roles',
  },
  {
    id: 'builder',
    label: 'Builder',
    tone: 'blue',
    icon: 'hammer',
    kind: 'Workspace role',
    description: 'Builds and maintains apps, workflows and modules, and connects data sources. An admin decides what the Builder group and custom groups may do.',
    highlights: [
      'Creates and edits apps, workflows and modules',
      'Connects and uses data sources',
      'Edits in Development and Staging by default',
    ],
    href: '#permissions-for-user-roles',
  },
  {
    id: 'end-user',
    label: 'End-user',
    tone: 'teal',
    icon: 'mouse-pointer',
    kind: 'Workspace role',
    description: 'Uses the apps and workflows they are given access to. End-users never get edit rights, even through a custom group.',
    highlights: [
      'Opens the released apps they are given access to',
      'Runs the workflows they are given access to',
      'Never edits apps, data or settings',
    ],
    href: '#permissions-for-user-roles',
  },
];

export const SUPER_ADMIN = {
  id: 'super-admin',
  label: 'Super admin',
  tone: 'slate',
  icon: 'server',
  kind: 'Instance role',
  plan: 'team',
  description: 'Manages every workspace, user and instance setting of a self-hosted instance.',
  highlights: ['Reaches every workspace', 'Manages all users of the instance', 'Configures instance login and white labelling'],
  href: '/docs/user-management/role-based-access/super-admin',
};

export const GROUP_ADMIN = {
  id: 'group-admin',
  label: 'Group admin',
  tone: 'amber',
  icon: 'user-cog',
  kind: 'Per custom group',
  plan: 'team',
  description: 'Adds and removes members of the custom groups they are assigned to, without changing permissions.',
  highlights: ['Adds and removes members', 'Reads the group’s permissions', 'Assigned per custom group by an admin'],
  href: '/docs/user-management/role-based-access/group-admin',
};

export const ALL_ROLES = [...ROLES, SUPER_ADMIN, GROUP_ADMIN];

export const RESOURCES = [
  {
    id: 'apps',
    label: 'Apps',
    icon: 'layout',
    href: '/docs/user-management/role-based-access/access-control#apps',
    description: 'Applications built in the Visual Builder or React Builder.',
    summary: { admin: 'always', builder: 'default', 'end-user': { state: 'default', note: 'View only' } },
    flags: [
      { id: 'create', label: 'Create', description: 'Create apps in this workspace', states: BUILDER_CONFIGURABLE },
      { id: 'delete', label: 'Delete', description: 'Delete any app in this workspace', states: BUILDER_CONFIGURABLE },
      { id: 'promote', label: 'Promote', description: 'Promote any app in this workspace', states: BUILDER_CONFIGURABLE },
      { id: 'release', label: 'Release', description: 'Release any app in this workspace', states: BUILDER_CONFIGURABLE },
    ],
    access: {
      scope: ['All apps', 'Custom'],
      scopeNote: 'Custom (selected apps) is available on custom groups only.',
      levels: [
        { id: 'view', label: 'View', description: 'Open and use the app in the environments granted. No changes.' },
        { id: 'edit', label: 'Edit', description: 'Open the app in the builder and change it.' },
      ],
      modifiers: [
        { id: 'hide', label: 'Hide from dashboard', description: 'The app is reachable by its URL only. Applies to View and Edit alike.' },
        {
          id: 'environment',
          label: 'Environment',
          description: 'The environments the group can open the app in.',
          options: ['Development', 'Staging', 'Production', 'Released app'],
          href: '/docs/development-lifecycle/environment/cloud/multi-environment#environment-access-permission',
        },
      ],
      ceiling: { 'end-user': 'view' },
      notes: {
        builder: 'Edit on all apps in Development, Staging and the released app by default. Production is granted per group.',
        'end-user': 'Released app only by default. To let end-users preview in Development or Staging, select those environments on the End-user group.',
      },
    },
  },
  {
    id: 'environments',
    label: 'App environments',
    icon: 'layers',
    href: '/docs/development-lifecycle/environment/cloud/multi-environment#environment-access-permission',
    description: 'Which environments a group can open an app in: Development, Staging, Production or the released app. Set per app grant under Environment.',
    summary: {
      admin: { state: 'always', note: 'All environments' },
      builder: { state: 'default', note: 'Development, Staging, Released app' },
      'end-user': { state: 'default', note: 'Released app only' },
    },
  },
  {
    id: 'workflows',
    label: 'Workflows',
    icon: 'workflow',
    href: '/docs/user-management/role-based-access/access-control#workflows',
    description: 'Automations that run on a schedule, from a webhook or from an app.',
    summary: { admin: 'always', builder: 'default', 'end-user': { state: 'default', note: 'Execute only' } },
    flags: [
      { id: 'create', label: 'Create', description: 'Create workflow in this workspace', states: BUILDER_CONFIGURABLE },
      { id: 'delete', label: 'Delete', description: 'Delete any workflow in this workspace', states: BUILDER_CONFIGURABLE },
    ],
    access: {
      scope: ['All workflows', 'Custom'],
      scopeNote: 'Custom (selected workflows) is available on custom groups only.',
      levels: [
        { id: 'execute', label: 'Execute', description: 'Run the workflow. No changes.' },
        { id: 'edit', label: 'Edit', description: 'Open the workflow in the builder and change it.' },
      ],
      ceiling: { 'end-user': 'execute' },
      notes: { 'end-user': 'Can run the workflows granted, never edit them.' },
    },
  },
  {
    id: 'modules',
    label: 'Modules',
    icon: 'puzzle',
    href: '/docs/user-management/role-based-access/access-control#modules',
    description: 'Reusable building blocks that builders add to apps.',
    summary: { admin: 'always', builder: 'default', 'end-user': { state: 'never', note: 'Through apps only' } },
    flags: [
      { id: 'create', label: 'Create', description: 'Create modules in this workspace', states: BUILDER_CONFIGURABLE },
      { id: 'delete', label: 'Delete', description: 'Delete any module in this workspace', states: BUILDER_CONFIGURABLE },
    ],
    access: {
      scope: ['All modules', 'Custom'],
      scopeNote: 'Custom (selected modules) is available on custom groups only.',
      levels: [
        { id: 'build-with', label: 'Build with', description: 'Use the module in apps. The module itself opens read-only.' },
        { id: 'edit', label: 'Edit', description: 'Open the module in the builder and change it.' },
      ],
      modifiers: [{ id: 'hide', label: 'Hide from dashboard', description: 'The module is reachable by its URL only.' }],
      ceiling: {},
      notes: { 'end-user': 'Never granted directly. End-users use modules through the apps they can open.' },
    },
  },
  {
    id: 'data-sources',
    label: 'Data sources',
    icon: 'database',
    href: '/docs/user-management/role-based-access/access-control#data-sources',
    description: 'Connections to databases, APIs and services.',
    summary: { admin: 'always', builder: 'default', 'end-user': 'never' },
    flags: [
      { id: 'create', label: 'Create', description: 'Create data source connections in this workspace', states: BUILDER_CONFIGURABLE },
      { id: 'delete', label: 'Delete', description: 'Delete any data source in this workspace', states: BUILDER_CONFIGURABLE },
    ],
    access: {
      scope: ['All data sources', 'Custom'],
      scopeNote: 'Custom (selected data sources) is available on custom groups only.',
      ladder: false,
      levels: [
        { id: 'build-with', label: 'Build with', description: 'Use the data source in app and workflow queries.' },
        { id: 'configure', label: 'Configure', description: 'Open and change the connection details.' },
      ],
      modifiers: [
        { id: 'restrict-query-run', label: 'Restrict query run', description: 'Members of the group cannot run queries on the data source.' },
      ],
      ceiling: {},
      notes: { 'end-user': 'Never granted. On a group with end-users, only Restrict query run can be set.' },
    },
  },
  {
    id: 'folders',
    label: 'Folders',
    icon: 'folder',
    href: '/docs/user-management/role-based-access/access-control#folders',
    description: 'Folders organise apps, workflows, modules and data sources. Each kind of folder has its own permissions.',
    summary: { admin: 'always', builder: 'default', 'end-user': { state: 'default', note: 'View apps only' } },
    flags: [
      { id: 'app-folder-create', label: 'App folder: Create', description: 'Create new app folders in this workspace', states: BUILDER_CONFIGURABLE },
      { id: 'app-folder-delete', label: 'App folder: Delete', description: 'Delete any app folders in this workspace', states: BUILDER_CONFIGURABLE },
      { id: 'workflow-folder-create', label: 'Workflow folder: Create', description: 'Create new workflow folders in this workspace', states: BUILDER_CONFIGURABLE },
      { id: 'workflow-folder-delete', label: 'Workflow folder: Delete', description: 'Delete any workflow folders in this workspace', states: BUILDER_CONFIGURABLE },
      { id: 'module-folder-create', label: 'Module folder: Create', description: 'Create new module folders in this workspace', states: BUILDER_CONFIGURABLE },
      { id: 'module-folder-delete', label: 'Module folder: Delete', description: 'Delete any module folders in this workspace', states: BUILDER_CONFIGURABLE },
      { id: 'data-source-folder-create', label: 'Data source folder: Create', description: 'Create new data source folders in this workspace', states: BUILDER_CONFIGURABLE },
      { id: 'data-source-folder-delete', label: 'Data source folder: Delete', description: 'Delete any data source folders in this workspace', states: BUILDER_CONFIGURABLE },
    ],
    access: {
      kinds: ['App folders', 'Workflow folders', 'Module folders', 'Data source folders'],
      scope: ['All folders', 'Custom'],
      scopeNote: 'Custom (selected folders) is available on custom groups only.',
      levels: [
        {
          id: 'view',
          label: 'View apps',
          description: 'Open what is in the folder. Workflow folders: Execute workflows. Module folders: Build with modules. Data source folders: Build with.',
        },
        {
          id: 'edit-items',
          label: 'Edit apps',
          description: 'Change what is in the folder. Workflow folders: Edit workflows. Module folders: Edit modules. Data source folders: Configure.',
        },
        { id: 'edit-folder', label: 'Edit folder', description: 'Rename the folder and add, remove and edit what is in it.' },
      ],
      modifiers: [
        { id: 'restrict-query-run', label: 'Restrict query run', description: 'Data source folders only: members cannot run queries on the data sources in the folder.' },
      ],
      ceiling: { 'end-user': 'view' },
      notes: { 'end-user': 'App folders and workflow folders only. Module folders and data source folders are never granted.' },
    },
  },
  {
    id: 'constants',
    label: 'Workspace constants',
    icon: 'braces',
    href: '/docs/security/constants',
    description: 'Values and secrets shared by apps, workflows and data source connections.',
    summary: { admin: 'always', builder: 'default', 'end-user': 'never' },
    flags: [
      { id: 'manage', label: 'Create/Update/Delete', description: 'All operations on workspace constants', states: BUILDER_CONFIGURABLE },
    ],
  },
  {
    id: 'tooljet-db',
    label: 'ToolJet Database',
    icon: 'table',
    href: '/docs/tooljet-db/tooljet-database',
    description: 'The built-in database: creating and changing tables and their columns. Apps read and write rows through queries.',
    summary: { admin: 'always', builder: 'default', 'end-user': 'never' },
    flags: [
      { id: 'manage', label: 'Create/Update/Delete', description: 'All operations on ToolJet Database', states: BUILDER_CONFIGURABLE },
    ],
  },
  {
    id: 'pat',
    label: 'Personal access tokens',
    icon: 'key',
    description: 'Tokens that sign in to the ToolJet API and CLI as a user.',
    summary: { admin: 'always', builder: 'default', 'end-user': 'never' },
    flags: [
      { id: 'create', label: 'Create', description: 'Create a token in this workspace', states: BUILDER_CONFIGURABLE },
      { id: 'revoke', label: 'Revoke', description: 'Revoke a token in this workspace', states: BUILDER_CONFIGURABLE },
    ],
  },
  {
    id: 'users-and-groups',
    label: 'Users and groups',
    icon: 'users',
    href: '/docs/user-management/role-based-access/custom-groups',
    description: 'Inviting users, changing roles, and creating groups and their permissions. A group admin can add and remove the members of their own groups.',
    summary: { admin: 'always', builder: 'never', 'end-user': 'never' },
  },
];

export const LAYERS = [
  {
    id: 'instance',
    label: 'Instance',
    roles: ['super-admin'],
    description: 'Every workspace and user of a self-hosted instance, instance login and white labelling. A super admin reaches every workspace.',
    href: '/docs/user-management/role-based-access/super-admin',
  },
  {
    id: 'workspace',
    label: 'Workspace',
    roles: ['admin'],
    description: 'Every member is an Admin, a Builder or an End-user. The role is the most a user can ever get.',
    href: '/docs/user-management/role-based-access/user-roles#default-user-roles',
  },
  {
    id: 'groups',
    label: 'Groups',
    roles: ['admin', 'group-admin'],
    description: 'Each role has a default group that carries its permissions. Custom groups add permissions for the members an admin chooses.',
    href: '/docs/user-management/role-based-access/custom-groups',
  },
  {
    id: 'resource',
    label: 'Resource',
    roles: ['admin'],
    description: 'Per group: View or Edit on all or selected apps, workflows, modules, data sources and folders, plus the environments a group can open.',
    href: '/docs/user-management/role-based-access/access-control#granular-access-control',
  },
  {
    id: 'in-app',
    label: 'Inside the app',
    short: 'In the app',
    decidedBy: 'Anyone who can edit the app',
    plan: 'enterprise',
    description: 'Dynamic access rules decide who sees a page or component and who can run a query. Row-level security filters the data a query returns.',
    href: '/docs/app-builder/dynamic-access-rule/overview',
  },
];

export const ADMIN_VS_SUPER_ADMIN = {
  roles: [ROLES[0], SUPER_ADMIN],
  sections: [
    {
      id: 'user-management',
      label: 'User management',
      icon: 'users',
      rows: [
        {
          id: 'manage-users',
          label: 'Manage users in their workspace',
          links: [
            { label: 'Invite', href: '/docs/user-management/onboard-users/invite-user' },
            { label: 'Archive', href: '/docs/user-management/onboard-users/archive-user#steps-to-archive-user' },
            { label: 'Unarchive', href: '/docs/user-management/onboard-users/archive-user#steps-to-unarchive-user' },
          ],
          states: { admin: 'always', 'super-admin': 'always' },
        },
        { id: 'archive-any', label: 'Archive or unarchive any user in any workspace of the instance', states: { admin: 'never', 'super-admin': 'always' } },
        { id: 'reset-password', label: 'Reset the password of any user', href: '/docs/user-management/profile-management/reset-password#super-admin-reset-password', states: { admin: 'never', 'super-admin': 'always' } },
        { id: 'edit-name', label: 'Edit the name of any user', href: '/docs/user-management/profile-management/user-details', states: { admin: 'never', 'super-admin': 'always' } },
        { id: 'make-super-admin', label: 'Make any user a super admin', href: '#promote-a-user-to-super-admin', states: { admin: 'never', 'super-admin': 'always' } },
      ],
    },
    {
      id: 'workspace-management',
      label: 'Workspace management',
      icon: 'layers',
      rows: [
        {
          id: 'manage-groups',
          label: 'Manage groups in their workspace: create groups, add or remove members, change permissions',
          href: '/docs/user-management/role-based-access/custom-groups#creating-custom-groups',
          states: { admin: 'always', 'super-admin': 'always' },
        },
        { id: 'manage-sso', label: 'Manage SSO in their workspace', href: '/docs/user-management/sso/overview', states: { admin: 'always', 'super-admin': 'always' } },
        { id: 'manage-constants', label: 'Manage workspace constants in their workspace', href: '/docs/security/constants', states: { admin: 'always', 'super-admin': 'always' } },
        { id: 'manage-data-sources', label: 'Manage data sources in their workspace', href: '/docs/data-sources/overview', states: { admin: 'always', 'super-admin': 'always' } },
        { id: 'personal-workspace', label: "Open any user's personal workspace and create, edit or delete its apps", states: { admin: 'never', 'super-admin': 'always' } },
        { id: 'archive-admin', label: 'Archive an admin, or any user, of any workspace', states: { admin: 'never', 'super-admin': 'always' } },
        { id: 'any-tooljet-db', label: "Open any user's ToolJet Database", states: { admin: 'never', 'super-admin': 'always' } },
        { id: 'any-workspace-settings', label: "Manage any workspace's settings: groups, SSO, workspace constants", states: { admin: 'never', 'super-admin': 'always' } },
        { id: 'all-users', label: 'Manage every user of every workspace in the instance', states: { admin: 'never', 'super-admin': 'always' } },
      ],
    },
    {
      id: 'instance-management',
      label: 'Instance management',
      icon: 'server',
      rows: [
        { id: 'manage-workspaces', label: 'Archive and unarchive any workspace in the instance', states: { admin: 'never', 'super-admin': 'always' } },
        { id: 'restrict-personal-workspaces', label: 'Restrict the creation of personal workspaces', states: { admin: 'never', 'super-admin': 'always' } },
        { id: 'instance-login', label: 'Configure instance-level login', states: { admin: 'never', 'super-admin': 'always' } },
        { id: 'multiplayer', label: 'Enable multiplayer editing', states: { admin: 'never', 'super-admin': 'always' } },
        { id: 'white-labelling', label: 'Set up white labelling', states: { admin: 'never', 'super-admin': 'always' } },
      ],
    },
  ],
};

export const WORKSPACE_ADMIN_VS_GROUP_ADMIN = {
  roles: [{ ...ROLES[0], label: 'Workspace admin' }, GROUP_ADMIN],
  sections: [
    {
      id: 'groups-and-members',
      label: 'Groups and members',
      icon: 'users',
      rows: [
        { id: 'members', label: 'Add or remove existing workspace users in a group', states: { admin: 'always', 'group-admin': { state: 'always', note: 'Assigned groups only' } } },
        { id: 'read-permissions', label: "View a group's permissions and granular access", states: { admin: 'always', 'group-admin': { state: 'always', note: 'Read-only' } } },
        { id: 'invite-role', label: 'Invite users or change user roles', states: { admin: 'always', 'group-admin': 'never' } },
        { id: 'manage-groups', label: 'Create, rename, duplicate or delete groups', states: { admin: 'always', 'group-admin': 'never' } },
        { id: 'permissions', label: 'Edit permissions and granular access', states: { admin: 'always', 'group-admin': 'never' } },
        { id: 'assign-group-admins', label: 'Assign or remove group admins', states: { admin: 'always', 'group-admin': 'never' } },
      ],
    },
  ],
};

/* The worked example on the Custom Groups page: the Builder group was changed
   to View on all apps; two custom groups add more. */
export const EFFECTIVE_ACCESS_EXAMPLE = {
  persona: 'Priya Raman is a Builder in the Operations and Finance groups.',
  roles: [
    { id: 'builder', label: 'Builder group', tone: 'blue', icon: 'hammer' },
    { id: 'operations', label: 'Operations', tone: 'slate', icon: 'users' },
    { id: 'finance', label: 'Finance', tone: 'slate', icon: 'users' },
    { id: 'result', label: 'Priya gets', tone: 'violet', icon: 'check' },
  ],
  sections: [
    {
      id: 'example',
      label: 'What each group grants',
      rows: [
        {
          id: 'dispatch-app',
          label: 'Dispatch Board app',
          states: {
            builder: { state: 'always', note: 'View, all apps' },
            operations: { state: 'always', note: 'Edit, selected apps' },
            finance: 'never',
            result: { state: 'always', note: 'Edit' },
          },
        },
        {
          id: 'billing-app',
          label: 'Billing Review app',
          states: {
            builder: { state: 'always', note: 'View, all apps' },
            operations: 'never',
            finance: { state: 'always', note: 'View, selected apps' },
            result: { state: 'always', note: 'View' },
          },
        },
        {
          id: 'billing-db',
          label: 'Billing database',
          states: {
            builder: 'never',
            operations: 'never',
            finance: { state: 'always', note: 'Build with' },
            result: { state: 'always', note: 'Build with' },
          },
        },
        {
          id: 'create-apps',
          label: 'Create apps',
          states: { builder: 'always', operations: 'never', finance: 'never', result: 'always' },
        },
        {
          id: 'delete-apps',
          label: 'Delete apps',
          states: { builder: 'never', operations: 'never', finance: 'never', result: 'never' },
        },
      ],
    },
  ],
};
