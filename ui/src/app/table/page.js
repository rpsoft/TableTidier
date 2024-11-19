"use client";

import UploadTable from "@/components/ui/UploadTable";
import TableContexMenu from "@/components/ui/TableContexMenu";
import { ContextMenu } from "../../styles/styles";

import { getTable, getAllTables, uploadTable } from "./actions";

import { Select } from "antd";
import { useState, useEffect } from 'react';

// import React from "react";

export default function TablePage() {

    const [clicked, setClicked] = useState(false);
    const [points, setPoints] = useState({
      x: 0,
      y: 0,
    });
    useEffect(() => {
      const handleClick = () => setClicked(false);
      window.addEventListener("click", handleClick);
      return () => {
        window.removeEventListener("click", handleClick);
      };
    }, []);


    const [selectedTable, setSelectedTable] = useState(null);
    const [tables, setTables] = useState([]);

    useEffect(() => {
        getAllTables().then( (tables) => { 
            setTables(tables) 
        });
      }, []);

    

    const options = tables.map( (tables,t) => { return {value: t, label: tables.fileName} } )
    
    var tableContent;

    if (selectedTable) {
        tableContent = tables
        .filter( table => {return table.fileName == tables[selectedTable].fileName})
        .map((table, tindex) => {
            return <div key={"table_"+tindex} dangerouslySetInnerHTML={{__html: table.htmlContent}} />          
        })
    }
        
    return (
        <main>
        <UploadTable action={uploadTable} />

        
        <Select className="w-[600px]" 
                options={options} 
                onChange={(value) => {
                    setSelectedTable(value);
                }} 
        />;
        
        
    
        <div className="flex flex-wrap"
            onContextMenu={(e) => {
                e.preventDefault();
                setClicked(true);
                setPoints({
                  x: e.pageX,
                  y: e.pageY,
                });
                console.log("Right Click", e.pageX, e.pageY);
              }}>
            {tableContent}
        </div>
        
        {clicked && (
            <ContextMenu top={points.y} left={points.x}>
            <ul>
                <li>Edit</li>
                <li>Copy</li>
                <li>Delete</li>
            </ul>
            </ContextMenu>
        )}
        {/* <TableContexMenu /> */}
        
        </main>
    );
}