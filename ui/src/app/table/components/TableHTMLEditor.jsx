import React from "react";
import CustomTableEditor from "./CustomTableEditor";

export default function TableHTMLEditor({ initialHtml, saveHtml }) {
  return (
    <div className="bg-white h-full">
      <CustomTableEditor 
        initialHtml={initialHtml} 
        saveHtml={saveHtml} 
      />
    </div>
  );
}
