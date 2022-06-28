/**
 *
 * SearchTableItem
 *
 */

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
  score,
  // link to table
  linkUrl,
  data,
  onClick,
}) {
  return (
    <div
      className="search_info"
    >
      <Link
        to={linkUrl}
      >
      { text }
      </Link>

      <span> DOI </span>
      <span> PMID </span>
      <span> url </span>
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
 