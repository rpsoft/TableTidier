"use client";
import React, { useState, useEffect, useRef } from "react";
import TableContexMenu from "@/components/ui/TableContexMenu";

export default function TableCell({
  content,
  tablePosition,
  setClicked,
  setPoints,
  handleCellClick,
  selected,
  // setCellContent,
  // setTableClickPosition,
  // addToSelection,
}) {
  useEffect(() => {
    const handleClick = () => setClicked(false);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }); // Interesting. This was removed:   }, []);

  return (
    <td
      className={
        "cursor-pointer hover:bg-yellow-200 hover:text-black " +
        (selected ? "bg-yellow-300" : "")
      }
      onContextMenu={(e) => {
        e.preventDefault();
        setClicked(true);
        setPoints({
          x: e.pageX,
          y: e.pageY,
        });

        handleCellClick({ content, tablePosition, e });
        // setCellContent(content);
        // setTableClickPosition(tablePosition);

        // console.log("Right Click", e.pageX, e.pageY);
      }}
      onClick={(e) => {
        handleCellClick({ content, tablePosition, e });
      }}
    >
      {content}
    </td>
  );
}
