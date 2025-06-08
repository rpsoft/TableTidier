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
    if (tableContent?.[0]) {
      const $ = cheerio.load(tableContent[0]);
      const table = $("table");

      if (!table.length) {
        return [
          ["table is empty or does not include a valid html <table> tag"],
          ["--- Here an extract of the document ---"],
          [tableContent[0].slice(0, 300) + "..."],
        ];
      }

      const matrix = [];
      table.find("tr").each((r, tr) => {
        $(tr)
          .find("th, td")
          .each((_, cell) => {
            const $cell = $(cell);
            const colspan = parseInt($cell.attr("colspan") || "1", 10);
            const rowspan = parseInt($cell.attr("rowspan") || "1", 10);
            const text = $cell.text();

            if (!matrix[r]) matrix[r] = [];
            let c = 0;
            while (matrix[r][c] !== undefined) {
              c++;
            }

            for (let ri = r; ri < r + rowspan; ri++) {
              if (!matrix[ri]) {
                matrix[ri] = [];
              }
              for (let ci = c; ci < c + colspan; ci++) {
                matrix[ri][ci] = "";
              }
            }
            matrix[r][c] = text;
          });
      });

      if (matrix.length > 0) {
        const maxCols = matrix.reduce(
          (max, row) => Math.max(max, row ? row.length : 0),
          0
        );

        return matrix.map((row) => {
          const newRow = row || [];
          while (newRow.length < maxCols) {
            newRow.push("");
          }
          return newRow;
        });
      }

      return matrix;
    } else {
      return [["table is empty or does not include a valid html <table> tag"]];
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

			// Ignoring header nodes.
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
