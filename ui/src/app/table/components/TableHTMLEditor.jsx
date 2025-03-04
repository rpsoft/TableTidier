import YooptaEditor, { createYooptaEditor, Elements, Blocks, useYooptaEditor } from '@yoopta/editor';

import Paragraph from '@yoopta/paragraph';
import Blockquote from '@yoopta/blockquote';
import Link from '@yoopta/link';
import Callout from '@yoopta/callout';
import Accordion from '@yoopta/accordion';
import { NumberedList, BulletedList, TodoList } from '@yoopta/lists';
import { Bold, Italic, CodeMark, Underline, Strike, Highlight } from '@yoopta/marks';
import { HeadingOne, HeadingThree, HeadingTwo } from '@yoopta/headings';
import Code from '@yoopta/code';
import Table from '@yoopta/table';
import Divider from '@yoopta/divider';
import ActionMenuList, { DefaultActionMenuRender } from '@yoopta/action-menu-list';
import Toolbar, { DefaultToolbarRender } from '@yoopta/toolbar';
import LinkTool, { DefaultLinkToolRender } from '@yoopta/link-tool';
import * as cheerio from 'cheerio';
import parsers from '@yoopta/exports';

import { useEffect, useMemo, useRef, useState } from 'react';
import { WITH_EXPORTS_INIT_VALUE } from './initValue';
// import { HtmlPreview } from '@/components/parsers/html/HtmlPreview/HtmlPreview';
// import { MarkdownPreview } from '@/components/parsers/markdown/MarkdownPreview/MarkdownPreview';

const plugins = [
  Paragraph,
  Table,
  Divider,
  Accordion,
  HeadingOne,
  HeadingTwo,
  HeadingThree,
  Blockquote,
  Callout,
  NumberedList,
  BulletedList,
  TodoList,
  Code,
  Link
];

const TOOLS = {
  ActionMenu: {
    render: DefaultActionMenuRender,
    tool: ActionMenuList,
  },
  Toolbar: {
    render: DefaultToolbarRender,
    tool: Toolbar,
  },
  LinkTool: {
    render: DefaultLinkToolRender,
    tool: LinkTool,
  },
};

const MARKS = [Bold, Italic, CodeMark, Underline, Strike, Highlight];

export default function TableHTMLEditor({
	initialHtml,
	saveHtml
}) {
	const editor = useMemo(() => createYooptaEditor(), []);
	const selectionRef = useRef(null);

	const [value] = useState(WITH_EXPORTS_INIT_VALUE)
    const [html, setHTML] = useState('');

    const deserializeHTML = (content) => {
        const parsed_content = parsers.html.deserialize(editor, content);
        editor.setEditorValue(parsed_content);
      };

	useEffect(() => {
		deserializeHTML(initialHtml)
	}, [initialHtml] )


    const serializeHTML = () => {
     	var $ = cheerio.load(html)
		saveHtml($("table").parent().html() || "")
    };

	const handleChange = (value) => {
		const htmlString = parsers.html.serialize(editor, value);
	    setHTML(htmlString);
	  };

	return (
		<div className="pl-[100px] flex flex-col justify-center items-center bg-white">
			{/* <button  className='btn'  onClick={deserializeHTML}>Deserialize from html to content</button> */}
      		<button  className='btn' onClick={serializeHTML}>Save Changes</button>
		    <div ref={selectionRef}>
			    <YooptaEditor
			        editor={editor}
			        plugins={plugins}
			        tools={TOOLS}
			        marks={MARKS}
			        selectionBoxRoot={selectionRef}
			        value={value}

					onChange={handleChange}

					style={{
				        paddingBottom: 10,
				        color: "black",
						width: "100%"
			        }}
			    />
		    </div>
		</div>
	);
}
