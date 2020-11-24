/**
 *
 * TableMetadataItem
 *
 */

import React, { memo } from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

import { Button, TextField } from '@material-ui/core';
import Avatar from '@material-ui/core/Avatar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import Card from '@material-ui/core/Card';



import DeleteForeverIcon from '@material-ui/icons/DeleteForever';

import { FixedSizeList } from 'react-window';

function TableMetadataItem(
  {
    tableConcept,
    metadata,
    cuisIndex,
    toggleCui,
    deleteCui,
    addCuis,
    enableDelete
  }
) {

  const [ open, setOpen ] = React.useState(false)
  const [ dialogConcept, setDialogConcept ] = React.useState("")
  const [ queryText, setQueryText ] = React.useState("")

  var root = tableConcept.slice(0,tableConcept.length-1)[0]
      root = root ? root.trim() : ""

  var concept = tableConcept.slice(tableConcept.length-1)[0]
      concept = concept.trim()

  var key = concept.toLowerCase()
  
  var itemData = metadata[key]

  var cuis = []
  var cuis_selected = []
  var qualifiers = []
  var qualifiers_selected = []

  if ( itemData ){
    cuis = itemData.cuis ? itemData.cuis : []
    cuis_selected = itemData.cuis_selected ? itemData.cuis_selected : []
    qualifiers = itemData.qualifiers ? itemData.qualifiers : []
    qualifiers_selected = itemData.qualifiers_selected ? itemData.qualifiers_selected : []
  }

  const [ dialogSelectedCuis, setDialogSelectedCuis ] = React.useState(cuis_selected)

  const searchItems = (query) =>{

    if  (query.length < 3){
      return Object.keys(cuisIndex)
    }

    return Object.keys(cuisIndex).reduce( (acc,cui,i) => {

      var cuiItem = cuisIndex[cui]

      if (
          (cuiItem.preferred.toLowerCase().indexOf(query.toLowerCase()) > -1) ||
          (cui.toLowerCase().indexOf(query.toLowerCase()) > -1)
         ){
           // debugger
        acc.push(cui)
      }

      return acc
    },[])
  }


  const cuiSearchResults = searchItems(queryText) //.map( (cui,i) => <div key={i}> {cuisIndex[cui].preferred} </div>)

  const toggleDialogCui = (cui) => {

    var selCuis = Array.from(dialogSelectedCuis)

    var pos = selCuis.indexOf(cui)

    if ( pos > -1 ){
      selCuis.splice(pos,1)
    } else {
      selCuis.push(cui)
    }

    setDialogSelectedCuis(selCuis)
  }

  // cuis = cuis.sort( (a,b) => cuis_selected.indexOf(b) - cuis_selected.indexOf(a) )

  const cuiEntry = (cui, style={}, isSelected) => {
      var selected = dialogSelectedCuis.indexOf(cui) > -1

      var selected_style = {color: selected ? "blue" : "", fontWeight: selected ? "bold" : ""}

      if ( isSelected ) {
        selected_style = {}
      }

      return <div key={cui} style={{ ...style, marginBottom:5, paddingLeft:5, cursor:"pointer", ...selected_style }}
                  onClick={ () => {toggleDialogCui(cui)} }> {cui+" -- "+cuisIndex[cui].preferred} </div>
  }

  const Row = ({ index, style }) => {
          var cui = cuiSearchResults[index]
          return cuiEntry(cui, style)
        };

  return (
    <div style={{ marginTop: (root.length > 0 ? 5 : 10) }} >

      {
        <span style={{ marginLeft: (root.length > 0 ? 20 : 0) }}> { concept } </span>
      }
      <span style={{fontWeight:"bold"}}> - </span>

      {
        cuis.map( (cui,j) => {

          var isSelected = cuis_selected.indexOf(cui) > -1
          var color =  isSelected ? (enableDelete ? "red" :"#1976d2") : (enableDelete ? "#c65e5e" : "")

          return <Button
                   key={j}
                   variant="outlined"
                   style={{borderColor: color, color: color, marginRight:5}}
                   onClick={ () => { enableDelete ? deleteCui(key, cui) : toggleCui(key, cui) } }
                 >
                    {cuisIndex[cui] ? cuisIndex[cui].preferred : ""} ({cui})
                    {enableDelete ? <DeleteForeverIcon/> : ""}
                 </Button>
        })
      }

      {
        enableDelete ? "" : <Button variant="outlined"
                    size="small"
                     style={{borderColor: "green", color: "green", marginRight:5, fontWeight:"bolder", minWidth:0}}
                     onClick={ () => { setOpen(true); setDialogConcept(concept); } }
                    > + </Button>
      }

      <Dialog onClose={() => { setOpen(false) }}
              aria-labelledby="simple-dialog-title"
              open={open}
              fullWidth = {false}
              maxWidth ={false}

              >
          <div style={{padding:10, minWidth:700, backgroundColor:"#eaeaea"}}>
            <DialogTitle id="simple-dialog-title"><span style={{color:"grey"}}>Assigning Metadata for: </span>{dialogConcept}</DialogTitle>

            <Card style={{marginBottom:5, padding:10}}>
              <TextField
                      label="Type to filter concepts here"
                      value={queryText}
                      style={{width:"100%",marginBottom:15}}
                      onChange={ (evt) => { setQueryText(evt.currentTarget.value); }}
                  />
            </Card>

            <Card>
              <div style={{margin:10,marginLeft:5, fontWeight:"bold", borderBottom:"1px solid black"}}>Available Cuis:</div>
              <div style={{margin:10}}>
                <FixedSizeList
                  height={280}
                  itemCount={cuiSearchResults.length}
                  itemSize={35}
                  width={"100%"}
                  itemData={cuiSearchResults}
                  >
                   {Row}
                </FixedSizeList>
              </div>
            </Card>

            <Card style={{marginTop:10}}>
              <div style={{margin:10,marginLeft:5, fontWeight:"bold", borderBottom:"1px solid black"}}>Selected Cuis:</div>
              <div style={{maxHeight:100,overflowY:"scroll", padding:5}}>
                  { dialogSelectedCuis.map(
                          cui => cuiEntry(cui, {}, true)
                                    )}
              </div>
            </Card>


            <hr />

            <div style={{width:"100%",textAlign:"right"}}>
              <Button onClick={ () => { setOpen(false); addCuis(key, dialogSelectedCuis, {root,concept}); }}> Add CUIS </Button> <Button onClick={ () => setOpen(false)}> Cancel </Button>
            </div>
          </div>
      </Dialog>
    </div>
  );
}

TableMetadataItem.propTypes = {};

export default memo(TableMetadataItem);
