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
      type: 'color',
    },
    iconColor: {
      accordion: 'itemList',
      displayName: 'Default icon',
      type: 'color',
    },
    selectedTextColor: {
      accordion: 'itemList',
      displayName: 'Selected text',
      type: 'color',
    },
    selectedIconColor: {
      accordion: 'itemList',
      displayName: 'Selected icon',
      type: 'color',
    },
    pillHoverBackgroundColor: {
      accordion: 'itemList',
      displayName: 'Pill hover background',
      type: 'color',
    },
    pillSelectedBackgroundColor: {
      accordion: 'itemList',
      displayName: 'Pill selected background',
      type: 'color',
    },
    pillRadius: {
      accordion: 'itemList',
      displayName: 'Pill radius',
      type: 'numberInput',
    },
    backgroundColor: {
      accordion: 'container',
      displayName: 'Background',
      type: 'color',
    },
    borderColor: {
      accordion: 'container',
      displayName: 'Border',
      type: 'color',
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
        value: '#6A727C',
      },
      iconColor: {
        value: '#6A727C',
      },
      selectedTextColor: {
        value: '#4368E3',
      },
      selectedIconColor: {
        value: '#4368E3',
      },
      pillHoverBackgroundColor: {
        value: '#CCD1D5',
      },
      pillSelectedBackgroundColor: {
        value: '#F0F4FF',
      },
      pillRadius: {
        value: '8',
      },
      backgroundColor: {
        value: '#FFFFFF',
      },
      borderColor: {
        value: '#DFE3E6',
      },
    },
  },
};
