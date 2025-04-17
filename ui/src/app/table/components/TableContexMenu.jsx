"use client";
import { useRef } from "react";
import React, { useState, useEffect } from "react";
import { ContextMenu } from "@/styles/styles";
import { TableProvider } from "../TableContext";
import TableOperations from "../tableEdit";
import { useTableContext } from "../TableContext";

export default function TableContexMenu({}) {
  // const fileInput = useRef(null);
  const { state, setValue } = useTableContext();

  const setTableNodes = (tableNodes) => setValue("tableNodes", tableNodes);
  const tableNodes = state.tableNodes;
  const tableClickPosition = state.tableClickPosition;

  var cellContent = "";
  try {
    cellContent =
      tableNodes.length > 0
        ? tableNodes[tableClickPosition[0]][tableClickPosition[1]]
        : "";
  } catch (e) {
    console.log(
      "selection for the context menu is out of bounds. You probably deleted the last row.",
    );
  }
  if (!state.cellContextOpen) {
    return null;
  }

  const selectUnassignedRow = () => {
    const [row, col] = tableClickPosition;
    const newSelectedCells = { ...state.selectedCells };
    
    // Get all cells in the current row
    state.tableNodes[row].forEach((cell, c) => {
      const key = `${row}-${c}`;
      // Check if the cell is not assigned to any group
      const isUnassigned = !state.annotations.some(ann => 
        Object.keys(ann.concepts).includes(key)
      );
      if (isUnassigned) {
        newSelectedCells[key] = {
          content: cell,
          tablePosition: [row, c]
        };
      }
    });
    
    setValue("selectedCells", newSelectedCells);
  };

  const selectUnassignedColumn = () => {
    const [row, col] = tableClickPosition;
    const newSelectedCells = { ...state.selectedCells };
    
    // Get all cells in the current column
    state.tableNodes.forEach((rowData, r) => {
      const key = `${r}-${col}`;
      // Check if the cell is not assigned to any group
      const isUnassigned = !state.annotations.some(ann => 
        Object.keys(ann.concepts).includes(key)
      );
      if (isUnassigned) {
        newSelectedCells[key] = {
          content: rowData[col],
          tablePosition: [r, col]
        };
      }
    });
    
    setValue("selectedCells", newSelectedCells);
  };

  return (
    <>
      <ContextMenu
        $top={state.cellContextPoints.y}
        $left={state.cellContextPoints.x}
      >
        <div className="text-center">{cellContent}</div>
        <div>Row {tableClickPosition[0] + 1}, Column {tableClickPosition[1] + 1}</div>
        <hr />
        <ul>
          <li onClick={selectUnassignedColumn}>Select Unassigned Column</li>
          <li onClick={selectUnassignedRow}>Select Unassigned Row</li>
          <li>Select Similar Column</li>
          <li>Select Similar Rows</li>
        </ul>
      </ContextMenu>
    </>
  );
}
