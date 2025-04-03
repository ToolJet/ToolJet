export const linkConfig = {
  name: 'Link',
  displayName: 'Link',
  description: 'Add link to the text',
  defaultSize: {
    width: 6,
    height: 30,
  },
  component: 'Link',
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    linkTarget: {
      type: 'code',
      displayName: 'Link target',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'https://dev.to/',
      },
    },
    linkText: {
      type: 'code',
      displayName: 'Link text',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'Click here',
      },
    },
    targetType: {
      type: 'select',
      displayName: 'Target type',
      options: [
        { name: 'New Tab', value: 'new' },
        { name: 'Same Tab', value: 'same' },
      ],
      validation: {
        schema: { type: 'string' },
      },
    },
  },
  events: {
    onClick: { displayName: 'On click' },
    onHover: { displayName: 'On hover' },
  },
  styles: {
    textColor: {
      type: 'color',
      displayName: 'Text color',
      validation: {
        schema: { type: 'string' },
        defaultValue: '#375FCF',
      },
    },
    textSize: {
      type: 'number',
      displayName: 'Text size',
      validation: {
        schema: { type: 'number' },
        defaultValue: 14,
      },
    },
    underline: {
      type: 'select',
      displayName: 'Underline',
      options: [
        { name: 'Never', value: 'no-underline' },
        { name: 'On Hover', value: 'on-hover' },
        { name: 'Always', value: 'underline' },
      ],
      validation: {
        schema: { type: 'string' },
        defaultValue: 'on-hover',
      },
    },
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
  actions: [
    {
      handle: 'click',
      displayName: 'Click',
    },
  ],
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      linkTarget: { value: 'https://dev.to/' },
      linkText: { value: 'Click here' },
      targetType: { value: 'new' },
    },
    events: [],
    styles: {
      textColor: { value: '#375FCF' },
      textSize: { value: '{{14}}' },
      underline: { value: 'on-hover' },
      visibility: { value: '{{true}}' },
      alignment: { value: 'left' },
    },
  },
};
