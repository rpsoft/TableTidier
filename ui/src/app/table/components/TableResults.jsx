"use client";
import React, { useState } from "react";
import { Download, Edit2, Check, X } from "lucide-react";
import { useTableContext } from "../TableContext";

export default function TableResults() {
	const { state, setValue } = useTableContext();
	const [editingGroup, setEditingGroup] = useState(null);
	const [selectedConcepts, setSelectedConcepts] = useState(new Set());

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
		
		const headers = ['Value', 'Row', 'Column', 'Concepts'];
		
		const csvRows = [
			headers.join(','),
			...transformedData.map(item => {
				const row = item.position[0];
				const col = item.position[1];
				const concepts = item.concepts.join(';');
				// Check for any special characters that need quoting
				const needsQuoting = /[,()\s]/.test(item.value);
				const value = needsQuoting ? `"${item.value}"` : item.value;
				return [value, row, col, `"${concepts}"`].join(',');
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

	const startEditingGroup = (group) => {
		setEditingGroup(group);
		// Initialize selected concepts with all concepts in the group
		const initialSelected = new Set();
		state.extractedData.forEach((row, rowIndex) => {
			row.forEach((cell, colIndex) => {
				if (cell && cell.concepts) {
					cell.concepts.forEach(concept => {
						if (concept.content === group) {
							initialSelected.add(`${rowIndex}-${colIndex}-${concept.content}`);
						}
					});
				}
			});
		});
		setSelectedConcepts(initialSelected);
	};

	const handleConceptClick = (concept, rowIndex, colIndex) => {
		if (!editingGroup) return;

		const conceptKey = `${rowIndex}-${colIndex}-${concept}`;
		const newSelectedConcepts = new Set(selectedConcepts);
		
		if (newSelectedConcepts.has(conceptKey)) {
			newSelectedConcepts.delete(conceptKey);
		} else {
			newSelectedConcepts.add(conceptKey);
		}
		
		setSelectedConcepts(newSelectedConcepts);
	};

	const handleSaveChanges = () => {
		if (!editingGroup) return;

		// Update all cells that have the edited group
		const newExtractedData = [...state.extractedData];
		newExtractedData.forEach((row, rowIndex) => {
			row.forEach((cell, colIndex) => {
				if (cell && cell.concepts) {
					const conceptKey = `${rowIndex}-${colIndex}-${editingGroup}`;
					const shouldKeep = selectedConcepts.has(conceptKey);
					
					cell.concepts = cell.concepts.filter(concept => {
						if (concept.content === editingGroup) {
							return shouldKeep;
						}
						return true;
					});
				}
			});
		});

		setValue({ ...state, extractedData: newExtractedData });
		setEditingGroup(null);
		setSelectedConcepts(new Set());
	};

	const handleCancelEdit = () => {
		setEditingGroup(null);
		setSelectedConcepts(new Set());
	};

	// Get all unique concept groups
	const conceptGroups = new Set();
	state.extractedData.forEach(row => {
		row.forEach(cell => {
			if (cell && cell.concepts) {
				cell.concepts.forEach(concept => {
					conceptGroups.add(concept.content);
				});
			}
		});
	});

	return (
		<div>
			<div className="flex flex-col items-center gap-4 bg-gray-800 p-5">
							

				{/* Table */}
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
															{cell.concepts.map((concept, op) => {
																const conceptKey = `${e}-${c}-${concept.map( con => con.content ).join(" -> ")}`;
																const isSelected = selectedConcepts.has(conceptKey);
																const isEditing = editingGroup === concept.map( con => con.content ).join(" -> ");
																return (
																	<li 
																		key={`concept_${e}_${c}_${op}`} 
																		className={`truncate flex items-center gap-2 ${isSelected ? 'bg-primary text-primary-content' : ''} ${isEditing ? 'cursor-pointer' : ''}`}
																		title={concept.map( con => con.content ).join(" -> ")}
																		onClick={() => isEditing && handleConceptClick(concept.map( con => con.content ).join(" -> "), e, c)}
																	>
																		{isSelected ? <Check size={16} /> : null}
																		{concept.map( con => con.content ).join(" -> ")}
																	</li>
																);
															})}
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

			{editingGroup && (
				<div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 flex justify-center gap-4">
					<div className="flex items-center gap-2">
						<span>Editing group: {editingGroup}</span>
					</div>
					<button className="btn btn-primary" onClick={handleSaveChanges}>
						Save Changes
					</button>
					<button className="btn btn-ghost" onClick={handleCancelEdit}>
						Cancel
					</button>
				</div>
			)}

			<div className="flex justify-center gap-4 mt-5 bg-gray-800 p-3">
				<button className="btn btn-md" onClick={handleJSONDownload}>
					<Download /> Download JSON
				</button>
				<button className="btn btn-md" onClick={handleCSVDownload}>
					<Download /> Download CSV
				</button>
			</div>
		</div>
	);
}
