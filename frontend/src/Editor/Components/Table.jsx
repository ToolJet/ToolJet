import React, { useMemo, useState, useEffect } from "react";
import { 
	useTable, 
	useFilters, 
	useSortBy, 
	useGlobalFilter, 
	useAsyncDebounce,
	usePagination,
	useBlockLayout,
	useResizeColumns
} from "react-table";
import { resolve, resolve_references } from '@/_helpers/utils';
import Skeleton from 'react-loading-skeleton';
import SelectSearch, { fuzzySearch } from 'react-select-search';
import { useExportData } from "react-table-plugins";
import Papa from "papaparse";

var _ = require('lodash');

export function Table({ id, width, height, component, onComponentClick, currentState = { components: { } }, onEvent, paramUpdated, changeCanDrag, onComponentOptionChanged }) {

	const color = component.definition.styles.textColor.value;
	const actions = component.definition.properties.actions || { value: []};

	const [loadingState, setLoadingState] = useState(false);

    useEffect(() => {

		const loadingStateProperty = component.definition.properties.loadingState;
		if(loadingStateProperty && currentState) { 
			const newState = resolve_references(loadingStateProperty.value, currentState, false);
			setLoadingState(newState);
		}

    }, [currentState]);

	const [componentState, setcomponentState] = useState(currentState.components[component.component] || {});

	useEffect(() => {
		setcomponentState(currentState.components[component.name] || {})

    }, [currentState.components[component.name]]);

	const [isFiltersVisible, setFiltersVisibility] = useState(false);
	const [filters, setFilters] = useState([]);
	
	function showFilters() {
		setFiltersVisibility(true);
	}

	function hideFilters() {
		setFiltersVisibility(false);
	}

    function filterOptionChanged(index, option, value) {
		const newFilters = filters;
		newFilters[index][option] = value;
		setFilters(newFilters);

		for(const filter of newFilters) {
			setFilter(filter.field, filter.value); 
		}
	}

	function addFilter(){
		setFilters([
			...filters, 
			{ field: '', value: '' }
		]);
	}

	function removeFilter(index) {
		let newFilters = filters;
		newFilters.splice(index, 1);
		setFilters(newFilters);
	}

	const defaultColumn = React.useMemo(
		() => ({
		  minWidth: 30,
		  width: 268,
		  maxWidth: 400,
		}),
		[]
	)

	const columnSizes = component.definition.properties.columnSizes || {};

	function handleCellValueChange(index, key, value, rowData) {
		const changeSet = componentState.changeSet;
		const dataUpdates = componentState.dataUpdates || [];

		let obj = changeSet ? changeSet[index] : {};
		obj = _.set(obj, key, value);

		let newChangeset = {
			...changeSet,
			[index]: {
				...obj
			}
		}

		obj = _.set(rowData, key, value);

		let newDataUpdates = [
			...dataUpdates,
			{ ...obj }
		]
		onComponentOptionChanged(component, 'changeSet', newChangeset);
		onComponentOptionChanged(component, 'dataUpdates', newDataUpdates);
	}

	function getExportFileBlob({ columns, data, fileType, fileName }) {
		const headerNames = columns.map((col) => col.exportValue);
		const csvString = Papa.unparse({ fields: headerNames, data });
		return new Blob([csvString], { type: "text/csv" });
	}

	function handleChangesSaved() {
		Object.keys(changeSet).map(key => {
			tableData[key] = {
				..._.merge(tableData[key], changeSet[key])
			}
		});

		onComponentOptionChanged(component, 'changeSet', {});
		onComponentOptionChanged(component, 'dataUpdates', []);
	}

	function handleChangesDiscarded() {
		onComponentOptionChanged(component, 'changeSet', {});
		onComponentOptionChanged(component, 'dataUpdates', []);
	}

	const changeSet = componentState ? componentState.changeSet : {};

	const columnData = component.definition.properties.columns.value.map((column) => { 
		const columnSize = columnSizes[column.key] || columnSizes[column.name];
		const columnType = column.columnType;

		const columnOptions = {};
		if(columnType === 'dropdown') {
			const values = resolve_references(column.values, currentState) || [];
			const labels = resolve_references(column.labels, currentState, []) || [];

			if(typeof labels === "object") {
				columnOptions['selectOptions'] = labels.map((label, index) => {
					return { name: label, value: values[index]};
				});
			}
		}
		
    	return { Header: 
			column.name, 
			accessor: column.key || column.name, 
			width: columnSize ? columnSize : defaultColumn.width,

			Cell: function (cell) {
				const rowChangeSet = changeSet ? changeSet[cell.row.index] : null;
				const cellValue = rowChangeSet ? rowChangeSet[column.name] || cell.value : cell.value;

				if(columnType === undefined || columnType === 'default') {
					return cellValue || '';
				} else if(columnType === 'string') {
					if(column.isEditable) {
						return <input 
							type="text" 
							onKeyDown={(e) => { if(e.key === "Enter") { handleCellValueChange(cell.row.index, column.key || column.name, e.target.value, cell.row.original) }}}
							onBlur={ (e) => { handleCellValueChange(cell.row.index, column.key || column.name, e.target.value, cell.row.original) } }
							className="form-control-plaintext form-control-plaintext-sm" 
							defaultValue={cellValue} 
						/>;
					} else {
						return cellValue || '';
					}
				} else if(columnType === 'dropdown') {
					return <SelectSearch 
						options={columnOptions['selectOptions']}
						value={cellValue} 
						search={true}
						onChange={(value) => { handleCellValueChange(cell.row.index, column.key || column.name, value, cell.row.original) }}
						filterOptions={fuzzySearch}
						placeholder="Select.." 
                	/>
				} else {
					return cellValue || '';
				}
			}
		} 
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
		width: columnSizes['actions'] ||  defaultColumn.width,
		Cell: (cell) => {
			return actions.value.map((action) => 
				<button 
					className="btn btn-sm m-1 btn-light"
					style={{background: action.backgroundColor, color: action.textColor}}
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
		[columnData.length, actionsCellData.length, componentState.changeSet]
    );

	const data = useMemo(
		() =>
		tableData,
		[tableData.length]
	);

	const computedStyles = { 
        color,
		width: `${width}px`,
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
		state: { pageIndex, pageSize },
		exportData
    } = useTable( {
        columns,
        data,
		defaultColumn,
		initialState: { pageIndex: 0 },
		getExportFileBlob
    },
	useFilters,
	useGlobalFilter,
	useSortBy,
	usePagination,
	useBlockLayout,
	useResizeColumns,
	useExportData
	);
	
	useEffect(() => {
		if(!state.columnResizing.isResizingColumn) {
			changeCanDrag(true);
			paramUpdated(id, 'columnSizes', state.columnResizing.columnWidths);
		} else {
			changeCanDrag(false);
		}
	}, [state.columnResizing]);

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
		  <div className="ms-2 d-inline-block">
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

	function computeExportData() {
		debugger
	}

    return (
		<div className="card" style={{width: `${width + 16}px`, height: `${height+3}px`}} onClick={() => onComponentClick(id, component) }>
		<div className="card-body border-bottom py-3 jet-data-table-header">
		  <div className="d-flex">
			<div className="text-muted">
			  Show
			  <div className="mx-2 d-inline-block">
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
			<div className="ms-auto text-muted">
			  
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
		<div className="table-responsive jet-data-table">
		<table {...getTableProps()} className="table table-vcenter table-nowrap table-bordered" style={computedStyles}>
			<thead>
				{headerGroups.map(headerGroup => (
				<tr {...headerGroup.getHeaderGroupProps()} tabIndex="0" className="tr">
					{headerGroup.headers.map(column => (
					<th className="th"
						{...column.getHeaderProps(column.getSortByToggleProps())}
						className={
							column.isSorted
							  ? column.isSortedDesc
								? "sort-desc th"
								: "sort-asc th"
							  : "th"
						}
					>
						{column.render("Header")}
						<div draggable="true"
							{...column.getResizerProps()}
							className={`resizer ${
								column.isResizing ? 'isResizing' : ''
							}`}
						/>
					</th>
					))}
				</tr>
				))}
			</thead>
			{!loadingState && 
				<tbody {...getTableBodyProps()}>
					{console.log('page', page)}
					{page.map((row, i) => {
					prepareRow(row);
					return (
						<tr className="table-row" {...row.getRowProps()} onClick={(e) => { e.stopPropagation(); onEvent('onRowClicked',  { component, data: row.original }); }}>
						{row.cells.map(cell => {
							
							let cellProps = cell.getCellProps();

							if(componentState.changeSet) {
								if(componentState.changeSet[cell.row.index]) {
									if( _.get(componentState.changeSet[cell.row.index], cell.column.id, undefined )) {
										cellProps['style']['backgroundColor'] =  '#ffffde';
									}
								}
							}
							return <td {...cellProps}>{cell.render("Cell")}</td>;
						})}
						</tr>
					);
					})}
				</tbody>
			}
			</table>
			{loadingState && 
                <div style={{width: '100%'}} className="p-2">
                    <Skeleton count={5}/> 
                </div>
            }
		</div>
		<div className="card-footer d-flex align-items-center jet-table-footer">
			<div className="pagination row">
				<div className="pagination-buttons col">
					<button className="btn btn-sm btn-light" onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
					{'<<'}
					</button>{' '}
					<button className="btn btn-light btn-sm" onClick={() => previousPage()} disabled={!canPreviousPage}>
					{'<'}
					</button>{' '}
					<span className="p-1">
						Page{' '}
						<strong>
							{pageIndex + 1} of {pageOptions.length}
						</strong>{' '}
					</span>
					<button className="btn btn-light btn-sm"  onClick={() => nextPage()} disabled={!canNextPage}>
					{'>'}
					</button>{' '}
					<button className="btn btn-light btn-sm mr-5"  onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
					{'>>'}
					</button>{' '}
				</div>

				{Object.keys(componentState.changeSet || {}).length > 0 && 
					<div className="col">
						<button 
							className={`btn btn-primary btn-sm ${componentState.isSavingChanges ? 'btn-loading' : ''}`}
							onClick={(e) => onEvent('onBulkUpdate',  { component } ).then(() => {
								handleChangesSaved();
							})}
						>
							Save Changes
						</button>
						<button 
							className="btn btn-light btn-sm mx-2"
							onClick={(e) => handleChangesDiscarded()}
						>
							Cancel
						</button>
					</div>
				}

				{/* <div className="goto-page col-auto">
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
				</div> */}

				<div className="col-auto">
					<button className="btn btn-light btn-sm p-1 mx-2" onClick={() => showFilters()} >
						<img src="https://www.svgrepo.com/show/264090/filter.svg" width="13" height="13" />
					</button>
					<button className="btn btn-light btn-sm p-1" onClick={() => exportData("csv", true)} >
						<img src="https://www.svgrepo.com/show/27716/download.svg" width="13" height="13" />
					</button>
					
				</div>
			</div>
		</div>
			{isFiltersVisible &&
				<div className="table-filters card">
					<div class="card-header row">
						<div className="col">
							<h4 class="text-muted">Filters</h4>
						</div>
						<div className="col-auto">
							<button onClick={() => hideFilters()} className="btn btn-light btn-sm">x</button>
						</div>
					</div>
					<div className="card-body">
						{filters.map((filter, index) => 
							<div className="row mb-2" key={index}>
								<div className="col p-2" style={{maxWidth: '80px'}}>
									{index > 0 ? 'and' : 'where'}
								</div>
								<div className="col">
								<SelectSearch 
									options={columnData.map((column) => { return { name: column.Header, value: column.accessor } } )}
									value={filter.field} 
									search={true}
									onChange={(value) => { filterOptionChanged(index, 'field', value) }}
									filterOptions={fuzzySearch}
									placeholder="Select.." 
								/>
								</div>
								<div className="col" style={{maxWidth: '100px'}}>
									<input type="text" value="matches" disabled className="form-control"/>
								</div>
								<div className="col">
									<input 
										type="text" 
										value={filter.value}
										placeholder="value" 
										className="form-control" 
										onChange={(e) => filterOptionChanged(index, 'value', e.target.value)}
									/>
								</div>
								<div className="col-auto">
									<button 
										onClick={ () => removeFilter(index) }
										className="btn btn-light btn-sm p-2 text-danger"
									>
										x
									</button>
								</div>
							</div>
						)}
					</div>
					<div class="card-footer">
						<button onClick={addFilter} className="btn btn-light btn-sm text-muted">
							+ add filter
						</button>
						<button className="btn btn-light btn-sm mx-2 text-muted">
							clear filters
						</button>
					</div>
				</div>
			}
	  </div>
      );


}
