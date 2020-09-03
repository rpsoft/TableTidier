import React, { Component } from 'react';
import { connect } from 'react-redux';
import { BrowserRouter, Link, Route } from 'react-router-dom';

// import { templateListSet } from '../actions/actions';
import QString from 'query-string';


import {URL_BASE} from '../links'
import fetchData from '../network/fetch-data';

//import Bootstrap from '../../assets/bootstrap.css';
import {
  Card, Checkbox,
  Select as SelectField,
  Input as TextField,
  Button as RaisedButton,
  MenuItem,
  Popover,
  Menu,
  Divider,
  Tabs, Tab,
  Table,
  TableBody,
  TableHead,
  TableCell,
  TableRow
} from '@material-ui/core';

import {ArrowDropDown as DownArrow} from '@material-ui/icons';

import {
  Refresh, Home,
  Sort as SortIcon,
  Power as PowerIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  RotateLeft as RotateLeftIcon,
  Delete as DeleteIcon,
  ArrowDropDown as ArrowDropDownIcon,
  ArrowDropUp as ArrowDropUpIcon
} from '@material-ui/icons';


import Loader from 'react-loader-spinner'
import { push } from 'connected-react-router'

import Annotation from './annotation'

import CKEditor from 'ckeditor4-react';
// import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

import TableCSS from './table.css';

import MetaAnnotator from './meta-annotator';

import ReactTable from 'react-table'
import 'react-table/react-table.css'

var process = require('process');

var ReactDOMServer = require('react-dom/server');
var HtmlToReact = require('html-to-react')
var HtmlToReactParser = require('html-to-react').Parser;


// import { ServerContext, PortContext } from "../app.js";



class AnnotationView extends Component {

  constructor(props) {
    super()

    var urlparams = this.getUrlParams(props);

    var filter_topics = urlparams["filter_topic"] ? urlparams["filter_topic"].split("_") : []
    var filter_type = urlparams["filter_type"] ? urlparams["filter_type"].split("_") : []

    var filter_group = urlparams["filter_group"] ? urlparams["filter_group"].split("_") : []
    var filter_labelgroup = urlparams["filter_labelgroup"] ? urlparams["filter_labelgroup"].split("_") : []

    this.state = {
        user: urlparams["user"] ? urlparams["user"] : "",
        docid: urlparams["docid"] ? urlparams["docid"] : "",
        page: urlparams["page"] ? urlparams["page"] : "",
        table: null,
        annotations:[],
        allAnnotations : null,
        corrupted: false,
        corrupted_text: "",
        tableType : "",
        preparingPreview : false,
        sortBy: {
          key : "row",
          dir : "asc"
        },
        toggeLiveResults: true,
        newTitleSubgroup: "",
        titleSubgroups: [],
        recommend_cuis : null,
        metadata : null,
        deleteEnabled: false,
        filter_topics : filter_topics,
        filter_type : filter_type,
        hideUnannotated : urlparams["hua"] ? urlparams["hua"] == "true" : false,
        filter_group : filter_group,
        filter_labelgroup : filter_labelgroup,
        toggleHeaderEdit : false,
        headerEditText : "",
        openedTab:0,
        bottomHeight: 600,
        tableLoading: false,
    };
  }

  getUrlParams(props){
    return decodeURIComponent(props.location.search).replace("?","").split("&").reduce( (acc,item) => {item = item.split("="); acc[item[0]] = item[1]; return acc },{})
  }

  async componentDidMount () {

    console.log("DID MOUNT COMPONENT")
    //debugger
    //
    // var urlparams = this.getUrlParams(this.props);
    //
    // var filter_topics = urlparams["filter_topic"] ? urlparams["filter_topic"].split("_") : []
    // var filter_type = urlparams["filter_type"] ? urlparams["filter_type"].split("_") : []
    // var filter_group = urlparams["filter_group"] ? urlparams["filter_group"].split("_") : []
    // var filter_labelgroup = urlparams["filter_labelgroup"] ? urlparams["filter_labelgroup"].split("_") : []
    //
    // let fetch = new fetchData();
    //
    // var annotation = JSON.parse(await fetch.getAnnotationByID(urlparams.docid,urlparams.page,this.state.user))
    //
    // var all_annotations = JSON.parse(await fetch.getAllAnnotations())
    //
    // var annotations_formatted = {}
    //     all_annotations.rows.map( (v,i) => {
    //       if ( annotations_formatted[v.docid+"_"+v.page] ){
    //         annotations_formatted[v.docid+"_"+v.page].push(v.user)
    //       } else {
    //         annotations_formatted[v.docid+"_"+v.page] = [v.user]
    //       }
    //     })
    //
    // var recommend_cuis = await fetch.getConceptRecommend();
    // var metadata = await fetch.getTableMetadata(urlparams.docid, urlparams.page, urlparams.user)
    //
    // var titleSubgroups = []
    //
    // if ( !metadata.error ){
    //     metadata.rows.map ( item => { if ( item.istitle ){ titleSubgroups.push(item.concept) } })
    // }
    //
    //
    // this.setState({
    //   //user : this.state.user.length > 0 ? this.state.user : this.props.location.query.user,
    //   corrupted : annotation.corrupted === 'true',
    //   corrupted_text : annotation.corrupted_text,
    //   docid : (annotation || annotation.docid) || urlparams.docid,
    //   page : annotation.page || urlparams.page,
    //   tableType : annotation.tableType ? annotation.tableType : "",
    //   annotations : annotation.annotation ? annotation.annotation.annotations : [],
    //   allAnnotations : annotations_formatted,
    //   recommend_cuis : recommend_cuis,
    //   metadata : metadata,
    //   titleSubgroups : titleSubgroups,
    //   deleteEnabled: false,
    //   filter_topics : filter_topics,
    //   filter_type : filter_type,
    //   hideUnannotated : urlparams["hua"] ? urlparams["hua"] == "true" : false,
    //   filter_group : filter_group,
    //   filter_labelgroup : filter_labelgroup,
    // })
    //
    // if( !this.state.preview ){
    //   this.getPreview()
    // }
  }

