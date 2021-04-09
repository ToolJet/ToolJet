import React, { useMemo, useState, useEffect } from "react";
import { 
	useTable, 
	useFilters, 
	useSortBy, 
	useGlobalFilter, 
	useAsyncDebounce,
	usePagination
} from "react-table";
import { resolve } from '@/_helpers/utils';
import Skeleton from 'react-loading-skeleton';

export function Table({ id, width, height, component, onComponentClick, currentState, onEvent }) {

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

	const actionsCellData = actions.value.length > 0 ? [{
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
	}] : [];


    const columns = useMemo(
		() =>
			[
				...columnData,
				...actionsCellData
			],
		[columnData.length, actionsCellData.length]
    );

	const data = useMemo(
		() =>
		tableData,
		[tableData.length]
	);

	const computedStyles = { 
        color,
		width: `${width}px`,
		height: `${height}px`
    }

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
		page,
		canPreviousPage,
		canNextPage,
		pageOptions,
		gotoPage,
		pageCount,
		nextPage,
		previousPage,
		setPageSize,
		state,
        prepareRow,
		setFilter,
		preGlobalFilteredRows,
    	setGlobalFilter,
		state: { pageIndex, pageSize }
    } = useTable( {
        columns,
        data,
		initialState: { pageIndex: 0 },
    },
	useFilters,
	useGlobalFilter,
	useSortBy,
	usePagination
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
		<div class="card" style={{width: `${width + 2}px`, height: `${height}px`}} onClick={() => onComponentClick(id, component) }>
		<div class="card-body border-bottom py-3 jet-data-table-header">
		  <div class="d-flex">
			<div class="text-muted">
			  Show
			  <div class="mx-2 d-inline-block">
				<select
					value={pageSize}
					className="form-control form-control-sm"
					onChange={e => {
						setPageSize(Number(e.target.value))
					}}
					>
					{[10, 20, 30, 40, 50].map(pageSize => (
						<option key={pageSize} value={pageSize}>
							{pageSize}
						</option>
					))}
				</select>
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
				{console.log('page', page)}
				{page.map((row, i) => {
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
		<div class="card-footer d-flex align-items-center jet-table-footer">
			<div className="pagination row">
				<div className="pagination-buttons col">
					<button className="btn btn-sm btn-light" onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
					{'<<'}
					</button>{' '}
					<button className="btn btn-light btn-sm" onClick={() => previousPage()} disabled={!canPreviousPage}>
					{'<'}
					</button>{' '}
					<button className="btn btn-light btn-sm"  onClick={() => nextPage()} disabled={!canNextPage}>
					{'>'}
					</button>{' '}
					<button className="btn btn-light btn-sm mr-5"  onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
					{'>>'}
					</button>{' '}
				</div>

				<div className="page-stats col-auto">
					<span className="p-1">
						Page{' '}
						<strong>
							{pageIndex + 1} of {pageOptions.length}
						</strong>{' '}
						</span>
				</div>
				
				<div className="goto-page col-auto">
					<div className="row">
						<div className="col">
							| Go to page:{' '}
						</div>
						<div className="col-auto">
						<input
							type="number"
							className="form-control form-control-sm"
							defaultValue={pageIndex + 1}
							onChange={e => {
							const page = e.target.value ? Number(e.target.value) - 1 : 0
							gotoPage(page)
							}}
							style={{ width: '50px' }}
						/>
						</div>
					</div>
				</div>
			</div>
		</div>
	  </div>
      );


}