// All these will modify and return a new table to be displayed/replace the previous one.
import * as cheerio from "cheerio";

const findClosestPoints = (arrayOfLists, givenPoint) => {
    const [gx, gy] = givenPoint.split('-').map(Number);

    // Calculate the Manhattan distance between two points
    function calculateDistance(point1, point2) {
        const [x1, y1] = point1.split('-').map(Number);
        const [x2, y2] = point2.split('-').map(Number);
        return Math.abs(x1 - x2) + Math.abs(y1 - y2);
    }

    return arrayOfLists.map(list => {
        let closestPoint = null;
        let minDistance = Infinity;

        for (const point of list) {
            const [px, py] = point.split('-').map(Number);

            // Ensure the point is above or at the same level as the given point
            if (py > gy) continue;
            if (px > gx) continue;

            const distance = calculateDistance(point, givenPoint);

            // Update the closest point if this point is nearer
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = point;
            }
        }

        return closestPoint;
    });
}


const Tabletools = {
	// This is quite awesome. All nodes sorted here in a recursive structure of arrays! if a valid table content is supplied.
  contentToNodes: (tableContent) => {

	if (tableContent && tableContent[0]) {
		const $ = cheerio.load(tableContent[0]);

		// Find the table element
		const table = $("table")[0];
		if (!table) {
			return [
				["table is empty or does not include a valid html <table> tag"],
				["--- Here an extract of the document ---"],
				[tableContent[0].slice(0, 300)+"..."]
			];
		}

		// Get all rows
		const rows = $(table).find("tr").toArray();
		const allnodes = [];

		// First, determine the maximum number of columns needed
		let maxCols = 0;
		rows.forEach(row => {
			const cells = $(row).find("td, th").toArray();
			let colCount = 0;
			cells.forEach(cell => {
				const colspan = parseInt($(cell).attr('colspan') || '1');
				colCount += colspan;
			});
			maxCols = Math.max(maxCols, colCount);
		});

		// Create a 2D grid to track cell positions
		const grid = Array(rows.length).fill(null).map(() => Array(maxCols).fill(null));

		// Place cells in the grid, accounting for colspan/rowspan
		rows.forEach((row, rowIndex) => {
			const cells = $(row).find("td, th").toArray();
			let colIndex = 0;
			
			cells.forEach(cell => {
				const colspan = parseInt($(cell).attr('colspan') || '1');
				const rowspan = parseInt($(cell).attr('rowspan') || '1');
				const cellContent = $(cell).text();
				
				// Find the next available position in this row
				while (colIndex < maxCols && grid[rowIndex][colIndex] !== null) {
					colIndex++;
				}
				
				// Place the cell content in the grid
				grid[rowIndex][colIndex] = cellContent;
				
				// Mark cells covered by this merged cell
				for (let r = rowIndex; r < rowIndex + rowspan; r++) {
					for (let c = colIndex; c < colIndex + colspan; c++) {
						if (r !== rowIndex || c !== colIndex) {
							if (r < grid.length && c < grid[r].length) {
								grid[r][c] = ""; // Empty string for merged cells
							}
						}
					}
				}
				
				colIndex += colspan;
			});
		});

		// Convert grid to the expected format
		grid.forEach(row => {
			allnodes.push(row);
		});

		return allnodes;

	} else {
		return [["table is empty or does not include a valid html <table> tag"]]
	}
  },

  selectSimilarRows : () => {

  },

  selectSimilarColumns : () => {

  },

  annotationsToTable : ( tableNodes, annotations ) => {
    if (!Array.isArray(annotations)) {
      return [];
    }

    const conceptNodes = annotations.map( ann => Object.keys(ann.concepts))
    const conceptKeys = conceptNodes.flat()

    const dataNodes = Array.from(new Set(tableNodes.map( (row,r) => {

		return row.map((col, c) => {

			// Skip cells that are already annotated
			if ( conceptKeys.indexOf( r+"-"+c ) > -1 ){
				return null
			}

			var key = r+"-"+c

			// debugger
			var conceptPoints = findClosestPoints(conceptNodes, key)
			var concepts = conceptPoints.map(
				(cat, c) => {
					// debugger
					return {...annotations[c].concepts[cat], rowIndex: annotations[c].rowIndex}
				}
			).filter( c => c != undefined)


			concepts = Object.values(Object.groupBy( concepts, ({rowIndex}) => rowIndex))
			return {
				concepts,
				cellData : col,
			}

		})
    }))).filter( a => a != null)

    return dataNodes
  }

};

export default Tabletools;
