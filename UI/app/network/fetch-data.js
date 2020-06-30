import HttpClient from './http-client';
import { URL_BASE } from '../links'

const urlBase = URL_BASE + 'api/'

export default class fetchData {
  constructor() {
    this.httpClient = new HttpClient()
  }

  async getGeneric(path) {
    let result

    try {
      result = await this.httpClient.send('', { path })
    } catch(error) {
      console.error('fetching template list error > ' + error)
    }

    return result
  }


  async removeOverrideTable(docid,page){
      var urlQueryRequest = urlBase+ "removeOverrideTable?docid="+encodeURIComponent(docid)+"&page="+page

      var r = await this.getGeneric( urlQueryRequest  )

      return r
  }

  async saveTableEdit(docid,page,content) {

    let result

    var options = {path : "/saveTableOverride"}

    try {
      result = await this.httpClient.sendPost( {docid: docid, page: page, table: content}, options )
    } catch(error) {
      console.error('Table Edit POST failed: ' + error)
    }

    return result
  }

  async saveAnnotation(docid,page,user,annotation,corrupted, tableType, corrupted_text) {

    var urlQueryRequest = urlBase+ "recordAnnotation?docid="+encodeURIComponent(docid)+"&page="+page+"&user="+user+"&annotation="+encodeURIComponent(JSON.stringify(annotation))+"&corrupted="+ (corrupted == undefined ? false : corrupted)+"&tableType="+tableType + "&corrupted_text=" + corrupted_text

    console.log(urlQueryRequest)

    var r = await this.getGeneric( urlQueryRequest  )

    return r

  }

  async deleteAnnotation(docid,page,user,annotation,corrupted, tableType, corrupted_text) {

    var urlQueryRequest = urlBase+ "deleteAnnotation?docid="+encodeURIComponent(docid)+"&page="+page+"&user="+user

    console.log(urlQueryRequest)

    var r = await this.getGeneric( urlQueryRequest  )

    return r

  }

  async getTable(docid,page) {

        var urlQueryRequest = urlBase+ "getTable?docid="+encodeURIComponent(docid)+"&page="+page

        var r = await this.getGeneric( urlQueryRequest  )

        return r
  }

  async getMetadataForCUI(cui){

            var urlQueryRequest = urlBase+ "getMetadataForCUI?cui="+encodeURIComponent(cui)

            var r = await this.getGeneric( urlQueryRequest  )

            return JSON.parse( r ).rows

  }

  async modifyCUIData(cui,preferred,adminApproved,prevcui){

      // debugger

      var urlQueryRequest = urlBase+ "modifyCUIData?cui="+encodeURIComponent(cui)+"&preferred="+encodeURIComponent(preferred)+"&adminApproved="+encodeURIComponent(adminApproved)+"&prevcui="+prevcui

      var r = await this.getGeneric( urlQueryRequest  )

      return r

  }


  async cuiDeleteIndex(cui){

      var urlQueryRequest = urlBase+ "cuiDeleteIndex?cui="+encodeURIComponent(cui)

      var r = await this.getGeneric( urlQueryRequest  )

      return r

  }

  async deleteTable(docid,page) {

        var urlQueryRequest = urlBase+ "deleteTable?docid="+encodeURIComponent(docid)+"&page="+page

        var r = await this.getGeneric( urlQueryRequest  )

        return r
  }


  async getConceptRecommend() {

        var urlQueryRequest = urlBase+ "cuiRecommend"
// getConceptAssignment
        var r = await this.getGeneric( urlQueryRequest  )

        return JSON.parse(r)
  }

  async setTableMetadata(docid, page, concept, cuis, cuis_selected, qualifiers, qualifiers_selected, user, istitle, labeller) {
        // debugger
        var urlQueryRequest = urlBase+ "setMetadata?docid="+encodeURIComponent(docid)
                                                +"&page="+page
                                                +"&concept="+encodeURIComponent(concept)
                                                +"&cuis="+encodeURIComponent(cuis)
                                                +"&cuis_selected="+encodeURIComponent(cuis_selected)
                                                +"&qualifiers="+encodeURIComponent(qualifiers)
                                                +"&qualifiers_selected="+encodeURIComponent(qualifiers_selected)
                                                +"&user="+encodeURIComponent(user)
                                                +"&istitle="+encodeURIComponent(istitle || false)
                                                +"&labeller="+encodeURIComponent(labeller ? labeller : user) // default to user if no labeller set.

        var r = await this.getGeneric( urlQueryRequest  )

        return r
  }

  async getTableMetadata(docid, page, user) {

        var urlQueryRequest = urlBase+ "getMetadata?docid="+encodeURIComponent(docid)+"&page="+page+"&user="+encodeURIComponent(user)

        var r = await this.getGeneric( urlQueryRequest  )

        return JSON.parse(r)
  }


  async clearTableMetadata(docid, page, user) {

        var urlQueryRequest = urlBase+ "clearMetadata?docid="+encodeURIComponent(docid)+"&page="+page+"&user="+encodeURIComponent(user)

        var r = await this.getGeneric( urlQueryRequest  )

        return r
  }





  async getAnnotationPreview(docid,page,user) {

        var urlQueryRequest = urlBase+ "annotationPreview?docid="+encodeURIComponent(docid)+"&page="+page+"&user="+user

        var r = await this.getGeneric( urlQueryRequest  )
        // debugger
        return JSON.parse(r)
  }

