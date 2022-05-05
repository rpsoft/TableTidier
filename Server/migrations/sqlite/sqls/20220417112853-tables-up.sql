-- CREATE TABLE
CREATE TABLE IF NOT EXISTS "table"
(
  docid character varying,
  page integer,
  "user" text,
  notes text,
  collection_id bigint,
  file_path character varying,
  "tableType" text,
  tid bigint NOT NULL,
  completion character varying,
  CONSTRAINT table_pkey PRIMARY KEY (tid)
);

-- ADD INFO
INSERT INTO
  "table" 
  (docid, page, "user", notes, collection_id, file_path, "tableType", tid, completion)
VALUES
  (
    '28905478',
    1,
    'lili@example.com',
    'some testing note',
    1,
    '28905478_1.html',
    'result_table_subgroup',
    1,
    '28905478'
  ),
  (
    '28905478',
    2,
    'lili@example.com',
    '',
    1,
    '28905478_2.html',
    'result_table_subgroup',
    2,
    '28905478'
  ),
  (
    '28905478',
    3,
    'lili@example.com',
    '',
    1,
    '28905478_3.html',
    'result_table_subgroup',
    3,
    '28905478'
  );
