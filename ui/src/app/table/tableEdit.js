// All these will modify and return a new table to be displayed/replace the previous one.

const TableOperations = {
  addColumn: (table, refColumn, before) => {},
  addRow: (table, refRow, before) => {},
  removeColumn: (table, refColumn) => {},
  removeRow: (table, refRow) => {},
  moveColumn: (table, refColumn, targetColumn, before) => {},
  moveRow: (table, refRow, targetRow, before) => {},
};

export default TableOperations;
