import { take, call, put, select, takeLatest } from 'redux-saga/effects';

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

  LOAD_CUIS_INDEX_ACTION,
  UPDATE_CUIS_INDEX_ACTION,
  INSERT_CUIS_INDEX_ACTION,
  DELETE_CUIS_INDEX_ACTION,

  AUTO_LABEL_HEADERS_ACTION,

} from './constants';

import {
  loadTableContentAction,
  loadTableAnnotationsAction,
  loadTableResultsAction,
  loadTableMetadataAction,
  updateTableContentAction,
  updateTableAnnotationsAction,
  updateTableResultsAction,
  updateTableMetadataAction,
  // issueAlertAction,
  updateCuisIndexAction,
  loadCuisIndexAction,
} from './actions';

import appActions, { issueAlertAction } from '../App/actions';

import {
  URL_BASE,
} from '../../links'

import makeSelectAnnotator from './selectors';
import makeSelectLogin from '../Login/selectors'

import 
  request,
  {
    generateOptionsPost
  }
from '../../utils/request';

import {makeSelectLocation, makeSelectCredentials} from '../App/selectors'

import {fetchResultStatusCheck} from '../../utils/saga-utils'

// import { push } from 'connected-react-router';
const push = () => {}

const queryString = require('query-string');

export function* getTableContent( payload ) {

  const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());
  const loginData = yield select(makeSelectLogin());

  const parsed = queryString.parse(location.search);
  const requestURL = locationData.api_url+`getTableContent`;

  // console.log("tableDAta request for "+credentials.username)
  const params = new URLSearchParams({
    docid: encodeURIComponent(parsed.docid),
    page: parsed.page,
    collId: parsed.collId,
    tid: parsed.tid,
    action: 'get',
    enablePrediction: payload.enablePrediction ? true : false,
  });

  if ( !parsed.docid && !parsed.tid ) {
    return {}
  }

  const options = generateOptionsPost(params, loginData.token)

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status ) {
      // check response status
      if ( response.status == 'failed' && response.errorCode == 'IS_TABLE_EMPTY' ) {
        yield put( yield issueAlertAction({ open: true, message: response.description, isError: true }))
      }

      const responseCheck = fetchResultStatusCheck(response.status)
      if ( responseCheck.error == true ) {
        yield put( yield appActions.statusSet.action(responseCheck.code))
        return
      }
    }

    response.docid = parsed.docid || response.annotationData.docid
    response.page = parsed.page || response.annotationData.page
    response.collId = parsed.collId || response.annotationData.collection_id

    response.collectionData.tables = response.collectionData.tables.sort(
      (a,b) => (a.docid+'_'+a.page).localeCompare((b.docid+'_'+b.page))
    )

    response.tablePosition = response.collectionData.tables.findIndex(
      (table) => {
        // get index by tid
        if ( table.tid == response.annotationData.tid ) {
          return true
        }
        // get index by docid and page
        if ( (table.docid+'_'+table.page).localeCompare(parsed.docid+'_'+parsed.page) == 0) {
          return true
        }
        return false
      }) + 1

    response.tableStatus = response.annotationData.completion
    response.tableType = response.annotationData.tableType
    response.textNotes = response.annotationData.notes

    // response.tablePosition_prev = response.tablePosition > -1 ? response.collectionData.tables[response.tablePosition-1] : false
    // response.current = response.tablePosition > -1 ? response.collectionData.tables[response.tablePosition] : false
    // response.tablePosition_next = response.tablePosition < (response.collectionData.tables.length-1) ? response.collectionData.tables[response.tablePosition+1] : false

    // clean loading status, because all went well
    yield put( yield appActions.statusSet.action(''))
    yield put( yield updateTableContentAction(response) );

    const annotations = ('annotationData' in response) && response.annotationData.annotation ?
      response.annotationData.annotation.annotations.map(
        (item,id) => {
          // this is to preserve compatibility with previous annotations that don't have subAnnotation
          item.subAnnotation = item.subAnnotation ? item.subAnnotation : false;
          return item
        }
      ) : []

    yield put( yield updateTableAnnotationsAction(annotations) );
  } catch (err) {
    console.log(err)
  }

  return {}
}

export function* getTableAnnotationPreview( payload ) {

  const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());
  const loginData = yield select(makeSelectLogin());

  const parsed = queryString.parse(location.search);
  const requestURL = locationData.api_url+`annotationPreview`;

  const params = new URLSearchParams({
    docid: encodeURIComponent(parsed.docid),
    'page' : parsed.page,
    'collId' : parsed.collId,
    tid: parsed.tid,
    'cachedOnly' : payload.cachedOnly,
    'action' : 'get',

    // 'enablePrediction' : false
  });

  const options = generateOptionsPost(params, loginData.token)

  try {
    const response = yield call(request, requestURL, options);
    if ( response.status ) {
      if ( response.status ) {
        // check response status
        const responseCheck = fetchResultStatusCheck(response.status)
        if ( responseCheck.error == true ) {
          yield put( yield appActions.statusSet.action(responseCheck.code))
          return
        }
      }
    }

    yield put( yield updateTableResultsAction(response.result) );
  } catch (err) {
    console.log(err)
  }

  return
  // return {collection: "hello"}
}

