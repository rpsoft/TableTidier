"use client";
import React, { useState, useEffect, useRef } from "react";
import TableContexMenu from "./TableContexMenu";
import { useTableContext } from "../TableContext";

export default function TableCell({
  content,
  tablePosition,
  handleCellClick,
  // addToSelection,
}) {

  const { state, setValue } = useTableContext();


  const selectedCells = Object.keys(state.selectedCells)

  useEffect(() => {
    const handleClick = () => setValue( "cellContextOpen", false );
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

  return (
    <td
      className={
        "cursor-pointer hover:bg-yellow-200 hover:text-black min-w-5 " +
        (selected ? " bg-yellow-100 opacity-80 select-none text-black" : "")
      }
      onContextMenu={(e) => {

        e.preventDefault();
        setValue( "clicked", true );
        setValue( "cellContextPoints", {
          x: e.pageX,
          y: e.pageY,
        } );

        setValue( "cellContextOpen", true )
        setValue( "tableClickPosition", tablePosition )

      }}

      onClick={(e) => {
        handleCellClick({ content, tablePosition, e });
      }}

    >
      {content}
    </td>
  );
}
