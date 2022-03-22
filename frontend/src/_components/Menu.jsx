import React from 'react';

export function Menu({ onChange, items, selected }) {
  return (
    <div className="left-menu">
      <ul>
        {items &&
          items.map((item) => (
            <li key={item.id} onClick={() => onChange(item.id)} className={selected === item.id ? 'active' : ''}>
              {item.label}
            </li>
          ))}
      </ul>
    </div>
  );
}