  async componentWillReceiveProps(next) {
        this.loadPageFromProps(next)
  }

  async componentWillMount() {
      this.loadPageFromProps(this.props)
  }

  async loadPageFromProps(props){
    // debugger
    var urlparams = this.getUrlParams(props);

    var filter_topics = urlparams["filter_topic"] ? urlparams["filter_topic"].split("_") : []
    var filter_type = urlparams["filter_type"] ? urlparams["filter_type"].split("_") : []
    var filter_group = urlparams["filter_group"] ? urlparams["filter_group"].split("_") : []
    var filter_labelgroup = urlparams["filter_labelgroup"] ? urlparams["filter_labelgroup"].split("_") : []

    var hua = urlparams["hua"] ? urlparams["hua"] == "true" : false

    // debugger;

    this.setState({tableLoading : true})

    if ( Object.keys(urlparams).length > 0 &&  urlparams.docid && urlparams.page) {

        let fetch = new fetchData();

        var all_annotations = JSON.parse(await fetch.getAllAnnotations())

        // Load all annotations. We shouldnt be doing this all the time.
        var annotations_formatted = {}
        var annotations_index = {}

        all_annotations.rows.map( (v,i) => {
          if ( annotations_formatted[v.docid+"_"+v.page] ){
            annotations_formatted[v.docid+"_"+v.page].push(v.user)
            annotations_index[v.docid+"_"+v.page].push(i)
          } else {
            annotations_formatted[v.docid+"_"+v.page] = [v.user]
            annotations_index[v.docid+"_"+v.page] = [i]
          }
        })

        // Here we get the actual table
        var data = await fetch.getTable(urlparams.docid,urlparams.page)

        // Return back to main page, if something has gone wrong. I.e table does not exist somehow.
        if ( JSON.parse(data).status == "wrong parameters"){
          alert("table not valid, maybe it was removed by another user")
          this.props.goToUrl("/?user="+this.state.user+this.formatFiltersForURL()+(this.state.hideUnannotated ? "&hua=true" : ""));
        }

        // AllInfo helps building the Next and Previous buttons etc.
        var allInfo;
        if ( (filter_topics.length + filter_type.length + filter_group.length + filter_labelgroup.length) > 0){
          allInfo = JSON.parse(await fetch.getAllInfo(filter_topics.join("_"), filter_type.join("_"), hua, filter_group.join("_"), filter_labelgroup.join("_")))
        } else {
          allInfo = JSON.parse(await fetch.getAllInfo())
        }

        // allInfo.abs_index = allInfo.abs_index.sort( (st_a,st_b) => {var dd = st_a.docid.localeCompare(st_b.docid); return dd == 0 ? parseInt(st_a.page) - parseInt(st_b.page) : dd} )


        var documentData = allInfo.available_documents[urlparams.docid]
        var current_table_g_index = documentData.abs_pos[documentData.pages.indexOf(urlparams.page)]



        // if( this.state.user && this.state.user.length > 0){
        //   annotation = JSON.parse(await fetch.getAnnotationByID(urlparams.docid,urlparams.page,this.state.user))
        // }


        var userIndex;
        var annIndex;
        var annotation;

        if ( annotations_formatted[urlparams.docid+"_"+urlparams.page] ){
            userIndex = annotations_formatted[urlparams.docid+"_"+urlparams.page].indexOf(this.state.user)
            annIndex =  annotations_index[urlparams.docid+"_"+urlparams.page][userIndex]
            annotation = all_annotations.rows[annIndex] || {}
        }


        var recommend_cuis = await fetch.getConceptRecommend();
        var metadata = await fetch.getTableMetadata(urlparams.docid, urlparams.page, urlparams.user)
        var titleSubgroups = []

        if ( !metadata.error ){
            metadata.rows.map ( item => { if ( item.istitle ){ titleSubgroups.push(item.concept) } })
        }

        if ( annotation ){
          // var theTableData = JSON.parse(data)

          this.setState({
            table: JSON.parse(data),
            docid : annotation.docid || urlparams.docid,
            page: annotation.page || urlparams.page,
            allInfo,
            gindex: current_table_g_index,
            user : urlparams.user ? urlparams.user : "",
            corrupted : annotation.corrupted === 'true',
            corrupted_text : annotation.corrupted_text,
            tableType : annotation.tableType ? annotation.tableType : "",
            annotations : annotation.annotation ? annotation.annotation.annotations : [],
            allAnnotations: annotations_formatted,
            recommend_cuis : recommend_cuis,
            metadata : metadata,
            titleSubgroups : titleSubgroups,
            filter: urlparams.filter,
            deleteEnabled: false,
            filter_topics : filter_topics,
            filter_type : filter_type,
            hideUnannotated : hua,
            filter_group : filter_group,
            filter_labelgroup : filter_labelgroup,
          })
        } else {
          this.setState({
            table: JSON.parse(data),
            docid : urlparams.docid,
            page: urlparams.page,
            allInfo,
            gindex: current_table_g_index,
            user : urlparams.user ? urlparams.user : "",
            allAnnotations: annotations_formatted,
            recommend_cuis : recommend_cuis,
            metadata : metadata,
            titleSubgroups : titleSubgroups,
            filter: urlparams.filter,
            deleteEnabled: false,
            filter_topics : filter_topics,
            filter_type : filter_type,
            hideUnannotated : hua,
            filter_group : filter_group,
            filter_labelgroup : filter_labelgroup,
          })
        }


        // prepare data for MetaAnnotator
        this.getPreview()
    }

    this.setState({tableLoading : false})
   }

