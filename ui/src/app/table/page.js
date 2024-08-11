"use client";

import UploadTable from "@/components/ui/UploadTable";
import { getTable, getAllTables, uploadTable } from "./actions";

import { Select } from "antd";
import { useState, useEffect } from 'react';

// import React from "react";

export default function TablePage() {


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
        .map((table) => {
            return <div dangerouslySetInnerHTML={{__html: table.htmlContent}} />          
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
        
        
    
        <div className="flex flex-wrap">
            {tableContent}
        </div>
        </main>
    );
}