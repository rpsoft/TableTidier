/**
 *
 * TableResult
 *
 */

import React, { memo, useState, useEffect, useRef  } from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import ReactTable from 'react-table'
import 'react-table/react-table.css'

import {
  Button,
} from '@material-ui/core';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

function TableResult({
  loadTableResults,
  tableResult,
  sortedHeaders
}) {
  var headers = []
  var data = []

  const [width, setWidth] = useState(600)
  const ref = useRef(null)

  useEffect(() => {
    setWidth(ref.current.clientWidth)
  })

  const getColumnWidth = (rows, accessor, headerText) => {
      const maxWidth = 400
      const magicSpacing = ["row", "col"].indexOf(accessor) > -1 ? 10 : 5
      const cellLength = Math.max(
        ...rows.map(row => (`${row[accessor]}` || '').length),
        headerText.length,
      )
      return Math.min(maxWidth, cellLength * magicSpacing)
    }

  if ( tableResult && tableResult.length > 0 ){

    headers = Array.from(
                    new Set(
                      tableResult.map(
                        (heads) => Object.keys(heads)
                      ).flat()
                    ))

    headers = headers.filter(e => e !== 'docid_page');

    headers = headers.map(
      (item) => {
        if ( ["row","col"].indexOf(item) > -1 ){
          return {
            Header:item, accessor:item, width: 60
          }
        }

        if ( ["value"].indexOf(item) > -1 ){
          return {
            Header:item, accessor:item, width: item.length*20
          }
        }

        return {
          Header:item, accessor:item
        }
      })

    headers = headers.sort( (a,b) => sortedHeaders.indexOf(a.Header) - sortedHeaders.indexOf(b.Header) )

    data = tableResult
  }

  return (
    <div style={{padding:"5px 7px 7px 7px"}} ref={ref} >
        <div style={{textAlign:"right", marginBottom:5}}>
          <div style={{height:35, fontSize:22, float:"left", paddingTop:5}}> 3. Extraction <b> Results </b> </div>
          <Button variant="outlined" style={{backgroundColor:"lightblue"}} onClick={ () => { loadTableResults() } }> Refresh Results </Button>
        </div>
        <hr style={{borderTop:"1px #acacac dashed"}}/>
         {
           data.length > 0 ? <ReactTable
                                data={data}
                                columns={headers}
                                style={{
                                  marginBottom: 10,
                                  backgroundColor:"#f6f5f5",
                                  width: "100%",
                                }}
                                defaultPageSize={20}
                                pageSizeOptions={[5, 10, 20, data.length]}

                              /> : <div> No results produced </div>
          }
      </div>
  );
}

TableResult.propTypes = {};

export default memo(TableResult);
