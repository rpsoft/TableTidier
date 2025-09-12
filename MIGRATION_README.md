# TableTidier Annotation Migration

This migration script fixes annotation row indices for tables that contain `<th>` elements (table headers).

## Problem

After enabling support for `<th>` elements in the table processing, existing annotations are offset by one row because:
- Previously: Only `<td>` elements were processed, so row 0 was the first data row
- Now: Both `<td>` and `<th>` elements are processed, so row 0 is the header row, and data starts at row 1

## Solution

This script:
1. Identifies tables that contain `<th>` elements in their HTML content
2. Shifts all annotation row indices up by 1 for those tables
3. Updates the database with corrected annotations

## Usage

### Prerequisites

1. Install dependencies:
```bash
npm install --package-lock-only --package-lock migration-package.json
```

2. The script automatically loads the MONGODB_URI from `ui/.env` file. If you need to override it, you can set the environment variable:
```bash
export MONGODB_URI="your_custom_mongodb_connection_string"
```

### Running the Migration

1. **Dry Run (Recommended first)** - Shows what would be changed without making changes:
```bash
node migrate-annotations.js --dry-run
```

2. **Live Run** - Actually applies the changes:
```bash
node migrate-annotations.js
```

### What Gets Updated

For each table with `<th>` elements, the script updates:

1. **`rowIndex`** property in each annotation group
2. **Concept keys** in the format `"row-col"` (e.g., `"0-1"` becomes `"1-1"`)
3. **Cells array** with `[row, col]` coordinates
4. **`updatedAt`** timestamp

### Example

Before migration:
```javascript
{
  "rowIndex": 0,
  "concepts": {
    "0-1": { "content": "Patient ID", "tablePosition": [0, 1] },
    "0-2": { "content": "Age", "tablePosition": [0, 2] }
  },
  "cells": [[0, 1], [0, 2]]
}
```

After migration:
```javascript
{
  "rowIndex": 1,
  "concepts": {
    "1-1": { "content": "Patient ID", "tablePosition": [1, 1] },
    "1-2": { "content": "Age", "tablePosition": [1, 2] }
  },
  "cells": [[1, 1], [1, 2]]
}
```

## Safety Features

- **Dry run mode**: Test the migration without making changes
- **Error handling**: Continues processing even if individual tables fail
- **Backup recommendation**: Always backup your database before running migrations
- **Detailed logging**: Shows progress and results for each table

## Rollback

If you need to rollback the changes:
1. Restore from your database backup
2. Or create a reverse migration script that subtracts 1 from all row indices

## Troubleshooting

- **Connection issues**: Verify your `MONGODB_URI` in `ui/.env` is correct, or set it as an environment variable
- **Permission errors**: Ensure your MongoDB user has read/write access
- **Memory issues**: For large databases, consider processing in batches
- **Environment file not found**: Make sure the script is run from the TableTidier root directory

## Support

If you encounter issues:
1. Check the console output for detailed error messages
2. Verify your MongoDB connection and permissions
3. Test with a small subset of data first using dry-run mode
