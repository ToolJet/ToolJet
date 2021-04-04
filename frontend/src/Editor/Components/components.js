export const componentTypes = [
    { 
        icon: 'https://www.svgrepo.com/show/243696/buy-click.svg', 
        name: 'Button', 
        description: 'Trigger actions like run queries, open other pages etc',
        component: 'Button',
        properties: {
            text: { type: 'string'} ,
            // { 'style': { 'type': 'select', data: [{ name: 'Primary', value: 'primary' }, { name: 'Secondary', value: 'secondary' }] } },
            visible: { type: 'string' } 
        },
        events: [
            'onClick'
        ],
        styles: {
            backgroundColor: { type: 'color'},
            textColor: { type: 'color'} 
        },
        definition: {
            properties: {
                'text': { value: 'Button' },
                'visible': { value: true },
            },
            events: {
                // onClick: { actionId: 'show-alert', options: { 'message': 'Message !'} }
                onClick: { } 
            },
            styles: {
                backgroundColor: { value: '#3c92dc' },
                textColor: { value: '#fff' }
            }
        }
    },

    { 
        icon: 'https://www.svgrepo.com/show/54455/table.svg', 
        name: 'Table', 
        description: 'Display paginated tabular data',
        component: 'Table',
        properties: {
            title: { type: 'string'} ,
            data: { type: 'json'},
            visible: { type: 'string' } 
        },
        events: [
        ],
        styles: {
            backgroundColor: { type: 'color'},
            textColor: { type: 'color'} 
        },
        definition: {
            properties: {
                'title': { value: 'Table' },
                'visible': { value: true },
            },
            events: {
               
            },
            styles: {
                backgroundColor: { value: '#3c92dc' },
                textColor: { value: '#fff' }
            }
        }
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