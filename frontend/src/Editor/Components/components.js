export const componentTypes = [
    { 
        icon: 'https://www.svgrepo.com/show/243696/buy-click.svg', 
        name: 'Button', 
        description: 'Trigger actions like run queries, open other pages etc',
        component: 'Button',
        properties: [
            { 'text': { 'type': 'string'} },
            { 'style': { 'type': 'select', data: [{ name: 'Primary', value: 'primary' }, { name: 'Secondary', value: 'secondary' }] } },
            { 'visible': { 'type': 'boolean', default: 'true' }}
        ],
        events: [
            'onClick'
        ],
        styles: [
            { backgroundColor: '#3c92dc'}
        ]
    },

    { 
        icon: 'https://www.svgrepo.com/show/54455/table.svg', 
        name: 'Table', 
        description: 'Display paginated tabular data' 
    },
    { 
        icon: 'https://www.svgrepo.com/show/38828/text.svg', 
        name: 'Text Input', 
        description: 'Display paginated tabular data',
        component: 'TextInput',
    },
    { 
        icon: 'https://www.svgrepo.com/show/219344/text.svg', 
        name: 'Text', 
        description: 'Display markdown or HTML',
        component: 'Text',
        properties: [
            { 'text': { 'type': 'string'} },
            { 'visible': { 'type': 'boolean', default: 'true' }}
        ]
    },
]