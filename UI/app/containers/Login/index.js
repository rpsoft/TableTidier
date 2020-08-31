/**
 *
 * Login
 *
 */

import React, { useEffect, memo, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Helmet } from 'react-helmet';
import { FormattedMessage } from 'react-intl';
import { createStructuredSelector } from 'reselect';
import { compose } from 'redux';
import { useInjectSaga } from 'utils/injectSaga';
import { useInjectReducer } from 'utils/injectReducer';
import { makeSelectLogin, makeLoginSelector } from './selectors';
import reducer from './reducer';
import saga from './saga';
import messages from './messages';

import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card'
import Popover from '@material-ui/core/Popover';
import Home from '@material-ui/icons/Home';

import {loginAction, loginSuccessAction, loginFailedAction, doLoginAction, doLogOutAction} from './actions'
import { push } from 'connected-react-router';

import { useCookies } from 'react-cookie';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import { useDispatch, useSelector } from "react-redux";

export function Login({
  token,
  doLogin,
  doLogOut,
  goTo,
  loginState,
}) {
  const [cookies, setCookie, removeCookie ] = useCookies();

  const [username, setUsername] = useState(cookies.username ? cookies.username :  "" );
  const [password, setPassword] = useState("");

  const [loginWarning, setLoginWarning] = useState("");
  // const loginWarning = useSelector(state => state.loginWarning);

  const [isLoginShown, toggleLogin] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleLoginToggle = (event) => {
    if( isLoginShown ){
      toggleLogin(false)
      setAnchorEl(null);
    } else {
      toggleLogin(true);
      setAnchorEl(event.currentTarget);
    }
  }

  const logIn = () =>{
    if ( username && username != undefined && password && password != undefined  ){
      doLogin(username, password)
    }
  }

  const logOut = () => {
    removeCookie("hash");
    removeCookie("username");
    setUsername("");
    setPassword("");
    doLogOut();
  }

  const onKeyDown = (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        doLogin(username, password);
      }
  }

  useEffect(() => {
    // If authentication token is available and it's different from the cookie token it will be set in the cookies.
    if ( token ){
      setCookie("hash", token) // 86400 seconds in a day. Login will expire after a day.
      setCookie("username", username)
    }
  }, [token]);

  useEffect(() => {
    document.title = Date.now();
  });

  useInjectReducer({ key: 'login', reducer });
  useInjectSaga({ key: 'login', saga });

  var isLoggedIn = cookies.hash ? true : false;

  console.log(username +" -- " + token)

  return (
    <div style={{width:"100%"}}>
      <Helmet>
        <title>Login</title>
        <meta name="description" content="Description of Login" />
      </Helmet>

      <Card style={{padding:5}}>

        <Home style={{float:"left",height:45,width:45, cursor:"pointer", marginRight:15}} onClick={() => goTo('/')}/>
        <h2 style={{float:"left",margin:0, marginTop:10}}>TableTidier <div style={{color:"red",display:"inline-block",fontSize:15}}>(beta)</div></h2>

        <div style={{display:"inline-block",float:"right",marginTop:5}} >
          <Button variant="contained" onClick={ handleLoginToggle }style={{marginLeft:5}}><AccountBoxIcon/> {cookies.username ? "Logged as: "+ cookies.username : " guest "}</Button>
        </div>


        <Popover
        id={"loginDropDown"}
        open={isLoginShown}
        anchorEl={anchorEl}
        onClose={ handleLoginToggle }
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        >
          <div style={{padding:10, maxWidth:300}}>
            <TextField
              id="username"
              value={username}
              placeholder="Username"
              onChange={ (evt) => {setUsername(evt.currentTarget.value)} }
              onKeyDown ={onKeyDown}
              />
              <br />

            <TextField
              id="password"
              value={password}
              placeholder="Password"
              type="password"
              onChange={ (evt) => {setPassword(evt.currentTarget.value)} }
              onKeyDown ={onKeyDown}
              />

            { loginWarning ? <div style={{color:"red",marginTop:5,marginBottom:5}}> {loginWarning} </div> : <br /> }

            <div style={{marginTop:10,textAlign:"right"}}>
              <Button variant="contained" onClick={ () => { logIn() } } style={{backgroundColor:"#93de85"}} > Login </Button>
              <Button disabled={!isLoggedIn} variant="contained" onClick={ () => { logOut() } } style={{marginLeft:5, backgroundColor:"#f98989"}}>Logout</Button>
            </div>
          </div>
        </Popover>
      </Card>
    </div>
  );
}

// <FormattedMessage {...messages.header} />

Login.propTypes = {
  // dispatch: PropTypes.func.isRequired,
  token : PropTypes.string,
  doLogin : PropTypes.func,
  doLogOut : PropTypes.func,
  goTo : PropTypes.func,
};

const mapStateToProps = createStructuredSelector({
  token: makeLoginSelector(),
  loginState: makeSelectLogin(),
});

const mapDispatchToProps = (dispatch) => {
  return {
    doLogin : (username,password) => dispatch( doLoginAction(username,password) ),
    doLogOut : () => dispatch(doLogOutAction()),
    goTo : (path) => dispatch(push(path)),
  };
}

const withConnect = connect(
  mapStateToProps,
  mapDispatchToProps,
);

export default compose(withConnect)(Login);
