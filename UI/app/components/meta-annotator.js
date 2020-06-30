import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router'
import { push } from 'connected-react-router'

import RaisedButton from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

import SelectField from '@material-ui/core/Select';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

import Card from '@material-ui/core/Card';
import Popover from '@material-ui/core/Popover';

import MetaItem from './meta-item'

import Eye from '@material-ui/icons/RemoveRedEye';
import Disk from '@material-ui/icons/Save';

import fetchData from '../network/fetch-data';
import { SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION } from 'constants';


String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

class MetaAnnotator extends Component {
  constructor(props) {
      super()

      var urlparams = new URLSearchParams(window.location.search);

      this.state = {
        user: urlparams.get("user") ? urlparams.get("user") : "",
        page: urlparams.get("page") ? urlparams.get("page") : "",
        docid: urlparams.get("docid") ? urlparams.get("docid") : "",
        labeller: urlparams.get("labeller") ? urlparams.get("labeller") : "",
        opened: 0,
        annotationData: props.annotationData,
        concept_metadata: {}, // The actual data in the database, that will hold the data from the interaction with the annotator.
        recommend_cuis: {}, // This are the proposed cuis for concepts as per classfier and Peter's manual annotations.
        isSaved : false,
        titleSubgroups : props.titleSubgroups || [],
        filter_topics : props.filterTopic,
        filter_type : props.filterType,
        filter_group : props.filter_group,
        filter_labelgroup : props.filter_labelgroup,
      };

    }

  handleChange = (event, data, source) => {
     var prevState = this.state
     prevState[source] = event.currentTarget.value
     console.log(prevState)
     this.setState(prevState);
     this.props.addAnnotation(this.state)
  };

  async componentDidMount() {


  }

  formatFiltersForURL(){
      return ""
              + (this.state.filter_topics.length > 0 ? "&filter_topic="+encodeURIComponent(this.state.filter_topics.join("_")) : "")
              + (this.state.filter_type.length > 0 ? "&filter_type="+encodeURIComponent(this.state.filter_type.join("_")) : "")
              + (this.state.filter_group.length > 0 ? "&filter_group="+encodeURIComponent(this.state.filter_group.join("_")) : "")
              + (this.state.filter_labelgroup.length > 0 ? "&filter_labelgroup="+encodeURIComponent(this.state.filter_labelgroup.join("_")) : "")
  }

  updateLabeller(labeller){
      this.props.goToUrl("/table?docid="+encodeURIComponent(this.state.docid)+"&page="+this.state.page+"&user="+this.state.user+"&labeller="+this.state.labeller+this.formatFiltersForURL())
  }


