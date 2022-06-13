/**
 *
 * Footer
 *
 */

import React from 'react';
// import PropTypes from 'prop-types';
// import styled from 'styled-components';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

import Card from '@material-ui/core/Card'

function Footer() {
  return (
    <footer
      style={{
        padding:20,
        borderTop: '#8e8e8e 2px solid',
        backgroundColor: 'rgb(244, 244, 244)',
      }}
    >
      <div>
        University of Glasgow 2020 - MVLS - Public Health
      </div>
    </footer>
  );
}

Footer.propTypes = {};

export default Footer;
