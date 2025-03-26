import React from 'react';
import { components } from 'react-select';
import * as Icons from '@tabler/icons-react';
const { ValueContainer, Placeholder } = components;
import './multiselectV2.scss';
import useStore from '@/AppBuilder/_stores/store';

const CustomValueContainer = ({ ...props }) => {
  const selectProps = props.selectProps;
  const values = Array.isArray(selectProps?.value) && selectProps?.value?.map((option) => option.label);
  const isAllOptionsSelected = selectProps?.value.length === selectProps.options.length;
  const valueContainerWidth = selectProps?.containerRef?.current?.offsetWidth;
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[selectProps?.icon] == undefined ? Icons['IconHome2'] : Icons[selectProps?.icon];
  const currentMode = useStore((state) => state.currentMode);
  const currentLayout = useStore((state) => state.currentLayout);

  React.useEffect(() => {
    if (currentMode !== 'edit' && currentLayout === 'mobile') {
      const observer = new ResizeObserver(() => {
        document.querySelector('.valueContainer').style.maxWidth =
          selectProps?.containerRef?.current?.offsetWidth + 'px';
      });
      observer.observe(selectProps?.containerRef?.current);
      return () => observer.disconnect();
    }
  }, []);

  return (
    <ValueContainer {...props}>
      <div className="w-full">
        <span
          ref={selectProps.containerRef}
          className="d-flex w-full align-items-center"
          style={{ marginBottom: '2px' }}
        >
          {selectProps?.doShowIcon && (
            <IconElement
              style={{
                width: '16px',
                height: '16px',
                color: selectProps?.iconColor,
                marginRight: '4px',
              }}
            />
          )}
          {!props.hasValue ? (
            <Placeholder {...props} key="placeholder" {...selectProps} data={selectProps?.visibleValues}>
              {selectProps.placeholder}
            </Placeholder>
          ) : (
            <span
              className="text-truncate valueContainer"
              {...props}
              id="options"
              style={{ maxWidth: valueContainerWidth }}
            >
              {isAllOptionsSelected ? 'All items are selected.' : values.join(', ')}
            </span>
          )}
        </span>
      </div>
    </ValueContainer>
  );
};

export default CustomValueContainer;
