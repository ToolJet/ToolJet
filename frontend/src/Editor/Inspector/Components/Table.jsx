import React from 'react';
import { renderElement, renderEvent } from '../Utils';
import SortableList, { SortableItem } from "react-easy-sort";
import arrayMove from "array-move";

export const Table = ({ dataQueries, component, paramUpdated, componentMeta, eventUpdated, eventOptionUpdated  }) => {

    const columns = component.component.definition.properties.columns;

    console.log('columns', columns);

    function onSortEnd(oldIndex, newIndex) {
        const newColumns = arrayMove(columns.value, oldIndex, newIndex);
        paramUpdated ({name: 'columns'}, 'value', newColumns, 'properties');
    }

    function addNewColumn() {
        const newValue = columns.value;
        newValue.push({ name: 'new_column'});
        paramUpdated({name: 'columns'}, 'value', newValue, 'properties');
    }

    function onColumnItemChange(index, e) {
        e.preventDefault();
        const value = e.target.value;
        const column = columns.value[index];
        column.name = value;
        const newColumns = columns.value;
        newColumns[index] = column;
        paramUpdated ({name: 'columns'}, 'value', newColumns, 'properties');
    }

    function removeColumn(index) {
        const newValue = columns.value;
        newValue.splice(index, 1);
        paramUpdated ({name: 'columns'}, 'value', newValue, 'properties');
    }

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
                        <button onClick={addNewColumn} className="btn btn-sm btn-light col-auto">
                            + Add column
                        </button>
                    </div>
                </div>
                <div>
                    <SortableList
                        onSortEnd={onSortEnd}
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
                                                    onChange={(e) => onColumnItemChange(index, e)}
                                                    class="form-control-plaintext form-control-plaintext-sm" 
                                                    value={item.name}
                                                />
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div class="btn btn-sm text-danger" onClick={() => removeColumn(index)}>
                                                x
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            
                        ))}
                    </SortableList>
                    
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