export function* getCUISIndex( payload ) {
  // const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());
  const loginData = yield select(makeSelectLogin());

  const parsed = queryString.parse(location.search);
  const requestURL = locationData.api_url+`cuis`;

  const params = new URLSearchParams({
    'action': 'get' // get  delete  edit
  });

  const options = generateOptionsPost(params, loginData.token)

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == 'unauthorised') {
      yield put( yield updateCuisIndexAction({}) );
      return {}
      // COUld probably redirect to /
      // yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", collectionsList : []}) );
    }
    yield put( yield updateCuisIndexAction(response.data) );
  } catch (err) {
    console.log(err)
  }

  return {}
}


export function* getTableMetadata( payload ) {

  // const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());
  const loginData = yield select(makeSelectLogin());

  const parsed = queryString.parse(location.search);
  const requestURL = locationData.api_url+`metadata`;

  const params = new URLSearchParams({
    docid: encodeURIComponent(parsed.docid),
    'page' : parsed.page,
    'collId' : parsed.collId,
    tid: payload.tid || parsed.tid,
    'action' : 'get' // get  delete  edit
  });

  const options = generateOptionsPost(params, loginData.token)

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status ) {
      if ( response.status ) {
        // check response status
        const responseCheck = fetchResultStatusCheck(response.status)
        if ( responseCheck.error == true ) {
          yield put( yield appActions.statusSet.action(responseCheck.code))
          return
        }
      }
    }

    const metadata = response.data.reduce(
      (acc, meta_item, i) => {
        const mItem = {...meta_item}

        mItem.cuis = mItem.cuis && mItem.cuis.length > 0 ? Array.from(new Set(mItem.cuis.split(';'))) : []
        mItem.cuis_selected = mItem.cuis_selected && mItem.cuis_selected.length > 0 ?
          Array.from(new Set(mItem.cuis_selected.split(';')))
          : []

        mItem.cuis.sort( (a,b) => mItem.cuis_selected.indexOf(b) - mItem.cuis_selected.indexOf(a) )

        mItem.qualifiers = Array.from(new Set(mItem.qualifiers.split(';')))
        mItem.qualifiers_selected = Array.from(new Set(mItem.qualifiers_selected.split(';')))

        const metaKey = meta_item.concept.toLowerCase() != meta_item.concept_root.toLowerCase() ?
          meta_item.concept_root.toLowerCase()+meta_item.concept.toLowerCase()
          : meta_item.concept.toLowerCase()

        acc[metaKey] = mItem;
        return acc
      }, {} )

    yield put( yield updateTableMetadataAction(metadata) );
  } catch (err) {
    console.log(err)
  }

  return {}
}

export function* saveChanges ( payload ) {

  // const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());
  const loginData = yield select(makeSelectLogin());

  const parsed = queryString.parse(location.search);

  let requestURL = locationData.api_url;

  let pre_params = {
    docid: encodeURIComponent(parsed.docid),
    'page' : parsed.page,
    'collId' : parsed.collId,
    tid: payload.tid || parsed.tid,
  }

  switch( payload.type ) {
    case SAVE_TABLE_TEXT_ACTION:
      requestURL = requestURL+`text`

      pre_params = {
        ...pre_params,
        'action' : 'save',
        'target' : 'text', // table / notes / annotation / metadata,
        'payload' : JSON.stringify({
          tableTitle: payload.tableTitle,
          tableBody: payload.tableBody
        }),
      }

      break;
    case SAVE_TABLE_NOTES_ACTION:
      requestURL = requestURL+`notes`

      pre_params = {
        ...pre_params,
        'action' : 'save',
        'target' : 'notes', // table / notes / annotation / metadata,
        'payload' : JSON.stringify(payload.notes),
      }

      break;
    case SAVE_TABLE_ANNOTATIONS_ACTION:
      requestURL = requestURL+`saveAnnotation`

      pre_params = {
        ...pre_params,
        'action' : 'save',
        'target' : 'annotation', // table / notes / annotation / metadata,
        'payload' : JSON.stringify({
          tid: payload.tid,
          annotations: payload.annotations
        }),
      }

      break;
    case SAVE_TABLE_METADATA_ACTION:
      requestURL = requestURL+`metadata`

      // debugger
      pre_params = {
        ...pre_params,
        'action' : 'save',
        'target' : 'metadata', // table / notes / annotation / metadata,
        'payload' : JSON.stringify({
          tid: payload.tid,
          metadata: payload.metadata
        }),
      }

      break;
  }

  const params = new URLSearchParams( pre_params )

  const options = generateOptionsPost(params, loginData.token)

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == 'unauthorised'){
      // COUld probably redirect to /
      // yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", collectionsList : []}) );
      // alert("unauthorised action")
      yield put( yield issueAlertAction({ open: true, message: 'unauthorised action', isError: true }))
      return
    }
    // yield put( yield updateTableResultsAction(response.result) );
    switch( payload.type ) {
      case SAVE_TABLE_TEXT_ACTION:
        // Called after saveTextChanges
        yield put(loadTableContentAction(false))
        yield put(loadTableResultsAction(false))
        yield put( yield issueAlertAction({ open: true, message: 'Table Successfully Saved', isError: false }))
        break;
      case SAVE_TABLE_NOTES_ACTION:
        yield put( yield issueAlertAction({ open: true, message: 'Notes Successfully Saved', isError: false }))
        break;
      case SAVE_TABLE_ANNOTATIONS_ACTION:
        yield put( yield issueAlertAction({ open: true, message: 'Annotations Successfully Saved', isError: false }))
        break;
      case SAVE_TABLE_METADATA_ACTION:
        yield put( yield issueAlertAction({ open: true, message: 'Metadata Successfully Saved', isError: false }))
        break;
    }
  } catch (err) {
    console.log(err)
  }

  return {}
}


