export const svgImageConfig = {
  name: 'SvgImage',
  displayName: 'Svg Image',
  description: 'Display SVG graphics',
  component: 'SvgImage',
  properties: {
    data: {
      type: 'code',
      displayName: 'Svg  data',
      validation: {
        schema: { type: 'string' },
        defaultValue:
          "<svg xmlns='http://www.w3.org/2000/svg' class='icon' width='24' height='24' viewBox='0 0 24 24' stroke-width='2' stroke='currentColor' fill='none' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><rect x='4' y='4' width='6' height='6' rx='1' /><rect x='4' y='14' width='6' height='6' rx='1' /><rect x='14' y='14' width='6' height='6' rx='1' /><line x1='14' y1='7' x2='20' y2='7' /><line x1='17' y1='4' x2='17' y2='10' /></svg>",
      },
    },
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
  },
  defaultSize: {
    width: 4,
    height: 50,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  events: {},
  styles: {
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    alignment: {
      type: 'alignButtons',
      displayName: 'Alignment',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'left',
      },
    },
  },
  exposedVariables: {},
  // The universal General Box Shadow, as a dropdown of the app theme's shadows + Custom (this shadow); the choice is
  // generalStyles.boxShadowStyle (the canvas merges generalStyles into the widget's styles).
  generalStyles: {
    boxShadow: { type: 'boxShadow', displayName: 'Box Shadow', themeTokens: 'shadows' },
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      data: {
        value:
          '<svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /><line x1="14" y1="7" x2="20" y2="7" /><line x1="17" y1="4" x2="17" y2="10" /></svg>',
      },
      collapseWhenHidden: { value: '{{false}}' },
    },
    events: [],
    // New drops follow the theme's None shadow (NEW_DROP_ONLY_STYLES in ../utils.js).
    generalStyles: {
      boxShadowStyle: { value: 'none' },
    },
    styles: {
      visibility: { value: '{{true}}' },
      alignment: { value: 'left' },
    },
  },
};
