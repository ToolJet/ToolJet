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
                onClick: { 
                    options: {

                    }
                } 
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
                backgroundColor: { value: '' },
                textColor: { value: '' }
            }
        }
    },
    { 
        icon: 'https://www.svgrepo.com/show/38828/text.svg', 
        name: 'TextInput', 
        description: 'Text field for forms',
        component: 'TextInput',
        properties: {
            placeholder: { type: 'string'}
        },
        events: [

        ],
        styles: {
            
        },
        definition: {
            properties: {
                'placeholder': { value: 'Placeholder text' }
            },
            events: {
                
            },
            styles: {
                
            }
        }
    },
    { 
        icon: 'https://www.svgrepo.com/show/219344/text.svg', 
        name: 'Text', 
        description: 'Display markdown or HTML',
        component: 'Text',
        properties: {
            text: { type: 'string'} ,
            visible: { type: 'string' } 
        },
        events: [

        ],
        styles: {
            textColor: { type: 'color'} 
        },
        definition: {
            properties: {
                'text': { value: 'Text goes here !' },
                'visible': { value: true },
            },
            events: {
                onClick: { } 
            },
            styles: {
                textColor: { value: '#000' }
            }
        }
    },
]