  async getAnnotationByID(docid,page,user) {

        var urlQueryRequest = urlBase+ "getAnnotationByID?docid="+encodeURIComponent(docid)+"&page="+page+"&user="+user

        var r = await this.getGeneric( urlQueryRequest  )

        return r
  }

  async getAllInfo(filter_topic, filter_type, hua, filter_group, filter_labelgroup) {
      // debugger
        // filter = filter == "nofilter" ? null : filter
        var params = []

        if ( filter_topic && filter_topic.length > 0 ){
          params.push("filter_topic=" + encodeURIComponent(filter_topic))
        }

        if ( filter_type && filter_type.length > 0 ){
          params.push("filter_type=" + encodeURIComponent(filter_type))
        }

        if ( filter_group && filter_group.length > 0 ){
          params.push("filter_group=" + encodeURIComponent(filter_group))
        }

        if ( filter_labelgroup && filter_labelgroup.length > 0 ){
          params.push("filter_labelgroup=" + encodeURIComponent(filter_labelgroup))
        }

        if (hua) {
          params.push("hua=true")
        }

        var urlQueryRequest = urlBase+ "allInfo?"+params.join("&")

        var r = await this.getGeneric( urlQueryRequest  )

        return r

  }

  async getCUISIndex() {

        var urlQueryRequest = urlBase + "cuisIndex"

        var r = await this.getGeneric( urlQueryRequest  )

        return JSON.parse(r)
  }

  async getCUIModifiers() {

        var urlQueryRequest = urlBase + "getCUIMods"

        var r = await this.getGeneric( urlQueryRequest  )

        return JSON.parse(r)
  }

  async setCUIModifiers(cuis) {

        var urlQueryRequest = urlBase + "setCUIMods?cuis="+encodeURIComponent(cuis)

        var r = await this.getGeneric( urlQueryRequest  )

        return JSON.parse(r)
  }

  async addCustomCUI(cui,description,isMSH) {

    var urlQueryRequest = urlBase + "cuisIndexAdd?cui="+encodeURIComponent(cui)+"&preferred="+encodeURIComponent(description)+"&hasMSH="+(isMSH ? true : false)

    var r = await this.getGeneric( urlQueryRequest  )

    return r

  }


  async getClusterData() {

        var urlQueryRequest = urlBase + "getClusterData"
        var r = await this.getGeneric( urlQueryRequest  )

        return JSON.parse(r).rows
  }

  async setClusterData(cdata) {
        var urlQueryRequest = urlBase + "setClusterData?cn="+cdata.cn
                                      + "&rep_cuis="+cdata.rep_cuis.join(";")
                                      + "&excluded_cuis="+cdata.excluded_cuis.join(";")
                                      + "&status="+cdata.status

        console.log(urlQueryRequest)
        var r = await this.getGeneric( urlQueryRequest )

        return r
  }




  async getAllMetadata() {

        var urlQueryRequest = urlBase+ "allMetadata"

        var r = await this.getGeneric( urlQueryRequest  )

        //debugger
        return JSON.parse(r).rows

  }



  async getAllClusters() {

        var urlQueryRequest = urlBase+ "allClusters"

        var r = await this.getGeneric( urlQueryRequest  )

        return JSON.parse(r).rows

  }

  async saveClusterAnnotation(cn,concept,cuis,isdefault,cn_override) {

    var urlQueryRequest = urlBase+ "recordClusterAnnotation?cn="+cn+"&concept="+encodeURIComponent(concept)+"&cuis="+encodeURIComponent(cuis)+"&isdefault="+encodeURIComponent(isdefault)+"&cn_override="+cn_override //;recordClusterAnnotation?docid="+encodeURIComponent(docid)+"&page="+page+"&user="+user+"&annotation="+encodeURIComponent(JSON.stringify(annotation))+"&corrupted="+ (corrupted == undefined ? false : corrupted)+"&tableType="+tableType + "&corrupted_text=" + corrupted_text

    console.log(urlQueryRequest)

    var r = await this.getGeneric( urlQueryRequest  )

    return r

  }

  async getAllAnnotations() {

        var urlQueryRequest = urlBase+ "getAnnotations"

        var r = await this.getGeneric( urlQueryRequest  )

        return r

  }


  async getAllClusterAnnotations() {

        var urlQueryRequest = urlBase+ "allClusterAnnotations"

        var r = await this.getGeneric( urlQueryRequest  )

        return r

  }


  async getAllAvailableTables() {

        var urlQueryRequest = urlBase + "getAvailableTables"

        var r = await this.getGeneric( urlQueryRequest  )

        return r

  }

  async getMMatch(phrase) {

    var urlQueryRequest = urlBase + "getMMatch?phrase="+encodeURIComponent(phrase)

    var r = await this.getGeneric( urlQueryRequest  )


    try{
      r = JSON.parse(r)
      r = r.AllDocuments[0].Document.Utterances.map(
                      utterances => utterances.Phrases.map(
                        phrases => phrases.Mappings.map(
                          mappings => mappings.MappingCandidates.map(
                            candidate => ({
                                      CUI:candidate.CandidateCUI,
                                      matchedText: candidate.CandidateMatched,
                                      preferred: candidate.CandidatePreferred,
                                      hasMSH: candidate.Sources.indexOf("MSH") > -1
                                   })
                                 )
                               )
                             )
                           )[0][0].flat()

      // This removes duplicate cuis
      r = r.reduce( (acc,el) => {if ( acc.cuis.indexOf(el.CUI) < 0 ){acc.cuis.push(el.CUI); acc.data.push(el)}; return acc }, {cuis: [], data: []} ).data
    } catch (e){

      return []
    }

    return r

  }
}
