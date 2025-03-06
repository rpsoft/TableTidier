"use client";
import React, { useState, useEffect, useRef } from "react";
import SortableList from "./SortableList";

import GroupContextMenu from "./GroupContextMenu";
import ColourContextSelector from "./ColourContextSelector";

import { useTableContext } from "../TableContext";
import Tabletools from "../tableTools";
import { Col } from "antd";

export default function TableResults({ }) {

		const { state, setValue } = useTableContext();

		const handleDownload = () => {
						const data = JSON.stringify(

							state.extractedData.filter((ex) => {
								return ex.filter((cell) => {
									return cell != null &&
										cell.concepts.length > 0 &&
										cell.cellData.trim().length > 0
								}).length > 0
							} )


							, null, 2);
						const blob = new Blob([data], { type: 'application/json' });
						const url = URL.createObjectURL(blob);
						const a = document.createElement('a');
						a.href = url;
						a.download = 'extractedData.json';
						a.click();
						URL.revokeObjectURL(url);
		};

	return <div>
		<table>
			<tbody>
				{state.extractedData.map((ex, e) => {
					return (
						<tr key={"ex_" + e}>
							{ex.map((cell, c) => {
								return (
									<td key={"ex_" + e + "_" + c} className="max-w-40">
										{cell != null &&
											cell.concepts.length > 0 &&
											cell.cellData.trim().length > 0 ? (
											<div className="dropdown dropdown-hover dropdown-right">
												<div
													tabIndex={0}
													role="button"
													className="btn m-[1px] py-0 min-h-4 h-6"
												>
													{cell.cellData}
												</div>
												<ul
													tabIndex={0}
													className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
												>
													{cell.concepts.map((c, op) => (
														<li key={"char_" + op}>{c.content} </li>
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
																<button onClick={handleDownload}>Download Data</button>
	</div>

}
