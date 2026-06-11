export const audioRecorderConfig = {
    name: 'AudioRecorder',
    displayName: 'Audio Recorder',
    description: 'Records audio',
    component: 'AudioRecorder',
    defaultSize: {
        width: 10,
        height: 70,
    },
    others: {
        showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
        showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
        label: {
            type: 'code',
            displayName: 'Label',
            validation: { schema: { type: 'string' } },
            accordian: 'Content',
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
        // Renders first in the Additional Actions section. Its displayName is the
        // visible "Tooltip" label for the whole pair; the `tooltip` code field below
        // hides its own label via showLabel:false so we don't get a duplicate.
        tooltipFormat: {
            type: 'switch',
            displayName: 'Tooltip',
            options: [
              { displayName: 'Plain text', value: 'plainText' },
              { displayName: 'Markdown', value: 'markdown' },
              { displayName: 'HTML', value: 'html' },
            ],
            isFxNotRequired: true,
            defaultValue: { value: 'plainText' },
            fullWidth: true,
            newLine: true, // render the switch on its own line below the "Tooltip" label
            section: 'additionalActions',
        },
        tooltip: {
            type: 'code',
            displayName: 'Tooltip',
            validation: { schema: { type: 'string' } },
            section: 'additionalActions',
            placeholder: 'Enter tooltip text',
            showLabel: false,
        },
    },
    events: {
        onRecordingStart: { displayName: 'On recording start' },
        onRecordingSave: { displayName: 'On recording save' },
    },
    styles: {
        recorderIcon: {
            type: 'icon',
            displayName: 'Icon',
            validation: { schema: { type: 'string' } },
            visibility: false,
            accordian: 'recorder',
        },
        recorderIconColor: {
            type: 'colorSwatches',
            displayName: 'Icon color',
            validation: { schema: { type: 'string' } },
            defaultValue: '#F6430D',
            accordian: 'recorder',
        },
        labelColor: {
            type: 'colorSwatches',
            displayName: 'Label text',
            validation: { schema: { type: 'string' } },
            defaultValue: 'var(--cc-primary-text)',
            accordian: 'recorder',
        },
        accentColor: {
            type: 'colorSwatches',
            displayName: 'Accent color',
            validation: { schema: { type: 'string' } },
            defaultValue: 'var(--cc-primary-brand)',
            accordian: 'recorder',
        },
        backgroundColor: {
            type: 'colorSwatches',
            displayName: 'Background',
            validation: { schema: { type: 'string' } },
            defaultValue: 'var(--cc-surface1-surface)',
            accordian: 'container',
        },
        borderColor: {
            type: 'colorSwatches',
            displayName: 'Border',
            validation: { schema: { type: 'string' } },
            defaultValue: 'var(--cc-default-border)',
            accordian: 'container',
        },
        borderRadius: {
            type: 'numberInput',
            displayName: 'Border radius',
            validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] }, defaultValue: 6 },
            defaultValue: 6,
            accordian: 'container',
        },
        boxShadow: {
            type: 'boxShadow',
            displayName: 'Box shadow',
            validation: { schema: { type: 'union', schemas: [{ type: 'string' }, { type: 'number' }] } },
            defaultValue: '0px 0px 0px 0px #00000040',
            accordian: 'container',
        },
    },
    exposedVariables: {
        isVisible: true,
        isDisabled: false,
        isLoading: false,
        dataURL: null,
    },
    actions: [
        {
            handle: 'setVisibility',
            displayName: 'Set visibility',
            params: [{ handle: 'disable', displayName: 'Value', defaultValue: '{{false}}', type: 'toggle' }],
        },
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
            handle: 'resetAudio',
            displayName: 'Reset audio',
        }
    ],
    definition: {
        others: {
            showOnDesktop: { value: '{{true}}' },
            showOnMobile: { value: '{{false}}' },
        },
        properties: {
            label: { value: 'Click to start recording' },
            visibility: { value: '{{true}}' },
            disabledState: { value: '{{false}}' },
            loadingState: { value: '{{false}}' },
            tooltip: { value: '' },
            tooltipFormat: { value: 'plainText' },
        },
        events: [],
        styles: {
            recorderIcon: { value: 'IconMicrophone' },
            recorderIconColor: { value: '#F6430D' },
            labelColor: { value: 'var(--cc-primary-text)' },
            accentColor: { value: 'var(--cc-primary-brand)' },
            backgroundColor: { value: 'var(--cc-surface1-surface)' },
            borderColor: { value: 'var(--cc-default-border)' },
            borderRadius: { value: '{{6}}' },
            boxShadow: { value: '0px 0px 0px 0px #00000040' },
            iconVisibility: { value: true },
        },
    },
};
