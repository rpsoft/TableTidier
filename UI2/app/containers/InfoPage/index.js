/**
 * InfoPage
 *
 * Informative Page
 * Ex: Authorization, etc
 *
 */

import React from 'react';

import { FormattedMessage } from 'react-intl';
import messages from './messages';
import { Helmet } from 'react-helmet';

import {
  useNavigate,
} from "react-router-dom";

import NavigationBar from 'components/NavigationBar'

import {
  Card,
  Button,
} from '@material-ui/core'

import { useTheme } from '@material-ui/core/styles';

import ArrowBackIcon from '@material-ui/icons/ArrowBack';

export default function InfoPage(props) {

  const {
    // Html Title and Description
    title='Info',
    titleDescription='',
    // Info Headers
    headerIcon=null,
    headerText='',
    // Info
    text=null,
  } = props

  let navigate = useNavigate();
  const theme = useTheme();

  return (
    <div
    style={{
      marginLeft: 'auto',
      marginRight: 'auto',
      minWidth: theme.sizes.minWidth,
      maxWidth: theme.sizes.maxWidth,
      // minHeight: '84vh',
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gridTemplateRows: 'auto',
    }}
  >
    <Helmet>
      <title>TableTidier - {title}</title>
      <meta name="description" content="Description of Annotations" />
    </Helmet>
    <Card
      style={{
        margin: 5,
        padding: 15,
        paddingTop: 35,
        maxWidth: parseInt(theme.sizes.maxWidth) - 250,
        textAlign: 'center',
      }}
    >
      {headerIcon}
      <h2>
        {headerText}
      </h2>
      {text}
      <p
        style={{
          display: 'inline-flex',
        }}
      >
        <Button
          style={{textTransform: 'none'}}
          variant="outlined"
          onClick={() => {
            navigate(-1);
          }}
        >
          <ArrowBackIcon
            style={{
              marginRight: 10,
            }}
          /> Back
        </Button>
      </p>
    </Card>
    <NavigationBar />
  </div>
  );
}
