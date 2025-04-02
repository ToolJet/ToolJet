const devServerPlugin = require('./src/plugins/devServer/index.js');
import versionsArchived from './versionsArchived.json';

const baseArchivedURL = "https://archived-docs.tooljet.com/docs/";

const lastFiveArchivedVersions = versionsArchived
  .slice(0, 5)
  .map((version, index) => ({
    version,
    url: index === 0 ? baseArchivedURL : `${baseArchivedURL}${version}`
  }));

const isProd = process.env.NODE_ENV === 'production';

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'ToolJet',
  tagline: 'Low-code framework to Build internal tools and business apps.',
  url: 'https://docs.tooljet.ai',
  baseUrl: '/',
  onBrokenLinks: 'ignore',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/tooljet-ai-favicon.svg',
  organizationName: 'ToolJet', // Usually your GitHub org/user name.
  projectName: 'ToolJet', // Usually your repo name.
  themeConfig: {
    image: 'img/tooljet-ai-og-image.png',
    announcementBar: {
      id: 'support_us',
      content:
        'Star our repository on <a target="_blank" rel="noopener noreferrer" href="https://github.com/ToolJet/ToolJet">GitHub</a> to stay updated with new features and contribute to our platform!',
      backgroundColor: '#ECF0FE',
      textColor: '#4368E3',
      isCloseable: true,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true
      }
    },
    colorMode: {

    },
    navbar: {
      logo: {
        href: '/docs/',
        alt: 'ToolJet Logo',
        src: 'img/docs_logo.svg',
        srcDark: `img/docs_logo_dark.svg`,
        width: 120
      },
      items: [
        {
          type: 'docsVersionDropdown',
          position: 'right',
        },
        {
          type: 'search',
          position: 'left',
        },
        {
          href: 'https://github.com/ToolJet/ToolJet',
          position: 'right',
          className: 'navbar-social-link navbar-github-logo',
          'aria-label': 'GitHub repository',
        },
        {
          href: 'https://tooljet.ai/slack',
          position: 'right',
          className: 'navbar-social-link navbar-slack-logo',
          'aria-label': 'Slack workspace',
        },
        {
          href: 'https://twitter.com/ToolJet',
          position: 'right',
          className: 'navbar-social-link navbar-twitter-logo',
          'aria-label': 'Twitter account',
        },
        {
          href: 'https://app.tooljet.ai',
          position: 'right',
          label: 'Sign in',
          className: 'navbar-signin',
          'aria-label': 'Signin to ToolJet',
        },
        {
          href: 'https://tooljet.ai',
          position: 'right',
          label: 'Website',
          className: 'navbar-website',
          'aria-label': 'ToolJet website',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Slack',
              href: 'https://tooljet.ai/slack',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/ToolJet/ToolJet',
            },
            {
              label: 'YouTube',
              href: 'https://www.youtube.com/channel/UCf1p2G5Z7fPpvlBPf4l2I1w',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/ToolJet',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ToolJet Solutions, Inc.
      <img referrerpolicy="no-referrer-when-downgrade" src="https://static.scarf.sh/a.png?x-pxid=4f00afac-ae1f-4cf6-8c53-8a2c7b3ca206" />
      <script>window.faitracker=window.faitracker||function(){this.q=[];var t=new CustomEvent("FAITRACKER_QUEUED_EVENT");return this.init=function(t,e,a){this.TOKEN=t,this.INIT_PARAMS=e,this.INIT_CALLBACK=a,window.dispatchEvent(new CustomEvent("FAITRACKER_INIT_EVENT"))},this.call=function(){var e={k:"",a:[]};if(arguments&&arguments.length>=1){for(var a=1;a<arguments.length;a++)e.a.push(arguments[a]);e.k=arguments[0]}this.q.push(e),window.dispatchEvent(t)},this.message=function(){window.addEventListener("message",function(t){"faitracker"===t.data.origin&&this.call("message",t.data.type,t.data.message)})},this.message(),this.init("c4rgfujgx6jef4722rcjfhj7dlmcipih",{host:"https://api.factors.ai"}),this}(),function(){var t=document.createElement("script");t.type="text/javascript",t.src="https://app.factors.ai/assets/factors.js",t.async=!0,(d=document.getElementsByTagName("script")[0]).parentNode.insertBefore(t,d)}();</script>
      <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0], j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src= 'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-5L8R522S');</script>
      <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5L8R522S" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
      `,
    },
    algolia: {
      appId: 'O8HQRLI0WA',
      apiKey: process.env.ALGOLIA_API_KEY || 'development', // Public API key: it is safe to commit it
      indexName: 'tooljet',
      contextualSearch: true,
      externalUrlRegex: 'external\\.com|domain\\.com',
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/ToolJet/Tooljet/blob/develop/docs/',
          includeCurrentVersion: true,
          lastVersion: '3.0.0-LTS',
          versions: {
            current: {
              label: '3.1.0-Beta 🚧',
              path: 'beta',
              banner: 'none',
              badge: false
            },
            "2.50.0-LTS": {
              banner: 'none',
              badge: false
            },
            "3.0.0-LTS": {
              banner: 'none',
              badge: false
            }
          }
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/docs/1.x.x/**'],
          filename: 'sitemap.xml',
        },
        googleTagManager: isProd
          ? {
            containerId: process.env.GTM || 'development',
          }
          : undefined,
      },
    ],
  ],
  plugins: [
    devServerPlugin,
    'plugin-image-zoom',
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            to: '/docs/',
            from: '/',
          },
          {
            to: '/docs/security/constants/',
            from: '/docs/org-management/workspaces/workspace_constants/',
          },
          {
            to: '/docs/development-lifecycle/gitsync/overview',
            from: '/docs/gitsync',
          },
          {
            to: '/docs/user-management/role-based-access/access-control',
            from: '/docs/tutorial/manage-users-groups',
          },
          {
            to: '/docs/security/constants/variables/',
            from: '/docs/org-management/workspaces/workspace-variables-migration',
          },
          {
            to: '/docs/tj-setup/smtp-setup/configuration',
            from: '/docs/org-management/smtp-configuration/',
          },
          {
            to: '/docs/user-management/authentication/self-hosted/instance-login/',
            from: '/docs/enterprise/superadmin',
          },
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?4f03d6ce_page=1&52503652_page=2&587c9779_page=2  ',
          },
          {
            to: '/docs/user-management/sso/oidc/setup',
            from: '/docs/user-authentication/sso/oidc ',
          },
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?587c9779_page=2&4f03d6ce_page=2&__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1739577600474.1739577600475.1739577600476.1&__hssc=222093575.2.1739577600477&__hsfp=1152905967 ',
          },
          {
            to: '/docs/setup/try-tooljet',
            from: '/docs/setup/client/ ',
          },
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?587c9779_page=2&__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1739232000553.1739232000554.1739232000555.1&__hssc=222093575.1.1739232000556&__hsfp=2761239502',
          },
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?4f03d6ce_page=7&587c9779_page=2&__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1739491200507.1739491200508.1739491200509.1&__hssc=222093575.1.1739491200510&__hsfp=1152905967',
          },
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?__hstc=222093575.2f3f33a24b44870ec4a577029c49e44b.1742169600601.1742169600602.1742169600603.1&__hssc=222093575.1.1742169600604&__hsfp=3300808088',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1740268800501.1740268800502.1740268800503.1&__hssc=222093575.1.1740268800504&__hsfp=1152905967',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1740355200401.1740355200402.1740355200403.1&__hssc=222093575.1.1740355200404&__hsfp=1152905967',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?587c9779_page=2&148fa06a_page=6&4f03d6ce_page=2&__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1739491200455.1739491200456.1739491200457.1&__hssc=222093575.1.1739491200458&__hsfp=1152905967',
          }, 
          {
            to: '/docs/tooljet-api/',
            from: '/docs/beta/tutorial/tooljet-api/',
          }, 
          {
            to: '/docs/user-management/sso/oidc/google/',
            from: '/docs/user-authentication/sso/openid/google-openid/',
          }, 
          {
            to: '',
            from: '/docs/beta/user-authentication/user-lifecycle/',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1739491200919.1739491200920.1739491200921.1&__hssc=222093575.1.1739491200922&__hsfp=1152905967',
          }, 
          {
            to: '/docs/user-management/sso/saml/setup',
            from: '/docs/user-authentication/sso/saml/',
          }, 
          {
            to: '',
            from: '/docs/release-management/multi-environment/',
          }, 
          {
            to: '',
            from: '/docs/beta/org-management/workspaces/workspace_overview/',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?__hstc=222093575.2f3f33a24b44870ec4a577029c49e44b.1741392000277.1741392000278.1741392000279.1&__hssc=222093575.2.1741392000280&__hsfp=3324942381',
          }, 
          {
            to: '/docs/security/audit-logs/',
            from: '/docs/beta/enterprise/audit_logs/',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?__hstc=222093575.2f3f33a24b44870ec4a577029c49e44b.1741305600251.1741305600252.1741305600253.1&__hssc=222093575.3.1741305600254&__hsfp=3324942381',
          }, 
          {
            to: '/docs/user-management/sso/oidc/setup',
            from: '/docs/beta/category/openid-connect/',
          }, 
          {
            to: '/docs/workflows/permissions/',
            from: '/docs/beta/org-management/permissions/',
          }, 
          {
            to: '/docs/development-lifecycle/gitsync/overview/',
            from: '/docs/release-management/gitsync/tj-config/',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?__hstc=222093575.2f3f33a24b44870ec4a577029c49e44b.1742169600337.1742169600338.1742169600339.1&__hssc=222093575.1.1742169600340&__hsfp=3300808088&ref=workflowautomationtools.org',
          }, 
          {
            to: '',
            from: '/docs/beta/security',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1739491200811.1739491200812.1739491200813.1&__hssc=222093575.2.1739491200814&__hsfp=1152905967',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1740096000677.1740096000678.1740096000679.1&__hssc=222093575.1.1740096000680&__hsfp=1152905967',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?587c9779_page=2&__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1739577600567.1739577600568.1739577600569.1&__hssc=222093575.1.1739577600570&__hsfp=1152905967',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?587c9779_page=2&52503652_page=2&__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1739664000811.1739664000812.1739664000813.1&__hssc=222093575.1.1739664000814&__hsfp=1152905967',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?587c9779_page=1&148fa06a_page=6&4f03d6ce_page=2&__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1739577600451.1739577600452.1739577600453.1&__hssc=222093575.3.1739577600454&__hsfp=1152905967',
          }, 
          {
            to: '/docs/security/constants/variables/',
            from: '/docs/beta/org-management/workspaces/workspace-variables-migration/',
          }, 
          {
            to: '',
            from: '/docs/org-management/workspaces/workspace-variables',
          }, 
          {
            to: '',
            from: '/docs/enterprise/white-label/?4f03d6ce_page=7&52503652_page=2&__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1739577600490.1739577600491.1739577600492.1&__hssc=222093575.1.1739577600493&__hsfp=1152905967',
          }, 
          {
            to: '/docs/development-lifecycle/gitsync/overview/',
            from: '/docs/release-management/gitsync/tj-config',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/beta/enterprise/white-label/',
          }, 
          {
            to: '/docs/development-lifecycle/gitsync/pull',
            from: '/docs/beta/release-management/gitsync/git-pull/',
          }, 
          {
            to: '/docs/user-management/sso/oidc/azuread/',
            from: '/docs/user-authentication/sso/openid/azuread/',
          }, 
          {
            to: '',
            from: '/docs/org-management/permissions/',
          }, 
          {
            to: '/docs/user-management/sso/oidc/setup/',
            from: '/docs/user-authentication/sso/openid/setup',
          }, 
          {
            to: '',
            from: '/docs/beta/tutorial/manage-users-groups/',
          }, 
          {
            to: '/docs/user-management/sso/github/',
            from: '/docs/user-authentication/sso/github',
          }, 
          {
            to: '',
            from: '/docs/dashboard',
          }, 
          {
            to: '/docs/user-management/authentication/self-hosted/workspace-login/',
            from: '/docs/beta/user-authentication/workspace-login/',
          }, 
          {
            to: '/docs/user-management/sso/github/',
            from: '/docs/user-authentication/sso/github/',
          }, 
          {
            to: '/docs/tooljet-concepts/variables/#workspace-variables',
            from: '/docs/user-authentication/sso/github/',
          }, 
          {
            to: '/docs/workflows/how-to/trigger-workflow-from-app/',
            from: '/docs/workflows/trigger-workflow-from-app/',
          }, 
          {
            to: '/docs/tj-setup/licensing/self-hosted/',
            from: '/docs/beta/org-management/licensing/self-hosted/',
          }, 
          {
            to: '/docs/tooljet-api/',
            from: '/docs/tutorial/tooljet-api/',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?__hstc=222093575.2f3f33a24b44870ec4a577029c49e44b.1742169600502.1742169600503.1742169600504.1&__hssc=222093575.1.1742169600505&__hsfp=3300808088',
          }, 
          {
            to: '',
            from: '/docs/security/',
          }, 
          {
            to: '',
            from: '/docs/user-authentication/general-settings/',
          }, 
          {
            to: '/docs/tooljet-copilot/',
            from: '/docs/beta/tooljet-copilot',
          }, 
          {
            to: '/docs/user-management/sso/oidc/azuread/',
            from: '/docs/beta/user-authentication/sso/openid/azuread/',
          },
          {
            to: '/docs/development-lifecycle/gitsync/ssh-config/',
            from: '/docs/release-management/gitsync/ssh-config/',
          }, 
          {
            to: '',
            from: '/docs/beta/user-authentication/general-settings/',
          }, 
          {
            to: '/docs/user-management/authentication/self-hosted/workspace-login/',
            from: '/docs/user-authentication/workspace-login',
          }, 
          {
            to: '/docs/user-management/sso/oidc/okta/',
            from: '/docs/beta/user-authentication/sso/openid/okta/',
          }, 
          {
            to: '/docs/tooljet-api/',
            from: '/docs/tutorial/tooljet-api',
          }, 
          {
            to: '/docs/user-management/authentication/self-hosted/workspace-login/',
            from: '/docs/beta/user-authentication/workspace-login',
          }, 
          {
            to: '/docs/user-management/sso/oidc/okta/',
            from: '/docs/beta/user-authentication/sso/openid/okta/',
          }, 
          {
            to: '/docs/user-management/sso/github/',
            from: '/docs/beta/user-authentication/sso/github/',
          }, 
          {
            to: '/docs/user-management/authentication/cloud-login/#password-login',
            from: '/docs/beta/user-authentication/sso/github/',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?10bd8e65_page=4',
          }, 
          {
            to: '/docs/user-management/sso/saml/setup/',
            from: '/docs/beta/user-authentication/sso/saml/',
          }, 
          {
            to: '/docs/development-lifecycle/gitsync/delete-gitsync',
            from: '/docs/release-management/gitsync/delete-gitsync/',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/',
          }, 
          {
            to: '/docs/tooljet-concepts/super-admin/',
            from: '/docs/beta/enterprise/superadmin/',
          }, 
          {
            to: '',
            from: '/docs/release-management/multi-environment',
          }, 
          {
            to: '/docs/tooljet-concepts/workspace-constants/',
            from: '/docs/beta/org-management/workspaces/workspace_constants/',
          }, 
          {
            to: '/docs/development-lifecycle/gitsync/gitsync-config',
            from: '/docs/beta/release-management/gitsync/tj-config/',
          }, 
          {
            to: '/docs/tj-setup/licensing/self-hosted/',
            from: '/docs/org-management/licensing/self-hosted/',
          }, 
          {
            to: '/docs/user-management/authentication/cloud-login/#password-login',
            from: '/docs/user-authentication/password-login',
          }, 
          {
            to: '/docs/tj-setup/licensing/self-hosted/',
            from: '/docs/org-management/licensing/self-hosted',
          }, 
          {
            to: '/docs/tj-setup/workspaces/',
            from: '/docs/org-management/workspaces/workspace_overview/',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/beta/Enterprise/white-label',
          }, 
          {
            to: '/docs/tj-setup/smtp-setup/configuration/',
            from: '/docs/beta/org-management/smtp-configuration/',
          }, 
          {
            to: '',
            from: '/docs/user-authentication/user-lifecycle/',
          }, 
          {
            to: '/docs/user-management/sso/ldap/',
            from: '/docs/beta/user-authentication/sso/ldap/',
          }, 
          {
            to: '/docs/security/audit-logs/',
            from: '/docs/enterprise/audit_logs/',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?__hstc=222093575.2f3f33a24b44870ec4a577029c49e44b.1741996800602.1741996800603.1741996800604.1&__hssc=222093575.1.1741996800605&__hsfp=3300808088',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?52503652_page=2&148fa06a_page=6&4f03d6ce_page=2&587c9779_page=1&__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1739577600451.1739577600452.1739577600453.1&__hssc=222093575.1.1739577600454&__hsfp=1152905967',
          }, 
          {
            to: '/docs/user-management/sso/google/',
            from: '/docs/user-authentication/sso/openid/google-openid',
          }, 
          {
            to: '/docs/development-lifecycle/gitsync/overview/',
            from: '/docs/beta/gitsync/',
          }, 
          {
            to: '/docs/user-management/sso/oidc/okta/',
            from: '/docs/user-authentication/sso/openid/okta',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?__hstc=222093575.73bd3bee6fa385653ecd7c9674ba06f0.1741910400407.1741910400408.1741910400409.1&__hssc=222093575.4.1741910400410&__hsfp=3300808088',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1740009600827.1740009600828.1740009600829.1&__hssc=222093575.2.1740009600830&__hsfp=1152905967',
          }, 
          {
            to: '/docs/security/audit-logs/',
            from: '/docs/beta/Enterprise/audit_logs',
          }, 
          {
            to: '/docs/user-management/sso/saml/setup/',
            from: '/docs/beta/user-authentication/sso/saml',
          }, 
          {
            to: '/docs/workflows/how-to/trigger-workflow-from-app/',
            from: '/docs/workflows/trigger-workflow-from-app',
          }, 
          {
            to: '/docs/development-lifecycle/gitsync/push/',
            from: '/docs/beta/release-management/gitsync/git-pull',
          }, 
          {
            to: '',
            from: '/docs/beta/dashboard',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/Enterprise/white-label',
          }, 
          {
            to: '',
            from: '/docs/beta/user-authentication/sso/auto-sso-login',
          }, 
          {
            to: '/docs/development-lifecycle/gitsync/delete-gitsync/',
            from: '/docs/release-management/gitsync/delete-gitsync',
          }, 
          {
            to: '/docs/user-management/sso/oidc/setup/',
            from: '/docs/category/openid-connect/',
          }, 
          {
            to: '/docs/user-management/sso/oidc/google',
            from: '/docs/beta/user-authentication/sso/openid/google-openid/',
          }, 
          {
            to: '/docs/user-management/sso/saml/setup/',
            from: '/docs/user-authentication/sso/saml',
          }, 
          {
            to: '/docs/user-management/authentication/cloud-login/#password-login',
            from: '/docs/beta/user-authentication/password-login',
          }, 
          {
            to: '/docs/tj-setup/smtp-setup/configuration/',
            from: '/docs/beta/org-management/smtp-configuration',
          }, 
          {
            to: '/docs/user-management/sso/oidc/setup/',
            from: '/docs/category/openid-connect',
          }, 
          {
            to: '',
            from: '/docs/beta/tutorial/manage-users-groups',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?__hstc=222093575.2f3f33a24b44870ec4a577029c49e44b.1741392000251.1741392000252.1741392000253.1&__hssc=222093575.3.1741392000254&__hsfp=3324942381',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?__hstc=222093575.2f3f33a24b44870ec4a577029c49e44b.1741564800402.1741564800403.1741564800404.1&__hssc=222093575.3.1741564800405&__hsfp=3300808088',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?__hstc=222093575.2f3f33a24b44870ec4a577029c49e44b.1741564800219.1741564800220.1741564800221.1&__hssc=222093575.1.1741564800222&__hsfp=3300808088',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?ref=devhunt&__hstc=222093575.2f3f33a24b44870ec4a577029c49e44b.1741305600251.1741305600252.1741305600253.1&__hssc=222093575.7.1741305600254&__hsfp=3324942381',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?148fa06a_page=6&4f03d6ce_page=2',
          }, 
          {
            to: 'docs/development-lifecycle/gitsync/ssh-config/',
            from: '/docs/release-management/gitsync/ssh-config',
          }, 
          {
            to: '/docs/user-management/sso/oidc/okta/',
            from: '/docs/beta/user-authentication/sso/openid/okta',
          }, 
          {
            to: '/docs/security/constants/variables/',
            from: '/docs/beta/org-management/workspaces/workspace-variables-migration',
          }, 
          {
            to: '/docs/tooljet-api/',
            from: '/docs/beta/tutorial/tooljet-api',
          }, 
          {
            to: '/docs/tj-setup/workspaces',
            from: '/docs/org-management/workspaces/workspace_overview',
          }, 
          {
            to: '/docs/user-management/sso/oidc/google',
            from: '/docs/beta/user-authentication/sso/openid/google-openid',
          }, 
          {
            to: '/docs/user-management/sso/oidc/setup/',
            from: '/docs/user-authentication/sso/openid/setup/',
          }, 
          {
            to: '/docs/user-management/sso/github/',
            from: '/docs/beta/user-authentication/sso/github',
          }, 
          {
            to: '/docs/widgets/table/',
            from: '/docs/widgets/table/table-properties',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?587c9779_page=2&4f03d6ce_page=2&__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1739577600474.1739577600475.1739577600476.1&__hssc=222093575.3.1739577600477&__hsfp=1152905967',
          }, 
          {
            to: '/docs/security/audit-logs/',
            from: '/docs/enterprise/audit_logs/?__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1739404800899.1739404800900.1739404800901.1&__hssc=222093575.1.1739404800902&__hsfp=2761239502',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?587c9779_page=2&148fa06a_page=8',
          }, 
          {
            to: '/docs/workflows/permissions/',
            from: '/docs/beta/org-management/permissions',
          }, 
          {
            to: '/docs/development-lifecycle/gitsync/overview/',
            from: '/docs/beta/gitsync',
          }, 
          {
            to: '/docs/tooljet-concepts/super-admin/',
            from: '/docs/beta/Enterprise/superadmin',
          }, 
          {
            to: '/docs/user-management/sso/ldap/',
            from: '/docs/beta/user-authentication/sso/ldap',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?52503652_page=2&587c9779_page=2&__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1739577600451.1739577600452.1739577600453.1&__hssc=222093575.3.1739577600454&__hsfp=1152905967',
          }, 
          {
            to: '/docs/widgets/table/',
            from: '/docs/widgets/table/table-properties/',
          }, 
          {
            to: '/docs/user-management/sso/google/',
            from: 'https://blog.tooljet.ai/advantages-of-custom-internal-tools/',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?52503652_page=2&__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1739664000811.1739664000812.1739664000813.1&__hssc=222093575.1.1739664000814&__hsfp=1152905967',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?148fa06a_page=6&4f03d6ce_page=2&587c9779_page=2&52503652_page=1&__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1739577600571.1739577600572.1739577600573.1&__hssc=222093575.1.1739577600574&__hsfp=1152905967',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?587c9779_page=1&4f03d6ce_page=7&__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1739491200450.1739491200451.1739491200452.1&__hssc=222093575.2.1739491200453&__hsfp=1152905967',
          }, 
          {
            to: '/docs/tj-setup/org-branding/white-labeling/',
            from: '/docs/enterprise/white-label/?__hstc=222093575.6694e1c5b8259356fcccdd9cfcb617fb.1739232000899.1739232000900.1739232000901.1&__hssc=222093575.1.1739232000902&__hsfp=2761239502',
          }, 
          {
            to: '',
            from: 'https://albecs.tooljet.ai/api/ai/onboarding',
          }, 
          {
            to: '',
            from: 'https://www.tooljet.ai/ai-events?53f8c481_page=3',
          }, 
          {
            to: '',
            from: 'https://blog.tooljet.ai/advantages-of-custom-internal-tools/',
          }, 
          {
            to: '',
            from: 'https://website-stage.tooljet.ai/case-study/emeritus',
          }, 
          {
            to: '/docs/marketplace/plugins/marketplace-plugin-openai/',
            from: 'https://www.tooljet.ai/datasources/open-ai',
          }, 
          {
            to: '/docs/marketplace/plugins/marketplace-plugin-hugging_face/',
            from: 'https://website-stage.tooljet.ai/datasources/hugging-face',
          }, 
          {
            to: '/docs/marketplace/plugins/marketplace-plugin-openai/',
            from: 'https://website-stage.tooljet.ai/datasources/openai',
          }, 
          {
            to: '/docs/marketplace/plugins/marketplace-plugin-anthropic',
            from: 'https://website-stage.tooljet.ai/datasources/anthropic',
          }, 
          {
            to: '/docs/marketplace/plugins/marketplace-plugin-mistral_ai',
            from: 'https://website-stage.tooljet.ai/datasources/mistral',
          }, 
          {
            to: '/docs/marketplace/plugins/marketplace-plugin-weaviate',
            from: 'https://website-stage.tooljet.ai/datasources/weaviate-db',
          }, 
          {
            to: '/docs/marketplace/plugins/marketplace-plugin-gemini',
            from: 'https://website-stage.tooljet.ai/datasources/gemini',
          }, 
          {
            to: '/docs/app-builder/overview',
            from: 'https://www.tooljet.ai/ai-visual-app-builder',
          }, 
          {
            to: '',
            from: 'https://website-stage.tooljet.ai/case-study/bfkn',
          }, 
          {
            to: '',
            from: 'https://www.tooljet.ai/ai-events?53f8c481_page=1',
          }, 
          {
            to: '',
            from: 'https://www.tooljet.ai/ai-integration?0e8e3b82_page=1',
          }, 
          {
            to: '',
            from: 'https://website-stage.tooljet.ai/case-study/pizza-pizza',
          }, 
          {
            to: '',
            from: 'https://website-stage.tooljet.ai/case-study/infear-org',
          }, 
          {
            to: '',
            from: 'https://website-stage.tooljet.ai/case-study/byjus',
          }, 
          {
            to: '',
            from: 'https://www.tooljet.ai/ai-integration?0e8e3b82_page=5',
          }, 
          {
            to: '',
            from: 'https://www.tooljet.ai/ai-integration?0e8e3b82_page=3',
          }, 
          {
            to: '',
            from: 'https://www.tooljet.ai/ai-integration?0e8e3b82_page=4',
          }, 
          {
            to: '',
            from: 'https://www.tooljet.ai/ai-integration?0e8e3b82_page=7',
          }, 
          {
            to: '',
            from: 'https://www.tooljet.ai/ai-integration?0e8e3b82_page=6',
          }, 
          {
            to: '',
            from: 'https://api-gateway.tooljet.ai/',
          }, 
          {
            to: '/docs/getting-started/platform-overview',
            from: '/docs/tooljet-ai/overview',
          }, 
        ],
      },
    ],
  ],
};