export const pageConfig = {
  properties: {
    collapsable: true,
    style: 'texticon',
    hideHeader: false,
    position: 'top',
    name: '',
    hideLogo: false,
    disableMenu: {
      value: `{{false}}`,
      fxActive: false,
    },
    showOnDesktop: true,
    showOnMobile: true,
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
      hideHeader: false,
      position: 'top',
      name: '',
      hideLogo: false,
      disableMenu: {
        value: '{{false}}',
        fxActive: false,
      },
      showOnDesktop: true,
      showOnMobile: true,
    },
    styles: {
      textColor: {
        value: 'var(--cc-placeholder-text)',
        isDefault: false,
      },
      iconColor: {
        value: 'var(--cc-default-icon)',
        isDefault: false,
      },
      selectedTextColor: {
        value: 'var(--cc-primary-text)',
        isDefault: false,
      },
      selectedIconColor: {
        value: 'var(--cc-primary-brand)',
        isDefault: false,
      },
      pillHoverBackgroundColor: {
        value: 'var(--cc-surface2-surface)',
        isDefault: false,
      },
      pillSelectedBackgroundColor: {
        value: 'var(--cc-surface3-surface)',
        isDefault: false,
      },
      pillRadius: {
        value: '6',
      },
      backgroundColor: {
        value: 'var(--cc-surface1-surface)',
        isDefault: false,
      },
      borderColor: {
        value: 'var(--cc-default-border)',
        isDefault: false,
      },
    },
  },
};
