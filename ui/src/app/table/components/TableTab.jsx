"use client";
import React, { useState, useEffect, useRef } from "react";
import TableContexMenu from "./TableContexMenu";

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

  var className = "cursor-pointer hover:bg-yellow-200 hover:text-black bg-white "

  if (index > -1){
	  if ( orientation == "row" ) {
	  	className = className + "w-10 rounded-l-lg"
	  } else {
	  	className = className + "h-10 rounded-t-lg"
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
