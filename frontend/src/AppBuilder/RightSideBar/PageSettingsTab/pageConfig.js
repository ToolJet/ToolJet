export const pageConfig = {
  properties: {
    collapsable: true,
    style: 'texticon',
    disableMenu: {
      value: `{{false}}`,
      fxActive: false,
    },
  },
  styles: {
    textColor: {
      accordion: 'itemList',
      displayName: 'Default text',
      type: 'colorSwatches',
    },
    iconColor: {
      accordion: 'itemList',
      displayName: 'Default icon',
      type: 'colorSwatches',
    },
    selectedTextColor: {
      accordion: 'itemList',
      displayName: 'Selected text',
      type: 'colorSwatches',
    },
    selectedIconColor: {
      accordion: 'itemList',
      displayName: 'Selected icon',
      type: 'colorSwatches',
    },
    pillHoverBackgroundColor: {
      accordion: 'itemList',
      displayName: 'Pill hover background',
      type: 'colorSwatches',
    },
    pillSelectedBackgroundColor: {
      accordion: 'itemList',
      displayName: 'Pill selected background',
      type: 'colorSwatches',
    },
    pillRadius: {
      accordion: 'itemList',
      displayName: 'Pill radius',
      type: 'numberInput',
    },
    backgroundColor: {
      accordion: 'container',
      displayName: 'Background',
      type: 'colorSwatches',
    },
    borderColor: {
      accordion: 'container',
      displayName: 'Border',
      type: 'colorSwatches',
    },
  },
  definition: {
    properties: {
      collapsable: true,
      style: 'texticon',
      disableMenu: {
        value: '{{false}}',
        fxActive: false,
      },
    },
    styles: {
      textColor: {
        value: 'var(--cc-placeholder-text)',
        isDefault: true,
      },
      iconColor: {
        value: 'var(--cc-default-icon)',
        isDefault: true,
      },
      selectedTextColor: {
        value: 'var(--cc-primary-brand)',
        isDefault: true,
      },
      selectedIconColor: {
        value: 'var(--cc-primary-brand)',
        isDefault: true,
      },
      pillHoverBackgroundColor: {
        value: '#ECEEF0',
        isDefault: true,
      },
      pillSelectedBackgroundColor: {
        value: '#F0F4FF',
        isDefault: true,
      },
      pillRadius: {
        value: '6',
      },
      backgroundColor: {
        value: 'var(--cc-surface1-surface)',
        isDefault: true,
      },
      borderColor: {
        value: 'var(--cc-default-border)',
        isDefault: true,
      },
    },
  },
};
