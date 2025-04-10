export const paginationConfig = {
  name: 'Pagination',
  displayName: 'Pagination',
  description: 'Navigate pages',
  component: 'Pagination',
  defaultSize: {
    width: 10,
    height: 30,
  },
  others: {
    showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
    showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
  },
  properties: {
    numberOfPages: {
      type: 'code',
      displayName: 'Number of pages',
      validation: {
        schema: { type: 'number' },
        defaultValue: '{{5}}',
      },
    },
    defaultPageIndex: {
      type: 'code',
      displayName: 'Default page index',
      validation: {
        schema: { type: 'number' },
        defaultValue: '{{1}}',
      },
    },
  },
  validation: {},
  events: {
    onPageChange: { displayName: 'On page change' },
  },
  styles: {
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: true,
      },
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: { type: 'boolean' },
        defaultValue: false,
      },
    },
  },
  exposedVariables: {
    totalPages: null,
    currentPageIndex: null,
  },
  definition: {
    validation: {},
    others: {
      showOnDesktop: { value: '{{true}}' },
      showOnMobile: { value: '{{false}}' },
    },
    properties: {
      numberOfPages: {
        value: '{{5}}',
      },
      defaultPageIndex: {
        value: '{{1}}',
      },
    },
    events: [],
    styles: {
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
    },
  },
};
