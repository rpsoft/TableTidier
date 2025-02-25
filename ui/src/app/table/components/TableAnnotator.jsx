"use client";
import React, { useState, useEffect, useRef } from "react";
// import SortableList, { SortableItem } from "react-easy-sort";
//
import SortableList from "./SortableList";

import GroupContextMenu from "./GroupContexMenu";
import { useTableContext } from "../TableContext";
import Tabletools from "../tableTools";
import GroupedConcepts from "./GroupedConcepts";

export default function TableAnnotator({}) {
  const { state, setValue } = useTableContext();

  const annotations = state.annotations.map((group, g) => {
    return {
      id: g,
      category: group.category,
      concepts: Object.values(group.concepts).reduce((acc, ann, a) => {
        if (ann.content.length > 0) {
          acc[Object.keys(group.concepts)[a]] = ann;
        }
        return acc;
      }, {}),
    };
  });

  const structuredTable = state.structuredTable;

  // debugger;
  const [groupedConcepts, setGroupedConcepts] = useState([]);

  const groupConcepts = () => {
    const concepts = state.selectedCells;

    const newAnnotations = [
      ...annotations,
      {
        id: annotations.length + "",
        concepts,
        category: "characteristic",
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

  return (
    <>
      {Object.keys(state.selectedCells).length > 0 ? (
        <div className="shrink-0 justify-center items-center text-white m-2 border-2 rounded-md p-2 h-fit ">
          <input
            type="text"
            placeholder="characteristic"
            className="input input-bordered w-full max-w-xs mb-1"
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

      <SortableList
        groupedConcepts={annotations}
        setGroupedConcepts={sortAnnotations}
      />

      <GroupContextMenu />

      <div>
        <table>
          <tbody>
            {state.extractedData.map((ex, e) => {
              return (
                <tr key={"ex_" + e}>
                  {ex.map((cell, c) => {
                    // debugger
                    // if ( cell === null){
                    // 	console.log(ex)
                    // 	debugger
                    // // }
                    // if ( (cell != null) && cell.concepts.length > 0 )
                    //  debugger

                    return (
                      <td key={"ex_" + e + "_" + c}>
                        {cell != null &&
                        cell.concepts.length > 0 &&
                        cell.cellData.length > 0 ? (
                          <div className="dropdown dropdown-hover dropdown-right">
                            <div
                              tabIndex={0}
                              role="button"
                              className="btn m-[1px] py-0 min-h-4 h-6"
                            >
                              {cell.cellData}
                            </div>
                            <ul
                              tabIndex={0}
                              className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
                            >
                              {cell.concepts.map((c, op) => (
                                <li key={"char_" + op}>{c.content} </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          ""
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
