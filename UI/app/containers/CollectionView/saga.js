import { take, call, put, select, takeLatest } from 'redux-saga/effects';

import { LOAD_COLLECTION_ACTION, EDIT_COLLECTION_ACTION,
  REMOVE_TABLES_ACTION, MOVE_TABLES_ACTION,
  DELETE_COLLECTION_ACTION, DOWNLOAD_DATA_ACTION} from './constants';

import { loadCollectionAction, updateCollectionAction } from './actions';

import makeSelectCollectionView, {  makeSelectCredentials } from './selectors';

import makeSelectLocation from '../App/selectors'
import {issueAlertAction} from '../App/actions'

const queryString = require('query-string');

import csv from 'react-csv-downloader/dist/lib/csv';

import request from '../../utils/request';

export function* getCollectionData() {

  const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());

  const parsed = queryString.parse(location.search);

  const requestURL = locationData.api_url+`collections`;

  if ( parsed.collId == "new"){
    yield put( yield updateCollectionAction({title : "", collection_id : "new", description: "", owner_username : ""}) );
    return
  }

  const params = new URLSearchParams({
      'hash' : credentials.hash,
      'username' :  credentials.username,
      'collection_id' : parsed.collId,
      'action' : 'get'
    });

  const options = {
    method: 'POST',
    body: params
  }

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == "unauthorised"){
      // COUld probably redirect to /
      yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", collectionsList : []}) );

    } else {
      // debugger
      yield put( yield updateCollectionAction(response.data) );
    }
  } catch (err) {
    console.log(err)
  }

  return {}
}


export function* editCollectionData() {

  const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());
  const collectionState = yield select(makeSelectCollectionView());

  const parsed = queryString.parse(location.search);

  const requestURL = locationData.api_url+`collections`;

  const params = new URLSearchParams({
      'hash' : credentials.hash,
      'username' :  credentials.username,
      'collection_id' : parsed.collId,
      'collectionData' : JSON.stringify(collectionState),
      'action' : 'edit'
    });

  const options = {
    method: 'POST',
    body: params
  }

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
  // return {collection: "hello"}
}


export function* removeCollectionTables ( payload ) {

  const credentials = yield select(makeSelectCredentials());
  const parsed = queryString.parse(location.search);

  const params = new URLSearchParams({
      'hash' : credentials.hash,
      'username' :  credentials.username,
      'collection_id' : parsed.collId,
      'tablesList' : JSON.stringify(Object.keys(payload.tablesList)),
      'action' : 'remove'
    });

  const options = {
    method: 'POST',
    body: params
  }

  const locationData = yield select(makeSelectLocation());
  const requestURL = locationData.api_url+`tables`;
  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == "unauthorised"){
      yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", tables : []}) );

    } else {
      yield put( yield updateCollectionAction(response.data) );
      yield put( yield issueAlertAction({ open: true, message: "Tables removed", isError: false }))
    }
  } catch (err) {
    console.log(err)
    yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", tables : []}) );
  }

  return {}
}


export function* moveCollectionTables ( payload ) {
  const credentials = yield select(makeSelectCredentials());
  const parsed = queryString.parse(location.search);

  const params = new URLSearchParams({
      'hash' : credentials.hash,
      'username' :  credentials.username,
      'collection_id' : parsed.collId,
      'tablesList' : JSON.stringify(Object.keys(payload.tablesList)),
      'targetCollectionID' : payload.targetCollectionID,
      'action' : 'move'
    });

  const options = {
    method: 'POST',
    body: params
  }

  const locationData = yield select(makeSelectLocation());
  const requestURL = locationData.api_url+`tables`;

  try {

    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == "unauthorised"){

      yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", tables : []}) );

    } else {
      yield put( yield updateCollectionAction(response.data) );
      yield put( yield issueAlertAction({ open: true, message: "Collection Tables Moved", isError: false }))
    }
  } catch (err) {

    console.log(err)
    yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", tables : []}) );
  }

  return {}
}

export function* deleteCollection() {

  const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());
  const collectionState = yield select(makeSelectCollectionView());

  const parsed = queryString.parse(location.search);

  const requestURL = locationData.api_url+`collections`;

  const params = new URLSearchParams({
      'hash' : credentials.hash,
      'username' :  credentials.username,
      'collection_id' : parsed.collId,
      'action' : 'delete'
    });

  const options = {
    method: 'POST',
    body: params
  }

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == "unauthorised"){

      // COUld probably redirect to /
      // yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", collectionsList : []}) );

    } else {
      yield put( yield issueAlertAction({ open: true, message: "Collection Deleted ", isError: false }))
      // yield put( yield updateCollectionAction(response.data) );
    }
  } catch (err) {
    console.log(err)
  }

  return {}
  // return {collection: "hello"}
}

//




