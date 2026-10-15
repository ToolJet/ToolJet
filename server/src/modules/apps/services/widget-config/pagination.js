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
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: { schema: { type: 'boolean' } },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: { schema: { type: 'boolean' } },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: { schema: { type: 'boolean' } },
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: { schema: { type: 'string' } },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
    },
  },
  validation: {},
  events: {
    onPageChange: { displayName: 'On Page Change' },
  },
  styles: {
    alignment: {
      type: 'alignButtons',
      displayName: 'Alignment',
      validation: {
        schema: { type: 'string' },
        defaultValue: 'left',
      },
      accordian: 'Pagination',
    },
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
      accordian: 'Pagination',
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
      loadingState: { value: '{{false}}' },
      visibility: { value: '{{true}}' },
      disabledState: { value: '{{false}}' },
    },
    events: [],
    styles: {
      alignment: { value: 'left' },
      boxShadow: { value: '0px 0px 0px 0px #00000040' },
    },
  },
};
