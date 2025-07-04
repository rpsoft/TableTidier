const fs = require('fs');
const cheerio = require('cheerio');

fs.readFile('./archdischild-2017-314354.html', 'utf8', (err, html) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  const $ = cheerio.load(html);
  const rootNode = $("html")[0]

  let spanCount = 0;


    $("div").each((divIndex, div) => {

	    if ( $(div).find("div").length > 0 ) {
		    return
	    }

      	$(div).attr("id", "div"+divIndex);

      	const allSpans = $(div).find("span")

		let divMap = {}


		if (allSpans.length > 0) {
			divMap = $(div).find("span").toArray().reduce((acc, span, spanIndex) => {

				let distanceFromTopDiv = 0;
				// debugger
				let currentElement = $(span);

				while (currentElement.length > 0 && $($(currentElement)[0]).attr("id") !== $(div).attr("id")) {
					distanceFromTopDiv++;
					currentElement = currentElement.parent();
				}

				// totalDistance += distanceFromTopDiv;
				spanCount++;

				// debugger
				// console.log(`Span ${spanIndex + 1} is at distance ${distanceFromTopDiv} from the parent div`);
				acc.distanceMap.push(distanceFromTopDiv);
				acc.contentMap.push($(span).text());
				acc.contentTypeMap.push($(span).text().replace(/[a-zA-Z]/g, '').trim().length > ($(span).text().length/2));

				return acc;
			}, {
				distanceMap: [],
				contentMap: [],
				contentTypeMap: []
			});

			console.log(`Div ${divIndex + 1} contains
							${divMap.distanceMap.length} spans
							${divMap.distanceMap.join(',')}
							${divMap.contentTypeMap.join(',')}
							${divMap.contentMap.join(',')}
							${$(div).text()}`);
		}

    });
  // Now you can use `$` to manipulate and inspect the HTML

});



// const $ = cheerio.load(html);
// let totalDistance = 0;
// let spanCount = 0;



//   $("span").each((index, span) => {

// 	    let distanceFromTop = 0;
// 	    let currentElement = $(span);

// 	    while (currentElement.length > 0 && currentElement[0].name !== rootNode.name) {
// 		    distanceFromTop++;
// 		    currentElement = currentElement.parent();
// 	    }

// 	    totalDistance += distanceFromTop;
// 	    spanCount++;

// 	    console.log(`Span ${index + 1} is at distance ${distanceFromTop} from the top`);
//   });


// if (spanCount > 0) {
//   const averageDistance = totalDistance / spanCount;
//   console.log(`Average distance of spans from the top: ${averageDistance}`);
// } else {
//   console.log("No spans found in the document");
// }
// // Now you can use `$` to manipulate and inspect the HTML

// });
