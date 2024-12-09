export const timelineConfig = {
  name: 'Timeline',
  displayName: 'Timeline',
  description: 'Show event timeline',
  component: 'Timeline',
  properties: {
    data: {
      type: 'code',
      displayName: 'Timeline data',
      validation: {
        schema: { type: 'array', element: { type: 'object' } },
        defaultValue: "[{title: 'Product Launched', date: '20/10/2021'}]",
      },
    },
    hideDate: {
      type: 'toggle',
      displayName: 'Hide date',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
  },
  defaultSize: {
    width: 20,
    height: 270,
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
      validation: { schema: { type: 'boolean' } },
    },
  },
  exposedVariables: {
    value: {},
  },
  definition: {
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      data: {
        value:
          "{{ [ \n\t\t{ title: 'Product Launched', subTitle: 'First version of our product released to public', date: '20/10/2021', iconBackgroundColor: '#4d72fa'},\n\t\t { title: 'First Signup', subTitle: 'Congratulations! We got our first signup', date: '22/10/2021', iconBackgroundColor: '#4d72fa'}, \n\t\t { title: 'First Payment', subTitle: 'Hurray! We got our first payment', date: '01/11/2021', iconBackgroundColor: '#4d72fa'} \n] }}",
      },
      hideDate: { value: '{{false}}' },
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
    },
  },
};
