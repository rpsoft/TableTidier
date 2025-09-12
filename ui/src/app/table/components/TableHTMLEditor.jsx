import React from "react";
import CustomTableEditor from "./CustomTableEditor";

export default function TableHTMLEditor({ initialHtml, saveHtml }) {
  return (
    <div className="bg-white flex flex-col">
      <CustomTableEditor 
        initialHtml={initialHtml} 
        saveHtml={saveHtml} 
      />
    </div>
  );
}
