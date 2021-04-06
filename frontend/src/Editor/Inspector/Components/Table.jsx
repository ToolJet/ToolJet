
import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import 'codemirror/theme/duotone-light.css';
import { renderElement, renderEvent } from '../Utils';
import { computeActionName } from '@/_helpers/utils';
import SortableList, { SortableItem } from "react-easy-sort";
import arrayMove from "array-move";
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { EventSelector } from '../EventSelector';

class Table extends React.Component {
    constructor(props) {
        super(props);

        const { dataQueries, component, paramUpdated, componentMeta, eventUpdated, eventOptionUpdated } = props;

        this.state = {
            dataQueries, component, paramUpdated, componentMeta, eventUpdated, eventOptionUpdated
         };
    }

    componentDidMount() {
        const { dataQueries, component, paramUpdated, componentMeta, eventUpdated, eventOptionUpdated } = this.props;

        this.state = {
            dataQueries, component, paramUpdated, componentMeta, eventUpdated, eventOptionUpdated
         };
    }

    onActionButtonPropertyChanged = (index, property, value) => {

        const actions = this.state.component.component.definition.properties.actions;
        actions.value[index][property] = value;
        this.props.paramUpdated ({name: 'actions'}, 'value', actions.value, 'properties');
    }

    actionButtonEventUpdated = (event, value, extraData) => {
        const actions = this.state.component.component.definition.properties.actions;
        const actionButton = extraData.actionButton;
        const index = extraData.index;
        
        let newValues = actions.value;
        newValues[index][event.name] = {
            actionId: value
        }

        this.props.paramUpdated ({name: 'actions'}, 'value', newValues, 'properties');
    }

    actionButtonEventOptionUpdated = (event, option, value, extraData) => {
        const actions = this.state.component.component.definition.properties.actions;
        const index = extraData.index;

        let newValues = actions.value;
        const options = newValues[index][event.name].options;

        newValues[index][event.name].options = {
            ...options,
            [option]: value
        }

        this.props.paramUpdated ({name: 'actions'}, 'value', newValues, 'properties');
    }

    actionPopOver = (action, index) => {
        return (
            <Popover id="popover-basic">
                <Popover.Title as="h3">{action.name}</Popover.Title>
                <Popover.Content>
                    <div className="field mb-2">
                        <label class="form-label">Button Text</label>
                        <input 
                            type="text"  
                            class="form-control text-field" 
                            onChange={(e) => { e.stopPropagation(); this.onActionButtonPropertyChanged(index, 'buttonText', e.target.value); }} 
                            value={action.buttonText} 
                        />
                    </div>
                    <EventSelector 
                        param={ { name: 'onClick' } }
                        definition={action.onClick}
                        eventUpdated={this.actionButtonEventUpdated}
                        dataQueries={this.state.dataQueries}
                        eventOptionUpdated={this.actionButtonEventOptionUpdated}
                        extraData={{ actionButton: action, index: index }} // This data is returned in the callbacks
                    />
                    <button className="btn btn-sm btn-danger col" onClick={() => this.removeAction(index)}>Remove</button>
                </Popover.Content>
            </Popover>
        );
    }

    actionButton(action , index) {
        return <OverlayTrigger 
            trigger="click" 
            placement="left" 
            overlay={this.actionPopOver(action, index)}>

            <div className="card p-2 bg-light" role="button">
                <div className="row bg-light">
                    <div className="col-auto">
                        <div class="text">
                            {action.buttonText}
                        </div>
                    </div>
                </div>
            </div>

        </OverlayTrigger>
    };

    onSortEnd(oldIndex, newIndex) {
        const newColumns = arrayMove(columns.value, oldIndex, newIndex);
        paramUpdated ({name: 'columns'}, 'value', newColumns, 'properties');
    }

    addNewColumn = () => {
        const columns = this.state.component.component.definition.properties.columns;
        const newValue = columns.value;
        newValue.push({ name: 'new_column'});
        this.props.paramUpdated({name: 'columns'}, 'value', newValue, 'properties');
    }

