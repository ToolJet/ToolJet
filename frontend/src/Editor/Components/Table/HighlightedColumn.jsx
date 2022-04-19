import React from 'react';
import { findAll } from 'highlight-words-core';

const getTextValue = (value) => {
  if (value) {
    if (typeof value === 'number') {
      return value.toString();
    }
  }
  return value;
};

export const HighlightedColumn = ({ value, term }) => {
  const textToHighlight = getTextValue(value) ?? '';
  const searchWords = term?.split(' ') ?? [];

  const chunks = findAll({
    searchWords,
    textToHighlight,
  });

  let column;

  if (chunks.length > 0) {
    column = chunks.map((chunk) => {
      const { end, highlight, start } = chunk;
      const text = textToHighlight.substr(start, end - start);
      if (highlight) {
        return <mark style={{ padding: '0' }}>{text}</mark>;
      } else {
        return <span>{text}</span>;
      }
    });
  } else {
    column = <span>{value}</span>;
  }

  return column;
};
