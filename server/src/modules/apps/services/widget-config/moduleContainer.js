export const moduleContainerConfig = {
    name: 'ModuleContainer',
    displayName: 'Module Container',
    description: 'Module Container',
    component: 'ModuleContainer',
    defaultSize: {
        width: 10,
        height: 400,
    },
    others: {
        showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
        showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
        inputItems: { type: 'array', displayName: 'Input' },
        outputItems: { type: 'array', displayName: 'Output' },
        dynamicHeight: {
            type: 'toggle',
            displayName: 'Dynamic height',
            validation: {
                schema: { type: 'boolean' },
                defaultValue: false,
            },
        },
        collapseWhenHidden: {
            type: 'toggle',
            displayName: 'Collapse when hidden',
            validation: { schema: { type: 'boolean' }, defaultValue: false },
        },
    },
    events: {},
    styles: {},
    exposedVariables: {},
    actions: [],
    definition: {
        others: {
            showOnDesktop: { value: '{{true}}' },
            showOnMobile: { value: '{{false}}' },
        },
        properties: {
            inputItems: { value: [] },
            outputItems: { value: [] },
            dynamicHeight: { value: '{{false}}' },
            collapseWhenHidden: { value: '{{false}}' },
        },
        events: [],
        styles: {
            backgroundColor: { value: '#fff' },
        },
    },
};
