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
  Link as LinkReactRouter,
} from 'react-router-dom';

import {
  Card,
  // Button,
  Link,
} from '@material-ui/core';

import {
  useTheme,
} from '@material-ui/core/styles';

export function Documentation(props) {
  const theme = useTheme();

  return (
    <div
    style={{
      marginLeft:"auto",
      marginRight:"auto",
      minHeight: "84vh",
      // minWidth: theme.sizes.minWidth,
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
      // height: "80vh",
      textAlign: "justify",
      // columnCount: 2,
      // columnWidth: 500,
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(50px, 550px))',
      gridTemplateRows: 'auto auto',
      columnGap: 50,
    }}>
      <div
        style={{
          maxWidth: 560,
        }}
      >
        <h3>Overview</h3>
        <p className='doc indent'>
          TableTidier is designed to convert variously (and sometimes idiosyncratically)
          structured tables with non-standard terminologies into standard formats.
          The purpose is to make it easier for these data to be more easily discovered and analysed
          (eg in a meta-analysis or meta-regression).

          It is our hope that there will be a crowdsourcing aspect to TableTidier;
          when a table has been tidied it will be made visible to all secondary researchers
          so the work of data extraction need not be duplicated.
        </p>
        <p className='doc indent'>
          The features in this version of TableTidier will always remain free
          provided the user is willing for the tidied tables to be made publicly available
          (if essential this can be after an embargo period).

          We may introduce paid features in the future such as permanently private collections
          or other tools designed to aid large teams working on data extraction.
        </p>
        <div className='doc indent'>
          We have created a number of videos to orientate users to TableTidier,
          but do please get in touch if you have any questions
          &nbsp;
          <address
            style={{
              display: 'inline',
              color: 'darkblue',
            }}
          >
            tabletidier@glasgow.ac.uk
          </address>
        </div>
        <br/>
        <blockquote className='quote-warn'>
          Warning. TableTidier is currently in beta, so we advise frequently downloading
          any work done using the tool.
        </blockquote>

      </div>

      {/* Videos */}
      <div
        style={{
          breakInside: 'avoid',
          maxWidth: 560,
        }}
      >
        <h3>
          Videos
        </h3>

        Link to {
        <LinkReactRouter
          className='
            MuiLink-underlineHover
            MuiTypography-root
            MuiLink-root
            MuiLink-underlineHover
            MuiTypography-colorPrimary
          '
          to="/videos"
        >
          Videos
        </LinkReactRouter>}

        <p className='doc indent'>
        IF YOU ARE INTERESTED IN GETTING AN UNDERSTANDING OF WHAT TABLETIDIER DOES
        BEFORE DECIDING WHETHER OR NOT YOU WANT TO USE IT, PLEASE START WITH VIDEOS:
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
      </div>
      <div
        style={{
          // breakInside: 'avoid',
          maxWidth: 560,
        }}
      >
        <h3>Additional details on TableTidier</h3>

        <p className='doc indent'>
          TableTidier uses a classifier (a support vector machine) to categorise each non-data cell in an uploaded table. TableTidier then employs a voting algorithm to assign an overall category to all cells identified as being related via the formatting and/or table structure. The classifier was developed on 68525 concepts extracted from 828 tables. 30% of the tables were reserved for testing, in which there was an average overall precision and recall of 78% and 67% respectively, with higher performance (81% precision and 87% recall) for the most common categories. After human review, and where necessary modification, TableTidier uses these assignments to convert tables into a standard format.
        </p>
        <p className='doc indent'>
          Additionally TableTidier leverages MetaMap ({
          <Link
            href='https://metamap.nlm.nih.gov/'
            underline="hover"
            target="_blank"
          >metamap.nlm.nih.gov</Link>
          }) to map non-data cells to UMLS concepts and standard ontologies (eg MeSH). These mappings can be reviewed by users before replacing the original terms in the converted table. TableTidier is thus a tool that converts idiosyncratic tabular data into more standardised data. Not all UMLS source dictionaries are available via TableTidier due to copyright restrictions (see
          &nbsp;
          <Link
            href='https://www.nlm.nih.gov/research/umls/sourcereleasedocs/index.html'
            underline="hover"
            target="_blank"
          >https://www.nlm.nih.gov/research/umls/sourcereleasedocs/index.html</Link>
          &nbsp;
          for list of sources. Only sources with restriction levels 0 and 1 are included).
        </p>
      </div>
      <div
        style={{
          // breakInside: 'avoid',
          maxWidth: 560,
        }}
      >
        <h4>Expected performance</h4>

        <p className='doc indent'>
        While developed in the context of clinical trials, TableTidier can be useful across disciplines. We expect it to perform well out-of-the-box for tables related to pharmaco-, chronic-disease- and social epidemiology. Moreover, as users upload and review converted tables, our classifier will utilise reinforced learning to adapt to unfamiliar terminologies (e.g. in environmental epidemiology).
        </p>
        <p className='doc indent'>
        Therefore, we expect TableTidier to be useful to users working across several fields, and especially useful to those conducting large-scale secondary research, such as large ambitious projects accessing significant quantities of data from diverse sources.
        </p>
        <p className='doc indent'>
        TableTidier may also be used by authors. If alongside idiosyncratically formatted “main manuscript” tables authors produced standard versions for depositing/supplementary appendices (eg “Machine readable Table 1” alongside “Table 1 Baseline Characteristics”), research reporting would be more open. TableTidier can help authors produce more open tables more easily.
        </p>
      </div>
      <div
        style={{
          // breakInside: 'avoid',
          maxWidth: 560,
          // Testing uncoment under code to make this element the first of the list
          // gridRow: 1,
          // gridColumn: 1,
        }}
      >
        <h3>Example project</h3>

        <p className='doc indent'>
        We have used TableTidier for a number of projects. Below is an example of a protocol for using  TableTidier to extract trial baseline characteristics as part of a  large systematic review.
        </p>
        Link to protocol {
        <Link
          href='https://bmjopen.bmj.com/content/12/10/e066491'
          underline="hover"
          target="_blank"
        >https://bmjopen.bmj.com/content/12/10/e066491</Link>}
        <ol
          style={{
            paddingLeft: 18,
            lineHeight: '25px',
          }}
          className='doc'
        >
          <li>Login to tabletidier.org</li>
          <li>Enter desired collection (collection 115 for SGLT2i, collection 116 for GLP1ra, collection 117 for dpp4i)</li>
          <li>Upload desired tables (as needed) and use trial id as file name- use html of published paper/supplementary appendix/study document than contains the baseline characteristic table for that trial (if issue getting html version, let EB know and we can use ABBYY to convert pdf to html)
          <blockquote className='quote-warn'>
          Some tables will not upload e.g if tables are images. Keep note of these and likely will extract manually at the end.
          </blockquote>
          </li>
          
          <li>Check over table contents- any data needing clarified, spaces missing etc</li>
          <li>If need to clarify contents look back to original pdf. Please see diab_nma_pdfs folder on Onedrive as too big for github</li>
          <li>Use "edit table" as necessary to add rows for clarification/ fix text etc</li>
          <li>Remember to ensure separate row for n inserted (often included with arm label)</li>
          <li>Save any changes</li>
          <li>Select table type: baseline and save</li>
          <li>
            Table structure:
            <ol
              style={{
                listStyle: 'lower-roman',
                paddingLeft: 18,
              }}
            >
              <li>Click auto annotate</li>
              <li>Adjust as necessary to ensure each data point correctly annotated</li>
              <li>Empty rows can be helpful to separate concepts </li>
              <li>Click save annotation changes</li>
              <li>Refresh data</li>
            </ol>
          </li>
          <li>Check over structured data</li>
          <li>
            Terminology:
            <ol
              style={{
                listStyle: 'lower-roman',
                paddingLeft: 18,
              }}
            >
              <li>Click auto label</li>
              <li>Check over labels, select correct and deselect incorrect labels as required</li>
              <li>Find chosen terms in the table_tidier_chosen_terms.csv</li>
              <li>If required label not on this list lave unlabelled and let EB know</li>
              <li>If arm level data ensure separate row for n for each arm</li>
              <li>Focus on labelling variables required for model covariates: age, duration of diabetes, sex, BMI, body weight, race, ethnic group, systolic blood pressure, diastolic blood pressure, smoking status, history of cardiovascular disease (or individual diseases e.g. myocardial infarction, stroke, peripheral vascular disease), history of heart failure, current antidiabetic agent use at baseline, HbA1c, eGFR, total cholesterol and HDL cholesterol. Some of these terms could be assigned to more than one concept ID (CUI). Please see the lookup table for preferred concept CUIs for this project.</li>
              <li>Other less common variables can be left unlabelled at this stage</li>
              <li>Where possible please capture units in chosen labels (especially HbA1c % or mmol/mol)</li>
              <li>
                Where possible please capture type of measurement
                <ol
                  style={{
                    listStyle: 'lower-latin',
                    paddingLeft: 18,
                  }}
                >
                  <li>If Mean (sd) label as "sample mean". Unless the dispersion statistic is something other than SD, no need to specifically label this.</li>
                  <li>If Median (IQR) label as "sample median".  measurement</li>
                  <li>If Mean (sd) label as "sample mean". Unless the dispersion statistic is something other than IQR, no need to specifically label this.</li>
                  <li>If n (%), label as "count" and "amount-type percentage"" as variable as to whether n and % given alone or together</li>
                </ol>
              </li>
              <li>Ensure save metadata changes is clicked before moving on to the next table</li>
            </ol>
          </li>
        </ol>
      </div>
    </Card>
  </div>
  );
}

export default Documentation;
