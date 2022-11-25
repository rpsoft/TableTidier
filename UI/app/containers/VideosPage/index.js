/**
 *
 * VideosPage.js
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

const VideoDescription = ({id, title, summary, linkHref, linkText}) => (
<div
  id={id}
  style={{
    paddingBottom: 10,
  }}
>
  <span>
    <Link
      href={linkHref}
      underline="hover"
      target="_blank"
    >{title}</Link>
  </span>
  <div className='video-description'>
    <p>{summary}</p>
  </div>
</div>)

export function VideosPage(props) {
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
      marginTop: 10,
      padding: 20,
      paddingLeft: 70,
      paddingRight: 70,
      height: "80vh",
      textAlign: "justify",
    }}>
      <div
        style={{
          breakInside: 'avoid',
          maxWidth: 560,
          overflowY: 'auto',
          gridRow: '1 / 3',
          gridColumn: '2',
        }}
      >
        <h3>
          Videos
        </h3>

        <p className='doc indent'>
        IF YOU ARE INTERESTED IN GETTING AN UNDERSTANDING OF WHAT TABLETIDIER DOES, PLEASE START WITH VIDEOS:
        </p>

        <p>
          <Link
            href='https://vimeo.com/764934913'
            underline="hover"
            target="_blank"
          >“Using TableTidier to tidy tables to a standard format”</Link>
        </p>

        <p>
          <Link
            href='https://vimeo.com/764941242'
            underline="hover"
            target="_blank"
          >“Using TableTidier to apply standard terminologies to tidied tables”</Link>
        </p>
        <br/>
        Learn about TableTidier:

        <ul
          style={{
            listStyle: 'circle',
          }}
        >
          <li>
            <VideoDescription
              id='TableTidier-collections'
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
          <li>
            <VideoDescription
              title='Working with exported tables in R'
              summary='Illustrates a typical analysis of exported tables within statistical software (in this case R).'
              linkText='https://vimeo.com/user85112460'
              linkHref='https://vimeo.com/user85112460'
            />
          </li>

        </ul>
      </div>
    </Card>
  </div>
  );
}

export default VideosPage;
