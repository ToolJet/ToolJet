// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  api: [
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
            'tooljet-api/users/get-user-metadata',
            'tooljet-api/users/update-user-metadata',
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
            'tooljet-api/groups/create-group',
            'tooljet-api/groups/get-all-groups',
            'tooljet-api/groups/get-group',
            'tooljet-api/groups/update-group',
            'tooljet-api/groups/delete-group',
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
