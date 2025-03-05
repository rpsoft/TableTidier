"use client";
import React, { useState, useEffect } from "react";
import { ContextMenu } from "@/styles/styles";
import { useTableContext } from "../TableContext";
import { TwitterPicker } from "react-color";

export default function ColourContextSelector({}) {
  const { state, setValue } = useTableContext();

  const handleColourChange = (color) => {

    var annotations = state.annotations

    annotations.find(({id}) => id === state.colourSelectGroup.id).color = color.hex;

    setValue("annotations", [...annotations ] )
    setValue("colourSelectGroup", null )

  };

  if (!state.colourSelectGroup) {
    return null;
  }

  return (
    <>
      <ContextMenu
        $top={state.cellContextPoints.y+15}
        $left={state.cellContextPoints.x-20}
      >
	    <TwitterPicker className="z-10" color={state?.colourSelectGroup?.color || "#ffffff"} onChange={handleColourChange} />
      </ContextMenu>
    </>
  );
}
