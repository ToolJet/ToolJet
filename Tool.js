const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const app = express();
const port = 3000;

// Open an SQLite database (you can create a new database file using an SQLite client)
const database = open({
  filename: './mydatabase.db',
  driver: sqlite3.Database,
});

app.use(express.json());

// Create a new table (you can expand this with more fields as needed)
database.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY,
    name TEXT
  );
`);

// Create a new item
app.post('/items', async (req, res) => {
  const { name } = req.body;
  const result = await database.run(`INSERT INTO items (name) VALUES (?)`, [name]);
  res.json({ id: result.lastID });
});

// Get all items
app.get('/items', async (req, res) => {
  const items = await database.all('SELECT * FROM items');
  res.json(items);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
