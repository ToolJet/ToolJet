/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'ToolJet - Documentation',
  tagline: 'Build and deploy internal tools.',
  url: 'https://tooljet.io',
  baseUrl: '/',
  onBrokenLinks: 'ignore',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/logo.svg',
  organizationName: 'ToolJet', // Usually your GitHub org/user name.
  projectName: 'ToolJet', // Usually your repo name.
  themes: ['docusaurus-theme-search-typesense'],
  themeConfig: {
    typesense: {
      typesenseCollectionName: 'tooljet_docs',

      typesenseServerConfig: {
        nodes: [
          {
            host: '14dkq3u5o9jrtb2ip-1.a1.typesense.net',
            port: 443,
            protocol: 'https',
          },
          {
            host: '14dkq3u5o9jrtb2ip-1.a1.typesense.net',
            port: 443,
            protocol: 'https',
          },
          {
            host: '14dkq3u5o9jrtb2ip-1.a1.typesense.net',
            port: 443,
            protocol: 'https',
          },
        ],
        apiKey: 'YQSXcPx0e3m09BkVHFH4k9VvvTfWg2Qs',
      },

      // Optional: Typesense search parameters
      typesenseSearchParameters: {},

      // Optional
      contextualSearch: true,
    },
    colorMode: {
      switchConfig: {
        darkIconStyle: {
          display: 'none',
        },
        lightIconStyle: {
          display: 'none',
        },
      },
    },
    navbar: {
      title: 'ToolJet',
      logo: {
        href: '/docs/intro',
        alt: 'ToolJet Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          href: 'https://github.com/ToolJet/ToolJet',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://join.slack.com/t/tooljet/shared_invite/zt-r2neyfcw-KD1COL6t2kgVTlTtAV5rtg',
          label: 'Slack',
          position: 'right',
        },
        {
          href: 'https://twitter.com/ToolJet',
          label: 'Twitter',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Tutorial',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Stack Overflow',
              href: 'https://stackoverflow.com/questions/tagged/tooljet',
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
              label: 'Slack',
              href: 'https://join.slack.com/t/tooljet/shared_invite/zt-r2neyfcw-KD1COL6t2kgVTlTtAV5rtg',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/ToolJet',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} ToolJet.`,
    },
  },

  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/ToolJet/Tooljet/blob/main/docs/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
