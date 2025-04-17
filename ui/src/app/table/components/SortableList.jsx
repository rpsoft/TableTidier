"use client";
import React, { useState, useRef, useCallback, useMemo } from "react";
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

  // Simple check for empty row
  const isEmpty = !rowContent || rowContent.length === 0;

  console.log('Row', rowIndex, 'isEmpty:', isEmpty, 'canDelete:', canDelete, 'content:', rowContent);

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
      {canDelete && isEmpty && (
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
  const [rows, setRows] = useState([[]]);
  const [groupRowMap, setGroupRowMap] = useState(new Map());
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

    setIsOverDropZone(false);

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
      setGroupedConcepts(arrayMove(groupedConcepts, oldIndex, newIndex));
    }
  };

  const handleDragEnd = (event) => {
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

  const addRow = () => {
    setRows(prev => [...prev, []]);
  };

  const deleteRow = (rowIndex) => {
    // Only allow deletion of non-last rows
    if (rowIndex >= rows.length - 1) return;

    // Create a new state in one go
    const newState = {
      rows: [...rows],
      groupRowMap: new Map(groupRowMap),
      groupedConcepts: [...groupedConcepts]
    };

    // Remove the row
    newState.rows.splice(rowIndex, 1);

    // Update groupRowMap and collect groups to keep
    const groupsToKeep = new Set();
    for (let [id, r] of newState.groupRowMap.entries()) {
      if (r === rowIndex) {
        // Remove groups from the deleted row
        newState.groupRowMap.delete(id);
      } else if (r > rowIndex) {
        // Adjust indices for groups after the deleted row
        newState.groupRowMap.set(id, r - 1);
        groupsToKeep.add(id);
      } else {
        // Keep groups from rows before the deleted row
        groupsToKeep.add(id);
      }
    }

    // Update groupedConcepts to only keep the groups we identified
    newState.groupedConcepts = newState.groupedConcepts.filter(group => groupsToKeep.has(group.id));

    // Apply all state updates at once
    setRows(newState.rows);
    setGroupRowMap(newState.groupRowMap);
    setGroupedConcepts(newState.groupedConcepts);
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
        {rows.map((row, rowIndex) => {
          const rowGroups = distributedGroups[rowIndex] || [];
          const isLastRow = rowIndex === rows.length - 1;
          console.log('Rendering row', rowIndex, 'with groups:', rowGroups, 'isLastRow:', isLastRow);
          return (
            <DroppableContainer 
              key={rowIndex} 
              id={`row-${rowIndex}`} 
              isOver={isOverDropZone}
              onDeleteRow={deleteRow}
              rowIndex={rowIndex}
              canDelete={!isLastRow}
              rowContent={rowGroups}
            >
              <SortableContext
                items={rowGroups.map(item => item.id)}
                strategy={horizontalListSortingStrategy}
              >
                {rowGroups.map((item) => (
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
          );
        })}
        
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
