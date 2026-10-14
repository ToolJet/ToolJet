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
    loadingState: {
      type: 'toggle',
      displayName: 'Show loading state',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' }, defaultValue: true },
      section: 'additionalActions',
    },
    // View mode only: the widget takes the vector's height at the current width (viewBox ratio)
    // instead of the authored box — see SvgImage.jsx.
    dynamicHeight: {
      type: 'toggle',
      displayName: 'Dynamic height',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    collapseWhenHidden: {
      type: 'toggle',
      displayName: 'Collapse when hidden',
      validation: { schema: { type: 'boolean' }, defaultValue: false },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
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
  actions: [
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'setVisibility', displayName: 'Value', defaultValue: `{{true}}`, type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'setLoading', displayName: 'Value', defaultValue: `{{false}}`, type: 'toggle' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'setDisable', displayName: 'Value', defaultValue: `{{false}}`, type: 'toggle' }],
    },
  ],
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
      loadingState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      dynamicHeight: { value: '{{false}}' },
      collapseWhenHidden: { value: '{{false}}' },
      disabledState: { value: '{{false}}' },
    },
    events: [],
    styles: {
      alignment: { value: 'left' },
    },
  },
};
