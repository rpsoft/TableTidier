// All these will modify and return a new table to be displayed/replace the previous one.

const TableOperations = {
  addColumn: (tableNodes, setTableNodes, refColumn, before) => {
		  // Determine the position to insert the new column
		  const columnIndex = before ? refColumn : refColumn + 1;

		  // Create a new tableNodes array with the additional column
		  const updatedTableNodes = tableNodes.map(row => {
		      // Insert an empty value into each row at the specified position
		      const newRow = [...row];
		      newRow.splice(columnIndex, 0, null); // Insert `null` as the default value for the new column
		      return newRow;
		  });

		  // Update the state with the modified tableNodes
		  setTableNodes(updatedTableNodes);
  },
  addRow: (tableNodes, setTableNodes, refRow, before) => {
		  // Determine the position to insert the new row
		  const rowIndex = before ? refRow : refRow + 1;

		  // Create a new row with the same number of columns as the existing rows
		  const columnCount = tableNodes[0]?.length || 0; // Handle empty table edge case
		  const newRow = Array(columnCount).fill(null); // Initialize with `null` values

		  // Create a new tableNodes array with the additional row
		  const updatedTableNodes = [
		      ...tableNodes.slice(0, rowIndex),
		      newRow,
		      ...tableNodes.slice(rowIndex)
		  ];

		  // Update the state with the modified tableNodes
		  setTableNodes(updatedTableNodes);
  },
  deleteColumn: (tableNodes, setTableNodes, columnIndex) => {
      // Ensure the columnIndex is within bounds
      if (tableNodes.length > 0 && (columnIndex < 0 || columnIndex >= tableNodes[0].length)) {
          console.error("Column index out of bounds");
          return;
      }

      // Create a new tableNodes array without the specified column
      const updatedTableNodes = tableNodes.map(row => {
          const newRow = [...row];
          newRow.splice(columnIndex, 1); // Remove the column at the specified index
          return newRow;
      });

      // Update the state with the modified tableNodes
      setTableNodes(updatedTableNodes);
  },
  deleteRow: (tableNodes, setTableNodes, rowIndex) => {
      // Ensure the rowIndex is within bounds
      if (rowIndex < 0 || rowIndex >= tableNodes.length) {
          console.error("Row index out of bounds");
          return;
      }

      // Create a new tableNodes array without the specified row
      const updatedTableNodes = [
          ...tableNodes.slice(0, rowIndex),
          ...tableNodes.slice(rowIndex + 1)
      ];

      // Update the state with the modified tableNodes
      setTableNodes(updatedTableNodes);
  },
  moveColumn: (tableNodes, setTableNodes, refColumn, targetColumn, before) => {},
  moveRow: (tableNodes, setTableNodes, refRow, targetRow, before) => {},
};

export default TableOperations;