export function* getAutoLabels(payload) {
  const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());
  const loginData = yield select(makeSelectLogin());

  const parsed = queryString.parse(location.search);

  const requestURL = locationData.api_url+`auto`;

  const params = new URLSearchParams({
    docid: encodeURIComponent(parsed.docid),
    'page' : parsed.page,
    'collId' : parsed.collId,
    tid: payload.tid || parsed.tid,
    'headers' : JSON.stringify(payload.headers),
    'action' : 'label' // get  delete  edit
  });

  const options = generateOptionsPost(params, loginData.token)

  yield put( yield issueAlertAction({ open: true, message: 'Labelling, please wait...', isError: false }))

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == 'unauthorised' ) {

      // COUld probably redirect to /
      // yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", collectionsList : []}) );
      return
    }

    const metadata = Object.keys(response.autoLabels).reduce(
      (acc, key, i) => {

        const mItem = {}

        mItem.concept_source = ''
        mItem.concept = response.autoLabels[key].concept
        mItem.concept_root = response.autoLabels[key].root

        mItem.cuis = response.autoLabels[key].labels.map( item => item.CUI )


        mItem.cuis_selected = mItem.cuis && mItem.cuis.length > 0 ? [mItem.cuis[0]] : []

        mItem.cuis.sort( (a,b) => mItem.cuis_selected.indexOf(b) - mItem.cuis_selected.indexOf(a) )

        mItem.qualifiers = [] //Array.from(new Set(mItem.qualifiers.split(";")))
        mItem.qualifiers_selected = [] //Array.from(new Set(mItem.qualifiers_selected.split(";")))

        mItem.istitle = false
        mItem.labeller = credentials.username
        mItem.tid = payload.tid

        const metaKey = mItem.concept.toLowerCase() != mItem.concept_root.toLowerCase() ?
          mItem.concept_root.toLowerCase()+mItem.concept.toLowerCase()
          : mItem.concept.toLowerCase()

        acc[metaKey] = mItem;
        return acc

      }, {} )

    yield put( yield updateTableMetadataAction(metadata) );

    yield put( yield loadCuisIndexAction());

    yield put( yield issueAlertAction({ open: true, message: 'Labels assigned', isError: false }))

    // yield put( yield updateTableMetadataAction(metadata) );
  } catch (err) {
    console.log(err)
  }

  return {}
}

// Individual exports for testing
export default function* annotatorSaga() {

  yield takeLatest(LOAD_TABLE_CONTENT_ACTION, getTableContent);
  yield takeLatest(LOAD_TABLE_RESULTS_ACTION, getTableAnnotationPreview);
  yield takeLatest(LOAD_TABLE_METADATA_ACTION, getTableMetadata);
  yield takeLatest(LOAD_CUIS_INDEX_ACTION, getCUISIndex);

  yield takeLatest(SAVE_TABLE_TEXT_ACTION, saveChanges);
  yield takeLatest(SAVE_TABLE_NOTES_ACTION, saveChanges);
  yield takeLatest(SAVE_TABLE_ANNOTATIONS_ACTION, saveChanges);
  yield takeLatest(SAVE_TABLE_METADATA_ACTION, saveChanges);

  yield takeLatest(AUTO_LABEL_HEADERS_ACTION, getAutoLabels);

  // yield takeLatest(LOAD_TABLE_CONTENT_ACTION, getTableContent);
  // See example in containers/HomePage/saga.js
}
