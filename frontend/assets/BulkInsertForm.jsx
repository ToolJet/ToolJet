import React, { useState } from 'react';
import axios from 'axios';

const BulkInsertForm = () => {
  const [table, setTable] = useState('');
  const [rows, setRows] = useState('');

  const handleSubmit = async () => {
    const parsedRows = JSON.parse(rows); // expect JSON array
    await axios.post('/api/mysql/bulk-insert', { tableName: table, rows: parsedRows });
    alert('Bulk insert completed!');
  };

  return (
    <div>
      <input placeholder="Table Name" value={table} onChange={e => setTable(e.target.value)} />
      <textarea placeholder='JSON array of rows' value={rows} onChange={e => setRows(e.target.value)} />
      <button onClick={handleSubmit}>Bulk Insert</button>
    </div>
  );
};

export default BulkInsertForm;
