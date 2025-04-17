"use client";
import React, { useState, useEffect, useRef } from "react";
import TableContexMenu from "./TableContexMenu";
import { useTableContext } from "../TableContext";

export default function TableCell({
  content,
  tablePosition,
  colour,
  // addToSelection,
}) {
  const { state, setValue } = useTableContext();

  const handleCellClick = (selectionObject) => {
    const { tablePosition, e, content } = selectionObject;
    const [row, col] = tablePosition;
    const selectionKey = `${row}-${col}`;
    let selectionMap = { ...state.selectedCells };

    if (e.ctrlKey) {
      // Toggle the clicked cell
      if (selectionMap[selectionKey]) {
        delete selectionMap[selectionKey];
      } else {
        selectionMap[selectionKey] = { tablePosition, content };
      }
    } else if (e.shiftKey) {
      const [startRow, startCol] = state.tableClickPosition;
      const minR = Math.min(row, startRow);
      const maxR = Math.max(row, startRow);
      const minC = Math.min(col, startCol);
      const maxC = Math.max(col, startCol);

      // Select the entire range without toggling
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const key = `${r}-${c}`;
          selectionMap[key] = {
            content: state.tableNodes[r][c],
            tablePosition: [r, c],
          };
        }
      }
    } else {
      // Clear selection and select only the clicked cell
      selectionMap = { [selectionKey]: { tablePosition, content } };
    }

    // Update state
    setValue("selectedCells", selectionMap);
    setValue("tableClickPosition", tablePosition);
  };

  const selectedCells = Object.keys(state.selectedCells);

  const [selected, setSelected] = useState(false);

  useEffect(() => {
    var key = tablePosition[0] + "-" + tablePosition[1];
    setSelected(selectedCells.indexOf(key) > -1);
  }, [selectedCells, tablePosition]);

  return (
    <td
      className={
        "max-w-[400px] cursor-pointer hover:bg-yellow-200 hover:text-black min-w-5 " +
        (selected ? " bg-yellow-100 opacity-80 select-none text-black" : "")
      }
      style={{
        border: colour.length > 0 ? "1px solid " + colour : "",
        borderLeft: colour.length > 0 ? "10px solid " + colour : ""
      }}
      onContextMenu={(e) => {
        e.preventDefault();

        setValue("cellContextPoints", {
          x: e.pageX,
          y: e.pageY,
        });

        setValue("cellContextOpen", true);
        setValue("tableClickPosition", tablePosition);
      }}
      onClick={(e) => {
        handleCellClick({ content, tablePosition, e });
      }}
    >
      {content}
    </td>
  );
}
