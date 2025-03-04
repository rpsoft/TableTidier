import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal, GripVertical } from "lucide-react"; // Drag handle icon

const SortableItem = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col items-center p-2 border rounded-md">
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab "
        aria-label="Drag handle"
      >
        <GripHorizontal className="w-4 h-4 text-gray-500" />

      </button>

      <div className="flex-1">{children}</div>
    </div>
  );
};

export default SortableItem;
