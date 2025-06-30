import { NextResponse } from 'next/server';
import dbConnect from '@/database/connection';
import { Collection } from '@/database/collection.model';
import { Document } from '@/database/document.model';
import { Table } from '@/database/table.model';

export async function GET() {
  try {
    console.log('Testing database connection...');
    await dbConnect();
    console.log('Database connected successfully');
    
    // Test creating a collection
    const testCollection = new Collection({
      name: 'Test Collection',
      description: 'Test collection for debugging',
      userId: 'test@example.com'
    });
    
    console.log('Saving test collection...');
    await testCollection.save();
    console.log('Test collection saved successfully');
    
    // Test creating a document
    const testDocument = new Document({
      name: 'Test Document',
      fileName: 'test.html',
      htmlContent: '<html><body><table><tr><td>Test</td></tr></table></body></html>',
      collectionId: testCollection._id,
      userId: 'test@example.com'
    });
    
    console.log('Saving test document...');
    await testDocument.save();
    console.log('Test document saved successfully');
    
    // Test table extraction
    const { JSDOM } = await import('jsdom');
    const htmlContent = testDocument.htmlContent;
    const tables = [];
    
    try {
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;
      const tableElements = document.querySelectorAll('table');
      
      tableElements.forEach((table, index) => {
        const tableHTML = table.outerHTML;
        const fileName = `table_${index + 1}.html`;
        
        tables.push({
          htmlContent: tableHTML,
          fileName: fileName,
        });
      });
      
      console.log(`Extracted ${tables.length} tables`);
      console.log('Tables to be saved:', tables);
      
      // Test creating tables
      for (const tableData of tables) {
        if (!tableData.fileName || !tableData.htmlContent) {
          console.warn('Skipping table with missing fileName or htmlContent:', tableData);
          continue;
        }
        const testTable = new Table({
          fileName: tableData.fileName,
          htmlContent: tableData.htmlContent,
          documentId: testDocument._id,
          collectionId: testCollection._id,
          userId: 'test@example.com'
        });
        
        await testTable.save();
        console.log(`Table ${tableData.fileName} saved successfully`);
      }
      
    } catch (error) {
      console.error('Error extracting tables:', error);
    }
    
    // Clean up test data
    await Table.deleteMany({ userId: 'test@example.com' });
    await Document.deleteMany({ userId: 'test@example.com' });
    await Collection.deleteMany({ userId: 'test@example.com' });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection and table extraction working correctly',
      tablesExtracted: tables.length
    });
    
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error.message 
    }, { status: 500 });
  }
} 