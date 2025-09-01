export const popoverMenuConfig = {
    name: 'PopoverMenu',
    displayName: 'Popover Menu',
    description: 'Popover Menu',
    component: 'PopoverMenu',
    defaultSize: {
        width: 4,
        height: 40,
    },
    others: {
        showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
        showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
        label: {
            type: 'code',
            displayName: 'Trigger button label',
            validation: { schema: { type: 'string' }, defaultValue: 'Menu' },
            accordian: 'Trigger',
        },
        buttonType: {
            type: 'switch',
            displayName: 'Button type',
            validation: { schema: { type: 'string' } },
            options: [
                { displayName: 'Primary', value: 'primary' },
                { displayName: 'Outline', value: 'outline' },
            ],
            accordian: 'Trigger',
        },
        trigger: {
            type: 'switch',
            displayName: 'Show menu',
            validation: { schema: { type: 'string' } },
            options: [
                { displayName: 'On hover', value: 'hover' },
                { displayName: 'On click', value: 'click' },

            ],
            accordian: 'Trigger',
        },
        advanced: {
            type: 'toggle',
            displayName: 'Dynamic options',
            validation: {
                schema: { type: 'boolean' },
            },
            accordian: 'Options',
        },
        schema: {
            type: 'code',
            displayName: 'Schema',
            conditionallyRender: {
                key: 'advanced',
                value: true,
            },
            accordian: 'Options',
        },
        optionsLoadingState: {
            type: 'toggle',
            displayName: 'Options loading state',
            validation: { schema: { type: 'boolean' }, defaultValue: false },
            section: 'additionalActions',
        },
        loadingState: {
            type: 'toggle',
            displayName: 'Trigger button loading state',
            validation: { schema: { type: 'boolean' }, defaultValue: false },
            section: 'additionalActions',
        },
        visibility: {
            type: 'toggle',
            displayName: 'Visibility',
            validation: { schema: { type: 'boolean' }, defaultValue: true },
            section: 'additionalActions',
        },
        disabledState: {
            type: 'toggle',
            displayName: 'Disable',
            validation: { schema: { type: 'boolean' }, defaultValue: false },
            section: 'additionalActions',
        },
        tooltip: {
            type: 'code',
            displayName: 'Tooltip',
            validation: { schema: { type: 'string' }, defaultValue: 'Tooltip text' },
            section: 'additionalActions',
            placeholder: 'Enter tooltip text',
        },
    },
    events: {
        onSelect: { displayName: 'On select' },
    },
    styles: {
        backgroundColor: {
            type: 'colorSwatches',
            displayName: 'Background',
            validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-primary-brand)' },
            conditionallyRender: {
                key: 'buttonType',
                value: 'primary',
            },
            accordian: 'Trigger button',
        },
        textColor: {
            type: 'colorSwatches',
            displayName: 'Text',
            validation: {
                schema: { type: 'string' },
                defaultValue: '#FFFFFF',
            },
            accordian: 'Trigger button',
        },
        borderColor: {
            type: 'colorSwatches',
            displayName: 'Border',
            validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-primary-brand)' },
            accordian: 'Trigger button',
        },
        loaderColor: {
            type: 'colorSwatches',
            displayName: 'Loader color',
            validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-surface1-surface)' },
            accordian: 'Trigger button',
        },
        icon: {
            type: 'icon',
            displayName: 'Icon',
            validation: { schema: { type: 'string' } },
            accordian: 'Trigger button',
            visibility: false,
        },
        iconColor: {
            type: 'colorSwatches',
            displayName: 'Icon color',
            validation: { schema: { type: 'string' } },
            accordian: 'Trigger button',
            visibility: false,
        },
        direction: {
            type: 'switch',
            displayName: '',
            validation: { schema: { type: 'string' } },
            showLabel: false,
            isIcon: true,
            options: [
                { displayName: 'alignleftinspector', value: 'left', iconName: 'alignleftinspector' },
                { displayName: 'alignrightinspector', value: 'right', iconName: 'alignrightinspector' },
            ],
            accordian: 'Trigger button',
        },
        borderRadius: {
            type: 'numberInput',
            displayName: 'Border radius',
            validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 6 },
            accordian: 'Trigger button',
        },
        boxShadow: {
            type: 'boxShadow',
            displayName: 'Box Shadow',
            validation: {
                schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] },
                defaultValue: '0px 0px 0px 0px #00000040',
            },
            conditionallyRender: {
                key: 'buttonType',
                value: 'primary',
            },
            accordian: 'Trigger button',
        },

        optionsTextColor: {
            type: 'colorSwatches',
            displayName: 'Text',
            validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-primary-text)' },
            accordian: 'Options',
        },
        optionsIconColor: {
            type: 'colorSwatches',
            displayName: 'Icon',
            validation: { schema: { type: 'string' }, defaultValue: 'var(--cc-default-icon)' },
            accordian: 'Trigger button',
            visibility: false,
            accordian: 'Options',
        },
    },
    exposedVariables: {
        isVisible: true,
        isDisabled: false,
        isLoading: false,
    },
    actions: [
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
        {
            handle: 'setVisibility',
            displayName: 'Set visibility',
            params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
        },
        {
            handle: 'setOptions',
            displayName: 'Set options',
            params: [{ handle: 'options', displayName: 'Value', defaultValue: '{{[]}}', type: 'array' }],
        },
    ],
    definition: {
        others: {
            showOnDesktop: { value: '{{true}}' },
            showOnMobile: { value: '{{false}}' },
        },
        properties: {
            label: { value: 'Menu' },
            buttonType: { value: 'primary' },
            trigger: { value: 'click' },
            advanced: { value: '{{false}}' },
            schema: {
                value:
                    '{{[{"label":"Option1","description":"Description1","value":"1","icon":"IconUser", "iconVisibility":true, "disable":false,"visible":true},{"label":"Option2","description":"Description2","value":"2","icon":"IconHome2", "iconVisibility":true, "disable":false,"visible":true},{"label":"Option3","description":"Description3","value":"3","icon":"IconBulb", "iconVisibility":true, "disable":false,"visible":true}]}}',
            },
            options: {
                value: [
                    {
                        format: 'plain',
                        label: 'Option1',
                        description: 'Description1',
                        value: '1',
                        icon: { value: 'IconUser' },
                        iconVisibility: true,
                        disable: { value: false },
                        visible: { value: true },
                    },
                    {
                        format: 'plain',
                        label: 'Option2',
                        description: 'Description2',
                        value: '2',
                        icon: { value: 'IconHome2' },
                        iconVisibility: true,
                        disable: { value: false },
                        visible: { value: true },
                    },
                    {
                        format: 'plain',
                        label: 'Option3',
                        description: 'Description3',
                        value: '3',
                        icon: { value: 'IconBulb' },
                        iconVisibility: true,
                        disable: { value: false },
                        visible: { value: true },
                    },
                ],
            },
            optionsLoadingState: { value: '{{false}}' },
            visibility: { value: '{{true}}' },
            disabledState: { value: '{{false}}' },
            loadingState: { value: '{{false}}' },
            tooltip: { value: '' },
        },
        events: [],
        styles: {
            backgroundColor: { value: 'var(--cc-primary-brand)' },
            textColor: { value: '#FFFFFF' },
            borderColor: { value: 'var(--cc-primary-brand)' },
            loaderColor: { value: 'var(--cc-surface1-surface)' },
            icon: { value: 'IconAlignBoxBottomLeft' },
            iconColor: { value: '#FFFFFF' },
            direction: { value: 'left' },
            borderRadius: { value: '6' },
            boxShadow: { value: '0px 0px 0px 0px #00000040' },
            optionsTextColor: { value: 'var(--cc-primary-text)' },
            optionsIconColor: { value: 'var(--cc-default-icon)' },
        },
    },
};
