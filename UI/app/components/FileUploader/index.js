/**
 *
 * FileUploader
 *
 */

import React, { useEffect, memo, useState } from 'react';
import Button from '@material-ui/core/Button';
import { DropzoneDialog } from 'material-ui-dropzone';


import {URL_BASE} from '../../links'
// import fetchData from '../../network/fetch-data';


import request from 'superagent'

// import PropTypes from 'prop-types';
// import styled from 'styled-components';

function FileUploader() {

    const [open, setOpen] = useState(false);
    const [files, setFiles] = useState([]);


    const transferFiles = (acceptedFiles) => {

      const req = request.post('/api/tableUploader')
      acceptedFiles.forEach(file => {
        req.attach("fileNames", file)
      })
      req.end();
    }

    const handleClose = () => {
       setOpen(false)
     }

    const handleSave = (files) => {
       setFiles(files)
       setOpen(false)
       transferFiles(files)
     }

    const handleOpen = () => {
       setOpen(true)
    }

    //
    // const onFileChange = event => {
    //
    //       // Update the state
    //       var selectedFile = event.target.files[0]
    //
    //         // Create an object of formData
    //       const formData = new FormData();
    //
    //       // Update the formData object
    //       formData.append(
    //         "myFile",
    //         selectedFile,  DropzoneAreaBase
    //         selectedFile.name
    //       );
    //
    //       // Details of the uploaded file
    //       console.log(selectedFile.name);
    //       let fetch = new fetchData();
    //       fetch.fileUpload(formData)
    //     };
    //

    return <div>
              <Button onClick={handleOpen}>
                Add Files
              </Button>
              <DropzoneDialog
                  open={open}
                  onSave={ handleSave }
                  acceptedFiles={['text/html']}
                  showPreviews={true}
                  maxFileSize={5000000}
                  filesLimit={10}
                  onClose={ handleClose }
              />
            </div>
}

FileUploader.propTypes = {};

export default FileUploader;
