import React, { Component } from 'react';

import Paper from '@material-ui/core/Paper';
import Box from '@material-ui/core/Box';

import jss from 'jss';

import { cars } from './data';

import 'devextreme/dist/css/dx.common.css';
import 'devextreme/dist/css/dx.light.css';

import DataGrid, { Column, FilterRow, HeaderFilter, SearchPanel, Scrolling, Paging } from 'devextreme-react/data-grid';
import { SelectBox, CheckBox } from 'devextreme-react';

import service from './data.js';

const saleAmountEditorOptions = { format: 'currency', showClearButton: true };

const colors = ["red", "green", "blue", "blue", "blue", "blue", "blue", "blue", "blue", "blue"];

class App extends React.Component {
	constructor(props) {
		super(props);
		this.orders = service.getOrders();
		this.applyFilterTypes = [{
			key: 'auto',
			name: 'Immediately'
		}, {
			key: 'onClick',
			name: 'On Button Click'
		}];
		this.saleAmountHeaderFilter = [{
			text: 'Less than $3000',
			value: ['SaleAmount', '<', 3000]
		}, {
			text: '$3000 - $5000',
			value: [
				['SaleAmount', '>=', 3000],
				['SaleAmount', '<', 5000]
			]
		}, {
			text: '$5000 - $10000',
			value: [
				['SaleAmount', '>=', 5000],
				['SaleAmount', '<', 10000]
			]
		}, {
			text: '$10000 - $20000',
			value: [
				['SaleAmount', '>=', 10000],
				['SaleAmount', '<', 20000]
			]
		}, {
			text: 'Greater than $20000',
			value: ['SaleAmount', '>=', 20000]
		}];
		this.state = {
			showFilterRow: true,
			showHeaderFilter: true,
			currentFilter: this.applyFilterTypes[0].key
		};
		this.dataGrid = null;
		this.orderHeaderFilter = this.orderHeaderFilter.bind(this);
		this.onShowFilterRowChanged = this.onShowFilterRowChanged.bind(this);
		this.onShowHeaderFilterChanged = this.onShowHeaderFilterChanged.bind(this);
		this.onCurrentFilterChanged = this.onCurrentFilterChanged.bind(this);
	}
	
	render() {
		return (
			<Box p={2}>
				<Paper>
					<DataGrid
						onRowDblClick={console.log}
						allowColumnResizing
						columnResizingMode="widget"
						showBorders
						// rowComponent={Row}
						columnWidth={100}
						id="gridContainer"
						ref={(ref) => this.dataGrid = ref}
						dataSource={this.orders}
						onRowPrepared={(dat) => {
							console.log(dat);
							if (dat.rowType === "data") {
								dat.rowElement.style = `background: ${colors[dat.data.ID] || 'red'};`;
							}
						}}
					>
						<FilterRow visible={this.state.showFilterRow} applyFilter={this.state.currentFilter} />
						<HeaderFilter visible={this.state.showHeaderFilter} />
						<SearchPanel visible={true} width={240} placeholder="Search..." />
						{<Scrolling mode="virtual" />}
						<Paging enabled={false} />
						<Column dataField="OrderNumber" width={140} caption="Invoice Number">
							<HeaderFilter groupInterval={10000} />
						</Column>
						<Column dataField="OrderDate" alignment="right" dataType="date" width={120} calculateFilterExpression={this.calculateFilterExpression}>
							<HeaderFilter dataSource={this.orderHeaderFilter} />
						</Column>
						<Column dataField="DeliveryDate" alignment="right" dataType="datetime" format="M/d/yyyy, HH:mm" width={180} />
						<Column dataField="SaleAmount" alignment="right" dataType="number" format="currency" editorOptions={saleAmountEditorOptions}>
							<HeaderFilter dataSource={this.saleAmountHeaderFilter} />
						</Column>
						<Column dataField="SaleAmount" alignment="right" dataType="number" format="currency" editorOptions={saleAmountEditorOptions}>
							<HeaderFilter dataSource={this.saleAmountHeaderFilter} />
						</Column>
						<Column dataField="SaleAmount" alignment="right" dataType="number" format="currency" editorOptions={saleAmountEditorOptions}>
							<HeaderFilter dataSource={this.saleAmountHeaderFilter} />
						</Column>
						<Column dataField="SaleAmount" alignment="right" dataType="number" format="currency" editorOptions={saleAmountEditorOptions}>
							<HeaderFilter dataSource={this.saleAmountHeaderFilter} />
						</Column>
						<Column dataField="SaleAmount" alignment="right" dataType="number" format="currency" editorOptions={saleAmountEditorOptions}>
							<HeaderFilter dataSource={this.saleAmountHeaderFilter} />
						</Column>
						<Column dataField="SaleAmount" alignment="right" dataType="number" format="currency" editorOptions={saleAmountEditorOptions}>
							<HeaderFilter dataSource={this.saleAmountHeaderFilter} />
						</Column>
						<Column dataField="SaleAmount" alignment="right" dataType="number" format="currency" editorOptions={saleAmountEditorOptions}>
							<HeaderFilter dataSource={this.saleAmountHeaderFilter} />
						</Column>
						<Column dataField="Employee" />
						<Column dataField="CustomerStoreCity" caption="City">
							<HeaderFilter allowSearch={true} />
						</Column>
					</DataGrid>


					<div className="options">
						<div className="caption">Options</div>
						<div className="option">
							<span>Apply Filter </span>
							<SelectBox items={this.applyFilterTypes}
								value={this.state.currentFilter}
								onValueChanged={this.onCurrentFilterChanged}
								valueExpr="key"
								displayExpr="name"
								disabled={!this.state.showFilterRow} />
						</div>
						<div className="option">
							<CheckBox text="Filter Row"
								value={this.state.showFilterRow}
								onValueChanged={this.onShowFilterRowChanged} />
						</div>
						<div className="option">
							<CheckBox text="Header Filter"
								value={this.state.showHeaderFilter}
								onValueChanged={this.onShowHeaderFilterChanged} />
						</div>
					</div>
				</Paper>
			</Box>
		);
	}
	calculateFilterExpression(value, selectedFilterOperations, target) {
		let column = this;
		if (target === 'headerFilter' && value === 'weekends') {
			return [[getOrderDay, '=', 0], 'or', [getOrderDay, '=', 6]];
		}
		return column.defaultCalculateFilterExpression.apply(this, arguments);
	}
	orderHeaderFilter(data) {
		data.dataSource.postProcess = (results) => {
			results.push({
				text: 'Weekends',
				value: 'weekends'
			});
			return results;
		};
	}
	onShowFilterRowChanged(e) {
		this.setState({
			showFilterRow: e.value
		});
		this.clearFilter();
	}
	onShowHeaderFilterChanged(e) {
		this.setState({
			showHeaderFilter: e.value
		});
		this.clearFilter();
	}
	onCurrentFilterChanged(e) {
		this.setState({
			currentFilter: e.value
		});
	}
	clearFilter() {
		this.dataGrid.instance.clearFilter();
	}
}

function getOrderDay(rowData) {
	return (new Date(rowData.OrderDate)).getDay();
}

export default App;