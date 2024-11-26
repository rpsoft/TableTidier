"use client";

import UploadTable from "@/components/ui/UploadTable";

import TableCell from "@/components/ui/TableCell";

import * as cheerio from 'cheerio';

import { getTable, getAllTables, uploadTable } from "./actions";

import { Select, Table } from "antd";
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
        .map((table, tindex) => {
            return table.htmlContent
        })
    }

    if(tableContent && tableContent[0]) {
        
        const $ = cheerio.load(tableContent[0]);

        function traverseNodes(node) {
            var content = []

            node.children?.forEach(child => {
                console.log(child.tagName);
                if ( child.tagName === "td"){
                    const childContent = $(child).text();
                    content = [...content, childContent]
                }
                
                var recContent = traverseNodes(child)
                if ( recContent.length > 0 )
                    content = [...content, recContent];
            });
            
            return content
        }

        // This is quite awesome. All nodes sorted here in a recursive structure of arrays! if a valid table is supplied.
        var allnodes = traverseNodes($("table")[0]).flat();
        // debugger
        tableContent = <table>

        <tbody>{
            allnodes.map ( (row, r) => {
               // debugger
                return <tr>
                    {
                        row.map( (cell) => {
                            //
                            return <TableCell content={cell} ></TableCell>
                        })
                    }
                </tr>
            })
        }</tbody>

        </table>


        // Now we can reconstruct the table with custom made React components!
        // debugger

        // And assign this to the tableContent 
        // tableContent = <div dangerouslySetInnerHTML={{__html: $.html()}} />
    
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
        
        
    
        {/* <div className="flex flex-wrap"
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
        )} */}
        {tableContent}
        
        </main>
    );
}