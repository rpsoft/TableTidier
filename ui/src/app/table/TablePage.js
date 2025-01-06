"use client";

import UploadTable from "@/components/ui/UploadTable";
import TableCell from "./components/TableCell";
import TableTab from "./components/TableTab";
import TableContexMenu from "./components/TableContexMenu";

import Tabletools from "./tableTools";


import { getTable, getAllTables, uploadTable } from "./actions";
import { Select, Table } from "antd";
import { useState, useEffect, useContext, createContext } from "react";

import { useTableContext } from "./TableContext"


// import React from "react";
export default function TablePage() {

  const { state, setValue } = useTableContext();


  const handleTabClick = (tabSelection) => {

    // Create a new object for selectionMap to ensure state changes trigger re-renders
    let selectionMap = tabSelection.e.ctrlKey ? { ...state.selectedCells } : {};

    if (tabSelection.orientation === "row") {
      // Toggle row selection
      state.tableNodes[tabSelection.index].forEach((col, c) => {
        const key = `${tabSelection.index}-${c}`;

        if (selectionMap[key]) {
          // If already selected, remove it
          // if ( !tabSelection.e.ctrlKey )
          delete selectionMap[key];
        } else {
          // If not selected, add it
          const selectedNode = state.tableNodes[tabSelection.index][c];
          selectionMap[key] = {
            content: selectedNode,
            tablePosition: [tabSelection.index, c],
          };
        }
      });
    } else {
      // Toggle column selection
      state.tableNodes.forEach((row, r) => {
        const key = `${r}-${tabSelection.index}`;

        if (selectionMap[key]) {
          // If already selected, remove it
          // if ( !tabSelection.e.ctrlKey )
          delete selectionMap[key];
        } else {
          // If not selected, add it
          const selectedNode = state.tableNodes[r][tabSelection.index];
          selectionMap[key] = {
            content: selectedNode,
            tablePosition: [r, tabSelection.index],
          };
        }
      });
    }

    // Update state with the new selectionMap
    setValue( "selectedCells", selectionMap ) ;
  };

  const handleCellClick = (selectionObject) => {
    const { tablePosition, e, content } = selectionObject;
    const [row, col] = tablePosition;
    const selectionKey = `${row}-${col}`;
    let selectionMap = { ...state.selectedCells };

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
    setValue( "selectedCells", selectionMap );
    setValue( "tableClickPosition", tablePosition);
  };



  const refreshTables = async () => {
    getAllTables().then((tables) => {
    // debugger
      setValue("tables", tables);
    });
  };

  useEffect(() => {
    refreshTables();
  }, []);

  useEffect(() => {
    var tableContent;

    if (state.selectedTable != null) {
      tableContent = state.tables
        .filter((table) => {
          return table.fileName == state.tables[state.selectedTable].fileName;
        })
        .map((table, tindex) => {
          return table.htmlContent;
        });
    }

    setValue( "tableNodes", Tabletools.contentToNodes(tableContent));
  }, [state.tables, state.selectedTable]);

  const options = state.tables.map((tables, t) => {
    return { value: t, label: tables.fileName };
  });

  var tbody = state.tableNodes.map((row, r) => {
    return (
      <tr key={"r" + r}>
      	<TableTab orientation="row" index={r} handleTabClick={handleTabClick} />

        {row.map((cell, c) => {
        	return (<TableCell
					    key={"cell_" + r + "_" + c}
					    content={cell}
					    tablePosition={[r, c]}
					    handleCellClick={handleCellClick}
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
	          setValue( "selectedTable", value );
	        }}
	      />

	      <div>{state.selectedCells.length}</div>

	      <table>
	      	<thead>
	       	<tr>
	       		<TableTab orientation="col" index={-1} handleTabClick={handleTabClick} />
	         	{
					state.tableNodes[0] ? state.tableNodes[0].map(
						(col, c) => <TableTab key={"hcol-" + c} orientation="col" index={c} handleTabClick={handleTabClick} />
					) : null

	          	}
	        </tr>

	       	</thead>
	        <tbody>{tbody}</tbody>
	      </table>

			  <TableContexMenu />

    </main>

  );
}
