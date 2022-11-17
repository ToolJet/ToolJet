import React from 'react';
import { SortableList } from './SortableList';
import { DragHandle } from './components';

const SortableComponent = ({ data, Element, ...restProps }) => {
  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    setItems(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);

  return (
    <div style={{ maxWidth: 400, margin: '0' }}>
      <SortableList
        items={items}
        onChange={setItems}
        renderItem={(page) => (
          <SortableList.Item id={page.id} classNames={restProps.classNames}>
            <Element page={page} {...restProps} />
          </SortableList.Item>
        )}
      />
    </div>
  );
};

SortableComponent.DragHandle = DragHandle;

export default SortableComponent;
