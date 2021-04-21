import React, { memo } from 'react';
import { Button } from './Components/Button';
import { Image } from './Components/Image';
import { Text } from './Components/Text';
import { Table } from './Components/Table';
import { TextInput } from './Components/TextInput';
import { TextArea } from './Components/TextArea';
import { Container } from './Components/Container';
import { RichTextEditor } from './Components/RichTextEditor';
import { DropDown } from './Components/DropDown';
import { Checkbox } from './Components/Checkbox';
import { Datepicker } from './Components/Datepicker';
import { DaterangePicker } from './Components/DaterangePicker';
import { Multiselect } from './Components/Multiselect';

const AllComponents = {
    Button,
    Image,
    Text,
    TextInput,
    Table,
    TextArea,
    Container,
    RichTextEditor,
    DropDown,
    Checkbox,
    Datepicker,
    DaterangePicker,
    Multiselect
}

let styles = {
    cursor: 'move',
};

export const Box = function Box({ id, width, height, yellow, preview, component, inCanvas, onComponentClick, onEvent, currentState, onComponentOptionChanged, paramUpdated }) {
    const backgroundColor = yellow ? 'yellow' : '';

    console.log('rendering box', component);
    console.log('width, height', width, height);

    if(inCanvas) {
        styles = {
            ...styles,
        }
    }

    const ComponentToRender = AllComponents[component.component];

    return (<div style={{ ...styles, backgroundColor }} role={preview ? 'BoxPreview' : 'Box'}>

            {inCanvas ? 
                <ComponentToRender 
                    onComponentClick={onComponentClick}
                    onComponentOptionChanged={onComponentOptionChanged}
                    currentState={currentState}
                    onEvent={onEvent}
                    id={id}
                    paramUpdated={paramUpdated}
                    width={width}
                    height={height}
                    component={component}>
                </ComponentToRender>
            :
                <div className="row p-1 m-1">
                    <div className="col-md-3 component-image-holder">
                        <center><img src={component.icon}/></center>
                    </div>
                    <div className="col-md-9">
                        <span className="component-title" >{component.displayName}</span>
                        <small className="component-description">{component.description}</small>
                    </div>
                </div>
            }
		</div>);
};
