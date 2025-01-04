// All these will modify and return a new table to be displayed/replace the previous one.
import * as cheerio from "cheerio";

const Tabletools = {
	// This is quite awesome. All nodes sorted here in a recursive structure of arrays! if a valid table content is supplied.
  contentToNodes: (tableContent) => {
	if (tableContent && tableContent[0]) {
		const $ = cheerio.load(tableContent[0]);

		function traverseNodes(node) {
			var content = [];

			node.children?.forEach((child) => {
				console.log(child.tagName);
				if (child.tagName === "td") {
					const childContent = $(child).text();
					content = [...content, childContent];
				}

				var recContent = traverseNodes(child);
				if (recContent.length > 0) content = [...content, recContent];
			});

			return content;
		}

		var allnodes =  $("table")[0] ? traverseNodes($("table")[0]).flat() : [
			["table is empty or does not include a valid html <table> tag"],
			["--- Here an extract of the document ---"],
			[tableContent[0].slice(0, 300)+"..."]
		]

		return allnodes

	} else {
		return [["table is empty or does not include a valid html <table> tag"]]
	}
  },

};

export default Tabletools;