    addNewAction = () => {
        const actions = this.state.component.component.definition.properties.actions;
        const newValue = actions.value;
        newValue.push({ name: computeActionName(actions), buttonText: 'Button'});
        this.props.paramUpdated({name: 'actions'}, 'value', newValue, 'properties');
    }

    removeAction = (index) => {
        const newValue = actions.value;
        newValue.splice(index, 1);
        paramUpdated ({name: 'actions'}, 'value', newValue, 'properties');
    }

    onColumnItemChange = (index, e) => {
        e.preventDefault();
        const columns = this.state.component.component.definition.properties.columns;
        const value = e.target.value;
        const column = columns.value[index];
        column.name = value;
        const newColumns = columns.value;
        newColumns[index] = column;
        this.props.paramUpdated ({name: 'columns'}, 'value', newColumns, 'properties');
    }

    removeColumn = (index) => {
        const columns = this.state.component.component.definition.properties.columns;
        const newValue = columns.value;
        newValue.splice(index, 1);
        this.props.paramUpdated ({name: 'columns'}, 'value', newValue, 'properties');
    }


    render() {
        const { dataQueries, component, paramUpdated, componentMeta, eventUpdated, eventOptionUpdated } = this.state;

        const columns = component.component.definition.properties.columns;
        const actions = component.component.definition.properties.actions || { value: [] };

        return (
            <div className="properties-container p-2">
                {renderElement(component, componentMeta, paramUpdated, dataQueries, 'title', 'properties')}
                {renderElement(component, componentMeta, paramUpdated, dataQueries, 'data', 'properties')}

                <div className="field mb-2 mt-2">
                    <div class="row g-2">
                        <div class="col-auto">
                            <label class="form-label col pt-1">Columns</label>
                        </div>
                        <div class="col">
                            <button onClick={this.addNewColumn} className="btn btn-sm btn-light col-auto">
                                + Add column
                            </button>
                        </div>
                    </div>
                    <div>
                        <SortableList
                            onSortEnd={this.onSortEnd}
                            className="w-100 p-2"
                            draggedItemClassName="dragged"
                            >
                            {columns.value.map((item, index) => (
                                
                                <div className="card p-2 bg-light">
                                    <div className="row bg-light">
                                        <div className="col-auto">
                                            <SortableItem key={item.name}>
                                                <img 
                                                    style={{cursor: 'move'}}
                                                    src="https://www.svgrepo.com/show/20663/menu.svg" 
                                                    width="10" 
                                                    height="10" />
                                            </SortableItem>
                                        </div>
                                        <div className="col-auto">
                                            <div class="text">
                                                <input 
                                                    type="text" 
                                                    onChange={(e) => this.onColumnItemChange(index, e)}
                                                    class="form-control-plaintext form-control-plaintext-sm" 
                                                    value={item.name}
                                                />
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div class="btn btn-sm text-danger" onClick={() => this.removeColumn(index)}>
                                                x
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                            ))}
                        </SortableList>
                        
                    </div>

                    <hr></hr>
                    <h4 className="text-muted">Actions</h4>  
                    <div className="field mb-2 mt-2">
                        <div class="row g-2">
                            <div class="col">
                                <label class="form-label col pt-1">Actions</label>
                            </div>
                            <div class="col-auto">
                                <button onClick={this.addNewAction} className="btn btn-sm btn-light col-auto">
                                    + Action
                                </button>
                            </div>
                        </div>  
                        <div>
                            {actions.value.map((action, index) => 
                                this.actionButton(action, index)
                            )}
                        </div>    
                    </div>    
                    <hr></hr>

                    {renderEvent(component, eventUpdated, dataQueries, eventOptionUpdated, 'onRowClicked')}

                    <hr></hr>
                </div>

                {renderElement(component, componentMeta, paramUpdated, dataQueries, 'visible', 'properties')}
                {renderElement(component, componentMeta, paramUpdated, dataQueries, 'backgroundColor', 'styles')}
                {renderElement(component, componentMeta, paramUpdated, dataQueries, 'textColor', 'styles')}
            </div>         
        )
    }
}

export { Table };
