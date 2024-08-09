"use client";
import { useRef } from "react";

export default function UploadTable( {action} ) {

  const fileInput = useRef(null);

  return (
    <form action={action} className="flex flex-col gap-4">
      <label>
        <span>Upload a Table</span>
        <input type="file" name="file" ref={fileInput} />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
}