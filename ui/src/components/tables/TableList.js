'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Download } from 'lucide-react';
import Tabletools from '@/app/table/tableTools'; // Import Tabletools

export default function TableList({ tables, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);
  // State to cache processed extracted data for each table
  const [processedDataCache, setProcessedDataCache] = useState({}); 
  const [isDownloadingAll, setIsDownloadingAll] = useState(false); // Loading state for Download All

  if (tables.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">No tables in this collection yet. Upload one to get started!</p>
      </div>
    );
  }

  const formatDate = (date) => {
    try {
      if (!date) return 'No date';
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Invalid date';
      return d.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleDelete = async (tableId, collectionId) => {
    if (isDeleting) return;
    
    if (!window.confirm('Are you sure you want to delete this table?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/collections/${collectionId}/tables/${tableId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete(tableId);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete table');
      }
    } catch (error) {
      console.error('Error deleting table:', error);
      alert('Failed to delete table');
    } finally {
      setIsDeleting(false);
    }
  };

  // Fetch full table data
  const fetchTableData = async (table) => {
    if (!table || !table.id || !table.collectionId) {
      console.error('Missing table ID or collection ID for fetching data');
      return null;
    }
    const { id: tableId, collectionId } = table;
    try {
      const response = await fetch(`/api/collections/${collectionId}/tables/${tableId}`); 
      if (response.ok) {
        const tableData = await response.json();
        return tableData;
      }
      console.error('Failed to fetch table data:', response.status, response.statusText);
      return null;
    } catch (error) {
      console.error('Error fetching table data:', error);
      return null;
    }
  };

  // Process raw table data to get extracted data structure
  const processExtractedData = (tableData) => {
    if (!tableData?.annotationData?.annotations || !tableData.htmlContent) {
      console.log('No annotations or HTML content found for processing');
      return [];
    }
    
    try {
      const tableContent = [tableData.htmlContent];
      const tableNodes = Tabletools.contentToNodes(tableContent);
      const extracted = Tabletools.annotationsToTable(tableNodes, tableData.annotationData.annotations);
      return extracted;
    } catch (error) {
      console.error('Error processing extracted data:', error);
      return [];
    }
  };

  // Transform processed data into the final format for download (same as in TableResults)
  const transformDataForDownload = (data) => {
    return data
      .flatMap((row, rowIndex) => 
        row.map((cell, colIndex) => {
          // Ensure cell and concepts exist and cellData is not empty
          if (!cell || !Array.isArray(cell.concepts) || cell.concepts.length === 0 || !cell.cellData || !cell.cellData.trim()) return null;
          
          // Ensure concepts have the nested structure [[{content: '...'}], ...]
          const validConcepts = cell.concepts.map(conceptGroup => 
            Array.isArray(conceptGroup) ? conceptGroup.map(con => con?.content).filter(Boolean) : []
          ).filter(group => group.length > 0);

          if (validConcepts.length === 0) return null;

          return {
            value: cell.cellData,
            position: [rowIndex, colIndex],
            // Map nested concept content
            concepts: validConcepts 
          };
        })
      )
      .filter(item => item != null);
  };

  // Generic function to get processed data, fetching if necessary
  const getProcessedData = async (table) => {
    if (processedDataCache[table.id]) {
      return processedDataCache[table.id];
    }
    
    const tableData = await fetchTableData(table);
    if (!tableData) return null;

    const processedData = processExtractedData(tableData);
    setProcessedDataCache(prev => ({ ...prev, [table.id]: processedData }));
    return processedData;
  };

  // Download Handlers
  const handleJSONDownload = async (table) => {
    const processedData = await getProcessedData(table);
    if (!processedData || processedData.length === 0) {
      alert('No extracted data available to download.');
      return;
    }

    const transformedData = transformDataForDownload(processedData);
    if (transformedData.length === 0) {
       alert('No valid data found after transformation.');
       return;
    }

    const jsonData = JSON.stringify(transformedData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table.fileName}_extracted.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCSVDownload = async (table) => {
    const processedData = await getProcessedData(table);
     if (!processedData || processedData.length === 0) {
      alert('No extracted data available to download.');
      return;
    }

    const transformedData = transformDataForDownload(processedData);
     if (transformedData.length === 0) {
       alert('No valid data found after transformation.');
       return;
    }

    const headers = ['Value', 'Row', 'Column', 'Concepts'];
    
    const csvRows = [
      headers.join(','),
      ...transformedData.map(item => {
        const row = item.position[0];
        const col = item.position[1];
        // Join nested paths with ' -> ', separate different paths with ';'
        const concepts = item.concepts.map(conceptPath => conceptPath.join(' -> ')).join(';');
        // Quote value if it contains comma, quotes, or whitespace
        const needsQuotingValue = /[",\s]/.test(item.value);
        const value = needsQuotingValue ? `"${item.value.replace(/"/g, '""')}"` : item.value;
        // Always quote concepts as they contain -> and ;
        const quotedConcepts = `"${concepts.replace(/"/g, '""')}"`;
        return [value, row, col, quotedConcepts].join(',');
      })
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table.fileName}_extracted.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download All Handler (JSON only for now)
  const handleDownloadAllJSON = async () => {
    setIsDownloadingAll(true);
    let results = [];
    let failedTables = [];

    // Use Promise.all to fetch and process data for all tables concurrently
    results = await Promise.all(tables.map(async (table) => {
      const processedData = await getProcessedData(table);
      
      // If fetching/processing failed for this table
      if (processedData === null) {
        failedTables.push(table.fileName);
        return null; // Indicate failure for this table
      }
      
      // If processing succeeded but yielded no data
      if (processedData.length === 0) {
          return { 
              sourceTable: table.fileName, 
              extractedData: [] // Return empty array for tables with no extracted data
          }; 
      }
      
      // Transform the successfully processed data
      const transformedData = transformDataForDownload(processedData);
      
      // Return the desired structure for this table
      return { 
        sourceTable: table.fileName, 
        extractedData: transformedData 
      };
    }));

    setIsDownloadingAll(false);

    // Filter out null results from failed fetches/processes
    const successfulResults = results.filter(result => result !== null);

    if (failedTables.length > 0) {
        alert(`Failed to fetch or process data for the following tables: ${failedTables.join(', ')}. Their data will be excluded from the download.`);
    }

    if (successfulResults.length === 0) {
      alert('No data could be extracted from any tables in this collection.');
      return;
    }
    
    // The final structure is now an array of table objects
    const jsonData = JSON.stringify(successfulResults, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_tables_extracted.json`; 
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="overflow-x-auto">
      {/* Add Download All button above the table */}
      <div className="flex justify-end mb-4 mr-2">
        <button
          onClick={handleDownloadAllJSON}
          disabled={isDownloadingAll || tables.length === 0}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          title="Download extracted data from all tables in this list as a single JSON file"
        >
          <Download size={18} />
          {isDownloadingAll ? 'Downloading...' : 'Download All (.json)'}
        </button>
      </div>

      <table className="w-full">
        <thead className="bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Table Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Upload Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Preview</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-gray-900 divide-y divide-gray-700">
          {tables.map((table) => (
            <tr key={table.id} className="hover:bg-gray-800 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/table?tableId=${table.id}`}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  {table.fileName}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                {formatDate(table.createdAt)}
              </td>
              <td className="px-6 py-4">
                <div 
                  className="text-sm text-gray-300 overflow-hidden max-h-20"
                  dangerouslySetInnerHTML={{ __html: table.htmlContent }}
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex justify-end items-center gap-3"> {/* Increased gap slightly */}
                  {/* Updated JSON Download Button */}
                  <button
                    onClick={() => handleJSONDownload(table)}
                    className="text-blue-400 hover:text-blue-300 transition-colors p-1 flex items-center gap-1" 
                    title={`Download ${table.fileName} Extracted Data (.json)`}
                  >
                    <Download size={16} /> .json
                  </button>
                  {/* Updated CSV Download Button */}
                  <button
                    onClick={() => handleCSVDownload(table)}
                    className="text-green-400 hover:text-green-300 transition-colors p-1 flex items-center gap-1"
                    title={`Download ${table.fileName} Extracted Data (.csv)`}
                  >
                    <Download size={16} /> .csv
                  </button>
                  {/* Delete Button - Unchanged text, added title */}
                  <button
                    onClick={() => handleDelete(table.id, table.collectionId)}
                    disabled={isDeleting}
                    className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1 ml-2" /* Added margin */
                    title="Delete Table"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 