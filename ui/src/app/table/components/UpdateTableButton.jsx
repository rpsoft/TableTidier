"use client";

import { useState } from "react";
import { useTableContext } from "@/app/table/TableContext";

const UpdateTableButton = ({ refreshTables }) => {
  const { state, setValue } = useTableContext();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateTable = async () => {
    setLoading(true);
    setError(null);


    // debugger
    try {

      const response = await fetch("/api/table", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: state.tables[state.selectedTable].id,
			updateData: { ...state.tables[state.selectedTable],
				annotationData: {
        	      annotations: state.annotations,
            	}
			},
        }),
      });

      if (!response.ok) throw new Error("Failed to update");

      const result = await response.json();
      console.log("Updated table:", result);

      refreshTables();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      id="updateTableButton"
      onClick={updateTable}
      disabled={loading}
      className="bg-red-400 text-white ml-2 rounded-md btn-sm"
    >
      {loading ? "Saving..." : "Save Table Changes"}
    </button>
  );
};

export default UpdateTableButton;
