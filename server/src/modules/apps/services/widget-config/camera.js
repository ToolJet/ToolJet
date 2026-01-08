export const cameraConfig = {
    name: 'Camera',
    displayName: 'Camera',
    description: 'Captures video & photos from camera',
    component: 'Camera',
    defaultSize: {
        width: 15,
        height: 500,
    },
    others: {
        showOnDesktop: { type: 'toggle', displayName: 'Show on desktop' },
        showOnMobile: { type: 'toggle', displayName: 'Show on mobile' },
    },
    properties: {
        content: {
            type: 'switch',
            displayName: 'Content',
            validation: { schema: { type: 'string' } },
            options: [
                { displayName: 'Image', value: 'image' },
                { displayName: 'Video', value: 'video' },
            ],
            accordian: 'Content',
            defaultValue: 'image',
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
    events: {
        onRecordingStart: { displayName: 'On recording start' },
        onRecordingSave: { displayName: 'On recording save' },
        onImageSave: { displayName: 'On image save' },
    },
    styles: {
        textColor: {
            type: 'colorSwatches',
            displayName: 'Text color',
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
        imageDataURL: null,
        videoDataURL: null,
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
            handle: 'resetVideo',
            displayName: 'Reset video',
        },
        {
            handle: 'resetImage',
            displayName: 'Reset image',
        },
    ],
    definition: {
        others: {
            showOnDesktop: { value: '{{true}}' },
            showOnMobile: { value: '{{false}}' },
        },
        properties: {
            content: { value: 'image' },
            visibility: { value: '{{true}}' },
            disabledState: { value: '{{false}}' },
            tooltip: { value: '' },
        },
        events: [],
        styles: {
            textColor: { value: 'var(--cc-primary-text)' },
            accentColor: { value: 'var(--cc-primary-brand)' },
            backgroundColor: { value: 'var(--cc-surface1-surface)' },
            borderColor: { value: 'var(--cc-default-border)' },
            borderRadius: { value: '{{6}}' },
            boxShadow: { value: '0px 0px 0px 0px #00000040' },
        },
    },
};
