/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    "doc-home-page",
    {
      'type': 'category',
      'label': 'Getting Started',
      'items': [
        'getting-started/platform-overview',
        'getting-started/quickstart-guide',
      ],
    },
    {
      'type': 'category',
      'label': 'ToolJet Concepts',
      'items': [
        'tooljet-concepts/what-are-components',
        'tooljet-concepts/what-are-datasources',
        'tooljet-concepts/what-are-queries',
        'tooljet-concepts/inspector',
        'tooljet-concepts/what-are-events',
        'tooljet-concepts/actions',
        'tooljet-concepts/variables',
        'tooljet-concepts/how-to-access-values',
        'tooljet-concepts/component-specific-actions',
        'tooljet-concepts/exposed-variables',
        'tooljet-concepts/pages',
        'tooljet-concepts/run-js',
        'tooljet-concepts/styling-components',
        'tooljet-concepts/workspace-constants',
        'tooljet-concepts/permissions',
        'tooljet-concepts/super-admin',
      ],
    },
    {
      'type': 'category',
      'label': 'Setup',
      'link': {
        'type': 'doc',
        'id': 'setup/index',
      },
      'items': [
        'setup/try-tooljet',
        'setup/choose-your-tooljet',
        'setup/system-requirements',
        'setup/digitalocean',
        'setup/docker',
        'setup/ec2',
        'setup/ecs',
        'setup/openshift',
        'setup/helm',
        'setup/kubernetes',
        'setup/kubernetes-gke',
        'setup/kubernetes-aks',
        'setup/kubernetes-eks',
        'setup/azure-container',
        'setup/google-cloud-run',
        'setup/client',
        'setup/env-vars',
        'setup/http-proxy',
        'setup/tooljet-subpath',
        'setup/v2-migration-guide',
        'setup/upgrade-to-lts',
        'setup/upgrade-to-v3',
        'setup/cloud-v3-migration',
      ]
    },
    {
      'type': 'category',
      'label': 'App Builder',
      'items': [
        'app-builder/overview',
        {
          'type': 'category',
          'label': 'Build Apps',
          'items': [
            'app-builder/walkthrough/create-ui',
            'app-builder/walkthrough/create-queries',
            'app-builder/walkthrough/using-code',
            'app-builder/walkthrough/accessing-values',
            'app-builder/walkthrough/variables',
            'app-builder/importing-exporting-applications',
          ],
        },   
        {
          'type': 'category',
          'label': 'References',
          'items': [
            {
              'type': 'category',
              'label': 'Layout Guide',
              'items': [
                'app-builder/components-library',
                'app-builder/query-panel',
                'tutorial/pages',
                'app-builder/topbar',
                'app-builder/left-sidebar',
                'app-builder/canvas',
                'app-builder/preview',
                'app-builder/share',
                'app-builder/customstyles',
              ],
            },
            {
              'type': 'category',
              'label': 'Components Catalog',
              'items': [
                'widgets/overview',
                {
                  'type': 'category',
                  'label': 'Components',
                  'items': [
                    'widgets/bounded-box',
                    'widgets/button',
                    'widgets/button-group',
                    'widgets/calendar',
                    {
                      'type': 'category',
                      'label': 'Chart',
                      'items': [
                        'widgets/chart/chart-properties',
                        'widgets/chart/chart-examples',
                        'widgets/chart/transforming-data-for-charts'
                      ]
                    },
                    {
                      'type': 'category',
                      'label': 'Chat',
                      'items': [
                        'widgets/chat/overview'
                      ]
                    },
                    'widgets/checkbox',
                    'widgets/circular-progress-bar',
                    'widgets/code-editor',
                    'widgets/color-picker',
                    'widgets/container',
                    'widgets/custom-component',
                    'widgets/date-range-picker',
                    'widgets/datepicker',
                    'widgets/divider',
                    'widgets/dropdown',
                    'widgets/file-picker',
                    'widgets/form',
                    'widgets/html',
                    'widgets/icon',
                    'widgets/iframe',
                    'widgets/image',
                    'widgets/kanban',
                    'widgets/link',
                    'widgets/listview',
                    'widgets/map',
                    'widgets/modal',
                    'widgets/multiselect',
                    'widgets/number-input',
                    'widgets/password-input',
                    'widgets/pdf',
                    'widgets/pagination',
                    'widgets/qr-scanner',
                    'widgets/radio-button',
                    'widgets/range-slider',
                    'widgets/spinner',
                    'widgets/star-rating',
                    'widgets/statistics',
                    'widgets/steps',
                    'widgets/svg-image',
                    {
                      'type': 'category',
                      'label': 'Table',
                      'items': [
                        'widgets/table/table-properties',
                        'widgets/table/table-columns',
                        'widgets/table/table-csa-and-variables',
                        {
                          'type': 'category',
                          'label': 'Serverside Operations',
                          'items' : [
                            'widgets/table/serverside-operations/overview',
                            'widgets/table/serverside-operations/search',
                            'widgets/table/serverside-operations/sort',
                            'widgets/table/serverside-operations/filter',
                            'widgets/table/serverside-operations/pagination'
                          ]
                        },
                        'widgets/table/dynamic-column'
                      ]
                    },
                    'widgets/tabs',
                    'widgets/tags',
                    'widgets/text-input',
                    'widgets/text',
                    'widgets/textarea',
                    'widgets/rich-text-editor',
                    'widgets/timeline',
                    'widgets/timer',
                    'widgets/toggle-switch-v2',
                    'widgets/tree-select',
                    'widgets/vertical-divider',
                  ],
                },
                {
                  'type': 'category',
                  'label': 'Actions Reference',
                  'link': {
                    'type': 'generated-index',
                    'title': 'Actions Reference',
                    'description': 'All the actions that can be performed through event handlers',
                    'keywords': [
                      'actions',
                      'events',
                    ],
                  },
                  'items': [
                    'actions/show-alert',
                    'actions/logout',
                    'actions/run-query',
                    'actions/open-webpage',
                    'actions/go-to-app',
                    'actions/show-modal',
                    'actions/close-modal',
                    'actions/copy-to-clipboard',
                    'actions/set-localstorage',
                    'actions/generate-file',
                    'actions/set-table-page',
                    'actions/set-variable',
                    'actions/unset-variable',
                    'actions/switch-page',
                    'actions/set-page-variable',
                    'actions/unset-page-variable',
                    'actions/control-component',
                  ],
                },
              ],
            },
          ],
        },
        'app-builder/anti-patterns',
        'tutorial/keyboard-shortcuts',
      ],
    },
    {
      'type': 'category',
      'label': 'How To',
      'items': [
        'how-to/use-url-params-on-load',
        'how-to/pass-query-params-in-custom-components',
        'how-to/use-custom-parameters',
        'how-to/pass-values-in-rest-api',
        'how-to/build-dynamic-forms',
        'how-to/setup-rsyslog',
        'how-to/conditionally-display-components',
        'how-to/use-inspector',
        'how-to/use-form-component',
        'how-to/access-cellvalue-rowdata',
        'how-to/conditionally-format-table',
        'how-to/bulk-update-multiple-rows',
        'how-to/delete-multiple-rows',
        'how-to/use-server-side-pagination',
        'how-to/access-currentuser',
        'how-to/use-axios-in-runjs',
        'how-to/import-external-libraries-using-runpy',
        'how-to/import-external-libraries-using-runjs',
        'how-to/run-actions-from-runjs',
        'how-to/intentionally-fail-js-query',
        'how-to/run-query-at-specified-intervals',
        'how-to/use-to-py-function-in-runpy',
        'how-to/access-users-location',
        'how-to/use-s3-signed-url-to-upload-docs',
        'how-to/s3-custom-endpoints',
        'how-to/upload-files-aws',
        'how-to/upload-files-gcs',
        'how-to/loading-image-pdf-from-db',
        'how-to/use-events-on-chart',
        'how-to/print-multi-tabs-report',
        'how-to/display-listview-record-on-new-page'
      ],
    },
    {
      'type': 'category',
      'label': 'Data Sources',
      'items': [
        'data-sources/overview',
        'data-sources/sample-data-sources',
        {
          'type': 'category',
          'label': 'Datasources library',
          'items': [
            'data-sources/airtable',
            'data-sources/s3',
            'data-sources/amazonses',
            'data-sources/appwrite',
            'data-sources/athena',
            'data-sources/azureblobstorage',
            'data-sources/baserow',
            'data-sources/bigquery',
            'data-sources/firestore',
            'data-sources/clickhouse',
            'data-sources/cosmosdb',
            'data-sources/couchdb',
            'data-sources/databricks',
            'data-sources/dynamodb',
            'data-sources/elasticsearch',
            'data-sources/gcs',
            'data-sources/googlesheets',
            'data-sources/graphql',
            'data-sources/grpc',
            'data-sources/influxdb',
            'data-sources/mailgun',
            'data-sources/mariadb',
            'data-sources/minio',
            'data-sources/mongodb',
            'data-sources/mssql',
            'data-sources/mysql',
            'data-sources/n8n',
            'data-sources/notion',
            'data-sources/openapi',
            'data-sources/oracledb',
            'data-sources/postgresql',
            'data-sources/redis',
            {
              'type': 'category',
              'label': 'REST API',
              'collapsed': false,
              'items': [
                'data-sources/restapi/configuration',
                'data-sources/restapi/authentication',
                'data-sources/restapi/querying-rest-api',
                'data-sources/restapi/metadata-and-cookies',

              ],
            },
            'data-sources/soap-api',
            'data-sources/rethinkdb',
            'data-sources/run-js',
            'data-sources/run-py',
            'data-sources/saphana',
            'data-sources/sendgrid',
            'data-sources/slack',
            'data-sources/smtp',
            'data-sources/snowflake',
            'data-sources/stripe',
            'data-sources/twilio',
            'data-sources/typesense',
            'data-sources/woocommerce',
            'data-sources/zendesk',
          ],
        },
        'tutorial/transformations',
        'data-sources/local-data-sources-migration',
      ],
    },
    {
      'type': 'category',
      'label': 'ToolJet Database',
      'items': [
        'tooljet-db/tooljet-database',
        'tooljet-db/database-editor',
        {
          'type': 'category',
          'label': 'Column Constraints',
          'items': [
            'tooljet-db/constraints/primary-key',
            'tooljet-db/constraints/foreign-key'
          ]
        },
        'tooljet-db/data-types',
        'tooljet-db/table-operations',
        'tooljet-db/querying-tooljet-db',
      ]
    },
    {
      'type': 'category',
      'label': 'Org Management',
      'items': [
        'dashboard',
        {
          "type": "category",
          "label": "Workspaces",
          "items": [
            "org-management/workspaces/workspace_overview",
            "org-management/workspaces/workspace-variables",
            "org-management/workspaces/workspace-variables-migration",
            "org-management/workspaces/workspace_constants"
          ]
        },
        {
          'type': 'category',
          'label': 'User Authentication',
          'items': [
            'user-authentication/user-lifecycle',
            'user-authentication/workspace-login',
            {
              'type': 'category',
              'label': 'SSO',
              'items': [
                'user-authentication/sso/github',
                'user-authentication/sso/google',
                {
                  'type': 'category',
                  'label': 'OpenId Connect',
                  'link': {
                    'type': 'generated-index',
                    'title': 'OpenId Connect',
                    'description': ' ',
                    'keywords': [
                      'okta',
                      'openid',
                      'azureAD',
                    ],
                  },
                  'collapsed': true,
                  'items': [
                    'user-authentication/sso/openid/setup',
                    'user-authentication/sso/openid/azuread',
                    'user-authentication/sso/openid/okta',
                    'user-authentication/sso/openid/google-openid',
                  ],
                },
                'user-authentication/sso/oidc',
                'user-authentication/sso/ldap',
                'user-authentication/sso/saml',
                'user-authentication/sso/auto-sso-login',
              ],
            },
          ],
        },
        'org-management/permissions',
        'tutorial/manage-users-groups',
        'tutorial/tooljet-api',
        'Enterprise/audit_logs',
        'Enterprise/white-label',
        'Enterprise/superadmin',
        {
          "type": "category",
          "label": "Licensing",
          "items": [
            "org-management/licensing/tooljet-cloud",
            "org-management/licensing/self-hosted"
          ]
        },
        "org-management/smtp-configuration"
      ],
    },
    {
      'type': 'category',
      'label': 'Release Management',
      'items': [
        {
          'type': 'category',
          'label': 'GitSync',
          'items': [
            'release-management/gitsync/overview',
            'release-management/gitsync/tj-config',
            'release-management/gitsync/ssh-config',
            'release-management/gitsync/delete-gitsync',
            'release-management/gitsync/git-push',
            'release-management/gitsync/git-pull',
          ]
        },
        'release-management/multi-environment',
        'tutorial/versioning-and-release',
      ],
    },
    {
      'type': 'category',
      'label': 'Workflows',
      'items': [
        'workflows/overview',
        'workflows/nodes',
        'workflows/workflow-triggers',
        'workflows/results',
        'workflows/permissions',
        {
          'type': 'category',
          'label': 'How-to',
          'items': [
            'workflows/trigger-using-webhook',
            'workflows/trigger-workflow-from-app'
          ]
        }
      ],
    },
    {
      'type': 'category',
      'label': 'Marketplace',
      'collapsed': true,
      'items': [
        'marketplace/marketplace-overview',
        {
          'type': 'category',
          'label': 'Marketplace Plugins',
          'items': [
            'marketplace/plugins/marketplace-plugin-awsredshift',
            'marketplace/plugins/marketplace-plugin-textract',
            'marketplace/plugins/marketplace-plugin-aws-lambda',
            'marketplace/plugins/marketplace-plugin-engagespot',
            'marketplace/plugins/marketplace-plugin-github',
            'marketplace/plugins/marketplace-plugin-harperdb',
            'marketplace/plugins/marketplace-plugin-openai',
            'marketplace/plugins/marketplace-plugin-plivo',
            'marketplace/plugins/marketplace-plugin-salesforce',
            'marketplace/plugins/marketplace-plugin-supabase',
            'marketplace/plugins/marketplace-plugin-pocketbase',
            'marketplace/plugins/marketplace-plugin-portkey',
            'marketplace/plugins/marketplace-plugin-Presto',
            'marketplace/plugins/marketplace-plugin-jira',
            'marketplace/plugins/marketplace-plugin-sharepoint',
            'marketplace/plugins/marketplace-plugin-pinecone'
          ],
        },
      ],
    },
    'tooljet-copilot',
    'security',
    'tracking',
    {
      'type': 'category',
      'label': 'Project Overview',
      'collapsed': true,
      'items': [
        'project-overview/release-notes',
        {
          'type': 'link',
          'label': 'Roadmap',
          'href': 'https://github.com/orgs/ToolJet/projects/15',
        },
        'versions'
      ],
    },
    {
      'type': 'category',
      'label': 'Contributing Guide',
      'collapsed': true,
      'items': [
        'contributing-guide/setup/architecture',
        {
          'type': 'category',
          'label': 'Setup',
          'items': [
            'contributing-guide/setup/codespaces',
            'contributing-guide/setup/macos',
            'contributing-guide/setup/docker',
            'contributing-guide/setup/ubuntu',
            'contributing-guide/setup/windows',
            'contributing-guide/setup/system-requirements-for-contributing',
          ],
        },
        {
          'type': 'category',
          'label': 'Marketplace',
          'items': [
            'contributing-guide/marketplace/marketplace-setup',
            'contributing-guide/marketplace/creating-a-plugin',
          ],
        },
        {
          'type': 'category',
          'label': 'Documentation',
          'items': [
            'contributing-guide/documentation-guidelines/introduction',
            'contributing-guide/documentation-guidelines/pr-checklist',
            'contributing-guide/documentation-guidelines/style-guide',

          ],
        },
        'tooljet-cli',
        'contributing-guide/testing',
        'contributing-guide/l10n',
        {
          'type': 'category',
          'label': 'Troubleshooting',
          'items': [
            'contributing-guide/troubleshooting/eslint',
            'contributing-guide/troubleshooting/runpy-limitations',
          ],
        },
        'contributing-guide/code-of-conduct',
        'contributing-guide/slackcoc',
      ],
    },
  ],
};

module.exports = sidebars;
