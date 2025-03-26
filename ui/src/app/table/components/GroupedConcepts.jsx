"use client";
import React, { useState, useRef, useEffect } from "react";
import { TwitterPicker } from "react-color";
import { useTableContext } from "../TableContext";

export default function GroupedConcepts({ item }) {

  const { state, setValue } = useTableContext();


  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null); // Ref to track the color picker

  return (
    <div
      className="shrink-0 justify-center items-center text-white  rounded-md p-1 relative w-52"
      onContextMenu={(e) => {
        e.preventDefault();
        setValue("cellContextPoints", { x: e.pageX, y: e.pageY });
        setValue("groupContextOpen", true);
        setValue("groupContextData", item.concepts);
        setValue("groupContextIndex", item.id);
      }}
    >
      {/* Color Picker Container */}
      <div className="relative flex" ref={pickerRef}>



        <div
          className="w-5 h-5 rounded-full border border-gray-300 mb-2 mr-1 mt-1"
          style={{
            backgroundColor: item.color,
            cursor: "pointer",
          }}
				  onClick={(e) => {
							setValue("cellContextPoints", { x: e.pageX, y: e.pageY })
							setValue("colourSelectGroup", item);
							e.stopPropagation();}}
        >

        </div>

        <div className="pt-[0.15rem]"> {item.category} </div>
        {/* {"color here: "+ state.annotations[item.id].color}
        {"color here: "+ item.color} */}
      </div>

      <hr />
      <div className=" h-48 mt-1 overflow-y-scroll">
	      {Object.values(item.concepts).map((concept, c) => (
	        <div key={"concept_" + c}>{concept.content}</div>
	      ))}
      </div>
    </div>
  );
}
