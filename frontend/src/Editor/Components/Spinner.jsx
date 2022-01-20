import React, { useState, useEffect } from 'react';

export const Spinner = ({ styles, height, darkMode }) => {
    const { colour, size, } = styles;

    const spinnerBaseStyle = {
        height,
        backgroundColor: darkMode ? "#47505D" : "#ffffff",
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    }
    return (
        <div style={spinnerBaseStyle}>
            <div className={`spinner-border spinner-border-${size}`} role="status" style={{ color: colour }}></div>
        </div>
    );
};
