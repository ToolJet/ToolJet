export default function customFilter(rows, columnIds, filterValue) {
  try {
    if (filterValue?.value?.length !== 0 && filterValue?.condition?.length !== 0 && filterValue?.column?.length !== 0) {
      if (filterValue?.condition === 'equals') {
        return rows?.filter((row) => row?.values?.[columnIds[0]]?.toString() === filterValue?.value);
      }
      if (filterValue?.condition === 'ne') {
        return rows?.filter((row) => row?.values?.[columnIds[0]]?.toString() !== filterValue?.value);
      }

      if (filterValue?.condition === 'matches') {
        return rows?.filter((row) => row?.values?.[columnIds[0]]?.toString() === filterValue?.value);
      }

      if (filterValue?.condition === 'nl') {
        return rows?.filter((row) => row?.values[columnIds[0]]?.toString() !== filterValue?.value);
      }

      if (filterValue?.condition === 'gt') {
        return rows?.filter((row) => row?.values?.[columnIds[0]] > filterValue?.value);
      }

      if (filterValue?.condition === 'lt') {
        return rows?.filter((row) => row?.values?.[columnIds[0]] < filterValue?.value);
      }

      if (filterValue?.condition === 'gte') {
        return rows?.filter((row) => row?.values?.[columnIds[0]] >= filterValue?.value);
      }

      if (filterValue?.condition === 'lte') {
        return rows?.filter((row) => row?.values?.[columnIds[0]] <= filterValue?.value);
      }
      if (filterValue?.condition === 'doesNotContains') {
        return rows?.filter(
          (row) => !row?.values?.[columnIds[0]]?.toString()?.toLowerCase()?.includes(filterValue?.value?.toLowerCase())
        );
      }

      if (filterValue?.condition === 'contains') {
        return rows?.filter((row) => {
          return row?.values?.[columnIds[0]]?.toString()?.toLowerCase()?.includes(filterValue?.value?.toLowerCase());
        });
      }
    } else if (
      (filterValue?.condition === 'isEmpty' || filterValue?.condition === 'isNotEmpty') &&
      filterValue?.condition?.length !== 0 &&
      filterValue?.column?.length !== 0
    ) {
      if (filterValue?.condition === 'isEmpty') {
        return rows?.filter((row) => {
          if (!row?.values?.[columnIds[0]]) {
            return row;
          }
        });
      }
      if (filterValue?.condition === 'isNotEmpty') {
        return rows?.filter((row) => {
          if (row?.values?.[columnIds[0]]) {
            return row;
          }
        });
      }
    }
    let value = filterValue?.value;
    if (typeof value === 'string') {
      value = value?.toLowerCase();
    }

    return rows?.filter((row) => {
      let rowValue = row?.values?.[columnIds[0]];
      if (typeof rowValue === 'string') {
        rowValue = rowValue?.toLowerCase();
      }
      return rowValue?.includes(value);
    });
  } catch {
    return rows;
  }
}
