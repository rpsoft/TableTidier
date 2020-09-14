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

    return <div>
              <Button variant="contained"  onClick={handleOpen}>
                Upload Tables
              </Button>
              <DropzoneDialog
                  open={ open }
                  onSave={ handleSave }
                  acceptedFiles={ ['text/html', "application/zip"] }
                  showPreviews={ true }
                  maxFileSize={ 10000000 }
                  filesLimit={ 10 }
                  onClose={ handleClose }
              />
            </div>
}

FileUploader.propTypes = {};

export default FileUploader;
