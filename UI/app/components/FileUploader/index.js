/**
 *
 * FileUploader
 *
 */

import React, {
  // useEffect,
  // memo,
  useState
} from 'react';
import Button from '@material-ui/core/Button';
import { DropzoneDialog } from 'material-ui-dropzone';
import PublishIcon from '@material-ui/icons/Publish';
import { useSnackbar } from 'notistack';

// import {URL_BASE} from '../../links'

import { makeStyles } from '@material-ui/core/styles';

// import PropTypes from 'prop-types';
// import styled from 'styled-components';

const styleSeed = (theme) => ({
  // DropzoneDialog buttons
  buttonColor: {
    '& > .MuiDialogActions-root': {
      flexDirection: 'row-reverse',
      justifyContent: 'flex-start',
    },
    // Cancel button
    '& > .MuiDialogActions-root > button': {
      marginLeft: 8,
      backgroundColor: theme.palette.dialog.cancel,
      color: 'black',
    },
    // Accept button
    '& > .MuiDialogActions-root > button + button': {
      backgroundColor: theme.palette.dialog.accept,
      color: 'black',
    },
    // Accept button disabled
    '& > .MuiDialogActions-root > button + button[disabled]': {
      backgroundColor: '#f1f1f1',
      color: 'grey',
    },
  },
  chipsMargin: {
    marginBottom: 10,
  },
  // Change classes in function of props added at useStyles call
  chipMarks: (props) => {
    const {filesChecked} = props
    const classes = {}
    filesChecked.forEach((file, index) => {
      const keys = Object.keys(file)
      if (file[keys[0]] == 'not found') return
      classes[`& > div:nth-child(${index + 1}) .MuiChip-outlined`] = {
        border: '1px solid rgb(255 0 0 / 82%)',
        backgroundColor: '#ff82822e',
      }
      // Warning message in red
      classes[`& > div:nth-child(${index + 1}) div[role="button"]::after`] = {
        content: '"already in collection"',
        position: 'absolute',
        bottom: 0,
        left: 21,
        color: 'red',
      }
    })
    return classes
  }
})

function FileUploader({
  // url to upload files
  baseURL,
  // url to check files status
  urlCheck,
  collection_id,
  username_uploader,
  userToken,
  updaterCallBack
}) {

  const useStyles = makeStyles(styleSeed);
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [filesChecked, setFilesChecked] = useState([]);

  const classes = useStyles({
    filesChecked: filesChecked,
  });

  const transferFiles = async (acceptedFiles) => {
    const formData = new FormData();
    // JWT token
    let headers = {}
    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`
    }
    formData.append('collection_id', collection_id);
    formData.append('username_uploader', username_uploader);
    acceptedFiles.forEach(file => {
      formData.append('fileNames', file)
    })

    const result = await fetch(baseURL, {
      method: 'POST',
      headers,
      body: formData,
    })
    const body = await result.json()

    updaterCallBack ? updaterCallBack() : ''
    body.forEach(file => {
      if (file.status == 'success') {
        enqueueSnackbar(file.filename + ' uploaded', {
          // variant: 'success',
          autoHideDuration: 6000,
        })
        return
      }
      if (file.status == 'failed') {
        enqueueSnackbar(file.filename + ' upload aborted ' + file.detail, {
          variant: 'warning',
          // variant: 'error',
          autoHideDuration: 6000,
        })
        return
      }
    })
  }

  const filesCheck = async (filesList) => {
    // If no files or invalid type return
    if (
      Array.isArray(filesList) == false ||
      filesList.length == 0
    ) {
      return
    }
    // filter already checked files
    const filesListFiltered = filesList.filter(elm => elm in filesChecked == false)
    if ( filesListFiltered.length == 0) {
      return
    }

    const params = new URLSearchParams({
      action: 'checkFiles',
      tablesList: JSON.stringify(filesListFiltered.map(file => file.name)),
      'collection_id': collection_id,
      'username_uploader': username_uploader,
    })

    let headers = {}
    // JWT token
    if (userToken) {
      headers['Authorization'] = `Bearer ${userToken}`
    }

    let result = await fetch(urlCheck, {
      method: 'POST',
      headers,
      body: params,
    })

    if (result.status != 200) {
      return
    }

    result = await result.json()

    // checked files: found files will show message in red
    setFilesChecked(result.data)
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
  return (
    <div>
      <Button variant="contained"  onClick={handleOpen}>
        Upload Tables <PublishIcon style={{marginLeft:5}} />
      </Button>
      <DropzoneDialog
        previewText="Selected files"
        open={ open }
        // When add or remove files
        onChange={ async (filesList) => {
          console.log(filesList)
          filesCheck(filesList)
        }}
        onSave={ handleSave }
        onClose={ handleClose }
        acceptedFiles={ ['text/html', 'application/zip'] }
        maxFileSize={ 10000000 }
        filesLimit={ 2000 }
        showPreviews={true}
        showPreviewsInDropzone={false}
        useChipsForPreview={true}
        previewGridClasses={{
          container: classes.chipMarks
        }}
        previewGridProps={{}}
        // removed chip
        onDelete={(msg) => console.log('removed' + msg)}
        previewChipProps={{
          // className: classes.example,
          className: classes.chipsMargin,
        }}
        // Buttons color
        dialogProps={{PaperProps: {className: classes.buttonColor}}}
        showAlerts={['error']}
      />
    </div>
  )
}

FileUploader.propTypes = {};

export default FileUploader;