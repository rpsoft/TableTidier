"use client";
import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  rectIntersection,
  pointerWithin,
  getFirstCollision,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit2, Plus, Trash2 } from "lucide-react";

import GroupedConcepts from "./GroupedConcepts";

const SortableItem = ({ id, item, onEditGroup, editingGroup }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-64 p-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
    >
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div 
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-700 rounded"
            {...attributes}
            {...listeners}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="5" r="1"></circle>
              <circle cx="9" cy="12" r="1"></circle>
              <circle cx="9" cy="19" r="1"></circle>
              <circle cx="15" cy="5" r="1"></circle>
              <circle cx="15" cy="12" r="1"></circle>
              <circle cx="15" cy="19" r="1"></circle>
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm">{item.category}</span>
          </div>
          <button 
            className="btn btn-xs"
            onClick={(e) => {
              e.stopPropagation();
              onEditGroup(item);
            }}
          >
            <Edit2 size={14} />
          </button>
        </div>
        <hr className="border-gray-700 mb-2" />
        <div className="flex-1">
          <GroupedConcepts item={item} />
        </div>
      </div>
    </div>
  );
};

const DroppableContainer = ({ id, children, isOver, onDeleteRow, rowIndex, canDelete, rowContent }) => {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div className="relative">
      <div
        ref={setNodeRef}
        className={`flex space-x-4 p-4 border rounded-md h-80 ${
          isOver ? 'border-primary bg-primary/10' : 'border-gray-700'
        }`}
      >
        {children}
      </div>
      {canDelete && (!rowContent || rowContent.length === 0) && (
        <button
          onClick={() => onDeleteRow(rowIndex)}
          className="absolute top-2 right-2 btn btn-xs btn-error"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
};

const SortableList = ({ groupedConcepts, setGroupedConcepts, onEditGroup, editingGroup }) => {
  const [activeId, setActiveId] = useState(null);
  const [isOverDropZone, setIsOverDropZone] = useState(false);
  const [rows, setRows] = useState([[]]); // Start with one empty row
  const [groupRowMap, setGroupRowMap] = useState(new Map()); // Track which row each group belongs to
  const lastOverId = useRef(null);
  const activeRowRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const collisionDetectionStrategy = useCallback(
    (args) => {
      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0
          ? pointerIntersections
          : rectIntersection(args);
      let overId = getFirstCollision(intersections, 'id');

      if (overId != null) {
        lastOverId.current = overId;
        return [{id: overId}];
      }

      return lastOverId.current ? [{id: lastOverId.current}] : [];
    },
    []
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    // Find which row the dragged item is in
    const draggedGroup = groupedConcepts.find(item => item.id === event.active.id);
    if (draggedGroup) {
      activeRowRef.current = groupRowMap.get(draggedGroup.id);
    }
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over || !over.id) return;

    console.log("drag over", over)

    setIsOverDropZone(false);

    // debugger
    // If dropping on a row container
    if (typeof over.id === 'string' && over.id.startsWith('row-')) {
      const targetRowIndex = parseInt(over.id.split('-')[1]);
      setIsOverDropZone(true);
      return;
    }

    // If dropping on another item
    if (active.id !== over.id) {
      const oldIndex = groupedConcepts.findIndex((item) => item.id === active.id);
      const newIndex = groupedConcepts.findIndex((item) => item.id === over.id);
      //setGroupedConcepts(arrayMove(groupedConcepts, oldIndex, newIndex));
    }
  };

  const handleDragEnd = (event) => {
    // debugger
    const { active, over } = event;
    setActiveId(null);
    setIsOverDropZone(false);

    if (!over || !over.id) return;

    // If dropping on a row container
    if (typeof over.id === 'string' && over.id.startsWith('row-')) {
      const targetRowIndex = parseInt(over.id.split('-')[1]);
      const draggedGroup = groupedConcepts.find(item => item.id === active.id);
      
      if (draggedGroup) {
        // Update the group's row assignment
        setGroupRowMap(prev => {
          const newMap = new Map(prev);
          newMap.set(draggedGroup.id, targetRowIndex);
          return newMap;
        });

        // Update the annotations to include row assignment
        const updatedAnnotations = groupedConcepts.map(group => {
          if (group.id === draggedGroup.id) {
            return {
              ...group,
              rowIndex: targetRowIndex
            };
          }
          return group;
        });
        
        setGroupedConcepts(updatedAnnotations);
        return;
      }
      return;
    }

    // If dropping on another item
    if (active.id !== over.id) {
      const oldIndex = groupedConcepts.findIndex((item) => item.id === active.id);
      const newIndex = groupedConcepts.findIndex((item) => item.id === over.id);
      setGroupedConcepts(arrayMove(groupedConcepts, oldIndex, newIndex));
    }
  };

  // Initialize rows and groupRowMap from annotations when component mounts
  useEffect(() => {
    // Find the maximum row index from annotations
    console.log("effect",  rows)
    const maxRowIndex = Math.max(0,...groupedConcepts.map( gc => gc.rowIndex || 0 ), rows.length - 1)

    // Initialize rows array with the correct number of rows
    // debugger
    const initialRows = Array(maxRowIndex + 1).fill().map(() => []);
    // debugger

    // This only to be called once at the beginning
    // if ( rows.length == 1 && rows[0].length == 0) {
      setRows(initialRows);
    // }
    
    // Initialize groupRowMap from annotations
    const initialMap = new Map();
    groupedConcepts.forEach(group => {
      if (group.rowIndex !== undefined) {
        initialMap.set(group.id, group.rowIndex);
      }
    });
    setGroupRowMap(initialMap);
  }, [groupedConcepts]);

  const addRow = () => {
    setRows([...rows, []]);
    console.log("add row")
  };

  const deleteRow = (rowIndex) => {
    console.log("delete row", rowIndex)
    if (rows.length > 1) {
      // Create a new rows array without the deleted row
      const newRows = rows.filter((_, index) => index !== rowIndex);
      
      // Update the rows state first
      setRows(newRows);

      // Update the groupRowMap to adjust row indices
      setGroupRowMap(prev => {
        const newMap = new Map();
        prev.forEach((row, groupId) => {
          if (row > rowIndex) {
            // Move groups down one row if they were after the deleted row
            newMap.set(groupId, row - 1);
          } else if (row < rowIndex) {
            // Keep groups in their current row if they were before the deleted row
            newMap.set(groupId, row);
          }
          // Groups in the deleted row are not added to the new map
        });
        return newMap;
      });

      // Update the annotations through the parent component's state management
      const updatedAnnotations = groupedConcepts.map(group => {
        const row = groupRowMap.get(group.id);
        if (row === undefined) return group; // Skip if not in map
        if (row > rowIndex) {
          return { ...group, rowIndex: row - 1 };
        } else if (row < rowIndex) {
          return { ...group, rowIndex: row };
        }
        return group;
      }).filter(group => {
        // Remove groups that were in the deleted row
        const row = groupRowMap.get(group.id);
        return row !== rowIndex;
      });

      // Update through parent component's state management
      setGroupedConcepts(updatedAnnotations);
    }
  };

  // Filter out the group being edited
  const visibleGroups = useMemo(() => 
    groupedConcepts.filter(group => group.id !== editingGroup?.id),
    [groupedConcepts, editingGroup]
  );

  // Distribute groups across rows
  const distributedGroups = useMemo(() => {
    const result = rows.map(() => []);
    
    // First, try to place groups in their previously assigned rows
    visibleGroups.forEach((group) => {
      const assignedRow = groupRowMap.get(group.id);
      if (assignedRow !== undefined && assignedRow < rows.length) {
        result[assignedRow].push(group);
      }
    });

    // Then, distribute any remaining groups evenly
    visibleGroups.forEach((group) => {
      if (!groupRowMap.has(group.id)) {
        // Find the row with the fewest groups
        const rowIndex = result.reduce((minIndex, row, currentIndex) => 
          row.length < result[minIndex].length ? currentIndex : minIndex, 0);
        result[rowIndex].push(group);
        setGroupRowMap(prev => new Map(prev).set(group.id, rowIndex));
      }
    });

    return result;
  }, [visibleGroups, rows, groupRowMap]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetectionStrategy}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col space-y-4">
        {distributedGroups.map((row, rowIndex) => (
          <DroppableContainer 
            key={rowIndex} 
            id={`row-${rowIndex}`} 
            isOver={isOverDropZone}
            onDeleteRow={deleteRow}
            rowIndex={rowIndex}
            canDelete={rows.length > 1}
            rowContent={row}
          >
            <SortableContext
              items={row.map(item => item.id)}
              strategy={horizontalListSortingStrategy}
            >
              {row.map((item) => (
                <SortableItem
                  key={item.id}
                  id={item.id}
                  item={item}
                  onEditGroup={onEditGroup}
                  editingGroup={editingGroup}
                />
              ))}
            </SortableContext>
          </DroppableContainer>
        ))}
        
        <button
          onClick={addRow}
          className="btn btn-primary btn-sm self-start"
        >
          <Plus size={14} className="mr-2" />
          Add Row
        </button>
      </div>
      <DragOverlay>
        {activeId ? (
          <div className="w-64 p-2 border border-gray-700 rounded-lg bg-gray-800 shadow-lg">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: visibleGroups.find(item => item.id === activeId)?.color }}
                  />
                  <span className="text-sm">{visibleGroups.find(item => item.id === activeId)?.category}</span>
                </div>
              </div>
              <hr className="border-gray-700 mb-2" />
              <div className="flex-1">
                <GroupedConcepts item={visibleGroups.find(item => item.id === activeId)} />
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default SortableList;
