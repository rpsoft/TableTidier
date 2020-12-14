/*
 * HomePage
 *
 * This is the first thing users see of our App, at the '/' route
 *
 */

import React from 'react';
import { FormattedMessage } from 'react-intl';
import messages from './messages';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { push } from 'connected-react-router'

import {
  Card, Checkbox,
  Select as SelectField,
  Input as TextField,
  Button,
  Paper,
  Switch,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Select,
  MenuItem,
  FormHelperText,
  FormControl,
  InputLabel,
  Popover,
} from '@material-ui/core';

import { createStructuredSelector } from 'reselect';
import { compose } from 'redux';

import { useInjectSaga } from 'utils/injectSaga';
import { useInjectReducer } from 'utils/injectReducer';

export function HomePage({
  goToUrl
}) {
  return (<div style={{marginLeft:"2%", marginRight:"2%", minHeight: "84vh"}}>
    <Helmet>
      <title>TableTidier</title>
      <meta name="description" content="TableTidier" />
    </Helmet>
    <Card style={{marginTop:20,padding:10,paddingLeft:40,paddingRight:40,height:"100%",minHeight:"80vh"}}>
      <h2 style={{fontSize:35}}> Welcome to TableTidier! </h2>


      <div style={{width:"100%"}}>
          <Button style={{backgroundColor:"#d8d7ff",padding:20, fontSize:25}} size="large" fullWidth={true} onClick={ () => {goToUrl("/dashboard")}}> Access Annotation Dashboard </Button>
          </div>


      <h4 style={{marginLeft:15}}>
          If you haven't done so already: <Button style={{backgroundColor:"#c3efbb"}} onClick={ () => {goToUrl("/register")}}> Register Here </Button>
          </h4>

      <div style={{paddingRight:300}}>
      <div>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. In id lorem non lectus porta iaculis nec eget lectus. Nunc mi leo, tincidunt malesuada turpis eget, faucibus volutpat elit. Nunc ligula nisi, volutpat a purus vitae, convallis interdum nisl. Vivamus aliquet auctor erat non tempor. Praesent vitae enim varius, tristique lacus ut, pulvinar arcu. Aliquam fermentum ante sit amet urna iaculis consectetur. Donec fermentum justo urna, dictum faucibus nisi aliquam sed. Proin porttitor lorem vitae purus consequat posuere. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.
      </div>

      <div style={{marginTop:20}}>
        Morbi luctus nulla et placerat sagittis. Pellentesque dui enim, tristique eget tristique in, ullamcorper sit amet mi. Praesent et lectus odio. Praesent a eleifend sapien. Ut id aliquet purus. Nam dictum ex id vestibulum pretium. Nunc porttitor est et nisl varius, congue lobortis tellus fermentum. Curabitur vel tincidunt ligula. Cras congue magna leo, et viverra velit ornare eu. Mauris dui nisl, suscipit vel metus nec, feugiat maximus nibh. Etiam vel scelerisque lorem, id porta leo. Etiam cursus faucibus nunc, sit amet ultrices metus. Duis sit amet cursus diam. Mauris feugiat dictum rutrum. Fusce aliquet condimentum massa at scelerisque.

        Ut odio justo, placerat vitae sapien sit amet, malesuada pellentesque nunc. Vestibulum odio leo, mollis eu maximus id, luctus in mauris. Duis venenatis lorem nulla, non vehicula diam condimentum at. Morbi eros dui, sollicitudin nec rutrum faucibus, cursus efficitur elit. Morbi suscipit quam in orci congue, non imperdiet tortor dapibus. Cras posuere fringilla magna, vel tincidunt risus congue in. Nam et tellus ut velit iaculis dignissim vel in turpis. Nam lacinia pulvinar iaculis. Aenean aliquet placerat convallis.

        Duis in volutpat nulla. Phasellus cursus semper gravida. Cras sagittis nunc lacus, in tristique lorem fringilla nec. Praesent non tempor ipsum. Vestibulum et efficitur mauris, et tempus nunc. Quisque molestie auctor aliquet. Aliquam aliquet lectus sapien, ac accumsan metus malesuada malesuada. Ut id enim luctus, lobortis nunc sit amet, imperdiet magna. Duis nibh sem, imperdiet nec leo blandit, imperdiet congue justo. Vivamus sit amet purus sed magna blandit condimentum. Ut hendrerit est in tristique placerat. Praesent volutpat velit enim, ullamcorper feugiat ante placerat ut. Ut non odio nec augue venenatis consectetur. Ut vel sem justo. Donec magna nunc, tristique vitae urna id, malesuada condimentum enim.

        Mauris nec dui arcu. Nam dapibus aliquam tellus, vitae euismod sapien gravida vitae. Curabitur et tortor at orci luctus tristique laoreet vel lorem. Sed velit magna, dapibus nec porta in, faucibus id quam. In tempor pellentesque magna, sed elementum dui. Nullam in lectus imperdiet, dignissim velit sed, auctor dui. Cras ac arcu cursus, aliquam dolor eget, aliquet nisl. Etiam non diam risus. Quisque consequat libero neque, nec molestie lorem tincidunt sit amet. Mauris hendrerit dapibus sapien, eu convallis libero rhoncus vitae. Sed luctus nisl risus, a blandit neque cursus faucibus. Morbi posuere ipsum et tempor tempor. Integer vel risus purus. Mauris id enim sagittis,
      </div>
      </div>
    </Card>
    </div>
  );
}


HomePage.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

const mapStateToProps = createStructuredSelector({
  // dashboard: makeSelectDashboard(),
});

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    goToUrl : (url) => dispatch(push(url)),
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(withConnect)(HomePage);
