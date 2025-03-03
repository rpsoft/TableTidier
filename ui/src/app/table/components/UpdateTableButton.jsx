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

    try {
      const response = await fetch("/api/table", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: state.tables[state.selectedTable].id,
          updateData: {
            annotationData: {
              annotations: state.annotations,
              // extractedData: state.extractedData,
            },
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
      onClick={updateTable}
      disabled={loading}
      className="bg-blue-500 text-white px-4 py-2 rounded-md"
    >
      {loading ? "Updating..." : "Update Table"}
    </button>
  );
};

export default UpdateTableButton;
