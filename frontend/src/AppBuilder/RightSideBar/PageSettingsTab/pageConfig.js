export const pageConfig = {
  properties: {
    collapsable: true,
    style: 'texticon',
    hideHeader: false,
    position: 'side',
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
      displayNameKey: 'editor.pageSettings.styles.defaultText',
      type: 'colorSwatches',
    },
    iconColor: {
      accordion: 'itemList',
      displayName: 'Default icon',
      displayNameKey: 'editor.pageSettings.styles.defaultIcon',
      type: 'colorSwatches',
    },
    selectedTextColor: {
      accordion: 'itemList',
      displayName: 'Selected text',
      displayNameKey: 'editor.pageSettings.styles.selectedText',
      type: 'colorSwatches',
    },
    selectedIconColor: {
      accordion: 'itemList',
      displayName: 'Selected icon',
      displayNameKey: 'editor.pageSettings.styles.selectedIcon',
      type: 'colorSwatches',
    },
    pillHoverBackgroundColor: {
      accordion: 'itemList',
      displayName: 'Pill hover background',
      displayNameKey: 'editor.pageSettings.styles.pillHoverBackground',
      type: 'colorSwatches',
    },
    pillSelectedBackgroundColor: {
      accordion: 'itemList',
      displayName: 'Pill selected background',
      displayNameKey: 'editor.pageSettings.styles.pillSelectedBackground',
      type: 'colorSwatches',
    },
    pillRadius: {
      accordion: 'itemList',
      displayName: 'Pill radius',
      displayNameKey: 'editor.pageSettings.styles.pillRadius',
      type: 'numberInput',
    },
    backgroundColor: {
      accordion: 'container',
      displayName: 'Background',
      displayNameKey: 'editor.pageSettings.styles.background',
      type: 'colorSwatches',
    },
    borderColor: {
      accordion: 'container',
      displayName: 'Border',
      displayNameKey: 'editor.pageSettings.styles.border',
      type: 'colorSwatches',
    },
  },
  definition: {
    properties: {
      collapsable: true,
      style: 'texticon',
      hideHeader: false,
      position: 'side',
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
        value: 'var(--cc-default-icon)',
        isDefault: false,
      },
      pillHoverBackgroundColor: {
        value: 'var(--cc-surface2-surface)',
        isDefault: false,
      },
      pillSelectedBackgroundColor: {
        value: 'var(--cc-appBackground-surface)',
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
        value: 'var(--cc-weak-border)',
        isDefault: false,
      },
    },
  },
};
