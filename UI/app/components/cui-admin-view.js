import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router'

import Card from '@material-ui/core/Card';

import {URL_BASE} from '../links'

import fetchData from '../network/fetch-data';

//import Bootstrap from '../../assets/bootstrap.css';
import RaisedButton from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import Popover from '@material-ui/core/Popover';
import Menu from '@material-ui/core/Menu';
import Divider from '@material-ui/core/Divider';
import DownArrow from '@material-ui/icons/ArrowDropDown';
import TextField from '@material-ui/core/TextField';
import MLink from '@material-ui/core/Link';


import SelectField from '@material-ui/core/Select';


import { push } from 'connected-react-router'

import Checkbox from '@material-ui/core/Checkbox';

import Annotation from './annotation'


var ReactDOMServer = require('react-dom/server');

var HtmlToReact = require('html-to-react')
var HtmlToReactParser = require('html-to-react').Parser;


class CuiAdminView extends Component {

  constructor(props) {
    super()
    this.state = {
        table: null,
        showTables: {},
    };

  }

  async componentWillReceiveProps(next) {
        this.loadPageFromProps(next)
  }

  async componentWillMount() {
      this.loadPageFromProps(this.props)
  }

  async loadPageFromProps(props){

      let fetch = new fetchData();

      // gather and filter out user defined cuis.
      var cuisIndex = await fetch.getCUISIndex()
          cuisIndex = Object.keys(cuisIndex).reduce( (acc,e,i) => { if(cuisIndex[e].userDefined) { var currentEl =  cuisIndex[e]; currentEl.newcui = e; acc[e] = currentEl; } return acc},{} )

      var cuiTables = {}

      for( var i = 0; i < Object.keys(cuisIndex).length; i++){
        cuiTables[Object.keys(cuisIndex)[i]] = await fetch.getMetadataForCUI(Object.keys(cuisIndex)[i])
      }

      this.setState({cuisIndex, cuiTables})

  }

  async toggleTablesByCUI ( cui ){
    console.log(cui)
    var showTables = this.state.showTables

    showTables[cui] = showTables[cui] ? false : true

    this.setState({showTables})

  }

  async saveAll (){

    let fetch = new fetchData();

    var cuis = Object.keys(this.state.cuisIndex)

    for ( var i = 0; i < cuis.length; i++){
        //cui,preferred,adminApproved,prevcui

        await fetch.modifyCUIData(this.state.cuisIndex[cuis[i]].newcui,
                                  this.state.cuisIndex[cuis[i]].preferred,
                                  this.state.cuisIndex[cuis[i]].adminApproved, cuis[i])
    }

    alert("Changes Saved!")

    this.loadPageFromProps(this.props)

  }

  async cuiDeleteIndex(cui){

    let fetch = new fetchData();
    await fetch.cuiDeleteIndex( cui )
    this.loadPageFromProps(this.props)

  }

  modifyCui(newcui, cui, preferred, adminApproved ){


    var prevRecord = this.state.cuisIndex[cui]

        prevRecord.newcui = newcui
        prevRecord.preferred = preferred
        prevRecord.adminApproved = adminApproved

    var newCuisIndex = this.state.cuisIndex
        newCuisIndex[cui] = prevRecord

    this.setState({cuisIndex : newCuisIndex})
  }

  render() {
     if ( this.state.cuisIndex ){

      return <div style={{paddingTop: "1%", paddingLeft:"5%",paddingRight:"5%", minWidth:1333}}><Card><div style={{padding:"1%"}}>

            <h3 style={{marginLeft:20, float:"left"}}>CUI Admin: User Defined Concepts</h3>

            <div style={{width:"100%",textAlign:"right", marginTop: 20}}>
              <RaisedButton
                  variant={"contained"}
                  style={{marginLeft:20, backgroundColor:"#fea7a7"}}
                  onClick={ () => { this.saveAll () } }>
                  Save Changes
              </RaisedButton>
            </div>
            <hr/>

            {
              Object.keys(this.state.cuisIndex).map(

                (e,i) => <div key={i} style={{marginBottom:5}}>

                      <TextField
                        value={this.state.cuisIndex[e].newcui}
                        placeholder="CUI"
                        style={{width:150,marginLeft:20,marginRight:20}}
                        onChange={(event,value) => {

                          this.modifyCui(event.currentTarget.value, e, this.state.cuisIndex[e].preferred, this.state.cuisIndex[e].adminApproved )

                        }}

                        onKeyDown={(event, index) => {
                          if (event.key === 'Enter') {
                              // this.shiftTables(0)
                              event.preventDefault();
                          }
                        }}
                        />

                      <TextField
                        value={this.state.cuisIndex[e].preferred}
                        placeholder="Description"
                        style={{width:400,marginLeft:20,marginRight:20}}
                        onChange={(event,value) => {
                          this.modifyCui(this.state.cuisIndex[e].newcui, e , event.currentTarget.value, this.state.cuisIndex[e].adminApproved )
                        }}

                        onKeyDown={(event, index) => {
                          if (event.key === 'Enter') {
                              // this.shiftTables(0)
                              event.preventDefault();
                          }
                        }}
                        />

                      <div style={{display:"inline"}}>Admin approved? <Checkbox
                        checked={this.state.cuisIndex[e].adminApproved}
                        onChange={
                          (event,data) => {
                            this.modifyCui(this.state.cuisIndex[e].newcui, e, this.state.cuisIndex[e].preferred, data )
                          }}
                        /></div>

                      <RaisedButton
                          variant={"contained"}
                          style={{marginLeft:20}}
                          onClick={ () => { this.toggleTablesByCUI ( e ) } }>
                          {"Show Tables ("+ this.state.cuiTables[e].length +")" }
                      </RaisedButton>

                      { this.state.cuiTables[e].length == 0 ? <RaisedButton
                          variant={"contained"}
                          style={{marginLeft:20}}
                          onClick={ () => { this.cuiDeleteIndex(e) } }>
                          Delete Unused CUI
                      </RaisedButton> : "" }

                      {
                        this.state.showTables[e] ?
                        this.state.cuiTables[e].map( (t,j) => <div style={{marginLeft:30,marginBottom: 10}} key={ e+t.docid +" "+t.page+" "+t.user }>

                        <MLink target="_blank" href={"table?docid="+encodeURIComponent(t.docid)+"&page="+t.page+"&user="+t.user}>
                          { t.docid +" "+t.page+" "+t.user }
                        </MLink>

                        </div> ) : ""
                      }
                    </div>

              )
            }

            <hr style={{marginTop:50}} />
            <div style={{width:"100%",textAlign:"right"}}>
              <RaisedButton
                  variant={"contained"}
                  style={{marginLeft:20, backgroundColor:"#fea7a7"}}
                  onClick={ () => { this.saveAll () } }>
                  Save Changes
              </RaisedButton>
            </div>

            </div></Card></div>
     } else {
       return ""
     }

   }
}

const mapStateToProps = (state, ownProps) => ({

  params: ownProps.params,
  location: ownProps.location
})

const mapDispatchToProps = (dispatch) => ({

  goToUrl: (url) => dispatch(push(url))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CuiAdminView);
