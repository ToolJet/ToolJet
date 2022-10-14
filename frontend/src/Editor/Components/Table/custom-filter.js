export default function customFilter(rows, columnIds, filterValue) {
  try {
    if (filterValue.operation === 'equals') {
      return rows.filter((row) => row.values[columnIds[0]].toString() === filterValue.value);
    }

    if (filterValue.operation === 'ne') {
      return rows.filter((row) => row.values[columnIds[0]].toString() !== filterValue.value);
    }

    if (filterValue.operation === 'matches') {
      return rows.filter((row) =>
        row.values[columnIds[0]].toString().toLowerCase().includes(filterValue.value.toLowerCase())
      );
    }

    if (filterValue.operation === 'nl') {
      return rows.filter(
        (row) => !row.values[columnIds[0]].toString().toLowerCase().includes(filterValue.value.toLowerCase())
      );
    }

    if (filterValue.operation === 'gt') {
      return rows.filter((row) => row.values[columnIds[0]] > filterValue.value);
    }

    if (filterValue.operation === 'lt') {
      return rows.filter((row) => row.values[columnIds[0]] < filterValue.value);
    }

    if (filterValue.operation === 'gte') {
      return rows.filter((row) => row.values[columnIds[0]] >= filterValue.value);
    }

    if (filterValue.operation === 'lte') {
      return rows.filter((row) => row.values[columnIds[0]] <= filterValue.value);
    }
    if (filterValue.operation === 'doesNotContains') {
      return rows.filter(
        (row) => !row.values[columnIds[0]].toString().toLowerCase().includes(filterValue.value.toLowerCase())
      );
    }
    if (filterValue.operation === 'isEmpty') {
      return rows.filter((row) => {
        if (!row.values[columnIds[0]]) {
          return row;
        }
      });
    }
    if (filterValue.operation === 'isNotEmpty') {
      return rows.filter((row) => {
        if (row.values[columnIds[0]]) {
          return row;
        }
      });
    }
    if (filterValue.operation === 'contains') {
      return rows.filter((row) =>
        row.values[columnIds[0]].toString().toLowerCase().includes(filterValue.value.toLowerCase())
      );
    }

    let value = filterValue.value;
    if (typeof value === 'string') {
      value = value.toLowerCase();
    }

    return rows.filter((row) => {
      let rowValue = row.values[columnIds[0]];
      if (typeof rowValue === 'string') {
        rowValue = rowValue.toLowerCase();
      }
      return rowValue.includes(value);
    });
  } catch {
    return rows;
  }
}
