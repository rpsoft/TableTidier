"use client";
import React, { useState, useRef, useEffect } from "react";
import { TwitterPicker } from "react-color";
import { useTableContext } from "../TableContext";

export default function GroupedConcepts({ item }) {
  const { state, setValue } = useTableContext();
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null); // Ref to track the color picker

  return (
    <div className="shrink-0 justify-center items-center text-white rounded-md p-1 relative w-full">
      <div className="h-56 overflow-y-scroll">
        {Object.entries(item.concepts).map(([key, concept], index) => (
          <div key={`concept_${item.id}_${key}_${index}`}>{concept.content}</div>
        ))}
      </div>
    </div>
  );
}
