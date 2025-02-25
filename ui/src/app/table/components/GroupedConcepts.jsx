"use client";
import React, { useState, useEffect, useRef } from "react";
import TableContexMenu from "./TableContexMenu";
import { useTableContext } from "../TableContext";

export default function GroupedConcepts({
  item,
  // addToSelection,
}) {
  const { state, setValue } = useTableContext();
  // debugger;
  return (
    <div
      className="shrink-0 justify-center items-center bg-blue-400
												text-white m-2 cursor-grab border-2 rounded-md p-2 h-fit"
      onContextMenu={(e) => {
        e.preventDefault();

        setValue("cellContextPoints", {
          x: e.pageX,
          y: e.pageY,
        });

        setValue("groupContextOpen", true);
        setValue("groupContextData", item.concepts);
        setValue("groupContextIndex", item.id);
      }}
    >
      <div>{item.category}</div>
      <hr />
      {Object.values(item.concepts).map((concept, c) => (
        <div key={"concept_" + c}>{concept.content}</div>
      ))}
    </div>
  );
}
