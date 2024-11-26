"use client";
import React, { useState, useEffect, useRef } from "react";
import TableContexMenu from "@/components/ui/TableContexMenu";
import { ContextMenu } from "../../styles/styles";


export default function TableCell( { content } ) {
   
  const [clicked, setClicked] = useState(false);
  const [points, setPoints] = useState({
    x: 0,
    y: 0,
  });
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
      {clicked && (
            <ContextMenu top={points.y} left={points.x}>
            <ul>
                <li>Edit</li>
                <li>Copy</li>
                <li>Delete</li>
            </ul>
            </ContextMenu>
        )}
    </td>
  );
}