export function* downloadTids({target, tids}) {


  const credentials = yield select(makeSelectCredentials());
  const locationData = yield select(makeSelectLocation());
  const collectionState = yield select(makeSelectCollectionView());

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
      'hash' : credentials.hash,
      'username' :  credentials.username,
      'collection_id' : parsed.collId,
      'action' : 'download',
      'target' : target,
      'tid' : JSON.stringify(tids),
    });

  const options = {
    method: 'POST',
    body: params
  }

  var downloadData = async (filename, columns, datas) => {
    var stuffhere = await csv(
      {filename, separator:";", wrapColumnChar:"'", columns, datas}
    )
    var data = new Blob([stuffhere], {type: 'text/csv'});
    var csvURL = window.URL.createObjectURL(data);
    var tempLink = document.createElement('a');
    tempLink.href = csvURL;
    tempLink.setAttribute('download', filename);
    tempLink.click();
  }

  // downloadData( "ction_metadata.csv", [
  //   {id: "id", displayName: "id"},{id: "data", displayName: "data"}
  // ], [
  //   {id: "1", data: [`thingsd , dom,ethign " else '`, `hello fudfa vjdf`].join(",")},{id: "2", data: JSON.stringify([2043,32,423,52,23,4,5,4])}
  // ])

  const downloadFile = async (data, filename = "mydata") => {
    const fileName = filename;
    const json = JSON.stringify(data);
    const blob = new Blob([json],{type:'application/json'});
    const href = await URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  try {
    const response = yield call(request, requestURL, options);

    if ( response.status && response.status == "unauthorised"){

      yield put( yield issueAlertAction({ open: true, message: "Failed Data download", isError: true }))
    } else {
      // debugger
      switch (target) {
        case "result":
          var result = response.data.rows.reduce(
            (acc, tableData, i) => {
              tableData.tableResult.map(
                (tres) => {
                  acc.data.push( {tid: tableData.tid, ...tres} );
                  acc.headers = Array.from( new Set([...acc.headers,... Object.keys(tres)]));
                }); return acc;
              }, {data:[],headers:[]})

          var headers = result.headers.map( heads => { return {id: heads, displayName: heads} } )
          var data = result.data
          data = data.map( (item) => {var headers = Object.keys(item); headers.map( head => { if (typeof item[head] === 'string'){ item[head] = item[head].trim() }  }); return item  } )
          downloadData("collection_"+parsed.collId+"_results.csv", headers, data)
          break;
        case "metadata":
          var result = response.data.rows.reduce(
                    (acc, tableData, i) => {
                          acc.data.push( {tid: tableData.tid, ...tableData} );
                          acc.headers = Array.from( new Set([...acc.headers,... Object.keys(tableData)]));
                        return acc;
                      }, {data:[],headers:[]})
          var headers = result.headers.map( heads => { return {id: heads, displayName: heads} } )
          var data = result.data.map( (item) => {var headers = Object.keys(item); headers.map( head => { if (typeof item[head] === 'string'){ item[head] = item[head].trim() }  }); return item  } )
          downloadData("collection_"+parsed.collId+"_metadata.csv", headers, data)
          break;
        case "json":
          debugger
          downloadFile( {selected_results: response.data}, "collection_"+parsed.collId+"_all")
          break;
        default:

      }
      // if ( target.indexOf("result") > -1 ){
      //   var result = response.data.rows.reduce(
      //     (acc, tableData, i) => {
      //       tableData.tableResult.map(
      //         (tres) => {
      //           acc.data.push( {tid: tableData.tid, ...tres} );
      //           acc.headers = Array.from( new Set([...acc.headers,... Object.keys(tres)]));
      //         }); return acc;
      //       }, {data:[],headers:[]})
      //
      //   var headers = result.headers.map( heads => { return {id: heads, displayName: heads} } )
      //   var data = result.data
      //   data = data.map( (item) => {var headers = Object.keys(item); headers.map( head => { if (typeof item[head] === 'string'){ item[head] = item[head].trim() }  }); return item  } )
      //   downloadData("collection_"+parsed.collId+"_results.csv", headers, data)
      // } else {
      //   var result = response.data.rows.reduce(
      //             (acc, tableData, i) => {
      //                   acc.data.push( {tid: tableData.tid, ...tableData} );
      //                   acc.headers = Array.from( new Set([...acc.headers,... Object.keys(tableData)]));
      //                 return acc;
      //               }, {data:[],headers:[]})
      //   var headers = result.headers.map( heads => { return {id: heads, displayName: heads} } )
      //   var data = result.data.map( (item) => {var headers = Object.keys(item); headers.map( head => { if (typeof item[head] === 'string'){ item[head] = item[head].trim() }  }); return item  } )
      //
      //
      //   downloadData("collection_"+parsed.collId+"_metadata.csv", headers, data)
      // }


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
