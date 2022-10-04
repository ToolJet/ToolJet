import React from 'react';
// eslint-disable-next-line import/no-unresolved
import SortableList, { SortableItem } from 'react-easy-sort';
import arrayMove from 'array-move';
import Toggle from '@/_ui/Toggle';
import Select from 'react-select';

const CreateColumnsForm = () => {
  const [items, setItems] = React.useState([1, 2]);
  const onSortEnd = (oldIndex, newIndex) => {
    setItems((array) => arrayMove(array, oldIndex, newIndex));
  };
  const types = [
    { value: 'varchar', label: 'varchar' },
    { value: 'int', label: 'int' },
    { value: 'float', label: 'float' },
    { value: 'boolean', label: 'boolean' },
  ];

  const handleTypeChange = () => { };
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Add columns</h3>
      </div>
      <SortableList onSortEnd={onSortEnd} className="list-group list-group-flush" draggedItemClassName="dragged-column">
        {items.map((item) => (
          <SortableItem key={item}>
            <div className="list-group-item bg-gray">
              <div className="row align-items-center">
                <div className="col-auto">
                  <svg width="12" height="5" viewBox="0 0 12 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M1.51237 1.96688C1.32348 1.96688 1.16515 1.90299 1.03737 1.77521C0.909592 1.64743 0.845703 1.4891 0.845703 1.30021C0.845703 1.11132 0.909592 0.95299 1.03737 0.825212C1.16515 0.697434 1.32348 0.633545 1.51237 0.633545H11.179C11.3679 0.633545 11.5263 0.700212 11.654 0.833545C11.7818 0.966878 11.8457 1.12799 11.8457 1.31688C11.8457 1.49466 11.7818 1.64743 11.654 1.77521C11.5263 1.90299 11.3679 1.96688 11.179 1.96688H1.51237ZM1.51237 4.28355C1.32348 4.28355 1.16515 4.21966 1.03737 4.09188C0.909592 3.9641 0.845703 3.80577 0.845703 3.61688C0.845703 3.4391 0.909592 3.28632 1.03737 3.15855C1.16515 3.03077 1.32348 2.96688 1.51237 2.96688H11.179C11.3679 2.96688 11.5263 3.03077 11.654 3.15855C11.7818 3.28632 11.8457 3.44466 11.8457 3.63354C11.8457 3.82243 11.7818 3.97799 11.654 4.10021C11.5263 4.22243 11.3679 4.28355 11.179 4.28355H1.51237Z"
                      fill="#CFD5E0"
                    />
                  </svg>
                </div>
                <div className="col-auto m-0 p-0">
                  <input type="text" className="form-control" placeholder={item} />
                </div>
                <div className="col-auto m-0 p-0">
                  <Select options={types} onChange={handleTypeChange} />
                </div>
                <div className="col-auto">
                  <Toggle />
                </div>
                <div className="col-auto">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M2.61235 12.7C2.25679 12.7 1.94846 12.5695 1.68735 12.3084C1.42623 12.0473 1.29568 11.7389 1.29568 11.3834V2.05005H1.11235C0.923456 2.05005 0.765123 1.98616 0.637345 1.85838C0.509568 1.7306 0.445679 1.57227 0.445679 1.38338C0.445679 1.19449 0.509568 1.03616 0.637345 0.908382C0.765123 0.780604 0.923456 0.716716 1.11235 0.716716H3.99568C3.99568 0.527827 4.05957 0.369493 4.18735 0.241715C4.31512 0.113938 4.47346 0.0500488 4.66235 0.0500488H8.02901C8.2179 0.0500488 8.37901 0.116715 8.51235 0.250049C8.64568 0.383382 8.71234 0.538938 8.71234 0.716716H11.579C11.7679 0.716716 11.9262 0.780604 12.054 0.908382C12.1818 1.03616 12.2457 1.19449 12.2457 1.38338C12.2457 1.57227 12.1818 1.7306 12.054 1.85838C11.9262 1.98616 11.7679 2.05005 11.579 2.05005H11.3957V11.3834C11.3957 11.7389 11.2651 12.0473 11.004 12.3084C10.7429 12.5695 10.4346 12.7 10.079 12.7H2.61235ZM2.61235 2.05005V11.3834H10.079V2.05005H2.61235ZM4.34568 9.45005C4.34568 9.60561 4.40123 9.73894 4.51234 9.85005C4.62346 9.96116 4.75679 10.0167 4.91235 10.0167C5.07901 10.0167 5.2179 9.96116 5.32901 9.85005C5.44012 9.73894 5.49568 9.60561 5.49568 9.45005V3.96672C5.49568 3.80005 5.43734 3.65838 5.32068 3.54172C5.20401 3.42505 5.0679 3.36672 4.91235 3.36672C4.74568 3.36672 4.60957 3.42505 4.50401 3.54172C4.39846 3.65838 4.34568 3.80005 4.34568 3.96672V9.45005ZM7.19568 9.45005C7.19568 9.60561 7.25401 9.73894 7.37068 9.85005C7.48735 9.96116 7.62346 10.0167 7.77901 10.0167C7.94568 10.0167 8.08457 9.96116 8.19568 9.85005C8.30679 9.73894 8.36234 9.60561 8.36234 9.45005V3.96672C8.36234 3.80005 8.30401 3.65838 8.18734 3.54172C8.07068 3.42505 7.93457 3.36672 7.77901 3.36672C7.61234 3.36672 7.47346 3.42505 7.36234 3.54172C7.25123 3.65838 7.19568 3.80005 7.19568 3.96672V9.45005ZM2.61235 2.05005V11.3834V2.05005Z"
                      fill="#D1D5DB"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </SortableItem>
        ))}
      </SortableList>
    </div>
  );
};

export default CreateColumnsForm;
