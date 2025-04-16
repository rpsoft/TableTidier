"use client";
import React, { useState, useEffect, useRef } from "react";
import SortableList from "./SortableList";
import { Edit2, Check } from "lucide-react";

import GroupContextMenu from "./GroupContextMenu";
import ColourContextSelector from "./ColourContextSelector";

import { useTableContext } from "../TableContext";
import Tabletools from "../tableTools";
import { Col } from "antd";

export default function TableAnnotator({}) {
  const { state, setValue } = useTableContext();

  const [ annotations, setAnnotations ] = useState( [] )
  const [ editingGroup, setEditingGroup] = useState(null);
  const [ selectedConcepts, setSelectedConcepts] = useState(new Set());

  useEffect(() => {
    setAnnotations(state.annotations.map((group, g) => {
      return {
      		... group,
        	concepts: Object.values(group.concepts).reduce((acc, ann, a) => {
	          if (ann.content.length > 0) {
	            acc[Object.keys(group.concepts)[a]] = ann;
	          }
	          return acc;
	        }, {})
      };
    }));
  }, [state.annotations]);

  const structuredTable = state.structuredTable;

  const [groupedConcepts, setGroupedConcepts] = useState([]);
  const [conceptsCategory, setConceptsCategory] = useState("characteristic");

  const defaultConceptColors = [
    "#FF9999", // Pastel Red
    "#99FF99", // Pastel Green
    "#9999FF", // Pastel Blue
    "#FFFF99", // Pastel Yellow
    "#FF99FF", // Pastel Magenta
    "#99FFFF", // Pastel Cyan
    "#D98B8B", // Pastel Maroon
    "#D9D98B", // Pastel Olive
    "#8BD9D9", // Pastel Teal
    "#D98BD9"  // Pastel Purple
  ];

  const startEditingGroup = (group) => {
    setEditingGroup(group);
    // Move the group's concepts to the selection area
    const newSelectedCells = {};
    Object.entries(group.concepts).forEach(([key, concept]) => {
      newSelectedCells[key] = {
        ...concept,
        isEditing: true // Add a flag to indicate this cell is being edited
      };
    });
    setValue("selectedCells", newSelectedCells);
    setConceptsCategory(group.category);
  };

  const handleSaveChanges = () => {
    if (!editingGroup) return;

    if (Object.keys(state.selectedCells).length === 0) {
      // If no cells are selected, remove the group
      const newAnnotations = state.annotations.filter(ann => ann.id !== editingGroup.id);
      setValue("annotations", newAnnotations);
      setValue(
        "extractedData",
        Tabletools.annotationsToTable(state.tableNodes, newAnnotations),
      );
    } else {
      // Create a new group with the current selection
      const newGroup = {
        id: editingGroup.id,
        concepts: state.selectedCells,
        category: conceptsCategory,
        color: editingGroup.color
      };

      // Update the annotations array
      const newAnnotations = state.annotations.map(ann => 
        ann.id === editingGroup.id ? newGroup : ann
      );

      setValue("annotations", newAnnotations);
      setValue(
        "extractedData",
        Tabletools.annotationsToTable(state.tableNodes, newAnnotations),
      );
    }

    setEditingGroup(null);
    setValue("selectedCells", {});
  };

  const handleCancelEdit = () => {
    setEditingGroup(null);
    setValue("selectedCells", {});
  };

  const groupConcepts = () => {
    const concepts = state.selectedCells;

    // Find the first unused color
    const usedColors = new Set(annotations.map(ann => ann.color));
    const availableColor = defaultConceptColors.find(color => !usedColors.has(color)) || "#ffffff";

    const newAnnotations = [
      ...annotations,
      {
        id: Date.now(),
        concepts,
        category: conceptsCategory,
        color: availableColor
      },
    ];
    setValue("annotations", newAnnotations);
    setValue(
      "extractedData",
      Tabletools.annotationsToTable(state.tableNodes, newAnnotations),
    );

    setValue("selectedCells", {});
  };

  const sortAnnotations = (newAnnotations) => {
    setValue("annotations", newAnnotations);
    setValue(
      "extractedData",
      Tabletools.annotationsToTable(state.tableNodes, newAnnotations),
    );
  };

  const anyContentSelected = Object?.values(state.selectedCells)?.map( sel => sel.content )?.join("")?.trim()?.length > 0 || false

  return (
    <>
      { ((anyContentSelected && Object.keys(state.selectedCells).length > 0) || editingGroup) ? (
        <div 
          className="shrink-0 justify-center items-center text-white m-2 border-2 rounded-md p-2 h-fit"
          style={{ 
            borderColor: editingGroup ? editingGroup.color : '',
            backgroundColor: editingGroup ? `${editingGroup.color}0D` : ''
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              placeholder="Name this group... "
              className="input input-bordered w-full max-w-xs"
              onChange={(e) => { setConceptsCategory(e.target.value)}}
              value={conceptsCategory}
            />
            {editingGroup && (
              <span className="font-bold" style={{ color: editingGroup.color }}>Editing: {editingGroup.category}</span>
            )}
          </div>
          <div className="font-bold m-2"> Selection: </div>
          {Object.keys(state.selectedCells)
            .sort((a, b) => {
              var A = a.split("-");
              var B = b.split("-");
              return A[0] == B[0] ? A[1] >= B[1] : A[0] >= B[0];
            })
            .map((key) => {
              return (
                <div key={"sel_" + key} className="m-4 mt-0 mb-0">
                  {state.selectedCells[key].content}
                </div>
              );
            })}
          {Object.keys(state.selectedCells).length === 0 && editingGroup && (
            <div className="text-gray-500 italic m-4 mt-0 mb-0">
              No cells selected. Click on cells to add them to this group.
            </div>
          )}

          <div className="flex justify-end mt-2 border-t pt-2" style={{ borderColor: editingGroup ? editingGroup.color : '' }}>
            {editingGroup ? (
              <>
                <button className="btn btn-outline mr-2" onClick={handleCancelEdit}>
                  Cancel
                </button>
                <button 
                  className="btn" 
                  onClick={handleSaveChanges}
                  style={{ 
                    backgroundColor: editingGroup.color,
                    borderColor: editingGroup.color,
                    color: 'white'
                  }}
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button className="btn btn-outline" onClick={groupConcepts}>
                Group Concepts
              </button>
            )}
          </div>
        </div>
      ) : (
        ""
      )}

      <div className="min-h-48">
	      <SortableList
	        groupedConcepts={annotations}
	        setGroupedConcepts={sortAnnotations}
          onEditGroup={startEditingGroup}
          editingGroup={editingGroup}
	      />
      </div>

      <GroupContextMenu />
      <ColourContextSelector />
    </>
  );
}