  async componentWillReceiveProps(next) {

    // debugger
    // if ( next.titleSubgroups && next.titleSubgroups.length > 0 ){
    //   debugger
    // }

    var annotationData = next.annotationData
    var urlparams = new URLSearchParams(window.location.search);

    let fetch = new fetchData();
    var recommend_cuis = next.recommend_cuis
    var metadadata = next.metadata

    var labeller = ""

    var unique_concepts_metadata = []

    var concept_metadata = {}
        metadadata && !metadadata.error ? metadadata.rows.map ( item => {
                  var matching_term = this.prepareTermForMatching(item.concept)
                  var cuis = item.cuis.length > 0 ? item.cuis.split(";") : ( recommend_cuis[matching_term] ? recommend_cuis[matching_term].cuis : [] )

                  unique_concepts_metadata.push(item.concept)

                  labeller = item.labeller

                  concept_metadata[item.concept] = {
                    cuis: cuis,
                    cuis_selected : item.cuis_selected.length > 0 ? item.cuis_selected.split(";") : [],
                    qualifiers: item.qualifiers.length > 0 ? item.qualifiers.split(";") : [],
                    qualifiers_selected : item.qualifiers_selected.length > 0 ? item.qualifiers_selected.split(";") : [],
                    matching_term : matching_term,
                    istitle: item.istitle,
                  }
                }
              ) : ""

    var concepts = {}

    var unique_concepts_annotation = []


    var concepts_indexing = {}


    var decodeHTML = function (html) {
    	var txt = document.createElement('textarea');
    	txt.innerHTML = html;
    	return txt.value;
    };

    var annotationText = decodeHTML(this.props.annotationText.replaceAll(/(<([^>]+)>)/ig, ' ')).toLowerCase().replaceAll(' +'," ").split("\n").filter(function (el) {
      return el.trim().length > 0;
    }).reduce( (acc,e) => {acc.push(e.trim()); return acc},[])

      next.annotationData ? next.annotationData.map( (annotated_record) => {
                                var cs = Object.keys(annotated_record).map(
                                   (category) => {
                                    var concept = annotated_record[category];


                                    var stored_qualifier = concepts[category];
                                    concepts[category] = Array.from( new Set( stored_qualifier ? [...stored_qualifier,concept] : [concept] ))

                                    if ( ["value","col","row"].indexOf(category) < 0 ){
                                      concepts_indexing[concept.toLowerCase()] = {index: annotationText.indexOf( concept.toLowerCase() ) , category : category}
                                      unique_concepts_annotation.push(concept)
                                    }

                                    return concept
                                  }
                                )

                              }
                            ) : ""

    var categories_order = []

    Object.keys(concepts_indexing).sort(function(a, b){return concepts_indexing[a].index-concepts_indexing[b].index})
                    .map( el => { categories_order.indexOf(concepts_indexing[el].category) < 0 ? categories_order.push(concepts_indexing[el].category) : ""  })


    var all_ordered_concepts = annotationText.reduce( (acc,item) => {if ( Object.keys(concepts_indexing).indexOf(item) > -1 ){acc.push(item); }return acc}, [] )

    var all_concept_variations = []

    var parentName = ""
    for ( var a = 0; a < all_ordered_concepts.length; a++){
      var concept = all_ordered_concepts[a]
      var category = concepts_indexing[concept].category

      if ( category.indexOf("characteristic_name") > -1){
        all_concept_variations.push(concept);
        parentName = concept
      } else if ( category == "characteristic_level" ){
        all_concept_variations.push(parentName+";"+concept);
      }

    }


    // adding the placeholder for concepts that have not been assigned yet into concept_metadata.
    all_concept_variations.map( concept_key => {
                    var concept_group = concept_key.split(";")
                    var concept = concept_group[concept_group.length-1]

                    if ( !concept_metadata[concept_key] ){
                        var matching_term = this.prepareTermForMatching(concept)
                        var cuis = recommend_cuis[matching_term] ? recommend_cuis[matching_term].cuis : []

                        concept_metadata[concept_key] = {
                          concept: concept_key,
                          cuis: cuis,
                          cuis_selected :  cuis.length > 0 ? [cuis[0]] : [] ,
                          qualifiers: ["Presence-absense"],
                          qualifiers_selected : ["Presence-absense"],
                          matching_term : matching_term,
                          istitle: false,
                        }
                    }
    });


    next.titleSubgroups ? next.titleSubgroups.map ( titleSG => {
        var matching_term = this.prepareTermForMatching(titleSG);
        var cuis = recommend_cuis[matching_term] ? recommend_cuis[matching_term].cuis : []

        var alreadyExists = concept_metadata[titleSG] ? true : false

        concept_metadata[titleSG] = {
              cuis: alreadyExists ? concept_metadata[titleSG].cuis : cuis,
              cuis_selected: alreadyExists ? concept_metadata[titleSG].cuis_selected : cuis.length > 0 ? [cuis[0]] : [],
              matching_term: matching_term,
              qualifiers: alreadyExists ? concept_metadata[titleSG].qualifiers : ["Presence-absense"],
              qualifiers_selected: alreadyExists ? concept_metadata[titleSG].qualifiers_selected : ["Presence-absense"],
              istitle: true,
            }

        concepts_indexing[titleSG] = {
          category: "title_subgroup",
          index: -10,
        }



    }) : "";

    // debugger

    this.setState({
      user: urlparams.get("user") ? urlparams.get("user") : "",
      page: urlparams.get("page") ? urlparams.get("page") : "",
      docid: urlparams.get("docid") ? urlparams.get("docid") : "",
      labeller: labeller ? labeller : (urlparams.get("labeller") ? urlparams.get("labeller") : ""),
      annotationData: next.annotationData,
      concept_metadata : concept_metadata,
      recommend_cuis : recommend_cuis,
      concepts_indexing : concepts_indexing,
      ordered_concepts : [... next.titleSubgroups, ... all_concept_variations],
      isSaved : false,
      titleSubgroups : next.titleSubgroups,
      filter_topics : next.filterTopic,
      filter_type : next.filterType,
      filter_group : next.filter_group,
      filter_labelgroup : next.filter_labelgroup,
    })

  }

  prepareTermForMatching = (term) => {

    term = term+""
    term = term.replaceAll(/[^A-z0-9\^ ]/," ")
    term = term.replaceAll('[0-9]+',"$nmbr$")
    term = term.replaceAll(/\^/g, '');
    term = term.replaceAll(' +'," ").trim().toLowerCase()

    return term
  }

