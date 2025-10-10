router.post('/bulk-insert', async (req, res) => {
  const { tableName, rows } = req.body; // rows = array of objects
  try {
    const columns = Object.keys(rows[0]).join(',');
    const values = rows.map(row => '(' + Object.values(row).map(v => `'${v}'`).join(',') + ')').join(',');
    const query = `INSERT INTO ${tableName} (${columns}) VALUES ${values}`;
    await db.query(query);
    res.status(200).json({ message: 'Bulk insert successful' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
