"use client";
import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit2 } from "lucide-react";

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

const SortableList = ({ groupedConcepts, setGroupedConcepts, onEditGroup, editingGroup }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = groupedConcepts.findIndex((item) => item.id === active.id);
    const newIndex = groupedConcepts.findIndex((item) => item.id === over.id);

    setGroupedConcepts(arrayMove(groupedConcepts, oldIndex, newIndex));
  };

  // Filter out the group being edited
  const visibleGroups = groupedConcepts.filter(group => group.id !== editingGroup?.id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex overflow-x-auto space-x-4 p-4 border rounded-md h-80">
        <SortableContext
          items={visibleGroups.map(item => item.id)}
          strategy={horizontalListSortingStrategy}
        >
          {visibleGroups.map((item) => (
            <SortableItem
              key={item.id}
              id={item.id}
              item={item}
              onEditGroup={onEditGroup}
              editingGroup={editingGroup}
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
};

export default SortableList;
