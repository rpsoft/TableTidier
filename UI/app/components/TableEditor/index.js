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

import {CKEditor} from 'ckeditor4-react';

// import EditIcon from '@material-ui/icons/Edit';
// import Switch from '@material-ui/core/Switch';

import cheerio from 'cheerio'

const ReactDOMServer = require('react-dom/server');
const HtmlToReact = require('html-to-react')
const HtmlToReactParser = require('html-to-react').Parser;

function TableEditor({
  editorID,
  textContent,
  editorEnabled,
  editorRef,
  height,
  metadata,
  cuisIndex,
  showEditCuis
}) {
  const [editorContent, setEditorContent] = React.useState(textContent);
  // const [editorEnabled, setEditorEnabled] = React.useState(false);

  React.useEffect(
  () => {
    setEditorContent(textContent)
  }, [textContent]);

  const clearEditor = (CKEDITOR) => {
  }

  const prepareEditor = (CKEDITOR) => {
    if ( CKEDITOR.config.stylesSet != "my_styles" ) {

      CKEDITOR.stylesSet.add( 'my_styles', [
        { name: 'Indent', element: 'p',  attributes: { 'class': 'indent1' }},
        { name: 'Superscript', element: 'sup',  attributes: {}},
        { name: 'Subscript', element: 'sub',  attributes: {}}
      ]);

      CKEDITOR.config.stylesSet = 'my_styles';
    }
  }

  let injected = editorContent;

  if ( injected && showEditCuis ) {
    const toinject = cheerio.load(injected)
    // Select td elements
    const tdElements = toinject('td')
    // Assign cui to each metadata
    Object.keys(metadata).forEach(
      metadataElement => {
        try{
          if ( metadataElement.replace(/[^A-z]/gi, '').length > 0 ) {

            const tdThatMatchMetadataConcept = tdElements.filter(index => {
              // Where to find td -> text
              // element -> text
              // element.firstChild.data
              if (
                tdElements[index].firstChild &&
                tdElements[index].firstChild.data &&
                tdElements[index].firstChild.data.trim() === metadata[metadataElement].concept
              ) {
                return true
              }

              // element -> p -> text
              // element.firstChild.firstChild.data
              if (
                tdElements[index].firstChild &&
                tdElements[index].firstChild.firstChild &&
                tdElements[index].firstChild.firstChild.data &&
                tdElements[index].firstChild.firstChild.data.trim() === metadata[metadataElement].concept
              ) {
                return true
              }

              return false
            })

            // If not pair td tag / metadata.concept then return
            if (tdThatMatchMetadataConcept.length == 0) {
              return
            }

            const metadataElementCuisSelectedPreferred = metadata[metadataElement]
              .cuis_selected
              .map( cui => cui + ': ' + cuisIndex[cui].preferred )
            // if ( toinject('td:contains("'+metadata[metadataElement].concept+'")').text().toLowerCase().trim() == metadata[metadataElement].concept.trim() ) {

            tdThatMatchMetadataConcept.css('margin-bottom', '0px')
            tdThatMatchMetadataConcept.attr(
              'title',
              metadataElementCuisSelectedPreferred
                .join('; ')
            )
            tdThatMatchMetadataConcept.append(
              '<p style="margin: 0px; color: #429be8;">'+
                metadataElementCuisSelectedPreferred
                  .join('<br />') +
              '</p>'
            )
            // }
          }
        } catch ( err ){
          console.log(err)
        }
      }
    )

    injected = toinject.html()
  }

  if (editorEnabled == false) {
    return <div dangerouslySetInnerHTML={{__html: injected}}></div>
  }

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

      <CKEditor
        initData={ textContent }

        type="classic"

        key={editorID}
        name={editorID}

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
          height: height ? height : 300,
          bodyId: 'smlk',
        }}

        onInstanceReady={ ( { editor } ) => {
          // Handles native `instanceReady` event.
          // share editor reference with father component
          editorRef(editor)
        }}
      />
    </div>
  );
}

// TableEditor.propTypes = {};

export default memo(TableEditor);
