"use client";
import React, { useState, useEffect, useRef } from "react";
import TableContexMenu from "@/components/ui/TableContexMenu";

export default function TableCell({
  content,
  tablePosition,
  setClicked,
  setPoints,
  handleCellClick,
  setCellContent,
  setTableClickPosition,
  selectedCells
  // addToSelection,
}) {
  useEffect(() => {
    const handleClick = () => setClicked(false);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }); // Interesting. This was removed:   }, []);

  const [selected, setSelected] = useState(false)

	useEffect(() => {
		var key = tablePosition[0]+"-"+tablePosition[1]
		setSelected(selectedCells.indexOf(key) > -1)
	}, [selectedCells, tablePosition])
// debugger

  return (
    <td
      className={
        "cursor-pointer hover:bg-yellow-200 hover:text-black min-w-5 " +
        (selected ? " bg-yellow-100 opacity-80 select-none text-black" : "")
      }
      onContextMenu={(e) => {
        e.preventDefault();
        setClicked(true);
        setPoints({
          x: e.pageX,
          y: e.pageY,
        });

        setCellContent(content)
        setTableClickPosition(tablePosition)

      }}

      onClick={(e) => {
        handleCellClick({ content, tablePosition, e });
      }}

    >
      {content}
    </td>
  );
}
