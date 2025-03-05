"use client";
import { Select, Table } from "antd";

import UploadTable from "@/components/ui/UploadTable";
import TableCell from "./components/TableCell";
import TableTab from "./components/TableTab";
import TableContexMenu from "./components/TableContexMenu";
import TableAnnotator from "./components/TableAnnotator";
import TableResults from "./components/TableResults";

import Tabletools from "./tableTools";

import { getTable, getAllTables, uploadTable, updateTable } from "./actions";
import { useState, useEffect, useContext, createContext } from "react";

import { useTableContext } from "./TableContext";
import UpdateTableButton from "./components/UpdateTableButton";
import TableHTMLEditor from "./components/TableHTMLEditor";

// CREATE-ISSUE: Title="Fix Vue Component" Description="This Vue component needs better error handling."

// import React from "react";
export default function TablePage() {
  const { state, setValue } = useTableContext();

  const refreshTables = async () => {
    getAllTables().then((tables) => {
      setValue("tables", tables);
    });
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
  }); // Interesting. This was removed:   }, []);

  useEffect(() => {
    refreshTables();
  }, []);



  const [ currentTableHtml, setCurrentTableHTML ] = useState("")

  const [ activeTab, setActiveTab ] = useState("dashboard")

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
    // debugger;

    const tableData = state.tables[state.selectedTable];
    const annotations = tableData?.annotationData?.annotations;

    var currentTableHtml = parseInt(state.selectedTable) > -1 ? state.tables[state.selectedTable].htmlContent : ""
    setCurrentTableHTML(currentTableHtml)
    // debugger;

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

  const options = state.tables.map((tables, t) => {
    return { value: t, label: tables.fileName };
  });

  var tbody = state.tableNodes.map((row, r) => {
    return (
      <tr key={"r" + r}>
        <TableTab orientation="row" index={r} />

        {row.map((cell, c) => {

        	// debugger

          var groupsWithCell = state.annotations.map( an => Object.keys(an.concepts) ).map( groupPositions => groupPositions.indexOf(r + "-" + c) )

          var colour = state.annotations.filter( (ann, a) =>
                  groupsWithCell[a] > -1
              ).map( g => g.color).join()

          return (
            <TableCell
				  key={"cell_" + r + "_" + c}
				  content={cell}
				  tablePosition={[r, c]}
				  colour={ colour }
            ></TableCell>
          );
        })}
      </tr>
    );
  });

  var maxColumns = Math.max(...state.tableNodes.map((r) => r.length));
  // debugger;
  // console.log(maxColumns);
  //
  //
   const tabActive = "text-white border-b-white border-b-2"

	var activeTabContent;

	switch(activeTab){

		case "dashboard":
			activeTabContent = <div className="flex p-5">
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
			  	</div>
			break
		case "edit-table":
			activeTabContent = <TableHTMLEditor
				initialHtml={currentTableHtml}
				saveHtml={(htmlContent) => {
					var allTables = state.tables

					allTables[state.selectedTable].htmlContent = htmlContent

					setValue("tables", allTables);
				}}
			/>
			break
		case "results":
			activeTabContent =  <TableResults />
			break


	}

// debugger
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
          onChange={async (value) => {
            setValue("selectedTable", value);
          }}
        />

        <UpdateTableButton refreshTables={refreshTables} />
      </div>



      <div className="flex flex-col w-full">

	      <div role="tablist" className="tabs tabs-lift tabs-xl">
			<a role="tab" className={"tab "+ (activeTab === "dashboard" ? tabActive : "")} onClick={() => { setActiveTab("dashboard") }}>Dashboard</a>
			<a role="tab" className={"tab "+ (activeTab === "edit-table" ? tabActive : "")} onClick={() => { setActiveTab("edit-table") }}>Edit Table</a>
	        <a role="tab" className={"tab "+ (activeTab === "results" ? tabActive : "")} onClick={() => { setActiveTab("results") }}>Extracted Data</a>
	      </div>

			  {activeTabContent}
		</div>


		<TableContexMenu />


    </main>
  );
}
