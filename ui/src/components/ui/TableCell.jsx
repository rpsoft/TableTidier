"use client";
import React, { useState, useEffect, useRef } from "react";
import TableContexMenu from "@/components/ui/TableContexMenu";



export default function TableCell( { content, setClicked, setPoints } ) {
   

  useEffect(() => {
    const handleClick = () => setClicked(false);
    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
    };
  }, []);
  

  return (
    <td
      onContextMenu={(e) => {
        e.preventDefault();
        setClicked(true);
        setPoints({
          x: e.pageX,
          y: e.pageY,
        });
        console.log("Right Click", e.pageX, e.pageY);
      }}>
      {content}

    </td>
  );
}