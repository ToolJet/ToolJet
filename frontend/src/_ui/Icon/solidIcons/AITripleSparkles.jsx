import React from 'react';

const AITripleSparkles = ({ width = '16', height = '16', className = '', viewBox = '0 0 16 16' }) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox={viewBox}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path d="M5.6 2L6.9 5.1L10 6.4L6.9 7.7L5.6 10.8L4.3 7.7L1.2 6.4L4.3 5.1L5.6 2Z" fill="#F3A53C" />
            <path d="M11.7 1.2L12.4 2.9L14.1 3.6L12.4 4.3L11.7 6L11 4.3L9.3 3.6L11 2.9L11.7 1.2Z" fill="#F1C58F" />
            <path d="M11 8.3L11.7 10L13.4 10.7L11.7 11.4L11 13.1L10.3 11.4L8.6 10.7L10.3 10L11 8.3Z" fill="#F1C58F" />
        </svg>
    );
};

export default AITripleSparkles;
