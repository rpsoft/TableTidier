"use client";

import UploadTable from "@/components/ui/UploadTable";
import TableCell from "@/components/ui/TableCell";
import TableTab from "@/components/ui/TableTab";
import TableOperations from "./tableEdit";
import Tabletools from "./tableTools";
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

  const [selectedCells, setSelectedCells] = useState({});

  const handleTabClick = (tabSelection) => {

    // Create a new object for selectionMap to ensure state changes trigger re-renders
    let selectionMap = tabSelection.e.ctrlKey ? { ...selectedCells } : {};

    if (tabSelection.orientation === "row") {
      // Toggle row selection
      tableNodes[tabSelection.index].forEach((col, c) => {
        const key = `${tabSelection.index}-${c}`;

        if (selectionMap[key]) {
          // If already selected, remove it
          delete selectionMap[key];
        } else {
          // If not selected, add it
          const selectedNode = tableNodes[tabSelection.index][c];
          selectionMap[key] = {
            content: selectedNode,
            tablePosition: [tabSelection.index, c],
          };
        }
      });
    } else {
      // Toggle column selection
      tableNodes.forEach((row, r) => {
        const key = `${r}-${tabSelection.index}`;

        if (selectionMap[key]) {
          // If already selected, remove it
          delete selectionMap[key];
        } else {
          // If not selected, add it
          const selectedNode = tableNodes[r][tabSelection.index];
          selectionMap[key] = {
            content: selectedNode,
            tablePosition: [r, tabSelection.index],
          };
        }
      });
    }

    // Update state with the new selectionMap
    setSelectedCells(selectionMap);
  };

  const handleCellClick = (selectionObject) => {
    const { tablePosition, e, content } = selectionObject;
    const [row, col] = tablePosition;
    const selectionKey = `${row}-${col}`;
    let selectionMap = { ...selectedCells };

    if (e.ctrlKey) {
      // Toggle the clicked cell
      selectionMap[selectionKey]
        ? delete selectionMap[selectionKey]
        : (selectionMap[selectionKey] = selectionObject);
    } else if (e.shiftKey) {
      const [startRow, startCol] = tableClickPosition;
      const minR = Math.min(row, startRow);
      const maxR = Math.max(row, startRow);
      const minC = Math.min(col, startCol);
      const maxC = Math.max(col, startCol);

      // Select the entire range without toggling
      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const key = `${r}-${c}`;
          selectionMap[key] = {
            content: tableNodes[r][c],
            tablePosition: [r, c],
          };
        }
      }
    } else {
      // Clear selection and select only the clicked cell
      selectionMap = { [selectionKey]: selectionObject };
    }

    // Update state
    setSelectedCells(selectionMap);
    setCellContent(content);
    setTableClickPosition(tablePosition);
  };

  const [selectedTable, setSelectedTable] = useState(null);
  const [tables, setTables] = useState([]);
  const [tableNodes, setTableNodes] = useState([]);

  const refreshTables = async () => {
    getAllTables().then((tables) => {
      setTables(tables);
    });
  };

  useEffect(() => {
    refreshTables();
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

    setTableNodes(Tabletools.contentToNodes(tableContent));
  }, [tables, selectedTable]);

  const options = tables.map((tables, t) => {
    return { value: t, label: tables.fileName };
  });

  var tbody = tableNodes.map((row, r) => {
    return (
      <tr key={"r" + r}>
      	<TableTab orientation="row" index={r} handleTabClick={handleTabClick} />

        {row.map((cell, c) => {
        	return (<TableCell
				    key={"cell_" + r + "_" + c}
				    content={cell}
				    tablePosition={[r, c]}
				    setClicked={setCellContextOpen}
				    setPoints={setCellContextPoints}
				    setCellContent={setCellContent}
				    setTableClickPosition={setTableClickPosition}
				    handleCellClick={handleCellClick}
				    selectedCells ={Object.keys(selectedCells)}

				></TableCell>);
        })}
      </tr>
    );
  });

  return (
    <main>
      <UploadTable
        action={async (formData) => {
          await uploadTable(formData);
          await refreshTables();
        }}
      />
      <Select
        className="w-[600px]"
        options={options}
        onChange={(value) => {
          setSelectedTable(value);
        }}
      />

      <div>{selectedCells.length}</div>

      <table>
      	<thead>
       	<tr>
       		<TableTab orientation="col" index={-1} handleTabClick={handleTabClick} />
         	{
				tableNodes[0] ? tableNodes[0].map(
					(col, c) => <TableTab key={"hcol-" + c} orientation="col" index={c} handleTabClick={handleTabClick} />
				) : null

          	}
        </tr>

       	</thead>
        <tbody>{tbody}</tbody>
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
      )}
    </main>
  );
}
