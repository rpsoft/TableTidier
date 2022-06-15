import { take, call, put, select, takeLatest } from 'redux-saga/effects';

import { LOAD_COLLECTION_ACTION, EDIT_COLLECTION_ACTION,
  REMOVE_TABLES_ACTION, MOVE_TABLES_ACTION,
  DELETE_COLLECTION_ACTION, DOWNLOAD_DATA_ACTION} from './constants';

import {
  loadCollectionAction,
  updateCollectionAction,
  updateCollectionTablesAction,
} from './actions';

import makeSelectCollectionView, {  makeSelectCredentials } from './selectors';

import makeSelectLocation from '../App/selectors'
import {issueAlertAction} from '../App/actions'

import makeSelectLogin from '../Login/selectors'

const queryString = require('query-string');

import csv from 'react-csv-downloader/dist/esm/lib/csv';

import 
  request,
  {
    generateOptionsPost
  }
from '../../utils/request';

export function* getCollectionData() {

  const locationData = yield select(makeSelectLocation());
  const loginData = yield select(makeSelectLogin());

  const parsed = queryString.parse(location.search);

  const requestURL = locationData.api_url+`collections`;

  if ( parsed.collId == 'new') {
    yield put( yield updateCollectionAction({
      title: '',
      collection_id: 'new',
      description: '',
      owner_username : ''
    }) );
    return
  }

  const params = new URLSearchParams({
    'collection_id' : parsed.collId,
    'action' : 'get'
  });

  const options = generateOptionsPost(params, loginData.token)

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == 'unauthorised' ) {
      // COUld probably redirect to /
      yield put( yield updateCollectionAction({
        title : '',
        collection_id : '',
        description: '',
        owner_username : '',
        collectionsList : []
      }) );
    } else {
      yield put( yield updateCollectionAction(response.data) );
    }
  } catch (err) {
    console.log(err)
  }

  return {}
}

export function* editCollectionData() {

  const locationData = yield select(makeSelectLocation());
  const collectionState = yield select(makeSelectCollectionView());
  const loginData = yield select(makeSelectLogin());

  const parsed = queryString.parse(location.search);

  const requestURL = locationData.api_url+`collections`;

  const params = new URLSearchParams({
      'collection_id' : parsed.collId,
      'collectionData' : JSON.stringify(collectionState),
      'action' : 'edit'
    });

  const options = generateOptionsPost(params, loginData.token)

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == "unauthorised"){
      //yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : ""}) );

    } else {
      // console.log("BOOM ALLES GUT")

      yield put( yield updateCollectionAction(response.data) );
      yield put( yield issueAlertAction({ open: true, message: "Collection Changes Saved", isError: false }))
      // yield put( yield updateCollectionAction(response.data) );
    }
  } catch (err) {
    console.log(err)
  }

  return {}
}


export function* removeCollectionTables ( payload ) {

  // const credentials = yield select(makeSelectCredentials());
  const loginData = yield select(makeSelectLogin());

  const parsed = queryString.parse(location.search);

  const params = new URLSearchParams({
    'collection_id' : parsed.collId,
    'tablesList' : JSON.stringify(Object.keys(payload.tablesList)),
    'action' : 'remove'
  });

  const options = generateOptionsPost(params, loginData.token)

  const locationData = yield select(makeSelectLocation());
  const requestURL = locationData.api_url+`tables`;
  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == 'unauthorised'){
      yield put( yield updateCollectionAction({
        title: '',
        collection_id: '',
        description: '',
        owner_username: '',
        tables: []
    }) );

    } else {
      yield put( yield updateCollectionAction(response.data) );
      yield put( yield issueAlertAction({ open: true, message: "Tables removed", isError: false }))
    }
  } catch (err) {
    console.log(err)
    yield put( yield updateCollectionAction({
      title: '',
      collection_id: '',
      description: '',
      owner_username: '',
      tables: []
    }) );
  }

  return {}
}


export function* moveCollectionTables ( payload ) {
  // const credentials = yield select(makeSelectCredentials());
  const loginData = yield select(makeSelectLogin());
  const collectionState = yield select(makeSelectCollectionView());

  const parsed = queryString.parse(location.search);

  const params = new URLSearchParams({
    'collection_id' : parsed.collId,
    'tablesList' : JSON.stringify(Object.keys(payload.tablesList)),
    'targetCollectionID' : payload.targetCollectionID,
    'action' : 'move'
  });

  const options = generateOptionsPost(params, loginData.token)

  const locationData = yield select(makeSelectLocation());
  const requestURL = locationData.api_url+`tables`;

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == 'unauthorised' ) {
      yield put( yield updateCollectionAction({
        title : '', collection_id : '', description: '', owner_username : '', tables : []
      }) );
    } else {
      // Remove moved tables
      const filteredTables = collectionState.tables.filter(table => {
        const {docid, page} = table
        const tableText = docid+'_'+page
        return response.data.moved.includes(tableText) == false
      })
      yield put( yield updateCollectionTablesAction(filteredTables) );
      yield put( yield issueAlertAction({ open: true, message: 'Collection Tables Moved', isError: false }))
    }
  } catch (err) {
    console.log(err)
    yield put( yield updateCollectionAction({
      title : '', collection_id : '', description: '', owner_username : '', tables : []
    }) );
  }

  return {}
}

