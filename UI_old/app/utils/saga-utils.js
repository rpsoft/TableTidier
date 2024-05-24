// function that checks if status is unauthorised, not found, etc
export const fetchResultStatusCheck = (status) => {
  const returnCode = (code) => ({error: true, code})
  if ( status ) {
    if (status == 'unauthorised') {
      // // Send message unauthorised
      // yield put( yield issueAlertAction({
      //   open: true,
      //   message: 'Unauthorised, you are trying to access a private content',
      //   isError: true
      // }))
      // yield put( yield updateCollectionAction({title : "", collection_id : "", description: "", owner_username : "", collectionsList : []}) );
      //yield put(push('/dashboard'));
      return returnCode('Unauthorised')
    }
    if (status == 'not found') {
      return returnCode('not found')
    }
    if (status == 'collection not found') {
      return returnCode('collection not found')
    }
    if (status == 'fail') {
      console.log(status)
    }
  }
  return {error: false, code: ''}
}