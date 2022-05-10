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
    'introduction',
    {
      type: 'category',
      label: 'Setup',
      link: {type: 'doc', id: 'setup/index'},
      items: [
        'setup/introduction',
        'setup/docker',
        'setup/heroku',
        'setup/ec2',
        'setup/kubernetes',
        'setup/kubernetes-gke',
        'setup/kubernetes-aks',
        'setup/google-cloud-run',
        'setup/client',
        'setup/env-vars',
      ],
    },
    'security',
    'tracking',
    {
      type: 'category',
      label: 'Tutorial',
      link: {
        type: 'generated-index',
        title: 'Getting Started with ToolJet',
        description:
          "A primer on getting started with building an application with ToolJet!",
        keywords: ['tutorial'],
      },
      items: [
        'tutorial/creating-app',
        'tutorial/adding-a-datasource',
        'tutorial/building-queries',
        'tutorial/transformations',
        'tutorial/adding-widget',
        'tutorial/actions',
        'tutorial/debugger',
        'tutorial/mobile-layout',
        'tutorial/versioning-and-release',
        'tutorial/sharing-and-deploying',
        'tutorial/manage-users-groups',
        'tutorial/keyboard-shortcuts',
      ],
    },
    {
      type: 'category',
      label: 'Datasource Reference',
      items: [
        'data-sources/airtable',
        'data-sources/s3',
        'data-sources/appwrite',
        'data-sources/baserow',
        'data-sources/bigquery',
        'data-sources/firestore',
        'data-sources/couchdb',
        'data-sources/custom-js',
        'data-sources/dynamodb',
        'data-sources/elasticsearch',
        'data-sources/gcs',
        'data-sources/google.sheets',
        'data-sources/graphql',
        'data-sources/influxdb',
        'data-sources/mailgun',
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
        'data-sources/restapi',
        'data-sources/sendgrid',
        'data-sources/smtp',
        'data-sources/snowflake',
        'data-sources/rethinkdb',
        'data-sources/typesense',
      ],
    },
    {
      type: 'category',
      label: 'Widget Reference',
      items: [
        'widgets/button',
        'widgets/calendar',
        'widgets/chart',
        'widgets/checkbox',
        'widgets/circular-progress-bar',
        'widgets/code-editor',
        'widgets/container',
        'widgets/date-range-picker',
        'widgets/datepicker',
        'widgets/divider',
        'widgets/dropdown',
        'widgets/file-picker',
        'widgets/iframe',
        'widgets/image',
        'widgets/listview',
        'widgets/map',
        'widgets/modal',
        'widgets/multiselect',
        'widgets/number-input',
        'widgets/password-input',
        'widgets/qr-scanner',
        'widgets/radio-button',
        'widgets/range-slider',
        'widgets/rich-text-editor',
        'widgets/spinner',
        'widgets/star',
        'widgets/statistics',
        'widgets/table',
        'widgets/tabs',
        'widgets/tags',
        'widgets/text-input',
        'widgets/text',
        'widgets/textarea',
        'widgets/timeline',
        'widgets/timer',
        'widgets/toggle-switch',
      ],
    },
    {
      type: 'category',
      label: 'Actions Reference',
      link: {
        type: 'generated-index',
        title: 'Actions Reference',
        description:
          "All the actions that can be performed through event handlers",
        keywords: ['actions','events'],
      },
      items: [
        'actions/generate-file',
        'actions/set-localstorage',
      ],
    },
    {
      type: 'category',
      label: 'How To',
      link: {
        type: 'generated-index',
        title: 'How To Guides',
        description:
          "How To Guides for all the things ToolJet",
        keywords: ['how to'],
      },
      items: [
        'how-to/bulk-update-multiple-rows',
        'how-to/oauth2-authorization',
        'how-to/upload-files-aws',
        'how-to/upload-files-gcs',
      ],
    },
    {
      type: 'category',
      label: 'Enterprise',
      items: [
        'Enterprise/audit_logs',
      ]
    },
    {
      type: 'category',
      label: 'Single Sign-on',
      link: {
        type: 'generated-index',
        title: 'Single Sign-on',
        description:
          "Guide for enabling available Single Sign-ons on ToolJet",
        keywords: ['single sign-on','SSO'],
      },
      items: [
        'sso/github',
        'sso/google',
      ],
    },
    {
      type: 'category',
      label: 'Contributing Guide',
      link: {
        type: 'generated-index',
        title: 'Contributing Guide',
        description:
          "Guides for contributing to ToolJet",
        keywords: ['contribute','contributing'],
      },
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Setup',
          items: [
            'contributing-guide/setup/macos',
            'contributing-guide/setup/docker',
            'contributing-guide/setup/ubuntu',
          ],
        },
        {
          type: 'category',
          label: 'Tutorials',
          items: [
            'contributing-guide/tutorials/creating-widget',
            'contributing-guide/tutorials/creating-a-plugin',
          ],
        },
        'contributing-guide/code-of-conduct',
        'contributing-guide/slackcoc',
      ],
    },
  ]
};

module.exports = sidebars;