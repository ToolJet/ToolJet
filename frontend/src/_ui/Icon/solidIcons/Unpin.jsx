import React from 'react';

const Unpin = ({ width = '14' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="icon-tabler icon-tabler-pinned-off"
    width={width}
    height={width}
    viewBox="0 0 24 24"
    stroke-width="1.85"
    stroke="currentColor"
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
    <line x1="3" y1="3" x2="21" y2="21"></line>
    <path d="M15 4.5l-3.249 3.249m-2.57 1.433l-2.181 .818l-1.5 1.5l7 7l1.5 -1.5l.82 -2.186m1.43 -2.563l3.25 -3.251"></path>
    <line x1="9" y1="15" x2="4.5" y2="19.5"></line>
    <line x1="14.5" y1="4" x2="20" y2="9.5"></line>
  </svg>
);

export default Unpin;