   // Retrieve the table given general index and number N.
   shiftTables = (n) => {

     var urlparams = this.getUrlParams(this.props);

     var documentData = this.state.allInfo.available_documents[this.state.docid]
     var current_table_g_index = documentData.abs_pos[documentData.pages.indexOf( (this.state.page || urlparams.page) +"")]

     var new_index = current_table_g_index+n

      // check it is not out of bounds on the right
         new_index = new_index > this.state.allInfo.abs_index.length-1 ? this.state.allInfo.abs_index.length-1 : new_index
      //  now left
         new_index = new_index < 0 ? 0 : new_index

     var newDocument = this.state.allInfo.abs_index[new_index]

     this.setState({annotations:[],gindex: current_table_g_index, overrideTable: n != 0 ? null : this.state.overrideTable })

     this.props.goToUrl("/table?docid="+encodeURIComponent(newDocument.docid)+"&page="+newDocument.page+"&user="+this.state.user+this.formatFiltersForURL()+(this.state.hideUnannotated ? "&hua=true" : ""))

   }

   newAnnotation(){
     var annotations = this.state.annotations
         annotations[annotations.length] = {}

     this.setState({annotations})
   }

   autoAdd(){

     var auto_annotations = []

     var process_auto_annotations = (annotations,loc) => {
       return Object.keys(annotations).map( (N) => {

          var current = annotations[N]

          var content = {}
          for (var n in current.descriptors ){
            content[current.descriptors[n]] = true
          }

          var qualifiers = {};


          if ( current.unique_modifier.indexOf("indent") > -1 ){ qualifiers["indented"] = true }
          if ( current.unique_modifier.indexOf("bold") > -1 ){ qualifiers["bold"] = true }
          if ( current.unique_modifier.split(";").indexOf("empty_row") > -1 ){ qualifiers["empty_row"] = true }
          if ( current.unique_modifier.split(";").indexOf("empty_row_with_p_value") > -1 ){ qualifiers["empty_row_with_p_value"] = true }
          if ( current.unique_modifier.indexOf("ital") > -1 ){ qualifiers["italic"] = true }


          return {"location": loc,"content":content,"qualifiers":qualifiers,"number":(parseInt(current.c)+1)}
       } )
     }

     var col_annotations = process_auto_annotations (this.state.table.predicted.cols,"Col")
     var row_annotations = process_auto_annotations (this.state.table.predicted.rows,"Row")

    this.setState({annotations : col_annotations.concat(row_annotations)})

   }


   removeFalseKeys(obj){

     var newObject = {}

     var keys = Object.keys(obj)

     for(var k in keys){
       var ckey = keys[k]
       if ( obj[ckey] != false ){
         newObject[ckey] = obj[ckey]
       }

     }
     return newObject
   }

   doSort(v){

     var sort_key = v
     var sort_dir = this.state.sortBy.dir

     if (this.state.sortBy.key == v){
       sort_dir = sort_dir == "asc" ? "des" : "asc"
     }

     console.log(sort_key+" -- "+ sort_dir)

     this.setState(
       {
         sortBy: {
           key : sort_key,
           dir : sort_dir
         }
       }
     )
   }

   addAnnotation(i,data){

     var content = this.removeFalseKeys(data.content)
     var qualifiers = this.removeFalseKeys(data.qualifiers)

     data.content = content
     data.qualifiers = qualifiers

     var annotations = this.state.annotations
         annotations[i] = data
         console.log("ADDED ANNOTATION: "+JSON.stringify(annotations))
     this.setState({annotations})
   }

   deleteAnnotations(i){
     var annotations = this.state.annotations
         annotations.splice(i,1);

     this.setState({annotations})
   }

  removeOverrideTable = async (docid,page) => {

    if ( this.state.recoverEnabled ) {
       let fetch = new fetchData();
       await fetch.removeOverrideTable(docid,page)

       var data = await fetch.getTable(docid,page)

       this.setState({table: JSON.parse(data), editor_enabled : this.state.editor_enabled ? false : true, overrideTable: null})
     }

   }

