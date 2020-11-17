/*
 *
 * Annotator actions
 *
 */

import {
  LOAD_TABLE_CONTENT_ACTION,
  LOAD_TABLE_ANNOTATIONS_ACTION,
  LOAD_TABLE_RESULTS_ACTION,
  LOAD_TABLE_METADATA_ACTION,

  UPDATE_TABLE_CONTENT_ACTION,
  UPDATE_TABLE_ANNOTATIONS_ACTION,
  UPDATE_TABLE_RESULTS_ACTION,
  UPDATE_TABLE_METADATA_ACTION,

  SAVE_TABLE_TEXT_ACTION,
  SAVE_TABLE_NOTES_ACTION,
  SAVE_TABLE_ANNOTATIONS_ACTION,
  SAVE_TABLE_METADATA_ACTION,

  ISSUE_ALERT_ACTION,
} from './constants';

// Table Data
export function loadTableContentAction(docid, page, collId) {
  return {
    type: LOAD_TABLE_CONTENT_ACTION,
    docid, page, collId
  };
}

export function updateTableContentAction(tableData) {
  return {
    type: UPDATE_TABLE_CONTENT_ACTION,
    tableData,
  };
}

// Annotation
export function loadTableAnnotationsAction(docid, page, collId) {
  return {
    type: LOAD_TABLE_ANNOTATIONS_ACTION,
    docid, page, collId
  };
}

export function updateTableAnnotationsAction(annotations) {
  return {
    type: UPDATE_TABLE_ANNOTATIONS_ACTION,
    annotations,
  };
}

// Table Results
export function loadTableResultsAction(cachedOnly) {
  return {
    type: LOAD_TABLE_RESULTS_ACTION,
    cachedOnly //docid, page, collId,
  };
}

export function updateTableResultsAction(results) {
  return {
    type: UPDATE_TABLE_RESULTS_ACTION,
    results,
  };
}

// Table Metadata
export function loadTableMetadataAction(docid, page, collId) {
  return {
    type: LOAD_TABLE_METADATA_ACTION,
    docid, page, collId
  };
}

// SAVE_TABLE_TEXT_ACTION
// SAVE_TABLE_NOTES_ACTION
// SAVE_TABLE_ANNOTATIONS_ACTION
// SAVE_TABLE_METADATA_ACTION

// Save Table Content, Notes and completion etc.
export function saveTableTextAction(tableTitle, tableBody) {
  return {
    type: SAVE_TABLE_TEXT_ACTION,
    tableTitle, tableBody
  };
}

// Save Table Content, Notes and completion etc.
export function saveTableNoteAction(notes) {
  return {
    type: SAVE_TABLE_NOTES_ACTION,
    notes
  };
}

// Save Table Annotation
export function saveTableAnnotationAction(tid, annotations) {
  return {
    type: SAVE_TABLE_ANNOTATIONS_ACTION,
    tid, annotations
  };
}

// Save Table Metadata
export function saveTableMetadataAction(metadata) {
  return {
    type: SAVE_TABLE_METADATA_ACTION,
    metadata
  };
}

// Issue alert
export function issueAlertAction(alertData) {
  return {
    type: ISSUE_ALERT_ACTION,
    alertData
  };
}
