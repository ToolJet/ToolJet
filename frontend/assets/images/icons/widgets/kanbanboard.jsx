import React from 'react';

const Kanbanboard = ({ fill = '#D7DBDF', width = 24, className = '', viewBox = '0 0 49 48' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="44"
    height="44"
    fill="none"
    stroke="#597e8d"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.5"
    className="icon icon-tabler icon-tabler-layout-board-split"
    viewBox="0 0 24 24"
  >
    <path stroke="none" d="M0 0h24v24H0z"></path>
    <rect width="16" height="16" x="4" y="4" rx="2"></rect>
    <path d="M4 12h8M12 15h8M12 9h8M12 4v16"></path>
  </svg>
);

export default Kanbanboard;
