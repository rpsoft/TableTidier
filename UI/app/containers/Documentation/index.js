/**
 *
 * Documentation.js
 *
 */

import './documentation.css';

import React, {
  // useEffect, memo, useState, useRef
} from 'react';
import { Helmet } from 'react-helmet';
import {
  Card,
  // Button,
  Link,
} from '@material-ui/core';

import {
  useTheme,
} from '@material-ui/core/styles';

const VideoDescription = ({title, summary, linkHref, linkText}) => <>
  {title}
  <div className='video-description'>
    <p>{summary}</p>
    <span>
      <Link
        href={linkHref}
        underline="hover"
        target="_blank"
      > {linkText}</Link>
    </span>
  </div>
</>

export function Documentation(props) {
  const theme = useTheme();

  return (
    <div
    style={{
      marginLeft:"auto",
      marginRight:"auto",
      minHeight: "84vh",
      minWidth: theme.sizes.minWidth,
      maxWidth: theme.sizes.maxWidth,
    }}
  >
    <Helmet>
      <title>TableTidier</title>
      <meta name="description" content="TableTidier" />
    </Helmet>
    <Card style={{
      marginTop: 20,
      padding: 20,
      paddingLeft: 70,
      paddingRight: 70,
      height: "80vh",
      textAlign: "justify",
    }}>
      <h3>Overview</h3>
      Welcome to TableTidier documentation.

      <h4 style={{
        // marginLeft:15
      }}>
        Videos
      </h4>
      Learn about TableTidier:

      <ul>
        <li>
          <VideoDescription
            title='TableTidier collections'
            summary='Shows how TableTidier handles collections of tables.'
            linkText='https://vimeo.com/764948522'
            linkHref='https://vimeo.com/764948522'
          />
        </li>
        <li>
          <VideoDescription
            title='Uploading tables'
            summary='Shows how to upload tables to tabletidier.'
            linkText='https://vimeo.com/764945663'
            linkHref='https://vimeo.com/764945663'
          />
        </li>
        <li>
          <VideoDescription
            title='Overview of the table window'
            summary='It gives an overview to help navigate the table window.'
            linkText='https://vimeo.com/764949695'
            linkHref='https://vimeo.com/764949695'
          />
        </li>
        <li>
          <VideoDescription
            title='Using TableTidier to tidy tables to a standard format'
            summary='Illustrates how to use TableTidier to standardize the structure of a table.'
            linkText='https://vimeo.com/764934913'
            linkHref='https://vimeo.com/764934913'
          />
        </li>
        <li>
          <VideoDescription
            title='Using TableTidier to apply standard terminologies to tidied tables'
            summary='Describes how to use TableTidier to apply standard terminology.'
            linkText='https://vimeo.com/764941242'
            linkHref='https://vimeo.com/764941242'
          />
        </li>
        <li>
          <VideoDescription
            title='Exporting tidied tables and terminologies from TableTidier'
            summary='Demonstrates how to get data out of TableTidier.'
            linkText='https://vimeo.com/764944458'
            linkHref='https://vimeo.com/764944458'
          />
        </li>
      </ul>
    </Card>
  </div>
  );
}

export default Documentation;
