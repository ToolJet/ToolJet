import React, { useMemo, useState, useEffect } from "react";
import { useTable, useFilters, useSortBy, useGlobalFilter, useAsyncDebounce } from "react-table";
import { resolve } from '@/_helpers/utils';
import Skeleton from 'react-loading-skeleton';

export function Table({ id, component, onComponentClick, currentState, onEvent }) {

	const backgroundColor = component.definition.styles.backgroundColor.value;
	const color = component.definition.styles.textColor.value;
	const actions = component.definition.properties.actions || { value: []};

	let loadingState = false;
	const loadingStateProperty = component.definition.properties.loadingState;
	if(loadingStateProperty && currentState) { 
		loadingState = resolve(loadingStateProperty.value, currentState);
	}

    const [filterInput, setFilterInput] = useState("");

	const handleFilterChange = e => {
		const value = e.target.value || undefined;
		setFilter("name", value); 
		setFilterInput(value);
	};
    
    const columnData = component.definition.properties.columns.value.map((column) => { 
      return { Header: column.name, accessor: column.key || column.name  } 
    })

    let tableData = []
    if(currentState) {
        tableData = resolve(component.definition.properties.data.value, currentState, []);
        console.log('resolved param', tableData);
    }

	tableData = tableData ? tableData : [];


    const columns = useMemo(
		() =>
			[
				...columnData,
				{
					id: 'actions',
					Header: 'Actions',
					accessor: 'edit',
					Cell: (cell) => {
						return actions.value.map((action) => 
							<button 
								className="btn btn-sm m-1 btn-light"
								onClick={(e) => { e.stopPropagation(); onEvent('onTableActionButtonClicked', { component, data: cell.row.original, action }); }}
							>
									{action.buttonText}
							</button>
						)
					}
				}
			],
		[]
    );

	const data = useMemo(
		() =>
		tableData,
		[tableData.length]
	);

	const computedStyles = { 
        backgroundColor,
        color,
		width: '700px'
    }

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
		state,
        prepareRow,
		setFilter,
		preGlobalFilteredRows,
    	setGlobalFilter,
    } = useTable( {
        columns,
        data
    },
	useFilters,
	useGlobalFilter,
	useSortBy
	);

	function GlobalFilter({
		preGlobalFilteredRows,
		globalFilter,
		setGlobalFilter,
	  }) {
		const count = preGlobalFilteredRows.length
		const [value, setValue] = React.useState(globalFilter)
		const onChange = useAsyncDebounce(value => {
		  setGlobalFilter(value || undefined)
		}, 200)
	  
		return (
		  <div class="ms-2 d-inline-block">
			Search:{' '}
			<input
			  value={value || ""}
			  onChange={e => {
				setValue(e.target.value);
				onChange(e.target.value);
			  }}
			  placeholder={`${count} records`}
			  style={{
				border: '0',
			  }}
			/>
		  </div>
		)
	  }


      return (
		<div class="card" style={{width: '702px'}} onClick={() => onComponentClick(id, component) }>
		<div class="card-body border-bottom py-3">
		  <div class="d-flex">
			<div class="text-muted">
			  Show
			  <div class="mx-2 d-inline-block">
				<input type="text" class="form-control form-control-sm" value="8" size="3" aria-label="Invoices count"/>
			  </div>
			  entries
			</div>
			<div class="ms-auto text-muted">
			  
				{/* <input
					className="form-control form-control-sm"
					value={filterInput}
					onChange={handleFilterChange}
					placeholder={"Search name"}
				/> */}
				<GlobalFilter
					preGlobalFilteredRows={preGlobalFilteredRows}
					globalFilter={state.globalFilter}
					setGlobalFilter={setGlobalFilter}
				/>
			</div>
		  </div>
		</div>
		<div class="table-responsive jet-data-table">
		<table {...getTableProps()} class="table table-vcenter table-nowrap table-bordered" style={computedStyles}>
			<thead>
				{headerGroups.map(headerGroup => (
				<tr {...headerGroup.getHeaderGroupProps()}>
					{headerGroup.headers.map(column => (
					<th 
						{...column.getHeaderProps(column.getSortByToggleProps())}
						className={
							column.isSorted
							  ? column.isSortedDesc
								? "sort-desc"
								: "sort-asc"
							  : ""
						}
					>
						{column.render("Header")}
					</th>
					))}
				</tr>
				))}
			</thead>
			<tbody {...getTableBodyProps()}>
				{rows.map((row, i) => {
				prepareRow(row);
				return (
					<tr {...row.getRowProps()} onClick={(e) => { e.stopPropagation(); onEvent('onRowClicked',  { component, data: row.original }); }}>
					{row.cells.map(cell => {
						return <td {...cell.getCellProps()}>{cell.render("Cell")}</td>;
					})}
					</tr>
				);
				})}
			</tbody>
			</table>
			{loadingState && 
                <div style={{width: '100%'}} className="p-5">
                    <Skeleton count={5}/> 
                </div>
            }
		</div>
		<div class="card-footer d-flex align-items-center">
			<p class="m-0 text-muted">
				Showing the first 10 results of {rows.length} rows 
			</p>
		  <ul class="pagination m-0 ms-auto">
			<li class="page-item disabled">
			  <a class="page-link" href="#" tabindex="-1" aria-disabled="true">
				<svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><polyline points="15 6 9 12 15 18"></polyline></svg>
				prev
			  </a>
			</li>
			<li class="page-item"><a class="page-link" href="#">1</a></li>
			<li class="page-item active"><a class="page-link" href="#">2</a></li>
			<li class="page-item"><a class="page-link" href="#">3</a></li>
			<li class="page-item"><a class="page-link" href="#">4</a></li>
			<li class="page-item"><a class="page-link" href="#">5</a></li>
			<li class="page-item">
			  <a class="page-link" href="#">
				<svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><polyline points="9 6 15 12 9 18"></polyline></svg>
			  </a>
			</li>
		  </ul>
		</div>
	  </div>
      );


}