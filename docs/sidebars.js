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
    {
      'type': 'category',
      'label': 'Getting Started',
      'className': 'category-as-header getting-started-header',
      'collapsed': false,
      'collapsible': false,
      'items': [
        'doc-home-page',
        'getting-started/platform-overview',
        'getting-started/quickstart-guide',
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
          'label': 'Deployment',
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
            'setup/env-vars',
            'setup/http-proxy',
            'setup/tooljet-subpath',
            'setup/v2-migration-guide',
            'setup/upgrade-to-lts',
            'setup/upgrade-to-v3',
            'setup/cloud-v3-migration',
          ]
        }
      ],
    },
    {
      "type": "category",
      "label": "Build with AI",
      'className': 'category-as-header build-with-ai-header',
      'collapsed': false,
      'collapsible': false,
      "items": [
        "build-with-ai/overview",
        "build-with-ai/generate-applications",
        "build-with-ai/ai-docs-assistant"
      ]
    },
    {
      'type': 'category',
      'label': 'App Builder',
      'collapsed': false,
      'collapsible': false,
      'className': 'category-as-header app-builder-header',
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
            {
              'type': 'category',
              'label': 'Import Libraries',
              'items': [
                'app-builder/import-libraries/runjs',
                'app-builder/import-libraries/runpy',
              ],
            },
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
                        'widgets/chat/overview',
                        'widgets/chat/properties',
                        'widgets/chat/csa',
                        'widgets/chat/markdown'
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
                          'items': [
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
        'tutorial/transformations',
        'app-builder/anti-patterns',
        'tutorial/keyboard-shortcuts',
      ],
    },
    {
      'type': 'category',
      'label': 'Data Sources',
      'className': 'category-as-header data-sources-header',
      'collapsed': false,
      'collapsible': false,
      'items': [
        'data-sources/overview',
        {
          'type': 'category',
          'label': 'Data Sources library',
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
              'collapsed': true,
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
                'marketplace/plugins/marketplace-plugin-pinecone',
                'marketplace/plugins/marketplace-plugin-gemini',
                'marketplace/plugins/marketplace-plugin-anthropic',
                'marketplace/plugins/marketplace-plugin-mistral_ai',
                'marketplace/plugins/marketplace-plugin-hugging_face',
                'marketplace/plugins/marketplace-plugin-cohere',
                'marketplace/plugins/marketplace-plugin-weaviate',
                'marketplace/plugins/marketplace-plugin-qdrant'
              ],
            },
          ],
        },
        'data-sources/permissions',
        'data-sources/sample-data-sources',
      ],
    },
    {
      'type': 'category',
      'label': 'ToolJet Database',
      'className': 'category-as-header tjdb-header',
      'collapsed': false,
      'collapsible': false,
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
      'label': 'Workflows',
      'className': 'category-as-header workflows-header',
      'collapsed': false,
      'collapsible': false,
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
            'workflows/how-to/trigger-using-webhook',
            'workflows/how-to/trigger-workflow-from-app',
            'workflows/how-to/trigger-workflow-using-scheduler'
          ]
        }
      ],
    },
    {
      'type': 'category',
      'label': 'Setup ToolJet',
      'className': 'category-as-header setup-tj-header',
      'collapsible': false,
      'collapsed': false,
      'items': [
        'tj-setup/overview',
        'tj-setup/tj-deployment',
        {
          'type': 'category',
          'label': 'Licensing',
          'items': [
            'tj-setup/licensing/self-hosted',
            'tj-setup/licensing/cloud'
          ]
        },
        'tj-setup/instances',
        'tj-setup/workspaces',
        {
          'type': 'category',
          'label': 'Branding',
          'items': [
            'tj-setup/org-branding/white-labeling',
            'tj-setup/org-branding/custom-domain'
          ]
        },
        {
          'type': 'category',
          'label': 'Setup SMTP Server',
          'link': {
            'type': 'doc',
            'id': 'tj-setup/smtp-setup/configuration',
          },
          'items': [
            'tj-setup/smtp-setup/configuration',
            'tj-setup/smtp-setup/email-providers'
          ]
        }
      ]
    },
    {
      'type': 'category',
      'collapsed': false,
      'collapsible': false,
      'className': 'category-as-header user-management-header',
      'label': 'User Management and Access Control',
      'items': [
        'user-management/overview',
        {
          'type': 'category',
          'label': 'Onboard and Offboard Users',
          'items': [
            'user-management/onboard-users/overview',
            'user-management/onboard-users/invite-user',
            'user-management/onboard-users/bulk-invite-users',
            'user-management/onboard-users/self-signup-user',
            'user-management/onboard-users/user-metadata',
            'user-management/onboard-users/archive-user',
          ]
        },
        {
          'type': 'category',
          'label': 'Authentication',
          'items': [
            {
              'type': 'category',
              'label': 'Self-hosted',
              'items': [
                'user-management/authentication/self-hosted/overview',
                'user-management/authentication/self-hosted/instance-login',
                'user-management/authentication/self-hosted/workspace-login'
              ]
            },
            'user-management/authentication/cloud-login',
          ]
        },
        {
          'type': 'category',
          'label': 'Role Based Access Control',
          'items': [
            'user-management/role-based-access/super-admin',
            'user-management/role-based-access/user-roles',
            'user-management/role-based-access/custom-groups',
            'user-management/role-based-access/access-control',
          ]
        },
        {
          'type': 'category',
          'label': 'Single Sign-On (SSO)',
          'link': {
            'type': 'doc',
            'id': 'user-management/sso/overview',
          },
          'items': [
            'user-management/sso/overview',
            'user-management/sso/github',
            'user-management/sso/google',
            {
              'type': 'category',
              'label': 'OpenID Connect',
              'link': {
                'type': 'doc',
                'id': 'user-management/sso/oidc/setup',
              },
              'items': [
                'user-management/sso/oidc/setup',
                'user-management/sso/oidc/azuread',
                'user-management/sso/oidc/okta',
                'user-management/sso/oidc/google'
              ]
            },
            'user-management/sso/ldap',
            {
              'type': 'category',
              'label': 'SAML',
              'link': {
                'type': 'doc',
                'id': 'user-management/sso/saml/setup',
              },
              'items': [
                'user-management/sso/saml/setup',
                'user-management/sso/saml/okta'
              ]
            },
          ]
        },
        {
          'type': 'category',
          'label': 'Group Sync',
          'items': [
            'user-management/group-sync/oidc'
          ]
        },
        {
          'type': 'category',
          'label': 'Profile Management',
          'items': [
            'user-management/profile-management/user-details',
            'user-management/profile-management/reset-password',
            'user-management/profile-management/user-profile'
          ]
        }
      ]
    },
    {
      'type': 'category',
      'collapsed': false,
      'collapsible': false,
      'className': 'category-as-header dev-cycle-header',
      'label': 'Development Lifecycle',
      'items': [
        'development-lifecycle/overview',
        {
          'type': 'category',
          'label': 'Release Management',
          'items': [
            'development-lifecycle/release/version-control',
            'development-lifecycle/release/release-rollback',
            'development-lifecycle/release/share-app',
          ]
        },
        {
          'type': 'category',
          'label': 'GitSync',
          'items': [
            'development-lifecycle/gitsync/overview',
            'development-lifecycle/gitsync/gitsync-config',
            'development-lifecycle/gitsync/ssh-config',
            'development-lifecycle/gitsync/delete-gitsync',
            'development-lifecycle/gitsync/push',
            'development-lifecycle/gitsync/pull'
          ]
        },
        {
          'type': 'category',
          'label': 'Environment',
          'items': [
            {
              'type': 'category',
              'label': 'Self-Hosted',
              'items': [
                'development-lifecycle/environment/self-hosted/multi-environment',
                'development-lifecycle/environment/self-hosted/example-configuration',
                {
                  'type': 'category',
                  'label': 'Multi-Instance',
                  'items': [
                    'development-lifecycle/environment/self-hosted/multi-instance/instance-as-environment',
                    'development-lifecycle/environment/self-hosted/multi-instance/example-configuration'
                  ]
                },
              ]
            },
            {
              'type': 'category',
              'label': 'Cloud',
              'items': [
                'development-lifecycle/environment/cloud/multi-environment',
                'development-lifecycle/environment/cloud/example-configuration'
              ]
            }
          ]
        },
        {
          'type': 'category',
          'label': 'Backup',
          'items': [
            'development-lifecycle/backup/gitsync-backup'
          ]
        },
      ]
    },
    {
      'type': 'category',
      'label': 'Security and Monitoring',
      'collapsed': false,
      'collapsible': false,
      'className': 'category-as-header security-header',
      'items': [
        {
          'type': 'category',
          'label': 'Constants',
          'items': [
            'security/constants/constants',
            'security/constants/variables'
          ]
        },
        'security/audit-logs',
        'security/compliance'

      ]
    },
    {
      'type': 'category',
      'label': 'ToolJet API',
      'className': 'category-as-header tj-api-header',
      'collapsible': false,
      'collapsed': true,
      'items': ['tooljet-api']
    }
    ,
    {
      'type': 'category',
      'label': 'Resources',
      'className': 'category-as-header resources-header',
      'collapsed': true,
      'collapsible': false,
      'items': [
        {
          'type': 'link',
          'label': 'Release Notes',
          'href': 'https://app.tooljet.ai/applications/release-notes',
        },
        {
          'type': 'link',
          'label': 'Roadmap',
          'href': 'https://github.com/orgs/ToolJet/projects/15',
        },
        'versions',
        'tracking',
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
    },

  ],
};

module.exports = sidebars;
