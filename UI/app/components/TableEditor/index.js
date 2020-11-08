/**
 *
 * TableEditor
 *
 */

import React, { memo } from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

import CKEditor from 'ckeditor4-react';

import EditIcon from '@material-ui/icons/Edit';
import Switch from '@material-ui/core/Switch';

var ReactDOMServer = require('react-dom/server');
var HtmlToReact = require('html-to-react')
var HtmlToReactParser = require('html-to-react').Parser;

function TableEditor({
  editorID,
  textContent,
  saveTextChanges,
  editorEnabled,
  height,
}) {

  const [editorContent, setEditorContent] = React.useState(textContent);
  // const [editorEnabled, setEditorEnabled] = React.useState(false);

  // //
  React.useEffect(
  () => {
    setEditorContent(textContent)
  }, [textContent]);

  const clearEditor = (CKEDITOR) => {

  }

  const prepareEditor = (CKEDITOR) => {


    if ( CKEDITOR.config.stylesSet != "my_styles"){

      CKEDITOR.stylesSet.add( 'my_styles', [
         { name: 'Indent', element: 'p',  attributes: { 'class': 'indent1' }},
         { name: 'Superscript', element: 'sup',  attributes: {}},
         { name: 'Subscript', element: 'sub',  attributes: {}}
       ] );

       CKEDITOR.config.stylesSet = 'my_styles';
     }
  }

  // ((!editorEnabled) ? setEditorEnabled(!editorEnabled) : saveTextChanges(editorContent) )

  return (
      <div>
        {
          // <div style={{width:"100%", textAlign:"right"}}>
          //     <span style={{border:"1px solid #b3b3b3", borderRadius: 5, height:40, display: "inline-block", paddingRight:5, marginBottom:5}}>
          //       <Switch
          //           checked={editorEnabled}
          //           onChange={() => { setEditorEnabled(!editorEnabled); saveTextChanges(editorContent); }}
          //           name="checkedA"
          //           inputProps={{ 'aria-label': 'secondary checkbox' }}
          //         />
          //       <EditIcon />
          //     </span>
          // </div>
          }
        {
        !editorEnabled ? <div dangerouslySetInnerHTML={{__html : editorContent}}></div> : <CKEditor

            type="classic"

            key = {editorID}
            name = {editorID}

            onBeforeLoad={
              ( CKEDITOR ) => {
                CKEDITOR.disableAutoInline = true; clearEditor(CKEDITOR); prepareEditor(CKEDITOR);
              }
            }

            config={{
                allowedContent : true,
                toolbar : [
                            { name: 'document', groups: [ 'mode', 'document', 'doctools' ], items: [ 'Source', '-', 'Save', 'NewPage', 'Preview', 'Print', '-', 'Templates' ] },
                            { name: 'clipboard', groups: [ 'clipboard', 'undo' ], items: [ 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo' ] },
                            { name: 'editing', groups: [ 'find', 'selection', 'spellchecker' ], items: [ 'Find', 'Replace', '-', 'SelectAll', '-', 'Scayt' ] },
                            { name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ], items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'CopyFormatting', 'RemoveFormat' ] },
                            { name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ], items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'BidiLtr', 'BidiRtl', 'Language' ] },
                            // { name: 'links', items: [ 'Link', 'Unlink', 'Anchor' ] },
                            { name: 'styles', items: [ 'Styles', 'Format', 'Font', 'FontSize' ] },
                            { name: 'colors', items: [ 'TextColor', 'BGColor' ] },
                            { name: 'tools', items: [ 'Maximize', 'ShowBlocks' ] }
                            // { name: 'forms', items: [ 'Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField' ] },
                            // { name: 'insert', items: [ 'Image', 'Flash', 'Table', 'HorizontalRule', 'Smiley', 'SpecialChar', 'PageBreak', 'Iframe' ] },
                            // { name: 'others', items: [ '-' ] },
                            // { name: 'about', items: [ 'About' ] }
                          ],
                height: height ? height : 300
            }}

            data={ textContent || "" }

            onChange={ (event, editor) => {
                const data = event.editor.getData();
                setEditorContent(data)
                saveTextChanges(data)
            }}

            onKey={ (event, editor) => {
            }}


      />
    }</div>
  );
}

TableEditor.propTypes = {};

export default memo(TableEditor);