   toggleHeaderEdit(){
    var headerText = ""

    try{
      var el = document.createElement( 'html' )
      el.innerHTML = this.state.table.htmlHeader
      headerText = decodeURI(el.innerText)
    } catch(e) {
        console.log("probably empty header?")
    }
    this.setState({toggleHeaderEdit: this.state.toggleHeaderEdit ? false : true, headerEditText: headerText})
   }

   saveHeaderEdit(){

     var tableData = this.state.table

     tableData.htmlHeader = '<table><tr ><td style="font-size:20px; font-weight:bold; white-space: normal;">'+this.state.headerEditText+'</td></tr></table>'


     this.setState({toggleHeaderEdit: false, table : tableData})

     this.saveTableChanges()
   }

   goToGIndex(index){
     if ( index > (this.state.allInfo.total-1)  ){
        alert("Document index out of bounds")
        return
     }

     if ( index < 0 ) {
       alert("Document index out of bounds")
       return
     }

     var newDocument = this.state.allInfo.abs_index[index]
     this.props.goToUrl("/table?docid="+encodeURIComponent(newDocument.docid)+"&page="+newDocument.page+"&user="+this.state.user+this.formatFiltersForURL()+(this.state.hideUnannotated ? "&hua=true" : ""))
   }

   async saveAnnotations(){

    if (!this.state.user){
        alert("Specify a user before saving and try again!!")
        return
    }

    var urlparams = this.getUrlParams(this.props);



    let fetch = new fetchData();
    await fetch.saveAnnotation(urlparams.docid,urlparams.page,this.state.user,this.state.annotations,this.state.corrupted, this.state.tableType,this.state.corrupted_text)
    //alert("Annotations Saved!")

    var all_annotations = JSON.parse(await fetch.getAllAnnotations())

    //var annotations = this.state.annotations ? this.state.annotations.rows : []
    var annotations_formatted = {}
        all_annotations.rows.map( (v,i) => {
          if ( annotations_formatted[v.docid+"_"+v.page] ){
            annotations_formatted[v.docid+"_"+v.page].push(v.user)
          } else {
            annotations_formatted[v.docid+"_"+v.page] = [v.user]
          }
        })

    // this.setState({preview,allAnnotations: {}})

    var preview = await fetch.getAnnotationPreview(urlparams.docid,urlparams.page, this.state.user)

    this.setState({preview,allAnnotations: annotations_formatted || {}})

   }

   async getPreview(disableUpdate){

     var urlparams = this.getUrlParams(this.props);

     this.setState({preparingPreview : true})

     let fetch = new fetchData();
     var preview = await fetch.getAnnotationPreview(urlparams.docid,urlparams.page, this.state.user)

     if ( !disableUpdate ){
       this.setState({preview, preparingPreview: false})
     }

     return preview
   }

   clearEditor = (CKEDITOR) => {

   }

   prepareEditor = (CKEDITOR) => {


     if ( CKEDITOR.config.stylesSet != "my_styles"){

       CKEDITOR.stylesSet.add( 'my_styles', [
          // // Block-level styles
          // { name: 'Blue Title', element: 'h2', styles: { 'color': 'Blue' } },
          // { name: 'Red Title' , element: 'h3', styles: { 'color': 'Red' } },
          //
          // // Inline styles
          // { name: 'CSS Style', element: 'span', attributes: { 'class': 'my_style' } },
          { name: 'Indent', element: 'p',  attributes: { 'class': 'indent1' }},
          { name: 'Superscript', element: 'sup',  attributes: {}},
          { name: 'Subscript', element: 'sub',  attributes: {}}
        ] );

        CKEDITOR.config.stylesSet = 'my_styles';
        // CKEDITOR.config.justifyClasses = [ 'AlignLeft', 'AlignCenter', 'AlignRight', 'AlignJustify' ];
      }

   }

   async saveTableChanges () {

     let fetch = new fetchData();

     var tableToSave


     if ( this.state.overrideTable ){
       tableToSave = this.state.overrideTable.replace("<table", decodeURI(this.state.table.htmlHeader).replace("<table><tr ><td", '<div class="headers"><div').replace("</td></tr></table>","</div></div><table "))
     } else {
       tableToSave = this.state.table.formattedPage.replace("<table", decodeURI(this.state.table.htmlHeader).replace("<table><tr ><td", '<div class="headers"><div').replace("</td></tr></table>","</div></div><table "))
     }

     fetch.saveTableEdit( this.state.docid, this.state.page, tableToSave )

     this.setState({editor_enabled : false  })

     // this.getPreview()
     this.props.goToUrl("/table/?docid="+this.state.docid+"&page="+this.state.page+"&user="+this.state.user+this.formatFiltersForURL()+(this.state.hideUnannotated ? "&hua=true" : ""))
   }

   addTitleSubgroup = () => {
     if ( this.state.newTitleSubgroup && this.state.newTitleSubgroup.length > 0){
       var titleSgs = this.state.newTitleSubgroup.trim().split("\n")

       var sgs = this.state.titleSubgroups ? this.state.titleSubgroups : []

       for (t in titleSgs){
         sgs.push(titleSgs[t])
       }

       this.setState({newTitleSubgroup: "", titleSubgroups: sgs })
     }
   }