export function* deleteCollection() {

  const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());
  const collectionState = yield select(makeSelectCollectionView());
  const loginData = yield select(makeSelectLogin());

  const parsed = queryString.parse(location.search);

  const requestURL = locationData.api_url+`collections`;

  const params = new URLSearchParams({
      'collection_id' : parsed.collId,
      'action' : 'delete'
    });

  const options = generateOptionsPost(params, loginData.token)

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == "unauthorised"){
      // COUld probably redirect to /
      // yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", collectionsList : []}) );
    } else {
      yield put( yield issueAlertAction({ open: true, message: "Collection Deleted ", isError: false }))
      yield put( yield loadCollectionAction() );
    }
  } catch (err) {
    console.log(err)
  }

  return {}
}

export function* downloadTids({target, tids}) {

  // const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());
  const collectionState = yield select(makeSelectCollectionView());
  const loginData = yield select(makeSelectLogin());

  const parsed = queryString.parse(location.search);

  // const requestURL = `http://`+locationData.ui_host+(locationData.server_port ? `:`+locationData.server_port : "")+`/metadata`;
  //
  // const params = new URLSearchParams({
  //     'hash' : credentials.hash,
  //     'username' :  credentials.username,
  //     'docid' : parsed.docid,
  //     'page' : parsed.page,
  //     'collId' : parsed.collId,
  //     'tid' : payload.tid,
  //     'action' : 'get' // get  delete  edit
  //   });

  const requestURL = locationData.api_url+'collections';

  // +( target.indexOf("metadata") > -1 ? "metadata" : ""

  const params = new URLSearchParams({
    'collection_id' : parsed.collId,
    'action' : 'download',
    'target' : target,
    'tid' : JSON.stringify(tids),
  });

  const options = generateOptionsPost(params, loginData.token)

  const downloadData = async (filename, columns, datas) => {
    const stuffhere = await csv({
      filename,
      separator: ';',
      wrapColumnChar: `'`,
      columns,
      datas
    })
    const data = new Blob([stuffhere], {type: 'text/csv'});
    const csvURL = window.URL.createObjectURL(data);
    const tempLink = document.createElement('a');
    tempLink.href = csvURL;
    tempLink.setAttribute('download', filename);
    tempLink.click();
  }

  // downloadData( "ction_metadata.csv", [
  //   {id: "id", displayName: "id"},{id: "data", displayName: "data"}
  // ], [
  //   {id: "1", data: [`thingsd , dom,ethign " else '`, `hello fudfa vjdf`].join(",")},{id: "2", data: JSON.stringify([2043,32,423,52,23,4,5,4])}
  // ])

  const downloadFile = async (data, filename = 'mydata') => {
    const fileName = filename;
    const json = JSON.stringify(data);
    const blob = new Blob([json],{type: 'application/json'});
    const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == 'unauthorised') {

      yield put( yield issueAlertAction({
        open: true,
        message: 'Failed Data download',
        isError: true
      }))
    } else {
      // debugger
      let result
      let headers
      let data
      switch (target) {
        case 'result':
          result = response.data.rows.reduce(
            (acc, tableData, i) => {
              tableData.tableResult.map(
                (tres) => {
                  acc.data.push( {tid: tableData.tid, ...tres} );
                  acc.headers = Array.from( new Set([...acc.headers,... Object.keys(tres)]));
                }); return acc;
              }, {data:[],headers:[]})

          headers = result.headers.map( heads => { return {id: heads, displayName: heads} } )
          data = result.data
          data = data.map( item => {
            const headers = Object.keys(item)
            headers.map( head => {
              if (typeof item[head] === 'string') {
                item[head] = item[head].trim()
              }
            });
            return item
          })
          downloadData(`collection_${parsed.collId}_results.csv`, headers, data)
          break;
        case 'metadata':
          result = response.data.rows.reduce(
            (acc, tableData, i) => {
                  acc.data.push( {tid: tableData.tid, ...tableData} );
                  acc.headers = Array.from( new Set([...acc.headers,... Object.keys(tableData)]));
                return acc;
              }, {data:[],headers:[]})
          headers = result.headers.map( heads => { return {id: heads, displayName: heads} } )
          data = result.data.map( item => {
            const headers = Object.keys(item);
            headers.map( head => {
              if (typeof item[head] === 'string') {
                item[head] = item[head].trim()
              }
            });
            return item
          })
          downloadData(`collection_${parsed.collId}_metadata.csv`, headers, data)
          break;
        case 'json':
          downloadFile( {selected_results: response.data}, `collection_${parsed.collId}_all`)
          break;
        default:
      }
    }
  } catch (err) {
    console.log(err)
  }
  return {}
}

// Individual exports for testing
export default function* collectionViewSaga() {
  yield takeLatest(LOAD_COLLECTION_ACTION, getCollectionData);
  yield takeLatest(EDIT_COLLECTION_ACTION, editCollectionData);
  yield takeLatest(DELETE_COLLECTION_ACTION, deleteCollection);
  yield takeLatest(REMOVE_TABLES_ACTION, removeCollectionTables);
  yield takeLatest(MOVE_TABLES_ACTION, moveCollectionTables);
  yield takeLatest(DOWNLOAD_DATA_ACTION, downloadTids);
}