  async saveAll() {


        var current_metadata = this.state.concept_metadata


        let fetch = new fetchData();

        await fetch.clearTableMetadata(this.state.docid, this.state.page, this.state.user)

        //debugger

        // remove titles that are not there anymore.

        Object.keys(current_metadata).map( (concept) => {

            if ( current_metadata[concept].istitle && this.state.titleSubgroups.indexOf(concept) < 0 ){
                delete current_metadata[concept]
            }

            if ( current_metadata[concept] && !current_metadata[concept].istitle && this.state.ordered_concepts.indexOf(concept) < 0 ){
                delete current_metadata[concept]
            }


        })


        Object.keys(current_metadata).map( async (concept) => {
          var current_concept = current_metadata[concept]

          await fetch.setTableMetadata(this.state.docid, this.state.page, concept, current_concept.cuis.join(";"),current_concept.cuis_selected.join(";"), current_concept.qualifiers.join(";"), current_concept.qualifiers_selected.join(";"), this.state.user, current_concept.istitle, this.state.labeller )

        })

        this.setState({isSaved: true, current_metadata: current_metadata})

        alert("Metadata Changes Saved!")
  }

  updateConceptData = (concept, data) => {

      var current_metadata = this.state.concept_metadata
      var current_concept_data = current_metadata[concept];

      current_concept_data = {
                  cuis: data.assigned_cuis,
                  cuis_selected: data.cuis_selected,
                  qualifiers: data.assigned_qualifiers,
                  qualifiers_selected: data.qualifiers_selected,
                  matching_term: data.matching_term,
                  istitle: data.istitle,
              }

      current_metadata[concept] = current_concept_data

      this.setState({concept_metadata : current_metadata, isSaved: false})

  }

  openHandler(prev){
    this.setState({opened : (prev == 2 ? 0 : prev +1)})
  }

  render() {


    var concepts_by_category = {}

    if ( this.props.annotationData ){
      var data = this.props.annotationData

      data.map( (annotated_record) =>
                  Object.keys(annotated_record).map( (qualifier) => {
                            var concept = annotated_record[qualifier];
                            var stored_qualifier = concepts_by_category[qualifier];
                            concepts_by_category[qualifier] = stored_qualifier ? [...stored_qualifier,concept] : [concept]
              }))




    }

    var opened = 85;
    if ( this.state.opened == 1){
      opened = "50%"
    } else if ( this.state.opened == 2){
      opened = "80%"
    }

    return (
      <Card style={{ width: opened, minHeight: 600, height: "100%", float: "right", position: "fixed",  top: 0, right: 0, zIndex: 1,overflowY:"scroll"}}>


            <RaisedButton variant={"contained"}
                      style={{width:50,float:"right",margin:2}}
                      onClick={ () => { this.openHandler(this.state.opened) } }>
                        <Eye style={{color : Object.keys(concepts_by_category).length > 0 ? "red": "inherit"}}/>
            </RaisedButton>

            {
              this.state.opened ? <RaisedButton variant={"contained"}
                      style={{width:50,float:"left",margin:2,marginLeft:4, color: this.state.isSaved ? "inherit" : "red" }}
                      onClick={ () => { this.saveAll() } }><Disk/></RaisedButton> : ""
            }

            {
              this.state.opened ? <TextField
              value={this.state.labeller}
              placeholder="Set your labeller name here"
              onChange={(event,value) => {this.setState({labeller: event.currentTarget.value})}}
              style={{width:200,marginLeft:20,marginRight:20,float:"left"}}
              onKeyDown={(event, index) => {
                if (event.key === 'Enter') {
                    this.updateLabeller(event.currentTarget.value)
                    event.preventDefault();
                }
              }}
              /> : ""
            }

            <hr style={{marginTop:45,marginLeft:5,marginRight:5}}/>


            {
              this.state.opened && Object.keys(this.state.concept_metadata).length > 0 ?
                  <div style={{margin:10}}>

                  {this.state.ordered_concepts.map( (concept_key,i) => {

                              var currentItem = this.state.concept_metadata[concept_key]
                              var elems = concept_key.split(";")
                              var concept = elems[elems.length-1]

			     var isLevel = this.state.concepts_indexing[concept] ? this.state.concepts_indexing[concept].category == "characteristic_level" : false;

                              return <MetaItem
                                                key = {"concept_item_"+concept_key+"_"+i}
                                                term = {concept}
                                                matching_term = { currentItem.matching_term}
                                                assigned_cuis = { currentItem.cuis }
                                                assigned_qualifiers = { currentItem.qualifiers }
                                                cuis_selected = { currentItem.cuis_selected }
                                                qualifiers_selected = {currentItem.qualifiers_selected }
                                                updateConceptData = {this.updateConceptData}
                                                isLevel = {isLevel}
                                                istitle = {currentItem.istitle}
                                      />
                            })}
                  </div>
                  : ""

            }
      </Card>
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
)(MetaAnnotator);
