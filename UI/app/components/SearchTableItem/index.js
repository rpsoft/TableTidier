/**
 *
 * SearchTableItem
 *
 */
 import './SearchTableItem.css';

import React from 'react';
// import PropTypes from 'prop-types';

import {
  Link,
} from "react-router-dom";

import { FormattedMessage } from 'react-intl';
import messages from './messages';

function SearchTableItem({
  text,
  type,
  // search content
  //   used to mark search words
  searchContent,
  // info about search
  selectedChunks,
  info,
  score,
  // link to table
  linkUrl,
  data,
  onClick,
}) {

  // if searchContent includes input word then add bold markup to the word 
  const boldIfNamed = (metadataItem) => (<span className="SearchTableItemMetadata">{
    searchContent.reduce(
      (prev, searchItem) => metadataItem.includes(searchItem) || prev, false) ?
      (<b>{metadataItem + ' '}</b>)
      : metadataItem
  }</span>)
  
  const MetadataItem = (props) => (
    <div className="SearchTableItemMetadataHeader">{props.children}</div>
  )

  return (
    <div
      className="search_info"
    >
      <Link
        to={linkUrl}
      >
      { text }
      </Link>

      <div
        className="SearchTableItemMetadataContainer"
      >
        {info.doi && <MetadataItem> DOI {boldIfNamed(info.doi)}</MetadataItem>}
        {info.pmid && <MetadataItem> PMID {boldIfNamed(info.pmid)}</MetadataItem>}
        {info.url && <MetadataItem> Url {boldIfNamed(info.url)}</MetadataItem>}
      </div>

      {
        score && (
        <div
          className="search_summary"
        >
          {selectedChunks.map((searchSummaryLine, index) => (
            <p
              key={index}
            >
            {
              // present summary and highlight search words
              searchSummaryLine.map((word, idx) => searchContent.includes(word) ?
                <b key={idx}>{word + ' '}</b>
                : word + ' ')
            }
            </p>))
          }
        </div>
        )
      }
    </div>
  );
 }
 
 SearchTableItem.propTypes = {};
 
 export default SearchTableItem;
 