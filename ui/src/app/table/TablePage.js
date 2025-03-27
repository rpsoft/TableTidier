"use client";
import { Select, Table } from "antd";
import { SessionProvider } from 'next-auth/react';

import UploadTable from "@/components/ui/UploadTable";
import TableCell from "./components/TableCell";
import TableTab from "./components/TableTab";
import TableContexMenu from "./components/TableContexMenu";
import TableAnnotator from "./components/TableAnnotator";
import TableResults from "./components/TableResults";
import Header from "@/components/ui/header";

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
  });

  useEffect(() => {
    refreshTables();
  }, []);

  const [ currentTableHtml, setCurrentTableHTML ] = useState("")
  const [ activeTab, setActiveTab ] = useState("Annotation Dashboard")

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

    var currentTableHtml = parseInt(state.selectedTable) > -1 ? state.tables[state.selectedTable].htmlContent : ""
    setCurrentTableHTML(currentTableHtml)

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

   const tabActive = " tab-active text-white border-b-white border-b-2"

	var activeTabContent;

	switch(activeTab){

		case "Annotation Dashboard":
			activeTabContent = <div className="flex flex-col p-5">
				  <div>
					  <table>
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
			break
		case "Edit Table":
			activeTabContent = <TableHTMLEditor
				initialHtml={currentTableHtml}
				saveHtml={(htmlContent) => {
					var allTables = state.tables

					allTables[state.selectedTable].htmlContent = htmlContent

					var tableNodes = Tabletools.contentToNodes([htmlContent]);

					if ( allTables[state.selectedTable].annotationData ){
						var refreshedAnnotations = allTables[state.selectedTable].annotationData.annotations.map( annotation => {
						    annotation.concepts = Object.keys(annotation.concepts).reduce( (acc, conceptKey) => {

								var row = annotation.concepts[conceptKey].tablePosition[0]
								var col = annotation.concepts[conceptKey].tablePosition[1]
								var newContent = tableNodes[row][col]
								annotation.concepts[conceptKey].content = newContent
						        acc[conceptKey] = annotation.concepts[conceptKey]

						        return acc
						    }, {})
						    return annotation
						})

						allTables[state.selectedTable].annotationData.annotations = refreshedAnnotations;
					}

					setValue("tables", allTables);

					document.getElementById("updateTableButton").click();
				}}
			/>
			break
		case "Extracted Data":
			activeTabContent =  <TableResults />
			break


	}

// debugger
  return (

   <SessionProvider>
    <main>

    	<Header />
		<div className="flex justify-between p-5 bg-gray-800">
			<div>
				<button className="btn btn-sm mr-2" onClick={()=>document.getElementById('upload_table_modal').showModal()}>Upload Table</button>
				<dialog id="upload_table_modal" className="modal">
				  <div className="modal-box">

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
				    }}
				/>
			</div>

			<div>
				<UpdateTableButton refreshTables={refreshTables} />
			</div>
		</div>



			  {
				 state.selectedTable ?
				  <div className="flex flex-col w-full">

					  <div role="tablist" className="tabs tabs-lift tabs-md *:bg-gray-600 mt-2">
						  {
							  ["Annotation Dashboard", "Edit Table", "Extracted Data"].map(
								  t => <a role="tab"
									  key={t}
									  className={"tab  no-underline " + (activeTab === t ? tabActive : "")}
									  onClick={
										  () => { setActiveTab(t) }
									  }>
									  {t}
								  </a>
							  )
						  }
					  </div>
					  {activeTabContent}
				  </div> : <div className="p-10 font-bold"> Upload or select a table above </div>
			  }

		<TableContexMenu />

    </main>
   </SessionProvider>
  );
}
