export const componentTypes = [
    { 
        icon: 'https://www.svgrepo.com/show/243604/buy-click.svg', 
        name: 'Button', 
        description: 'Trigger actions: queries, alerts etc',
        component: 'Button',
        defaultSize: {
            width: 120,
            height: 60
        },
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
            visible: { type: 'string' },
            loadingState: { type: 'string' },
            columns: { type: 'array' } 
        },
        defaultSize: {
            width: 800,
            height: 300
        },
        events: [
            'onRowClicked'
        ],
        styles: {
            textColor: { type: 'color'} 
        },
        definition: {
            properties: {
                'title': { value: 'Table' },
                'visible': { value: true },
                loadingState: { value: false },
                'columns': { value: [
                    { name: 'id' },
                    { name: 'name' },
                    { name: 'email' },
                ]}
            },
            events: {
               onRowClicked: {
                   options: {

                   }
               }
            },
            styles: {
                textColor: { value: '' }
            }
        }
    },
    { 
        icon: 'https://www.svgrepo.com/show/38828/text.svg', 
        name: 'TextInput', 
        description: 'Text field for forms',
        component: 'TextInput',
        defaultSize: {
            width: 100,
            height: 60
        },
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
        icon: 'https://www.svgrepo.com/show/317958/editor-left.svg', 
        name: 'Textarea', 
        description: 'Text area form field',
        component: 'TextArea',
        defaultSize: {
            width: 250,
            height: 100
        },
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
        defaultSize: {
            width: 100,
            height: 60
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
    { 
        icon: 'https://www.svgrepo.com/show/35088/image.svg', 
        name: 'Image', 
        description: 'Display an Image',
        defaultSize: {
            width: 200,
            height: 200
        },
        component: 'Image',
        properties: {
            source: { type: 'string'} ,
            visible: { type: 'string' } 
        },
        events: [
            'onClick'
        ],
        styles: {
            
        },
        definition: {
            properties: {
                'source': { value: 'https://www.svgrepo.com/show/34217/image.svg' },
                'visible': { value: true },
            },
            events: {
                onClick: { } 
            },
            styles: {
                
            }
        }
    },
    { 
        icon: 'https://www.svgrepo.com/show/46775/drop-down-list.svg', 
        name: 'Dropdown', 
        description: 'Select one value from options',
        component: 'Dropdown',
        properties: {
            label: { type: 'string'} ,
            values: { type: 'string' },
            display_values: { type: 'string' }
        },
        events: [
            'onSelect'
        ],
        styles: {
            
        },
        definition: {
            properties: {
                'label': { value: 'Select' },
                'values': [1,2,3],
                'display_values': ["one", "two", "three"],
                'visible': { value: true },
            },
            events: {
                onSelect: { } 
            },
            styles: {
                
            }
        }
    },
    { 
        icon: 'https://www.svgrepo.com/show/16476/map.svg', 
        name: 'Map', 
        description: 'Display maps with markers.',
        component: 'Map',
        properties: {
            label: { type: 'string'} ,
            values: { type: 'string' },
            display_values: { type: 'string' }
        },
        events: [
            'onMarkerClick', 'onMarkerCreate'
        ],
        styles: {
            
        },
        definition: {
            properties: {
                'label': { value: 'https://www.svgrepo.com/show/46775/drop-down-list.svg' },
                'values': [1,2,3],
                'display_values': ["one", "two", "three"],
                'visible': { value: true },
            },
            events: {
                onMarkerClick: { },
                onMarkerCreate: { }
            },
            styles: {
                
            }
        }
    },
]