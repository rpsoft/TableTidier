"use client";
import { useRef, useState } from "react";

export default function UploadTable( {action} ) {

  const fileInput = useRef(null);
  const [open,toggleOpen] = useState(false)

  return (
  	<>
	    <form action={action} className="flex">
	        <div>

		            <span>Upload a Table</span>
		            <input type="file" name="file" ref={fileInput} />

	        </div>

		    <button className="btn btn-sm" type="submit" onClick={() => document.getElementById('upload_table_modal').close()}>Upload Table</button>

	    </form>
   </> );
}
