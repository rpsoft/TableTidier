"use client";
import { Select, Table } from "antd";
import { SessionProvider } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

import UploadTable from "@/components/ui/UploadTable";
import TableCell from "./components/TableCell";
import TableTab from "./components/TableTab";
import TableContexMenu from "./components/TableContexMenu";
import TableAnnotator from "./components/TableAnnotator";
import TableResults from "./components/TableResults";
import Header from "@/components/ui/header";

import Tabletools from "./tableTools";

import { getTable, getAllTables, uploadTable, updateTable } from "./actions";
import { useState, useEffect, useContext, createContext, useCallback } from "react";

import { useTableContext } from "./TableContext";
import TableHTMLEditor from "./components/TableHTMLEditor";

// CREATE-ISSUE: Title="Fix Vue Component" Description="This Vue component needs better error handling."

export default function TablePage({ initialTableId }) {
  const { state, setValue } = useTableContext();
  const searchParams = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedData, setLastSavedData] = useState(null);

  const refreshTables = async () => {
    getAllTables().then((tables) => {
      setValue("tables", tables);
      if (initialTableId) {
        const tableIndex = tables.findIndex(t => t.id === initialTableId);
        if (tableIndex !== -1) {
          setValue("selectedTable", tableIndex);
        }
      }
    });
  };

  const saveTableChanges = async () => {
    if (state.selectedTable === null || isSaving) return;
    
    const currentTable = state.tables[state.selectedTable];
    if (!currentTable) return;

    // Check if there are actual changes to save
    if (lastSavedData && 
        JSON.stringify(currentTable) === JSON.stringify(lastSavedData)) {
      return;
    }

    setIsSaving(true);
    try {
      // Ensure we have the latest annotations in the table data
      if (state.annotations) {
        currentTable.annotationData = { annotations: state.annotations };
      }
      await updateTable(currentTable);
      setLastSavedData(JSON.parse(JSON.stringify(currentTable)));
    } catch (error) {
      console.error('Error saving table:', error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleClick = () => {
      setValue("cellContextOpen", false);
      setValue("groupContextOpen", false);
      setValue("colourSelectGroup", null);
    };
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  });

  useEffect(() => {
    refreshTables();
  }, [initialTableId]);

  const [currentTableHtml, setCurrentTableHTML] = useState("");
  const [activeTab, setActiveTab] = useState("Annotation Dashboard");

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

    const tableNodes = Tabletools.contentToNodes(tableContent);
    setValue("tableNodes", tableNodes);

    const tableData = state.tables[state.selectedTable];
    const annotations = tableData?.annotationData?.annotations;

    var currentTableHtml = parseInt(state.selectedTable) > -1 ? state.tables[state.selectedTable].htmlContent : "";
    setCurrentTableHTML(currentTableHtml);

    if (annotations) {
      setValue("annotations", annotations);
      setValue(
        "extractedData",
        Tabletools.annotationsToTable(tableNodes, annotations),
      );
    } else {
      setValue("annotations", []);
      setValue("extractedData", []);
    }

    setValue("selectedCells", {});
  }, [state.tables, state.selectedTable]);

  // Auto-save when table data changes
  useEffect(() => {
    if (state.selectedTable !== null && state.tables[state.selectedTable]) {
      saveTableChanges();
    }
  }, [state.tables, state.selectedTable]);

  // Auto-save when annotations change
  useEffect(() => {
    if (state.annotations && state.selectedTable !== null) {
      const tableData = state.tables[state.selectedTable];
      if (tableData) {
        tableData.annotationData = { annotations: state.annotations };
        saveTableChanges();
      }
    }
  }, [state.annotations]);

  const options = state.tables.map((tables, t) => {
    return { value: t, label: tables.fileName };
  });

  var tbody = state.tableNodes.map((row, r) => {
    return (
      <tr key={"r" + r}>
        <TableTab orientation="row" index={r} />

        {row.map((cell, c) => {
          var groupsWithCell = state.annotations.map(an => Object.keys(an.concepts)).map(groupPositions => groupPositions.indexOf(r + "-" + c));

          var colour = state.annotations.filter((ann, a) =>
            groupsWithCell[a] > -1
          ).map(g => g.color).join();

          return (
            <TableCell
              key={"cell_" + r + "_" + c}
              content={cell}
              tablePosition={[r, c]}
              colour={colour}
            ></TableCell>
          );
        })}
      </tr>
    );
  });

  var maxColumns = Math.max(...state.tableNodes.map((r) => r.length));

  const tabActive = "tab-active text-white border-b-white border-b-2";

  var activeTabContent;

  switch (activeTab) {
    case "Annotation Dashboard":
      activeTabContent = (
        <div className="flex flex-col p-5">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="h-10">
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
        </div>
      );
      break;
    case "Edit Table":
      activeTabContent = (
        <TableHTMLEditor
          initialHtml={currentTableHtml}
          saveHtml={(htmlContent) => {
            var allTables = state.tables;
            allTables[state.selectedTable].htmlContent = htmlContent;
            var tableNodes = Tabletools.contentToNodes([htmlContent]);

            if (allTables[state.selectedTable].annotationData) {
              var refreshedAnnotations = allTables[state.selectedTable].annotationData.annotations.map(annotation => {
                annotation.concepts = Object.keys(annotation.concepts).reduce((acc, conceptKey) => {
                  var row = annotation.concepts[conceptKey].tablePosition[0];
                  var col = annotation.concepts[conceptKey].tablePosition[1];
                  var newContent = tableNodes[row][col];
                  annotation.concepts[conceptKey].content = newContent;
                  acc[conceptKey] = annotation.concepts[conceptKey];
                  return acc;
                }, {});
                return annotation;
              });
              allTables[state.selectedTable].annotationData.annotations = refreshedAnnotations;
            }
            setValue("tables", allTables);
            saveTableChanges();
          }}
        />
      );
      break;
    case "Extracted Data":
      activeTabContent = <TableResults />;
      break;
  }

  return (
    <SessionProvider>
      <main className="min-h-screen bg-gray-900">
        <Header />
        <div className="flex justify-between p-5 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <button 
              className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white border-none" 
              onClick={() => document.getElementById('upload_table_modal').showModal()}
            >
              Upload Table
            </button>
            <dialog id="upload_table_modal" className="modal">
              <div className="modal-box bg-gray-800 text-white">
                <UploadTable
                  action={async (formData) => {
                    await uploadTable(formData);
                    await refreshTables();
                  }}
                />
              </div>
              <form method="dialog" className="modal-backdrop">
                <button>close</button>
              </form>
            </dialog>

            <Select
              className="w-[600px]"
              options={options}
              onChange={async (value) => {
                setValue("selectedTable", value);
                // Reset last saved data when switching tables
                setLastSavedData(null);
              }}
              placeholder="Select a table"
              dropdownStyle={{ backgroundColor: 'rgb(31, 41, 55)' }}
              style={{ backgroundColor: 'rgb(31, 41, 55)', color: 'white' }}
            />
          </div>

          <div className="flex items-center">
            {isSaving && (
              <span className="text-gray-300 mr-2">Saving changes...</span>
            )}
          </div>
        </div>

        {state.selectedTable ? (
          <div className="flex flex-col w-full">
            <div role="tablist" className="tabs tabs-lift tabs-md bg-gray-800 border-b border-gray-700">
              {["Annotation Dashboard", "Edit Table", "Extracted Data"].map(
                t => (
                  <a
                    role="tab"
                    key={t}
                    className={"tab no-underline text-gray-300 hover:text-white " + (activeTab === t ? tabActive : "")}
                    onClick={() => { setActiveTab(t); }}
                  >
                    {t}
                  </a>
                )
              )}
            </div>
            <div className="p-5">
              {activeTabContent}
            </div>
          </div>
        ) : (
          <div className="p-10 text-center text-gray-300">
            <h2 className="text-2xl font-bold mb-4">Welcome to TableTidier</h2>
            <p>Upload or select a table above to get started</p>
          </div>
        )}

        <TableContexMenu />
      </main>
    </SessionProvider>
  );
}