   removeTitleSG = (sg) => {
     var sgs = this.state.titleSubgroups
     var i = sgs.indexOf(sg)
     sgs.splice(i,1)
     this.setState({titleSubgroups: sgs})
   }

   deleteAnnotation = async () => {
     if (this.state.deleteEnabled){
        let fetch = new fetchData();
        await fetch.deleteAnnotation( this.state.docid, this.state.page, this.state.user )
        this.setState({deleteEnabled:false})
        this.shiftTables(0)

     }
   }

   toggleBottom(){
     this.state.bottomHeight == 600 ? this.setState({bottomHeight:70}) : this.setState({bottomHeight:600})
   }

   openBottom(){
     this.setState({bottomHeight:600})
   }

   formatFiltersForURL(){
       return ""
               + (this.state.filter_topics.length > 0 ? "&filter_topic="+encodeURIComponent(this.state.filter_topics.join("_")) : "")
               + (this.state.filter_type.length > 0 ? "&filter_type="+encodeURIComponent(this.state.filter_type.join("_")) : "")
               + (this.state.filter_group.length > 0 ? "&filter_group="+encodeURIComponent(this.state.filter_group.join("_")) : "")
               + (this.state.filter_labelgroup.length > 0 ? "&filter_labelgroup="+encodeURIComponent(this.state.filter_labelgroup.join("_")) : "")
   }

