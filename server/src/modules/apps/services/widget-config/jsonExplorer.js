export const jsonExplorerConfig = {
    name: 'JSONExplorer',
    displayName: 'JSON Explorer',
    description: 'Explore JSON data',
    component: 'JSONExplorer',
    defaultSize: {
        width: 15,
        height: 120,
    },
    others: {
        showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
        showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
        value: {
            type: 'code',
            displayName: 'Json',
            validation: {
                schema: { type: 'union', schemas: [{ type: 'object' }, { type: 'array' }] },
                defaultValue: `{{{ \n\ttext : "Hello World", \n\tnumber : 64, \n\tboolean : true, \n\tnullValue : null, \n\tfruits : [\n\t\t"banana",\n\t\t"mango",\n\t\t"grape"\n\t], \n\tobjectA : { \n\t\tvalue : "testing", \n\t\tenabled : false \n\t}, \n\titems : [] \n}}}`,
            },
        },
        shouldExpandEntireJSON: {
            type: 'toggle',
            displayName: 'Expand entire JSON',
            validation: { schema: { type: 'boolean' }, defaultValue: true },
            section: 'additionalActions',
        },
        shouldShowRootNode: {
            type: 'toggle',
            displayName: 'Show root node',
            validation: { schema: { type: 'boolean' }, defaultValue: true },
            section: 'additionalActions',
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
    events: {},
    styles: {
        backgroundColor: {
            type: 'colorSwatches',
            displayName: 'Background',
            validation: {
                schema: { type: 'string' },
                defaultValue: 'var(--cc-surface1-surface)',
            },
            accordian: 'container',
        },
        borderColor: {
            type: 'colorSwatches',
            displayName: 'Border color',
            validation: {
                schema: { type: 'string' },
                defaultValue: 'var(--cc-default-border)',
            },
            accordian: 'container',
        },
        borderRadius: {
            type: 'numberInput',
            displayName: 'Border radius',
            validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: '{{6}}' },
            accordian: 'container',
        },
        boxShadow: {
            type: 'boxShadow',
            displayName: 'Box shadow',
            validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: '{{0px 0px 0px 0px #00000040}}' },
            accordian: 'container',
        },
    },
    exposedVariables: {
        value: { text: "Hello World", number: 64, boolean: true, nullValue: null, fruits: ["banana", "mango", "grape"], objectA: { value: "testing", enabled: false }, items: [] },
        isVisible: true,
        isLoading: false,
        isDisabled: false,
    },
    actions: [
        {
            handle: 'setVisibility',
            displayName: 'Set visibility',
            params: [{ handle: 'visibility', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
        },
        {
            handle: 'setLoading',
            displayName: 'Set loading',
            params: [{ handle: 'loading', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
        },
        {
            handle: 'setDisable',
            displayName: 'Set disable',
            params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
        },
    ],
    definition: {
        others: {
            showOnDesktop: { value: '{{true}}' },
            showOnMobile: { value: '{{false}}' },
        },
        properties: {
            value: {
                value: `{{{ \n\ttext : "Hello World", \n\tnumber : 64, \n\tboolean : true, \n\tnullValue : null, \n\tfruits : [\n\t\t"banana",\n\t\t"mango",\n\t\t"grape"\n\t], \n\tobjectA : { \n\t\tvalue : "testing", \n\t\tenabled : false \n\t}, \n\titems : [] \n}}}`,
            },
            shouldExpandEntireJSON: { value: '{{true}}' },
            shouldShowRootNode: { value: '{{true}}' },
            loadingState: { value: '{{false}}' },
            visibility: { value: '{{true}}' },
            disabledState: { value: '{{false}}' },
        },
        events: [],
        styles: {
            borderRadius: { value: '{{6}}' },
            borderColor: { value: 'var(--cc-default-border)' },
            backgroundColor: { value: 'var(--cc-surface1-surface)' },
            boxShadow: { value: '0px 0px 0px 0px #00000040' },
        },
    },
};
