import React, { useCallback, useState, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import { DraggableBox } from './DraggableBox';
import { snapToGrid as doSnapToGrid } from './snapToGrid';
import update from 'immutability-helper';
import { componentTypes } from './Components/components';
import {computeComponentName } from '@/_helpers/utils';

const styles = {
    width: 1280,
    height: 1200,
    position: 'relative',
};

function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

export const Container = ({ snapToGrid, onComponentClick, onEvent, appDefinition, appDefinitionChanged, currentState, onComponentOptionChanged}) => {
    const [boxes, setBoxes] = useState(appDefinition.components);

    const moveBox = useCallback((id, left, top) => {
        setBoxes(update(boxes, {
            [id]: {
                $merge: { left, top },
            },
        }));
        console.log('new boxes - 1', boxes);
        // appDefinitionChanged({...appDefinition, components: boxes});
    }, [boxes]);

    useEffect(() => {
        console.log('new boxes - 2', boxes);
        appDefinitionChanged({...appDefinition, components: boxes});
    }, [boxes]);

    const [, drop] = useDrop(() => ({
        accept: ItemTypes.BOX,
        drop(item, monitor) {

            if(item.left === undefined || item.top === undefined) {
                item.left = 20;
                item.top = 60;
            }

            const componentMeta = componentTypes.find(component => component.component === item.component.component);
            console.log('adding new component');

            let componentData = JSON.parse(JSON.stringify(componentMeta));
            componentData.name = computeComponentName(componentData.component, boxes)


            const delta = monitor.getDifferenceFromInitialOffset();
            let left = Math.round(item.left + delta.x);
            let top = Math.round(item.top + delta.y);
            if (snapToGrid) {
                ;
                [left, top] = doSnapToGrid(left, top);
            }

            setBoxes({...boxes, [uuidv4()]: { top: top, left: 60, component: componentData}})

            console.log(boxes);

            moveBox(item.id, left, top);
            return undefined;
        },
    }), [moveBox]);

    return (<div ref={drop} style={styles}>
			{Object.keys(boxes).map((key) => (<DraggableBox 
                onComponentClick={onComponentClick} 
                onEvent={onEvent}
                onComponentOptionChanged={onComponentOptionChanged}
                key={key} 
                currentState={currentState}
                id={key} {...boxes[key]} 
                inCanvas={true} />))}
		</div>);
};
