"use client";
import React, { useState, useEffect, useRef } from "react";
import SortableList from "./SortableList";
import { Edit2, Check, Trash2 } from "lucide-react";

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
    // Initialize selected cells with the group's current cells
    const newSelectedCells = {};
    
    // Check if group has cells array, if not use concepts
    const cells = group.cells || Object.entries(group.concepts).map(([key, concept]) => {
      const [row, col] = key.split('-').map(Number);
      return [row, col];
    });

    cells.forEach(([row, col]) => {
      const key = `${row}-${col}`;
      newSelectedCells[key] = {
        tablePosition: [row, col],
        content: state.tableNodes[row][col]
      };
    });

    setValue("selectedCells", newSelectedCells);
    setConceptsCategory(group.category);
  };

  const handleSaveChanges = () => {
    if (!editingGroup) return;

    const selectedCells = state.selectedCells;
    const selectedCellPositions = Object.values(selectedCells).map(
      (cell) => cell.tablePosition
    );

    if (selectedCellPositions.length === 0) {
      // If no cells are selected, delete the group
      const updatedAnnotations = state.annotations.filter(
        (group) => group.id !== editingGroup.id
      );
      setValue("annotations", updatedAnnotations);
      setValue("extractedData", {
        ...state.extractedData,
        annotations: updatedAnnotations,
      });
    } else {
      // Update the group with the new selection
      const updatedAnnotations = state.annotations.map((group) => {
        if (group.id === editingGroup.id) {
          // Create a new group with updated cells
          return {
            ...group,
            cells: selectedCellPositions,
            concepts: selectedCellPositions.reduce((acc, [row, col]) => {
              const key = `${row}-${col}`;
              acc[key] = {
                content: state.tableNodes[row][col],
                tablePosition: [row, col]
              };
              return acc;
            }, {})
          };
        }
        return group;
      });

      setValue("annotations", updatedAnnotations);
      setValue("extractedData", {
        ...state.extractedData,
        annotations: updatedAnnotations,
      });
    }

    // Clear editing state
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
              <>
                <span className="font-bold" style={{ color: editingGroup.color }}>Editing: {editingGroup.category}</span>
                <button 
                  className="btn btn-ghost btn-sm ml-auto" 
                  onClick={() => {
                    const newAnnotations = state.annotations.filter(ann => ann.id !== editingGroup.id);
                    setValue("annotations", newAnnotations);
                    setValue(
                      "extractedData",
                      Tabletools.annotationsToTable(state.tableNodes, newAnnotations),
                    );
                    setEditingGroup(null);
                    setValue("selectedCells", {});
                  }}
                  style={{ color: editingGroup.color }}
                >
                  <Trash2 size={16} />
                </button>
              </>
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

      <ColourContextSelector />
    </>
  );
}
