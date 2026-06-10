// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  api: [
    {
      type: 'link',
      label: '← Back to Docs',
      href: '/docs',
      className: 'sidebar-back-to-docs',
    },
    { type: 'doc', id: 'index', label: 'Overview' },
    {
      type: 'category',
      label: 'ToolJet API',
      className: 'category-as-header no-icon',
      collapsed: false,
      collapsible: false,
      items: [
        'tooljet-api/index',
        {
          type: 'category',
          label: 'Users',
          items: [
            'tooljet-api/users/get-all-users',
            'tooljet-api/users/get-user',
            'tooljet-api/users/create-user',
            'tooljet-api/users/update-user',
            'tooljet-api/users/update-user-role',
            'tooljet-api/users/replace-user-workspace',
            'tooljet-api/users/replace-user-workspaces',
            { type: 'doc', id: 'tooljet-api/users/get-user-metadata', className: 'sidebar-badge-beta' },
            { type: 'doc', id: 'tooljet-api/users/update-user-metadata', className: 'sidebar-badge-beta' },
          ],
        },
        {
          type: 'category',
          label: 'Workspaces',
          items: [
            'tooljet-api/workspaces/get-all-workspaces',
            'tooljet-api/workspaces/get-all-app-details',
          ],
        },
        {
          type: 'category',
          label: 'Apps',
          items: [
            'tooljet-api/apps/export-application',
            'tooljet-api/apps/import-application',
            'tooljet-api/apps/save-app-version',
          ],
        },
        {
          type: 'category',
          label: 'Modules',
          items: [
            'tooljet-api/modules/list-modules',
            'tooljet-api/modules/export-module',
            'tooljet-api/modules/import-module',
          ],
        },
        {
          type: 'category',
          label: 'Groups',
          items: [
            { type: 'doc', id: 'tooljet-api/groups/create-group', className: 'sidebar-badge-beta' },
            { type: 'doc', id: 'tooljet-api/groups/get-all-groups', className: 'sidebar-badge-beta' },
            { type: 'doc', id: 'tooljet-api/groups/get-group', className: 'sidebar-badge-beta' },
            { type: 'doc', id: 'tooljet-api/groups/update-group', className: 'sidebar-badge-beta' },
            { type: 'doc', id: 'tooljet-api/groups/delete-group', className: 'sidebar-badge-beta' },
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'GitSync API',
      className: 'category-as-header no-icon',
      collapsed: false,
      collapsible: false,
      items: [
        'gitsync-api/index',
        'gitsync-api/add-git-config',
        'gitsync-api/push-app-version',
        'gitsync-api/create-app-from-git',
        'gitsync-api/sync-pull-app',
        'gitsync-api/auto-promote-app',
        'gitsync-api/release-app-version',
      ],
    },
    {
      type: 'category',
      label: 'SCIM',
      className: 'category-as-header no-icon',
      collapsed: false,
      collapsible: false,
      items: [
        'scim/index',
        {
          type: 'category',
          label: 'Users',
          items: [
            'scim/users/list-users',
            'scim/users/create-user',
            'scim/users/get-user',
            'scim/users/replace-user',
            'scim/users/patch-user',
            'scim/users/delete-user',
          ],
        },
        {
          type: 'category',
          label: 'Groups',
          items: [
            'scim/groups/list-groups',
            'scim/groups/create-group',
            'scim/groups/get-group',
            'scim/groups/replace-group',
            'scim/groups/patch-group',
            'scim/groups/delete-group',
          ],
        },
      ],
    },
  ],
};

module.exports = sidebars;
