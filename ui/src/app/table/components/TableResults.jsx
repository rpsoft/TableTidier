"use client";
import React from "react";

import { Download } from "lucide-react";

import { useTableContext } from "../TableContext";


export default function TableResults({ }) {

		const { state, setValue } = useTableContext();

		const transformData = () => {
			return state.extractedData
				.flatMap((row, rowIndex) => 
					row.map((cell, colIndex) => {
						if (!cell || !cell.concepts.length || !cell.cellData.trim()) return null;
						
						return {
							value: cell.cellData,
							position: [rowIndex, colIndex],
							concepts: cell.concepts.map(c => c.content)
						};
					})
				)
				.filter(item => item != null);
		};

		const handleJSONDownload = () => {
			const transformedData = transformData();
			const data = JSON.stringify(transformedData, null, 2);
			const blob = new Blob([data], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'extractedData.json';
			a.click();
			URL.revokeObjectURL(url);
		};

		const handleCSVDownload = () => {
			const transformedData = transformData();
			
			// Create CSV headers
			const headers = ['Value', 'Row', 'Column', 'Concepts'];
			
			// Convert data to CSV rows
			const csvRows = [
				headers.join(','),
				...transformedData.map(item => {
					const row = item.position[0];
					const col = item.position[1];
					const concepts = item.concepts.join(';');
					return [item.value, row, col, `"${concepts}"`].join(',');
				})
			];
			
			const csvContent = csvRows.join('\n');
			const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'extractedData.csv';
			a.click();
			URL.revokeObjectURL(url);
		};

	return <div>
		<div className="flex justify-center  bg-gray-800 p-5">
			<table className="w-full max-w-4xl">
				<tbody>
					{state.extractedData.map((ex, e) => {
						return (
							<tr key={"ex_" + e}>
								{ex.map((cell, c) => {
									return (
										<td key={"ex_" + e + "_" + c} className="max-w-[200px]">
											{cell != null &&
												cell.concepts.length > 0 &&
												cell.cellData.trim().length > 0 ? (
												<div className="dropdown dropdown-hover dropdown-right">
													<div
														tabIndex={0}
														role="button"
														className="btn m-[1px] py-0 min-h-4 h-6 max-w-full truncate"
														title={cell.cellData}
													>
														{cell.cellData}
													</div>
													<ul
														tabIndex={0}
														className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
													>
														{cell.concepts.map((c, op) => (
															<li key={"char_" + op} className="truncate" title={c.content}>
																{c.content}
															</li>
														))}
													</ul>
												</div>
											) : (
												""
											)}
										</td>
									);
								})}
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>


		<div  className="flex justify-center gap-4 mt-5 bg-gray-800 p-3">
			<button className="btn btn-md" onClick={handleJSONDownload}> <Download /> Download JSON</button>
			<button className="btn btn-md" onClick={handleCSVDownload}> <Download /> Download CSV</button>
		</div>
	</div>

}
