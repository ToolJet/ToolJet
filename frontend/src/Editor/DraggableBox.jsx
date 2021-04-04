import React, { memo, useEffect, useState } from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './ItemTypes';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { Box } from './Box';

function getStyles(left, top, isDragging) {
    const transform = `translate3d(${left}px, ${top}px, 0)`;
    return {
        // position: 'absolute',
        transform,
        WebkitTransform: transform,
        // IE fallback: hide the real node using CSS when dragging
        // because IE will ignore our custom "empty image" drag preview.
        opacity: isDragging ? 0 : 1,
        height: isDragging ? 0 : '',
    };
}

export const DraggableBox = function DraggableBox({ id, title, left, top, component, index, inCanvas, onComponentClick, currentState  }) {

    // const [comp, setBoxes] = useState(component);

    // useEffect(() => {
    //     setBoxes(component);
    // }, []);

    console.log('Rendering draggable box');

    const [{ isDragging }, drag, preview] = useDrag(() => ({
        type: ItemTypes.BOX,
        item: { id, left, top, title, component },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    }), [id, left, top, title, component, index]);

    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
    }, []);

    return (<div ref={drag} style={getStyles(left, top, isDragging)} role="DraggableBox">
			<Box 
                component={component} 
                id={id} 
                inCanvas={inCanvas} 
                onComponentClick={onComponentClick} 
                currentState={currentState} />
		</div>);
};
