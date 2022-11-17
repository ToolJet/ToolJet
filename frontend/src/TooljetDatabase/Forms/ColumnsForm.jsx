import React from 'react';
// eslint-disable-next-line import/no-unresolved
import SortableList, { SortableItem } from 'react-easy-sort';
import Toggle from '@/_ui/Toggle';
import Select from 'react-select';

const CreateColumnsForm = ({ columns, setColumns }) => {
  const defaults = { 0: {} };
  const onSortEnd = (oldIndex, newIndex) => {
    const prevColumns = { ...columns };
    prevColumns[oldIndex] = columns[newIndex];
    prevColumns[newIndex] = columns[oldIndex];
    setColumns(prevColumns);
  };
  const types = [
    { value: 'varchar', label: 'varchar' },
    { value: 'int', label: 'int' },
    { value: 'float', label: 'float' },
    { value: 'boolean', label: 'boolean' },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Add columns</h3>
      </div>
      <SortableList onSortEnd={onSortEnd} className="list-group list-group-flush" draggedItemClassName="dragged-column">
        {Object.keys(columns).map((index) => (
          <SortableItem key={index}>
            <div className="list-group-item bg-gray">
              <div className="row align-items-center">
                <div className="col-1">
                  <svg width="12" height="5" viewBox="0 0 12 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M1.51237 1.96688C1.32348 1.96688 1.16515 1.90299 1.03737 1.77521C0.909592 1.64743 0.845703 1.4891 0.845703 1.30021C0.845703 1.11132 0.909592 0.95299 1.03737 0.825212C1.16515 0.697434 1.32348 0.633545 1.51237 0.633545H11.179C11.3679 0.633545 11.5263 0.700212 11.654 0.833545C11.7818 0.966878 11.8457 1.12799 11.8457 1.31688C11.8457 1.49466 11.7818 1.64743 11.654 1.77521C11.5263 1.90299 11.3679 1.96688 11.179 1.96688H1.51237ZM1.51237 4.28355C1.32348 4.28355 1.16515 4.21966 1.03737 4.09188C0.909592 3.9641 0.845703 3.80577 0.845703 3.61688C0.845703 3.4391 0.909592 3.28632 1.03737 3.15855C1.16515 3.03077 1.32348 2.96688 1.51237 2.96688H11.179C11.3679 2.96688 11.5263 3.03077 11.654 3.15855C11.7818 3.28632 11.8457 3.44466 11.8457 3.63354C11.8457 3.82243 11.7818 3.97799 11.654 4.10021C11.5263 4.22243 11.3679 4.28355 11.179 4.28355H1.51237Z"
                      fill="#CFD5E0"
                    />
                  </svg>
                </div>
                <div className="col-4 m-0 p-0">
                  <input
                    onChange={(e) =>
                      setColumns((prevColumns) => {
                        prevColumns[index].column_name = e.target.value;
                        return prevColumns;
                      })
                    }
                    value={columns[index].column_name}
                    type="text"
                    className="form-control"
                    placeholder={index}
                  />
                </div>
                <div className="col-4 m-0 p-0">
                  <Select
                    options={types}
                    value={types.find((type) => type.value === columns[index].data_type)}
                    onChange={({ value }) => {
                      setColumns((prevColumns) => {
                        prevColumns[index].data_type = value;
                        return prevColumns;
                      });
                    }}
                  />
                </div>
                <div className="col-2">
                  <Toggle />
                </div>
                <div className="col-1">
                  <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M4.21605 0.883688C4.46609 0.63364 4.80523 0.493164 5.15885 0.493164H7.82552C8.17914 0.493164 8.51828 0.63364 8.76833 0.883688C9.01838 1.13374 9.15885 1.47288 9.15885 1.8265V3.15983H11.1511C11.1557 3.15978 11.1605 3.15978 11.1652 3.15983H11.8255C12.1937 3.15983 12.4922 3.45831 12.4922 3.8265C12.4922 4.19469 12.1937 4.49316 11.8255 4.49316H11.7723L11.1586 11.857C11.1507 12.3764 10.9409 12.8728 10.5731 13.2407C10.198 13.6158 9.68929 13.8265 9.15885 13.8265H3.82552C3.29509 13.8265 2.78638 13.6158 2.41131 13.2407C2.04343 12.8728 1.83367 12.3764 1.82575 11.857L1.2121 4.49316H1.15885C0.790664 4.49316 0.492188 4.19469 0.492188 3.8265C0.492188 3.45831 0.790664 3.15983 1.15885 3.15983H1.81921C1.82392 3.15978 1.82863 3.15978 1.83332 3.15983H3.82552V1.8265C3.82552 1.47288 3.966 1.13374 4.21605 0.883688ZM2.55005 4.49316L3.15655 11.7711C3.15809 11.7895 3.15885 11.808 3.15885 11.8265C3.15885 12.0033 3.22909 12.1729 3.35412 12.2979C3.47914 12.4229 3.64871 12.4932 3.82552 12.4932H9.15885C9.33566 12.4932 9.50523 12.4229 9.63026 12.2979C9.75528 12.1729 9.82552 12.0033 9.82552 11.8265C9.82552 11.808 9.82629 11.7895 9.82782 11.7711L10.4343 4.49316H2.55005ZM7.82552 3.15983H5.15885V1.8265H7.82552V3.15983ZM4.68745 7.63124C4.4271 7.37089 4.4271 6.94878 4.68745 6.68843C4.9478 6.42808 5.36991 6.42808 5.63026 6.68843L6.49219 7.55036L7.35412 6.68843C7.61447 6.42808 8.03658 6.42808 8.29693 6.68843C8.55728 6.94878 8.55728 7.37089 8.29693 7.63124L7.435 8.49316L8.29693 9.35509C8.55728 9.61544 8.55728 10.0376 8.29693 10.2979C8.03658 10.5583 7.61447 10.5583 7.35412 10.2979L6.49219 9.43597L5.63026 10.2979C5.36991 10.5583 4.9478 10.5583 4.68745 10.2979C4.4271 10.0376 4.4271 9.61544 4.68745 9.35509L5.54938 8.49316L4.68745 7.63124Z"
                      fill="#E54D2E"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </SortableItem>
        ))}
      </SortableList>
      <div
        onClick={() => setColumns((prevColumns) => ({ ...prevColumns, [Object.keys(prevColumns).length]: defaults }))}
        className="mt-2 btn no-border card-footer"
        style={{ backgroundColor: '#F0F4FF', color: '#3E63DD', fontWeight: 500, fontSize: 12, borderRadius: 6 }}
      >
        <svg width="15" height="14" viewBox="0 0 15 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0.488156 0.98132C0.800716 0.668759 1.22464 0.493164 1.66667 0.493164H13.3333C13.7754 0.493164 14.1993 0.668759 14.5118 0.98132C14.8244 1.29388 15 1.7178 15 2.15983V5.49316C15 5.93519 14.8244 6.35911 14.5118 6.67167C14.1993 6.98424 13.7754 7.15983 13.3333 7.15983H1.66667C1.22464 7.15983 0.800716 6.98424 0.488156 6.67167C0.175595 6.35912 0 5.93519 0 5.49316V2.15983C0 1.7178 0.175595 1.29388 0.488156 0.98132ZM13.3333 2.15983H1.66667L1.66667 5.49316H13.3333V2.15983ZM7.5 8.8265C7.96024 8.8265 8.33333 9.19959 8.33333 9.65983V10.4932H9.16667C9.6269 10.4932 10 10.8663 10 11.3265C10 11.7867 9.6269 12.1598 9.16667 12.1598H8.33333V12.9932C8.33333 13.4534 7.96024 13.8265 7.5 13.8265C7.03976 13.8265 6.66667 13.4534 6.66667 12.9932V12.1598H5.83333C5.3731 12.1598 5 11.7867 5 11.3265C5 10.8663 5.3731 10.4932 5.83333 10.4932H6.66667V9.65983C6.66667 9.19959 7.03976 8.8265 7.5 8.8265Z"
            fill="#3E63DD"
          />
        </svg>
        &nbsp;&nbsp; Add more columns
      </div>
    </div>
  );
};

export default CreateColumnsForm;
