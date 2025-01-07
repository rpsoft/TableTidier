"use client";
import React, { useState, useEffect, useRef } from "react";
import SortableList, { SortableItem } from "react-easy-sort";
import arrayMove from "array-move";
// import TableContexMenu from "./TableContexMenu";
//
import { useTableContext } from "../TableContext";
import { Button } from "antd/es/radio";
// import TextFieldWithDropdown from "@/components/ui/TextFieldWithDropdown"

export default function TableAnnotator({
}) {

	const { state, setValue } = useTableContext();

	const annotations = state.annotations

	const groupConcepts = () => {
		const concepts = state.selectedCells;

		setValue("annotations", [...annotations, {
			concepts,
			category : "characteristic"
		}])

		setValue("selectedCells", {});
	}


  const onSortEnd = (oldIndex, newIndex) => {

    setValue("annotations", arrayMove(annotations, oldIndex, newIndex) )

  };

  return (
    <>
    <div>
     {
				  Object.keys(state.selectedCells).sort((a, b) => {
							// Order by key (which is a combination of row and column numbers.)
							var A = a.split("-")
							var B = b.split("-")
							return A[0] == B[0] ? A[1] >= B[1] : A[0] >= B[0]
					 }).map( key => {
				 return <div key={"sel_"+key}>{
						state.selectedCells[key].content
						}</div>
			})
     }

     {
     	Object.keys(state.selectedCells).length > 0 ?
      	<>
	     <input type="text" placeholder="characteristic" className="input input-bordered w-full max-w-xs" />
		 <button className="btn btn-outline" onClick={groupConcepts} >Group Concepts</button>
       	</> : null
     }

     {/* <div className="flex">{

		state.annotations.map( (ann, a) => {
		  return <div key={"ann_"+a} className="border"> {
			  Object.keys(ann.concepts).map(key => {
				  return <div key={"ann_"+a+"_"+key}>{ann.concepts[key].content}</div>
			  })
		  } </div>
		})

     }</div> */}

     <SortableList
        onSortEnd={onSortEnd}
        className="select-none flex justify-start"
        draggedItemClassName="dragged"
        >
        {annotations.map((item,i) => (
            <SortableItem key={"sortable_"+i}>
            <div className="shrink-0 justify-center items-center bg-blue-400 text-white m-2 cursor-grab border-2 rounded-md p-2">
				<div>{item.category}</div>
				<hr/>
              		{Object.values(item.concepts).map((concept, c) => <div key={"sortable_" + i + "_" + c}>{concept.content}</div>)}
            </div>
            </SortableItem>
        ))}

        {/* {

       	// debugger
          	 state.annotations.map( (ann, a) => {
				  return <SortableItem key={"ann_"+a}> <div className="border"> {
							<div>
								{a}
							</div>
					  // Object.keys(ann.concepts).map(key => {
						 //  return <div key={"ann_"+a+"_"+key}>{ann.concepts[key].content}</div>
					  // })
				  } </div> </SortableItem>
				})

        } */}
        </SortableList>

     </div>
    </>
  );
}
