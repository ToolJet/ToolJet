/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: 'ToolJet - Documentation',
  tagline: 'Low-code framework to Build internal tools and business apps.',
  url: 'https://docs.tooljet.com',
  baseUrl: '/',
  onBrokenLinks: 'ignore',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/logo.svg',
  organizationName: 'ToolJet', // Usually your GitHub org/user name.
  projectName: 'ToolJet', // Usually your repo name.
  themeConfig: {
    image: 'img/tooljet-og-image.png',
    announcementBar: {
      id: 'support_us',
      content:
        '⭐️ If you like ToolJet, give it a star on <a target="_blank" rel="noopener noreferrer" href="https://github.com/ToolJet/ToolJet">GitHub</a> and follow us on <a target="_blank" rel="noopener noreferrer" href="https://twitter.com/ToolJet">Twitter</a>',
      backgroundColor: '#4D72DA',
      textColor: '#ffffff',
      isCloseable: true,
    },
    colorMode: {
      switchConfig: {
        darkIcon: '\00a0 ',
        lightIcon: '\00a0',
        darkIconStyle: {
          display: 'none',
        },
        lightIconStyle: {
          display: 'none',
        },
      },
    },
    navbar: {
      logo: {
        href: '/docs/intro',
        alt: 'ToolJet Logo',
        src: 'img/logo.svg',
        width: 90
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
      copyright: `Copyright © ${new Date().getFullYear()} ToolJet Solutions, Inc.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/ToolJet/Tooljet/blob/main/docs/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        sitemap: {},
        gtag: {
          trackingID: process.env.GA_MID,
          // Optional fields.
          anonymizeIP: true, // Should IPs be anonymized?
        },
      },
    ],
  ],
};
