// ---- 1. Hardcoded data (12 rows) ----
const allRows = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
  { id: 3, name: "Carol" },
  { id: 4, name: "Dave" },
  { id: 5, name: "Eve" },
  { id: 6, name: "Frank" },
  { id: 7, name: "Grace" },
  { id: 8, name: "Heidi" },
  { id: 9, name: "Ivan" },
  { id: 10, name: "Judy" },
  { id: 11, name: "Mallory" },
  { id: 12, name: "Niaj" },
];

// ---- 2. Read the table's current state ----
const table = components.table1;
const pageSize = 5;
const currentPage = table.pageIndex || 1;
const search = (table.searchText || "").toLowerCase();
const sort = table.sortApplied?.[0];   // { column, direction: "asc" | "desc" }
const filter = table.filters?.[0];     // { column, condition, value }

let rows = allRows;

// ---- 3. Search (matches the name) ----
if (search) {
  rows = rows.filter((row) => row.name.toLowerCase().includes(search));
}

// ---- 4. Filter ("contains" only, to keep it simple) ----
if (filter && filter.value) {
  const value = String(filter.value).toLowerCase();
  rows = rows.filter((row) => String(row[filter.column]).toLowerCase().includes(value));
}

// ---- 5. Sort ----
if (sort && sort.column) {
  rows = [...rows].sort((a, b) => {
    const result = a[sort.column] > b[sort.column] ? 1 : a[sort.column] < b[sort.column] ? -1 : 0;
    return sort.direction === "desc" ? -result : result;
  });
}

// ---- 6. Paginate ----
const start = (currentPage - 1) * pageSize;
return {
  rows: rows.slice(start, start + pageSize),
  total: rows.length,
};
