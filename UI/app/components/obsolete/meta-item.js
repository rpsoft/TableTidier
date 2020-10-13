import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router'

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

import SelectField from '@material-ui/core/Select';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import Card from '@material-ui/core/Card';


import Popover from '@material-ui/core/Popover';
import Checkbox from '@material-ui/core/Checkbox';

import MultiplePopover from './MultiplePopover'

import CommonStyles from './common-styles.css';

import fetchData from '../network/fetch-data';


class MetaItem extends Component {

  static displayName = ''; // Esto funciona ! igual que en JAVA.

  constructor(props) {
      super()

      var urlparams = new URLSearchParams(window.location.search);

      this.state = {
        user: urlparams.get("user") ? urlparams.get("user") : "",
        page: urlparams.get("page") ? urlparams.get("page") : "",
        docid: urlparams.get("docid") ? urlparams.get("docid") : "",
        adminEnabled: true, //urlparams.get("admin") ? urlparams.get("admin").toLowerCase().trim() == "true" : false,
        term : props.term,
        matching_term : props.matching_term, // This is the term after processing/cleaning to match it with our knowledge base.
        anchorEl : null,
        searchTextInput : React.createRef(),

        assigned_cuis : props.assigned_cuis,
        assigned_qualifiers : props.assigned_qualifiers,

        cuis_selected : props.cuis_selected,
        qualifiers_selected : props.qualifiers_selected,

        cuis_data : {},
        cuisearch : "",
        cuisearch_msh_only : true,
        adder_opened : false,
        adder_cui : "",
        adder_text : "",
        dialogType : "cuiAdder",
        isLevel: props.isLevel,

        istitle: props.istitle,
      }

    }


  handleChange = (event, data, source) => {

  }

  toggleElement = async (code, ev, type) => {

      var state = this.state

      var assigned_element = state[type]
      var ispresent = assigned_element.indexOf(code)

      if ( ispresent > -1){
        assigned_element.splice(ispresent,1)
      } else {
        assigned_element.push(code)
      }

      state[type] = assigned_element

      // let fetch = new fetchData();
      // await fetch.setTableMetadata(state.docid, state.page, state.term, state.assigned_cuis.join(";"), state.assigned_qualifiers.join(";"), state.user )

      var data = {
          term: state.term,
          assigned_cuis: state.assigned_cuis,
          assigned_qualifiers: state.assigned_qualifiers,
          cuis_selected: state.cuis_selected,
          qualifiers_selected: state.qualifiers_selected,
          matching_term : state.matching_term,
          istitle : state.istitle,
      }

      this.props.updateConceptData( state.term, data )

      this.setState(state)

  }

  // Deletes the cui, it causes a toggle when it exists. so delete.
  handleCUIClick = (ev, cui) => {
      if ( this.state.dialogType === "cuiAdder"){
        this.toggleElement(cui, ev, "assigned_cuis")
      } else {
        this.toggleElement(cui, ev, "assigned_qualifiers")
      }
  }


  customCUIAdd = async (cui, description) => {

      if ( this.state["cuis_data"][cui] ) {

        alert( "The CUI for the concept you are adding already exists. Use another. [ ADD IS CANCELLED ! ]." );

        return;
      }

      let fetch = new fetchData();
      await fetch.addCustomCUI(cui,description)

      var newIndex = await fetch.getCUISIndex()
      this.setState({cuis_data: newIndex})

      await this.toggleElement(cui, null, "assigned_cuis")

      this.handleClose()
  }

  // CUI Adder section open/close function
  toggleAdder = () => {
    var isopened = this.state.adder_opened ? false : true
    if ( isopened ){
        this.setState({adder_cui: "", adder_text: ""})
    }
    this.setState({adder_opened: isopened})
  }

  async componentDidMount() {
    let fetch = new fetchData();
    var newIndex = await fetch.getCUISIndex()

    this.setState({cuis_data: newIndex})
  }

  async componentWillReceiveProps(next) {

    var urlparams = new URLSearchParams(window.location.search);

    this.setState({
      user: urlparams.get("user") ? urlparams.get("user") : "",
      page: urlparams.get("page") ? urlparams.get("page") : "",
      docid: urlparams.get("docid") ? urlparams.get("docid") : "",
      matching_term : next.matching_term,
      assigned_cuis : next.assigned_cuis,
      assigned_qualifiers : next.assigned_qualifiers,
      isLevel: next.isLevel,
      istitle: next.istitle,
    });

  }

  handleClick = (event, dialogType) => {
    this.setState({anchorEl : event.currentTarget, dialogType : dialogType });
    //
    // this.state.searchTextInput.current.focus();
  }

  handleClose = () => {
    this.setState({anchorEl : null});
  }

  handleTextChange = (varname,value) => {

    var newState = {}
    newState[varname] = value
    this.setState(newState);

  }

  // componentDidUpdate(prevProps, prevState){
  //
  //   if ( this.state.anchorEl ){
  //     debugger
  //      this.state.searchTextInput.current.focus();
  //
  //   }
  //
  // }

