/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  "docs": [
    {
      "type": "category",
      "label": "Getting Started",
      "className": "category-as-header getting-started-header",
      "collapsed": false,
      "collapsible": false,
      "items": [
        "doc-home-page",
        "getting-started/platform-overview",
        {
          "type": "category",
          "label": "Deployment",
          "items": [
            {
              "type": "category",
              "label": "Overview",
              "link": {
                "type": "doc",
                "id": "setup/overview/setup"
              },
              "items": [
                "setup/overview/setup",
                "setup/overview/system-requirements",
                "setup/overview/choose-your-tooljet",
                "setup/overview/try-tooljet"
              ]
            },
            {
              "type": "category",
              "label": "Configuration",
              "items": [
                "setup/configuration/env-vars",
                "setup/configuration/http-proxy",
                "setup/configuration/tooljet-subpath"
              ]
            },
            "setup/docker",
            {
              "type": "category",
              "label": "Managed Cloud",
              "items": [
                "setup/managed-cloud/digitalocean",
                {
                  "type": "category",
                  "label": "AWS",
                  "items": [
                    "setup/managed-cloud/aws/ami",
                    "setup/managed-cloud/aws/ecs"
                  ]
                },
                "setup/managed-cloud/azure-container",
                "setup/managed-cloud/google-cloud-run"
              ]
            },
            {
              "type": "category",
              "label": "Kubernetes",
              "items": [
                "setup/kubernetes/kubernetes",
                "setup/kubernetes/openshift",
                "setup/kubernetes/helm",
                "setup/kubernetes/kubernetes-gke",
                "setup/kubernetes/kubernetes-aks",
                "setup/kubernetes/kubernetes-eks"
              ]
            },
            {
              "type": "category",
              "label": "Setup ToolJet AI",
              "link": {
                "type": "doc",
                "id": "setup/tooljet-ai/overview"
              },
              "items": [
                "setup/tooljet-ai/overview",
                "setup/tooljet-ai/managed-with-cloud",
                "setup/tooljet-ai/managed-with-self-hosted",
                "setup/tooljet-ai/bring-your-own-key",
                "setup/tooljet-ai/tj-ai-enterprise"
              ]
            },
            {
              "type": "category",
              "label": "Migrations & Upgrades",
              "items": [
                "setup/migration/upgrade-to-lts",
                {
                  "type": "category",
                  "label": "PostgreSQL 13 → 16 Upgrade",
                  "items": [
                    {
                      "type": "category",
                      "label": "AWS",
                      "items": [
                        "setup/migration/postgresql-13-16/aws/overview",
                        "setup/migration/postgresql-13-16/aws/db-upgrade",
                        {
                          "type": "category",
                          "label": "Deployment Specific",
                          "items": [
                            "setup/migration/postgresql-13-16/aws/deployment/docker",
                            "setup/migration/postgresql-13-16/aws/deployment/ami",
                            "setup/migration/postgresql-13-16/aws/deployment/ecs",
                            "setup/migration/postgresql-13-16/aws/deployment/eks"
                          ]
                        },
                        "setup/migration/postgresql-13-16/aws/verification",
                        "setup/migration/postgresql-13-16/aws/best-practices"
                      ]
                    },
                    {
                      "type": "category",
                      "label": "Azure",
                      "items": [
                        "setup/migration/postgresql-13-16/azure/overview",
                        "setup/migration/postgresql-13-16/azure/db-upgrade",
                        {
                          "type": "category",
                          "label": "Deployment Specific",
                          "items": [
                            "setup/migration/postgresql-13-16/azure/deployment/aks",
                            "setup/migration/postgresql-13-16/azure/deployment/container"
                          ]
                        },
                        "setup/migration/postgresql-13-16/azure/verification",
                        "setup/migration/postgresql-13-16/azure/best-practices"
                      ]
                    },
                    {
                      "type": "category",
                      "label": "GCP",
                      "items": [
                        "setup/migration/postgresql-13-16/gcp/overview",
                        "setup/migration/postgresql-13-16/gcp/db-upgrade",
                        {
                          "type": "category",
                          "label": "Deployment Specific",
                          "items": [
                            "setup/migration/postgresql-13-16/gcp/deployment/docker",
                            "setup/migration/postgresql-13-16/gcp/deployment/gke",
                            "setup/migration/postgresql-13-16/gcp/deployment/cloud-run"
                          ]
                        },
                        "setup/migration/postgresql-13-16/gcp/verification",
                        "setup/migration/postgresql-13-16/gcp/best-practices"
                      ]
                    }
                  ]
                },
                {
                  "type": "category",
                  "label": "Version Migrations",
                  "items": [
                    "setup/migration/upgrade-to-v3",
                    "setup/migration/upgrade-to-v3.16",
                    "setup/migration/upgrade-to-v4",
                    "setup/migration/workflow-temporal-to-bullmq-migration",
                    "setup/migration/infra-level-rollback"
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "category",
      "label": "Build with AI",
      "className": "category-as-header build-with-ai-header",
      "collapsed": false,
      "collapsible": false,
      "items": [
        "build-with-ai/overview",
        {
          "type": "category",
          "label": "Use AI in ToolJet",
          "link": {
            "type": "doc",
            "id": "build-with-ai/use-ai-in-tooljet"
          },
          "items": [
            "build-with-ai/use-ai-in-tooljet",
            "build-with-ai/generate-applications",
            "build-with-ai/referencing-app-resources",
            "build-with-ai/ai-credits",
            "build-with-ai/model-selection",
            "build-with-ai/ai-model-performance"
          ]
        },
        {
          "type": "category",
          "label": "ToolJet MCP Server",
          "items": [
            "build-with-ai/mcp/overview",
            "build-with-ai/mcp/app-generation",
            {
              "type": "category",
              "label": "Setup",
              "items": [
                "build-with-ai/mcp/setup/overview",
                "build-with-ai/mcp/setup/claude-code",
                "build-with-ai/mcp/setup/codex",
                "build-with-ai/mcp/setup/microsoft-copilot",
                "build-with-ai/mcp/setup/other-clients",
                "build-with-ai/mcp/setup/troubleshooting"
              ]
            },
            "build-with-ai/mcp/supported-tools",
            "build-with-ai/mcp/security"
          ]
        },
        {
          "type": "ref",
          "id": "app-builder/react-builder/overview",
          "label": "React Builder"
        },
        "build-with-ai/privacy"
      ]
    },
    {
      "type": "category",
      "label": "App Builder",
      "collapsed": false,
      "collapsible": false,
      "className": "category-as-header app-builder-header",
      "items": [
        "app-builder/overview",
        {
          "type": "category",
          "label": "Visual Builder",
          "link": {
            "type": "doc",
            "id": "app-builder/visual-builder/overview"
          },
          "items": [
            "app-builder/visual-builder/overview",
            {
              "type": "category",
              "label": "UI and Themes",
              "items": [
                {
                  "type": "category",
                  "label": "Building the UI",
                  "items": [
                    "app-builder/building-ui/canvas",
                    "app-builder/building-ui/component-properties",
                    "app-builder/building-ui/pages",
                    "app-builder/building-ui/component-state"
                  ]
                },
                "app-builder/custom-theme",
                "app-builder/customstyles"
              ]
            },
            {
              "type": "category",
              "label": "Components",
              "link": {
                "type": "doc",
                "id": "app-builder/building-ui/component-library"
              },
              "items": [
                {
                  "type": "category",
                  "label": "ToolJet UI 1.0",
                  "items": [
                    "widgets/audio-recorder",
                    "widgets/accordion",
                    "widgets/bounded-box",
                    "widgets/button",
                    "widgets/button-group-v2",
                    "widgets/calendar",
                    "widgets/camera",
                    "widgets/cascader",
                    {
                      "type": "category",
                      "label": "Chart",
                      "items": [
                        "widgets/chart/chart-properties",
                        "widgets/chart/chart-examples",
                        "widgets/chart/transforming-data-for-charts"
                      ]
                    },
                    {
                      "type": "category",
                      "label": "Chat",
                      "items": [
                        "widgets/chat/overview",
                        "widgets/chat/properties",
                        "widgets/chat/csa",
                        "widgets/chat/markdown"
                      ]
                    },
                    "widgets/checkbox",
                    "widgets/circular-progress-bar",
                    "widgets/code-editor",
                    "widgets/color-picker",
                    "widgets/container",
                    "widgets/currency-input",
                    {
                      "type": "category",
                      "label": "Custom Component",
                      "link": {
                        "type": "doc",
                        "id": "widgets/custom-component/custom-component"
                      },
                      "items": [
                        "widgets/custom-component/custom-component",
                        "widgets/custom-component/pass-query-params-in-custom-components"
                      ]
                    },
                    "widgets/date-range-picker",
                    "widgets/date-picker-v2",
                    "widgets/datetime-picker-v2",
                    "widgets/divider",
                    "widgets/dropdown",
                    "widgets/email-input",
                    "widgets/file-picker",
                    "widgets/file-input",
                    "widgets/file-button",
                    "widgets/flex-container",
                    {
                      "type": "category",
                      "label": "Form",
                      "items": [
                        "widgets/form/generate-form",
                        "widgets/form/properties",
                        "widgets/form/csa",
                        "widgets/form/schema",
                        "widgets/form/use-form-component"
                      ]
                    },
                    "widgets/html",
                    "widgets/icon",
                    "widgets/iframe",
                    {
                      "type": "category",
                      "label": "Image",
                      "link": {
                        "type": "doc",
                        "id": "widgets/image/image"
                      },
                      "items": [
                        "widgets/image/image",
                        "widgets/image/loading-image-pdf-from-db"
                      ]
                    },
                    "widgets/json-editor",
                    "widgets/json-explorer",
                    "widgets/kanban",
                    "widgets/key-value-pair",
                    "widgets/link",
                    {
                      "type": "category",
                      "label": "List View",
                      "link": {
                        "type": "doc",
                        "id": "widgets/listview/listview"
                      },
                      "items": [
                        "widgets/listview/listview",
                        "widgets/listview/display-listview-record-on-new-page"
                      ]
                    },
                    "widgets/map",
                    "widgets/modal-v2",
                    "widgets/multiselect",
                    "widgets/navigation",
                    "widgets/number-input",
                    "widgets/password-input",
                    "widgets/pagination",
                    {
                      "type": "category",
                      "label": "PDF",
                      "link": {
                        "type": "doc",
                        "id": "widgets/pdf/pdf"
                      },
                      "items": [
                        "widgets/pdf/pdf",
                        "widgets/pdf/loading-image-pdf-from-db"
                      ]
                    },
                    "widgets/phone-input",
                    "widgets/popover-menu",
                    "widgets/progress-bar",
                    "widgets/qr-scanner",
                    "widgets/radio-button-v2",
                    "widgets/range-slider",
                    "widgets/reorderable-list",
                    "widgets/spinner",
                    "widgets/star-rating",
                    "widgets/statistics",
                    "widgets/steps",
                    "widgets/svg-image",
                    {
                      "type": "category",
                      "label": "Table",
                      "items": [
                        "widgets/table/table-properties",
                        "widgets/table/table-columns",
                        "widgets/table/table-csa-and-variables",
                        {
                          "type": "category",
                          "label": "Serverside Operations",
                          "items": [
                            "widgets/table/serverside-operations/overview",
                            "widgets/table/serverside-operations/search",
                            "widgets/table/serverside-operations/sort",
                            "widgets/table/serverside-operations/filter",
                            "widgets/table/serverside-operations/pagination"
                          ]
                        },
                        "widgets/table/dynamic-column",
                        "widgets/table/conditional-formatting",
                        "widgets/table/bulk-row-operations"
                      ]
                    },
                    {
                      "type": "category",
                      "label": "Tabs",
                      "link": {
                        "type": "doc",
                        "id": "widgets/tabs/tabs"
                      },
                      "items": [
                        "widgets/tabs/tabs",
                        "widgets/tabs/print-multi-tabs-report"
                      ]
                    },
                    "widgets/tags",
                    "widgets/tags-input",
                    "widgets/text-input",
                    "widgets/text",
                    "widgets/text-area",
                    "widgets/rich-text-editor",
                    "widgets/timeline",
                    "widgets/timer",
                    "widgets/time-picker",
                    "widgets/toggle-switch-v2",
                    "widgets/tree-select",
                    "widgets/vertical-divider",
                    {
                      "type": "category",
                      "label": "Legacy Components",
                      "items": [
                        {
                          "type": "link",
                          "label": "Modal",
                          "href": "https://docs.tooljet.com/docs/3.5.0-LTS/widgets/modal"
                        },
                        "widgets/datepicker",
                        {
                          "type": "link",
                          "label": "Radio Button",
                          "href": "https://docs.tooljet.com/docs/3.5.0-LTS/widgets/radio-button"
                        },
                        {
                          "type": "link",
                          "label": "Dropdown",
                          "href": "https://docs.tooljet.com/docs/2.50.0-LTS/widgets/dropdown"
                        },
                        {
                          "type": "link",
                          "label": "Multiselect",
                          "href": "https://docs.tooljet.com/docs/2.50.0-lts/widgets/multiselect/"
                        },
                        {
                          "type": "link",
                          "label": "Range Slider",
                          "href": "https://docs.tooljet.com/docs/2.50.0-LTS/widgets/range-slider"
                        },
                        "widgets/button-group",
                        "widgets/toggle-switch-legacy"
                      ]
                    }
                  ]
                },
                {
                  "type": "category",
                  "label": "Rocket 2.0",
                  "link": {
                    "type": "generated-index",
                    "title": "Rocket 2.0 Components",
                    "description": "Reference pages for every component in the Rocket 2.0 library.",
                    "slug": "/component-reference/rocket"
                  },
                  "items": [
                    "component-reference/rocket/accordion",
                    "component-reference/rocket/accordion-container",
                    "component-reference/rocket/alert",
                    "component-reference/rocket/area-chart",
                    "component-reference/rocket/avatar",
                    "component-reference/rocket/badge",
                    "component-reference/rocket/bar-chart",
                    "component-reference/rocket/breadcrumb",
                    "component-reference/rocket/button",
                    "component-reference/rocket/button-group",
                    "component-reference/rocket/calendar",
                    "component-reference/rocket/card",
                    "component-reference/rocket/card-grid",
                    "component-reference/rocket/carousel",
                    "component-reference/rocket/chat",
                    "component-reference/rocket/checkbox",
                    "component-reference/rocket/circular-progress",
                    "component-reference/rocket/color-picker",
                    "component-reference/rocket/combo-chart",
                    "component-reference/rocket/combobox",
                    "component-reference/rocket/currency-input",
                    "component-reference/rocket/data-table",
                    "component-reference/rocket/date-picker",
                    "component-reference/rocket/date-time-picker",
                    "component-reference/rocket/dialog",
                    "component-reference/rocket/dropdown-menu",
                    "component-reference/rocket/empty",
                    "component-reference/rocket/file-upload",
                    "component-reference/rocket/form",
                    "component-reference/rocket/funnel-chart",
                    "component-reference/rocket/heading",
                    "component-reference/rocket/heatmap-chart",
                    "component-reference/rocket/hero",
                    "component-reference/rocket/icon",
                    "component-reference/rocket/image",
                    "component-reference/rocket/input",
                    "component-reference/rocket/kanban",
                    "component-reference/rocket/key-value",
                    "component-reference/rocket/line-chart",
                    "component-reference/rocket/link",
                    "component-reference/rocket/list-view",
                    "component-reference/rocket/map",
                    "component-reference/rocket/multi-select",
                    "component-reference/rocket/navigation",
                    "component-reference/rocket/number-input",
                    "component-reference/rocket/otp-input",
                    "component-reference/rocket/pagination",
                    "component-reference/rocket/password-input",
                    "component-reference/rocket/phone-input",
                    "component-reference/rocket/pie-chart",
                    "component-reference/rocket/progress",
                    "component-reference/rocket/progress-list",
                    "component-reference/rocket/questionnaire",
                    "component-reference/rocket/radar-chart",
                    "component-reference/rocket/radial-chart",
                    "component-reference/rocket/radio-group",
                    "component-reference/rocket/rating",
                    "component-reference/rocket/record-list",
                    "component-reference/rocket/scatter-chart",
                    "component-reference/rocket/schedule",
                    "component-reference/rocket/select",
                    "component-reference/rocket/separator",
                    "component-reference/rocket/skeleton",
                    "component-reference/rocket/slider",
                    "component-reference/rocket/sparkline",
                    "component-reference/rocket/spinner",
                    "component-reference/rocket/split-pane",
                    "component-reference/rocket/stat",
                    "component-reference/rocket/stepper",
                    "component-reference/rocket/steps",
                    "component-reference/rocket/summary-strip",
                    "component-reference/rocket/switch",
                    "component-reference/rocket/tabs-container",
                    "component-reference/rocket/tags",
                    "component-reference/rocket/tags-input",
                    "component-reference/rocket/text",
                    "component-reference/rocket/tabs",
                    "component-reference/rocket/textarea",
                    "component-reference/rocket/time-picker",
                    "component-reference/rocket/timeline",
                    "component-reference/rocket/toggle-group"
                  ]
                },
                {
                  "type": "category",
                  "label": "Ant Design",
                  "link": {
                    "type": "generated-index",
                    "title": "Ant Design Components",
                    "description": "Reference pages for every component in the Ant Design library.",
                    "slug": "/component-reference/ant-design"
                  },
                  "items": [
                    "component-reference/ant-design/alert",
                    "component-reference/ant-design/area",
                    "component-reference/ant-design/auto-complete",
                    "component-reference/ant-design/avatar",
                    "component-reference/ant-design/badge",
                    "component-reference/ant-design/bar",
                    "component-reference/ant-design/breadcrumb",
                    "component-reference/ant-design/button",
                    "component-reference/ant-design/button-group",
                    "component-reference/ant-design/calendar",
                    "component-reference/ant-design/card",
                    "component-reference/ant-design/card-grid",
                    "component-reference/ant-design/carousel",
                    "component-reference/ant-design/cascader",
                    "component-reference/ant-design/chat",
                    "component-reference/ant-design/checkbox",
                    "component-reference/ant-design/circular-progress",
                    "component-reference/ant-design/collapse",
                    "component-reference/ant-design/color-picker",
                    "component-reference/ant-design/column",
                    "component-reference/ant-design/combobox",
                    "component-reference/ant-design/currency-input",
                    "component-reference/ant-design/date-picker",
                    "component-reference/ant-design/date-time-picker",
                    "component-reference/ant-design/descriptions",
                    "component-reference/ant-design/divider",
                    "component-reference/ant-design/drawer",
                    "component-reference/ant-design/dropdown",
                    "component-reference/ant-design/dual-axes",
                    "component-reference/ant-design/empty",
                    "component-reference/ant-design/funnel",
                    "component-reference/ant-design/gauge",
                    "component-reference/ant-design/heatmap",
                    "component-reference/ant-design/hero",
                    "component-reference/ant-design/icon",
                    "component-reference/ant-design/image",
                    "component-reference/ant-design/input",
                    "component-reference/ant-design/input-number",
                    "component-reference/ant-design/kanban",
                    "component-reference/ant-design/line",
                    "component-reference/ant-design/link",
                    "component-reference/ant-design/list",
                    "component-reference/ant-design/map",
                    "component-reference/ant-design/menu",
                    "component-reference/ant-design/modal",
                    "component-reference/ant-design/otp",
                    "component-reference/ant-design/pagination",
                    "component-reference/ant-design/password",
                    "component-reference/ant-design/phone-input",
                    "component-reference/ant-design/pie",
                    "component-reference/ant-design/progress",
                    "component-reference/ant-design/progress-list",
                    "component-reference/ant-design/qr-code",
                    "component-reference/ant-design/questionnaire",
                    "component-reference/ant-design/radar",
                    "component-reference/ant-design/radial-chart",
                    "component-reference/ant-design/radio-group",
                    "component-reference/ant-design/range-picker",
                    "component-reference/ant-design/rate",
                    "component-reference/ant-design/record-list",
                    "component-reference/ant-design/result",
                    "component-reference/ant-design/scatter",
                    "component-reference/ant-design/schedule",
                    "component-reference/ant-design/segmented",
                    "component-reference/ant-design/select",
                    "component-reference/ant-design/skeleton",
                    "component-reference/ant-design/slider",
                    "component-reference/ant-design/sparkline",
                    "component-reference/ant-design/spin",
                    "component-reference/ant-design/statistic",
                    "component-reference/ant-design/steps",
                    "component-reference/ant-design/summary-strip",
                    "component-reference/ant-design/switch",
                    "component-reference/ant-design/table",
                    "component-reference/ant-design/tabs",
                    "component-reference/ant-design/tag",
                    "component-reference/ant-design/tags",
                    "component-reference/ant-design/text",
                    "component-reference/ant-design/text-area",
                    "component-reference/ant-design/time-picker",
                    "component-reference/ant-design/timeline",
                    "component-reference/ant-design/title",
                    "component-reference/ant-design/transfer",
                    "component-reference/ant-design/tree",
                    "component-reference/ant-design/tree-select",
                    "component-reference/ant-design/upload"
                  ]
                },
                {
                  "type": "category",
                  "label": "Custom Component Libraries",
                  "link": {
                    "type": "doc",
                    "id": "app-builder/custom-component-library/overview"
                  },
                  "items": [
                    "app-builder/custom-component-library/overview",
                    "app-builder/custom-component-library/setup",
                    "app-builder/custom-component-library/build-components",
                    "app-builder/custom-component-library/preview-and-publish",
                    "app-builder/custom-component-library/use-in-app-builder",
                    "app-builder/custom-component-library/manage-libraries",
                    "app-builder/custom-component-library/cli-reference"
                  ]
                }
              ]
            },
            {
              "type": "category",
              "label": "Events and Actions",
              "link": {
                "type": "doc",
                "id": "app-builder/events/overview"
              },
              "items": [
                "app-builder/events/overview",
                "app-builder/events/event-triggers",
                "app-builder/events/use-case/csa",
                "app-builder/events/use-case/page-nav",
                "app-builder/events/use-case/variables"
              ]
            },
            {
              "type": "category",
              "label": "Writing Custom Code",
              "items": [
                "app-builder/custom-code/fx-dynamic-behaviour",
                "app-builder/custom-code/control-components",
                "app-builder/custom-code/transform-data",
                "app-builder/custom-code/managing-variables",
                {
                  "type": "category",
                  "label": "Importing External Libraries",
                  "items": [
                    "app-builder/import-libraries/runjs",
                    "app-builder/import-libraries/runpy"
                  ]
                },
                "app-builder/custom-code/constants-secrets",
                "app-builder/custom-code/access-currentuser"
              ]
            },
            {
              "type": "category",
              "label": "Dynamic Access Rules",
              "link": {
                "type": "doc",
                "id": "app-builder/dynamic-access-rule/overview"
              },
              "items": [
                "app-builder/dynamic-access-rule/overview",
                "app-builder/dynamic-access-rule/component-level",
                "app-builder/dynamic-access-rule/page-level",
                "app-builder/dynamic-access-rule/query-level",
                "app-builder/dynamic-access-rule/server-side-variables",
                "app-builder/dynamic-access-rule/row-level-security"
              ]
            },
            {
              "type": "category",
              "label": "Modules",
              "link": {
                "type": "doc",
                "id": "app-builder/modules/overview"
              },
              "items": [
                "app-builder/modules/overview",
                "app-builder/modules/create-module",
                "app-builder/modules/input-output",
                "app-builder/modules/data-flow"
              ]
            },
            {
              "type": "category",
              "label": "Actions Reference",
              "link": {
                "type": "doc",
                "id": "actions/overview"
              },
              "items": [
                "actions/run-actions-from-runjs",
                {
                  "type": "category",
                  "label": "Run Action",
                  "items": [
                    "actions/run-query",
                    "actions/reset-query",
                    "actions/abort-query",
                    "actions/show-alert"
                  ]
                },
                {
                  "type": "category",
                  "label": "Control Component",
                  "items": [
                    "actions/control-component",
                    "actions/show-modal",
                    "actions/close-modal",
                    "actions/set-table-page",
                    "actions/scroll-component-into-view"
                  ]
                },
                {
                  "type": "category",
                  "label": "Navigation",
                  "items": [
                    "actions/switch-page",
                    "actions/go-to-app",
                    "actions/open-webpage"
                  ]
                },
                {
                  "type": "category",
                  "label": "Variable",
                  "items": [
                    "actions/set-page-variable",
                    "actions/unset-page-variable",
                    "actions/unset-all-page-var",
                    "actions/set-variable",
                    "actions/unset-variable",
                    "actions/unset-all-var"
                  ]
                },
                {
                  "type": "category",
                  "label": "Other",
                  "items": [
                    "actions/logout",
                    "actions/generate-file",
                    "actions/set-localstorage",
                    "actions/copy-to-clipboard",
                    "actions/toggle-app-mode"
                  ]
                }
              ]
            },
            "tutorial/keyboard-shortcuts"
          ]
        },
        {
          "type": "category",
          "label": "React Builder",
          "className": "sidebar-badge-new",
          "link": {
            "type": "doc",
            "id": "app-builder/react-builder/overview"
          },
          "items": [
            "app-builder/react-builder/overview",
            "app-builder/react-builder/create-app",
            "app-builder/react-builder/editor",
            "app-builder/react-builder/local-development",
            "app-builder/react-builder/access-control",
            "app-builder/react-builder/versions-and-history",
            "app-builder/react-builder/security",
            {
              "type": "category",
              "label": "Reference",
              "items": [
                "app-builder/react-builder/project-structure",
                "app-builder/react-builder/runtime-api",
                "app-builder/react-builder/cli-reference",
                "app-builder/react-builder/security-policy"
              ]
            }
          ]
        },
        {
          "type": "category",
          "label": "Connecting Data Sources",
          "items": [
            "app-builder/connecting-with-data-sources/creating-managing-queries",
            "app-builder/connecting-with-data-sources/accessing-query-results",
            "app-builder/connecting-with-data-sources/transforming-data",
            "app-builder/connecting-with-data-sources/binding-data-to-components",
            "app-builder/connecting-with-data-sources/run-query-at-specified-intervals",
            "app-builder/connecting-with-data-sources/use-custom-parameters"
          ]
        },
        {
          "type": "category",
          "label": "Debugging",
          "items": [
            "app-builder/debugging/inspector",
            "app-builder/debugging/understanding-logs",
            "app-builder/anti-patterns"
          ]
        },
        "app-builder/app-history",
        {
          "type": "category",
          "label": "Embed Application",
          "link": {
            "type": "doc",
            "id": "app-builder/embed-app/overview"
          },
          "items": [
            "app-builder/embed-app/overview",
            "app-builder/embed-app/public-app",
            "app-builder/embed-app/private-app"
          ]
        }
      ]
    },
    {
      "type": "category",
      "label": "Data Sources",
      "className": "category-as-header data-sources-header",
      "collapsed": false,
      "collapsible": false,
      "items": [
        "data-sources/overview",
        {
          "type": "category",
          "label": "Data Sources Library",
          "items": [
            "data-sources/airtable",
            {
              "type": "category",
              "label": "Amazon S3",
              "link": {
                "type": "doc",
                "id": "data-sources/s3/s3"
              },
              "items": [
                "data-sources/s3/s3",
                "data-sources/s3/use-s3-signed-url-to-upload-docs",
                "data-sources/s3/s3-custom-endpoints",
                "data-sources/s3/upload-files-aws"
              ]
            },
            "data-sources/amazonses",
            "data-sources/appwrite",
            "data-sources/athena",
            "data-sources/azureblobstorage",
            "data-sources/baserow",
            "data-sources/bigquery",
            "data-sources/firestore",
            "data-sources/clickhouse",
            "data-sources/cosmosdb",
            "data-sources/couchdb",
            "data-sources/databricks",
            "data-sources/dynamodb",
            "data-sources/elasticsearch",
            {
              "type": "category",
              "label": "Google Cloud Storage",
              "link": {
                "type": "doc",
                "id": "data-sources/gcs/gcs"
              },
              "items": [
                "data-sources/gcs/gcs",
                "data-sources/gcs/upload-files-gcs"
              ]
            },
            "data-sources/googlesheets",
            "data-sources/googlesheetsv2",
            "data-sources/graphql",
            "data-sources/grpc",
            "data-sources/grpcv2",
            "data-sources/ibmdb",
            "data-sources/influxdb",
            "data-sources/mailgun",
            "data-sources/mariadb",
            "data-sources/minio",
            "data-sources/mongodb",
            "data-sources/mssql",
            "data-sources/mysql",
            "data-sources/n8n",
            "data-sources/nocodb",
            "data-sources/notion",
            "data-sources/openapi",
            "data-sources/oracledb",
            "data-sources/postgresql",
            "data-sources/redis",
            {
              "type": "category",
              "label": "REST API",
              "collapsed": true,
              "items": [
                "data-sources/restapi/configuration",
                "data-sources/restapi/authentication",
                "data-sources/restapi/querying-rest-api",
                "data-sources/restapi/metadata-and-cookies",
                "data-sources/restapi/pass-values-in-rest-api",
                "data-sources/restapi/multipart-form-data-rest-api"
              ]
            },
            "data-sources/soap-api",
            "data-sources/rethinkdb",
            {
              "type": "category",
              "label": "Run JavaScript Code",
              "link": {
                "type": "doc",
                "id": "data-sources/runjs/run-js"
              },
              "items": [
                "data-sources/runjs/run-js",
                "data-sources/runjs/access-users-location",
                "data-sources/runjs/use-axios-in-runjs",
                "data-sources/runjs/intentionally-fail-js-query"
              ]
            },
            {
              "type": "category",
              "label": "Run Python Code",
              "link": {
                "type": "doc",
                "id": "data-sources/runpy/run-py"
              },
              "items": [
                "data-sources/runpy/run-py",
                "data-sources/runpy/use-to-py-function-in-runpy"
              ]
            },
            "data-sources/saphana",
            "data-sources/sendgrid",
            "data-sources/slack",
            "data-sources/smtp",
            "data-sources/snowflake",
            "data-sources/stripe",
            "data-sources/twilio",
            "data-sources/typesense",
            "data-sources/woocommerce",
            "data-sources/zendesk"
          ]
        },
        {
          "type": "category",
          "label": "Marketplace",
          "collapsed": true,
          "link": {
            "type": "doc",
            "id": "marketplace/marketplace-overview"
          },
          "items": [
            "marketplace/marketplace-overview",
            {
              "type": "category",
              "label": "Marketplace Plugins",
              "items": [
                "marketplace/plugins/marketplace-plugin-aftership",
                "marketplace/plugins/marketplace-plugin-anthropic",
                "marketplace/plugins/marketplace-plugin-asana",
                "marketplace/plugins/marketplace-plugin-authorizenet",
                "marketplace/plugins/marketplace-plugin-aws-bedrock",
                "marketplace/plugins/marketplace-plugin-awsredshift",
                "marketplace/plugins/marketplace-plugin-textract",
                "marketplace/plugins/marketplace-plugin-aws-lambda",
                "marketplace/plugins/marketplace-plugin-azurerepos",
                "marketplace/plugins/marketplace-plugin-clickup",
                "marketplace/plugins/marketplace-plugin-cohere",
                "marketplace/plugins/marketplace-plugin-couchbase",
                "marketplace/plugins/marketplace-plugin-easypost",
                "marketplace/plugins/marketplace-plugin-engagespot",
                "marketplace/plugins/marketplace-plugin-fedex",
                "marketplace/plugins/marketplace-plugin-gemini",
                "marketplace/plugins/marketplace-plugin-github",
                "marketplace/plugins/marketplace-plugin-gmail",
                "marketplace/plugins/marketplace-plugin-googlecalendar",
                "marketplace/plugins/marketplace-plugin-spanner",
                "marketplace/plugins/marketplace-plugin-harperdb",
                "marketplace/plugins/marketplace-plugin-hubspot",
                "marketplace/plugins/marketplace-plugin-hugging_face",
                "marketplace/plugins/marketplace-plugin-intercom",
                "marketplace/plugins/marketplace-plugin-jira",
                "marketplace/plugins/marketplace-plugin-microsoft_graph",
                "marketplace/plugins/marketplace-plugin-mistral_ai",
                "marketplace/plugins/marketplace-plugin-openai",
                "marketplace/plugins/marketplace-plugin-openrouter",
                "marketplace/plugins/marketplace-plugin-pinecone",
                "marketplace/plugins/marketplace-plugin-plivo",
                "marketplace/plugins/marketplace-plugin-pocketbase",
                "marketplace/plugins/marketplace-plugin-portkey",
                "marketplace/plugins/marketplace-plugin-Presto",
                "marketplace/plugins/marketplace-plugin-prometheus",
                "marketplace/plugins/marketplace-plugin-qdrant",
                "marketplace/plugins/marketplace-plugin-quickbooks",
                "marketplace/plugins/marketplace-plugin-salesforce",
                "marketplace/plugins/marketplace-plugin-servicenow",
                "marketplace/plugins/marketplace-plugin-sharepoint",
                "marketplace/plugins/marketplace-plugin-supabase",
                "marketplace/plugins/marketplace-plugin-typesafe",
                "marketplace/plugins/marketplace-plugin-ups",
                "marketplace/plugins/marketplace-plugin-weaviate",
                "marketplace/plugins/marketplace-plugin-xero"
              ]
            }
          ]
        },
        "data-sources/permissions",
        "data-sources/sample-data-sources"
      ]
    },
    {
      "type": "category",
      "label": "ToolJet Database",
      "className": "category-as-header tjdb-header",
      "collapsed": false,
      "collapsible": false,
      "items": [
        "tooljet-db/tooljet-database",
        "tooljet-db/database-editor",
        {
          "type": "category",
          "label": "Column Constraints",
          "items": [
            "tooljet-db/constraints/primary-key",
            "tooljet-db/constraints/foreign-key"
          ]
        },
        "tooljet-db/data-types",
        "tooljet-db/table-operations",
        "tooljet-db/querying-tooljet-db"
      ]
    },
    {
      "type": "category",
      "label": "Workflows",
      "className": "category-as-header workflows-header",
      "collapsed": false,
      "collapsible": false,
      "items": [
        "workflows/overview",
        {
          "type": "category",
          "label": "Nodes",
          "items": [
            "workflows/nodes/start-trigger",
            "workflows/nodes/agent",
            {
              "type": "category",
              "label": "Logic Nodes",
              "items": [
                "workflows/nodes/logic/js",
                "workflows/nodes/logic/py",
                "workflows/nodes/logic/if-else",
                "workflows/nodes/logic/loop"
              ]
            },
            "workflows/nodes/ds",
            "workflows/nodes/wf",
            "workflows/nodes/response",
            "workflows/nodes/operations"
          ]
        },
        {
          "type": "category",
          "label": "Triggers",
          "items": [
            "workflows/triggers/app",
            "workflows/triggers/webhook",
            "workflows/triggers/scheduler"
          ]
        },
        {
          "type": "category",
          "label": "Importing External Libraries",
          "items": [
            "workflows/external-libraries/js",
            "workflows/external-libraries/py"
          ]
        },
        {
          "type": "category",
          "label": "Environment & Versions",
          "items": [
            "workflows/versions-env/version-control",
            "workflows/versions-env/environments"
          ]
        }
      ]
    },
    {
      "type": "category",
      "label": "Setup ToolJet",
      "className": "category-as-header setup-tj-header",
      "collapsible": false,
      "collapsed": false,
      "items": [
        "tj-setup/overview",
        "tj-setup/tj-deployment",
        {
          "type": "category",
          "label": "Licensing",
          "items": [
            "tj-setup/licensing/self-hosted",
            "tj-setup/licensing/cloud"
          ]
        },
        "tj-setup/instances",
        "tj-setup/workspaces",
        {
          "type": "category",
          "label": "Branding",
          "link": {
            "type": "doc",
            "id": "tj-setup/org-branding/overview"
          },
          "items": [
            "tj-setup/org-branding/overview",
            "tj-setup/org-branding/white-labeling",
            "tj-setup/org-branding/custom-domain"
          ]
        },
        {
          "type": "category",
          "label": "Setup SMTP Server",
          "link": {
            "type": "doc",
            "id": "tj-setup/smtp-setup/configuration"
          },
          "items": [
            "tj-setup/smtp-setup/configuration",
            "tj-setup/smtp-setup/email-providers"
          ]
        },
        "tj-setup/whitelist-cdn-domains",
        {
          "type": "category",
          "label": "Observability",
          "link": {
            "type": "doc",
            "id": "tj-setup/observability/observability-otel"
          },
          "items": [
            "tj-setup/observability/observability-otel",
            "tj-setup/observability/production-alerts",
            "tj-setup/observability/datadog",
            "tj-setup/observability/new-relic",
            "tj-setup/observability/grafana",
            "tj-setup/observability/last9"
          ]
        },
        "tj-setup/lockbox-master-key-rotation"
      ]
    },
    {
      "type": "category",
      "collapsed": false,
      "collapsible": false,
      "className": "category-as-header user-management-header",
      "label": "User Management and Access Control",
      "items": [
        "user-management/overview",
        {
          "type": "category",
          "label": "Onboard and Offboard Users",
          "link": {
            "type": "doc",
            "id": "user-management/onboard-users/overview"
          },
          "items": [
            "user-management/onboard-users/overview",
            "user-management/onboard-users/invite-user",
            "user-management/onboard-users/bulk-invite-users",
            "user-management/onboard-users/self-signup-user",
            "user-management/onboard-users/user-metadata",
            "user-management/onboard-users/archive-user"
          ]
        },
        {
          "type": "category",
          "label": "Authentication",
          "items": [
            {
              "type": "category",
              "label": "Self-hosted",
              "items": [
                "user-management/authentication/self-hosted/overview",
                "user-management/authentication/self-hosted/instance-login",
                "user-management/authentication/self-hosted/workspace-login",
                "user-management/authentication/self-hosted/super-admin-login",
                "user-management/authentication/2fa"
              ]
            },
            "user-management/authentication/cloud-login"
          ]
        },
        {
          "type": "category",
          "label": "Role Based Access Control",
          "items": [
            "user-management/role-based-access/super-admin",
            "user-management/role-based-access/user-roles",
            "user-management/role-based-access/custom-groups",
            "user-management/role-based-access/access-control"
          ]
        },
        {
          "type": "category",
          "label": "Single Sign-On (SSO)",
          "link": {
            "type": "doc",
            "id": "user-management/sso/overview"
          },
          "items": [
            "user-management/sso/overview",
            "user-management/sso/github",
            "user-management/sso/google",
            {
              "type": "category",
              "label": "OpenID Connect",
              "link": {
                "type": "doc",
                "id": "user-management/sso/oidc/setup"
              },
              "items": [
                "user-management/sso/oidc/setup",
                "user-management/sso/oidc/azuread",
                "user-management/sso/oidc/okta",
                "user-management/sso/oidc/google",
                "user-management/sso/oidc/onelogin",
                "user-management/sso/oidc/auth0",
                "user-management/sso/oidc/ssouserinfo"
              ]
            },
            "user-management/sso/ldap",
            {
              "type": "category",
              "label": "SAML",
              "link": {
                "type": "doc",
                "id": "user-management/sso/saml/setup"
              },
              "items": [
                "user-management/sso/saml/setup",
                "user-management/sso/saml/okta",
                "user-management/sso/saml/entra-id"
              ]
            },
            {
              "type": "link",
              "label": "SCIM",
              "href": "/api/scim/"
            }
          ]
        },
        {
          "type": "category",
          "label": "Group Sync",
          "items": [
            {
              "type": "category",
              "label": "Instance level",
              "items": [
                "user-management/group-sync/instance-level/oidc"
              ]
            },
            {
              "type": "category",
              "label": "Workspace level",
              "items": [
                "user-management/group-sync/workspace-level/oidc",
                "user-management/group-sync/workspace-level/saml"
              ]
            }
          ]
        },
        {
          "type": "category",
          "label": "Profile Management",
          "items": [
            "user-management/profile-management/user-details",
            "user-management/profile-management/reset-password",
            "user-management/profile-management/user-profile"
          ]
        }
      ]
    },
    {
      "type": "category",
      "collapsed": false,
      "collapsible": false,
      "className": "category-as-header dev-cycle-header",
      "label": "Development Lifecycle",
      "items": [
        "development-lifecycle/overview",
        {
          "type": "category",
          "label": "Release Management",
          "items": [
            "development-lifecycle/release/version-control",
            "development-lifecycle/release/compare-versions",
            "development-lifecycle/release/release-rollback",
            "development-lifecycle/release/share-app"
          ]
        },
        {
          "type": "category",
          "label": "GitSync",
          "link": {
            "type": "doc",
            "id": "development-lifecycle/gitsync/overview"
          },
          "items": [
            "development-lifecycle/gitsync/overview",
            {
              "type": "category",
              "label": "Connect to Git Repo",
              "items": [
                "development-lifecycle/gitsync/connect-to-git-repo/github-config",
                "development-lifecycle/gitsync/connect-to-git-repo/gitlab-config"
              ]
            },
            "development-lifecycle/gitsync/branching-overview",
            {
              "type": "category",
              "label": "Single-Branch Mode",
              "link": {
                "type": "doc",
                "id": "development-lifecycle/gitsync/single-branch/overview"
              },
              "items": [
                "development-lifecycle/gitsync/single-branch/overview",
                "development-lifecycle/gitsync/single-branch/push-and-pull",
                "development-lifecycle/gitsync/single-branch/sync-resources"
              ]
            },
            {
              "type": "category",
              "label": "Multi-Branch Mode",
              "link": {
                "type": "doc",
                "id": "development-lifecycle/gitsync/multi-branch/overview"
              },
              "items": [
                "development-lifecycle/gitsync/multi-branch/overview",
                "development-lifecycle/gitsync/multi-branch/enable-and-manage-branches",
                "development-lifecycle/gitsync/multi-branch/push-and-pull",
                "development-lifecycle/gitsync/multi-branch/sync-resources",
                "development-lifecycle/gitsync/multi-branch/pull-requests"
              ]
            },
            "development-lifecycle/gitsync/versioning",
            "development-lifecycle/gitsync/auto-sync",
            {
              "type": "category",
              "label": "Troubleshooting",
              "link": {
                "type": "doc",
                "id": "development-lifecycle/gitsync/troubleshooting/overview"
              },
              "items": [
                "development-lifecycle/gitsync/troubleshooting/overview",
                "development-lifecycle/gitsync/troubleshooting/resolving-conflicts"
              ]
            }
          ]
        },
        {
          "type": "category",
          "label": "GitSync CI/CD",
          "link": {
            "type": "doc",
            "id": "development-lifecycle/cicd/overview"
          },
          "items": [
            "development-lifecycle/cicd/overview",
            "development-lifecycle/cicd/example"
          ]
        },
        {
          "type": "category",
          "label": "Environment",
          "items": [
            {
              "type": "category",
              "label": "Self-Hosted",
              "items": [
                "development-lifecycle/environment/self-hosted/multi-environment",
                "development-lifecycle/environment/self-hosted/example-configuration",
                {
                  "type": "category",
                  "label": "Multi-Instance",
                  "items": [
                    "development-lifecycle/environment/self-hosted/multi-instance/instance-as-environment",
                    "development-lifecycle/environment/self-hosted/multi-instance/example-configuration"
                  ]
                }
              ]
            },
            {
              "type": "category",
              "label": "Cloud",
              "items": [
                "development-lifecycle/environment/cloud/multi-environment",
                "development-lifecycle/environment/cloud/example-configuration"
              ]
            }
          ]
        },
        {
          "type": "category",
          "label": "Automation Testing",
          "items": [
            "development-lifecycle/testing/overview",
            "development-lifecycle/testing/cypress-guide"
          ]
        },
        {
          "type": "category",
          "label": "Backup",
          "link": {
            "type": "doc",
            "id": "development-lifecycle/backup/gitsync-backup"
          },
          "items": [
            "development-lifecycle/backup/gitsync-backup"
          ]
        },
        {
          "type": "category",
          "label": "Import Export",
          "items": [
            "development-lifecycle/import-export/importing-exporting-applications",
            "development-lifecycle/import-export/import-export-workflows",
            "development-lifecycle/import-export/import-export-modules"
          ]
        }
      ]
    },
    {
      "type": "category",
      "label": "Security and Monitoring",
      "collapsed": false,
      "collapsible": false,
      "className": "category-as-header security-header",
      "items": [
        {
          "type": "category",
          "label": "Constants",
          "items": [
            "security/constants/constants"
          ]
        },
        {
          "type": "category",
          "label": "Audit Logs",
          "link": {
            "type": "doc",
            "id": "security/audit-logs/audit-logs"
          },
          "items": [
            "security/audit-logs/audit-logs",
            "security/audit-logs/stream-audit-to-datadog",
            "security/audit-logs/setup-rsyslog"
          ]
        },
        {
          "type": "category",
          "label": "Compliance",
          "link": {
            "type": "doc",
            "id": "security/compliance/compliance"
          },
          "items": [
            "security/compliance/compliance",
            "security/compliance/cjis"
          ]
        }
      ]
    },
    {
      "type": "category",
      "label": "ToolJet API",
      "className": "category-as-header tj-api-header",
      "collapsible": false,
      "collapsed": true,
      "items": [
        {
          "type": "link",
          "label": "ToolJet API",
          "href": "/api"
        },
        "user-management/authentication/self-hosted/pat",
        {
          "type": "link",
          "label": "GitSync API",
          "href": "/api/gitsync-api"
        }
      ]
    },
    {
      "type": "category",
      "label": "Resources",
      "className": "category-as-header resources-header",
      "collapsed": true,
      "collapsible": false,
      "items": [
        {
          "type": "link",
          "label": "Release Notes",
          "href": "https://app.tooljet.ai/applications/release-notes"
        },
        {
          "type": "link",
          "label": "Roadmap",
          "href": "https://github.com/orgs/ToolJet/projects/15"
        },
        "versions",
        "tracking",
        {
          "type": "category",
          "label": "Contributing Guide",
          "collapsed": true,
          "items": [
            "contributing-guide/setup/architecture",
            {
              "type": "category",
              "label": "Setup",
              "items": [
                "contributing-guide/setup/codespaces",
                "contributing-guide/setup/macos",
                "contributing-guide/setup/docker",
                "contributing-guide/setup/ubuntu",
                "contributing-guide/setup/windows",
                "contributing-guide/setup/system-requirements-for-contributing"
              ]
            },
            {
              "type": "category",
              "label": "Marketplace",
              "items": [
                "contributing-guide/marketplace/marketplace-setup",
                "contributing-guide/marketplace/creating-a-plugin"
              ]
            },
            {
              "type": "category",
              "label": "Documentation",
              "items": [
                "contributing-guide/documentation-guidelines/introduction",
                "contributing-guide/documentation-guidelines/pr-checklist",
                "contributing-guide/documentation-guidelines/style-guide"
              ]
            },
            "tooljet-cli",
            "contributing-guide/testing",
            "contributing-guide/l10n",
            {
              "type": "category",
              "label": "Troubleshooting",
              "items": [
                "contributing-guide/troubleshooting/eslint",
                "contributing-guide/troubleshooting/runpy-limitations"
              ]
            },
            "contributing-guide/code-of-conduct",
            "contributing-guide/slackcoc"
          ]
        }
      ]
    }
  ]
};

module.exports = sidebars;
