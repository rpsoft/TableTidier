"use client";
import { Select, Table } from "antd";
import { SessionProvider } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Edit2 } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';

import UploadTable from "@/components/ui/UploadTable";
import TableCell from "./components/TableCell";
import TableTab from "./components/TableTab";
import TableContexMenu from "./components/TableContexMenu";
import TableAnnotator from "./components/TableAnnotator";
import TableResults from "./components/TableResults";
import Header from "@/components/ui/header";
import MetadataViewer from "./components/MetadataViewer";

import Tabletools from "./tableTools";

import { getTable, getAllTables, uploadTable, updateTable } from "./actions";
import { useState, useEffect, useContext, createContext, useCallback } from "react";

import { useTableContext } from "./TableContext";
import TableHTMLEditor from "./components/TableHTMLEditor";

// CREATE-ISSUE: Title="Fix Vue Component" Description="This Vue component needs better error handling."

export default function TablePage({ initialTableId }) {
  const { state, setValue } = useTableContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedData, setLastSavedData] = useState(null);
  const [currentCollectionId, setCurrentCollectionId] = useState(null);

  const refreshTables = async () => {
    getAllTables().then((tables) => {
      // If we have an initial table ID, find its collection and filter tables
      if (initialTableId) {
        const initialTable = tables.find(t => t.id === initialTableId);
        if (initialTable) {
          setCurrentCollectionId(initialTable.collectionId);
          const collectionTables = tables.filter(t => t.collectionId === initialTable.collectionId);
          setValue("tables", collectionTables);
          const tableIndex = collectionTables.findIndex(t => t.id === initialTableId);
          if (tableIndex !== -1) {
            setValue("selectedTable", tableIndex);
          }
        }
      } else if (currentCollectionId) {
        // If we have a current collection, filter tables by that collection
        const collectionTables = tables.filter(t => t.collectionId === currentCollectionId);
        setValue("tables", collectionTables);
      } else {
        setValue("tables", tables);
      }
    });
  };

  const saveTableChanges = async () => {
    if (state.selectedTable === null || isSaving) return false;
    
    const currentTable = state.tables[state.selectedTable];
    if (!currentTable) return false;

    // Check if there are actual changes to save
    const dataToCompare = lastSavedData || state.tables[state.selectedTable];
    if (JSON.stringify(currentTable) === JSON.stringify(dataToCompare)) {
      console.log("No changes detected to save.");
      return true;
    }

    setIsSaving(true);
    const savingToast = toast.loading('Saving table HTML...');
    try {
      // Ensure we have the latest annotations in the table data
      if (state.annotations) {
        currentTable.annotationData = { annotations: state.annotations };
      }
      await updateTable(currentTable);
      setLastSavedData(JSON.parse(JSON.stringify(currentTable)));
      toast.dismiss(savingToast);
      return true;
    } catch (error) {
      console.error('Error saving table:', error);
      toast.dismiss(savingToast);
      return false;
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
    if (state.selectedTable != null) {
      const tableData = state.tables[state.selectedTable];
      if (tableData) {
        setCurrentTableHTML(tableData.htmlContent);
        setLastSavedData(JSON.parse(JSON.stringify(tableData)));
        
        try {
          const tableContent = [tableData.htmlContent];
          const tableNodes = Tabletools.contentToNodes(tableContent);
          setValue("tableNodes", tableNodes);

          const annotations = tableData?.annotationData?.annotations;
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
        } catch (error) {
          console.error('Error processing table:', error);
          setValue("tableNodes", []);
          setValue("annotations", []);
          setValue("extractedData", []);
          toast.error("Error processing table content. Check HTML structure.");
        }
      } else {
        setCurrentTableHTML("");
        setValue("tableNodes", []);
        setValue("annotations", []);
        setValue("extractedData", []);
      }
      setValue("selectedCells", {});
    } else {
      setCurrentTableHTML("");
      setValue("tableNodes", []);
      setValue("annotations", []);
      setValue("extractedData", []);
      setValue("selectedCells", {});
    }
  }, [state.tables, state.selectedTable]);

  useEffect(() => {
    if (state.selectedTable != null && state.tables[state.selectedTable]) {
      const tableData = state.tables[state.selectedTable];
      if (tableData && currentTableHtml !== tableData.htmlContent) {
        try {
          const tableContent = [currentTableHtml];
          const tableNodes = Tabletools.contentToNodes(tableContent);
          setValue("tableNodes", tableNodes);
          setValue(
            "extractedData",
            Tabletools.annotationsToTable(tableNodes, state.annotations || []),
          );
        } catch (error) {
          console.error('Error processing table update after HTML edit:', error);
        }
      }
    }
  }, [currentTableHtml]);

  useEffect(() => {
    if (state.selectedTable !== null && state.tables[state.selectedTable]) {
      saveTableChanges();
    }
  }, [state.tables, state.selectedTable]);

  useEffect(() => {
    if (state.annotations && state.selectedTable !== null) {
      const tableData = state.tables[state.selectedTable];
      if (tableData) {
        tableData.annotationData = { annotations: state.annotations };
        saveTableChanges();
      }
    }
  }, [state.annotations]);

  const options = Array.isArray(state.tables) ? state.tables.map((table, t) => {
    return { value: t, label: table.fileName };
  }) : [];

  var tbody = state.tableNodes.map((row, r) => {
    return (
      <tr key={"r" + r}>
        <TableTab orientation="row" index={r} />

        {row.map((cell, c) => {
          const annotations = Array.isArray(state.annotations) ? state.annotations : [];
          var groupsWithCell = annotations.map(an => Object.keys(an.concepts)).map(groupPositions => groupPositions.indexOf(r + "-" + c));

          var colour = annotations.filter((ann, a) =>
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
        state.tableNodes.length > 0 ? (
          <div className="flex flex-col p-5 pt-0">
            <div className="flex justify-end">
              <button 
                className="btn btn-primary mb-4" 
                onClick={() => setActiveTab("Edit Table")}
              >
                <Edit2 className="mr-2" /> Edit Table HTML
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="h-10">
                    <TableTab orientation="col" index={-1} />
                    {maxColumns > 0 && Array.from( { length: maxColumns }, (_, index) => index).map((col, c) => (
                      <TableTab key={"hcol-" + c} orientation="col" index={c} />
                    ))}
                  </tr>
                </thead>
                <tbody>{tbody}</tbody>
              </table>
            </div>
            <TableAnnotator />
          </div>
        ) : (
          <div className="text-center text-gray-300 p-10">
            <h2 className="text-xl font-semibold mb-4">
              This table cannot be displayed in the annotation dashboard
            </h2>
            <p className="text-sm">
              The table structure might be invalid or empty. Please select a valid table or edit the HTML.
            </p>
          </div>
        )
      );
      break;
    case "Edit Table":
      activeTabContent = (
        <TableHTMLEditor
          initialHtml={currentTableHtml}
          saveHtml={async (htmlContent) => {
            console.log(">>> saveHtml triggered in TablePage"); // Debug Log 1
            setCurrentTableHTML(htmlContent); // Update local state first

            // Update the table data in the main context state
            const updatedTables = [...state.tables];
            if (updatedTables[state.selectedTable]) {
              updatedTables[state.selectedTable].htmlContent = htmlContent;
              setValue("tables", updatedTables); 
            } else {
              toast.error("Cannot save: No table selected.");
              return; 
            }

            // Attempt to save the changes via the backend
            const success = await saveTableChanges(); 
            console.log(">>> saveTableChanges returned:", success); // Debug Log 2

            // Handle feedback and tab change based on save result
            if (success) {
              console.log(">>> Success: Switching tab to Annotation Dashboard"); // Debug Log 3
              toast.success("Table HTML saved successfully!");
              setActiveTab("Annotation Dashboard"); // Switch tab on success
            } else {
              console.log(">>> Failure: Not switching tab"); // Debug Log 4
              toast.error("Failed to save table HTML.");
              // Optional: Revert local HTML state if save failed?
              // setCurrentTableHTML(state.tables[state.selectedTable]?.htmlContent || ''); 
            }
          }}
        />
      );
      break;
    case "Extracted Data":
      activeTabContent = state.extractedData.length > 0 ? <TableResults /> : (
        <div className="text-center text-gray-300 p-10">
          <h2 className="text-xl font-semibold mb-4">No extracted data available</h2>
          <p className="text-sm">Extract data will appear here after annotations are made.</p>
        </div>
      );
      break;
    case "Metadata":
      activeTabContent = <MetadataViewer annotations={state.annotations} />;
      break;
    default:
      activeTabContent = <div>Select a tab</div>;
  }

  return (
    <SessionProvider>
      <Toaster position="top-center" reverseOrder={false} />
      <main className="min-h-screen bg-gray-900">
        <Header />
        <div className="flex justify-between p-5 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            {state.selectedTable !== null && state.tables[state.selectedTable] ? (
              <div className="text-white">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => router.push(`/collections/${state.tables[state.selectedTable].collectionId}`)}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Back to Collection
                  </button>
                  <div>
                    <h2 className="text-xl font-semibold">
                      {state.tables[state.selectedTable].fileName}
                    </h2>
                    <div className="text-sm text-gray-300">
                      <p>Collection: {state.tables[state.selectedTable].collectionId}</p>
                      <p>Created: {
                        (() => {
                          const createdAt = state.tables[state.selectedTable].createdAt;
                          try {
                            const date = new Date(createdAt);
                            if (isNaN(date.getTime())) {
                              return 'N/A';
                            }
                            return date.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                          } catch (error) {
                            console.error('Date parsing error:', error);
                            return 'N/A';
                          }
                        })()
                      }</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-white">
                <h2 className="text-xl font-semibold">No table selected</h2>
                <p className="text-sm text-gray-300">Select a table from the dropdown to view details</p>
              </div>
            )}

            <Select
              className="w-[600px]"
              options={options}
              onChange={async (value) => {
                setValue("selectedTable", value);
                if (value !== null && state.tables[value]) {
                  setCurrentCollectionId(state.tables[value].collectionId);
                }
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

        {state.selectedTable !== null ? (
          <div className="flex flex-col w-full">
            <div role="tablist" className="tabs tabs-lifted tabs-md bg-gray-800 border-b border-gray-700">
              {["Annotation Dashboard", "Extracted Data", "Metadata"].map(
                t => (
                  <a
                    role="tab"
                    key={t}
                    className={`tab no-underline text-gray-300 hover:text-white ${activeTab === t ? 'tab-active bg-gray-700 text-white' : 'hover:bg-gray-700'}`}
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
            <p>Select a table from the dropdown to get started</p>
          </div>
        )}

        <TableContexMenu />
      </main>
    </SessionProvider>
  );
}
