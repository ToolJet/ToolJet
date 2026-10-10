// GENERATED from WidgetManager/shadcnSource.display.js by scripts-shadcn-literals.mjs. Do not edit by hand.
export const shadPaginationConfig = {
  name: 'ShadPagination',
  displayName: 'Pagination',
  description:
    "shadcn/ui pagination (native Pagination names): numberOfPages, or totalRecords with pageSize; defaultPageIndex (1-based); Previous / page numbers with ellipsis / Next (showLabels), optional first and last buttons (showFirstLast), siblingCount, size 'sm' or 'default'. onPageChange; action setPage(page); exposed currentPageIndex (1-based) and totalPages. Bind a query offset to (currentPageIndex - 1) * pageSize. Height: 36px (32px small)",
  component: 'ShadPagination',
  defaultSize: {
    width: 16,
    height: 36,
  },
  others: {
    showOnDesktop: {
      type: 'toggle',
      displayName: 'Show on desktop',
    },
    showOnMobile: {
      type: 'toggle',
      displayName: 'Show on mobile',
    },
  },
  properties: {
    numberOfPages: {
      type: 'code',
      displayName: 'Number of pages',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 10,
      },
    },
    totalRecords: {
      type: 'code',
      displayName: 'Total records (instead of pages)',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
        },
        defaultValue: '',
      },
    },
    pageSize: {
      type: 'code',
      displayName: 'Page size (with total records)',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 10,
      },
    },
    defaultPageIndex: {
      type: 'code',
      displayName: 'Default page index',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 1,
      },
    },
    siblingCount: {
      type: 'code',
      displayName: 'Pages beside the current one',
      validation: {
        schema: {
          type: 'number',
        },
        defaultValue: 1,
      },
    },
    showFirstLast: {
      type: 'toggle',
      displayName: 'First and last buttons',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
    },
    showLabels: {
      type: 'toggle',
      displayName: 'Previous / Next labels',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
    },
    size: {
      type: 'switch',
      displayName: 'Size',
      options: [
        {
          displayName: 'Sm',
          value: 'sm',
        },
        {
          displayName: 'Default',
          value: 'default',
        },
      ],
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'default',
      },
      isFxNotRequired: true,
      fullWidth: true,
    },
    loadingState: {
      type: 'toggle',
      displayName: 'Loading state',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    visibility: {
      type: 'toggle',
      displayName: 'Visibility',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: true,
      },
      section: 'additionalActions',
    },
    disabledState: {
      type: 'toggle',
      displayName: 'Disable',
      validation: {
        schema: {
          type: 'boolean',
        },
        defaultValue: false,
      },
      section: 'additionalActions',
    },
    tooltipFormat: {
      type: 'switch',
      displayName: 'Tooltip',
      options: [
        {
          displayName: 'Plain text',
          value: 'plainText',
        },
        {
          displayName: 'Markdown',
          value: 'markdown',
        },
        {
          displayName: 'HTML',
          value: 'html',
        },
      ],
      isFxNotRequired: true,
      defaultValue: {
        value: 'plainText',
      },
      fullWidth: true,
      newLine: true,
      section: 'additionalActions',
    },
    tooltip: {
      type: 'code',
      displayName: 'Tooltip',
      validation: {
        schema: {
          type: 'string',
        },
      },
      section: 'additionalActions',
      placeholder: 'Enter tooltip text',
      showLabel: false,
    },
  },
  events: {
    onPageChange: {
      displayName: 'On page change',
    },
  },
  styles: {
    boxShadow: {
      type: 'boxShadow',
      displayName: 'Box shadow',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
        },
        defaultValue: '0px 0px 0px 0px #00000040',
      },
      accordian: 'Container',
    },
    textColor: {
      type: 'colorSwatches',
      displayName: 'Page text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    hoverBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Hover background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    activeBackgroundColor: {
      type: 'colorSwatches',
      displayName: 'Current page background',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    activeTextColor: {
      type: 'colorSwatches',
      displayName: 'Current page text color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    activeBorderColor: {
      type: 'colorSwatches',
      displayName: 'Current page border color',
      validation: {
        schema: {
          type: 'string',
        },
      },
    },
    borderRadius: {
      type: 'numberInput',
      displayName: 'Button radius',
      validation: {
        schema: {
          type: 'union',
          schemas: [
            {
              type: 'string',
            },
            {
              type: 'number',
            },
          ],
        },
      },
    },
    alignment: {
      type: 'alignButtons',
      displayName: 'Alignment',
      validation: {
        schema: {
          type: 'string',
        },
        defaultValue: 'left',
      },
    },
  },
  exposedVariables: {
    isVisible: true,
    isLoading: false,
    isDisabled: false,
    totalPages: 10,
    currentPageIndex: 1,
  },
  actions: [
    {
      handle: 'setPage',
      displayName: 'Set page',
      params: [
        {
          handle: 'page',
          displayName: 'Page',
          defaultValue: '{{1}}',
        },
      ],
    },
    {
      handle: 'setVisibility',
      displayName: 'Set visibility',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setDisable',
      displayName: 'Set disable',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
    {
      handle: 'setLoading',
      displayName: 'Set loading',
      params: [
        {
          handle: 'value',
          displayName: 'Value',
          defaultValue: '{{true}}',
          type: 'toggle',
        },
      ],
    },
  ],
  definition: {
    others: {
      showOnDesktop: {
        value: '{{true}}',
      },
      showOnMobile: {
        value: '{{false}}',
      },
    },
    properties: {
      numberOfPages: {
        value: '{{10}}',
      },
      totalRecords: {
        value: '',
      },
      pageSize: {
        value: '{{10}}',
      },
      defaultPageIndex: {
        value: '{{1}}',
      },
      siblingCount: {
        value: '{{1}}',
      },
      showFirstLast: {
        value: '{{false}}',
      },
      showLabels: {
        value: '{{true}}',
      },
      size: {
        value: 'default',
      },
      loadingState: {
        value: '{{false}}',
      },
      visibility: {
        value: '{{true}}',
      },
      disabledState: {
        value: '{{false}}',
      },
      tooltipFormat: {
        value: 'plainText',
      },
      tooltip: {
        value: '',
      },
    },
    events: [],
    styles: {
      boxShadow: {
        value: '0px 0px 0px 0px #00000040',
      },
      alignment: {
        value: 'left',
      },
    },
  },
};
