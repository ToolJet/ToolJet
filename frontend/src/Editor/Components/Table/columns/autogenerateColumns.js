import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';

export default function autogenerateColumns(tableData, existingColumns, setProperty) {
  const [keysAndValues] = tableData.slice(0, 1).map(Object.entries);
  const keys = keysAndValues?.map(([key, _value]) => key) ?? [];
  const keysAndDataTypes = keysAndValues?.map(([key, value]) => [key, typeof value]) ?? [];
  const generatedColumns = keysAndDataTypes.map(([key, dataType]) => ({
    id: uuidv4(),
    name: key,
    columnType: dataType,
  }));
  const newColumns = _.uniqBy([...existingColumns, ...generatedColumns], 'name').filter((column) =>
    keys.includes(column.name)
  );
  setProperty('columns', newColumns);

  // console.log({ keysAndValues, keysAndDataTypes, generatedColumns, existingColumns, newColumns, keys });
}
