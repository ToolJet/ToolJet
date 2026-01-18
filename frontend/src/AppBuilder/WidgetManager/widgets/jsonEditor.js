export const jsonEditorConfig = {
    name: 'JSONEditor',
    displayName: 'JSON Editor',
    description: 'Edit JSON data',
    component: 'JSONEditor',
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
                defaultValue: `{{{ \n\ta : { \n\t\tb : [1,2,3,4,5,6] \n\t}, \n\tc: { \n\t\td : false \n\t}, \n\te: "Hello World" \n}}}`,
            },
        },
        shouldExpandEntireJSON: {
            type: 'toggle',
            displayName: 'Expand entire JSON',
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
        value: { a: { b: [1, 2, 3, 4, 5, 6] }, c: { d: false }, e: 'Hello World' },
        isValid: true,
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
                value: `{{{ \n\ta : { \n\t\tb : [1,2,3,4,5,6] \n\t}, \n\tc: { \n\t\td : false \n\t}, \n\te: "Hello World" \n}}}`,
            },
            shouldExpandEntireJSON: { value: '{{true}}' },
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
