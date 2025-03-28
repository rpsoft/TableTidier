"use client";
import { Select, Table } from "antd";

import UploadTable from "@/components/ui/UploadTable";
import TableCell from "./components/TableCell";
import TableTab from "./components/TableTab";
import TableContexMenu from "./components/TableContexMenu";
import TableAnnotator from "./components/TableAnnotator";

import Tabletools from "./tableTools";

import { getTable, getAllTables, uploadTable } from "./actions";
import { useState, useEffect, useContext, createContext } from "react";

import { useTableContext } from "./TableContext";

// import React from "react";
export default function TablePage() {
  const { state, setValue } = useTableContext();

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

    setValue("tableNodes", Tabletools.contentToNodes(tableContent));
  }, [state.tables, state.selectedTable]);

  const options = state.tables.map((tables, t) => {
    return { value: t, label: tables.fileName };
  });

  var tbody = state.tableNodes.map((row, r) => {
    return (
      <tr key={"r" + r}>
        <TableTab orientation="row" index={r} />

        {row.map((cell, c) => {
          return (
            <TableCell
              key={"cell_" + r + "_" + c}
              content={cell}
              tablePosition={[r, c]}
            ></TableCell>
          );
        })}
      </tr>
    );
  });

  var maxColumns = Math.max(...state.tableNodes.map((r) => r.length));
  // debugger;
  console.log(maxColumns);
  return (
    <main>
      <div className="max-w-[500px] p-5">
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
            setValue("selectedTable", value);
          }}
        />
      </div>

      <div className="flex flex-wrap">
        <div>
          <table>
            <thead>
              <tr>
                <TableTab orientation="col" index={-1} />
                {maxColumns
                  ? Array.from(
                      { length: maxColumns },
                      (value, index) => index,
                    ).map((col, c) => (
                      <TableTab key={"hcol-" + c} orientation="col" index={c} />
                    ))
                  : null}
              </tr>
            </thead>
            <tbody>{tbody}</tbody>
          </table>
        </div>

        <TableAnnotator />

        <div>
          <TableContexMenu />
        </div>
      </div>
    </main>
  );
}
