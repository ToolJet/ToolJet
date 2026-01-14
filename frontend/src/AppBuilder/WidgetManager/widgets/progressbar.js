export const progressbarConfig = {
    name: 'ProgressBar',
    displayName: 'Progressbar',
    description: 'Show progress',
    component: 'ProgressBar',
    defaultSize: {
        width: 7,
        height: 50,
    },
    others: {
        showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
        showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
        labelType: {
            type: 'switch',
            displayName: 'Label',
            validation: { schema: { type: 'string' } },
            showLabel: true,
            options: [
                { displayName: 'Auto', value: 'auto' },
                { displayName: 'Custom', value: 'custom' },
            ],
            accordian: 'Data',
            isFxNotRequired: true,
        },
        text: {
            type: 'code',
            displayName: ' ',
            validation: {
                schema: { type: 'string' },
                defaultValue: 'text',
            },
            accordian: 'Data',
            conditionallyRender: {
                key: 'labelType',
                value: 'custom',
            },
        },
        progress: {
            type: 'code',
            displayName: 'Progress',
            validation: {
                schema: { type: 'number' },
                defaultValue: 50,
            },
            accordian: 'Data',
        },
        tooltip: {
            type: 'code',
            displayName: 'Tooltip',
            validation: { schema: { type: 'string' } },
            section: 'additionalActions',
        },
        visibility: {
            type: 'toggle',
            displayName: 'Visibility',
            validation: { schema: { type: 'boolean' }, defaultValue: true },
            section: 'additionalActions',
        },
    },
    events: {},
    styles: {
        textColor: {
            type: 'colorSwatches',
            displayName: 'Color',
            validation: {
                schema: { type: 'string' },
                defaultValue: 'var(--cc-primary-text)',
            },
            accordian: 'label',
        },
        alignment: {
            type: 'switch',
            displayName: 'Alignment',
            validation: { schema: { type: 'string' }, defaultValue: 'side' },
            options: [
                { displayName: 'Side', value: 'side' },
                { displayName: 'Top', value: 'top' },
            ],
            accordian: 'label',
        },
        direction: {
            type: 'switch',
            displayName: '',
            validation: { schema: { type: 'string' }, defaultValue: 'left' },
            showLabel: false,
            isIcon: true,
            options: [
                { displayName: 'alignleftinspector', value: 'left', iconName: 'alignleftinspector' },
                { displayName: 'alignrightinspector', value: 'right', iconName: 'alignrightinspector' },
            ],
            accordian: 'label',
            isFxNotRequired: true,
        },
        textSize: {
            type: 'slider',
            displayName: 'Size',
            validation: {
                schema: { type: 'number' },
                defaultValue: 26,
            },
            accordian: 'label',
            skipAutoConditionCheck: true,
        },
        auto: {
            type: 'checkbox',
            displayName: 'Width',
            validation: { schema: { type: 'boolean' }, defaultValue: true },
            accordian: 'label',
            conditionallyRender: {
                key: 'alignment',
                value: 'side',
            },
            isFxNotRequired: true,
        },
        width: {
            type: 'slider',
            showLabel: false,
            accordian: 'label',
            conditionallyRender: [
                {
                    key: 'alignment',
                    value: 'side',
                },
                {
                    key: 'auto',
                    value: false,
                },
            ],
            isFxNotRequired: true,
        },
        trackColor: {
            type: 'colorSwatches',
            displayName: 'Track',
            validation: {
                schema: { type: 'string' },
                defaultValue: 'var(--cc-surface3-surface)',
            },
            accordian: 'progress bar',
        },
        progressTrackColor: {
            type: 'colorSwatches',
            displayName: 'Progress track',
            validation: {
                schema: { type: 'string' },
                defaultValue: 'var(--cc-primary-brand)',
            },
            accordian: 'progress bar',
        },
        completionColor: {
            type: 'colorSwatches',
            displayName: 'Completion',
            validation: {
                schema: { type: 'string' },
                defaultValue: 'var(--cc-success-systemStatus)',
            },
            accordian: 'progress bar',
        },
        progressBarWidth: {
            type: 'slider',
            displayName: 'Progress bar width',
            validation: {
                schema: { type: 'number' },
                defaultValue: 20,
            },
            accordian: 'progress bar',
            skipAutoConditionCheck: true,
        },
        boxShadow: {
            type: 'boxShadow',
            displayName: 'Box shadow',
            validation: {
                schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
                defaultValue: '0px 0px 0px 0px #00000040',
            },
            accordian: 'Container',
        },
        padding: {
            type: 'switch',
            displayName: 'Padding',
            validation: { schema: { type: 'string' }, defaultValue: 'default' },
            options: [
                { displayName: 'Default', value: 'default' },
                { displayName: 'None', value: 'none' },
            ],
            accordian: 'Container',
        },
    },
    exposedVariables: {
        value: 50,
        isVisible: true,
    },
    actions: [
        {
            handle: 'setValue',
            displayName: 'Set value',
            params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{50}}' }],
        },
        {
            handle: 'setVisibility',
            displayName: 'Set visibility',
            params: [{ handle: 'value', displayName: 'Value', defaultValue: '{{true}}', type: 'toggle' }],
        },
    ],

    definition: {
        others: {
            showOnDesktop: { value: '{{true}}' },
            showOnMobile: { value: '{{false}}' },
        },
        properties: {
            labelType: { value: 'auto' },
            text: {
                value: '',
            },
            progress: {
                value: '{{50}}',
            },
            tooltip: { value: '' },
            visibility: { value: '{{true}}' },
        },
        events: [],
        styles: {
            textColor: { value: 'var(--cc-primary-text)' },
            textSize: { value: '{{26}}' },
            alignment: { value: 'side' },
            direction: { value: 'left' },
            width: { value: '{{33}}' },
            auto: { value: '{{true}}' },
            trackColor: { value: 'var(--cc-surface3-surface)' },
            progressTrackColor: { value: 'var(--cc-primary-brand)' },
            completionColor: { value: 'var(--cc-success-systemStatus)' },
            progressBarWidth: { value: '{{20}}' },
            progressBarAlignment: { value: 'center' },
            boxShadow: { value: '0px 0px 0px 0px #00000040' },
            padding: { value: 'default' },
        },
    },
};
