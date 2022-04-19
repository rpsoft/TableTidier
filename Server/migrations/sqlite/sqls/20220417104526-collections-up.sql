-- CREATE TABLE

CREATE TABLE IF NOT EXISTS collection
(
  collection_id bigint,
  title character varying,
  description character varying,
  owner_username character varying,
  visibility character varying,
  completion character varying,
  CONSTRAINT collection_pkey PRIMARY KEY (collection_id)
);

-- ADD INFO

INSERT INTO
  collection 
  (collection_id, title, description, owner_username, visibility, completion)
VALUES
  (
    1,
    'This is the first collection, testing collection',
    'The testing collection',
    'james@example.com',
    'public',
    'in progress'
  );
