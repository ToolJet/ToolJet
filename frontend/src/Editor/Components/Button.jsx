import React from 'react';

export const Button = function Button({ id, component, onComponentClick }) {
    return (
        <button class="btn btn-sm btn-primary p-1" onClick={() => onComponentClick(id, component) }>Button</button>
    );
};
