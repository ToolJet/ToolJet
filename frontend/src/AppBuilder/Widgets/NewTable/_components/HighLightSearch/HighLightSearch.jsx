import React from 'react';

export const HighLightSearch = React.memo(({ text, searchTerm }) => {
  if (text === '') return null;

  if (searchTerm == null || searchTerm === '' || !text.toString()?.toLowerCase().includes(searchTerm?.toLowerCase()))
    return <span>{text}</span>;

  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = String(text).split(new RegExp(`(${escapedSearchTerm})`, 'gi'));

  return (
    <span>
      {parts.map((part, index) =>
        part?.toLowerCase() === searchTerm?.toLowerCase() ? (
          <span key={index}>
            <mark>{part}</mark>
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
});