  render() {

    var concept_CUI_modifiers = {
                                 'Presence-absense' : "C0150312",
                                 'Baseline Characteristics': "C4684572",
                                 Severity : "C0441982",
                                 Magnitude : "C1704240",
                                 Duration : "C0449238",
                                 Exposed : "Exposed",
                                 Timing : "C0449243",
                                 Accuracy : "Accuracy",
                                 Ever : "C3887636",
                                 Previous : "Previous",
                                }

    var cuis_search_results;

    if ( this.state.cuisearch && this.state.cuisearch.length > 1 ){

      cuis_search_results = Object.keys(this.state.cuis_data).reduce( (agg,cui) => {

                if ( this.state.cuisearch_msh_only  && this.state.cuis_data[cui].hasMesh == false ){

                } else {

                    var matches = 0;

                    if ( cui.toLowerCase().indexOf(this.state.cuisearch.toLowerCase().trim()) > -1 ){
                      matches++
                    }

                    if ( this.state.cuis_data[cui].preferred.toLowerCase().indexOf(this.state.cuisearch.toLowerCase().trim()) > -1 ){
                      matches++
                    }


                    if ( matches > 0 ){
                      agg[cui] = this.state.cuis_data[cui];
                    }

                }

              return agg;
            },{} );

    }


    //+" / "+this.state.matching_term


    return (
      <div style={{marginBottom:5, marginLeft: this.state.isLevel ? 20 : 0}}>
            <div style={{display:"inline-block", fontWeight:"bolder"}}>{this.state.term+" : "}</div>

            { this.state.assigned_cuis ? this.state.assigned_cuis.map (
              cui => <div key={cui} className={"cui_selected"}
                          style={{display:"inline-block", marginLeft:15, cursor:"pointer", color: this.state.cuis_selected.indexOf(cui) > -1 ? "red" : "black"}}
                          onClick={ (ev) => { ev.ctrlKey ? this.toggleElement(cui, ev, "assigned_cuis") : this.toggleElement(cui, ev, "cuis_selected")}}>
                          {cui+" [ "+ (this.state.cuis_data[cui] ? this.state.cuis_data[cui].preferred : "") +" ] "}
                    </div>
            ) : ""}

            <Button aria-controls="simple-menu" aria-haspopup="true" onClick={(ev) => this.handleClick(ev,"cuiAdder")} style={{backgroundColor:"#e4ffdd", fontWeight:"bolder"}}>
              + Concept
            </Button>

            <div style={{display:"inline-block", fontWeight:"bolder", marginLeft:5}}>{" || "}</div>

            { this.state.assigned_qualifiers ? this.state.assigned_qualifiers.map (
              cui => <div key={cui}
                          className={"cui_selected"}
                          style={{display:"inline-block", marginLeft:15, cursor:"pointer", color: this.state.qualifiers_selected.indexOf(cui) > -1 ? "red" : "black"}}
                          onClick={ (ev) => { ev.ctrlKey ? this.toggleElement(cui, ev, "assigned_qualifiers") : this.toggleElement(cui, ev, "qualifiers_selected")}}>
                          {cui+" [ "+ (concept_CUI_modifiers[cui] ? concept_CUI_modifiers[cui] : "") +" ] "}
              </div>
            ) : ""}

            <Button aria-controls="simple-menu" aria-haspopup="true" onClick={(ev) => this.handleClick(ev,"qualifierAdder")} style={{backgroundColor:"#d1dcfb", fontWeight:"bolder", marginLeft:5}}>
              + Qualifier
            </Button>

            <Popover
              id={this.state.term+"_menu"}
              anchorEl={this.state.anchorEl}
              open={Boolean(this.state.anchorEl)}
              onClose={this.handleClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left',}}

            >
              {
              this.state.dialogType === "cuiAdder" ? <TextField
                autoFocus
                inputRef={this.state.searchTextInput}
                value={this.state.cuisearch}
                placeholder="search concepts here"
                onChange={(event) => {this.setState({cuisearch : event.currentTarget.value})}}
                style={{margin:5}}
                onKeyDown={(event, index) => {
                  if (event.key === 'Enter') {
                      event.preventDefault();
                  }
                }}
                /> : ""
              }

              {
              this.state.dialogType === "cuiAdder" && this.state.adminEnabled ? <Button onClick={ this.toggleAdder } style={{fontWeight:"bolder",margin:5}}>
                Add New Concept
              </Button> : ""
              }

              {
                this.state.dialogType === "cuiAdder" ? "" : Object.keys(concept_CUI_modifiers).map(
                  (v,i ) => <MenuItem key={v+"_item_"+i } style={{color: this.state.assigned_qualifiers.indexOf(v) > -1 ? "red" : "black"}} onClick={ (ev) => {this.handleCUIClick(ev,v)} } >
                                {v}
                            </MenuItem>
                )
              }

              {
                this.state.dialogType === "cuiAdder" && cuis_search_results && Object.keys(cuis_search_results).length > 0 ? Object.keys(cuis_search_results).map(
                  (v,i ) => <MenuItem key={v+"_item_"+i} style={{color: this.state.assigned_cuis.indexOf(v) > -1 ? "red" : "black"}} onClick={ (ev) => {this.handleCUIClick(ev,v)} }>
                                  {v+" -- "+cuis_search_results[v].preferred}
                            </MenuItem>
                  ) : ""
              }


              {
                this.state.dialogType === "cuiAdder" && this.state.adder_opened ?
                <div style={{margin:10}}>
                    <hr />
                    <div style={{backgroundColor:"#ececec"}}>
                    <TextField
                      value={this.state.adder_cui}
                      placeholder="concept id here"
                      onChange={ (event) => {this.handleTextChange("adder_cui",event.currentTarget.value)}}
                    />
                    <TextField
                      value={this.state.adder_text}
                      placeholder="concept definition"
                      onChange={ (event) => {this.handleTextChange("adder_text",event.currentTarget.value)}}
                      style={{marginLeft:5,marginRight:5}}
                    />

                    <Button onClick={ () => { this.customCUIAdd ( this.state.adder_cui, this.state.adder_text)}} style={{fontWeight:"bolder",margin:5}}> Add </Button>
                    </div>
                 </div>

                : ""
              }
            </Popover>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => ({
  // if route contains params
  params: ownProps.params,
  location: ownProps.location
})

const mapDispatchToProps = (dispatch) => ({

  goToUrl: (url) => dispatch(push(url))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MetaItem);
