import React from 'react';
import BigInt from './Icons/Biginteger.svg';
import Float from './Icons/Float.svg';
import Integer from './Icons/Integer.svg';
import CharacterVar from './Icons/Text.svg';
import Boolean from './Icons/Toggle.svg';

export const dataTypes = [
  {
    name: 'Varying character strings',
    label: 'varchar',
    icon: <CharacterVar width="16" height="16" />,
    value: 'character varying',
  },
  { name: 'Integers up to 4 bytes', label: 'int', icon: <Integer width="16" height="16" />, value: 'integer' },
  { name: 'Integers up to 8 bytes', label: 'bigint', icon: <BigInt width="16" height="16" />, value: 'bigint' },
  { name: 'Decimal numbers', label: 'float', icon: <Float width="16" height="16" />, value: 'double precision' },
  { name: 'Boolean True/False', label: 'boolean', icon: <Boolean width="16" height="16" />, value: 'boolean' },
];

export const primaryKeydataTypes = [{ value: 'serial', label: 'serial' }];
export const operators = [
  { value: 'in', label: 'in' },
  { value: 'is', label: 'is' },
];

export const formatOptionLabel = ({ label, icon }) => {
  return (
    <div>
      <span style={{ marginRight: '4px' }}>{icon}</span>
      {label}
    </div>
  );
};
