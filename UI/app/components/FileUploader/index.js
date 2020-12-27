/**
 *
 * FileUploader
 *
 */

import React, { useEffect, memo, useState } from 'react';
import Button from '@material-ui/core/Button';
import { DropzoneDialog } from 'material-ui-dropzone';
import PublishIcon from '@material-ui/icons/Publish';
import {URL_BASE} from '../../links'

import request from 'superagent'

import { makeStyles } from '@material-ui/core/styles';

// import PropTypes from 'prop-types';
// import styled from 'styled-components';

const useStyles = makeStyles((theme) => ({
  previewChip: {
    minWidth: 160,
    maxWidth: 210
  },
}));


function FileUploader({
  baseURL,
  collection_id,
  username_uploader,
  updaterCallBack
}) {


    const classes = useStyles();

    const [open, setOpen] = useState(false);
    const [files, setFiles] = useState([]);

    const transferFiles = (acceptedFiles) => {

      // debugger
      const req = request.post( baseURL )

      acceptedFiles.forEach(file => {
        req.attach("fileNames", file)
      })

      req.field("collection_id", collection_id)
      req.field("username_uploader", username_uploader)
      var result = req.end((err, res) => {
          updaterCallBack ? updaterCallBack() : ""
      });

      // updaterCallBack()
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
                Upload Tables <PublishIcon style={{marginLeft:5}} />
              </Button>
              <DropzoneDialog
                  open={ open }
                  onSave={ handleSave }
                  acceptedFiles={ ['text/html', "application/zip"] }
                  showPreviews={ true }
                  maxFileSize={ 10000000 }
                  filesLimit={ 2000 }
                  onClose={ handleClose }
                  showPreviews={true}
                  showPreviewsInDropzone={false}
                  useChipsForPreview
                  previewGridProps={{container: { spacing: 1, direction: 'row' }}}
                  previewChipProps={classes}
                  previewText="Selected files"
                  showAlerts={['error']}
              />
            </div>
}

FileUploader.propTypes = {};

export default FileUploader;
