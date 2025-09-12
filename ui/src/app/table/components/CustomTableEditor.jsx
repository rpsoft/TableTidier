"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useTableContext } from "../TableContext";
import TableOperations from "../tableEdit";

export default function CustomTableEditor({ initialHtml, saveHtml }) {
  const { state, setValue } = useTableContext();
  const [tableData, setTableData] = useState([]);
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState(null);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, cell: null });
  const [editingCell, setEditingCell] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [copiedCells, setCopiedCells] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const tableRef = useRef(null);
  const editingInputRef = useRef(null);

  // Parse HTML table into 2D array with proper cell positioning
  const parseHtmlTable = useCallback((html) => {
    if (!html) return [];
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('table');
    
    if (!table) return [];
    
    const rows = Array.from(table.querySelectorAll('tr'));
    const tableData = [];
    
    // First, determine the maximum number of columns needed
    let maxCols = 0;
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td, th'));
      let colCount = 0;
      cells.forEach(cell => {
        const colspan = parseInt(cell.getAttribute('colspan') || '1');
        colCount += colspan;
      });
      maxCols = Math.max(maxCols, colCount);
    });
    
    // Create a 2D grid to track cell positions
    const grid = Array(rows.length).fill(null).map(() => Array(maxCols).fill(null));
    
    // Place cells in the grid, accounting for colspan/rowspan
    rows.forEach((row, rowIndex) => {
      const cells = Array.from(row.querySelectorAll('td, th'));
      let colIndex = 0;
      
      cells.forEach(cell => {
        const colspan = parseInt(cell.getAttribute('colspan') || '1');
        const rowspan = parseInt(cell.getAttribute('rowspan') || '1');
        
        // Find the next available position in this row
        while (colIndex < maxCols && grid[rowIndex][colIndex] !== null) {
          colIndex++;
        }
        
        const cellInfo = {
          content: cell.textContent || cell.innerHTML || '',
          tagName: cell.tagName.toLowerCase(),
          colspan: colspan,
          rowspan: rowspan,
          className: cell.className || '',
          style: cell.getAttribute('style') || '',
          isMerged: false
        };
        
        // Place the cell in the grid
        grid[rowIndex][colIndex] = cellInfo;
        
        // Mark cells covered by this merged cell
        for (let r = rowIndex; r < rowIndex + rowspan; r++) {
          for (let c = colIndex; c < colIndex + colspan; c++) {
            if (r !== rowIndex || c !== colIndex) {
              if (r < grid.length && c < grid[r].length) {
                grid[r][c] = {
                  content: '',
                  tagName: 'td',
                  colspan: 1,
                  rowspan: 1,
                  className: '',
                  style: '',
                  isMerged: true
                };
              }
            }
          }
        }
        
        colIndex += colspan;
      });
    });
    
    return grid;
  }, []);

  // Convert table data back to HTML
  const convertToHtml = useCallback((data) => {
    if (!data || data.length === 0) return '';
    
    const table = document.createElement('table');
    table.className = 'table table-bordered';
    
    data.forEach((row, rowIndex) => {
      const tr = document.createElement('tr');
      
      row.forEach((cell, colIndex) => {
        // Skip merged cells - they are covered by other cells
        if (cell.isMerged) {
          return;
        }
        
        const cellElement = document.createElement(cell.tagName || 'td');
        cellElement.innerHTML = cell.content;
        
        if (cell.colspan > 1) cellElement.setAttribute('colspan', cell.colspan);
        if (cell.rowspan > 1) cellElement.setAttribute('rowspan', cell.rowspan);
        if (cell.className) cellElement.className = cell.className;
        if (cell.style) cellElement.setAttribute('style', cell.style);
        
        tr.appendChild(cellElement);
      });
      
      table.appendChild(tr);
    });
    
    return table.outerHTML;
  }, []);

  // Initialize table data from HTML
  useEffect(() => {
    if (initialHtml) {
      const parsed = parseHtmlTable(initialHtml);
      setTableData(parsed);
      // Initialize history with the initial state
      setHistory([JSON.parse(JSON.stringify(parsed))]);
      setHistoryIndex(0);
    }
  }, [initialHtml, parseHtmlTable]);

  // Handle cell click for selection
  const handleCellClick = (row, col, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const cellKey = `${row}-${col}`;
    
    if (event.ctrlKey || event.metaKey) {
      // Toggle cell selection
      setSelectedCells(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(cellKey)) {
          newSelection.delete(cellKey);
        } else {
          newSelection.add(cellKey);
        }
        return newSelection;
      });
    } else if (event.shiftKey && selectedCells.size > 0) {
      // Range selection
      const firstSelected = Array.from(selectedCells)[0];
      const [startRow, startCol] = firstSelected.split('-').map(Number);
      
      const minRow = Math.min(row, startRow);
      const maxRow = Math.max(row, startRow);
      const minCol = Math.min(col, startCol);
      const maxCol = Math.max(col, startCol);
      
      const newSelection = new Set();
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          newSelection.add(`${r}-${c}`);
        }
      }
      setSelectedCells(newSelection);
    } else {
      // Single cell selection
      setSelectedCells(new Set([cellKey]));
    }
    
    setSelectionStart({ row, col });
  };

  // Handle mouse down for drag selection
  const handleMouseDown = (row, col, event) => {
    if (event.button !== 0) return; // Only left mouse button
    
    setIsSelecting(true);
    setSelectionStart({ row, col });
    
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
      setSelectedCells(new Set([`${row}-${col}`]));
    }
  };

  // Handle mouse enter for drag selection
  const handleMouseEnter = (row, col) => {
    if (!isSelecting || !selectionStart) return;
    
    const minRow = Math.min(row, selectionStart.row);
    const maxRow = Math.max(row, selectionStart.row);
    const minCol = Math.min(col, selectionStart.col);
    const maxCol = Math.max(col, selectionStart.col);
    
    const newSelection = new Set();
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        newSelection.add(`${r}-${c}`);
      }
    }
    setSelectedCells(newSelection);
  };

  // Handle mouse up to end selection
  const handleMouseUp = () => {
    setIsSelecting(false);
    setSelectionStart(null);
  };

  // Handle right click for context menu
  const handleContextMenu = (row, col, event) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      show: true,
      x: event.clientX,
      y: event.clientY,
      cell: { row, col }
    });
    
    // Select the cell if not already selected
    const cellKey = `${row}-${col}`;
    if (!selectedCells.has(cellKey)) {
      setSelectedCells(new Set([cellKey]));
    }
  };

  // Close context menu
  const closeContextMenu = () => {
    setContextMenu({ show: false, x: 0, y: 0, cell: null });
  };

  // Handle cell double click for editing
  const handleCellDoubleClick = (row, col) => {
    const cell = tableData[row][col];
    setEditingCell({ row, col });
    setEditingValue(cell.content);
  };

  // Save cell edit
  const saveCellEdit = () => {
    if (!editingCell) return;
    
    const { row, col } = editingCell;
    setTableData(prev => {
      const newData = [...prev];
      newData[row] = [...newData[row]];
      newData[row][col] = { ...newData[row][col], content: editingValue };
      addToHistory(newData);
      return newData;
    });
    
    setEditingCell(null);
    setEditingValue("");
  };

  // Cancel cell edit
  const cancelCellEdit = () => {
    setEditingCell(null);
    setEditingValue("");
  };

  // Handle key press in editing mode
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      saveCellEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelCellEdit();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      saveCellEdit();
      // Move to next cell
      const { row, col } = editingCell;
      const nextCol = (col + 1) % tableData[row].length;
      const nextRow = nextCol === 0 ? (row + 1) % tableData.length : row;
      if (nextRow !== row || nextCol !== col) {
        setEditingCell({ row: nextRow, col: nextCol });
        setEditingValue(tableData[nextRow][nextCol].content);
      }
    }
  };

  // Save changes
  const handleSave = useCallback(() => {
    const html = convertToHtml(tableData);
    saveHtml(html);
  }, [tableData, convertToHtml, saveHtml]);

  // Add state to history
  const addToHistory = useCallback((newTableData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newTableData)));
    
    // Limit history to 50 states to prevent memory issues
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setTableData(JSON.parse(JSON.stringify(history[newIndex])));
    }
  }, [history, historyIndex]);

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setTableData(JSON.parse(JSON.stringify(history[newIndex])));
    }
  }, [history, historyIndex]);

  // Copy selected cells
  const copyCells = useCallback(() => {
    if (selectedCells.size === 0) return;
    
    const cellsToCopy = [];
    const positions = Array.from(selectedCells).map(cellKey => {
      const [row, col] = cellKey.split('-').map(Number);
      return { row, col };
    });
    
    // Sort positions to maintain order
    positions.sort((a, b) => a.row - b.row || a.col - b.col);
    
    // Find the bounding box of selected cells
    const minRow = Math.min(...positions.map(p => p.row));
    const maxRow = Math.max(...positions.map(p => p.row));
    const minCol = Math.min(...positions.map(p => p.col));
    const maxCol = Math.max(...positions.map(p => p.col));
    
    // Create a 2D array of the selected region
    const copiedData = [];
    for (let r = minRow; r <= maxRow; r++) {
      const row = [];
      for (let c = minCol; c <= maxCol; c++) {
        const cellKey = `${r}-${c}`;
        if (selectedCells.has(cellKey)) {
          row.push(tableData[r][c]);
        } else {
          row.push({ content: '', tagName: 'td', colspan: 1, rowspan: 1, className: '', style: '', isMerged: false });
        }
      }
      copiedData.push(row);
    }
    
    setCopiedCells({
      data: copiedData,
      startRow: minRow,
      startCol: minCol,
      endRow: maxRow,
      endCol: maxCol
    });
    
    // Also copy to clipboard as text
    const textData = copiedData.map(row => 
      row.map(cell => cell.content).join('\t')
    ).join('\n');
    
    navigator.clipboard.writeText(textData).catch(console.error);
  }, [selectedCells, tableData]);

  // Paste cells
  const pasteCells = useCallback(() => {
    if (!copiedCells || selectedCells.size === 0) return;
    
    const positions = Array.from(selectedCells).map(cellKey => {
      const [row, col] = cellKey.split('-').map(Number);
      return { row, col };
    });
    
    if (positions.length === 0) return;
    
    // Use the first selected cell as the paste position
    const pasteRow = positions[0].row;
    const pasteCol = positions[0].col;
    
    setTableData(prev => {
      const newData = [...prev];
      const copiedData = copiedCells.data;
      
      // Paste the copied data starting at the paste position
      for (let r = 0; r < copiedData.length; r++) {
        for (let c = 0; c < copiedData[r].length; c++) {
          const targetRow = pasteRow + r;
          const targetCol = pasteCol + c;
          
          if (targetRow < newData.length && targetCol < newData[targetRow].length) {
            newData[targetRow] = [...newData[targetRow]];
            newData[targetRow][targetCol] = { ...copiedData[r][c] };
          }
        }
      }
      
      addToHistory(newData);
      return newData;
    });
    
    closeContextMenu();
  }, [copiedCells, selectedCells, closeContextMenu, addToHistory]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (editingCell) return; // Don't handle shortcuts while editing
      
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            handleSave();
            break;
          case 'a':
            event.preventDefault();
            // Select all cells
            const allCells = new Set();
            tableData.forEach((row, rowIndex) => {
              row.forEach((_, colIndex) => {
                allCells.add(`${rowIndex}-${colIndex}`);
              });
            });
            setSelectedCells(allCells);
            break;
          case 'c':
            event.preventDefault();
            copyCells();
            break;
          case 'v':
            event.preventDefault();
            pasteCells();
            break;
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            event.preventDefault();
            redo();
            break;
        }
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedCells.size > 0) {
          event.preventDefault();
          // Clear selected cells content
          setTableData(prev => {
            const newData = [...prev];
            selectedCells.forEach(cellKey => {
              const [row, col] = cellKey.split('-').map(Number);
              newData[row] = [...newData[row]];
              newData[row][col] = { ...newData[row][col], content: '' };
            });
            addToHistory(newData);
            return newData;
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingCell, selectedCells, tableData, handleSave, copyCells, pasteCells, undo, redo]);

  // Table operations
  const addRow = (position = 'after') => {
    const selectedRows = new Set();
    selectedCells.forEach(cellKey => {
      const [row] = cellKey.split('-').map(Number);
      selectedRows.add(row);
    });
    
    const targetRow = selectedRows.size > 0 ? Math.max(...selectedRows) : tableData.length - 1;
    const insertIndex = position === 'before' ? targetRow : targetRow + 1;
    
    const newRow = Array(tableData[0]?.length || 1).fill(null).map(() => ({
      content: '',
      tagName: 'td',
      colspan: 1,
      rowspan: 1,
      className: '',
      style: '',
      isMerged: false
    }));
    
    setTableData(prev => {
      const newData = [...prev];
      newData.splice(insertIndex, 0, newRow);
      addToHistory(newData);
      return newData;
    });
    
    closeContextMenu();
  };

  const addColumn = (position = 'after') => {
    const selectedCols = new Set();
    selectedCells.forEach(cellKey => {
      const [, col] = cellKey.split('-').map(Number);
      selectedCols.add(col);
    });
    
    const targetCol = selectedCols.size > 0 ? Math.max(...selectedCols) : tableData[0]?.length - 1 || 0;
    const insertIndex = position === 'before' ? targetCol : targetCol + 1;
    
    setTableData(prev => {
      const newData = prev.map(row => {
        const newRow = [...row];
        newRow.splice(insertIndex, 0, {
          content: '',
          tagName: 'td',
          colspan: 1,
          rowspan: 1,
          className: '',
          style: '',
          isMerged: false
        });
        return newRow;
      });
      addToHistory(newData);
      return newData;
    });
    
    closeContextMenu();
  };

  const removeRow = () => {
    const selectedRows = new Set();
    selectedCells.forEach(cellKey => {
      const [row] = cellKey.split('-').map(Number);
      selectedRows.add(row);
    });
    
    if (selectedRows.size === 0 || tableData.length <= 1) return;
    
    const rowsToRemove = Array.from(selectedRows).sort((a, b) => b - a);
    
    setTableData(prev => {
      const newData = [...prev];
      rowsToRemove.forEach(row => {
        newData.splice(row, 1);
      });
      addToHistory(newData);
      return newData;
    });
    
    setSelectedCells(new Set());
    closeContextMenu();
  };

  const removeColumn = () => {
    const selectedCols = new Set();
    selectedCells.forEach(cellKey => {
      const [, col] = cellKey.split('-').map(Number);
      selectedCols.add(col);
    });
    
    if (selectedCols.size === 0 || tableData[0]?.length <= 1) return;
    
    const colsToRemove = Array.from(selectedCols).sort((a, b) => b - a);
    
    setTableData(prev => {
      const newData = prev.map(row => {
        const newRow = [...row];
        colsToRemove.forEach(col => {
          newRow.splice(col, 1);
        });
        return newRow;
      });
      addToHistory(newData);
      return newData;
    });
    
    setSelectedCells(new Set());
    closeContextMenu();
  };

  const mergeCells = () => {
    if (selectedCells.size < 2) return;
    
    const positions = Array.from(selectedCells).map(cellKey => {
      const [row, col] = cellKey.split('-').map(Number);
      return { row, col };
    });
    
    const minRow = Math.min(...positions.map(p => p.row));
    const maxRow = Math.max(...positions.map(p => p.row));
    const minCol = Math.min(...positions.map(p => p.col));
    const maxCol = Math.max(...positions.map(p => p.col));
    
    // Check if selection forms a rectangle
    const isRectangle = positions.every(p => 
      p.row >= minRow && p.row <= maxRow && p.col >= minCol && p.col <= maxCol
    );
    
    if (!isRectangle) return;
    
    // Merge cells
    setTableData(prev => {
      const newData = [...prev];
      const mergedContent = positions
        .map(p => newData[p.row][p.col].content)
        .filter(content => content.trim())
        .join(' ');
      
      // Set the top-left cell with merged content and colspan/rowspan
      newData[minRow][minCol] = {
        ...newData[minRow][minCol],
        content: mergedContent,
        colspan: maxCol - minCol + 1,
        rowspan: maxRow - minRow + 1,
        isMerged: false
      };
      
      // Mark other cells in the merged area as merged
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          if (r !== minRow || c !== minCol) {
            newData[r][c] = {
              content: '',
              tagName: 'td',
              colspan: 1,
              rowspan: 1,
              className: '',
              style: '',
              isMerged: true
            };
          }
        }
      }
      
      addToHistory(newData);
      return newData;
    });
    
    setSelectedCells(new Set([`${minRow}-${minCol}`]));
    closeContextMenu();
  };

  const splitCell = () => {
    if (selectedCells.size !== 1) return;
    
    const [cellKey] = selectedCells;
    const [row, col] = cellKey.split('-').map(Number);
    const cell = tableData[row][col];
    
    if (cell.colspan <= 1 && cell.rowspan <= 1) return;
    
    setTableData(prev => {
      const newData = [...prev];
      const content = cell.content;
      
      // Reset the cell
      newData[row][col] = {
        ...cell,
        content: content,
        colspan: 1,
        rowspan: 1,
        isMerged: false
      };
      
      // Add new cells to fill the space
      for (let r = row; r < row + cell.rowspan; r++) {
        for (let c = col; c < col + cell.colspan; c++) {
          if (r !== row || c !== col) {
            if (!newData[r]) newData[r] = [];
            newData[r][c] = {
              content: '',
              tagName: 'td',
              colspan: 1,
              rowspan: 1,
              className: '',
              style: '',
              isMerged: false
            };
          }
        }
      }
      
      addToHistory(newData);
      return newData;
    });
    
    closeContextMenu();
  };


  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu.show) {
        closeContextMenu();
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.show]);

  // Close help dialog with Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && showHelpDialog) {
        setShowHelpDialog(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showHelpDialog]);

  // Focus editing input when editing starts
  useEffect(() => {
    if (editingCell && editingInputRef.current) {
      editingInputRef.current.focus();
      editingInputRef.current.select();
    }
  }, [editingCell]);

  if (tableData.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No table data to display</p>
        <button 
          onClick={() => setTableData([[{ content: '', tagName: 'td', colspan: 1, rowspan: 1, className: '', style: '', isMerged: false }]])}
          className="btn btn-primary mt-2"
        >
          Create New Table
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col" style={{ height: '75vh', maxHeight: '75vh', minHeight: '500px' }}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-3 bg-white border-b border-gray-300 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={undo} className="btn btn-outline btn-sm text-gray-700 border-gray-400 hover:bg-gray-100" disabled={historyIndex <= 0}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Undo
          </button>
          <button onClick={redo} className="btn btn-outline btn-sm text-gray-700 border-gray-400 hover:bg-gray-100" disabled={historyIndex >= history.length - 1}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" />
            </svg>
            Redo
          </button>
          <div className="divider divider-horizontal"></div>
          <button onClick={handleSave} className="btn btn-primary btn-sm text-white">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Save Changes
          </button>
        </div>
        
        <div className="divider divider-horizontal"></div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">Rows:</span>
          <button onClick={() => addRow('before')} className="btn btn-outline btn-sm text-gray-700 border-gray-400 hover:bg-gray-100">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Insert Above
          </button>
          <button onClick={() => addRow('after')} className="btn btn-outline btn-sm text-gray-700 border-gray-400 hover:bg-gray-100">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Insert Below
          </button>
          <button onClick={removeRow} className="btn btn-outline btn-sm text-red-700 border-red-400 hover:bg-red-50" disabled={selectedCells.size === 0}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Row
          </button>
        </div>
        
        <div className="divider divider-horizontal"></div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">Columns:</span>
          <button onClick={() => addColumn('before')} className="btn btn-outline btn-sm text-gray-700 border-gray-400 hover:bg-gray-100">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Insert Left
          </button>
          <button onClick={() => addColumn('after')} className="btn btn-outline btn-sm text-gray-700 border-gray-400 hover:bg-gray-100">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Insert Right
          </button>
          <button onClick={removeColumn} className="btn btn-outline btn-sm text-red-700 border-red-400 hover:bg-red-50" disabled={selectedCells.size === 0}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Column
          </button>
        </div>
        
        <div className="divider divider-horizontal"></div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">Cells:</span>
          <button onClick={copyCells} className="btn btn-outline btn-sm text-gray-700 border-gray-400 hover:bg-gray-100" disabled={selectedCells.size === 0}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </button>
          <button onClick={pasteCells} className="btn btn-outline btn-sm text-gray-700 border-gray-400 hover:bg-gray-100" disabled={!copiedCells || selectedCells.size === 0}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Paste
          </button>
          <button onClick={mergeCells} className="btn btn-outline btn-sm text-gray-700 border-gray-400 hover:bg-gray-100" disabled={selectedCells.size < 2}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Merge Cells
          </button>
          <button onClick={splitCell} className="btn btn-outline btn-sm text-gray-700 border-gray-400 hover:bg-gray-100" disabled={selectedCells.size !== 1}>
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Split Cell
          </button>
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          {selectedCells.size > 0 && (
            <>
              <span className="text-sm text-gray-700 font-medium">
                {selectedCells.size} cell{selectedCells.size !== 1 ? 's' : ''} selected
              </span>
              <button 
                onClick={() => setSelectedCells(new Set())} 
                className="btn btn-ghost btn-sm text-gray-600 hover:bg-gray-100"
              >
                Clear Selection
              </button>
            </>
          )}
          <button 
            onClick={() => setShowHelpDialog(true)} 
            className="btn btn-ghost btn-sm text-gray-600 hover:bg-gray-100"
            title="Show help instructions"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Show Help
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto border border-gray-200 rounded-lg min-h-0">
        <table 
          ref={tableRef}
          className="table table-bordered w-full m-0"
          onMouseUp={handleMouseUp}
        >
          <tbody>
            {tableData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {row.map((cell, colIndex) => {
                  const cellKey = `${rowIndex}-${colIndex}`;
                  const isSelected = selectedCells.has(cellKey);
                  const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                  const isMerged = cell.isMerged;
                  
                  // Skip rendering merged cells - they are covered by other cells
                  if (isMerged) {
                    return null;
                  }
                  
                  return (
                    <td
                      key={cellKey}
                      className={`
                        relative min-w-24 min-h-10 p-2 cursor-pointer border border-gray-300
                        transition-all duration-150 ease-in-out
                        ${isSelected 
                          ? 'bg-blue-100 border-blue-400 shadow-sm' 
                          : 'hover:bg-gray-50 hover:border-gray-400'
                        }
                        ${isEditing ? 'bg-white border-blue-500 shadow-md' : ''}
                        ${cell.colspan > 1 ? 'colspan-' + cell.colspan : ''}
                        ${cell.rowspan > 1 ? 'rowspan-' + cell.rowspan : ''}
                      `}
                      colSpan={cell.colspan}
                      rowSpan={cell.rowspan}
                      onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                      onMouseDown={(e) => handleMouseDown(rowIndex, colIndex, e)}
                      onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                      onContextMenu={(e) => handleContextMenu(rowIndex, colIndex, e)}
                      onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                    >
                      {isEditing ? (
                        <input
                          ref={editingInputRef}
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={handleKeyPress}
                          onBlur={saveCellEdit}
                          className="w-full h-full border-none outline-none bg-transparent text-sm text-gray-900 font-medium"
                          placeholder="Enter cell content..."
                        />
                      ) : (
                        <div 
                          className="w-full h-full min-h-6 text-sm leading-relaxed text-gray-900 font-medium"
                          dangerouslySetInnerHTML={{ 
                            __html: cell.content || '<span class="text-gray-500 italic font-normal">Empty cell</span>' 
                          }}
                        />
                      )}
                      
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full transform translate-x-1 -translate-y-1">
                          <div className="w-full h-full bg-blue-500 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      

      {/* Context Menu */}
      {contextMenu.show && (
        <div
          className="fixed bg-white border border-gray-300 rounded-lg shadow-xl z-50 py-2 min-w-48"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <div className="px-3 py-1 text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Table Operations
          </div>
          
          <div className="px-1">
            <button
              className="w-full px-3 py-2 text-left hover:bg-gray-100 rounded flex items-center gap-2 text-sm text-gray-800"
              onClick={() => addRow('before')}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Insert Row Above
            </button>
            <button
              className="w-full px-3 py-2 text-left hover:bg-gray-100 rounded flex items-center gap-2 text-sm text-gray-800"
              onClick={() => addRow('after')}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Insert Row Below
            </button>
            <button
              className="w-full px-3 py-2 text-left hover:bg-gray-100 rounded flex items-center gap-2 text-sm text-gray-800"
              onClick={() => addColumn('before')}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Insert Column Left
            </button>
            <button
              className="w-full px-3 py-2 text-left hover:bg-gray-100 rounded flex items-center gap-2 text-sm text-gray-800"
              onClick={() => addColumn('after')}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Insert Column Right
            </button>
          </div>
          
          <hr className="my-2" />
          
          <div className="px-1">
            <button
              className="w-full px-3 py-2 text-left hover:bg-red-50 rounded flex items-center gap-2 text-sm text-red-700"
              onClick={removeRow}
            >
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Row
            </button>
            <button
              className="w-full px-3 py-2 text-left hover:bg-red-50 rounded flex items-center gap-2 text-sm text-red-700"
              onClick={removeColumn}
            >
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Column
            </button>
          </div>
          
          <hr className="my-2" />
          
          <div className="px-1">
            <button
              className="w-full px-3 py-2 text-left hover:bg-gray-100 rounded flex items-center gap-2 text-sm text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={copyCells}
              disabled={selectedCells.size === 0}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Cells
            </button>
            <button
              className="w-full px-3 py-2 text-left hover:bg-gray-100 rounded flex items-center gap-2 text-sm text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={pasteCells}
              disabled={!copiedCells || selectedCells.size === 0}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Paste Cells
            </button>
          </div>
          
          <hr className="my-2" />
          
          <div className="px-1">
            <button
              className="w-full px-3 py-2 text-left hover:bg-gray-100 rounded flex items-center gap-2 text-sm text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={mergeCells}
              disabled={selectedCells.size < 2}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Merge Cells
            </button>
            <button
              className="w-full px-3 py-2 text-left hover:bg-gray-100 rounded flex items-center gap-2 text-sm text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={splitCell}
              disabled={selectedCells.size !== 1}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Split Cell
            </button>
          </div>
        </div>
      )}

      {/* Help Dialog */}
      {showHelpDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] w-full mx-4 overflow-hidden">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Table Editor Help</h3>
              <button
                onClick={() => setShowHelpDialog(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Dialog Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Selection */}
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    Selection
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span><strong className="text-gray-900">Click</strong> to select a single cell</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span><strong className="text-gray-900">Ctrl+Click</strong> to select multiple cells</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span><strong className="text-gray-900">Shift+Click</strong> to select a range of cells</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span><strong className="text-gray-900">Drag</strong> to select multiple cells</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      <span><strong className="text-gray-900">Ctrl+A</strong> to select all cells</span>
                    </li>
                  </ul>
                </div>

                {/* Editing */}
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Editing
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span><strong className="text-gray-900">Double-click</strong> to edit cell content</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span><strong className="text-gray-900">Enter</strong> to save edit</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span><strong className="text-gray-900">Escape</strong> to cancel edit</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span><strong className="text-gray-900">Tab</strong> to move to next cell</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span><strong className="text-gray-900">Delete/Backspace</strong> to clear selected cells</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span><strong className="text-gray-900">Ctrl+Z</strong> to undo changes</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      <span><strong className="text-gray-900">Ctrl+Shift+Z</strong> or <strong className="text-gray-900">Ctrl+Y</strong> to redo changes</span>
                    </li>
                  </ul>
                </div>

                {/* Copy/Paste */}
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy & Paste
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="text-orange-600 mr-2">•</span>
                      <span><strong className="text-gray-900">Ctrl+C</strong> to copy selected cells</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-600 mr-2">•</span>
                      <span><strong className="text-gray-900">Ctrl+V</strong> to paste cells</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-600 mr-2">•</span>
                      <span>Copy preserves cell formatting and structure</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-orange-600 mr-2">•</span>
                      <span>Also copies to system clipboard as text</span>
                    </li>
                  </ul>
                </div>

                {/* Operations */}
                <div className="lg:col-span-2">
                  <h4 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Operations
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start">
                        <span className="text-purple-600 mr-2">•</span>
                        <span><strong className="text-gray-900">Right-click</strong> for context menu with table operations</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-purple-600 mr-2">•</span>
                        <span><strong className="text-gray-900">Ctrl+S</strong> to save changes</span>
                      </li>
                    </ul>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start">
                        <span className="text-purple-600 mr-2">•</span>
                        <span>Use toolbar buttons for row/column operations</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-purple-600 mr-2">•</span>
                        <span>Merge and split cells for complex layouts</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Dialog Footer */}
            <div className="flex justify-end p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowHelpDialog(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