   render() {

      // let blah = this.server;
      //
      // var hey = ServerContext
      //
      // var peet = PortContext
      //
      // debugger

       var preparedPreview = <div>Preview not available</div>

       var previousAnnotations = <div></div>

       var urlparams = this.getUrlParams(this.props);


       if( this.state.allAnnotations && this.state.allAnnotations[urlparams.docid+"_"+urlparams.page] ){

          previousAnnotations = <div style={{color:"red",display:"inline"}}>
                      <div style={{display:"inline"}} >Already Annotated by: </div>
                      {
                        this.state.allAnnotations[urlparams.docid+"_"+urlparams.page].map(
                           (us,j) => <div
                             style={{display:"inline",cursor: "pointer", textDecoration: "underline"}}
                             key={j}
                             onClick={ () => {this.props.goToUrl("/table/?docid="+encodeURIComponent(urlparams.docid)+"&page="+urlparams.page+"&user="+us+this.formatFiltersForURL()+(this.state.hideUnannotated ? "&hua=true" : ""))}}
                             >{us+", "}</div>
                        )

                      }
                    </div>

        }

       if( this.state.preview ){
            var header = [];
            var data;
            var columns = []

            if(this.state.preview.state == "good" && this.state.preview.result && this.state.preview.result.length > 0 ){
                data = this.state.preview.result.map(
                  (v,i) => {

                        var element = {}

                        for ( var n in Object.keys(v)){
                            var key_value = Object.keys(v)[n]

                            if ( key_value == "docid_page"){
                              continue
                            }

                            element[key_value] = v[key_value]+""
                            if ( columns.indexOf(key_value ) < 0 ){

                                columns.push(key_value)
                                header.push(
                                            {property: key_value,
                                              header: {
                                                label: key_value
                                              }
                                            })
                            }
                        }
                        return element
                        }
                )
            }


            if ( this.state.preview.state == "good" && this.state.preview.result ){

              if( this.state.preview.result.length > 0){


                      var sorting = this.state.sortBy

                      data = data.sort(function (a, b) {
                              var key = sorting.key
                              var dir = sorting.dir

                              var ak = a[key] ? a[key] : ""
                              var bk = b[key] ? b[key] : ""

                              if( key == "row" || key == "col"){
                                if ( dir == "asc" ) {
                                  return parseInt(ak) - parseInt(bk);
                                } else {
                                  return parseInt(bk) - parseInt(ak);
                                }
                              } else {black
                                if ( dir == "asc" ) {
                                  return ak.localeCompare(bk)
                                } else {
                                  return bk.localeCompare(ak)
                                }
                              }

                              })


                data = data.map( (v,i) => { v.col = parseInt(v.col); v.row = parseInt(v.row); return v})

                var cols = columns.map( (v,i) => { var col = {Header: v, accessor : v}; if( v == "col" || v == "row"){ col.width = 70 }; if( v == "value" ){ col.width = 200 }; return col } )

                preparedPreview = <ReactTable
                                    data={data}
                                    columns={cols}
                                    style={{
                                      height: "360px",
                                      marginBottom: 10,
                                      backgroundColor:"#f6f5f5"

                                    }}
                                    defaultPageSize={data.length}
                                  />


                } else {
                  preparedPreview = <div style={{fontWeight:"bold", color:"grey", padding:10, marginTop:20}}>Table could not be produced. Try altering annotations, or move on</div>
                }
              } else {
                preparedPreview = <div style={{fontWeight:"bold", color:"grey", padding:10, paddingTop: 0,  marginTop:20}}>Table could not be produced. Try altering annotations, or move on</div>
              }

       }

       var table_editor;

       if ( this.state.table ) {

          table_editor = this.editor ? this.editor : <CKEditor

              type="classic"
              id = "myeditor"
              key = "myeditor"

              onBeforeLoad={ ( CKEDITOR ) => { CKEDITOR.disableAutoInline = true; this.clearEditor(CKEDITOR); this.prepareEditor(CKEDITOR); } }

              config={ {
                  allowedContent : true,
                  toolbar : [
                            	{ name: 'document', groups: [ 'mode', 'document', 'doctools' ], items: [ 'Source', '-', 'Save', 'NewPage', 'Preview', 'Print', '-', 'Templates' ] },
                            	{ name: 'clipboard', groups: [ 'clipboard', 'undo' ], items: [ 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo' ] },
                            	{ name: 'editing', groups: [ 'find', 'selection', 'spellchecker' ], items: [ 'Find', 'Replace', '-', 'SelectAll', '-', 'Scayt' ] },
                            	// { name: 'forms', items: [ 'Form', 'Checkbox', 'Radio', 'TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField' ] },
                            	{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ], items: [ 'Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'CopyFormatting', 'RemoveFormat' ] },
                            	{ name: 'paragraph', groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ], items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'BidiLtr', 'BidiRtl', 'Language' ] },
                            	{ name: 'links', items: [ 'Link', 'Unlink', 'Anchor' ] },
                            	// { name: 'insert', items: [ 'Image', 'Flash', 'Table', 'HorizontalRule', 'Smiley', 'SpecialChar', 'PageBreak', 'Iframe' ] },
                            	{ name: 'styles', items: [ 'Styles', 'Format', 'Font', 'FontSize' ] },
                            	{ name: 'colors', items: [ 'TextColor', 'BGColor' ] },
                            	{ name: 'tools', items: [ 'Maximize', 'ShowBlocks' ] },
                            	// { name: 'others', items: [ '-' ] },
                            	// { name: 'about', items: [ 'About' ] }
                            ],

              } }

              data={this.state.overrideTable || this.state.table.formattedPage}

              onChange={ ( event, editor ) => {
                  const data = CKEDITOR.instances[Object.keys(CKEDITOR.instances)[0]].getData();
                  this.setState({overrideTable : data});
                  console.log( { event, editor, data } );
              } }

              onKey={ (event,editor) => {
                  const data = CKEDITOR.instances[Object.keys(CKEDITOR.instances)[0]].getData();
                  this.setState({overrideTable : data});
                }}

        />

      } else {
          table_editor = "";
      }

      var metaAnnotator = <MetaAnnotator annotationData={data}
                     annotationText={this.state.table ? this.state.table.formattedPage : ""}
                     titleSubgroups={this.state.titleSubgroups}
                     recommend_cuis={this.state.recommend_cuis}
                     metadata={this.state.metadata}
                     newTitleSubgroup={this.state.newTitleSubgroup}
                     filterTopic={this.state.filter_topic}
                     filterType={this.state.filter_type}
                     filter_group={this.state.filter_group}
                     filter_labelgroup={this.state.filter_labelgroup}
                     />


      return <div  style={{paddingLeft:"1%",paddingRight:"5%"}} >

        {metaAnnotator}

        <Card id="userData" style={{padding:15, height: 85}}>
          {
          //<Home style={{float:"left",height:45,width:45, cursor:"pointer"}} onClick={() => this.props.goToUrl("/"+"?user="+(this.state.user ? this.state.user : "" )+this.formatFiltersForURL()+(this.state.hideUnannotated ? "&hua=true" : ""))}/>
          }

          <TextField
            value={this.state.user}
            placeholder="Set your username here"
            onChange={(event,value) => {this.setState({user: event.currentTarget.value})}}
            style={{width:200,marginLeft:5,marginRight:20,float:"left"}}
            onKeyDown={(event, index) => {

              if (event.key === 'Enter') {
                  this.shiftTables(0)
                  event.preventDefault();
              }
            }}
            />

          <div>{this.state.gindex+" / "+ (this.state.allInfo ? this.state.allInfo.total-1 : "")}
          <TextField
            value={this.state.currentGPage}
            placeholder="Go to page"
            onChange={(event) => {
                                  this.setState({currentGPage: event.currentTarget.value})
                                }}
            onKeyDown={(event, index) => {
              if (event.key === 'Enter') {
                  this.goToGIndex(this.state.currentGPage)
                  event.preventDefault();
              }
            }}

            style={{width:100,marginLeft:20}}

            />
            <RaisedButton variant={"contained"} style={{marginLeft:20}} onClick={ () => { this.goToGIndex(this.state.currentGPage) } }>Go!</RaisedButton>
            <RaisedButton variant={"contained"} onClick={ () => {this.shiftTables(-1)} } style={{marginLeft:45,padding:5,marginRight:5}}>Previous Table</RaisedButton>
            <RaisedButton variant={"contained"} onClick={ () => {this.shiftTables(1)} } style={{padding:5,marginRight:45}}>Next Table</RaisedButton>
            <RaisedButton variant={"contained"} onClick={ () => {this.loadPageFromProps(this.props)} } style={{float:"right", fontWeight:"bolder"}}>Show Saved Changes <Refresh style={{marginLeft:5}}/></RaisedButton>

            <Checkbox checked={this.state.deleteEnabled}
                  onChange={ (event,data) => {this.setState({deleteEnabled : this.state.deleteEnabled ? false : true}) } }> </Checkbox>
            <RaisedButton variant={"contained"} onClick={ this.deleteAnnotation } style={{padding:5,marginRight:5, backgroundColor : this.state.deleteEnabled ? "red" : "gray"}}>Delete Annotation <DeleteIcon style={{marginLeft:5}}/></RaisedButton>
          </div>

          <div>{previousAnnotations}</div>


        </Card>

        <Card id="tableHeader" style={{padding:15,marginTop:10, textAlign: this.state.table ? "left" : "center"}}>

            { !this.state.table || this.state.tableLoading ?  <Loader type="Circles" color="#00aaaa" height={150} width={150}/>
                        : <div>

                          <div style={{float:"right"}}>
                            { this.state.toggleHeaderEdit ? <RaisedButton variant={"contained"} onClick={ () => {this.saveHeaderEdit()} } style={{margin:1,marginRight:5,fontWeight:"bolder"}}>Save Title Changes <SaveIcon style={{marginLeft:5}}/></RaisedButton> : "" }
                            <RaisedButton variant={"contained"} onClick={ () => {this.toggleHeaderEdit()} } style={{margin:1,marginRight:5,fontWeight:"bolder"}}>Edit <EditIcon style={{marginLeft:5}}/></RaisedButton>
                          </div>
                          <div style={{paddingBottom: 10, fontWeight:"bold",marginBottom:10}}>
                            <a href={"http://sephirhome.ddns.net:6680/"+ this.state.docid+".pdf"} target="_blank">{"Open PDF: " + this.state.docid+".pdf "}</a>
                              { "(Table "+this.state.page + ") | " + (this.state.table.title && this.state.table.title.title ? this.state.table.title.title.trim() : (this.state.table.title && this.state.table.title.abstract ? this.state.table.title.abstract : "") )}
                          </div>

                          <div>
                            {
                              this.state.toggleHeaderEdit

                               ? <TextField
                                value={this.state.headerEditText}
                                placeholder="Type table header/caption here"
                                onChange={(event,value) => {this.setState({headerEditText: event.currentTarget.value})}}
                                fullWidth={true}
                                multiline={true}
                                />

                              : <div style={{paddingBottom: 10, fontWeight:"bold", display: "inline-block"}} dangerouslySetInnerHTML={{__html:decodeURI(this.state.table.htmlHeader)}}></div>
                            }
                          </div>


                          {this.state.titleSubgroups ? this.state.titleSubgroups.map( (sg,i) => <div key={"title_sg_"+i} style={{cursor:"pointer"}} onClick= { () => this.removeTitleSG(sg) }> {sg+","} </div> ) : ""}
                          <TextField
                                value={this.state.newTitleSubgroup}
                                placeholder="Enter title subgroup here to add"
                                style={{width:400}}
                                multiline
                                onChange={(event) => {this.setState({newTitleSubgroup: event.target.value})}}
                                onKeyDown={(event, index) => {
                                  if (event.key === 'Enter') {
                                      this.addTitleSubgroup()
                                      event.preventDefault();
                                  }
                                }}

                              /><RaisedButton style={{color:"#198413",backgroundColor:"#d4d4d4", marginLeft:10}}
                                              onClick={ (event) => { this.addTitleSubgroup();  event.preventDefault(); } }> ADD Title Subgroup </RaisedButton>
                      </div> }
        </Card>

        <Card id="tableHolder" style={{padding:15,marginTop:10, textAlign: this.state.table ? "left" : "center", minHeight: 580}}>
          <div style={{float:"right"}}>
            { this.state.editor_enabled ? <Checkbox checked={this.state.recoverEnabled} onChange={ (event,data) => {this.setState({recoverEnabled : this.state.recoverEnabled ? false : true}) } }> </Checkbox> : ""}
            { this.state.editor_enabled ? <RaisedButton variant={"contained"} style={{marginRight: 15, backgroundColor: this.state.recoverEnabled ? "red" : "" }} onClick={ () => this.removeOverrideTable(this.state.docid, this.state.page) }>Recover Original  <RotateLeftIcon style={{marginLeft:5}}/> </RaisedButton> : ""}

            { this.state.editor_enabled ? <RaisedButton variant={"contained"} style={{marginRight:15}} onClick={ () => this.saveTableChanges( this.state ) }>Save Table Changes <SaveIcon style={{marginLeft:5}}/> </RaisedButton> : ""}
            <RaisedButton variant={"contained"} style={{marginRight:10}} onClick={ () => { this.setState({editor_enabled : this.state.editor_enabled ? false : true}) } }>Edit <EditIcon style={{marginLeft:5}}/></RaisedButton>
          </div>

          <div style={{marginTop:50}}></div>

          { !this.state.table || this.state.tableLoading ? <Loader type="Circles" color="#00aaaa" height={150} width={150}/> : ( this.state.editor_enabled ? table_editor : <div dangerouslySetInnerHTML={{__html:this.state.overrideTable || this.state.table.formattedPage}}></div> ) }
        </Card>

        <Card style={{padding:8,marginTop:10,fontWeight:"bold", marginBottom: 500}}>
            <div style={{width:"100%"}}>

              <table>
                <tbody>
                    <tr>
                      <td style={{padding:"0px 0px 0px 0px", verticalAlign: "top", paddingRight:50}}>
                        <div style={{fontWeight:"bold"}}>Any comments errors or issues?</div> <TextField
                              value={this.state.corrupted_text && this.state.corrupted_text != 'undefined' ? this.state.corrupted_text.replace(/(%[A-z0-9]{2})/g," ") : ""}
                              placeholder="Please specify here"
                              onChange={(event) => {this.setState({corrupted_text: event.target.value})}}
                              style={{width:500,marginLeft:20,fontWeight:"normal"}}
                              multiline={true}
                              rows={1}
                              rowsMax={5}
                            />
                      </td>
                      <td style={{padding:"0px 0px 0px 0px", verticalAlign: "top", paddingLeft:50}}>
                        <div style={{fontWeight:"bold"}}>Specify Table type</div>
                        <SelectField
                             value={this.state.tableType}
                             onChange={(event,data) => {this.setState({tableType : data.props.value})} }
                             style={{fontWeight:"normal"}}
                           >
                             <MenuItem value={"baseline_table"} key={1}>baseline characteristic table</MenuItem>
                             <MenuItem value={"other_table"} key={2}> other table </MenuItem>
                             <MenuItem value={"result_table_subgroup"} key={3}> results table with subgroups </MenuItem>
                             <MenuItem value={"result_table_without_subgroup"} key={4}> results table without subgroups </MenuItem>

                        </SelectField>
                      </td>
                    </tr>
                  </tbody>
                </table>
            </div>
        </Card>







      <div style={{marginTop:10, position: "fixed", width: "100vw", bottom: 0, left:0, backgroundColor:"#00000061", minHeight: this.state.bottomHeight-200 < 0 ? 0 : this.state.bottomHeight-200 }}>
        <Card style={{padding:10,  paddingBottom:10, maxHeight: this.state.bottomHeight, width: "94%",marginLeft:"1%",marginTop:3, minHeight: this.state.bottomHeight-200 < 0 ? 0 : this.state.bottomHeight-200 }}>

          <div style={{float:"right"}}>
            <RaisedButton variant={"contained"} onClick={ () => {this.saveAnnotations(); this.loadPageFromProps(this.props); } }  style={{margin:1,height:45,marginRight:5,fontWeight:"bolder"}}>Save Changes & Update!</RaisedButton>
            <RaisedButton variant={"contained"} onClick={ () => {this.loadPageFromProps(this.props)} }  style={{margin:1,height:45,marginRight:5,fontWeight:"bolder"}}><Refresh/>Reload</RaisedButton>
            <RaisedButton variant={"contained"} onClick={ () => {this.toggleBottom()} }  style={{margin:1,height:45,marginRight:5,fontWeight:"bolder"}}>{ this.state.bottomHeight == 600 ? <ArrowDropDownIcon /> : <ArrowDropUpIcon /> }{ this.state.bottomHeight == 600 ? "Hide" : "Show"}</RaisedButton>
          </div>
          <Tabs
              orientation="horizontal"
              variant="scrollable"
              value={this.state.openedTab}
              onChange={(ev,value) => {this.setState({openedTab: value}); this.openBottom();}}
              aria-label="Vertical tabs example"

            >
            <Tab label="Annotations"  />
            <Tab label="Data Results"  />

          </Tabs>
          <hr />

        { this.state.openedTab == 0 ? <RaisedButton variant={"contained"} className={"redbutton"} style={{marginLeft:10, backgroundColor:"#b8efaf"}} onClick={ () => {this.newAnnotation()} }>+ Add Annotation</RaisedButton> : ""}
        { this.state.openedTab == 0 ? <RaisedButton variant={"contained"} style={{marginLeft:10, backgroundColor:"#b8c0ff"}} onClick={ () => {this.autoAdd()} }><PowerIcon /> Auto Add </RaisedButton> : ""}


        <div style={{marginBottom:20}}/>


        {
           this.state.openedTab == 0 && this.state.annotations && this.state.annotations.length > 0 ? this.state.annotations.map(
            (v,i) => {

              return <Annotation key={i}
                                 annotationData ={this.state.annotations[i]}
                                 addAnnotation={ (data) => {this.addAnnotation(i,data)}}
                                 deleteAnnotation = { () => {this.deleteAnnotations(i)} }
                                 />
           }
         ) : this.state.openedTab != 0 ? "" : <div style={{fontWeight:"bold", color:"grey", padding:10}}>No annotations yet</div>
        }


        { this.state.openedTab == 1 ?
          <div>

            {
              this.state.preparingPreview ?  <Loader type="Circles" color="#00aaaa" height={150} width={150}/> :  (this.state.preview ? preparedPreview : "Save changes to see preview")
            }

          </div> : ""
        }

        </Card>


        </div>



      </div>
    }
}

const mapStateToProps = (state, ownProps) => ({
  templateList: state.templateList || null,
  // if route contains params
  params: ownProps.params,
  location: ownProps.location
})

const mapDispatchToProps = (dispatch) => ({
  // setTemplateList: (templateList) => {
  //   dispatch(templateListSet(templateList))
  // },
  goToUrl: (url) => dispatch(push(url))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AnnotationView);
