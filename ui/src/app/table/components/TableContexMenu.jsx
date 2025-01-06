"use client";
import { useRef } from "react";
import React, { useState, useEffect } from "react";
import { ContextMenu } from "@/styles/styles";
import { TableProvider } from "../TableContext"
import TableOperations from "../tableEdit";
import { useTableContext } from "../TableContext"


export default function TableContexMenu({
	}){
  // const fileInput = useRef(null);
	const { state, setValue }  = useTableContext();

	const setTableNodes = ( tableNodes ) => setValue("tableNodes", tableNodes)
	const tableNodes = state.tableNodes
	const tableClickPosition = state.tableClickPosition

	const cellContent = tableNodes[tableClickPosition[0]][tableClickPosition[1]]

  if (!state.cellContextOpen){
  	return null
  }

  return (
    <>
      <ContextMenu top={state.cellContextPoints.y} left={state.cellContextPoints.x}>
        <div className="text-center">{cellContent}</div>
        <div> {tableClickPosition[0] + "/" + tableClickPosition[1]} </div>
        <hr />
        <ul>
          <li>Edit</li>
          <li onClick={() => navigator.clipboard.writeText(state.cellContent)}>
            Copy
          </li>
          <li>Undo</li>
          <li
            onClick={() =>
              TableOperations.deleteColumn(
                tableNodes,
                setTableNodes,
                tableClickPosition[1],
              )
            }
          >
            Delete Column
          </li>
          <li
            onClick={() =>
              TableOperations.deleteRow(
                tableNodes,
                setTableNodes,
                tableClickPosition[0],
              )
            }
          >
            Delete Row
          </li>
          <li>Select Similar Column</li>
          <li>Select Similar Rows </li>
          <li
            onClick={() =>
              TableOperations.addColumn(
                tableNodes,
                setTableNodes,
                tableClickPosition[1],
                true,
              )
            }
          >
            New Column Before
          </li>
          <li
            onClick={() =>
              TableOperations.addColumn(
                tableNodes,
                setTableNodes,
                tableClickPosition[1],
                false,
              )
            }
          >
            New Column After
          </li>
          <li
            onClick={() =>
              TableOperations.addRow(
                tableNodes,
                setTableNodes,
                tableClickPosition[0],
                true,
              )
            }
          >
            New Row Before
          </li>
          <li
            onClick={() =>
              TableOperations.addRow(
                tableNodes,
                setTableNodes,
                tableClickPosition[0],
                false,
              )
            }
          >
            New Row After
          </li>
        </ul>
      </ContextMenu>
    </>
  );
}
