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
    onPageChange: { displayName: 'On Page Change' },
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
    alignment: {
      type: 'alignButtons',
      displayName: 'Alignment',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'left',
      },
    },
  },
  exposedVariables: {
    totalPages: null,
    currentPageIndex: null,
    isVisible: true,
    isDisabled: false,
    isLoading: false,
  },
  actions: [
    {
      handle: 'setPage',
      displayName: 'Set page',
      params: [{ handle: 'page', displayName: 'Page', defaultValue: '{{1}}' }],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [{ handle: 'visible', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [{ handle: 'loading', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
    },
  ],
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
      alignment: { value: 'left' },
    },
  },
};
