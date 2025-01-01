"use client";

import UploadTable from "@/components/ui/UploadTable";
import TableCell from "@/components/ui/TableCell";
import TableOperations from "./tableEdit";
import { ContextMenu } from "../../styles/styles";

import * as cheerio from "cheerio";

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

  useEffect(() => {
    getAllTables().then((tables) => {
      setTables(tables);
    });
  }, []);

  const options = tables.map((tables, t) => {
    return { value: t, label: tables.fileName };
  });

  var tableContent;

  if (selectedTable) {
    tableContent = tables
      .filter((table) => {
        return table.fileName == tables[selectedTable].fileName;
      })
      .map((table, tindex) => {
        return table.htmlContent;
      });
  }

  if (tableContent && tableContent[0]) {
    const $ = cheerio.load(tableContent[0]);

    function traverseNodes(node) {
      var content = [];

      node.children?.forEach((child) => {
        console.log(child.tagName);
        if (child.tagName === "td") {
          const childContent = $(child).text();
          content = [...content, childContent];
        }

        var recContent = traverseNodes(child);
        if (recContent.length > 0) content = [...content, recContent];
      });

      return content;
    }

    // This is quite awesome. All nodes sorted here in a recursive structure of arrays! if a valid table is supplied.
    var allnodes = traverseNodes($("table")[0]).flat();
    // debugger
    tableContent = (
      <>
        <table>
          <tbody>
            {allnodes.map((row, r) => {
              // debugger
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
            })}
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
              <li>Delete</li>
              <li>Select Similar Column</li>
              <li>Select Similar Rows </li>
              <li>New Column Before</li>
              <li>New Column After</li>
              <li>New Row Before</li>
              <li>New Row After</li>
            </ul>
          </ContextMenu>
        )}
      </>
    );
  }

  return (
    <main>
      <UploadTable action={uploadTable} />
      <Select
        className="w-[600px]"
        options={options}
        onChange={(value) => {
          setSelectedTable(value);
        }}
      />
      {tableContent}
    </main>
  );
}
