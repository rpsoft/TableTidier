"use client";
import React, { useState, useEffect, useRef } from "react";
// import TableContexMenu from "./TableContexMenu";
//
import { useTableContext } from "../TableContext";

export default function TableTab({
  orientation,
  index,
}) {
  useEffect(() => {
    //const handleClick = () => setClicked(false);
    // window.addEventListener("click", handleClick);
    // return () => {
    //   window.removeEventListener("click", handleClick);
    // };
  }); // Interesting. This was removed:   }, []);

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

  const Tag = orientation === "row" ? "td" : "th";

  var className = "cursor-pointer hover:bg-yellow-200 hover:text-black bg-white "

  if (index > -1){
	  if ( orientation == "row" ) {
	  	className = className + " min-w-10 rounded-l-lg"
	  } else {
	  	className = className + " h-10 rounded-t-lg"
	  }
  } else {
  	className = "bg-none"
  }


  return (
    <Tag
      className={className}
      onContextMenu={(e) => {
						    e.preventDefault();
						    // setClicked(true);
						    // setPoints({
						    //   x: e.pageX,
						    //   y: e.pageY,
						    // });
						  }}
      onClick={(e) => {
        handleTabClick({ index, orientation, e });
      }}
    />
  );
}
