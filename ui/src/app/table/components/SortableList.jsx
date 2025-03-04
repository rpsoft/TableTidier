import React from "react";
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
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import GroupedConcepts from "./GroupedConcepts";

const SortableList = ({
  groupedConcepts,
  setGroupedConcepts,
  horizontal = true,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // Prevent accidental drags
    }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = groupedConcepts.findIndex((item) => item.id === active.id);
    const newIndex = groupedConcepts.findIndex((item) => item.id === over.id);

    setGroupedConcepts(arrayMove(groupedConcepts, oldIndex, newIndex));
  };

  var classOrientation = horizontal
    ? "flex overflow-x-auto space-x-4 p-4 border rounded-md"
    : "space-y-2 p-4 border rounded-md";

   // debugger
  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <SortableContext
        items={groupedConcepts}
        strategy={horizontalListSortingStrategy}
      >
        <div className={classOrientation}>
          {groupedConcepts?.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              <GroupedConcepts item={item} />
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default SortableList;
