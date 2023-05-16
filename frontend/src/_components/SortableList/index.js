import React from 'react';
import { SortableList } from './SortableList';
import { DragHandle } from './components';

const SortableComponent = ({ data, Element, ...restProps }) => {
  const { onSort } = restProps;

  const [items, setItems] = React.useState([]);

  React.useEffect(() => {
    setItems(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)]);

  //function to check if the item in items array has changed position with respect to the original data
  const didItemChangePosition = (originalArr, sortedArry) => {
    return originalArr.some((item, index) => {
      return item.id !== sortedArry[index].id;
    });
  };

  React.useEffect(() => {
    if (items.length > 0 && didItemChangePosition(data, items)) {
      console.log('items changed ==>');
      onSort(items);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

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
        isVersionReleased={restProps.isVersionReleased}
        setReleasedVersionPopupState={restProps.setReleasedVersionPopupState}
      />
    </div>
  );
};

SortableComponent.DragHandle = DragHandle;

export default SortableComponent;
