/**
 *
 * TableMetadata
 *
 */

import React, { memo } from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

import {
  Card, Checkbox,
  Select as SelectField,
  TextField,
  Button,
  Paper,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  Switch,
} from '@material-ui/core';

import TableMetadataItem from 'components/TableMetadataItem'

function TableMetadata({
  tableResults,
  headerData
}) {

  var all_concepts

  if ( tableResults){
    var sorted_results = tableResults.sort( (a,b) => {return a.row - b.row} )
    // debugger
    var allHeaders = Array.from(new Set( sorted_results .reduce(
        (acc,item) => {
          acc.push(Object.keys(item));
          return acc
        }, []).flat()))

    allHeaders = allHeaders.slice(4)

    all_concepts = allHeaders.map( head => sorted_results.reduce( (acc, item) => {
            acc.push(item[head]); return acc;
    } , [] ) )

    all_concepts = Array.from(new Set(all_concepts.flat()))
// debugger
  }

  // tableResults.reduce(
  //   (acc,res,i) => {
  //     headerData.headers.map(
  //       (header,h) => {
  //         if (acc[header]){
  //           acc[header].push(res[header])
  //         } else {
  //           acc[header] = [res[header]]
  //         }
  //       });
  //       return acc;
  //     }, {}
  //   )

  if(!headerData.headers || headerData.headers.length < 1 ){
    return <div> Results Not ready </div>
  }

  var headerDataCopy = JSON.parse(JSON.stringify(headerData))

  headerDataCopy.headers.reverse()
  headerDataCopy.subs.reverse()

  var annotation_groups = headerDataCopy.headers.reduce(
      (acc,item,i) => {
        if ( headerDataCopy.subs[i]) {
          acc.temp.push(item)
        } else {
          acc.groups.push([...acc.temp,item].reverse());
          acc.temp = []
        };
        return acc
      }, {groups:[], temp: []})

    annotation_groups.groups[annotation_groups.groups.length-1] = [...annotation_groups.groups[annotation_groups.groups.length-1], ...annotation_groups.temp ]
    annotation_groups = annotation_groups.groups.reverse()

  var grouped_headers = annotation_groups.reduce( (acc,group,i) => {
    var concepts = tableResults .reduce( (cons,res,j)  => {
      cons.push (
        group.map( (head) => {
          if ( res[head] )
          return res[head]
        })
      )
      return cons
    },[]);

    acc[group.join()] = concepts;
    return acc;
  },{})


  var meta_concepts = Object.keys(grouped_headers).reduce( (mcon, group) => {
    var alreadyshown = []
    var lastConcept = ""

    mcon[group] = grouped_headers[group].reduce(
        (acc, concepts) => {
            var key = concepts.join()
            if ( !alreadyshown[key] ){
              alreadyshown[key] = true
              concepts = concepts.filter( b => b != undefined )

              if ( concepts[concepts.length-1] == lastConcept ){

                concepts = concepts.slice(concepts.length-2,1)
              } else {
                lastConcept = concepts[concepts.length-1]
              }

              acc.push( concepts )
            }

            return acc
        }, [])

    return mcon
  },{})

  // // const spread = (meta_concepts) => {
  //
  // var distinctArrays = (arr) => {
  //
  //   return arr.reduce ( (acc, item, i) => {
  //
  //     for ( var j = 0; j < item.length; j++){
  //
  //       acc.push(item.slice(0,j+1))
  //
  //     }
  //     return acc
  //   }, [])
  //
  // }
  //
  //   Object.keys(meta_concepts).map ( (concept_grp) => {
  //
  //       return meta_concepts[concept_grp].map( (concepts,j) => {
  //
  //           return concepts.reduce( (acc, cs, c) => {
  //               acc.push(concepts.slice(0,c+1))
  //               return acc
  //           },[])
  //           // all_concepts.push(concepts)
  //       }).flat();
  //
  //   })
  //
  // // }
  //
  // meta_concepts["characteristic_name@1,characteristic_level@1"][0].slice(0)

  const unfoldConcepts = (concepts) => {
    return concepts.reduce ( (stor, elm, i) => {

          for ( var e = 1; e <= elm.length; e++ ){

              var partial_elm = elm.slice(0,e)
              var key = partial_elm.join()

              // debugger

              if ( stor.alreadyThere.indexOf(key) < 0 ){
                stor.unfolded.push(partial_elm)
                stor.alreadyThere.push(key)
              }

          }

          return stor;
    }, { unfolded:[], alreadyThere:[] }).unfolded
  }



  // if ( meta_concepts["characteristic_level@1,arms@1,other@1"]){

  meta_concepts = Object.keys(meta_concepts).reduce( (acc,mcon,j) => { acc[mcon] = unfoldConcepts(meta_concepts[mcon]); return acc},{} )

    // var hey = unfoldConcepts(meta_concepts["characteristic_name@1,characteristic_level@2"])
     //

     // debugger
  // }


  return (
    <div style={{padding:"5px 7px 7px 7px"}} >
      <div style={{textAlign:"right", marginBottom:5}}>
        <div style={{height:35, fontSize:22, float:"left", paddingTop:5}}> 4. <b> Metadata </b> Linking </div>
        <Button variant="outlined" style={{backgroundColor:"lightblue"}} onClick={ () => {} }> Save Metadata Changes </Button>
      </div>

      {
        Object.keys(meta_concepts).map( (ann_groups,j) => {
            return <div key={j}> <h3>{ann_groups}</h3><div>{ meta_concepts[ann_groups].map(
              (item,i) => <TableMetadataItem
                                key={i}
                                itemData={{concept: item, proposed:"", proposed_user:"", selected:""}}
                                />
            )} </div></div>
        })
      }

      </div>
  );
}

TableMetadata.propTypes = {};

export default memo(TableMetadata);
