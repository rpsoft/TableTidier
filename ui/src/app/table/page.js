"use client";

import UploadTable from "@/components/ui/UploadTable";
import TableCell from "@/components/ui/TableCell";
import TableOperations from "./tableEdit";
import Tabletools from "./tableTools"
import { ContextMenu } from "../../styles/styles";


import { getTable, getAllTables, uploadTable } from "./actions";

import { Select, Table } from "antd";
import { useState, useEffect } from "react";

// import React from "react";
export default function TablePage() {

	const [cellContextOpen, setCellContextOpen] = useState(false);
	const [cellContextPoints, setCellContextPoints] = useState({
		x: 0,
		y: 0,
	});

	const [cellContent, setCellContent] = useState(null);
	const [tableClickPosition, setTableClickPosition] = useState(null); // col, row -- x, y

	const [selectedTable, setSelectedTable] = useState(null);
	const [tables, setTables] = useState([]);

	const [tableNodes, setTableNodes] = useState([])

	const refreshTables = async () =>{
		getAllTables().then((tables) => {
			setTables(tables);
		});
	}

	useEffect(() => {
		refreshTables()
	}, []);

	useEffect(() => {

 		var tableContent;

		if (selectedTable != null) {
			tableContent = tables
				.filter((table) => {
					return table.fileName == tables[selectedTable].fileName;
				})
				.map((table, tindex) => {
					return table.htmlContent;
				});
		}

		setTableNodes(Tabletools.contentToNodes(tableContent))

	}, [tables, selectedTable]);

	const options = tables.map((tables, t) => {
		return { value: t, label: tables.fileName };
	});


	var tbody = tableNodes.map((row, r) => {
		return (
			<tr key={"r" + r}>
				{row.map((cell, c) => {
					//
					return (
						<TableCell
							key={"cell_" + r + "_" + c}
							content={cell}
							tablePosition={[c, r]}
							setClicked={setCellContextOpen}
							setPoints={setCellContextPoints}
							setCellContent={setCellContent}
							setTableClickPosition={setTableClickPosition}
						></TableCell>
					);
				})}
			</tr>
		);
	})


	return (
		<main>
			<UploadTable action={
				async (formData) => {
					await uploadTable(formData);
					await refreshTables();
				}
			} />
			<Select
				className="w-[600px]"
				options={options}
				onChange={(value) => {
					setSelectedTable(value);
				}}
			/>

			<table>
				<tbody>
					{tbody}
				</tbody>
			</table>

			{cellContextOpen && (
				<ContextMenu top={cellContextPoints.y} left={cellContextPoints.x}>
					<div className="text-center">{cellContent}</div>
					<div> {tableClickPosition[0] + "/" + tableClickPosition[1]} </div>
					<hr />
					<ul>
						<li>Edit</li>
						<li onClick={() => navigator.clipboard.writeText(cellContent)}>
							Copy
						</li>
						<li>Undo</li>
						<li
							onClick={() =>
								TableOperations.deleteColumn(tableNodes, setTableNodes, tableClickPosition[0])
							}
						>Delete Column</li>
						<li
							onClick={() =>
								TableOperations.deleteRow(tableNodes, setTableNodes, tableClickPosition[1])
							}
						>Delete Row</li>
						<li>Select Similar Column</li>
						<li>Select Similar Rows </li>
						<li
							onClick={() =>
								TableOperations.addColumn(tableNodes, setTableNodes, tableClickPosition[0], true)
							}
						>
							New Column Before
						</li>
						<li
							onClick={() =>
								TableOperations.addColumn(tableNodes, setTableNodes, tableClickPosition[0], false)
							}
						>New Column After</li>
						<li
							onClick={() =>
								TableOperations.addRow(tableNodes, setTableNodes, tableClickPosition[1], true)
							}
						>New Row Before</li>
						<li
							onClick={() =>
								TableOperations.addRow(tableNodes, setTableNodes, tableClickPosition[1], false)
							}
						>New Row After</li>
					</ul>
				</ContextMenu>
			)}
		</main>
	);
}
