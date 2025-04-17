import YooptaEditor, {
  createYooptaEditor,
  Elements,
  Blocks,
  useYooptaEditor,
} from "@yoopta/editor";

import Paragraph from "@yoopta/paragraph";
import Blockquote from "@yoopta/blockquote";
import Link from "@yoopta/link";
import Callout from "@yoopta/callout";
import Accordion from "@yoopta/accordion";
import { NumberedList, BulletedList, TodoList } from "@yoopta/lists";
import {
  Bold,
  Italic,
  CodeMark,
  Underline,
  Strike,
  Highlight,
} from "@yoopta/marks";
import { HeadingOne, HeadingThree, HeadingTwo } from "@yoopta/headings";
import Code from "@yoopta/code";
import Table from "@yoopta/table";
import Divider from "@yoopta/divider";
import ActionMenuList, {
  DefaultActionMenuRender,
} from "@yoopta/action-menu-list";
import Toolbar, { DefaultToolbarRender } from "@yoopta/toolbar";
import LinkTool, { DefaultLinkToolRender } from "@yoopta/link-tool";
import * as cheerio from "cheerio";
import parsers from "@yoopta/exports";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { WITH_EXPORTS_INIT_VALUE } from "./initValue";


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
  Link,
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

export default function TableHTMLEditor({ initialHtml, saveHtml }) {
  const editor = useMemo(() => createYooptaEditor(), []);
  const selectionRef = useRef(null);

  const [value] = useState(WITH_EXPORTS_INIT_VALUE);
  const [html, setHTML] = useState("");

  const deserializeHTML = useCallback(
    (content) => {
      const parsed_content = parsers.html.deserialize(editor, content);
      editor.setEditorValue(parsed_content);
    },
    [editor]
  );

  useEffect(() => {
    deserializeHTML(initialHtml);
  }, [deserializeHTML, initialHtml]);

  const serializeHTML = () => {
    if (!html) {
      console.error("No HTML content to save");
      return;
    }
    
    console.log("Current HTML state:", html);
    var $ = cheerio.load(html);
    const tableHtml = $("table").parent().html();
    console.log("Extracted table HTML:", tableHtml);
    
    if (!tableHtml) {
      console.error("No table found in HTML content");
      return;
    }
    
    saveHtml(tableHtml);
  };

  const handleChange = (value) => {
    console.log("Editor value:", value);
    const htmlString = parsers.html.serialize(editor, value);
    console.log("Serialized HTML:", htmlString);
    setHTML(htmlString);
  };

  return (
    <>
        <div className="bg-white flex flex-col" ref={selectionRef}>
        	<div className="w-full justify-end">
        		<button className="btn float-end m-2" onClick={serializeHTML}> Save Changes </button>
        	</div>
            <YooptaEditor
                editor={editor}
                plugins={plugins}
                tools={TOOLS}
                marks={MARKS}
                selectionBoxRoot={selectionRef.current}
                value={value}
                onChange={handleChange}
                style={{
	                paddingBottom: 10,
	                color: "black",
	                width: "100%",
                }}
            />
        </div>

    </>
  );
}
