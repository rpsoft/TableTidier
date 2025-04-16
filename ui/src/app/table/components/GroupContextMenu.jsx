"use client";
import { useRef } from "react";
import React, { useState, useEffect } from "react";
import { ContextMenu } from "@/styles/styles";

import { useTableContext } from "../TableContext";

export default function GroupContextMenu({}) {
  const { state, setValue } = useTableContext();

  const setTableNodes = (tableNodes) => setValue("tableNodes", tableNodes);
  const tableNodes = state.tableNodes;
  const tableClickPosition = state.tableClickPosition;

  const groupContextData = state.groupContextData;

  var cellContent = "";
  try {
    cellContent =
      tableNodes.length > 0
        ? tableNodes[tableClickPosition[0]][tableClickPosition[1]]
        : "";
  } catch (e) {
    console.log(
      "selection for the context menu is out of bounds. You probably deleted the last row.",
    );
  }
  if (!state.groupContextOpen) {
    return null;
  }

  return (
    <>
      <ContextMenu
        $top={state.cellContextPoints.y}
        $left={state.cellContextPoints.x}
      >
        <ul>
          <li
            onClick={() => {
              var newAnnotations = state.annotations
                .filter((ann) => ann.id !== state.groupContextIndex);

              setValue("annotations", newAnnotations);
            }}
          >
            Delete
          </li>
        </ul>
      </ContextMenu>
    </>
  );
}
