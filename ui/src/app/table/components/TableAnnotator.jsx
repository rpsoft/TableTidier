"use client";
import React, { useState, useEffect, useRef } from "react";
import SortableList from "./SortableList";

import GroupContextMenu from "./GroupContextMenu";
import ColourContextSelector from "./ColourContextSelector";

import { useTableContext } from "../TableContext";
import Tabletools from "../tableTools";
import { Col } from "antd";

export default function TableAnnotator({}) {
  const { state, setValue } = useTableContext();

  const [ annotations, setAnnotations ] = useState( [] )

  useEffect(() => {
    setAnnotations(state.annotations.map((group, g) => {

      return {
      		... group,
        	concepts: Object.values(group.concepts).reduce((acc, ann, a) => {
	          if (ann.content.length > 0) {
	            acc[Object.keys(group.concepts)[a]] = ann;
	          }
	          return acc;
	        }, {})
      };
    }));

  }, [state.annotations]);



  const structuredTable = state.structuredTable;

  const [groupedConcepts, setGroupedConcepts] = useState([]);
  const [conceptsCategory, setConceptsCategory] = useState("characteristic");

  const defaultConceptColors = [
    "#FF9999", // Pastel Red
    "#99FF99", // Pastel Green
    "#9999FF", // Pastel Blue
    "#FFFF99", // Pastel Yellow
    "#FF99FF", // Pastel Magenta
    "#99FFFF", // Pastel Cyan
    "#D98B8B", // Pastel Maroon
    "#D9D98B", // Pastel Olive
    "#8BD9D9", // Pastel Teal
    "#D98BD9"  // Pastel Purple
  ];

  const groupConcepts = () => {
    const concepts = state.selectedCells;

    const newAnnotations = [
      ...annotations,
      {
        id: annotations.length,
        concepts,
        category: conceptsCategory,
        color: defaultConceptColors[annotations.length] || "#ffffff"
      },
    ];
    setValue("annotations", newAnnotations);
    setValue(
      "extractedData",
      Tabletools.annotationsToTable(state.tableNodes, newAnnotations),
    );

    setValue("selectedCells", {});
  };

  const sortAnnotations = (newAnnotations) => {
    setValue("annotations", newAnnotations);
    setValue(
      "extractedData",
      Tabletools.annotationsToTable(state.tableNodes, newAnnotations),
    );
  };

  const anyContentSelected = Object?.values(state.selectedCells)?.map( sel => sel.content )?.join("")?.trim()?.length > 0 || false

  return (
    <>
      { (anyContentSelected && Object.keys(state.selectedCells).length > 0) ? (
        <div className="shrink-0 justify-center items-center text-white m-2 border-2 rounded-md p-2 h-fit ">
          <input
            type="text"
            placeholder="Name this group... "
            className="input input-bordered w-full max-w-xs mb-1"
					  onChange={(e) => { setConceptsCategory(e.target.value)}}
          />
          <div className="font-bold m-2"> Selection: </div>
          {Object.keys(state.selectedCells)
            .sort((a, b) => {
              // Order by key (which is a combination of row and column numbers.)
              var A = a.split("-");
              var B = b.split("-");
              return A[0] == B[0] ? A[1] >= B[1] : A[0] >= B[0];
            })
            .map((key) => {
              return (
                <div key={"sel_" + key} className="m-4 mt-0 mb-0">
                  {state.selectedCells[key].content}
                </div>
              );
            })}

          {Object.keys(state.selectedCells).length > 0 ? (
            <>
              <div className="flex justify-end mt-2 border-t pt-2">
                <button className="btn btn-outline" onClick={groupConcepts}>
                  Group Concepts
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : (
        ""
      )}

      <div className="min-h-48">
	      <SortableList
	        groupedConcepts={annotations}
	        setGroupedConcepts={sortAnnotations}
	      />
      </div>

      <GroupContextMenu />
      <ColourContextSelector />

    </>
  );
}
