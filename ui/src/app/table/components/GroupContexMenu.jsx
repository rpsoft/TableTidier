"use client";
import { useRef } from "react";
import React, { useState, useEffect } from "react";
import { ContextMenu } from "@/styles/styles";
import TableOperations from "../tableEdit";
import { useTableContext } from "../TableContext";

export default function GroupContexMenu({}) {
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
        top={state.cellContextPoints.y}
        left={state.cellContextPoints.x}
      >
        {Object.values(groupContextData).map((concept, c) => (
          <div key={"concept" + "_" + c}>{concept.content}</div>
        ))}
      </ContextMenu>
    </>
  );
}
