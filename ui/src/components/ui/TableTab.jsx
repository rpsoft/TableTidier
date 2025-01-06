"use client";
import React, { useState, useEffect, useRef } from "react";
import TableContexMenu from "@/components/ui/TableContexMenu";

export default function TableTab({
  orientation,
  index,
  handleTabClick,
}) {
  useEffect(() => {
    //const handleClick = () => setClicked(false);
    // window.addEventListener("click", handleClick);
    // return () => {
    //   window.removeEventListener("click", handleClick);
    // };
  }); // Interesting. This was removed:   }, []);

  const Tag = orientation === "row" ? "td" : "th";

  return (
    <Tag
      className={"cursor-pointer hover:bg-yellow-200 hover:text-black "+ (orientation == "row" ? "w-10" : "h-10")}
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
